// Pure logic for sort-compare lab: step snapshots + cumulative comparison counts for merge sort vs quick sort.
export type SortStep = { arr: number[]; comparisons: number; active: number[]; done: boolean };
export const SORT_PRESETS: Record<string, number[]> = {
  mixed: [38, 27, 43, 3, 9, 82, 10, 15],
  sorted: [3, 9, 10, 15, 27, 38, 43, 82],
  reversed: [82, 43, 38, 27, 15, 10, 9, 3],
};

export function mergeSteps(input: number[]): SortStep[] {
  const a = [...input]; let cmp = 0;
  const steps: SortStep[] = [{ arr: [...a], comparisons: 0, active: [], done: false }];
  const rec = (lo: number, hi: number) => {
    if (hi - lo <= 1) return;
    const mid = (lo + hi) >> 1; rec(lo, mid); rec(mid, hi);
    const L = a.slice(lo, mid), R = a.slice(mid, hi); let i = 0, j = 0, k = lo;
    while (i < L.length && j < R.length) { cmp++; a[k++] = L[i]! <= R[j]! ? L[i++]! : R[j++]!; }
    while (i < L.length) a[k++] = L[i++]!;
    while (j < R.length) a[k++] = R[j++]!;
    steps.push({ arr: [...a], comparisons: cmp, active: Array.from({ length: hi - lo }, (_, x) => lo + x), done: false });
  };
  rec(0, a.length);
  steps.push({ arr: [...a], comparisons: cmp, active: [], done: true });
  return steps;
}

export function quickSteps(input: number[], pivot: "last" | "first" = "last"): SortStep[] {
  const a = [...input]; let cmp = 0;
  const steps: SortStep[] = [{ arr: [...a], comparisons: 0, active: [], done: false }];
  const rec = (lo: number, hi: number) => {
    if (lo >= hi) return;
    const pi = pivot === "last" ? hi : lo;
    const pv = a[pi]!;
    if (pi !== hi) { [a[pi], a[hi]] = [a[hi]!, a[pi]!]; }
    let i = lo;
    for (let j = lo; j < hi; j++) { cmp++; if (a[j]! < pv) { [a[i], a[j]] = [a[j]!, a[i]!]; i++; } }
    [a[i], a[hi]] = [a[hi]!, a[i]!];
    steps.push({ arr: [...a], comparisons: cmp, active: [i], done: false });
    rec(lo, i - 1); rec(i + 1, hi);
  };
  rec(0, a.length - 1);
  steps.push({ arr: [...a], comparisons: cmp, active: [], done: true });
  return steps;
}
type P = Record<string, unknown>;
export function sortCase(p: P, i: P) {
  const preset = typeof i.preset === "string" ? i.preset : (typeof p.preset === "string" ? p.preset : "mixed");
  const arr = SORT_PRESETS[preset] ?? SORT_PRESETS.mixed!;
  const pivot = (i.pivot === "first" || p.pivot === "first") ? "first" as const : "last" as const;
  const m = mergeSteps(arr), q = quickSteps(arr, pivot);
  return { mergeComparisons: m[m.length - 1]!.comparisons, quickComparisons: q[q.length - 1]!.comparisons };
}
