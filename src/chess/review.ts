import { Chess, type Color, type Move } from "chess.js";
import {
  enginePosition,
  type EngineAnalysis,
  type EnginePosition,
} from "./engine";
import { playUci } from "./model";

export interface ReviewExample {
  played: Move;
  suggested: Move;
  reply?: Move;
}
export interface GameReview {
  total: number;
  checked: number;
  good?: ReviewExample;
  improvement?: ReviewExample;
}
export type Analyze = (
  position: EnginePosition,
  signal: AbortSignal,
) => Promise<EngineAnalysis>;

/** A short review, not a full-game accuracy rating. Scores use the mover's perspective. */
export async function reviewGame(
  pgn: string,
  color: Color,
  analyze: Analyze,
  signal: AbortSignal,
  onProgress: (done: number, total: number) => void = () => {},
): Promise<GameReview> {
  const game = new Chess();
  game.loadPgn(pgn);
  const history = game.history({ verbose: true });
  const own = history
    .map((move, index) => ({ move, index }))
    .filter(({ move }) => move.color === color);
  const selected = own.slice(-8);
  const result: GameReview = { total: own.length, checked: 0 };
  let biggestLoss = 180;
  onProgress(0, selected.length);
  for (const { move, index } of selected) {
    signal.throwIfAborted();
    // Keep repetition/castling/en-passant history in every engine request.
    const before = new Chess(history[0].before);
    for (const previous of history.slice(0, index))
      playUci(before, uci(previous));
    const best = await analyze(enginePosition(before), signal);
    signal.throwIfAborted();
    const suggested = playUci(new Chess(move.before), best.move);
    let reply: Move | undefined;
    const after = before;
    playUci(after, uci(move));
    let loss: number | undefined;
    if (after.isCheckmate() || after.isDraw()) {
      // Only praise an actual mate here. Draws are not scored as mistakes by this short review.
      if (after.isCheckmate()) result.good = { played: move, suggested: move };
    } else {
      const response = await analyze(enginePosition(after), signal);
      signal.throwIfAborted();
      reply = playUci(after, response.move);
      // Mate distances and bounded scores are not comparable centipawn values.
      if (
        best.depth >= 8 &&
        response.depth >= 8 &&
        best.score.kind === "cp" &&
        response.score.kind === "cp"
      ) {
        loss = best.score.value + response.score.value;
        if (loss <= 40 && !result.good)
          result.good = { played: move, suggested, reply };
        // Avoid coaching an already overwhelmingly decided position.
        if (
          loss >= biggestLoss &&
          best.score.value > -500 &&
          best.score.value < 800 &&
          uci(move) !== best.move
        ) {
          biggestLoss = loss;
          result.improvement = { played: move, suggested, reply };
        }
      }
    }
    result.checked++;
    onProgress(result.checked, selected.length);
  }
  return result;
}

export function uci(move: Move) {
  return `${move.from}${move.to}${move.promotion ?? ""}`;
}
