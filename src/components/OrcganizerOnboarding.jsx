import React, { useState } from "react";

const OrcLogo = ({ className = "w-9 h-9" }) => (
  <svg viewBox="0 0 120 120" className={className} aria-hidden>
    <defs>
      <linearGradient id="g" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0%" stopColor="#7C3AED" />
        <stop offset="100%" stopColor="#312E81" />
      </linearGradient>
    </defs>
    <circle cx="60" cy="60" r="56" fill="url(#g)" />
    <circle cx="60" cy="62" r="28" fill="#111827" />
    <circle cx="48" cy="58" r="4" fill="#fff" />
    <circle cx="72" cy="58" r="4" fill="#fff" />
    <path d="M44 76c10 6 22 6 32 0" stroke="#fff" strokeWidth="3" />
  </svg>
);

const SwordIcon  = ({ className="w-5 h-5" }) => <svg viewBox="0 0 24 24" fill="none" className={className}><path d="M3 21l4-4" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/><path d="M7 17l3-3" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/><path d="M10 14l8-8 3 3-8 8" stroke="currentColor" strokeWidth="2" strokeLinejoin="round"/><path d="M15 6l3 3" stroke="currentColor" strokeWidth="2"/></svg>;
const ScrollIcon = ({ className="w-5 h-5" }) => <svg viewBox="0 0 24 24" fill="none" className={className}><path d="M5 6a3 3 0 100 6h11" stroke="currentColor" strokeWidth="2"/><path d="M19 6H8v10a2 2 0 002 2h9" stroke="currentColor" strokeWidth="2"/></svg>;
const ShieldIcon = ({ className="w-5 h-5" }) => <svg viewBox="0 0 24 24" fill="none" className={className}><path d="M12 3l7 3v6c0 4.5-3.5 8-7 9-3.5-1-7-4.5-7-9V6l7-3z" stroke="currentColor" strokeWidth="2"/></svg>;

/** Tiny preview column used on Step 2 (after board is created) */
function MiniBoard({ columns, title }) {
  return (
    <div className="w-full max-w-xl rounded-2xl bg-gradient-to-r from-violet-800/40 to-indigo-900/40 border border-white/10 p-4 grid gap-3"
         style={{ gridTemplateColumns: `repeat(${columns.length}, minmax(0, 1fr))` }}>
      {columns.map((c) => (
        <div key={c.id} className="rounded-xl bg-white/10 border border-white/15 p-3">
          <div className="text-white font-semibold mb-2 flex items-center gap-2"><SwordIcon />{c.title}</div>
          <div className="rounded-lg h-10 bg-white/15 border border-white/25" />
        </div>
      ))}
    </div>
  );
}

export default function OrcganizerOnboarding({
  onCreateBoard = () => {}, // (questName, columns) -> void
  onFinish       = () => {}, // close wizard
  defaultColumns = [{id:"inbx",title:"Inbox"},{id:"tdy",title:"Today"},{id:"wk",title:"This Week"},{id:"ltr",title:"Later"}],
}) {
  const [step, setStep] = useState(0);
  const [questName, setQuestName] = useState("My Questboard");
  const [created, setCreated] = useState(false);
  const [columns, setColumns] = useState(defaultColumns);

  // Steps:
  // 0 → Meet your personal quest board
  // 1 → Forge your Questboard (create; show live preview on right when created)
  // 2 → Organize copy (fantasy tone)
  // 3 → Add your first card
  const STEPS = [
    {
      key: "meet",
      title: <>Meet your <span className="font-extrabold">personal quest board</span></>,
      body:
        "This is your realm to capture quests, plot your path, and march tasks across the battlefield.",
      right: (
        <div className="relative w-full max-w-md mx-auto aspect-[16/10] rounded-2xl bg-gradient-to-b from-indigo-600 to-indigo-900 shadow-xl overflow-hidden border border-white/10">
          <div className="absolute inset-x-0 top-0 h-10 bg-white/10" />
          <div className="absolute left-0 top-0 right-0 p-4 flex items-center gap-2 text-indigo-50">
            <ShieldIcon className="w-5 h-5" />
            <div className="font-semibold tracking-wide">Questboard</div>
          </div>
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="rounded-xl border border-white/15 bg-white/10 px-4 py-2 text-indigo-50">(Awaiting your first quest)</div>
          </div>
        </div>
      ),
      cta: "Continue",
    },
    {
      key: "forge",
      title: <>Forge your <span className="font-extrabold">Questboard</span></>,
      body: "Name your board and we’ll conjure starter lists. You can rename them later.",
      left: (
        <div className="space-y-3">
          <label className="block text-sm font-semibold text-white/90">Questboard name</label>
          <input
            className="w-full max-w-sm px-3 py-2 rounded-xl bg-white/10 text-white border border-white/20"
            value={questName} onChange={(e)=>setQuestName(e.target.value)}
            placeholder="e.g., The Road to Glory"
          />
          <button
            onClick={()=>{
              const cols = defaultColumns.map(c=>({...c}));
              onCreateBoard(questName.trim() || "My Questboard", cols);
              setColumns(cols);
              setCreated(true);
            }}
            className="mt-2 px-5 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-600 font-semibold shadow"
          >
            Forge Questboard
          </button>
          {created && <div className="text-emerald-300 text-sm pt-1">Questboard forged! Preview on the right →</div>}
        </div>
      ),
      right: created ? (
        <MiniBoard columns={columns} title={questName} />
      ) : (
        <div className="text-white/60">Your board preview will appear here after forging.</div>
      ),
      cta: "Continue",
    },
    {
      key: "organize",
      title: <>Arrange your quests into <span className="font-extrabold">lanes of destiny</span></>,
      body:
        "Keep fresh spoils in Inbox, then march them to Today, This Week, and Later as your saga unfolds. Drag cards between lanes as you gain ground.",
      right: (
        <div className="relative w-full max-w-3xl mx-auto aspect-[16/8] rounded-2xl bg-gradient-to-r from-violet-700 to-fuchsia-700 shadow-xl overflow-hidden border border-white/10 p-4 grid grid-cols-3 gap-4">
          {["Today", "This Week", "Later"].map((col) => (
            <div key={col} className="rounded-xl bg-white/10 border border-white/20 p-3">
              <div className="text-white/90 font-semibold mb-2 flex items-center gap-2"><SwordIcon /> {col}</div>
              <div className="space-y-2">
                <div className="rounded-lg bg-white/20 border border-white/30 h-12" />
                <div className="rounded-lg bg-white/20 border border-white/30 h-12" />
              </div>
            </div>
          ))}
        </div>
      ),
      cta: "Continue",
    },
    {
      key: "add",
      title: <>Add your first <span className="font-extrabold">card</span></>,
      body: "Capture a Main Quest or Sub Quest with a bold title, details, and a priority of stars.",
      right: (
        <div className="relative w-full max-w-md mx-auto aspect-[16/10] rounded-2xl bg-gradient-to-b from-purple-600 to-purple-900 shadow-xl overflow-hidden border border-white/10 grid place-items-center">
          <button className="px-4 py-2 rounded-xl bg-white/20 hover:bg-white/30 text-white font-semibold border border-white/30 shadow">
            + Add card
          </button>
        </div>
      ),
      cta: "Enter Orcganizer",
      finish: true,
    },
  ];

  const s = STEPS[step];
  const goNext = () => (s.finish ? onFinish() : setStep((x) => Math.min(x + 1, STEPS.length - 1)));
  const goBack = () => setStep((x) => Math.max(0, x - 1));

  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-gradient-to-b from-purple-950/70 to-indigo-950/70">
      <div className="w-full max-w-5xl mx-auto">
        <div className="rounded-3xl overflow-hidden border border-white/10 bg-gradient-to-b from-indigo-900/60 to-indigo-950/60 backdrop-blur-md shadow-2xl">
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-white/10 text-white">
            <div className="flex items-center gap-3">
              <OrcLogo />
              <div className="font-extrabold tracking-wide text-lg">Orcganizer</div>
            </div>
            <div className="flex items-center gap-1 text-xs">
              {STEPS.map((_, i) => (
                <span key={i} className={`h-1.5 w-10 rounded-full ${i <= step ? "bg-white" : "bg-white/25"}`} />
              ))}
            </div>
          </div>

          {/* Body */}
          <div className="grid md:grid-cols-2 gap-6 p-6 text-white items-center">
            <div>
              <h1 className="text-2xl md:text-3xl font-black leading-tight">{s.title}</h1>
              <p className="mt-3 text-white/85 max-w-prose">{s.body}</p>
              <div className="mt-6 flex gap-3">
                <button onClick={goBack} disabled={step === 0} className="px-4 py-2 rounded-xl border border-white/25 bg-white/10 hover:bg-white/15 disabled:opacity-40 disabled:cursor-not-allowed">
                  Back
                </button>
                <button onClick={goNext} className="px-5 py-2 rounded-xl bg-indigo-500 hover:bg-indigo-600 font-semibold shadow">
                  {s.cta}
                </button>
              </div>
            </div>

            <div className="">{s.left ? s.left : s.right}</div>
          </div>

          {/* Footer */}
          <div className="px-6 py-4 border-t border-white/10 flex items-center justify-between text-white/80 text-sm">
            <div className="flex items-center gap-2"><ScrollIcon /><span>Need help? See the quickstart in the Codex.</span></div>
            <div className="flex items-center gap-2"><ShieldIcon /><span>Tip: Print cards in 3″×3″ for true post-its.</span></div>
          </div>
        </div>
      </div>
    </div>
  );
}
