"use client";
import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { usePlayer } from "./usePlayer";
import { Canvas } from "@/components/renderers";
import type { ViewTopic } from "@/lib/view";
import { fmt, prefixPath, REPO_URL } from "@/i18n";
import { useLang } from "@/i18n/client";
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
 *  Form sample (Daniel's spec, 2026-11-17): the left keeps two columns — the
 *  shell's site nav plus this rail (subject tree / step list) — while the
 *  right merges the old stage and details into ONE content area. A step with
 *  a canvas visual puts text left and the visual right (sticky); a step
 *  without one reads in a single column, stage content first, then details
 *  (the overview step is then naturally premise → intro → position). The
 *  content area scrolls internally, the page itself never scrolls, and the
 *  prev/next controls sit at the bottom of the content area. The old
 *  collapse-details toggle goes away: merging the two areas is its
 *  replacement. One step per screen and manual navigation are unchanged. */
export function ReaderV2({ topic, initialStep, nextTopic, nav, readerNav }: {
  topic: ViewTopic; initialStep: number; nextTopic: NextTopic; nav: PlayerNav; readerNav: ReaderNavData;
}) {
  const { lang, s: t } = useLang();
  const total = topic.steps.length;
  const { index, goTo, next, prev } = usePlayer(topic.subject, topic.slug, total, initialStep, lang);
  const step = topic.steps[index]!;
  const hasVisual = !!step.canvas;
  const rows = topic.steps.slice(0, index + 1).flatMap((s, si) => s.log.map((r, ri) => ({ r, key: `${si}-${ri}`, fresh: si === index })));
  const caption = step.canvas && step.canvas.kind !== "swimlane" ? step.canvas.caption : undefined;
  const subjectName = t.subjects[topic.subject];

  useProgressVersion();
  const mounted = useMounted();
  const [fsLarge, setFsLarge] = useState(false);
  useEffect(() => {
    try { setFsLarge(localStorage.getItem(READER_FS_KEY) === "large"); } catch { /* private mode */ }
  }, []);
  const applyFs = (large: boolean) => {
    setFsLarge(large);
    try { localStorage.setItem(READER_FS_KEY, large ? "large" : "std"); } catch { /* private mode */ }
  };
  // Draggable widths (sample): the step-list rail and, on visual steps, the
  // text/visual split. Both persist; CSS vars carry them into ui-v2.css.
  const RAIL_W_KEY = "cs-v2-rail-w";
  const VISUAL_PCT_KEY = "cs-v2-visual-pct";
  const clampRail = (w: number) => Math.min(480, Math.max(220, Math.round(w)));
  const clampPct = (p: number) => Math.min(62, Math.max(28, Math.round(p * 10) / 10));
  const [railW, setRailW] = useState<number | null>(null);
  const [visualPct, setVisualPct] = useState<number | null>(null);
  const railRef = useRef<HTMLElement | null>(null);
  useEffect(() => {
    try {
      const w = Number(localStorage.getItem(RAIL_W_KEY));
      if (w) setRailW(clampRail(w));
      const p = Number(localStorage.getItem(VISUAL_PCT_KEY));
      if (p) setVisualPct(clampPct(p));
    } catch { /* private mode */ }
  }, []);
  useEffect(() => { try { if (railW !== null) localStorage.setItem(RAIL_W_KEY, String(railW)); } catch { /* ignore */ } }, [railW]);
  useEffect(() => { try { if (visualPct !== null) localStorage.setItem(VISUAL_PCT_KEY, String(visualPct)); } catch { /* ignore */ } }, [visualPct]);
  const startDrag = (e: React.PointerEvent, onMove: (dx: number) => void) => {
    e.preventDefault();
    const startX = e.clientX;
    const move = (ev: PointerEvent) => onMove(ev.clientX - startX);
    const up = () => { window.removeEventListener("pointermove", move); window.removeEventListener("pointerup", up); };
    window.addEventListener("pointermove", move);
    window.addEventListener("pointerup", up);
  };
  const onRailDrag = (e: React.PointerEvent) => {
    const startW = railRef.current?.getBoundingClientRect().width ?? railW ?? 300;
    startDrag(e, (dx) => setRailW(clampRail(startW + dx)));
  };
  const onVisualDrag = (e: React.PointerEvent) => {
    const main = (e.currentTarget as HTMLElement).closest(".p-content-main");
    const mainW = main?.getBoundingClientRect().width ?? 0;
    if (!mainW) return;
    const startPct = visualPct ?? 46;
    startDrag(e, (dx) => setVisualPct(clampPct(startPct - (dx / mainW) * 100)));
  };
  const railKeys = (e: React.KeyboardEvent) => {
    if (e.key !== "ArrowLeft" && e.key !== "ArrowRight") return;
    e.preventDefault();
    setRailW((w) => clampRail((w ?? railRef.current?.getBoundingClientRect().width ?? 300) + (e.key === "ArrowRight" ? 8 : -8)));
  };
  const visualKeys = (e: React.KeyboardEvent) => {
    if (e.key !== "ArrowLeft" && e.key !== "ArrowRight") return;
    e.preventDefault();
    setVisualPct((p) => clampPct((p ?? 46) + (e.key === "ArrowLeft" ? 2 : -2)));
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
  const elemOf = (target: EventTarget | null): Element | null =>
    target instanceof Element ? target : (target as Node | null)?.parentElement ?? null;
  useEffect(() => {
    if (!pop) return;
    const onDown = (e: PointerEvent) => {
      const el = elemOf(e.target);
      if (!el?.closest(".gloss-pop") && !el?.closest(".gloss-term")) setPop(null);
    };
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") setPop(null); };
    const onScroll = (e: Event) => { if (!elemOf(e.target)?.closest(".gloss-pop")) setPop(null); };
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
    const btn = elemOf(e.target)?.closest(".gloss-term") as HTMLElement | null;
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
                <a href={stepPath(topic.subject, topic.slug, i, lang)} aria-current={i === index ? "step" : undefined}
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
        <Link href={stepPath(tp.subject, tp.slug, 0, lang)} prefetch={false}>
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
            <a href={prefixPath(lang, "/")}>{subjectName}</a>
            <span aria-hidden="true"> › </span>
            <span>{nav.blockName}</span>
            <span aria-hidden="true"> › </span>
            <b>{plainText(topic.title)}</b>
            <span className="p-station">{fmt(t.stationText, { subject: subjectName, station: nav.station, total: nav.totalStations })}</span>
          </div>
          <div className="p-segments" role="progressbar" aria-valuemin={1} aria-valuemax={total} aria-valuenow={index + 1} aria-label={`${t.steps} ${index + 1} / ${total}`}>
            {topic.steps.map((s, i) => (
              <button key={s.id} type="button" tabIndex={-1} aria-hidden="true"
                className={i < index ? "seg done" : i === index ? "seg current" : "seg"}
                onClick={() => goTo(i)} />
            ))}
          </div>
          <div className="v2-only v2-progress-wrap">
            <span className="v2-progress-text">{fmt(t.progressTextShort, { index: index + 1, total })}</span>
            <div className="v2-progress" role="progressbar" aria-valuemin={1} aria-valuemax={total} aria-valuenow={index + 1} aria-label={`${t.steps} ${index + 1} / ${total}`}>
              <div style={{ width: `${((index + 1) / total) * 100}%` }} />
            </div>
          </div>
          <div className="p-topright">
            <span className="p-stepcount">{fmt(t.stepCountText, { index: index + 1, total })}</span>
            <span className="v2-only v2-fs-group" role="group" aria-label={t.fontSizeLabel}>
              <span className="v2-fs-label">{t.fontSizeLabel}</span>
              <button type="button" className="v2-ctl" aria-pressed={!fsLarge} onClick={() => applyFs(false)}>{t.fontStd}</button>
              <button type="button" className="v2-ctl" aria-pressed={fsLarge} onClick={() => applyFs(true)}>{t.fontLarge}</button>
            </span>
            <MarkDone topicId={topic.id} />
          </div>
        </header>

        <div className={rows.length > 0 || caption ? "p-grid" : "p-grid no-log"}
          style={{ "--v2-rail-w": railW ? `${railW}px` : undefined, "--v2-visual-pct": visualPct ? `${visualPct}%` : undefined } as React.CSSProperties}>
          <aside className="p-rail" ref={railRef}>
            <div className="v2-rail-handle" role="separator" aria-orientation="vertical" aria-label={t.railDragLabel}
              tabIndex={0} onPointerDown={onRailDrag} onKeyDown={railKeys} />
            <nav className="v2-tree" aria-label={t.subjectTopicsLabel}>
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
                    <a href={stepPath(topic.subject, topic.slug, i, lang)} aria-current={i === index ? "step" : undefined}
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
              <a key={s.id} href={stepPath(topic.subject, topic.slug, i, lang)} className={i === index ? "chip current" : i < index ? "chip done" : "chip"}
                aria-current={i === index ? "step" : undefined}
                onClick={(e) => { e.preventDefault(); goTo(i); }}>{i < index ? "✓ " : `${i + 1} · `}{plainText(s.title)}</a>
            ))}
          </nav>

          <section className={hasVisual ? "p-content has-visual" : "p-content"} aria-label={t.contentLabel}>
            <div className="p-content-scroll">
              <div className="p-content-main">
                <div className="p-visual">
                  {hasVisual && (
                    <div className="v2-visual-handle" role="separator" aria-orientation="vertical" aria-label={t.visualDragLabel}
                      tabIndex={0} onPointerDown={onVisualDrag} onKeyDown={visualKeys} />
                  )}
                  <div className="canvas-wrap stage-card">
              {step.log.length > 0 && (
                <p className="now-bar" aria-live="polite"><b>{t.nowHappening}</b>{plainText(step.log.map((r) => topic.logColumns.map((c) => r[c.key]).filter(Boolean).join(" · ")).join(t.sentSep))}</p>
              )}
              <div className="stage-body">
                {step.special ? <SpecialStage step={step} topic={topic} /> : <Canvas state={step.canvas!} lanes={topic.lanes} />}
              </div>
              {step.canvas?.registers && step.canvas.registers.length > 0 && (
                <ul className="regs">{step.canvas.registers.map((r) => <li key={r.name} className={r.changed ? "changed" : ""}><code>{plainText(r.name)}</code> <Tx text={r.value} terms={topic.terms} /></li>)}</ul>
              )}
            </div>
                </div>
                <article className="step p-details" aria-live="polite">
            {index === 0 && (
              <header className="topic-intro">
                <p className="eyebrow">{subjectName} · {nav.blockName} · {fmt(t.stationShort, { station: nav.station, total: nav.totalStations })}</p>
                <h1><Tx text={topic.title} terms={topic.terms} /></h1>
                <p className="summary"><Tx text={topic.summary} terms={topic.terms} /></p>
                {(topic.level || topic.minutes || (topic.prereq && topic.prereq.length > 0)) && (
                  <p className="topic-meta">
                    {topic.level && <span className="badge">{t.level} · {t.levels[topic.level as keyof typeof t.levels] ?? topic.level}</span>}
                    {topic.minutes && <span className="badge">{fmt(t.minutesBadge, { n: topic.minutes })}</span>}
                    {topic.prereq && topic.prereq.length > 0 && <span className="badge">{t.prereq}{t.colon}{topic.prereq.join(t.listSep)}</span>}
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
            {step.mistake && <p className="mistake"><b>{t.mistake}{t.colon}</b><Tx text={step.mistake} terms={topic.terms} /></p>}
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
                        <p><b>{t.dProblem}{t.colon}</b><Tx text={d.problem} terms={topic.terms} /></p>
                        <p><b>{t.dChoice}{t.colon}</b><Tx text={d.choice} terms={topic.terms} /></p>
                        <p><b>{t.dTradeoff}{t.colon}</b><Tx text={d.tradeoff} terms={topic.terms} /></p>
                        <p><b>{t.dRoot}{t.colon}</b><Tx text={d.root} terms={topic.terms} /></p>
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
                          <span className="src-steps">{fmt(t.srcStepsText, { steps: c.steps.join(t.listSep) })}</span>
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
              </div>
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
            <div className="stepnav p-content-nav" role="toolbar" aria-label={t.stepNavLabel}>
              <button type="button" onClick={prev} disabled={index === 0}>← {t.prev}</button>
              <input className="scrub" type="range" min={0} max={total - 1} value={index} aria-label={t.scrub}
                onChange={(e) => goTo(Number(e.target.value))} />
              <span className="count">{index + 1} / {total}</span>
              {index < total - 1
                ? <button type="button" onClick={next}>{t.next} →</button>
                : nextTopic ? <a className="btn" href={nextTopic.href}>{t.nextTopic}{t.colon}{nextTopic.title} →</a> : <button type="button" disabled>{t.next} →</button>}
            </div>
          </section>
        </div>
      </div>
      <GlossPopover pop={pop} terms={topic.terms} onClose={() => setPop(null)} />
    </div>
  );
}
