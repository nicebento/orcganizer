import React, { useEffect, useRef, useState } from "react";
import { Droppable, Draggable } from "react-beautiful-dnd";
import Column from "./Column";
import ConfirmDialog from "./ConfirmDialog";
import DragPortal from "./DragPortal";
import { generateQuestBoardName } from "../utils/names";

const PALETTE = [
  "#1d4ed8",
  "#2563eb",
  "#3b82f6",
  "#0ea5e9",
  "#14b8a6",
  "#10b981",
  "#84cc16",
  "#f59e0b",
  "#ef4444",
  "#a855f7",
];

// Darken a hex color by a percentage (0–1) — tuned to ~20%
function darken(hex, pct = 0.2) {
  if (!hex) return "";
  const n = hex.replace("#", "");
  const full =
    n.length === 3
      ? n
          .split("")
          .map((c) => c + c)
          .join("")
      : n;
  const v = parseInt(full, 16);
  const r = (v >> 16) & 255,
    g = (v >> 8) & 255,
    b = v & 255;
  const f = 1 - Math.min(Math.max(pct, 0), 1);
  return `rgb(${Math.round(r * f)}, ${Math.round(g * f)}, ${Math.round(
    b * f
  )})`;
}

function ChevronUp() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M18 15l-6-6-6 6"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
    </svg>
  );
}
function ChevronDown() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M6 9l6 6 6-6"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
    </svg>
  );
}

export default React.memo(function Board({
  board,
  setBoards,
  onCreateTask,
  onUpdateTask,
  onDeleteTask,
  onPrintTask,
  onRenameColumn,
  boardDragHandleProps,
}) {
  const [editingName, setEditingName] = useState(false);
  const [nameDraft, setNameDraft] = useState(board.name);
  const [showDel1, setShowDel1] = useState(false);
  const [showDel2, setShowDel2] = useState(false);
  const [timer, setTimer] = useState(5);

  // Board kebab with PORTAL (never clipped)
  const [menuOpen, setMenuOpen] = useState(false);
  const [menuPos, setMenuPos] = useState({ top: 0, left: 0 });
  const menuBtnRef = useRef(null);
  const menuPortalRef = useRef(null);

  // Close-on-click-outside (uses click, respects portal content)
  useEffect(() => {
    const onDocClick = (e) => {
      if (!menuOpen) return;
      if (menuBtnRef.current?.contains(e.target)) return;
      if (menuPortalRef.current?.contains(e.target)) return;
      setMenuOpen(false);
    };
    document.addEventListener("click", onDocClick);
    return () => document.removeEventListener("click", onDocClick);
  }, [menuOpen]);

  useEffect(() => {
    if (!showDel2) return;
    setTimer(5);
    const id = setInterval(() => setTimer((t) => Math.max(0, t - 1)), 1000);
    return () => clearInterval(id);
  }, [showDel2]);

  const setBoardColor = (hex) => {
    setBoards((bs) =>
      bs.map((b) => (b.id === board.id ? { ...b, headerColor: hex } : b))
    );
  };

  const toggleBoardMin = () => {
    setBoards((bs) =>
      bs.map((b) => (b.id === board.id ? { ...b, minimized: !b.minimized } : b))
    );
  };

  const commitName = () => {
    const n = (nameDraft || "").trim() || "Untitled board";
    if (n !== board.name) {
      setBoards((bs) =>
        bs.map((b) => (b.id === board.id ? { ...b, name: n } : b))
      );
    }
    setEditingName(false);
  };

  const deleteBoardNow = () => {
    setBoards((bs) => bs.filter((b) => b.id !== board.id));
    setShowDel2(false);
  };

  const headerBg = board.headerColor || "transparent";
  const bodyBg = board.headerColor
    ? darken(board.headerColor, 0.2)
    : "transparent";

  return (
    <div className="rounded-ticket border border-neutral-800 bg-neutral-900/60 backdrop-blur-sm relative">
      {/* Header — whole bar drags; minimize chevron left of title */}
      <div
        className="flex items-center justify-between px-4 py-3 border-b border-neutral-800 cursor-grab active:cursor-grabbing select-none"
        style={{ backgroundColor: headerBg }}
        {...(boardDragHandleProps || {})}
      >
        <div className="flex items-center gap-2 min-w-0">
          <button
            type="button"
            className="grid place-items-center h-8 w-8 rounded-md hover:bg-white/10"
            title={board.minimized ? "Expand board" : "Minimize board"}
            onMouseDown={(e) => {
              e.preventDefault();
              e.stopPropagation();
            }}
            onClick={(e) => {
              e.stopPropagation();
              toggleBoardMin();
            }}
          >
            {board.minimized ? <ChevronDown /> : <ChevronUp />}
          </button>

          {editingName ? (
            <div className="flex items-center gap-2">
              <input
                autoFocus
                value={nameDraft}
                onChange={(e) => setNameDraft(e.target.value)}
                onBlur={commitName}
                onKeyDown={(e) => {
                  if (e.key === "Enter") commitName();
                  if (e.key === "Escape") {
                    setNameDraft(board.name);
                    setEditingName(false);
                  }
                }}
                className="px-2 py-1 rounded bg-neutral-800 border border-neutral-700 text-sm w-[260px] outline-none"
                onMouseDown={(e) => e.stopPropagation()}
              />
              <button
                className="px-2 py-1 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-xs border border-neutral-700"
                onMouseDown={(e) => e.preventDefault()}
                onClick={(e) => {
                  e.stopPropagation();
                  setNameDraft(generateQuestBoardName(nameDraft));
                }}
              >
                Generate Quest board name
              </button>
            </div>
          ) : (
            <button
              className="font-semibold truncate hover:underline cursor-text"
              onClick={(e) => {
                e.stopPropagation();
                setEditingName(true);
                setNameDraft(board.name);
              }}
              title="Rename board"
            >
              {board.name}
            </button>
          )}
        </div>

        {/* RIGHT: kebab (portal menu) */}
        <div
          className="flex items-center gap-2"
          onClick={(e) => e.stopPropagation()}
        >
          <button
            ref={menuBtnRef}
            className="grid place-items-center h-8 w-8 rounded-md hover:bg-white/10"
            onMouseDown={(e) => {
              e.preventDefault();
              e.stopPropagation();
            }}
            onClick={() => {
              const r = menuBtnRef.current?.getBoundingClientRect();
              if (r) {
                const width = 224;
                const left = Math.min(
                  Math.max(r.right - width, 8),
                  window.innerWidth - 8 - width
                );
                const top = r.bottom + 8;
                setMenuPos({ top, left });
              }
              setMenuOpen(true);
            }}
            title="Board menu"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
              <circle cx="12" cy="5" r="1.8" />
              <circle cx="12" cy="12" r="1.8" />
              <circle cx="12" cy="19" r="1.8" />
            </svg>
          </button>
        </div>
      </div>

      {!board.minimized && (
        <div className="pb-2" style={{ background: bodyBg }}>
          <div className="p-4 overflow-x-auto">
            <Droppable
              droppableId={`cols-${board.id}`}
              direction="horizontal"
              type="COLUMN"
            >
              {(provided) => (
                <div
                  className="flex gap-4"
                  ref={provided.innerRef}
                  {...provided.droppableProps}
                >
                  {board.columns.map((col, index) => {
                    const widthClass = col.minimized
                      ? "min-w-[56px]"
                      : "min-w-[300px]";
                    return (
                      <Draggable
                        key={`${board.id}-${col.id}`}
                        draggableId={`column-${board.id}-${col.id}`}
                        index={index}
                      >
                        {(dragProvided, dragSnapshot) => {
                          const spacer = (
                            <div
                              ref={dragProvided.innerRef}
                              {...dragProvided.draggableProps}
                              style={{
                                ...dragProvided.draggableProps.style,
                                visibility: "hidden", // 👈 avoids any faint edges
                                pointerEvents: "none",
                              }}
                              className={widthClass}
                            />
                          );

                          const normalColumn = (
                            <div
                              ref={dragProvided.innerRef}
                              {...dragProvided.draggableProps}
                              style={{
                                ...dragProvided.draggableProps.style,
                                willChange: "transform",
                              }}
                              className={widthClass}
                            >
                              <Column
                                boardId={board.id}
                                column={col}
                                index={index}
                                colDragHandleProps={
                                  dragProvided.dragHandleProps
                                }
                                onCreateTask={onCreateTask}
                                onUpdateTask={onUpdateTask}
                                onDeleteTask={onDeleteTask}
                                onPrintTask={onPrintTask}
                                onRenameColumn={onRenameColumn}
                                setBoards={setBoards}
                              />
                            </div>
                          );

                          // ✅ Clone wrapper uses boxShadow (no filter halo)
                          const portalClone = (
                            <div
                              className="pointer-events-none"
                              style={{
                                ...dragProvided.draggableProps.style,
                                zIndex: 1000,
                                position: "fixed",
                                boxShadow:
                                  "0 24px 48px rgba(0,0,0,0.30), 0 8px 16px rgba(0,0,0,0.25)",
                                transform:
                                  dragProvided.draggableProps.style?.transform,
                                WebkitTransform:
                                  dragProvided.draggableProps.style?.transform,
                              }}
                            >
                              <Column
                                boardId={board.id}
                                column={col}
                                index={index}
                                colDragHandleProps={{}}
                                onCreateTask={() => {}}
                                onUpdateTask={() => {}}
                                onDeleteTask={() => {}}
                                onPrintTask={() => {}}
                                onRenameColumn={() => {}}
                                setBoards={() => {}}
                                isDragClone
                              />
                            </div>
                          );

                          return dragSnapshot.isDragging ? (
                            <>
                              {spacer}
                              <DragPortal>{portalClone}</DragPortal>
                            </>
                          ) : (
                            normalColumn
                          );
                        }}
                      </Draggable>
                    );
                  })}
                  {provided.placeholder}

                  {/* Add column */}
                  <button
                    onClick={() => {
                      setBoards((bs) =>
                        bs.map((b) =>
                          b.id === board.id
                            ? {
                                ...b,
                                columns: [
                                  ...b.columns,
                                  {
                                    id: `col-${b.columns.length + 1}`,
                                    title: `Column ${b.columns.length + 1}`,
                                    cards: [],
                                    color: "",
                                    minimized: false,
                                  },
                                ],
                              }
                            : b
                        )
                      );
                    }}
                    className="min-w-[300px] aspect-[3/4] rounded-ticket border-2 border-dashed border-neutral-700 text-neutral-200 hover:text-white hover:border-neutral-500 grid place-items-center"
                    title="Add new column"
                  >
                    <span className="text-6xl leading-none">+</span>
                  </button>
                </div>
              )}
            </Droppable>
          </div>
        </div>
      )}

      {/* Board Menu (PORTAL) */}
      {menuOpen && (
        <DragPortal>
          <div
            ref={menuPortalRef}
            className="fixed z-[230]"
            style={{ top: menuPos.top, left: menuPos.left, width: 224 }}
          >
            <div className="rounded-xl border border-neutral-700 bg-neutral-900 shadow-2xl p-2">
              <div className="px-2 py-1.5 text-sm text-neutral-300">
                Pick color
              </div>
              <div className="grid grid-cols-5 gap-2 px-2 pb-2">
                {PALETTE.map((hex) => (
                  <button
                    key={hex}
                    className="h-7 w-7 rounded-full border border-white/30"
                    style={{ backgroundColor: hex }}
                    onClick={() => {
                      setBoardColor(hex);
                      setMenuOpen(false);
                    }}
                    title={hex}
                  />
                ))}
                <button
                  className="h-7 w-7 rounded-full border border-white/30"
                  style={{
                    background:
                      "conic-gradient(#1d4ed8,#2563eb,#3b82f6,#0ea5e9,#14b8a6,#10b981,#84cc16,#f59e0b,#ef4444,#a855f7)",
                  }}
                  onClick={() => {
                    setBoardColor("");
                    setMenuOpen(false);
                  }}
                  title="Reset"
                />
              </div>

              <div className="border-t border-neutral-800 my-1" />

              <button
                className="w-full text-left px-3 py-2 rounded-lg hover:bg-white/10 text-red-300"
                onClick={() => {
                  setMenuOpen(false);
                  setShowDel1(true);
                }}
              >
                Delete board…
              </button>
            </div>
          </div>
        </DragPortal>
      )}

      {/* Delete dialogs */}
      <ConfirmDialog
        open={showDel1}
        title="Delete board"
        message={`Are you sure you want to delete the board “${board.name}”?`}
        onNo={() => setShowDel1(false)}
        onYes={() => {
          setShowDel1(false);
          setShowDel2(true);
        }}
      />
      {showDel2 && (
        <div className="fixed inset-0 z-[70]">
          <div
            className="absolute inset-0 bg-black/60"
            onClick={() => setShowDel2(false)}
          />
          <div className="relative mx-auto mt-32 max-w-sm rounded-2xl border border-neutral-700 bg-neutral-900 p-5 shadow-lg">
            <h3 className="text-lg font-semibold mb-2">Final warning</h3>
            <p className="text-neutral-300 mb-3">
              Deleting this board will permanently remove{" "}
              <strong>all columns and quests</strong> on it.
            </p>
            <div className="flex justify-end gap-2">
              <button
                className="px-3 py-2 rounded-lg bg-neutral-800 hover:bg-neutral-700"
                onClick={() => setShowDel2(false)}
              >
                Cancel
              </button>
              <button
                disabled={timer > 0}
                onClick={deleteBoardNow}
                className={`px-3 py-2 rounded-lg ${
                  timer > 0
                    ? "bg-red-900/50 text-red-200 cursor-not-allowed"
                    : "bg-red-600 hover:bg-red-500 text-white"
                }`}
                title={timer > 0 ? `Please wait ${timer}s…` : "Delete board"}
              >
                {timer > 0 ? `Delete in ${timer}s…` : "Yes, delete board"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
});
