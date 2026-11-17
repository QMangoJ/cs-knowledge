"use client";
import { useState } from "react";
import type { LabProps } from "./registry";
import { Cases } from "./Cases";
import { fmt } from "@/i18n";
import { useLang } from "@/i18n/client";
import { OPS, initRace, runLabels, stepRace } from "@/lib/labs/race";
import WaitForGraph from "./WaitForGraph";

export default function Interleave({ state }: LabProps) {
  if (state.params?.mode === "wait-for-graph") return <WaitForGraph state={state} />;
  return <Race state={state} />;
}

function Race({ state }: LabProps) {
  const { lang, s: ui } = useLang();
  const p = state.params ?? {};
  const initial = typeof p.initial === "number" ? p.initial : 0;
  const sched = Array.isArray(p.schedule) ? (p.schedule as string[]) : [];
  const [lock, setLock] = useState((p.useLock ?? p.lock) === true);
  const [s, setS] = useState(initRace(2, initial));
  const done = s.threads.every((t) => t.pc >= OPS.length);
  return (
    <div className="lab-race">
      <div className="lab-row">
        <label><input type="checkbox" checked={lock} onChange={(e) => { setLock(e.target.checked); setS(initRace(2, initial)); }} /> {ui.labRaceLockLabel}</label>
        <button onClick={() => setS(initRace(2, initial))}>{ui.labRaceRestart}</button>
        {sched.length > 0 && <button onClick={() => setS(runLabels(sched, lock, initial, 2, lang))}>{fmt(ui.labRaceRunSeq, { seq: sched.join(" ") })}</button>}
      </div>
      <div className="race-grid">
        {s.threads.map((t, i) => (
          <div key={i} className={`race-t ${t.blocked ? "blocked" : ""}`}>
            <b>T{i + 1}</b>
            <ol>{OPS.map((op, k) => <li key={op} className={k < t.pc ? "done" : k === t.pc ? "next" : ""}>{op === "read" ? "reg = counter" : op === "add" ? "reg = reg + 1" : "counter = reg"}</li>)}</ol>
            <span>reg = {t.reg}{t.blocked ? ui.labRaceWaiting : ""}</span>
            <button disabled={t.pc >= OPS.length} onClick={() => setS(stepRace(s, i, lock, lang))}>{fmt(ui.labRaceStep, { t: i + 1 })}</button>
          </div>
        ))}
        <div className="race-mem"><span>counter</span><b>{s.counter}</b>{lock && <small>{ui.labRaceLock}{s.owner === null ? ui.labRaceLockFree : fmt(ui.labRaceLockHeld, { t: s.owner + 1 })}</small>}</div>
      </div>
      <p className="lab-out">{s.trace.join(" → ") || ui.labRaceHint}{done && (s.counter === initial + 2 ? ui.labRaceCorrect : ui.labRaceLost)}</p>
      <Cases state={state} />
    </div>
  );
}
