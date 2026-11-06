// Shared perf-case definitions for the coding module (used by the browser runner and scripts/verify-coding.mts).
export type PerfKind = "tape-large" | "counters-large" | "frog-huge";
export function perfArgs(kind: PerfKind): unknown[] {
  switch (kind) {
    case "tape-large": return [Array.from({ length: 30000 }, (_, i) => (i % 7) - 3)];
    case "counters-large": { const N = 50000; const A: number[] = []; for (let i = 0; i < 50000; i++) { A.push(N + 1); A.push(1); } return [N, A]; }
    case "frog-huge": return [1, 1000000000, 1];
  }
}
export function perfCheck(kind: PerfKind, result: unknown): boolean {
  switch (kind) {
    case "tape-large": return typeof result === "number";
    case "counters-large": return Array.isArray(result) && result[0] === 50000;
    case "frog-huge": return result === 999999999;
  }
}
export const PERF_LIMIT_MS = 1000;
export const deepEqual = (a: unknown, b: unknown) => JSON.stringify(a) === JSON.stringify(b);
