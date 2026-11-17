"use client";
import { useEffect, useState } from "react";
import type { Problem } from "@/lib/coding/problems";
import { perfArgs, perfCheck, deepEqual, PERF_LIMIT_MS } from "@/lib/coding/run";
import { codingKey, isDone, setDone } from "@/lib/progress";
import { fmt } from "@/i18n";
import { useLang } from "@/i18n/client";

type Row = { name: string; pass: boolean; detail: string; ms?: number };

export function ProblemRunner({ problem }: { problem: Problem }) {
  const { s } = useLang();
  const [code, setCode] = useState(problem.stub);
  const [rows, setRows] = useState<Row[] | null>(null);
  const [done, setDoneState] = useState(false);
  useEffect(() => { setDoneState(isDone(codingKey(problem.slug))); }, [problem.slug]);
  const [err, setErr] = useState("");
  const run = () => {
    setErr("");
    let fn: (...a: unknown[]) => unknown;
    try { fn = new Function(`${code}; return solution;`)() as typeof fn; }
    catch (e) { setErr(`${s.errRunPrefix}${e instanceof Error ? e.message : String(e)}`); setRows(null); return; }
    if (typeof fn !== "function") { setErr(s.errNoSolution); setRows(null); return; }
    const out: Row[] = [];
    for (const c of problem.cases) {
      try {
        const t0 = performance.now();
        const got = fn(...structuredClone(c.args));
        const ms = performance.now() - t0;
        const pass = deepEqual(got, c.expect);
        out.push({ name: c.name, pass, ms, detail: pass ? fmt(s.resultReturn, { v: JSON.stringify(got) }) : fmt(s.resultExpect, { e: JSON.stringify(c.expect), g: JSON.stringify(got) }) });
      } catch (e) { out.push({ name: c.name, pass: false, detail: `${s.errThrownPrefix}${e instanceof Error ? e.message : String(e)}` }); }
    }
    if (problem.perf) {
      try {
        const t0 = performance.now();
        const r = fn(...perfArgs(problem.perf.kind));
        const ms = performance.now() - t0;
        const pass = perfCheck(problem.perf.kind, r) && ms < PERF_LIMIT_MS;
        out.push({ name: problem.perf.name, pass, ms, detail: pass ? fmt(s.perfPassDetail, { ms: ms.toFixed(1), limit: PERF_LIMIT_MS }) : perfCheck(problem.perf.kind, r) ? fmt(s.perfSlowDetail, { ms: ms.toFixed(1), limit: PERF_LIMIT_MS }) : s.perfWrongDetail });
      } catch (e) { out.push({ name: problem.perf.name, pass: false, detail: `${s.errThrownPrefix}${e instanceof Error ? e.message : String(e)}` }); }
    }
    setRows(out);
    if (out.every((r) => r.pass)) { setDone(codingKey(problem.slug)); setDoneState(true); }
  };
  return (
    <div>
      <label htmlFor="code-editor"><b>{s.yourSolution}</b>{done && <span className="done-check">{s.doneSuffix}</span>}</label>
      <textarea id="code-editor" className="code-editor" value={code} onChange={(e) => setCode(e.target.value)} spellCheck={false} aria-label={s.editorLabel} />
      <div className="lab-row" style={{ margin: "10px 0" }}>
        <button type="button" className="mark-done" onClick={run}>{s.runTests}</button>
        <button type="button" className="mark-done" onClick={() => { setCode(problem.stub); setRows(null); setErr(""); }}>{s.resetCode}</button>
      </div>
      {err && <p className="quiz-explain bad">{err}</p>}
      {rows && (
        <>
          <p><b>{fmt(s.passLine, { pass: rows.filter((r) => r.pass).length, total: rows.length })}</b>{rows.every((r) => r.pass) ? s.allPassSuffix : ""}</p>
          <ul className="test-results">
            {rows.map((r, i) => <li key={i} className={r.pass ? "pass" : "fail"}>{r.pass ? "✓" : "✗"} {r.name} — {r.detail}</li>)}
          </ul>
        </>
      )}
      <details className="ref-sol">
        <summary>{s.refSolutionSummary}</summary>
        <figure className="codeblock"><figcaption>{fmt(s.refCaption, { c: problem.complexity })}</figcaption><pre><code>{problem.reference}</code></pre></figure>
        <p style={{ fontFamily: "var(--font-cjk)", lineHeight: 1.8 }}>{problem.explainZh}</p>
      </details>
    </div>
  );
}
