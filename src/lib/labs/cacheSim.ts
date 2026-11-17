// Pure logic for cache-sim: direct-mapped cache, byte addresses, block size B, L lines.
// index = floor(addr / B) mod L, tag = floor(addr / (B * L)).
import { labFmt, labMsg, type LabLang } from "./messages.ts";
export type CacheFrame = { addr: number; index: number; tag: number; hit: boolean; lines: (number | null)[]; msg: string };
export type CacheResult = { frames: CacheFrame[]; hits: number; misses: number };

export function cacheTrace(addrs: number[], lines = 8, block = 16, lang: LabLang = "zh"): CacheResult {
  const M = labMsg(lang).cache;
  const tags: (number | null)[] = Array(lines).fill(null);
  const frames: CacheFrame[] = [];
  let hits = 0, misses = 0;
  frames.push({ addr: -1, index: -1, tag: -1, hit: false, lines: [...tags], msg: labFmt(M.intro, { lines, block }) });
  for (const a of addrs) {
    const blk = Math.floor(a / block);
    const index = blk % lines;
    const tag = Math.floor(blk / lines);
    const hit = tags[index] === tag;
    if (hit) hits++; else { misses++; tags[index] = tag; }
    frames.push({ addr: a, index, tag, hit, lines: [...tags], msg: hit
      ? labFmt(M.hit, { a, blk, index, tag }) : labFmt(M.miss, { a, blk, index, tag, rest: block - 1 }) });
  }
  frames.push({ addr: -1, index: -1, tag: -1, hit: false, lines: [...tags], msg: labFmt(M.end, { hits, misses, rate: addrs.length ? Math.round((hits / addrs.length) * 100) : 0 }) });
  return { frames, hits, misses };
}

type P = Record<string, unknown>;
export function cacheCase(p: P, i: P) {
  const addrs = (Array.isArray(i.addrs) ? (i.addrs as number[]) : []);
  const r = cacheTrace(addrs, typeof p.lines === "number" ? p.lines : 8, typeof p.block === "number" ? p.block : 16);
  return { hits: r.hits, misses: r.misses };
}
