"use client";
import { useMemo, useState } from "react";
import type { LabProps } from "./registry";
import { Cases, str } from "./Cases";
import { fmt, type Strings } from "@/i18n";
import { useLang } from "@/i18n/client";
import { SORT_PRESETS, mergeSteps, quickSteps, type SortStep } from "@/lib/labs/sort";

function Bars({ title, steps, idx, s }: { title: string; steps: SortStep[]; idx: number; s: Strings }) {
  const st = steps[Math.min(idx, steps.length - 1)]!;
  const max = Math.max(...st.arr);
  return (
    <div>
      <h3>{title}{fmt(s.labSortCompSuffix, { c: st.comparisons })}{ st.done ? s.labSortDoneSuffix : "" }</h3>
      <div className="sort-bars">
        {st.arr.map((v, i) => (
          <div key={i} className={`sort-bar ${st.done ? "done" : st.active.includes(i) ? "active" : ""}`} style={{ height: `${(v / max) * 100}%` }}><span>{v}</span></div>
        ))}
      </div>
    </div>
  );
}

export default function SortCompare({ state }: LabProps) {
  const { s } = useLang();
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
      <div className="lab-row" role="group" aria-label={s.labSortPresetsLabel}>
        {([["mixed", s.labSortMixed], ["sorted", s.labSortSorted], ["reversed", s.labSortReversed]] as const).map(([k, label]) => (
          <button key={k} onClick={() => { setPreset(k); setIdx(0); }} aria-pressed={preset === k}>{label}</button>
        ))}
        <button onClick={() => setIdx((i) => Math.min(i + 1, total - 1))} disabled={finished}>{s.labStep}</button>
        <button onClick={() => setIdx(0)}>{s.labReset}</button>
      </div>
      <p className="lab-out">{s.labSortNote}</p>
      <div className="sort-cols">
        <Bars title={s.labSortMerge} steps={m} idx={idx} s={s} />
        <Bars title={s.labSortQuick} steps={q} idx={idx} s={s} />
      </div>
      <Cases state={state} />
    </div>
  );
}
