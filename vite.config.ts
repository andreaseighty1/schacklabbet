import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";
import { loadEnv } from "vite";
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "VITE_");
  return {
    plugins: [react()],
    base: process.env.VITE_BASE_PATH || env.VITE_BASE_PATH || "/",
    test: { environment: "node", include: ["src/**/*.test.ts"] },
  };
});
