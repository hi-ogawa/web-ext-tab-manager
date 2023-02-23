import { tinyassert } from "@hiogawa/utils";
import { range } from "lodash";

export function generateId(): string {
  return Math.floor(Math.random() * Number.MAX_SAFE_INTEGER)
    .toString(16)
    .slice(0, 12)
    .padStart(12, "0");
}

export function cls(...args: unknown[]): string {
  return args.filter(Boolean).join(" ");
}

export function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export function retryPromise(
  limit: number,
  backoff: (i: number) => number = retryBackoffExponential(1, 2)
) {
  return async function wrapper<T>(run: () => Promise<T>): Promise<T> {
    for (const i of range(limit)) {
      try {
        return await run();
      } catch (error: any) {
        console.error("retryPromise", i, error);
        await sleep(backoff(i));
        continue;
      }
    }
    throw new Error("unreachable");
  };
}

function retryBackoffExponential(
  min: number,
  base: number
): (i: number) => number {
  tinyassert(min > 0);
  return (i: number) => min * base ** i;
}
