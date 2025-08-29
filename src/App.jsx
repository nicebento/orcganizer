import React, { useCallback, useEffect, useState } from "react";
import { DragDropContext, Droppable, Draggable } from "react-beautiful-dnd";
import Board from "./components/Board";
import PriorityStars from "./components/PriorityStars";
import { generateQuestBoardName } from "./utils/names";
import printTaskCard from "./utils/printTaskCard";

export default function App() {
  const [step, setStep] = useState(0);
  const [boardName, setBoardName] = useState("");
  const [nameError, setNameError] = useState("");
  const [boards, setBoards] = useState([]);

  const STORAGE_KEY = "orcganizer.boards.v3";
  const LEGACY_KEYS = ["orcganizer.boards.v2", "orcganizer.boards.v1"];

  const hydrateBoards = (arr) =>
    Array.isArray(arr)
      ? arr.map((b, bi) => ({
          id: b.id ?? `b-${Date.now()}-${bi}`,
          name: b.name ?? "Untitled board",
          minimized: !!b.minimized,
          headerColor: b.headerColor ?? "", // NEW: per-board color
          columns: Array.isArray(b.columns)
            ? b.columns.map((c, ci) => ({
                id: c.id ?? `col-${ci + 1}`,
                title: c.title ?? `Column ${ci + 1}`,
                color: c.color ?? "", // NEW: per-column header color
                minimized: !!c.minimized, // NEW: column minimized
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
        }))
      : [];

  // load
  useEffect(() => {
    try {
      let parsed = null;
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const obj = JSON.parse(raw);
        if (obj && Array.isArray(obj.boards)) parsed = obj.boards;
      }
      if (!parsed) {
        for (const k of LEGACY_KEYS) {
          const r = localStorage.getItem(k);
          if (r) {
            const maybe = JSON.parse(r);
            if (Array.isArray(maybe)) {
              parsed = maybe;
              break;
            }
          }
        }
      }
      const hydrated = hydrateBoards(parsed || []);
      setBoards(hydrated);
      if (hydrated.length) setStep(3);
      localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({ version: 3, boards: hydrated })
      );
      LEGACY_KEYS.forEach((k) => localStorage.removeItem(k));
    } catch (e) {
      console.error(e);
    }
  }, []);

  // save
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({ version: 3, boards }));
    } catch (e) {
      console.error("save failed", e);
    }
  }, [boards]);

  // first-task quick step
  const [firstTask, setFirstTask] = useState({
    title: "",
    notes: "",
    priority: 0,
    taskType: "sub",
    icon: "sword",
  });

  /* -------------------------- helpers -------------------------- */
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
      headerColor: "",
      columns: [
        { id: "todo", title: "To Do", cards: [], color: "", minimized: false },
        { id: "doing", title: "Doing", cards: [], color: "", minimized: false },
        { id: "done", title: "Done", cards: [], color: "", minimized: false },
      ],
    };
    setBoards((bs) => [newBoard, ...bs]);
    setStep(25);
  };

  const addDraftTaskToBoard = (obj) => {
    setBoards((bs) => {
      if (!bs.length) return bs;
      const firstId = bs[0].id;
      return bs.map((b) =>
        b.id === firstId
          ? {
              ...b,
              columns: b.columns.map((c) =>
                c.id === "todo"
                  ? {
                      ...c,
                      cards: [
                        {
                          id: `t-${Date.now()}`,
                          title: obj.title || "",
                          notes: obj.notes || "",
                          priority: Number(obj.priority) || 0,
                          taskType: obj.taskType || "sub",
                          icon: obj.icon || "sword",
                          patternSeed: Math.random().toString(36).slice(2, 8),
                        },
                        ...c.cards,
                      ],
                    }
                  : c
              ),
            }
          : b
      );
    });
    setStep(3);
  };

  const updateTask = useCallback((boardId, colId, taskId, updater) => {
    setBoards((bs) =>
      bs.map((b) => {
        if (b.id !== boardId) return b;
        return {
          ...b,
          columns: b.columns.map((c) => {
            if (c.id !== colId) return c;
            return {
              ...c,
              cards: c.cards.map((t) => {
                if (t.id !== taskId) return t;
                if (typeof updater === "function") {
                  const up = updater(t) || {};
                  return { ...t, ...up };
                }
                return { ...t, ...updater };
              }),
            };
          }),
        };
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

  const deleteTask = useCallback((boardId, colId, taskId) => {
    setBoards((bs) =>
      bs.map((b) =>
        b.id === boardId
          ? {
              ...b,
              columns: b.columns.map((c) =>
                c.id === colId
                  ? { ...c, cards: c.cards.filter((t) => t.id !== taskId) }
                  : c
              ),
            }
          : b
      )
    );
  }, []);

  /* ----------------------------- DnD ----------------------------- */
  const onDragEnd = ({ source, destination, type }) => {
    if (!destination) return;

    // boards
    if (type === "BOARD") {
      setBoards((bs) => {
        const next = [...bs];
        const [moved] = next.splice(source.index, 1);
        next.splice(destination.index, 0, moved);
        return next;
      });
      return;
    }

    // columns (within same board)
    if (type === "COLUMN") {
      const fromBoardId = String(source.droppableId).replace("cols-", "");
      const toBoardId = String(destination.droppableId).replace("cols-", "");
      if (fromBoardId !== toBoardId) return;
      setBoards((bs) =>
        bs.map((b) => {
          if (b.id !== fromBoardId) return b;
          const cols = [...b.columns];
          const [moved] = cols.splice(source.index, 1);
          cols.splice(destination.index, 0, moved);
          return { ...b, columns: cols };
        })
      );
      return;
    }

    // cards (across boards/columns)
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

  const resetAll = () => {
    if (!window.confirm("Reset all boards & quests? This clears local data."))
      return;
    try {
      localStorage.removeItem(STORAGE_KEY);
      LEGACY_KEYS.forEach((k) => localStorage.removeItem(k));
    } catch {}
    setBoards([]);
    setBoardName("");
    setNameError("");
    setStep(0);
  };

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
                  headerColor: "",
                  columns: [
                    {
                      id: "todo",
                      title: "To Do",
                      cards: [],
                      color: "",
                      minimized: false,
                    },
                    {
                      id: "doing",
                      title: "Doing",
                      cards: [],
                      color: "",
                      minimized: false,
                    },
                    {
                      id: "done",
                      title: "Done",
                      cards: [],
                      color: "",
                      minimized: false,
                    },
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
          >
            Reset Data
          </button>
        </div>
      </header>

      <main
        className="p-6 max-w-6xl mx-auto space-y-6"
        style={{ paddingTop: "calc(var(--global-header-h) + 8px)" }}
      >
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

        {step === 2 && (
          <section className="rounded-ticket border border-neutral-800 bg-neutral-900/80 p-6 shadow space-y-4">
            <div className="flex items-center gap-3">
              <button
                className="px-2 py-1 rounded-lg bg-neutral-800 hover:bg-neutral-700 border border-neutral-700"
                onClick={() => setStep(0)}
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
                placeholder="e.g. The Fellowship of Focus"
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

        {step === 25 && (
          <section className="rounded-ticket border border-neutral-800 bg-neutral-900/80 p-6 shadow space-y-4">
            <h2 className="text-xl font-semibold">Create your first task</h2>
            <div className="flex gap-2">
              <input
                className="flex-1 px-3 py-2 rounded-xl bg-neutral-900 border border-neutral-700 outline-none"
                placeholder="Task title"
                value={firstTask.title}
                onChange={(e) =>
                  setFirstTask((t) => ({ ...t, title: e.target.value }))
                }
              />
              <div className="px-3 py-2 rounded-xl bg-neutral-900 border border-neutral-700">
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

        {/* Boards / Columns / Cards */}
        {step === 3 && (
          <DragDropContext onDragEnd={onDragEnd}>
            <Droppable droppableId="boards-root" type="BOARD">
              {(provided) => (
                <div
                  ref={provided.innerRef}
                  {...provided.droppableProps}
                  className="flex flex-col gap-6"
                >
                  {boards.map((board, i) => (
                    <Draggable
                      key={board.id}
                      draggableId={`board-${board.id}`}
                      index={i}
                    >
                      {(dragProvided) => (
                        <div
                          ref={dragProvided.innerRef}
                          {...dragProvided.draggableProps}
                          style={{
                            ...dragProvided.draggableProps.style,
                            willChange: "transform",
                          }}
                        >
                          <Board
                            board={board}
                            setBoards={setBoards}
                            onCreateTask={createTask}
                            onUpdateTask={updateTask}
                            onDeleteTask={deleteTask}
                            onPrintTask={printTaskCard}
                            onRenameColumn={(bid, cid, name) =>
                              setBoards((bs) =>
                                bs.map((b) =>
                                  b.id === bid
                                    ? {
                                        ...b,
                                        columns: b.columns.map((c) =>
                                          c.id === cid
                                            ? { ...c, title: name }
                                            : c
                                        ),
                                      }
                                    : b
                                )
                              )
                            }
                            // drag handle is the whole header bar:
                            boardDragHandleProps={dragProvided.dragHandleProps}
                          />
                        </div>
                      )}
                    </Draggable>
                  ))}
                  {provided.placeholder}
                </div>
              )}
            </Droppable>
          </DragDropContext>
        )}
      </main>
    </div>
  );
}
