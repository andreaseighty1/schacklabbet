import { Chess } from "chess.js";
import type { Exercise } from "../content";
import { playUci } from "../chess/model";

export interface LessonStep {
  instruction: string;
  hint: string;
  solutions: string[];
  reply?: { move: string; explanation: string };
}

export interface LessonSession {
  game: Chess;
  step: number;
  awaitingReply: boolean;
  solved: boolean;
}

export function lessonSteps(exercise: Exercise): LessonStep[] {
  return (
    exercise.steps ?? [
      {
        instruction: exercise.description,
        hint: exercise.hint,
        solutions: exercise.solutions,
      },
    ]
  );
}

export function startLesson(
  exercise: Exercise,
  savedSolution?: string,
): LessonSession {
  const session = {
    game: new Chess(exercise.fen),
    step: 0,
    awaitingReply: false,
    solved: false,
  };
  // Only the original one-move beginner pass stores a completed move.
  if (
    !exercise.steps &&
    savedSolution &&
    exercise.solutions.includes(savedSolution)
  ) {
    playUci(session.game, savedSolution);
    session.solved = true;
  }
  return session;
}

function copyGame(game: Chess): Chess {
  const copy = new Chess();
  copy.loadPgn(game.pgn());
  return copy;
}

/** Wrong ideas never mutate the board, history or completion state. */
export function attemptLesson(
  exercise: Exercise,
  session: LessonSession,
  move: string,
): LessonSession {
  const steps = lessonSteps(exercise);
  if (
    session.solved ||
    session.awaitingReply ||
    !steps[session.step].solutions.includes(move)
  )
    return session;
  const game = copyGame(session.game);
  playUci(game, move);
  const solved = session.step === steps.length - 1;
  return {
    game,
    solved,
    step: solved ? session.step : session.step + 1,
    awaitingReply: !solved && Boolean(steps[session.step].reply),
  };
}

/** Replies advance only when the pupil asks to see them; there is no timer. */
export function revealLessonReply(
  exercise: Exercise,
  session: LessonSession,
): LessonSession {
  if (!session.awaitingReply) return session;
  const reply = lessonSteps(exercise)[session.step - 1].reply!;
  const game = copyGame(session.game);
  playUci(game, reply.move);
  return { ...session, game, awaitingReply: false };
}
