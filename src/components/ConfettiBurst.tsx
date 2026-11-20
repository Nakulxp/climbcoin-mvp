"use client";

import type { CSSProperties } from "react";

const COLORS = ["#00E39D", "#8B6FFF", "#F2A93B", "#E9EFEC", "#38BDF8"];

const PIECES = Array.from({ length: 30 }, (_, i) => ({
  id: i,
  left: `${(i * 3.3 + ((i * 17) % 11)) % 96 + 2}%`,
  color: COLORS[i % COLORS.length],
  width: i % 3 === 0 ? 8 : 6,
  height: i % 2 === 0 ? 14 : 9,
  delay: `${((i % 7) * 0.06).toFixed(2)}s`,
  dur: `${(1.25 + (i % 5) * 0.16).toFixed(2)}s`,
  drift: `${(i % 2 === 0 ? 1 : -1) * (12 + (i % 4) * 14)}px`,
}));

export function ConfettiBurst() {
  return (
    <div
      aria-hidden="true"
      className="pointer-events-none fixed inset-0 z-40 overflow-hidden"
    >
      {PIECES.map((p) => (
        <span
          key={p.id}
          className="animate-confetti-fall absolute top-0 rounded-[2px]"
          style={
            {
              left: p.left,
              width: `${p.width}px`,
              height: `${p.height}px`,
              backgroundColor: p.color,
              "--delay": p.delay,
              "--dur": p.dur,
              "--drift": p.drift,
            } as CSSProperties
          }
        />
      ))}
    </div>
  );
}
