"use client";
import { useState } from "react";
import type { LabProps } from "./registry";
import { Cases, num, str } from "./Cases";
import { addBits, decodeTwos, decodeUnsigned, encodeInt, exactDecimal, float32FromBits, float32FromNumber, hex32, type BitMode } from "@/lib/labs/bits";

export default function BitEditor({ state }: LabProps) {
  const p = state.params ?? {};
  const modes = (Array.isArray(p.modes) ? p.modes : ["unsigned", "twos", "float32"]) as BitMode[];
  const widths = (Array.isArray(p.widths) ? p.widths : [num(p.width, 8)]) as number[];
  const [mode, setMode] = useState<BitMode>(str(p.mode, "twos") as BitMode);
  const [intW, setIntW] = useState(num(p.width, 8));
  const width = mode === "float32" ? 32 : intW;
  const init = typeof p.value === "number" ? float32FromNumber(p.value).bits : str(p.bits ?? p.value, "0".repeat(width));
  const [bits, setBits] = useState(() => init.replace(/\s/g, ""));
  const [carry, setCarry] = useState<string | null>(null);
  const [text, setText] = useState("");
  const b = bits.padStart(width, "0").slice(-width);
  const flip = (i: number) => { setCarry(null); setBits(b.slice(0, i) + (b[i] === "1" ? "0" : "1") + b.slice(i + 1)); };
  const f = mode === "float32" ? float32FromBits(b) : null;
  const apply = () => {
    if (mode === "float32") { const x = Number(text); if (!Number.isNaN(x)) setBits(float32FromNumber(x).bits); return; }
    try { setCarry(null); setBits(encodeInt(BigInt(text), width, mode).bits); } catch { /* ignore bad input */ }
  };
  const overflow = (() => { if (mode === "float32" || !/^-?\d+$/.test(text)) return false; return encodeInt(BigInt(text), width, mode).overflow; })();
  const field = (i: number) => (mode !== "float32" ? (i === 0 && mode === "twos" ? "sign" : "") : i === 0 ? "sign" : i < 9 ? "exp" : "frac");
  return (
    <div className="lab-bits">
      <div className="lab-row">
        {modes.map((m) => (
          <label key={m}><input type="radio" checked={mode === m} onChange={() => { setMode(m); setCarry(null); setBits(m === "float32" ? float32FromNumber(0.1).bits : b.slice(-intW).padStart(intW, "0")); }} /> {m === "unsigned" ? "无符号" : m === "twos" ? "补码" : "float32"}</label>
        ))}
        {mode !== "float32" && widths.length > 1 && <select value={intW} aria-label="位宽" onChange={(e) => { const w = Number(e.target.value); setIntW(w); setBits(b.padStart(w, b[0] === "1" && mode === "twos" ? "1" : "0").slice(-w)); }}>{widths.map((w) => <option key={w} value={w}>{w} 位</option>)}</select>}
        {mode !== "float32" && <button onClick={() => { const r = addBits(b, 1n, "unsigned"); const sr = addBits(b, 1n, "twos"); setBits(r.bits); setCarry(r.overflow ? "最高位进位溢出：位串绕回" : sr.overflow && mode === "twos" ? "有符号溢出：正数加成了负数" : null); }}>+1</button>}
      </div>
      <div className={`bitrow w${width}`} role="group" aria-label="位">
        {[...b].map((c, i) => (
          <button key={i} className={`bit ${field(i)} ${c === "1" ? "on" : ""}`} onClick={() => flip(i)} aria-label={`第 ${width - 1 - i} 位 ${c}`}>{c}</button>
        ))}
      </div>
      {f ? (
        <p className="lab-out">符号 <code>{f.sign}</code> · 阶码 <code>{f.exponent}</code>（{f.expValue}）· 尾数 <code>{f.fraction}</code>· <code>{hex32(f.bits)}</code><br />实际存的值 <b className="exact">{exactDecimal(f.bits)}</b></p>
      ) : (
        <p className="lab-out">无符号 <b>{decodeUnsigned(b).toString()}</b> · 补码 <b>{decodeTwos(b).toString()}</b> · 十六进制 <code>0x{decodeUnsigned(b).toString(16).toUpperCase()}</code>{carry && <span className="lab-warn"> · {carry}</span>}</p>
      )}
      <div className="lab-row">
        <input value={text} onChange={(e) => setText(e.target.value)} placeholder={mode === "float32" ? "输入小数，如 0.1" : "输入整数，如 -1"} aria-label="输入数值" />
        <button onClick={apply}>写入</button>
        {overflow && <span className="lab-warn">超出 {width} 位范围，已截断</span>}
      </div>
      <Cases state={state} />
    </div>
  );
}
