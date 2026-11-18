"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useLang } from "@/i18n/client";
import { prefixPath } from "@/i18n";
import type { CsappIndex } from "@/lib/csapp/types";
import { loadQuiz, overallProgress, chapterProgress } from "@/lib/csapp/progress";
import { Sidebar } from "./Sidebar";
import { ProgramMap } from "./ProgramMap";
import { Spotlight } from "./Spotlight";
import { CsappShell } from "./CsappShell";

export function HomeView({ index }: { index: CsappIndex }) {
  const { lang } = useLang();
  const base = prefixPath(lang, "/csapp");
  const [overall, setOverall] = useState({ pct: 0, started: 0, done: 0 });
  const [continueCh, setContinueCh] = useState<number | null>(1);
  const [review, setReview] = useState<{ ch: number; title: string; n: number }[]>([]);

  useEffect(() => {
    const ids = index.chapters.map((c) => c.id);
    setOverall(overallProgress(ids));
    let best: { id: number; p: number } | null = null;
    const rev: { ch: number; title: string; n: number }[] = [];
    for (const c of index.chapters) {
      const p = chapterProgress(c.id);
      const g = loadQuiz(c.id);
      const n = g.filter((x) => x === "fuzzy" || x === "miss").length;
      if (n) rev.push({ ch: c.id, title: c.title, n });
      if (p > 0 && p < 90 && (!best || p > best.p)) best = { id: c.id, p };
    }
    setContinueCh(best?.id ?? 1);
    setReview(rev.slice(0, 5));
  }, [index]);

  const cont = index.chapters.find((c) => c.id === continueCh);

  return (
    <CsappShell>
      <Spotlight />
      <Sidebar index={index} current="home" mode="home" />
      <div className="main">
        <div className="hm">
          <header className="hm-head">
            <div className="hm-kicker">CSAPP · 独立模块</div>
            <h1>一个程序的一生</h1>
            <p className="lede">从你写下的源码，到处理器跑起来、操作系统托管、再经网络与并发对外服务——12 章把这条路走一遍。</p>
          </header>

          <ProgramMap index={index} />

          <div className="hm-grid">
            <Link href={`${base}/${continueCh}/`} className="card hm-continue spot">
              <div className="hc-kicker">继续阅读</div>
              <h3>第 {continueCh} 章 · {cont?.title}</h3>
              <p>{cont?.subtitle}</p>
              <span className="btn">打开本章</span>
            </Link>

            <div className="card overall spot">
              <div className="ov-kicker">总进度</div>
              <div className="ov-big">{overall.pct}%</div>
              <p className="muted">已开始 {overall.started} 章 · 完成 {overall.done}</p>
              <div className="hc-bar" aria-hidden="true">
                <i style={{ width: `${overall.pct}%` }} />
              </div>
            </div>

            <div className="card quiz-stats spot">
              <div className="qs-kicker">待复习</div>
              {review.length === 0 ? (
                <p className="muted">自测里标记为「模糊」或「不会」的题会出现在这里。</p>
              ) : (
                <ul className="qs-list">
                  {review.map((r) => (
                    <li key={r.ch}>
                      <Link href={`${base}/${r.ch}/quiz/`}>第 {r.ch} 章 · {r.title}<span>{r.n} 题</span></Link>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>

          <section className="hm-chapters">
            <h2>十二章目录</h2>
            <ol className="ch-grid">
              {index.chapters.map((c) => (
                <li key={c.id}>
                  <Link href={`${base}/${c.id}/`} className="card ch-card spot" data-ch={c.id}>
                    <span className="ch-num">{String(c.id).padStart(2, "0")}</span>
                    <b>{c.title}</b>
                    <span>{c.subtitle}</span>
                  </Link>
                </li>
              ))}
            </ol>
          </section>
        </div>
      </div>
    </CsappShell>
  );
}
