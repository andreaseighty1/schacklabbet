import {
  Chess,
  type Color,
  type Square,
  type PieceSymbol,
  type Move,
} from "chess.js";
export type Profile = "beginner" | "training" | "competition";
export type Promotion = "q" | "r" | "b" | "n";
export const pieceNames: Record<PieceSymbol, string> = {
  p: "bonde",
  n: "springare",
  b: "löpare",
  r: "torn",
  q: "dam",
  k: "kung",
};
export const other = (color: Color): Color => (color === "w" ? "b" : "w");
export function positionFor(game: Chess, color: Color): Chess {
  const fields = game.fen().split(" ");
  if (fields[1] !== color) {
    fields[1] = color;
    fields[3] = "-";
  }
  return new Chess(fields.join(" "));
}
/** Legal captures, including pinned-piece restrictions; not an evaluation of material loss. */
export function capturesAgainst(game: Chess, color: Color): Move[] {
  return positionFor(game, other(color))
    .moves({ verbose: true })
    .filter((m) => Boolean(m.captured));
}
export function captureSquare(move: Move): Square {
  return (
    move.isEnPassant() ? `${move.to[0]}${move.from[1]}` : move.to
  ) as Square;
}
export function threats(game: Chess, color: Color) {
  return capturesAgainst(game, color).map((m) => ({
    square: captureSquare(m),
    from: m.from,
    attacker: m.piece,
    defended: game.isAttacked(captureSquare(m), color),
  }));
}
export function previewRisk(
  game: Chess,
  from: Square,
  to: Square,
  promotion: Promotion = "q",
) {
  const copy = new Chess(game.fen());
  const move = copy.move({ from, to, promotion });
  return {
    move,
    attackers: copy
      .moves({ verbose: true })
      .filter((m) => m.captured && captureSquare(m) === to),
  };
}
export function resultText(game: Chess): string | null {
  if (game.isCheckmate())
    return `${game.turn() === "w" ? "Svart" : "Vit"} vinner med schackmatt`;
  if (game.isStalemate()) return "Remi – patt";
  if (game.isThreefoldRepetition()) return "Remi – samma ställning tre gånger";
  if (game.isInsufficientMaterial()) return "Remi – otillräckligt material";
  if (game.isDrawByFiftyMoves()) return "Remi – femtiodragsregeln";
  if (game.isDraw()) return "Remi";
  return null;
}
export function capturedPieces(game: Chess, by: Color): PieceSymbol[] {
  return game
    .history({ verbose: true })
    .filter((m) => m.color === by && m.captured)
    .map((m) => m.captured!);
}
export function kingSquare(game: Chess, color: Color): Square | undefined {
  return game
    .board()
    .flat()
    .find((p) => p?.type === "k" && p.color === color)?.square;
}
export function playUci(game: Chess, uci: string): Move {
  if (!/^[a-h][1-8][a-h][1-8][qrbn]?$/.test(uci))
    throw new Error("Motorn gav ett ogiltigt drag.");
  return game.move({
    from: uci.slice(0, 2),
    to: uci.slice(2, 4),
    promotion: uci[4],
  });
}
export function updateResultHeader(game: Chess, resigned?: Color): void {
  if (resigned) game.setHeader("Result", resigned === "w" ? "0-1" : "1-0");
  else if (game.isCheckmate())
    game.setHeader("Result", game.turn() === "w" ? "0-1" : "1-0");
  else if (game.isDraw()) game.setHeader("Result", "1/2-1/2");
}
export function concreteClue(game: Chess, color: Color): string {
  const threat = threats(game, color)[0];
  if (threat) {
    const piece = game.get(threat.square);
    return `Din ${piece ? pieceNames[piece.type] : "pjäs"} på ${threat.square} kan slås av en ${pieceNames[threat.attacker]} på ${threat.from}. Kan du flytta, försvara eller skapa ett eget hot?`;
  }
  const move = game
    .moves({ verbose: true })
    .find((m) => m.piece === "n" || m.piece === "b");
  return move
    ? `Titta på din ${pieceNames[move.piece]} på ${move.from}. Vilka lagliga rutor ger den fler möjligheter att samarbeta med dina andra pjäser?`
    : "Undersök rutorna kring motståndarens kung. Vilka flyktvägar finns, och vilka av dina pjäser kan påverka dem?";
}
