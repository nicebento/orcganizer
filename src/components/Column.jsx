import React, { useState, useCallback } from "react";
import TaskCard from "./TaskCard";
import DragPortal from "./DragPortal";
import { Droppable, Draggable } from "react-beautiful-dnd";

export default React.memo(function Column({
  boardId,
  column, // { id, title, cards: [] }
  index,
  colDragHandleProps,
  onCreateTask, // (ctx) => void
  onUpdateTask, // (boardId, colId, taskId, patchOrFn)
  onDeleteTask, // (boardId, colId, taskId, index) => void  (for Undo)
  onPrintTask,
  onRenameColumn, // (boardId, colId, newTitle)
}) {
  const [editing, setEditing] = useState(false);
  const [title, setTitle] = useState(column.title);

  const commitTitle = useCallback(() => {
    const t = title.trim() || "Untitled";
    if (t !== column.title) onRenameColumn(boardId, column.id, t);
    setEditing(false);
  }, [title, column.title, onRenameColumn, boardId, column.id]);

  const createTaskHere = useCallback(() => {
    onCreateTask({ boardId, colId: column.id });
  }, [onCreateTask, boardId, column.id]);

  return (
    <div className="rounded-ticket overflow-hidden border border-neutral-800 bg-neutral-900/60 backdrop-blur-sm h-full flex flex-col">
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
            createTaskHere();
          }}
        >
          + Task
        </button>
      </div>

      {/* Use boardId:colId so App's onDragEnd can parse board/column */}
      <Droppable droppableId={`${boardId}:${column.id}`} type="CARD">
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
                  const inListNode = (
                    <div
                      ref={dragProvided.innerRef}
                      {...dragProvided.draggableProps}
                      className="rounded-lg border border-neutral-800 bg-neutral-900 shadow-sm shrink-0"
                      style={{
                        ...dragProvided.draggableProps.style,
                        willChange: "transform",
                        visibility: dragSnapshot.isDragging
                          ? "hidden"
                          : "visible",
                      }}
                    >
                      <TaskCard
                        card={t}
                        colId={column.id}
                        isDragging={false}
                        dragHandleProps={dragProvided.dragHandleProps} // header = handle
                        onToggleMinimize={(cardId, columnId) =>
                          onUpdateTask(boardId, columnId, cardId, (task) => ({
                            minimized: !task.minimized,
                          }))
                        }
                        onPrintTask={(c) => onPrintTask(c)}
                        onDelete={() =>
                          onDeleteTask(boardId, column.id, t.id, i)
                        }
                        onPriority={(cardId, v) =>
                          onUpdateTask(boardId, column.id, cardId, {
                            priority: v,
                          })
                        }
                        onIconChange={(cardId, key) =>
                          onUpdateTask(boardId, column.id, cardId, {
                            icon: key,
                          })
                        }
                        onUpdate={(cardId, patch) =>
                          onUpdateTask(boardId, column.id, cardId, patch)
                        }
                        onRerollPattern={(cardId, opts) =>
                          onUpdateTask(boardId, column.id, cardId, {
                            patternSeed: Math.random().toString(36).slice(2, 8),
                            patternType:
                              opts?.type === "dither" ? "dither" : undefined,
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
                        willChange: "transform",
                        width: dragProvided?.innerRef?.current
                          ? dragProvided.innerRef.current.offsetWidth
                          : undefined,
                      }}
                    >
                      <TaskCard card={t} colId={column.id} isDragging={true} />
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
});
