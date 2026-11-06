// Pure logic for heap-lab: build a min-heap by insertion (sift-up), then repeated extract-min (sift-down).
export type HeapFrame = { heap: number[]; msg: string; extracted: number[] };

export function heapTrace(values: number[]): HeapFrame[] {
  const heap: number[] = [];
  const extracted: number[] = [];
  const frames: HeapFrame[] = [{ heap: [], msg: "空堆。从左到右逐个插入：新元素先放数组末尾，再与父节点比较、逐层上浮（sift-up）。", extracted: [] }];
  const swap = (a: number[], i: number, j: number) => { const t = a[i]!; a[i] = a[j]!; a[j] = t; };
  for (const v of values) {
    heap.push(v);
    let i = heap.length - 1, moves = 0;
    while (i > 0) { const p = Math.floor((i - 1) / 2); if (heap[p]! <= heap[i]!) break; swap(heap, p, i); i = p; moves++; }
    frames.push({ heap: [...heap], msg: `插入 ${v}：上浮 ${moves} 次后就位。堆顶（下标 0）是当前最小值 ${heap[0]}。`, extracted: [] });
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
    frames.push({ heap: [...heap], msg: `取出最小值 ${top}：末尾元素补到堆顶再逐层下沉（sift-down），恢复堆序。`, extracted: [...extracted] });
  }
  frames.push({ heap: [], msg: `全部取出完毕，取出顺序即从小到大：${extracted.join(", ")}——这正是堆排序的后半程。`, extracted: [...extracted] });
  return frames;
}

type P = Record<string, unknown>;
export function heapCase(_: P, i: P) {
  const values = (Array.isArray(i.values) ? (i.values as number[]) : []);
  const frames = heapTrace(values);
  const built = frames[values.length]!;
  return { heapAfterBuild: built.heap, sorted: frames[frames.length - 1]!.extracted };
}
