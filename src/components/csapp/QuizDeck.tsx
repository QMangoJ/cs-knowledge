"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useLang } from "@/i18n/client";
import { prefixPath } from "@/i18n";
import type { QuizItem } from "@/lib/csapp/types";
import { loadQuiz, saveQuiz, type Grade } from "@/lib/csapp/progress";
import { Md } from "@/lib/csapp/md";

function reduced() {
  return typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

export function QuizDeck({ ch, title, items }: { ch: number; title: string; items: QuizItem[] }) {
  const router = useRouter();
  const { lang } = useLang();
  const base = prefixPath(lang, "/csapp");
  const [grades, setGrades] = useState<(Grade | null)[]>(() => Array(8).fill(null));
  const [idx, setIdx] = useState(0);
  const [revealed, setRevealed] = useState(false);
  const [leaving, setLeaving] = useState(false);
  const [just, setJust] = useState<Grade | null>(null);
  const [burst, setBurst] = useState<{ x: number; y: number } | null>(null);
  const cardRef = useRef<HTMLDivElement>(null);
  const ready = useRef(false);

  useEffect(() => {
    const g = loadQuiz(ch);
    const review = g.map((x, i) => ({ x, i })).filter((o) => o.x === "fuzzy" || o.x === "miss").map((o) => o.i);
    const rest = g.map((x, i) => ({ x, i })).filter((o) => o.x !== "fuzzy" && o.x !== "miss").map((o) => o.i);
    setGrades(g);
    setIdx((review[0] ?? rest[0] ?? 0));
    ready.current = true;
  }, [ch]);

  const persist = useCallback((next: (Grade | null)[]) => {
    setGrades(next);
    saveQuiz(ch, next);
  }, [ch]);

  const go = useCallback((k: number) => {
    const next = Math.max(0, Math.min(items.length - 1, k));
    if (next === idx && !leaving) return;
    setLeaving(true);
    setJust(null);
    setBurst(null);
    const delay = reduced() ? 200 : 180;
    window.setTimeout(() => {
      setIdx(next);
      setRevealed(false);
      setLeaving(false);
    }, delay);
  }, [idx, items.length, leaving]);

  const rate = useCallback((g: Grade, btn?: HTMLButtonElement | null) => {
    if (!revealed) return;
    const next = [...grades];
    next[idx] = g;
    persist(next);
    setJust(g);
    if (g === "know" && btn && cardRef.current) {
      const br = btn.getBoundingClientRect();
      const cr = cardRef.current.getBoundingClientRect();
      setBurst({ x: br.left + br.width / 2 - cr.left, y: br.top + br.height / 2 - cr.top });
    }
    const delay = reduced() ? 200 : g === "know" ? 720 : 420;
    if (idx < items.length - 1) {
      window.setTimeout(() => go(idx + 1), delay);
    }
  }, [revealed, grades, idx, persist, items.length, go]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement)?.tagName;
      if (tag === "INPUT" || tag === "TEXTAREA") return;
      if (e.key === " " || e.code === "Space") {
        e.preventDefault();
        setRevealed((v) => !v);
      } else if (e.key === "ArrowRight") { e.preventDefault(); go(idx + 1); }
      else if (e.key === "ArrowLeft") { e.preventDefault(); go(idx - 1); }
      else if (e.key === "Escape") { e.preventDefault(); router.push(`${base}/${ch}/`); }
      else if (e.key === "1") rate("know");
      else if (e.key === "2") rate("fuzzy");
      else if (e.key === "3") rate("miss");
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [go, idx, rate, router, ch]);

  const item = items[idx] ?? items[0]!;
  const know = grades.filter((x) => x === "know").length;
  const fuzzy = grades.filter((x) => x === "fuzzy").length;
  const miss = grades.filter((x) => x === "miss").length;
  const done = grades.filter(Boolean).length;

  const confetti = useMemo(() => Array.from({ length: 12 }, (_, i) => i * 30), []);

  return (
    <div className="qz-layout">
      <div className="qz-main">
        <div className="qz-head">
          <div className="qz-kicker">第 {ch} 章 · 自测</div>
          <h1>{title}</h1>
          <p className="muted">先想一想，再翻开答案，最后自评</p>
        </div>

        <div className="stack">
          <div className="ghost g2" aria-hidden="true" />
          <div className="ghost g1" aria-hidden="true" />
          <div
            ref={cardRef}
            className={`qcard spot${revealed ? " is-revealed" : ""}${leaving ? " is-leaving" : ""}${just ? ` just-${just}` : ""}`}
            style={burst ? { ["--bx" as string]: `${burst.x}px`, ["--by" as string]: `${burst.y}px` } : undefined}
          >
            {just === "know" && (
              <div className="burst" aria-hidden="true">
                {confetti.map((a) => (
                  <i key={a} style={{ ["--a" as string]: `${a}deg`, ["--c" as string]: `var(--conf-${(a / 30) % 3 + 1})` }} />
                ))}
              </div>
            )}
            <div className="qc-top">
              <div className="qc-no">题目 <b>{idx + 1}</b> / {items.length}</div>
              <span className="qc-tag">复习</span>
              <span className="qc-state">{revealed ? "已翻开" : "未翻开"}</span>
            </div>
            <div className="qc-q"><Md md={item.q} /></div>
            <div className="think">
              <span className="think-label">提示</span>
              <span className="think-body">{item.hint}</span>
            </div>
            {!revealed && (
              <button type="button" className="reveal btn" onClick={() => setRevealed(true)}>
                显示答案 <kbd>Space</kbd>
              </button>
            )}
            <div className="answer" aria-live="polite">
              <div className="ans-label">参考答案</div>
              <Md md={item.a} className="ans-body" />
            </div>
            <div className="grade" role="group" aria-label="自评">
              <button type="button" data-g="know" className={grades[idx] === "know" ? "is-on" : ""} onClick={(e) => rate("know", e.currentTarget)}>
                <kbd>1</kbd> 会了
              </button>
              <button type="button" data-g="fuzzy" className={grades[idx] === "fuzzy" ? "is-on" : ""} onClick={(e) => rate("fuzzy", e.currentTarget)}>
                <kbd>2</kbd> 模糊
              </button>
              <button type="button" data-g="miss" className={grades[idx] === "miss" ? "is-on" : ""} onClick={(e) => rate("miss", e.currentTarget)}>
                <kbd>3</kbd> 不会
              </button>
            </div>
          </div>
        </div>

        <div className="kbar">
          <span><kbd>←</kbd><kbd>→</kbd> 切题</span>
          <span><kbd>Space</kbd> 翻答案</span>
          <span><kbd>Esc</kbd> 回本章</span>
        </div>
      </div>

      <aside className="qz-side card">
        <div className="qz-count"><b>{done}</b> / 8 已评</div>
        <div className="dots" role="list">
          {items.map((_, i) => (
            <button
              key={i}
              type="button"
              role="listitem"
              className={`dot ${grades[i] ?? ""} ${i === idx ? "is-cur" : ""}`}
              onClick={() => go(i)}
              aria-label={`第 ${i + 1} 题`}
            >
              {i + 1}
            </button>
          ))}
        </div>
        <ul className="qz-stat">
          <li><span>会了</span><b>{know}</b></li>
          <li><span>模糊</span><b>{fuzzy}</b></li>
          <li><span>不会</span><b>{miss}</b></li>
        </ul>
        <div className="qs-bar" aria-hidden="true">
          <i className="know" style={{ width: `${(know / 8) * 100}%` }} />
          <i className="fuzzy" style={{ width: `${(fuzzy / 8) * 100}%` }} />
          <i className="miss" style={{ width: `${(miss / 8) * 100}%` }} />
        </div>
        <a className="btn ghost" href={`${base}/${ch}/`}>回本章</a>
      </aside>
    </div>
  );
}
