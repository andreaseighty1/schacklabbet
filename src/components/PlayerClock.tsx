import { useEffect, useState, useSyncExternalStore } from "react";
import type { Color } from "chess.js";
import { Clock3 } from "lucide-react";
import { GameClock, formatClock } from "../chess/clock";

export function PlayerClock({
  timer,
  color,
  label,
}: {
  timer: GameClock;
  color: Color;
  label: string;
}) {
  const state = useSyncExternalStore(timer.subscribe, timer.getSnapshot);
  const [, refresh] = useState(0);
  useEffect(() => {
    if (state?.running !== color) return;
    const interval = setInterval(() => refresh((value) => value + 1), 100);
    return () => clearInterval(interval);
  }, [state, color]);
  const current = timer.read();
  if (!current) return null;
  const ms = color === "w" ? current.whiteMs : current.blackMs;
  const active = current.running === color;
  return (
    <span
      className={`chess-clock ${active ? "running" : ""} ${ms <= 30000 ? "low" : ""}`}
      role="timer"
      aria-live="off"
      aria-label={`${label}: ${formatClock(ms)}${active ? ", klockan går" : ", klockan står still"}`}
      data-color={color}
      data-running={active}
    >
      <Clock3 size={14} aria-hidden="true" />
      <span>{formatClock(ms)}</span>
    </span>
  );
}
