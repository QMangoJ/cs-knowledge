"use client";
import { useMemo, useState } from "react";
import type { LabProps } from "./registry";
import { Cases, str } from "./Cases";
import { SORT_PRESETS, mergeSteps, quickSteps, type SortStep } from "@/lib/labs/sort";

function Bars({ title, steps, idx }: { title: string; steps: SortStep[]; idx: number }) {
  const s = steps[Math.min(idx, steps.length - 1)]!;
  const max = Math.max(...s.arr);
  return (
    <div>
      <h3>{title} · 比较 {s.comparisons} 次{ s.done ? " · 已完成" : "" }</h3>
      <div className="sort-bars">
        {s.arr.map((v, i) => (
          <div key={i} className={`sort-bar ${s.done ? "done" : s.active.includes(i) ? "active" : ""}`} style={{ height: `${(v / max) * 100}%` }}><span>{v}</span></div>
        ))}
      </div>
    </div>
  );
}

export default function SortCompare({ state }: LabProps) {
  const p = state.params ?? {};
  const [preset, setPreset] = useState(str(p.preset, "mixed"));
  const [idx, setIdx] = useState(0);
  const arr = SORT_PRESETS[preset] ?? SORT_PRESETS.mixed!;
  const m = useMemo(() => mergeSteps(arr), [arr]);
  const q = useMemo(() => quickSteps(arr), [arr]);
  const total = Math.max(m.length, q.length);
  const finished = idx >= total - 1;
  return (
    <div className="lab-sort">
      <div className="lab-row" role="group" aria-label="输入预设">
        {([["mixed", "乱序"], ["sorted", "已排序"], ["reversed", "逆序"]] as const).map(([k, label]) => (
          <button key={k} onClick={() => { setPreset(k); setIdx(0); }} aria-pressed={preset === k}>{label}</button>
        ))}
        <button onClick={() => setIdx((i) => Math.min(i + 1, total - 1))} disabled={finished}>单步 →</button>
        <button onClick={() => setIdx(0)}>重置</button>
      </div>
      <p className="lab-out">同一步进同时推进两种算法。快排用末元素作 pivot：输入已排序时退化到 O(n²)（8 个元素 28 次比较），归并始终稳定在 O(n log n)。</p>
      <div className="sort-cols">
        <Bars title="归并排序" steps={m} idx={idx} />
        <Bars title="快速排序" steps={q} idx={idx} />
      </div>
      <Cases state={state} />
    </div>
  );
}
