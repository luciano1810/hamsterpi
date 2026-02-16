# HamsterPi

HamsterPi is a hamster monitoring stack with Raspberry Pi Zero 2W friendly defaults:

1. Virtual odometer (speed, distance, direction, run-stop intensity)
2. Spatial analytics (heatmap, patrol path, zone dwell, escape fence)
3. Visual health check (VLM-ready scoring + image heuristics)
4. Inventory watch (water, food, hoard hotspots, gnaw wear)
5. Behavioral logging (wake/sleep, grooming, stereotypy, digging)
6. Living environment analysis (lighting, cleanliness, bedding evenness, comfort index)
7. Motion-triggered capture (record only when scene changes)

## Raspberry Pi Zero 2W Focus

Default config is tuned for 512MB memory:

- `runtime.profile: rpi_zero2w`
- low FPS and frame skipping (`process_every_nth_frame`)
- reduced analysis resolution (`analysis_scale`, `max_analysis_width/height`)
- bounded in-memory results (`max_frame_results`)
- optional VLM disabled automatically in low-memory profile

## Project Layout

```text
config/config.yaml                   # video path, VLM, runtime, motion trigger, regions
hamsterpi/config.py                  # typed config loader + save helpers
hamsterpi/pipeline.py                # low-memory real video pipeline
hamsterpi/simulator.py               # synthetic 24h telemetry
hamsterpi/main.py                    # FastAPI APIs + init-zone endpoints
hamsterpi/algorithms/*.py            # all algorithms
web/index.html                       # dashboard + init-zone modal
web/app.js                           # charts + zone-drawing logic
web/styles.css                       # UI style
```

## Quick Start

```bash
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
uvicorn hamsterpi.main:app --host 0.0.0.0 --port 8000
```

Open `http://<pi-ip>:8000`.

## Settings & Language

- Click `设置 / Settings` in the top-right toolbar.
- Built-in config editor can modify all project fields in JSON and persist to `config/config.yaml`.
- UI language is configurable in settings:
  - default: `zh-CN`
  - optional: `en-US`
- Language fields in config:
  - `frontend.default_language`
  - `frontend.available_languages`

## First-Time Initialization (圈区)

1. Open dashboard and click `Initialize Zones`
2. Draw polygons for required regions:
   - `Fence Boundary`
   - `Wheel Area`
   - `Food Zone`
   - `Sand Bath Zone`
   - `Hideout Zone`
3. Double-click to close each polygon
4. Save regions to write `config/config.yaml`

APIs used:

- `GET /api/init/frame` preview frame + existing regions
- `POST /api/init/zones` persist user-defined regions and hot-reload config

## Motion Trigger

`motion_trigger` section in config controls scene-change recording:

- `min_motion_ratio`
- `start_trigger_frames`
- `stop_trigger_frames`
- `record_video`
- `output_dir`

Only motion periods are recorded/captured, reducing CPU and storage.

## Main APIs

- `GET /api/config`
- `GET /api/config/raw`
- `POST /api/config/raw`
- `GET /api/dashboard`
- `GET /api/dashboard?refresh=true`
- `POST /api/dashboard/refresh`
- `GET /api/init/frame`
- `POST /api/init/zones`
- `GET /health`

## Notes

- Synthetic dashboard works without real video.
- Real-video processing pipeline is in `hamsterpi/pipeline.py`.
- For real VLM calls, set API key env variable defined by `health.vlm.api_key_env`.
