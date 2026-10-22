// Explicit live smoke test: creates three anonymous test accounts and two short games.
// Uses only the same public key as the website. Tokens stay in memory and are never printed.
import assert from "node:assert/strict";
import { createClient } from "@supabase/supabase-js";
if (!process.argv.includes("--live"))
  throw new Error("Use --live to test the configured Supabase project.");
try {
  process.loadEnvFile(".env.local");
} catch {
  /* CI/terminal may supply variables. */
}
const url = process.env.VITE_SUPABASE_URL;
const key = process.env.VITE_SUPABASE_PUBLISHABLE_KEY;
assert.ok(url && key, "Public Supabase configuration is required");
async function signup() {
  const response = await fetch(`${url}/auth/v1/signup`, {
    method: "POST",
    headers: { apikey: key, "Content-Type": "application/json" },
    body: "{}",
    signal: AbortSignal.timeout(15000),
  });
  assert.equal(
    response.status,
    200,
    "Anonymous sign-in must succeed (check school IP limit if 429)",
  );
  return response.json();
}
async function request(user, action, params = {}) {
  const response = await fetch(`${url}/functions/v1/chess-room`, {
    method: "POST",
    headers: {
      apikey: key,
      Authorization: `Bearer ${user?.access_token ?? "forged"}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ action, ...params }),
    signal: AbortSignal.timeout(20000),
  });
  return { status: response.status, data: await response.json() };
}
const [host, guest, outsider] = await Promise.all([
  signup(),
  signup(),
  signup(),
]);
assert.equal((await request(null, "resume")).status, 401);
const created = await request(host, "create", { color: "w" });
assert.equal(created.status, 200, JSON.stringify(created.data));
assert.match(created.data.code, /^[A-HJ-NP-Z2-9]{10}$/);
let room = created.data.room;
assert.equal(
  (await request(host, "join", { code: created.data.code })).data.error,
  "own_room",
);
assert.equal((await request(outsider, "get", { id: room.id })).status, 404);
const outsideRows = await fetch(`${url}/rest/v1/chess_rooms?id=eq.${room.id}`, {
  headers: { apikey: key, Authorization: `Bearer ${outsider.access_token}` },
});
assert.equal(outsideRows.status, 200);
assert.deepEqual(await outsideRows.json(), []);
const forgedWrite = await fetch(`${url}/rest/v1/chess_rooms?id=eq.${room.id}`, {
  method: "PATCH",
  headers: {
    apikey: key,
    Authorization: `Bearer ${host.access_token}`,
    "Content-Type": "application/json",
  },
  body: JSON.stringify({ result: "1-0" }),
});
assert.equal(forgedWrite.status, 403);
const forgedRpc = await fetch(`${url}/rest/v1/rpc/chess_room_command`, {
  method: "POST",
  headers: {
    apikey: key,
    Authorization: `Bearer ${host.access_token}`,
    "Content-Type": "application/json",
  },
  body: JSON.stringify({ p_actor: guest.user.id, p_action: "resume" }),
});
assert.equal(forgedRpc.status, 403);

const realtime = createClient(url, key, {
  auth: { persistSession: false, autoRefreshToken: false },
});
await realtime.realtime.setAuth(host.access_token);
const versions = [];
let subscription;
try {
  await new Promise((resolve, reject) => {
    const timer = setTimeout(
      () => reject(new Error("Realtime subscription timed out")),
      15000,
    );
    subscription = realtime
      .channel(`live-check:${room.id}`)
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "chess_rooms",
          filter: `id=eq.${room.id}`,
        },
        (payload) => versions.push(payload.new.version),
      )
      .subscribe((status) => {
        if (status === "SUBSCRIBED") {
          clearTimeout(timer);
          resolve();
        }
        if (status === "CHANNEL_ERROR" || status === "TIMED_OUT") {
          clearTimeout(timer);
          reject(new Error(`Realtime: ${status}`));
        }
      });
  });
  const joined = await request(guest, "join", { code: created.data.code });
  assert.equal(joined.status, 200);
  room = joined.data.room;
  assert.equal(
    (await request(outsider, "join", { code: created.data.code })).status,
    404,
  );
  assert.equal(
    (
      await request(guest, "move", {
        id: room.id,
        version: room.version,
        uci: "e7e5",
        request: crypto.randomUUID(),
      })
    ).status,
    409,
  );
  assert.equal(
    (
      await request(host, "move", {
        id: room.id,
        version: room.version,
        uci: "e2e5",
        request: crypto.randomUUID(),
      })
    ).status,
    400,
  );
  const requestId = crypto.randomUUID();
  const moves = await Promise.all([
    request(host, "move", {
      id: room.id,
      version: room.version,
      uci: "e2e4",
      request: requestId,
    }),
    request(host, "move", {
      id: room.id,
      version: room.version,
      uci: "d2d4",
      request: crypto.randomUUID(),
    }),
  ]);
  assert.deepEqual(moves.map((move) => move.status).sort(), [200, 409]);
  room = moves.find((move) => move.status === 200).data.room;
  assert.equal(room.moves.length, 1);
  assert.deepEqual(
    (await request(guest, "resume")).data.room.moves,
    room.moves,
  );
  const until = Date.now() + 12000;
  while (!versions.includes(room.version) && Date.now() < until)
    await new Promise((resolve) => setTimeout(resolve, 200));
  assert.ok(
    versions.includes(room.version),
    "Participant receives RLS-filtered Realtime update",
  );
  const end = await request(host, "resign", {
    id: room.id,
    version: room.version,
    request: crypto.randomUUID(),
  });
  assert.equal(end.status, 200);
  assert.equal(end.data.room.result, "0-1");
} finally {
  if (subscription) await realtime.removeChannel(subscription);
  realtime.realtime.disconnect();
}

const second = await request(host, "create", { color: "b" });
assert.equal(second.status, 200);
const joined = await request(guest, "join", { code: second.data.code });
assert.equal(joined.data.color, "w");
room = joined.data.room;
for (const [user, uci] of [
  [guest, "f2f3"],
  [host, "e7e5"],
  [guest, "g2g4"],
  [host, "d8h4"],
]) {
  const result = await request(user, "move", {
    id: room.id,
    version: room.version,
    uci,
    request: crypto.randomUUID(),
  });
  assert.equal(result.status, 200, JSON.stringify(result.data));
  room = result.data.room;
}
assert.equal(room.status, "finished");
assert.equal(room.result, "0-1");
assert.equal(room.reason, "checkmate");
assert.equal(
  (
    await request(guest, "move", {
      id: room.id,
      version: room.version,
      uci: "a2a3",
      request: crypto.randomUUID(),
    })
  ).status,
  409,
);
console.log(
  "PASS: live anonymous Auth, private codes, both colors, outsider RLS isolation, denied client writes/RPC, legal moves, atomic conflict, resume, Realtime, resignation and server-confirmed checkmate.",
);
