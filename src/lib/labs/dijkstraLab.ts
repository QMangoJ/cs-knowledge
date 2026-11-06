// Pure logic for dijkstra-lab: Dijkstra trace with a plain-array priority selection (same semantics as the topic code).
export type WGraph = Record<string, [string, number][]>;
export const DIJ_DEFAULT: WGraph = {
  A: [["B", 4], ["C", 2]],
  B: [["A", 4], ["C", 1], ["E", 7]],
  C: [["A", 2], ["B", 1], ["D", 5]],
  D: [["C", 5], ["E", 2], ["F", 3]],
  E: [["B", 7], ["D", 2], ["F", 1]],
  F: [["D", 3], ["E", 1]],
};
export type DijFrame = { current: string | null; settled: string[]; dist: Record<string, number>; msg: string };

export function dijkstraTrace(g: WGraph, source: string): DijFrame[] {
  const nodes = Object.keys(g);
  const dist: Record<string, number> = Object.fromEntries(nodes.map((n) => [n, Infinity]));
  dist[source] = 0;
  const settled: string[] = [];
  const done = new Set<string>();
  const frames: DijFrame[] = [{ current: null, settled: [], dist: { ...dist }, msg: `初始：dist[${source}]=0，其余为 ∞。` }];
  for (;;) {
    let u: string | null = null;
    for (const n of nodes) if (!done.has(n) && (u === null || dist[n]! < dist[u]!)) u = n;
    if (u === null || dist[u] === Infinity) break;
    done.add(u); settled.push(u);
    const ups: string[] = [];
    for (const [v, w] of g[u]!) {
      if (!done.has(v) && dist[u]! + w < dist[v]!) { dist[v] = dist[u]! + w; ups.push(`${v}→${dist[v]}`); }
    }
    frames.push({ current: u, settled: [...settled], dist: { ...dist }, msg: `未定节点中 dist 最小的是 ${u}（${dist[u]}），定版；松弛其出边${ups.length ? "，更新 " + ups.join("、") : "，无更新"}。` });
  }
  frames.push({ current: null, settled: [...settled], dist: { ...dist }, msg: `全部定版。最短距离：${nodes.map((n) => `${n}=${dist[n] === Infinity ? "∞" : dist[n]}`).join("，")}。` });
  return frames;
}

type P = Record<string, unknown>;
export function dijkstraCase(p: P, i: P) {
  const g = (p.graph as WGraph) ?? DIJ_DEFAULT;
  const frames = dijkstraTrace(g, typeof i.source === "string" ? i.source : "A");
  const last = frames[frames.length - 1]!;
  const dist: Record<string, number> = {};
  for (const [k, v] of Object.entries(last.dist)) dist[k] = v === Infinity ? -1 : v;
  return { dist, order: last.settled };
}
