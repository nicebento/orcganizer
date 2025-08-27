import React, { useState, useEffect } from "react";
import { generateQuestBoardName } from "./utils/names";
import Board from "./components/Board";
import TaskModal from "./components/TaskModal";

export default function App() {
  // Wizard: 0 Welcome → 2 Name → 25 First Task → 3 Boards
  const [step, setStep] = useState(0);
  const [boardName, setBoardName] = useState("");
  const [nameError, setNameError] = useState("");

  // Boards (start empty)
  const [boards, setBoards] = useState([]);

  // Task modal
  const [modalOpen, setModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState("edit"); // "edit" | "create"
  const [modalTask, setModalTask] = useState(null);
  const [modalCtx, setModalCtx] = useState(null); // { boardId, colId }

  /* ----------------------------- Wizard ----------------------------- */
  const handleGenerateName = () => {
    const name = generateQuestBoardName(boardName);
    setBoardName(name);
    if (nameError) setNameError("");
  };

  const handleForge = () => {
    if (!boardName.trim()) {
      setNameError("enter quest name to Forge Quest board");
      return;
    }
    const newBoard = {
      id: `b-${Date.now()}`,
      name: boardName.trim(),
      minimized: false,
      columns: [
        { id: "todo", title: "To Do", cards: [] },
        { id: "doing", title: "Doing", cards: [] },
        { id: "done", title: "Done", cards: [] },
      ],
    };
    setBoards((bs) => [newBoard, ...bs]);
    setStep(25);
  };

  const addDraftTaskToBoard = (title, notes = "") => {
    if (!boards.length) {
      setStep(3);
      return;
    }
    const firstId = boards[0].id;
    setBoards((bs) =>
      bs.map((b) => {
        if (b.id !== firstId) return b;
        const t = {
          id: `t-${Date.now()}`,
          title,
          notes,
          priority: 0,
          taskType: "sub",
          icon: "sword",
          patternSeed: Math.random().toString(36).slice(2, 8),
        };
        return {
          ...b,
          columns: b.columns.map((c) =>
            c.id === "todo" ? { ...c, cards: [t, ...c.cards] } : c
          ),
        };
      })
    );
    setStep(3);
  };

  /* -------------------------- Task helpers -------------------------- */
  function findTask(taskId) {
    for (const b of boards) {
      for (const c of b.columns) {
        const t = c.cards.find((x) => x.id === taskId);
        if (t) return { boardId: b.id, colId: c.id, task: t };
      }
    }
    return null;
  }

  // ✅ YOUR merged updater (prevents field resets)
  function updateTask(boardId, colId, taskId, updater) {
    setBoards((bs) =>
      bs.map((b) => {
        if (b.id !== boardId) return b;
        const columns = b.columns.map((c) => {
          if (c.id !== colId) return c;
          const cards = c.cards.map((t) => {
            if (t.id !== taskId) return t;
            if (typeof updater === "function") {
              const up = updater(t) || {};
              return { ...t, ...up }; // MERGE result
            }
            return { ...t, ...updater };
          });
          return { ...c, cards };
        });
        return { ...b, columns };
      })
    );
  }

  function deleteTask(boardId, taskId) {
    setBoards((bs) =>
      bs.map((b) => ({
        ...b,
        columns: b.columns.map((c) => ({
          ...c,
          cards: c.cards.filter((t) => t.id !== taskId),
        })),
      }))
    );
  }

  /* -------------------------- Print single -------------------------- */
  function printTask(task) {
    const esc = (s) =>
      String(s).replace(
        /[&<>"']/g,
        (c) =>
          ({
            "&": "&amp;",
            "<": "&lt;",
            ">": "&gt;",
            '"': "&quot;",
            "'": "&#39;",
          }[c])
      );
    const html = `<!doctype html>
<html><head><meta charset="utf-8"/><title>Print Task</title>
<style>
  @page { margin: 16mm; } body { font: 16px/1.45 system-ui, -apple-system, Segoe UI, Roboto, sans-serif; color:#0a0a0a; }
  h1 { margin:0 0 8px; font-size:28px; } .notes{white-space:pre-wrap;}
</style></head><body>
  <h1>${esc(task.title || "Task")}</h1>
  <div>Priority: ${task.priority || 0} / 5</div>
  ${task.notes ? `<div class="notes">${esc(task.notes)}</div>` : ""}
  <script>window.onload=()=>{window.print();window.onafterprint=()=>window.close();};</script>
</body></html>`;
    const w = window.open("", "_blank", "noopener,noreferrer");
    if (w) {
      w.document.open();
      w.document.write(html);
      w.document.close();
    }
  }

  /* ---- Card move handler (from Column via CustomEvent with insertAt) --- */
  useEffect(() => {
    function onMove(e) {
      const { boardId, fromColId, toColId, cardId, insertAt } = e.detail || {};
      if (!boardId || !fromColId || !toColId || !cardId) return;
      setBoards((bs) =>
        bs.map((b) => {
          if (b.id !== boardId) return b;
          const cols = b.columns.map((c) => ({ ...c, cards: [...c.cards] }));
          const from = cols.find((c) => c.id === fromColId);
          const to = cols.find((c) => c.id === toColId);
          const i = from.cards.findIndex((t) => t.id === cardId);
          if (i < 0) return b;
          const [moving] = from.cards.splice(i, 1);
          const pos = Math.max(0, Math.min(insertAt, to.cards.length));
          to.cards.splice(pos, 0, moving);
          return { ...b, columns: cols };
        })
      );
    }
    window.addEventListener("orckanban-move-card", onMove);
    return () => window.removeEventListener("orckanban-move-card", onMove);
  }, []);

  /* -------------------------------- UI -------------------------------- */
  return (
    <div className="min-h-screen">
      <header className="px-6 py-4 border-b border-neutral-800 sticky top-0 bg-neutral-950/80 backdrop-blur flex items-center justify-between">
        <h1 className="text-2xl font-extrabold tracking-tight">
          Orcganizer — <span className="text-emerald-400">Quest boards</span>
        </h1>
        <div className="flex gap-2">
          <button
            onClick={() => window.print()}
            className="px-3 py-2 rounded-lg bg-neutral-800 hover:bg-neutral-700 border border-neutral-700"
          >
            Print Page
          </button>
          <button
            onClick={() =>
              setBoards((bs) => [
                {
                  id: `b-${Date.now()}`,
                  name: "New Quest board",
                  minimized: false,
                  columns: [
                    { id: "todo", title: "To Do", cards: [] },
                    { id: "doing", title: "Doing", cards: [] },
                    { id: "done", title: "Done", cards: [] },
                  ],
                },
                ...bs,
              ])
            }
            className="px-3 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white"
          >
            New Board
          </button>
        </div>
      </header>

      <main className="p-6 max-w-6xl mx-auto space-y-6">
        {/* Step 0 — Welcome */}
        {step === 0 && (
          <section className="rounded-ticket border border-neutral-800 bg-neutral-900/80 p-8 shadow text-center space-y-4">
            <h2 className="text-2xl font-bold">Welcome to your Quest board</h2>
            <p className="text-neutral-300">
              Create a board, name your quest, and track tasks like a hero on a
              campaign.
            </p>
            <button
              className="px-5 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-medium shadow"
              onClick={() => setStep(2)}
            >
              Begin
            </button>
          </section>
        )}

        {/* Step 2 — Name board */}
        {step === 2 && (
          <section className="rounded-ticket border border-neutral-800 bg-neutral-900/80 p-6 shadow space-y-4">
            <h2 className="text-xl font-semibold">Name your Quest board</h2>
            <div className="flex gap-2">
              <input
                value={boardName}
                onChange={(e) => {
                  setBoardName(e.target.value);
                  if (nameError) setNameError("");
                }}
                placeholder="e.g., The Fellowship of Focus"
                className="flex-1 px-3 py-2 rounded-xl bg-neutral-900 border border-neutral-700 outline-none focus:ring-2 focus:ring-emerald-600"
              />
              <button
                onClick={handleGenerateName}
                className="px-3 py-2 rounded-xl bg-neutral-800 hover:bg-neutral-700 border border-neutral-700"
              >
                Generate Quest board name
              </button>
            </div>
            {nameError && <p className="text-red-400 text-sm">{nameError}</p>}
            <button
              onClick={handleForge}
              disabled={!boardName.trim()}
              className={`px-4 py-2 rounded-xl font-medium shadow ${
                boardName.trim()
                  ? "bg-emerald-600 hover:bg-emerald-500 text-white"
                  : "bg-neutral-800 cursor-not-allowed border border-neutral-700"
              }`}
            >
              Forge Quest board
            </button>
          </section>
        )}

        {/* Step 2.5 — Create first task (quick) */}
        {step === 25 && (
          <section className="rounded-ticket border border-neutral-800 bg-neutral-900/80 p-6 shadow space-y-4">
            <h2 className="text-xl font-semibold">Create your first task</h2>
            <input
              className="w-full px-3 py-2 rounded-xl bg-neutral-900 border border-neutral-700 outline-none"
              placeholder="Task title (press Enter to add)"
              onKeyDown={(e) => {
                const v = e.currentTarget.value.trim();
                if (e.key === "Enter" && v) {
                  addDraftTaskToBoard(v);
                }
              }}
            />
            <div className="flex gap-2">
              <button
                onClick={() => setStep(3)}
                className="px-4 py-2 rounded-xl bg-neutral-800 hover:bg-neutral-700 border border-neutral-700"
              >
                Skip
              </button>
            </div>
          </section>
        )}

        {/* Step 3 — Boards */}
        {step === 3 && (
          <section className="space-y-6">
            {boards.map((board, i) => (
              <Board
                key={board.id}
                board={board}
                index={i}
                boards={boards}
                setBoards={setBoards}
                onPrintTask={printTask}
                onOpenTask={(task, ctx) => {
                  setModalMode("edit");
                  setModalTask(task);
                  setModalCtx(ctx);
                  setModalOpen(true);
                }}
                onCreateTask={(ctx) => {
                  setModalMode("create");
                  setModalTask({
                    id: `t-${Date.now()}`,
                    title: "",
                    notes: "",
                    priority: 0,
                    taskType: "sub",
                    icon: "sword",
                    patternSeed: Math.random().toString(36).slice(2, 8),
                  });
                  setModalCtx(ctx); // { boardId, colId }
                  setModalOpen(true);
                }}
                onUpdateTask={(boardId, colId, taskId, patch) =>
                  updateTask(boardId, colId, taskId, patch)
                }
                onDeleteTask={(boardId, taskId) => deleteTask(boardId, taskId)}
              />
            ))}
          </section>
        )}
      </main>

      {/* Task Modal */}
      <TaskModal
        open={modalOpen}
        task={modalTask}
        mode={modalMode}
        onClose={() => setModalOpen(false)}
        onSave={(updated) => {
          if (modalMode === "edit") {
            const found = findTask(updated.id);
            if (found)
              updateTask(found.boardId, found.colId, updated.id, {
                ...updated,
              });
          } else {
            const { boardId, colId } = modalCtx || {};
            if (!boardId || !colId) return setModalOpen(false);
            setBoards((bs) =>
              bs.map((b) =>
                b.id === boardId
                  ? {
                      ...b,
                      columns: b.columns.map((c) =>
                        c.id === colId
                          ? { ...c, cards: [{ ...updated }, ...c.cards] }
                          : c
                      ),
                    }
                  : b
              )
            );
          }
          setModalOpen(false);
        }}
        onDelete={(toDelete) => {
          deleteTask(null, toDelete.id);
          setModalOpen(false);
        }}
        onRerollPattern={(id) => {
          const found = findTask(id);
          if (found)
            updateTask(found.boardId, found.colId, id, {
              patternSeed: Math.random().toString(36).slice(2, 8),
            });
        }}
      />
    </div>
  );
}
