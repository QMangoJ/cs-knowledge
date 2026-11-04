"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import { stepPath } from "@/lib/paths";

export const AUTOPLAY_MS = 4000;

/** Parse the 0-based step index from a pathname like /os/syscall/3/. */
export function indexFromPath(pathname: string, subject: string, slug: string, total: number): number | null {
  const m = pathname.match(new RegExp(`^/${subject}/${slug}/(?:(\\d+)/?)?$`));
  if (!m) return null;
  const n = m[1] ? Number(m[1]) - 1 : 0;
  return n >= 0 && n < total ? n : null;
}

export function usePlayer(subject: string, slug: string, total: number, initial: number) {
  const [index, setIndex] = useState(initial);
  const [playing, setPlaying] = useState(false);
  const idxRef = useRef(index);
  useEffect(() => { idxRef.current = index; }, [index]);

  const goTo = useCallback((i: number, push = true) => {
    const n = Math.max(0, Math.min(total - 1, i));
    if (n === idxRef.current) return;
    idxRef.current = n;
    setIndex(n);
    if (push) window.history.pushState({ step: n }, "", stepPath(subject, slug, n));
  }, [subject, slug, total]);

  const next = useCallback(() => goTo(idxRef.current + 1), [goTo]);
  const prev = useCallback(() => goTo(idxRef.current - 1), [goTo]);
  const toggle = useCallback(() => setPlaying((p) => !p), []);

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
      else if (e.key === " " && !(el && el.tagName === "BUTTON")) { e.preventDefault(); toggle(); }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [next, prev, toggle]);

  const atEnd = index >= total - 1;
  const active = playing && !atEnd;
  useEffect(() => {
    if (!active) return;
    const id = window.setTimeout(() => { if (idxRef.current >= total - 2) setPlaying(false); next(); }, AUTOPLAY_MS);
    return () => window.clearTimeout(id);
  }, [active, index, total, next]);

  return { index, playing: active, goTo, next, prev, toggle };
}
