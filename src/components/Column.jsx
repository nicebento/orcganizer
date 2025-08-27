import React, { useState } from "react";
import TaskCard from "./TaskCard";

export default function Column({
  boardId,
  column,
  onColDragStart,
  onColDrop,
  onOpenTask,
  onCreateTask,
  onUpdateTask,
  onDeleteTask,
  onPrintTask,
}) {
  // DnD for cards inside this column
  const [dragTask, setDragTask] = useState(null); // { cardId, fromColId }

  const onCardDragStart = (e, cardId) => {
    setDragTask({ cardId, fromColId: column.id });
    e.dataTransfer.effectAllowed = "move";
    e.dataTransfer.setData("text/plain", cardId);
    e.stopPropagation(); // don’t trigger header drag
  };

  const onColumnDragOver = (e) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
  };

  const getInsertIndex = (e) => {
    const cards = Array.from(e.currentTarget.querySelectorAll("[data-card]"));
    const y = e.clientY;
    let idx = cards.length;
    for (let i = 0; i < cards.length; i++) {
      const rect = cards[i].getBoundingClientRect();
      const mid = rect.top + rect.height / 2;
      if (y < mid) {
        idx = i;
        break;
      }
    }
    return idx;
  };

  const onColumnDropCards = (e) => {
    e.preventDefault();
    if (!dragTask) return;
    const insertAt = getInsertIndex(e);
    const detail = {
      boardId,
      fromColId: dragTask.fromColId,
      toColId: column.id,
      cardId: dragTask.cardId,
      insertAt,
    };
    window.dispatchEvent(new CustomEvent("orckanban-move-card", { detail }));
    setDragTask(null);
  };

  return (
    <div className="min-w-[320px] rounded-ticket bg-neutral-950 border border-neutral-800 flex flex-col shadow">
      {/* Column header — only the header is draggable for column reorder */}
      <div
        className="p-3 border-b border-neutral-800 flex items-center justify-between cursor-grab active:cursor-grabbing select-none"
        draggable
        onDragStart={(e) => onColDragStart(e, column.id)}
        onDragOver={(e) => e.preventDefault()}
        onDrop={(e) => onColDrop(e, column.id)}
      >
        <div className="font-semibold">{column.title}</div>
        <button
          className="px-2 py-1 rounded bg-neutral-800 hover:bg-neutral-700 text-xs"
          onClick={(ev) => {
            ev.stopPropagation();
            onCreateTask({ boardId, colId: column.id });
          }}
          title="Create new task"
        >
          New task
        </button>
      </div>

      {/* Cards area */}
      <div
        className="p-3 space-y-3"
        onDragOver={onColumnDragOver}
        onDrop={onColumnDropCards}
      >
        {column.cards.map((card) => (
          <TaskCard
            key={card.id}
            card={card}
            colId={column.id}
            onOpen={(c) => onOpenTask(c, { boardId, colId: column.id })}
            onDragStart={onCardDragStart}
            onToggleMinimize={(cardId, columnId) =>
              onUpdateTask(boardId, columnId, cardId, (t) => ({
                minimized: !t.minimized,
              }))
            }
            onPrintTask={(c) => onPrintTask(c)}
            onDelete={(c) => onDeleteTask(boardId, c.id)}
            onPriority={(cardId, v) =>
              onUpdateTask(boardId, column.id, cardId, { priority: v })
            }
          />
        ))}
      </div>
    </div>
  );
}
