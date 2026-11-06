// Pure logic for cache-sim: direct-mapped cache, byte addresses, block size B, L lines.
// index = floor(addr / B) mod L, tag = floor(addr / (B * L)).
export type CacheFrame = { addr: number; index: number; tag: number; hit: boolean; lines: (number | null)[]; msg: string };
export type CacheResult = { frames: CacheFrame[]; hits: number; misses: number };

export function cacheTrace(addrs: number[], lines = 8, block = 16): CacheResult {
  const tags: (number | null)[] = Array(lines).fill(null);
  const frames: CacheFrame[] = [];
  let hits = 0, misses = 0;
  frames.push({ addr: -1, index: -1, tag: -1, hit: false, lines: [...tags], msg: `直接映射缓存：${lines} 行 × 块 ${block}B。地址先除以块大小得块号，块号 mod ${lines} 决定行号，商是标签。` });
  for (const a of addrs) {
    const blk = Math.floor(a / block);
    const index = blk % lines;
    const tag = Math.floor(blk / lines);
    const hit = tags[index] === tag;
    if (hit) hits++; else { misses++; tags[index] = tag; }
    frames.push({ addr: a, index, tag, hit, lines: [...tags], msg: hit
      ? `访问 ${a}（块 ${blk}）：行 ${index} 标签 ${tag} 命中 ✓` : `访问 ${a}（块 ${blk}）：行 ${index} 未命中，把块 ${blk} 装入该行（标签记 ${tag}），同块的其余 ${block - 1} 字节也一并进缓存。` });
  }
  frames.push({ addr: -1, index: -1, tag: -1, hit: false, lines: [...tags], msg: `结束：命中 ${hits} 次，未命中 ${misses} 次，命中率 ${addrs.length ? Math.round((hits / addrs.length) * 100) : 0}%。` });
  return { frames, hits, misses };
}

type P = Record<string, unknown>;
export function cacheCase(p: P, i: P) {
  const addrs = (Array.isArray(i.addrs) ? (i.addrs as number[]) : []);
  const r = cacheTrace(addrs, typeof p.lines === "number" ? p.lines : 8, typeof p.block === "number" ? p.block : 16);
  return { hits: r.hits, misses: r.misses };
}
