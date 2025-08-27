// src/context/TasksContext.jsx
import {
  createContext,
  useContext,
  useMemo,
  useState,
  useCallback,
} from "react";
import { initialColumns, initialTasks } from "../data/sampleData";
import { uid } from "../utils/id";

const TasksContext = createContext();

export function TasksProvider({ children }) {
  const [columns, setColumns] = useState(initialColumns);
  const [tasks, setTasks] = useState(initialTasks);

  const moveColumn = useCallback((fromIndex, toIndex) => {
    setColumns((cols) => {
      const next = [...cols];
      const [moved] = next.splice(fromIndex, 1);
      next.splice(toIndex, 0, moved);
      return next;
    });
  }, []);

  const addColumn = useCallback((title) => {
    setColumns((cols) => [...cols, { id: uid("col"), title }]);
  }, []);

  const addTask = useCallback((partial) => {
    const task = {
      id: uid("task"),
      priority: 2,
      icon: "📌",
      type: "main",
      notes: "",
      ...partial,
    };
    setTasks((t) => [task, ...t]);
    return task;
  }, []);

  const updateTask = useCallback((id, patch) => {
    setTasks((t) =>
      t.map((task) => (task.id === id ? { ...task, ...patch } : task))
    );
  }, []);

  const value = useMemo(
    () => ({ columns, tasks, moveColumn, addColumn, addTask, updateTask }),
    [columns, tasks, moveColumn, addColumn, addTask, updateTask]
  );

  return (
    <TasksContext.Provider value={value}>{children}</TasksContext.Provider>
  );
}

export function useTasks() {
  const ctx = useContext(TasksContext);
  if (!ctx) throw new Error("useTasks must be used within a TasksProvider");
  return ctx;
}
