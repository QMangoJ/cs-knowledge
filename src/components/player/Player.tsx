"use client";
import { usePlayer } from "./usePlayer";
import { Canvas } from "@/components/renderers";
import type { ViewTopic, ViewSources } from "@/lib/view";
import type { SourceCitation } from "@/lib/schema";
import { t, REPO_URL } from "@/i18n";
import { issueUrl, stepPath } from "@/lib/paths";
import { Quiz, MarkDone } from "./Quiz";

type NextTopic = { href: string; title: string } | null;

export function Player({ topic, sources, initialStep, nextTopic }: { topic: ViewTopic; sources: ViewSources; initialStep: number; nextTopic: NextTopic }) {
  const total = topic.steps.length;
  const { index, playing, goTo, next, prev, toggle } = usePlayer(topic.subject, topic.slug, total, initialStep);
  const step = topic.steps[index]!;
  const rows = topic.steps.slice(0, index + 1).flatMap((s, si) => s.log.map((r, ri) => ({ r, key: `${si}-${ri}`, fresh: si === index })));

  return (
    <div className="player">
      <section className="col-explain" aria-label="讲解">
        <header className="topic-head">
          <p className="eyebrow">{t.subjects[topic.subject]}</p>
          <h1>{topic.title}</h1>
          <p className="summary">{topic.summary}</p>
          {(topic.level || topic.minutes || (topic.prereq && topic.prereq.length > 0)) && (
            <p className="topic-meta">
              {topic.level && <span className="badge">{t.level} · {topic.level}</span>}
              {topic.minutes && <span className="badge">约 {topic.minutes} {t.minutes}</span>}
              {topic.prereq && topic.prereq.length > 0 && <span className="badge">{t.prereq}：{topic.prereq.join("、")}</span>}
            </p>
          )}
          {topic.objectives && topic.objectives.length > 0 && (
            <div className="objectives"><h3>{t.objectives}</h3><ul>{topic.objectives.map((o) => <li key={o}>{o}</li>)}</ul></div>
          )}
          {topic.aiLink && <div className="ai-link"><h3>{t.aiLink}</h3><p>{topic.aiLink}</p></div>}
          <details className="more">
            <summary>{t.overview}</summary>
            <p className="premise">{topic.premise}</p>
            <dl className="kv">{topic.overview.map((o) => <div key={o.key}><dt>{o.key}</dt><dd>{o.value}</dd></div>)}</dl>
          </details>
        </header>
        <article className="step" aria-live="polite">
          <p className="eyebrow">{t.steps} {index + 1} / {total}</p>
          <h2>{step.title}</h2>
          <p className="tldr">{step.tldr}</p>
          <div className="body" dangerouslySetInnerHTML={{ __html: step.bodyHtml }} />
          {step.code && (
            <figure className="codeblock">
              <figcaption>{step.code.lang}{step.code.note ? ` · ${step.code.note}` : ""}</figcaption>
              <pre><code>{step.code.code}</code></pre>
            </figure>
          )}
          {step.points && step.points.length > 0 && (
            <div className="points"><h3>{t.points}</h3><ul>{step.points.map((pt) => <li key={pt}>{pt}</li>)}</ul></div>
          )}
          {step.mistake && <p className="mistake"><b>{t.mistake}：</b>{step.mistake}</p>}
          {index === total - 1 && topic.quiz && topic.quiz.length > 0 && <Quiz items={topic.quiz} topicId={topic.id} />}
          {index === total - 1 && <MarkDone topicId={topic.id} />}
          {step.keyFields && step.keyFields.length > 0 && (
            <details className="more"><summary>{t.keyFields}</summary>
              <dl className="kv">{step.keyFields.map((k) => <div key={k.key}><dt>{k.key}</dt><dd>{k.value}</dd></div>)}</dl>
            </details>
          )}
        </article>
      </section>

      <section className="col-canvas" aria-label="画布">
        <div className="canvas-wrap">
          <Canvas state={step.canvas} lanes={topic.lanes} />
          {step.canvas.registers && step.canvas.registers.length > 0 && (
            <ul className="regs">{step.canvas.registers.map((r) => <li key={r.name} className={r.changed ? "changed" : ""}><code>{r.name}</code> {r.value}</li>)}</ul>
          )}
        </div>
        <details className="log more">
          <summary>{t.log}（{rows.length}）</summary>
          <table>
            <thead><tr>{topic.logColumns.map((c) => <th key={c.key}>{c.label}</th>)}</tr></thead>
            <tbody>{rows.map(({ r, key, fresh }) => <tr key={key} className={fresh ? "fresh" : ""}>{topic.logColumns.map((c) => <td key={c.key}>{r[c.key] ?? ""}</td>)}</tr>)}</tbody>
          </table>
          {topic.legend && <ul className="legend">{topic.legend.map((l) => <li key={l.key}><b>{l.key}</b>{l.label}</li>)}</ul>}
        </details>
      </section>

      <aside className="col-side">
        <nav className="steplist" aria-label={t.steps}>
          <ol>
            {topic.steps.map((s, i) => (
              <li key={s.id} className={i === index ? "current" : i < index ? "done" : ""}>
                <a href={stepPath(topic.subject, topic.slug, i)} aria-current={i === index ? "step" : undefined}
                  onClick={(e) => { e.preventDefault(); goTo(i); }}><span className="n">{i + 1}</span>{s.title}</a>
              </li>
            ))}
          </ol>
        </nav>
        {topic.terminal && topic.terminal.length > 0 && (
          <details className="terminal more">
            <summary>{t.terminal}</summary>
            <ul>{topic.terminal.map((c, i) => <li key={i}><code>{c.cmd}</code>{c.note && <p>{c.note}</p>}</li>)}</ul>
          </details>
        )}
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
    <details className="sources more">
      <summary>{t.sources}（{citations.length}）</summary>
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
    </details>
  );
}

