import { participant, transition, RoomError, type Room } from "./rules.ts";

type Params = Record<string, unknown>;
export interface RoomStore {
  command(params: Params): Promise<{ room: Room | null; code?: string }>;
}
export type RoomDependencies = {
  authenticate(token: string): Promise<string | null>;
  store: RoomStore;
  code(): string;
};

const uuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
export const codePattern = /^[A-HJ-NP-Z2-9]{10}$/;

export function roomHandler(deps: RoomDependencies) {
  return async (request: Request): Promise<Response> => {
    const headers = {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Headers":
        "authorization, apikey, content-type, x-client-info",
      "Access-Control-Allow-Methods": "POST, OPTIONS",
      "Cache-Control": "no-store",
    };
    const respond = (body: unknown, status = 200) =>
      Response.json(body, { status, headers });
    if (request.method === "OPTIONS")
      return new Response(null, { status: 204, headers });
    if (request.method !== "POST") return respond({ error: "method" }, 405);
    try {
      const token = /^Bearer (\S+)$/i.exec(
        request.headers.get("Authorization") ?? "",
      )?.[1];
      if (!token) throw new RoomError("unauthorized", 401);
      const actor = await deps.authenticate(token);
      if (!actor || !uuid.test(actor)) throw new RoomError("unauthorized", 401);
      const bodyText = await request.text();
      if (bodyText.length > 2048) throw new RoomError("invalid_request");
      let body: Params;
      try {
        body = JSON.parse(bodyText);
      } catch {
        throw new RoomError("invalid_request");
      }
      if (!body || typeof body !== "object" || Array.isArray(body))
        throw new RoomError("invalid_request");
      const action = body.action;
      if (
        ![
          "create",
          "join",
          "resume",
          "get",
          "move",
          "resign",
          "cancel",
        ].includes(String(action))
      )
        throw new RoomError("invalid_request");
      // Do not let a forged request set actor IDs, history, status or results.
      const allowed = new Set([
        "action",
        "id",
        "code",
        "color",
        "version",
        "request",
        "uci",
      ]);
      if (Object.keys(body).some((key) => !allowed.has(key)))
        throw new RoomError("invalid_request");
      const params: Params = { p_actor: actor, p_action: action };
      if (action === "create") {
        if (body.color !== "w" && body.color !== "b")
          throw new RoomError("invalid_request");
        params.p_color = body.color;
        params.p_code = deps.code();
      }
      if (action === "join") {
        if (typeof body.code !== "string" || !codePattern.test(body.code))
          throw new RoomError("not_found", 404);
        params.p_code = body.code;
      }
      if (["get", "move", "resign", "cancel"].includes(String(action))) {
        if (typeof body.id !== "string" || !uuid.test(body.id))
          throw new RoomError("invalid_request");
        params.p_id = body.id;
      }
      if (["move", "resign", "cancel"].includes(String(action))) {
        if (
          !Number.isSafeInteger(body.version) ||
          Number(body.version) < 0 ||
          typeof body.request !== "string" ||
          !uuid.test(body.request)
        )
          throw new RoomError("invalid_request");
        const current = (
          await deps.store.command({
            p_actor: actor,
            p_action: "get",
            p_id: body.id,
          })
        ).room;
        if (!current) throw new RoomError("not_found", 404);
        participant(current, actor);
        if (
          current.last_request === body.request &&
          current.last_actor === actor
        )
          return respond({ room: current, color: participant(current, actor) });
        if (current.version !== body.version)
          throw new RoomError("conflict", 409);
        const next = transition(
          current,
          actor,
          action as "move" | "resign" | "cancel",
          body.uci as string | undefined,
        );
        Object.assign(params, {
          p_action: "commit",
          p_version: body.version,
          p_request: body.request,
          p_moves: next.moves,
          p_status: next.status,
          p_result: next.result,
          p_reason: next.reason,
        });
      }
      const answer = await deps.store.command(params);
      // Defence in depth, even if the database implementation changes later.
      if (answer.room) participant(answer.room, actor);
      return respond({
        ...answer,
        color: answer.room ? participant(answer.room, actor) : null,
      });
    } catch (error) {
      if (error instanceof RoomError)
        return respond({ error: error.code }, error.status);
      return respond({ error: "unavailable" }, 503);
    }
  };
}
