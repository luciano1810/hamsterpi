function escapeHtml(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
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
  const refreshBtn = document.getElementById("refresh");
  const toggleBtn = document.getElementById("toggle-auto");
  const inputs = Array.from(document.querySelectorAll("input.lv"));
  const perfOnlyNode = document.getElementById("perf-only");

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
