import { describe, expect, it } from "vitest";
import { contentSecurityPolicy } from "./policy";

describe("webbläsarens produktionspolicy", () => {
  it("tillåter bara egna resurser, WASM och projektets API", () => {
    const policy = contentSecurityPolicy("https://example.supabase.co", false);
    expect(policy).toContain("default-src 'none'");
    expect(policy).toContain("script-src 'self' 'wasm-unsafe-eval';");
    expect(policy).toContain(
      "connect-src 'self' https://example.supabase.co wss://example.supabase.co;",
    );
    expect(policy).toContain("frame-src 'none'");
    expect(policy).not.toContain("'unsafe-eval'");
    expect(policy).not.toMatch(/script-src[^;]*'unsafe-inline'/);
    expect(policy).not.toContain("cloudflare");
  });
  it("tillåter Turnstile först när det är konfigurerat", () => {
    const policy = contentSecurityPolicy("", true);
    expect(policy).toContain("frame-src https://challenges.cloudflare.com");
    expect(policy).not.toContain("*.cloudflare.com");
  });
  it("vägrar oskyddat produktions-API", () => {
    expect(() =>
      contentSecurityPolicy("http://example.supabase.co", false),
    ).toThrow("HTTPS");
  });
});
