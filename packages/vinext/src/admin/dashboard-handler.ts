/**
 * vinext/admin — Framework-level admin dashboard handler
 *
 * Provides a built-in /_admin endpoint that serves a real-time monitoring
 * dashboard. No external dependencies — generates self-contained HTML.
 *
 * Features:
 * - Real-time metrics (from metrics collector)
 * - Health status
 * - Top routes by traffic
 * - Memory usage chart
 * - Request latency percentiles
 *
 * Usage:
 *   In prod-server.ts, add before other handlers:
 *   if (pathname === "/_admin") return handleAdminDashboard(res);
 */

import type { ServerResponse } from "node:http";
import { metrics, type MetricsReport } from "../tichphong-os/modules/system/services/metrics.js";

/**
 * Generate the admin dashboard HTML with embedded metrics data.
 */
export function generateDashboardHTML(report?: MetricsReport): string {
    const data = report ?? metrics.getReport();
    const dataJson = JSON.stringify(data);

    return `<!DOCTYPE html>
<html lang="vi">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>TichPhong OS — Admin Dashboard</title>
  <style>
    :root {
      --bg: #0a0a0f;
      --surface: #12121a;
      --border: #1e1e2e;
      --text: #e0e0e6;
      --text-dim: #888899;
      --accent: #00d4ff;
      --accent2: #7c3aed;
      --success: #22c55e;
      --warning: #eab308;
      --error: #ef4444;
    }
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
      background: var(--bg);
      color: var(--text);
      min-height: 100vh;
      padding: 24px;
    }
    .header {
      display: flex; justify-content: space-between; align-items: center;
      margin-bottom: 32px; padding-bottom: 16px; border-bottom: 1px solid var(--border);
    }
    .header h1 {
      font-size: 1.5rem; font-weight: 700;
      background: linear-gradient(135deg, var(--accent), var(--accent2));
      -webkit-background-clip: text; -webkit-text-fill-color: transparent;
    }
    .header .status {
      display: flex; align-items: center; gap: 8px;
      padding: 6px 16px; border-radius: 20px;
      background: rgba(34, 197, 94, 0.1); border: 1px solid rgba(34, 197, 94, 0.3);
      color: var(--success); font-size: 0.85rem; font-weight: 500;
    }
    .status::before {
      content: ''; width: 8px; height: 8px; border-radius: 50%;
      background: var(--success); animation: pulse 2s infinite;
    }
    @keyframes pulse {
      0%, 100% { opacity: 1; }
      50% { opacity: 0.4; }
    }
    .grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); gap: 16px; margin-bottom: 24px; }
    .card {
      background: var(--surface); border: 1px solid var(--border);
      border-radius: 12px; padding: 20px;
    }
    .card .label { font-size: 0.75rem; text-transform: uppercase; letter-spacing: 0.05em; color: var(--text-dim); margin-bottom: 8px; }
    .card .value { font-size: 1.8rem; font-weight: 700; }
    .card .value.accent { color: var(--accent); }
    .card .value.success { color: var(--success); }
    .card .value.warning { color: var(--warning); }
    .card .value.error { color: var(--error); }
    .table-wrap { background: var(--surface); border: 1px solid var(--border); border-radius: 12px; overflow: hidden; margin-bottom: 24px; }
    .table-wrap h3 { padding: 16px 20px; font-size: 0.9rem; border-bottom: 1px solid var(--border); }
    table { width: 100%; border-collapse: collapse; }
    th, td { padding: 10px 20px; text-align: left; font-size: 0.85rem; }
    th { color: var(--text-dim); font-weight: 500; border-bottom: 1px solid var(--border); }
    tr:not(:last-child) td { border-bottom: 1px solid var(--border); }
    .bar-container { height: 6px; background: var(--border); border-radius: 3px; min-width: 100px; }
    .bar { height: 100%; border-radius: 3px; background: linear-gradient(90deg, var(--accent), var(--accent2)); transition: width 0.3s; }
    .footer { text-align: center; padding: 24px; color: var(--text-dim); font-size: 0.75rem; }
  </style>
</head>
<body>
  <div class="header">
    <h1>⚡ TichPhong OS — Dashboard</h1>
    <div class="status">Online</div>
  </div>

  <div class="grid" id="metrics-grid"></div>
  <div id="tables"></div>
  <div class="footer">TichPhong OS • Vinext Framework • Auto-refresh: 5s</div>

  <script>
    const initialData = ${dataJson};

    function render(data) {
      const errorRate = data.totalRequests > 0
        ? ((data.totalErrors / data.totalRequests) * 100).toFixed(1) + "%"
        : "0%";
      const grid = document.getElementById("metrics-grid");
      grid.innerHTML = [
        card("Total Requests", data.totalRequests.toLocaleString(), "accent"),
        card("Errors", data.totalErrors.toLocaleString(), data.totalErrors > 0 ? "error" : "success"),
        card("Error Rate", errorRate, parseFloat(errorRate) > 5 ? "warning" : "success"),
        card("Avg Latency", data.avgLatencyMs + " ms", data.avgLatencyMs > 200 ? "warning" : "accent"),
        card("P95 Latency", data.p95LatencyMs + " ms", data.p95LatencyMs > 500 ? "warning" : "accent"),
        card("P99 Latency", data.p99LatencyMs + " ms", data.p99LatencyMs > 1000 ? "error" : "accent"),
        card("Uptime", formatUptime(data.uptimeSeconds), "success"),
        card("Memory (RSS)", data.memoryMB.rss + " MB", data.memoryMB.rss > 512 ? "warning" : "accent"),
      ].join("");

      const tables = document.getElementById("tables");
      let html = "";

      // Status breakdown
      const statuses = Object.entries(data.statusBreakdown);
      if (statuses.length) {
        html += '<div class="table-wrap"><h3>📊 Status Breakdown</h3><table><tr><th>Status</th><th>Count</th><th>Distribution</th></tr>';
        const maxStatus = Math.max(...statuses.map(s => s[1]));
        for (const [status, count] of statuses) {
          const pct = maxStatus > 0 ? (count / maxStatus * 100) : 0;
          html += '<tr><td>' + status + '</td><td>' + count + '</td><td><div class="bar-container"><div class="bar" style="width:' + pct + '%"></div></div></td></tr>';
        }
        html += '</table></div>';
      }

      // Top paths
      if (data.topPaths?.length) {
        html += '<div class="table-wrap"><h3>🔥 Top Routes by Traffic</h3><table><tr><th>Path</th><th>Requests</th><th>Avg Latency</th><th>Volume</th></tr>';
        const maxCount = Math.max(...data.topPaths.map(p => p.count));
        for (const p of data.topPaths) {
          const pct = maxCount > 0 ? (p.count / maxCount * 100) : 0;
          html += '<tr><td>' + p.path + '</td><td>' + p.count + '</td><td>' + p.avgMs + ' ms</td><td><div class="bar-container"><div class="bar" style="width:' + pct + '%"></div></div></td></tr>';
        }
        html += '</table></div>';
      }

      tables.innerHTML = html;
    }

    function card(label, value, color) {
      return '<div class="card"><div class="label">' + label + '</div><div class="value ' + color + '">' + value + '</div></div>';
    }

    function formatUptime(s) {
      if (s < 60) return s + "s";
      if (s < 3600) return Math.floor(s / 60) + "m " + (s % 60) + "s";
      const h = Math.floor(s / 3600);
      const m = Math.floor((s % 3600) / 60);
      return h + "h " + m + "m";
    }

    render(initialData);
    setInterval(() => {
      fetch("/_metrics").then(r => r.json()).then(render).catch(() => {});
    }, 5000);
  </script>
</body>
</html>`;
}

/**
 * Handle the /_admin endpoint — serve the dashboard.
 */
export function handleAdminDashboard(res: ServerResponse): void {
    const html = generateDashboardHTML();
    res.writeHead(200, {
        "Content-Type": "text/html; charset=utf-8",
        "Cache-Control": "no-store",
        "X-Robots-Tag": "noindex, nofollow",
    });
    res.end(html);
}
