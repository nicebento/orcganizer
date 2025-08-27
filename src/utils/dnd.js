// src/utils/dnd.js
export const DRAG_MIME = "application/x-orc-task";

export function makeDragPayload({ boardId, colId, taskId, fromIndex }) {
  return JSON.stringify({ boardId, colId, taskId, fromIndex });
}

export function readDragPayload(e) {
  try {
    const txt = e.dataTransfer.getData(DRAG_MIME);
    return JSON.parse(txt || "{}");
  } catch {
    return null;
  }
}
