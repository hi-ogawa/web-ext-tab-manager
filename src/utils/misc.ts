import { isNil } from "lodash";

export function generateId(): string {
  return Math.floor(Math.random() * Number.MAX_SAFE_INTEGER)
    .toString(16)
    .slice(0, 12)
    .padStart(12, "0");
}

export function isNonNil<T>(value: T): value is NonNullable<T> {
  return !isNil(value);
}

export function cls(...args: unknown[]): string {
  return args.filter(Boolean).join(" ");
}

export function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
