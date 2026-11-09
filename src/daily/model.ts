import { Chess, type Move } from "chess.js";

export type Goal =
  | { kind: "mate"; ownMoves: number }
  | { kind: "capture"; square: string; piece: string }
  | { kind: "escape" }
  | { kind: "fork"; piece: string; targets: string[] }
  | { kind: "promotion" }
  | { kind: "castle" };
export type AnswerNode = { done?: true; moves?: Record<string, AnswerNode> };
export type DailyPuzzle = {
  id: string;
  revision: number;
  title: string;
  theme: string;
  instruction: string;
  fen: string;
  goal: Goal;
  hints: string[];
  success: string;
  takeaway: string;
  tree: AnswerNode;
  extraId?: string;
  mainline?: string[];
  source: {
    kind: "authored" | "lichess" | "historical";
    label: string;
    url?: string;
    gameUrl?: string;
    license: string;
    credit: string;
    story?: string;
    originalFen?: string;
    setupMove?: string;
  };
};
export type DailyProgress = {
  moves: string[];
  attempts: number;
  hintLevel: number;
  helpUsed: boolean;
  solutionShown: boolean;
  solvedLine?: string[];
};
export const emptyDaily = (): DailyProgress => ({
  moves: [],
  attempts: 0,
  hintLevel: 0,
  helpUsed: false,
  solutionShown: false,
});
export const uci = (move: Move) => move.from + move.to + (move.promotion ?? "");
export function applyUci(game: Chess, move: string) {
  return game.move({
    from: move.slice(0, 2),
    to: move.slice(2, 4),
    promotion: move[4],
  });
}
export function dailyPosition(puzzle: DailyPuzzle, moves: string[]) {
  const game = new Chess(puzzle.fen);
  let node = puzzle.tree;
  for (const move of moves) {
    const next = node.moves?.[move];
    if (!next) throw new Error("Ogiltig sparad följd");
    applyUci(game, move);
    node = next;
  }
  const learner = new Chess(puzzle.fen).turn();
  return {
    game,
    node,
    done: node.done === true,
    awaitingReply: !node.done && game.turn() !== learner,
  };
}
export function attemptDaily(
  puzzle: DailyPuzzle,
  state: DailyProgress,
  move: string,
) {
  const view = dailyPosition(puzzle, state.moves);
  if (view.done || view.awaitingReply) return state;
  const next = { ...state, attempts: state.attempts + 1 };
  if (!view.node.moves?.[move]) return next;
  const moves = [...state.moves, move];
  const done = view.node.moves[move].done;
  return {
    ...next,
    moves,
    hintLevel: 0,
    ...(done ? { solvedLine: moves } : {}),
  };
}
function preferred(puzzle: DailyPuzzle, moves: string[], node: AnswerNode) {
  const recorded = puzzle.mainline;
  return recorded &&
    moves.every((move, i) => recorded[i] === move) &&
    node.moves?.[recorded[moves.length]]
    ? recorded[moves.length]
    : Object.keys(node.moves ?? {})[0];
}
export function revealDailyReply(puzzle: DailyPuzzle, state: DailyProgress) {
  const view = dailyPosition(puzzle, state.moves);
  if (!view.awaitingReply) return state;
  const move = preferred(puzzle, state.moves, view.node);
  return { ...state, moves: [...state.moves, move], hintLevel: 0 };
}
export function showDailySolution(puzzle: DailyPuzzle, state: DailyProgress) {
  const moves = [...state.moves];
  let { node } = dailyPosition(puzzle, moves);
  while (!node.done) {
    const move = preferred(puzzle, moves, node);
    if (!move) throw new Error("Ofullständig lösning");
    moves.push(move);
    node = node.moves![move];
  }
  return { ...state, moves, solutionShown: true, helpUsed: true, hintLevel: 0 };
}
export function resetDaily(state: DailyProgress): DailyProgress {
  return { ...state, moves: [], hintLevel: 0 };
}
export function dailyStatus(state: DailyProgress) {
  if (state.solvedLine)
    return state.helpUsed || state.solutionShown ? "Klar med hjälp" : "Klar";
  if (state.solutionShown) return "Lösningen visad";
  return state.moves.length || state.attempts || state.hintLevel
    ? "Påbörjad"
    : "Inte provad";
}
export function isGoal(game: Chess, move: Move, goal: Goal) {
  switch (goal.kind) {
    case "mate":
      return game.isCheckmate();
    case "capture":
      return move.to === goal.square && move.captured === goal.piece;
    case "escape":
      return move.piece === "k"; // Legal moves already leave our own king out of check.
    case "fork":
      return (
        move.piece === goal.piece &&
        goal.targets.every((square) =>
          game
            .attackers(square as Parameters<Chess["attackers"]>[0], move.color)
            .includes(move.to),
        )
      );
    case "promotion":
      return !!move.promotion && !game.isDraw();
    case "castle":
      return move.isKingsideCastle() || move.isQueensideCastle();
  }
}
