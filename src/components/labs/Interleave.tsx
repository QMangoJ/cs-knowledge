"use client";
import { useState } from "react";
import type { LabProps } from "./registry";
import { Cases } from "./Cases";
import { OPS, initRace, runLabels, stepRace } from "@/lib/labs/race";
import WaitForGraph from "./WaitForGraph";

export default function Interleave({ state }: LabProps) {
  if (state.params?.mode === "wait-for-graph") return <WaitForGraph state={state} />;
  return <Race state={state} />;
}

function Race({ state }: LabProps) {
  const p = state.params ?? {};
  const initial = typeof p.initial === "number" ? p.initial : 0;
  const sched = Array.isArray(p.schedule) ? (p.schedule as string[]) : [];
  const [lock, setLock] = useState((p.useLock ?? p.lock) === true);
  const [s, setS] = useState(initRace(2, initial));
  const done = s.threads.every((t) => t.pc >= OPS.length);
  return (
    <div className="lab-race">
      <div className="lab-row">
        <label><input type="checkbox" checked={lock} onChange={(e) => { setLock(e.target.checked); setS(initRace(2, initial)); }} /> 用互斥锁保护 counter++</label>
        <button onClick={() => setS(initRace(2, initial))}>重来</button>
        {sched.length > 0 && <button onClick={() => setS(runLabels(sched, lock, initial))}>按顺序 {sched.join(" ")} 跑一遍</button>}
      </div>
      <div className="race-grid">
        {s.threads.map((t, i) => (
          <div key={i} className={`race-t ${t.blocked ? "blocked" : ""}`}>
            <b>T{i + 1}</b>
            <ol>{OPS.map((op, k) => <li key={op} className={k < t.pc ? "done" : k === t.pc ? "next" : ""}>{op === "read" ? "reg = counter" : op === "add" ? "reg = reg + 1" : "counter = reg"}</li>)}</ol>
            <span>reg = {t.reg}{t.blocked ? " · 等锁中" : ""}</span>
            <button disabled={t.pc >= OPS.length} onClick={() => setS(stepRace(s, i, lock))}>T{i + 1} 走一步</button>
          </div>
        ))}
        <div className="race-mem"><span>counter</span><b>{s.counter}</b>{lock && <small>锁：{s.owner === null ? "空闲" : `T${s.owner + 1} 持有`}</small>}</div>
      </div>
      <p className="lab-out">{s.trace.join(" → ") || "交替点击两个线程，试着让两次 ++ 只加了 1。"}{done && (s.counter === initial + 2 ? " ✔ 结果正确" : " ✘ 丢了一次更新")}</p>
      <Cases state={state} />
    </div>
  );
}
