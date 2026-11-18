"use client";
import { useEffect, useState } from "react";

/** Site-wide theme (home, CSAPP, lessons share one setting).
 *
 *  Storage: localStorage["cs-theme"] = "light" | "dark"; absent = follow system.
 *  DOM:     <html data-theme="light|dark" data-theme-pref="light|dark|system">.
 *  The pre-paint script (THEME_INIT, inlined first in <body> by RootShell)
 *  owns the logic: it applies the theme before first paint, follows the OS
 *  while the pref is "system", syncs other tabs via the storage event, and
 *  exposes window.csSetTheme(pref). Every switch dispatches a "themechange"
 *  event on document; UI controls only read/write through this module. */
export type ThemePref = "light" | "dark" | "system";
export const THEME_KEY = "cs-theme";

export { THEME_INIT } from "./themeInit";

type W = Window & { csSetTheme?: (p: ThemePref) => void };

export function readThemePref(): ThemePref {
  if (typeof document === "undefined") return "system";
  const p = document.documentElement.getAttribute("data-theme-pref");
  return p === "light" || p === "dark" ? p : "system";
}

export function readTheme(): "light" | "dark" {
  if (typeof document === "undefined") return "light";
  return document.documentElement.getAttribute("data-theme") === "dark" ? "dark" : "light";
}

export function setThemePref(p: ThemePref) {
  (window as W).csSetTheme?.(p);
}

/** Live { pref, theme } — null until mounted (SSR has no theme). */
export function useTheme(): { pref: ThemePref; theme: "light" | "dark" } | null {
  const [v, setV] = useState<{ pref: ThemePref; theme: "light" | "dark" } | null>(null);
  useEffect(() => {
    const sync = () => setV({ pref: readThemePref(), theme: readTheme() });
    sync();
    document.addEventListener("themechange", sync);
    return () => document.removeEventListener("themechange", sync);
  }, []);
  return v;
}
