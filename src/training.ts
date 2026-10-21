import { exercises } from "./content";
import type { StoragePort } from "./storage";

export const trainingKey = "schacklabbet.training.v1";
export const trainingSteps = [
  {
    exerciseId: "rook",
    title: "Upptäck tornet",
    reflection:
      "Du har övat på att flytta tornet rakt och ta en motståndarpjäs.",
  },
  {
    exerciseId: "check-escape",
    title: "Skydda din kung",
    reflection:
      "Du har övat på att flytta kungen till en säker ruta när den står i schack.",
  },
  {
    exerciseId: "mate-rook",
    title: "Hitta schackmatt",
    reflection:
      "Du har övat på att låta tornet och kungen samarbeta för att sätta matt.",
  },
] as const;
export const trainingExercises = trainingSteps.map((step) =>
  exercises.find((e) => e.id === step.exerciseId)!,
);

export interface TrainingRun {
  id: string;
  startedAt: number;
  step: number;
  solutions: string[];
  finishedAt: number | null;
}
export interface TrainingState {
  version: 1;
  current: TrainingRun | null;
  history: TrainingRun[];
}
export const emptyTraining = (): TrainingState => ({
  version: 1,
  current: null,
  history: [],
});

function validRun(value: unknown): value is TrainingRun {
  if (!value || typeof value !== "object") return false;
  const run = value as TrainingRun;
  return (
    typeof run.id === "string" &&
    run.id.length > 0 &&
    Number.isFinite(run.startedAt) &&
    run.startedAt >= 0 &&
    run.startedAt <= 8640000000000000 &&
    Number.isInteger(run.step) &&
    run.step >= 0 &&
    run.step < trainingSteps.length &&
    Array.isArray(run.solutions) &&
    run.solutions.length >= run.step &&
    run.solutions.length <= run.step + 1 &&
    run.solutions.every(
      (solution, i) =>
        typeof solution === "string" &&
        trainingExercises[i]?.solutions.includes(solution),
    ) &&
    (run.solutions.length === trainingSteps.length
      ? Number.isFinite(run.finishedAt) &&
        typeof run.finishedAt === "number" &&
        run.finishedAt <= 8640000000000000 &&
        run.finishedAt >= run.startedAt
      : run.finishedAt === null)
  );
}

export function readTraining(storage: StoragePort): TrainingState {
  const raw = storage.getItem(trainingKey);
  if (!raw) return emptyTraining();
  const state = JSON.parse(raw) as TrainingState;
  if (
    !state ||
    state.version !== 1 ||
    !(state.current === null || validRun(state.current)) ||
    !Array.isArray(state.history) ||
    state.history.length > 20 ||
    !state.history.every((run) => validRun(run) && run.finishedAt !== null) ||
    new Set(state.history.map((run) => run.id)).size !== state.history.length
  )
    throw new Error("Det sparade träningspasset kunde inte läsas.");
  if (
    state.current &&
    state.current.finishedAt !== null &&
    !state.history.some(
      (run) =>
        run.id === state.current!.id &&
        run.startedAt === state.current!.startedAt &&
        run.finishedAt === state.current!.finishedAt &&
        run.solutions.join() === state.current!.solutions.join(),
    )
  )
    throw new Error("Träningspassets avslut saknas i historiken.");
  return state;
}

export function startTraining(
  state: TrainingState,
  id: string,
  now: number,
): TrainingState {
  return {
    ...state,
    current: { id, startedAt: now, step: 0, solutions: [], finishedAt: null },
  };
}
export function solveTraining(
  state: TrainingState,
  id: string,
  step: number,
  solution: string,
  now: number,
): TrainingState {
  const run = state.current;
  if (
    !run ||
    run.id !== id ||
    run.finishedAt !== null ||
    run.step !== step ||
    run.solutions.length !== step ||
    !trainingExercises[step]?.solutions.includes(solution)
  )
    return state;
  const solutions = [...run.solutions, solution];
  const finishedAt =
    solutions.length === trainingSteps.length
      ? Math.max(now, run.startedAt)
      : null;
  const current = { ...run, solutions, finishedAt };
  return {
    ...state,
    current,
    history:
      finishedAt === null
        ? state.history
        : [current, ...state.history.filter((entry) => entry.id !== id)].slice(
            0,
            20,
          ),
  };
}
export function advanceTraining(
  state: TrainingState,
  id: string,
): TrainingState {
  const run = state.current;
  if (
    !run ||
    run.id !== id ||
    run.finishedAt !== null ||
    run.solutions.length !== run.step + 1 ||
    run.step >= trainingSteps.length - 1
  )
    return state;
  return { ...state, current: { ...run, step: run.step + 1 } };
}
