import React, { useCallback, useEffect, useState } from "react";
import { generateQuestBoardName } from "./utils/names";
import Board from "./components/Board";
import PriorityStars from "./components/PriorityStars";
import { DragDropContext } from "react-beautiful-dnd";
import printTaskCard from "./utils/printTaskCard";

export default function App() {
  // Wizard: 0 Welcome → 2 Name → 25 First Task → 3 Boards
  const [step, setStep] = useState(0);
  const [boardName, setBoardName] = useState("");
  const [nameError, setNameError] = useState("");
  const [boards, setBoards] = useState([]);

  // ------- LocalStorage autosave + migration -------
  const STORAGE_KEY = "orcganizer.boards.v2";
  const LEGACY_KEYS = ["orcganizer.boards.v1"]; // we will read from these if present
  const DATA_VERSION = 2;

  // Normalize older shapes safely
  const hydrateBoards = (arr) => {
    if (!Array.isArray(arr)) return [];
    return arr.map((b) => ({
      id: b.id ?? `b-${Math.random().toString(36).slice(2, 8)}`,
      name: b.name ?? "Untitled board",
      minimized: !!b.minimized,
      columns: Array.isArray(b.columns)
        ? b.columns.map((c, ci) => ({
            id: c.id ?? `col-${ci + 1}`,
            title: c.title ?? `Column ${ci + 1}`,
            cards: Array.isArray(c.cards)
              ? c.cards.map((t, ti) => ({
                  id: t.id ?? `t-${Date.now()}-${ci}-${ti}`,
                  title: t.title ?? "",
                  notes: t.notes ?? "",
                  priority: Number(t.priority ?? 0) || 0,
                  taskType: t.taskType === "main" ? "main" : "sub",
                  icon: typeof t.icon === "string" ? t.icon : "sword",
                  patternSeed:
                    t.patternSeed ?? Math.random().toString(36).slice(2, 8),
                  minimized: !!t.minimized,
                }))
              : [],
          }))
        : [],
    }));
  };

  // Load once on mount
  useEffect(() => {
    try {
      let parsed = null;

      // 1) Try current key
      const rawV2 = localStorage.getItem(STORAGE_KEY);
      if (rawV2) {
        const obj = JSON.parse(rawV2);
        if (obj && Array.isArray(obj.boards)) {
          parsed = obj.boards;
        }
      }

      // 2) Fallback to legacy keys (arrays)
      if (!parsed) {
        for (const k of LEGACY_KEYS) {
          const rawLegacy = localStorage.getItem(k);
          if (rawLegacy) {
            const maybeArr = JSON.parse(rawLegacy);
            if (Array.isArray(maybeArr)) {
              parsed = maybeArr;
              break;
            }
          }
        }
      }

      if (parsed) {
        const hydrated = hydrateBoards(parsed);
        setBoards(hydrated);
        if (hydrated.length) setStep(3);

        // write back in new format so we consolidate to one key
        localStorage.setItem(
          STORAGE_KEY,
          JSON.stringify({ version: DATA_VERSION, boards: hydrated })
        );
        // clean legacy
        LEGACY_KEYS.forEach((k) => localStorage.removeItem(k));
      }
    } catch (e) {
      console.error("Failed to load boards from localStorage", e);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Save on any change
  useEffect(() => {
    try {
      localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({ version: DATA_VERSION, boards })
      );
    } catch (e) {
      console.error("Failed to save boards to localStorage", e);
    }
  }, [boards]);

  // Step 2.5 (first task) local draft state
  const [firstTask, setFirstTask] = useState({
    title: "",
    notes: "",
    priority: 0,
    taskType: "sub",
    icon: "sword",
  });

  // UNDO snackbar for deletes
  const [undo, setUndo] = useState(null); // { task, boardId, colId, index, timeoutId, expiresAt }

  const scheduleUndo = useCallback(
    (payload) => {
      // clear existing
      if (undo?.timeoutId) clearTimeout(undo.timeoutId);
      const timeoutId = setTimeout(() => {
        setUndo(null);
      }, 8000);
      setUndo({ ...payload, timeoutId, expiresAt: Date.now() + 8000 });
    },
    [undo]
  );

  const handleUndo = useCallback(() => {
    if (!undo) return;
    const { task, boardId, colId, index, timeoutId } = undo;
    if (timeoutId) clearTimeout(timeoutId);
    setBoards((bs) =>
      bs.map((b) =>
        b.id === boardId
          ? {
              ...b,
              columns: b.columns.map((c) =>
                c.id === colId
                  ? {
                      ...c,
                      cards: [
                        ...c.cards.slice(0, index),
                        task,
                        ...c.cards.slice(index),
                      ],
                    }
                  : c
              ),
            }
          : b
      )
    );
    setUndo(null);
  }, [undo]);

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

  // Add first task then go to boards
  const addDraftTaskToBoard = (titleOrObj, notes = "") => {
    setBoards((bs) => {
      if (!bs.length) return bs;
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
      const firstId = bs[0].id;
      return bs.map((b) => {
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
      });
    });
    setStep(3);
  };

  /* -------------------------- Task helpers -------------------------- */
  const updateTask = useCallback((boardId, colId, taskId, updater) => {
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
  }, []);

  const createTask = useCallback(({ boardId, colId }) => {
    setBoards((bs) =>
      bs.map((b) =>
        b.id === boardId
          ? {
              ...b,
              columns: b.columns.map((c) =>
                c.id === colId
                  ? {
                      ...c,
                      cards: [
                        {
                          id: `t-${Date.now()}`,
                          title: "New task",
                          notes: "",
                          priority: 0,
                          taskType: "sub",
                          icon: "sword",
                          patternSeed: Math.random().toString(36).slice(2, 8),
                        },
                        ...c.cards,
                      ],
                    }
                  : c
              ),
            }
          : b
      )
    );
  }, []);

  const deleteTask = useCallback(
    (boardId, colId, taskId, indexHint) => {
      setBoards((bs) => {
        let deleted = null;
        const next = bs.map((b) => {
          if (b.id !== boardId) return b;
          const cols = b.columns.map((c) => {
            if (c.id !== colId) return c;
            const idx = indexHint ?? c.cards.findIndex((t) => t.id === taskId);
            if (idx >= 0) deleted = c.cards[idx];
            return { ...c, cards: c.cards.filter((t) => t.id !== taskId) };
          });
          return { ...b, columns: cols };
        });
        if (deleted)
          scheduleUndo({
            task: deleted,
            boardId,
            colId,
            index: indexHint ?? 0,
          });
        return next;
      });
    },
    [scheduleUndo]
  );

  /* -------------------------- Global DnD --------------------------- */
  const onDragEnd = ({ source, destination, type }) => {
    if (!destination) return;

    if (type === "COLUMN") {
      const fromBoardId = String(source.droppableId).replace("cols-", "");
      const toBoardId = String(destination.droppableId).replace("cols-", "");
      if (fromBoardId !== toBoardId) return;
      setBoards((bs) =>
        bs.map((b) => {
          if (b.id !== fromBoardId) return b;
          const cols = Array.from(b.columns);
          const [moved] = cols.splice(source.index, 1);
          cols.splice(destination.index, 0, moved);
          return { ...b, columns: cols };
        })
      );
      return;
    }

    if (type === "CARD") {
      const [fromBoardId, fromColId] = String(source.droppableId).split(":");
      const [toBoardId, toColId] = String(destination.droppableId).split(":");
      setBoards((bs) => {
        const next = bs.map((b) => ({
          ...b,
          columns: b.columns.map((c) => ({ ...c, cards: [...c.cards] })),
        }));
        const fromBoard = next.find((b) => b.id === fromBoardId);
        const toBoard = next.find((b) => b.id === toBoardId);
        if (!fromBoard || !toBoard) return bs;
        const fromCol = fromBoard.columns.find((c) => c.id === fromColId);
        const toCol = toBoard.columns.find((c) => c.id === toColId);
        if (!fromCol || !toCol) return bs;
        const [movedCard] = fromCol.cards.splice(source.index, 1);
        toCol.cards.splice(destination.index, 0, movedCard);
        return next;
      });
    }
  };

  // ------------------------------ Reset ------------------------------
  const resetAll = () => {
    const ok = window.confirm(
      "Reset all boards & quests? This will permanently delete your local data."
    );
    if (!ok) return;
    try {
      localStorage.removeItem(STORAGE_KEY);
      LEGACY_KEYS.forEach((k) => localStorage.removeItem(k));
    } catch {}
    setBoards([]);
    setBoardName("");
    setNameError("");
    setUndo(null);
    setStep(0);
  };

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
          <button
            onClick={resetAll}
            className="px-3 py-2 rounded-lg bg-red-700 hover:bg-red-600 text-white"
            title="Clear all saved boards & quests from this browser"
          >
            Reset Data
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

        {/* Step 2 — Name board */}
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

            <div className="flex gap-2 items-center">
              {/* 50% smaller input */}
              <input
                value={boardName}
                onChange={(e) => {
                  setBoardName(e.target.value);
                  if (nameError) setNameError("");
                }}
                placeholder="e.g., The Fellowship of Focus"
                className="w-1/2 px-3 py-2 rounded-xl bg-neutral-900 border border-neutral-700 outline-none focus:ring-2 focus:ring-emerald-600"
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
                    : "bg-neutral-800 cursor-not-allowed border border-neutral-700 text-white/50"
                }`}
              >
                Forge Quest board
              </button>
            </div>
          </section>
        )}

        {/* Step 2.5 — Create first task */}
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
                <option value="main">Main quest</option>
                <option value="sub">Sub quest</option>
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
                className={`px-4 py-2 rounded-xl ${
                  firstTask.title.trim()
                    ? "bg-emerald-600 hover:bg-emerald-500 text-white"
                    : "bg-neutral-800 border border-neutral-700 text-white/50 cursor-not-allowed"
                }`}
                disabled={!firstTask.title.trim()}
                onClick={() =>
                  addDraftTaskToBoard({
                    ...firstTask,
                    title: firstTask.title.trim(),
                  })
                }
              >
                Create & Continue
              </button>
            </div>
          </section>
        )}

        {/* Step 3 — Boards */}
        {step === 3 && (
          <DragDropContext onDragEnd={onDragEnd}>
            <section className="space-y-6">
              {boards.length === 0 ? (
                <div className="rounded-ticket border border-neutral-800 bg-neutral-900/80 p-6 text-center text-neutral-300">
                  No boards yet. Click{" "}
                  <span className="text-white font-semibold">New Board</span>{" "}
                  above or go back and Forge your first quest board.
                </div>
              ) : (
                boards.map((board, i) => (
                  <Board
                    key={board.id}
                    board={board}
                    index={i}
                    boards={boards}
                    setBoards={setBoards}
                    onCreateTask={createTask}
                    onUpdateTask={updateTask}
                    onDeleteTask={deleteTask}
                    onPrintTask={printTaskCard}
                  />
                ))
              )}
            </section>
          </DragDropContext>
        )}
      </main>

      {/* UNDO snackbar */}
      {undo && (
        <div className="fixed left-1/2 -translate-x-1/2 bottom-6 z-[120]">
          <div className="px-4 py-3 rounded-xl bg-neutral-900 text-white border border-neutral-700 shadow-lg flex items-center gap-3">
            <span>Task deleted.</span>
            <button
              className="px-3 py-1 rounded bg-emerald-600 hover:bg-emerald-500 text-sm"
              onClick={handleUndo}
            >
              Undo
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
