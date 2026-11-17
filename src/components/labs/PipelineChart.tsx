"use client";
import { useState } from "react";
import type { LabProps } from "./registry";
import { Cases } from "./Cases";
import { useLang } from "@/i18n/client";
import { normInstr, schedule, type Instr } from "@/lib/labs/pipeline";

const STAGES = ["IF", "ID", "EX", "MEM", "WB"] as const;
const DEFAULT: Instr[] = [
  { text: "lw  x1, 0(x2)", dst: "x1", src: ["x2"], load: true },
  { text: "add x3, x1, x4", dst: "x3", src: ["x1", "x4"] },
  { text: "sub x5, x3, x6", dst: "x5", src: ["x3", "x6"] },
  { text: "or  x7, x8, x9", dst: "x7", src: ["x8", "x9"] },
];
export default function PipelineChart({ state }: LabProps) {
  const { s } = useLang();
  const p = state.params ?? {};
  const prog = Array.isArray(p.program) ? (p.program as Record<string, unknown>[]).map(normInstr) : DEFAULT;
  const [mode, setMode] = useState<"stall" | "fwd" | "ideal">(p.forwarding === true ? "fwd" : "stall");
  const r = schedule(prog, { forwarding: mode === "fwd", ideal: mode === "ideal", regfileSplitCycle: p.regfileSplitCycle !== false });
  const fwd = mode === "fwd";
  const cols = Array.from({ length: r.cycles }, (_, i) => i + 1);
  return (
    <div className="lab-pipe">
      <div className="lab-row">{([["ideal", s.labPipeIdeal], ["stall", s.labPipeStall], ["fwd", s.labPipeFwd]] as const).map(([k, l]) => <label key={k}><input type="radio" checked={mode === k} onChange={() => setMode(k)} /> {l}</label>)}
        <span className="lab-out">{s.labPipeSummaryStart}<b>{r.cycles}</b>{s.labPipeSummaryMid}<b>{r.stalls}</b>{s.labPipeSummaryEnd}</span></div>
      <div className="pipe-scroll">
        <table className="pipe">
          <thead><tr><th>{s.labPipeInstr}</th>{cols.map((c) => <th key={c}>{c}</th>)}</tr></thead>
          <tbody>
            {prog.map((ins, i) => {
              const t = r.rows[i]!;
              return (
                <tr key={i}><th><code>{ins.text}</code></th>
                  {cols.map((c) => {
                    const st = STAGES.find((s) => t[s] === c);
                    const bubble = !st && c > t.IF && c < t.ID;
                    return <td key={c} className={st ? `st ${st}` : bubble ? "bubble" : ""}>{st ?? (bubble ? "·" : "")}</td>;
                  })}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      <p className="lab-out">{s.labPipeNotePre}{mode === "ideal" ? s.labPipeNoteIdeal : fwd ? s.labPipeNoteFwd : s.labPipeNoteStall}</p>
      <Cases state={state} />
    </div>
  );
}
