import { describe, it, expect } from "vitest";
import { Chess, validateFen } from "chess.js";
import { exercises, schoolSections } from "./content";
import { playUci } from "./chess/model";
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
        expect(
          exercise.id === "checkmate"
            ? initial.isCheckmate()
            : initial.isStalemate(),
        ).toBe(true);
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
