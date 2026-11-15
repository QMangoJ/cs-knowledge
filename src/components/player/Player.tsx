"use client";
import { usePlayer } from "./usePlayer";
import { Canvas } from "@/components/renderers";
import type { ViewStep, ViewTopic } from "@/lib/view";
import { t, REPO_URL } from "@/i18n";
import { issueUrl, stepPath } from "@/lib/paths";
import { MarkDone } from "./Quiz";

export type PlayerNav = {
  blockName: string;
  station: number;
  totalStations: number;
};
type NextTopic = { href: string; title: string } | null;

export function Player({ topic, initialStep, nextTopic, nav }: { topic: ViewTopic; initialStep: number; nextTopic: NextTopic; nav: PlayerNav }) {
  const total = topic.steps.length;
  const { index, goTo, next, prev } = usePlayer(topic.subject, topic.slug, total, initialStep);
  const step = topic.steps[index]!;
  const rows = topic.steps.slice(0, index + 1).flatMap((s, si) => s.log.map((r, ri) => ({ r, key: `${si}-${ri}`, fresh: si === index })));
  const caption = step.canvas && step.canvas.kind !== "swimlane" ? step.canvas.caption : undefined;
  const subjectName = t.subjects[topic.subject];

  return (
    <div className="player2">
      <div className="app-screen">
        <header className="p-topbar">
          <div className="p-crumb">
            <a href="/">{subjectName}</a>
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
                {step.special ? <SpecialStage step={step} topic={topic} /> : <Canvas state={step.canvas!} lanes={topic.lanes} />}
              </div>
              {step.canvas?.registers && step.canvas.registers.length > 0 && (
                <ul className="regs">{step.canvas.registers.map((r) => <li key={r.name} className={r.changed ? "changed" : ""}><code>{r.name}</code> {r.value}</li>)}</ul>
              )}
            </div>
            <div className="stepnav stage-controls" role="toolbar" aria-label="步骤导航">
              <button type="button" onClick={prev} disabled={index === 0}>← {t.prev}</button>
              <input className="scrub" type="range" min={0} max={total - 1} value={index} aria-label={t.scrub}
                onChange={(e) => goTo(Number(e.target.value))} />
              <span className="count">{index + 1} / {total}</span>
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
            {step.special === "overview" && topic.overview.length > 0 && (
              <dl className="kv overview-kv">{topic.overview.map((o) => <div key={o.key}><dt>{o.key}</dt><dd>{o.value}</dd></div>)}</dl>
            )}
            {step.special === "terminal" && topic.terminal && topic.terminal.length > 0 && (
              <div className="term-list">
                {topic.terminal.map((c, i) => (
                  <div key={i} className="term-item"><code>{c.cmd}</code>{c.note && <p>{c.note}</p>}</div>
                ))}
              </div>
            )}
            {step.special === "design" && (
              <>
                {topic.design && topic.design.length > 0 && (
                  <div className="design in-step-design">
                    {topic.design.map((d) => (
                      <div key={d.mechanism} className="design-item">
                        <h4>{d.mechanism}</h4>
                        <p><b>{t.dProblem}：</b>{d.problem}</p>
                        <p><b>{t.dChoice}：</b>{d.choice}</p>
                        <p><b>{t.dTradeoff}：</b>{d.tradeoff}</p>
                        <p><b>{t.dRoot}：</b>{d.root}</p>
                      </div>
                    ))}
                  </div>
                )}
                {topic.cited.length > 0 && (
                  <section className="sources in-step-sources" aria-label={t.sources}>
                    <h3>{t.sources}</h3>
                    <ol>
                      {topic.cited.map((c, i) => (
                        <li key={i}>
                          <a href={c.url} target="_blank" rel="noopener noreferrer">[{i + 1}] {c.title} · {c.locator} ↗</a>
                          <span className="src-steps">（第 {c.steps.join("、")} 步）</span>
                          <p className="claim">{c.claim}</p>
                        </li>
                      ))}
                    </ol>
                  </section>
                )}
                <p className="in-step-report">
                  <a className="report" href={issueUrl(REPO_URL, topic.id, index + 1, step.title)} target="_blank" rel="noopener noreferrer">{t.reportError} ↗</a>
                </p>
              </>
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

/** Stage panel for the synthesized steps (概况 / 终端 / 设计): no canvas, the step's
 *  own material presented large; full text lives in the details column. */
function SpecialStage({ step, topic }: { step: ViewStep; topic: ViewTopic }) {
  if (step.special === "overview") {
    return (
      <div className="special-stage">
        <p className="ss-kicker">{t.overview}</p>
        <p className="ss-premise">{topic.premise}</p>
        <ul className="ss-keys">{topic.overview.map((o) => <li key={o.key}>{o.key}</li>)}</ul>
      </div>
    );
  }
  if (step.special === "terminal") {
    return (
      <div className="special-stage">
        <div className="term-window">
          {(topic.terminal ?? []).map((c, i) => <p key={i}><code><span className="term-prompt">$ </span>{c.cmd}</code></p>)}
        </div>
      </div>
    );
  }
  return (
    <div className="special-stage">
      <p className="ss-kicker">{t.design}</p>
      <ol className="ss-design">{(topic.design ?? []).map((d) => <li key={d.mechanism}>{d.mechanism}</li>)}</ol>
    </div>
  );
}
