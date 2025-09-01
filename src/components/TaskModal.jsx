import React, { useEffect, useState } from "react";
import PriorityStars from "./PriorityStars";
import IconPickerDropdown from "./IconPicker";

export default function TaskModal({
  open,
  task,
  mode = "edit",
  onClose,
  onSave,
  onDelete,
  onRerollPattern,
}) {
  const [local, setLocal] = useState(task || {});
  useEffect(() => {
    setLocal(task || {});
  }, [task, open]);
  if (!open || !task) return null;

  const save = () => onSave?.(local);
  const handleKey = (e) => {
    if (e.key === "Escape") onClose?.();
    if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "s") {
      e.preventDefault();
      save();
    }
  };

  return (
    <div className="fixed inset-0 z-50" onKeyDown={handleKey}>
      <div className="absolute inset-0 bg-black/60" onClick={onClose} />
      <div className="relative mx-auto mt-16 max-w-2xl rounded-ticket overflow-hidden border border-neutral-700 shadow-lg">
        {/* header */}
        <div className="bg-brandBlue-700 text-white px-4 py-3 flex items-center justify-between">
          <div className="font-semibold">
            {mode === "create" ? "New Task" : "Edit Task"}
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => onRerollPattern?.(local.id)}
              className="px-2 py-1 rounded bg-white/15 hover:bg-white/25 text-xs"
              title="Generate new pattern"
            >
              Generate pattern
            </button>
            <button
              onClick={onClose}
              className="px-2 py-1 rounded bg-white/15 hover:bg-white/25 text-xs"
            >
              Close
            </button>
          </div>
        </div>

        {/* body */}
        <div className="bg-white text-neutral-900 p-5">
          <div className="grid gap-4">
            {/* Icon + Title */}
            <div className="flex items-center gap-2">
              <IconPickerDropdown
                value={local.icon}
                onChange={(key) => setLocal({ ...local, icon: key })}
              />
              <input
                className="flex-1 px-3 py-2 rounded-lg bg-neutral-100 border border-neutral-300 outline-none focus:ring-2 focus:ring-blue-500"
                value={local.title || ""}
                onChange={(e) => setLocal({ ...local, title: e.target.value })}
                placeholder="Task title"
                autoFocus
              />
            </div>

            {/* Task type */}
            <label className="grid gap-1">
              <span className="text-sm text-neutral-600">Task type</span>
              <select
                className="px-3 py-2 rounded-lg bg-neutral-100 border border-neutral-300 outline-none"
                value={local.taskType || "sub"}
                onChange={(e) =>
                  setLocal({ ...local, taskType: e.target.value })
                }
              >
                <option value="main">Main quest</option>
                <option value="sub">Sub quest</option>
              </select>
            </label>

            {/* Task (notes) — 2× bigger */}
            <label className="grid gap-1">
              <span className="text-sm text-neutral-600">Task</span>
              <textarea
                className="px-3 py-2 rounded-lg bg-neutral-100 border border-neutral-300 outline-none min-h-[140px] text-2xl leading-8"
                value={local.notes || ""}
                onChange={(e) => setLocal({ ...local, notes: e.target.value })}
                placeholder="Describe the task..."
              />
            </label>

            {/* Priority last */}
            <div className="grid gap-1">
              <span className="text-sm text-neutral-600">Priority</span>
              <div className="px-3 py-2 rounded-lg bg-neutral-100 border border-neutral-300">
                <PriorityStars
                  value={local.priority || 0}
                  onChange={(v) => setLocal({ ...local, priority: v })}
                />
              </div>
            </div>
          </div>
        </div>

        {/* footer */}
        <div className="bg-brandBlue-700 text-white px-4 py-3 flex items-center justify-between">
          {mode === "edit" ? (
            <button
              onClick={() => onDelete?.(local)}
              className="px-3 py-2 rounded-lg bg-white/15 hover:bg-white/25"
            >
              Delete
            </button>
          ) : (
            <span />
          )}
          <button
            onClick={save}
            className="px-3 py-2 rounded-lg bg-white text-brandBlue-700 font-semibold"
          >
            Save
          </button>
        </div>
      </div>
    </div>
  );
}
