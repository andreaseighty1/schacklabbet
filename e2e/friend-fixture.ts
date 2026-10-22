// UI fixture only. Real SQL permissions and CAS are exercised by server.test.ts;
// check-multiplayer.mjs verifies the deployed Auth/Edge/Realtime stack separately.
import type { BrowserContext } from "@playwright/test";
import {
  roomHandler,
  type RoomStore,
} from "../supabase/functions/chess-room/handler";
import {
  participant,
  RoomError,
  type Room,
} from "../supabase/functions/chess-room/rules";

export function friendFixture() {
  const rooms = new Map<string, Room>();
  const tokens = new Map<string, string>();
  let signups = 0;
  let dropNextMove = false;
  const invite = "ABC234";
  let offset = 0;
  const now = () => Date.now() + offset;
  function settle(room: Room) {
    if (room.status !== "playing" || !room.turn_started_at) return;
    const white = room.moves.length % 2 === 0;
    const flag = room.clock_minutes
      ? Date.parse(room.turn_started_at) +
        (white ? room.white_ms! : room.black_ms!)
      : Infinity;
    const limit =
      room.max_minutes && room.started_at
        ? Date.parse(room.started_at) + room.max_minutes * 60000
        : Infinity;
    if (now() < Math.min(flag, limit)) return;
    room.status = "finished";
    room.reason = limit <= flag ? "time_limit" : "timeout";
    room.result = limit <= flag ? "1/2-1/2" : white ? "0-1" : "1-0";
    const elapsed = Math.min(flag, limit) - Date.parse(room.turn_started_at);
    if (room.white_ms !== null && white)
      room.white_ms = Math.max(0, room.white_ms - elapsed);
    if (room.black_ms !== null && !white)
      room.black_ms = Math.max(0, room.black_ms - elapsed);
    room.turn_started_at = null;
    room.draw_offer = null;
    room.version++;
  }
  const store: RoomStore = {
    async command(p) {
      const actor = String(p.p_actor);
      const settings = (p.p_settings ?? {}) as Record<string, unknown>;
      for (const current of rooms.values()) settle(current);
      let room: Room | undefined;
      if (p.p_action === "create" || p.p_action === "resume") {
        room = [...rooms.values()].find(
          (r) =>
            [r.white_id, r.black_id].includes(actor) &&
            ["waiting", "playing"].includes(r.status),
        );
        if (!room && p.p_action === "create") {
          room = {
            id: crypto.randomUUID(),
            creator_id: actor,
            white_id: p.p_color === "w" ? actor : null,
            black_id: p.p_color === "b" ? actor : null,
            version: 0,
            moves: [],
            status: "waiting",
            result: null,
            reason: null,
            expires_at: new Date(Date.now() + 86400000).toISOString(),
            last_request: null,
            last_actor: null,
            clock_minutes: Number(settings.clock_minutes ?? 0),
            max_minutes: Number(settings.max_minutes ?? 0),
            white_ms: settings.clock_minutes
              ? Number(settings.clock_minutes) * 60000
              : null,
            black_ms: settings.clock_minutes
              ? Number(settings.clock_minutes) * 60000
              : null,
            started_at: null,
            turn_started_at: null,
            draw_offer: null,
            white_can_mate: true,
            black_can_mate: true,
          };
          rooms.set(room.id, room);
        }
      } else if (p.p_action === "join") {
        room = [...rooms.values()].find((r) => r.status === "waiting");
        if (!room || p.p_code !== invite) throw new RoomError("not_found", 404);
        if ([room.white_id, room.black_id].includes(actor))
          throw new RoomError("own_room", 409);
        room.white_id ??= actor;
        room.black_id ??= actor;
        room.status = "playing";
        room.started_at = room.turn_started_at = new Date(now()).toISOString();
        room.version++;
      } else {
        room = rooms.get(String(p.p_id));
        if (!room) throw new RoomError("not_found", 404);
        participant(room, actor);
        if (p.p_action === "commit") {
          if (p.p_version !== room.version)
            throw new RoomError("conflict", 409);
          const elapsed = room.turn_started_at
            ? Math.max(0, now() - Date.parse(room.turn_started_at))
            : 0;
          if (room.moves.length % 2 === 0 && room.white_ms !== null)
            room.white_ms = Math.max(0, room.white_ms - elapsed);
          if (room.moves.length % 2 === 1 && room.black_ms !== null)
            room.black_ms = Math.max(0, room.black_ms - elapsed);
          Object.assign(room, {
            moves: p.p_moves,
            status: p.p_status,
            result: p.p_result,
            reason: p.p_reason,
            last_request: p.p_request,
            last_actor: actor,
            version: room.version + 1,
            draw_offer:
              p.p_status === "playing" ? (settings.draw_offer ?? null) : null,
            turn_started_at:
              p.p_status === "playing" ? new Date(now()).toISOString() : null,
          });
        }
      }
      if (room && Date.parse(room.expires_at) < Date.now())
        throw new RoomError("not_found", 404);
      return structuredClone({
        room: room ?? null,
        server_now: new Date(now()).toISOString(),
        code:
          room?.status === "waiting" && room.creator_id === actor
            ? invite
            : undefined,
      });
    },
  };
  const handler = roomHandler({
    authenticate: async (token) => tokens.get(token) ?? null,
    store,
    code: () => invite,
  });
  return {
    get signups() {
      return signups;
    },
    dropMoveReply() {
      dropNextMove = true;
    },
    advanceTime(ms: number) {
      offset += ms;
    },
    expire() {
      for (const room of rooms.values()) room.expires_at = "2020-01-01";
    },
    async attach(context: BrowserContext) {
      await context.routeWebSocket(/supabase\.co\/realtime\//, (socket) =>
        socket.close(),
      );
      await context.route("**/auth/v1/signup", async (route) => {
        signups++;
        const id = crypto.randomUUID();
        const expires_at = Math.floor(Date.now() / 1000) + 3600;
        const payload = Buffer.from(
          JSON.stringify({ sub: id, role: "authenticated", exp: expires_at }),
        ).toString("base64url");
        const access_token = `eyJhbGciOiJIUzI1NiJ9.${payload}.test`;
        tokens.set(access_token, id);
        await route.fulfill({
          json: {
            access_token,
            refresh_token: "test-refresh",
            token_type: "bearer",
            expires_in: 3600,
            expires_at,
            user: {
              id,
              aud: "authenticated",
              role: "authenticated",
              app_metadata: { provider: "anonymous", providers: ["anonymous"] },
              user_metadata: {},
              is_anonymous: true,
              created_at: new Date().toISOString(),
            },
          },
          headers: { "Access-Control-Allow-Origin": "*" },
        });
      });
      await context.route("**/functions/v1/chess-room", async (route) => {
        const req = route.request();
        const response = await handler(
          new Request(req.url(), {
            method: req.method(),
            headers: req.headers(),
            body: req.postData(),
          }),
        );
        if (
          dropNextMove &&
          req.postDataJSON()?.action === "move" &&
          response.ok
        ) {
          dropNextMove = false;
          await route.abort("connectionreset");
          return;
        }
        await route.fulfill({
          status: response.status,
          headers: Object.fromEntries(response.headers),
          body: await response.text(),
        });
      });
    },
  };
}
