"use client";
import { useEffect, useMemo, useState } from "react";
import type { LabProps } from "./registry";
import { Cases, num } from "./Cases";
import { cacheTrace } from "@/lib/labs/cacheSim";

// Stride patterns over a 16x16 int matrix row start (base 0), element = 4B.
const rowMajor = Array.from({ length: 16 }, (_, i) => i * 4);              // row 0 sequential bytes
const colMajor = Array.from({ length: 16 }, (_, i) => i * 64);             // column 0: each row is 64B apart
const PRESETS: { name: string; addrs: number[] }[] = [
  { name: "按行扫一行", addrs: rowMajor },
  { name: "按列扫一列", addrs: colMajor },
  { name: "小数组重复两遍", addrs: [...rowMajor.slice(0, 8), ...rowMajor.slice(0, 8)] },
];

export default function CacheSim({ state }: LabProps) {
  const lines = num(state.params?.lines, 8);
  const block = num(state.params?.block, 16);
  const [addrs, setAddrs] = useState<number[]>(PRESETS[0]!.addrs);
  const [idx, setIdx] = useState(0);
  const [playing, setPlaying] = useState(false);
  const r = useMemo(() => cacheTrace(addrs, lines, block), [addrs, lines, block]);
  const cur = r.frames[Math.min(idx, r.frames.length - 1)]!;
  const finished = idx >= r.frames.length - 1;
  useEffect(() => {
    if (!playing) return;
    if (finished) { setPlaying(false); return; }
    const id = setTimeout(() => setIdx((i) => i + 1), 700);
    return () => clearTimeout(id);
  }, [playing, idx, finished]);
  const reset = (a: number[]) => { setAddrs(a); setIdx(0); setPlaying(false); };
  return (
    <div className="lab-cache">
      <div className="lab-row" role="group" aria-label="访问模式">
        {PRESETS.map((p) => <button key={p.name} onClick={() => reset(p.addrs)} aria-pressed={addrs === p.addrs}>{p.name}</button>)}
      </div>
      <div className="bs-cells" style={{ marginTop: 26 }}>
        {cur.lines.map((tg, i) => (
          <div key={i} className={`bs-cell ${i === cur.index ? (cur.hit ? "found" : "active") : tg === null ? "muted" : ""}`}>
            {tg === null ? "·" : `T${tg}`}<small>行 {i}</small>
          </div>
        ))}
      </div>
      <p className="lab-out" aria-live="polite">{cur.msg}</p>
      <p className="lab-out">命中 <b>{r.hits}</b> · 未命中 <b>{r.misses}</b>（整段序列统计）——按列访问时每步都跳到新块、还互相挤占同一行，这就是循环交换能快数倍的原因。</p>
      <div className="lab-row">
        <button onClick={() => setIdx((i) => Math.min(i + 1, r.frames.length - 1))} disabled={finished}>单步 →</button>
        <button onClick={() => setPlaying((x) => !x)} disabled={finished}>{playing ? "暂停" : "播放"}</button>
        <button onClick={() => reset(addrs)}>重置</button>
      </div>
      <Cases state={state} />
    </div>
  );
}
