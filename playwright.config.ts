import process from "node:process";
import { PlaywrightTestConfig } from "@playwright/test";

const config: PlaywrightTestConfig = {
  testDir: "./e2e",
  use: {
    trace: process.env["E2E_TRACE"] ? "on" : "off",
  },
};

export default config;
