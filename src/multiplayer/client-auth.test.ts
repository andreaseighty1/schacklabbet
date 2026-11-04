import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const auth = vi.hoisted(() => ({
  getSession: vi.fn(),
  signInAnonymously: vi.fn(),
  signOut: vi.fn(),
}));
vi.mock("@supabase/supabase-js", () => ({ createClient: () => ({ auth }) }));
beforeEach(() => {
  vi.resetModules();
  vi.clearAllMocks();
  vi.stubEnv("VITE_SUPABASE_URL", "https://example.supabase.co");
  vi.stubEnv("VITE_SUPABASE_PUBLISHABLE_KEY", "public-test-key");
  vi.stubEnv("VITE_TURNSTILE_SITE_KEY", "public-test-sitekey");
  auth.getSession.mockResolvedValue({ data: { session: null }, error: null });
  auth.signInAnonymously.mockResolvedValue({
    data: { session: { access_token: "session-token" } },
    error: null,
  });
  auth.signOut.mockResolvedValue({ error: null });
  vi.stubGlobal(
    "fetch",
    vi.fn().mockImplementation(async () => Response.json({ room: null })),
  );
});
afterEach(() => {
  vi.unstubAllEnvs();
  vi.unstubAllGlobals();
});

describe("säkerhetskontroll vid ny anonym spelplats", () => {
  it("återanvänder sparad inloggning utan ny kontroll", async () => {
    auth.getSession.mockResolvedValue({
      data: { session: { access_token: "existing-token" } },
      error: null,
    });
    const proof = vi.fn();
    const { friendRequest } = await import("./client");
    await friendRequest("resume", {}, true, proof);
    expect(proof).not.toHaveBeenCalled();
    expect(auth.signInAnonymously).not.toHaveBeenCalled();
    expect(fetch).toHaveBeenCalledWith(
      expect.any(String),
      expect.objectContaining({
        headers: expect.objectContaining({
          Authorization: "Bearer existing-token",
        }),
      }),
    );
  });
  it("skickar kontrollens engångsbevis till Supabase Auth", async () => {
    const { friendRequest } = await import("./client");
    await friendRequest(
      "create",
      { color: "w" },
      true,
      async () => "proof-token",
    );
    expect(auth.signInAnonymously).toHaveBeenCalledWith({
      options: { captchaToken: "proof-token" },
    });
    expect(fetch).toHaveBeenCalledTimes(1);
  });
  it("skapar inget konto utan bevis och tillåter nytt försök efter avbrott", async () => {
    const { friendRequest } = await import("./client");
    await expect(friendRequest("create")).rejects.toMatchObject({
      code: "captcha",
    });
    await expect(
      friendRequest("create", {}, true, async () => ""),
    ).rejects.toMatchObject({ code: "captcha" });
    expect(auth.signInAnonymously).not.toHaveBeenCalled();
    expect(fetch).not.toHaveBeenCalled();
    await friendRequest("create", {}, true, async () => "fresh-proof");
    expect(auth.signInAnonymously).toHaveBeenCalledTimes(1);
  });
  it("delar en pågående kontroll mellan samtidiga anrop", async () => {
    let resolve!: (value: string) => void;
    const proof = vi.fn(
      () =>
        new Promise<string>((done) => {
          resolve = done;
        }),
    );
    const { friendRequest } = await import("./client");
    const first = friendRequest("resume", {}, true, proof);
    const second = friendRequest("resume", {}, true, proof);
    await vi.waitFor(() => expect(proof).toHaveBeenCalledTimes(1));
    resolve("one-proof");
    await Promise.all([first, second]);
    expect(auth.signInAnonymously).toHaveBeenCalledTimes(1);
  });
  it("skapar inget konto genom bakgrundsuppdatering", async () => {
    const proof = vi.fn();
    const { friendRequest } = await import("./client");
    expect(await friendRequest("resume", {}, false, proof)).toEqual({
      room: null,
    });
    expect(proof).not.toHaveBeenCalled();
    expect(auth.signInAnonymously).not.toHaveBeenCalled();
    expect(fetch).not.toHaveBeenCalled();
  });
  it("visar separat fel för nekat bevis och delat skolnäts gräns", async () => {
    const { friendRequest } = await import("./client");
    auth.signInAnonymously.mockResolvedValueOnce({
      data: { session: null },
      error: { status: 400, code: "captcha_failed" },
    });
    await expect(
      friendRequest("create", {}, true, async () => "bad"),
    ).rejects.toMatchObject({ code: "captcha" });
    auth.signInAnonymously.mockResolvedValueOnce({
      data: { session: null },
      error: { status: 429 },
    });
    await expect(
      friendRequest("create", {}, true, async () => "valid"),
    ).rejects.toMatchObject({ code: "signup_limit" });
  });
  it("raderar bara lokal ogiltig session och spelar inte om ett nekat drag automatiskt", async () => {
    auth.getSession.mockResolvedValue({
      data: { session: { access_token: "deleted-user" } },
      error: null,
    });
    vi.mocked(fetch).mockResolvedValue(
      Response.json({ error: "unauthorized" }, { status: 401 }),
    );
    const { friendRequest } = await import("./client");
    await expect(friendRequest("move", { uci: "e2e4" })).rejects.toMatchObject({
      code: "session",
    });
    expect(auth.signOut).toHaveBeenCalledWith({ scope: "local" });
    expect(auth.signInAnonymously).not.toHaveBeenCalled();
    expect(fetch).toHaveBeenCalledTimes(1);
  });
});
