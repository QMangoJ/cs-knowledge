"use client";
import Link from "next/link";
import { useState } from "react";
import { stepPath } from "@/lib/paths";
import { plainText } from "@/lib/terms";
import { doneKey, isDone, useMounted, useProgressVersion } from "@/lib/progress";
import type { JourneyStep, SubjectInfo } from "@/lib/schema";
import { fmt, prefixPath } from "@/i18n";
import { useLang } from "@/i18n/client";
import { CsappShell } from "@/components/csapp/CsappShell";
import { Spotlight } from "@/components/csapp/Spotlight";
import { ThemeSwitch } from "@/components/csapp/ThemeSwitch";

export type HomeTopic = {
  id: string; subject: string; slug: string; title: string; summary: string; status: string;
  steps: number; level?: string; minutes?: number; prereq?: string[];
};
type SubjectId = SubjectInfo["id"];
const ROUTE_SUBJECTS = ["dsa", "co", "os", "network", "data", "distributed", "go", "backend", "math", "ai", "coding"] as const;
const SUBJECTS: SubjectId[] = ["dsa", "co", "os", "network", "data", "distributed", "go", "backend", "math", "ai"];

/** Journey stage labels (journey is 10 steps → 5 stages of 2). */
const STAGES = {
  zh: [["写与跑", "组织 → 硬件"], ["托管与通信", "内核 → 网络"], ["存储与扩展", "落盘 → 多机"], ["写成服务", "语言 → 上岗"], ["底座与智能", "数学 → AI"]],
  en: [["Write & run", "structure → hardware"], ["Host & talk", "kernel → network"], ["Store & scale", "disk → many machines"], ["Ship a service", "language → production"], ["Math & learning", "math → AI"]],
} as const;
const ROMAN = ["I", "II", "III", "IV", "V"];
const pad = (n: number) => String(n).padStart(2, "0");

function Ring({ p }: { p: number }) {
  if (p <= 0) return null;
  const c = 31.4;
  return (
    <svg className="ring" viewBox="0 0 12 12" aria-label={`${p}%`}>
      <circle cx="6" cy="6" r="5" />
      <circle className="arc" cx="6" cy="6" r="5" strokeDasharray={`${(c * p) / 100} ${c}`} />
    </svg>
  );
}

/** Site home in the CSAPP (G light / H dark) design language: sidebar of
 *  subjects ↔ journey map hover-sync, continue/progress/practice cards, then
 *  every subject's blocks and lessons, route, CSAPP, coding and roadmap. */
export function Home({ topics, subjects, journey }: { topics: HomeTopic[]; subjects: SubjectInfo[]; journey: JourneyStep[] }) {
  const { lang, s: t } = useLang();
  useProgressVersion();
  const mounted = useMounted();
  const [hover, setHover] = useState<string | null>(null);
  const done = (x: HomeTopic) => mounted && isDone(doneKey(x.id));

  const published = topics.filter((x) => x.status === "published");
  const doneCount = published.filter(done).length;
  const pct = published.length ? Math.round((doneCount / published.length) * 100) : 0;

  const stat = (s: string) => {
    const list = published.filter((x) => x.subject === s);
    const d = list.filter(done).length;
    return { done: d, total: list.length, pct: list.length ? Math.round((d / list.length) * 100) : 0 };
  };
  const stats = Object.fromEntries(SUBJECTS.map((s) => [s, stat(s)])) as Record<SubjectId, ReturnType<typeof stat>>;
  const startedSubjects = SUBJECTS.filter((s) => stats[s].done > 0).length;

  const ordered = SUBJECTS.flatMap((s) => published.filter((x) => x.subject === s));
  const next = ordered.find((x) => !done(x)) ?? ordered[0];
  const nextStat = next ? stats[next.subject as SubjectId] : undefined;

  const infoOf = (s: string) => subjects.find((x) => x.id === s);
  const stages = STAGES[lang === "en" ? "en" : "zh"];
  const chunks = [0, 1, 2, 3, 4].map((i) => journey.slice(i * 2, i * 2 + 2)).filter((c) => c.length);
  const hoverProps = (s: string) => ({ onMouseEnter: () => setHover(s), onMouseLeave: () => setHover(null), onFocus: () => setHover(s), onBlur: () => setHover(null) });

  const meta = (x: HomeTopic) => (
    <span className="tp-meta">
      <span>{fmt(t.stepsBadge, { n: x.steps })}</span>
      {x.minutes && <span>{fmt(t.minutesBadge, { n: x.minutes })}</span>}
      {x.level && <span>{t.levels[x.level as keyof typeof t.levels] ?? x.level}</span>}
      {x.status === "draft" && <span className="tp-badge">{t.draft}</span>}
      {x.prereq?.map((p) => <span key={p} className="tp-pre">{t.prereq} · {p}</span>)}
    </span>
  );
  const row = (x: HomeTopic) => {
    if (x.status === "coming-soon") {
      return (
        <li key={x.id} className="tp-row is-off">
          <span className="tp-main"><span className="tp-title">{plainText(x.title)}</span>{meta(x)}</span>
          <span className="tp-st">{t.comingSoon}</span>
        </li>
      );
    }
    const d = done(x);
    return (
      <li key={x.id}>
        <Link className={`tp-row${d ? " is-done" : ""}`} href={stepPath(x.subject, x.slug, 0, lang)} title={plainText(x.summary)}>
          <span className="tp-main"><span className="tp-title">{plainText(x.title)}</span>{meta(x)}</span>
          <span className="tp-st">{d ? <><span aria-hidden="true">✓ </span>{t.statusDoneText}</> : <span aria-hidden="true">→</span>}</span>
        </Link>
      </li>
    );
  };

  return (
    <CsappShell className="cs-home">
      <Spotlight />
      <aside className="sb" aria-label={t.homeSubjects}>
        <div className="sb-head">
          <div className="sb-kicker">{t.homeSbKicker}</div>
          <Link href={prefixPath(lang, "/")} className="sb-title">{t.siteName}</Link>
          <div className="sb-sub">{t.homeSbSub}</div>
        </div>
        <a href="#top" className="sb-overview is-active"><span className="sb-ov-ico" aria-hidden="true" />{t.homeOverview}</a>
        <div className="sb-label"><span>{t.homeSubjects}</span><span>{startedSubjects}/{SUBJECTS.length}</span></div>
        <div className="sb-list">
          {SUBJECTS.map((s, i) => (
            <div key={s} data-subj={s} {...hoverProps(s)}
              className={`sb-ch${hover === s ? " is-hover" : ""}${stats[s].done > 0 ? " is-started" : ""}${stats[s].total > 0 && stats[s].pct === 100 ? " is-done" : ""}`}>
              <a href={`#subject-${s}`} className="sb-link">
                <span className="sb-num">{pad(i + 1)}</span>
                <span className="sb-name">{t.subjects[s]}</span>
                <span className="sb-prog"><Ring p={stats[s].pct} /></span>
              </a>
            </div>
          ))}
        </div>
        <div className="sb-label"><span>{t.homeMore}</span></div>
        <div className="sb-list">
          <div className="sb-ch"><Link href={prefixPath(lang, "/csapp/")} className="sb-link"><span className="sb-num">CS</span><span className="sb-name">{t.csappNavTitle}</span><span className="sb-prog" /></Link></div>
          <div className="sb-ch"><Link href={prefixPath(lang, "/coding/")} className="sb-link"><span className="sb-num">{"</>"}</span><span className="sb-name">{t.coding}</span><span className="sb-prog" /></Link></div>
        </div>
        <div className="sb-foot">
          <div className="sb-foot-row"><span>{t.progress}</span><b>{pct}%</b></div>
          <div className="sb-foot-bar" aria-hidden="true"><i style={{ width: `${pct}%` }} /></div>
          <div className="sb-foot-row sm"><span>{fmt(t.homeDoneShort, { done: doneCount, total: published.length })}</span></div>
          <ThemeSwitch />
        </div>
      </aside>

      <div className="main" id="top">
        <div className="hm-page">
          <header className="hm-head">
            <div className="kicker">{t.homeOverview}</div>
            <h1>{t.siteName}</h1>
            <p className="lede">{t.tagline}</p>
          </header>

          <section className="map" aria-labelledby="hm-journey">
            <div className="map-head">
              <h2 id="hm-journey">{t.journey}</h2>
              <p>{t.journeyNote}</p>
            </div>
            <Link href={prefixPath(lang, "/csapp/")} className="map-tour spot">
              <span className="node-no">CS</span>
              <span className="mt-name">{t.csappCardTitle}</span>
              <span className="mt-tag">{t.csappJourneyText}</span>
              <span className="mt-prog">{t.csappCardMeta}</span>
            </Link>
            <div className="map-stages">
              {chunks.map((steps, i) => (
                <div key={i} className="stage">
                  <div className="stage-head"><span className="stage-no">{ROMAN[i]}</span><b>{stages[i]?.[0]}</b><small>{stages[i]?.[1]}</small></div>
                  <div className="stage-nodes">
                    {steps.map((j) => {
                      const n = journey.indexOf(j) + 1;
                      return (
                        <a key={j.subject} href={`#subject-${j.subject}`} data-subj={j.subject} {...hoverProps(j.subject)}
                          className={`spot node${hover === j.subject ? " is-hover" : ""}${stats[j.subject].done > 0 ? " is-started" : ""}`}>
                          <span className="node-no">{pad(n)}</span>
                          <span className="node-name">{t.subjects[j.subject]}</span>
                          <span className="node-tag">{j.title}</span>
                          <span className="node-text">{j.text}</span>
                        </a>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          </section>

          <section className="hm-grid">
            {next ? (
              <Link href={stepPath(next.subject, next.slug, 0, lang)} className="spot card hm-continue">
                <div className="card-kicker">{doneCount > 0 ? t.homeContinue : t.homeStartHere}</div>
                <div className="hc-title"><span className="hc-num">{t.subjects[next.subject as SubjectId]}</span>{plainText(next.title)}</div>
                <p className="hc-where">{plainText(next.summary)}</p>
                <div className="hc-bar" aria-hidden="true"><i style={{ width: `${nextStat?.pct ?? 0}%` }} /></div>
                <div className="hc-meta">
                  <span>{nextStat?.pct ?? 0}%</span>
                  <span>{fmt(t.stepsBadge, { n: next.steps })}{next.minutes ? ` · ${fmt(t.minutesBadge, { n: next.minutes })}` : ""}</span>
                  <span className="hc-cta">{t.homeGo} →</span>
                </div>
              </Link>
            ) : <div />}
            <div className="spot card hm-overall">
              <div className="card-kicker">{t.progress}</div>
              <div className="ov-big" role="progressbar" aria-valuenow={pct} aria-valuemin={0} aria-valuemax={100} aria-label={t.progress}>{pct}<small>%</small></div>
              <div className="ov-strip" style={{ gridTemplateColumns: `repeat(${SUBJECTS.length},1fr)` }}>
                {SUBJECTS.map((s) => <i key={s} className={`cs${stats[s].done ? " on" : ""}`} style={{ ["--p" as string]: `${stats[s].pct}%` }} title={`${t.subjects[s]} ${stats[s].pct}%`} />)}
              </div>
              <div className="ov-meta"><span>{fmt(t.progressLine, { done: doneCount, total: published.length, pct })}</span></div>
            </div>
            <Link href={prefixPath(lang, "/coding/")} className="spot card hm-practice">
              <div className="card-kicker">{t.coding}</div>
              <div className="hc-title">{t.codingCardTitle}</div>
              <p className="hc-where">{t.codingCardSummary}</p>
              <div className="hc-meta"><span>{t.codingCardMetaPractice}</span><span>{t.codingCardMetaMock}</span><span className="hc-cta">{t.homeGo} →</span></div>
            </Link>
          </section>

          <section className="hm-sec" id="route" aria-labelledby="hm-route">
            <div className="hm-sec-head"><h2 id="hm-route">{t.route}</h2><p className="lede">{t.routeNote}</p></div>
            <ol className="rt-grid">
              {ROUTE_SUBJECTS.map((s, i) => {
                const name = s === "coding" ? t.coding : t.subjects[s];
                const href = s === "coding" ? prefixPath(lang, "/coding/") : `#subject-${s}`;
                return (
                  <li key={s}>
                    <a href={href} className="rt-item">
                      <span className="rt-n">{pad(i + 1)}</span>
                      <b>{name}</b>
                      <span>{t.routeBlurbs[s as keyof typeof t.routeBlurbs]}</span>
                    </a>
                  </li>
                );
              })}
            </ol>
          </section>

          {SUBJECTS.map((s, i) => {
            const list = topics.filter((x) => x.subject === s);
            const info = infoOf(s);
            const byId = new Map(list.map((x) => [x.id, x]));
            const grouped = new Set<string>();
            const blocks = (info?.blocks ?? []).map((b) => {
              const rows = b.topics.map((id) => byId.get(id)).filter((x): x is HomeTopic => !!x);
              rows.forEach((x) => grouped.add(x.id));
              return { ...b, rows };
            });
            const leftover = list.filter((x) => !grouped.has(x.id));
            const st = stats[s];
            return (
              <section key={s} id={`subject-${s}`} className="hm-sec subj" aria-labelledby={`hm-s-${s}`}>
                <div className="hm-sec-head">
                  <span className="sec-num">{pad(i + 1)}</span>
                  <h2 id={`hm-s-${s}`}>{t.subjects[s]}</h2>
                  {st.total > 0 && (
                    <span className="subj-prog">
                      <span>{fmt(t.homeDoneShort, { done: st.done, total: st.total })}</span>
                      <span className="subj-bar" aria-hidden="true"><i style={{ width: `${st.pct}%` }} /></span>
                    </span>
                  )}
                  {info && <p className="lede">{info.tagline}</p>}
                </div>
                {list.length === 0 && blocks.every((b) => b.gaps.length === 0) ? <p className="lede">{t.comingSoon}</p> : (
                  <div className="blk-grid">
                    {blocks.filter((b) => b.rows.length || b.gaps.length).map((b) => (
                      <div key={b.name} className="card blk">
                        <h3>{b.name}</h3>
                        <p className="blk-blurb">{b.blurb}</p>
                        <ul className="tp-list">
                          {b.rows.map(row)}
                          {b.gaps.map((g) => (
                            <li key={g.title} className="tp-row is-off is-gap">
                              <span className="tp-main"><span className="tp-title">{g.title}</span><span className="tp-meta"><span>{g.note}</span></span></span>
                              <span className="tp-st">{t.comingSoon}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    ))}
                    {leftover.length > 0 && (
                      <div className="card blk"><ul className="tp-list">{leftover.map(row)}</ul></div>
                    )}
                  </div>
                )}
              </section>
            );
          })}

          <section className="hm-sec" id="subject-csapp" aria-labelledby="hm-more">
            <div className="hm-sec-head"><h2 id="hm-more">{t.homeMore}</h2></div>
            <div className="blk-grid">
              <Link href={prefixPath(lang, "/csapp/")} className="spot card more-card">
                <div className="card-kicker">{t.csapp}</div>
                <div className="hc-title">{t.csappCardTitle}</div>
                <p className="hc-where">{t.csappCardSummary}</p>
                <div className="hc-meta"><span>{t.csappCardMeta}</span><span className="hc-cta">{t.homeGo} →</span></div>
              </Link>
              <Link href={prefixPath(lang, "/coding/")} className="spot card more-card">
                <div className="card-kicker">{t.coding}</div>
                <div className="hc-title">{t.codingCardTitle}</div>
                <p className="hc-where">{t.codingCardSummary}</p>
                <div className="hc-meta"><span>{t.codingCardMetaPractice}</span><span>{t.codingCardMetaMock}</span><span className="hc-cta">{t.homeGo} →</span></div>
              </Link>
            </div>
          </section>

          <section className="hm-sec" aria-labelledby="hm-roadmap">
            <div className="hm-sec-head"><h2 id="hm-roadmap">{t.roadmap}</h2></div>
            <ul className="rm-list">
              {t.roadmapItems.map((r) => <li key={r} className="tp-row is-off is-gap"><span className="tp-main"><span className="tp-title">{r}</span></span><span className="tp-st">{t.comingSoon}</span></li>)}
            </ul>
          </section>

          <footer className="hm-foot">{t.footer}</footer>
        </div>
      </div>
    </CsappShell>
  );
}
