export async function checkSupabase(
  signal?: AbortSignal,
): Promise<{ connected: boolean; anonymous: boolean; message: string }> {
  const url = import.meta.env.VITE_SUPABASE_URL;
  const key = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;
  if (!url || !key)
    return {
      connected: false,
      anonymous: false,
      message: "Supabase är inte konfigurerat i denna installation.",
    };
  const response = await fetch(`${url}/auth/v1/settings`, {
    headers: { apikey: key },
    signal: signal ?? AbortSignal.timeout(10000),
  });
  if (!response.ok)
    throw new Error("Supabase-anslutningen kunde inte verifieras.");
  const data = (await response.json()) as {
    external?: { anonymous_users?: boolean };
    disable_signup?: boolean;
  };
  const anonymous =
    data.external?.anonymous_users === true && !data.disable_signup;
  return {
    connected: true,
    anonymous,
    message: anonymous
      ? "Anslutningen fungerar och anonyma inloggningar är aktiverade."
      : "Anslutningen fungerar. Aktivera anonyma inloggningar i Supabase.",
  };
}
