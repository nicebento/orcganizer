import React, { useState } from "react";
import { generateQuestBoardName } from "./utils/names";
import Board from "./components/Board";
import TaskModal from "./components/TaskModal";
import PriorityStars from "./components/PriorityStars";

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

  // Step 2.5 (first task) local draft state
  const [firstTask, setFirstTask] = useState({
    title: "",
    notes: "",
    priority: 0,
    taskType: "sub", // "main" | "sub"
    icon: "sword",
  });

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

  // Overloaded: pass string/notes OR a full object
  const addDraftTaskToBoard = (titleOrObj, notes = "") => {
    if (!boards.length) {
      setStep(3);
      return;
    }
    const firstId = boards[0].id;

    const fromObj =
      typeof titleOrObj === "object"
        ? titleOrObj
        : {
            title: titleOrObj,
            notes,
            priority: 0,
            taskType: "sub",
            icon: "sword",
          };

    setBoards((bs) =>
      bs.map((b) => {
        if (b.id !== firstId) return b;
        const t = {
          id: `t-${Date.now()}`,
          title: fromObj.title || "",
          notes: fromObj.notes || "",
          priority: Number(fromObj.priority) || 0,
          taskType: fromObj.taskType || "sub",
          icon: fromObj.icon || "sword",
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

  // ✅ Updater merges task fields
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
              return { ...t, ...up };
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

  /* -------------------------------- UI -------------------------------- */
  return (
    <div className="min-h-screen">
      <header
        className="px-6 py-4 border-b border-neutral-800 fixed top-0 left-0 right-0 z-[100] bg-neutral-950/80 backdrop-blur flex items-center justify-between"
        style={{ height: "var(--global-header-h)" }}
      >
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

      <main
        className="p-6 max-w-6xl mx-auto space-y-6"
        style={{ paddingTop: "calc(var(--global-header-h) + 8px)" }}
      >
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

        {/* Step 2 — Name board (with Back) */}
        {step === 2 && (
          <section className="rounded-ticket border border-neutral-800 bg-neutral-900/80 p-6 shadow space-y-4">
            <div className="flex items-center gap-3">
              <button
                className="px-2 py-1 rounded-lg bg-neutral-800 hover:bg-neutral-700 border border-neutral-700"
                onClick={() => setStep(0)}
                title="Back"
                aria-label="Back"
              >
                ←
              </button>
              <h2 className="text-xl font-semibold m-0">
                Name your Quest board
              </h2>
            </div>

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
            <div className="flex gap-2">
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
            </div>
          </section>
        )}

        {/* Step 2.5 — Create first task (full mini form) */}
        {step === 25 && (
          <section className="rounded-ticket border border-neutral-800 bg-neutral-900/80 p-6 shadow space-y-4">
            <div className="flex items-center gap-3">
              <button
                className="px-2 py-1 rounded-lg bg-neutral-800 hover:bg-neutral-700 border border-neutral-700"
                onClick={() => setStep(2)}
                title="Back"
                aria-label="Back"
              >
                ←
              </button>
              <h2 className="text-xl font-semibold m-0">
                Create your first task
              </h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <input
                className="px-3 py-2 rounded-xl bg-neutral-900 border border-neutral-700 outline-none"
                placeholder="Task title"
                value={firstTask.title}
                onChange={(e) =>
                  setFirstTask((t) => ({ ...t, title: e.target.value }))
                }
              />
              <div className="px-3 py-2 rounded-xl bg-neutral-900 border border-neutral-700">
                <label className="text-xs block mb-1 text-neutral-400">
                  Priority
                </label>
                <PriorityStars
                  value={firstTask.priority}
                  onChange={(v) => setFirstTask((t) => ({ ...t, priority: v }))}
                />
              </div>

              <select
                className="px-3 py-2 rounded-xl bg-neutral-900 border border-neutral-700 outline-none"
                value={firstTask.taskType}
                onChange={(e) =>
                  setFirstTask((t) => ({ ...t, taskType: e.target.value }))
                }
              >
                <option value="main">Main task</option>
                <option value="sub">Sub task</option>
              </select>

              <select
                className="px-3 py-2 rounded-xl bg-neutral-900 border border-neutral-700 outline-none"
                value={firstTask.icon}
                onChange={(e) =>
                  setFirstTask((t) => ({ ...t, icon: e.target.value }))
                }
              >
                <option value="sword">🗡️ sword</option>
                <option value="shield">🛡️ shield</option>
                <option value="scroll">📜 scroll</option>
                <option value="potion">🧪 potion</option>
                <option value="star">⭐ star</option>
              </select>
            </div>

            <textarea
              className="w-full px-3 py-2 rounded-xl bg-neutral-900 border border-neutral-700 outline-none"
              placeholder="Describe task"
              rows={4}
              value={firstTask.notes}
              onChange={(e) =>
                setFirstTask((t) => ({ ...t, notes: e.target.value }))
              }
            />

            <div className="flex gap-2">
              <button
                className="px-4 py-2 rounded-xl bg-neutral-800 hover:bg-neutral-700 border border-neutral-700"
                onClick={() => setStep(3)}
              >
                Skip
              </button>
              <button
                className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white"
                disabled={!firstTask.title.trim()}
                onClick={() => {
                  addDraftTaskToBoard({
                    ...firstTask,
                    title: firstTask.title.trim(),
                  });
                }}
              >
                Create & Continue
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
                  setModalCtx(ctx);
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
