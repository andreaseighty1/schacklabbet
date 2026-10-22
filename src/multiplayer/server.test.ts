import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { readFile } from "node:fs/promises";
import { PGlite } from "@electric-sql/pglite";
import {
  roomHandler,
  type RoomStore,
} from "../../supabase/functions/chess-room/handler";
import {
  replay,
  RoomError,
  transition,
  type Room,
} from "../../supabase/functions/chess-room/rules";

const white = "00000000-0000-4000-8000-000000000001";
const black = "00000000-0000-4000-8000-000000000002";
const outsider = "00000000-0000-4000-8000-000000000003";
const db = new PGlite();
const names = [
  "p_actor",
  "p_action",
  "p_id",
  "p_code",
  "p_color",
  "p_version",
  "p_moves",
  "p_status",
  "p_result",
  "p_reason",
  "p_request",
  "p_settings",
];
const store: RoomStore = {
  async command(params) {
    const present = names.filter((name) => name in params);
    try {
      const { rows } = await db.query<{
        answer: { room: Room | null; code?: string; error?: string };
      }>(
        `select public.chess_room_command(${present.map((name, index) => `${name} => $${index + 1}`).join(",")}) as answer`,
        present.map((name) =>
          ["p_moves", "p_settings"].includes(name)
            ? JSON.stringify(params[name])
            : params[name],
        ),
      );
      const answer = rows[0].answer;
      if (answer.error)
        throw new RoomError(
          answer.error,
          answer.error === "rate_limited"
            ? 429
            : answer.error === "not_found"
              ? 404
              : 409,
        );
      return answer;
    } catch (error) {
      if (error instanceof RoomError) throw error;
      const code = (error as Error).message;
      if (["conflict", "not_found"].includes(code))
        throw new RoomError(code, code === "not_found" ? 404 : 409);
      throw error;
    }
  },
};
let codeNumber = 0;
const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
const handler = roomHandler({
  authenticate: async (token) =>
    [white, black, outsider].includes(token) ? token : null,
  store,
  code: () => {
    const n = ++codeNumber;
    return `ABCD${alphabet[(n >> 5) & 31]}${alphabet[n & 31]}`;
  },
});
async function call(actor: string, body: Record<string, unknown>) {
  const response = await handler(
    new Request("https://example.test", {
      method: "POST",
      headers: { Authorization: `Bearer ${actor}` },
      body: JSON.stringify(body),
    }),
  );
  return {
    status: response.status,
    data: (await response.json()) as {
      room: Room | null;
      code?: string;
      color?: string;
      error?: string;
    },
  };
}
async function empty() {
  await db.exec(
    "truncate public.chess_rooms, chess_private.request_limits cascade",
  );
}
async function pair(clock_minutes = 0, max_minutes = 0) {
  await empty();
  const host = await call(white, {
    action: "create",
    color: "w",
    clock_minutes,
    max_minutes,
  });
  expect(host.status).toBe(200);
  const guest = await call(black, { action: "join", code: host.data.code });
  expect(guest.status).toBe(200);
  return guest.data.room!;
}
async function move(
  room: Room,
  actor: string,
  uci: string,
  request = crypto.randomUUID(),
) {
  return call(actor, {
    action: "move",
    id: room.id,
    version: room.version,
    uci,
    request,
  });
}

beforeAll(async () => {
  await db.exec(await readFile("supabase/tests/bootstrap.sql", "utf8"));
  await db.exec(
    await readFile(
      "supabase/migrations/202610220001_private_chess.sql",
      "utf8",
    ),
  );
  await db.exec(
    await readFile("supabase/migrations/202610220003_room_clocks.sql", "utf8"),
  );
  await db.query("insert into auth.users(id) values ($1),($2),($3)", [
    white,
    black,
    outsider,
  ]);
}, 30000);
afterAll(async () => {
  await db.close();
});

describe("kompispartier: riktig PostgreSQL och serverns HTTP-hanterare", () => {
  async function action(room: Room, actor: string, name: string) {
    return call(actor, {
      action: name,
      id: room.id,
      version: room.version,
      request: crypto.randomUUID(),
    });
  }
  it("startar klockan först vid anslutning, debiterar rätt sida och håller omtag idempotenta", async () => {
    await empty();
    const host = await call(white, {
      action: "create",
      color: "w",
      clock_minutes: 10,
    });
    expect(host.data.room).toMatchObject({
      white_ms: 600000,
      black_ms: 600000,
      started_at: null,
      turn_started_at: null,
    });
    let room = (await call(black, { action: "join", code: host.data.code }))
      .data.room!;
    expect(room.started_at).not.toBeNull();
    await db.query(
      "update public.chess_rooms set turn_started_at=clock_timestamp()-interval '5 seconds' where id=$1",
      [room.id],
    );
    const request = crypto.randomUUID();
    room = (await move(room, white, "e2e4", request)).data.room!;
    expect(room.white_ms).toBeLessThanOrEqual(595000);
    expect(room.white_ms).toBeGreaterThan(594000);
    expect(room.black_ms).toBe(600000);
    const retry = (await move({ ...room, version: 1 }, white, "e2e4", request))
      .data.room!;
    expect(retry.white_ms).toBe(room.white_ms);
    await db.query(
      "update public.chess_rooms set turn_started_at=clock_timestamp()-interval '2 seconds' where id=$1",
      [room.id],
    );
    room = (await move(room, black, "e7e5")).data.room!;
    expect(room.white_ms).toBe(retry.white_ms);
    expect(room.black_ms).toBeLessThanOrEqual(598000);
  });
  it("avslutar på tid på servern och godtar inget sent drag, inte ens efter valideringen", async () => {
    const room = await pair(10);
    await db.query(
      "update public.chess_rooms set turn_started_at=clock_timestamp()-interval '11 minutes' where id=$1",
      [room.id],
    );
    const late = await move(room, white, "e2e4");
    expect(late.data.room).toMatchObject({
      status: "finished",
      result: "0-1",
      reason: "timeout",
      moves: [],
      white_ms: 0,
      black_ms: 600000,
    });
    const room2 = await pair(10);
    // Emulate expiry between the Edge read and its atomic database commit.
    await db.query(
      "update public.chess_rooms set turn_started_at=clock_timestamp()-interval '11 minutes' where id=$1",
      [room2.id],
    );
    const committed = await store.command({
      p_actor: white,
      p_action: "commit",
      p_id: room2.id,
      p_version: room2.version,
      p_request: crypto.randomUUID(),
      p_moves: ["e2e4"],
      p_status: "playing",
    });
    expect(committed.room).toMatchObject({ reason: "timeout", moves: [] });
  });
  it("bakgrundsjobbet kan avgöra även när båda webbläsarna är stängda och resultatet ändras inte", async () => {
    const room = await pair(15);
    await db.query(
      "update public.chess_rooms set turn_started_at=clock_timestamp()-interval '16 minutes' where id=$1",
      [room.id],
    );
    await db.query("select chess_private.settle_clock($1)", [room.id]);
    const finished = (await call(black, { action: "get", id: room.id })).data
      .room!;
    expect(finished).toMatchObject({
      reason: "timeout",
      result: "0-1",
      version: room.version + 1,
    });
    await db.query("select chess_private.settle_clock($1)", [room.id]);
    expect(
      (await call(black, { action: "get", id: room.id })).data.room,
    ).toEqual(finished);
    expect(
      (await call(white, { action: "create", color: "w" })).data.room!.id,
    ).not.toBe(room.id);
  });
  it("låter gemensam maxtid ge remi och avgör alltid den tidsgräns som inträffade först", async () => {
    let room = await pair(0, 20);
    await db.query(
      "update public.chess_rooms set started_at=clock_timestamp()-interval '21 minutes' where id=$1",
      [room.id],
    );
    expect(
      (await call(white, { action: "get", id: room.id })).data.room,
    ).toMatchObject({
      reason: "time_limit",
      result: "1/2-1/2",
      white_ms: null,
    });
    room = await pair(10, 20);
    await db.query(
      "update public.chess_rooms set started_at=clock_timestamp()-interval '21 minutes',turn_started_at=clock_timestamp()-interval '22 minutes' where id=$1",
      [room.id],
    );
    expect(
      (await call(black, { action: "get", id: room.id })).data.room,
    ).toMatchObject({ reason: "timeout", result: "0-1" });
    room = await pair(15, 20);
    await db.query(
      "update public.chess_rooms set started_at=clock_timestamp()-interval '21 minutes',turn_started_at=clock_timestamp()-interval '16 minutes' where id=$1",
      [room.id],
    );
    expect(
      (await call(black, { action: "get", id: room.id })).data.room,
    ).toMatchObject({ reason: "time_limit", result: "1/2-1/2" });
  });
  it("ger remi vid tidsavslut om vinnarsidan saknar mattmaterial", async () => {
    const room = await pair(10);
    await db.query(
      "update public.chess_rooms set black_can_mate=false,turn_started_at=clock_timestamp()-interval '11 minutes' where id=$1",
      [room.id],
    );
    expect(
      (await call(white, { action: "get", id: room.id })).data.room,
    ).toMatchObject({ reason: "timeout_material", result: "1/2-1/2" });
  });
  it("remiförslag pausar inte klockan och kräver den andra spelarens ja", async () => {
    let room = await pair(10);
    await db.query(
      "update public.chess_rooms set turn_started_at=clock_timestamp()-interval '3 seconds' where id=$1",
      [room.id],
    );
    room = (await action(room, white, "offer_draw")).data.room!;
    expect(room).toMatchObject({
      status: "playing",
      draw_offer: "w",
      moves: [],
    });
    expect(room.white_ms).toBeLessThanOrEqual(597000);
    expect((await action(room, white, "accept_draw")).status).toBe(409);
    expect((await action(room, outsider, "accept_draw")).status).toBe(404);
    const accepted = (await action(room, black, "accept_draw")).data.room!;
    expect(accepted).toMatchObject({
      status: "finished",
      result: "1/2-1/2",
      reason: "agreement",
      turn_started_at: null,
      draw_offer: null,
    });
  });
  it("låter kompisen neka remi eller spela vidare, och ett gammalt förslag kan inte accepteras", async () => {
    let room = await pair();
    room = (await action(room, white, "offer_draw")).data.room!;
    room = (await move(room, white, "e2e4")).data.room!;
    expect(room.draw_offer).toBe("w");
    const offered = room;
    room = (await move(room, black, "e7e5")).data.room!;
    expect(room.draw_offer).toBeNull();
    expect((await action(offered, black, "accept_draw")).status).toBe(409);
    room = (await action(room, black, "offer_draw")).data.room!;
    room = (await action(room, white, "decline_draw")).data.room!;
    expect(room).toMatchObject({
      status: "playing",
      result: null,
      draw_offer: null,
    });
  });
  it("förhindrar klientstyrd tid och bevarar gamla tioteckenskoder", async () => {
    const room = await pair(10);
    expect(
      (await call(white, { action: "get", id: room.id, white_ms: 9999999 }))
        .status,
    ).toBe(400);
    await empty();
    expect(
      (await call(white, { action: "create", color: "w", clock_minutes: -1 }))
        .status,
    ).toBe(400);
    const host = await call(white, { action: "create", color: "w" });
    await db.query(
      "update chess_private.room_codes set code='ABCDEFGH23' where room_id=$1",
      [host.data.room!.id],
    );
    expect(
      (await call(black, { action: "join", code: "ABCDEFGH23" })).status,
    ).toBe(200);
  });
  it("provar en ny kod vid slumpkollision utan att lämna ett extra rum", async () => {
    await empty();
    const first = await call(outsider, { action: "create", color: "w" });
    let attempts = 0;
    const collisionHandler = roomHandler({
      authenticate: async () => white,
      store,
      code: () => (++attempts === 1 ? first.data.code! : "ZZZZZ2"),
    });
    const response = await collisionHandler(
      new Request("https://example.test", {
        method: "POST",
        headers: { Authorization: "Bearer test" },
        body: JSON.stringify({ action: "create", color: "w" }),
      }),
    );
    expect(response.status).toBe(200);
    expect((await response.json()).code).toBe("ZZZZZ2");
    expect(attempts).toBe(2);
    expect(
      (
        await db.query(
          "select id from public.chess_rooms where creator_id=$1",
          [white],
        )
      ).rows,
    ).toHaveLength(1);
  });
  it("ger bara en plats och ett drag vid samtidiga försök", async () => {
    await empty();
    const host = await call(white, { action: "create", color: "w" });
    const joins = await Promise.all([
      call(black, { action: "join", code: host.data.code }),
      call(outsider, { action: "join", code: host.data.code }),
    ]);
    expect(joins.map((result) => result.status).sort()).toEqual([200, 404]);
    const room = joins.find((result) => result.status === 200)!.data.room!;
    const moves = await Promise.all([
      move(room, white, "e2e4"),
      move(room, white, "d2d4"),
    ]);
    expect(moves.map((result) => result.status).sort()).toEqual([200, 409]);
    expect(
      (await call(white, { action: "get", id: room.id })).data.room!.moves,
    ).toHaveLength(1);
  });
  it("kräver förvandlingsval och godtar även en springare", async () => {
    let room = await pair();
    for (const uci of [
      "a2a4",
      "h7h5",
      "a4a5",
      "h5h4",
      "a5a6",
      "h4h3",
      "a6b7",
      "h3g2",
    ])
      room = (await move(room, room.moves.length % 2 ? black : white, uci)).data
        .room!;
    expect((await move(room, white, "b7a8")).data.error).toBe("illegal_move");
    const promoted = await move(room, white, "b7a8n");
    expect(promoted.status).toBe(200);
    expect(replay(promoted.data.room!.moves).get("a8")?.type).toBe("n");
  });
  it("avvisar saknad/förfalskad inloggning innan databasen används", async () => {
    expect(
      (
        await handler(
          new Request("https://example.test", { method: "POST", body: "{}" }),
        )
      ).status,
    ).toBe(401);
    expect((await call("forged", { action: "resume" })).status).toBe(401);
  });
  it("skapar privat kod, låter skaparen välja svart och återanvänder samma aktiva parti", async () => {
    await empty();
    const first = await call(white, { action: "create", color: "b" });
    const again = await call(white, { action: "create", color: "w" });
    expect(first.data.code).toMatch(/^[A-HJ-NP-Z2-9]{6}$/);
    expect(first.data.color).toBe("b");
    expect(again.data.room!.id).toBe(first.data.room!.id);
    expect(again.data.code).toBe(first.data.code);
    expect(
      (await call(white, { action: "join", code: first.data.code })).data.error,
    ).toBe("own_room");
    const joined = await call(black, { action: "join", code: first.data.code });
    expect(joined.data.color).toBe("w");
    expect(joined.data.room!.white_id).toBe(black);
    expect(
      (await call(outsider, { action: "join", code: first.data.code })).data
        .error,
    ).toBe("not_found");
    expect(
      (await call(black, { action: "join", code: first.data.code })).data.room!
        .version,
    ).toBe(1);
  });
  it("nekar utomstående och klientskrivningar genom RLS och RPC-behörighet", async () => {
    const room = await pair();
    expect((await call(outsider, { action: "get", id: room.id })).status).toBe(
      404,
    );
    await db.exec("set role authenticated");
    try {
      await db.query("select set_config('request.jwt.claim.sub', $1, false)", [
        outsider,
      ]);
      expect(
        (await db.query("select * from public.chess_rooms")).rows,
      ).toHaveLength(0);
      await db.query("select set_config('request.jwt.claim.sub', $1, false)", [
        white,
      ]);
      expect(
        (await db.query("select * from public.chess_rooms")).rows,
      ).toHaveLength(1);
      await expect(
        db.query("update public.chess_rooms set result = '1-0' where id = $1", [
          room.id,
        ]),
      ).rejects.toThrow(/permission denied/);
      await expect(
        db.query(
          "insert into public.chess_rooms(creator_id,white_id) values ($1,$1)",
          [white],
        ),
      ).rejects.toThrow(/permission denied/);
      await expect(
        db.query("select * from chess_private.room_codes"),
      ).rejects.toThrow(/permission denied/);
      await expect(
        db.query("select public.chess_room_command($1,'resume')", [white]),
      ).rejects.toThrow(/permission denied/);
    } finally {
      await db.exec("reset role");
    }
    await db.exec("set role anon");
    try {
      await expect(
        db.query("select * from public.chess_rooms"),
      ).rejects.toThrow(/permission denied/);
    } finally {
      await db.exec("reset role");
    }
  });
  it("servern nekar fel tur, olagligt drag och förfalskat resultat/identitet", async () => {
    const room = await pair();
    expect((await move(room, black, "e7e5")).data.error).toBe("not_your_turn");
    expect((await move(room, white, "e2e5")).data.error).toBe("illegal_move");
    expect((await move(room, white, "e2e4q")).data.error).toBe("illegal_move");
    expect(
      (
        await call(white, {
          action: "move",
          id: room.id,
          version: 1,
          uci: "e2e4",
          request: crypto.randomUUID(),
          result: "1-0",
          actor: black,
        })
      ).status,
    ).toBe(400);
    expect(
      (await call(white, { action: "get", id: room.id })).data.room!.moves,
    ).toEqual([]);
  });
  it("bekräftar varje drag, upprepar ett kvitto säkert och avvisar en gammal version", async () => {
    const room = await pair();
    const request = crypto.randomUUID();
    const first = await move(room, white, "e2e4", request);
    expect(first.status).toBe(200);
    expect(first.data.room!.moves).toEqual(["e2e4"]);
    expect((await move(room, white, "e2e4", request)).data.room!.version).toBe(
      2,
    );
    expect((await move(room, white, "d2d4")).status).toBe(409);
    // The database also refuses a stale CAS if two validated HTTP requests race.
    await expect(
      store.command({
        p_actor: white,
        p_action: "commit",
        p_id: room.id,
        p_version: room.version,
        p_request: crypto.randomUUID(),
        p_moves: ["d2d4"],
        p_status: "playing",
      }),
    ).rejects.toThrow("conflict");
    expect(
      (await move(first.data.room!, black, "e7e5")).data.room!.moves,
    ).toEqual(["e2e4", "e7e5"]);
    expect((await call(black, { action: "resume" })).data.room!.moves).toEqual([
      "e2e4",
      "e7e5",
    ]);
  });
  it("avgör schackmatt på servern och låser båda spelarnas fortsatta drag", async () => {
    let room = await pair();
    for (const [actor, uci] of [
      [white, "f2f3"],
      [black, "e7e5"],
      [white, "g2g4"],
      [black, "d8h4"],
    ]) {
      const next = await move(room, actor, uci);
      expect(next.status).toBe(200);
      room = next.data.room!;
    }
    expect(room).toMatchObject({
      status: "finished",
      result: "0-1",
      reason: "checkmate",
    });
    expect((await move(room, white, "a2a3")).status).toBe(409);
  });
  it("räknar upprepning från hela historiken och accepterar rockad och en passant", async () => {
    let room = await pair();
    for (const uci of [
      "g1f3",
      "g8f6",
      "f3g1",
      "f6g8",
      "g1f3",
      "g8f6",
      "f3g1",
      "f6g8",
    ]) {
      const actor = room.moves.length % 2 ? black : white;
      room = (await move(room, actor, uci)).data.room!;
    }
    expect(room).toMatchObject({
      status: "finished",
      result: "1/2-1/2",
      reason: "repetition",
    });
    expect(
      replay(["e2e4", "a7a6", "e4e5", "d7d5", "e5d6"]).get("d5"),
    ).toBeUndefined();
    expect(
      replay(["e2e4", "e7e5", "g1f3", "b8c6", "f1c4", "f8c5", "e1g1"]).get("f1")
        ?.type,
    ).toBe("r");
  });
  it("ger upp med bekräftat motståndarresultat och kan stänga en väntande kod", async () => {
    const room = await pair();
    const resigned = await call(white, {
      action: "resign",
      id: room.id,
      version: room.version,
      request: crypto.randomUUID(),
    });
    expect(resigned.data.room).toMatchObject({
      status: "finished",
      result: "0-1",
      reason: "resignation",
      moves: [],
    });
    const host = await call(white, { action: "create", color: "w" });
    expect(
      (
        await call(white, {
          action: "cancel",
          id: host.data.room!.id,
          version: 0,
          request: crypto.randomUUID(),
        })
      ).data.room!.status,
    ).toBe("cancelled");
    expect(
      (await call(black, { action: "join", code: host.data.code })).data.error,
    ).toBe("not_found");
  });
  it("låter inte en spelare ansluta till två aktiva partier", async () => {
    await pair();
    const other = await call(outsider, { action: "create", color: "w" });
    expect(
      (await call(black, { action: "join", code: other.data.code })).data.error,
    ).toBe("active_room");
  });
  it("utgångna partier kan varken läsas eller nås med kod", async () => {
    const room = await pair();
    await db.query(
      "update public.chess_rooms set expires_at = now() - interval '1 minute' where id = $1",
      [room.id],
    );
    expect((await call(white, { action: "get", id: room.id })).status).toBe(
      404,
    );
    expect((await call(white, { action: "resume" })).data.room).toBeNull();
    expect(() =>
      transition({ ...room, expires_at: "2020-01-01" }, white, "move", "e2e4"),
    ).toThrow("expired");
    await db.exec("set role authenticated");
    try {
      await db.query("select set_config('request.jwt.claim.sub', $1, false)", [
        white,
      ]);
      expect(
        (await db.query("select * from public.chess_rooms")).rows,
      ).toHaveLength(0);
    } finally {
      await db.exec("reset role");
    }
  });
  it("begränsar även misslyckade kodgissningar", async () => {
    await empty();
    for (let n = 0; n < 60; n++)
      expect(
        (await call(outsider, { action: "join", code: "ZZZZZZZZZZ" })).status,
      ).toBe(404);
    expect(
      (await call(outsider, { action: "join", code: "ZZZZZZZZZZ" })).status,
    ).toBe(429);
  });
});
