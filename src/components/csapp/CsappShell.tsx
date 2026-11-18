"use client";

import { useEffect, useState, type ReactNode } from "react";
import "@/styles/csapp/csapp.css";

const KEY = "csapp-theme";

function resolve(pref: string | null): "light" | "dark" {
  if (pref === "light" || pref === "dark") return pref;
  if (typeof window === "undefined") return "light";
  return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
}

export function CsappShell({ children }: { children: ReactNode }) {
  const [theme, setTheme] = useState<"light" | "dark">("light");
  const [pref, setPref] = useState<"light" | "dark" | "system">("system");
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let stored: string | null = null;
    try { stored = localStorage.getItem(KEY); } catch { /* */ }
    const p = stored === "light" || stored === "dark" ? stored : "system";
    setPref(p);
    setTheme(resolve(stored));
    setReady(true);
    const mq = window.matchMedia("(prefers-color-scheme: dark)");
    const onChange = () => {
      let s: string | null = null;
      try { s = localStorage.getItem(KEY); } catch { /* */ }
      if (s !== "light" && s !== "dark") setTheme(resolve(null));
    };
    mq.addEventListener?.("change", onChange);
    return () => mq.removeEventListener?.("change", onChange);
  }, []);

  useEffect(() => {
    if (!ready) return;
    const root = document.querySelector(".csapp-root") as HTMLElement | null;
    if (!root) return;
    root.setAttribute("data-theme", theme);
    root.setAttribute("data-theme-pref", pref);
  }, [theme, pref, ready]);

  useEffect(() => {
    (window as unknown as { csappSetTheme?: (v: string) => void }).csappSetTheme = (v: string) => {
      const nextPref = v === "light" || v === "dark" ? v : "system";
      setPref(nextPref);
      try {
        if (nextPref === "system") localStorage.removeItem(KEY);
        else localStorage.setItem(KEY, nextPref);
      } catch { /* */ }
      setTheme(resolve(nextPref === "system" ? null : nextPref));
      document.dispatchEvent(new Event("themechange"));
    };
  }, []);

  return (
    <div className="csapp-root" data-theme={theme} data-theme-pref={pref} style={{ fontFamily: 'Inter, "SF Pro Text", -apple-system, "PingFang SC", "Noto Sans SC", sans-serif' }}>
      {children}
    </div>
  );
}
