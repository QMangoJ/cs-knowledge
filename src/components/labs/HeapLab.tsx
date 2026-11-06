"use client";
import { useEffect, useMemo, useState } from "react";
import type { LabProps } from "./registry";
import { Cases } from "./Cases";
import { heapTrace } from "@/lib/labs/heapLab";

const PRESETS: { name: string; values: number[] }[] = [
  { name: "乱序一组", values: [9, 4, 7, 1, 8, 3] },
  { name: "近乎有序", values: [1, 3, 5, 7, 9, 2] },
  { name: "逆序", values: [9, 7, 5, 3, 1] },
];

export default function HeapLab({ state }: LabProps) {
  const [values, setValues] = useState<number[]>(PRESETS[0]!.values);
  const [text, setText] = useState("");
  const [idx, setIdx] = useState(0);
  const [playing, setPlaying] = useState(false);
  const frames = useMemo(() => heapTrace(values), [values]);
  const cur = frames[Math.min(idx, frames.length - 1)]!;
  const finished = idx >= frames.length - 1;
  useEffect(() => {
    if (!playing) return;
    if (finished) { setPlaying(false); return; }
    const id = setTimeout(() => setIdx((i) => i + 1), 900);
    return () => clearTimeout(id);
  }, [playing, idx, finished]);
  const reset = (v: number[]) => { setValues(v); setIdx(0); setPlaying(false); };
  return (
    <div className="lab-heap">
      <div className="lab-row" role="group" aria-label="预置数组">
        {PRESETS.map((p) => <button key={p.name} onClick={() => reset(p.values)} aria-pressed={values === p.values}>{p.name}</button>)}
        <input value={text} onChange={(e) => setText(e.target.value)} placeholder="自定义：如 5,2,8" aria-label="自定义数组" style={{ width: 120 }} />
        <button onClick={() => { const vs = text.split(/[,，\s]+/).map(Number).filter((n) => Number.isFinite(n)).slice(0, 10); if (vs.length) reset(vs); }}>建堆</button>
      </div>
      <div className="bs-cells" style={{ marginTop: 26 }}>
        {cur.heap.length === 0 ? <div className="bs-cell muted">（空）<small>heap</small></div> : cur.heap.map((v, i) => (
          <div key={i} className={`bs-cell ${i === 0 ? "active" : ""}`}>{v}<small>{i === 0 ? "堆顶" : `下标 ${i}`}</small></div>
        ))}
      </div>
      <p className="lab-out" aria-live="polite">{cur.msg}</p>
      {cur.extracted.length > 0 && <p className="lab-out">已取出：<b>{cur.extracted.join(", ")}</b></p>}
      <p className="lab-out">下标 i 的父节点是 ⌊(i−1)/2⌋、孩子是 2i+1 与 2i+2——完全二叉树装进数组不需要指针。</p>
      <div className="lab-row">
        <button onClick={() => setIdx((i) => Math.min(i + 1, frames.length - 1))} disabled={finished}>单步 →</button>
        <button onClick={() => setPlaying((x) => !x)} disabled={finished}>{playing ? "暂停" : "播放"}</button>
        <button onClick={() => reset(values)}>重置</button>
      </div>
      <Cases state={state} />
    </div>
  );
}
