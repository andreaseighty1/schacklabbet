import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";
import { loadEnv } from "vite";
import { contentSecurityPolicy } from "./src/security/policy";
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "VITE_");
  return {
    plugins: [
      react(),
      {
        name: "production-security-policy",
        apply: "build",
        transformIndexHtml() {
          return [
            {
              tag: "meta",
              attrs: {
                "http-equiv": "Content-Security-Policy",
                content: contentSecurityPolicy(
                  process.env.VITE_SUPABASE_URL || env.VITE_SUPABASE_URL || "",
                  Boolean(
                    process.env.VITE_TURNSTILE_SITE_KEY ||
                    env.VITE_TURNSTILE_SITE_KEY,
                  ),
                ),
              },
              injectTo: "head-prepend",
            },
            {
              tag: "meta",
              attrs: {
                name: "referrer",
                content: "strict-origin-when-cross-origin",
              },
              injectTo: "head",
            },
          ];
        },
      },
    ],
    base: process.env.VITE_BASE_PATH || env.VITE_BASE_PATH || "/",
    test: { environment: "node", include: ["src/**/*.test.ts"] },
  };
});
