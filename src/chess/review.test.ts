import { describe, it, expect } from "vitest";
import { Chess } from "chess.js";
import { reviewGame } from "./review";
import { type EngineAnalysis, type EnginePosition } from "./engine";

const pgn = "1. e4 e5 2. Qh5 Nc6 3. Qxe5+ Nxe5 0-1";
const answer = (move: string, cp: number, depth = 12): EngineAnalysis => ({
  move,
  score: { kind: "cp", value: cp },
  depth,
  pv: [move],
});
const signal = () => new AbortController().signal;
function analyzer(overrides: Partial<Record<number, EngineAnalysis>> = {}) {
  const seen: EnginePosition[] = [];
  const values = [
    answer("e2e4", 30),
    answer("e7e5", -25),
    answer("g1f3", 30),
    answer("b8c6", 10),
    answer("h5f3", 0),
    answer("c6e5", 900),
  ];
  return {
    seen,
    analyze: async (position: EnginePosition) => {
      seen.push(position);
      return overrides[position.moves.length] ?? values[position.moves.length];
    },
  };
}
describe("kort efteranalys", () => {
  it("bevarar dragupprepning och söker inte efter ett avslutat remisdrag", async () => {
    const game = new Chess();
    ["Nf3", "Nf6", "Ng1", "Ng8", "Nf3", "Nf6", "Ng1", "Ng8"].forEach((move) =>
      game.move(move),
    );
    const seen: number[] = [];
    await reviewGame(
      game.pgn(),
      "b",
      async (position) => {
        seen.push(position.moves.length);
        const copy = new Chess(position.initialFen);
        position.moves.forEach((move) =>
          copy.move({ from: move.slice(0, 2), to: move.slice(2, 4) }),
        );
        const move = copy.moves({ verbose: true })[0];
        return answer(`${move.from}${move.to}`, 0);
      },
      signal(),
    );
    expect(seen).toEqual([1, 2, 3, 4, 5, 6, 7]);
  });
  it("vänder motståndarens bedömning, visar högst ett tips och bevarar PGN/full historik", async () => {
    const fake = analyzer();
    const result = await reviewGame(pgn, "w", fake.analyze, signal());
    expect(result.checked).toBe(3);
    expect(result.good?.played.san).toBe("e4");
    expect(result.improvement?.played.san).toBe("Qxe5+");
    expect(result.improvement?.suggested.to).toBe("f3");
    expect(result.improvement?.reply?.san).toBe("Nxe5");
    expect(fake.seen.at(-1)?.moves).toEqual([
      "e2e4",
      "e7e5",
      "d1h5",
      "b8c6",
      "h5e5",
    ]);
    expect(pgn).toBe("1. e4 e5 2. Qh5 Nc6 3. Qxe5+ Nxe5 0-1");
  });
  it("blandar inte mattpoäng, för grunt djup eller redan avgjorda ställningar med förbättringstips", async () => {
    for (const replacement of [
      answer("c6e5", 900, 3),
      { ...answer("c6e5", 1), score: { kind: "mate" as const, value: 1 } },
    ]) {
      expect(
        (
          await reviewGame(
            pgn,
            "w",
            analyzer({ 5: replacement }).analyze,
            signal(),
          )
        ).improvement,
      ).toBeUndefined();
    }
    expect(
      (
        await reviewGame(
          pgn,
          "w",
          analyzer({ 4: answer("h5f3", -600) }).analyze,
          signal(),
        )
      ).improvement,
    ).toBeUndefined();
    // Opponent advantage must be negated: +900 before vs -880 for the opponent is only 20cp loss.
    expect(
      (
        await reviewGame(
          pgn,
          "w",
          analyzer({ 4: answer("h5f3", 900), 5: answer("c6e5", -880) }).analyze,
          signal(),
        )
      ).improvement,
    ).toBeUndefined();
  });
  it("avbryter innan fler ställningar granskas", async () => {
    const controller = new AbortController();
    let calls = 0;
    await expect(
      reviewGame(
        pgn,
        "w",
        async () => {
          calls++;
          controller.abort();
          return answer("e2e4", 0);
        },
        controller.signal,
      ),
    ).rejects.toMatchObject({ name: "AbortError" });
    expect(calls).toBe(1);
  });
  it("granskar bara senaste åtta egna drag och fungerar från svarts perspektiv", async () => {
    const game = new Chess();
    [
      "e4",
      "e5",
      "Nf3",
      "Nc6",
      "Bb5",
      "a6",
      "Ba4",
      "Nf6",
      "O-O",
      "Be7",
      "Re1",
      "b5",
      "Bb3",
      "d6",
      "c3",
      "O-O",
      "h3",
      "Nb8",
      "d4",
      "Nbd7",
    ].forEach((move) => game.move(move));
    const seen: number[] = [];
    const result = await reviewGame(
      game.pgn(),
      "b",
      async (position) => {
        seen.push(position.moves.length);
        const board = new Chess(position.initialFen);
        position.moves.forEach((move) =>
          board.move({
            from: move.slice(0, 2),
            to: move.slice(2, 4),
            promotion: move[4],
          }),
        );
        const move = board.moves({ verbose: true })[0];
        return answer(`${move.from}${move.to}${move.promotion ?? ""}`, 0);
      },
      signal(),
    );
    expect(result.total).toBe(10);
    expect(result.checked).toBe(8);
    expect(seen[0]).toBe(5);
    expect(seen.at(-1)).toBe(20);
  });
  it("berömmer verklig matt utan att starta motor för slutställningen", async () => {
    const game = new Chess("7k/5K2/8/8/8/8/8/R7 w - - 0 1");
    game.move("Rh1#");
    let calls = 0;
    const result = await reviewGame(
      game.pgn(),
      "w",
      async () => {
        calls++;
        return { ...answer("a1h1", 1), score: { kind: "mate", value: 1 } };
      },
      signal(),
    );
    expect(result.good?.played.san).toBe("Rh1#");
    expect(result.improvement).toBeUndefined();
    expect(calls).toBe(1);
  });
});
