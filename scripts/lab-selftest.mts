// Runs every `kind: lab` step's YAML cases through the same runners the UI uses, plus a few extra unit checks.
// node --experimental-strip-types --no-warnings scripts/lab-selftest.mts
import fs from "node:fs"; import path from "node:path"; import YAML from "yaml";
import { RUNNERS } from "../src/lib/labs/run.ts";
import { schedule } from "../src/lib/labs/pipeline.ts";
import { simulateLocks } from "../src/lib/labs/race.ts";
let fail = 0, total = 0;
const check = (name: string, got: Record<string, unknown>, want: Record<string, unknown>) => {
  total++; const bad = Object.entries(want).filter(([k, v]) => JSON.stringify(got[k]) !== JSON.stringify(v));
  if (bad.length) fail++;
  console.log(bad.length ? "FAIL" : "ok  ", name, bad.map(([k, v]) => `${k}: got ${JSON.stringify(got[k])} want ${JSON.stringify(v)}`).join("; "));
};
const walk = (d: string): string[] => fs.readdirSync(d, { withFileTypes: true }).flatMap((e) => (e.isDirectory() ? walk(path.join(d, e.name)) : e.name === "zh.yaml" ? [path.join(d, e.name)] : []));
for (const f of walk("content/topics")) {
  const t = YAML.parse(fs.readFileSync(f, "utf8"));
  for (const st of t.steps ?? []) {
    const c = st.canvas; if (c?.kind !== "lab") continue;
    const run = RUNNERS[c.lab]; if (!run) { fail++; console.log("FAIL", t.id, st.id, "no runner for", c.lab); continue; }
    (c.cases ?? []).forEach((k: { input: Record<string, unknown>; expect: Record<string, unknown> }, i: number) => check(`${t.id}#${st.id} case${i + 1} ${JSON.stringify(k.input)}`, run(c.params ?? {}, k.input), k.expect));
  }
}
check("unit: independent instrs = n+4", { c: schedule([{ text: "a", dst: "x1" }, { text: "b", dst: "x2" }], false).cycles }, { c: 6 });
check("unit: no split regfile adds a bubble", { c: schedule([{ text: "a", dst: "x1" }, { text: "b", src: ["x1"] }], { forwarding: false, regfileSplitCycle: false }).cycles }, { c: 9 });
check("unit: 3-thread lock cycle", simulateLocks({ T1: ["A", "B"], T2: ["B", "C"], T3: ["C", "A"] }) as never, { deadlock: true, cycle: ["T1", "B", "T2", "C", "T3", "A"] });
console.log(fail ? `${fail}/${total} FAILED` : `all ${total} lab cases pass`); process.exit(fail ? 1 : 0);
