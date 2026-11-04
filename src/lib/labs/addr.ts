// x86-64 style multi-level virtual address split.
export type AddrCfg = { vaBits: number; pageSize: number; levels: number; bitsPerLevel: number };
export type Split = { offset: bigint; offsetBits: number; indices: number[]; vpn: bigint; canonical: boolean };
export function splitAddress(va: bigint, c: AddrCfg): Split {
  const offsetBits = Math.log2(c.pageSize);
  const offset = va & (BigInt(c.pageSize) - 1n);
  const vpn = (va >> BigInt(offsetBits)) & ((1n << BigInt(c.levels * c.bitsPerLevel)) - 1n);
  const mask = (1n << BigInt(c.bitsPerLevel)) - 1n;
  const indices: number[] = [];
  for (let l = c.levels - 1; l >= 0; l--) indices.push(Number((vpn >> BigInt(l * c.bitsPerLevel)) & mask));
  const top = va >> BigInt(c.vaBits - 1); // bits above must all equal bit vaBits-1
  const ones = (1n << BigInt(64 - c.vaBits + 1)) - 1n;
  return { offset, offsetBits, indices, vpn, canonical: top === 0n || top === ones };
}
export function parseHex(s: string): bigint | null { try { const t = s.trim().toLowerCase(); return /^(0x)?[0-9a-f]{1,16}$/.test(t) ? BigInt(t.startsWith("0x") ? t : "0x" + t) : null; } catch { return null; } }
