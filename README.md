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

## Mode Switching

- `app.run_mode`:
  - `demo` (default)
  - `real` (reserved for real camera control)
- `app.demo_source` (available when `run_mode=demo`):
  - `virtual` (use synthetic dashboard data)
  - `uploaded_video` (upload a video and run analysis)
- `app.demo_upload_dir`: uploaded demo video storage path

In UI settings, you can switch mode directly:

1. Select `Demo` + `Virtual Data` for synthetic dashboard.
2. Select `Demo` + `Uploaded Video Analysis`, then:
   - browser compresses video locally first
   - if browser codec/path is unsupported, fallback uploads original file
   - uploads compressed video to backend
   - after each new upload, initialize zones on uploaded video frame first
   - click analyze to generate dashboard
3. Select `Real` to enter reserved mode (camera integration placeholder).

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

- `GET /api/init/frame?source=auto|uploaded|config` preview frame + existing regions
- `POST /api/init/zones` persist user-defined regions and hot-reload config

Note for uploaded-video demo mode:

- `POST /api/demo/upload` marks uploaded video as `zone_required=true`
- analysis is blocked until zones are saved once via `POST /api/init/zones`

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
- `GET /api/demo/status`
- `POST /api/demo/upload`
- `POST /api/demo/analyze-upload`
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
