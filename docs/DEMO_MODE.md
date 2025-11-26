# Demo Mode - Save Artifacts Locally

## What is Demo Mode?

Demo mode enables automatic saving of all generated assets (images, 3D models, videos) to your local filesystem at `backend/tests/artifacts/`. This is perfect for:

- 🎨 **Presentations & Demos** - Build a portfolio of generated products
- 🐛 **Debugging** - Inspect generated assets when something goes wrong
- 📚 **Archiving** - Keep a local copy of all your creations
- 🧪 **Testing** - Automated tests use this same system

## Demo Mode vs Test Mode

| Feature | Demo Mode | Test Mode |
|---------|-----------|-----------|
| **Purpose** | Run regular app + save artifacts | Automated E2E testing |
| **How to run** | `./backend/start_demo_mode.sh` | `./backend/test_pipeline_manual.sh` |
| **Use case** | Generate products via UI/API normally | Scripted create/edit flows |
| **Artifacts** | Saves everything you generate | Saves only test outputs |
| **Redis** | Keeps existing data | Flushes Redis before test |
| **Interactive** | Yes - use the full app | No - scripted only |

## Quick Start

### Method 1: Demo Mode Script (Easiest)

```bash
# From project root
./backend/start_demo_mode.sh

# Frontend at: http://localhost:3000
# Backend at: http://localhost:8000
# Artifacts at: backend/tests/artifacts/
```

### Method 2: Add to .env (Persistent)

```bash
# Add to backend/.env
echo "SAVE_ARTIFACTS_LOCALLY=true" >> backend/.env

# Restart backend
docker compose -f backend/docker-compose.yml restart
```

### Method 3: One-Time Enable

```bash
# Docker
SAVE_ARTIFACTS_LOCALLY=true docker compose -f backend/docker-compose.yml up

# OR Local development
cd backend
SAVE_ARTIFACTS_LOCALLY=true uvicorn main:app --reload
```

## What Gets Saved?

When you generate a product, you'll see new folders appear in `backend/tests/artifacts/`:

### Create Flow Artifacts

```
backend/tests/artifacts/
├── gemini_create_1764130000/           # Gemini images from create
│   ├── gemini_view_1.png
│   ├── gemini_view_2.png
│   └── gemini_view_3.png
└── trellis_create_1764130030/          # Trellis 3D assets from create
    ├── model.glb                       # 3D model (main output)
    ├── trellis_color.mp4               # Color render video
    ├── trellis_normal.mp4              # Normal map video
    ├── trellis_combined.mp4            # Combined video
    ├── state.json                      # Full session state
    └── no_background/
        ├── no_bg_1.png                 # No-background renders
        ├── no_bg_2.png
        └── no_bg_3.png
```

### Edit Flow Artifacts

```
backend/tests/artifacts/
├── gemini_edit_1764130200/             # Gemini images from edit
│   └── gemini_view_1.png
└── trellis_edit_1764130230/            # Trellis 3D assets from edit
    ├── model.glb
    ├── (same structure as create)
    └── state.json
```

## Artifact Timestamps

Folders are named with Unix timestamps, so they're automatically sorted chronologically:
- `gemini_create_1764130000` → Created on Nov 26, 2025 at specific time
- Later generations will have higher numbers

## Using state.json

Each Trellis folder includes a `state.json` file with the complete session state:

```json
{
  "prompt": "build a rubix cube",
  "latest_instruction": "lets make the colors only purple and white",
  "mode": "edit",
  "status": "complete",
  "iterations": [
    {
      "id": "iter_1764129641725",
      "type": "create",
      "prompt": "build a rubix cube",
      "trellis_output": {
        "model_file": "https://...",
        "color_video": "https://...",
        ...
      }
    },
    {
      "id": "iter_1764129810555",
      "type": "edit",
      "prompt": "lets make the colors only purple and white",
      ...
    }
  ]
}
```

This is useful for:
- Tracking what prompt generated what model
- Debugging generation issues
- Recreating specific generations

## Tips

1. **Clean up old artifacts** - The folder grows over time:
   ```bash
   # Remove artifacts older than 7 days
   find backend/tests/artifacts/ -type d -mtime +7 -exec rm -rf {} +
   ```

2. **Share artifacts** - All files are local, easy to share:
   ```bash
   # Zip recent artifacts
   cd backend/tests/artifacts/
   zip -r my_demo_$(date +%Y%m%d).zip gemini_* trellis_*
   ```

3. **Disable for production** - Demo mode is for dev/demo only:
   ```bash
   # Remove from .env for production
   SAVE_ARTIFACTS_LOCALLY=false  # or just remove the line
   ```

## Troubleshooting

### Artifacts not saving?

1. Check the flag is set:
   ```bash
   docker compose -f backend/docker-compose.yml exec fastapi_app env | grep SAVE_ARTIFACTS
   # Should show: SAVE_ARTIFACTS_LOCALLY=true
   ```

2. Check backend logs:
   ```bash
   docker compose -f backend/docker-compose.yml logs -f fastapi_app | grep artifact
   # Should see: "Saving X Gemini images to..." messages
   ```

3. Check folder permissions:
   ```bash
   ls -la backend/tests/
   # artifacts/ should be writable
   ```

### Where are my artifacts?

Always in `backend/tests/artifacts/` relative to project root:
```bash
cd /Users/cute/Documents/vsc/HW12
ls -lt backend/tests/artifacts/  # Most recent first
```

## Related

- **Test Mode**: See `backend/test_pipeline_manual.sh` for automated E2E testing
- **Pytest Tests**: See `backend/tests/test_product_pipeline_e2e.py` for pytest-based tests
- **Configuration**: See `backend/app/core/config.py` for all settings

