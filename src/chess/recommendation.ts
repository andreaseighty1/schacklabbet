import { Chess } from "chess.js";
import type { GameReview } from "./review";
import { captureSquare, kingSquare, other, pieceNames } from "./model";

export interface TrainingRecommendation {
  exerciseId: string;
  reason: string;
}

/** Match a verified review example to a related lesson, without diagnosing a skill deficit. */
export function recommendTraining(
  review: GameReview,
): TrainingRecommendation | null {
  const example = review.improvement;
  if (!example) return null;
  const { played, suggested, reply } = example;
  if (played.promotion || suggested.promotion)
    return {
      exerciseId: "pawn-promotion",
      reason:
        "I den granskade ställningen kunde en bonde bli en ny pjäs. Öva på att välja pjäs vid förvandling.",
    };
  if (suggested.isKingsideCastle() || suggested.isQueensideCastle())
    return {
      exerciseId: "castle",
      reason:
        "Datorn föreslog rockad i den granskade ställningen. Repetera hur kungen och tornet flyttar tillsammans.",
    };
  const before = new Chess(played.before);
  if (before.isCheck()) {
    const king = kingSquare(before, played.color)!;
    const takesChecker = Boolean(
      suggested.captured &&
      before
        .attackers(king, other(played.color))
        .includes(captureSquare(suggested)),
    );
    return {
      exerciseId: takesChecker
        ? "check-capture"
        : suggested.piece === "k"
          ? "check-escape"
          : "check-block",
      reason: takesChecker
        ? "Du stod i schack. Datorns förslag var att ta den hotande pjäsen. Öva på det sättet att komma ur schack."
        : suggested.piece === "k"
          ? "Du stod i schack. Datorn föreslog att flytta kungen. Öva på att hitta en säker ruta."
          : "Du stod i schack. Datorns förslag var att ställa en pjäs emellan. Öva på att stoppa schacken så.",
    };
  }
  const lessons = {
    p: "pawn-forward",
    n: "knight",
    b: "bishop",
    r: "rook",
    q: "queen",
    k: "king",
  };
  if (reply?.captured)
    return {
      exerciseId: lessons[reply.captured],
      reason: `Efter ditt drag kunde motståndaren ta din ${pieceNames[reply.captured]} på ${captureSquare(reply).toUpperCase()}. Repetera hur den pjäsen kan röra sig och titta efter hot innan du flyttar.`,
    };
  return {
    exerciseId: lessons[suggested.piece],
    reason: `Datorn hittade ett annat drag med din ${pieceNames[suggested.piece]}. Repetera hur den pjäsen kan röra sig och jämför med förslaget från partiet.`,
  };
}
