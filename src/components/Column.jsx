import React, { useState, useRef, useEffect } from "react";
import TaskCard from "./TaskCard";
import DragPortal from "./DragPortal";
import { Droppable, Draggable } from "react-beautiful-dnd";

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

// Darken to ~20% for pleasant tone
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

export default React.memo(function Column({
  boardId,
  column, // { id, title, cards, color?, minimized? }
  index,
  colDragHandleProps,
  onCreateTask,
  onUpdateTask,
  onDeleteTask,
  onPrintTask,
  onRenameColumn,
  setBoards,
  isDragClone = false, // when rendered inside drag portal
}) {
  const [editing, setEditing] = useState(false);
  const [title, setTitle] = useState(column.title);

  // Column kebab with PORTAL (never clipped)
  const [menuOpen, setMenuOpen] = useState(false);
  const [menuPos, setMenuPos] = useState({ top: 0, left: 0 });
  const menuBtnRef = useRef(null);
  const menuPortalRef = useRef(null);

  // Close-on-click-outside that respects clicks inside the portal
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

  const commitTitle = () => {
    const t = (title || "").trim() || "Untitled";
    onRenameColumn?.(boardId, column.id, t);
    setEditing(false);
  };

  const setColor = (hex) => {
    setBoards?.((bs) =>
      bs.map((b) =>
        b.id === boardId
          ? {
              ...b,
              columns: b.columns.map((c) =>
                c.id === column.id ? { ...c, color: hex } : c
              ),
            }
          : b
      )
    );
  };

  const toggleMin = () => {
    setBoards?.((bs) =>
      bs.map((b) =>
        b.id === boardId
          ? {
              ...b,
              columns: b.columns.map((c) =>
                c.id === column.id ? { ...c, minimized: !c.minimized } : c
              ),
            }
          : b
      )
    );
  };

  const headerBg = column.color || "transparent";
  const bodyBg = column.color ? darken(column.color, 0.2) : "transparent";

  // Make borders transparent on the clone to avoid any ghost lines
  const rootBorderClass = isDragClone
    ? "border-transparent"
    : "border-neutral-800";
  const headerBorderClass = isDragClone
    ? "border-transparent"
    : "border-neutral-800";

  /* ----------------------- MINIMIZED COLUMN ----------------------- */
  if (column.minimized) {
    return (
      <div
        className={`rounded-ticket border ${rootBorderClass} shadow-sm shrink-0 relative cursor-grab active:cursor-grabbing`}
        style={{
          minWidth: "56px",
          width: "56px",
          height: "420px",
          background: headerBg,
          backgroundClip: "padding-box",
          overflow: isDragClone ? "hidden" : undefined,
        }}
        {...(colDragHandleProps || {})}
        onClick={(e) => {
          e.stopPropagation();
          toggleMin();
        }}
        title="Expand column"
      >
        <div className="w-full h-full flex flex-col items-center justify-start pt-[18px] gap-2 text-white/95 select-none pointer-events-none">
          {/* ↔ icon kept for minimized state */}
          <svg
            width="18"
            height="18"
            viewBox="0 0 24 24"
            fill="none"
            aria-hidden
          >
            <path
              d="M7 12H17M7 12l2.5-2.5M7 12l2.5 2.5M17 12l-2.5-2.5M17 12l-2.5 2.5"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
            />
          </svg>
          <div
            className="font-semibold"
            style={{ writingMode: "vertical-rl", textOrientation: "mixed" }}
          >
            {column.title}
          </div>
        </div>

        {/* 👇 shim masks any bottom seam while dragging */}
        {isDragClone && (
          <div
            className="pointer-events-none absolute left-0 right-0 bottom-0 h-px"
            style={{ background: headerBg }}
          />
        )}
      </div>
    );
  }

  /* ------------------------- NORMAL COLUMN ------------------------ */
  return (
    <div
      className={`rounded-ticket border ${rootBorderClass} shadow-sm shrink-0 relative`}
      style={{
        background: bodyBg,
        backgroundClip: "padding-box",
        overflow: isDragClone ? "hidden" : undefined,
      }}
    >
      {/* Header row (drag handle) */}
      <div
        className={`flex items-center justify-between px-3 py-2 border-b ${headerBorderClass}`}
        style={{ background: headerBg }}
        {...(colDragHandleProps || {})}
      >
        <div className="min-w-0 flex items-center gap-2">
          {/* Minimize chevron */}
          <button
            className="grid place-items-center h-8 w-8 rounded-md hover:bg-white/10"
            title="Minimize column"
            onMouseDown={(e) => {
              e.preventDefault();
              e.stopPropagation();
            }}
            onClick={(e) => {
              e.stopPropagation();
              toggleMin();
            }}
          >
            <ChevronUp />
          </button>

          {editing ? (
            <input
              autoFocus
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              onBlur={commitTitle}
              onKeyDown={(e) => {
                if (e.key === "Enter") commitTitle();
                if (e.key === "Escape") {
                  setTitle(column.title);
                  setEditing(false);
                }
              }}
              className="px-2 py-1 rounded bg-neutral-800 border border-neutral-700 text-sm w-[220px] outline-none"
              onMouseDown={(e) => e.stopPropagation()}
            />
          ) : (
            <button
              className="font-semibold truncate hover:underline cursor-text"
              onClick={(e) => {
                e.stopPropagation();
                setEditing(true);
              }}
              title="Rename column"
            >
              {column.title}
            </button>
          )}
        </div>

        {/* kebab menu — BUTTON; menu is rendered in a PORTAL */}
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
          title="Column menu"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
            <circle cx="12" cy="5" r="1.8" />
            <circle cx="12" cy="12" r="1.8" />
            <circle cx="12" cy="19" r="1.8" />
          </svg>
        </button>
      </div>

      {/* Cards list */}
      <Droppable droppableId={`${boardId}:${column.id}`} type="CARD">
        {(provided, snapshot) => (
          <div
            ref={provided.innerRef}
            {...provided.droppableProps}
            className={`p-3 grid gap-3 ${
              snapshot.isDraggingOver ? "bg-white/5" : ""
            }`}
          >
            {column.cards.map((card, i) => (
              <Draggable
                key={card.id}
                draggableId={`card-${card.id}`}
                index={i}
              >
                {(dragProvided2, dragSnap2) => {
                  const inListNode = (
                    <div
                      ref={dragProvided2.innerRef}
                      {...dragProvided2.draggableProps}
                      style={{
                        ...dragProvided2.draggableProps.style,
                        willChange: "transform",
                      }}
                    >
                      <TaskCard
                        card={card}
                        colId={column.id}
                        dragHandleProps={dragProvided2.dragHandleProps}
                        onToggleMinimize={(taskId) =>
                          onUpdateTask?.(boardId, column.id, taskId, (t) => ({
                            minimized: !t.minimized,
                          }))
                        }
                        onPrintTask={onPrintTask}
                        onDelete={(t) =>
                          onDeleteTask?.(boardId, column.id, t.id, i)
                        }
                        onPriority={(taskId, v) =>
                          onUpdateTask?.(boardId, column.id, taskId, {
                            priority: v,
                          })
                        }
                        onIconChange={(taskId, key) =>
                          onUpdateTask?.(boardId, column.id, taskId, {
                            icon: key,
                          })
                        }
                        onUpdate={(taskId, patch) =>
                          onUpdateTask?.(boardId, column.id, taskId, patch)
                        }
                        onRerollPattern={(taskId, opt) =>
                          onUpdateTask?.(boardId, column.id, taskId, (t) => ({
                            patternSeed: Math.random().toString(36).slice(2, 8),
                            patternType: opt?.type || t.patternType,
                          }))
                        }
                      />
                    </div>
                  );

                  // Drag clone: wrapper has the shadow; cloned card is borderless
                  const portalClone = (
                    <div
                      className="pointer-events-none"
                      style={{
                        ...dragProvided2.draggableProps.style,
                        zIndex: 1000,
                        position: "fixed",
                        boxShadow:
                          "0 24px 48px rgba(0,0,0,0.30), 0 8px 16px rgba(0,0,0,0.25)",
                        transform:
                          dragProvided2.draggableProps.style?.transform,
                        WebkitTransform:
                          dragProvided2.draggableProps.style?.transform,
                      }}
                    >
                      <TaskCard
                        card={card}
                        colId={column.id}
                        isDragging
                        isDragClone
                      />
                    </div>
                  );

                  return dragSnap2.isDragging ? (
                    <>
                      <div
                        ref={dragProvided2.innerRef}
                        {...dragProvided2.draggableProps}
                        style={{
                          ...dragProvided2.draggableProps.style,
                          visibility: "hidden",
                          pointerEvents: "none",
                        }}
                      />
                      <DragPortal>{portalClone}</DragPortal>
                    </>
                  ) : (
                    inListNode
                  );
                }}
              </Draggable>
            ))}
            {provided.placeholder}
          </div>
        )}
      </Droppable>

      {/* Bottom pill: + Task */}
      <div className="px-3 pb-3">
        <div className="flex justify-center">
          <button
            className="rounded-full px-4 py-2 border border-white/15 bg-white/[0.08] hover:bg-white/[0.12]"
            onClick={() => onCreateTask?.({ boardId, colId: column.id })}
          >
            + Task
          </button>
        </div>
      </div>

      {/* Column Menu (PORTAL to body) */}
      {menuOpen && (
        <DragPortal>
          <div
            ref={menuPortalRef}
            className="fixed z-[650]"
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
                      setColor(hex);
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
                    setColor("");
                    setMenuOpen(false);
                  }}
                  title="Reset"
                />
              </div>
            </div>
          </div>
        </DragPortal>
      )}

      {/* 👇 body-color shim masks any bottom seam on some GPUs while dragging */}
      {isDragClone && (
        <div
          className="pointer-events-none absolute left-0 right-0 bottom-0 h-px"
          style={{ background: bodyBg }}
        />
      )}
    </div>
  );
});
