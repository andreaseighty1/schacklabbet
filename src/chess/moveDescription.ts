import type { Move, PieceSymbol } from "chess.js";
import { captureSquare, pieceNames } from "./model";

const subjects: Record<PieceSymbol, string> = {
  p: "Bonden",
  n: "Springaren",
  b: "Löparen",
  r: "Tornet",
  q: "Damen",
  k: "Kungen",
};

/** Describe a verified move for the learner; SAN/PGN stays unchanged. */
export function describeMove(move: Move) {
  const target = move.to.toUpperCase();
  let action = `${subjects[move.piece]} ${move.captured ? "tar på" : "till"} ${target}`;
  let route = `${move.from.toUpperCase()} → ${target}`;
  if (move.isKingsideCastle() || move.isQueensideCastle()) {
    action = move.isKingsideCastle() ? "Kort rockad" : "Lång rockad";
    const rank = move.color === "w" ? "1" : "8";
    route = `Kung ${route}, torn ${move.isKingsideCastle() ? `H${rank} → F${rank}` : `A${rank} → D${rank}`}`;
  }
  if (move.isEnPassant())
    route += ` · Tar bonden på ${captureSquare(move).toUpperCase()} (en passant)`;
  if (move.promotion) action += `, blir ${pieceNames[move.promotion]}`;
  const result = move.san.endsWith("#")
    ? "Schackmatt"
    : move.san.endsWith("+")
      ? "Schack"
      : null;
  return { action, route, result };
}
