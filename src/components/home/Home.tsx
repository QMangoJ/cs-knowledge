"use client";
import Link from "next/link";
import { stepPath } from "@/lib/paths";
import { doneKey, isDone, useMounted, useProgressVersion } from "@/lib/progress";
import { t } from "@/i18n";

export type HomeTopic = {
  id: string; subject: string; slug: string; title: string; summary: string; status: string;
  steps: number; level?: string; minutes?: number; prereq?: string[];
};
const ROUTE: { subject: string; blurb: string }[] = [
  { subject: "os", blurb: "先懂程序是怎么被操作系统托管、调度与保护的——后面所有性能与并发问题都从这里长出来。" },
  { subject: "co", blurb: "再往下看硬件：指令、流水线、缓存与内存表示，理解代码为什么快、为什么慢。" },
  { subject: "dsa", blurb: "把数据组织与查找/排序/图算法练成肌肉记忆，这是面试与工程调优的共同基本功。" },
  { subject: "network", blurb: "最后补上网络：请求、连接与流式传输——LLM API、推理服务天天在用。" },
  { subject: "coding", blurb: "到「面试刷题」里把算法题在浏览器里真刀真枪写出来、跑测试、看复杂度。" },
];
const ROADMAP = ["数据库与存储：索引、事务、LSM 树与向量数据库", "分布式与并发：一致性、消息队列、限流与重试", "AI 系统基础：GPU 与推理、KV Cache、批处理与量化"];

export function Home({ topics }: { topics: HomeTopic[] }) {
  useProgressVersion();
  const mounted = useMounted();
  const published = topics.filter((x) => x.status === "published");
  const doneCount = mounted ? published.filter((x) => isDone(doneKey(x.id))).length : 0;
  const pct = published.length ? Math.round((doneCount / published.length) * 100) : 0;
  return (
    <div className="home">
      <h1>{t.siteName}</h1>
      <p className="summary">{t.tagline}</p>
      <section className="route card">
        <h2>{t.route}</h2>
        <p className="muted">{t.routeNote}</p>
        <ol className="route-steps">
          {ROUTE.map((r, i) => (
            <li key={r.subject}><span className="route-n">{i + 1}</span><div><b>{r.subject === "coding" ? t.coding : t.subjects[r.subject as keyof typeof t.subjects]}</b><p>{r.blurb}</p></div></li>
          ))}
        </ol>
        <div className="progress-wrap" role="progressbar" aria-valuenow={pct} aria-valuemin={0} aria-valuemax={100} aria-label={t.progress}>
          <div className="progress-bar" style={{ width: `${pct}%` }} />
        </div>
        <p className="muted">{t.progress}：{doneCount} / {published.length} 个主题（{pct}%）· 完成方式：课末自测全对，或在主题末尾手动标记。</p>
      </section>

      {(["os", "co", "dsa", "network"] as const).map((s) => {
        const list = topics.filter((x) => x.subject === s);
        return (
          <section key={s} className="subject">
            <h2>{t.subjects[s]}</h2>
            {list.length === 0 ? <p className="muted">{t.comingSoon}</p> : (
              <ul className="cards">
                {list.map((x) => {
                  const done = mounted && isDone(doneKey(x.id));
                  return x.status === "coming-soon" ? (
                    <li key={x.id} className="topic-card disabled"><h3>{x.title}</h3><p>{x.summary}</p><span className="badge">{t.comingSoon}</span></li>
                  ) : (
                    <li key={x.id} className="topic-card"><Link href={stepPath(x.subject, x.slug, 0)}>
                      <h3>{x.title}{done && <span className="done-check" aria-label={t.done}> ✓</span>}</h3>
                      <p>{x.summary}</p>
                      <p className="card-meta">
                        <span>{x.steps} 步</span>
                        {x.minutes && <span>约 {x.minutes} {t.minutes}</span>}
                        {x.level && <span>{x.level}</span>}
                        {x.status === "draft" && <span className="badge pending">{t.draft}</span>}
                      </p>
                      {x.prereq && x.prereq.length > 0 && <p className="card-prereq">{t.prereq}：{x.prereq.join("、")}</p>}
                    </Link></li>
                  );
                })}
              </ul>
            )}
          </section>
        );
      })}

      <section className="subject">
        <h2>{t.coding}</h2>
        <ul className="cards">
          <li className="topic-card"><Link href="/coding/">
            <h3>Codility 风格练习与模拟考（9 题）</h3>
            <p>浏览器内写代码、跑全部测试用例（含性能用例），参考解法与复杂度讲解随时可查。</p>
            <p className="card-meta"><span>Practice 6 题</span><span>Mock 01 · 3 题 / 90 分钟</span></p>
          </Link></li>
        </ul>
      </section>

      <section className="subject roadmap">
        <h2>{t.roadmap}</h2>
        <ul className="cards">
          {ROADMAP.map((r) => <li key={r} className="topic-card disabled"><p>{r}</p><span className="badge">{t.comingSoon}</span></li>)}
        </ul>
      </section>
    </div>
  );
}
