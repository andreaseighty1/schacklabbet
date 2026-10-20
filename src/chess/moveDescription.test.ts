import { describe, expect, it } from "vitest";
import { Chess } from "chess.js";
import { describeMove } from "./moveDescription";

describe("drag beskrivna på svenska", () => {
  it("förklarar elevpartiets drag, schack och matt utan att ändra PGN", () => {
    const game = new Chess();
    game.loadPgn(
      "1. d4 e6 2. a4 Nf6 3. Nh3 c5 4. Nc3 Nc6 5. dxc5 Bxc5 6. b3 Bb4 7. Qd2 Qa5 8. Nf4 Bxc3 9. b4 Qxb4 10. Ra2 Bxd2+ 11. Bxd2 Qb1+ 12. Bc1 Qxc1# 0-1",
    );
    const before = game.pgn();
    const moves = game.history({ verbose: true }).map(describeMove);
    expect(moves[0].action).toBe("Bonden till D4");
    expect(moves[3].action).toBe("Springaren till F6");
    expect(moves[8]).toEqual({
      action: "Bonden tar på C5",
      route: "D4 → C5",
      result: null,
    });
    expect(moves[19].action).toBe("Löparen tar på D2");
    expect(moves[19].result).toBe("Schack");
    expect(moves[23]).toEqual({
      action: "Damen tar på C1",
      route: "B1 → C1",
      result: "Schackmatt",
    });
    expect(game.isCheckmate()).toBe(true);
    expect(game.pgn()).toBe(before);
    expect(before).toContain("Qxc1#");
  });

  it.each([
    ["w", "O-O", "Kort rockad", "Kung E1 → G1, torn H1 → F1"],
    ["w", "O-O-O", "Lång rockad", "Kung E1 → C1, torn A1 → D1"],
    ["b", "O-O", "Kort rockad", "Kung E8 → G8, torn H8 → F8"],
    ["b", "O-O-O", "Lång rockad", "Kung E8 → C8, torn A8 → D8"],
  ])("visar båda pjäsernas flytt vid %s %s", (turn, san, action, route) => {
    const game = new Chess(`r3k2r/8/8/8/8/8/8/R3K2R ${turn} KQkq - 0 1`);
    expect(describeMove(game.move(san))).toEqual({
      action,
      route,
      result: null,
    });
  });

  it("förklarar vilken bonde som tas vid en passant", () => {
    const game = new Chess("4k3/8/8/3pP3/8/8/8/4K3 w - d6 0 1");
    expect(describeMove(game.move("exd6"))).toEqual({
      action: "Bonden tar på D6",
      route: "E5 → D6 · Tar bonden på D5 (en passant)",
      result: null,
    });
  });

  it.each([
    ["q", "dam"],
    ["r", "torn"],
    ["b", "löpare"],
    ["n", "springare"],
  ])("visar bondeförvandling till %s även vid ett slag", (promotion, name) => {
    const game = new Chess("1r6/P6k/8/8/8/8/8/7K w - - 0 1");
    const move = game.move({ from: "a7", to: "b8", promotion });
    expect(describeMove(move).action).toBe(`Bonden tar på B8, blir ${name}`);
  });
});
