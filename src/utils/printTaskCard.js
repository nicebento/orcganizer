// utils/printTaskCard.js
import { patternForId } from "./patterns";

const ICON_GLYPHS = {
  sword: "🗡️",
  shield: "🛡️",
  scroll: "📜",
  potion: "🧪",
  star: "⭐",
};

function hashSeed(s = "") {
  let h = 2166136261 >>> 0;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}
function ditherPattern(seed, fg = "rgba(255,255,255,0.28)") {
  const h = hashSeed(seed);
  const size = 6 + (h % 5);
  const dot = 1 + ((h >>> 3) % 3);
  const jitter = ((h >>> 7) % 3) - 1;
  const svg = encodeURIComponent(
    `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">
      <rect width="100%" height="100%" fill="none"/>
      <circle cx="${Math.max(1, size / 2 + jitter)}" cy="${Math.max(
      1,
      size / 2 - jitter
    )}" r="${dot}" fill="${fg}"/>
    </svg>`
  );
  return `url("data:image/svg+xml;utf8,${svg}")`;
}

const esc = (s) =>
  String(s ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");

export default function printTaskCard(task) {
  const pattern =
    task.patternType === "dither"
      ? ditherPattern(task.patternSeed || String(task.id))
      : patternForId(task.id, task.patternSeed || "");

  const icon = ICON_GLYPHS[task.icon] || "⭐";
  const questKind = task.taskType === "main" ? "Main quest" : "Sub quest";
  const stars = "★★★★★".slice(0, task.priority || 0).padEnd(5, "☆");

  const html = `<!doctype html>
<html>
<head>
<meta charset="utf-8"/>
<title>Print Task</title>
<meta name="color-scheme" content="light"/>
<style>
  @page { size: 70mm 80mm; margin: 0; }
  :root { --radius-ticket: 14px; }
  html, body { height:100%; }
  body {
    margin: 0;
    background: #ffffff;
    color: #0a0a0a;
    font: 14px/1.4 system-ui, -apple-system, Segoe UI, Roboto, "Helvetica Neue", Arial, sans-serif;
    -webkit-print-color-adjust: exact; print-color-adjust: exact;
  }
  .card {
    width: 70mm; height: 80mm;
    border: 1px solid #374151; /* neutral-700 */
    border-radius: var(--radius-ticket);
    overflow: hidden;
    background: #fff;
    display: flex; flex-direction: column;
  }
  .header {
    position: relative;
    background: #155e75; /* brandBlue-700-ish */
    color: #fff;
    padding: 6px 8px;
  }
  .meta { font-size: 10px; opacity: .9; margin: 0 0 2px; }
  .title { font-size: 14px; font-weight: 700; margin: 0; display: flex; align-items: center; gap: 6px; }
  .icon {
    display:inline-grid; place-items:center; font-size: 16px;
    border: 1px solid rgba(255,255,255,.25); border-radius: 8px;
    padding: 2px 6px; background: transparent;
  }
  .pat {
    position:absolute; top:0; right:0; bottom:0; width: 26mm;
    opacity:.4; background-image: ${pattern};
    background-repeat: no-repeat; background-position: right top; background-size: 200px 160px;
  }
  .body {
    flex: 1; padding: 8px;
    white-space: pre-wrap; overflow: hidden;
    font-size: 13px; line-height: 1.35;
  }
  .band {
    background:#155e75; color:#fff; padding:6px 8px;
    display:flex; align-items:center; justify-content:space-between;
    font-size: 11px;
  }
</style>
</head>
<body>
  <div class="card">
    <div class="header">
      <div class="title">
        <span class="icon">${icon}</span>
        <div>
          <div class="meta">${esc(questKind)}</div>
          <div>${esc(task.title || "Task")}</div>
        </div>
      </div>
      <div class="pat"></div>
    </div>
    <div class="body">${esc(task.notes || "")}</div>
    <div class="band"><span>PRIORITY</span><span>${stars}</span></div>
  </div>
</body>
</html>`;

  // Hidden iframe print (avoids popup blockers/blank tabs)
  const iframe = document.createElement("iframe");
  iframe.style.position = "fixed";
  iframe.style.right = "0";
  iframe.style.bottom = "0";
  iframe.style.width = "0";
  iframe.style.height = "0";
  iframe.style.border = "0";
  document.body.appendChild(iframe);

  const cleanup = () => {
    try {
      if (iframe && iframe.parentNode) iframe.parentNode.removeChild(iframe);
    } catch {}
  };

  const doc = iframe.contentWindow?.document;
  if (!doc) {
    cleanup();
    return;
  }

  doc.open();
  doc.write(html);
  doc.close();

  let printed = false;
  const doPrintOnce = () => {
    if (printed) return;
    printed = true;
    try {
      const win = iframe.contentWindow;
      if (!win) return cleanup();
      // Ensure cleanup when dialog closes
      win.onafterprint = () => setTimeout(cleanup, 50);
      win.focus();
      win.print();
    } catch {
      cleanup();
    } finally {
      // Safety cleanup in case onafterprint never fires
      setTimeout(cleanup, 1500);
    }
  };

  // Primary trigger
  iframe.onload = doPrintOnce;
  // Fallback (some engines delay/skip onload)
  setTimeout(doPrintOnce, 600);
}
