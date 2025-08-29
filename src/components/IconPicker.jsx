import React, { useEffect, useRef, useState } from "react";

const ICONS = [
  { key: "sword", label: "Sword", glyph: "🗡️" },
  { key: "shield", label: "Shield", glyph: "🛡️" },
  { key: "scroll", label: "Scroll", glyph: "📜" },
  { key: "potion", label: "Potion", glyph: "🧪" },
  { key: "star", label: "Star", glyph: "⭐" },
];

export default function IconPickerDropdown({
  value,
  onChange,
  showLabel = true,
  size = "md",
  variant = "default", // "default" | "header"
  disabled = false,
}) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef(null);

  useEffect(() => {
    const onDoc = (e) => {
      if (!rootRef.current) return;
      if (!rootRef.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, []);

  useEffect(() => {
    if (disabled) setOpen(false);
  }, [disabled]);

  const current = ICONS.find((i) => i.key === value) || ICONS[0];
  const pad = size === "sm" ? "px-2 py-1" : "px-3 py-1.5";
  const text = size === "sm" ? "text-base" : "text-lg";

  const headerBtn =
    "text-white border border-white/20 bg-transparent hover:bg-white/10";
  const defaultBtn = "bg-neutral-900 text-white border border-neutral-700";

  const menuClass =
    variant === "header"
      ? "border border-white/20 bg-brandBlue-700"
      : "border border-neutral-700 bg-neutral-900";

  return (
    <div className="relative inline-block" ref={rootRef}>
      <button
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          if (!disabled) setOpen((o) => !o);
        }}
        disabled={disabled}
        className={`${pad} rounded ${
          variant === "header" ? headerBtn : defaultBtn
        } flex items-center gap-1 ${
          disabled ? "opacity-60 cursor-default" : ""
        }`}
        title={current.label}
        aria-disabled={disabled}
      >
        <span className={text} aria-hidden>
          {current.glyph}
        </span>
        {showLabel && <span className="text-sm">{current.label}</span>}
        <svg
          width="10"
          height="10"
          viewBox="0 0 20 20"
          aria-hidden
          className="opacity-80"
        >
          <path d="M5 7l5 6 5-6H5z" fill="currentColor" />
        </svg>
      </button>

      {open && (
        <div
          className={`absolute z-[200] mt-1 rounded-lg shadow-lg p-1 grid grid-cols-5 gap-1 ${menuClass}`}
        >
          {ICONS.map((icon) => (
            <button
              key={icon.key}
              className="w-8 h-8 rounded hover:bg-white/10 text-xl grid place-items-center text-white"
              title={icon.label}
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                onChange?.(icon.key);
                setOpen(false);
              }}
            >
              <span aria-hidden>{icon.glyph}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
