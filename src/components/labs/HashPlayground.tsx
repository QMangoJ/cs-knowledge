"use client";
import { useEffect, useMemo, useState } from "react";
import type { LabProps } from "./registry";
import { Cases, num } from "./Cases";
import { hashTrace } from "@/lib/labs/hash";

const PRESETS: { name: string; keys: number[] }[] = [
  { name: "顺和的一组", keys: [3, 11, 19, 27] },
  { name: "连环冲突", keys: [8, 16, 24, 32, 40] },
  { name: "触发扩容", keys: [5, 13, 21, 29, 37, 45, 53] },
];

export default function HashPlayground({ state }: LabProps) {
  const cap = num(state.params?.capacity, 8);
  const [keys, setKeys] = useState<number[]>(PRESETS[1]!.keys);
  const [text, setText] = useState("");
  const [idx, setIdx] = useState(0);
  const [playing, setPlaying] = useState(false);
  const r = useMemo(() => hashTrace(keys, cap), [keys, cap]);
  const frames = r.frames;
  const cur = frames[Math.min(idx, frames.length - 1)]!;
  const finished = idx >= frames.length - 1;
  useEffect(() => {
    if (!playing) return;
    if (finished) { setPlaying(false); return; }
    const id = setTimeout(() => setIdx((i) => i + 1), 900);
    return () => clearTimeout(id);
  }, [playing, idx, finished]);
  const reset = (k: number[]) => { setKeys(k); setIdx(0); setPlaying(false); };
  return (
    <div className="lab-hash">
      <div className="lab-row" role="group" aria-label="预置键集">
        {PRESETS.map((p) => <button key={p.name} onClick={() => reset(p.keys)} aria-pressed={keys === p.keys}>{p.name}</button>)}
        <input value={text} onChange={(e) => setText(e.target.value)} placeholder="自定义：如 4,12,20" aria-label="自定义键集" style={{ width: 130 }} />
        <button onClick={() => { const ks = text.split(/[,，\s]+/).map(Number).filter((n) => Number.isFinite(n)).slice(0, 12); if (ks.length) reset(ks); }}>插入这组</button>
      </div>
      <div className="bs-cells" style={{ marginTop: 26 }}>
        {cur.slots.map((v, i) => (
          <div key={i} className={`bs-cell ${v === null ? "muted" : ""}`}>{v ?? "·"}<small>槽 {i}</small></div>
        ))}
      </div>
      <p className="lab-out" aria-live="polite">{cur.msg}</p>
      <p className="lab-out">容量 <b>{cur.cap}</b> · 总探测次数随插入累计（冲突越多越大）· 扩容把平均探测拉回低位</p>
      <div className="lab-row">
        <button onClick={() => setIdx((i) => Math.min(i + 1, frames.length - 1))} disabled={finished}>单步 →</button>
        <button onClick={() => setPlaying((x) => !x)} disabled={finished}>{playing ? "暂停" : "播放"}</button>
        <button onClick={() => reset(keys)}>重置</button>
      </div>
      <Cases state={state} />
    </div>
  );
}
