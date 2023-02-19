import { Roarr, ROARR } from "roarr";
import { createLogWriter } from "@roarr/browser-log-writer";

// https://github.com/gajus/roarr

export const logger = Roarr;

export function initializeLogger() {
  window.localStorage.setItem("ROARR_LOG", "true");
  ROARR.write = createLogWriter();
}
