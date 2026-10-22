const exercisePrefixes = {
  rook: "lesson-rook",
  bishop: "lesson-bishop",
  knight: "lesson-knight",
  castle: "lesson-castle",
  "mate-rook": "challenge-rook-mate",
  "mate-queen": "challenge-queen-mate",
  "pawn-forward": "lesson-pawn-forward",
  "pawn-double": "lesson-pawn-double",
  "pawn-capture": "lesson-pawn-capture",
  "pawn-black": "lesson-pawn-black",
  "pawn-promotion": "lesson-pawn-promotion",
  queen: "lesson-queen",
  king: "lesson-king",
  "check-escape": "lesson-check-escape",
  "check-capture": "lesson-check-capture",
  "check-block": "lesson-check-block",
  checkmate: "lesson-checkmate",
  stalemate: "lesson-stalemate",
  "en-passant": "lesson-en-passant",
  "spot-threat": "lesson-spot-threat",
  "rescue-rook": "lesson-rescue-rook",
  "rescue-queen": "lesson-rescue-queen",
  "rescue-knight": "lesson-rescue-knight",
  "safe-capture": "lesson-safe-capture",
} as const;

export type ExerciseVoiceId = keyof typeof exercisePrefixes;
export type ExerciseCue = "intro" | "hint" | "success";
type ExerciseClip =
  `${(typeof exercisePrefixes)[ExerciseVoiceId]}-${ExerciseCue}`;
export type VoiceClip =
  | ExerciseClip
  | "start-welcome"
  | "help-move-piece"
  | "help-audio-controls"
  | "exercise-try-again"
  | "exercise-move-not-allowed"
  | "game-player-check"
  | "game-move-risk";

export function exerciseClip(
  id: string,
  cue: ExerciseCue,
): ExerciseClip | null {
  if (!Object.hasOwn(exercisePrefixes, id)) return null;
  return `${exercisePrefixes[id as ExerciseVoiceId]}-${cue}`;
}

export function isAssistance(clip: VoiceClip): boolean {
  return clip !== "start-welcome" && clip !== "help-audio-controls";
}

export function clipLabel(clip: VoiceClip): string {
  if (clip.endsWith("-intro")) return "Uppdraget";
  if (clip.endsWith("-hint")) return "Ledtråden";
  if (clip.endsWith("-success")) return "Förklaringen";
  const labels = {
    "start-welcome": "Välkommen till Schacklabbet",
    "help-move-piece": "Så flyttar du en pjäs",
    "help-audio-controls": "Så styr du rösten",
    "exercise-try-again": "Prova en annan idé",
    "exercise-move-not-allowed": "Välj en annan ruta",
    "game-player-check": "Din kung står i schack",
    "game-move-risk": "Undersök hotet",
  };
  return labels[clip as keyof typeof labels];
}

export const voiceUrl = (clip: VoiceClip) =>
  `${import.meta.env.BASE_URL}audio/sv-SE/${clip}.mp3`;
