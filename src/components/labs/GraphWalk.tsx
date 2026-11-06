"use client";
import { useEffect, useMemo, useState } from "react";
import type { LabProps } from "./registry";
import { Cases } from "./Cases";
import { GRAPH_DEFAULT, walkTrace, type GraphDef } from "@/lib/labs/graph";

export default function GraphWalk({ state }: LabProps) {
  const g = (state.params?.graph as GraphDef) ?? GRAPH_DEFAULT;
  const [mode, setMode] = useState<"bfs" | "dfs">("bfs");
  const [start, setStart] = useState("A");
  const [idx, setIdx] = useState(0);
  const [playing, setPlaying] = useState(false);
  const frames = useMemo(() => walkTrace(g, start, mode), [g, start, mode]);
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
      <div className="lab-row" role="group" aria-label="遍历方式与起点">
        <button onClick={() => reset("bfs", start)} aria-pressed={mode === "bfs"}>BFS（队列）</button>
        <button onClick={() => reset("dfs", start)} aria-pressed={mode === "dfs"}>DFS（栈）</button>
        {g.nodes.map((n) => <button key={n} onClick={() => reset(mode, n)} aria-pressed={start === n}>从 {n} 出发</button>)}
      </div>
      <p className="lab-out">边：{g.edges.map(([a, b]) => `${a}–${b}`).join(" · ")}</p>
      <div className="bs-cells" style={{ marginTop: 20 }}>
        {g.nodes.map((n) => (
          <div key={n} className={`bs-cell ${n === cur.current ? "active" : cur.visited.includes(n) ? "found" : cur.frontier.includes(n) ? "" : "muted"}`}>
            {n}<small>{n === cur.current ? "访问中" : cur.visited.includes(n) ? "已访问" : cur.frontier.includes(n) ? (mode === "bfs" ? "在队列" : "在栈") : "未见"}</small>
          </div>
        ))}
      </div>
      <p className="lab-out" aria-live="polite">{cur.msg}</p>
      <p className="lab-out">{mode === "bfs" ? "队列（先进先出）" : "栈（后进先出）"}：<b>{cur.frontier.length ? cur.frontier.join(" ") : "（空）"}</b> · 已访问：{cur.visited.join(" ") || "（无）"}</p>
      <div className="lab-row">
        <button onClick={() => setIdx((i) => Math.min(i + 1, frames.length - 1))} disabled={finished}>单步 →</button>
        <button onClick={() => setPlaying((x) => !x)} disabled={finished}>{playing ? "暂停" : "播放"}</button>
        <button onClick={() => reset(mode, start)}>重置</button>
      </div>
      <Cases state={state} />
    </div>
  );
}
