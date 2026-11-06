import { useState } from "react";
import type { DatastateState } from "@/lib/schema";

type Cell = NonNullable<DatastateState["rows"]>[number]["cells"][number];
type Row = NonNullable<DatastateState["rows"]>[number];
type Hover = { i: number | null; set: (i: number | null) => void };
const W = 560, ROW_H = 100, CH = 42, BAR_H = 110, LINK_H = 34;
const cls = (base: string, mark?: string, hot?: boolean) => [base, mark && `m-${mark}`, hot && "hot"].filter(Boolean).join(" ");

function rowLayout(r: Row, labelW: number) {
  const gaps = r.breaks?.length ?? 0, GAP = 14;
  const cw = Math.min(56, (W - labelW - 8 - gaps * GAP) / r.cells.length);
  const total = cw * r.cells.length + gaps * GAP;
  const x0 = labelW + (W - labelW - total) / 2;
  return r.cells.map((_, i) => ({ x: x0 + i * cw + (r.breaks?.filter((b) => b <= i).length ?? 0) * GAP, w: cw }));
}
/** Rough text width (CJK ≈ 1em, others ≈ 0.6em). */
const textW = (t: string, fs: number) => [...t].reduce((n, c) => n + (c.charCodeAt(0) > 0x2e7f ? fs : fs * 0.6), 0);
/** Stack level per pointer so labels never overlap horizontally. */
function ptrLevels(r: Row, pos: { x: number; w: number }[]) {
  const placed: { l: number; a: number; b: number }[] = [];
  return (r.pointers ?? []).map((p) => {
    const cx = pos[p.at]!.x + pos[p.at]!.w / 2, half = textW(p.label, 12) / 2 + 4;
    let l = 0; while (placed.some((q) => q.l === l && cx - half < q.b && cx + half > q.a)) l++;
    placed.push({ l, a: cx - half, b: cx + half }); return l;
  });
}
const chainDepth = (r: Row) => Math.max(0, ...r.cells.map((c) => c.chain?.length ?? 0));
const ptrTop = (r: Row, labelW: number) => (r.pointers?.length ? 40 + Math.max(0, ...ptrLevels(r, rowLayout(r, labelW))) * 15 : 24);
export const rowHeight = (r: Row, labelW: number) => (r.display === "bars" ? BAR_H + 16 : ROW_H - 24) + ptrTop(r, labelW) + chainDepth(r) * (CH + LINK_H - 8);

function ArrayRow({ r, y0, labelW, hover }: { r: Row; y0: number; labelW: number; hover?: Hover }) {
  const pos = rowLayout(r, labelW), bars = r.display === "bars";
  const y = y0 + ptrTop(r, labelW), levels = ptrLevels(r, pos);
  const fs = pos[0]!.w < 34 ? 12 : 15;
  const max = bars ? Math.max(...r.cells.map((c) => Number(c.v))) || 1 : 1;
  const base = bars ? y + BAR_H : y + CH; // bottom of cells
  return (
    <g>
      {r.label && <text x={0} y={bars ? y + BAR_H - 12 : y + CH / 2} dominantBaseline="middle" className="ds-rowlabel">{r.label}</text>}
      {r.range && (() => { const a = pos[r.range.from]!, b = pos[r.range.to]!; return <rect x={a.x - 4} y={(bars ? y : y) - 4} width={b.x + b.w - a.x + 8} height={base - y + 8} rx={8} className="ds-range" />; })()}
      {r.cells.map((c, i) => {
        const p = pos[i]!, h = bars ? Math.max(6, (Number(c.v) / max) * BAR_H) : CH, top = base - h;
        return (
          <g key={i} className={cls("ds-cell", c.mark, hover?.i === i)} onMouseEnter={hover && (() => hover.set(i))} onMouseLeave={hover && (() => hover.set(null))}>
            <rect x={p.x + 1} y={top} width={p.w - 2} height={h} rx={4} />
            <text x={p.x + p.w / 2} y={bars ? top - 9 : y + CH / 2} textAnchor="middle" dominantBaseline="central" className={bars ? "ds-barval" : undefined} style={bars ? undefined : { fontSize: fs }}>{String(c.v)}</text>
            <text x={p.x + p.w / 2} y={base + 14} textAnchor="middle" className="ds-sub">{c.sub ?? ""}</text>
            {c.chain?.map((n, k) => {
              const ny = base + 22 + k * (CH + LINK_H - 8) + LINK_H - 8;
              return (
                <g key={k} className={cls("ds-cell", n.mark)}>
                  <line x1={p.x + p.w / 2} y1={ny - LINK_H + 8} x2={p.x + p.w / 2} y2={ny - 3} className="ds-edge" markerEnd="url(#ds-arrow)" />
                  <rect x={p.x + 1} y={ny} width={p.w - 2} height={CH} rx={4} />
                  <text x={p.x + p.w / 2} y={ny + CH / 2} textAnchor="middle" dominantBaseline="central" style={{ fontSize: fs }}>{String(n.v)}</text>
                </g>
              );
            })}
          </g>
        );
      })}
      {r.pointers?.map((pt, i) => {
        const cx = pos[pt.at]!.x + pos[pt.at]!.w / 2, same = levels[i]!;
        const py = bars ? base - Math.max(6, (Number(r.cells[pt.at]!.v) / max) * BAR_H) - 22 : y;
        return (
          <g key={i} className="ds-ptr">
            <path d={`M${cx - 5} ${py - 12} L${cx + 5} ${py - 12} L${cx} ${py - 5} Z`} />
            <text x={cx} y={py - 18 - same * 15} textAnchor="middle">{pt.label}</text>
          </g>
        );
      })}
    </g>
  );
}

const treeH = (n: number) => 60 + Math.floor(Math.log2(n)) * 66;
function Tree({ nodes, hover }: { nodes: Cell[]; hover: Hover }) {
  const R = 20, LH = 66;
  const pos = nodes.map((_, i) => { const d = Math.floor(Math.log2(i + 1)), k = i + 1 - 2 ** d; return { x: 40 + ((k + 0.5) / 2 ** d) * (W - 80), y: 30 + d * LH }; });
  return (
    <g>
      {nodes.map((n, i) => { if (!i) return null; const pi = (i - 1) >> 1, p = pos[pi]!, c = pos[i]!;
        const hot = n.mark === "active" && !!nodes[pi]!.mark && nodes[pi]!.mark !== "muted";
        return <line key={`e${i}`} x1={p.x} y1={p.y} x2={c.x} y2={c.y} className={hot ? "ds-edge m-active" : "ds-edge"} />; })}
      {nodes.map((n, i) => (
        <g key={i} className={cls("ds-node", n.mark, hover.i === i)} onMouseEnter={() => hover.set(i)} onMouseLeave={() => hover.set(null)}>
          <circle cx={pos[i]!.x} cy={pos[i]!.y} r={R} />
          <text x={pos[i]!.x} y={pos[i]!.y} textAnchor="middle" dominantBaseline="central">{String(n.v)}</text>
          <text x={pos[i]!.x + R + 4} y={pos[i]!.y - R + 4} className="ds-sub">{n.sub ?? i}</text>
        </g>
      ))}
    </g>
  );
}

function Graph({ g, h }: { g: NonNullable<DatastateState["graph"]>; h: number }) {
  const R = 22, P = (n: { x: number; y: number }) => ({ x: 40 + (n.x / 100) * (W - 80), y: 34 + (n.y / 100) * (h - 68) });
  const at = new Map(g.nodes.map((n) => [n.id, P(n)]));
  return (
    <g>
      {g.edges.map((e, i) => {
        const a = at.get(e.from)!, b = at.get(e.to)!, dx = b.x - a.x, dy = b.y - a.y, L = Math.hypot(dx, dy) || 1, end = R + (g.directed ? 4 : 0);
        const mx = (a.x + b.x) / 2 - (dy / L) * 12, my = (a.y + b.y) / 2 + (dx / L) * 12;
        return (
          <g key={i} className={cls("ds-edge-g", e.mark)}>
            <line x1={a.x + (dx / L) * R} y1={a.y + (dy / L) * R} x2={b.x - (dx / L) * end} y2={b.y - (dy / L) * end} className="ds-edge" markerEnd={g.directed ? "url(#ds-arrow)" : undefined} />
            {e.w !== undefined && <text x={mx} y={my} textAnchor="middle" dominantBaseline="central" className="ds-w" paintOrder="stroke">{String(e.w)}</text>}
          </g>
        );
      })}
      {g.nodes.map((n) => { const p = at.get(n.id)!; return (
        <g key={n.id} className={cls("ds-node", n.mark)}>
          <circle cx={p.x} cy={p.y} r={R} />
          <text x={p.x} y={p.y} textAnchor="middle" dominantBaseline="central">{n.label ?? n.id}</text>
          {n.note && <text x={p.x} y={p.y + R + 15} textAnchor="middle" className="ds-note" paintOrder="stroke">{n.note}</text>}
        </g>
      ); })}
    </g>
  );
}

/** Pure snapshot renderer: every step's state comes from YAML; nothing is computed here. */
export function Datastate({ state }: { state: DatastateState }) {
  const [hi, setHi] = useState<number | null>(null);
  const hover: Hover = { i: hi, set: setHi };
  const rows = state.structure === "array" ? state.rows ?? [] : [];
  const tree = state.structure === "tree" ? state.tree : undefined;
  const backing: Row | null = tree?.showArray ? { label: "数组", cells: tree.nodes.map((n, i) => ({ ...n, sub: String(i) })) } : null;
  const labels = [...rows.map((r) => r.label ?? ""), backing ? "数组" : ""];
  const labelW = labels.some(Boolean) ? Math.min(150, Math.max(64, ...labels.map((l) => textW(l, 13) + 14))) : 0;
  const offsets = rows.reduce<number[]>((acc, r, i) => [...acc, (acc[i] ?? 0) + rowHeight(r, labelW)], [0]);
  const gH = 300;
  const H = state.structure === "graph" ? gH : tree ? treeH(tree.nodes.length) + (backing ? rowHeight(backing, labelW) : 0) : offsets[rows.length]! + 8;
  const t = state.table;
  return (
    <div className={t ? "datastate with-table" : "datastate"}>
      <div className="ds-main">
        <svg viewBox={`0 0 ${W} ${H}`} role="img" aria-label={state.caption ?? "数据结构状态图"} preserveAspectRatio="xMidYMid meet">
          <defs><marker id="ds-arrow" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse"><path d="M0 0L10 5L0 10z" /></marker></defs>
          {rows.map((r, i) => <ArrayRow key={i} r={r} y0={offsets[i]!} labelW={labelW} />)}
          {tree && <Tree nodes={tree.nodes} hover={hover} />}
          {backing && <ArrayRow r={backing} y0={treeH(tree!.nodes.length)} labelW={labelW} hover={hover} />}
          {state.graph && state.structure === "graph" && <Graph g={state.graph} h={gH} />}
        </svg>
        {state.caption && <p className="ds-caption">{state.caption}</p>}
        <div className="ds-legend" aria-label="颜色图例">
          <span><i style={{ background: "var(--line-soft)", borderColor: "var(--active)" }} />active 当前比较/处理中</span>
          <span><i style={{ background: "var(--active)" }} />found 已找到/最终位置</span>
          <span><i style={{ background: "#e8f3ec", borderColor: "#3f8f5f" }} />done 已完成</span>
          <span><i style={{ background: "#fff4e5", borderColor: "#c77700" }} />pivot 基准元素</span>
          <span><i style={{ background: "var(--panel)", opacity: 0.35 }} />muted 已排除</span>
          <span><i style={{ background: "var(--line-soft)" }} />visited 已访问</span>
        </div>
        {state.aux && state.aux.length > 0 && (
          <div className="ds-aux">
            {state.aux.map((a) => (
              <div key={a.label}><span className="ds-aux-label">{a.label}</span>
                <ol>{a.items.length ? a.items.map((x, i) => <li key={i}>{String(x)}</li>) : <li className="empty">（空）</li>}</ol>
              </div>
            ))}
          </div>
        )}
      </div>
      {t && (
        <table className="ds-table">
          {t.title && <caption>{t.title}</caption>}
          <thead><tr>{t.columns.map((c) => <th key={c}>{c}</th>)}</tr></thead>
          <tbody>{t.rows.map((r, i) => <tr key={i} className={t.highlight?.includes(i) ? "hot" : undefined}>{r.map((v, j) => <td key={j}>{String(v)}</td>)}</tr>)}</tbody>
        </table>
      )}
    </div>
  );
}
