import { describe, it, expect } from "vitest";
import { Chess, validateFen } from "chess.js";
import { exercises, schoolSections, tacticsLessons } from "./content";
import { captureSquare, playUci } from "./chess/model";
describe("kontrollerat undervisningsinnehåll", () => {
  it("har unika identifierare", () =>
    expect(new Set(exercises.map((e) => e.id)).size).toBe(exercises.length));
  for (const exercise of exercises) {
    it(`${exercise.id}: laglig FEN och fungerande lösning`, () => {
      expect(validateFen(exercise.fen).ok).toBe(true);
      const initial = new Chess(exercise.fen);
      const opposingKing = initial
        .board()
        .flat()
        .find((p) => p?.type === "k" && p.color !== initial.turn())!;
      expect(initial.isAttacked(opposingKing.square, initial.turn())).toBe(
        false,
      );
      if (exercise.question) {
        expect(exercise.solutions).toHaveLength(0);
        expect(exercise.question.choices.filter((c) => c.correct)).toHaveLength(
          1,
        );
        if (exercise.id === "checkmate")
          expect(initial.isCheckmate()).toBe(true);
        else if (exercise.id === "stalemate")
          expect(initial.isStalemate()).toBe(true);
        else {
          expect(exercise.id).toBe("spot-threat");
          expect(initial.isGameOver()).toBe(false);
          expect(initial.attackers("e5", "b")).toEqual(["c6"]);
        }
        return;
      }
      expect(exercise.solutions.length).toBeGreaterThan(0);
      for (const solution of exercise.solutions) {
        const g = new Chess(exercise.fen);
        expect(g.isGameOver()).toBe(false);
        const turn = g.turn();
        playUci(g, solution);
        expect(g.turn()).not.toBe(turn);
        if (exercise.id.startsWith("check-")) {
          expect(initial.isCheck()).toBe(true);
          expect(
            g.isAttacked(
              g
                .board()
                .flat()
                .find((p) => p?.type === "k" && p.color === turn)!.square,
              g.turn(),
            ),
          ).toBe(false);
        }
        if (exercise.id === "check-capture")
          expect(g.history({ verbose: true })[0].captured).toBe("r");
        if (exercise.id === "check-block") expect(g.get("e3")?.type).toBe("b");
        if (exercise.id === "pawn-promotion")
          expect(g.get("a8")?.type).toBe(solution[4]);
        if (exercise.id === "en-passant") {
          expect(g.get("d5")).toBeUndefined();
          expect(g.get("d6")?.type).toBe("p");
          expect(g.history({ verbose: true })[0].isEnPassant()).toBe(true);
        }
        if (exercise.category === "challenge")
          expect(g.isCheckmate()).toBe(true);
      }
    });
  }
  it("placerar varje skollektion exakt en gång i lärvägen", () => {
    const ids = schoolSections.flatMap((s) => s.ids);
    expect(new Set(ids).size).toBe(ids.length);
    expect(new Set(ids)).toEqual(
      new Set(
        exercises.filter((e) => e.category === "school").map((e) => e.id),
      ),
    );
  });
  it("godtar alla och endast säkra flyttar i räddningsuppgifterna, med verkliga hot före draget", () => {
    const starts = {
      "rescue-rook": "a1",
      "rescue-queen": "e5",
      "rescue-knight": "f6",
    } as const;
    for (const [id, from] of Object.entries(starts)) {
      const exercise = tacticsLessons.find((e) => e.id === id)!;
      const board = new Chess(exercise.fen);
      expect(board.isCheck()).toBe(false);
      expect(
        board.attackers(from, board.turn() === "w" ? "b" : "w").length,
      ).toBeGreaterThan(0);
      const safe = board
        .moves({ square: from, verbose: true })
        .filter((move) => {
          const after = new Chess(exercise.fen);
          after.move(move);
          return !after
            .moves({ verbose: true })
            .some(
              (reply) => reply.captured && captureSquare(reply) === move.to,
            );
        })
        .map((move) => `${move.from}${move.to}${move.promotion ?? ""}`);
      expect(new Set(exercise.solutions)).toEqual(new Set(safe));
      expect(safe.length).toBeGreaterThan(1);
    }
  });
  it("skiljer ett säkert slag från ett torn som skyddas av kungen", () => {
    const exercise = tacticsLessons.find((e) => e.id === "safe-capture")!;
    expect(exercise.solutions).toEqual(["d3c4"]);
    const safe = new Chess(exercise.fen);
    playUci(safe, "d3c4");
    expect(
      safe.moves({ verbose: true }).some((m) => m.captured && m.to === "c4"),
    ).toBe(false);
    const trap = new Chess(exercise.fen);
    playUci(trap, "d3h7");
    expect(
      trap
        .moves({ verbose: true })
        .some((m) => m.from === "g8" && m.to === "h7" && m.captured === "b"),
    ).toBe(true);
  });
  it("låter eleven välja alla fyra korrekta förvandlingar", () => {
    expect(exercises.find((e) => e.id === "pawn-promotion")!.solutions).toEqual(
      ["a7a8q", "a7a8r", "a7a8b", "a7a8n"],
    );
  });
  it("visar svart bonde från svarts sida och tar en passant bara direkt", () => {
    const black = exercises.find((e) => e.id === "pawn-black")!;
    expect(black.orientation).toBe("b");
    expect(new Chess(black.fen).turn()).toBe("b");
    const ep = new Chess(exercises.find((e) => e.id === "en-passant")!.fen);
    ep.move("Ka2");
    ep.move("Kh7");
    expect(ep.moves({ square: "e5" })).not.toContain("exd6");
  });
});
