import type { SwimlaneState } from "@/lib/schema";

type Lane = { id: string; label: string };
const LANE_H = 96, TOP = 8, LABEL_W = 96, W = 640, BOX_W = 200, BOX_H = 44;

export function Swimlane({ state, lanes }: { state: SwimlaneState; lanes?: Lane[] }) {
  const ls = lanes ?? [...new Set(state.actors.map((a) => a.lane))].map((id) => ({ id, label: id }));
  const laneY = new Map(ls.map((l, i) => [l.id, TOP + i * LANE_H]));
  const pos = new Map(state.actors.map((a) => {
    const y = (laneY.get(a.lane) ?? 0) + (LANE_H - BOX_H) / 2;
    return [a.id, { x: LABEL_W + (W - LABEL_W - BOX_W) / 2, y }];
  }));
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
          <text x={10} y={TOP + i * LANE_H + LANE_H / 2} dominantBaseline="middle" className="sl-lane-label">{l.label}</text>
        </g>
      ))}
      {state.messages.map((m) => {
        const a = pos.get(m.from), b = pos.get(m.to);
        if (!a || !b) return null;
        const down = b.y > a.y;
        const x = a.x + BOX_W / 2 + (down ? -40 : 40);
        const y1 = down ? a.y + BOX_H : a.y, y2 = down ? b.y : b.y + BOX_H;
        return (
          <g key={m.id} className={`sl-msg${m.active ? " active" : ""}`}>
            <line x1={x} y1={y1} x2={x} y2={y2} markerEnd="url(#arrow)" />
            <text x={x + 8} y={(y1 + y2) / 2} dominantBaseline="middle">{m.label}</text>
          </g>
        );
      })}
      {state.actors.map((a) => {
        const p = pos.get(a.id)!;
        return (
          <g key={a.id} className={`sl-actor${a.highlight ? " hl" : ""}`} style={{ transform: `translate(${p.x}px, ${p.y}px)` }}>
            <rect width={BOX_W} height={BOX_H} rx={2} />
            <text x={BOX_W / 2} y={a.state ? 17 : BOX_H / 2} textAnchor="middle" dominantBaseline="middle" className="sl-actor-label">{a.label}</text>
            {a.state && <text x={BOX_W / 2} y={33} textAnchor="middle" dominantBaseline="middle" className="sl-actor-state">{a.state}</text>}
          </g>
        );
      })}
    </svg>
  );
}
