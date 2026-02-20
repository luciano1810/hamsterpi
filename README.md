[中文版](./README.md) | [English Edition](./README_en.md)

# HamsterPi

HamsterPi 是一个面向树莓派（Raspberry Pi Zero 2W）优化的仓鼠监控与分析栈，支持低内存运行、Demo 上传视频分析、圈区初始化和多维行为看板。

## 当前实现状态（2026-02）

- `demo + virtual`：可用（模拟数据看板）
- `demo + uploaded_video`：可用（上传视频、圈区、自动分析）
- `real` 模式：可用（CSI 摄像头实时监控 + 循环录制）
- 页面 `实时监控 / Realtime`：可用（Demo 回看 / Real 摄像头流）

## 核心能力

1. **虚拟里程计**：速度、距离、方向、跑停切换强度
2. **空间分析**：热力图、巡逻轨迹、区域停留、越界检测
3. **透视映射（BEV）**：基于围栏多边形估计四边形并映射到长方形平面
4. **圈区映射预览**：初始化时提供“映射前/映射后”对比，并展示真实透视矫正后的背景图
5. **轨迹去抖与驻留聚类**：大范围往返抖动可归并为同一驻留点
6. **时间 vs 区域停留图**：按时间展示所在区域（食盆/沙浴/躲避窝/围栏外/未知）及驻留时长
7. **视觉健康检查**：启发式视觉指标 + 可选 VLM
8. **精选照片与反馈闭环**：自动挑选最佳仓鼠帧，支持“好/坏”反馈重排
9. **物资监测**：水位、食物余量、磨牙损耗
10. **行为与环境分析**：作息、理毛/挖掘、焦虑指数、光照/清洁/垫料舒适度
11. **运动触发录制**：仅在画面变化时触发录制，降低 CPU 与存储占用
12. **真实模式循环录制**：支持 CSI 摄像头实时流、分段循环录制、按最大存储空间自动淘汰旧片段，并输出逐帧时间戳日志

## 树莓派 Zero 2W 优化

默认配置针对 512MB 内存：

- `runtime.profile: rpi_zero2w`
- 低 FPS + 跳帧处理（`process_every_nth_frame`）
- 降低分析分辨率（`analysis_scale`, `max_analysis_width/height`）
- 限制内存中的结果数量（`max_frame_results`）
- 低内存模式下自动禁用可选 VLM

## 项目结构

```text
config/config.yaml                   # 视频路径、VLM、运行时、运动触发、区域配置
hamsterpi/config.py                  # 类型安全配置加载器
hamsterpi/pipeline.py                # 低内存视频分析流水线（含透视映射）
hamsterpi/simulator.py               # 24小时模拟数据生成
hamsterpi/main.py                    # FastAPI 接口 + 圈区初始化/映射预览端点
hamsterpi/log_viewer.py              # FastAPI 日志控制台 (端口 8002)
hamsterpi/logging_system.py          # 分级日志 + 滚动文件
hamsterpi/algorithms/*.py            # 核心分析算法
web/index.html                       # 仪表盘 + 初始化弹窗
web/app.js                           # 图表绘制 + 上传/圈区/映射预览逻辑
web/styles.css                       # UI 样式
web/logs/*                           # 日志控制台前端
```

## 快速开始

推荐（自动创建/激活 `.venv` 并安装依赖）：

```bash
./run_local.sh
```

或手动：

```bash
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
./scripts/run_all.sh
```

也可分别启动：

```bash
# 终端 A：主服务
uvicorn hamsterpi.main:app --host 0.0.0.0 --port 8000

# 终端 B：日志服务
uvicorn hamsterpi.log_viewer:app --host 0.0.0.0 --port 8002
```

访问：

- `http://<pi-ip>:8000` 仪表盘
- `http://<pi-ip>:8002` 日志控制台

## 运行模式与上传流程

- `app.run_mode`
  - `demo`（默认）
  - `real`（真实摄像头）
- `app.demo_source`（`run_mode=demo` 时生效）
  - `virtual`（模拟数据）
  - `uploaded_video`（上传视频分析）

`uploaded_video` 流程：

1. 上传视频（浏览器优先上传原始首帧供圈区背景使用；失败时回退服务端抽帧）
2. 进入 `Initialize Zones` 完成圈区
3. 点击 `Save Zones` 后自动触发分析（若处于 Demo 上传视频模式）

`real` 模式要点：

1. 在设置 `video.real_camera_device` 选择 `auto / picamera2 / 0 / /dev/video0`
2. 实时页自动切换为 `/api/real/live-stream` 摄像头流
3. 循环录制目录 `video.real_record_output_dir`
4. 最大占用空间 `video.real_record_max_storage_gb`（超限自动删最旧片段）
5. 每个片段写出
   - `loop_*.mp4`
   - `loop_*.mp4.frames.jsonl`（逐帧时间戳与视频时间）
   - `loop_*.mp4.meta.json`（帧-时间匹配统计）

## 圈区初始化与映射预览

初始化需要按顺序绘制：

- `Fence Boundary`
- `Wheel Area`
- `Food Zone`
- `Sand Bath Zone`
- `Hideout Zone`

映射预览说明：

- 仅在 `demo` 模式提供
- 显示“映射前（相机平面）”与“映射后（长方形平面）”
- 映射后面板使用真实透视矫正后的背景图（不仅轮廓叠加）
- 返回边界误差 `boundary_error` 供快速验收圈区质量

## 空间轨迹可视化（最新）

- 巡逻轨迹按透视矫正平面绘制，坐标轴优先使用 `analysis_width/analysis_height`
- 长时间驻留时抑制细微抖动，并将大点附近往返归并为单点
- 新增“时间 vs 区域停留”图，展示不同区域驻留分布与时长

## 设置与语言

- 设置面板采用左侧分组 + 右侧字段编辑
- 配置写回 `config/config.yaml`
- UI 支持：
  - `zh-CN`（默认）
  - `en-US`

## 主要 API

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

日志服务（8002）：

- `GET /api/logs?levels=INFO,ERROR&q=keyword&limit=500`
- `GET /api/logs?levels=INFO,ERROR&q=keyword&limit=500&perf_only=true`
- `GET /health`

## 日志

- 级别：`DEBUG`, `INFO`, `WARNING`, `ERROR`, `CRITICAL`
- 文件：`logging.file_path`（默认 `./logs/hamsterpi.log`）
- 滚动：`logging.max_bytes`, `logging.backup_count`

## 实现备注

- BEV 映射基于围栏多边形估计稳定四边形（含多候选评估），并透视映射区域多边形
- 跑轮掩膜用于运动分析时保持在相机平面，不做 BEV 变换
- `hoard_hotspots` 在上传视频分析路径当前为占位输出（空列表）
