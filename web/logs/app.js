function escapeHtml(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

const LOG_LEVELS = ["DEBUG", "INFO", "WARNING", "ERROR", "CRITICAL"];
const LOGGING_DEFAULT = {
  level: "INFO",
  file_path: "./logs/hamsterpi.log",
  max_bytes: 5 * 1024 * 1024,
  backup_count: 5,
  console_enabled: true,
};

function setConfigStatus(text, isError = false) {
  const node = document.getElementById("logging-config-status");
  if (!node) {
    return;
  }
  node.textContent = text;
  node.classList.toggle("status-error", Boolean(isError));
  node.classList.toggle("status-ok", !isError);
}

function ensureSelectOption(selectNode, value, label) {
  if (!selectNode) {
    return;
  }
  const targetValue = String(value);
  const found = Array.from(selectNode.options).some((item) => item.value === targetValue);
  if (found) {
    return;
  }
  const option = document.createElement("option");
  option.value = targetValue;
  option.textContent = label || targetValue;
  selectNode.appendChild(option);
}

function normalizeLoggingConfig(raw) {
  const merged = { ...LOGGING_DEFAULT };
  if (!raw || typeof raw !== "object") {
    return merged;
  }

  const level = String(raw.level || "").trim().toUpperCase();
  if (LOG_LEVELS.includes(level)) {
    merged.level = level;
  }

  const filePath = String(raw.file_path || "").trim();
  if (filePath) {
    merged.file_path = filePath;
  }

  const maxBytes = Number(raw.max_bytes);
  if (Number.isFinite(maxBytes) && maxBytes >= 1024) {
    merged.max_bytes = Math.round(maxBytes);
  }

  const backupCount = Number(raw.backup_count);
  if (Number.isFinite(backupCount) && backupCount >= 1) {
    merged.backup_count = Math.round(backupCount);
  }

  if (typeof raw.console_enabled === "boolean") {
    merged.console_enabled = raw.console_enabled;
  }
  return merged;
}

function renderLoggingConfig(cfg) {
  const levelNode = document.getElementById("cfg-level");
  const fileNode = document.getElementById("cfg-file-path");
  const maxBytesNode = document.getElementById("cfg-max-bytes");
  const backupNode = document.getElementById("cfg-backup-count");
  const consoleNode = document.getElementById("cfg-console-enabled");

  ensureSelectOption(maxBytesNode, cfg.max_bytes, `${cfg.max_bytes}`);
  ensureSelectOption(backupNode, cfg.backup_count, `${cfg.backup_count}`);

  if (levelNode) {
    levelNode.value = cfg.level;
  }
  if (fileNode) {
    fileNode.value = cfg.file_path;
  }
  if (maxBytesNode) {
    maxBytesNode.value = String(cfg.max_bytes);
  }
  if (backupNode) {
    backupNode.value = String(cfg.backup_count);
  }
  if (consoleNode) {
    consoleNode.checked = Boolean(cfg.console_enabled);
  }
}

function readLoggingConfigFromForm() {
  const level = String(document.getElementById("cfg-level")?.value || "").trim().toUpperCase();
  if (!LOG_LEVELS.includes(level)) {
    throw new Error("日志级别无效");
  }

  const filePath = String(document.getElementById("cfg-file-path")?.value || "").trim();
  if (!filePath) {
    throw new Error("日志文件路径不能为空");
  }

  const maxBytes = Number(document.getElementById("cfg-max-bytes")?.value);
  if (!Number.isFinite(maxBytes) || maxBytes < 1024) {
    throw new Error("单文件最大字节数无效");
  }

  const backupCount = Number(document.getElementById("cfg-backup-count")?.value);
  if (!Number.isFinite(backupCount) || backupCount < 1 || backupCount > 20) {
    throw new Error("日志备份数量无效");
  }

  const consoleEnabled = Boolean(document.getElementById("cfg-console-enabled")?.checked);
  return {
    level,
    file_path: filePath,
    max_bytes: Math.round(maxBytes),
    backup_count: Math.round(backupCount),
    console_enabled: consoleEnabled,
  };
}

async function responseDetail(response) {
  try {
    const data = await response.json();
    if (typeof data?.detail === "string" && data.detail.trim()) {
      return data.detail.trim();
    }
    if (typeof data?.error === "string" && data.error.trim()) {
      return data.error.trim();
    }
    return JSON.stringify(data);
  } catch (_err) {
    const text = await response.text();
    return text || `${response.status}`;
  }
}

async function loadLoggingConfig() {
  setConfigStatus("正在加载日志设置...");
  const response = await fetch("/api/config/logging", { cache: "no-store" });
  if (!response.ok) {
    const detail = await responseDetail(response);
    throw new Error(detail);
  }
  const payload = await response.json();
  const cfg = normalizeLoggingConfig(payload.logging);
  renderLoggingConfig(cfg);
  setConfigStatus(`日志设置已加载（${payload.config_path || "config.yaml"}）`, false);
}

async function saveLoggingConfig() {
  const cfg = readLoggingConfigFromForm();
  setConfigStatus("正在保存日志设置...");
  const response = await fetch("/api/config/logging", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ logging: cfg }),
  });
  if (!response.ok) {
    const detail = await responseDetail(response);
    throw new Error(detail);
  }
  const payload = await response.json();
  renderLoggingConfig(normalizeLoggingConfig(payload.logging));
  setConfigStatus(`日志设置已保存（${new Date(payload.saved_at).toLocaleString()}）`, false);
}

function selectedLevels() {
  const nodes = Array.from(document.querySelectorAll("input.lv:checked"));
  return nodes.map((node) => node.value).join(",");
}

function levelKpi(level, count) {
  const colorMap = {
    DEBUG: "#4aa3ff",
    INFO: "#3cc6a8",
    WARNING: "#ffbf5b",
    ERROR: "#ff8f66",
    CRITICAL: "#ff4d4f",
  };
  return `
    <article class="kpi-card" style="animation-delay:0s">
      <p class="kpi-name">${level}</p>
      <p class="kpi-value" style="color:${colorMap[level] || "#d9e8e4"}">${count}</p>
      <p class="kpi-hint">条</p>
    </article>
  `;
}

function metricKpi(name, value, hint, color = "#d9e8e4") {
  return `
    <article class="kpi-card" style="animation-delay:0s">
      <p class="kpi-name">${escapeHtml(name)}</p>
      <p class="kpi-value" style="color:${color}">${escapeHtml(value)}</p>
      <p class="kpi-hint">${escapeHtml(hint || "")}</p>
    </article>
  `;
}

function formatNumber(value, digits = 2) {
  const numeric = Number(value);
  if (!Number.isFinite(numeric)) {
    return "-";
  }
  return numeric.toFixed(digits);
}

function formatMs(value) {
  const numeric = Number(value);
  if (!Number.isFinite(numeric) || numeric <= 0) {
    return "-";
  }
  if (numeric >= 1000) {
    return `${(numeric / 1000).toFixed(2)} s`;
  }
  return `${numeric.toFixed(1)} ms`;
}

function buildMessage(item) {
  const base = item.message || "";
  const context = item.context ? `\ncontext=${JSON.stringify(item.context)}` : "";
  const exception = item.exception ? `\nexception=${item.exception}` : "";
  return `${base}${context}${exception}`;
}

function renderLogs(payload) {
  const rows = payload.items || [];
  const tbody = document.getElementById("log-rows");
  const status = document.getElementById("status-line");
  const meta = document.getElementById("meta-line");
  const kpi = document.getElementById("kpi-grid");
  const perfKpiGrid = document.getElementById("perf-kpi-grid");
  const perfStatus = document.getElementById("perf-status-line");
  const perf = payload.performance || {};
  const perfOnly = Boolean(perf.filter_enabled);

  const counts = payload.counts || {};
  kpi.innerHTML = ["DEBUG", "INFO", "WARNING", "ERROR", "CRITICAL"]
    .map((level) => levelKpi(level, counts[level] ?? 0))
    .join("");

  meta.textContent = `日志文件：${payload.log_file || "-"} | 默认级别：${payload.default_level || "-"}`;
  status.textContent = `返回 ${payload.count || 0} 条，更新时间 ${new Date(payload.generated_at).toLocaleString()}${perfOnly ? " | 仅性能日志" : ""}`;

  const categoryCounts = perf.category_counts || {};
  const categoryText = Object.keys(categoryCounts).length
    ? Object.entries(categoryCounts)
        .map(([name, count]) => `${name}:${count}`)
        .join(" / ")
    : "无";
  perfStatus.textContent = `性能日志 ${perf.perf_records || 0} 条 | 分类 ${categoryText}`;
  perfKpiGrid.innerHTML = [
    metricKpi("平均耗时", formatMs(perf.elapsed_ms_avg), "基于性能日志", "#3cc6a8"),
    metricKpi("P95 耗时", formatMs(perf.elapsed_ms_p95), "ms", "#4aa3ff"),
    metricKpi("最大耗时", formatMs(perf.elapsed_ms_max), "ms", "#ffbf5b"),
    metricKpi("处理吞吐", `${formatNumber(perf.processed_fps_avg, 2)}`, "fps", "#9ec5bf"),
    metricKpi("分析吞吐", `${formatNumber(perf.analyzed_fps_avg, 2)}`, "fps", "#ffd489"),
    metricKpi("单帧均耗时", formatMs(perf.avg_frame_ms_avg), "ms/frame", "#ff8f66"),
  ].join("");

  if (rows.length === 0) {
    tbody.innerHTML = `<tr><td colspan="4">没有匹配日志</td></tr>`;
    return;
  }

  tbody.innerHTML = rows
    .slice()
    .reverse()
    .map((item) => {
      const msg = escapeHtml(buildMessage(item));
      return `
        <tr>
          <td>${escapeHtml(item.timestamp || "-")}</td>
          <td><span class="badge-level ${escapeHtml(item.level || "INFO")}">${escapeHtml(item.level || "INFO")}</span></td>
          <td>${escapeHtml(item.logger || "-")}</td>
          <td><pre class="msg-code">${msg}</pre></td>
        </tr>
      `;
    })
    .join("");
}

async function loadLogs() {
  const levels = selectedLevels();
  const q = document.getElementById("q").value.trim();
  const limit = document.getElementById("limit").value;
  const perfOnly = document.getElementById("perf-only").checked ? "1" : "0";
  const params = new URLSearchParams({ levels, q, limit, perf_only: perfOnly });
  const response = await fetch(`/api/logs?${params.toString()}`, { cache: "no-store" });
  if (!response.ok) {
    throw new Error(`日志加载失败: ${response.status}`);
  }
  const payload = await response.json();
  renderLogs(payload);
}

let autoRefresh = true;
let timer = null;

function bindEvents() {
  const reloadConfigBtn = document.getElementById("reload-config");
  const saveConfigBtn = document.getElementById("save-config");
  const refreshBtn = document.getElementById("refresh");
  const toggleBtn = document.getElementById("toggle-auto");
  const inputs = Array.from(document.querySelectorAll("input.lv"));
  const perfOnlyNode = document.getElementById("perf-only");

  reloadConfigBtn?.addEventListener("click", async () => {
    reloadConfigBtn.disabled = true;
    try {
      await loadLoggingConfig();
      await loadLogs();
    } catch (err) {
      setConfigStatus(`日志设置加载失败：${String(err.message || err)}`, true);
    } finally {
      reloadConfigBtn.disabled = false;
    }
  });

  saveConfigBtn?.addEventListener("click", async () => {
    saveConfigBtn.disabled = true;
    try {
      await saveLoggingConfig();
      await loadLogs();
    } catch (err) {
      setConfigStatus(`日志设置保存失败：${String(err.message || err)}`, true);
    } finally {
      saveConfigBtn.disabled = false;
    }
  });

  refreshBtn.addEventListener("click", async () => {
    refreshBtn.disabled = true;
    try {
      await loadLogs();
    } finally {
      refreshBtn.disabled = false;
    }
  });

  toggleBtn.addEventListener("click", () => {
    autoRefresh = !autoRefresh;
    toggleBtn.textContent = autoRefresh ? "自动刷新：开" : "自动刷新：关";
  });

  inputs.forEach((node) =>
    node.addEventListener("change", async () => {
      await loadLogs();
    })
  );

  document.getElementById("q").addEventListener("keydown", async (event) => {
    if (event.key === "Enter") {
      await loadLogs();
    }
  });
  document.getElementById("limit").addEventListener("change", async () => {
    await loadLogs();
  });
  perfOnlyNode.addEventListener("change", async () => {
    await loadLogs();
  });
}

async function bootstrap() {
  bindEvents();
  try {
    await loadLoggingConfig();
  } catch (err) {
    setConfigStatus(`日志设置加载失败：${String(err.message || err)}`, true);
  }
  await loadLogs();
  timer = window.setInterval(async () => {
    if (!autoRefresh) {
      return;
    }
    try {
      await loadLogs();
    } catch (err) {
      console.error(err);
    }
  }, 3000);
}

bootstrap();
