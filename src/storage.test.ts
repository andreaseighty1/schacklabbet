import { describe, it, expect } from "vitest";
import { Chess } from "chess.js";
import { newClock } from "./chess/clock";
import {
  readGame,
  readProgress,
  recordGame,
  emptyProgress,
  type SavedGame,
  type StoragePort,
} from "./storage";
function memory(): StoragePort {
  const data = new Map<string, string>();
  return {
    getItem: (k) => data.get(k) ?? null,
    setItem: (k, v) => {
      data.set(k, v);
    },
    removeItem: (k) => {
      data.delete(k);
    },
  };
}
describe("lokal sparning", () => {
  it("debiterar tiden mellan sparning och omladdning", () => {
    const s = memory(),
      now = Date.now();
    s.setItem(
      "schacklabbet.game.v1",
      JSON.stringify({
        version: 1,
        pgn: new Chess().pgn(),
        color: "w",
        level: 0,
        profile: "training",
        ended: null,
        id: "clock",
        clock: newClock(10, "w", now - 5000),
      }),
    );
    const saved = readGame(s)!;
    expect(saved.clock!.whiteMs).toBeLessThanOrEqual(595000);
    expect(saved.clock!.blackMs).toBe(600000);
  });
  it("avgör ett parti vars tid tog slut medan sidan var stängd", () => {
    const s = memory();
    s.setItem(
      "schacklabbet.game.v1",
      JSON.stringify({
        version: 1,
        pgn: new Chess().pgn(),
        color: "w",
        level: 0,
        profile: "training",
        ended: null,
        id: "flag",
        clock: newClock(10, "w", Date.now() - 610000),
      }),
    );
    const saved = readGame(s)!;
    expect(saved.ended).toContain("Svart vinner på tid");
    expect(saved.pgn).toContain('[Result "0-1"]');
    expect(saved.clock).toMatchObject({
      whiteMs: 0,
      blackMs: 600000,
      running: null,
    });
  });
  it("en redan registrerad matt ersätts inte av tid vid omladdning", () => {
    const s = memory(),
      game = new Chess();
    game.loadPgn("1. f3 e5 2. g4 Qh4# 0-1");
    s.setItem(
      "schacklabbet.game.v1",
      JSON.stringify({
        version: 1,
        pgn: game.pgn(),
        color: "w",
        level: 0,
        profile: "training",
        ended: null,
        id: "mate",
        clock: newClock(10, "w", 1),
      }),
    );
    const saved = readGame(s)!;
    expect(saved.ended).toBeNull();
    expect(saved.pgn).toContain("Qh4#");
    expect(saved.clock!.running).toBeNull();
  });
  it("återställer hela draghistoriken, inte bara FEN", () => {
    const s = memory(),
      g = new Chess();
    ["e4", "e5", "Nf3", "Nc6"].forEach((m) => g.move(m));
    const saved: SavedGame = {
      version: 1,
      pgn: g.pgn(),
      color: "b",
      profile: "training",
      level: 2,
      ended: null,
      id: "test",
    };
    s.setItem("schacklabbet.game.v1", JSON.stringify(saved));
    const restored = readGame(s)!;
    const copy = new Chess();
    copy.loadPgn(restored.pgn);
    expect(copy.history()).toEqual(g.history());
    expect(copy.fen()).toBe(g.fen());
    expect(restored.color).toBe("b");
  });
  it("tillåter en tom första match", () => {
    const s = memory();
    const g = new Chess();
    s.setItem(
      "schacklabbet.game.v1",
      JSON.stringify({
        version: 1,
        pgn: g.pgn(),
        color: "w",
        profile: "beginner",
        level: 0,
        ended: null,
        id: "test",
      }),
    );
    expect(readGame(s)?.pgn).toBe(g.pgn());
  });
  it("visar fel för skadad eller okänd version", () => {
    const s = memory();
    s.setItem("schacklabbet.game.v1", "{");
    expect(() => readGame(s)).toThrow();
    s.setItem("schacklabbet.game.v1", JSON.stringify({ version: 2 }));
    expect(() => readGame(s)).toThrow();
  });
  it("avvisar orimliga konfigurationer", () => {
    const s = memory();
    s.setItem(
      "schacklabbet.game.v1",
      JSON.stringify({
        version: 1,
        pgn: "",
        color: "w",
        profile: "beginner",
        level: 999,
        ended: null,
        id: "test",
      }),
    );
    expect(() => readGame(s)).toThrow();
  });
  it("räknar ett avslutat parti bara en gång efter omladdning", () => {
    const once = recordGame(emptyProgress(), "same-game", true);
    expect(recordGame(once, "same-game", true)).toEqual(once);
    expect(once.games).toBe(1);
    expect(once.wins).toBe(1);
  });
  it("räknar inte en förlust som vinst", () => {
    expect(recordGame(emptyProgress(), "loss", false).wins).toBe(0);
  });
  it("återställer giltiga framsteg och avvisar skadad data", () => {
    const s = memory();
    expect(readProgress(s)).toEqual(emptyProgress());
    s.setItem(
      "schacklabbet.progress.v1",
      JSON.stringify({ ...emptyProgress(), completed: ["rook"] }),
    );
    expect(readProgress(s).completed).toEqual(["rook"]);
    s.setItem("schacklabbet.progress.v1", "{}");
    expect(() => readProgress(s)).toThrow();
  });
});
