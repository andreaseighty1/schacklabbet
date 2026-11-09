import raw from "./catalog.v1.json";
import calendar from "./calendar.v1.json";
import type { DailyPuzzle } from "./model";
// Generated, exhaustively checked data; JSON inference cannot express recursive trees.
export const dailyPuzzles = raw as unknown as DailyPuzzle[];
export const dailyById = new Map(dailyPuzzles.map((p) => [p.id, p]));
export const dailyCalendar: Record<string, string> = calendar;
const formatter = new Intl.DateTimeFormat("sv-SE", {
  timeZone: "Europe/Stockholm",
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
  calendar: "iso8601",
  numberingSystem: "latn",
});
export function stockholmDay(at: Date | number = new Date()) {
  const parts = formatter.formatToParts(at);
  const get = (type: string) => parts.find((p) => p.type === type)!.value;
  return `${get("year")}-${get("month")}-${get("day")}`;
}
export function swedishDate(day: string) {
  return new Intl.DateTimeFormat("sv-SE", {
    timeZone: "Europe/Stockholm",
    day: "numeric",
    month: "long",
  }).format(new Date(`${day}T12:00:00Z`));
}
export function pickDaily(day: string) {
  const scheduled = dailyCalendar[day];
  if (scheduled && dailyById.has(scheduled))
    return { puzzle: dailyById.get(scheduled)!, scheduled: true };
  const ids = Object.values(dailyCalendar);
  const ordinal = Math.floor(Date.parse(`${day}T12:00:00Z`) / 86400000);
  return {
    puzzle: dailyById.get(
      ids[((ordinal % ids.length) + ids.length) % ids.length],
    )!,
    scheduled: false,
  };
}
export type DailyPick = { day: string; puzzleId: string; scheduled: boolean };
export const dailyKey = (day: string, puzzle: DailyPuzzle) =>
  `${day}|${puzzle.id}|${puzzle.revision}`;
