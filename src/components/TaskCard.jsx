import React, { useState } from "react";
import { patternForId } from "../utils/patterns";
import { iconGlyph } from "./IconPicker";
import PriorityStars from "./PriorityStars";
import ConfirmDialog from "./ConfirmDialog";

export default function TaskCard({
  card,
  colId,
  onOpen,
  onDragStart,
  onToggleMinimize,
  onPrintTask,
  onDelete,
  onPriority,
}) {
  const [askDelete, setAskDelete] = useState(false);
  const isMin = !!card.minimized;
  const headerPattern = patternForId(card.id, card.patternSeed || "");
  const taskTypeLabel = card.taskType === "main" ? "Main task" : "Sub task";

  const handleRootClick = () => {
    if (isMin) onToggleMinimize?.(card.id, colId);
    else onOpen?.(card);
  };

  return (
    <>
      <div
        className="rounded-ticket border border-neutral-700 shadow-sm overflow-hidden bg-white cursor-pointer select-none"
        draggable={!isMin}
        onDragStart={(e) => {
          if (!isMin) {
            onDragStart?.(e, card.id);
            e.stopPropagation(); // don’t bubble to column header
          }
        }}
        onClick={handleRootClick}
        data-card
      >
        {/* HEADER */}
        <div className="relative bg-brandBlue-700 text-white px-3 py-3">
          <div className="flex items-center gap-3 pr-20">
            {/* Bigger, centered icon */}
            <div className="flex items-center justify-center w-8 h-8 text-2xl leading-none">
              {iconGlyph(card.icon)}
            </div>
            <div className="leading-tight">
              {!isMin && (
                <div className="text-xs/4 opacity-90">{taskTypeLabel}</div>
              )}
              <div className="font-semibold -mt-0.5">
                {card.title || "Task name"}
              </div>
            </div>
          </div>
          {/* pattern swatch — flush to top/right/bottom */}
          <div
            className="pointer-events-none absolute top-0 right-0 h-full w-20 opacity-35"
            style={{
              backgroundImage: headerPattern,
              backgroundSize: "200px 160px",
              backgroundRepeat: "no-repeat",
              backgroundPosition: "right top",
            }}
          />
        </div>

        {/* BODY — show TASK TEXT (notes) instead of title */}
        {!isMin && (
          <div className="px-3 py-3 text-neutral-900">
            <div className="text-[16px] leading-6 whitespace-pre-wrap">
              {card.notes && card.notes.trim().length ? card.notes : "—"}
            </div>
          </div>
        )}

        {/* BLUE PRIORITY BAND */}
        {!isMin && (
          <div className="bg-brandBlue-700 text-white px-3 py-2">
            <div className="flex items-center justify-between">
              <span className="text-xs tracking-[0.12em]">PRIORITY</span>
              <PriorityStars
                value={card.priority || 0}
                onChange={(v) => onPriority?.(card.id, v)}
              />
            </div>
          </div>
        )}

        {/* BUTTONS BAR — green buttons */}
        {!isMin && (
          <div className="px-3 py-2 bg-white border-t border-neutral-200 flex gap-2">
            <button
              type="button"
              className="px-2 py-1 rounded bg-emerald-600 hover:bg-emerald-500 text-xs text-white"
              onClick={(e) => {
                e.stopPropagation();
                onPrintTask?.(card);
              }}
            >
              Print
            </button>
            <button
              type="button"
              className="px-2 py-1 rounded bg-emerald-600 hover:bg-emerald-500 text-xs text-white"
              onClick={(e) => {
                e.stopPropagation();
                onToggleMinimize?.(card.id, colId);
              }}
            >
              Minimize
            </button>
            <button
              type="button"
              className="px-2 py-1 rounded bg-red-600 hover:bg-red-500 text-xs text-white"
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
      />
    </>
  );
}
