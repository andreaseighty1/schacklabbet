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
  const invite = "ABCDEFGH23";
  const store: RoomStore = {
    async command(p) {
      const actor = String(p.p_actor);
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
        room.version++;
      } else {
        room = rooms.get(String(p.p_id));
        if (!room) throw new RoomError("not_found", 404);
        participant(room, actor);
        if (p.p_action === "commit") {
          if (p.p_version !== room.version)
            throw new RoomError("conflict", 409);
          Object.assign(room, {
            moves: p.p_moves,
            status: p.p_status,
            result: p.p_result,
            reason: p.p_reason,
            last_request: p.p_request,
            last_actor: actor,
            version: room.version + 1,
          });
        }
      }
      if (room && Date.parse(room.expires_at) < Date.now())
        throw new RoomError("not_found", 404);
      return structuredClone({
        room: room ?? null,
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
