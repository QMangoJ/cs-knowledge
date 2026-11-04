import type { DatastateState } from "@/lib/schema";

type Cell = { v: string | number; sub?: string; mark?: string };
type Row = NonNullable<DatastateState["rows"]>[number];
const W = 560, ROW_H = 100;
const cls = (base: string, mark?: string) => (mark ? `${base} m-${mark}` : base);

function rowLayout(r: Row, labelW: number) {
  const gaps = r.breaks?.length ?? 0, GAP = 14;
  const cw = Math.min(56, (W - labelW - 8 - gaps * GAP) / r.cells.length);
  const total = cw * r.cells.length + gaps * GAP;
  const x0 = labelW + (W - labelW - total) / 2;
  return r.cells.map((_, i) => x0 + i * cw + (r.breaks?.filter((b) => b <= i).length ?? 0) * GAP).map((x) => ({ x, w: cw }));
}

function ArrayRows({ rows, y0 }: { rows: Row[]; y0: number }) {
  const labelW = rows.some((r) => r.label) ? 84 : 0, H = ROW_H, CH = 42;
  return (
    <g>
      {rows.map((r, ri) => {
        const pos = rowLayout(r, labelW), y = y0 + ri * H + (r.pointers?.length ? 40 : 24);
        const fs = pos[0]!.w < 34 ? 12 : 15;
        return (
          <g key={ri}>
            {r.label && <text x={0} y={y + CH / 2} dominantBaseline="middle" className="ds-rowlabel">{r.label}</text>}
            {r.range && (() => { const a = pos[r.range.from]!, b = pos[r.range.to]!; return <rect x={a.x - 4} y={y - 4} width={b.x + b.w - a.x + 8} height={CH + 8} rx={8} className="ds-range" />; })()}
            {r.cells.map((c, i) => (
              <g key={i} className={cls("ds-cell", c.mark)}>
                <rect x={pos[i]!.x + 1} y={y} width={pos[i]!.w - 2} height={CH} rx={4} />
                <text x={pos[i]!.x + pos[i]!.w / 2} y={y + CH / 2} textAnchor="middle" dominantBaseline="central" style={{ fontSize: fs }}>{String(c.v)}</text>
                <text x={pos[i]!.x + pos[i]!.w / 2} y={y + CH + 14} textAnchor="middle" className="ds-sub">{c.sub ?? ""}</text>
              </g>
            ))}
            {r.pointers?.map((p, i) => {
              const cx = pos[p.at]!.x + pos[p.at]!.w / 2;
              const same = r.pointers!.slice(0, i).filter((q) => q.at === p.at).length;
              return (
                <g key={i} className="ds-ptr">
                  <path d={`M${cx - 5} ${y - 12} L${cx + 5} ${y - 12} L${cx} ${y - 5} Z`} />
                  <text x={cx} y={y - 18 - same * 15} textAnchor="middle">{p.label}</text>
                </g>
              );
            })}
          </g>
        );
      })}
    </g>
  );
}

function Tree({ nodes, y0 }: { nodes: Cell[]; y0: number }) {
  const R = 20, LH = 66, depth = Math.floor(Math.log2(nodes.length)) + 1;
  const pos = nodes.map((_, i) => { const d = Math.floor(Math.log2(i + 1)), k = i + 1 - 2 ** d; return { x: 40 + ((k + 0.5) / 2 ** d) * (W - 80), y: y0 + 30 + d * LH }; });
  return (
    <g>
      {nodes.map((n, i) => i > 0 && (() => { const p = pos[(i - 1) >> 1]!, c = pos[i]!, hot = n.mark === "active" && nodes[(i - 1) >> 1]!.mark && nodes[(i - 1) >> 1]!.mark !== "muted";
        return <line key={`e${i}`} x1={p.x} y1={p.y} x2={c.x} y2={c.y} className={hot ? "ds-edge m-active" : "ds-edge"} />; })())}
      {nodes.map((n, i) => (
        <g key={i} className={cls("ds-node", n.mark)}>
          <circle cx={pos[i]!.x} cy={pos[i]!.y} r={R} />
          <text x={pos[i]!.x} y={pos[i]!.y} textAnchor="middle" dominantBaseline="central">{String(n.v)}</text>
          <text x={pos[i]!.x + R + 4} y={pos[i]!.y - R + 4} className="ds-sub">{n.sub ?? i}</text>
        </g>
      ))}
      <desc>{depth} 层</desc>
    </g>
  );
}
const treeH = (n: number) => 60 + Math.floor(Math.log2(n)) * 66;

function Graph({ g, h }: { g: NonNullable<DatastateState["graph"]>; h: number }) {
  const R = 22, P = (n: { x: number; y: number }) => ({ x: 40 + (n.x / 100) * (W - 80), y: 34 + (n.y / 100) * (h - 68) });
  const at = new Map(g.nodes.map((n) => [n.id, P(n)]));
  return (
    <g>
      {g.edges.map((e, i) => {
        const a = at.get(e.from)!, b = at.get(e.to)!, dx = b.x - a.x, dy = b.y - a.y, L = Math.hypot(dx, dy) || 1;
        const x1 = a.x + (dx / L) * R, y1 = a.y + (dy / L) * R, x2 = b.x - (dx / L) * (R + (g.directed ? 4 : 0)), y2 = b.y - (dy / L) * (R + (g.directed ? 4 : 0));
        const mx = (a.x + b.x) / 2 - (dy / L) * 12, my = (a.y + b.y) / 2 + (dx / L) * 12;
        return (
          <g key={i} className={cls("ds-edge-g", e.mark)}>
            <line x1={x1} y1={y1} x2={x2} y2={y2} className="ds-edge" markerEnd={g.directed ? "url(#ds-arrow)" : undefined} />
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

export function Datastate({ state }: { state: DatastateState }) {
  const rows = state.structure === "array" ? state.rows ?? [] : [];
  const tree = state.structure === "tree" ? state.tree : undefined;
  const backing: Row[] = tree?.showArray ? [{ label: "数组", cells: tree.nodes.map((n, i) => ({ ...n, sub: String(i) })) }] : [];
  const gH = 300;
  const H = state.structure === "graph" ? gH : tree ? treeH(tree.nodes.length) + backing.length * ROW_H : rows.length * ROW_H + 8;
  return (
    <div className="datastate">
      <svg viewBox={`0 0 ${W} ${H}`} role="img" aria-label={state.caption ?? "数据结构状态图"} preserveAspectRatio="xMidYMid meet">
        <defs><marker id="ds-arrow" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse"><path d="M0 0L10 5L0 10z" /></marker></defs>
        {rows.length > 0 && <ArrayRows rows={rows} y0={0} />}
        {tree && <Tree nodes={tree.nodes} y0={0} />}
        {backing.length > 0 && <ArrayRows rows={backing} y0={treeH(tree!.nodes.length)} />}
        {state.graph && state.structure === "graph" && <Graph g={state.graph} h={gH} />}
      </svg>
      {state.caption && <p className="ds-caption">{state.caption}</p>}
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
  );
}
