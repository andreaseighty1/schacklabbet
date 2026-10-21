import { describe, it, expect } from "vitest";
import { Chess } from "chess.js";
import { playUci } from "./chess/model";
import {
  trainingExercises,
  trainingSteps,
  trainingKey,
  emptyTraining,
  startTraining,
  solveTraining,
  advanceTraining,
  readTraining,
  type TrainingState,
} from "./training";

function restore(state: unknown) {
  return readTraining({
    getItem: () => JSON.stringify(state),
    setItem: () => {},
    removeItem: () => {},
  });
}
function finish(state: TrainingState, id: string, at = 1000) {
  let next = startTraining(state, id, at);
  for (let step = 0; step < trainingSteps.length; step++) {
    next = solveTraining(
      next,
      id,
      step,
      trainingExercises[step].solutions[0],
      at + 10,
    );
    next = advanceTraining(next, id);
  }
  return next;
}
describe("nybörjarpass", () => {
  it("har tre verkliga, spelbara uppgifter som avslutas med matt", () => {
    expect(trainingExercises.map((e) => e.id)).toEqual([
      "rook",
      "check-escape",
      "mate-rook",
    ]);
    for (const e of trainingExercises) {
      const game = new Chess(e.fen);
      playUci(game, e.solutions[0]);
      if (e.id === "mate-rook") expect(game.isCheckmate()).toBe(true);
    }
  });
  it("kan inte hoppa över uppgifter eller godta ett felaktigt eller gammalt svar", () => {
    const state = startTraining(emptyTraining(), "current", 100);
    expect(advanceTraining(state, "current")).toBe(state);
    expect(solveTraining(state, "old", 0, "a1a7", 200)).toBe(state);
    expect(solveTraining(state, "current", 1, "e1f1", 200)).toBe(state);
    expect(solveTraining(state, "current", 0, "a1a2", 200)).toBe(state);
  });
  it("sparar ett löst steg innan eleven går vidare, utan att räkna det två gånger", () => {
    const state = solveTraining(
      startTraining(emptyTraining(), "a", 100),
      "a",
      0,
      "a1a7",
      200,
    );
    expect(restore(state).current).toMatchObject({
      step: 0,
      solutions: ["a1a7"],
      finishedAt: null,
    });
    expect(solveTraining(state, "a", 0, "a1a7", 300)).toBe(state);
    expect(advanceTraining(state, "a").current).toMatchObject({
      step: 1,
      solutions: ["a1a7"],
    });
    expect(state.history).toEqual([]);
  });
  it("räknar färdigt först efter tre lösningar och bevarar senaste 20 avslut", () => {
    let state = emptyTraining();
    for (let i = 0; i < 22; i++) state = finish(state, `pass-${i}`);
    expect(state.current).toMatchObject({ step: 2, finishedAt: 1010 });
    expect(state.history).toHaveLength(20);
    expect(state.history[0].id).toBe("pass-21");
    expect(state.history.at(-1)!.id).toBe("pass-2");
    expect(restore(state)).toEqual(state);
    expect(solveTraining(state, "pass-21", 2, "a1h1", 9999)).toBe(state);
  });
  it("ett nytt pass kräver nya lösningar och behåller avslutade pass", () => {
    const state = startTraining(finish(emptyTraining(), "done"), "new", 2000);
    expect(state.current!.solutions).toEqual([]);
    expect(state.history).toHaveLength(1);
  });
  it("avvisar skadade, out-of-order och påstått avklarade sparningar", () => {
    const state = startTraining(emptyTraining(), "a", 100);
    for (const current of [
      { ...state.current, step: -1 },
      { ...state.current, step: 3 },
      { ...state.current, solutions: ["a1a2"] },
      { ...state.current, step: 2, solutions: [] },
      { ...state.current, finishedAt: 200 },
      { ...state.current, startedAt: Number.MAX_VALUE },
    ])
      expect(() => restore({ ...state, current })).toThrow();
    const done = finish(emptyTraining(), "done");
    expect(() => restore({ ...done, history: [] })).toThrow();
    expect(() =>
      restore({ ...done, history: [done.current, done.current] }),
    ).toThrow();
    expect(() => restore({ ...state, version: 2 })).toThrow();
    expect(
      readTraining({
        getItem: () => null,
        setItem: () => {},
        removeItem: () => {},
      }),
    ).toEqual(emptyTraining());
    expect(trainingKey).not.toBe("schacklabbet.game.v1");
  });
});
