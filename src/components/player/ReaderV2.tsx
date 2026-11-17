"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { usePlayer } from "./usePlayer";
import { Canvas } from "@/components/renderers";
import type { ViewTopic } from "@/lib/view";
import { t, REPO_URL } from "@/i18n";
import { issueUrl, stepPath } from "@/lib/paths";
import { plainText, plainCode } from "@/lib/terms";
import { doneKey, isDone, useMounted, useProgressVersion } from "@/lib/progress";
import { READER_FS_KEY } from "@/lib/ui-v2";
import { MarkDone } from "./Quiz";
import { SpecialStage, type PlayerNav } from "./Player";
import { Tx, GlossPopover, type PopState } from "./Term";

export type ReaderNavTopic = { id: string; subject: string; slug: string; title: string };
export type ReaderNavData = {
  blocks: { name: string; topics: ReaderNavTopic[] }[];
  ungrouped: ReaderNavTopic[];
};
type NextTopic = { href: string; title: string } | null;

/** UI v2 sample reader (gated to one topic; see lib/ui-v2.ts).
 *  Same DOM skeleton and class names as Player, so below the 1200px container
 *  breakpoint every existing rule applies unchanged and the layout is the
 *  current one. At ≥1200px (ui-v2.css, .uiv2 scope) the rail becomes a subject
 *  nav tree, the details column gains a collapse toggle, the top bar shows a
 *  single progress readout, and a two-level font-size setting applies to the
 *  details column. The stage itself (canvas, one step per screen, manual
 *  navigation, scroll inside the stage) is the Player's, untouched. */
export function ReaderV2({ topic, initialStep, nextTopic, nav, readerNav }: {
  topic: ViewTopic; initialStep: number; nextTopic: NextTopic; nav: PlayerNav; readerNav: ReaderNavData;
}) {
  const total = topic.steps.length;
  const { index, goTo, next, prev } = usePlayer(topic.subject, topic.slug, total, initialStep);
  const step = topic.steps[index]!;
  const rows = topic.steps.slice(0, index + 1).flatMap((s, si) => s.log.map((r, ri) => ({ r, key: `${si}-${ri}`, fresh: si === index })));
  const caption = step.canvas && step.canvas.kind !== "swimlane" ? step.canvas.caption : undefined;
  const subjectName = t.subjects[topic.subject];

  useProgressVersion();
  const mounted = useMounted();
  const [detailsOpen, setDetailsOpen] = useState(true);
  const [fsLarge, setFsLarge] = useState(false);
  useEffect(() => {
    try { setFsLarge(localStorage.getItem(READER_FS_KEY) === "large"); } catch { /* private mode */ }
  }, []);
  const applyFs = (large: boolean) => {
    setFsLarge(large);
    try { localStorage.setItem(READER_FS_KEY, large ? "large" : "std"); } catch { /* private mode */ }
  };
  const [closedBlocks, setClosedBlocks] = useState<ReadonlySet<string>>(new Set());
  const toggleBlock = (name: string) => setClosedBlocks((prevSet) => {
    const s = new Set(prevSet);
    if (s.has(name)) s.delete(name); else s.add(name);
    return s;
  });

  // Glossary popover: same delegation pattern as Player.
  const [pop, setPop] = useState<PopState>(null);
  useEffect(() => { setPop(null); }, [index]);
  useEffect(() => {
    if (!pop) return;
    const onDown = (e: PointerEvent) => {
      const el = e.target as HTMLElement;
      if (!el.closest(".gloss-pop") && !el.closest(".gloss-term")) setPop(null);
    };
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") setPop(null); };
    const onScroll = (e: Event) => { if (!(e.target as HTMLElement)?.closest?.(".gloss-pop")) setPop(null); };
    const onResize = () => setPop(null);
    document.addEventListener("pointerdown", onDown);
    document.addEventListener("keydown", onKey);
    document.addEventListener("scroll", onScroll, true);
    window.addEventListener("resize", onResize);
    return () => {
      document.removeEventListener("pointerdown", onDown);
      document.removeEventListener("keydown", onKey);
      document.removeEventListener("scroll", onScroll, true);
      window.removeEventListener("resize", onResize);
    };
  }, [pop]);
  const onRootClick = (e: React.MouseEvent) => {
    const btn = (e.target as HTMLElement).closest?.(".gloss-term") as HTMLElement | null;
    if (!btn) return;
    const key = btn.dataset.term;
    if (!key || !topic.terms[key]) return;
    if (pop?.key === key) { setPop(null); return; }
    const r = btn.getBoundingClientRect();
    setPop({ key, rect: { top: r.top, bottom: r.bottom, left: r.left, width: r.width } });
  };

  const topicRow = (tp: ReaderNavTopic) => {
    const done = mounted && isDone(doneKey(tp.id));
    if (tp.id === topic.id) {
      return (
        <li key={tp.id} className="v2-tree-topic current">
          <span className="v2-tree-topicname">{plainText(tp.title)}{done && <span className="v2-done" aria-label={t.done}>✓</span>}</span>
          <ol className="v2-tree-steps">
            {topic.steps.map((s, i) => (
              <li key={s.id} className={i === index ? "current" : i < index ? "done" : ""}>
                <a href={stepPath(topic.subject, topic.slug, i)} aria-current={i === index ? "step" : undefined}
                  onClick={(e) => { e.preventDefault(); goTo(i); }}>
                  <span className="n">{i < index ? "✓" : i + 1}</span>
                  <span>{plainText(s.title)}</span>
                </a>
              </li>
            ))}
          </ol>
        </li>
      );
    }
    return (
      <li key={tp.id} className="v2-tree-topic">
        <Link href={stepPath(tp.subject, tp.slug, 0)} prefetch={false}>
          {plainText(tp.title)}{done && <span className="v2-done" aria-label={t.done}>✓</span>}
        </Link>
      </li>
    );
  };

  return (
    <div className={fsLarge ? "player2 uiv2 fs-large" : "player2 uiv2"} onClick={onRootClick}>
      <div className="app-screen">
        <header className="p-topbar">
          <div className="p-crumb">
            <a href="/">{subjectName}</a>
            <span aria-hidden="true"> › </span>
            <span>{nav.blockName}</span>
            <span aria-hidden="true"> › </span>
            <b>{plainText(topic.title)}</b>
            <span className="p-station">{subjectName}第 {nav.station} 站 / 共 {nav.totalStations} 站</span>
          </div>
          <div className="p-segments" role="progressbar" aria-valuemin={1} aria-valuemax={total} aria-valuenow={index + 1} aria-label={`${t.steps} ${index + 1} / ${total}`}>
            {topic.steps.map((s, i) => (
              <button key={s.id} type="button" tabIndex={-1} aria-hidden="true"
                className={i < index ? "seg done" : i === index ? "seg current" : "seg"}
                onClick={() => goTo(i)} />
            ))}
          </div>
          <div className="v2-only v2-progress-wrap">
            <span className="v2-progress-text">第 {index + 1} / {total} 步</span>
            <div className="v2-progress" role="progressbar" aria-valuemin={1} aria-valuemax={total} aria-valuenow={index + 1} aria-label={`${t.steps} ${index + 1} / ${total}`}>
              <div style={{ width: `${((index + 1) / total) * 100}%` }} />
            </div>
          </div>
          <div className="p-topright">
            <span className="p-stepcount">第 {index + 1} 步 / 共 {total} 步</span>
            <span className="v2-only v2-fs-group" role="group" aria-label="字号">
              <span className="v2-fs-label">字号</span>
              <button type="button" className="v2-ctl" aria-pressed={!fsLarge} onClick={() => applyFs(false)}>标准</button>
              <button type="button" className="v2-ctl" aria-pressed={fsLarge} onClick={() => applyFs(true)}>大</button>
            </span>
            <button type="button" className="v2-only v2-ctl" aria-expanded={detailsOpen} onClick={() => setDetailsOpen((v) => !v)}>
              {detailsOpen ? "收起详情" : "展开详情"}
            </button>
            <MarkDone topicId={topic.id} />
          </div>
        </header>

        <div className={(rows.length > 0 || caption ? "p-grid" : "p-grid no-log") + (detailsOpen ? "" : " details-collapsed")}>
          <aside className="p-rail">
            <nav className="v2-tree" aria-label="本学科课程">
              {readerNav.blocks.map((b) => {
                const closed = closedBlocks.has(b.name);
                return (
                  <div key={b.name} className="v2-tree-block">
                    <button type="button" className="v2-tree-blockname" aria-expanded={!closed} onClick={() => toggleBlock(b.name)}>
                      <span>{b.name}</span>
                      <span aria-hidden="true">{closed ? "▸" : "▾"}</span>
                    </button>
                    {!closed && <ol className="v2-tree-topics">{b.topics.map(topicRow)}</ol>}
                  </div>
                );
              })}
              {readerNav.ungrouped.length > 0 && (
                <div className="v2-tree-block">
                  <ol className="v2-tree-topics">{readerNav.ungrouped.map(topicRow)}</ol>
                </div>
              )}
            </nav>

            <nav className="steplist" aria-label={t.steps}>
              <ol>
                {topic.steps.map((s, i) => (
                  <li key={s.id} className={i === index ? "current" : i < index ? "done" : ""}>
                    <a href={stepPath(topic.subject, topic.slug, i)} aria-current={i === index ? "step" : undefined}
                      onClick={(e) => { e.preventDefault(); goTo(i); }}>
                      <span className="n">{i < index ? "✓" : i + 1}</span>
                      <span className="sl-text"><span className="sl-title">{plainText(s.title)}</span><span className="sl-sub">{plainText(s.tldr)}</span></span>
                    </a>
                  </li>
                ))}
              </ol>
            </nav>

            {topic.objectives && topic.objectives.length > 0 && (
              <details className="objectives more">
                <summary>{t.objectives}</summary>
                <ul>{topic.objectives.map((o) => <li key={o}><Tx text={o} terms={topic.terms} /></li>)}</ul>
              </details>
            )}
            {topic.aiLink && (
              <details className="ai-link more">
                <summary>{t.aiLink}</summary>
                <p><Tx text={topic.aiLink} terms={topic.terms} /></p>
              </details>
            )}
          </aside>

          <nav className="step-chips" aria-label={t.steps}>
            {topic.steps.map((s, i) => (
              <a key={s.id} href={stepPath(topic.subject, topic.slug, i)} className={i === index ? "chip current" : i < index ? "chip done" : "chip"}
                aria-current={i === index ? "step" : undefined}
                onClick={(e) => { e.preventDefault(); goTo(i); }}>{i < index ? "✓ " : `${i + 1} · `}{plainText(s.title)}</a>
            ))}
          </nav>

          <section className="p-stage" aria-label="画布">
            <div className="canvas-wrap stage-card">
              {step.log.length > 0 && (
                <p className="now-bar" aria-live="polite"><b>{t.nowHappening}</b>{plainText(step.log.map((r) => topic.logColumns.map((c) => r[c.key]).filter(Boolean).join(" · ")).join("；"))}</p>
              )}
              <div className="stage-body">
                {step.special ? <SpecialStage step={step} topic={topic} /> : <Canvas state={step.canvas!} lanes={topic.lanes} />}
              </div>
              {step.canvas?.registers && step.canvas.registers.length > 0 && (
                <ul className="regs">{step.canvas.registers.map((r) => <li key={r.name} className={r.changed ? "changed" : ""}><code>{plainText(r.name)}</code> <Tx text={r.value} terms={topic.terms} /></li>)}</ul>
              )}
            </div>
            <div className="stepnav stage-controls" role="toolbar" aria-label="步骤导航">
              <button type="button" onClick={prev} disabled={index === 0}>← {t.prev}</button>
              <input className="scrub" type="range" min={0} max={total - 1} value={index} aria-label={t.scrub}
                onChange={(e) => goTo(Number(e.target.value))} />
              <span className="count">{index + 1} / {total}</span>
              {index < total - 1
                ? <button type="button" onClick={next}>{t.next} →</button>
                : nextTopic ? <a className="btn" href={nextTopic.href}>{t.nextTopic}：{nextTopic.title} →</a> : <button type="button" disabled>{t.next} →</button>}
            </div>
          </section>

          <article className="step p-details" aria-live="polite">
            {index === 0 && (
              <header className="topic-intro">
                <p className="eyebrow">{subjectName} · {nav.blockName} · 第 {nav.station} / {nav.totalStations} 站</p>
                <h1><Tx text={topic.title} terms={topic.terms} /></h1>
                <p className="summary"><Tx text={topic.summary} terms={topic.terms} /></p>
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
                    <p><Tx text={topic.position} terms={topic.terms} /></p>
                  </div>
                )}
              </header>
            )}
            <p className="eyebrow">{t.steps} {index + 1} / {total}</p>
            <h2><Tx text={step.title} terms={topic.terms} /></h2>
            {/* The overview step's tldr IS the premise, which the stage cover shows
                large on the same screen — printing it here too repeats it. */}
            {step.special !== "overview" && <p className="tldr"><Tx text={step.tldr} terms={topic.terms} /></p>}
            <div className="body" dangerouslySetInnerHTML={{ __html: step.bodyHtml }} />
            {step.code && (
              <figure className="codeblock">
                <figcaption>{step.code.lang}{step.code.note ? ` · ${plainText(step.code.note)}` : ""}</figcaption>
                <pre><code>{step.code.code.split("\n").map((ln, li) => (
                  <span key={li} className={step.code!.highlight === li + 1 ? "cl hl" : "cl"}>{plainCode(ln, topic.terms) || " "}</span>
                ))}</code></pre>
              </figure>
            )}
            {step.points && step.points.length > 0 && (
              <div className="points"><h3>{t.points}</h3><ul>{step.points.map((pt) => <li key={pt}><Tx text={pt} terms={topic.terms} /></li>)}</ul></div>
            )}
            {step.mistake && <p className="mistake"><b>{t.mistake}：</b><Tx text={step.mistake} terms={topic.terms} /></p>}
            {step.keyFields && step.keyFields.length > 0 && (
              <details className="more"><summary>{t.keyFields}</summary>
                <dl className="kv">{step.keyFields.map((k) => <div key={k.key}><dt>{k.key}</dt><dd><Tx text={k.value} terms={topic.terms} /></dd></div>)}</dl>
              </details>
            )}
            {step.special === "overview" && topic.overview.length > 0 && (
              <dl className="kv overview-kv">{topic.overview.map((o) => <div key={o.key}><dt><Tx text={o.key} terms={topic.terms} /></dt><dd><Tx text={o.value} terms={topic.terms} /></dd></div>)}</dl>
            )}
            {step.special === "terminal" && topic.terminal && topic.terminal.length > 0 && (
              <div className="term-list">
                {topic.terminal.map((c, i) => (
                  <div key={i} className="term-item"><code>{plainCode(c.cmd, topic.terms)}</code>{c.note && <p><Tx text={c.note} terms={topic.terms} /></p>}</div>
                ))}
              </div>
            )}
            {step.special === "design" && (
              <>
                {topic.design && topic.design.length > 0 && (
                  <div className="design in-step-design">
                    {topic.design.map((d) => (
                      <div key={d.mechanism} className="design-item">
                        <h4><Tx text={d.mechanism} terms={topic.terms} /></h4>
                        <p><b>{t.dProblem}：</b><Tx text={d.problem} terms={topic.terms} /></p>
                        <p><b>{t.dChoice}：</b><Tx text={d.choice} terms={topic.terms} /></p>
                        <p><b>{t.dTradeoff}：</b><Tx text={d.tradeoff} terms={topic.terms} /></p>
                        <p><b>{t.dRoot}：</b><Tx text={d.root} terms={topic.terms} /></p>
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
                          <a href={c.url} target="_blank" rel="noopener noreferrer">[{i + 1}] {plainText(c.title)} · {plainText(c.locator)} ↗</a>
                          <span className="src-steps">（第 {c.steps.join("、")} 步）</span>
                          <p className="claim"><Tx text={c.claim} terms={topic.terms} /></p>
                        </li>
                      ))}
                    </ol>
                  </section>
                )}
                <p className="in-step-report">
                  <a className="report" href={issueUrl(REPO_URL, topic.id, index + 1, plainText(step.title))} target="_blank" rel="noopener noreferrer">{t.reportError} ↗</a>
                </p>
              </>
            )}
          </article>

          {(rows.length > 0 || caption) && (
            <section className="log p-logbar" aria-label={t.log}>
              <div className="logbar-head">
                <h3>{t.log}</h3>
                {topic.legend && <ul className="legend">{topic.legend.map((l) => <li key={l.key}><b>{l.key}</b><Tx text={l.label} terms={topic.terms} /></li>)}</ul>}
              </div>
              {rows.length > 0 ? (
                <div className="logbar-scroll">
                  <table>
                    <thead><tr>{topic.logColumns.map((c) => <th key={c.key}>{c.label}</th>)}</tr></thead>
                    <tbody>{rows.map(({ r, key, fresh }) => <tr key={key} className={fresh ? "fresh" : ""}>{topic.logColumns.map((c) => <td key={c.key}><Tx text={r[c.key] ?? ""} terms={topic.terms} /></td>)}</tr>)}</tbody>
                  </table>
                </div>
              ) : (
                <p className="logbar-caption"><Tx text={caption ?? ""} terms={topic.terms} /></p>
              )}
            </section>
          )}
        </div>
      </div>
      <GlossPopover pop={pop} terms={topic.terms} onClose={() => setPop(null)} />
    </div>
  );
}
