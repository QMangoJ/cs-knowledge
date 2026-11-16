"use client";
import { useLayoutEffect, useRef, useState } from "react";
import { parseSegments } from "@/lib/terms";
import type { TermInfo } from "@/lib/view";

/** Text with glossary markers rendered as clickable term buttons.
 *  Clicks are NOT handled here — the Player root delegates all `.gloss-term`
 *  clicks (these buttons and the ones baked into body HTML alike) so the
 *  popover state lives in exactly one place. A marker whose key is missing
 *  from the topic's term map degrades to plain display text. */
export function Tx({ text, terms }: { text: string; terms: Record<string, TermInfo> }) {
  const segs = parseSegments(text);
  if (segs.length === 1 && segs[0]!.kind === "text") return <>{text}</>;
  return (
    <>
      {segs.map((s, i) =>
        s.kind === "text" ? (
          <span key={i}>{s.text}</span>
        ) : terms[s.key] ? (
          <button key={i} type="button" className="gloss-term" data-term={s.key}>
            {s.display}
          </button>
        ) : (
          <span key={i}>{s.display}</span>
        ),
      )}
    </>
  );
}

export type PopState = { key: string; rect: { top: number; bottom: number; left: number; width: number } } | null;

/** Fixed-position term popover: anchored to the clicked term, centred on it,
 *  clamped inside the viewport with an 8px margin, flipping above the term
 *  when there is not enough room below. Fixed positioning keeps it out of
 *  the stage/details scroll containers, so it can never be clipped by them. */
export function GlossPopover({ pop, terms, onClose }: { pop: PopState; terms: Record<string, TermInfo>; onClose: () => void }) {
  const ref = useRef<HTMLDivElement>(null);
  const [pos, setPos] = useState<{ left: number; top: number } | null>(null);
  useLayoutEffect(() => {
    if (!pop || !ref.current) return;
    const el = ref.current;
    const w = el.offsetWidth, h = el.offsetHeight;
    const vw = window.innerWidth, vh = window.innerHeight;
    let left = pop.rect.left + pop.rect.width / 2 - w / 2;
    left = Math.max(8, Math.min(left, vw - w - 8));
    let top = pop.rect.bottom + 8;
    if (top + h > vh - 8) top = pop.rect.top - h - 8;
    if (top < 8) top = Math.max(8, vh - h - 8);
    setPos({ left, top });
  }, [pop]);
  if (!pop) return null;
  const info = terms[pop.key];
  if (!info) return null;
  return (
    <div
      ref={ref}
      className="gloss-pop"
      role="dialog"
      aria-label={`术语解释：${pop.key}`}
      style={pos ? { left: pos.left, top: pos.top } : { left: 8, top: 8, visibility: "hidden" }}
    >
      <div className="gloss-pop-head">
        <b>{pop.key}</b>
        <button type="button" className="gloss-pop-x" aria-label="关闭术语解释" onClick={onClose}>
          ×
        </button>
      </div>
      <p className="gloss-pop-full">{info.full}</p>
      <p className="gloss-pop-explain">{info.explain}</p>
    </div>
  );
}
