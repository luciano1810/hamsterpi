[中文版](./README.md) | [English Edition](./README_en.md)

# HamsterPi

HamsterPi 是一个专为树莓派（Raspberry Pi Zero 2W）优化的仓鼠监控栈，具有低功耗默认配置：

1. **虚拟里程计** (速度、距离、方向、跑停强度)
2. **空间分析** (热力图、巡逻路径、区域停留、离笼预警)
3. **视觉健康检查** (支持 VLM 的健康评分 + 图像启发式算法)
4. **物资监测** (水瓶、食盆、储粮点、磨牙消耗)
5. **行为日志** (作息规律、理毛、刻板行为、挖掘)
6. **环境分析** (光照、清洁度、垫料平整度、舒适度指数)
7. **运动触发捕获** (仅在画面变化时记录，节省存储和 CPU)

## 树莓派 Zero 2W 优化

默认配置针对 512MB 内存进行了深度调优：

- `runtime.profile: rpi_zero2w`
- 低 FPS 和跳帧处理 (`process_every_nth_frame`)
- 降低分析分辨率 (`analysis_scale`, `max_analysis_width/height`)
- 限制内存中的结果存储 (`max_frame_results`)
- 在低内存模式下自动禁用可选的 VLM 模块

## 项目结构

```text
config/config.yaml                   # 视频路径、VLM、运行时、运动触发、区域配置
hamsterpi/config.py                  # 类型安全配置加载器
hamsterpi/pipeline.py                # 针对低内存优化的视觉处理流水线
hamsterpi/simulator.py               # 24小时模拟数据提取器
hamsterpi/main.py                    # FastAPI 接口 + 区域初始化端点
hamsterpi/log_viewer.py              # FastAPI 日志控制台 (端口 8002)
hamsterpi/logging_system.py          # 分级日志 + 滚动文件解析
hamsterpi/algorithms/*.py            # 所有核心分析算法
web/index.html                       # 仪表盘 + 区域初始化弹窗
web/app.js                           # 图表绘制 + 区域选择逻辑
web/styles.css                       # UI 样式
web/logs/*                           # 日志控制台前端
```

## 快速开始

```bash
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
./scripts/run_all.sh
```

手动模式 (需开启两个终端):

```bash
# 终端 A: 主程序
uvicorn hamsterpi.main:app --host 0.0.0.0 --port 8000
# 终端 B: 日志实时查看
uvicorn hamsterpi.log_viewer:app --host 0.0.0.0 --port 8002
```

访问 `http://<pi-ip>:8000` 查看仪表盘。
访问 `http://<pi-ip>:8002` 查看日志。

## 设置与语言

- 点击顶部工具栏右侧的 `设置 / Settings`。
- 设置面板采用左侧分组、右侧详情的布局（非原始 JSON 编辑器）。
- 所有配置组均可通过表单编辑，并持久化到 `config/config.yaml`。
- VLM API 配置位于 `VLM API` 分组 (`health.vlm`)。
- UI 语言可在设置中配置：
  - 默认：`zh-CN` (简体中文)
  - 可选：`en-US` (英文)

## 运行模式切换

- `app.run_mode`:
  - `demo` (默认，演示模式)
  - `real` (预留用于真实摄像头控制)
- `app.demo_source` (当 `run_mode=demo` 时有效):
  - `virtual` (使用模拟生成的看板数据)
  - `uploaded_video` (上传视频文件并进行实时分析)
- `app.demo_upload_dir`: 上传的演示视频存储路径

在 UI 设置中可以直接切换模式：

1. 选择 `Demo` + `Virtual Data` 即可看到模拟数据。
2. 选择 `Demo` + `Uploaded Video Analysis`：
   - 浏览器会先提取并上传原图首帧（用于初始化划区背景）。
   - 浏览器在本地对视频进行压缩。
   - 如果浏览器不支持该格式/编码，则回退到上传原文件。
   - 上传完成后，需先在“Initialize Zones”中初始化划区，再点击 Analyze 生成看板。
3. 选择 `Real` 进入预留模式（摄像头集成占位）。

## 首次运行初始化 (圈区)

1. 在看板点击 `Initialize Zones` (初始化区域)
2. 在画面中绘制所需的区域多边形：
   - `Fence Boundary` (出笼边界)
   - `Wheel Area` (跑轮区域)
   - `Food Zone` (食盆区域)
   - `Sand Bath Zone` (沙浴区域)
   - `Hideout Zone` (躲避穴区域)
3. 双击闭合多边形，完成后点击 Save。

## 运动触发

配置中的 `motion_trigger` 部分控制场景变化录制：

- 仅在监控画面发生变化时记录视频或抓拍。
- 显著降低 RPi 的长时间运行负荷及存储需求。

## 分级日志

- 日志级别：`DEBUG`, `INFO`, `WARNING`, `ERROR`, `CRITICAL`。
- 日志文件路径：`logging.file_path` (默认：`./logs/hamsterpi.log`)。
- 支持自动滚动（Rotating）：通过 `max_bytes` 和 `backup_count` 控制。

## 注意事项

- **模拟看板**：在没有真实视频时也可以跑通全流程展示。
- **VLM 系统**：如需使用视觉语言模型分析，请在环境变量中设置 `OPENAI_API_KEY`。
- **性能限制**：在 RPi Zero 2W 上，建议 FPS 设置在 8-12 之间以获得最佳稳定性。
