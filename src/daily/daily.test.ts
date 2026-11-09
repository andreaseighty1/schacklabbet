import { describe, expect, it } from "vitest";
import { Chess } from "chess.js";
import {
  dailyById,
  dailyCalendar,
  dailyKey,
  dailyPuzzles,
  pickDaily,
  stockholmDay,
} from "./content";
import {
  applyUci,
  attemptDaily,
  dailyPosition,
  dailyStatus,
  emptyDaily,
  isGoal,
  resetDaily,
  revealDailyReply,
  showDailySolution,
  uci,
  type AnswerNode,
} from "./model";
import {
  DAILY_STORAGE_KEY,
  loadDaily,
  parseDailyStore,
  pruneDaily,
  saveDaily,
} from "./storage";
const puzzle = (id: string) => dailyById.get(id)!;

describe("the reviewed daily bank", () => {
  it("assigns 30 immutable dates, 30 distinct main puzzles, and 10 reachable extras", () => {
    expect(dailyPuzzles).toHaveLength(40);
    expect(Object.keys(dailyCalendar)).toHaveLength(30);
    expect(Object.keys(dailyCalendar).at(0)).toBe("2026-11-09");
    expect(Object.keys(dailyCalendar).at(-1)).toBe("2026-12-08");
    const main = Object.values(dailyCalendar);
    expect(new Set(main).size).toBe(30);
    expect(new Set(dailyPuzzles.map((p) => p.id)).size).toBe(40);
    expect(new Set(dailyPuzzles.map((p) => p.fen)).size).toBe(40);
    expect(
      main.filter((id) => puzzle(id).source.kind === "authored"),
    ).toHaveLength(18);
    expect(
      main.filter((id) => puzzle(id).source.kind === "lichess"),
    ).toHaveLength(10);
    expect(
      main.filter((id) => puzzle(id).source.kind === "historical"),
    ).toHaveLength(2);
    const extras = main.flatMap((id) =>
      puzzle(id).extraId ? [puzzle(id).extraId!] : [],
    );
    expect(new Set(extras).size).toBe(10);
    expect(extras.every((id) => dailyById.has(id) && !main.includes(id))).toBe(
      true,
    );
  });
  for (const p of dailyPuzzles)
    it(`${p.id}: every branch is legal, meets its stated goal, and includes every opposing reply`, () => {
      const game = new Chess(p.fen),
        learner = game.turn();
      const other = game.fen().split(" ");
      other[1] = learner === "w" ? "b" : "w";
      other[3] = "-";
      expect(new Chess(other.join(" ")).isCheck()).toBe(false);
      expect(game.isGameOver()).toBe(false);
      expect(p.hints).toHaveLength(3);
      expect(
        p.instruction + p.hints.join(" ") + p.success + p.takeaway,
      ).not.toMatch(/på drag/i);
      if (p.goal.kind === "escape") expect(game.isCheck()).toBe(true);
      if (p.goal.kind === "fork")
        for (const target of p.goal.targets)
          expect(
            game.get(target as Parameters<Chess["get"]>[0])?.color,
          ).not.toBe(learner);
      // A separate minimax oracle checks all candidate learner moves.
      const cache = new Map<string, boolean>();
      function force(remaining: number): boolean {
        if (game.isCheckmate()) return game.turn() !== learner;
        if (game.isDraw() || remaining === 0) return false;
        const ours = game.turn() === learner;
        const key = game.fen() + "|" + remaining;
        if (cache.has(key)) return cache.get(key)!;
        const legal = game
          .moves({ verbose: true })
          .sort(
            (a, b) => Number(/[+#]/.test(b.san)) - Number(/[+#]/.test(a.san)),
          );
        const outcome = (m: (typeof legal)[number]) => {
          game.move(m);
          const result = force(remaining - (ours ? 1 : 0));
          game.undo();
          return result;
        };
        const result = ours ? legal.some(outcome) : legal.every(outcome);
        cache.set(key, result);
        return result;
      }
      function check(node: AnswerNode, remaining: number) {
        if (node.done) {
          expect(p.goal.kind === "mate" ? game.isCheckmate() : true).toBe(true);
          expect(node.moves).toBeUndefined();
          return;
        }
        const legal = game.moves({ verbose: true }),
          ours = game.turn() === learner;
        const expected = legal
          .filter((m) => {
            game.move(m);
            const ok =
              p.goal.kind === "mate"
                ? force(remaining - (ours ? 1 : 0))
                : isGoal(game, m, p.goal);
            game.undo();
            return ours ? ok : true;
          })
          .map(uci)
          .sort();
        expect(Object.keys(node.moves ?? {}).sort()).toEqual(expected);
        expect(expected.length).toBeGreaterThan(0);
        for (const [move, child] of Object.entries(node.moves!)) {
          const made = applyUci(game, move);
          if (child.done) expect(isGoal(game, made, p.goal)).toBe(true);
          check(child, remaining - (ours ? 1 : 0));
          game.undo();
        }
      }
      check(p.tree, p.goal.kind === "mate" ? p.goal.ownMoves : 1);
      if (p.source.kind === "lichess") {
        const original = new Chess(p.source.originalFen);
        applyUci(original, p.source.setupMove!);
        expect(original.fen()).toBe(p.fen);
        expect(dailyPosition(p, p.mainline!).game.isCheckmate()).toBe(true);
        expect(p.source.license).toBe("CC0-1.0");
      }
    });
});
describe("learner session", () => {
  it("leaves wrong or illegal moves in place; all correct king escapes work", () => {
    const p = puzzle("king-safe"),
      initial = emptyDaily();
    const wrong = attemptDaily(p, initial, "a1a2");
    expect(wrong.attempts).toBe(1);
    expect(wrong.moves).toEqual([]);
    for (const move of ["e1d1", "e1f1", "e1d2", "e1f2"])
      expect(attemptDaily(p, initial, move).solvedLine).toEqual([move]);
    expect(attemptDaily(p, initial, "e1e2").moves).toEqual([]);
  });
  it("waits for the learner to reveal the reply and restores an unfinished line", () => {
    const p = puzzle("opera-two");
    const first = attemptDaily(p, emptyDaily(), "b3b8");
    expect(first.solvedLine).toBeUndefined();
    expect(dailyPosition(p, first.moves).awaitingReply).toBe(true);
    expect(attemptDaily(p, first, "d1d8")).toBe(first);
    const restored = parseDailyStore(
      JSON.stringify({
        version: 1,
        entries: { [dailyKey("2026-11-09", p)]: first },
      }),
    ).entries[dailyKey("2026-11-09", p)];
    const reply = revealDailyReply(p, restored);
    expect(reply.moves).toEqual(["b3b8", "d7b8"]);
    const done = attemptDaily(p, reply, "d1d8");
    expect(dailyStatus(done)).toBe("Klar");
    expect(dailyPosition(p, done.moves).game.isCheckmate()).toBe(true);
  });
  it("accepts alternative mate moves and rejects a stalemating promotion", () => {
    const p = puzzle("queen-mate");
    expect(Object.keys(p.tree.moves!).length).toBeGreaterThan(1);
    for (const move of Object.keys(p.tree.moves!))
      expect(attemptDaily(p, emptyDaily(), move).solvedLine).toEqual([move]);
    const under = puzzle("underpromotion");
    expect(Object.keys(under.tree.moves!)).toEqual(["c7c8r"]);
    expect(
      attemptDaily(under, emptyDaily(), "c7c8q").solvedLine,
    ).toBeUndefined();
    expect(attemptDaily(under, emptyDaily(), "c7c8r").solvedLine).toEqual([
      "c7c8r",
    ]);
  });
  it("distinguishes viewing an answer from solving, and retains help and completion on retry", () => {
    const p = puzzle("opera-two");
    const shown = showDailySolution(p, emptyDaily());
    expect(shown.moves).toEqual(p.mainline);
    expect(shown.solvedLine).toBeUndefined();
    expect(dailyStatus(shown)).toBe("Lösningen visad");
    let state = resetDaily(shown);
    for (const move of p.mainline!)
      state = dailyPosition(p, state.moves).awaitingReply
        ? revealDailyReply(p, state)
        : attemptDaily(p, state, move);
    expect(dailyStatus(state)).toBe("Klar med hjälp");
    expect(dailyStatus(resetDaily(state))).toBe("Klar med hjälp");
  });
});
describe("local progress validation", () => {
  it("recovers from malformed or unavailable storage without touching other progress", () => {
    const store = new Map([
      ["schacklabbet.progress.v1", "keep-lessons"],
      ["schacklabbet.game.v1", "keep-game"],
      [DAILY_STORAGE_KEY, "broken"],
    ]);
    const loaded = loadDaily({ getItem: (key) => store.get(key) ?? null });
    expect(loaded.warning).toMatch(/kunde inte läsas/);
    expect(
      saveDaily(
        {
          setItem: (key, value) => {
            store.set(key, value);
          },
        },
        loaded.store,
      ),
    ).toBe("");
    expect(store.get("schacklabbet.progress.v1")).toBe("keep-lessons");
    expect(store.get("schacklabbet.game.v1")).toBe("keep-game");
    expect(
      loadDaily({
        getItem: () => {
          throw new Error("denied");
        },
      }).warning,
    ).not.toBe("");
    expect(
      saveDaily(
        {
          setItem: () => {
            throw new Error("full");
          },
        },
        loaded.store,
      ),
    ).toMatch(/kan inte sparas/);
  });
  it("ignores impossible paths, invalid dates, stale revisions, and invented completions", () => {
    const p = puzzle("roof");
    const key = dailyKey("2026-11-09", p),
      valid = attemptDaily(p, emptyDaily(), "h1h8");
    const parsed = parseDailyStore(
      JSON.stringify({
        version: 1,
        entries: {
          [key]: valid,
          [dailyKey("2026-99-01", p)]: valid,
          [dailyKey("2026-11-10", p)]: {
            ...emptyDaily(),
            solvedLine: ["h1h2"],
          },
          [dailyKey("2026-11-11", p)]: { ...emptyDaily(), moves: ["h1h2"] },
          "2026-11-12|roof|999": valid,
        },
      }),
    );
    expect(Object.keys(parsed.entries)).toEqual([key]);
  });
  it("caps stored sessions at 120 while keeping the most recent dates", () => {
    const entries = Object.fromEntries(
      Array.from({ length: 130 }, (_, i) => [
        dailyKey(
          new Date(Date.UTC(2026, 0, i + 1)).toISOString().slice(0, 10),
          puzzle("roof"),
        ),
        emptyDaily(),
      ]),
    );
    const pruned = pruneDaily({ version: 1, entries });
    expect(Object.keys(pruned.entries)).toHaveLength(120);
    expect(Object.keys(pruned.entries).at(-1)).toContain("2026-01-11");
  });
});
describe("Swedish calendar", () => {
  it.each([
    ["2026-11-09T22:59:59Z", "2026-11-09"],
    ["2026-11-09T23:00:00Z", "2026-11-10"],
    ["2026-03-28T23:00:00Z", "2026-03-29"],
    ["2026-03-29T01:00:00Z", "2026-03-29"],
    ["2026-10-24T22:00:00Z", "2026-10-25"],
    ["2026-10-25T01:00:00Z", "2026-10-25"],
    ["2026-12-31T23:00:00Z", "2027-01-01"],
  ])("%s belongs to %s in Stockholm", (at, day) =>
    expect(stockholmDay(new Date(at))).toBe(day),
  );
  it("uses fixed assignments and explicitly flags a deterministic repeat outside the first package", () => {
    expect(pickDaily("2026-11-09").puzzle.id).toBe("roof");
    expect(pickDaily("2026-11-09").scheduled).toBe(true);
    expect(pickDaily("2026-12-09").scheduled).toBe(false);
    expect(pickDaily("2026-12-09")).toEqual(pickDaily("2026-12-09"));
  });
});
