import path from "path";
import tailwindcss from "@tailwindcss/vite";
import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";

const configuredBase = process.env.BASE_PATH;
const repository = process.env.GITHUB_REPOSITORY ?? "";
const base = configuredBase ?? (repository ? `/${repository.split("/").pop()}/` : "/");

// https://vite.dev/config/
export default defineConfig({
  base,
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  test: {
    environment: "jsdom",
    globals: true,
    setupFiles: ["./tests/setup-globals.ts"],
    include: [
      "src/**/*.{test,spec}.{js,ts,jsx,tsx}",
      "tests/**/*.{test,spec}.{js,ts,jsx,tsx}",
    ],
    exclude: ["tests/e2e/**/*"],
    server: {
      deps: {
        inline: ["msw"],
      },
    },
    coverage: {
      reporter: ["text", "lcov"],
    },
  },
});
