"use client";
import { useEffect, useMemo, useState } from "react";
import type { LabProps } from "./registry";
import { Cases } from "./Cases";
import { fmt } from "@/i18n";
import { useLang } from "@/i18n/client";
import { heapTrace } from "@/lib/labs/heapLab";

const PRESET_VALUES: number[][] = [[9, 4, 7, 1, 8, 3], [1, 3, 5, 7, 9, 2], [9, 7, 5, 3, 1]];

export default function HeapLab({ state }: LabProps) {
  const { lang, s } = useLang();
  const PRESETS: { name: string; values: number[] }[] = [
    { name: s.labHeapPresetMixed, values: PRESET_VALUES[0]! },
    { name: s.labHeapPresetNearly, values: PRESET_VALUES[1]! },
    { name: s.labHeapPresetReversed, values: PRESET_VALUES[2]! },
  ];
  const [values, setValues] = useState<number[]>(PRESET_VALUES[0]!);
  const [text, setText] = useState("");
  const [idx, setIdx] = useState(0);
  const [playing, setPlaying] = useState(false);
  const frames = useMemo(() => heapTrace(values, lang), [values, lang]);
  const cur = frames[Math.min(idx, frames.length - 1)]!;
  const finished = idx >= frames.length - 1;
  useEffect(() => {
    if (!playing) return;
    if (finished) { setPlaying(false); return; }
    const id = setTimeout(() => setIdx((i) => i + 1), 900);
    return () => clearTimeout(id);
  }, [playing, idx, finished]);
  const reset = (v: number[]) => { setValues(v); setIdx(0); setPlaying(false); };
  const customValues = text.split(/[,，\s]+/).filter(Boolean).map(Number).filter((n) => Number.isFinite(n)).slice(0, 10);
  return (
    <div className="lab-heap">
      <div className="lab-row" role="group" aria-label={s.labHeapPresetsLabel}>
        {PRESETS.map((p) => <button key={p.name} onClick={() => reset(p.values)} aria-pressed={values === p.values}>{p.name}</button>)}
        <input value={text} onChange={(e) => setText(e.target.value)} placeholder={s.labHeapCustomPh} aria-label={s.labHeapCustomLabel} style={{ width: 120 }} />
        <button onClick={() => { if (customValues.length) reset(customValues); }} disabled={customValues.length === 0}>{s.labHeapBuild}</button>
      </div>
      <div className="bs-cells" style={{ marginTop: 26 }}>
        {cur.heap.length === 0 ? <div className="bs-cell muted">{s.labHeapEmpty}<small>heap</small></div> : cur.heap.map((v, i) => (
          <div key={i} className={`bs-cell ${i === 0 ? "active" : ""}`}>{v}<small>{i === 0 ? s.labHeapTop : fmt(s.labHeapIndex, { i })}</small></div>
        ))}
      </div>
      <p className="lab-out" aria-live="polite">{cur.msg}</p>
      {cur.extracted.length > 0 && <p className="lab-out">{s.labHeapExtracted}<b>{cur.extracted.join(", ")}</b></p>}
      <p className="lab-out">{s.labHeapNote}</p>
      <div className="lab-row">
        <button onClick={() => setIdx((i) => Math.min(i + 1, frames.length - 1))} disabled={finished}>{s.labStep}</button>
        <button onClick={() => setPlaying((x) => !x)} disabled={finished}>{playing ? s.pause : s.play}</button>
        <button onClick={() => reset(values)}>{s.labReset}</button>
      </div>
      <Cases state={state} />
    </div>
  );
}
