import React, { useEffect, useMemo, useState } from "react";
import { patternForId } from "../utils/patterns";
import IconPickerDropdown from "./IconPicker";
import PriorityStars from "./PriorityStars";
import ConfirmDialog from "./ConfirmDialog";

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
  isDragClone = false, // 👈 used only for the portal clone
  dragHandleProps,
  onToggleMinimize,
  onPrintTask,
  onDelete,
  onPriority,
  onIconChange,
  onUpdate,
  onRerollPattern,
}) {
  const [askDelete, setAskDelete] = useState(false);
  const [editingTitle, setEditingTitle] = useState(false);
  const [editingNotes, setEditingNotes] = useState(false);
  const isMin = !!card.minimized;

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

  const glyph =
    card.icon === "shield"
      ? "🛡️"
      : card.icon === "scroll"
      ? "📜"
      : card.icon === "potion"
      ? "🧪"
      : card.icon === "star"
      ? "⭐"
      : "🗡️";

  const notesValue = card.notes || "";
  const notesFont = isMin ? "text-lg leading-6" : "text-2xl leading-8";

  const handleCardClick = () => {
    if (isDragging) return;
    if (isMin) onToggleMinimize?.(card.id, colId);
  };

  return (
    <>
      <div
        className={`rounded-ticket ${
          isDragClone
            ? "border border-transparent"
            : "border border-neutral-700"
        } shadow-sm overflow-hidden bg-white flex flex-col`}
        style={{
          width: "70mm",
          height: isMin ? "auto" : "80mm",
          // eliminate seams on GPU
          backgroundClip: "padding-box",
          backfaceVisibility: "hidden",
          WebkitBackfaceVisibility: "hidden",
          transform: isDragClone ? "translateZ(0)" : undefined,
          // no shadow here while dragging (shadow is on wrapper clone)
          boxShadow: isDragClone ? "none" : undefined,
        }}
        onClick={handleCardClick}
      >
        {/* HEADER (drag handle) */}
        <div
          className={`relative text-white ${
            isMin ? "px-2.5 py-1.5" : "px-2.5 py-2"
          } cursor-grab active:cursor-grabbing shrink-0 rounded-t-[var(--radius-ticket)] overflow-hidden`}
          {...(dragHandleProps || {})}
          onClick={(e) => {
            if (!isMin) e.stopPropagation();
          }}
          style={{ backgroundColor: "rgb(37 99 235)" }}
        >
          {/* exact fit — prevents 1px glow */}
          <div className="absolute inset-0 rounded-t-[var(--radius-ticket)] bg-[rgb(37,99,235)] pointer-events-none" />
          <div
            className={`relative z-10 flex items-center gap-2 ${
              isMin ? "pr-10" : "pr-14"
            }`}
          >
            <div
              className="flex items-center justify-center"
              onMouseDown={(e) => {
                if (!isMin) e.stopPropagation();
              }}
              onClick={(e) => {
                if (!isMin) e.stopPropagation();
              }}
              title={isMin ? "Task icon" : "Change icon"}
            >
              {isMin ? (
                <span className="text-lg" aria-hidden>
                  {glyph}
                </span>
              ) : (
                <IconPickerDropdown
                  value={card.icon}
                  onChange={(key) => onIconChange?.(card.id, key)}
                  showLabel={false}
                  size="sm"
                  variant="header"
                />
              )}
            </div>

            <div className="leading-tight min-w-0">
              {!isMin && (
                <div className="text-[10px] leading-4 opacity-90 whitespace-nowrap">
                  {taskTypeLabel}
                </div>
              )}

              {editingTitle && !isMin ? (
                <input
                  className="font-semibold -mt-0.5 bg-white/15 rounded px-1.5 py-0.5 outline-none w-[42mm]"
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
                  className={`font-semibold -mt-0.5 truncate text-left ${
                    isMin ? "max-w-[46mm]" : "w-[42mm]"
                  }`}
                  onClick={(e) => {
                    if (isMin) {
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

          {/* Pattern swatch (top-right) */}
          <button
            type="button"
            className="absolute top-0 right-0 h-full w-10 opacity-40 print:opacity-60 rounded-tr-[var(--radius-ticket)]"
            style={{
              backgroundImage: headerPattern,
              backgroundSize: "200px 160px",
              backgroundRepeat: "no-repeat",
              backgroundPosition: "right top",
            }}
            onClick={(e) => {
              e.stopPropagation();
              if (isMin) {
                onToggleMinimize?.(card.id, colId);
                return;
              }
              const next = card.patternType === "dither" ? "default" : "dither";
              onRerollPattern?.(card.id, { type: next });
            }}
            title={isMin ? undefined : "Click to change pattern"}
          />
        </div>

        {/* BODY */}
        {!isMin && (
          <div className="flex-1 relative overflow-hidden">
            <div
              className={`h-full p-2.5 whitespace-pre-wrap select-text text-neutral-900 ${notesFont} break-words`}
              style={{
                overflow: "hidden",
                overflowWrap: "anywhere",
                wordBreak: "break-word",
              }}
              onClick={(e) => {
                e.stopPropagation();
                setEditingNotes(true);
              }}
            >
              {notesValue && notesValue.trim().length
                ? notesValue
                : "Describe the task..."}
            </div>
          </div>
        )}

        {/* PRIORITY */}
        {!isMin && (
          <div className="bg-[rgb(37,99,235)] text-white px-2.5 py-1.5 shrink-0">
            <div className="flex items-center justify-between">
              <span className="text-[11px]">PRIORITY</span>
              <PriorityStars
                value={card.priority || 0}
                onChange={(v) => onPriority?.(card.id, v)}
              />
            </div>
          </div>
        )}

        {/* ACTIONS */}
        {!isMin && (
          <div className="px-2.5 py-1.5 bg-white border-t border-neutral-200 flex gap-1 items-center">
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
