export function contentSecurityPolicy(
  supabaseUrl: string,
  turnstile: boolean,
): string {
  const connections = ["'self'"];
  if (supabaseUrl) {
    const api = new URL(supabaseUrl);
    if (api.protocol !== "https:")
      throw new Error("Production Supabase must use HTTPS");
    connections.push(api.origin, `wss://${api.host}`);
  }
  const challenge = turnstile ? " https://challenges.cloudflare.com" : "";
  return [
    "default-src 'none'",
    `script-src 'self' 'wasm-unsafe-eval'${challenge}`,
    "style-src 'self' 'unsafe-inline'",
    "img-src 'self' data:",
    "font-src 'self'",
    "media-src 'self'",
    "worker-src 'self'",
    `connect-src ${connections.join(" ")}${challenge}`,
    `frame-src ${turnstile ? "https://challenges.cloudflare.com" : "'none'"}`,
    "object-src 'none'",
    "base-uri 'none'",
    "form-action 'none'",
    "upgrade-insecure-requests",
  ].join("; ");
}
