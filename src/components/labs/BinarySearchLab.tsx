"use client";
import { useEffect, useMemo, useState } from "react";
import type { LabProps } from "./registry";
import { Cases, num } from "./Cases";
import { fmt } from "@/i18n";
import { useLang } from "@/i18n/client";
import { BS_DEFAULT, bsResult } from "@/lib/labs/search";

export default function BinarySearchLab({ state }: LabProps) {
  const { s } = useLang();
  const p = state.params ?? {};
  const arr = (Array.isArray(p.array) ? (p.array as number[]) : BS_DEFAULT);
  const presets = (Array.isArray(p.targets) ? (p.targets as number[]) : [23, 7, 2, 56]);
  const [target, setTarget] = useState(num(p.target, 23));
  const [text, setText] = useState("");
  const [idx, setIdx] = useState(0);
  const [playing, setPlaying] = useState(false);
  const r = useMemo(() => bsResult(arr, target), [arr, target]);
  const steps = r.steps;
  const cur = steps[Math.min(idx, steps.length - 1)]!;
  const finished = idx >= steps.length - 1;
  useEffect(() => {
    if (!playing) return;
    if (finished) { setPlaying(false); return; }
    const id = setTimeout(() => setIdx((i) => i + 1), 900);
    return () => clearTimeout(id);
  }, [playing, idx, finished]);
  const reset = (tgt: number) => { setTarget(tgt); setIdx(0); setPlaying(false); };
  const cellCls = (i: number) => {
    if (cur.result === "empty") return "muted";
    if (i < cur.lo || i > cur.hi) return "muted";
    if (i === cur.mid) return cur.result === "eq" ? "found" : "active";
    return "";
  };
  const ptrs = (i: number) => {
    if (cur.result === "empty") return "";
    const l: string[] = [];
    if (i === cur.lo) l.push("lo");
    if (i === cur.mid) l.push("mid");
    if (i === cur.hi) l.push("hi");
    return l.join("·");
  };
  const msg = cur.result === "eq" ? fmt(s.labBsMsgFound, { t: target, i: r.index, c: cur.comparisons })
    : cur.result === "empty" ? fmt(s.labBsMsgAbsent, { t: target, i: r.insertAt, c: cur.comparisons })
    : cur.result === "lt" ? fmt(s.labBsMsgLt, { m: arr[cur.mid]!, t: target })
    : fmt(s.labBsMsgGt, { m: arr[cur.mid]!, t: target });
  return (
    <div className="lab-bs">
      <div className="lab-row" role="group" aria-label={s.labBsTargetsLabel}>
        {presets.map((tgt) => <button key={tgt} onClick={() => reset(tgt)} aria-pressed={target === tgt}>{fmt(s.labBsFind, { t: tgt })}</button>)}
        <input value={text} onChange={(e) => setText(e.target.value)} placeholder={s.labBsCustomPh} aria-label={s.labBsCustomLabel} style={{ width: 110 }} />
        <button onClick={() => { const n = Number(text); if (Number.isFinite(n) && text.trim()) reset(n); }} disabled={!text.trim() || !Number.isFinite(Number(text))}>{s.labBsSearch}</button>
      </div>
      <div className="bs-cells" style={{ marginTop: 26 }}>
        {arr.map((v, i) => (
          <div key={i} className={`bs-cell ${cellCls(i)}`}>
            {ptrs(i) && <span className="bs-ptr">{ptrs(i)}</span>}
            {v}<small>{i}</small>
          </div>
        ))}
      </div>
      <p className="lab-out" aria-live="polite">{msg}</p>
      <p className="lab-out">{s.labBsCompStart}<b>{cur.comparisons}</b>{fmt(r.found ? s.labBsCompFound : s.labBsCompAbsent, { l: r.linear, lo: Math.max(cur.lo, 0), hi: cur.hi })}</p>
      <div className="lab-row">
        <button onClick={() => setIdx((i) => Math.min(i + 1, steps.length - 1))} disabled={finished}>{s.labStep}</button>
        <button onClick={() => setPlaying((x) => !x)} disabled={finished}>{playing ? s.pause : s.play}</button>
        <button onClick={() => reset(target)}>{s.labReset}</button>
      </div>
      <Cases state={state} />
    </div>
  );
}
