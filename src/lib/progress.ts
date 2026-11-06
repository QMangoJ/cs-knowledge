"use client";
import { useEffect, useState } from "react";

// localStorage progress: a topic is "done" when the reader marks it manually (key kept for compatibility with earlier quiz-based completions).
export const doneKey = (topicId: string) => `cs-done:${topicId}`;
export const codingKey = (slug: string) => `cs-coding-done:${slug}`;

export function isDone(key: string): boolean {
  try { return localStorage.getItem(key) === "1"; } catch { return false; }
}
export function setDone(key: string) {
  try { localStorage.setItem(key, "1"); window.dispatchEvent(new Event("cs-progress")); } catch { /* private mode */ }
}
/** Re-render when progress changes (same-tab event + cross-tab storage event). */
export function useProgressVersion(): number {
  const [v, setV] = useState(0);
  useEffect(() => {
    const f = () => setV((n: number) => n + 1);
    window.addEventListener("cs-progress", f);
    window.addEventListener("storage", f);
    return () => { window.removeEventListener("cs-progress", f); window.removeEventListener("storage", f); };
  }, []);
  return v;
}

/** False during SSR + first client render, true after mount — use to gate localStorage-dependent UI and avoid hydration mismatches. */
export function useMounted(): boolean {
  const [m, setM] = useState(false);
  useEffect(() => { setM(true); }, []);
  return m;
}
