"use client";
import { usePlayer } from "./usePlayer";
import { Canvas } from "@/components/renderers";
import type { ViewTopic, ViewSources } from "@/lib/view";
import type { SourceCitation } from "@/lib/schema";
import { t, REPO_URL } from "@/i18n";
import { issueUrl, stepPath } from "@/lib/paths";

type NextTopic = { href: string; title: string } | null;

export function Player({ topic, sources, initialStep, nextTopic }: { topic: ViewTopic; sources: ViewSources; initialStep: number; nextTopic: NextTopic }) {
  const total = topic.steps.length;
  const { index, playing, goTo, next, prev, toggle } = usePlayer(topic.subject, topic.slug, total, initialStep);
  const step = topic.steps[index]!;
  const rows = topic.steps.slice(0, index + 1).flatMap((s, si) => s.log.map((r, ri) => ({ r, key: `${si}-${ri}`, fresh: si === index })));

  return (
    <div className="player">
      <section className="col-explain" aria-label="讲解">
        <div className="card overview">
          <p className="eyebrow">{t.subjects[topic.subject]} · {topic.premise}</p>
          <h1>{topic.title}</h1>
          <p className="summary">{topic.summary}</p>
          <dl className="kv">{topic.overview.map((o) => <div key={o.key}><dt>{o.key}</dt><dd>{o.value}</dd></div>)}</dl>
        </div>
        <article className="card step" aria-live="polite">
          <p className="eyebrow">{t.steps} {index + 1} / {total}</p>
          <h2>{step.title}</h2>
          <p className="tldr">{step.tldr}</p>
          <div className="body" dangerouslySetInnerHTML={{ __html: step.bodyHtml }} />
          {step.keyFields && <dl className="kv">{step.keyFields.map((k) => <div key={k.key}><dt>{k.key}</dt><dd>{k.value}</dd></div>)}</dl>}
        </article>
      </section>

      <section className="col-canvas" aria-label="画布">
        <div className="canvas-wrap">
          <Canvas state={step.canvas} lanes={topic.lanes} />
          {step.canvas.registers && (
            <ul className="regs">{step.canvas.registers.map((r) => <li key={r.name} className={r.changed ? "changed" : ""}><code>{r.name}</code> {r.value}</li>)}</ul>
          )}
        </div>
        <div className="log card" aria-label={t.log}>
          <h3>{t.log}</h3>
          <table>
            <thead><tr>{topic.logColumns.map((c) => <th key={c.key}>{c.label}</th>)}</tr></thead>
            <tbody>{rows.map(({ r, key, fresh }) => <tr key={key} className={fresh ? "fresh" : ""}>{topic.logColumns.map((c) => <td key={c.key}>{r[c.key] ?? ""}</td>)}</tr>)}</tbody>
          </table>
        </div>
      </section>

      <aside className="col-side">
        <nav className="card steplist" aria-label={t.steps}>
          <h3>{t.steps}</h3>
          <ol>
            {topic.steps.map((s, i) => (
              <li key={s.id} className={i === index ? "current" : i < index ? "done" : ""}>
                <a href={stepPath(topic.subject, topic.slug, i)} aria-current={i === index ? "step" : undefined}
                  onClick={(e) => { e.preventDefault(); goTo(i); }}>{i + 1}. {s.title}</a>
              </li>
            ))}
          </ol>
        </nav>
        <SourceList citations={step.sources} defs={sources} />
        <a className="report" href={issueUrl(REPO_URL, topic.id, index + 1, step.title)} target="_blank" rel="noopener noreferrer">{t.reportError} ↗</a>
      </aside>

      <div className="stepnav" role="toolbar" aria-label="步骤导航">
        {index > 0 && <button type="button" onClick={prev}>← {t.prev}</button>}
        <button type="button" onClick={toggle} disabled={index === total - 1}>{playing ? t.pause : t.play}</button>
        <span className="count">{index + 1} / {total}</span>
        {index < total - 1
          ? <button type="button" onClick={next}>{t.next} →</button>
          : nextTopic ? <a className="btn" href={nextTopic.href}>{t.nextTopic}：{nextTopic.title} →</a> : null}
        <div className="progress" style={{ width: `${((index + 1) / total) * 100}%` }} />
      </div>
    </div>
  );
}

function SourceList({ citations, defs }: { citations: SourceCitation[]; defs: ViewSources }) {
  if (citations.length === 0) return null;
  return (
    <div className="card sources">
      <h3>{t.sources}</h3>
      {citations.length > 0 && (
        <ol>
          {citations.map((c, i) => {
            const d = defs[c.ref];
            return (
              <li key={i}>
                <a href={c.url ?? d?.url} target="_blank" rel="noopener noreferrer">[{i + 1}] {d?.title ?? c.ref} · {c.locator} ↗</a>
                <p className="claim">{c.claim}</p>
              </li>
            );
          })}
        </ol>
      )}
    </div>
  );
}

