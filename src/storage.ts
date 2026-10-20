import { Chess, type Color } from "chess.js";
import type { Profile } from "./chess/model";
export interface SavedGame {
  version: 1;
  pgn: string;
  color: Color;
  level: number;
  profile: Profile;
  ended: string | null;
  id: string;
}
export interface Progress {
  version: 1;
  completed: string[];
  games: number;
  wins: number;
  finishedIds: string[];
}
export interface StoragePort {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
  removeItem(key: string): void;
}
export const emptyProgress = (): Progress => ({
  version: 1,
  completed: [],
  games: 0,
  wins: 0,
  finishedIds: [],
});
export function readGame(storage: StoragePort): SavedGame | null {
  const raw = storage.getItem("schacklabbet.game.v1");
  if (!raw) return null;
  const value = JSON.parse(raw) as SavedGame;
  if (
    value.version !== 1 ||
    typeof value.pgn !== "string" ||
    !["w", "b"].includes(value.color) ||
    !Number.isInteger(value.level) ||
    value.level < 0 ||
    value.level > 4 ||
    !["beginner", "training", "competition"].includes(value.profile) ||
    typeof value.id !== "string" ||
    !(value.ended === null || typeof value.ended === "string")
  )
    throw new Error("Den sparade matchen kunde inte läsas.");
  new Chess().loadPgn(value.pgn);
  return value;
}
export function readProgress(storage: StoragePort): Progress {
  const raw = storage.getItem("schacklabbet.progress.v1");
  if (!raw) return emptyProgress();
  const p = JSON.parse(raw) as Progress;
  if (
    p.version !== 1 ||
    !Array.isArray(p.completed) ||
    !p.completed.every((x) => typeof x === "string") ||
    !Array.isArray(p.finishedIds) ||
    !p.finishedIds.every((x) => typeof x === "string") ||
    !Number.isInteger(p.games) ||
    p.games < 0 ||
    !Number.isInteger(p.wins) ||
    p.wins < 0
  )
    throw new Error("Dina sparade framsteg kunde inte läsas.");
  return p;
}
export function recordGame(
  progress: Progress,
  id: string,
  win: boolean,
): Progress {
  if (progress.finishedIds.includes(id)) return progress;
  return {
    ...progress,
    games: progress.games + 1,
    wins: progress.wins + (win ? 1 : 0),
    finishedIds: [...progress.finishedIds, id],
  };
}
