import { roomHandler } from "./handler.ts";
import { RoomError } from "./rules.ts";

declare const Deno: {
  env: { get(key: string): string | undefined };
  serve(handler: (request: Request) => Promise<Response>): void;
};
const url = Deno.env.get("SUPABASE_URL")!;
const anon = Deno.env.get("SUPABASE_ANON_KEY")!;
const service = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

Deno.serve(
  roomHandler({
    authenticate: async (token) => {
      // A decoded JWT is not authentication. Check it with the project's Auth server.
      const response = await fetch(`${url}/auth/v1/user`, {
        headers: { apikey: anon, Authorization: `Bearer ${token}` },
        signal: AbortSignal.timeout(10000),
      });
      if (!response.ok) return null;
      const user = await response.json();
      return user.role === "authenticated" ? user.id : null;
    },
    store: {
      async command(params) {
        const response = await fetch(`${url}/rest/v1/rpc/chess_room_command`, {
          method: "POST",
          headers: {
            apikey: service,
            Authorization: `Bearer ${service}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify(params),
          signal: AbortSignal.timeout(10000),
        });
        const data = await response.json();
        if (!response.ok || data.error) {
          const code = String(data.error ?? data.message);
          const statuses: Record<string, number> = {
            not_found: 404,
            expired: 410,
            conflict: 409,
            code_collision: 409,
            full: 409,
            own_room: 409,
            active_room: 409,
            rate_limited: 429,
          };
          if (code in statuses) throw new RoomError(code, statuses[code]);
          throw new Error("Database command failed");
        }
        return data;
      },
    },
    code: () => {
      // 32 symbols, 30 random bits. No ambiguous I, O, 0 or 1.
      const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
      return Array.from(
        crypto.getRandomValues(new Uint8Array(6)),
        (byte) => alphabet[byte & 31],
      ).join("");
    },
  }),
);
