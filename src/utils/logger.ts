import { Roarr, ROARR } from "roarr";
import { createLogWriter } from "@roarr/browser-log-writer";
import { tinyassert } from "@hiogawa/utils";

// https://github.com/gajus/roarr

export const logger = Roarr;

export function initializeLogger() {
  ROARR.write = createLogWriter({
    // fake `window.localStorage.setItem("ROARR_LOG", "true")` for service worker
    storage: {
      getItem: (name: string): string | null => {
        return name === "ROARR_LOG" ? "true" : null;
      },
      setItem: (_name: string, _value: string): void => {
        tinyassert(false, "unused");
      },
    },
  });
}
