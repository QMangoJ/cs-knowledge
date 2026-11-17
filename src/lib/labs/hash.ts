// Pure logic for hash-playground: open addressing with linear probing, h(k) = k mod capacity,
// doubling rehash when load factor would exceed 0.7. No app imports (selftest loads with plain Node);
// frame messages come from the sibling messages.ts table, keyed by the caller's language.
import { labFmt, labMsg, type LabLang } from "./messages.ts";
export type HashFrame = { slots: (number | null)[]; msg: string; probes: number; cap: number };
export type HashResult = { frames: HashFrame[]; slots: (number | null)[]; totalProbes: number; resizes: number; size: number };

const h = (k: number, cap: number) => ((k % cap) + cap) % cap;

export function hashTrace(keys: number[], cap0 = 8, lang: LabLang = "zh"): HashResult {
  const M = labMsg(lang).hash;
  let cap = cap0;
  let slots: (number | null)[] = Array(cap).fill(null);
  let size = 0, totalProbes = 0, resizes = 0;
  const frames: HashFrame[] = [{ slots: [...slots], msg: labFmt(M.empty, { cap }), probes: 0, cap }];
  const place = (tbl: (number | null)[], k: number): number => {
    let i = h(k, tbl.length), p = 1;
    while (tbl[i] !== null) { i = (i + 1) % tbl.length; p++; }
    tbl[i] = k;
    return p;
  };
  for (const k of keys) {
    if ((size + 1) / cap > 0.7) {
      const old = slots;
      cap *= 2; resizes++;
      slots = Array(cap).fill(null);
      for (const v of old) if (v !== null) place(slots, v);
      frames.push({ slots: [...slots], msg: labFmt(M.resize, { cap, size }), probes: 0, cap });
    }
    const probes = place(slots, k);
    size++; totalProbes += probes;
    const home = h(k, cap);
    frames.push({ slots: [...slots], msg: probes === 1 ? labFmt(M.insertDirect, { k, home }) : labFmt(M.insertProbed, { k, home, probes }), probes, cap });
  }
  return { frames, slots, totalProbes, resizes, size };
}

type P = Record<string, unknown>;
export function hashCase(p: P, i: P) {
  const keys = (Array.isArray(i.keys) ? (i.keys as number[]) : []);
  const r = hashTrace(keys, typeof p.capacity === "number" ? p.capacity : 8);
  return { size: r.size, probes: r.totalProbes, resizes: r.resizes, slotOf: typeof i.slotOf === "number" ? r.slots.indexOf(i.slotOf) : -1 };
}
