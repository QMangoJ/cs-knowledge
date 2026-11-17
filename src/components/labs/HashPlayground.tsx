"use client";
import { useEffect, useMemo, useState } from "react";
import type { LabProps } from "./registry";
import { Cases, num } from "./Cases";
import { fmt } from "@/i18n";
import { useLang } from "@/i18n/client";
import { hashTrace } from "@/lib/labs/hash";

const PRESET_KEYS: number[][] = [[3, 11, 19, 27], [8, 16, 24, 32, 40], [5, 13, 21, 29, 37, 45, 53]];

export default function HashPlayground({ state }: LabProps) {
  const { lang, s } = useLang();
  const PRESETS: { name: string; keys: number[] }[] = [
    { name: s.labHashPresetSmooth, keys: PRESET_KEYS[0]! },
    { name: s.labHashPresetClash, keys: PRESET_KEYS[1]! },
    { name: s.labHashPresetGrow, keys: PRESET_KEYS[2]! },
  ];
  const cap = num(state.params?.capacity, 8);
  const [keys, setKeys] = useState<number[]>(PRESET_KEYS[1]!);
  const [text, setText] = useState("");
  const [idx, setIdx] = useState(0);
  const [playing, setPlaying] = useState(false);
  const r = useMemo(() => hashTrace(keys, cap, lang), [keys, cap, lang]);
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
  const customKeys = text.split(/[,，\s]+/).filter(Boolean).map(Number).filter((n) => Number.isFinite(n)).slice(0, 12);
  return (
    <div className="lab-hash">
      <div className="lab-row" role="group" aria-label={s.labHashPresetsLabel}>
        {PRESETS.map((p) => <button key={p.name} onClick={() => reset(p.keys)} aria-pressed={keys === p.keys}>{p.name}</button>)}
        <input value={text} onChange={(e) => setText(e.target.value)} placeholder={s.labHashCustomPh} aria-label={s.labHashCustomLabel} style={{ width: 130 }} />
        <button onClick={() => { if (customKeys.length) reset(customKeys); }} disabled={customKeys.length === 0}>{s.labHashInsert}</button>
      </div>
      <div className="bs-cells" style={{ marginTop: 26 }}>
        {cur.slots.map((v, i) => (
          <div key={i} className={`bs-cell ${v === null ? "muted" : ""}`}>{v ?? "·"}<small>{fmt(s.labHashSlot, { i })}</small></div>
        ))}
      </div>
      <p className="lab-out" aria-live="polite">{cur.msg}</p>
      <p className="lab-out">{s.labHashSummaryPre}<b>{cur.cap}</b>{s.labHashSummaryPost}</p>
      <div className="lab-row">
        <button onClick={() => setIdx((i) => Math.min(i + 1, frames.length - 1))} disabled={finished}>{s.labStep}</button>
        <button onClick={() => setPlaying((x) => !x)} disabled={finished}>{playing ? s.pause : s.play}</button>
        <button onClick={() => reset(keys)}>{s.labReset}</button>
      </div>
      <Cases state={state} />
    </div>
  );
}
