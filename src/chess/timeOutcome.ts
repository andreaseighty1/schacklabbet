import { type Chess, type Color } from "chess.js";

/** Material-based impossibility, including helpmate pieces and bishop square colours.
 * Not an exhaustive solver for fortresses or forced lines; see docs/CLOCK.md.
 */
export function cannotMate(game: Chess, color: Color): boolean {
  const pieces = game
    .board()
    .flat()
    .filter((piece) => piece !== null);
  const own = pieces.filter(
    (piece) => piece.color === color && piece.type !== "k",
  );
  if (!own.length) return true;
  if (own.some((piece) => ["p", "r", "q"].includes(piece.type))) return false;
  if (own.some((piece) => piece.type === "n")) {
    return (
      own.length === 1 &&
      pieces
        .filter((piece) => piece.color !== color)
        .every((piece) => ["k", "q"].includes(piece.type))
    );
  }
  const bishops = pieces.filter((piece) => piece.type === "b");
  const colours = new Set(
    bishops.map(
      (piece) => (piece.square.charCodeAt(0) + Number(piece.square[1])) % 2,
    ),
  );
  return (
    colours.size === 1 &&
    !pieces.some((piece) => piece.type === "p" || piece.type === "n")
  );
}
export function timeoutOutcome(game: Chess, loser: Color) {
  const winner = loser === "w" ? "b" : "w";
  const draw = cannotMate(game, winner);
  const result = draw ? "1/2-1/2" : winner === "w" ? "1-0" : "0-1";
  const text = draw
    ? "Remi – tiden tog slut och motståndaren kan inte sätta schackmatt"
    : `${winner === "w" ? "Vit" : "Svart"} vinner på tid – ${loser === "w" ? "vits" : "svarts"} tid är slut`;
  game.setHeader("Result", result);
  game.setHeader("Termination", "time forfeit");
  return text;
}
