import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import type { Color } from "chess.js";
import { GameClock, type ClockSnapshot } from "./clock";

export function useClock(
  initial: ClockSnapshot | null,
  onFlag: (color: Color) => void,
) {
  const [timer] = useState(() => new GameClock(initial));
  const state = useSyncExternalStore(timer.subscribe, timer.getSnapshot);
  const callback = useRef(onFlag);
  callback.current = onFlag;
  useEffect(() => {
    if (!state?.running) return;
    const check = () => {
      const color = timer.expired();
      if (color) callback.current(color);
    };
    check();
    const interval = setInterval(check, 100);
    document.addEventListener("visibilitychange", check);
    window.addEventListener("pageshow", check);
    return () => {
      clearInterval(interval);
      document.removeEventListener("visibilitychange", check);
      window.removeEventListener("pageshow", check);
    };
  }, [timer, state]);
  return { timer, state };
}
