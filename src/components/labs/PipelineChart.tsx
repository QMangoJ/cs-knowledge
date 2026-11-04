"use client";
import { useState } from "react";
import type { LabProps } from "./registry";
import { Cases } from "./Cases";
import { normInstr, schedule, type Instr } from "@/lib/labs/pipeline";

const STAGES = ["IF", "ID", "EX", "MEM", "WB"] as const;
const DEFAULT: Instr[] = [
  { text: "lw  x1, 0(x2)", dst: "x1", src: ["x2"], load: true },
  { text: "add x3, x1, x4", dst: "x3", src: ["x1", "x4"] },
  { text: "sub x5, x3, x6", dst: "x5", src: ["x3", "x6"] },
  { text: "or  x7, x8, x9", dst: "x7", src: ["x8", "x9"] },
];
export default function PipelineChart({ state }: LabProps) {
  const p = state.params ?? {};
  const prog = Array.isArray(p.program) ? (p.program as Record<string, unknown>[]).map(normInstr) : DEFAULT;
  const [mode, setMode] = useState<"stall" | "fwd" | "ideal">(p.forwarding === true ? "fwd" : "stall");
  const r = schedule(prog, { forwarding: mode === "fwd", ideal: mode === "ideal", regfileSplitCycle: p.regfileSplitCycle !== false });
  const fwd = mode === "fwd";
  const cols = Array.from({ length: r.cycles }, (_, i) => i + 1);
  return (
    <div className="lab-pipe">
      <div className="lab-row">{([["ideal", "理想（不管冒险）"], ["stall", "无转发"], ["fwd", "有转发"]] as const).map(([k, l]) => <label key={k}><input type="radio" checked={mode === k} onChange={() => setMode(k)} /> {l}</label>)}
        <span className="lab-out">共 <b>{r.cycles}</b> 个周期，气泡 <b>{r.stalls}</b> 个</span></div>
      <div className="pipe-scroll">
        <table className="pipe">
          <thead><tr><th>指令</th>{cols.map((c) => <th key={c}>{c}</th>)}</tr></thead>
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
      <p className="lab-out">· 表示停顿：指令卡在 IF/ID 等前一条的结果。{mode === "ideal" ? "理想情况：每拍进一条，n 条指令要 n+4 拍；但这忽略了数据依赖，结果会算错。" : fwd ? "转发把 EX/MEM 的结果直接送到下一条的 EX，只剩 load 之后的 1 拍。" : "没有转发时要等到前一条 WB 写回寄存器堆。"}</p>
      <Cases state={state} />
    </div>
  );
}
