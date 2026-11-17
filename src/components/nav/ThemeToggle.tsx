"use client";
import { useEffect, useState } from "react";

type Theme = "light" | "dark";

/** localStorage key shared with the pre-paint script in app/layout.tsx,
 *  which sets <html data-theme> before first paint from this key (or the
 *  system preference on a first visit). Keep the two in sync. */
export const THEME_KEY = "cs-theme";
const THEME_COLOR: Record<Theme, string> = { light: "#fcfdfe", dark: "#0b1020" };

function applyTheme(next: Theme) {
  document.documentElement.dataset.theme = next;
  document.documentElement.style.colorScheme = next;
  const meta = document.querySelector<HTMLMetaElement>('meta[name="theme-color"]');
  if (meta) meta.content = THEME_COLOR[next];
}

/** Sun/moon theme switch in the site header. Renders a stable placeholder
 *  until mount (SSR has no data-theme), then reflects the live theme. */
export function ThemeToggle() {
  const [theme, setTheme] = useState<Theme | null>(null);
  useEffect(() => {
    setTheme(document.documentElement.dataset.theme === "dark" ? "dark" : "light");
  }, []);
  const toggle = () => {
    const next: Theme = theme === "dark" ? "light" : "dark";
    applyTheme(next);
    try { localStorage.setItem(THEME_KEY, next); } catch { /* private mode */ }
    setTheme(next);
  };
  const label = theme === "dark" ? "切换到浅色模式" : "切换到深色模式";
  return (
    <button type="button" className="theme-toggle" aria-label={label} title={label} onClick={toggle}>
      {theme === "dark" ? (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
          <circle cx="12" cy="12" r="4" />
          <path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" />
        </svg>
      ) : (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <path d="M21 12.8A9 9 0 1 1 11.2 3 7 7 0 0 0 21 12.8z" />
        </svg>
      )}
    </button>
  );
}
