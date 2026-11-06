"use client";
import { useEffect, useMemo, useState } from "react";
import type { LabProps } from "./registry";
import { Cases } from "./Cases";
import { DIJ_DEFAULT, dijkstraTrace, type WGraph } from "@/lib/labs/dijkstraLab";

export default function DijkstraLab({ state }: LabProps) {
  const g = (state.params?.graph as WGraph) ?? DIJ_DEFAULT;
  const nodes = Object.keys(g);
  const [source, setSource] = useState(nodes[0]!);
  const [idx, setIdx] = useState(0);
  const [playing, setPlaying] = useState(false);
  const frames = useMemo(() => dijkstraTrace(g, source), [g, source]);
  const cur = frames[Math.min(idx, frames.length - 1)]!;
  const finished = idx >= frames.length - 1;
  useEffect(() => {
    if (!playing) return;
    if (finished) { setPlaying(false); return; }
    const id = setTimeout(() => setIdx((i) => i + 1), 1000);
    return () => clearTimeout(id);
  }, [playing, idx, finished]);
  const reset = (s: string) => { setSource(s); setIdx(0); setPlaying(false); };
  const fmt = (v: number) => (v === Infinity ? "∞" : String(v));
  return (
    <div className="lab-dij">
      <div className="lab-row" role="group" aria-label="选择源点">
        {nodes.map((n) => <button key={n} onClick={() => reset(n)} aria-pressed={source === n}>源点 {n}</button>)}
      </div>
      <p className="lab-out">带权边：{nodes.flatMap((u) => g[u]!.map(([v, w]) => `${u}–${v}:${w}`)).join(" · ")}</p>
      <div className="bs-cells" style={{ marginTop: 20 }}>
        {nodes.map((n) => (
          <div key={n} className={`bs-cell ${n === cur.current ? "active" : cur.settled.includes(n) ? "found" : ""}`}>
            {n}<small>dist {fmt(cur.dist[n]!)}{cur.settled.includes(n) ? " · 已定版" : ""}</small>
          </div>
        ))}
      </div>
      <p className="lab-out" aria-live="polite">{cur.msg}</p>
      <div className="lab-row">
        <button onClick={() => setIdx((i) => Math.min(i + 1, frames.length - 1))} disabled={finished}>单步 →</button>
        <button onClick={() => setPlaying((x) => !x)} disabled={finished}>{playing ? "暂停" : "播放"}</button>
        <button onClick={() => reset(source)}>重置</button>
      </div>
      <Cases state={state} />
    </div>
  );
}
