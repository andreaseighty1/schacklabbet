import { Chess } from "chess.js";

export type Room = {
  id: string;
  creator_id: string;
  white_id: string | null;
  black_id: string | null;
  version: number;
  moves: string[];
  status: "waiting" | "playing" | "finished" | "cancelled";
  result: "1-0" | "0-1" | "1/2-1/2" | null;
  reason: string | null;
  expires_at: string;
  last_request: string | null;
  last_actor: string | null;
  clock_minutes: number;
  max_minutes: number;
  white_ms: number | null;
  black_ms: number | null;
  started_at: string | null;
  turn_started_at: string | null;
  draw_offer: "w" | "b" | null;
  white_can_mate: boolean;
  black_can_mate: boolean;
};

export class RoomError extends Error {
  constructor(
    public code: string,
    public status = 400,
  ) {
    super(code);
  }
}

export function participant(room: Room, actor: string): "w" | "b" {
  if (room.white_id === actor) return "w";
  if (room.black_id === actor) return "b";
  throw new RoomError("not_found", 404);
}

export function replay(moves: string[]): Chess {
  const game = new Chess();
  for (const uci of moves) {
    game.move({
      from: uci.slice(0, 2),
      to: uci.slice(2, 4),
      promotion: uci[4],
    });
  }
  return game;
}

/** Only the server's stored history is replayed. Client FEN, PGN and results are never accepted. */
export function transition(
  room: Room,
  actor: string,
  action:
    | "move"
    | "resign"
    | "cancel"
    | "offer_draw"
    | "accept_draw"
    | "decline_draw",
  uci?: string,
) {
  const color = participant(room, actor);
  if (Date.parse(room.expires_at) <= Date.now())
    throw new RoomError("expired", 410);
  if (action === "cancel") {
    if (room.status !== "waiting" || room.creator_id !== actor)
      throw new RoomError("conflict", 409);
    return {
      moves: room.moves,
      status: "cancelled",
      result: null,
      reason: "cancelled",
    };
  }
  if (room.status !== "playing") throw new RoomError("conflict", 409);
  if (
    action === "offer_draw" ||
    action === "accept_draw" ||
    action === "decline_draw"
  ) {
    if (
      action === "offer_draw"
        ? room.draw_offer !== null
        : !room.draw_offer || room.draw_offer === color
    )
      throw new RoomError("conflict", 409);
    return {
      moves: room.moves,
      status: action === "accept_draw" ? "finished" : "playing",
      result: action === "accept_draw" ? "1/2-1/2" : null,
      reason: action === "accept_draw" ? "agreement" : null,
      draw_offer: action === "offer_draw" ? color : null,
    };
  }
  if (action === "resign")
    return {
      moves: room.moves,
      status: "finished",
      result: color === "w" ? "0-1" : "1-0",
      reason: "resignation",
    };
  if (typeof uci !== "string" || !/^[a-h][1-8][a-h][1-8][qrbn]?$/.test(uci))
    throw new RoomError("illegal_move");
  const game = replay(room.moves);
  if (game.turn() !== color) throw new RoomError("not_your_turn", 409);
  if (game.isGameOver()) throw new RoomError("conflict", 409);
  try {
    // chess.js otherwise ignores an unnecessary promotion suffix; reject it explicitly.
    const candidates = game.moves({ verbose: true });
    if (
      !candidates.some(
        (m) =>
          m.from === uci.slice(0, 2) &&
          m.to === uci.slice(2, 4) &&
          (m.promotion ?? "") === (uci[4] ?? ""),
      )
    )
      throw new Error();
    game.move({
      from: uci.slice(0, 2),
      to: uci.slice(2, 4),
      promotion: uci[4],
    });
  } catch {
    throw new RoomError("illegal_move");
  }
  let reason: string | null = null;
  let result: Room["result"] = null;
  if (game.isCheckmate()) {
    reason = "checkmate";
    result = color === "w" ? "1-0" : "0-1";
  } else if (game.isStalemate()) {
    reason = "stalemate";
    result = "1/2-1/2";
  } else if (game.isThreefoldRepetition()) {
    reason = "repetition";
    result = "1/2-1/2";
  } else if (game.isInsufficientMaterial()) {
    reason = "material";
    result = "1/2-1/2";
  } else if (game.isDrawByFiftyMoves()) {
    reason = "fifty_moves";
    result = "1/2-1/2";
  }
  return {
    moves: [...room.moves, uci],
    status: result ? "finished" : "playing",
    result,
    reason,
    draw_offer: room.draw_offer === color ? color : null,
  };
}
