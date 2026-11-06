// Verifies all 9 reference solutions against the original test cases + perf cases.
// node --experimental-strip-types --no-warnings scripts/verify-coding.mts
import { PROBLEMS } from "../src/lib/coding/problems.ts";
import { perfArgs, perfCheck, deepEqual, PERF_LIMIT_MS } from "../src/lib/coding/run.ts";

let fail = 0;
for (const p of PROBLEMS) {
  const fn = new Function(`${p.reference}; return solution;`)() as (...a: unknown[]) => unknown;
  let ok = 0, total = 0;
  for (const c of p.cases) {
    total++;
    const got = fn(...structuredClone(c.args));
    if (deepEqual(got, c.expect)) ok++; else { fail++; console.log("FAIL", p.slug, c.name, "got", JSON.stringify(got), "want", JSON.stringify(c.expect)); }
  }
  let perfStr = "";
  if (p.perf) {
    total++;
    const t0 = performance.now();
    const r = fn(...perfArgs(p.perf.kind));
    const ms = performance.now() - t0;
    const pass = perfCheck(p.perf.kind, r) && ms < PERF_LIMIT_MS;
    if (pass) ok++; else fail++;
    perfStr = ` perf: ${ms.toFixed(1)}ms ${pass ? "PASS" : "FAIL"}`;
  }
  console.log(`${p.slug}: ${ok}/${total} cases pass${perfStr}`);
}
console.log(fail ? `${fail} FAILURES` : "all reference solutions pass");
process.exit(fail ? 1 : 0);
