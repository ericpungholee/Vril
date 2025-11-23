## Viewer Rendering & Caching Strategy

This document describes how the product viewer streams 3D assets from the backend, hydrates them in the browser, and caches each iteration so reloads and rewinds feel instant. The same approach can be reused by other surfaces (e.g. packaging or future generators) to render Trellis/Gemini artifacts without touching the backend.

### 1. Backend → Redis → Frontend data flow

1. The FastAPI pipeline (`product_pipeline_service`) orchestrates Gemini → Trellis and persists the canonical state in Redis under:
   - `product:current` – full `ProductState` JSON (prompt, iterations, Trellis artifacts, timestamps, etc.)
   - `product_status:current` – lightweight status for polling progress/errors.
2. Each successful create/edit writes a new `ProductIteration` entry that captures:
   - `created_at` (used as the stable iteration id)
   - Trellis artifacts (`model_file`, `no_background_images`, etc.)
   - `duration_seconds` plus any metadata we want to surface in the UI.
3. The frontend only needs Redis; no session ids or user-specific stores are required because there is a single in-memory session per run.

### 2. Hydration & optimistic UX

1. `/product` hydrates by calling `GET /product`, then immediately:
   - Reads the latest iteration (`state.iterations.at(-1)`).
   - Pulls the remote Trellis GLB URL (`state.trellis_output.model_file`).
   - Requests a cached blob URL via `getCachedModelUrl(iterationId, remoteUrl)`.
2. While the cache helper runs, the viewer keeps the previous model mounted (no spinner). When the blob resolves, the parent simply swaps the Viewer’s `modelUrl`, producing a fade-in effect rather than a blank state.
3. `onEditStart` only toggles local UI (status card, progress bar). The actual GLB swap is deferred until the cached blob is ready, so edits “pop” in as soon as Trellis finishes.

### 3. Cache helper responsibilities (`frontend/lib/model-cache.ts`)

| Function | Purpose |
| --- | --- |
| `getCachedModelUrl(iterationId, remoteUrl)` | Checks `CacheStorage` (`product-models` namespace). If the iteration is cached, returns a blob URL immediately. Otherwise fetches the GLB, caches the `Response`, and returns a new blob URL. |
| `clearCachedModel(iterationId)` | Drops stale entries (e.g. rewinding past iterations or clearing corrupt downloads). |
| `clearAllModelCache()` | Convenience for nuking cache during local dev. |

Implementation notes:
- Cache keys are small strings (`model_glb_<created_at>`). No binary data lives in Redux/localStorage.
- Always revoke blob URLs when swapping models to avoid leaking object URLs across reloads (`URL.revokeObjectURL`).
- Fetch with `credentials: "omit"` so signed fal.ai URLs are retrieved as simple anonymous HTTP requests.

### 4. Viewer responsibilities (`frontend/components/ModelViewer.tsx`)

1. The canvas is always mounted; we never hide it with a loading overlay.
2. `<ModelLoaderWrapper>` wraps the Drei `useGLTF` hook and fades materials from opacity 0 → 1 whenever the URL changes. This gives an instant transition even if the GLB comes from the cache.
3. Any fatal load errors (e.g. corrupt blob) bubble up so the parent can clear the cache key and retry from the remote URL.
4. Orbit controls, lighting, and wireframe toggles are stateful; swapping the model does not reset camera state unless the parent tells it to.

### 5. Rewind & iteration hygiene

1. When the user rewinds to an older iteration, the chat panel calls `clearCachedModel` for every discarded iteration and hydrates the retained one via `getCachedModelUrl`.
2. The viewer receives the blob URL for the rewound iteration and renders it immediately—no network fetch.
3. Because Redis still stores every iteration’s metadata, the frontend can always reconstruct context (prompt history, durations, Trellis thumbnails) even after clearing cache entries.

### 6. Applying these patterns elsewhere

Any feature that consumes Trellis or Gemini artifacts can reuse the exact same building blocks:

- **Server contract:** Expose the artifact URL + iteration id in Redis (or any queryable store). The viewer only needs a stable string per iteration.
- **Client hydration:** Use the cache helper before swapping models or textures, keeping the previous asset mounted until the new blob resolves.
- **Blob lifecycle:** Revoke unused URLs, clear cache entries when iterations are discarded, and fall back to the remote URL if a cached blob fails to parse.
- **Status-driven UX:** Keep the UI in “live” mode (canvas, controls, previous asset) while background jobs run; only update the asset when the backend reports `complete`.

Following these guidelines keeps the rendering stack fast, deterministic, and agnostic to the specific domain (product, packaging, textures, etc.) while still leaning on Redis as the single source of truth. The cache layer lives entirely in the browser, which means hackathon-friendly performance without touching the backend infrastructure.

