import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import type { Room } from "../../supabase/functions/chess-room/rules";
export type { Room };
export type Answer = {
  room: Room | null;
  server_now?: string;
  code?: string | null;
  color?: "w" | "b" | null;
};
export class FriendError extends Error {
  constructor(public code: string) {
    super(code);
  }
}

let client: SupabaseClient | undefined;
export function friendClient() {
  const url = import.meta.env.VITE_SUPABASE_URL;
  const key = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;
  if (!url || !key) throw new FriendError("not_configured");
  client ??= createClient(url, key, {
    auth: {
      storageKey: "schacklabbet.auth.v1",
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: false,
    },
  });
  return client;
}
let signingIn: Promise<string> | undefined;
async function token(create: boolean): Promise<string | null> {
  const auth = friendClient().auth;
  const { data, error } = await auth.getSession();
  if (error) throw new FriendError("session");
  if (data.session) return data.session.access_token;
  if (!create) return null;
  // One anonymous account per browser, reused across reloads and future games.
  signingIn ??= (async () => {
    const { data, error } = await auth.signInAnonymously();
    if (error || !data.session)
      throw new FriendError(error?.status === 429 ? "signup_limit" : "signin");
    return data.session.access_token;
  })().finally(() => {
    signingIn = undefined;
  });
  return signingIn;
}

export async function friendRequest(
  action: string,
  params: Record<string, unknown> = {},
  createSession = true,
): Promise<Answer> {
  const accessToken = await token(createSession);
  if (!accessToken) return { room: null };
  const response = await fetch(
    `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/chess-room`,
    {
      method: "POST",
      headers: {
        apikey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ action, ...params }),
      signal: AbortSignal.timeout(12000),
    },
  );
  const answer = await response.json();
  if (!response.ok) {
    if (response.status === 401) throw new FriendError("session");
    if (response.status === 404 && answer.code === "NOT_FOUND")
      throw new FriendError("not_configured");
    throw new FriendError(answer.error ?? "unavailable");
  }
  return answer as Answer;
}

export function watchFriendRoom(id: string, refresh: () => void) {
  const supabase = friendClient();
  const channel = supabase
    .channel(`chess-room:${id}`)
    .on(
      "postgres_changes",
      {
        event: "UPDATE",
        schema: "public",
        table: "chess_rooms",
        filter: `id=eq.${id}`,
      },
      refresh,
    )
    .subscribe((status) => {
      if (status === "SUBSCRIBED") refresh();
    });
  return () => {
    void supabase.removeChannel(channel);
  };
}

export function friendMessage(error: unknown): string {
  const code = error instanceof FriendError ? error.code : "unavailable";
  const messages: Record<string, string> = {
    not_configured:
      "Kompispartier behöver aktiveras av den som sköter webbplatsen. Försök igen senare.",
    signin: "Det gick inte att starta din spelplats. Försök igen om en stund.",
    signup_limit:
      "Många nya spelare har anslutit samtidigt. Vänta en stund eller be din lärare om hjälp.",
    session:
      "Din spelplats kunde inte bekräftas. Ladda om sidan och försök igen.",
    not_found:
      "Partiet hittades inte. Kontrollera koden med din kompis. Koden kan också ha gått ut.",
    expired:
      "Partiets tid har gått ut. Skapa ett nytt parti och dela den nya koden.",
    own_room:
      "Det här är ditt eget parti. Din kompis behöver öppna sidan på sin dator och skriva in koden.",
    active_room:
      "Du har redan ett pågående kompisparti. Ladda om sidan för att återuppta det.",
    conflict:
      "Brädet har uppdaterats. Titta på den nya ställningen innan du väljer drag.",
    not_your_turn:
      "Vänta på din tur. Brädet uppdateras när din kompis har flyttat.",
    illegal_move: "Pjäsen kan inte gå dit. Välj en annan ruta.",
    rate_limited:
      "Det blev många försök på kort tid. Vänta en stund och prova igen.",
  };
  return (
    messages[code] ??
    "Kontakten med partiet bröts. Kontrollera nätverket och tryck på Försök igen. Dina bekräftade drag finns kvar."
  );
}

export const normalizeCode = (code: string) =>
  code.toUpperCase().replace(/[\s-]/g, "");
