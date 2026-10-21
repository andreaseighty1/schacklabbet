import { describe, it, expect } from "vitest";
import { Chess } from "chess.js";
import { playUci } from "./model";
import { recommendTraining } from "./recommendation";
import type { GameReview } from "./review";
import { exercises } from "../content";

function example(
  fen: string,
  played: string,
  suggested: string,
  reply?: string,
): GameReview {
  const board = new Chess(fen);
  const move = playUci(board, played);
  return {
    total: 1,
    checked: 1,
    improvement: {
      played: move,
      suggested: playUci(new Chess(fen), suggested),
      reply: reply ? playUci(board, reply) : undefined,
    },
  };
}
describe("träningstips från granskad ställning", () => {
  it("hittar inte på ett behov utan förbättringsexempel", () => {
    expect(recommendTraining({ total: 12, checked: 8 })).toBeNull();
  });
  it("kopplar ett slag med möjlig återslagning till säkra slag", () => {
    const board = new Chess();
    board.loadPgn("1. e4 e5 2. Qh5 Nc6 *");
    const tip = recommendTraining(example(board.fen(), "h5e5", "h5f3", "c6e5"));
    expect(tip?.exerciseId).toBe("safe-capture");
    expect(tip?.reason).toContain("ta din dam på E5");
  });
  it("föreslår räddningsövningar för hotade pjäser och anger svarts perspektiv", () => {
    const queen = recommendTraining(
      example("k7/8/2n5/5Q2/8/8/8/7K w - - 0 1", "f5e5", "f5f3", "c6e5"),
    );
    expect(queen?.exerciseId).toBe("rescue-queen");
    const rook = recommendTraining(
      example("7k/6b1/8/8/8/8/8/1R5K w - - 0 1", "b1a1", "b1c1", "g7a1"),
    );
    expect(rook?.exerciseId).toBe("rescue-rook");
    const knight = recommendTraining(
      example("k7/8/7p/8/8/5N2/8/7K w - - 0 1", "f3g5", "f3d4", "h6g5"),
    );
    expect(knight?.exerciseId).toBe("rescue-knight");
    expect(knight?.reason).toContain("spelar du svart");
  });
  it("skiljer att ta schackaren, blockera och flytta kungen", () => {
    const fen = "k3r3/8/8/1B6/8/8/8/4K3 w - - 0 1";
    expect(recommendTraining(example(fen, "e1d1", "b5e8"))?.exerciseId).toBe(
      "check-capture",
    );
    expect(recommendTraining(example(fen, "e1d1", "b5e2"))?.exerciseId).toBe(
      "check-block",
    );
    expect(recommendTraining(example(fen, "b5e2", "e1d1"))?.exerciseId).toBe(
      "check-escape",
    );
    // A king capturing some other piece escapes check but does not capture the checking rook.
    expect(
      recommendTraining(
        example("r6k/8/8/8/8/8/1n6/K7 w - - 0 1", "a1b1", "a1b2"),
      )?.exerciseId,
    ).toBe("check-escape");
  });
  it("ger relevanta regler för förvandling, rockad och en passant", () => {
    const promotion = recommendTraining(
      example("7k/P7/8/8/8/8/8/7K w - - 0 1", "a7a8r", "a7a8q", "h8h7"),
    );
    expect(promotion?.exerciseId).toBe("pawn-promotion");
    const castle = recommendTraining(
      example("4k3/8/8/8/8/8/8/R3K2R w KQ - 0 1", "a1a2", "e1g1"),
    );
    expect(castle?.exerciseId).toBe("castle");
    const ep = recommendTraining(
      example("7k/8/8/8/3p4/8/4P3/K7 w - - 0 1", "e2e4", "e2e3", "d4e3"),
    );
    expect(ep?.reason).toContain("bonde på E4");
    for (const tip of [promotion, castle, ep])
      expect(
        exercises.some((exercise) => exercise.id === tip?.exerciseId),
      ).toBe(true);
  });
  it("kan föreslå rörelselektionen även utan slag i motståndarens svar", () => {
    const tip = recommendTraining(
      example(new Chess().fen(), "a2a3", "g1f3", "a7a6"),
    );
    expect(tip?.exerciseId).toBe("knight");
    expect(tip?.reason).toContain("springare");
    const rook = recommendTraining(
      example("7k/6b1/8/8/8/8/8/1R5K w - - 0 1", "b1a1", "b1c1", "g7a1"),
    );
    expect(rook?.reason).toContain("ta ditt torn på A1");
  });
});
