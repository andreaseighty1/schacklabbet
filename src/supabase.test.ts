import { afterEach, describe, it, expect, vi } from "vitest";
import { checkSupabase } from "./supabase";
afterEach(() => {
  vi.unstubAllGlobals();
  vi.unstubAllEnvs();
});
describe("Supabase-konfiguration", () => {
  it("fungerar utan konfiguration och gör inget nätverksanrop", async () => {
    vi.stubEnv("VITE_SUPABASE_URL", "");
    const fetch = vi.fn();
    vi.stubGlobal("fetch", fetch);
    expect((await checkSupabase()).connected).toBe(false);
    expect(fetch).not.toHaveBeenCalled();
  });
  it("kontrollerar inställningar utan att skapa elevkonton", async () => {
    vi.stubEnv("VITE_SUPABASE_URL", "https://example.supabase.co");
    vi.stubEnv("VITE_SUPABASE_PUBLISHABLE_KEY", "sb_publishable_test");
    const fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        external: { anonymous_users: true },
        disable_signup: false,
      }),
    });
    vi.stubGlobal("fetch", fetch);
    expect((await checkSupabase()).anonymous).toBe(true);
    expect(fetch.mock.calls[0][0]).toBe(
      "https://example.supabase.co/auth/v1/settings",
    );
  });
  it("skiljer avstängd registrering från fungerande anslutning", async () => {
    vi.stubEnv("VITE_SUPABASE_URL", "https://example.supabase.co");
    vi.stubEnv("VITE_SUPABASE_PUBLISHABLE_KEY", "sb_publishable_test");
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({
          external: { anonymous_users: true },
          disable_signup: true,
        }),
      }),
    );
    expect(await checkSupabase()).toMatchObject({
      connected: true,
      anonymous: false,
    });
  });
});
