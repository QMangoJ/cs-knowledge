"use client";

import { useEffect } from "react";

/** Soft mouse glow — dark theme + fine pointer + motion OK only. */
export function Spotlight() {
  useEffect(() => {
    const root = document.querySelector(".csapp-root") as HTMLElement | null;
    if (!root) return;
    let raf = 0;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)");
    const fine = window.matchMedia("(hover:hover) and (pointer:fine)");
    const onMove = (e: MouseEvent) => {
      if (reduce.matches || !fine.matches) return;
      if (root.getAttribute("data-theme") !== "dark") return;
      const t = e.target as HTMLElement | null;
      const spot = t?.closest?.(".spot") as HTMLElement | null;
      if (!spot) return;
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => {
        const r = spot.getBoundingClientRect();
        spot.style.setProperty("--mx", `${e.clientX - r.left}px`);
        spot.style.setProperty("--my", `${e.clientY - r.top}px`);
      });
    };
    root.addEventListener("pointermove", onMove);
    return () => {
      cancelAnimationFrame(raf);
      root.removeEventListener("pointermove", onMove);
    };
  }, []);
  return null;
}
