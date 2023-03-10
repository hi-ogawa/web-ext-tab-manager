import { tinyassert } from "@hiogawa/utils";
import { createRoot } from "react-dom/client";
import "../styles/index.ts";
import { initializeLogger } from "../utils/logger";
import { initializeTabManagerRemote } from "../utils/tab-manager-remote";
import { initializeTheme } from "../utils/theme-script.js";
import { App } from "./app";

async function main() {
  initializeTheme();
  initializeLogger();
  initializeTabManagerRemote();
  const el = document.querySelector("#root");
  tinyassert(el);
  const root = createRoot(el);
  root.render(<App />);
}

main();
