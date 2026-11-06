// Case runners shared by the lab UIs (YAML `cases` self-check) and scripts/lab-selftest.mts.
import { addBits, decodeTwos, decodeUnsigned, exactDecimal, float32FromBits, float32FromNumber, hex32 } from "./bits.ts";
import { parseHex, splitAddress, type AddrCfg } from "./addr.ts";
import { normInstr, schedule } from "./pipeline.ts";
import { runLabels, simulateLocks } from "./race.ts";
import { bsCase } from "./search.ts";
import { sortCase } from "./sort.ts";

type P = Record<string, unknown>;
export type Runner = (params: P, input: P) => P;
const n = (v: unknown, d: number) => (typeof v === "number" ? v : d);
const s = (v: unknown, d: string) => (typeof v === "string" ? v : d);

export function bitCase(_: P, i: P): P {
  const mode = s(i.mode, "twos");
  if (mode === "float32") {
    const f = typeof i.value === "number" ? float32FromNumber(i.value) : float32FromBits(s(i.bits, "0".repeat(32)).replace(/\s/g, ""));
    return { bits: `${f.sign} ${f.exponent} ${f.fraction}`, hex: hex32(f.bits), exponent: f.expValue, stored: exactDecimal(f.bits) };
  }
  const m = mode === "unsigned" ? "unsigned" : "twos";
  let bits = s(i.bits, "0").replace(/\s/g, ""), overflow = false, signedOverflow = false;
  const op = s(i.op, "").match(/^([+-])(\d+)$/);
  if (op) {
    const d = BigInt((op[1] === "-" ? "-" : "") + op[2]);
    overflow = addBits(bits, d, "unsigned").overflow; // carry/borrow out of the width: the bits wrapped around
    signedOverflow = addBits(bits, d, "twos").overflow; // result outside the two's-complement range
    bits = addBits(bits, d, m).bits;
  }
  const v = m === "twos" ? decodeTwos(bits) : decodeUnsigned(bits);
  return { bits, decimal: Number(v), value: Number(v), overflow, signedOverflow, hex: "0x" + decodeUnsigned(bits).toString(16).toUpperCase() };
}
export const addrCfg = (p: P): AddrCfg => ({ vaBits: n(p.vaBits, 48), pageSize: n(p.pageSize, 4096), levels: n(p.levels, 4), bitsPerLevel: n(p.bitsPerLevel, 9) });
export function addrCase(p: P, i: P): P {
  const r = splitAddress(parseHex(s(i.address, "0")) ?? 0n, addrCfg(p));
  return { indices: r.indices, offset: "0x" + r.offset.toString(16), canonical: r.canonical };
}
export const program = (p: P) => (Array.isArray(p.program) ? (p.program as P[]).map(normInstr) : []);
export function pipeCase(p: P, i: P): P {
  const x = schedule(program(p), { forwarding: i.forwarding === true, ideal: i.ideal === true, regfileSplitCycle: (i.regfileSplitCycle ?? p.regfileSplitCycle) !== false });
  return { cycles: x.cycles, stalls: x.perInstr, totalStalls: x.stalls };
}
export function raceCase(p: P, i: P): P {
  const lock = (i.useLock ?? i.lock) === true;
  return { counter: runLabels((i.schedule ?? p.schedule ?? []) as string[], lock, n(i.initial ?? p.initial, 0)).counter };
}
export function wfgCase(_: P, i: P): P {
  const x = simulateLocks((i.acquireOrder ?? i) as Record<string, string[]>);
  return { deadlock: x.deadlock, cycle: x.cycle };
}
export const RUNNERS: Record<string, Runner> = {
  "bit-editor": bitCase, "addr-split": addrCase, "pipeline-chart": pipeCase,
  interleave: (p, i) => (p.mode === "wait-for-graph" ? wfgCase(p, i) : raceCase(p, i)), "wait-for-graph": wfgCase, "binary-search-lab": bsCase, "sort-compare": sortCase,
};
