import { useEffect, useState } from "react";
import { dailyKey, stockholmDay } from "./content";
import { emptyDaily, type DailyProgress, type DailyPuzzle } from "./model";
import { emptyDailyStore, loadDaily, pruneDaily, saveDaily } from "./storage";

export function useDaily() {
  const [initial] = useState(() => {
    try {
      return loadDaily(localStorage);
    } catch {
      return {
        store: emptyDailyStore(),
        warning: "Utmaningsframsteg kan inte sparas i den här webbläsaren.",
      };
    }
  });
  const [store, setStore] = useState(initial.store);
  const [warning, setWarning] = useState(initial.warning);
  const [day, setDay] = useState(stockholmDay);
  useEffect(() => {
    const tick = () => setDay(stockholmDay());
    const timer = window.setInterval(tick, 30000);
    window.addEventListener("focus", tick);
    window.addEventListener("pageshow", tick);
    document.addEventListener("visibilitychange", tick);
    return () => {
      clearInterval(timer);
      window.removeEventListener("focus", tick);
      window.removeEventListener("pageshow", tick);
      document.removeEventListener("visibilitychange", tick);
    };
  }, []);
  useEffect(() => {
    try {
      const error = saveDaily(localStorage, store);
      if (error) setWarning(error);
    } catch {
      setWarning("Utmaningsframsteg kan inte sparas i den här webbläsaren.");
    }
  }, [store]);
  return {
    day,
    warning,
    entries: store.entries,
    progress: (date: string, puzzle: DailyPuzzle) =>
      store.entries[dailyKey(date, puzzle)] ?? emptyDaily(),
    update: (
      date: string,
      puzzle: DailyPuzzle,
      change: (previous: DailyProgress) => DailyProgress,
    ) =>
      setStore((previous) => {
        const key = dailyKey(date, puzzle);
        return pruneDaily({
          version: 1,
          entries: {
            ...previous.entries,
            [key]: change(previous.entries[key] ?? emptyDaily()),
          },
        });
      }),
  };
}
