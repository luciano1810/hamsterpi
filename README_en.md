[English Edition](./README_en.md) | [中文版](./README.md)

# HamsterPi

HamsterPi is a Raspberry Pi Zero 2W friendly hamster monitoring and analytics stack, with low-memory defaults, demo upload workflow, zone initialization, and multi-panel behavioral dashboards.

## Implementation Status (2026-02)

- `demo + virtual`: available (synthetic dashboard)
- `demo + uploaded_video`: available (upload video, initialize zones, auto analyze)
- `real` mode: available (CSI camera realtime monitor + loop recording)
- `Realtime` tab/page: available (demo playback / real camera stream)

## Core Capabilities

1. **Virtual odometer**: speed, distance, direction, run-stop intensity
2. **Spatial analytics**: heatmap, patrol trajectory, zone dwell, escape detection
3. **Perspective mapping (BEV)**: derive a stable fence quad and map to a rectangle plane
4. **Zone mapping preview**: before/after comparison during initialization, with real warped background
5. **Trajectory de-jitter + dwell clustering**: back-and-forth jitter near an anchor is merged
6. **Time vs Zone Dwell chart**: timeline by zone (food/sand/hideout/outside/unknown) with dwell duration
7. **Visual health checks**: heuristic vision metrics + optional VLM
8. **Featured photo + feedback loop**: auto pick best hamster frame and re-rank by good/bad feedback
9. **Inventory watch**: water level, food residue, gnaw wear
10. **Behavior and environment analytics**: schedule, grooming/digging, anxiety, lighting/cleanliness/bedding
11. **Motion-change driven analysis**: keep continuous capture and only run analysis when scene changes are detected
12. **Real-mode loop recording**: CSI stream + segmented loop recording + max-storage auto pruning, with per-frame timestamp logs

## Raspberry Pi Zero 2W Focus

Defaults are tuned for 512MB memory:

- `runtime.profile: rpi_zero2w`
- low FPS and frame skipping (`process_every_nth_frame`)
- reduced analysis resolution (`analysis_scale`, `max_analysis_width/height`)
- bounded in-memory results (`max_frame_results`)
- optional VLM auto-disabled in low-memory profile

## Project Layout

```text
config/config.yaml                   # video path, VLM, runtime, motion detection, zones
hamsterpi/config.py                  # typed config loader
hamsterpi/pipeline.py                # low-memory video pipeline (with perspective mapping)
hamsterpi/simulator.py               # synthetic 24h data generator
hamsterpi/main.py                    # FastAPI APIs + zone init/mapping preview endpoints
hamsterpi/log_viewer.py              # FastAPI log console (port 8002)
hamsterpi/logging_system.py          # leveled logging + rotating files
hamsterpi/algorithms/*.py            # core algorithms
web/index.html                       # dashboard + initialization modal
web/app.js                           # charts + upload/init/mapping preview logic
web/styles.css                       # UI styles
web/logs/*                           # log console web UI
```

## Quick Start

Recommended (auto create/activate `.venv` and install dependencies):

```bash
./run_local.sh
```

Manual:

```bash
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
./scripts/run_all.sh
```

Or run services separately:

```bash
# Terminal A: main app
uvicorn hamsterpi.main:app --host 0.0.0.0 --port 8000

# Terminal B: log viewer
uvicorn hamsterpi.log_viewer:app --host 0.0.0.0 --port 8002
```

Open:

- `http://<pi-ip>:8000` dashboard
- `http://<pi-ip>:8002` log console

## Mode Switching and Upload Flow

- `app.run_mode`
  - `demo`
  - `real` (default, real camera)
- `app.demo_source` (effective when `run_mode=demo`)
  - `virtual` (synthetic data)
  - `uploaded_video` (uploaded video analysis)

`uploaded_video` flow:

1. Upload a video (browser first tries uploading original first frame for init background; fallback is backend frame extraction)
2. Open `Initialize Zones` and finish all zone polygons
3. Click `Save Zones` and analysis is triggered automatically in demo uploaded-video mode

`real` mode notes:

1. Choose `video.real_camera_device` as `rpicam / auto / picamera2 / 0 / /dev/video0`
2. Realtime tab switches to `/api/real/live-stream`
3. Recording output directory: `video.real_record_output_dir`
4. Max recording storage: `video.real_record_max_storage_gb` (oldest segments are auto-pruned)
5. Each segment outputs:
   - `loop_*.mp4`
   - `loop_*.mp4.frames.jsonl` (frame timestamps + video timeline mapping)
   - `loop_*.mp4.meta.json` (frame-time matching stats)

## Zone Initialization and Mapping Preview

Required polygons:

- `Fence Boundary`
- `Wheel Area`
- `Food Zone`
- `Sand Bath Zone`
- `Hideout Zone`

Mapping preview behavior:

- available only in `demo` mode
- shows both camera-plane and rectangle-plane views
- "after" panel uses real perspective-warped background image (not outline-only overlay)
- includes `boundary_error` for quick acceptance checks

## Spatial Trajectory Visualization (Latest)

- Patrol trajectory is rendered in rectified plane coordinates, with axis preference on `analysis_width/analysis_height`
- Long dwell periods suppress micro jitter; oscillation near a large anchor is merged into one point
- New `Time vs Zone Dwell` chart shows where the hamster stays over time and dwell duration

## Settings and Language

- Settings panel uses left-group + right-detail editor layout
- Changes persist to `config/config.yaml`
- UI languages:
  - `zh-CN` (default)
  - `en-US`

## Main APIs

- `GET /api/config`
- `GET /api/config/raw`
- `POST /api/config/raw`
- `GET /api/demo/status`
- `POST /api/demo/upload-preview`
- `POST /api/demo/upload`
- `POST /api/demo/select-uploaded`
- `POST /api/demo/analyze-upload`
- `POST /api/demo/featured-photo/feedback`
- `GET /api/real/status`
- `GET /api/real/live-stream`
- `GET /api/dashboard`
- `GET /api/dashboard?refresh=true`
- `POST /api/dashboard/refresh`
- `GET /api/init/frame`
- `POST /api/init/mapping-preview`
- `POST /api/init/zones`
- `GET /health`

Log viewer APIs (`8002`):

- `GET /api/logs?levels=INFO,ERROR&q=keyword&limit=500`
- `GET /api/logs?levels=INFO,ERROR&q=keyword&limit=500&perf_only=true`
- `GET /health`

## Logging

- Levels: `DEBUG`, `INFO`, `WARNING`, `ERROR`, `CRITICAL`
- File: `logging.file_path` (default `./logs/hamsterpi.log`)
- Rotation: `logging.max_bytes`, `logging.backup_count`

## Notes on Current Implementation

- BEV mapping derives a stable quad from fence polygon candidates and then perspective-transforms zone polygons
- Wheel mask is kept in camera plane for motion masking and is not BEV-transformed
- `hoard_hotspots` is currently a placeholder output (empty list) in uploaded-video analysis path
