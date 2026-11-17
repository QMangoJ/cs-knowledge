"use client";
import { useState } from "react";
import type { LabProps } from "./registry";
import { Cases, num, str } from "./Cases";
import { fmt } from "@/i18n";
import { useLang } from "@/i18n/client";
import { parseHex, splitAddress, type AddrCfg } from "@/lib/labs/addr";

const LEVELS = ["PGD", "PUD", "PMD", "PTE"];
export default function AddrSplit({ state }: LabProps) {
  const { s: ui } = useLang();
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
      <div className="lab-row"><label>{ui.labAddrLabel} <input value={text} onChange={(e) => setText(e.target.value)} aria-label={ui.labAddrLabel} spellCheck={false} /></label></div>
      {!s ? <p className="lab-warn">{ui.labAddrInvalid}</p> : (
        <>
          <div className="addr-groups">
            {groups.map((g, i) => (
              <div key={i} className={`addr-g g${i}`}><span className="addr-name">{g.name}</span><code className="addr-bits">{g.bits}</code><b>{g.val}</b></div>
            ))}
          </div>
          <p className="lab-out">{fmt(ui.labAddrSummary, { ps: cfg.pageSize, ob: s.offsetBits, lv: cfg.levels, bpl: cfg.bitsPerLevel })}{!s.canonical && <span className="lab-warn">{fmt(ui.labAddrNonCanonical, { vb: cfg.vaBits, vbm: cfg.vaBits - 1 })}</span>}</p>
        </>
      )}
      <Cases state={state} />
    </div>
  );
}
