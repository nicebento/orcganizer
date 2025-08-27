import React from "react";
import Column from "./Column";
import { DragDropContext, Droppable, Draggable } from "react-beautiful-dnd"; // or "@hello-pangea/dnd"

export default function Board({
  board,
  index,
  boards,
  setBoards,
  onOpenTask,
  onCreateTask,
  onUpdateTask,
  onDeleteTask,
  onPrintTask,
}) {
  /* HTML5 board drag: header is the handle; whole shell accepts drop */
  const onBoardDragStart = (e) => {
    e.dataTransfer.effectAllowed = "move";
    e.dataTransfer.setData("text/plain", board.id);
  };
  const onBoardDragOver = (e) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
  };
  const onBoardDrop = (e) => {
    e.preventDefault();
    const draggedId = e.dataTransfer.getData("text/plain");
    if (!draggedId || draggedId === board.id) return;
    setBoards((bs) => {
      const list = [...bs];
      const from = list.findIndex((b) => b.id === draggedId);
      const to = list.findIndex((b) => b.id === board.id);
      if (from === -1 || to === -1) return bs;
      const [moving] = list.splice(from, 1);
      list.splice(to, 0, moving);
      return list;
    });
  };

  const toggleBoardMin = () => {
    setBoards((bs) =>
      bs.map((b) => (b.id === board.id ? { ...b, minimized: !b.minimized } : b))
    );
  };

  const onRenameColumn = (boardId, colId, newTitle) => {
    setBoards((bs) =>
      bs.map((b) =>
        b.id === boardId
          ? {
              ...b,
              columns: b.columns.map((c) =>
                c.id === colId ? { ...c, title: newTitle } : c
              ),
            }
          : b
      )
    );
  };

  const onDragEnd = (result) => {
    const { source, destination, type } = result;
    if (!destination) return;

    if (type === "COLUMN") {
      setBoards((bs) =>
        bs.map((b) => {
          if (b.id !== board.id) return b;
          const cols = Array.from(b.columns);
          const [moved] = cols.splice(source.index, 1);
          cols.splice(destination.index, 0, moved);
          return { ...b, columns: cols };
        })
      );
      return;
    }

    if (type === "CARD") {
      setBoards((bs) =>
        bs.map((b) => {
          if (b.id !== board.id) return b;
          const cols = b.columns.map((c) => ({ ...c, cards: [...c.cards] }));
          const fromColIdx = cols.findIndex((c) => c.id === source.droppableId);
          const toColIdx = cols.findIndex(
            (c) => c.id === destination.droppableId
          );
          if (fromColIdx === -1 || toColIdx === -1) return b;

          const fromCards = cols[fromColIdx].cards;
          const toCards = cols[toColIdx].cards;
          const [movedCard] = fromCards.splice(source.index, 1);
          toCards.splice(destination.index, 0, movedCard);

          cols[fromColIdx] = { ...cols[fromColIdx], cards: fromCards };
          cols[toColIdx] = { ...cols[toColIdx], cards: toCards };

          return { ...b, columns: cols };
        })
      );
    }
  };

  return (
    <div
      className="rounded-2xl border border-neutral-800 bg-neutral-900/80 shadow"
      onDragOver={onBoardDragOver}
      onDrop={onBoardDrop}
    >
      {board.minimized ? (
        <div
          className="sticky top-0 z-40 w-full text-left px-4 py-3 text-neutral-300 hover:text-white cursor-grab active:cursor-grabbing bg-neutral-900/80 backdrop-blur border-b border-neutral-800"
          draggable
          onDragStart={onBoardDragStart}
          title="Drag to reorder boards • Click to expand"
          onClick={toggleBoardMin}
        >
          {board.name}
        </div>
      ) : (
        <>
          {/* Sticky board header (also the board drag handle) */}
          <div
            className="sticky top-0 z-40 flex items-center justify-between px-4 py-3 border-b border-neutral-800 bg-neutral-900/80 backdrop-blur cursor-grab active:cursor-grabbing"
            draggable
            onDragStart={onBoardDragStart}
            title="Drag to reorder boards"
          >
            <div className="font-semibold cursor-default">{board.name}</div>
            <button
              className="px-3 py-1.5 rounded-lg bg-neutral-800 hover:bg-neutral-700 cursor-pointer"
              onClick={(e) => {
                e.stopPropagation();
                toggleBoardMin();
              }}
            >
              Minimize Board
            </button>
          </div>

          <div className="p-4 overflow-x-auto pb-2">
            <DragDropContext onDragEnd={onDragEnd}>
              <Droppable
                droppableId="all-columns"
                direction="horizontal"
                type="COLUMN"
              >
                {(provided) => (
                  <div
                    className="flex gap-4"
                    ref={provided.innerRef}
                    {...provided.droppableProps}
                  >
                    {board.columns.map((col, index) => (
                      <Draggable
                        key={col.id}
                        draggableId={`column-${col.id}`}
                        index={index}
                      >
                        {(dragProvided, dragSnapshot) => (
                          <div
                            ref={dragProvided.innerRef}
                            {...dragProvided.draggableProps}
                            style={{
                              ...dragProvided.draggableProps.style,
                              zIndex: dragSnapshot.isDragging ? 1000 : "auto",
                              position: dragSnapshot.isDragging
                                ? "relative"
                                : undefined,
                            }}
                            className="min-w-[320px]"
                          >
                            <Column
                              boardId={board.id}
                              column={col}
                              index={index}
                              colDragHandleProps={dragProvided.dragHandleProps}
                              onOpenTask={onOpenTask}
                              onCreateTask={onCreateTask}
                              onUpdateTask={onUpdateTask}
                              onDeleteTask={onDeleteTask}
                              onPrintTask={onPrintTask}
                              onRenameColumn={onRenameColumn}
                            />
                          </div>
                        )}
                      </Draggable>
                    ))}

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
                                    },
                                  ],
                                }
                              : b
                          )
                        );
                      }}
                      className="min-w-[320px] aspect-[3/4] rounded-ticket border-2 border-dashed border-neutral-700 text-neutral-400 hover:text-white hover:border-neutral-500 grid place-items-center"
                      title="Add new column"
                    >
                      <span className="text-6xl leading-none">+</span>
                    </button>
                  </div>
                )}
              </Droppable>
            </DragDropContext>
          </div>
        </>
      )}
    </div>
  );
}
