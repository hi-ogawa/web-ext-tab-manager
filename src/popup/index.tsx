import "../styles/index.ts";
import { createRoot } from "react-dom/client";
import { tinyassert } from "@hiogawa/utils";
import { App } from "./app";
import { initializeTabManagerRemote } from "../utils/tab-manager-remote";

async function main() {
  await initializeTabManagerRemote();
  const el = document.querySelector("#root");
  tinyassert(el);
  const root = createRoot(el);
  root.render(<App />);
}

main();
