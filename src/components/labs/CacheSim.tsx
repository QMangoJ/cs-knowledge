"use client";
import { useEffect, useMemo, useState } from "react";
import type { LabProps } from "./registry";
import { Cases, num } from "./Cases";
import { fmt } from "@/i18n";
import { useLang } from "@/i18n/client";
import { cacheTrace } from "@/lib/labs/cacheSim";

// Stride patterns over a 16x16 int matrix row start (base 0), element = 4B.
const rowMajor = Array.from({ length: 16 }, (_, i) => i * 4);              // row 0 sequential bytes
const colMajor = Array.from({ length: 16 }, (_, i) => i * 64);             // column 0: each row is 64B apart
const PRESET_ADDRS: number[][] = [rowMajor, colMajor, [...rowMajor.slice(0, 8), ...rowMajor.slice(0, 8)]];

export default function CacheSim({ state }: LabProps) {
  const { lang, s } = useLang();
  const PRESETS: { name: string; addrs: number[] }[] = [
    { name: s.labCachePresetRow, addrs: PRESET_ADDRS[0]! },
    { name: s.labCachePresetCol, addrs: PRESET_ADDRS[1]! },
    { name: s.labCachePresetRepeat, addrs: PRESET_ADDRS[2]! },
  ];
  const lines = num(state.params?.lines, 8);
  const block = num(state.params?.block, 16);
  const [addrs, setAddrs] = useState<number[]>(PRESET_ADDRS[0]!);
  const [idx, setIdx] = useState(0);
  const [playing, setPlaying] = useState(false);
  const r = useMemo(() => cacheTrace(addrs, lines, block, lang), [addrs, lines, block, lang]);
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
      <div className="lab-row" role="group" aria-label={s.labCacheModesLabel}>
        {PRESETS.map((p) => <button key={p.name} onClick={() => reset(p.addrs)} aria-pressed={addrs === p.addrs}>{p.name}</button>)}
      </div>
      <div className="bs-cells" style={{ marginTop: 26 }}>
        {cur.lines.map((tg, i) => (
          <div key={i} className={`bs-cell ${i === cur.index ? (cur.hit ? "found" : "active") : tg === null ? "muted" : ""}`}>
            {tg === null ? "·" : `T${tg}`}<small>{fmt(s.labCacheLine, { i })}</small>
          </div>
        ))}
      </div>
      <p className="lab-out" aria-live="polite">{cur.msg}</p>
      <p className="lab-out">{s.labCacheHits} <b>{r.hits}</b> · {s.labCacheMisses} <b>{r.misses}</b>{s.labCacheTail}</p>
      <div className="lab-row">
        <button onClick={() => setIdx((i) => Math.min(i + 1, r.frames.length - 1))} disabled={finished}>{s.labStep}</button>
        <button onClick={() => setPlaying((x) => !x)} disabled={finished}>{playing ? s.pause : s.play}</button>
        <button onClick={() => reset(addrs)}>{s.labReset}</button>
      </div>
      <Cases state={state} />
    </div>
  );
}
