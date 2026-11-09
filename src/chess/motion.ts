import type { Move, Square } from "chess.js";

export type MotionMove = Pick<
  Move,
  "from" | "to" | "before" | "after" | "flags"
>;
export type MotionPosition = { fen: string; last?: MotionMove };
export type Flight = { from: Square; to: Square };

/** Only adjacent, verified positions move; loading or jumping through history snaps. */
export function pieceFlights(
  previous: MotionPosition,
  next: MotionPosition,
): Flight[] {
  let move: MotionMove;
  let reverse = false;
  if (next.last?.before === previous.fen && next.last.after === next.fen)
    move = next.last;
  else if (
    previous.last?.after === previous.fen &&
    previous.last.before === next.fen
  ) {
    move = previous.last;
    reverse = true;
  } else return [];
  const flights: Flight[] = [{ from: move.from, to: move.to }];
  const rank = move.from[1];
  if (move.flags.includes("k"))
    flights.push({ from: `h${rank}` as Square, to: `f${rank}` as Square });
  if (move.flags.includes("q"))
    flights.push({ from: `a${rank}` as Square, to: `d${rank}` as Square });
  return reverse
    ? flights.map(({ from, to }) => ({ from: to, to: from }))
    : flights;
}
