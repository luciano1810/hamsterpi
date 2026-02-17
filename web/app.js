const chartIds = [
  "chart-speed-rpm",
  "chart-hourly-distance",
  "chart-direction",
  "chart-running-streak",
  "chart-heatmap",
  "chart-trajectory",
  "chart-zone-dwell",
  "chart-escape",
  "chart-health-radar",
  "chart-health-trend",
  "chart-resource",
  "chart-gnaw",
  "chart-hoard",
  "chart-behavior-hourly",
  "chart-anxiety",
  "chart-env-comfort",
  "chart-env-factors",
  "chart-motion",
];

const INIT_STEPS = [
  { key: "fence_polygon", labelKey: "init_step_fence", descKey: "init_step_fence_desc" },
  { key: "wheel_mask_polygon", labelKey: "init_step_wheel", descKey: "init_step_wheel_desc" },
  { key: "food_zone", labelKey: "init_step_food", descKey: "init_step_food_desc" },
  { key: "sand_bath_zone", labelKey: "init_step_sand", descKey: "init_step_sand_desc" },
  { key: "hideout_zone", labelKey: "init_step_hideout", descKey: "init_step_hideout_desc" },
];

const STEP_COLORS = {
  fence_polygon: "#65e0c6",
  wheel_mask_polygon: "#ffbf5b",
  food_zone: "#ff8f66",
  sand_bath_zone: "#4aa3ff",
  hideout_zone: "#9cd67a",
};

const I18N = {
  "zh-CN": {
    page_title: "HamsterPi 监控台",
    hero_eyebrow: "仓鼠行为智能分析",
    hero_title: "HamsterPi 监控台",
    hero_sub: "面向 Pi Zero 2W 的低内存方案，支持虚拟数据、初始化圈区、运动触发拍摄、行为与环境分析。",
    btn_refresh: "刷新虚拟数据",
    btn_auto_on: "自动刷新：开",
    btn_auto_off: "自动刷新：关",
    btn_init: "初始化圈区",
    btn_settings: "设置",
    btn_close: "关闭",
    btn_undo: "撤销点位",
    btn_clear: "清空区域",
    btn_prev: "上一区域",
    btn_next: "下一区域",
    btn_save_regions: "保存区域到配置",
    btn_reload_config: "重载配置",
    btn_save_config: "保存配置",
    btn_refreshing: "刷新中...",
    label_generated_at: "生成时间：",
    label_runtime: "运行配置：",
    section1_title: "1. 虚拟跑轮传感器",
    section1_desc: "速度、圈数、方向与跑停切换强度",
    section2_title: "2. 空间活跃度与领地分析",
    section2_desc: "热力图、巡逻路径、区域停留占比与越界检测",
    section3_title: "3. 基于 VLM 的生理健康扫描",
    section3_desc: "毛发、神态、体型变化与步态对称性",
    section4_title: "4. 资源状态监控",
    section4_desc: "水位、粮食余量、藏粮热点和磨牙损耗",
    section5_title: "5. 行为习性与作息统计",
    section5_desc: "起居规律、洗脸频率、刻板行为与挖掘时长",
    section6_title: "6. 生活环境与运动触发拍摄",
    section6_desc: "光照、清洁、垫料舒适度与画面变动触发录制",
    chart_speed_rpm: "速度与 RPM 时间线（24h）",
    chart_hourly_distance: "小时里程 + 跑停切换次数",
    chart_direction: "方向分布",
    chart_running_streak: "连续奔跑时长趋势",
    chart_heatmap: "24h 活动热力图",
    chart_trajectory: "巡逻轨迹",
    chart_zone_dwell: "区域停留占比",
    chart_escape: "越界时间线",
    chart_health_radar: "最新健康雷达图",
    chart_health_trend: "健康扫描趋势",
    chart_resource: "水位 / 食量趋势",
    chart_gnaw: "磨牙损耗趋势",
    chart_hoard: "藏粮热点",
    chart_behavior_hourly: "每小时洗脸 / 挖掘",
    chart_anxiety: "焦虑 / 刻板行为指数",
    chart_schedule: "每日作息快照",
    chart_env_comfort: "环境舒适度趋势",
    chart_env_factors: "环境因子分项",
    chart_motion: "运动比率与录制状态",
    chart_segments: "录制片段",
    alerts_title: "告警流",
    alerts_desc: "来自越界、健康、补给与环境规则的实时告警",
    table_time: "时间",
    table_severity: "等级",
    table_type: "类型",
    table_message: "内容",
    init_title: "初始化笼内区域",
    init_sub: "单击添加点位，双击闭合多边形。请依次完成所有区域后保存。",
    init_current: "当前区域",
    init_step_fence: "笼体边界",
    init_step_fence_desc: "用于虚拟围栏越界告警",
    init_step_wheel: "跑轮区域",
    init_step_wheel_desc: "用于空间分析掩膜",
    init_step_food: "食盆区域",
    init_step_food_desc: "用于补给与行为统计",
    init_step_sand: "沙浴区域",
    init_step_sand_desc: "用于挖掘行为分析",
    init_step_hideout: "躲避窝区域",
    init_step_hideout_desc: "用于起床/入睡判断",
    settings_title: "系统设置",
    settings_sub: "左侧选择配置分组，右侧编辑具体配置项。",
    settings_section_title: "配置分组",
    settings_section_app: "应用基础",
    settings_section_video: "视频输入",
    settings_section_runtime: "运行时参数",
    settings_section_motion: "运动触发",
    settings_section_environment: "环境分析",
    settings_section_wheel: "跑轮参数",
    settings_section_spatial: "空间区域",
    settings_section_health: "健康扫描",
    settings_section_vlm: "VLM API 配置",
    settings_section_inventory: "资源监控",
    settings_section_alerts: "告警规则",
    settings_section_frontend: "前端展示",
    settings_section_logging: "日志系统",
    settings_section_demo_tools: "演示工具",
    settings_section_app_desc: "运行模式、时区、上传目录等应用基础设置。",
    settings_section_video_desc: "视频源路径与输入帧率、分辨率设置。",
    settings_section_runtime_desc: "低内存模式、分析分辨率和帧处理节流。",
    settings_section_motion_desc: "画面变动触发录制相关阈值和输出参数。",
    settings_section_environment_desc: "光照、清洁与垫料舒适度分析参数。",
    settings_section_wheel_desc: "跑轮直径、ROI 与色点检测阈值。",
    settings_section_spatial_desc: "围栏、多边形区域、热区空间分析参数。",
    settings_section_health_desc: "健康扫描周期和体型基线设置。",
    settings_section_vlm_desc: "配置模型服务商、模型名、接口地址与鉴权环境变量。",
    settings_section_inventory_desc: "水位/食量/磨牙区域与告警阈值。",
    settings_section_alerts_desc: "越界通知与行为风险阈值配置。",
    settings_section_frontend_desc: "面板刷新周期、语言与历史窗口。",
    settings_section_logging_desc: "日志级别、落盘路径和滚动策略。",
    settings_section_demo_tools_desc: "上传压缩视频，或选择已上传视频后直接进入圈区与分析。",
    settings_demo_tools_hint: "请先在“应用基础”中设置 run_mode=demo 且 demo_source=uploaded_video。",
    settings_form_empty: "当前分组没有可编辑字段。",
    settings_bool_true: "是",
    settings_bool_false: "否",
    settings_uploaded_select_label: "已上传视频",
    settings_upload_label: "上传视频文件",
    settings_editor_label: "配置编辑器（JSON）",
    mode_demo: "演示模式",
    mode_real: "真实模式（预留）",
    source_virtual: "虚拟数据",
    source_uploaded_video: "上传视频",
    settings_invalid_number: "请输入有效数字",
    btn_upload_video: "上传视频",
    btn_use_uploaded_video: "使用并初始化圈区",
    btn_analyze_video: "分析视频",
    init_status_loading: "正在加载预览画面...",
    init_status_source: "预览来源：{source}。请完成圈区并保存。",
    init_status_save: "正在保存区域到配置...",
    init_status_saved: "区域已保存，配置已热重载。",
    settings_status_loading: "正在加载配置...",
    settings_status_loaded: "配置已加载，可编辑后保存。",
    settings_status_saving: "正在保存配置...",
    settings_status_saved: "配置已保存并生效。",
    settings_status_save_fail: "保存失败：{error}",
    settings_status_load_fail: "加载失败：{error}",
    upload_status_none: "尚未上传视频。",
    upload_status_uploaded: "已上传：{name}",
    upload_status_uploaded_need_init: "已上传：{name}（待圈区）",
    upload_status_preview_preparing: "正在提取首帧预览...",
    upload_status_preview_uploading: "正在上传原始首帧...",
    upload_status_preview_ok: "原始首帧上传成功。",
    upload_status_preview_fail: "原始首帧上传失败：{error}。将回退到视频帧。",
    upload_status_selecting: "正在载入已上传视频...",
    upload_status_selected_need_init: "已载入：{name}。可直接开始圈区初始化。",
    upload_status_select_fail: "载入已上传视频失败：{error}",
    upload_status_uploading: "正在上传视频...",
    upload_status_compressing: "正在本地压缩视频...",
    upload_status_compress_done: "压缩完成：{orig_mb}MB -> {new_mb}MB（{ratio}%）",
    upload_status_compress_fail: "视频压缩失败：{error}",
    upload_status_fallback_original: "压缩失败，改为原视频上传...",
    upload_status_upload_ok: "上传成功：{name}",
    upload_status_upload_ok_need_init: "上传成功：{name}。请先初始化圈区，再点击分析。",
    upload_status_upload_fail: "上传失败：{error}",
    upload_status_analyzing: "正在分析视频...",
    upload_status_analyze_ok: "视频分析完成。",
    upload_status_analyze_fail: "视频分析失败：{error}",
    upload_status_zone_required: "请先完成上传视频圈区初始化，再进行分析。",
    upload_history_none: "暂无可选视频",
    upload_history_current: "当前",
    mode_real_reserved: "真实模式已预留，当前暂未接入真实摄像头。",
    status_upload_then_analyze: "请选择上传视频并点击分析。",
    status_no_frames: "视频中未检测到可分析帧。",
    status_video_analyzed: "视频分析完成。",
    dashboard_load_fail: "数据加载失败",
    no_alerts: "当前窗口无告警。",
    no_segments: "当前窗口无运动触发录制片段。",
    schedule_day: "日期",
    schedule_first_out: "首次出窝",
    schedule_last_in: "最后回窝",
    kpi_distance: "24h 总里程",
    kpi_patrol: "巡逻长度",
    kpi_avg_speed: "平均速度",
    kpi_max_speed: "峰值速度",
    kpi_run_ratio: "奔跑占比",
    kpi_reverse_ratio: "反向跑占比",
    kpi_water: "水位",
    kpi_food: "食物余量",
    kpi_anxiety: "焦虑指数",
    kpi_health: "健康风险",
    kpi_env: "环境舒适度",
    kpi_capture: "录制片段数",
    hint_wheel: "跑轮输出",
    hint_floor: "地面巡逻",
    hint_rolling: "滚动均值",
    hint_peak: "峰值冲刺",
    hint_active: "活跃分钟占比",
    hint_diversity: "运动多样性",
    hint_inventory: "补给监控",
    hint_behavior: "行为日志",
    hint_health: "VLM + 视觉扫描",
    hint_env: "环境分析",
    hint_motion: "运动触发",
    dir_forward: "正向",
    dir_reverse: "反向",
    dir_idle: "静止",
    zone_food: "食盆区",
    zone_sand: "沙浴区",
    zone_hideout: "躲避窝",
    legend_speed: "速度",
    legend_rpm: "RPM",
    legend_distance: "里程",
    legend_stop_go: "跑停切换",
    legend_water: "水位",
    legend_food: "食量",
    legend_fur: "毛发",
    legend_expression: "神态",
    legend_gait: "步态",
    legend_volume: "体型变化",
    legend_grooming: "洗脸",
    legend_digging: "挖掘",
    legend_lighting: "光照",
    legend_cleanliness: "清洁度",
    legend_bedding: "垫料均匀度",
    legend_motion_ratio: "运动比率",
    legend_capture_active: "录制中",
    axis_scores: "评分",
    axis_volume: "体型",
    axis_events: "次数",
    axis_count: "计数",
    axis_minutes: "分钟",
    axis_ratio: "比率",
    axis_capture: "录制",
    level_high: "高",
    level_medium: "中",
    level_low: "低",
    level_info: "信息",
    alert_threshold: "告警阈值",
    good_line: "良好线",
    risk_line: "风险线",
    capture_duration: "时长",
    point_label: "点",
    done_mark: "完成",
    source_video: "视频首帧",
    source_uploaded_frame: "上传视频首帧",
    source_uploaded_preview: "上传原始首帧",
    source_placeholder: "占位图",
    source_unknown: "未知",
    alert_type_escape: "越界",
    alert_type_water_refill: "加水",
    alert_type_food_refill: "补粮",
    alert_type_low_water: "低水位",
    alert_type_low_food: "低食量",
    alert_type_stereotypy: "刻板行为",
    alert_type_environment_risk: "环境风险",
    alert_type_health_risk: "健康风险",
    alert_msg_escape: "检测到虚拟围栏越界",
    alert_msg_water_refill: "水壶已补水",
    alert_msg_food_refill: "食盆已补粮",
    alert_msg_low_water: "水位低于阈值",
    alert_msg_low_food: "食物余量低于阈值",
    alert_msg_stereotypy: "刻板行为指数偏高",
    alert_msg_environment_risk: "生活环境舒适度偏低",
    alert_msg_health_risk: "健康评分触发风险提醒",
  },
  "en-US": {
    page_title: "HamsterPi Console",
    hero_eyebrow: "Hamster Behavior Intelligence",
    hero_title: "HamsterPi Monitoring Console",
    hero_sub: "Low-memory pipeline for Pi Zero 2W with synthetic data, zone initialization, motion-triggered capture, behavior and environment analytics.",
    btn_refresh: "Refresh Synthetic Data",
    btn_auto_on: "Auto Refresh: On",
    btn_auto_off: "Auto Refresh: Off",
    btn_init: "Initialize Zones",
    btn_settings: "Settings",
    btn_close: "Close",
    btn_undo: "Undo Point",
    btn_clear: "Clear Region",
    btn_prev: "Previous",
    btn_next: "Next",
    btn_save_regions: "Save Zones to Config",
    btn_reload_config: "Reload Config",
    btn_save_config: "Save Config",
    btn_refreshing: "Refreshing...",
    label_generated_at: "Generated At: ",
    label_runtime: "Runtime Profile: ",
    section1_title: "1. Virtual Odometer",
    section1_desc: "Speed, revolutions, direction and stop-go intensity",
    section2_title: "2. Spatial Analytics",
    section2_desc: "Heatmap, patrol path, zone dwell ratio and escape detection",
    section3_title: "3. VLM Visual Health Check",
    section3_desc: "Fur, expression, body-shape drift and gait symmetry",
    section4_title: "4. Inventory Watch",
    section4_desc: "Water level, food residue, hoard hotspots and gnaw wear",
    section5_title: "5. Behavioral Logging",
    section5_desc: "Daily schedule, grooming, stereotypy and digging duration",
    section6_title: "6. Environment & Motion Trigger",
    section6_desc: "Lighting, cleanliness, bedding comfort and motion-triggered recording",
    chart_speed_rpm: "Speed & RPM Timeline (24h)",
    chart_hourly_distance: "Hourly Distance + Stop-Go Events",
    chart_direction: "Direction Distribution",
    chart_running_streak: "Running Streak Trend",
    chart_heatmap: "24h Activity Heatmap",
    chart_trajectory: "Patrol Trajectory",
    chart_zone_dwell: "Zone Dwell Ratio",
    chart_escape: "Escape Timeline",
    chart_health_radar: "Latest Health Radar",
    chart_health_trend: "Health Trend",
    chart_resource: "Water / Food Trend",
    chart_gnaw: "Gnaw Wear Trend",
    chart_hoard: "Hoard Hotspots",
    chart_behavior_hourly: "Hourly Grooming / Digging",
    chart_anxiety: "Anxiety / Stereotypy Index",
    chart_schedule: "Daily Schedule",
    chart_env_comfort: "Environment Comfort Trend",
    chart_env_factors: "Environment Factors",
    chart_motion: "Motion Ratio & Capture State",
    chart_segments: "Capture Segments",
    alerts_title: "Alerts Stream",
    alerts_desc: "Realtime alerts from escape, health, inventory and environment rules",
    table_time: "Time",
    table_severity: "Severity",
    table_type: "Type",
    table_message: "Message",
    init_title: "Initialize Cage Zones",
    init_sub: "Click to add points, double-click to close polygon. Complete all zones then save.",
    init_current: "Current Zone",
    init_step_fence: "Fence Boundary",
    init_step_fence_desc: "Used for escape alert",
    init_step_wheel: "Wheel Area",
    init_step_wheel_desc: "Used as spatial mask",
    init_step_food: "Food Zone",
    init_step_food_desc: "Used for inventory and behavior stats",
    init_step_sand: "Sand Bath Zone",
    init_step_sand_desc: "Used for digging analysis",
    init_step_hideout: "Hideout Zone",
    init_step_hideout_desc: "Used for wake/sleep schedule",
    settings_title: "System Settings",
    settings_sub: "Choose a config group on the left and edit concrete fields on the right.",
    settings_section_title: "Config Groups",
    settings_section_app: "App Basics",
    settings_section_video: "Video Input",
    settings_section_runtime: "Runtime",
    settings_section_motion: "Motion Trigger",
    settings_section_environment: "Environment",
    settings_section_wheel: "Wheel",
    settings_section_spatial: "Spatial",
    settings_section_health: "Health Core",
    settings_section_vlm: "VLM API",
    settings_section_inventory: "Inventory",
    settings_section_alerts: "Alerts",
    settings_section_frontend: "Frontend",
    settings_section_logging: "Logging",
    settings_section_demo_tools: "Demo Tools",
    settings_section_app_desc: "Run mode, timezone and demo upload directory.",
    settings_section_video_desc: "Video source path, fps and frame dimensions.",
    settings_section_runtime_desc: "Low-memory profile and frame processing throttling.",
    settings_section_motion_desc: "Motion-trigger thresholds and capture output settings.",
    settings_section_environment_desc: "Lighting, cleanliness and bedding analysis parameters.",
    settings_section_wheel_desc: "Wheel diameter, ROI and marker detection settings.",
    settings_section_spatial_desc: "Fence polygons, zones and spatial analytics parameters.",
    settings_section_health_desc: "Health scan interval and body-area baseline.",
    settings_section_vlm_desc: "Provider/model/endpoint/api key env and request timeout.",
    settings_section_inventory_desc: "Water/food/gnaw ROIs and refill thresholds.",
    settings_section_alerts_desc: "Escape notifier and risk threshold settings.",
    settings_section_frontend_desc: "Dashboard refresh interval, language and history window.",
    settings_section_logging_desc: "Log level, file path and rotation policy.",
    settings_section_demo_tools_desc: "Upload a compressed video, or reuse an uploaded video and jump to zone initialization.",
    settings_demo_tools_hint: "Set run_mode=demo and demo_source=uploaded_video in App Basics first.",
    settings_form_empty: "No editable fields in current group.",
    settings_bool_true: "True",
    settings_bool_false: "False",
    settings_uploaded_select_label: "Uploaded Videos",
    settings_upload_label: "Upload Video",
    settings_editor_label: "Configuration Editor (JSON)",
    mode_demo: "Demo",
    mode_real: "Real (Reserved)",
    source_virtual: "Virtual Data",
    source_uploaded_video: "Uploaded Video Analysis",
    settings_invalid_number: "Please enter a valid number",
    btn_upload_video: "Upload Video",
    btn_use_uploaded_video: "Use and Initialize Zones",
    btn_analyze_video: "Analyze Video",
    init_status_loading: "Loading preview frame...",
    init_status_source: "Preview source: {source}. Draw zones and save.",
    init_status_save: "Saving zones...",
    init_status_saved: "Zones saved and config hot-reloaded.",
    settings_status_loading: "Loading configuration...",
    settings_status_loaded: "Configuration loaded. Edit and save.",
    settings_status_saving: "Saving configuration...",
    settings_status_saved: "Configuration saved.",
    settings_status_save_fail: "Save failed: {error}",
    settings_status_load_fail: "Load failed: {error}",
    upload_status_none: "No video uploaded.",
    upload_status_uploaded: "Uploaded: {name}",
    upload_status_uploaded_need_init: "Uploaded: {name} (zones required)",
    upload_status_preview_preparing: "Extracting full-resolution first frame...",
    upload_status_preview_uploading: "Uploading original first frame...",
    upload_status_preview_ok: "Original first frame uploaded.",
    upload_status_preview_fail: "Original first frame upload failed: {error}. Falling back to video frame.",
    upload_status_selecting: "Loading selected uploaded video...",
    upload_status_selected_need_init: "Loaded: {name}. Start zone initialization directly.",
    upload_status_select_fail: "Failed to load uploaded video: {error}",
    upload_status_uploading: "Uploading video...",
    upload_status_compressing: "Compressing video locally...",
    upload_status_compress_done: "Compression done: {orig_mb}MB -> {new_mb}MB ({ratio}%)",
    upload_status_compress_fail: "Video compression failed: {error}",
    upload_status_fallback_original: "Compression failed, fallback to original upload...",
    upload_status_upload_ok: "Upload successful: {name}",
    upload_status_upload_ok_need_init: "Upload successful: {name}. Initialize zones before analysis.",
    upload_status_upload_fail: "Upload failed: {error}",
    upload_status_analyzing: "Analyzing video...",
    upload_status_analyze_ok: "Video analysis completed.",
    upload_status_analyze_fail: "Video analysis failed: {error}",
    upload_status_zone_required: "Initialize zones for uploaded video before analysis.",
    upload_history_none: "No uploaded videos available",
    upload_history_current: "Current",
    mode_real_reserved: "Real mode is reserved and camera control is not connected yet.",
    status_upload_then_analyze: "Upload a video and click Analyze.",
    status_no_frames: "No analyzable frames found in video.",
    status_video_analyzed: "Video analysis completed.",
    dashboard_load_fail: "Failed to load dashboard data",
    no_alerts: "No alerts in current window.",
    no_segments: "No motion-triggered segment in this window.",
    schedule_day: "Day",
    schedule_first_out: "First Out",
    schedule_last_in: "Last In",
    kpi_distance: "Distance (24h)",
    kpi_patrol: "Patrol Length",
    kpi_avg_speed: "Avg Speed",
    kpi_max_speed: "Max Speed",
    kpi_run_ratio: "Run Ratio",
    kpi_reverse_ratio: "Reverse Ratio",
    kpi_water: "Water Level",
    kpi_food: "Food Coverage",
    kpi_anxiety: "Anxiety Index",
    kpi_health: "Health Risk",
    kpi_env: "Environment Comfort",
    kpi_capture: "Capture Segments",
    hint_wheel: "Wheel output",
    hint_floor: "Floor tracking",
    hint_rolling: "Rolling average",
    hint_peak: "Peak burst",
    hint_active: "Active minutes",
    hint_diversity: "Exercise diversity",
    hint_inventory: "Inventory watch",
    hint_behavior: "Behavior logging",
    hint_health: "VLM + visual scan",
    hint_env: "Environment analysis",
    hint_motion: "Motion-triggered",
    dir_forward: "Forward",
    dir_reverse: "Reverse",
    dir_idle: "Idle",
    zone_food: "Food",
    zone_sand: "Sand Bath",
    zone_hideout: "Hideout",
    legend_speed: "Speed",
    legend_rpm: "RPM",
    legend_distance: "Distance",
    legend_stop_go: "Stop-Go",
    legend_water: "Water",
    legend_food: "Food",
    legend_fur: "Fur",
    legend_expression: "Expression",
    legend_gait: "Gait",
    legend_volume: "Volume",
    legend_grooming: "Grooming",
    legend_digging: "Digging",
    legend_lighting: "Lighting",
    legend_cleanliness: "Cleanliness",
    legend_bedding: "Bedding",
    legend_motion_ratio: "Motion Ratio",
    legend_capture_active: "Capture Active",
    axis_scores: "scores",
    axis_volume: "volume",
    axis_events: "events",
    axis_count: "count",
    axis_minutes: "minutes",
    axis_ratio: "ratio",
    axis_capture: "capture",
    level_high: "High",
    level_medium: "Medium",
    level_low: "Low",
    level_info: "Info",
    alert_threshold: "Alert threshold",
    good_line: "Good",
    risk_line: "Risk",
    capture_duration: "Duration",
    point_label: "point",
    done_mark: "done",
    source_video: "video frame",
    source_uploaded_frame: "uploaded video frame",
    source_uploaded_preview: "uploaded original first frame",
    source_placeholder: "placeholder",
    source_unknown: "unknown",
    alert_type_escape: "Escape",
    alert_type_water_refill: "Water Refill",
    alert_type_food_refill: "Food Refill",
    alert_type_low_water: "Low Water",
    alert_type_low_food: "Low Food",
    alert_type_stereotypy: "Stereotypy",
    alert_type_environment_risk: "Environment Risk",
    alert_type_health_risk: "Health Risk",
    alert_msg_escape: "Virtual fence crossing detected",
    alert_msg_water_refill: "Water bottle refilled",
    alert_msg_food_refill: "Food bowl replenished",
    alert_msg_low_water: "Water level below threshold",
    alert_msg_low_food: "Food coverage below threshold",
    alert_msg_stereotypy: "Stereotyped behavior index is elevated",
    alert_msg_environment_risk: "Environment comfort index is low",
    alert_msg_health_risk: "Health score indicates elevated risk",
  },
};

const charts = {};
let autoRefresh = true;
let refreshTimer = null;
let currentLanguage = "zh-CN";
let availableLanguages = ["zh-CN", "en-US"];
let lastDashboardData = null;
let currentRunMode = "demo";
let currentDemoSource = "virtual";
let uploadedVideoName = "";
let uploadedVideoKey = "";
let uploadedVideos = [];
let uploadedPreviewAvailable = false;
let uploadedZoneRequired = false;
const CLIENT_VIDEO_COMPRESS = {
  maxWidth: 960,
  maxHeight: 540,
  targetFps: 12,
  videoBitsPerSecond: 900000,
  chunkMs: 500,
};

const SETTINGS_SECTIONS = [
  { id: "app", path: "app", labelKey: "settings_section_app", descKey: "settings_section_app_desc" },
  { id: "video", path: "video", labelKey: "settings_section_video", descKey: "settings_section_video_desc" },
  { id: "runtime", path: "runtime", labelKey: "settings_section_runtime", descKey: "settings_section_runtime_desc" },
  { id: "motion_trigger", path: "motion_trigger", labelKey: "settings_section_motion", descKey: "settings_section_motion_desc" },
  { id: "environment", path: "environment", labelKey: "settings_section_environment", descKey: "settings_section_environment_desc" },
  { id: "wheel", path: "wheel", labelKey: "settings_section_wheel", descKey: "settings_section_wheel_desc" },
  { id: "spatial", path: "spatial", labelKey: "settings_section_spatial", descKey: "settings_section_spatial_desc" },
  {
    id: "health",
    path: "health",
    includeKeys: ["capture_interval_seconds", "baseline_body_area_px"],
    labelKey: "settings_section_health",
    descKey: "settings_section_health_desc",
  },
  { id: "health_vlm", path: "health.vlm", labelKey: "settings_section_vlm", descKey: "settings_section_vlm_desc" },
  { id: "inventory", path: "inventory", labelKey: "settings_section_inventory", descKey: "settings_section_inventory_desc" },
  { id: "alerts", path: "alerts", labelKey: "settings_section_alerts", descKey: "settings_section_alerts_desc" },
  { id: "frontend", path: "frontend", labelKey: "settings_section_frontend", descKey: "settings_section_frontend_desc" },
  { id: "logging", path: "logging", labelKey: "settings_section_logging", descKey: "settings_section_logging_desc" },
  { id: "demo_tools", path: "", special: "demo_tools", labelKey: "settings_section_demo_tools", descKey: "settings_section_demo_tools_desc" },
];

const SETTINGS_FIELD_LABELS = {
  "app.title": { "zh-CN": "控制台标题", "en-US": "Console Title" },
  "app.timezone": { "zh-CN": "时区", "en-US": "Timezone" },
  "app.run_mode": { "zh-CN": "运行模式", "en-US": "Run Mode" },
  "app.demo_source": { "zh-CN": "演示数据来源", "en-US": "Demo Source" },
  "app.demo_upload_dir": { "zh-CN": "演示视频目录", "en-US": "Demo Upload Directory" },
  "video.source_path": { "zh-CN": "视频源路径", "en-US": "Video Source Path" },
  "video.fps": { "zh-CN": "输入帧率 (FPS)", "en-US": "Input FPS" },
  "video.frame_width": { "zh-CN": "画面宽度 (px)", "en-US": "Frame Width (px)" },
  "video.frame_height": { "zh-CN": "画面高度 (px)", "en-US": "Frame Height (px)" },
  "video.simulate": { "zh-CN": "启用模拟输入", "en-US": "Use Simulated Input" },
  "video.snapshot_interval_seconds": { "zh-CN": "快照间隔 (秒)", "en-US": "Snapshot Interval (s)" },
  "runtime.profile": { "zh-CN": "运行配置档", "en-US": "Runtime Profile" },
  "runtime.low_memory_mode": { "zh-CN": "低内存模式", "en-US": "Low Memory Mode" },
  "runtime.process_every_nth_frame": { "zh-CN": "每 N 帧处理 1 帧", "en-US": "Process Every Nth Frame" },
  "runtime.max_frame_results": { "zh-CN": "最大缓存结果帧数", "en-US": "Max Cached Frame Results" },
  "runtime.analysis_scale": { "zh-CN": "分析缩放比例", "en-US": "Analysis Scale" },
  "runtime.max_analysis_width": { "zh-CN": "分析最大宽度 (px)", "en-US": "Max Analysis Width (px)" },
  "runtime.max_analysis_height": { "zh-CN": "分析最大高度 (px)", "en-US": "Max Analysis Height (px)" },
  "runtime.max_fps": { "zh-CN": "最大处理帧率 (FPS)", "en-US": "Max Processing FPS" },
  "runtime.store_debug_frames": { "zh-CN": "保存调试帧", "en-US": "Store Debug Frames" },
  "motion_trigger.enabled": { "zh-CN": "启用运动触发", "en-US": "Enable Motion Trigger" },
  "motion_trigger.downscale_width": { "zh-CN": "检测降采样宽度 (px)", "en-US": "Detection Downscale Width (px)" },
  "motion_trigger.blur_kernel": { "zh-CN": "模糊核大小", "en-US": "Blur Kernel Size" },
  "motion_trigger.diff_threshold": { "zh-CN": "差分阈值", "en-US": "Difference Threshold" },
  "motion_trigger.min_motion_ratio": { "zh-CN": "最小运动比例", "en-US": "Minimum Motion Ratio" },
  "motion_trigger.start_trigger_frames": { "zh-CN": "开始触发帧数", "en-US": "Start Trigger Frames" },
  "motion_trigger.stop_trigger_frames": { "zh-CN": "停止触发帧数", "en-US": "Stop Trigger Frames" },
  "motion_trigger.min_capture_seconds": { "zh-CN": "最短录制时长 (秒)", "en-US": "Min Capture Duration (s)" },
  "motion_trigger.cool_down_seconds": { "zh-CN": "冷却时间 (秒)", "en-US": "Cooldown (s)" },
  "motion_trigger.output_dir": { "zh-CN": "录制输出目录", "en-US": "Capture Output Directory" },
  "motion_trigger.record_video": { "zh-CN": "启用视频录制", "en-US": "Record Video" },
  "motion_trigger.output_fps": { "zh-CN": "录制帧率 (FPS)", "en-US": "Capture FPS" },
  "motion_trigger.codec": { "zh-CN": "录制编码", "en-US": "Capture Codec" },
  "environment.enabled": { "zh-CN": "启用环境分析", "en-US": "Enable Environment Analysis" },
  "environment.sample_every_nth_frame": { "zh-CN": "每 N 帧采样 1 帧", "en-US": "Sample Every Nth Frame" },
  "environment.low_light_threshold": { "zh-CN": "低光阈值", "en-US": "Low Light Threshold" },
  "environment.high_light_threshold": { "zh-CN": "高光阈值", "en-US": "High Light Threshold" },
  "environment.hygiene_dark_ratio_threshold": { "zh-CN": "卫生暗区阈值", "en-US": "Hygiene Dark-Ratio Threshold" },
  "environment.clutter_edge_threshold": { "zh-CN": "杂乱边缘阈值", "en-US": "Clutter Edge Threshold" },
  "environment.bedding_roi": { "zh-CN": "垫料区域 ROI", "en-US": "Bedding ROI" },
  "wheel.diameter_cm": { "zh-CN": "跑轮直径 (cm)", "en-US": "Wheel Diameter (cm)" },
  "wheel.roi": { "zh-CN": "跑轮 ROI", "en-US": "Wheel ROI" },
  "wheel.min_rpm_for_running": { "zh-CN": "判定奔跑最小 RPM", "en-US": "Minimum Running RPM" },
  "wheel.marker_hsv_ranges": { "zh-CN": "色点 HSV 范围", "en-US": "Marker HSV Ranges" },
  "spatial.frame_width": { "zh-CN": "空间分析宽度 (px)", "en-US": "Spatial Frame Width (px)" },
  "spatial.frame_height": { "zh-CN": "空间分析高度 (px)", "en-US": "Spatial Frame Height (px)" },
  "spatial.fence_polygon": { "zh-CN": "围栏多边形", "en-US": "Fence Polygon" },
  "spatial.wheel_mask_polygon": { "zh-CN": "跑轮遮罩多边形", "en-US": "Wheel Mask Polygon" },
  "spatial.zones": { "zh-CN": "功能区域配置", "en-US": "Zone Settings" },
  "health.capture_interval_seconds": { "zh-CN": "健康扫描间隔 (秒)", "en-US": "Health Scan Interval (s)" },
  "health.baseline_body_area_px": { "zh-CN": "体型基线面积 (px)", "en-US": "Baseline Body Area (px)" },
  "health.vlm.enabled": { "zh-CN": "启用 VLM", "en-US": "Enable VLM" },
  "health.vlm.provider": { "zh-CN": "VLM 服务商", "en-US": "VLM Provider" },
  "health.vlm.endpoint": { "zh-CN": "接口地址", "en-US": "Endpoint" },
  "health.vlm.model": { "zh-CN": "模型名称", "en-US": "Model" },
  "health.vlm.api_key_env": { "zh-CN": "API Key 环境变量", "en-US": "API Key Environment Variable" },
  "health.vlm.timeout_seconds": { "zh-CN": "请求超时 (秒)", "en-US": "Request Timeout (s)" },
  "inventory.water_roi": { "zh-CN": "水位 ROI", "en-US": "Water ROI" },
  "inventory.food_roi": { "zh-CN": "食盆 ROI", "en-US": "Food ROI" },
  "inventory.gnaw_roi": { "zh-CN": "磨牙区 ROI", "en-US": "Gnaw ROI" },
  "inventory.low_water_threshold": { "zh-CN": "低水位阈值", "en-US": "Low Water Threshold" },
  "inventory.low_food_threshold": { "zh-CN": "低食量阈值", "en-US": "Low Food Threshold" },
  "alerts.escape_enabled": { "zh-CN": "启用越界告警", "en-US": "Enable Escape Alerts" },
  "alerts.mac_notifier_command": { "zh-CN": "macOS 通知命令", "en-US": "macOS Notifier Command" },
  "alerts.max_stereotypy_index": { "zh-CN": "刻板行为指数上限", "en-US": "Max Stereotypy Index" },
  "alerts.max_weight_change_ratio": { "zh-CN": "体型变化比例上限", "en-US": "Max Weight Change Ratio" },
  "frontend.refresh_interval_seconds": { "zh-CN": "前端刷新间隔 (秒)", "en-US": "Frontend Refresh Interval (s)" },
  "frontend.history_minutes": { "zh-CN": "历史窗口 (分钟)", "en-US": "History Window (min)" },
  "frontend.default_language": { "zh-CN": "默认语言", "en-US": "Default Language" },
  "frontend.available_languages": { "zh-CN": "可用语言", "en-US": "Available Languages" },
  "logging.level": { "zh-CN": "日志级别", "en-US": "Log Level" },
  "logging.file_path": { "zh-CN": "日志文件路径", "en-US": "Log File Path" },
  "logging.max_bytes": { "zh-CN": "单文件最大字节数", "en-US": "Max Bytes Per File" },
  "logging.backup_count": { "zh-CN": "日志备份数量", "en-US": "Backup File Count" },
  "logging.console_enabled": { "zh-CN": "控制台输出", "en-US": "Console Output" },
};

const SETTINGS_FIELD_OPTIONS = {
  "app.timezone": ["Asia/Shanghai", "America/Los_Angeles", "UTC", "Europe/London", "Asia/Tokyo"],
  "app.run_mode": [
    { value: "demo", labelKey: "mode_demo" },
    { value: "real", labelKey: "mode_real" },
  ],
  "app.demo_source": [
    { value: "virtual", labelKey: "source_virtual" },
    { value: "uploaded_video", labelKey: "source_uploaded_video" },
  ],
  "video.fps": [5, 8, 10, 12, 15, 24, 30],
  "video.frame_width": [320, 480, 640, 960, 1280, 1920],
  "video.frame_height": [180, 270, 360, 540, 720, 1080],
  "video.snapshot_interval_seconds": [60, 120, 300, 600, 900, 1800],
  "runtime.profile": [
    { value: "rpi_zero2w", label: { "zh-CN": "Pi Zero 2W 低内存", "en-US": "Pi Zero 2W (Low Memory)" } },
    { value: "default", label: { "zh-CN": "默认", "en-US": "Default" } },
    { value: "high_performance", label: { "zh-CN": "高性能", "en-US": "High Performance" } },
  ],
  "runtime.process_every_nth_frame": [1, 2, 3, 4, 5, 6, 8, 10],
  "runtime.max_frame_results": [120, 240, 320, 480, 720, 1440],
  "runtime.analysis_scale": [0.25, 0.33, 0.5, 0.67, 0.75, 1],
  "runtime.max_analysis_width": [320, 480, 640, 960, 1280],
  "runtime.max_analysis_height": [180, 270, 360, 540, 720],
  "runtime.max_fps": [5, 8, 10, 12, 15, 20, 24, 30],
  "motion_trigger.downscale_width": [160, 240, 320, 480, 640],
  "motion_trigger.blur_kernel": [3, 5, 7, 9, 11],
  "motion_trigger.diff_threshold": [12, 18, 24, 30, 36, 48],
  "motion_trigger.start_trigger_frames": [1, 2, 3, 4, 5],
  "motion_trigger.stop_trigger_frames": [5, 10, 15, 20, 30, 45],
  "motion_trigger.min_capture_seconds": [0.5, 1, 1.5, 2, 3, 5],
  "motion_trigger.cool_down_seconds": [0, 0.5, 1, 2, 3, 5],
  "motion_trigger.output_fps": [5, 8, 10, 12, 15, 24, 30],
  "motion_trigger.codec": [
    { value: "mp4v", label: { "zh-CN": "MP4V（通用）", "en-US": "MP4V (Generic)" } },
    { value: "avc1", label: { "zh-CN": "AVC1（H.264）", "en-US": "AVC1 (H.264)" } },
    { value: "XVID", label: { "zh-CN": "XVID", "en-US": "XVID" } },
    { value: "MJPG", label: { "zh-CN": "MJPG", "en-US": "MJPG" } },
  ],
  "environment.sample_every_nth_frame": [1, 2, 3, 5, 8, 10],
  "environment.low_light_threshold": [0.1, 0.15, 0.2, 0.22, 0.25, 0.3],
  "environment.high_light_threshold": [0.75, 0.8, 0.85, 0.9, 0.95],
  "environment.hygiene_dark_ratio_threshold": [0.1, 0.15, 0.2, 0.24, 0.3, 0.35],
  "environment.clutter_edge_threshold": [0.1, 0.15, 0.18, 0.22, 0.25, 0.3],
  "wheel.diameter_cm": [12, 14, 16, 18, 20, 22, 24],
  "wheel.min_rpm_for_running": [4, 6, 8, 10, 12, 15, 18],
  "health.capture_interval_seconds": [300, 600, 900, 1200, 1800, 3600],
  "health.baseline_body_area_px": [12000, 15000, 18000, 22000, 26000, 30000],
  "health.vlm.provider": [
    { value: "openai", label: { "zh-CN": "OpenAI", "en-US": "OpenAI" } },
    { value: "azure_openai", label: { "zh-CN": "Azure OpenAI", "en-US": "Azure OpenAI" } },
    { value: "anthropic", label: { "zh-CN": "Anthropic", "en-US": "Anthropic" } },
    { value: "google", label: { "zh-CN": "Google", "en-US": "Google" } },
  ],
  "health.vlm.timeout_seconds": [10, 15, 20, 30, 45, 60],
  "inventory.low_water_threshold": [0.1, 0.15, 0.2, 0.25, 0.3, 0.35, 0.4],
  "inventory.low_food_threshold": [0.1, 0.15, 0.2, 0.25, 0.3, 0.35, 0.4],
  "alerts.mac_notifier_command": ["terminal-notifier", "osascript", ""],
  "alerts.max_stereotypy_index": [0.4, 0.5, 0.6, 0.7, 0.8, 0.9],
  "alerts.max_weight_change_ratio": [0.05, 0.08, 0.1, 0.12, 0.15, 0.2],
  "frontend.refresh_interval_seconds": [5, 10, 15, 20, 30, 45, 60],
  "frontend.history_minutes": [60, 120, 360, 720, 1440, 2880],
  "logging.level": ["DEBUG", "INFO", "WARNING", "ERROR", "CRITICAL"],
  "logging.max_bytes": [1048576, 2097152, 5242880, 10485760, 20971520],
  "logging.backup_count": [1, 3, 5, 7, 10],
};

const LANGUAGE_LABELS = {
  "zh-CN": { "zh-CN": "简体中文", "en-US": "Chinese (Simplified)" },
  "en-US": { "zh-CN": "英语", "en-US": "English" },
};

const initState = {
  activeIndex: 0,
  image: null,
  polygons: {},
  closed: {},
  frameWidth: 0,
  frameHeight: 0,
  canvas: null,
  ctx: null,
};

const INIT_CANVAS_MAX_HEIGHT_RATIO_DESKTOP = 0.72;
const INIT_CANVAS_MAX_HEIGHT_RATIO_MOBILE = 0.45;

let settingsRawConfig = null;
let settingsWorkingConfig = null;
let settingsActiveSectionId = "app";

function t(key) {
  const table = I18N[currentLanguage] || I18N["zh-CN"];
  return table[key] ?? I18N["zh-CN"][key] ?? key;
}

function formatText(key, params = {}) {
  let text = t(key);
  for (const [name, value] of Object.entries(params)) {
    text = text.replaceAll(`{${name}}`, String(value));
  }
  return text;
}

function deepClone(value) {
  if (typeof structuredClone === "function") {
    return structuredClone(value);
  }
  return JSON.parse(JSON.stringify(value));
}

function escapeHtml(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function tOrDefault(key, fallback) {
  const value = t(key);
  return value === key ? fallback : value;
}

function humanizeKey(key) {
  return String(key || "")
    .replaceAll("_", " ")
    .replaceAll(".", " ");
}

function getByPath(obj, path) {
  if (!obj || !path) {
    return obj;
  }
  return path.split(".").reduce((acc, key) => (acc && typeof acc === "object" ? acc[key] : undefined), obj);
}

function setByPath(obj, path, value) {
  if (!obj || !path) {
    return;
  }
  const parts = path.split(".");
  let cursor = obj;
  for (let i = 0; i < parts.length - 1; i += 1) {
    const key = parts[i];
    if (!cursor[key] || typeof cursor[key] !== "object") {
      cursor[key] = {};
    }
    cursor = cursor[key];
  }
  cursor[parts[parts.length - 1]] = value;
}

function getSettingsSectionDef(id = settingsActiveSectionId) {
  return SETTINGS_SECTIONS.find((item) => item.id === id) || SETTINGS_SECTIONS[0];
}

function localizedMetaLabel(table) {
  if (!table || typeof table !== "object" || Array.isArray(table)) {
    return "";
  }
  return table[currentLanguage] || table["zh-CN"] || table["en-US"] || "";
}

function settingsFieldLabel(path) {
  const mapped = localizedMetaLabel(SETTINGS_FIELD_LABELS[path]);
  if (mapped) {
    return mapped;
  }
  const key = `settings_field_${path.replaceAll(".", "_")}`;
  const fallback = humanizeKey(path.split(".").pop());
  return tOrDefault(key, fallback);
}

function settingsFieldKind(path, value) {
  if (
    path === "frontend.available_languages" &&
    Array.isArray(value) &&
    value.every((item) => typeof item === "string")
  ) {
    return "language-array";
  }
  if (typeof value === "boolean") {
    return "boolean";
  }
  if (typeof value === "number") {
    return "number";
  }
  if (typeof value === "string") {
    return "string";
  }
  return "json";
}

function normalizeFieldOption(option) {
  if (option && typeof option === "object" && Object.prototype.hasOwnProperty.call(option, "value")) {
    return option;
  }
  return { value: option };
}

function settingsOptionValueEquals(a, b, kind) {
  if (kind === "number") {
    const aNum = Number(a);
    const bNum = Number(b);
    if (Number.isFinite(aNum) && Number.isFinite(bNum)) {
      return aNum === bNum;
    }
  }
  return String(a) === String(b);
}

function settingsOptionLabel(option) {
  if (option.labelKey) {
    return t(option.labelKey);
  }
  if (typeof option.label === "string") {
    return option.label;
  }
  const localized = localizedMetaLabel(option.label);
  if (localized) {
    return localized;
  }
  if (option.value === "") {
    return currentLanguage === "zh-CN" ? "禁用通知命令" : "Disable notifier command";
  }
  return String(option.value ?? "");
}

function settingsFieldOptions(path, kind, value) {
  if (kind !== "string" && kind !== "number") {
    return null;
  }

  let rawOptions = SETTINGS_FIELD_OPTIONS[path];
  if (path === "frontend.default_language") {
    const languagePool = Array.isArray(availableLanguages) && availableLanguages.length
      ? availableLanguages
      : ["zh-CN", "en-US"];
    rawOptions = Array.from(new Set(languagePool)).map((langCode) => ({
      value: langCode,
      label: localizedMetaLabel(LANGUAGE_LABELS[langCode]) || langCode,
    }));
  }

  if (!Array.isArray(rawOptions) || rawOptions.length === 0) {
    return null;
  }

  const options = rawOptions.map(normalizeFieldOption);
  if (
    value !== undefined &&
    value !== null &&
    !options.some((option) => settingsOptionValueEquals(option.value, value, kind))
  ) {
    options.push({
      value,
      label: currentLanguage === "zh-CN" ? `当前值：${String(value)}` : `Current: ${String(value)}`,
    });
  }

  return options;
}

function languageDisplayName(code) {
  return localizedMetaLabel(LANGUAGE_LABELS[code]) || code;
}

function renderSettingsSelectField(value, kind, label, pathText, options) {
  const isInteger = kind === "number" ? Number.isInteger(value) : false;
  const integerAttr = kind === "number" ? ` data-setting-integer="${isInteger ? "true" : "false"}"` : "";
  const optionHtml = options
    .map((option) => {
      const selected = settingsOptionValueEquals(option.value, value, kind) ? "selected" : "";
      const optionValue = escapeHtml(String(option.value ?? ""));
      const optionLabel = escapeHtml(settingsOptionLabel(option));
      return `<option value="${optionValue}" ${selected}>${optionLabel}</option>`;
    })
    .join("");

  return `
    <div class="settings-form-row">
      <label class="settings-label" for="field-${pathText}">${escapeHtml(label)}</label>
      <div class="settings-form-subkey">${pathText}</div>
      <select
        id="field-${pathText}"
        class="settings-select"
        data-setting-path="${pathText}"
        data-setting-kind="${kind}"${integerAttr}
      >
        ${optionHtml}
      </select>
    </div>
  `;
}

function renderLanguageArrayField(value, label, pathText) {
  const selected = Array.isArray(value) ? value : [];
  const options = Array.from(
    new Set([
      "zh-CN",
      "en-US",
      ...(Array.isArray(availableLanguages) ? availableLanguages : []),
      ...selected,
    ])
  );

  const checkHtml = options
    .map((code) => {
      const checked = selected.includes(code) ? "checked" : "";
      return `
        <label class="settings-check-item">
          <input type="checkbox" value="${escapeHtml(code)}" ${checked} />
          <span>${escapeHtml(languageDisplayName(code))}</span>
          <span class="settings-check-code">${escapeHtml(code)}</span>
        </label>
      `;
    })
    .join("");

  return `
    <div class="settings-form-row">
      <label class="settings-label">${escapeHtml(label)}</label>
      <div class="settings-form-subkey">${pathText}</div>
      <div class="settings-check-list" data-setting-path="${pathText}" data-setting-kind="language-array">
        ${checkHtml}
      </div>
    </div>
  `;
}

function renderSettingsField(path, value) {
  const kind = settingsFieldKind(path, value);
  const label = settingsFieldLabel(path);
  const pathText = escapeHtml(path);
  const options = settingsFieldOptions(path, kind, value);

  if (kind === "language-array") {
    return renderLanguageArrayField(value, label, pathText);
  }

  if (kind === "boolean") {
    return `
      <div class="settings-form-row">
        <label class="settings-label" for="field-${pathText}">${escapeHtml(label)}</label>
        <div class="settings-form-subkey">${pathText}</div>
        <select id="field-${pathText}" class="settings-select" data-setting-path="${pathText}" data-setting-kind="boolean">
          <option value="true" ${value ? "selected" : ""}>${t("settings_bool_true")}</option>
          <option value="false" ${value ? "" : "selected"}>${t("settings_bool_false")}</option>
        </select>
      </div>
    `;
  }

  if (options) {
    return renderSettingsSelectField(value, kind, label, pathText, options);
  }

  if (kind === "number") {
    const isInteger = Number.isInteger(value);
    return `
      <div class="settings-form-row">
        <label class="settings-label" for="field-${pathText}">${escapeHtml(label)}</label>
        <div class="settings-form-subkey">${pathText}</div>
        <input
          id="field-${pathText}"
          class="settings-select"
          type="number"
          step="${isInteger ? "1" : "0.001"}"
          value="${escapeHtml(String(value))}"
          data-setting-path="${pathText}"
          data-setting-kind="number"
          data-setting-integer="${isInteger ? "true" : "false"}"
        />
      </div>
    `;
  }

  if (kind === "string") {
    return `
      <div class="settings-form-row">
        <label class="settings-label" for="field-${pathText}">${escapeHtml(label)}</label>
        <div class="settings-form-subkey">${pathText}</div>
        <input
          id="field-${pathText}"
          class="settings-select"
          type="text"
          value="${escapeHtml(value)}"
          data-setting-path="${pathText}"
          data-setting-kind="string"
        />
      </div>
    `;
  }

  return `
    <div class="settings-form-row">
      <label class="settings-label" for="field-${pathText}">${escapeHtml(label)}</label>
      <div class="settings-form-subkey">${pathText}</div>
      <textarea
        id="field-${pathText}"
        class="settings-form-textarea"
        spellcheck="false"
        data-setting-path="${pathText}"
        data-setting-kind="json"
      >${escapeHtml(JSON.stringify(value, null, 2))}</textarea>
    </div>
  `;
}

function renderSettingsSectionList() {
  const list = document.getElementById("settings-section-list");
  if (!list) {
    return;
  }

  list.innerHTML = SETTINGS_SECTIONS.map((item) => {
    const active = item.id === settingsActiveSectionId ? "active" : "";
    return `<button type="button" class="settings-section-item ${active}" data-section-id="${item.id}">${t(item.labelKey)}</button>`;
  }).join("");
}

function renderSettingsSectionContent() {
  const def = getSettingsSectionDef();
  const titleNode = document.getElementById("settings-section-title");
  const descNode = document.getElementById("settings-section-desc");
  const formNode = document.getElementById("settings-config-form");

  if (!titleNode || !descNode || !formNode) {
    return;
  }

  titleNode.textContent = t(def.labelKey);
  descNode.textContent = t(def.descKey);

  if (def.special === "demo_tools") {
    formNode.innerHTML = `<div class="settings-form-empty">${t("settings_section_demo_tools_desc")}</div>`;
    updateUploadBlockVisibility();
    return;
  }

  const sectionValue = getByPath(settingsWorkingConfig, def.path);
  if (!sectionValue || typeof sectionValue !== "object" || Array.isArray(sectionValue)) {
    formNode.innerHTML = `<div class="settings-form-empty">${t("settings_form_empty")}</div>`;
    updateUploadBlockVisibility();
    return;
  }

  const keys = Array.isArray(def.includeKeys) ? def.includeKeys : Object.keys(sectionValue);
  if (keys.length === 0) {
    formNode.innerHTML = `<div class="settings-form-empty">${t("settings_form_empty")}</div>`;
    updateUploadBlockVisibility();
    return;
  }

  formNode.innerHTML = keys
    .map((key) => {
      const value = sectionValue[key];
      const path = def.path ? `${def.path}.${key}` : key;
      return renderSettingsField(path, value);
    })
    .join("");
  updateUploadBlockVisibility();
}

function commitCurrentSectionEdits() {
  const status = document.getElementById("settings-status");
  const def = getSettingsSectionDef();
  if (!settingsWorkingConfig || !def || def.special === "demo_tools") {
    return true;
  }

  const formNode = document.getElementById("settings-config-form");
  if (!formNode) {
    return true;
  }

  const controls = Array.from(formNode.querySelectorAll("[data-setting-path]"));
  try {
    controls.forEach((node) => {
      const path = node.getAttribute("data-setting-path");
      const kind = node.getAttribute("data-setting-kind");
      if (!path) {
        return;
      }

      let parsedValue = node.value;
      if (kind === "boolean") {
        parsedValue = node.value === "true";
      } else if (kind === "number") {
        const raw = String(node.value || "").trim();
        if (!raw.length) {
          throw new Error(`${settingsFieldLabel(path)}: ${t("settings_invalid_number")}`);
        }
        const num = Number(raw);
        if (!Number.isFinite(num)) {
          throw new Error(`${settingsFieldLabel(path)}: ${t("settings_invalid_number")}`);
        }
        parsedValue = node.getAttribute("data-setting-integer") === "true" ? Math.round(num) : num;
      } else if (kind === "language-array") {
        const checked = Array.from(node.querySelectorAll("input[type='checkbox']:checked"))
          .map((item) => item.value)
          .filter(Boolean);
        if (checked.length === 0) {
          throw new Error(
            `${settingsFieldLabel(path)}: ${currentLanguage === "zh-CN" ? "至少选择一种语言" : "Select at least one language"}`
          );
        }
        parsedValue = checked;
      } else if (kind === "json") {
        parsedValue = JSON.parse(node.value);
      }

      setByPath(settingsWorkingConfig, path, parsedValue);
    });

    const langs = settingsWorkingConfig?.frontend?.available_languages;
    if (Array.isArray(langs) && langs.length > 0) {
      availableLanguages = langs;
    }
    syncModeFromRaw(settingsWorkingConfig);
  } catch (err) {
    status.textContent = formatText("settings_status_save_fail", { error: String(err.message || err) });
    return false;
  }

  return true;
}

function switchSettingsSection(nextId) {
  if (nextId === settingsActiveSectionId) {
    return;
  }
  if (!commitCurrentSectionEdits()) {
    return;
  }
  settingsActiveSectionId = nextId;
  renderSettingsSectionList();
  renderSettingsSectionContent();
}

function setLanguage(language) {
  const supported = availableLanguages.includes(language) ? language : "zh-CN";
  currentLanguage = supported;
  document.documentElement.lang = supported;
  document.title = t("page_title");
  applyStaticI18n();

  if (lastDashboardData) {
    renderDashboard(lastDashboardData);
  }
  renderInitSteps();
}

function applyStaticI18n() {
  document.querySelectorAll("[data-i18n]").forEach((node) => {
    const key = node.getAttribute("data-i18n");
    if (key) {
      node.textContent = t(key);
    }
  });

  const autoBtn = document.getElementById("toggle-auto-btn");
  autoBtn.textContent = autoRefresh ? t("btn_auto_on") : t("btn_auto_off");
  updateModeSelectorsLabel();
  renderSettingsSectionList();
  renderSettingsSectionContent();
  renderUploadedVideoSelector();
  updateUploadBlockVisibility();
}

function updateModeSelectorsLabel() {
  const runModeSelect = document.getElementById("settings-run-mode");
  if (runModeSelect) {
    runModeSelect.innerHTML = `
      <option value="demo">${t("mode_demo")}</option>
      <option value="real">${t("mode_real")}</option>
    `;
    runModeSelect.value = currentRunMode;
  }

  const sourceSelect = document.getElementById("settings-demo-source");
  if (sourceSelect) {
    sourceSelect.innerHTML = `
      <option value="virtual">${t("source_virtual")}</option>
      <option value="uploaded_video">${t("source_uploaded_video")}</option>
    `;
    sourceSelect.value = currentDemoSource;
  }
}

function formatUploadedVideoOption(item) {
  const name = item.display_name || item.video_key || "";
  const meta = [];
  if (Number(item.size_bytes) > 0) {
    meta.push(`${formatMb(item.size_bytes)}MB`);
  }
  if (item.modified_at) {
    const timeText = new Date(item.modified_at).toLocaleString();
    if (timeText && timeText !== "Invalid Date") {
      meta.push(timeText);
    }
  }
  const activeText = item.is_active ? ` (${t("upload_history_current")})` : "";
  if (meta.length === 0) {
    return `${name}${activeText}`;
  }
  return `${name}${activeText} · ${meta.join(" · ")}`;
}

function renderUploadedVideoSelector() {
  const select = document.getElementById("settings-uploaded-select");
  if (!select) {
    return;
  }

  const list = Array.isArray(uploadedVideos) ? uploadedVideos : [];
  if (list.length === 0) {
    select.innerHTML = `<option value="">${escapeHtml(t("upload_history_none"))}</option>`;
    select.value = "";
    return;
  }

  select.innerHTML = list
    .map((item) => {
      const key = String(item.video_key || "");
      const label = formatUploadedVideoOption(item);
      return `<option value="${escapeHtml(key)}">${escapeHtml(label)}</option>`;
    })
    .join("");

  const preferred = uploadedVideoKey && list.some((item) => item.video_key === uploadedVideoKey)
    ? uploadedVideoKey
    : String(list[0].video_key || "");
  select.value = preferred;
}

function updateUploadBlockVisibility() {
  const block = document.getElementById("settings-upload-block");
  const status = document.getElementById("settings-upload-status");
  const uploadBtn = document.getElementById("settings-upload");
  const analyzeBtn = document.getElementById("settings-analyze");
  const useUploadedBtn = document.getElementById("settings-use-uploaded");
  const uploadedSelect = document.getElementById("settings-uploaded-select");
  if (!block || !status) {
    return;
  }

  renderUploadedVideoSelector();

  const hasUploadedOptions = Array.isArray(uploadedVideos) && uploadedVideos.length > 0;

  const inDemoToolSection = settingsActiveSectionId === "demo_tools";
  block.classList.toggle("hidden", !inDemoToolSection);

  if (!inDemoToolSection) {
    status.textContent = "";
    if (uploadBtn) uploadBtn.disabled = false;
    if (analyzeBtn) analyzeBtn.disabled = false;
    if (useUploadedBtn) useUploadedBtn.disabled = false;
    if (uploadedSelect) uploadedSelect.disabled = false;
    return;
  }

  const modeReady = currentRunMode === "demo" && currentDemoSource === "uploaded_video";
  if (!modeReady) {
    status.textContent = t("settings_demo_tools_hint");
    if (uploadBtn) uploadBtn.disabled = true;
    if (analyzeBtn) analyzeBtn.disabled = true;
    if (useUploadedBtn) useUploadedBtn.disabled = true;
    if (uploadedSelect) uploadedSelect.disabled = true;
    return;
  }

  if (uploadBtn) uploadBtn.disabled = false;
  if (analyzeBtn) analyzeBtn.disabled = false;
  if (uploadedSelect) uploadedSelect.disabled = !hasUploadedOptions;
  if (useUploadedBtn) {
    const hasSelection = Boolean(uploadedSelect?.value);
    useUploadedBtn.disabled = !hasUploadedOptions || !hasSelection;
  }

  if (!uploadedVideoName) {
    status.textContent = t("upload_status_none");
    return;
  }

  status.textContent = uploadedZoneRequired
    ? formatText("upload_status_uploaded_need_init", { name: uploadedVideoName })
    : formatText("upload_status_uploaded", { name: uploadedVideoName });
}

function fmtNumber(value, digits = 2) {
  return Number(value ?? 0).toFixed(digits);
}

function pct(value, digits = 1) {
  return `${(Number(value ?? 0) * 100).toFixed(digits)}%`;
}

function toHour(ts) {
  const d = new Date(ts);
  const h = String(d.getHours()).padStart(2, "0");
  const m = String(d.getMinutes()).padStart(2, "0");
  return `${h}:${m}`;
}

function severityLabel(level) {
  if (level === "high") return t("level_high");
  if (level === "medium") return t("level_medium");
  if (level === "low") return t("level_low");
  return t("level_info");
}

function alertTypeLabel(type) {
  const key = `alert_type_${type}`;
  const translated = t(key);
  return translated === key ? type : translated;
}

function alertMessageLabel(item) {
  const key = `alert_msg_${item.type}`;
  const translated = t(key);
  return translated === key ? item.message : translated;
}

function statusMessageLabel(message) {
  const mapping = {
    "real mode reserved": "mode_real_reserved",
    "upload a video then analyze": "status_upload_then_analyze",
    "no uploaded video": "status_upload_then_analyze",
    "no analyzable frames": "status_no_frames",
    "video analyzed": "status_video_analyzed",
  };
  const key = mapping[message];
  return key ? t(key) : message;
}

function initCharts() {
  for (const id of chartIds) {
    const node = document.getElementById(id);
    if (node) {
      charts[id] = echarts.init(node, null, { renderer: "canvas" });
    }
  }
}

function renderKpis(summary = {}) {
  const kpiGrid = document.getElementById("kpi-grid");
  const entries = [
    [t("kpi_distance"), `${fmtNumber(summary.distance_km_24h, 2)} km`, t("hint_wheel")],
    [t("kpi_patrol"), `${fmtNumber(summary.patrol_length_m_24h, 1)} m`, t("hint_floor")],
    [t("kpi_avg_speed"), `${fmtNumber(summary.avg_speed_kmh, 2)} km/h`, t("hint_rolling")],
    [t("kpi_max_speed"), `${fmtNumber(summary.max_speed_kmh, 2)} km/h`, t("hint_peak")],
    [t("kpi_run_ratio"), pct(summary.running_ratio), t("hint_active")],
    [t("kpi_reverse_ratio"), pct(summary.reverse_ratio), t("hint_diversity")],
    [t("kpi_water"), pct(summary.water_level_ratio), t("hint_inventory")],
    [t("kpi_food"), pct(summary.food_coverage_ratio), t("hint_inventory")],
    [t("kpi_anxiety"), pct(summary.anxiety_index), t("hint_behavior")],
    [t("kpi_health"), String(summary.health_risk_level || "unknown").toUpperCase(), t("hint_health")],
    [t("kpi_env"), pct(summary.environment_comfort_index), t("hint_env")],
    [t("kpi_capture"), `${summary.capture_segments ?? 0}`, t("hint_motion")],
  ];

  kpiGrid.innerHTML = entries
    .map(
      ([name, value, hint], i) => `
        <article class="kpi-card" style="animation-delay:${Math.min(i * 0.05, 0.45)}s">
          <p class="kpi-name">${name}</p>
          <p class="kpi-value">${value}</p>
          <p class="kpi-hint">${hint}</p>
        </article>
      `
    )
    .join("");
}

function setCommonChartStyle(option) {
  return {
    animationDuration: 500,
    animationEasing: "cubicOut",
    textStyle: { color: "#d8e7e5", fontFamily: "Space Grotesk" },
    grid: { left: 38, right: 20, top: 34, bottom: 34 },
    tooltip: { trigger: "axis" },
    ...option,
  };
}

function renderOdometer(data) {
  const ts = data.timeseries || [];
  const labels = ts.map((x) => toHour(x.timestamp));
  const speed = ts.map((x) => x.speed_kmh);
  const rpm = ts.map((x) => x.rpm);
  const streak = ts.map((x) => x.running_streak_min);

  charts["chart-speed-rpm"].setOption(
    setCommonChartStyle({
      xAxis: { type: "category", data: labels, axisLabel: { color: "#9ec5bf", interval: 120 } },
      yAxis: [
        { type: "value", name: "km/h", splitLine: { lineStyle: { color: "rgba(255,255,255,0.08)" } } },
        { type: "value", name: "RPM" },
      ],
      series: [
        {
          name: t("legend_speed"),
          type: "line",
          smooth: true,
          data: speed,
          showSymbol: false,
          lineStyle: { width: 2, color: "#3cc6a8" },
          areaStyle: { color: "rgba(60,198,168,0.17)" },
        },
        {
          name: t("legend_rpm"),
          type: "line",
          yAxisIndex: 1,
          smooth: true,
          data: rpm,
          showSymbol: false,
          lineStyle: { width: 1.8, color: "#ffbf5b" },
        },
      ],
      legend: { data: [t("legend_speed"), t("legend_rpm")], textStyle: { color: "#a0c8c2" } },
    })
  );

  const hourly = data.odometer?.hourly || [];
  charts["chart-hourly-distance"].setOption(
    setCommonChartStyle({
      xAxis: { type: "category", data: hourly.map((x) => x.hour), axisLabel: { color: "#9ec5bf" } },
      yAxis: [
        { type: "value", name: "km" },
        { type: "value", name: "switches" },
      ],
      series: [
        {
          type: "bar",
          name: t("legend_distance"),
          data: hourly.map((x) => x.distance_km),
          itemStyle: { color: "#4aa3ff", borderRadius: [5, 5, 0, 0] },
        },
        {
          type: "line",
          name: t("legend_stop_go"),
          yAxisIndex: 1,
          data: hourly.map((x) => x.stop_go_events),
          smooth: true,
          lineStyle: { color: "#ff7b66" },
          showSymbol: false,
        },
      ],
      legend: { data: [t("legend_distance"), t("legend_stop_go")], textStyle: { color: "#a0c8c2" } },
    })
  );

  const direction = data.odometer?.direction_distribution || { forward: 0, reverse: 0, idle: 0 };
  charts["chart-direction"].setOption({
    animationDuration: 500,
    tooltip: { trigger: "item" },
    legend: { bottom: 0, textStyle: { color: "#b9d7d2" } },
    series: [
      {
        type: "pie",
        radius: ["32%", "68%"],
        center: ["50%", "46%"],
        data: [
          { name: t("dir_forward"), value: direction.forward, itemStyle: { color: "#3cc6a8" } },
          { name: t("dir_reverse"), value: direction.reverse, itemStyle: { color: "#ffbf5b" } },
          { name: t("dir_idle"), value: direction.idle, itemStyle: { color: "#4aa3ff" } },
        ],
        label: { color: "#e4f2ee" },
      },
    ],
  });

  charts["chart-running-streak"].setOption(
    setCommonChartStyle({
      xAxis: { type: "category", data: labels, axisLabel: { interval: 120, color: "#9ec5bf" } },
      yAxis: { type: "value", name: "min" },
      series: [
        {
          type: "line",
          smooth: true,
          showSymbol: false,
          data: streak,
          lineStyle: { color: "#7fe0cf", width: 2 },
          areaStyle: { color: "rgba(127,224,207,0.2)" },
        },
      ],
    })
  );
}

function renderSpatial(data) {
  const spatial = data.spatial || {};
  const heat = spatial.heatmap || [];
  const rows = spatial.heatmap_rows || 0;
  const cols = spatial.heatmap_cols || 0;

  const heatData = [];
  for (let r = 0; r < rows; r += 1) {
    for (let c = 0; c < cols; c += 1) {
      // ECharts category y-axis is bottom-up by default; map row 0 (image top) to chart top.
      heatData.push([c, rows - 1 - r, heat[r]?.[c] ?? 0]);
    }
  }

  charts["chart-heatmap"].setOption({
    animationDuration: 500,
    tooltip: { position: "top" },
    grid: { left: 42, right: 14, top: 18, bottom: 30 },
    xAxis: { type: "category", data: Array.from({ length: cols }, (_, i) => i), show: false },
    yAxis: { type: "category", data: Array.from({ length: rows }, (_, i) => i), show: false },
    visualMap: {
      min: 0,
      max: 1,
      orient: "horizontal",
      left: "center",
      bottom: 0,
      textStyle: { color: "#bdd7d0" },
      inRange: { color: ["#092033", "#0f5f6f", "#22a699", "#ffe08a", "#ff8b66"] },
    },
    series: [{ type: "heatmap", data: heatData, emphasis: { itemStyle: { shadowBlur: 8, shadowColor: "rgba(0,0,0,0.4)" } } }],
  });

  const trajectory = (spatial.trajectory || []).map((p) => [p.x, p.y]);
  charts["chart-trajectory"].setOption({
    animationDuration: 500,
    grid: { left: 42, right: 14, top: 26, bottom: 30 },
    xAxis: { type: "value", min: 0, max: data.meta.frame_width, axisLabel: { color: "#9ec5bf" } },
    yAxis: { type: "value", min: 0, max: data.meta.frame_height, inverse: true, axisLabel: { color: "#9ec5bf" } },
    tooltip: { trigger: "item" },
    series: [
      { type: "line", data: trajectory, showSymbol: false, lineStyle: { color: "#4aa3ff", width: 1.6, opacity: 0.82 } },
      { type: "scatter", data: trajectory, symbolSize: 2, itemStyle: { color: "#3cc6a8", opacity: 0.55 } },
    ],
  });

  const ratio = spatial.zone_dwell_ratio || {};
  charts["chart-zone-dwell"].setOption({
    animationDuration: 500,
    tooltip: { trigger: "item" },
    legend: { bottom: 0, textStyle: { color: "#a7c9c3" } },
    series: [
      {
        type: "pie",
        center: ["50%", "46%"],
        radius: ["28%", "66%"],
        data: [
          { name: t("zone_food"), value: ratio.food_zone ?? 0, itemStyle: { color: "#ffbf5b" } },
          { name: t("zone_sand"), value: ratio.sand_bath_zone ?? 0, itemStyle: { color: "#4aa3ff" } },
          { name: t("zone_hideout"), value: ratio.hideout_zone ?? 0, itemStyle: { color: "#3cc6a8" } },
        ],
        label: { formatter: ({ name, value }) => `${name}: ${(value * 100).toFixed(1)}%`, color: "#dcebe8" },
      },
    ],
  });

  const escapeEvents = spatial.escape_events || [];
  charts["chart-escape"].setOption(
    setCommonChartStyle({
      xAxis: { type: "category", data: escapeEvents.map((e) => toHour(e.timestamp)), axisLabel: { color: "#9ec5bf" } },
      yAxis: { type: "value", name: t("axis_events") },
      series: [{ type: "bar", data: escapeEvents.map(() => 1), itemStyle: { color: "#ff6b63", borderRadius: [5, 5, 0, 0] }, barMaxWidth: 18 }],
    })
  );
}

function renderHealth(data) {
  const scans = data.health?.scans || [];
  const latest = data.health?.latest;

  if (!latest) {
    charts["chart-health-radar"].clear();
    charts["chart-health-trend"].clear();
    return;
  }

  charts["chart-health-radar"].setOption({
    animationDuration: 500,
    radar: {
      indicator: [
        { name: t("legend_fur"), max: 1 },
        { name: t("legend_expression"), max: 1 },
        { name: t("legend_gait"), max: 1 },
        { name: t("legend_volume"), max: 1 },
      ],
      splitLine: { lineStyle: { color: "rgba(180,215,209,0.2)" } },
      axisLine: { lineStyle: { color: "rgba(180,215,209,0.2)" } },
      splitArea: { areaStyle: { color: ["rgba(255,255,255,0.01)"] } },
    },
    series: [
      {
        type: "radar",
        data: [
          {
            value: [latest.fur_score, latest.expression_score, latest.gait_symmetry_score, Math.max(0, 1 - Math.abs(latest.volume_change_ratio))],
            areaStyle: { color: "rgba(60,198,168,0.25)" },
            lineStyle: { color: "#3cc6a8" },
            itemStyle: { color: "#3cc6a8" },
          },
        ],
      },
    ],
  });

  charts["chart-health-trend"].setOption(
    setCommonChartStyle({
      xAxis: { type: "category", data: scans.map((x) => toHour(x.timestamp)), axisLabel: { color: "#9ec5bf" } },
      yAxis: [
        { type: "value", min: 0, max: 1, name: t("axis_scores") },
        { type: "value", min: -0.3, max: 0.3, name: t("axis_volume") },
      ],
      legend: { data: [t("legend_fur"), t("legend_expression"), t("legend_gait"), t("legend_volume")], textStyle: { color: "#a0c8c2" } },
      series: [
        { type: "line", name: t("legend_fur"), showSymbol: false, smooth: true, data: scans.map((x) => x.fur_score), lineStyle: { color: "#3cc6a8" } },
        { type: "line", name: t("legend_expression"), showSymbol: false, smooth: true, data: scans.map((x) => x.expression_score), lineStyle: { color: "#4aa3ff" } },
        { type: "line", name: t("legend_gait"), showSymbol: false, smooth: true, data: scans.map((x) => x.gait_symmetry_score), lineStyle: { color: "#ffbf5b" } },
        { type: "line", name: t("legend_volume"), yAxisIndex: 1, showSymbol: false, smooth: true, data: scans.map((x) => x.volume_change_ratio), lineStyle: { color: "#ff7b66" } },
      ],
    })
  );
}

function renderInventory(data) {
  const water = data.inventory?.water_series || [];
  const food = data.inventory?.food_series || [];
  const gnaw = data.inventory?.gnaw_series || [];

  charts["chart-resource"].setOption(
    setCommonChartStyle({
      xAxis: { type: "category", data: water.map((x) => toHour(x.timestamp)), axisLabel: { color: "#9ec5bf", interval: 120 } },
      yAxis: { type: "value", min: 0, max: 1 },
      legend: { data: [t("legend_water"), t("legend_food")], textStyle: { color: "#a0c8c2" } },
      series: [
        { type: "line", name: t("legend_water"), smooth: true, showSymbol: false, data: water.map((x) => x.value), lineStyle: { color: "#4aa3ff" }, areaStyle: { color: "rgba(74,163,255,0.14)" } },
        { type: "line", name: t("legend_food"), smooth: true, showSymbol: false, data: food.map((x) => x.value), lineStyle: { color: "#ffbf5b" }, areaStyle: { color: "rgba(255,191,91,0.14)" } },
      ],
    })
  );

  charts["chart-gnaw"].setOption(
    setCommonChartStyle({
      xAxis: { type: "category", data: gnaw.map((x) => toHour(x.timestamp)), axisLabel: { color: "#9ec5bf", interval: 120 } },
      yAxis: { type: "value", min: 0, max: 1 },
      series: [{ type: "line", smooth: true, showSymbol: false, data: gnaw.map((x) => x.value), lineStyle: { color: "#ff8f66", width: 2 }, areaStyle: { color: "rgba(255,143,102,0.16)" } }],
    })
  );

  const hoard = data.inventory?.hoard_hotspots || [];
  charts["chart-hoard"].setOption({
    animationDuration: 500,
    grid: { left: 42, right: 14, top: 24, bottom: 30 },
    xAxis: { type: "value", min: 0, max: 39, axisLabel: { color: "#9ec5bf" } },
    yAxis: { type: "value", min: 0, max: 23, inverse: true, axisLabel: { color: "#9ec5bf" } },
    tooltip: { trigger: "item" },
    visualMap: {
      min: 0,
      max: 1,
      calculable: true,
      orient: "horizontal",
      left: "center",
      bottom: 0,
      textStyle: { color: "#bdd7d0" },
      inRange: { color: ["#0f455f", "#39b7a6", "#ffd281", "#ff9169"] },
    },
    series: [{ type: "scatter", symbolSize: (val) => 18 + val[2] * 22, data: hoard.map((x) => [x.grid_col, x.grid_row, x.intensity]), itemStyle: { opacity: 0.9 } }],
  });
}

function renderBehavior(data) {
  const hourly = data.behavior?.hourly || [];
  const anxiety = data.behavior?.anxiety_series || [];

  charts["chart-behavior-hourly"].setOption(
    setCommonChartStyle({
      xAxis: { type: "category", data: hourly.map((x) => x.hour), axisLabel: { color: "#9ec5bf" } },
      yAxis: [{ type: "value", name: t("axis_count") }, { type: "value", name: t("axis_minutes") }],
      legend: { data: [t("legend_grooming"), t("legend_digging")], textStyle: { color: "#a0c8c2" } },
      series: [
        { type: "bar", name: t("legend_grooming"), data: hourly.map((x) => x.grooming_count), itemStyle: { color: "#3cc6a8", borderRadius: [4, 4, 0, 0] } },
        { type: "line", name: t("legend_digging"), yAxisIndex: 1, smooth: true, showSymbol: false, data: hourly.map((x) => x.digging_minutes), lineStyle: { color: "#ffbf5b" } },
      ],
    })
  );

  charts["chart-anxiety"].setOption(
    setCommonChartStyle({
      xAxis: { type: "category", data: anxiety.map((x) => toHour(x.timestamp)), axisLabel: { color: "#9ec5bf", interval: 120 } },
      yAxis: { type: "value", min: 0, max: 1 },
      series: [
        {
          type: "line",
          smooth: true,
          showSymbol: false,
          data: anxiety.map((x) => x.anxiety_index),
          lineStyle: { color: "#ff6b63", width: 2 },
          areaStyle: { color: "rgba(255,107,99,0.17)" },
          markLine: { data: [{ yAxis: 0.7, name: t("alert_threshold") }], lineStyle: { color: "#ffbf5b" }, label: { color: "#ffd489" } },
        },
      ],
    })
  );

  const schedule = data.behavior?.schedule || {};
  document.getElementById("schedule-card").innerHTML = `
    <div class="schedule-chip">${t("schedule_day")}: <strong>${schedule.day || "-"}</strong></div>
    <div class="schedule-chip">${t("schedule_first_out")}: <strong>${schedule.first_out ? new Date(schedule.first_out).toLocaleString() : "-"}</strong></div>
    <div class="schedule-chip">${t("schedule_last_in")}: <strong>${schedule.last_in ? new Date(schedule.last_in).toLocaleString() : "-"}</strong></div>
  `;
}

function renderEnvironment(data) {
  const envSeries = data.environment?.series || [];

  charts["chart-env-comfort"].setOption(
    setCommonChartStyle({
      xAxis: { type: "category", data: envSeries.map((x) => toHour(x.timestamp)), axisLabel: { color: "#9ec5bf", interval: 120 } },
      yAxis: { type: "value", min: 0, max: 1 },
      series: [
        {
          type: "line",
          smooth: true,
          showSymbol: false,
          data: envSeries.map((x) => x.comfort_index),
          lineStyle: { color: "#7ce09d", width: 2 },
          areaStyle: { color: "rgba(124,224,157,0.2)" },
          markLine: {
            data: [{ yAxis: 0.7, name: t("good_line") }, { yAxis: 0.45, name: t("risk_line") }],
            lineStyle: { color: "#ffbf5b" },
            label: { color: "#ffd489" },
          },
        },
      ],
    })
  );

  charts["chart-env-factors"].setOption(
    setCommonChartStyle({
      xAxis: { type: "category", data: envSeries.map((x) => toHour(x.timestamp)), axisLabel: { color: "#9ec5bf", interval: 120 } },
      yAxis: { type: "value", min: 0, max: 1 },
      legend: { data: [t("legend_lighting"), t("legend_cleanliness"), t("legend_bedding")], textStyle: { color: "#a0c8c2" } },
      series: [
        { type: "line", name: t("legend_lighting"), smooth: true, showSymbol: false, data: envSeries.map((x) => x.lighting_score), lineStyle: { color: "#ffbf5b" } },
        { type: "line", name: t("legend_cleanliness"), smooth: true, showSymbol: false, data: envSeries.map((x) => x.cleanliness_score), lineStyle: { color: "#4aa3ff" } },
        { type: "line", name: t("legend_bedding"), smooth: true, showSymbol: false, data: envSeries.map((x) => x.bedding_evenness), lineStyle: { color: "#3cc6a8" } },
      ],
    })
  );
}

function renderMotion(data) {
  const series = data.motion?.series || [];
  charts["chart-motion"].setOption(
    setCommonChartStyle({
      xAxis: { type: "category", data: series.map((x) => toHour(x.timestamp)), axisLabel: { color: "#9ec5bf", interval: 120 } },
      yAxis: [{ type: "value", min: 0, max: 0.1, name: t("axis_ratio") }, { type: "value", min: 0, max: 1, name: t("axis_capture") }],
      legend: { data: [t("legend_motion_ratio"), t("legend_capture_active")], textStyle: { color: "#a0c8c2" } },
      series: [
        { type: "line", name: t("legend_motion_ratio"), smooth: true, showSymbol: false, data: series.map((x) => x.motion_ratio), lineStyle: { color: "#ff8f66" } },
        {
          type: "bar",
          name: t("legend_capture_active"),
          yAxisIndex: 1,
          data: series.map((x) => (x.capture_active ? 1 : 0)),
          barMaxWidth: 10,
          itemStyle: { color: "rgba(74,163,255,0.7)", borderRadius: [2, 2, 0, 0] },
        },
      ],
    })
  );

  const segments = data.motion?.segments || [];
  const box = document.getElementById("capture-segments");
  if (segments.length === 0) {
    box.innerHTML = `<div class="segment-chip">${t("no_segments")}</div>`;
    return;
  }

  box.innerHTML = segments
    .slice(-20)
    .reverse()
    .map(
      (item) =>
        `<div class="segment-chip"><strong>${new Date(item.start).toLocaleTimeString()} - ${new Date(item.end).toLocaleTimeString()}</strong><br/>${t("capture_duration")}: ${fmtNumber(item.duration_s, 1)} s</div>`
    )
    .join("");
}

function renderAlerts(data) {
  const rows = (data.alerts || []).slice(-120).reverse();
  const tbody = document.getElementById("alerts-table");

  if (rows.length === 0) {
    tbody.innerHTML = `<tr><td colspan="4">${t("no_alerts")}</td></tr>`;
    return;
  }

  tbody.innerHTML = rows
    .map(
      (row) => `
      <tr>
        <td>${new Date(row.timestamp).toLocaleString()}</td>
        <td><span class="badge ${row.severity}">${severityLabel(row.severity)}</span></td>
        <td>${alertTypeLabel(row.type)}</td>
        <td>${alertMessageLabel(row)}</td>
      </tr>
    `
    )
    .join("");
}

function renderGeneratedAt(data) {
  document.getElementById("generated-at").textContent = new Date(data.generated_at).toLocaleString();
  const runtime = data.meta?.runtime_profile || "default";
  const status = data.meta?.status_message ? ` | ${statusMessageLabel(data.meta.status_message)}` : "";
  document.getElementById("runtime-profile").textContent = `${runtime}${status}`;
  currentRunMode = data.meta?.run_mode || currentRunMode;
  currentDemoSource = data.meta?.demo_source || currentDemoSource;
  uploadedVideoName = data.meta?.uploaded_video_name || uploadedVideoName;
  uploadedVideoKey = data.meta?.uploaded_video_key || uploadedVideoKey;
  if (typeof data.meta?.uploaded_preview_available === "boolean") {
    uploadedPreviewAvailable = data.meta.uploaded_preview_available;
  }
  if (typeof data.meta?.uploaded_zone_required === "boolean") {
    uploadedZoneRequired = data.meta.uploaded_zone_required;
  }
  updateModeSelectorsLabel();
  updateUploadBlockVisibility();
}

function renderDashboard(data) {
  renderGeneratedAt(data);
  renderKpis(data.summary);
  renderOdometer(data);
  renderSpatial(data);
  renderHealth(data);
  renderInventory(data);
  renderBehavior(data);
  renderEnvironment(data);
  renderMotion(data);
  renderAlerts(data);
}

async function loadConfig() {
  const response = await fetch("/api/config", { cache: "no-store" });
  if (!response.ok) {
    throw new Error(`Config request failed: ${response.status}`);
  }
  const config = await response.json();
  currentRunMode = config.app?.run_mode || "demo";
  currentDemoSource = config.app?.demo_source || "virtual";
  availableLanguages = config.frontend?.available_languages || ["zh-CN", "en-US"];
  setLanguage(config.frontend?.default_language || "zh-CN");
  document.getElementById("runtime-profile").textContent = config.runtime?.profile || "default";
  return config;
}

async function loadDashboard(forceRefresh = false) {
  const endpoint = forceRefresh ? "/api/dashboard?refresh=true" : "/api/dashboard";
  const response = await fetch(endpoint, { cache: "no-store" });
  if (!response.ok) {
    throw new Error(`API request failed: ${response.status}`);
  }

  const data = await response.json();
  lastDashboardData = data;
  renderDashboard(data);
}

function eventToCanvasPoint(event) {
  const rect = initState.canvas.getBoundingClientRect();
  const x = (event.clientX - rect.left) * (initState.canvas.width / rect.width);
  const y = (event.clientY - rect.top) * (initState.canvas.height / rect.height);
  return [Math.round(x), Math.round(y)];
}

function drawInitCanvas() {
  if (!initState.ctx || !initState.image) {
    return;
  }

  const ctx = initState.ctx;
  ctx.clearRect(0, 0, initState.canvas.width, initState.canvas.height);
  ctx.drawImage(initState.image, 0, 0);

  for (const step of INIT_STEPS) {
    const pts = initState.polygons[step.key] || [];
    if (pts.length === 0) {
      continue;
    }

    const color = STEP_COLORS[step.key] || "#ffffff";
    ctx.strokeStyle = color;
    ctx.fillStyle = `${color}33`;
    ctx.lineWidth = step.key === INIT_STEPS[initState.activeIndex].key ? 2.6 : 1.6;

    ctx.beginPath();
    ctx.moveTo(pts[0][0], pts[0][1]);
    for (let i = 1; i < pts.length; i += 1) {
      ctx.lineTo(pts[i][0], pts[i][1]);
    }
    if (initState.closed[step.key]) {
      ctx.closePath();
      ctx.fill();
    }
    ctx.stroke();

    for (const [x, y] of pts) {
      ctx.beginPath();
      ctx.arc(x, y, 3.2, 0, Math.PI * 2);
      ctx.fillStyle = color;
      ctx.fill();
    }
  }
}

function layoutInitCanvasDisplay() {
  if (!initState.canvas || !initState.image) {
    return;
  }
  const wrap = initState.canvas.parentElement;
  if (!wrap) {
    return;
  }

  const maxRatio = window.innerWidth <= 860 ? INIT_CANVAS_MAX_HEIGHT_RATIO_MOBILE : INIT_CANVAS_MAX_HEIGHT_RATIO_DESKTOP;
  const maxDisplayHeight = Math.max(220, Math.floor(window.innerHeight * maxRatio));
  const availableWidth = Math.max(1, wrap.clientWidth - 2);
  const availableHeight = Math.max(1, maxDisplayHeight - 2);

  const imageWidth = Math.max(1, initState.image.width || initState.canvas.width || 1);
  const imageHeight = Math.max(1, initState.image.height || initState.canvas.height || 1);
  const scale = Math.min(availableWidth / imageWidth, availableHeight / imageHeight, 1);

  const displayWidth = Math.max(1, Math.floor(imageWidth * scale));
  const displayHeight = Math.max(1, Math.floor(imageHeight * scale));
  initState.canvas.style.width = `${displayWidth}px`;
  initState.canvas.style.height = `${displayHeight}px`;
}

function renderInitSteps() {
  const list = document.getElementById("init-step-list");
  if (!list) {
    return;
  }

  list.innerHTML = INIT_STEPS.map((step, idx) => {
    const count = (initState.polygons[step.key] || []).length;
    const done = count >= 3;
    const active = idx === initState.activeIndex;
    return `<div class="init-step-item ${active ? "active" : ""}">${t(step.labelKey)} • ${count} ${t("point_label")}${count === 1 ? "" : "s"} ${done ? `✓ ${t("done_mark")}` : ""}</div>`;
  }).join("");

  const step = INIT_STEPS[initState.activeIndex];
  document.getElementById("init-current-region").textContent = t(step.labelKey);
  document.getElementById("init-current-desc").textContent = t(step.descKey);
}

function openModal(id) {
  document.getElementById(id).classList.remove("hidden");
}

function closeModal(id) {
  document.getElementById(id).classList.add("hidden");
}

function sourceLabel(source) {
  if (source === "uploaded_preview") {
    return t("source_uploaded_preview");
  }
  if (source === "uploaded_video") {
    return t("source_uploaded_frame");
  }
  if (source === "video") {
    return t("source_video");
  }
  if (source === "placeholder") {
    return t("source_placeholder");
  }
  return t("source_unknown");
}

function preferredInitFrameSource() {
  if (currentRunMode === "demo" && currentDemoSource === "uploaded_video") {
    return "uploaded";
  }
  return "auto";
}

async function loadInitFrame(source = "auto") {
  document.getElementById("init-status").textContent = t("init_status_loading");
  const payload = await fetchInitFramePayload(source);
  if (typeof payload.zone_required === "boolean") {
    uploadedZoneRequired = payload.zone_required;
  }
  if (!payload.image_b64) {
    throw new Error("init frame response missing image data");
  }

  const image = new Image();
  image.src = `data:image/jpeg;base64,${payload.image_b64}`;

  await new Promise((resolve, reject) => {
    image.onload = () => resolve();
    image.onerror = reject;
  });

  initState.image = image;
  initState.canvas.width = image.width;
  initState.canvas.height = image.height;
  initState.frameWidth = Number(payload.width || image.width || 0);
  initState.frameHeight = Number(payload.height || image.height || 0);

  const zones = payload.spatial?.zones || {};
  initState.polygons = {
    fence_polygon: payload.spatial?.fence_polygon || [],
    wheel_mask_polygon: payload.spatial?.wheel_mask_polygon || [],
    food_zone: zones.food_zone || [],
    sand_bath_zone: zones.sand_bath_zone || [],
    hideout_zone: zones.hideout_zone || [],
  };

  initState.closed = {};
  for (const step of INIT_STEPS) {
    initState.closed[step.key] = (initState.polygons[step.key] || []).length >= 3;
  }

  initState.activeIndex = 0;
  drawInitCanvas();
  renderInitSteps();
  layoutInitCanvasDisplay();
  window.requestAnimationFrame(() => layoutInitCanvasDisplay());
  document.getElementById("init-status").textContent = formatText("init_status_source", { source: sourceLabel(payload.source) });
}

async function fetchInitFramePayload(source = "auto") {
  const candidates = [
    { source, max_width: "0" },
    { source, max_width: "1920" },
    { source, max_width: "900" },
    { source },
  ];
  let lastError = "unknown";

  for (const params of candidates) {
    const query = new URLSearchParams(params);
    const response = await fetch(`/api/init/frame?${query.toString()}`, { cache: "no-store" });
    if (response.ok) {
      return response.json();
    }

    let detail = `${response.status}`;
    try {
      detail = await responseDetailText(response);
    } catch (_err) {
      // keep status code text
    }
    lastError = detail;
  }

  throw new Error(`init frame request failed: ${lastError}`);
}

function currentStepKey() {
  return INIT_STEPS[initState.activeIndex].key;
}

function onCanvasClick(event) {
  const key = currentStepKey();
  if (initState.closed[key]) {
    initState.polygons[key] = [];
    initState.closed[key] = false;
  }

  const point = eventToCanvasPoint(event);
  initState.polygons[key] = [...(initState.polygons[key] || []), point];
  drawInitCanvas();
  renderInitSteps();
}

function onCanvasDoubleClick(event) {
  event.preventDefault();
  const key = currentStepKey();
  if ((initState.polygons[key] || []).length >= 3) {
    initState.closed[key] = true;
    drawInitCanvas();
    renderInitSteps();
  }
}

function undoPoint() {
  const key = currentStepKey();
  const points = [...(initState.polygons[key] || [])];
  points.pop();
  initState.polygons[key] = points;
  initState.closed[key] = false;
  drawInitCanvas();
  renderInitSteps();
}

function clearRegion() {
  const key = currentStepKey();
  initState.polygons[key] = [];
  initState.closed[key] = false;
  drawInitCanvas();
  renderInitSteps();
}

function switchStep(delta) {
  const next = Math.min(Math.max(initState.activeIndex + delta, 0), INIT_STEPS.length - 1);
  initState.activeIndex = next;
  renderInitSteps();
  drawInitCanvas();
}

function initPayloadFromState() {
  const requiredKeys = INIT_STEPS.map((x) => x.key);
  for (const key of requiredKeys) {
    const points = initState.polygons[key] || [];
    if (points.length < 3) {
      throw new Error(`${key} needs at least 3 points`);
    }
  }

  return {
    fence_polygon: initState.polygons.fence_polygon,
    wheel_mask_polygon: initState.polygons.wheel_mask_polygon,
    zones: {
      food_zone: initState.polygons.food_zone,
      sand_bath_zone: initState.polygons.sand_bath_zone,
      hideout_zone: initState.polygons.hideout_zone,
    },
    frame_width: Math.max(1, Math.round(initState.frameWidth || initState.canvas.width || 0)),
    frame_height: Math.max(1, Math.round(initState.frameHeight || initState.canvas.height || 0)),
  };
}

async function saveInitZones() {
  const statusNode = document.getElementById("init-status");
  let payload;
  try {
    payload = initPayloadFromState();
  } catch (err) {
    statusNode.textContent = String(err.message || err);
    return;
  }

  statusNode.textContent = t("init_status_save");

  const response = await fetch("/api/init/zones", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const text = await response.text();
    statusNode.textContent = text;
    return;
  }

  const saved = await response.json();
  if (typeof saved.uploaded_zone_required === "boolean") {
    uploadedZoneRequired = saved.uploaded_zone_required;
  }
  statusNode.textContent = t("init_status_saved");
  await loadConfig();
  await loadDemoStatus();
  await loadDashboard(true);
}

function shouldForceDashboardRefresh() {
  return currentRunMode === "demo" && currentDemoSource === "virtual";
}

function syncModeFromRaw(raw) {
  currentRunMode = raw?.app?.run_mode || "demo";
  currentDemoSource = raw?.app?.demo_source || "virtual";
  updateModeSelectorsLabel();
  updateUploadBlockVisibility();
}

async function loadDemoStatus() {
  try {
    const response = await fetch("/api/demo/status", { cache: "no-store" });
    if (!response.ok) {
      return;
    }
    const status = await response.json();
    currentRunMode = status.run_mode || currentRunMode;
    currentDemoSource = status.demo_source || currentDemoSource;
    uploadedVideoName = status.uploaded_video_name || status.uploaded_video_key || "";
    uploadedVideoKey = status.uploaded_video_key || uploadedVideoKey;
    uploadedVideos = Array.isArray(status.uploaded_videos) ? status.uploaded_videos : [];
    if (!uploadedVideoKey) {
      const activeItem = uploadedVideos.find((item) => item && item.is_active);
      uploadedVideoKey = activeItem?.video_key || "";
    }
    if (!uploadedVideoName && uploadedVideoKey) {
      uploadedVideoName = uploadedVideoKey;
    }
    uploadedPreviewAvailable = Boolean(status.uploaded_preview_available);
    uploadedZoneRequired = Boolean(status.zone_required);
    updateModeSelectorsLabel();
    renderUploadedVideoSelector();
    updateUploadBlockVisibility();
  } catch (_err) {
    // Ignore transient status errors in UI.
  }
}

async function responseDetailText(response) {
  const text = await response.text();
  try {
    const payload = JSON.parse(text);
    if (payload && typeof payload.detail === "string") {
      return payload.detail;
    }
  } catch (_err) {
    // fall through
  }
  return text;
}

function formatMb(bytes) {
  return (Number(bytes || 0) / (1024 * 1024)).toFixed(2);
}

function makePreviewToken() {
  const randomPart = Math.random().toString(36).slice(2, 10);
  return `pv_${Date.now()}_${randomPart}`;
}

async function extractFirstFrameForUploadPreview(file) {
  const objectUrl = URL.createObjectURL(file);
  const video = document.createElement("video");
  video.preload = "metadata";
  video.src = objectUrl;
  video.muted = true;
  video.playsInline = true;
  video.crossOrigin = "anonymous";

  try {
    await new Promise((resolve, reject) => {
      video.onloadedmetadata = () => resolve();
      video.onerror = () => reject(new Error("video metadata load failed"));
    });

    await new Promise((resolve, reject) => {
      video.onloadeddata = () => resolve();
      video.onerror = () => reject(new Error("video first frame load failed"));
    });

    if (!video.videoWidth || !video.videoHeight) {
      throw new Error("invalid video size");
    }

    const canvas = document.createElement("canvas");
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext("2d");
    if (!ctx) {
      throw new Error("canvas context unavailable");
    }
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

    const blob = await new Promise((resolve, reject) => {
      canvas.toBlob(
        (result) => {
          if (!result) {
            reject(new Error("first frame encode failed"));
            return;
          }
          resolve(result);
        },
        "image/jpeg",
        0.96
      );
    });

    return {
      blob,
      width: canvas.width,
      height: canvas.height,
    };
  } finally {
    video.pause();
    URL.revokeObjectURL(objectUrl);
  }
}

async function uploadOriginalPreviewFrame(file) {
  const token = makePreviewToken();
  const frame = await extractFirstFrameForUploadPreview(file);
  const endpoint = `/api/demo/upload-preview?token=${encodeURIComponent(token)}`;
  const response = await fetch(endpoint, {
    method: "POST",
    headers: {
      "Content-Type": "image/jpeg",
    },
    body: frame.blob,
  });
  if (!response.ok) {
    const detail = await responseDetailText(response);
    throw new Error(detail);
  }
  const payload = await response.json();
  return {
    previewToken: payload.preview_token || token,
    width: Number(payload.width || frame.width || 0),
    height: Number(payload.height || frame.height || 0),
  };
}

function pickRecorderMimeType() {
  if (typeof MediaRecorder === "undefined") {
    return "";
  }
  const candidates = [
    "video/webm;codecs=vp9",
    "video/webm;codecs=vp8",
    "video/webm",
    "video/mp4",
  ];
  for (const mime of candidates) {
    if (MediaRecorder.isTypeSupported(mime)) {
      return mime;
    }
  }
  return "";
}

function extensionFromMimeType(mimeType) {
  if (mimeType.includes("mp4")) {
    return "mp4";
  }
  return "webm";
}

async function compressVideoForUpload(file) {
  if (typeof MediaRecorder === "undefined") {
    throw new Error("MediaRecorder not supported");
  }
  if (typeof HTMLCanvasElement === "undefined" || !HTMLCanvasElement.prototype.captureStream) {
    throw new Error("Canvas capture not supported");
  }

  const mimeType = pickRecorderMimeType();
  if (!mimeType) {
    throw new Error("No supported recorder codec");
  }

  const objectUrl = URL.createObjectURL(file);
  const video = document.createElement("video");
  video.preload = "metadata";
  video.src = objectUrl;
  video.muted = true;
  video.playsInline = true;
  video.crossOrigin = "anonymous";

  let stream = null;
  let drawTimer = null;
  try {
    await new Promise((resolve, reject) => {
      video.onloadedmetadata = () => resolve();
      video.onerror = () => reject(new Error("video metadata load failed"));
    });

    if (!video.videoWidth || !video.videoHeight) {
      throw new Error("invalid video size");
    }

    const scale = Math.min(
      1,
      CLIENT_VIDEO_COMPRESS.maxWidth / video.videoWidth,
      CLIENT_VIDEO_COMPRESS.maxHeight / video.videoHeight
    );
    const width = Math.max(2, Math.floor((video.videoWidth * scale) / 2) * 2);
    const height = Math.max(2, Math.floor((video.videoHeight * scale) / 2) * 2);

    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext("2d");
    if (!ctx) {
      throw new Error("canvas context unavailable");
    }

    stream = canvas.captureStream(CLIENT_VIDEO_COMPRESS.targetFps);
    const chunks = [];

    const recorder = new MediaRecorder(stream, {
      mimeType,
      videoBitsPerSecond: CLIENT_VIDEO_COMPRESS.videoBitsPerSecond,
    });

    recorder.ondataavailable = (event) => {
      if (event.data && event.data.size > 0) {
        chunks.push(event.data);
      }
    };

    const recorderDone = new Promise((resolve, reject) => {
      recorder.onstop = () => resolve();
      recorder.onerror = () => reject(new Error("video recorder failed"));
    });

    const drawFrame = () => {
      ctx.drawImage(video, 0, 0, width, height);
    };

    drawFrame();
    recorder.start(CLIENT_VIDEO_COMPRESS.chunkMs);

    await video.play();
    const frameIntervalMs = Math.max(16, Math.floor(1000 / CLIENT_VIDEO_COMPRESS.targetFps));
    drawTimer = window.setInterval(() => {
      if (!video.paused && !video.ended) {
        drawFrame();
      }
    }, frameIntervalMs);

    await new Promise((resolve, reject) => {
      video.onended = () => resolve();
      video.onerror = () => reject(new Error("video playback failed"));
    });

    if (drawTimer) {
      clearInterval(drawTimer);
      drawTimer = null;
    }

    if (recorder.state !== "inactive") {
      recorder.stop();
    }
    await recorderDone;

    const compressedBlob = new Blob(chunks, { type: mimeType });
    if (!compressedBlob.size) {
      throw new Error("compressed file is empty");
    }

    const baseName = file.name.replace(/\.[^.]+$/, "");
    const ext = extensionFromMimeType(mimeType);
    const outputName = `${baseName}_compressed.${ext}`;
    const outputFile = new File([compressedBlob], outputName, {
      type: mimeType,
      lastModified: Date.now(),
    });

    return {
      file: outputFile,
      mimeType,
      width,
      height,
      originalSize: file.size,
      compressedSize: outputFile.size,
    };
  } finally {
    if (drawTimer) {
      clearInterval(drawTimer);
    }
    if (stream) {
      stream.getTracks().forEach((track) => track.stop());
    }
    video.pause();
    URL.revokeObjectURL(objectUrl);
  }
}

async function uploadDemoVideo() {
  const input = document.getElementById("settings-video-file");
  const status = document.getElementById("settings-upload-status");
  const uploadBtn = document.getElementById("settings-upload");
  const analyzeBtn = document.getElementById("settings-analyze");

  if (currentRunMode !== "demo") {
    status.textContent = t("mode_real_reserved");
    return;
  }
  if (currentDemoSource !== "uploaded_video") {
    status.textContent = t("status_upload_then_analyze");
    return;
  }

  const file = input.files?.[0];
  if (!file) {
    status.textContent = t("status_upload_then_analyze");
    return;
  }

  uploadBtn.disabled = true;
  analyzeBtn.disabled = true;
  try {
    let previewToken = "";
    status.textContent = t("upload_status_preview_preparing");
    try {
      status.textContent = t("upload_status_preview_uploading");
      const preview = await uploadOriginalPreviewFrame(file);
      previewToken = preview.previewToken;
      uploadedPreviewAvailable = true;
      status.textContent = t("upload_status_preview_ok");
    } catch (err) {
      uploadedPreviewAvailable = false;
      status.textContent = formatText("upload_status_preview_fail", { error: String(err.message || err) });
    }

    status.textContent = t("upload_status_compressing");

    let fileToUpload = file;
    let uploadName = file.name || "upload.mp4";
    try {
      const compressed = await compressVideoForUpload(file);
      fileToUpload = compressed.file;
      uploadName = compressed.file.name || uploadName;

      const ratio = compressed.originalSize > 0
        ? ((compressed.compressedSize / compressed.originalSize) * 100).toFixed(1)
        : "0.0";

      status.textContent = `${formatText("upload_status_compress_done", {
        orig_mb: formatMb(compressed.originalSize),
        new_mb: formatMb(compressed.compressedSize),
        ratio,
      })} ${t("upload_status_uploading")}`;
    } catch (err) {
      status.textContent = `${formatText("upload_status_compress_fail", { error: String(err) })} ${t("upload_status_fallback_original")} ${t("upload_status_uploading")}`;
    }

    const query = new URLSearchParams({ filename: uploadName });
    if (previewToken) {
      query.set("preview_token", previewToken);
    }
    const endpoint = `/api/demo/upload?${query.toString()}`;
    const response = await fetch(endpoint, {
      method: "POST",
      headers: {
        "Content-Type": fileToUpload.type || "application/octet-stream",
      },
      body: fileToUpload,
    });

    if (!response.ok) {
      const text = await responseDetailText(response);
      status.textContent = formatText("upload_status_upload_fail", { error: text });
      return;
    }

    const payload = await response.json();
    uploadedVideoName = payload.uploaded_video_name || uploadName;
    uploadedVideoKey = payload.uploaded_video_key || uploadedVideoKey;
    uploadedVideos = Array.isArray(payload.uploaded_videos) ? payload.uploaded_videos : uploadedVideos;
    uploadedPreviewAvailable = Boolean(payload.uploaded_preview_available);
    uploadedZoneRequired = Boolean(payload.zone_required ?? true);
    status.textContent = uploadedZoneRequired
      ? formatText("upload_status_upload_ok_need_init", { name: uploadedVideoName })
      : formatText("upload_status_upload_ok", { name: uploadedVideoName });
    renderUploadedVideoSelector();
    await loadDemoStatus();
  } finally {
    uploadBtn.disabled = false;
    analyzeBtn.disabled = false;
  }
}

async function selectUploadedVideo() {
  const select = document.getElementById("settings-uploaded-select");
  const status = document.getElementById("settings-upload-status");
  const uploadBtn = document.getElementById("settings-upload");
  const analyzeBtn = document.getElementById("settings-analyze");
  const useUploadedBtn = document.getElementById("settings-use-uploaded");

  if (currentRunMode !== "demo") {
    status.textContent = t("mode_real_reserved");
    return;
  }
  if (currentDemoSource !== "uploaded_video") {
    status.textContent = t("status_upload_then_analyze");
    return;
  }

  const selectedKey = String(select?.value || "");
  if (!selectedKey) {
    status.textContent = t("upload_history_none");
    return;
  }

  if (uploadBtn) uploadBtn.disabled = true;
  if (analyzeBtn) analyzeBtn.disabled = true;
  if (useUploadedBtn) useUploadedBtn.disabled = true;
  if (select) select.disabled = true;

  try {
    status.textContent = t("upload_status_selecting");
    const endpoint = `/api/demo/select-uploaded?video_key=${encodeURIComponent(selectedKey)}`;
    const response = await fetch(endpoint, { method: "POST" });
    if (!response.ok) {
      const text = await responseDetailText(response);
      status.textContent = formatText("upload_status_select_fail", { error: text });
      return;
    }

    const payload = await response.json();
    uploadedVideoName = payload.uploaded_video_name || selectedKey;
    uploadedVideoKey = payload.uploaded_video_key || selectedKey;
    uploadedVideos = Array.isArray(payload.uploaded_videos) ? payload.uploaded_videos : uploadedVideos;
    uploadedPreviewAvailable = Boolean(payload.uploaded_preview_available);
    uploadedZoneRequired = Boolean(payload.zone_required ?? true);

    renderUploadedVideoSelector();
    status.textContent = formatText("upload_status_selected_need_init", { name: uploadedVideoName });

    openModal("init-modal");
    try {
      await loadInitFrame("uploaded");
    } catch (err) {
      document.getElementById("init-status").textContent = String(err);
    }

    await loadDemoStatus();
  } finally {
    updateUploadBlockVisibility();
  }
}

async function analyzeDemoVideo() {
  const status = document.getElementById("settings-upload-status");
  if (currentRunMode !== "demo") {
    status.textContent = t("mode_real_reserved");
    return;
  }
  if (currentDemoSource !== "uploaded_video") {
    status.textContent = t("status_upload_then_analyze");
    return;
  }
  if (uploadedZoneRequired) {
    status.textContent = t("upload_status_zone_required");
    openModal("init-modal");
    try {
      await loadInitFrame("uploaded");
    } catch (err) {
      document.getElementById("init-status").textContent = String(err);
    }
    return;
  }
  status.textContent = t("upload_status_analyzing");

  const response = await fetch("/api/demo/analyze-upload", { method: "POST" });
  if (!response.ok) {
    const text = await responseDetailText(response);
    if (String(text).includes("zone initialization required")) {
      status.textContent = t("upload_status_zone_required");
      openModal("init-modal");
      try {
        await loadInitFrame("uploaded");
      } catch (err) {
        document.getElementById("init-status").textContent = String(err);
      }
      return;
    }
    status.textContent = formatText("upload_status_analyze_fail", { error: text });
    return;
  }

  status.textContent = t("upload_status_analyze_ok");
  await loadDashboard(false);
}

async function loadSettingsConfig() {
  const status = document.getElementById("settings-status");
  status.textContent = t("settings_status_loading");
  try {
    const response = await fetch("/api/config/raw", { cache: "no-store" });
    if (!response.ok) {
      throw new Error(`${response.status}`);
    }
    const payload = await response.json();
    const raw = payload.config || {};

    settingsRawConfig = deepClone(raw);
    settingsWorkingConfig = deepClone(raw);

    const langs = settingsWorkingConfig?.frontend?.available_languages;
    if (Array.isArray(langs) && langs.length > 0) {
      availableLanguages = langs;
    }

    syncModeFromRaw(raw);
    if (!SETTINGS_SECTIONS.some((item) => item.id === settingsActiveSectionId)) {
      settingsActiveSectionId = SETTINGS_SECTIONS[0].id;
    }
    renderSettingsSectionList();
    renderSettingsSectionContent();
    status.textContent = t("settings_status_loaded");
    await loadDemoStatus();
  } catch (err) {
    status.textContent = formatText("settings_status_load_fail", { error: String(err) });
  }
}

async function saveSettingsConfig() {
  const status = document.getElementById("settings-status");
  status.textContent = t("settings_status_saving");
  if (!settingsWorkingConfig) {
    status.textContent = formatText("settings_status_save_fail", { error: "settings not loaded" });
    return;
  }
  if (!commitCurrentSectionEdits()) {
    return;
  }

  const raw = deepClone(settingsWorkingConfig);

  const response = await fetch("/api/config/raw", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ config: raw }),
  });

  if (!response.ok) {
    const text = await response.text();
    status.textContent = formatText("settings_status_save_fail", { error: text });
    return;
  }

  const payload = await response.json();
  const cfg = payload.config || {};
  currentRunMode = cfg.app?.run_mode || currentRunMode;
  currentDemoSource = cfg.app?.demo_source || currentDemoSource;
  availableLanguages = cfg.frontend?.available_languages || availableLanguages;
  setLanguage(cfg.frontend?.default_language || currentLanguage);
  updateModeSelectorsLabel();
  updateUploadBlockVisibility();
  status.textContent = t("settings_status_saved");
  await loadSettingsConfig();
  await loadDashboard(shouldForceDashboardRefresh());
}

function bindEvents() {
  const refreshBtn = document.getElementById("refresh-btn");
  const toggleBtn = document.getElementById("toggle-auto-btn");
  const initBtn = document.getElementById("init-zones-btn");
  const settingsBtn = document.getElementById("settings-btn");

  refreshBtn.addEventListener("click", async () => {
    refreshBtn.disabled = true;
    refreshBtn.textContent = t("btn_refreshing");
    try {
      await loadDashboard(true);
    } finally {
      refreshBtn.disabled = false;
      refreshBtn.textContent = t("btn_refresh");
    }
  });

  toggleBtn.addEventListener("click", () => {
    autoRefresh = !autoRefresh;
    toggleBtn.textContent = autoRefresh ? t("btn_auto_on") : t("btn_auto_off");
  });

  initBtn.addEventListener("click", async () => {
    openModal("init-modal");
    try {
      await loadInitFrame(preferredInitFrameSource());
    } catch (err) {
      document.getElementById("init-status").textContent = String(err);
    }
  });

  settingsBtn.addEventListener("click", async () => {
    openModal("settings-modal");
    await loadSettingsConfig();
  });

  document.getElementById("init-close").addEventListener("click", () => closeModal("init-modal"));
  document.getElementById("init-undo").addEventListener("click", undoPoint);
  document.getElementById("init-clear").addEventListener("click", clearRegion);
  document.getElementById("init-prev").addEventListener("click", () => switchStep(-1));
  document.getElementById("init-next").addEventListener("click", () => switchStep(1));
  document.getElementById("init-save").addEventListener("click", async () => {
    try {
      await saveInitZones();
    } catch (err) {
      document.getElementById("init-status").textContent = String(err);
    }
  });

  document.getElementById("settings-close").addEventListener("click", () => closeModal("settings-modal"));
  document.getElementById("settings-reload").addEventListener("click", loadSettingsConfig);
  document.getElementById("settings-save").addEventListener("click", saveSettingsConfig);
  document.getElementById("settings-upload").addEventListener("click", uploadDemoVideo);
  document.getElementById("settings-use-uploaded").addEventListener("click", selectUploadedVideo);
  document.getElementById("settings-analyze").addEventListener("click", analyzeDemoVideo);
  document.getElementById("settings-uploaded-select").addEventListener("change", () => {
    updateUploadBlockVisibility();
  });
  const languageSelect = document.getElementById("settings-language");
  if (languageSelect) {
    languageSelect.addEventListener("change", (event) => {
      setLanguage(event.target.value);
    });
  }
  const runModeSelect = document.getElementById("settings-run-mode");
  if (runModeSelect) {
    runModeSelect.addEventListener("change", (event) => {
      currentRunMode = event.target.value;
      updateUploadBlockVisibility();
      if (currentRunMode === "real") {
        document.getElementById("settings-status").textContent = t("mode_real_reserved");
      }
    });
  }
  const demoSourceSelect = document.getElementById("settings-demo-source");
  if (demoSourceSelect) {
    demoSourceSelect.addEventListener("change", (event) => {
      currentDemoSource = event.target.value;
      updateUploadBlockVisibility();
    });
  }

  const settingsSectionList = document.getElementById("settings-section-list");
  if (settingsSectionList) {
    settingsSectionList.addEventListener("click", (event) => {
      const btn = event.target.closest("[data-section-id]");
      if (!btn) {
        return;
      }
      switchSettingsSection(btn.getAttribute("data-section-id"));
    });
  }

  initState.canvas = document.getElementById("init-canvas");
  initState.ctx = initState.canvas.getContext("2d");
  initState.canvas.addEventListener("click", onCanvasClick);
  initState.canvas.addEventListener("dblclick", onCanvasDoubleClick);

  window.addEventListener("resize", () => {
    Object.values(charts).forEach((chart) => chart.resize());
    layoutInitCanvasDisplay();
  });
}

function startAutoRefresh() {
  refreshTimer = window.setInterval(async () => {
    if (!autoRefresh) {
      return;
    }
    if (currentRunMode !== "demo" || currentDemoSource !== "virtual") {
      return;
    }

    try {
      await loadDashboard(true);
    } catch (err) {
      console.error(err);
    }
  }, 20000);
}

async function bootstrap() {
  setLanguage("zh-CN");
  initCharts();
  bindEvents();
  startAutoRefresh();

  try {
    await loadConfig();
    await loadDemoStatus();
    await loadDashboard(shouldForceDashboardRefresh());
  } catch (err) {
    console.error(err);
    document.getElementById("generated-at").textContent = t("dashboard_load_fail");
  }
}

bootstrap();
