import { describe, expect, it } from "vitest";
import { Chess } from "chess.js";
import { pieceFlights, type MotionPosition } from "./motion";

function position(game: Chess): MotionPosition {
  return { fen: game.fen(), last: game.history({ verbose: true }).at(-1) };
}
describe("piece motion between real chess positions", () => {
  for (const [name, fen, san, expected] of [
    ["ordinary move", undefined, "e4", [{ from: "e2", to: "e4" }]],
    [
      "capture",
      "7k/8/8/3p4/4P3/8/8/K7 w - - 0 1",
      "exd5",
      [{ from: "e4", to: "d5" }],
    ],
    [
      "en passant",
      "7k/8/8/3pP3/8/8/8/K7 w - d6 0 2",
      "exd6",
      [{ from: "e5", to: "d6" }],
    ],
    [
      "promotion",
      "7k/P7/8/8/8/8/8/K7 w - - 0 1",
      "a8=Q+",
      [{ from: "a7", to: "a8" }],
    ],
    [
      "white short castle",
      "r3k2r/8/8/8/8/8/8/R3K2R w KQkq - 0 1",
      "O-O",
      [
        { from: "e1", to: "g1" },
        { from: "h1", to: "f1" },
      ],
    ],
    [
      "black long castle",
      "r3k2r/8/8/8/8/8/8/R3K2R b KQkq - 0 1",
      "O-O-O",
      [
        { from: "e8", to: "c8" },
        { from: "a8", to: "d8" },
      ],
    ],
  ] as const) {
    it(`moves forward and back for ${name}`, () => {
      const game = new Chess(fen);
      const before = position(game);
      game.move(san);
      const after = position(game);
      expect(pieceFlights(before, after)).toEqual(expected);
      expect(pieceFlights(after, before)).toEqual(
        expected.map(({ from, to }) => ({ from: to, to: from })),
      );
    });
  }
  it("snaps on unchanged positions and multi-move jumps", () => {
    const game = new Chess();
    const initial = position(game);
    game.move("e4");
    game.move("e5");
    const after = position(game);
    expect(pieceFlights(initial, after)).toEqual([]);
    expect(pieceFlights(after, initial)).toEqual([]);
    expect(pieceFlights(after, after)).toEqual([]);
  });
});
