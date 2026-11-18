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
  const [prog, setProg] = useState<Record<number, number>>({});
  const [qs, setQs] = useState({ know: 0, fuzzy: 0, miss: 0 });

  useEffect(() => {
    const ids = index.chapters.map((c) => c.id);
    setOverall(overallProgress(ids));
    let best: { id: number; p: number } | null = null;
    const rev: { ch: number; title: string; n: number }[] = [];
    const pm: Record<number, number> = {};
    const q = { know: 0, fuzzy: 0, miss: 0 };
    for (const c of index.chapters) {
      const p = chapterProgress(c.id);
      pm[c.id] = p;
      const g = loadQuiz(c.id);
      for (const x of g) if (x) q[x]++;
      const n = g.filter((x) => x === "fuzzy" || x === "miss").length;
      if (n) rev.push({ ch: c.id, title: c.title, n });
      if (p > 0 && p < 90 && (!best || p > best.p)) best = { id: c.id, p };
    }
    setContinueCh(best?.id ?? 1);
    setReview(rev.slice(0, 5));
    setProg(pm);
    setQs(q);
  }, [index]);

  const cont = index.chapters.find((c) => c.id === continueCh);
  const contPct = continueCh ? prog[continueCh] ?? 0 : 0;

  return (
    <CsappShell>
      <Spotlight />
      <Sidebar index={index} current="home" mode="home" />
      <div className="main">
        <div className="hm-page">
          <header className="hm-head">
            <div className="kicker">总览</div>
            <h1>一个程序的一生</h1>
            <p className="lede">从你写下的源代码，到网络另一端的另一台机器——12 章是这条路上的 12 站。悬停任意一站，左侧目录同步高亮；点击直接进入该章。</p>
          </header>

          <ProgramMap index={index} />

          <section className="hm-grid">
            <Link href={`${base}/${continueCh}/`} className="spot card hm-continue">
              <div className="card-kicker">{overall.started ? "继续阅读" : "从这里开始"}</div>
              <div className="hc-title"><span className="hc-num">{String(continueCh).padStart(2, "0")}</span>{cont?.title}</div>
              <p className="hc-where">{cont?.subtitle}</p>
              <div className="hc-bar" aria-hidden="true"><i style={{ width: `${contPct}%` }} /></div>
              <div className="hc-meta"><span>{contPct}%</span><span className="hc-cta">{overall.started ? "继续" : "打开本章"} →</span></div>
            </Link>

            <div className="spot card hm-overall">
              <div className="card-kicker">总进度</div>
              <div className="ov-big">{overall.pct}<small>%</small></div>
              <div className="ov-strip">
                {index.chapters.map((c) => <i key={c.id} className={`cs${(prog[c.id] ?? 0) > 0 ? " on" : ""}`} style={{ ["--p" as string]: `${prog[c.id] ?? 0}%` }} title={`第 ${c.id} 章 ${prog[c.id] ?? 0}%`} />)}
              </div>
              <div className="ov-meta"><span>{overall.started} 章已开始</span><span>{overall.done} 章已学完</span></div>
            </div>

            <div className="spot card hm-quiz">
              <div className="card-kicker">自测</div>
              <div className="qs-top">
                <span className="qs-big">{qs.know + qs.fuzzy + qs.miss}<small> / {index.chapters.length * 8}</small></span>
                <span className="qs-legend"><span className="lg know">会了 {qs.know}</span><span className="lg fuzzy">模糊 {qs.fuzzy}</span><span className="lg miss">不会 {qs.miss}</span></span>
              </div>
              <div className="qs-bar" aria-hidden="true">
                <i className="know" style={{ flex: qs.know }} /><i className="fuzzy" style={{ flex: qs.fuzzy }} /><i className="miss" style={{ flex: qs.miss }} />
                <i className="none" style={{ flex: Math.max(0, index.chapters.length * 8 - qs.know - qs.fuzzy - qs.miss) }} />
              </div>
              {review.length === 0 ? (
                <p className="hc-where" style={{ marginTop: 12 }}>自测里标记为「模糊」或「不会」的题会出现在这里。</p>
              ) : (
                <ul className="qs-review">
                  {review.map((r) => (
                    <li key={r.ch}><span className="g fuzzy" aria-hidden="true" /><Link href={`${base}/${r.ch}/quiz/`}>第 {r.ch} 章 · {r.title}　{r.n} 题待复习</Link></li>
                  ))}
                </ul>
              )}
              <Link className="qs-cta" href={`${base}/${review[0]?.ch ?? continueCh}/quiz/`}>{review.length ? "去复习 →" : "开始自测 →"}</Link>
            </div>
          </section>

          <section className="hm-sec">
            <div className="hm-sec-head"><h2>十二章目录</h2></div>
            <ol className="ch-grid">
              {index.chapters.map((c) => (
                <li key={c.id}>
                  <Link href={`${base}/${c.id}/`} className="spot card ch-card" data-ch={c.id}>
                    <span className="cc-num">{String(c.id).padStart(2, "0")}</span>
                    <b>{c.title}</b>
                    <span className="hc-where">{c.subtitle}</span>
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
