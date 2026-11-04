import type { LabState } from "@/lib/schema";
import { RUNNERS } from "@/lib/labs/run";
/** Re-runs YAML `cases` through the lab's pure function and shows pass/fail. */
export function Cases({ state }: { state: LabState }) {
  const runner = RUNNERS[state.lab];
  if (!state.cases?.length || !runner) return null;
  const run = (i: Record<string, unknown>) => runner(state.params ?? {}, i);
  return (
    <details className="lab-cases"><summary>样例自检</summary><ul>
      {state.cases.map((c, i) => {
        let got: Record<string, unknown> = {}; try { got = run(c.input); } catch (e) { got = { error: String(e) }; }
        const ok = Object.entries(c.expect).every(([k, v]) => JSON.stringify(got[k]) === JSON.stringify(v));
        return <li key={i} className={ok ? "ok" : "bad"}>{ok ? "✓" : "✗"} <code>{JSON.stringify(c.input)}</code> → <code>{JSON.stringify(Object.fromEntries(Object.keys(c.expect).map((k) => [k, got[k]])))}</code></li>;
      })}
    </ul></details>
  );
}
export const num = (v: unknown, d: number) => (typeof v === "number" ? v : d);
export const str = (v: unknown, d: string) => (typeof v === "string" ? v : d);
