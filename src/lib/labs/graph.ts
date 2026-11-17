// Pure logic for graph-walk: BFS (queue) / DFS (iterative stack, mark on push) traces on a small undirected graph.
import { labFmt, labMsg, type LabLang } from "./messages.ts";
export type GraphDef = { nodes: string[]; edges: [string, string][] };
export const GRAPH_DEFAULT: GraphDef = {
  nodes: ["A", "B", "C", "D", "E", "F", "G"],
  edges: [["A", "B"], ["A", "C"], ["B", "D"], ["C", "D"], ["C", "E"], ["D", "F"], ["E", "F"], ["E", "G"]],
};
export type WalkFrame = { current: string | null; visited: string[]; frontier: string[]; msg: string };

export function adjacency(g: GraphDef): Record<string, string[]> {
  const adj: Record<string, string[]> = Object.fromEntries(g.nodes.map((n) => [n, [] as string[]]));
  for (const [a, b] of g.edges) { adj[a]!.push(b); adj[b]!.push(a); }
  for (const n of g.nodes) adj[n]!.sort();
  return adj;
}

export function walkTrace(g: GraphDef, start: string, mode: "bfs" | "dfs", lang: LabLang = "zh"): WalkFrame[] {
  const M = labMsg(lang).graph;
  const adj = adjacency(g);
  const seen = new Set<string>([start]);
  const visited: string[] = [];
  const frames: WalkFrame[] = [];
  if (mode === "bfs") {
    const q: string[] = [start];
    frames.push({ current: null, visited: [], frontier: [...q], msg: labFmt(M.bfsInit, { start }) });
    while (q.length) {
      const u = q.shift()!;
      visited.push(u);
      const fresh = adj[u]!.filter((v) => !seen.has(v));
      for (const v of fresh) { seen.add(v); q.push(v); }
      frames.push({ current: u, visited: [...visited], frontier: [...q], msg: labFmt(M.bfsVisit, { u, fresh: fresh.length ? fresh.join(M.joiner) : M.none }) });
    }
  } else {
    const st: string[] = [start];
    frames.push({ current: null, visited: [], frontier: [...st], msg: labFmt(M.dfsInit, { start }) });
    while (st.length) {
      const u = st.pop()!;
      visited.push(u);
      const fresh = adj[u]!.filter((v) => !seen.has(v));
      for (const v of fresh) { seen.add(v); st.push(v); }
      frames.push({ current: u, visited: [...visited], frontier: [...st], msg: labFmt(M.dfsVisit, { u, fresh: fresh.length ? fresh.join(M.joiner) : M.none }) });
    }
  }
  frames.push({ current: null, visited: [...visited], frontier: [], msg: labFmt(M.end, { container: mode === "bfs" ? M.queue : M.stack, order: visited.join(" → ") }) });
  return frames;
}

type P = Record<string, unknown>;
export function graphCase(p: P, i: P) {
  const g = (p.graph as GraphDef) ?? GRAPH_DEFAULT;
  const frames = walkTrace(g, typeof i.start === "string" ? i.start : "A", i.mode === "dfs" ? "dfs" : "bfs");
  const order = frames[frames.length - 1]!.visited;
  return { order, visited: order.length };
}
