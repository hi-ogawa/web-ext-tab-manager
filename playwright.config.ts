import process from "node:process";
import { defineConfig } from "@playwright/test";

export default defineConfig({
  testDir: "./e2e",
  use: {
    trace: process.env["E2E_TRACE"] ? "on" : "off",
  },
  webServer: {
    reuseExistingServer: true,
    // TODO: race condition ("dev:background" has to finish before "dev:vite")
    command: `pnpm dev >> e2e.log 2>&1`,
    port: 18181,
  },
});
