import React from "react";

export default function PriorityStars({ value = 0, max = 5, onChange }) {
  const stars = Array.from({ length: max }, (_, i) => i + 1);
  return (
    <div className="flex gap-1">
      {stars.map((n) => (
        <button
          key={n}
          type="button"
          aria-label={`Set priority ${n}`}
          onClick={(e) => {
            e.stopPropagation();
            onChange?.(n);
          }}
          className={`text-xl leading-none ${n <= value ? "" : "opacity-30"}`}
          title={`Priority ${n}`}
        >
          ★
        </button>
      ))}
    </div>
  );
}
