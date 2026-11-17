"use client";
import Link from "next/link";
import { stepPath } from "@/lib/paths";
import { plainText } from "@/lib/terms";
import { doneKey, isDone, useMounted, useProgressVersion } from "@/lib/progress";
import type { SubjectInfo } from "@/lib/schema";
import type { HomeTopic } from "./Home";
import { t } from "@/i18n";

/** UI v2 sample: subject page (home section) for the gated subject only.
 *  Layout: big subject name → subject progress (same localStorage store as the
 *  player's MarkDone: cs-done:<topicId>) → blocks as large headings → one row
 *  per lesson (name / steps / minutes / completion state). No lesson summaries
 *  here: rows carry titles + meta only, so nothing on screen repeats. */
export function SubjectSectionV2({ name, info, topics }: { name: string; info: SubjectInfo; topics: HomeTopic[] }) {
  useProgressVersion();
  const mounted = useMounted();
  const byId = new Map(topics.map((x) => [x.id, x]));
  const countable = topics.filter((x) => x.status === "published");
  const doneCount = mounted ? countable.filter((x) => isDone(doneKey(x.id))).length : 0;
  const pct = countable.length ? Math.round((doneCount / countable.length) * 100) : 0;

  const grouped = new Set<string>();
  const blocks = info.blocks.map((b) => {
    const rows = b.topics.map((id) => byId.get(id)).filter((x): x is HomeTopic => !!x);
    rows.forEach((x) => grouped.add(x.id));
    return { name: b.name, blurb: b.blurb, rows, gaps: b.gaps };
  });
  const leftover = topics.filter((x) => !grouped.has(x.id));

  const row = (x: HomeTopic) => {
    const done = mounted && isDone(doneKey(x.id));
    const meta = (
      <span className="v2-row-meta">
        <span>{x.steps} 步</span>
        {x.minutes && <span>约 {x.minutes} {t.minutes}</span>}
        {x.level && <span>{x.level}</span>}
        {x.status === "draft" && <span>{t.draft}</span>}
      </span>
    );
    const status = x.status === "coming-soon"
      ? <span className="v2-status">{t.comingSoon}</span>
      : done
        ? <span className="v2-status done">✓ 已学完</span>
        : <span className="v2-status">未完成</span>;
    const inner = (
      <>
        <span className="v2-row-main">
          <span className="v2-row-title">{plainText(x.title)}</span>
          {meta}
        </span>
        {status}
      </>
    );
    return x.status === "coming-soon" ? (
      <li key={x.id} className="v2-row disabled">{inner}</li>
    ) : (
      <li key={x.id}>
        <Link className="v2-row" href={stepPath(x.subject, x.slug, 0)}>{inner}</Link>
      </li>
    );
  };

  return (
    <section id={`subject-${info.id}`} className="subject uiv2 uiv2-subject">
      <h2 className="v2-subject-name">{name}</h2>
      <p className="v2-tagline">{info.tagline}</p>
      <div className="v2-progress-row">
        <span className="v2-progress-text">已完成 {doneCount} / {countable.length} 课</span>
        <div className="v2-progress" role="progressbar" aria-valuenow={pct} aria-valuemin={0} aria-valuemax={100} aria-label="学科进度">
          <div style={{ width: `${pct}%` }} />
        </div>
        <span className="v2-progress-text">{pct}%</span>
      </div>

      {blocks.map((b) => (
        <div key={b.name} className="v2-block">
          <h3 className="v2-block-name">{b.name}</h3>
          <p className="v2-block-blurb">{b.blurb}</p>
          <ul className="v2-rows">
            {b.rows.map(row)}
            {b.gaps.map((g) => (
              <li key={g.title} className="v2-row gap disabled">
                <span className="v2-row-main">
                  <span className="v2-row-title">{g.title}</span>
                  <span className="v2-row-meta"><span>{g.note}</span></span>
                </span>
                <span className="v2-status">{t.comingSoon}</span>
              </li>
            ))}
          </ul>
        </div>
      ))}

      {leftover.length > 0 && (
        <div className="v2-block">
          <ul className="v2-rows">{leftover.map(row)}</ul>
        </div>
      )}
    </section>
  );
}
