// Pure logic for binary-search-lab. No imports so scripts/lab-selftest.mts can load it with plain Node.
export type BsStep = { lo: number; hi: number; mid: number; result: "lt" | "gt" | "eq" | "empty"; comparisons: number };
export const BS_DEFAULT = [2, 5, 8, 12, 16, 23, 38, 56];

/** Closed-interval [lo, hi] binary search trace; last step has result eq (found) or empty (range exhausted). */
export function bsTrace(arr: number[], target: number): BsStep[] {
  const steps: BsStep[] = [];
  let lo = 0, hi = arr.length - 1, cmp = 0;
  while (lo <= hi) {
    const mid = lo + Math.floor((hi - lo) / 2);
    cmp++;
    if (arr[mid] === target) { steps.push({ lo, hi, mid, result: "eq", comparisons: cmp }); return steps; }
    if (arr[mid]! < target) { steps.push({ lo, hi, mid, result: "lt", comparisons: cmp }); lo = mid + 1; }
    else { steps.push({ lo, hi, mid, result: "gt", comparisons: cmp }); hi = mid - 1; }
  }
  steps.push({ lo, hi, mid: -1, result: "empty", comparisons: cmp });
  return steps;
}
export function bsResult(arr: number[], target: number) {
  const steps = bsTrace(arr, target);
  const last = steps[steps.length - 1]!;
  const found = last.result === "eq";
  const idx = arr.indexOf(target);
  return { found, index: found ? idx : -1, insertAt: found ? idx : steps[steps.length - 1]!.lo, comparisons: last.comparisons, linear: found ? idx + 1 : arr.length, steps };
}
type P = Record<string, unknown>;
export function bsCase(p: P, i: P) {
  const arr = (Array.isArray(p.array) ? (p.array as number[]) : BS_DEFAULT);
  const r = bsResult(arr, typeof i.target === "number" ? i.target : 0);
  return { found: r.found, index: r.index, comparisons: r.comparisons, linear: r.linear };
}
