import { useEffect, useRef, useState } from "react";

/**
 * ORCGANIZER — a playful, fantasy‑themed Kanban + Post‑it task generator
 * Single‑file React app using Tailwind classes.
 *
 * Features
 * - Welcome modal (faded purple), Orc logo, “Forge Your First Questboard”
 * - Setup panel: quest name, icon (5 fantasy SVGs), progression preset
 * - Board: left sidebar (quest name), columns across top
 * - + in first column opens a Post‑it‑sized Task Editor with:
 *    icon picker + auto‑guess, Main/Sub quest, task name, description,
 *    SVG pattern with Shuffle, color band from vintage palettes,
 *    5‑star priority, Save/Cancel, Print
 * - Drag & drop tasks across columns; click to edit/print
 * - LocalStorage persistence
 */

// ---------- Utility ----------
const uid = () => Math.random().toString(36).slice(2, 10);

// Palettes (inspired by "A Dictionary of Color Combinations")
const PALETTES = [
  ["#2E294E", "#F4E04D", "#51A3A3", "#E4572E"],
  ["#1F2041", "#4B3F72", "#FFC857", "#119DA4"],
  ["#0F4C5C", "#E36414", "#F7EDE2", "#D6D3C4"],
  ["#2D3047", "#93B7BE", "#E0CA3C", "#E8E9F3"],
  ["#2B2D42", "#8D99AE", "#EDF2F4", "#EF233C"],
  ["#3D2C2E", "#EDC79B", "#C2C5BB", "#8E7DBE"],
];

function mulberry32(seedInt) {
  let t = seedInt + 0x6D2B79F5;
  return function () {
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// ---------- Icons ----------
const iconDefs = [
  { key: "sword", label: "Sword", Svg: SwordIcon },
  { key: "shield", label: "Shield", Svg: ShieldIcon },
  { key: "potion", label: "Potion", Svg: PotionIcon },
  { key: "scroll", label: "Scroll", Svg: ScrollIcon },
  { key: "dragon", label: "Dragon", Svg: DragonIcon },
];

function SwordIcon({ className = "w-6 h-6", stroke = "currentColor" }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className}>
      <path d="M3 21l4-4" stroke={stroke} strokeWidth={2} strokeLinecap="round" />
      <path d="M7 17l3-3" stroke={stroke} strokeWidth={2} strokeLinecap="round" />
      <path d="M10 14l8-8 3 3-8 8" stroke={stroke} strokeWidth={2} strokeLinejoin="round" />
      <path d="M15 6l3 3" stroke={stroke} strokeWidth={2} />
    </svg>
  );
}
function ShieldIcon({ className = "w-6 h-6", stroke = "currentColor" }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className}>
      <path d="M12 3l7 3v6c0 4.5-3.5 8-7 9-3.5-1-7-4.5-7-9V6l7-3z" stroke={stroke} strokeWidth={2} />
    </svg>
  );
}
function PotionIcon({ className = "w-6 h-6", stroke = "currentColor" }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className}>
      <path d="M9 3h6" stroke={stroke} strokeWidth={2} strokeLinecap="round" />
      <path d="M10 3v3l-5 7a6 6 0 006 8h2a6 6 0 006-8l-5-7V3" stroke={stroke} strokeWidth={2} />
      <path d="M8 14h8" stroke={stroke} strokeWidth={2} strokeLinecap="round" />
    </svg>
  );
}
function ScrollIcon({ className = "w-6 h-6", stroke = "currentColor" }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className}>
      <path d="M5 6a3 3 0 100 6h11" stroke={stroke} strokeWidth={2} />
      <path d="M19 6H8v10a2 2 0 002 2h9" stroke={stroke} strokeWidth={2} />
    </svg>
  );
}
function DragonIcon({ className = "w-6 h-6", stroke = "currentColor" }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className}>
      <path d="M3 13c5-6 11-8 18-6-2 2-3 4-3 6 0 4-3 7-7 7S3 17 3 13z" stroke={stroke} strokeWidth={2} />
      <path d="M15 7l3 2" stroke={stroke} strokeWidth={2} strokeLinecap="round" />
      <circle cx="12" cy="12" r="1" fill={stroke} />
    </svg>
  );
}

function guessIconKeyByTitle(title) {
  const t = (title || "").toLowerCase();
  if (/(defend|security|shield|protect)/.test(t)) return "shield";
  if (/(brew|mix|potion|heal)/.test(t)) return "potion";
  if (/(read|write|spec|doc|scroll|paper)/.test(t)) return "scroll";
  if (/(dragon|beast|boss)/.test(t)) return "dragon";
  return "sword";
}

// ---------- Pattern tile ----------
function PatternTile({ seed, fg = "#224", bg = "#fff", className = "w-28 h-28 rounded-xl border border-white/20" }) {
  const rand = mulberry32(seed);
  const waves = new Array(10).fill(0).map((_, i) => {
    const y = 4 + i * 8 + rand() * 4;
    const amp = 3 + rand() * 4;
    const freq = 0.2 + rand() * 0.5;
    let d = `M 0 ${y}`;
    for (let x = 0; x <= 120; x += 8) {
      const yy = y + Math.sin(x * freq) * amp;
      d += ` L ${x} ${yy}`;
    }
    return <path key={i} d={d} stroke={fg} strokeWidth={1.2} fill="none" opacity={0.6} />;
  });
  return (
    <svg viewBox="0 0 120 120" className={className} style={{ background: bg }}>
      {waves}
      {new Array(20).fill(0).map((_, i) => (
        <circle key={`c${i}`} cx={rand() * 120} cy={rand() * 120} r={rand() * 1.6 + 0.3} fill={fg} opacity={0.4} />
      ))}
    </svg>
  );
}

// ---------- Print helper ----------
function patternSVGString(seed, fg, bg) {
  const rand = mulberry32(seed);
  const lines = new Array(10).fill(0)
    .map((_, i) => {
      const y = 4 + i * 8 + rand() * 4;
      const amp = 3 + rand() * 4;
      const freq = 0.2 + rand() * 0.5;
      let d = `M 0 ${y}`;
      for (let x = 0; x <= 120; x += 8) {
        const yy = y + Math.sin(x * freq) * amp;
        d += ` L ${x} ${yy}`;
      }
      return `<path d="${d}" stroke="${fg}" stroke-width="1.2" fill="none" opacity="0.6" />`;
    })
    .join("");
  const dots = new Array(20).fill(0)
    .map(() => `<circle cx="${rand() * 120}" cy="${rand() * 120}" r="${rand() * 1.6 + 0.3}" fill="${fg}" opacity="0.4" />`)
    .join("");
  return `<svg viewBox='0 0 120 120' xmlns='http://www.w3.org/2000/svg' style='background:${bg}'>${lines}${dots}</svg>`;
}

function iconPathFor(key) {
  switch (key) {
    case "shield":
      return `<path d='M12 3l7 3v6c0 4.5-3.5 8-7 9-3.5-1-7-4.5-7-9V6l7-3z'/>`;
    case "potion":
      return `<path d='M9 3h6'/><path d='M10 3v3l-5 7a6 6 0 006 8h2a6 6 0 006-8l-5-7V3'/><path d='M8 14h8'/>`;
    case "scroll":
      return `<path d='M5 6a3 3 0 100 6h11'/><path d='M19 6H8v10a2 2 0 002 2h9'/>`;
    case "dragon":
      return `<path d='M3 13c5-6 11-8 18-6-2 2-3 4-3 6 0 4-3 7-7 7S3 17 3 13z'/><path d='M15 7l3 2'/>`;
    default:
      return `<path d='M3 21l4-4'/><path d='M7 17l3-3'/><path d='M10 14l8-8 3 3-8 8'/><path d='M15 6l3 3'/>`;
  }
}

function escapeHtml(s) {
  return String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/\\"/g, "&quot;").replace(/'/g, "&#039;");
}

function printTaskCard(task) {
  const palette = task.palette || PALETTES[0];
  const band = palette[0];
  const fg = palette[2];
  const bg = "#ffffff";
  const html = `<!doctype html><html><head><meta charset="utf-8"/>
  <title>${escapeHtml(task.title || "Task")}</title>
  <style>
    /* Change to size: 3in 3in; for square Post‑it */
    @page { size: A6; margin: 10mm; }
    body { font-family: ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Noto Sans, Ubuntu, Cantarell, Helvetica Neue, Arial; background: #f7f7fb; }
    .card { width: 420px; border-radius: 14px; border: 1px solid #ddd; background: ${bg}; box-shadow: 0 6px 16px rgba(0,0,0,0.1); overflow: hidden; }
    .band { background: ${band}; color: white; padding: 10px 14px; display:flex; gap:8px; align-items:center; }
    .title { font-weight: 800; font-size: 20px; }
    .sub { font-size: 12px; opacity: 0.9; }
    .body { padding: 14px; font-size: 14px; color: #333; }
    .prio { background: ${band}; color:white; padding: 8px 14px; font-weight: 700; }
    .stars { letter-spacing: 4px; font-size: 18px; }
    .row { display:flex; justify-content: space-between; align-items:center; gap:12px; }
    .pat { border: 1px solid #eee; border-radius: 10px; overflow: hidden; width: 140px; height: 140px; }
  </style></head><body>
  <div class="card">
   <div class="band">
     <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2" xmlns="http://www.w3.org/2000/svg">${iconPathFor(task.iconKey)}</svg>
     <div>
       <div class="sub">${escapeHtml(task.level || "Sub Quest")}</div>
       <div class="title">${escapeHtml(task.title || "Task name")}</div>
     </div>
   </div>
   <div class="body">
     <div class="row">
       <div style="flex:1">${task.description ? `<div>${escapeHtml(task.description)}</div>` : `<div style="opacity:.6">(no details)</div>`}</div>
       <div class="pat">${patternSVGString(task.patternSeed || 123, fg, "#fff")}</div>
     </div>
   </div>
   <div class="prio">Priority: <span class="stars">${"★".repeat(task.priority || 0)}${"☆".repeat(5 - (task.priority || 0))}</span></div>
  </div>
  <script>window.print()</script>
  </body></html>`;
  const w = window.open("", "_blank", "noopener,noreferrer");
  if (!w) return;
  w.document.open();
  w.document.write(html);
  w.document.close();
}

// ---------- App ----------
export default function App() {
  const [stage, setStage] = useState("welcome"); // welcome → config → board
  const [questName, setQuestName] = useState("");
  const [questIconKey, setQuestIconKey] = useState("sword");
  const [palette, setPalette] = useState(PALETTES[0]);

  const PROG_PRESETS = {
    basic: ["Todo", "In progress", "Blocked", "Complete"],
    extended: ["Tasks", "In progress", "Blocked", "Waiting", "Done"],
  };
  const [columns, setColumns] = useState(PROG_PRESETS.basic);

  const [tasks, setTasks] = useState(() => {
    try { return JSON.parse(localStorage.getItem("orc.tasks") || "[]"); } catch { return []; }
  });
  useEffect(() => { localStorage.setItem("orc.tasks", JSON.stringify(tasks)); }, [tasks]);

  const [editorOpen, setEditorOpen] = useState(false);
  const [editingTask, setEditingTask] = useState(null);

  const handleForge = () => setStage("config");
  const createBoard = () => setStage("board");

  function newTaskDefaults() {
    const seed = Math.floor(Math.random() * 1e9);
    return {
      id: uid(), title: "", description: "",
      iconKey: questIconKey, level: "Sub Quest", priority: 2,
      status: columns[0], patternSeed: seed, palette, createdAt: Date.now(),
    };
  }
  function openNewTask() { setEditingTask(newTaskDefaults()); setEditorOpen(true); }
  function saveTask(task) {
    setTasks((prev) => prev.some((t) => t.id === task.id) ? prev.map((t) => t.id === task.id ? task : t) : [task, ...prev]);
    setEditorOpen(false);
  }

  function onDragStart(ev, taskId) { ev.dataTransfer.setData("text/task", taskId); }
  function onDrop(ev, col) { ev.preventDefault(); const id = ev.dataTransfer.getData("text/task"); if (!id) return; setTasks((prev) => prev.map((t) => t.id === id ? { ...t, status: col } : t)); }
  function allowDrop(ev) { ev.preventDefault(); }

  return (
    <div className="min-h-screen bg-gradient-to-b from-purple-900/40 to-purple-950/60 text-neutral-100">
      <GlobalStyleInjection />

      {/* Welcome */}
      {stage === "welcome" && (
        <div className="fixed inset-0 grid place-items-center bg-black/60 p-4 z-50">
          <div className="relative w-full max-w-lg rounded-3xl bg-purple-900/50 backdrop-blur-md border border-white/15 shadow-xl overflow-hidden">
            <button className="absolute right-3 top-3 size-9 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center" onClick={() => setStage("config")} aria-label="Close">×</button>
            <div className="px-8 pt-10 pb-6 flex flex-col items-center text-center">
              <OrcLogo className="w-20 h-20 mb-3" />
              <h2 className="text-2xl font-black">Welcome to Orcganizer</h2>
              <p className="text-purple-100/80 mt-1">Tame your quests. Bonk your backlog.</p>
              <button onClick={handleForge} className="mt-6 px-5 py-3 rounded-2xl bg-indigo-500 hover:bg-indigo-600 font-semibold shadow">Forge Your First Questboard</button>
            </div>
          </div>
        </div>
      )}

      {/* Config */}
      {stage === "config" && (
        <div className="max-w-5xl mx-auto p-6">
          <div className="rounded-3xl bg-white/5 border border-white/10 p-6 shadow">
            <h3 className="text-xl font-bold mb-4">Board Setup</h3>
            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm opacity-80 mb-1">Quest name</label>
                <input className="w-full px-3 py-2 rounded-xl bg-white/10 border border-white/15 focus:outline-none" placeholder="e.g., Studio Build" value={questName} onChange={(e) => setQuestName(e.target.value)} />
              </div>
              <div>
                <label className="block text-sm opacity-80 mb-1">Select image for quest</label>
                <div className="flex gap-2 items-center flex-wrap">
                  {iconDefs.map((ic) => (
                    <button key={ic.key} className={`px-3 py-2 rounded-xl border ${questIconKey === ic.key ? "bg-white/20 border-white/40" : "bg-white/5 border-white/15"}`} onClick={() => setQuestIconKey(ic.key)}>
                      <div className="flex items-center gap-2"><ic.Svg className="w-6 h-6" /><span className="text-sm">{ic.label}</span></div>
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="block text-sm opacity-80 mb-1">Select progression</label>
                <select className="w-full px-3 py-2 rounded-xl bg-white/10 border border-white/15" value={columns.join(",")} onChange={(e) => setColumns(e.target.value === PROG_PRESETS.basic.join(",") ? PROG_PRESETS.basic : PROG_PRESETS.extended)}>
                  <option value={PROG_PRESETS.basic.join(",")}>Todo, In progress, Blocked, Complete</option>
                  <option value={PROG_PRESETS.extended.join(",")}>Tasks, In progress, Blocked, Waiting, Done</option>
                </select>
              </div>
              <div>
                <label className="block text-sm opacity-80 mb-1">Color mood</label>
                <div className="flex gap-3 flex-wrap">
                  {PALETTES.map((p, idx) => (
                    <button key={idx} onClick={() => setPalette(p)} className={`rounded-xl overflow-hidden border ${palette === p ? "border-white" : "border-white/20"}`} aria-label={`Palette ${idx + 1}`}>
                      <div className="flex">{p.map((c, i) => (<div key={i} style={{ background: c }} className="w-8 h-8" />))}</div>
                    </button>
                  ))}
                </div>
              </div>
            </div>
            <div className="mt-6 flex justify-end"><button className="px-5 py-3 rounded-2xl bg-indigo-500 hover:bg-indigo-600 font-semibold" onClick={createBoard}>Create Questboard</button></div>
          </div>
        </div>
      )}

      {/* Board */}
      {stage === "board" && (
        <div className="max-w-[1200px] mx-auto p-6">
          <div className="grid grid-cols-[220px_1fr] gap-4 min-h-[70vh]">
            <aside className="rounded-3xl bg-white/5 border border-white/10 p-5 flex flex-col items-start">
              <div className="flex items-center gap-2 mb-3">{(() => { const Icon = iconDefs.find((i) => i.key === questIconKey)?.Svg || SwordIcon; return <Icon className="w-7 h-7" />; })()}<h2 className="text-lg font-bold">{questName || "Unnamed Quest"}</h2></div>
              <p className="text-xs opacity-70">Drag cards across columns. Click a card to edit or print.</p>
            </aside>
            <section className="grid" style={{ gridTemplateColumns: `repeat(${columns.length}, minmax(0, 1fr))` }}>
              {columns.map((col, idx) => (
                <div key={col} className="rounded-3xl bg-white/5 border border-white/10 p-3 flex flex-col min-h-[60vh]" onDragOver={allowDrop} onDrop={(e) => onDrop(e, col)}>
                  <header className="flex items-center justify-between px-2 py-1"><h3 className="font-semibold">{col}</h3>{idx === 0 && (<button onClick={openNewTask} className="px-2 py-1 rounded-lg bg-white/10 hover:bg-white/20 text-sm">+ Add</button>)}</header>
                  <div className="mt-2 space-y-3">
                    {tasks.filter((t) => t.status === col).map((t) => (<TaskCard key={t.id} task={t} onClick={() => { setEditingTask(t); setEditorOpen(true); }} onDragStart={onDragStart} />))}
                  </div>
                </div>
              ))}
            </section>
          </div>
        </div>
      )}

      {editorOpen && editingTask && (
        <TaskEditor task={editingTask} onClose={() => setEditorOpen(false)} onSave={saveTask} onShufflePattern={() => setEditingTask({ ...editingTask, patternSeed: Math.floor(Math.random() * 1e9) })} onChange={(patch) => setEditingTask({ ...editingTask, ...patch })} onPrint={() => printTaskCard(editingTask)} />
      )}
    </div>
  );
}

function TaskCard({ task, onClick, onDragStart }) {
  const palette = task.palette || PALETTES[0];
  const band = palette[0];
  const fg = palette[2];
  const Icon = iconDefs.find((i) => i.key === task.iconKey)?.Svg || SwordIcon;
  return (
    <div className="rounded-2xl bg-white/90 text-neutral-900 shadow border border-black/5 overflow-hidden cursor-grab active:cursor-grabbing" draggable onDragStart={(e) => onDragStart(e, task.id)} onClick={onClick}>
      <div className="px-3 py-2" style={{ background: band, color: "white" }}>
        <div className="flex items-center gap-2"><Icon className="w-5 h-5" /><div className="leading-tight"><div className="text-xs opacity-90">{task.level}</div><div className="font-bold">{task.title || "Task"}</div></div></div>
      </div>
      <div className="p-3 grid grid-cols-[1fr_88px] gap-3 items-stretch">
        <div className="text-sm text-neutral-700 line-clamp-4 whitespace-pre-wrap">{task.description || <span className="opacity-50">(no details)</span>}</div>
        <PatternTile seed={task.patternSeed} fg={fg} bg="#fff" className="w-full h-24 rounded-lg border border-black/10" />
      </div>
      <div className="px-3 py-2 text-sm font-semibold" style={{ background: band, color: "white" }}>Priority: {"★".repeat(task.priority)}{"☆".repeat(5 - task.priority)}</div>
    </div>
  );
}

function TaskEditor({ task, onSave, onClose, onShufflePattern, onChange, onPrint }) {
  const [title, setTitle] = useState(task.title || "");
  const [description, setDescription] = useState(task.description || "");
  const [level, setLevel] = useState(task.level || "Sub Quest");
  const [iconKey, setIconKey] = useState(task.iconKey || guessIconKeyByTitle(task.title));
  const [priority, setPriority] = useState(task.priority ?? 2);
  const [seed, setSeed] = useState(task.patternSeed || Math.floor(Math.random() * 1e9));
  const palette = task.palette || PALETTES[0];
  const band = palette[0];
  const fg = palette[2];

  useEffect(() => { onChange({ title, description, level, iconKey, priority, patternSeed: seed }); /* eslint-disable-next-line */ }, [title, description, level, iconKey, priority, seed]);
  useEffect(() => { if (!task.title && title) setIconKey(guessIconKeyByTitle(title)); /* eslint-disable-next-line */ }, [title]);

  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-black/60 p-4">
      <div className="relative w-full max-w-2xl rounded-3xl bg-neutral-50 text-neutral-900 shadow-2xl border border-black/10 overflow-hidden">
        <button className="absolute right-3 top-3 size-9 rounded-full bg-black/5 hover:bg-black/10" onClick={onClose} aria-label="Close">×</button>
        <div className="p-4" style={{ background: band, color: "white" }}>
          <div className="flex items-center gap-2">{(() => { const Icon = iconDefs.find((i) => i.key === iconKey)?.Svg || SwordIcon; return <Icon className="w-6 h-6" />; })()}<div><div className="text-xs opacity-90">{level}</div><div className="text-xl font-extrabold">{title || "Task name"}</div></div></div>
        </div>
        <div className="p-5 grid grid-cols-1 md:grid-cols-[1fr_140px] gap-4 items-start">
          <div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold mb-1">Task icon</label>
                <div className="flex gap-1 flex-wrap">
                  {iconDefs.map((ic) => (
                    <button key={ic.key} className={`px-2 py-1 rounded-lg border ${iconKey === ic.key ? "bg-black/5" : "bg-white"}`} onClick={() => setIconKey(ic.key)}>
                      <div className="flex items-center gap-1"><ic.Svg className="w-5 h-5" /><span className="text-xs">{ic.label}</span></div>
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold mb-1">Task level</label>
                <select className="w-full px-3 py-2 rounded-lg border" value={level} onChange={(e) => setLevel(e.target.value)}>
                  <option>Main Quest</option>
                  <option>Sub Quest</option>
                </select>
              </div>
              <div className="md:col-span-2">
                <label className="block text-xs font-semibold mb-1">Task name</label>
                <input className="w-full px-3 py-2 rounded-lg border" placeholder="e.g., Wire the Hella lights" value={title} onChange={(e) => setTitle(e.target.value)} />
              </div>
            </div>
            <div className="mt-3">
              <label className="block text-xs font-semibold mb-1">Enter task here</label>
              <textarea className="w-full px-3 py-2 rounded-lg border min-h-[120px]" placeholder="Describe the task details…" value={description} onChange={(e) => setDescription(e.target.value)} />
            </div>
            <div className="mt-4 rounded-xl overflow-hidden border">
              <div className="px-3 py-2 text-sm font-bold text-white" style={{ background: band }}>Priority Level</div>
              <div className="px-3 py-3"><Stars value={priority} onChange={setPriority} /></div>
            </div>
          </div>
          <div className="flex flex-col items-center gap-2">
            <PatternTile seed={seed} fg={fg} bg="#fff" className="w-[140px] h-[140px] rounded-xl border" />
            <button className="px-3 py-1.5 rounded-lg bg-black/5 hover:bg-black/10 text-sm" onClick={() => { const s = Math.floor(Math.random() * 1e9); setSeed(s); onShufflePattern(); }}>Shuffle Pattern</button>
            <button className="px-3 py-1.5 rounded-lg bg-black/5 hover:bg-black/10 text-sm" onClick={onPrint}>Print</button>
          </div>
        </div>
        <div className="p-4 flex justify-end gap-2">
          <button className="px-4 py-2 rounded-xl bg-black/5 hover:bg-black/10" onClick={onClose}>Cancel</button>
          <button className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold shadow" onClick={() => onSave({ ...task, title, description, level, iconKey, priority, patternSeed: seed })}>Save task</button>
        </div>
      </div>
    </div>
  );
}

function Stars({ value = 0, onChange }) {
  return (
    <div className="flex gap-1">{[1,2,3,4,5].map((n) => (<button key={n} onClick={() => onChange(n)} aria-label={`Set priority ${n}`}><span className="text-xl">{n <= value ? "★" : "☆"}</span></button>))}</div>
  );
}

function OrcLogo({ className = "w-16 h-16" }) {
  return (
    <svg viewBox="0 0 120 120" className={className}>
      <defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1"><stop offset="0%" stopColor="#7C3AED" /><stop offset="100%" stopColor="#312E81" /></linearGradient></defs>
      <circle cx="60" cy="60" r="56" fill="url(#g)" />
      <circle cx="60" cy="62" r="28" fill="#1f2937" />
      <circle cx="48" cy="58" r="4" fill="#fff" />
      <circle cx="72" cy="58" r="4" fill="#fff" />
      <path d="M44 76c10 6 22 6 32 0" stroke="#fff" strokeWidth="3" />
      <path d="M50 84l3 6M70 84l-3 6" stroke="#fff" strokeWidth="3" strokeLinecap="round" />
      <text x="60" y="110" textAnchor="middle" fontSize="12" fill="#E5E7EB" fontWeight="700">ORCGANIZER</text>
    </svg>
  );
}

function GlobalStyleInjection() {
  const once = useRef(false);
  useEffect(() => {
    if (once.current) return; once.current = true;
    const style = document.createElement("style");
    style.innerHTML = `.line-clamp-4{display:-webkit-box;-webkit-box-orient:vertical;-webkit-line-clamp:4;overflow:hidden}`;
    document.head.appendChild(style); return () => style.remove();
  }, []);
  return null;
}
