// Pure logic for heap-lab: build a min-heap by insertion (sift-up), then repeated extract-min (sift-down).
import { labFmt, labMsg, type LabLang } from "./messages.ts";
export type HeapFrame = { heap: number[]; msg: string; extracted: number[] };

export function heapTrace(values: number[], lang: LabLang = "zh"): HeapFrame[] {
  const M = labMsg(lang).heap;
  const heap: number[] = [];
  const extracted: number[] = [];
  const frames: HeapFrame[] = [{ heap: [], msg: M.empty, extracted: [] }];
  const swap = (a: number[], i: number, j: number) => { const t = a[i]!; a[i] = a[j]!; a[j] = t; };
  for (const v of values) {
    heap.push(v);
    let i = heap.length - 1, moves = 0;
    while (i > 0) { const p = Math.floor((i - 1) / 2); if (heap[p]! <= heap[i]!) break; swap(heap, p, i); i = p; moves++; }
    frames.push({ heap: [...heap], msg: labFmt(M.insert, { v, moves, top: heap[0]! }), extracted: [] });
  }
  while (heap.length) {
    const top = heap[0]!;
    const last = heap.pop()!;
    extracted.push(top);
    if (heap.length) {
      heap[0] = last;
      let i = 0;
      for (;;) {
        const l = 2 * i + 1, r = l + 1; let m = i;
        if (l < heap.length && heap[l]! < heap[m]!) m = l;
        if (r < heap.length && heap[r]! < heap[m]!) m = r;
        if (m === i) break; swap(heap, i, m); i = m;
      }
    }
    frames.push({ heap: [...heap], msg: labFmt(M.extract, { top }), extracted: [...extracted] });
  }
  frames.push({ heap: [], msg: labFmt(M.done, { list: extracted.join(", ") }), extracted: [...extracted] });
  return frames;
}

type P = Record<string, unknown>;
export function heapCase(_: P, i: P) {
  const values = (Array.isArray(i.values) ? (i.values as number[]) : []);
  const frames = heapTrace(values);
  const built = frames[values.length]!;
  return { heapAfterBuild: built.heap, sorted: frames[frames.length - 1]!.extracted };
}
