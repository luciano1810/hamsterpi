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
hamsterpi/log_viewer.py              # FastAPI log console (port 8002)
hamsterpi/logging_system.py          # graded logging + rotating file parser
hamsterpi/algorithms/*.py            # all algorithms
web/index.html                       # dashboard + init-zone modal
web/app.js                           # charts + zone-drawing logic
web/styles.css                       # UI style
web/logs/*                           # log console web UI
```

## Quick Start

```bash
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
./scripts/run_all.sh
```

Manual mode (two terminals):

```bash
# Terminal A
uvicorn hamsterpi.main:app --host 0.0.0.0 --port 8000
# Terminal B
uvicorn hamsterpi.log_viewer:app --host 0.0.0.0 --port 8002
```

Open `http://<pi-ip>:8000`.
Open `http://<pi-ip>:8002` for log console.

## Settings & Language

- Click `设置 / Settings` in the top-right toolbar.
- Settings panel uses a left-group/right-detail layout (no raw JSON editor).
- All config groups are editable via field forms and persist to `config/config.yaml`.
- VLM API config is available under the `VLM API` group (`health.vlm`).
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
   - browser extracts and uploads the original-resolution first frame first (for zone initialization background)
   - browser compresses video locally first
   - if browser codec/path is unsupported, fallback uploads original file
   - uploads compressed video to backend
   - uploaded demo videos are retained in `app.demo_upload_dir`
   - you can select previously uploaded videos in Settings to skip compression/upload and jump to zone initialization
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
- uploaded preview source priority in uploaded-video mode:
  1. original first-frame image uploaded via `POST /api/demo/upload-preview`
  2. fallback to uploaded video frame if preview is unavailable

Note for uploaded-video demo mode:

- `POST /api/demo/upload-preview` uploads full-resolution first frame before video compression/upload
- `POST /api/demo/upload` marks uploaded video as `zone_required=true`
- `POST /api/demo/select-uploaded` selects an existing uploaded file and marks `zone_required=true`
- analysis is blocked until zones are saved once via `POST /api/init/zones`
- spatial analytics uses BEV-projected coordinates derived from fence polygon; wheel mask remains in original camera plane (not BEV transformed)

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
- `POST /api/demo/upload-preview`
- `POST /api/demo/upload`
- `POST /api/demo/select-uploaded`
- `POST /api/demo/analyze-upload`
- `GET /api/dashboard`
- `GET /api/dashboard?refresh=true`
- `POST /api/dashboard/refresh`
- `GET /api/init/frame`
- `POST /api/init/zones`
- `GET /health`

Log console APIs (`8002`):

- `GET /api/logs?levels=INFO,ERROR&q=keyword&limit=500`
- `GET /health`

## Graded Logging

- Log levels: `DEBUG`, `INFO`, `WARNING`, `ERROR`, `CRITICAL`.
- Log output is written to `logging.file_path` (default: `./logs/hamsterpi.log`).
- Rotating file is enabled via:
  - `logging.max_bytes`
  - `logging.backup_count`
- Main app (`8000`) and log console (`8002`) share the same log file.

## Notes

- Synthetic dashboard works without real video.
- Real-video processing pipeline is in `hamsterpi/pipeline.py`.
- For real VLM calls, set API key env variable defined by `health.vlm.api_key_env`.
