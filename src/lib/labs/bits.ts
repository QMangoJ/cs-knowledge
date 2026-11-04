// Pure helpers for the bit-editor lab. No imports so scripts/lab-selftest.mts can load it with plain Node.
export type BitMode = "unsigned" | "twos" | "float32";

export function toBits(n: bigint, width: number): string {
  const m = (1n << BigInt(width)) - 1n;
  return (((n % (m + 1n)) + (m + 1n)) & m).toString(2).padStart(width, "0");
}
export function decodeUnsigned(bits: string): bigint { return BigInt("0b" + bits); }
export function decodeTwos(bits: string): bigint {
  const u = decodeUnsigned(bits);
  return bits[0] === "1" ? u - (1n << BigInt(bits.length)) : u;
}
export function encodeInt(value: bigint, width: number, mode: "unsigned" | "twos"): { bits: string; overflow: boolean } {
  const W = BigInt(width);
  const [lo, hi] = mode === "unsigned" ? [0n, (1n << W) - 1n] : [-(1n << (W - 1n)), (1n << (W - 1n)) - 1n];
  return { bits: toBits(value, width), overflow: value < lo || value > hi };
}
export type F32 = { bits: string; sign: string; exponent: string; fraction: string; stored: number; expValue: number };
export function float32FromNumber(x: number): F32 {
  const dv = new DataView(new ArrayBuffer(4)); dv.setFloat32(0, x);
  return float32FromBits(dv.getUint32(0).toString(2).padStart(32, "0"));
}
export function float32FromBits(bits: string): F32 {
  const dv = new DataView(new ArrayBuffer(4)); dv.setUint32(0, parseInt(bits, 2) >>> 0);
  const e = parseInt(bits.slice(1, 9), 2);
  return { bits, sign: bits[0]!, exponent: bits.slice(1, 9), fraction: bits.slice(9), stored: dv.getFloat32(0), expValue: e - 127 };
}

/** Exact decimal expansion of a float32 bit pattern (every finite binary float has a finite decimal form). */
export function exactDecimal(bits: string): string {
  const b = bits.replace(/\s/g, ""), sign = b[0] === "1" ? "-" : "", e = parseInt(b.slice(1, 9), 2), f = BigInt("0b" + b.slice(9));
  if (e === 255) return f ? "NaN" : sign + "Infinity";
  const m = e === 0 ? f : f | (1n << 23n), p = (e === 0 ? -126 : e - 127) - 23; // value = m · 2^p
  if (m === 0n) return sign + "0";
  if (p >= 0) return sign + (m << BigInt(p)).toString();
  const digits = (m * 5n ** BigInt(-p)).toString().padStart(-p + 1, "0"); // m/2^k = m·5^k / 10^k
  const int = digits.slice(0, digits.length + p), frac = digits.slice(digits.length + p).replace(/0+$/, "");
  return sign + int + (frac ? "." + frac : "");
}
export const hex32 = (bits: string) => "0x" + (parseInt(bits.replace(/\s/g, ""), 2) >>> 0).toString(16).toUpperCase().padStart(8, "0");
/** Integer op on a bit pattern, wrapping at width; overflow per the mode's range. */
export function addBits(bits: string, delta: bigint, mode: "unsigned" | "twos"): { bits: string; overflow: boolean } {
  const v = (mode === "twos" ? decodeTwos(bits) : decodeUnsigned(bits)) + delta;
  return encodeInt(v, bits.length, mode);
}
