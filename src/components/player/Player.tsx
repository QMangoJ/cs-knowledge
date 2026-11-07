"use client";
import Link from "next/link";
import { usePlayer } from "./usePlayer";
import { Canvas } from "@/components/renderers";
import type { ViewTopic } from "@/lib/view";
import { t } from "@/i18n";
import { stepPath } from "@/lib/paths";
import { MarkDone } from "./Quiz";

export type RailBlock = {
  name: string;
  topics: { id: string; title: string; href: string }[];
  gaps: { title: string; note: string }[];
};
export type PlayerNav = {
  blockName: string;
  station: number;
  totalStations: number;
  blocks: RailBlock[];
};
type NextTopic = { href: string; title: string } | null;

export function Player({ topic, initialStep, nextTopic, nav }: { topic: ViewTopic; initialStep: number; nextTopic: NextTopic; nav: PlayerNav }) {
  const total = topic.steps.length;
  const { index, playing, goTo, next, prev, toggle, speed, setSpeed } = usePlayer(topic.subject, topic.slug, total, initialStep);
  const step = topic.steps[index]!;
  const rows = topic.steps.slice(0, index + 1).flatMap((s, si) => s.log.map((r, ri) => ({ r, key: `${si}-${ri}`, fresh: si === index })));
  const caption = step.canvas.kind !== "swimlane" ? step.canvas.caption : undefined;
  const subjectName = t.subjects[topic.subject];

  return (
    <div className="player2">
      <div className="app-screen">
        <header className="p-topbar">
          <div className="p-crumb">
            <Link href="/">{subjectName}</Link>
            <span aria-hidden="true"> › </span>
            <span>{nav.blockName}</span>
            <span aria-hidden="true"> › </span>
            <b>{topic.title}</b>
            <span className="p-station">{subjectName}第 {nav.station} 站 / 共 {nav.totalStations} 站</span>
          </div>
          <div className="p-segments" role="progressbar" aria-valuemin={1} aria-valuemax={total} aria-valuenow={index + 1} aria-label={`${t.steps} ${index + 1} / ${total}`}>
            {topic.steps.map((s, i) => (
              <button key={s.id} type="button" tabIndex={-1} aria-hidden="true"
                className={i < index ? "seg done" : i === index ? "seg current" : "seg"}
                onClick={() => goTo(i)} />
            ))}
          </div>
          <div className="p-topright">
            <span className="p-stepcount">第 {index + 1} 步 / 共 {total} 步</span>
            <MarkDone topicId={topic.id} />
          </div>
        </header>

        <div className={rows.length > 0 || caption ? "p-grid" : "p-grid no-log"}>
          <aside className="p-rail">
            <section className="rail-pano" aria-label={t.panorama}>
              <h3>{t.panorama}</h3>
              <p className="rail-station">{subjectName} · 第 {nav.station} / {nav.totalStations} 站 · 本课在「{nav.blockName}」板块</p>
              <div className="rail-blocks">
                {nav.blocks.map((b) => (
                  <div key={b.name} className={b.name === nav.blockName ? "rail-block current-block" : "rail-block"}>
                    <p className="rail-block-name">{b.name}</p>
                    {b.topics.map((x) => (
                      <Link key={x.id} href={x.href} className={x.id === topic.id ? "rail-topic current" : "rail-topic"} aria-current={x.id === topic.id ? "page" : undefined}>{x.title}</Link>
                    ))}
                    {b.gaps.map((g) => <span key={g.title} className="rail-gap" title={g.note}>{g.title}（待补）</span>)}
                  </div>
                ))}
              </div>
            </section>

            <nav className="steplist" aria-label={t.steps}>
              <ol>
                {topic.steps.map((s, i) => (
                  <li key={s.id} className={i === index ? "current" : i < index ? "done" : ""}>
                    <a href={stepPath(topic.subject, topic.slug, i)} aria-current={i === index ? "step" : undefined}
                      onClick={(e) => { e.preventDefault(); goTo(i); }}>
                      <span className="n">{i < index ? "✓" : i + 1}</span>
                      <span className="sl-text"><span className="sl-title">{s.title}</span><span className="sl-sub">{s.tldr}</span></span>
                    </a>
                  </li>
                ))}
              </ol>
            </nav>

            {topic.objectives && topic.objectives.length > 0 && (
              <details className="objectives more">
                <summary>{t.objectives}</summary>
                <ul>{topic.objectives.map((o) => <li key={o}>{o}</li>)}</ul>
              </details>
            )}
            {topic.aiLink && (
              <details className="ai-link more">
                <summary>{t.aiLink}</summary>
                <p>{topic.aiLink}</p>
              </details>
            )}
          </aside>

          <nav className="step-chips" aria-label={t.steps}>
            {topic.steps.map((s, i) => (
              <a key={s.id} href={stepPath(topic.subject, topic.slug, i)} className={i === index ? "chip current" : i < index ? "chip done" : "chip"}
                aria-current={i === index ? "step" : undefined}
                onClick={(e) => { e.preventDefault(); goTo(i); }}>{i < index ? "✓ " : `${i + 1} · `}{s.title}</a>
            ))}
          </nav>

          <section className="p-stage" aria-label="画布">
            <div className="canvas-wrap stage-card">
              {step.log.length > 0 && (
                <p className="now-bar" aria-live="polite"><b>{t.nowHappening}</b>{step.log.map((r) => topic.logColumns.map((c) => r[c.key]).filter(Boolean).join(" · ")).join("；")}</p>
              )}
              <div className="stage-body">
                <Canvas state={step.canvas} lanes={topic.lanes} />
              </div>
              {step.canvas.registers && step.canvas.registers.length > 0 && (
                <ul className="regs">{step.canvas.registers.map((r) => <li key={r.name} className={r.changed ? "changed" : ""}><code>{r.name}</code> {r.value}</li>)}</ul>
              )}
            </div>
            <div className="stepnav stage-controls" role="toolbar" aria-label="步骤导航">
              <button type="button" onClick={prev} disabled={index === 0}>← {t.prev}</button>
              <button type="button" onClick={toggle} disabled={index === total - 1}>{playing ? t.pause : t.play}</button>
              <input className="scrub" type="range" min={0} max={total - 1} value={index} aria-label={t.scrub}
                onChange={(e) => goTo(Number(e.target.value))} />
              <span className="count">{index + 1} / {total}</span>
              <span className="speeds" role="group" aria-label={t.speed}>
                {(["slow", "normal", "fast"] as const).map((s) => (
                  <button key={s} type="button" className={speed === s ? "on" : ""} aria-pressed={speed === s} onClick={() => setSpeed(s)}>{s === "slow" ? "慢" : s === "fast" ? "快" : "常速"}</button>
                ))}
              </span>
              {index < total - 1
                ? <button type="button" onClick={next}>{t.next} →</button>
                : nextTopic ? <a className="btn" href={nextTopic.href}>{t.nextTopic}：{nextTopic.title} →</a> : null}
            </div>
          </section>

          <article className="step p-details" aria-live="polite">
            {index === 0 && (
              <header className="topic-intro">
                <p className="eyebrow">{subjectName} · {nav.blockName} · 第 {nav.station} / {nav.totalStations} 站</p>
                <h1>{topic.title}</h1>
                <p className="summary">{topic.summary}</p>
                {(topic.level || topic.minutes || (topic.prereq && topic.prereq.length > 0)) && (
                  <p className="topic-meta">
                    {topic.level && <span className="badge">{t.level} · {topic.level}</span>}
                    {topic.minutes && <span className="badge">约 {topic.minutes} {t.minutes}</span>}
                    {topic.prereq && topic.prereq.length > 0 && <span className="badge">{t.prereq}：{topic.prereq.join("、")}</span>}
                  </p>
                )}
                {topic.position && (
                  <div className="position-card">
                    <h3>{t.position}</h3>
                    <p>{topic.position}</p>
                  </div>
                )}
              </header>
            )}
            <p className="eyebrow">{t.steps} {index + 1} / {total}</p>
            <h2>{step.title}</h2>
            <p className="tldr">{step.tldr}</p>
            <div className="body" dangerouslySetInnerHTML={{ __html: step.bodyHtml }} />
            {step.code && (
              <figure className="codeblock">
                <figcaption>{step.code.lang}{step.code.note ? ` · ${step.code.note}` : ""}</figcaption>
                <pre><code>{step.code.code.split("\n").map((ln, li) => (
                  <span key={li} className={step.code!.highlight === li + 1 ? "cl hl" : "cl"}>{ln || " "}</span>
                ))}</code></pre>
              </figure>
            )}
            {step.points && step.points.length > 0 && (
              <div className="points"><h3>{t.points}</h3><ul>{step.points.map((pt) => <li key={pt}>{pt}</li>)}</ul></div>
            )}
            {step.mistake && <p className="mistake"><b>{t.mistake}：</b>{step.mistake}</p>}
            {step.keyFields && step.keyFields.length > 0 && (
              <details className="more"><summary>{t.keyFields}</summary>
                <dl className="kv">{step.keyFields.map((k) => <div key={k.key}><dt>{k.key}</dt><dd>{k.value}</dd></div>)}</dl>
              </details>
            )}
          </article>

          {(rows.length > 0 || caption) && (
            <section className="log p-logbar" aria-label={t.log}>
              <div className="logbar-head">
                <h3>{t.log}</h3>
                {topic.legend && <ul className="legend">{topic.legend.map((l) => <li key={l.key}><b>{l.key}</b>{l.label}</li>)}</ul>}
              </div>
              {rows.length > 0 ? (
                <div className="logbar-scroll">
                  <table>
                    <thead><tr>{topic.logColumns.map((c) => <th key={c.key}>{c.label}</th>)}</tr></thead>
                    <tbody>{rows.map(({ r, key, fresh }) => <tr key={key} className={fresh ? "fresh" : ""}>{topic.logColumns.map((c) => <td key={c.key}>{r[c.key] ?? ""}</td>)}</tr>)}</tbody>
                  </table>
                </div>
              ) : (
                <p className="logbar-caption">{caption}</p>
              )}
            </section>
          )}
        </div>
      </div>
    </div>
  );
}
