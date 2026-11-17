"use client";
import Link from "next/link";
import type { Problem } from "@/lib/coding/problems";
import { codingKey, isDone, useMounted, useProgressVersion } from "@/lib/progress";
import { fmt, prefixPath } from "@/i18n";
import { useLang } from "@/i18n/client";

export function CodingIndex({ problems }: { problems: Problem[] }) {
  const { lang, s } = useLang();
  useProgressVersion();
  const mounted = useMounted();
  const doneCount = mounted ? problems.filter((p) => isDone(codingKey(p.slug))).length : 0;
  const group = (g: Problem["group"], title: string, note?: string) => (
    <section className="subject">
      <h2>{title}</h2>
      {note && <p className="muted">{note}</p>}
      <ul className="coding-grid">
        {problems.filter((p) => p.group === g).map((p) => {
          const done = mounted && isDone(codingKey(p.slug));
          return (
            <li key={p.slug} className="topic-card"><Link href={prefixPath(lang, `/coding/${p.slug}/`)}>
              <h3>{lang === "en" ? p.title : `${p.title} · ${p.titleZh}`}{done && <span className="done-check"> ✓</span>}</h3>
              <p>{p.lesson}</p>
              <p className="card-meta"><span>{s.targetComplexity}{p.complexity}</span><span>{fmt(s.testsBadge, { n: p.cases.length + (p.perf ? 1 : 0) })}</span></p>
            </Link></li>
          );
        })}
      </ul>
    </section>
  );
  return (
    <div className="coding-wrap">
      <h1>{s.coding}</h1>
      <p className="summary">{fmt(s.codingSummary, { done: doneCount, total: problems.length })}</p>
      <div className="progress-wrap" role="progressbar" aria-valuenow={problems.length ? Math.round((doneCount / problems.length) * 100) : 0} aria-valuemin={0} aria-valuemax={100} aria-label={s.codingProgressLabel}>
        <div className="progress-bar" style={{ width: `${problems.length ? (doneCount / problems.length) * 100 : 0}%` }} />
      </div>
      {group("practice", s.practiceGroupTitle, s.practiceGroupNote)}
      {group("mock", s.mockGroupTitle, s.mockGroupNote)}
    </div>
  );
}
