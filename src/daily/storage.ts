import { dailyById, dailyKey } from "./content";
import { dailyPosition, type DailyProgress } from "./model";

export const DAILY_STORAGE_KEY = "schacklabbet.daily.v1";
export type DailyStore = { version: 1; entries: Record<string, DailyProgress> };
export const emptyDailyStore = (): DailyStore => ({ version: 1, entries: {} });
const object = (x: unknown): x is Record<string, unknown> =>
  !!x && typeof x === "object" && !Array.isArray(x);
function validLine(x: unknown): x is string[] {
  return (
    Array.isArray(x) &&
    x.length <= 12 &&
    x.every(
      (m) => typeof m === "string" && /^[a-h][1-8][a-h][1-8][qrbn]?$/.test(m),
    )
  );
}
export function parseDailyStore(raw: string | null): DailyStore {
  if (raw === null) return emptyDailyStore();
  const data: unknown = JSON.parse(raw);
  if (!object(data) || data.version !== 1 || !object(data.entries))
    throw new Error("Ogiltiga utmaningsframsteg");
  const entries: DailyStore["entries"] = {};
  for (const [key, value] of Object.entries(data.entries)) {
    const [day, id, revision] = key.split("|");
    const puzzle = dailyById.get(id);
    if (
      !puzzle ||
      dailyKey(day, puzzle) !== key ||
      String(puzzle.revision) !== revision ||
      !/^\d{4}-\d{2}-\d{2}$/.test(day) ||
      !Number.isFinite(Date.parse(`${day}T12:00:00Z`)) ||
      new Date(`${day}T12:00:00Z`).toISOString().slice(0, 10) !== day ||
      !object(value)
    )
      continue;
    if (
      !validLine(value.moves) ||
      !Number.isInteger(value.attempts) ||
      Number(value.attempts) < 0 ||
      Number(value.attempts) > 100000 ||
      !Number.isInteger(value.hintLevel) ||
      Number(value.hintLevel) < 0 ||
      Number(value.hintLevel) > 3 ||
      typeof value.helpUsed !== "boolean" ||
      typeof value.solutionShown !== "boolean"
    )
      continue;
    try {
      dailyPosition(puzzle, value.moves);
      if (
        value.solvedLine !== undefined &&
        (!validLine(value.solvedLine) ||
          !dailyPosition(puzzle, value.solvedLine).done)
      )
        continue;
    } catch {
      continue;
    }
    entries[key] = {
      moves: value.moves,
      attempts: Number(value.attempts),
      hintLevel: Number(value.hintLevel),
      helpUsed:
        value.helpUsed || Number(value.hintLevel) > 0 || value.solutionShown,
      solutionShown: value.solutionShown,
      ...(value.solvedLine ? { solvedLine: value.solvedLine as string[] } : {}),
    };
  }
  return pruneDaily({ version: 1, entries });
}
export function pruneDaily(store: DailyStore): DailyStore {
  return {
    version: 1,
    entries: Object.fromEntries(
      Object.entries(store.entries)
        .sort(([a], [b]) => b.localeCompare(a))
        .slice(0, 120),
    ),
  };
}
export function loadDaily(storage: Pick<Storage, "getItem">) {
  try {
    return {
      store: parseDailyStore(storage.getItem(DAILY_STORAGE_KEY)),
      warning: "",
    };
  } catch {
    return {
      store: emptyDailyStore(),
      warning:
        "Tidigare utmaningsframsteg kunde inte läsas. Du kan fortfarande träna.",
    };
  }
}
export function saveDaily(
  storage: Pick<Storage, "setItem">,
  store: DailyStore,
) {
  try {
    storage.setItem(DAILY_STORAGE_KEY, JSON.stringify(pruneDaily(store)));
    return "";
  } catch {
    return "Utmaningsframstegen kan inte sparas i den här webbläsaren just nu. Du kan fortsätta träna.";
  }
}
