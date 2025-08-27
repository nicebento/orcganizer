import React from "react";

export default function ConfirmDialog({
  open,
  title = "Confirm",
  message,
  onYes,
  onNo,
}) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-[60]">
      <div className="absolute inset-0 bg-black/60" onClick={onNo} />
      <div className="relative mx-auto mt-32 max-w-sm rounded-2xl border border-neutral-700 bg-neutral-900 p-5 shadow-lg">
        <h3 className="text-lg font-semibold mb-2">{title}</h3>
        <p className="text-neutral-300 mb-4">{message}</p>
        <div className="flex justify-end gap-2">
          <button
            onClick={onNo}
            className="px-3 py-2 rounded-lg bg-neutral-800 hover:bg-neutral-700"
          >
            No
          </button>
          <button
            onClick={onYes}
            className="px-3 py-2 rounded-lg bg-red-600 hover:bg-red-500 text-white"
          >
            Yes
          </button>
        </div>
      </div>
    </div>
  );
}
