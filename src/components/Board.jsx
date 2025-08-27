import React, { useState } from "react";
import Column from "./Column";
import { DragDropContext, Droppable } from "react-beautiful-dnd";

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
  /* --------- board-level drag to reorder boards (vertical) ---------- */
  const [dragBoard, setDragBoard] = useState(null);
  const onBoardDragStart = (e) => {
    setDragBoard(board.id);
    e.dataTransfer.effectAllowed = "move";
    e.dataTransfer.setData("text/plain", board.id);
  };
  const onBoardDragOver = (e) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
  };
  const onBoardDrop = (e) => {
    e.preventDefault();
    const dragged = dragBoard;
    setDragBoard(null);
    if (!dragged || dragged === board.id) return;
    setBoards((bs) => {
      const list = [...bs];
      const from = list.findIndex((b) => b.id === dragged);
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

  /* -------------------- react-beautiful-dnd handler ------------------ */
  const onDragEnd = (result) => {
    const { source, destination, type } = result;
    if (!destination) return;

    if (type === "COLUMN") {
      // reorder columns inside this board
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
      // move/reorder cards between columns in this board
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
      draggable
      onDragStart={onBoardDragStart}
      onDragOver={onBoardDragOver}
      onDrop={onBoardDrop}
    >
      {/* Minimized board → single title bar */}
      {board.minimized ? (
        <button
          className="w-full text-left px-4 py-3 text-neutral-300 hover:text-white"
          onClick={toggleBoardMin}
          title="Expand board"
        >
          {board.name}
        </button>
      ) : (
        <>
          {/* Board header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-neutral-800">
            <div className="font-semibold">{board.name}</div>
            <button
              className="px-3 py-1.5 rounded-lg bg-neutral-800 hover:bg-neutral-700"
              onClick={toggleBoardMin}
            >
              Minimize Board
            </button>
          </div>

          {/* Columns (now DnD-enabled) */}
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
                      <Column
                        key={col.id}
                        boardId={board.id}
                        column={col}
                        index={index} // ✅ just the prop, no JSX comment
                        onOpenTask={onOpenTask}
                        onCreateTask={onCreateTask}
                        onUpdateTask={onUpdateTask}
                        onDeleteTask={onDeleteTask}
                        onPrintTask={onPrintTask}
                      />
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
