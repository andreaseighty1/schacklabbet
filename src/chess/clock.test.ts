import { describe, expect, it, vi } from "vitest";
import {
  GameClock,
  newClock,
  settleClock,
  expiredColor,
  formatClock,
  validClock,
} from "./clock";
import { cannotMate, timeoutOutcome } from "./timeOutcome";
import { Chess } from "chess.js";

describe("schackklocka", () => {
  it("startar vit oavsett elevens färg och räknar bara den aktiva spelaren", () => {
    let now = 1000;
    const timer = new GameClock(null, () => now);
    timer.start(10, "w");
    now += 2400;
    expect(timer.read()).toMatchObject({
      whiteMs: 597600,
      blackMs: 600000,
      running: "w",
    });
    timer.switchTurn("b");
    now += 1700;
    expect(timer.read()).toMatchObject({
      whiteMs: 597600,
      blackMs: 598300,
      running: "b",
    });
  });
  it("beräknar förfluten tid utan tickdrift, även efter ett långt avbrott", () => {
    const state = newClock(15, "b", 0)!;
    expect(settleClock(state, 12345).blackMs).toBe(887655);
    expect(expiredColor(settleClock(state, 900000))).toBe("b");
    expect(settleClock(state, 9999999).blackMs).toBe(0);
    expect(state.blackMs).toBe(900000);
  });
  it("ett turbyte kan inte återuppliva en utgången klocka", () => {
    let now = 0;
    const timer = new GameClock(null, () => now);
    timer.start(10, "w");
    now = 600000;
    expect(timer.switchTurn("b")).toBe(false);
    expect(timer.expired()).toBe("w");
  });
  it("stopp fryser tiderna och ett nytt parti återställer båda", () => {
    let now = 0;
    const timer = new GameClock(null, () => now);
    timer.start(10, "w");
    now = 3000;
    timer.stop();
    now = 999999;
    expect(timer.read()).toMatchObject({
      whiteMs: 597000,
      blackMs: 600000,
      running: null,
    });
    timer.start(15, "w");
    expect(timer.read()).toMatchObject({ whiteMs: 900000, blackMs: 900000 });
    timer.start(0, "w");
    expect(timer.read()).toBeNull();
  });
  it("ångra-liknande turbyte ger inte tillbaka förbrukad tid", () => {
    let now = 0;
    const timer = new GameClock(null, () => now);
    timer.start(10, "w");
    now = 3000;
    timer.switchTurn("b");
    now = 5000;
    timer.switchTurn("w");
    expect(timer.read()).toMatchObject({ whiteMs: 597000, blackMs: 598000 });
  });
  it("visar aldrig negativ tid och har en tydlig minutvisning", () => {
    expect(formatClock(600000)).toBe("10:00");
    expect(formatClock(1)).toBe("0:01");
    expect(formatClock(59999)).toBe("1:00");
    expect(formatClock(-1)).toBe("0:00");
  });
  it("avvisar skadade eller orimliga klockvärden", () => {
    const state = newClock(10, "w", 100)!;
    expect(validClock(state)).toBe(true);
    for (const change of [
      { minutes: 1 },
      { whiteMs: -1 },
      { blackMs: 600001 },
      { running: "x" },
      { updatedAt: NaN },
    ])
      expect(validClock({ ...state, ...change })).toBe(false);
    expect(settleClock(state, 0).whiteMs).toBe(600000);
  });
  it("väggklocka bakåt ger ingen extra tid under besöket", async () => {
    vi.useFakeTimers({ toFake: ["Date", "performance"] });
    try {
      vi.setSystemTime(new Date("2026-10-21T12:00:00Z"));
      const timer = new GameClock();
      timer.start(10, "w");
      await vi.advanceTimersByTimeAsync(1000);
      expect(timer.read()!.whiteMs).toBe(599000);
      vi.setSystemTime(new Date("2026-10-21T11:00:00Z"));
      await vi.advanceTimersByTimeAsync(1000);
      expect(timer.read()!.whiteMs).toBe(598000);
    } finally {
      vi.useRealTimers();
    }
  });
});

describe("tidsavslut och mattmaterial", () => {
  it.each([
    ["7k/8/8/6Q1/8/5K2/8/8 b - - 0 1", true],
    ["6nk/8/8/8/8/8/8/K2Q4 b - - 0 1", true],
    ["6nk/8/8/8/8/8/8/K2N4 b - - 0 1", false],
    ["2b4k/8/8/8/8/8/8/R4K2 b - - 0 1", true],
    ["2b4k/8/8/8/8/8/8/K4B2 b - - 0 1", true],
    ["2b4k/8/8/8/8/8/8/K1B5 b - - 0 1", false],
    ["2b4k/8/8/8/8/8/8/K1N5 b - - 0 1", false],
    ["2b1b2k/8/8/8/8/8/8/K7 b - - 0 1", true],
    ["2b2b1k/8/8/8/8/8/8/K7 b - - 0 1", false],
    ["5nnk/8/8/8/8/8/8/K7 b - - 0 1", false],
  ])("kontrollerar båda sidors material i %s", (fen, insufficient) =>
    expect(cannotMate(new Chess(fen), "b")).toBe(insufficient),
  );
  it("skriver vinst på tid till PGN och anger vems tid som tog slut", () => {
    const game = new Chess();
    expect(timeoutOutcome(game, "b")).toBe(
      "Vit vinner på tid – svarts tid är slut",
    );
    expect(game.getHeaders()).toMatchObject({
      Result: "1-0",
      Termination: "time forfeit",
    });
  });
  it("en ensam kung får remi i stället för vinst på tid", () => {
    const game = new Chess("7k/8/8/6Q1/8/5K2/8/8 w - - 0 1");
    expect(timeoutOutcome(game, "w")).toContain("Remi");
    expect(game.getHeaders().Result).toBe("1/2-1/2");
  });
});
