import type { SwimlaneState } from "@/lib/schema";

type Lane = { id: string; label: string };
type Box = { x: number; y: number; w: number; h: number };
const TOP = 8, LABEL_W = 84, W = 560, BOX_H = 52, GAP = 20, MAX_BOX_W = 180;
const laneH = (n: number) => (n <= 3 ? 120 : 92);

/** Point where the segment from the box centre towards (tx,ty) leaves the box. */
function edge(b: Box, tx: number, ty: number): [number, number] {
  const cx = b.x + b.w / 2, cy = b.y + b.h / 2, dx = tx - cx, dy = ty - cy;
  if (dx === 0 && dy === 0) return [cx, cy];
  const s = Math.min(dx ? b.w / 2 / Math.abs(dx) : Infinity, dy ? b.h / 2 / Math.abs(dy) : Infinity);
  return [cx + dx * s, cy + dy * s];
}

/** Lays actors of one lane side by side; returns a box per actor id. */
export function layoutSwimlane(state: SwimlaneState, lanes: Lane[]): Map<string, Box> {
  const LANE_H = laneH(lanes.length);
  const boxes = new Map<string, Box>();
  const avail = W - LABEL_W - GAP;
  lanes.forEach((l, li) => {
    const list = state.actors.filter((a) => a.lane === l.id);
    const n = list.length;
    if (!n) return;
    const w = Math.min(MAX_BOX_W, (avail - GAP * (n - 1)) / n);
    const total = n * w + (n - 1) * GAP;
    const x0 = LABEL_W + (avail - total) / 2;
    const y = TOP + li * LANE_H + (LANE_H - BOX_H) / 2;
    list.forEach((a, i) => boxes.set(a.id, { x: x0 + i * (w + GAP), y, w, h: BOX_H }));
  });
  return boxes;
}

export function Swimlane({ state, lanes }: { state: SwimlaneState; lanes?: Lane[] }) {
  const ls = lanes ?? [...new Set(state.actors.map((a) => a.lane))].map((id) => ({ id, label: id }));
  const boxes = layoutSwimlane(state, ls);
  const LANE_H = laneH(ls.length);
  const H = TOP * 2 + ls.length * LANE_H;
  return (
    <svg className="swimlane" viewBox={`0 0 ${W} ${H}`} role="img" aria-label="泳道时序图" preserveAspectRatio="xMidYMid meet">
      <defs>
        <marker id="arrow" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse">
          <path d="M0 0L10 5L0 10z" className="sl-arrowhead" />
        </marker>
      </defs>
      {ls.map((l, i) => (
        <g key={l.id} className="sl-lane">
          <rect x={0} y={TOP + i * LANE_H} width={W} height={LANE_H} className={i % 2 ? "sl-lane-bg alt" : "sl-lane-bg"} />
          <foreignObject x={6} y={TOP + i * LANE_H} width={LABEL_W - 12} height={LANE_H}>
            <div className="sl-lane-label">{l.label}</div>
          </foreignObject>
        </g>
      ))}
      {state.actors.map((a) => {
        const b = boxes.get(a.id)!;
        return (
          <g key={a.id} className={`sl-actor${a.highlight ? " hl" : ""}`} style={{ transform: `translate(${b.x}px, ${b.y}px)` }}>
            <rect width={b.w} height={b.h} rx={2} />
            <foreignObject width={b.w} height={b.h}>
              <div className="sl-actor-box">
                <span className="sl-actor-label">{a.label}</span>
                {a.state && <span className="sl-actor-state">{a.state}</span>}
              </div>
            </foreignObject>
          </g>
        );
      })}
      {state.messages.map((m) => {
        /** Rough label width at 13px (CJK ≈ 13px, others ≈ 7.5px); keeps start-anchored labels inside the viewBox. */
        const fit = (x: number, label: string) => Math.max(LABEL_W, Math.min(x, W - 6 - [...label].reduce((n, c) => n + (c.charCodeAt(0) > 0x2e7f ? 13 : 7.5), 0)));
        const a = boxes.get(m.from), b = boxes.get(m.to);
        if (!a || !b) return null;
        const sameLane = Math.abs(a.y - b.y) < 1;
        const lo = Math.min(a.x, b.x), hi = Math.max(a.x, b.x);
        const blocked = sameLane && [...boxes.values()].some((o) => o !== a && o !== b && Math.abs(o.y - a.y) < 1 && o.x > lo && o.x < hi);
        if (blocked) {
          // Arc over the boxes in between, from top edge to top edge.
          const x1 = a.x + a.w / 2, x2 = b.x + b.w / 2, y = a.y, cy = y - 34;
          return (
            <g key={m.id} className={`sl-msg${m.active ? " active" : ""}`}>
              <path d={`M${x1} ${y} Q${(x1 + x2) / 2} ${cy} ${x2} ${y}`} fill="none" markerEnd="url(#arrow)" />
              <text x={(x1 + x2) / 2} y={cy + 6} textAnchor="middle" dominantBaseline="middle" paintOrder="stroke" className="sl-msg-label">{m.label}</text>
            </g>
          );
        }
        const crosses = !sameLane && [...boxes.values()].some((o) => o !== a && o !== b && o.y > Math.min(a.y, b.y) && o.y < Math.max(a.y, b.y) && o.x < Math.max(a.x + a.w, b.x + b.w) && o.x + o.w > Math.min(a.x, b.x));
        if (crosses) {
          // Route around the right side of the boxes in between.
          const xr = Math.max(...[...boxes.values()].filter((o) => o.y >= Math.min(a.y, b.y) && o.y <= Math.max(a.y, b.y)).map((o) => o.x + o.w)) + 28;
          const ya = a.y + a.h / 2, yb = b.y + b.h / 2;
          return (
            <g key={m.id} className={`sl-msg${m.active ? " active" : ""}`}>
              <path d={`M${a.x + a.w} ${ya} H${xr} V${yb} H${b.x + b.w}`} markerEnd="url(#arrow)" />
              <text x={fit(xr + 8, m.label)} y={(ya + yb) / 2} dominantBaseline="middle" paintOrder="stroke" className="sl-msg-label">{m.label}</text>
            </g>
          );
        }
        const [x1, y1] = edge(a, b.x + b.w / 2, b.y + b.h / 2);
        const [x2, y2] = edge(b, a.x + a.w / 2, a.y + a.h / 2);
        const lx = (x1 + x2) / 2, ly = (y1 + y2) / 2;
        return (
          <g key={m.id} className={`sl-msg${m.active ? " active" : ""}`}>
            <line x1={x1} y1={y1} x2={x2} y2={y2} markerEnd="url(#arrow)" />
            <text x={sameLane ? lx : fit(lx + 8, m.label)} y={sameLane ? ly + 31 : ly} textAnchor={sameLane ? "middle" : "start"} dominantBaseline="middle" paintOrder="stroke" className="sl-msg-label">{m.label}</text>
          </g>
        );
      })}
    </svg>
  );
}
