"use client";
import Link from "next/link";
import { stepPath } from "@/lib/paths";
import { plainText } from "@/lib/terms";
import { doneKey, isDone, useMounted, useProgressVersion } from "@/lib/progress";
import { SubjectDiagram, type TopicLinks } from "@/components/coherence/Panorama";
import { SubjectSectionV2 } from "./SubjectSectionV2";
import { isV2Subject } from "@/lib/ui-v2";
import type { JourneyStep, SubjectInfo } from "@/lib/schema";
import { fmt, prefixPath } from "@/i18n";
import { useLang } from "@/i18n/client";

export type HomeTopic = {
  id: string; subject: string; slug: string; title: string; summary: string; status: string;
  steps: number; level?: string; minutes?: number; prereq?: string[];
};
const ROUTE_SUBJECTS = ["dsa", "co", "os", "network", "data", "distributed", "go", "backend", "math", "ai", "coding"] as const;

export function Home({ topics, subjects, journey }: { topics: HomeTopic[]; subjects: SubjectInfo[]; journey: JourneyStep[] }) {
  const { lang, s: t } = useLang();
  useProgressVersion();
  const mounted = useMounted();
  const published = topics.filter((x) => x.status === "published");
  const doneCount = mounted ? published.filter((x) => isDone(doneKey(x.id))).length : 0;
  const pct = published.length ? Math.round((doneCount / published.length) * 100) : 0;
  const links: TopicLinks = Object.fromEntries(topics.map((x) => [x.id, { id: x.id, title: x.title, href: stepPath(x.subject, x.slug, 0, lang) }]));
  const infoOf = (s: string) => subjects.find((x) => x.id === s);
  return (
    <div className="home">
      <h1>{t.siteName}</h1>
      <p className="summary">{t.tagline}</p>

      <section className="journey card">
        <h2>{t.journey}</h2>
        <p className="muted">{t.journeyNote}</p>
        <ol className="journey-flow">
          {journey.map((j, i) => (
            <li key={j.subject} className="journey-step">
              {i > 0 && <span className="journey-arrow" aria-hidden="true">→</span>}
              <Link href={`#subject-${j.subject}`}>
                <b>{t.subjects[j.subject]}</b>
                <span className="journey-title">{j.title}</span>
                <p>{j.text}</p>
              </Link>
            </li>
          ))}
        </ol>
        <div className="journey-extra">
          <Link href={prefixPath(lang, "/csapp/")} className="journey-csapp">
            <b>{t.csapp}</b>
            <span className="journey-title">{t.csappJourneyTitle}</span>
            <p>{t.csappJourneyText}</p>
          </Link>
        </div>
      </section>

      <section className="route card">
        <h2>{t.route}</h2>
        <p className="muted">{t.routeNote}</p>
        <ol className="route-steps">
          {ROUTE_SUBJECTS.map((subject, i) => (
            <li key={subject}><span className="route-n">{i + 1}</span><div><b>{subject === "coding" ? t.coding : t.subjects[subject as keyof typeof t.subjects]}</b><p>{t.routeBlurbs[subject as keyof typeof t.routeBlurbs]}</p></div></li>
          ))}
        </ol>
        <div className="progress-wrap" role="progressbar" aria-valuenow={pct} aria-valuemin={0} aria-valuemax={100} aria-label={t.progress}>
          <div className="progress-bar" style={{ width: `${pct}%` }} />
        </div>
        <p className="muted">{fmt(t.progressLine, { done: doneCount, total: published.length, pct })}</p>
      </section>

      {(["dsa", "co", "os", "network", "data", "distributed", "go", "backend", "math", "ai"] as const).map((s) => {
        const list = topics.filter((x) => x.subject === s);
        const info = infoOf(s);
        // UI v2 sample gate: only the gated subject gets the new subject page.
        if (isV2Subject(s) && info) {
          return <SubjectSectionV2 key={s} name={t.subjects[s]} info={info} topics={list} />;
        }
        return (
          <section key={s} id={`subject-${s}`} className="subject">
            <h2>{t.subjects[s]}</h2>
            {info && (
              <div className="subject-guide">
                <p className="guide-tagline">{info.tagline}</p>
                <SubjectDiagram info={info} links={links} />
              </div>
            )}
            {list.length === 0 ? <p className="muted">{t.comingSoon}</p> : (
              <ul className="cards">
                {list.map((x) => {
                  const done = mounted && isDone(doneKey(x.id));
                  return x.status === "coming-soon" ? (
                    <li key={x.id} className="topic-card disabled"><h3>{plainText(x.title)}</h3><p>{plainText(x.summary)}</p><span className="badge">{t.comingSoon}</span></li>
                  ) : (
                    <li key={x.id} className="topic-card"><Link href={stepPath(x.subject, x.slug, 0, lang)}>
                      <h3>{plainText(x.title)}{done && <span className="done-check" aria-label={t.done}> ✓</span>}</h3>
                      <p className="card-summary">{plainText(x.summary)}</p>
                      <div className="card-foot">
                        <p className="card-meta">
                          <span>{fmt(t.stepsBadge, { n: x.steps })}</span>
                          {x.minutes && <span>{fmt(t.minutesBadge, { n: x.minutes })}</span>}
                          {x.level && <span>{t.levels[x.level as keyof typeof t.levels] ?? x.level}</span>}
                          {x.status === "draft" && <span className="badge pending">{t.draft}</span>}
                        </p>
                        {x.prereq && x.prereq.length > 0 && (
                          <p className="card-prereqs">{x.prereq.map((p) => <span key={p} className="prereq-chip">{t.prereq} · {p}</span>)}</p>
                        )}
                      </div>
                    </Link></li>
                  );
                })}
              </ul>
            )}
          </section>
        );
      })}

      <section className="subject" id="subject-csapp">
        <h2>{t.csapp}</h2>
        <ul className="cards">
          <li className="topic-card"><Link href={prefixPath(lang, "/csapp/")}>
            <h3>{t.csappCardTitle}</h3>
            <p className="card-summary">{t.csappCardSummary}</p>
            <div className="card-foot"><p className="card-meta"><span>{t.csappCardMeta}</span></p></div>
          </Link></li>
        </ul>
      </section>

      <section className="subject">
        <h2>{t.coding}</h2>
        <ul className="cards">
          <li className="topic-card"><Link href={prefixPath(lang, "/coding/")}>
            <h3>{t.codingCardTitle}</h3>
            <p className="card-summary">{t.codingCardSummary}</p>
            <div className="card-foot"><p className="card-meta"><span>{t.codingCardMetaPractice}</span><span>{t.codingCardMetaMock}</span></p></div>
          </Link></li>
        </ul>
      </section>

      <section className="subject roadmap">
        <h2>{t.roadmap}</h2>
        <ul className="cards">
          {t.roadmapItems.map((r) => <li key={r} className="topic-card disabled"><p>{r}</p><span className="badge">{t.comingSoon}</span></li>)}
        </ul>
      </section>
    </div>
  );
}
