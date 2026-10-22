import { useCallback, useEffect, useState } from "react";
import { Clock3 } from "lucide-react";
import type { Room } from "../multiplayer/client";
import { formatClock } from "../chess/clock";

export type ClockAnchor = { server: number; local: number };
function serverTime(anchor: ClockAnchor) {
  return anchor.server + Math.max(0, performance.now() - anchor.local);
}
function useTick(
  remaining: () => number | null,
  running: boolean,
  refresh: () => Promise<void>,
) {
  const [, tick] = useState(0);
  useEffect(() => {
    if (!running) return;
    let lastCheck = -Infinity;
    const interval = window.setInterval(() => {
      tick((n) => n + 1);
      const left = remaining();
      if (left !== null && left <= 0 && performance.now() - lastCheck > 5000) {
        lastCheck = performance.now();
        void refresh();
      }
    }, 200);
    return () => clearInterval(interval);
  }, [remaining, running, refresh]);
}

export function FriendClock({
  room,
  color,
  label,
  anchor,
  refresh,
}: {
  room: Room;
  color: "w" | "b";
  label: string;
  anchor: ClockAnchor;
  refresh: () => Promise<void>;
}) {
  const active =
    room.status === "playing" &&
    (room.moves.length % 2 === 0 ? "w" : "b") === color;
  const remaining = useCallback(() => {
    const value = color === "w" ? room.white_ms : room.black_ms;
    if (value === null || !room.clock_minutes) return null;
    return Math.max(
      0,
      value -
        (active && room.turn_started_at
          ? Math.max(0, serverTime(anchor) - Date.parse(room.turn_started_at))
          : 0),
    );
  }, [room, color, active, anchor]);
  useTick(remaining, active && room.clock_minutes > 0, refresh);
  const ms = remaining();
  if (ms === null) return null;
  return (
    <span
      className={`chess-clock friend-clock ${active ? "running" : ""} ${ms <= 30000 ? "low" : ""}`}
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

export function MatchLimit({
  room,
  anchor,
  refresh,
}: {
  room: Room;
  anchor: ClockAnchor;
  refresh: () => Promise<void>;
}) {
  const running = room.status === "playing" && room.max_minutes > 0;
  const remaining = useCallback(
    () =>
      room.started_at
        ? Math.max(
            0,
            Date.parse(room.started_at) +
              room.max_minutes * 60000 -
              serverTime(anchor),
          )
        : null,
    [room, anchor],
  );
  useTick(remaining, running, refresh);
  if (!room.max_minutes) return null;
  return (
    <p>
      {running ? (
        <span
          role="timer"
          aria-live="off"
          aria-label="Tid till gemensam maxtid"
        >
          Maxtid om {formatClock(remaining() ?? 0)}
        </span>
      ) : (
        `Gemensam maxtid: ${room.max_minutes} minuter`
      )}
      . Sedan remi.
    </p>
  );
}
