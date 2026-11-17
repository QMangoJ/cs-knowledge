"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import { stepPath } from "@/lib/paths";
import type { Lang } from "@/i18n";

/** Parse the 0-based step index from a pathname like /os/syscall/3/
 *  (the English tree's /en prefix is stripped before matching). */
export function indexFromPath(pathname: string, subject: string, slug: string, total: number): number | null {
  const p = pathname.replace(/^\/en(?=\/)/, "");
  const m = p.match(new RegExp(`^/${subject}/${slug}/(?:(\\d+)/?)?$`));
  if (!m) return null;
  const n = m[1] ? Number(m[1]) - 1 : 0;
  return n >= 0 && n < total ? n : null;
}

export function usePlayer(subject: string, slug: string, total: number, initial: number, lang: Lang = "zh") {
  const [index, setIndex] = useState(initial);
  const idxRef = useRef(index);
  useEffect(() => { idxRef.current = index; }, [index]);

  const goTo = useCallback((i: number, push = true) => {
    const n = Math.max(0, Math.min(total - 1, i));
    if (n === idxRef.current) return;
    idxRef.current = n;
    setIndex(n);
    if (push) window.history.pushState({ step: n }, "", stepPath(subject, slug, n, lang));
  }, [subject, slug, total, lang]);

  const next = useCallback(() => goTo(idxRef.current + 1), [goTo]);
  const prev = useCallback(() => goTo(idxRef.current - 1), [goTo]);

  useEffect(() => {
    const onPop = () => {
      const i = indexFromPath(window.location.pathname, subject, slug, total);
      if (i !== null) { idxRef.current = i; setIndex(i); }
    };
    window.addEventListener("popstate", onPop);
    return () => window.removeEventListener("popstate", onPop);
  }, [subject, slug, total]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const el = e.target as HTMLElement | null;
      if (e.metaKey || e.ctrlKey || e.altKey || (el && /^(INPUT|TEXTAREA|SELECT)$/.test(el.tagName))) return;
      if (e.key === "ArrowRight") { e.preventDefault(); next(); }
      else if (e.key === "ArrowLeft") { e.preventDefault(); prev(); }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [next, prev]);

  return { index, goTo, next, prev };
}
