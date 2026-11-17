"use client";
import { useState } from "react";
import type { LabProps } from "./registry";
import { Cases } from "./Cases";
import { fmt } from "@/i18n";
import { useLang } from "@/i18n/client";
import { simulateLocks } from "@/lib/labs/race";

const asOrder = (v: unknown): Record<string, string[]> => (v && typeof v === "object" ? (v as Record<string, string[]>) : { T1: ["A", "B"], T2: ["B", "A"] });
export default function WaitForGraph({ state }: LabProps) {
  const { lang, s } = useLang();
  const listSep = lang === "zh" ? "，" : ", ";
  const enumSep = lang === "zh" ? "、" : ", ";
  const p = state.params ?? {};
  const base = asOrder(p.acquireOrder);
  const [same, setSame] = useState(false);
  const first = Object.values(base)[0] ?? [];
  const order = same ? Object.fromEntries(Object.keys(base).map((t) => [t, [...first]])) : base;
  const r = simulateLocks(order);
  const threads = Object.keys(order), locks = [...new Set(Object.values(order).flat())];
  const pos = (id: string, i: number, n: number, y: number) => ({ id, x: 60 + (i * 320) / Math.max(1, n - 1), y });
  const T = threads.map((t, i) => pos(t, i, threads.length, 40)), L = locks.map((l, i) => pos(l, i, locks.length, 170));
  const at = (id: string) => [...T, ...L].find((n) => n.id === id)!;
  const edges = [...Object.entries(r.holds).map(([l, t]) => ({ from: l, to: t, kind: "hold" })), ...Object.entries(r.waits).map(([t, l]) => ({ from: t, to: l, kind: "wait" }))];
  const inCycle = (id: string) => r.cycle.includes(id);
  return (
    <div className="lab-wfg">
      <div className="lab-row">
        <label><input type="checkbox" checked={same} onChange={(e) => setSame(e.target.checked)} /> {s.labWfgSameOrder}</label>
        <span className="lab-out">{threads.map((t) => `${t}: ${order[t]!.join("→")}`).join(lang === "zh" ? "；" : "; ")}</span>
      </div>
      <svg viewBox="0 0 440 210" className="wfg" role="img" aria-label={s.labWfgAria}>
        <defs><marker id="wfg-a" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto"><path d="M0 0L10 5L0 10z" fill="currentColor" /></marker></defs>
        {edges.map((e, i) => { const a = at(e.from), b = at(e.to); const dx = b.x - a.x, dy = b.y - a.y, d = Math.hypot(dx, dy) || 1, k = 26 / d; const bend = e.kind === "wait" ? 18 : -18;
          return <path key={i} className={`wfg-e ${e.kind} ${inCycle(e.from) && inCycle(e.to) && r.deadlock ? "cyc" : ""}`} d={`M${a.x + dx * k} ${a.y + dy * k} Q${(a.x + b.x) / 2 + bend} ${(a.y + b.y) / 2} ${b.x - dx * k} ${b.y - dy * k}`} markerEnd="url(#wfg-a)" />; })}
        {T.map((n) => <g key={n.id} className={`wfg-n t ${r.deadlock && inCycle(n.id) ? "cyc" : ""}`}><circle cx={n.x} cy={n.y} r="22" /><text x={n.x} y={n.y + 5}>{n.id}</text></g>)}
        {L.map((n) => <g key={n.id} className={`wfg-n l ${r.deadlock && inCycle(n.id) ? "cyc" : ""}`}><rect x={n.x - 22} y={n.y - 18} width="44" height="36" rx="4" /><text x={n.x} y={n.y + 5}>{fmt(s.labWfgLockNode, { id: n.id })}</text></g>)}
      </svg>
      <p className="lab-out">{s.labWfgLegend}{r.deadlock ? <b className="lab-warn">{fmt(s.labWfgDeadlock, { list: r.cycle.filter((x) => x in r.waits).map((t) => fmt(s.labWfgWaitItem, { t, l: r.waits[t]! })).join(listSep) })}</b> : <b>{fmt(s.labWfgNoCycle, { list: r.finished.join(enumSep) })}</b>}</p>
      <Cases state={state} />
    </div>
  );
}
