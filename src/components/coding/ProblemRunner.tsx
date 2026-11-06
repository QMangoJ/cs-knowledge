"use client";
import { useEffect, useState } from "react";
import type { Problem } from "@/lib/coding/problems";
import { perfArgs, perfCheck, deepEqual, PERF_LIMIT_MS } from "@/lib/coding/run";
import { codingKey, isDone, setDone } from "@/lib/progress";

type Row = { name: string; pass: boolean; detail: string; ms?: number };

export function ProblemRunner({ problem }: { problem: Problem }) {
  const [code, setCode] = useState(problem.stub);
  const [rows, setRows] = useState<Row[] | null>(null);
  const [done, setDoneState] = useState(false);
  useEffect(() => { setDoneState(isDone(codingKey(problem.slug))); }, [problem.slug]);
  const [err, setErr] = useState("");
  const run = () => {
    setErr("");
    let fn: (...a: unknown[]) => unknown;
    try { fn = new Function(`${code}; return solution;`)() as typeof fn; }
    catch (e) { setErr(`代码无法运行：${e instanceof Error ? e.message : String(e)}`); setRows(null); return; }
    if (typeof fn !== "function") { setErr("没有找到 solution 函数，请保留函数签名。"); setRows(null); return; }
    const out: Row[] = [];
    for (const c of problem.cases) {
      try {
        const t0 = performance.now();
        const got = fn(...structuredClone(c.args));
        const ms = performance.now() - t0;
        const pass = deepEqual(got, c.expect);
        out.push({ name: c.name, pass, ms, detail: pass ? `返回 ${JSON.stringify(got)}` : `期望 ${JSON.stringify(c.expect)}，实际 ${JSON.stringify(got)}` });
      } catch (e) { out.push({ name: c.name, pass: false, detail: `抛错：${e instanceof Error ? e.message : String(e)}` }); }
    }
    if (problem.perf) {
      try {
        const t0 = performance.now();
        const r = fn(...perfArgs(problem.perf.kind));
        const ms = performance.now() - t0;
        const pass = perfCheck(problem.perf.kind, r) && ms < PERF_LIMIT_MS;
        out.push({ name: problem.perf.name, pass, ms, detail: pass ? `结果正确，耗时 ${ms.toFixed(1)} ms（限时 ${PERF_LIMIT_MS} ms）` : perfCheck(problem.perf.kind, r) ? `结果正确但太慢：${ms.toFixed(1)} ms ≥ ${PERF_LIMIT_MS} ms — 检查复杂度` : "大输入下结果不正确" });
      } catch (e) { out.push({ name: problem.perf.name, pass: false, detail: `抛错：${e instanceof Error ? e.message : String(e)}` }); }
    }
    setRows(out);
    if (out.every((r) => r.pass)) { setDone(codingKey(problem.slug)); setDoneState(true); }
  };
  return (
    <div>
      <label htmlFor="code-editor"><b>你的解法（JavaScript）</b>{done && <span className="done-check"> · 已完成 ✓</span>}</label>
      <textarea id="code-editor" className="code-editor" value={code} onChange={(e) => setCode(e.target.value)} spellCheck={false} aria-label="代码编辑区" />
      <div className="lab-row" style={{ margin: "10px 0" }}>
        <button type="button" className="mark-done" onClick={run}>运行测试</button>
        <button type="button" className="mark-done" onClick={() => { setCode(problem.stub); setRows(null); setErr(""); }}>重置代码</button>
      </div>
      {err && <p className="quiz-explain bad">{err}</p>}
      {rows && (
        <>
          <p><b>{rows.filter((r) => r.pass).length} / {rows.length} 通过</b>{rows.every((r) => r.pass) ? " · 全部通过，已记录完成 ✓" : ""}</p>
          <ul className="test-results">
            {rows.map((r, i) => <li key={i} className={r.pass ? "pass" : "fail"}>{r.pass ? "✓" : "✗"} {r.name} — {r.detail}</li>)}
          </ul>
        </>
      )}
      <details className="ref-sol">
        <summary>参考解法（先自己试过再看）</summary>
        <figure className="codeblock"><figcaption>JavaScript · 目标复杂度 {problem.complexity}</figcaption><pre><code>{problem.reference}</code></pre></figure>
        <p style={{ fontFamily: "var(--font-cjk)", lineHeight: 1.8 }}>{problem.explainZh}</p>
      </details>
    </div>
  );
}
