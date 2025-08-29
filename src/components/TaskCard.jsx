import React, { useEffect, useMemo, useState } from "react";
import { patternForId } from "../utils/patterns";
import IconPickerDropdown from "./IconPicker";
import PriorityStars from "./PriorityStars";
import ConfirmDialog from "./ConfirmDialog";

/* tiny deterministic hash for dither */
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

export default React.memo(function TaskCard({
  card,
  colId,
  isDragging = false,
  dragHandleProps, // header is the drag handle
  onToggleMinimize,
  onPrintTask,
  onDelete,
  onPriority,
  onIconChange,
  onUpdate, // (id, patch)
  onRerollPattern, // (id, {type})
}) {
  const [askDelete, setAskDelete] = useState(false);
  const [editingTitle, setEditingTitle] = useState(false);
  const [editingNotes, setEditingNotes] = useState(false);
  const isMin = !!card.minimized;

  // leave edit modes when minimized
  useEffect(() => {
    if (isMin) {
      setEditingTitle(false);
      setEditingNotes(false);
    }
  }, [isMin]);

  const headerPattern = useMemo(() => {
    return card.patternType === "dither"
      ? ditherPattern(card.patternSeed || String(card.id))
      : patternForId(card.id, card.patternSeed || "");
  }, [card.id, card.patternSeed, card.patternType]);

  const taskTypeLabel = card.taskType === "main" ? "Main quest" : "Sub quest";

  // Clicking a minimized card expands it.
  const handleCardClick = () => {
    if (isDragging) return;
    if (isMin) onToggleMinimize?.(card.id, colId);
  };

  // Pattern click: if minimized, expand; else reroll pattern.
  const handlePatternClick = (e) => {
    e.stopPropagation();
    if (isMin) {
      onToggleMinimize?.(card.id, colId);
      return;
    }
    const nextType = card.patternType === "dither" ? "default" : "dither";
    onRerollPattern?.(card.id, { type: nextType });
  };

  return (
    <>
      <div
        className="rounded-ticket border border-neutral-700 shadow-sm overflow-hidden bg-white flex flex-col"
        style={{ width: "70mm", height: isMin ? "auto" : "80mm" }}
        onClick={handleCardClick}
      >
        {/* HEADER (drag handle) */}
        <div
          className={`relative bg-brandBlue-700 text-white ${
            isMin ? "px-2.5 py-1.5" : "px-2.5 py-2"
          } cursor-grab active:cursor-grabbing shrink-0`}
          {...(dragHandleProps || {})}
          onClick={(e) => {
            if (!isMin) e.stopPropagation();
          }}
        >
          <div
            className={`flex items-center gap-2 ${isMin ? "pr-10" : "pr-14"}`}
          >
            {/* Icon picker — disabled when minimized; header-themed */}
            <div
              className={`flex items-center justify-center ${isMin ? "" : ""}`}
              onMouseDown={(e) => {
                if (!isMin) e.stopPropagation();
              }}
              onClick={(e) => {
                if (!isMin) e.stopPropagation();
              }}
              title="Change icon"
            >
              <IconPickerDropdown
                value={card.icon}
                onChange={(key) => onIconChange?.(card.id, key)}
                showLabel={false}
                size="sm"
                variant="header"
                disabled={isMin} // 👈 no editing while minimized
              />
            </div>

            <div className="leading-tight min-w-0">
              {!isMin && (
                <div className="text-[10px] leading-4 opacity-90 whitespace-nowrap">
                  {taskTypeLabel}
                </div>
              )}

              {/* Title: when minimized, clicking title should expand, not edit */}
              {editingTitle && !isMin ? (
                <input
                  className={`font-semibold -mt-0.5 bg-white/15 rounded px-1.5 py-0.5 outline-none ${
                    isMin ? "w-[46mm]" : "w-[42mm]"
                  }`}
                  value={card.title || ""}
                  onChange={(e) =>
                    onUpdate?.(card.id, { title: e.target.value })
                  }
                  onClick={(e) => e.stopPropagation()}
                  onMouseDown={(e) => e.stopPropagation()}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === "Escape")
                      setEditingTitle(false);
                  }}
                  onBlur={() => setEditingTitle(false)}
                  autoFocus
                />
              ) : (
                <button
                  className={`font-semibold -mt-0.5 truncate text-left hover:underline ${
                    isMin ? "max-w-[46mm]" : "w-[42mm]"
                  }`}
                  onClick={(e) => {
                    if (isMin) {
                      // expand instead of editing
                      onToggleMinimize?.(card.id, colId);
                    } else {
                      e.stopPropagation();
                      setEditingTitle(true);
                    }
                  }}
                  onMouseDown={(e) => {
                    if (!isMin) e.stopPropagation();
                  }}
                  title={isMin ? "Expand task" : "Rename task"}
                >
                  {card.title || "Task name"}
                </button>
              )}
            </div>
          </div>

          {/* CLICKABLE pattern swatch */}
          <div
            className="absolute top-0 right-0 h-full w-16 opacity-40 print:opacity-60"
            style={{
              backgroundImage: headerPattern,
              backgroundSize: "200px 160px",
              backgroundRepeat: "no-repeat",
              backgroundPosition: "right top",
              cursor: "pointer",
            }}
            onClick={handlePatternClick}
            title="Click to change pattern"
          />
        </div>

        {/* BODY (notes) — hidden when minimized */}
        {!isMin && (
          <div
            className="px-2.5 py-2 text-neutral-900 flex-1 overflow-y-auto overflow-x-hidden"
            style={{ minHeight: 0, display: "flex", flexDirection: "column" }}
            onClick={(e) => {
              e.stopPropagation();
              setEditingNotes(true);
            }}
          >
            {editingNotes ? (
              <textarea
                className="w-full px-2 py-2 rounded-lg bg-neutral-100 outline-none resize-none border-0"
                style={{ flex: 1, minHeight: 0 }}
                value={card.notes || ""}
                onChange={(e) => onUpdate?.(card.id, { notes: e.target.value })}
                onClick={(e) => e.stopPropagation()}
                onMouseDown={(e) => e.stopPropagation()}
                onBlur={() => setEditingNotes(false)} // border goes away after done
                placeholder="Describe the task..."
                autoFocus
              />
            ) : (
              <div className="text-[14px] leading-5 whitespace-pre-wrap select-text">
                {card.notes && card.notes.trim().length
                  ? card.notes
                  : "Describe the task..."}
              </div>
            )}
          </div>
        )}

        {/* PRIORITY BAND */}
        {!isMin && (
          <div className="bg-brandBlue-700 text-white px-2.5 py-1.5 shrink-0">
            <div className="flex items-center justify-between">
              <span className="text-[11px]">PRIORITY</span>
              <PriorityStars
                value={card.priority || 0}
                onChange={(v) => onPriority?.(card.id, v)}
              />
            </div>
          </div>
        )}

        {/* ACTIONS — hidden when minimized */}
        {!isMin && (
          <div className="px-2.5 py-1.5 bg-white border-t border-neutral-200 flex gap-1 flex-nowrap items-center shrink-0">
            <button
              type="button"
              className="px-2 py-1 rounded bg-emerald-600 hover:bg-emerald-500 text-[11px] text-white"
              onClick={(e) => {
                e.stopPropagation();
                onPrintTask?.(card);
              }}
            >
              Print
            </button>
            <button
              type="button"
              className="px-2 py-1 rounded bg-neutral-800 hover:bg-neutral-700 text-[11px] text-white"
              onClick={(e) => {
                e.stopPropagation();
                onToggleMinimize?.(card.id, colId);
              }}
            >
              Minimize
            </button>
            <button
              type="button"
              className="px-2 py-1 rounded bg-red-600 hover:bg-red-500 text-[11px] text-white"
              onClick={(e) => {
                e.stopPropagation();
                setAskDelete(true);
              }}
            >
              Delete
            </button>
          </div>
        )}
      </div>

      {/* Full-screen dim confirm, centered */}
      <ConfirmDialog
        open={askDelete}
        title="Delete task"
        message="Are you sure you want to delete task?"
        onNo={() => setAskDelete(false)}
        onYes={() => {
          setAskDelete(false);
          onDelete?.(card);
        }}
        fullScreenDim
        centered
      />
    </>
  );
});
