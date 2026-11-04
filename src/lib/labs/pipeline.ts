// Classic 5-stage in-order pipeline timing. Register file writes in the first half of WB and reads in the second half of ID.
export type Instr = { text: string; dst?: string; src?: string[]; load?: boolean };
/** Product YAML uses {op, writes, reads, load}; accept both. */
export function normInstr(x: Record<string, unknown>): Instr {
  return { text: String(x.op ?? x.text ?? ""), dst: (x.writes ?? x.dst) as string | undefined, src: (x.reads ?? x.src) as string[] | undefined, load: x.load === true };
}
export type PipeOpts = { forwarding: boolean; ideal?: boolean; regfileSplitCycle?: boolean };
export type Timing = { IF: number; ID: number; EX: number; MEM: number; WB: number; stalls: number };
export function schedule(prog: Instr[], o: PipeOpts | boolean): { rows: Timing[]; cycles: number; stalls: number; perInstr: { instr: number; bubbles: number }[] } {
  const opt = typeof o === "boolean" ? { forwarding: o } : o, forwarding = opt.forwarding, split = opt.regfileSplitCycle !== false;
  const rows: Timing[] = [];
  prog.forEach((ins, i) => {
    const IF = i === 0 ? 1 : rows[i - 1]!.ID;
    let ID = Math.max(IF + 1, i === 0 ? 0 : rows[i - 1]!.ID + 1);
    for (const r of opt.ideal ? [] : ins.src ?? []) {
      for (let p = i - 1; p >= 0; p--) {
        if (prog[p]!.dst !== r) continue;
        const t = rows[p]!;
        ID = Math.max(ID, forwarding ? (prog[p]!.load ? t.MEM : t.EX) : split ? t.WB : t.WB + 1); // fwd: EX(i) ≥ EX/MEM(p)+1 ⇒ ID(i) ≥ EX/MEM(p)
        break;
      }
    }
    rows.push({ IF, ID, EX: ID + 1, MEM: ID + 2, WB: ID + 3, stalls: ID - IF - 1 });
  });
  return { rows, cycles: rows.at(-1)?.WB ?? 0, stalls: rows.reduce((n, r) => n + r.stalls, 0), perInstr: rows.flatMap((r, i) => (r.stalls ? [{ instr: i + 1, bubbles: r.stalls }] : [])) };
}
