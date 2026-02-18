const chartIds = [
  "chart-speed-rpm",
  "chart-hourly-distance",
  "chart-direction",
  "chart-running-streak",
  "chart-heatmap",
  "chart-trajectory",
  "chart-position-time",
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
    btn_theme_to_light: "切换到浅色",
    btn_theme_to_dark: "切换到深色",
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
    tab_overview: "总览",
    tab_stats: "数据统计",
    tab_live: "实时监控",
    tab_live_title: "上传视频实时回看",
    tab_live_desc: "在 demo + 上传视频模式下，实时监控页会直接播放当前选中的上传视频。",
    live_status_waiting_mode: "当前仅在 demo + 上传视频模式可播放。",
    live_status_waiting_upload: "请先上传并选择视频。",
    live_status_loading: "正在加载上传视频...",
    live_status_ready: "正在播放：{name}",
    live_status_load_fail: "视频加载失败：{error}",
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
    chart_position_time: "时间 vs 区域停留",
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
    overview_photo_title: "仓鼠精选照片",
    overview_photo_desc: "从分析视频中自动提取清晰度与构图较好的仓鼠帧。",
    overview_photo_empty: "当前暂无可展示的仓鼠照片。请先上传视频并完成圈区初始化。",
    overview_photo_badge: "自动精选",
    overview_photo_alt: "仓鼠精选照片",
    overview_photo_time: "抓拍时间",
    overview_photo_score: "清晰评分",
    overview_photo_size: "分辨率",
    overview_photo_feedback_prompt: "这张照片质量如何？",
    overview_photo_feedback_good: "好",
    overview_photo_feedback_bad: "坏",
    overview_photo_feedback_stats: "反馈统计：好 {good} / 坏 {bad}",
    overview_photo_feedback_sending: "正在提交反馈...",
    overview_photo_feedback_good_ok: "已记录“好”反馈，已按偏好重排。",
    overview_photo_feedback_bad_ok: "已记录“坏”反馈，已重新挑选照片。",
    overview_photo_feedback_fail: "反馈失败：{error}",
    overview_extra_title: "分析快照",
    overview_extra_desc: "展示当前分析任务的关键运行数据。",
    overview_metric_source: "数据来源",
    overview_metric_frames: "分析帧数",
    overview_metric_fps: "源视频 FPS",
    overview_metric_step: "抽帧步长",
    overview_metric_bev: "透视映射",
    overview_metric_analyzed_at: "分析时间",
    overview_bev_enabled: "已启用",
    overview_bev_disabled: "未启用",
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
    init_map_title: "圈区映射预览",
    init_map_desc: "用于快速核对映射前后区域形变是否合理。",
    init_map_before: "映射前（相机平面）",
    init_map_after: "映射后（长方形平面）",
    init_map_status_loading: "正在计算映射预览...",
    init_map_status_ready: "映射预览已更新，边界误差：{error}",
    init_map_status_pending: "围栏点位不足或未闭合，暂无法生成映射预览。",
    init_map_status_unavailable: "映射预览不可用：{reason}",
    init_map_status_error: "映射预览失败：{error}",
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
    settings_section_app_desc: "运行模式、演示数据来源与分析压缩参数等应用基础设置。",
    settings_section_video_desc: "视频源路径与输入帧率、分辨率设置。",
    settings_section_runtime_desc: "低内存模式、分析分辨率和帧处理节流。",
    settings_section_motion_desc: "画面变动触发录制相关阈值和输出参数。",
    settings_section_environment_desc: "光照、清洁与垫料舒适度分析参数。",
    settings_section_wheel_desc: "跑轮直径（用于速度估算）、ROI 与色点检测阈值。",
    settings_section_spatial_desc: "围栏、多边形区域、热区空间分析参数。",
    settings_section_health_desc: "健康扫描周期和体型基线设置。",
    settings_section_vlm_desc: "配置模型服务商、模型名、接口地址与鉴权环境变量。",
    settings_section_inventory_desc: "水位/食量/磨牙区域与告警阈值。",
    settings_section_alerts_desc: "越界通知与行为风险阈值配置。",
    settings_section_frontend_desc: "面板刷新周期、语言与历史窗口。",
    settings_section_logging_desc: "日志级别、落盘路径和滚动策略。",
    settings_section_demo_tools_desc: "上传完整视频，或选择已上传视频后进入圈区；圈区保存后自动压缩并分析。",
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
    upload_status_preview_backend_fallback: "浏览器未提取到可用首帧，改由服务端从原视频生成高清圈区背景。",
    upload_status_preview_fallback_original: "为保证圈区背景分辨率，改为原视频上传（不压缩）。",
    upload_status_selecting: "正在载入已上传视频...",
    upload_status_selected_need_init: "已载入：{name}。可直接开始圈区初始化。",
    upload_status_select_fail: "载入已上传视频失败：{error}",
    upload_status_uploading: "正在上传完整视频...",
    upload_status_compressing: "正在本地压缩视频...",
    upload_status_compress_done: "压缩完成：{orig_mb}MB -> {new_mb}MB（{ratio}%）",
    upload_status_compress_fail: "视频压缩失败：{error}",
    upload_status_fallback_original: "压缩失败，改为原视频上传...",
    upload_status_upload_ok: "上传成功：{name}",
    upload_status_upload_ok_need_init: "上传成功：{name}。请先初始化圈区，保存后将自动分析。",
    upload_status_upload_fail: "上传失败：{error}",
    upload_status_analyzing: "正在压缩并分析视频...",
    upload_status_analyze_ok: "视频分析完成。",
    upload_status_analyze_fail: "视频分析失败：{error}",
    upload_status_analyze_waiting: "分析请求连接中断，正在等待后台完成并同步结果...",
    upload_status_analyze_timeout: "等待分析结果超时，请稍后刷新仪表盘查看。",
    upload_status_zone_required: "请先完成上传视频圈区初始化，保存后会自动分析。",
    upload_history_none: "暂无可选视频",
    upload_history_current: "当前",
    mode_real_reserved: "真实模式已预留，当前暂未接入真实摄像头。",
    status_upload_then_analyze: "请选择上传视频并完成圈区初始化。",
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
    zone_wheel: "跑轮区",
    zone_food: "食盆区",
    zone_sand: "沙浴区",
    zone_hideout: "躲避窝",
    zone_outside: "围栏外",
    zone_unknown: "未知区域",
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
    legend_trajectory_path: "巡逻路径",
    legend_trajectory_direction: "移动方向",
    legend_trajectory_start: "起点",
    legend_trajectory_end: "终点",
    trajectory_dwell: "驻留时长",
    trajectory_time: "时间",
    trajectory_zone: "区域",
    trajectory_step: "步进",
    trajectory_speed: "速度",
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
    btn_theme_to_light: "Switch to Light",
    btn_theme_to_dark: "Switch to Dark",
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
    tab_overview: "Overview",
    tab_stats: "Data Stats",
    tab_live: "Realtime Monitor",
    tab_live_title: "Uploaded Video Playback",
    tab_live_desc: "In demo + uploaded_video mode, this tab plays the currently selected uploaded video.",
    live_status_waiting_mode: "Playback is available only in demo + uploaded_video mode.",
    live_status_waiting_upload: "Upload and select a video first.",
    live_status_loading: "Loading uploaded video...",
    live_status_ready: "Playing: {name}",
    live_status_load_fail: "Failed to load video: {error}",
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
    chart_position_time: "Time vs Zone Dwell",
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
    overview_photo_title: "Featured Hamster Photo",
    overview_photo_desc: "Automatically selected from analyzed video by clarity and composition.",
    overview_photo_empty: "No hamster photo available yet. Upload a video and finish zone initialization first.",
    overview_photo_badge: "Auto Pick",
    overview_photo_alt: "Featured hamster photo",
    overview_photo_time: "Captured At",
    overview_photo_score: "Clarity Score",
    overview_photo_size: "Resolution",
    overview_photo_feedback_prompt: "How good is this photo?",
    overview_photo_feedback_good: "Good",
    overview_photo_feedback_bad: "Bad",
    overview_photo_feedback_stats: "Feedback: good {good} / bad {bad}",
    overview_photo_feedback_sending: "Submitting feedback...",
    overview_photo_feedback_good_ok: "Positive feedback saved. Re-ranked with preference.",
    overview_photo_feedback_bad_ok: "Negative feedback saved. Picked a new photo.",
    overview_photo_feedback_fail: "Feedback failed: {error}",
    overview_extra_title: "Analysis Snapshot",
    overview_extra_desc: "Key runtime metrics for the current analysis task.",
    overview_metric_source: "Data Source",
    overview_metric_frames: "Analyzed Frames",
    overview_metric_fps: "Source FPS",
    overview_metric_step: "Frame Step",
    overview_metric_bev: "Perspective Mapping",
    overview_metric_analyzed_at: "Analyzed At",
    overview_bev_enabled: "Enabled",
    overview_bev_disabled: "Disabled",
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
    init_map_title: "Zone Mapping Preview",
    init_map_desc: "Quickly validate geometric distortion before and after mapping.",
    init_map_before: "Before (camera plane)",
    init_map_after: "After (rectified plane)",
    init_map_status_loading: "Computing mapping preview...",
    init_map_status_ready: "Mapping preview updated, boundary error: {error}",
    init_map_status_pending: "Fence points are insufficient or not closed, mapping preview is unavailable.",
    init_map_status_unavailable: "Mapping preview unavailable: {reason}",
    init_map_status_error: "Mapping preview failed: {error}",
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
    settings_section_app_desc: "Run mode, demo source and analysis compression settings.",
    settings_section_video_desc: "Video source path, fps and frame dimensions.",
    settings_section_runtime_desc: "Low-memory profile and frame processing throttling.",
    settings_section_motion_desc: "Motion-trigger thresholds and capture output settings.",
    settings_section_environment_desc: "Lighting, cleanliness and bedding analysis parameters.",
    settings_section_wheel_desc: "Wheel diameter (used for speed estimation), ROI and marker detection settings.",
    settings_section_spatial_desc: "Fence polygons, zones and spatial analytics parameters.",
    settings_section_health_desc: "Health scan interval and body-area baseline.",
    settings_section_vlm_desc: "Provider/model/endpoint/api key env and request timeout.",
    settings_section_inventory_desc: "Water/food/gnaw ROIs and refill thresholds.",
    settings_section_alerts_desc: "Escape notifier and risk threshold settings.",
    settings_section_frontend_desc: "Dashboard refresh interval, language and history window.",
    settings_section_logging_desc: "Log level, file path and rotation policy.",
    settings_section_demo_tools_desc: "Upload a full video, or reuse an uploaded video, then save zones to trigger auto compression and analysis.",
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
    upload_status_preview_backend_fallback: "Browser preview extraction was unavailable. Server will generate a full-resolution zone background from the original video.",
    upload_status_preview_fallback_original: "To keep full-resolution zone initialization, upload will fallback to the original video (no compression).",
    upload_status_selecting: "Loading selected uploaded video...",
    upload_status_selected_need_init: "Loaded: {name}. Start zone initialization directly.",
    upload_status_select_fail: "Failed to load uploaded video: {error}",
    upload_status_uploading: "Uploading full video...",
    upload_status_compressing: "Compressing video locally...",
    upload_status_compress_done: "Compression done: {orig_mb}MB -> {new_mb}MB ({ratio}%)",
    upload_status_compress_fail: "Video compression failed: {error}",
    upload_status_fallback_original: "Compression failed, fallback to original upload...",
    upload_status_upload_ok: "Upload successful: {name}",
    upload_status_upload_ok_need_init: "Upload successful: {name}. Save zone initialization to start auto analysis.",
    upload_status_upload_fail: "Upload failed: {error}",
    upload_status_analyzing: "Compressing and analyzing video...",
    upload_status_analyze_ok: "Video analysis completed.",
    upload_status_analyze_fail: "Video analysis failed: {error}",
    upload_status_analyze_waiting: "Connection dropped while analyzing. Waiting for backend completion and syncing results...",
    upload_status_analyze_timeout: "Timed out waiting for analysis result. Refresh dashboard later to check.",
    upload_status_zone_required: "Initialize zones for uploaded video. Analysis starts automatically after save.",
    upload_history_none: "No uploaded videos available",
    upload_history_current: "Current",
    mode_real_reserved: "Real mode is reserved and camera control is not connected yet.",
    status_upload_then_analyze: "Upload a video and complete zone initialization.",
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
    zone_wheel: "Wheel",
    zone_food: "Food",
    zone_sand: "Sand Bath",
    zone_hideout: "Hideout",
    zone_outside: "Outside Fence",
    zone_unknown: "Unknown Zone",
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
    legend_trajectory_path: "Patrol Path",
    legend_trajectory_direction: "Direction",
    legend_trajectory_start: "Start",
    legend_trajectory_end: "End",
    trajectory_dwell: "Dwell Duration",
    trajectory_time: "Time",
    trajectory_zone: "Zone",
    trajectory_step: "Step",
    trajectory_speed: "Speed",
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
const DASHBOARD_TABS = ["overview", "stats", "live"];
const THEME_STORAGE_KEY = "hamsterpi_theme";
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
let uploadedAnalyzedAt = "";
let featuredFeedbackBusy = false;
let featuredFeedbackMessage = "";
let activeDashboardTab = "overview";
let currentTheme = "dark";
let liveVideoLoadedKey = "";
const CLIENT_VIDEO_COMPRESS = {
  maxWidth: 960,
  maxHeight: 540,
  targetFps: 12,
  videoBitsPerSecond: 900000,
  chunkMs: 500,
};
const CLIENT_PREVIEW_EXTRACT = {
  metadataTimeoutMs: 15000,
  frameTimeoutMs: 30000,
  seekTimeoutMs: 5000,
  uploadTimeoutMs: 20000,
  probeBudgetMs: 18000,
  maxProbeAttempts: 12,
  probeWidth: 96,
  probeHeight: 54,
  blackMeanThreshold: 3,
  blackStdThreshold: 3,
  blackMaxThreshold: 18,
};
const ANALYZE_RESULT_POLL = {
  intervalMs: 3000,
  timeoutMs: 8 * 60 * 1000,
};

const SETTINGS_SECTIONS = [
  {
    id: "app",
    path: "app",
    includeKeys: ["run_mode", "demo_source", "demo_analysis_resolution", "demo_analysis_fps"],
    labelKey: "settings_section_app",
    descKey: "settings_section_app_desc",
  },
  { id: "video", path: "video", labelKey: "settings_section_video", descKey: "settings_section_video_desc" },
  { id: "runtime", path: "runtime", labelKey: "settings_section_runtime", descKey: "settings_section_runtime_desc" },
  { id: "motion_trigger", path: "motion_trigger", labelKey: "settings_section_motion", descKey: "settings_section_motion_desc" },
  { id: "environment", path: "environment", labelKey: "settings_section_environment", descKey: "settings_section_environment_desc" },
  { id: "wheel", path: "wheel", labelKey: "settings_section_wheel", descKey: "settings_section_wheel_desc" },
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
  { id: "demo_tools", path: "", special: "demo_tools", labelKey: "settings_section_demo_tools", descKey: "settings_section_demo_tools_desc" },
];

const SETTINGS_FIELD_LABELS = {
  "app.title": { "zh-CN": "控制台标题", "en-US": "Console Title" },
  "app.timezone": { "zh-CN": "时区", "en-US": "Timezone" },
  "app.run_mode": { "zh-CN": "运行模式", "en-US": "Run Mode" },
  "app.demo_source": { "zh-CN": "演示数据来源", "en-US": "Demo Source" },
  "app.demo_upload_dir": { "zh-CN": "演示视频目录", "en-US": "Demo Upload Directory" },
  "app.demo_analysis_resolution": { "zh-CN": "分析压缩分辨率", "en-US": "Analysis Compression Resolution" },
  "app.demo_analysis_fps": { "zh-CN": "分析压缩帧率 (FPS)", "en-US": "Analysis Compression FPS" },
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
  "wheel.diameter_cm": { "zh-CN": "跑轮直径 (cm，用于速度估算)", "en-US": "Wheel Diameter (cm, for speed estimation)" },
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
  "app.demo_analysis_resolution": ["640x360", "854x480", "960x540", "1280x720", "1600x900", "1920x1080"],
  "app.demo_analysis_fps": [8, 10, 12, 15, 18, 20, 24, 30],
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
  previewToken: "",
  requestedSource: "auto",
  canvas: null,
  ctx: null,
  mapBeforeCanvas: null,
  mapBeforeCtx: null,
  mapAfterCanvas: null,
  mapAfterCtx: null,
  mapAfterImage: null,
  mapPreviewTimer: 0,
  mapRequestSeq: 0,
  mapPreviewData: null,
};

const INIT_CANVAS_MAX_HEIGHT_RATIO_DESKTOP = 0.72;
const INIT_CANVAS_MAX_HEIGHT_RATIO_MOBILE = 0.45;
const INIT_MAP_PREVIEW_MAX_HEIGHT = 180;
const INIT_MAP_PREVIEW_DEBOUNCE_MS = 160;

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

function normalizeTheme(theme) {
  return theme === "light" ? "light" : "dark";
}

function readStoredTheme() {
  try {
    const value = window.localStorage.getItem(THEME_STORAGE_KEY);
    if (value === "dark" || value === "light") {
      return value;
    }
    return null;
  } catch (_err) {
    return null;
  }
}

function writeStoredTheme(theme) {
  try {
    window.localStorage.setItem(THEME_STORAGE_KEY, normalizeTheme(theme));
  } catch (_err) {
    // ignore storage write errors
  }
}

function detectInitialTheme() {
  const stored = readStoredTheme();
  if (stored === "light" || stored === "dark") {
    return stored;
  }
  if (window.matchMedia && window.matchMedia("(prefers-color-scheme: light)").matches) {
    return "light";
  }
  return "dark";
}

function themeToggleText() {
  return currentTheme === "dark" ? t("btn_theme_to_light") : t("btn_theme_to_dark");
}

function updateThemeToggleButton() {
  const themeBtn = document.getElementById("theme-toggle-btn");
  if (!themeBtn) {
    return;
  }
  const text = themeToggleText();
  themeBtn.textContent = text;
  themeBtn.setAttribute("aria-label", text);
}

function setTheme(theme, persist = true) {
  currentTheme = normalizeTheme(theme);
  document.documentElement.setAttribute("data-theme", currentTheme);
  updateThemeToggleButton();
  if (persist) {
    writeStoredTheme(currentTheme);
  }

  if (!hasChartsInitialized()) {
    return;
  }

  if (lastDashboardData) {
    renderDashboard(lastDashboardData);
  }
  window.requestAnimationFrame(() => {
    resizeCharts();
  });
}

function toggleTheme() {
  setTheme(currentTheme === "dark" ? "light" : "dark", true);
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
  updateInitMappingVisibility();
  drawInitMappingBeforePreview();
  drawInitMappingAfterPreview();
  refreshInitMappingStatusText();
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
  updateThemeToggleButton();
  updateModeSelectorsLabel();
  renderSettingsSectionList();
  renderSettingsSectionContent();
  renderUploadedVideoSelector();
  updateUploadBlockVisibility();
  renderLiveVideoPanel();
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
    if (useUploadedBtn) useUploadedBtn.disabled = false;
    if (uploadedSelect) uploadedSelect.disabled = false;
    return;
  }

  const modeReady = currentRunMode === "demo" && currentDemoSource === "uploaded_video";
  if (!modeReady) {
    status.textContent = t("settings_demo_tools_hint");
    if (uploadBtn) uploadBtn.disabled = true;
    if (useUploadedBtn) useUploadedBtn.disabled = true;
    if (uploadedSelect) uploadedSelect.disabled = true;
    return;
  }

  if (uploadBtn) uploadBtn.disabled = false;
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

function clearLiveVideoSource(video) {
  video.pause();
  video.removeAttribute("src");
  video.load();
}

function liveVideoDisplayName() {
  return uploadedVideoName || uploadedVideoKey || "";
}

function renderLiveVideoPanel() {
  const video = document.getElementById("live-upload-video");
  const status = document.getElementById("live-upload-status");
  if (!video || !status) {
    return;
  }

  const modeReady = currentRunMode === "demo" && currentDemoSource === "uploaded_video";
  if (!modeReady) {
    if (liveVideoLoadedKey) {
      clearLiveVideoSource(video);
    }
    liveVideoLoadedKey = "";
    status.textContent = t("live_status_waiting_mode");
    return;
  }

  if (!uploadedVideoKey) {
    if (liveVideoLoadedKey) {
      clearLiveVideoSource(video);
    }
    liveVideoLoadedKey = "";
    status.textContent = t("live_status_waiting_upload");
    return;
  }

  if (liveVideoLoadedKey !== uploadedVideoKey) {
    liveVideoLoadedKey = uploadedVideoKey;
    status.textContent = t("live_status_loading");
    const src = `/api/demo/live-video?video_key=${encodeURIComponent(uploadedVideoKey)}&ts=${Date.now()}`;
    video.pause();
    video.src = src;
    video.load();
    const playPromise = video.play();
    if (playPromise && typeof playPromise.catch === "function") {
      playPromise.catch(() => {});
    }
    return;
  }

  if (video.error) {
    const code = Number(video.error?.code || 0);
    const errorCode = code > 0 ? `MEDIA_ERR_${code}` : "unknown";
    status.textContent = formatText("live_status_load_fail", { error: errorCode });
    return;
  }

  if (video.readyState >= HTMLMediaElement.HAVE_CURRENT_DATA) {
    status.textContent = formatText("live_status_ready", { name: liveVideoDisplayName() });
  } else {
    status.textContent = t("live_status_loading");
  }
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

function zoneLabel(zoneKey) {
  if (zoneKey === "wheel_zone") return t("zone_wheel");
  if (zoneKey === "food_zone") return t("zone_food");
  if (zoneKey === "sand_bath_zone") return t("zone_sand");
  if (zoneKey === "hideout_zone") return t("zone_hideout");
  if (zoneKey === "outside") return t("zone_outside");
  if (!zoneKey || zoneKey === "unknown") return t("zone_unknown");
  return zoneKey;
}

function timestampMs(ts) {
  const ms = Date.parse(String(ts || ""));
  return Number.isFinite(ms) ? ms : null;
}

function simplifyTrajectoryForPatrol(points, frameWidth = 0, frameHeight = 0) {
  if (!Array.isArray(points) || points.length === 0) {
    return [];
  }
  if (points.length <= 2) {
    return points.slice();
  }

  const w = Math.max(1, Number(frameWidth) || 1);
  const h = Math.max(1, Number(frameHeight) || 1);
  const diag = Math.hypot(w, h);

  // Larger temporal scale + anti-jitter:
  // - micro motions around an anchor are merged;
  // - stationary regions keep sparse points at a coarse time interval.
  const stationaryRadiusPx = Math.max(6.5, diag * 0.006);
  const stationaryExitRadiusPx = stationaryRadiusPx * 1.85;
  // Oscillation inside this bigger cluster is treated as a single anchor point.
  const anchorClusterRadiusPx = Math.max(20, stationaryExitRadiusPx * 1.6, diag * 0.023);
  const microMovePx = Math.max(2.2, stationaryRadiusPx * 0.55);
  const minMovingGapMs = 6500;
  const minStationaryGapMs = 90000;
  const minDwellConfirmMs = 12000;

  const first = { ...points[0], step_px: 0, speed_px_s: 0 };
  const simplified = [first];

  let lastKept = first;
  let anchorX = first.x;
  let anchorY = first.y;
  let anchorSinceMs = timestampMs(first.timestamp);
  let inStationaryMode = false;

  const pushFrom = (point, x, y) => {
    const prevMs = timestampMs(lastKept.timestamp);
    const currMs = timestampMs(point.timestamp);
    const dtMs = prevMs !== null && currMs !== null ? Math.max(0, currMs - prevMs) : null;
    const step = Math.hypot(x - lastKept.x, y - lastKept.y);
    const speed = dtMs !== null && dtMs > 0 ? step / (dtMs / 1000) : null;
    const next = {
      ...point,
      x,
      y,
      step_px: Number(step.toFixed(3)),
      speed_px_s: speed === null ? null : Number(speed.toFixed(3)),
    };
    simplified.push(next);
    lastKept = next;
  };

  for (let i = 1; i < points.length; i += 1) {
    const curr = points[i];
    if (!curr || !Number.isFinite(curr.x) || !Number.isFinite(curr.y)) {
      continue;
    }

    const prevMs = timestampMs(lastKept.timestamp);
    const currMs = timestampMs(curr.timestamp);
    const dtMs = prevMs !== null && currMs !== null ? Math.max(0, currMs - prevMs) : null;
    const distToLast = Math.hypot(curr.x - lastKept.x, curr.y - lastKept.y);
    const distToAnchor = Math.hypot(curr.x - anchorX, curr.y - anchorY);
    // Within anchorClusterRadiusPx, jitter and back-and-forth are collapsed to one point.
    const nearAnchor = distToAnchor <= anchorClusterRadiusPx;

    if (nearAnchor) {
      if (currMs !== null) {
        if (anchorSinceMs === null) {
          anchorSinceMs = currMs;
        } else if (!inStationaryMode && currMs - anchorSinceMs >= minDwellConfirmMs) {
          inStationaryMode = true;
        }
      }
      if (inStationaryMode && dtMs !== null && dtMs >= minStationaryGapMs) {
        // Keep sparse dwell points but lock to anchor to suppress local jitter.
        pushFrom(curr, anchorX, anchorY);
      }
      continue;
    }

    inStationaryMode = false;

    if (dtMs !== null && dtMs < minMovingGapMs && distToLast < anchorClusterRadiusPx * 0.65) {
      continue;
    }
    if (distToLast < microMovePx) {
      continue;
    }

    anchorX = curr.x;
    anchorY = curr.y;
    anchorSinceMs = currMs;
    pushFrom(curr, curr.x, curr.y);
  }

  const tail = points[points.length - 1];
  if (tail && Number.isFinite(tail.x) && Number.isFinite(tail.y)) {
    const last = simplified[simplified.length - 1];
    const sameTs = String(last?.timestamp || "") === String(tail.timestamp || "");
    const samePos = Math.hypot((last?.x ?? 0) - tail.x, (last?.y ?? 0) - tail.y) < 0.01;
    if (!sameTs || !samePos) {
      const prevMs = timestampMs(last?.timestamp);
      const tailMs = timestampMs(tail.timestamp);
      const dtMs = prevMs !== null && tailMs !== null ? Math.max(0, tailMs - prevMs) : null;
      const tailDist = Math.hypot(tail.x - (last?.x ?? tail.x), tail.y - (last?.y ?? tail.y));
      if (tailDist >= microMovePx || (dtMs !== null && dtMs >= minStationaryGapMs)) {
        const anchorDist = Math.hypot(tail.x - anchorX, tail.y - anchorY);
        if (anchorDist <= anchorClusterRadiusPx && dtMs !== null && dtMs >= minStationaryGapMs) {
          pushFrom(tail, anchorX, anchorY);
        } else {
          pushFrom(tail, tail.x, tail.y);
        }
      }
    }
  }

  return simplified;
}

function trajectoryDurationMs(points) {
  if (!Array.isArray(points) || points.length < 2) {
    return 0;
  }
  const start = timestampMs(points[0]?.timestamp);
  const end = timestampMs(points[points.length - 1]?.timestamp);
  if (start === null || end === null) {
    return 0;
  }
  return Math.max(0, end - start);
}

function sampleTrajectory(points, maxPoints = 420) {
  if (!Array.isArray(points)) {
    return [];
  }
  if (points.length <= maxPoints) {
    return points.slice();
  }
  const sampled = [];
  const step = (points.length - 1) / Math.max(maxPoints - 1, 1);
  for (let i = 0; i < maxPoints; i += 1) {
    const idx = Math.min(points.length - 1, Math.round(i * step));
    sampled.push(points[idx]);
  }
  return sampled;
}

function buildTrajectorySegments(points) {
  const segments = [];
  for (let i = 1; i < points.length; i += 1) {
    const prev = points[i - 1];
    const curr = points[i];
    if (!prev || !curr) {
      continue;
    }
    const dx = curr.x - prev.x;
    const dy = curr.y - prev.y;
    const step = Number.isFinite(Number(curr.step_px)) ? Number(curr.step_px) : Math.hypot(dx, dy);
    if (step < 2.0) {
      continue;
    }
    segments.push({
      coords: [
        [prev.x, prev.y],
        [curr.x, curr.y],
      ],
      from: prev.timestamp || "",
      to: curr.timestamp || "",
      zone: curr.zone || "",
      step_px: step,
      speed_px_s: Number.isFinite(Number(curr.speed_px_s)) ? Number(curr.speed_px_s) : null,
    });
  }
  return segments;
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
    "upload a video and initialize zones": "status_upload_then_analyze",
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

function hasChartsInitialized() {
  return chartIds.every((id) => Boolean(charts[id]));
}

function ensureChartsInitialized() {
  if (hasChartsInitialized()) {
    return;
  }
  initCharts();
}

function resizeCharts() {
  Object.values(charts).forEach((chart) => chart.resize());
}

function setDashboardTab(nextTab) {
  const normalized = DASHBOARD_TABS.includes(nextTab) ? nextTab : "overview";
  activeDashboardTab = normalized;

  document.querySelectorAll("[data-tab-target]").forEach((button) => {
    const isActive = button.getAttribute("data-tab-target") === normalized;
    button.classList.toggle("active", isActive);
    button.setAttribute("aria-selected", isActive ? "true" : "false");
  });

  document.querySelectorAll("[data-tab-panel]").forEach((panel) => {
    const isActive = panel.getAttribute("data-tab-panel") === normalized;
    panel.classList.toggle("active", isActive);
  });

  renderLiveVideoPanel();

  if (normalized !== "stats") {
    return;
  }

  ensureChartsInitialized();
  if (lastDashboardData) {
    renderDashboard(lastDashboardData);
  }
  window.requestAnimationFrame(() => {
    resizeCharts();
  });
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
  const c = chartColors();
  return {
    animationDuration: 500,
    animationEasing: "cubicOut",
    textStyle: { color: c.text, fontFamily: "Space Grotesk" },
    grid: { left: 38, right: 20, top: 34, bottom: 34 },
    tooltip: themedTooltip("axis"),
    ...option,
  };
}

function themedTooltip(trigger = "axis", extra = {}) {
  const c = chartColors();
  return {
    trigger,
    backgroundColor: currentTheme === "light" ? "rgba(255,255,255,0.95)" : "rgba(13,22,33,0.95)",
    borderColor: c.splitLine,
    borderWidth: 1,
    textStyle: { color: c.text },
    ...extra,
  };
}

function chartColors() {
  if (currentTheme === "light") {
    return {
      text: "#2f4555",
      axis: "#5e788a",
      legend: "#4f6877",
      label: "#3b5463",
      splitLine: "rgba(64,92,111,0.16)",
      radarLine: "rgba(74,108,126,0.26)",
      radarArea: "rgba(35,66,88,0.05)",
      markLine: "#ba8a44",
      markLabel: "#7e5824",
      heatLabel: "#597587",
      shadow: "rgba(47,71,90,0.22)",
      teal: "#2f9b85",
      amber: "#cd9a43",
      blue: "#3f85d7",
      coral: "#ce705f",
      red: "#d4605a",
      mint: "#5ab5a6",
      green: "#67ad7d",
      orange: "#cf8664",
      captureBar: "rgba(63,133,215,0.62)",
      heatMapRange: ["#eef4fa", "#c9deec", "#9ec6de", "#74acba", "#d8b77a"],
      hoardRange: ["#e8f0f8", "#c2d9eb", "#93bed8", "#7cb0b1", "#dbb47a"],
    };
  }

  return {
    text: "#d8e7e5",
    axis: "#9ec5bf",
    legend: "#a0c8c2",
    label: "#dcebe8",
    splitLine: "rgba(255,255,255,0.08)",
    radarLine: "rgba(180,215,209,0.2)",
    radarArea: "rgba(255,255,255,0.01)",
    markLine: "#ffbf5b",
    markLabel: "#ffd489",
    heatLabel: "#bdd7d0",
    shadow: "rgba(0,0,0,0.4)",
    teal: "#3cc6a8",
    amber: "#ffbf5b",
    blue: "#4aa3ff",
    coral: "#ff7b66",
    red: "#ff6b63",
    mint: "#7fe0cf",
    green: "#7ce09d",
    orange: "#ff8f66",
    captureBar: "rgba(74,163,255,0.7)",
    heatMapRange: ["#092033", "#0f5f6f", "#22a699", "#ffe08a", "#ff8b66"],
    hoardRange: ["#0f455f", "#39b7a6", "#ffd281", "#ff9169"],
  };
}

function renderOdometer(data) {
  const c = chartColors();
  const ts = data.timeseries || [];
  const labels = ts.map((x) => toHour(x.timestamp));
  const speed = ts.map((x) => x.speed_kmh);
  const rpm = ts.map((x) => x.rpm);
  const streak = ts.map((x) => x.running_streak_min);

  charts["chart-speed-rpm"].setOption(
    setCommonChartStyle({
      xAxis: { type: "category", data: labels, axisLabel: { color: c.axis, interval: 120 } },
      yAxis: [
        { type: "value", name: "km/h", splitLine: { lineStyle: { color: c.splitLine } } },
        { type: "value", name: "RPM" },
      ],
      series: [
        {
          name: t("legend_speed"),
          type: "line",
          smooth: true,
          data: speed,
          showSymbol: false,
          lineStyle: { width: 2, color: c.teal },
          areaStyle: { color: currentTheme === "light" ? "rgba(47,155,133,0.16)" : "rgba(60,198,168,0.17)" },
        },
        {
          name: t("legend_rpm"),
          type: "line",
          yAxisIndex: 1,
          smooth: true,
          data: rpm,
          showSymbol: false,
          lineStyle: { width: 1.8, color: c.amber },
        },
      ],
      legend: { data: [t("legend_speed"), t("legend_rpm")], textStyle: { color: c.legend } },
    })
  );

  const hourly = data.odometer?.hourly || [];
  charts["chart-hourly-distance"].setOption(
    setCommonChartStyle({
      xAxis: { type: "category", data: hourly.map((x) => x.hour), axisLabel: { color: c.axis } },
      yAxis: [
        { type: "value", name: "km" },
        { type: "value", name: "switches" },
      ],
      series: [
        {
          type: "bar",
          name: t("legend_distance"),
          data: hourly.map((x) => x.distance_km),
          itemStyle: { color: c.blue, borderRadius: [5, 5, 0, 0] },
        },
        {
          type: "line",
          name: t("legend_stop_go"),
          yAxisIndex: 1,
          data: hourly.map((x) => x.stop_go_events),
          smooth: true,
          lineStyle: { color: c.coral },
          showSymbol: false,
        },
      ],
      legend: { data: [t("legend_distance"), t("legend_stop_go")], textStyle: { color: c.legend } },
    })
  );

  const direction = data.odometer?.direction_distribution || { forward: 0, reverse: 0, idle: 0 };
  charts["chart-direction"].setOption({
    animationDuration: 500,
    tooltip: themedTooltip("item"),
    legend: { bottom: 0, textStyle: { color: c.legend } },
    series: [
      {
        type: "pie",
        radius: ["32%", "68%"],
        center: ["50%", "46%"],
        data: [
          { name: t("dir_forward"), value: direction.forward, itemStyle: { color: c.teal } },
          { name: t("dir_reverse"), value: direction.reverse, itemStyle: { color: c.amber } },
          { name: t("dir_idle"), value: direction.idle, itemStyle: { color: c.blue } },
        ],
        label: { color: c.label },
      },
    ],
  });

  charts["chart-running-streak"].setOption(
    setCommonChartStyle({
      xAxis: { type: "category", data: labels, axisLabel: { interval: 120, color: c.axis } },
      yAxis: { type: "value", name: "min" },
      series: [
        {
          type: "line",
          smooth: true,
          showSymbol: false,
          data: streak,
          lineStyle: { color: c.mint, width: 2 },
          areaStyle: { color: currentTheme === "light" ? "rgba(90,181,166,0.18)" : "rgba(127,224,207,0.2)" },
        },
      ],
    })
  );
}

function renderSpatial(data) {
  const c = chartColors();
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
    tooltip: themedTooltip("item", { position: "top" }),
    grid: { left: 42, right: 14, top: 18, bottom: 30 },
    xAxis: { type: "category", data: Array.from({ length: cols }, (_, i) => i), show: false },
    yAxis: { type: "category", data: Array.from({ length: rows }, (_, i) => i), show: false },
    visualMap: {
      min: 0,
      max: 1,
      orient: "horizontal",
      left: "center",
      bottom: 0,
      textStyle: { color: c.heatLabel },
      inRange: { color: c.heatMapRange },
    },
    series: [{ type: "heatmap", data: heatData, emphasis: { itemStyle: { shadowBlur: 8, shadowColor: c.shadow } } }],
  });

  const rawTrajectory = Array.isArray(spatial.trajectory) ? spatial.trajectory : [];
  const trajectoryPoints = rawTrajectory
    .map((p) => ({
      x: Number(p?.x),
      y: Number(p?.y),
      timestamp: p?.timestamp || "",
      zone: p?.zone || "",
      escape: Boolean(p?.escape),
      step_px: Number.isFinite(Number(p?.step_px)) ? Number(p.step_px) : null,
      speed_px_s: Number.isFinite(Number(p?.speed_px_s)) ? Number(p.speed_px_s) : null,
      heading_deg: Number.isFinite(Number(p?.heading_deg)) ? Number(p.heading_deg) : null,
    }))
    .filter((p) => Number.isFinite(p.x) && Number.isFinite(p.y));
  const analysisWidth = Number(data.meta?.analysis_width) > 0 ? Number(data.meta.analysis_width) : 0;
  const analysisHeight = Number(data.meta?.analysis_height) > 0 ? Number(data.meta.analysis_height) : 0;
  const frameWidth = Number(data.meta?.frame_width) > 0 ? Number(data.meta.frame_width) : 0;
  const frameHeight = Number(data.meta?.frame_height) > 0 ? Number(data.meta.frame_height) : 0;
  const spatialPlaneWidth = analysisWidth > 0 ? analysisWidth : frameWidth;
  const spatialPlaneHeight = analysisHeight > 0 ? analysisHeight : frameHeight;
  const simplifiedTrajectory = simplifyTrajectoryForPatrol(trajectoryPoints, spatialPlaneWidth, spatialPlaneHeight);
  const durationMs = trajectoryDurationMs(simplifiedTrajectory);
  let targetSamplePoints = 220;
  if (durationMs > 0) {
    // One point roughly every 30 seconds, capped for chart readability.
    targetSamplePoints = Math.max(80, Math.min(320, Math.round(durationMs / 30000)));
  }
  const sampledTrajectory = sampleTrajectory(simplifiedTrajectory, targetSamplePoints);
  const trajectoryLineData = sampledTrajectory.map((p) => ({
    value: [p.x, p.y],
    timestamp: p.timestamp,
    zone: p.zone,
    step_px: p.step_px,
    speed_px_s: p.speed_px_s,
    heading_deg: p.heading_deg,
  }));
  const trajectorySegments = buildTrajectorySegments(sampledTrajectory);
  const trajectoryStart = trajectoryLineData.length > 0 ? [trajectoryLineData[0]] : [];
  const trajectoryEnd = trajectoryLineData.length > 0 ? [trajectoryLineData[trajectoryLineData.length - 1]] : [];
  const directionPeriod = Math.max(2.4, Math.min(8.5, sampledTrajectory.length / 48));
  const xMax = spatialPlaneWidth > 0 ? spatialPlaneWidth : Math.max(1, ...trajectoryPoints.map((p) => p.x));
  const yMax = spatialPlaneHeight > 0 ? spatialPlaneHeight : Math.max(1, ...trajectoryPoints.map((p) => p.y));

  charts["chart-trajectory"].setOption({
    animationDuration: 500,
    grid: { left: 42, right: 14, top: 26, bottom: 46 },
    xAxis: { type: "value", min: 0, max: xMax, axisLabel: { color: c.axis } },
    yAxis: { type: "value", min: 0, max: yMax, inverse: true, axisLabel: { color: c.axis } },
    tooltip: themedTooltip("item", {
      formatter: (params) => {
        if (!params) return "";
        if (params.seriesType === "lines") {
          const seg = params.data || {};
          const fromText = seg.from ? toHour(seg.from) : "-";
          const toText = seg.to ? toHour(seg.to) : "-";
          const stepText = Number.isFinite(Number(seg.step_px)) ? `${fmtNumber(seg.step_px, 1)} px` : "-";
          const speedText = Number.isFinite(Number(seg.speed_px_s)) ? `${fmtNumber(seg.speed_px_s, 1)} px/s` : "-";
          return `${params.marker}${t("legend_trajectory_direction")}<br/>${t("trajectory_time")}: ${fromText} -> ${toText}<br/>${t("trajectory_zone")}: ${zoneLabel(seg.zone)}<br/>${t("trajectory_step")}: ${stepText}<br/>${t("trajectory_speed")}: ${speedText}`;
        }
        const item = params.data || {};
        const value = Array.isArray(item.value) ? item.value : Array.isArray(params.value) ? params.value : [];
        const x = Number(value[0]);
        const y = Number(value[1]);
        const tsText = item.timestamp ? toHour(item.timestamp) : "-";
        const stepText = Number.isFinite(Number(item.step_px)) ? `${fmtNumber(item.step_px, 1)} px` : "-";
        const speedText = Number.isFinite(Number(item.speed_px_s)) ? `${fmtNumber(item.speed_px_s, 1)} px/s` : "-";
        return `${params.marker}${params.seriesName}<br/>${t("trajectory_time")}: ${tsText}<br/>x: ${Number.isFinite(x) ? fmtNumber(x, 1) : "-"}, y: ${Number.isFinite(y) ? fmtNumber(y, 1) : "-"}<br/>${t("trajectory_zone")}: ${zoneLabel(item.zone)}<br/>${t("trajectory_step")}: ${stepText}<br/>${t("trajectory_speed")}: ${speedText}`;
      },
    }),
    legend: {
      bottom: 0,
      textStyle: { color: c.legend },
      data: [t("legend_trajectory_path"), t("legend_trajectory_direction"), t("legend_trajectory_start"), t("legend_trajectory_end")],
    },
    series: [
      {
        name: t("legend_trajectory_path"),
        type: "line",
        data: trajectoryLineData,
        showSymbol: false,
        lineStyle: { color: c.blue, width: 1.8, opacity: 0.86 },
        z: 2,
      },
      {
        name: t("legend_trajectory_direction"),
        type: "lines",
        coordinateSystem: "cartesian2d",
        data: trajectorySegments,
        lineStyle: { color: c.teal, width: 1.2, opacity: 0.24, curveness: 0 },
        effect: {
          show: trajectorySegments.length > 1,
          period: directionPeriod,
          trailLength: 0.08,
          symbol: "arrow",
          symbolSize: 7,
          color: c.amber,
          constantSpeed: 30,
        },
        zlevel: 1,
      },
      {
        name: t("legend_trajectory_start"),
        type: "scatter",
        data: trajectoryStart,
        symbol: "circle",
        symbolSize: 9,
        itemStyle: { color: c.green, borderColor: currentTheme === "light" ? "#ffffff" : "#0f1e2b", borderWidth: 1.2 },
        z: 3,
      },
      {
        name: t("legend_trajectory_end"),
        type: "scatter",
        data: trajectoryEnd,
        symbol: "diamond",
        symbolSize: 10,
        itemStyle: { color: c.red, borderColor: currentTheme === "light" ? "#ffffff" : "#0f1e2b", borderWidth: 1.2 },
        z: 3,
      },
    ],
  });

  const normalizeZoneTimelineKey = (zoneKey) => {
    if (zoneKey === "wheel_zone" || zoneKey === "food_zone" || zoneKey === "sand_bath_zone" || zoneKey === "hideout_zone" || zoneKey === "outside") {
      return zoneKey;
    }
    return "unknown";
  };
  const timelineSourceRaw = Array.isArray(data.timeseries) ? data.timeseries : [];
  const timelineSource = timelineSourceRaw
    .map((item) => ({
      timestamp: item?.timestamp || "",
      zone: normalizeZoneTimelineKey(item?.zone),
    }))
    .filter((item) => Boolean(item.timestamp));
  const fallbackTimelineSource = sampledTrajectory.map((p) => ({
    timestamp: p?.timestamp || "",
    zone: normalizeZoneTimelineKey(p?.zone),
  }));
  const timelineSourceEffective = timelineSource.length > 0 ? timelineSource : fallbackTimelineSource;
  const timelineTargetSamples = Math.max(80, Math.min(360, Math.max(1, timelineSourceEffective.length)));
  const sampledTimeline = sampleTrajectory(timelineSourceEffective, timelineTargetSamples);

  const positionTimeLabels = sampledTimeline.map((p, idx) => {
    const tsMs = timestampMs(p.timestamp);
    return tsMs === null ? `${t("point_label")} ${idx + 1}` : toHour(p.timestamp);
  });
  const zoneTimeline = sampledTimeline.map((p) => normalizeZoneTimelineKey(p?.zone));
  const dwellMinutesByIndex = new Array(zoneTimeline.length).fill(null);
  let segStart = 0;
  while (segStart < zoneTimeline.length) {
    const segZone = zoneTimeline[segStart];
    let segEnd = segStart;
    while (segEnd + 1 < zoneTimeline.length && zoneTimeline[segEnd + 1] === segZone) {
      segEnd += 1;
    }
    const startMs = timestampMs(sampledTimeline[segStart]?.timestamp);
    const endMs = timestampMs(sampledTimeline[segEnd]?.timestamp);
    const dwellMin = startMs !== null && endMs !== null ? Math.max(0, (endMs - startMs) / 60000) : null;
    for (let i = segStart; i <= segEnd; i += 1) {
      dwellMinutesByIndex[i] = dwellMin;
    }
    segStart = segEnd + 1;
  }
  const zoneSeriesDefs = [
    { key: "wheel_zone", name: t("zone_wheel"), color: c.green },
    { key: "food_zone", name: t("zone_food"), color: c.amber },
    { key: "sand_bath_zone", name: t("zone_sand"), color: c.blue },
    { key: "hideout_zone", name: t("zone_hideout"), color: c.teal },
    { key: "outside", name: t("zone_outside"), color: c.red },
    { key: "unknown", name: t("zone_unknown"), color: c.mint },
  ];
  charts["chart-position-time"].setOption(
    setCommonChartStyle({
      grid: { left: 44, right: 20, top: 30, bottom: 44 },
      tooltip: themedTooltip("axis", {
        formatter: (params) => {
          const items = Array.isArray(params) ? params : [params];
          const dataIndex = Number.isFinite(Number(items[0]?.dataIndex)) ? Number(items[0].dataIndex) : -1;
          const zoneItem = items.find((item) => Number(item?.data) > 0.5);
          const zoneName = zoneItem?.seriesName || t("zone_unknown");
          const dwellMin = dataIndex >= 0 ? dwellMinutesByIndex[dataIndex] : null;
          const dwellText = dwellMin !== null ? `${fmtNumber(dwellMin, 1)} ${t("axis_minutes")}` : "-";
          const timeText = String(items[0]?.axisValueLabel || "-");
          return `${t("trajectory_time")}: ${timeText}<br/>${t("trajectory_zone")}: ${zoneName}<br/>${t("trajectory_dwell")}: ${dwellText}`;
        },
      }),
      xAxis: {
        type: "category",
        data: positionTimeLabels,
        axisLabel: {
          color: c.axis,
          interval: Math.max(0, Math.ceil(positionTimeLabels.length / 10)),
        },
      },
      yAxis: {
        type: "value",
        min: 0,
        max: 1,
        name: t("axis_ratio"),
        axisLabel: { color: c.axis, formatter: (v) => (Number(v) === 1 ? "1" : "") },
        splitLine: { show: false },
      },
      legend: { data: zoneSeriesDefs.map((item) => item.name), textStyle: { color: c.legend } },
      series: zoneSeriesDefs.map((item) => ({
        type: "bar",
        name: item.name,
        stack: "zone",
        barWidth: "96%",
        barGap: "-100%",
        data: zoneTimeline.map((zoneKey) => (zoneKey === item.key ? 1 : 0)),
        itemStyle: { color: item.color, opacity: 0.86 },
        emphasis: { focus: "series" },
        silent: false,
      })),
    })
  );

  const ratio = spatial.zone_dwell_ratio || {};
  charts["chart-zone-dwell"].setOption({
    animationDuration: 500,
    tooltip: themedTooltip("item"),
    legend: { bottom: 0, textStyle: { color: c.legend } },
    series: [
      {
        type: "pie",
        center: ["50%", "46%"],
        radius: ["28%", "66%"],
        data: [
          { name: t("zone_wheel"), value: ratio.wheel_zone ?? 0, itemStyle: { color: c.green } },
          { name: t("zone_food"), value: ratio.food_zone ?? 0, itemStyle: { color: c.amber } },
          { name: t("zone_sand"), value: ratio.sand_bath_zone ?? 0, itemStyle: { color: c.blue } },
          { name: t("zone_hideout"), value: ratio.hideout_zone ?? 0, itemStyle: { color: c.teal } },
        ],
        label: { formatter: ({ name, value }) => `${name}: ${(value * 100).toFixed(1)}%`, color: c.label },
      },
    ],
  });

  const escapeEvents = spatial.escape_events || [];
  charts["chart-escape"].setOption(
    setCommonChartStyle({
      xAxis: { type: "category", data: escapeEvents.map((e) => toHour(e.timestamp)), axisLabel: { color: c.axis } },
      yAxis: { type: "value", name: t("axis_events") },
      series: [{ type: "bar", data: escapeEvents.map(() => 1), itemStyle: { color: c.red, borderRadius: [5, 5, 0, 0] }, barMaxWidth: 18 }],
    })
  );
}

function renderHealth(data) {
  const c = chartColors();
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
      splitLine: { lineStyle: { color: c.radarLine } },
      axisLine: { lineStyle: { color: c.radarLine } },
      splitArea: { areaStyle: { color: [c.radarArea] } },
    },
    series: [
      {
        type: "radar",
        data: [
          {
            value: [latest.fur_score, latest.expression_score, latest.gait_symmetry_score, Math.max(0, 1 - Math.abs(latest.volume_change_ratio))],
            areaStyle: { color: currentTheme === "light" ? "rgba(47,155,133,0.2)" : "rgba(60,198,168,0.25)" },
            lineStyle: { color: c.teal },
            itemStyle: { color: c.teal },
          },
        ],
      },
    ],
  });

  charts["chart-health-trend"].setOption(
    setCommonChartStyle({
      xAxis: { type: "category", data: scans.map((x) => toHour(x.timestamp)), axisLabel: { color: c.axis } },
      yAxis: [
        { type: "value", min: 0, max: 1, name: t("axis_scores") },
        { type: "value", min: -0.3, max: 0.3, name: t("axis_volume") },
      ],
      legend: { data: [t("legend_fur"), t("legend_expression"), t("legend_gait"), t("legend_volume")], textStyle: { color: c.legend } },
      series: [
        { type: "line", name: t("legend_fur"), showSymbol: false, smooth: true, data: scans.map((x) => x.fur_score), lineStyle: { color: c.teal } },
        { type: "line", name: t("legend_expression"), showSymbol: false, smooth: true, data: scans.map((x) => x.expression_score), lineStyle: { color: c.blue } },
        { type: "line", name: t("legend_gait"), showSymbol: false, smooth: true, data: scans.map((x) => x.gait_symmetry_score), lineStyle: { color: c.amber } },
        { type: "line", name: t("legend_volume"), yAxisIndex: 1, showSymbol: false, smooth: true, data: scans.map((x) => x.volume_change_ratio), lineStyle: { color: c.coral } },
      ],
    })
  );
}

function renderInventory(data) {
  const c = chartColors();
  const water = data.inventory?.water_series || [];
  const food = data.inventory?.food_series || [];
  const gnaw = data.inventory?.gnaw_series || [];

  charts["chart-resource"].setOption(
    setCommonChartStyle({
      xAxis: { type: "category", data: water.map((x) => toHour(x.timestamp)), axisLabel: { color: c.axis, interval: 120 } },
      yAxis: { type: "value", min: 0, max: 1 },
      legend: { data: [t("legend_water"), t("legend_food")], textStyle: { color: c.legend } },
      series: [
        { type: "line", name: t("legend_water"), smooth: true, showSymbol: false, data: water.map((x) => x.value), lineStyle: { color: c.blue }, areaStyle: { color: currentTheme === "light" ? "rgba(63,133,215,0.13)" : "rgba(74,163,255,0.14)" } },
        { type: "line", name: t("legend_food"), smooth: true, showSymbol: false, data: food.map((x) => x.value), lineStyle: { color: c.amber }, areaStyle: { color: currentTheme === "light" ? "rgba(205,154,67,0.14)" : "rgba(255,191,91,0.14)" } },
      ],
    })
  );

  charts["chart-gnaw"].setOption(
    setCommonChartStyle({
      xAxis: { type: "category", data: gnaw.map((x) => toHour(x.timestamp)), axisLabel: { color: c.axis, interval: 120 } },
      yAxis: { type: "value", min: 0, max: 1 },
      series: [{ type: "line", smooth: true, showSymbol: false, data: gnaw.map((x) => x.value), lineStyle: { color: c.orange, width: 2 }, areaStyle: { color: currentTheme === "light" ? "rgba(207,134,100,0.16)" : "rgba(255,143,102,0.16)" } }],
    })
  );

  const hoard = data.inventory?.hoard_hotspots || [];
  charts["chart-hoard"].setOption({
    animationDuration: 500,
    grid: { left: 42, right: 14, top: 24, bottom: 30 },
    xAxis: { type: "value", min: 0, max: 39, axisLabel: { color: c.axis } },
    yAxis: { type: "value", min: 0, max: 23, inverse: true, axisLabel: { color: c.axis } },
    tooltip: themedTooltip("item"),
    visualMap: {
      min: 0,
      max: 1,
      calculable: true,
      orient: "horizontal",
      left: "center",
      bottom: 0,
      textStyle: { color: c.heatLabel },
      inRange: { color: c.hoardRange },
    },
    series: [{ type: "scatter", symbolSize: (val) => 18 + val[2] * 22, data: hoard.map((x) => [x.grid_col, x.grid_row, x.intensity]), itemStyle: { opacity: 0.9 } }],
  });
}

function renderBehavior(data) {
  const c = chartColors();
  const hourly = data.behavior?.hourly || [];
  const anxiety = data.behavior?.anxiety_series || [];

  charts["chart-behavior-hourly"].setOption(
    setCommonChartStyle({
      xAxis: { type: "category", data: hourly.map((x) => x.hour), axisLabel: { color: c.axis } },
      yAxis: [{ type: "value", name: t("axis_count") }, { type: "value", name: t("axis_minutes") }],
      legend: { data: [t("legend_grooming"), t("legend_digging")], textStyle: { color: c.legend } },
      series: [
        { type: "bar", name: t("legend_grooming"), data: hourly.map((x) => x.grooming_count), itemStyle: { color: c.teal, borderRadius: [4, 4, 0, 0] } },
        { type: "line", name: t("legend_digging"), yAxisIndex: 1, smooth: true, showSymbol: false, data: hourly.map((x) => x.digging_minutes), lineStyle: { color: c.amber } },
      ],
    })
  );

  charts["chart-anxiety"].setOption(
    setCommonChartStyle({
      xAxis: { type: "category", data: anxiety.map((x) => toHour(x.timestamp)), axisLabel: { color: c.axis, interval: 120 } },
      yAxis: { type: "value", min: 0, max: 1 },
      series: [
        {
          type: "line",
          smooth: true,
          showSymbol: false,
          data: anxiety.map((x) => x.anxiety_index),
          lineStyle: { color: c.red, width: 2 },
          areaStyle: { color: currentTheme === "light" ? "rgba(212,96,90,0.16)" : "rgba(255,107,99,0.17)" },
          markLine: { data: [{ yAxis: 0.7, name: t("alert_threshold") }], lineStyle: { color: c.markLine }, label: { color: c.markLabel } },
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
  const c = chartColors();
  const envSeries = data.environment?.series || [];

  charts["chart-env-comfort"].setOption(
    setCommonChartStyle({
      xAxis: { type: "category", data: envSeries.map((x) => toHour(x.timestamp)), axisLabel: { color: c.axis, interval: 120 } },
      yAxis: { type: "value", min: 0, max: 1 },
      series: [
        {
          type: "line",
          smooth: true,
          showSymbol: false,
          data: envSeries.map((x) => x.comfort_index),
          lineStyle: { color: c.green, width: 2 },
          areaStyle: { color: currentTheme === "light" ? "rgba(103,173,125,0.2)" : "rgba(124,224,157,0.2)" },
          markLine: {
            data: [{ yAxis: 0.7, name: t("good_line") }, { yAxis: 0.45, name: t("risk_line") }],
            lineStyle: { color: c.markLine },
            label: { color: c.markLabel },
          },
        },
      ],
    })
  );

  charts["chart-env-factors"].setOption(
    setCommonChartStyle({
      xAxis: { type: "category", data: envSeries.map((x) => toHour(x.timestamp)), axisLabel: { color: c.axis, interval: 120 } },
      yAxis: { type: "value", min: 0, max: 1 },
      legend: { data: [t("legend_lighting"), t("legend_cleanliness"), t("legend_bedding")], textStyle: { color: c.legend } },
      series: [
        { type: "line", name: t("legend_lighting"), smooth: true, showSymbol: false, data: envSeries.map((x) => x.lighting_score), lineStyle: { color: c.amber } },
        { type: "line", name: t("legend_cleanliness"), smooth: true, showSymbol: false, data: envSeries.map((x) => x.cleanliness_score), lineStyle: { color: c.blue } },
        { type: "line", name: t("legend_bedding"), smooth: true, showSymbol: false, data: envSeries.map((x) => x.bedding_evenness), lineStyle: { color: c.teal } },
      ],
    })
  );
}

function renderMotion(data) {
  const c = chartColors();
  const series = data.motion?.series || [];
  charts["chart-motion"].setOption(
    setCommonChartStyle({
      xAxis: { type: "category", data: series.map((x) => toHour(x.timestamp)), axisLabel: { color: c.axis, interval: 120 } },
      yAxis: [{ type: "value", min: 0, max: 0.1, name: t("axis_ratio") }, { type: "value", min: 0, max: 1, name: t("axis_capture") }],
      legend: { data: [t("legend_motion_ratio"), t("legend_capture_active")], textStyle: { color: c.legend } },
      series: [
        { type: "line", name: t("legend_motion_ratio"), smooth: true, showSymbol: false, data: series.map((x) => x.motion_ratio), lineStyle: { color: c.orange } },
        {
          type: "bar",
          name: t("legend_capture_active"),
          yAxisIndex: 1,
          data: series.map((x) => (x.capture_active ? 1 : 0)),
          barMaxWidth: 10,
          itemStyle: { color: c.captureBar, borderRadius: [2, 2, 0, 0] },
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

function renderFeaturedPhoto(data) {
  const box = document.getElementById("featured-photo-box");
  if (!box) {
    return;
  }

  const featured = data.overview?.featured_photo;
  if (!featured || typeof featured !== "object" || !featured.image_b64) {
    featuredFeedbackMessage = "";
    box.innerHTML = `<div class="featured-photo-empty">${t("overview_photo_empty")}</div>`;
    return;
  }

  const feedback = data.overview?.featured_photo_feedback || {};
  const goodCount = Number(feedback.good_count ?? 0);
  const badCount = Number(feedback.bad_count ?? 0);
  const feedbackStats = formatText("overview_photo_feedback_stats", {
    good: Math.max(0, Math.round(goodCount)),
    bad: Math.max(0, Math.round(badCount)),
  });
  const feedbackText = featuredFeedbackMessage || feedbackStats;
  const candidateId = String(featured.candidate_id || "");

  const timestampText = featured.timestamp ? new Date(featured.timestamp).toLocaleString() : "-";
  const scoreText = Number.isFinite(Number(featured.score)) ? fmtNumber(featured.score, 2) : "-";
  const width = Number(featured.width);
  const height = Number(featured.height);
  const sizeText = width > 0 && height > 0 ? `${Math.round(width)} × ${Math.round(height)}` : "-";
  const imageSrc = `data:image/jpeg;base64,${featured.image_b64}`;

  box.innerHTML = `
    <figure class="featured-photo-figure">
      <div class="featured-photo-image-wrap">
        <img class="featured-photo-image" src="${imageSrc}" alt="${escapeHtml(t("overview_photo_alt"))}" loading="lazy" />
        <span class="featured-photo-badge">${t("overview_photo_badge")}</span>
      </div>
      <figcaption class="featured-photo-meta">
        <span class="featured-photo-chip">${t("overview_photo_time")}: <strong>${escapeHtml(timestampText)}</strong></span>
        <span class="featured-photo-chip">${t("overview_photo_score")}: <strong>${escapeHtml(scoreText)}</strong></span>
        <span class="featured-photo-chip">${t("overview_photo_size")}: <strong>${escapeHtml(sizeText)}</strong></span>
      </figcaption>
      <div class="featured-photo-feedback">
        <p class="featured-photo-feedback-label">${escapeHtml(t("overview_photo_feedback_prompt"))}</p>
        <div class="featured-photo-feedback-btns">
          <button
            class="btn btn-ghost btn-xs featured-photo-feedback-btn"
            data-feedback-label="good"
            data-candidate-id="${escapeHtml(candidateId)}"
            ${featuredFeedbackBusy || !candidateId ? "disabled" : ""}
          >${escapeHtml(t("overview_photo_feedback_good"))}</button>
          <button
            class="btn btn-ghost btn-xs featured-photo-feedback-btn"
            data-feedback-label="bad"
            data-candidate-id="${escapeHtml(candidateId)}"
            ${featuredFeedbackBusy || !candidateId ? "disabled" : ""}
          >${escapeHtml(t("overview_photo_feedback_bad"))}</button>
        </div>
        <p class="featured-photo-feedback-status">${escapeHtml(feedbackText)}</p>
      </div>
    </figure>
  `;

  box.querySelectorAll(".featured-photo-feedback-btn").forEach((button) => {
    button.addEventListener("click", () => {
      const label = button.getAttribute("data-feedback-label") || "";
      const id = button.getAttribute("data-candidate-id") || "";
      submitFeaturedPhotoFeedback(label, id);
    });
  });
}

async function submitFeaturedPhotoFeedback(label, candidateId) {
  if (featuredFeedbackBusy) {
    return;
  }
  if (!(label === "good" || label === "bad")) {
    return;
  }
  if (!candidateId) {
    return;
  }

  featuredFeedbackBusy = true;
  featuredFeedbackMessage = t("overview_photo_feedback_sending");
  if (lastDashboardData) {
    renderFeaturedPhoto(lastDashboardData);
  }

  try {
    const endpoint = `/api/demo/featured-photo/feedback?label=${encodeURIComponent(label)}&candidate_id=${encodeURIComponent(candidateId)}`;
    const response = await fetch(endpoint, { method: "POST" });
    if (!response.ok) {
      const text = await responseDetailText(response);
      throw new Error(text || String(response.status));
    }

    featuredFeedbackMessage = label === "good"
      ? t("overview_photo_feedback_good_ok")
      : t("overview_photo_feedback_bad_ok");
    await loadDashboard(false);
  } catch (err) {
    featuredFeedbackMessage = formatText("overview_photo_feedback_fail", { error: String(err.message || err) });
  } finally {
    featuredFeedbackBusy = false;
    if (lastDashboardData) {
      renderFeaturedPhoto(lastDashboardData);
    }
  }
}

function renderOverviewQuickStats(data) {
  const box = document.getElementById("overview-quick-stats");
  if (!box) {
    return;
  }

  const meta = data.meta || {};
  const sourceText = meta.source ? String(meta.source) : "-";
  const analyzedCount = Number(meta.analysis_analyzed_count ?? 0);
  const processedCount = Number(meta.analysis_processed_count ?? 0);
  const framesText = analyzedCount > 0 || processedCount > 0 ? `${Math.round(analyzedCount)} / ${Math.round(processedCount)}` : "-";
  const fps = Number(meta.analysis_source_fps);
  const fpsText = Number.isFinite(fps) && fps > 0 ? fmtNumber(fps, 2) : "-";
  const step = Number(meta.analysis_frame_step);
  const stepText = Number.isFinite(step) && step > 0 ? `1/${Math.round(step)}` : "-";
  const bevText = meta.spatial_bev_enabled ? t("overview_bev_enabled") : t("overview_bev_disabled");
  const analyzedAt = meta.uploaded_analyzed_at ? new Date(meta.uploaded_analyzed_at).toLocaleString() : "-";

  const cards = [
    [t("overview_metric_source"), sourceText],
    [t("overview_metric_frames"), framesText],
    [t("overview_metric_fps"), fpsText],
    [t("overview_metric_step"), stepText],
    [t("overview_metric_bev"), bevText],
    [t("overview_metric_analyzed_at"), analyzedAt],
  ];

  box.innerHTML = cards
    .map(
      ([label, value]) => `
        <div class="overview-stat-card">
          <p class="overview-stat-label">${escapeHtml(label)}</p>
          <p class="overview-stat-value">${escapeHtml(String(value))}</p>
        </div>
      `
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
  const nextUploadedAnalyzedAt = String(data.meta?.uploaded_analyzed_at || "");
  if (nextUploadedAnalyzedAt !== uploadedAnalyzedAt) {
    uploadedAnalyzedAt = nextUploadedAnalyzedAt;
    featuredFeedbackMessage = "";
  }
  updateModeSelectorsLabel();
  updateUploadBlockVisibility();
}

function renderDashboard(data) {
  renderGeneratedAt(data);
  renderLiveVideoPanel();
  renderKpis(data.summary);
  renderFeaturedPhoto(data);
  renderOverviewQuickStats(data);
  renderAlerts(data);
  if (!hasChartsInitialized()) {
    return;
  }
  renderOdometer(data);
  renderSpatial(data);
  renderHealth(data);
  renderInventory(data);
  renderBehavior(data);
  renderEnvironment(data);
  renderMotion(data);
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

function loadImageFromDataUrl(dataUrl) {
  const image = new Image();
  return new Promise((resolve, reject) => {
    let settled = false;
    const finish = (callback) => {
      if (settled) return;
      settled = true;
      image.onload = null;
      image.onerror = null;
      callback();
    };

    image.onload = () => finish(() => resolve(image));
    image.onerror = () => finish(() => reject(new Error("image decode failed")));
    image.src = dataUrl;

    if (image.complete && image.naturalWidth > 0 && image.naturalHeight > 0) {
      finish(() => resolve(image));
    }
  });
}

function isInitMappingPreviewEnabled() {
  return currentRunMode === "demo";
}

function updateInitMappingVisibility() {
  const panel = document.getElementById("init-map-compare");
  if (!panel) {
    return;
  }
  const visible = isInitMappingPreviewEnabled();
  panel.classList.toggle("hidden", !visible);
  if (!visible) {
    clearInitMappingPreviewTimer();
    return;
  }
  if (initState.image) {
    drawInitMappingBeforePreview();
    drawInitMappingAfterPreview();
    refreshInitMappingStatusText();
  }
}

function clearInitMappingPreviewTimer() {
  if (initState.mapPreviewTimer) {
    window.clearTimeout(initState.mapPreviewTimer);
    initState.mapPreviewTimer = 0;
  }
}

function clonePolygonPoints(points) {
  if (!Array.isArray(points)) {
    return [];
  }
  const out = [];
  for (const point of points) {
    const x = Number(point?.[0]);
    const y = Number(point?.[1]);
    if (!Number.isFinite(x) || !Number.isFinite(y)) {
      continue;
    }
    out.push([Math.round(x), Math.round(y)]);
  }
  return out;
}

function initMappingPayloadFromState() {
  return {
    frame_width: Math.max(1, Math.round(initState.frameWidth || initState.canvas?.width || 0)),
    frame_height: Math.max(1, Math.round(initState.frameHeight || initState.canvas?.height || 0)),
    source: initState.requestedSource || "auto",
    preview_token: initState.previewToken || "",
    fence_polygon: clonePolygonPoints(initState.polygons.fence_polygon),
    wheel_mask_polygon: clonePolygonPoints(initState.polygons.wheel_mask_polygon),
    zones: {
      food_zone: clonePolygonPoints(initState.polygons.food_zone),
      sand_bath_zone: clonePolygonPoints(initState.polygons.sand_bath_zone),
      hideout_zone: clonePolygonPoints(initState.polygons.hideout_zone),
    },
  };
}

function drawPolygonOverlay(
  ctx,
  polygons,
  closed,
  activeKey,
  scaleX = 1,
  scaleY = 1,
  pointRadius = 3.2
) {
  for (const step of INIT_STEPS) {
    const pts = polygons[step.key] || [];
    if (pts.length === 0) {
      continue;
    }

    const color = STEP_COLORS[step.key] || "#ffffff";
    ctx.strokeStyle = color;
    ctx.fillStyle = `${color}33`;
    ctx.lineWidth = step.key === activeKey ? 2.4 : 1.5;

    ctx.beginPath();
    ctx.moveTo(pts[0][0] * scaleX, pts[0][1] * scaleY);
    for (let i = 1; i < pts.length; i += 1) {
      ctx.lineTo(pts[i][0] * scaleX, pts[i][1] * scaleY);
    }
    if (closed?.[step.key]) {
      ctx.closePath();
      ctx.fill();
    }
    ctx.stroke();

    for (const [x, y] of pts) {
      ctx.beginPath();
      ctx.arc(x * scaleX, y * scaleY, pointRadius, 0, Math.PI * 2);
      ctx.fillStyle = color;
      ctx.fill();
    }
  }
}

function drawInitCanvas() {
  if (!initState.ctx || !initState.image) {
    return;
  }

  const ctx = initState.ctx;
  ctx.clearRect(0, 0, initState.canvas.width, initState.canvas.height);
  ctx.drawImage(initState.image, 0, 0);
  drawPolygonOverlay(
    ctx,
    initState.polygons,
    initState.closed,
    INIT_STEPS[initState.activeIndex]?.key || ""
  );
}

function fitCanvasToSource(canvas, sourceWidth, sourceHeight, maxHeight) {
  const parent = canvas?.parentElement;
  const availableWidth = Math.max(120, Math.floor((parent?.clientWidth || sourceWidth) - 2));
  const availableHeight = Math.max(90, maxHeight);
  const scale = Math.min(availableWidth / sourceWidth, availableHeight / sourceHeight, 1);
  const drawWidth = Math.max(1, Math.floor(sourceWidth * scale));
  const drawHeight = Math.max(1, Math.floor(sourceHeight * scale));
  canvas.width = drawWidth;
  canvas.height = drawHeight;
  canvas.style.width = `${drawWidth}px`;
  canvas.style.height = `${drawHeight}px`;
  return {
    drawWidth,
    drawHeight,
    scaleX: drawWidth / Math.max(sourceWidth, 1),
    scaleY: drawHeight / Math.max(sourceHeight, 1),
  };
}

function drawInitMappingBeforePreview() {
  if (!initState.mapBeforeCanvas || !initState.mapBeforeCtx || !initState.image) {
    return;
  }
  if (!isInitMappingPreviewEnabled()) {
    return;
  }

  const canvas = initState.mapBeforeCanvas;
  const ctx = initState.mapBeforeCtx;
  const sourceWidth = Math.max(1, initState.image.width || initState.canvas?.width || 1);
  const sourceHeight = Math.max(1, initState.image.height || initState.canvas?.height || 1);
  const layout = fitCanvasToSource(canvas, sourceWidth, sourceHeight, INIT_MAP_PREVIEW_MAX_HEIGHT);
  ctx.clearRect(0, 0, layout.drawWidth, layout.drawHeight);
  ctx.drawImage(initState.image, 0, 0, layout.drawWidth, layout.drawHeight);

  drawPolygonOverlay(
    ctx,
    initState.polygons,
    initState.closed,
    INIT_STEPS[initState.activeIndex]?.key || "",
    layout.scaleX,
    layout.scaleY,
    2.1
  );

  const sourceQuad = initState.mapPreviewData?.source_quad;
  if (Array.isArray(sourceQuad) && sourceQuad.length === 4) {
    ctx.save();
    ctx.strokeStyle = currentTheme === "light" ? "#16335b" : "#d8efff";
    ctx.lineWidth = 1.3;
    ctx.setLineDash([6, 4]);
    ctx.beginPath();
    for (let i = 0; i < sourceQuad.length; i += 1) {
      const point = sourceQuad[i];
      const x = Number(point?.[0]) * layout.scaleX;
      const y = Number(point?.[1]) * layout.scaleY;
      if (i === 0) {
        ctx.moveTo(x, y);
      } else {
        ctx.lineTo(x, y);
      }
    }
    ctx.closePath();
    ctx.stroke();
    ctx.restore();
  }
}

function drawInitMappingAfterPreview(previewData = initState.mapPreviewData) {
  if (!initState.mapAfterCanvas || !initState.mapAfterCtx) {
    return;
  }
  if (!isInitMappingPreviewEnabled()) {
    return;
  }

  const canvas = initState.mapAfterCanvas;
  const ctx = initState.mapAfterCtx;
  const mappedImage = initState.mapAfterImage;
  const sourceWidth = Math.max(
    1,
    Number(mappedImage?.width || 0)
      || Number(previewData?.width)
      || initState.canvas?.width
      || 1
  );
  const sourceHeight = Math.max(
    1,
    Number(mappedImage?.height || 0)
      || Number(previewData?.height)
      || initState.canvas?.height
      || 1
  );
  const layout = fitCanvasToSource(canvas, sourceWidth, sourceHeight, INIT_MAP_PREVIEW_MAX_HEIGHT);
  ctx.clearRect(0, 0, layout.drawWidth, layout.drawHeight);

  if (mappedImage) {
    ctx.drawImage(mappedImage, 0, 0, layout.drawWidth, layout.drawHeight);
  } else {
    const bg = currentTheme === "light" ? "#e7f0ef" : "#112333";
    const grid = currentTheme === "light" ? "rgba(41, 83, 103, 0.16)" : "rgba(181, 228, 255, 0.12)";
    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, layout.drawWidth, layout.drawHeight);
    ctx.strokeStyle = grid;
    ctx.lineWidth = 1;
    const step = Math.max(18, Math.floor(layout.drawWidth / 12));
    for (let x = 0; x <= layout.drawWidth; x += step) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, layout.drawHeight);
      ctx.stroke();
    }
    for (let y = 0; y <= layout.drawHeight; y += step) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(layout.drawWidth, y);
      ctx.stroke();
    }
  }

  const mapped = previewData?.mapped || {};
  const mappedZones = mapped.zones || {};
  const mappedPolygons = {
    fence_polygon: mapped.fence_polygon || [],
    wheel_mask_polygon: mapped.wheel_mask_polygon || [],
    food_zone: mappedZones.food_zone || [],
    sand_bath_zone: mappedZones.sand_bath_zone || [],
    hideout_zone: mappedZones.hideout_zone || [],
  };
  const mappedClosed = {};
  for (const stepItem of INIT_STEPS) {
    mappedClosed[stepItem.key] = (mappedPolygons[stepItem.key] || []).length >= 3;
  }

  drawPolygonOverlay(
    ctx,
    mappedPolygons,
    mappedClosed,
    INIT_STEPS[initState.activeIndex]?.key || "",
    layout.scaleX,
    layout.scaleY,
    2
  );
}

function setInitMapStatus(text) {
  const node = document.getElementById("init-map-status");
  if (!node) {
    return;
  }
  node.textContent = text;
}

function refreshInitMappingStatusText() {
  if (!isInitMappingPreviewEnabled()) {
    return;
  }
  const preview = initState.mapPreviewData;
  if (preview?.enabled) {
    const errorValue = Number(preview.boundary_error);
    const errorText = Number.isFinite(errorValue) ? fmtNumber(errorValue, 4) : "-";
    setInitMapStatus(formatText("init_map_status_ready", { error: errorText }));
    return;
  }
  if (preview?.reason) {
    setInitMapStatus(formatText("init_map_status_unavailable", { reason: String(preview.reason) }));
    return;
  }
  setInitMapStatus(t("init_map_status_pending"));
}

async function loadInitMappingPreview() {
  if (!isInitMappingPreviewEnabled() || !initState.image) {
    return;
  }

  const payload = initMappingPayloadFromState();
  if ((payload.fence_polygon || []).length < 4) {
    initState.mapAfterImage = null;
    initState.mapPreviewData = null;
    drawInitMappingBeforePreview();
    drawInitMappingAfterPreview();
    refreshInitMappingStatusText();
    return;
  }

  const requestId = initState.mapRequestSeq + 1;
  initState.mapRequestSeq = requestId;
  setInitMapStatus(t("init_map_status_loading"));

  let response;
  try {
    response = await fetch("/api/init/mapping-preview", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
  } catch (err) {
    if (requestId !== initState.mapRequestSeq) {
      return;
    }
    setInitMapStatus(formatText("init_map_status_error", { error: String(err) }));
    return;
  }

  if (requestId !== initState.mapRequestSeq) {
    return;
  }

  if (!response.ok) {
    const detail = await responseDetailText(response);
    setInitMapStatus(formatText("init_map_status_error", { error: detail }));
    return;
  }

  const preview = await response.json();
  if (requestId !== initState.mapRequestSeq) {
    return;
  }

  let mappedImage = null;
  const mappedB64 = String(preview?.image_b64 || "");
  if (mappedB64) {
    try {
      mappedImage = await loadImageFromDataUrl(`data:image/jpeg;base64,${mappedB64}`);
    } catch (_err) {
      mappedImage = null;
    }
    if (requestId !== initState.mapRequestSeq) {
      return;
    }
  }

  initState.mapAfterImage = mappedImage;
  initState.mapPreviewData = preview;
  drawInitMappingBeforePreview();
  drawInitMappingAfterPreview(preview);
  refreshInitMappingStatusText();
}

function scheduleInitMappingPreview(immediate = false) {
  drawInitMappingBeforePreview();
  drawInitMappingAfterPreview();
  if (!isInitMappingPreviewEnabled() || !initState.image) {
    return;
  }

  clearInitMappingPreviewTimer();
  if (immediate) {
    void loadInitMappingPreview();
    return;
  }
  initState.mapPreviewTimer = window.setTimeout(() => {
    initState.mapPreviewTimer = 0;
    void loadInitMappingPreview();
  }, INIT_MAP_PREVIEW_DEBOUNCE_MS);
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
  drawInitMappingBeforePreview();
  drawInitMappingAfterPreview();
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
  if (id === "init-modal") {
    clearInitMappingPreviewTimer();
    initState.mapRequestSeq += 1;
    initState.mapAfterImage = null;
  }
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

  const image = await loadImageFromDataUrl(`data:image/jpeg;base64,${payload.image_b64}`);

  initState.image = image;
  initState.canvas.width = image.width;
  initState.canvas.height = image.height;
  initState.frameWidth = Number(payload.width || image.width || 0);
  initState.frameHeight = Number(payload.height || image.height || 0);
  initState.previewToken = String(payload.preview_token || "");
  initState.requestedSource = String(payload.requested_source || source || "auto");

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
  initState.mapAfterImage = null;
  initState.mapPreviewData = null;
  initState.mapRequestSeq += 1;
  drawInitCanvas();
  renderInitSteps();
  layoutInitCanvasDisplay();
  updateInitMappingVisibility();
  scheduleInitMappingPreview(true);
  window.requestAnimationFrame(() => layoutInitCanvasDisplay());
  document.getElementById("init-status").textContent = formatText("init_status_source", { source: sourceLabel(payload.source) });
}

async function fetchInitFramePayload(source = "auto") {
  const query = new URLSearchParams({ source, max_width: "0" });
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
  throw new Error(`init frame request failed: ${detail}`);
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
  scheduleInitMappingPreview();
}

function onCanvasDoubleClick(event) {
  event.preventDefault();
  const key = currentStepKey();
  if ((initState.polygons[key] || []).length >= 3) {
    initState.closed[key] = true;
    drawInitCanvas();
    renderInitSteps();
    scheduleInitMappingPreview();
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
  scheduleInitMappingPreview();
}

function clearRegion() {
  const key = currentStepKey();
  initState.polygons[key] = [];
  initState.closed[key] = false;
  drawInitCanvas();
  renderInitSteps();
  scheduleInitMappingPreview();
}

function switchStep(delta) {
  const next = Math.min(Math.max(initState.activeIndex + delta, 0), INIT_STEPS.length - 1);
  initState.activeIndex = next;
  renderInitSteps();
  drawInitCanvas();
  drawInitMappingBeforePreview();
  drawInitMappingAfterPreview();
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

  const shouldAutoAnalyze =
    currentRunMode === "demo"
    && currentDemoSource === "uploaded_video"
    && !uploadedZoneRequired
    && Boolean(uploadedVideoKey || uploadedVideoName);
  if (shouldAutoAnalyze) {
    const analyzed = await analyzeUploadedVideoWithStatus(statusNode, false);
    if (analyzed) {
      closeModal("init-modal");
      return;
    }
  }

  await loadDashboard(false);
}

function shouldForceDashboardRefresh() {
  return currentRunMode === "demo" && currentDemoSource === "virtual";
}

function syncModeFromRaw(raw) {
  currentRunMode = raw?.app?.run_mode || "demo";
  currentDemoSource = raw?.app?.demo_source || "virtual";
  updateModeSelectorsLabel();
  updateUploadBlockVisibility();
  updateInitMappingVisibility();
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
    uploadedAnalyzedAt = String(status.uploaded_analyzed_at || uploadedAnalyzedAt || "");
    updateModeSelectorsLabel();
    renderUploadedVideoSelector();
    updateUploadBlockVisibility();
    renderLiveVideoPanel();
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

function sleepMs(ms) {
  return new Promise((resolve) => {
    window.setTimeout(resolve, ms);
  });
}

function shouldPollAfterAnalyzeFailure(statusCode, detail) {
  if ([408, 429, 500, 502, 503, 504].includes(Number(statusCode))) {
    return true;
  }
  const text = String(detail || "").toLowerCase();
  return (
    text.includes("timeout")
    || text.includes("timed out")
    || text.includes("upstream")
    || text.includes("connection reset")
    || text.includes("failed to fetch")
  );
}

async function waitForUploadedAnalyzeResult(statusNode, previousAnalyzedAt) {
  const status = statusNode || document.getElementById("settings-upload-status");
  const startedAt = Date.now();
  let lastError = "";

  while (Date.now() - startedAt < ANALYZE_RESULT_POLL.timeoutMs) {
    try {
      await loadDemoStatus();
    } catch (err) {
      lastError = String(err);
    }

    try {
      await loadDashboard(false);
    } catch (err) {
      lastError = String(err);
    }

    const hasNewAnalyzeTimestamp = Boolean(uploadedAnalyzedAt) && uploadedAnalyzedAt !== previousAnalyzedAt;
    const dashboardAnalyzed = String(lastDashboardData?.meta?.status_message || "") === "video analyzed";
    if (hasNewAnalyzeTimestamp || dashboardAnalyzed) {
      if (status) {
        status.textContent = t("upload_status_analyze_ok");
      }
      return true;
    }

    if (status) {
      status.textContent = t("upload_status_analyze_waiting");
    }
    await sleepMs(ANALYZE_RESULT_POLL.intervalMs);
  }

  const reason = lastError || t("upload_status_analyze_timeout");
  if (status) {
    status.textContent = formatText("upload_status_analyze_fail", { error: reason });
  }
  return false;
}

function formatMb(bytes) {
  return (Number(bytes || 0) / (1024 * 1024)).toFixed(2);
}

function makePreviewToken() {
  const randomPart = Math.random().toString(36).slice(2, 10);
  return `pv_${Date.now()}_${randomPart}`;
}

function withTimeout(promise, ms, label) {
  return new Promise((resolve, reject) => {
    const timer = window.setTimeout(() => {
      reject(new Error(`${label} timeout`));
    }, ms);
    promise.then(
      (value) => {
        window.clearTimeout(timer);
        resolve(value);
      },
      (err) => {
        window.clearTimeout(timer);
        reject(err);
      }
    );
  });
}

function waitForVideoReadyState(video, minReadyState, successEvents, errorMessage) {
  return new Promise((resolve, reject) => {
    if (video.readyState >= minReadyState) {
      resolve();
      return;
    }

    let pollTimer = null;
    const onSuccess = () => {
      cleanup();
      resolve();
    };
    const onError = () => {
      cleanup();
      reject(new Error(errorMessage));
    };
    const cleanup = () => {
      if (pollTimer) {
        window.clearInterval(pollTimer);
        pollTimer = null;
      }
      for (const eventName of successEvents) {
        video.removeEventListener(eventName, onSuccess);
      }
      video.removeEventListener("error", onError);
    };

    for (const eventName of successEvents) {
      video.addEventListener(eventName, onSuccess);
    }
    video.addEventListener("error", onError);

    pollTimer = window.setInterval(() => {
      if (video.readyState >= minReadyState) {
        cleanup();
        resolve();
      }
    }, 120);
  });
}

function buildPreviewProbeTimes(durationSeconds) {
  const baseSeconds = [0, 0.05, 0.15, 0.35, 0.7, 1.2, 2.0, 3.0];
  const ratioPoints = [0.03, 0.08, 0.15, 0.25, 0.4, 0.6];
  const maxByDuration = Number.isFinite(durationSeconds) && durationSeconds > 0
    ? Math.max(0, durationSeconds - 0.04)
    : 3.0;
  const points = [...baseSeconds];
  if (Number.isFinite(durationSeconds) && durationSeconds > 0) {
    for (const ratio of ratioPoints) {
      points.push(durationSeconds * ratio);
    }
  }

  const unique = new Map();
  for (const raw of points) {
    if (!Number.isFinite(raw)) {
      continue;
    }
    const clamped = Math.min(Math.max(raw, 0), maxByDuration);
    const key = Math.round(clamped * 1000);
    if (!unique.has(key)) {
      unique.set(key, clamped);
    }
  }
  return Array.from(unique.values()).sort((a, b) => a - b);
}

async function seekVideoForPreview(video, targetSeconds) {
  const duration = Number.isFinite(video.duration) ? video.duration : 0;
  const clamped = duration > 0
    ? Math.min(Math.max(targetSeconds, 0), Math.max(0, duration - 0.05))
    : Math.max(targetSeconds, 0);

  if (Math.abs((video.currentTime || 0) - clamped) < 0.02 && video.readyState >= HTMLMediaElement.HAVE_CURRENT_DATA) {
    return;
  }

  await withTimeout(
    new Promise((resolve, reject) => {
      const onSeeked = () => {
        cleanup();
        resolve();
      };
      const onLoadedData = () => {
        if (video.readyState >= HTMLMediaElement.HAVE_CURRENT_DATA) {
          cleanup();
          resolve();
        }
      };
      const onError = () => {
        cleanup();
        reject(new Error("video seek failed"));
      };
      const cleanup = () => {
        video.removeEventListener("seeked", onSeeked);
        video.removeEventListener("loadeddata", onLoadedData);
        video.removeEventListener("error", onError);
      };

      video.addEventListener("seeked", onSeeked);
      video.addEventListener("loadeddata", onLoadedData);
      video.addEventListener("error", onError);

      try {
        video.currentTime = clamped;
      } catch (_err) {
        cleanup();
        reject(new Error("video seek failed"));
        return;
      }

      if (Math.abs((video.currentTime || 0) - clamped) < 0.02 && video.readyState >= HTMLMediaElement.HAVE_CURRENT_DATA) {
        cleanup();
        resolve();
      }
    }),
    CLIENT_PREVIEW_EXTRACT.seekTimeoutMs,
    "video seek"
  );
}

function frameBrightnessStats(imageData) {
  const data = imageData.data;
  if (!data || data.length < 4) {
    return { mean: 0, std: 0, max: 0, score: 0 };
  }

  let sum = 0;
  let sumSq = 0;
  let max = 0;
  let count = 0;
  for (let i = 0; i < data.length; i += 4) {
    const y = data[i] * 0.299 + data[i + 1] * 0.587 + data[i + 2] * 0.114;
    sum += y;
    sumSq += y * y;
    if (y > max) {
      max = y;
    }
    count += 1;
  }

  if (!count) {
    return { mean: 0, std: 0, max: 0, score: 0 };
  }

  const mean = sum / count;
  const variance = Math.max(0, sumSq / count - mean * mean);
  const std = Math.sqrt(variance);
  return {
    mean,
    std,
    max,
    score: mean + std * 2.0 + max * 0.5,
  };
}

function looksLikeBlackPreviewFrame(stats) {
  return stats.mean < CLIENT_PREVIEW_EXTRACT.blackMeanThreshold
    && stats.std < CLIENT_PREVIEW_EXTRACT.blackStdThreshold
    && stats.max < CLIENT_PREVIEW_EXTRACT.blackMaxThreshold;
}

function capturePreviewCandidate(video, fullCtx, fullCanvas, probeCtx, probeCanvas) {
  fullCtx.drawImage(video, 0, 0, fullCanvas.width, fullCanvas.height);
  probeCtx.drawImage(video, 0, 0, probeCanvas.width, probeCanvas.height);
  const stats = frameBrightnessStats(probeCtx.getImageData(0, 0, probeCanvas.width, probeCanvas.height));
  return {
    stats,
    score: Number(stats.score || 0),
    time: Number(video.currentTime || 0),
  };
}

async function selectPreviewFrameCandidate(video, fullCtx, fullCanvas, probeCtx, probeCanvas) {
  let candidate = capturePreviewCandidate(video, fullCtx, fullCanvas, probeCtx, probeCanvas);
  if (!looksLikeBlackPreviewFrame(candidate.stats)) {
    return candidate;
  }

  const probeTimes = buildPreviewProbeTimes(Number(video.duration || 0));
  const startedAt = Date.now();
  let attempts = 0;

  for (const t of probeTimes) {
    if (attempts >= CLIENT_PREVIEW_EXTRACT.maxProbeAttempts) {
      break;
    }
    if (Date.now() - startedAt > CLIENT_PREVIEW_EXTRACT.probeBudgetMs) {
      break;
    }
    if (Math.abs((video.currentTime || 0) - t) < 0.02) {
      continue;
    }

    attempts += 1;
    try {
      await seekVideoForPreview(video, t);
    } catch (_err) {
      continue;
    }

    const sampled = capturePreviewCandidate(video, fullCtx, fullCanvas, probeCtx, probeCanvas);
    if (sampled.score > candidate.score) {
      candidate = sampled;
    }
    if (!looksLikeBlackPreviewFrame(sampled.stats)) {
      return sampled;
    }
  }

  if (Number.isFinite(candidate.time) && candidate.time >= 0) {
    try {
      await seekVideoForPreview(video, candidate.time);
      candidate = capturePreviewCandidate(video, fullCtx, fullCanvas, probeCtx, probeCanvas);
    } catch (_err) {
      // keep best candidate already captured
    }
  }
  return candidate;
}

async function extractFirstFrameForUploadPreview(file) {
  const objectUrl = URL.createObjectURL(file);
  const video = document.createElement("video");
  video.preload = "auto";
  video.src = objectUrl;
  video.muted = true;
  video.playsInline = true;
  video.crossOrigin = "anonymous";
  video.load();

  try {
    await withTimeout(
      waitForVideoReadyState(
        video,
        HTMLMediaElement.HAVE_METADATA,
        ["loadedmetadata"],
        "video metadata load failed"
      ),
      CLIENT_PREVIEW_EXTRACT.metadataTimeoutMs,
      "video metadata load"
    );

    await withTimeout(
      waitForVideoReadyState(
        video,
        HTMLMediaElement.HAVE_CURRENT_DATA,
        ["loadeddata", "canplay", "canplaythrough"],
        "video first frame load failed"
      ),
      CLIENT_PREVIEW_EXTRACT.frameTimeoutMs,
      "video first frame load"
    );

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

    const probeCanvas = document.createElement("canvas");
    probeCanvas.width = CLIENT_PREVIEW_EXTRACT.probeWidth;
    probeCanvas.height = CLIENT_PREVIEW_EXTRACT.probeHeight;
    const probeCtx = probeCanvas.getContext("2d", { willReadFrequently: true }) || probeCanvas.getContext("2d");
    if (!probeCtx) {
      throw new Error("preview probe canvas unavailable");
    }

    await selectPreviewFrameCandidate(video, ctx, canvas, probeCtx, probeCanvas);

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

async function uploadOriginalPreviewFrame(frame) {
  const token = makePreviewToken();
  const endpoint = `/api/demo/upload-preview?token=${encodeURIComponent(token)}`;
  const controller = new AbortController();
  const uploadTimer = window.setTimeout(() => controller.abort(), CLIENT_PREVIEW_EXTRACT.uploadTimeoutMs);
  let response;
  try {
    response = await fetch(endpoint, {
      method: "POST",
      headers: {
        "Content-Type": "image/jpeg",
      },
      body: frame.blob,
      signal: controller.signal,
    });
  } catch (err) {
    if (err?.name === "AbortError") {
      throw new Error("preview upload timeout");
    }
    throw err;
  } finally {
    window.clearTimeout(uploadTimer);
  }
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
  try {
    const uploadName = file.name || "upload.mp4";
    status.textContent = t("upload_status_uploading");
    const query = new URLSearchParams({ filename: uploadName });
    const endpoint = `/api/demo/upload?${query.toString()}`;
    const response = await fetch(endpoint, {
      method: "POST",
      headers: {
        "Content-Type": file.type || "application/octet-stream",
      },
      body: file,
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
  }
}

async function selectUploadedVideo() {
  const select = document.getElementById("settings-uploaded-select");
  const status = document.getElementById("settings-upload-status");
  const uploadBtn = document.getElementById("settings-upload");
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

async function analyzeUploadedVideoWithStatus(statusNode, openInitOnZoneRequired = true) {
  const status = statusNode || document.getElementById("settings-upload-status");
  if (!status) {
    return false;
  }
  if (currentRunMode !== "demo") {
    status.textContent = t("mode_real_reserved");
    return false;
  }
  if (currentDemoSource !== "uploaded_video") {
    status.textContent = t("status_upload_then_analyze");
    return false;
  }
  if (uploadedZoneRequired) {
    status.textContent = t("upload_status_zone_required");
    if (openInitOnZoneRequired) {
      openModal("init-modal");
      try {
        await loadInitFrame("uploaded");
      } catch (err) {
        document.getElementById("init-status").textContent = String(err);
      }
    }
    return false;
  }
  status.textContent = t("upload_status_analyzing");
  const previousAnalyzedAt = uploadedAnalyzedAt;

  let response;
  try {
    response = await fetch("/api/demo/analyze-upload", { method: "POST" });
  } catch (_err) {
    status.textContent = t("upload_status_analyze_waiting");
    return waitForUploadedAnalyzeResult(status, previousAnalyzedAt);
  }

  if (!response.ok) {
    const text = await responseDetailText(response);
    if (String(text).includes("zone initialization required")) {
      status.textContent = t("upload_status_zone_required");
      if (openInitOnZoneRequired) {
        openModal("init-modal");
        try {
          await loadInitFrame("uploaded");
        } catch (err) {
          document.getElementById("init-status").textContent = String(err);
        }
      }
      return false;
    }
    if (shouldPollAfterAnalyzeFailure(response.status, text)) {
      status.textContent = t("upload_status_analyze_waiting");
      return waitForUploadedAnalyzeResult(status, previousAnalyzedAt);
    }
    status.textContent = formatText("upload_status_analyze_fail", { error: text });
    return false;
  }

  status.textContent = t("upload_status_analyze_ok");
  await loadDashboard(false);
  return true;
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
  const themeBtn = document.getElementById("theme-toggle-btn");
  const viewTabs = document.getElementById("view-tabs");

  if (viewTabs) {
    viewTabs.addEventListener("click", (event) => {
      const target = event.target.closest("[data-tab-target]");
      if (!target) {
        return;
      }
      setDashboardTab(target.getAttribute("data-tab-target"));
    });
  }

  const liveVideo = document.getElementById("live-upload-video");
  if (liveVideo) {
    liveVideo.addEventListener("loadeddata", () => {
      const status = document.getElementById("live-upload-status");
      if (!status) {
        return;
      }
      if (currentRunMode === "demo" && currentDemoSource === "uploaded_video" && uploadedVideoKey) {
        status.textContent = formatText("live_status_ready", { name: liveVideoDisplayName() });
      }
    });
    liveVideo.addEventListener("error", () => {
      const status = document.getElementById("live-upload-status");
      if (!status) {
        return;
      }
      const code = Number(liveVideo.error?.code || 0);
      const errorCode = code > 0 ? `MEDIA_ERR_${code}` : "unknown";
      status.textContent = formatText("live_status_load_fail", { error: errorCode });
    });
  }

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

  if (themeBtn) {
    themeBtn.addEventListener("click", () => {
      toggleTheme();
    });
  }

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
      updateInitMappingVisibility();
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
  initState.mapBeforeCanvas = document.getElementById("init-map-before-canvas");
  initState.mapBeforeCtx = initState.mapBeforeCanvas ? initState.mapBeforeCanvas.getContext("2d") : null;
  initState.mapAfterCanvas = document.getElementById("init-map-after-canvas");
  initState.mapAfterCtx = initState.mapAfterCanvas ? initState.mapAfterCanvas.getContext("2d") : null;
  initState.canvas.addEventListener("click", onCanvasClick);
  initState.canvas.addEventListener("dblclick", onCanvasDoubleClick);
  updateInitMappingVisibility();
  setInitMapStatus(t("init_map_status_pending"));

  window.addEventListener("resize", () => {
    resizeCharts();
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
  setTheme(detectInitialTheme(), false);
  setLanguage("zh-CN");
  bindEvents();
  setDashboardTab(activeDashboardTab);
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
