import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";
import { fileURLToPath } from "node:url";

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@": fileURLToPath(new URL("./src", import.meta.url)),
      // `server-only` throws outside a React Server Components build.
      "server-only": fileURLToPath(new URL("./test/empty.ts", import.meta.url)),
    },
  },
  test: {
    environment: "node",
    setupFiles: ["./test/setup.ts"],
    include: ["src/**/*.test.{ts,tsx}"],
  },
});
