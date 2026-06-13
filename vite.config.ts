import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  base: process.env.GITHUB_PAGES === "true" ? "/Create-Ratio-Calculator/" : "/",
  test: {
    environment: "jsdom",
    globals: true,
    include: ["src/tests/**/*.test.ts", "scripts/**/*.test.ts"]
  }
});
