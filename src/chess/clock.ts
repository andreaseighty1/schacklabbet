import type { Color } from "chess.js";

export type TimeControl = 0 | 10 | 15;
export interface ClockSnapshot {
  minutes: 10 | 15;
  whiteMs: number;
  blackMs: number;
  running: Color | null;
  updatedAt: number;
}
export function newClock(
  minutes: TimeControl,
  turn: Color,
  now: number,
): ClockSnapshot | null {
  return minutes
    ? {
        minutes,
        whiteMs: minutes * 60000,
        blackMs: minutes * 60000,
        running: turn,
        updatedAt: now,
      }
    : null;
}
export function settleClock(clock: ClockSnapshot, now: number): ClockSnapshot {
  const at = Math.max(clock.updatedAt, now);
  const elapsed = clock.running ? at - clock.updatedAt : 0;
  return {
    ...clock,
    updatedAt: at,
    whiteMs: Math.max(0, clock.whiteMs - (clock.running === "w" ? elapsed : 0)),
    blackMs: Math.max(0, clock.blackMs - (clock.running === "b" ? elapsed : 0)),
  };
}
export function expiredColor(clock: ClockSnapshot | null): Color | null {
  if (!clock?.running) return null;
  return (clock.running === "w" ? clock.whiteMs : clock.blackMs) <= 0
    ? clock.running
    : null;
}
export function formatClock(ms: number): string {
  const seconds = Math.max(0, Math.ceil(ms / 1000));
  return `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, "0")}`;
}
export function validClock(value: unknown): value is ClockSnapshot {
  if (!value || typeof value !== "object") return false;
  const c = value as ClockSnapshot;
  return (
    [10, 15].includes(c.minutes) &&
    [null, "w", "b"].includes(c.running) &&
    Number.isFinite(c.updatedAt) &&
    c.updatedAt >= 0 &&
    [c.whiteMs, c.blackMs].every(
      (ms) => Number.isFinite(ms) && ms >= 0 && ms <= c.minutes * 60000,
    )
  );
}
function timeSource(minimum: number) {
  const wall = Math.max(Date.now(), minimum),
    monotonic = performance.now();
  let latest = wall;
  return () =>
    (latest = Math.max(
      latest,
      Date.now(),
      wall + performance.now() - monotonic,
    ));
}

/** Timestamps determine elapsed time. Display intervals never subtract time themselves. */
export class GameClock {
  private state: ClockSnapshot | null;
  private listeners = new Set<() => void>();
  readonly now: () => number;
  constructor(initial: ClockSnapshot | null = null, now?: () => number) {
    this.state = initial;
    this.now = now ?? timeSource(initial?.updatedAt ?? 0);
  }
  getSnapshot = () => this.state;
  subscribe = (listener: () => void) => {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  };
  private update(state: ClockSnapshot | null) {
    this.state = state;
    this.listeners.forEach((listener) => listener());
  }
  read(at = this.now()) {
    return this.state ? settleClock(this.state, at) : null;
  }
  expired(at = this.now()) {
    return expiredColor(this.read(at));
  }
  start(minutes: TimeControl, turn: Color) {
    this.update(newClock(minutes, turn, this.now()));
  }
  switchTurn(turn: Color, at = this.now()) {
    const state = this.read(at);
    if (expiredColor(state)) return false;
    if (state) this.update({ ...state, running: turn });
    return true;
  }
  stop(at = this.now()) {
    const state = this.read(at);
    if (state && this.state?.running) this.update({ ...state, running: null });
  }
}
