import React, { useEffect, useState } from "react";
import Column from "./Column";
import ConfirmDialog from "./ConfirmDialog";
import DragPortal from "./DragPortal";
import { Droppable, Draggable } from "react-beautiful-dnd";
import { generateQuestBoardName } from "../utils/names";

export default React.memo(function Board({
  board,
  index,
  boards,
  setBoards,
  onCreateTask,
  onUpdateTask,
  onDeleteTask,
  onPrintTask,
}) {
  /* Reorder boards via simple HTML5 drag on header */
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

  // Inline board name edit + generator
  const [editingName, setEditingName] = useState(false);
  const [nameDraft, setNameDraft] = useState(board.name);
  const commitName = () => {
    const n = (nameDraft || "").trim() || "Untitled board";
    if (n !== board.name) {
      setBoards((bs) =>
        bs.map((b) => (b.id === board.id ? { ...b, name: n } : b))
      );
    }
    setEditingName(false);
  };

  // Delete board 2-step with 5s timer
  const [showDel1, setShowDel1] = useState(false);
  const [showDel2, setShowDel2] = useState(false);
  const [timer, setTimer] = useState(5);
  useEffect(() => {
    if (!showDel2) return;
    setTimer(5);
    const i = setInterval(() => setTimer((t) => (t <= 1 ? 0 : t - 1)), 1000);
    return () => clearInterval(i);
  }, [showDel2]);
  const deleteBoardNow = () => {
    setBoards((bs) => bs.filter((b) => b.id !== board.id));
    setShowDel2(false);
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

  return (
    <div
      className="rounded-ticket overflow-hidden border border-neutral-800 bg-neutral-900/80 shadow"
      onDragOver={onBoardDragOver}
      onDrop={onBoardDrop}
    >
      {board.minimized ? (
        <div
          className="sticky top-0 z-40 w-full text-left px-4 py-3 text-neutral-300 hover:text-white cursor-grab active:cursor-grabbing bg-neutral-900/80 backdrop-blur border-b border-neutral-800 flex items-center justify-between"
          draggable
          onDragStart={onBoardDragStart}
          title="Drag to reorder boards • Click to expand"
          onClick={toggleBoardMin}
        >
          <span className="truncate">{board.name}</span>
          <button
            className="px-2 py-1 rounded-lg bg-red-600 hover:bg-red-500 text-white text-sm"
            onClick={(e) => {
              e.stopPropagation();
              setShowDel1(true);
            }}
            title="Delete board"
          >
            Delete Board
          </button>
        </div>
      ) : (
        <>
          {/* Sticky board header (also board drag handle) */}
          <div
            className="sticky top-0 z-40 flex items-center justify-between px-4 py-3 border-b border-neutral-800 bg-neutral-900/80 backdrop-blur cursor-grab active:cursor-grabbing"
            draggable
            onDragStart={onBoardDragStart}
            title="Drag to reorder boards"
          >
            <div
              className="min-w-0 cursor-default"
              onClick={(e) => e.stopPropagation()}
            >
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
                  />
                  <button
                    className="px-2 py-1 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-xs border border-neutral-700"
                    onMouseDown={(e) => e.preventDefault()}
                    onClick={() =>
                      setNameDraft(generateQuestBoardName(nameDraft))
                    }
                    title="Generate Quest board name"
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

            <div className="flex gap-2">
              <button
                className="px-3 py-1.5 rounded-lg bg-neutral-800 hover:bg-neutral-700 cursor-pointer"
                onClick={(e) => {
                  e.stopPropagation();
                  toggleBoardMin();
                }}
              >
                Minimize Board
              </button>
              <button
                className="px-3 py-1.5 rounded-lg bg-red-600 hover:bg-red-500 text-white cursor-pointer"
                onClick={(e) => {
                  e.stopPropagation();
                  setShowDel1(true);
                }}
                title="Delete board"
              >
                Delete Board
              </button>
            </div>
          </div>

          {/* Columns row — with portal clone while dragging (fixes cursor offset) */}
          <div className="p-4 overflow-x-auto pb-2">
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
                  {board.columns.map((col, index) => (
                    <Draggable
                      key={col.id}
                      draggableId={`column-${col.id}`}
                      index={index}
                    >
                      {(dragProvided, dragSnapshot) => {
                        const node = (
                          <div
                            ref={dragProvided.innerRef}
                            {...dragProvided.draggableProps}
                            style={{
                              ...dragProvided.draggableProps.style,
                              willChange: "transform", // smooth live node
                              visibility: dragSnapshot.isDragging
                                ? "hidden"
                                : "visible",
                            }}
                            className="min-w-[320px]"
                          >
                            <Column
                              boardId={board.id}
                              column={col}
                              index={index}
                              colDragHandleProps={dragProvided.dragHandleProps}
                              onCreateTask={onCreateTask}
                              onUpdateTask={onUpdateTask}
                              onDeleteTask={onDeleteTask}
                              onPrintTask={onPrintTask}
                              onRenameColumn={onRenameColumn}
                            />
                          </div>
                        );

                        const portalClone = (
                          <div
                            className="min-w-[320px] rounded-ticket overflow-hidden border border-neutral-800 bg-neutral-900 shadow-lg pointer-events-none"
                            style={{
                              ...dragProvided.draggableProps.style,
                              zIndex: 1000,
                              position: "fixed",
                              willChange: "transform", // smooth ghost
                              width: dragProvided?.innerRef?.current
                                ? dragProvided.innerRef.current.offsetWidth
                                : undefined,
                            }}
                          >
                            <Column
                              boardId={board.id}
                              column={col}
                              index={index}
                              // no handlers needed in clone
                              colDragHandleProps={{}}
                              onCreateTask={() => {}}
                              onUpdateTask={() => {}}
                              onDeleteTask={() => {}}
                              onPrintTask={() => {}}
                              onRenameColumn={() => {}}
                            />
                          </div>
                        );

                        return dragSnapshot.isDragging ? (
                          <>
                            {node}
                            <DragPortal>{portalClone}</DragPortal>
                          </>
                        ) : (
                          node
                        );
                      }}
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
          </div>
        </>
      )}

      {/* Delete board — step 1 */}
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

      {/* Delete board — step 2 with 5s timer */}
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
                onClick={() => setShowDel2(false)}
                className="px-3 py-2 rounded-lg bg-neutral-800 hover:bg-neutral-700"
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
