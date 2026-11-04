"use client";
import { useState } from "react";
import type { LabProps } from "./registry";
import { Cases, num, str } from "./Cases";
import { parseHex, splitAddress, type AddrCfg } from "@/lib/labs/addr";

const LEVELS = ["PGD", "PUD", "PMD", "PTE"];
export default function AddrSplit({ state }: LabProps) {
  const p = state.params ?? {};
  const cfg: AddrCfg = { vaBits: num(p.vaBits, 48), pageSize: num(p.pageSize, 4096), levels: num(p.levels, 4), bitsPerLevel: num(p.bitsPerLevel, 9) };
  const [text, setText] = useState(str(p.address, "0x7ffd1234abcd"));
  const va = parseHex(text);
  const s = va === null ? null : splitAddress(va, cfg);
  const bin = va === null ? "" : (va & ((1n << BigInt(cfg.vaBits)) - 1n)).toString(2).padStart(cfg.vaBits, "0");
  const groups: { name: string; bits: string; val: string }[] = [];
  if (s) {
    let at = 0;
    s.indices.forEach((ix, l) => { groups.push({ name: LEVELS[l + 4 - cfg.levels] ?? `L${l}`, bits: bin.slice(at, at + cfg.bitsPerLevel), val: String(ix) }); at += cfg.bitsPerLevel; });
    groups.push({ name: "offset", bits: bin.slice(at), val: "0x" + s.offset.toString(16) });
  }
  return (
    <div className="lab-addr">
      <div className="lab-row"><label>虚拟地址 <input value={text} onChange={(e) => setText(e.target.value)} aria-label="虚拟地址" spellCheck={false} /></label></div>
      {!s ? <p className="lab-warn">请输入十六进制地址</p> : (
        <>
          <div className="addr-groups">
            {groups.map((g, i) => (
              <div key={i} className={`addr-g g${i}`}><span className="addr-name">{g.name}</span><code className="addr-bits">{g.bits}</code><b>{g.val}</b></div>
            ))}
          </div>
          <p className="lab-out">页大小 {cfg.pageSize} B → 低 {s.offsetBits} 位是页内偏移；其余 {cfg.levels} 级 × {cfg.bitsPerLevel} 位，每级在 512 项的页表里选一项。{!s.canonical && <span className="lab-warn"> 非规范地址：第 {cfg.vaBits} 位以上必须与第 {cfg.vaBits - 1} 位相同，访问会触发 #GP。</span>}</p>
        </>
      )}
      <Cases state={state} />
    </div>
  );
}
