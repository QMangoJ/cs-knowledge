"use client";

import { useEffect, useState } from "react";

const SUN = (
  <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" aria-hidden="true">
    <circle cx="8" cy="8" r="3" />
    <path d="M8 1.5v1.5M8 13v1.5M1.5 8H3M13 8h1.5M3.4 3.4l1 1M11.6 11.6l1 1M3.4 12.6l1-1M11.6 4.4l1-1" />
  </svg>
);
const MOON = (
  <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" aria-hidden="true">
    <path d="M13.5 9.5A5.5 5.5 0 0 1 6.5 2.5a5.5 5.5 0 1 0 7 7Z" />
  </svg>
);
const AUTO = (
  <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true">
    <rect x="2" y="3" width="12" height="8.5" rx="1.5" />
    <path d="M5.5 14h5" strokeLinecap="round" />
  </svg>
);

type Pref = "light" | "dark" | "system";

export function ThemeSwitch() {
  const [pref, setPref] = useState<Pref>("system");

  useEffect(() => {
    const sync = () => {
      const root = document.querySelector(".csapp-root");
      const p = (root?.getAttribute("data-theme-pref") as Pref) || "system";
      setPref(p);
    };
    sync();
    document.addEventListener("themechange", sync);
    return () => document.removeEventListener("themechange", sync);
  }, []);

  const set = (v: Pref) => {
    (window as unknown as { csappSetTheme?: (x: string) => void }).csappSetTheme?.(v);
    setPref(v);
  };

  const onKey = (e: React.KeyboardEvent) => {
    const order: Pref[] = ["light", "dark", "system"];
    const i = order.indexOf(pref);
    if (e.key === "ArrowRight" || e.key === "ArrowLeft") {
      e.preventDefault();
      const next = order[(i + (e.key === "ArrowRight" ? 1 : order.length - 1)) % order.length]!;
      set(next);
    }
  };

  return (
    <div className="theme-sw" role="radiogroup" aria-label="主题" onKeyDown={onKey}>
      {([
        ["light", "浅色", SUN],
        ["dark", "深色", MOON],
        ["system", "系统", AUTO],
      ] as const).map(([v, label, icon]) => (
        <button key={v} type="button" role="radio" aria-checked={pref === v} aria-label={label} onClick={() => set(v)}>
          {icon}
          <span>{label}</span>
        </button>
      ))}
    </div>
  );
}
