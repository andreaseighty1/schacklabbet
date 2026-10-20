import { describe, it, expect } from "vitest";
import { Chess, validateFen } from "chess.js";
import { exercises } from "./content";
import { playUci } from "./chess/model";
describe("kontrollerat undervisningsinnehåll", () => {
  it("har unika identifierare", () =>
    expect(new Set(exercises.map((e) => e.id)).size).toBe(exercises.length));
  for (const exercise of exercises) {
    it(`${exercise.id}: laglig FEN och fungerande lösning`, () => {
      expect(validateFen(exercise.fen).ok).toBe(true);
      for (const solution of exercise.solutions) {
        const g = new Chess(exercise.fen);
        expect(g.isGameOver()).toBe(false);
        const turn = g.turn();
        playUci(g, solution);
        expect(g.turn()).not.toBe(turn);
        if (exercise.category === "challenge")
          expect(g.isCheckmate()).toBe(true);
      }
    });
  }
});
