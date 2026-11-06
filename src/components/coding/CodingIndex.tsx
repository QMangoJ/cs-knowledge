"use client";
import Link from "next/link";
import type { Problem } from "@/lib/coding/problems";
import { codingKey, isDone, useProgressVersion } from "@/lib/progress";

export function CodingIndex({ problems }: { problems: Problem[] }) {
  useProgressVersion();
  const doneCount = typeof window !== "undefined" ? problems.filter((p) => isDone(codingKey(p.slug))).length : 0;
  const group = (g: Problem["group"], title: string, note?: string) => (
    <section className="subject">
      <h2>{title}</h2>
      {note && <p className="muted">{note}</p>}
      <ul className="coding-grid">
        {problems.filter((p) => p.group === g).map((p) => {
          const done = typeof window !== "undefined" && isDone(codingKey(p.slug));
          return (
            <li key={p.slug} className="topic-card"><Link href={`/coding/${p.slug}/`}>
              <h3>{p.title} · {p.titleZh}{done && <span className="done-check"> ✓</span>}</h3>
              <p>{p.lesson}</p>
              <p className="card-meta"><span>目标复杂度：{p.complexity}</span><span>{p.cases.length + (p.perf ? 1 : 0)} 个测试</span></p>
            </Link></li>
          );
        })}
      </ul>
    </section>
  );
  return (
    <div className="coding-wrap">
      <h1>面试刷题</h1>
      <p className="summary">Codility 风格题组：在浏览器里写 JavaScript、跑全部测试（含性能用例），通过后自动记录进度。当前进度：{doneCount} / {problems.length}</p>
      <div className="progress-wrap" role="progressbar" aria-valuenow={problems.length ? Math.round((doneCount / problems.length) * 100) : 0} aria-valuemin={0} aria-valuemax={100} aria-label="刷题进度">
        <div className="progress-bar" style={{ width: `${problems.length ? (doneCount / problems.length) * 100 : 0}%` }} />
      </div>
      {group("practice", "Practice · 练习题（6 题）", "按 Codility Lessons 1–3 顺序：迭代、数组、时间复杂度。先把这 6 题清掉。")}
      {group("mock", "Mock 01 · 模拟考（3 题 / 90 分钟）", "Frog River One（25 分）+ Perm Check（20 分）+ Max Counters（40 分），连做掐表 90 分钟，按考试节奏来。")}
    </div>
  );
}
