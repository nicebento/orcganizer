// src/data/sampleData.js
export const initialColumns = [
  { id: "todo", title: "To Do" },
  { id: "doing", title: "Doing" },
  { id: "done", title: "Done" },
];

export const initialTasks = [
  {
    id: "t1",
    title: "Wire up Task Dialog",
    priority: 2,
    icon: "🗒️",
    type: "main",
    columnId: "todo",
    notes: "Connect dialog open state to column New Task button.",
  },
  {
    id: "t2",
    title: "Refactor to multi-file",
    priority: 3,
    icon: "🧩",
    type: "main",
    columnId: "doing",
    notes: "Split app into components + context.",
  },
];
