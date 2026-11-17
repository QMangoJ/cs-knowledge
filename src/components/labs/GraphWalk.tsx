"use client";
import { useEffect, useMemo, useState } from "react";
import type { LabProps } from "./registry";
import { Cases } from "./Cases";
import { fmt } from "@/i18n";
import { useLang } from "@/i18n/client";
import { GRAPH_DEFAULT, walkTrace, type GraphDef } from "@/lib/labs/graph";

export default function GraphWalk({ state }: LabProps) {
  const { lang, s } = useLang();
  const g = (state.params?.graph as GraphDef) ?? GRAPH_DEFAULT;
  const [mode, setMode] = useState<"bfs" | "dfs">("bfs");
  const [start, setStart] = useState("A");
  const [idx, setIdx] = useState(0);
  const [playing, setPlaying] = useState(false);
  const frames = useMemo(() => walkTrace(g, start, mode, lang), [g, start, mode, lang]);
  const cur = frames[Math.min(idx, frames.length - 1)]!;
  const finished = idx >= frames.length - 1;
  useEffect(() => {
    if (!playing) return;
    if (finished) { setPlaying(false); return; }
    const id = setTimeout(() => setIdx((i) => i + 1), 900);
    return () => clearTimeout(id);
  }, [playing, idx, finished]);
  const reset = (m: "bfs" | "dfs", s: string) => { setMode(m); setStart(s); setIdx(0); setPlaying(false); };
  return (
    <div className="lab-graph">
      <div className="lab-row" role="group" aria-label={s.labGraphModeLabel}>
        <button onClick={() => reset("bfs", start)} aria-pressed={mode === "bfs"}>{s.labGraphBfs}</button>
        <button onClick={() => reset("dfs", start)} aria-pressed={mode === "dfs"}>{s.labGraphDfs}</button>
        {g.nodes.map((n) => <button key={n} onClick={() => reset(mode, n)} aria-pressed={start === n}>{fmt(s.labGraphStartFrom, { n })}</button>)}
      </div>
      <p className="lab-out">{s.labGraphEdges}{g.edges.map(([a, b]) => `${a}–${b}`).join(" · ")}</p>
      <div className="bs-cells" style={{ marginTop: 20 }}>
        {g.nodes.map((n) => (
          <div key={n} className={`bs-cell ${n === cur.current ? "active" : cur.visited.includes(n) ? "found" : cur.frontier.includes(n) ? "" : "muted"}`}>
            {n}<small>{n === cur.current ? s.labGraphVisiting : cur.visited.includes(n) ? s.labGraphVisited : cur.frontier.includes(n) ? (mode === "bfs" ? s.labGraphInQueue : s.labGraphInStack) : s.labGraphUnseen}</small>
          </div>
        ))}
      </div>
      <p className="lab-out" aria-live="polite">{cur.msg}</p>
      <p className="lab-out">{mode === "bfs" ? s.labGraphQueue : s.labGraphStack}{s.colon}<b>{cur.frontier.length ? cur.frontier.join(" ") : s.labGraphEmpty}</b> · {s.labGraphVisitedLabel}{cur.visited.join(" ") || s.labGraphNone}</p>
      <div className="lab-row">
        <button onClick={() => setIdx((i) => Math.min(i + 1, frames.length - 1))} disabled={finished}>{s.labStep}</button>
        <button onClick={() => setPlaying((x) => !x)} disabled={finished}>{playing ? s.pause : s.play}</button>
        <button onClick={() => reset(mode, start)}>{s.labReset}</button>
      </div>
      <Cases state={state} />
    </div>
  );
}
