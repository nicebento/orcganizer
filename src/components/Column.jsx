import React, { useState } from "react";
import TaskCard from "./TaskCard";
import DragPortal from "./DragPortal";
import { Droppable, Draggable } from "react-beautiful-dnd"; // or "@hello-pangea/dnd"

export default function Column({
  boardId,
  column, // { id, title, cards: [] }
  index,
  colDragHandleProps, // column header handle (from Board)
  onOpenTask,
  onCreateTask,
  onUpdateTask,
  onDeleteTask,
  onPrintTask,
  onRenameColumn, // (boardId, colId, newTitle) => void
}) {
  const [editing, setEditing] = useState(false);
  const [title, setTitle] = useState(column.title);

  const commitTitle = () => {
    const t = title.trim() || "Untitled";
    if (t !== column.title) onRenameColumn(boardId, column.id, t);
    setEditing(false);
  };

  return (
    <div className="rounded-ticket border border-neutral-800 bg-neutral-900/60 backdrop-blur-sm h-full flex flex-col">
      {/* Sticky column header acts as column drag handle */}
      <div
        className="sticky top-0 z-30 flex items-center justify-between px-3 py-2 border-b border-neutral-800 bg-neutral-900/80 backdrop-blur cursor-grab active:cursor-grabbing"
        {...(colDragHandleProps || {})}
      >
        <div className="min-w-0">
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
              className="px-2 py-1 rounded bg-neutral-800 border border-neutral-700 text-sm w-full outline-none"
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

        <button
          className="px-2 py-1 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-sm cursor-pointer"
          onClick={(e) => {
            e.stopPropagation();
            onCreateTask({ boardId, colId: column.id });
          }}
        >
          + Task
        </button>
      </div>

      <Droppable droppableId={column.id} type="CARD">
        {(provided, snapshot) => (
          <div
            ref={provided.innerRef}
            {...provided.droppableProps}
            className={`flex-1 p-3 space-y-2 ${
              snapshot.isDraggingOver ? "bg-neutral-800/40" : ""
            }`}
            style={{
              minHeight: 20,
              overflow: snapshot.isDraggingOver ? "visible" : "auto",
            }}
          >
            {column.cards.map((t, i) => (
              <Draggable key={t.id} draggableId={`card-${t.id}`} index={i}>
                {(dragProvided, dragSnapshot) => {
                  // The in-list node keeps layout; we just hide it while dragging
                  const inListNode = (
                    <div
                      ref={dragProvided.innerRef}
                      {...dragProvided.draggableProps}
                      {...dragProvided.dragHandleProps} // whole card is handle
                      className="rounded-lg border border-neutral-800 bg-neutral-900 shadow-sm"
                      style={{
                        ...dragProvided.draggableProps.style,
                        visibility: dragSnapshot.isDragging
                          ? "hidden"
                          : "visible",
                      }}
                    >
                      <TaskCard
                        card={t}
                        colId={column.id}
                        isDragging={false}
                        onOpen={(c) =>
                          onOpenTask(c, { boardId, colId: column.id })
                        }
                        onToggleMinimize={(cardId, columnId) =>
                          onUpdateTask(boardId, columnId, cardId, (task) => ({
                            minimized: !task.minimized,
                          }))
                        }
                        onPrintTask={(c) => onPrintTask(c)}
                        onDelete={(c) => onDeleteTask(boardId, c.id)}
                        onPriority={(cardId, v) =>
                          onUpdateTask(boardId, column.id, cardId, {
                            priority: v,
                          })
                        }
                      />
                    </div>
                  );

                  // Portal clone (visible while dragging), same content and size
                  const portalClone = (
                    <div
                      className="rounded-lg border border-neutral-800 bg-neutral-900 shadow-lg pointer-events-none"
                      style={{
                        ...dragProvided.draggableProps.style,
                        zIndex: 1000,
                        position: "fixed",
                        width: dragProvided?.innerRef?.current
                          ? dragProvided.innerRef.current.offsetWidth
                          : undefined,
                      }}
                    >
                      <TaskCard
                        card={t}
                        colId={column.id}
                        isDragging={true}
                        onOpen={() => {}}
                        onToggleMinimize={() => {}}
                        onPrintTask={() => {}}
                        onDelete={() => {}}
                        onPriority={() => {}}
                      />
                    </div>
                  );

                  return dragSnapshot.isDragging ? (
                    <>
                      {inListNode}
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
    </div>
  );
}
