import os
import time

import pytest
from fastapi.testclient import TestClient

from main import app
from app.core.config import settings

RUN_PRODUCT_E2E = os.getenv("RUN_PRODUCT_E2E") == "1"
ENV_MISSING = [
    name
    for name, value in [
        ("GEMINI_API_KEY", settings.GEMINI_API_KEY),
        ("REPLICATE_API_KEY", settings.REPLICATE_API_KEY),
    ]
    if not value
]


pytestmark = pytest.mark.skipif(
    not RUN_PRODUCT_E2E or ENV_MISSING,
    reason=(
        "Set RUN_PRODUCT_E2E=1 and configure GEMINI_API_KEY/REPLICATE_API_KEY "
        "to run real create/edit integration tests"
    ),
)


@pytest.fixture(scope="module")
def api_client():
    return TestClient(app)


def _wait_for_completion(client: TestClient, timeout: int = 1200):
    deadline = time.time() + timeout
    while time.time() < deadline:
        status = client.get("/product/status").json()
        if status["status"] == "complete":
            return status
        if status["status"] == "error":
            raise AssertionError(f"Pipeline reported error: {status.get('message')}")
        time.sleep(5)
    raise TimeoutError("Timed out waiting for product pipeline to finish")


def _ensure_base_product(client: TestClient):
    state = client.get("/product").json()
    if state.get("trellis_output", {}).get("model_file"):
        return state
    client.post(
        "/product/create",
        json={
            "prompt": "matte black smart speaker with LED ring, clean studio lighting",
            "image_count": 3,
        },
    )
    _wait_for_completion(client)
    return client.get("/product").json()


def test_product_create_flow_real(api_client):
    resp = api_client.post(
        "/product/create",
        json={
            "prompt": "sleek reusable water bottle with engraved logo, hero product shot",
            "image_count": 3,
        },
    )
    assert resp.status_code == 200, resp.text

    status = _wait_for_completion(api_client)
    assert status["status"] == "complete"
    assert status.get("model_file")

    state = api_client.get("/product").json()
    assert state["trellis_output"]["model_file"]
    assert len(state["images"]) == 3


def test_product_edit_flow_real(api_client):
    _ensure_base_product(api_client)

    resp = api_client.post(
        "/product/edit",
        json={"prompt": "add brushed aluminum accent ring and neon lighting details"},
    )
    assert resp.status_code == 200, resp.text

    status = _wait_for_completion(api_client)
    assert status["status"] == "complete"
    assert status.get("model_file")

    state = api_client.get("/product").json()
    assert state["iterations"][-1]["type"] == "edit"
    assert state["trellis_output"]["model_file"]

