import React from "react";

export const ICONS = [
  { key: "sword", label: "Sword", glyph: "🗡️" },
  { key: "shield", label: "Shield", glyph: "🛡️" },
  { key: "scroll", label: "Scroll", glyph: "📜" },
  { key: "chest", label: "Chest", glyph: "🧰" },
  { key: "star", label: "Star", glyph: "⭐" },
  { key: "map", label: "Map", glyph: "🗺️" },
];

export function iconGlyph(key) {
  const found = ICONS.find((i) => i.key === key);
  return found ? found.glyph : "🗡️";
}

export default function IconPickerDropdown({ value, onChange }) {
  return (
    <select
      value={value}
      onChange={(e) => onChange?.(e.target.value)}
      className="px-2 py-1 rounded-md bg-neutral-800 border border-neutral-600 text-sm outline-none"
      title="Choose icon"
    >
      {ICONS.map((i) => (
        <option key={i.key} value={i.key}>
          {i.glyph} {i.label}
        </option>
      ))}
    </select>
  );
}
