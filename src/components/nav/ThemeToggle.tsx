"use client";
import { useLang } from "@/i18n/client";
import { setThemePref, useTheme, type ThemePref } from "@/lib/theme";

/** Header theme button: cycles light → dark → system. Same store and DOM
 *  attributes as the CSAPP sidebar switch (src/lib/theme.ts), so both stay
 *  in sync on every page. Renders a stable placeholder until mount. */
const NEXT: Record<ThemePref, ThemePref> = { light: "dark", dark: "system", system: "light" };

export function ThemeToggle() {
  const { s } = useLang();
  const v = useTheme();
  const pref = v?.pref ?? "system";
  const name = { light: s.themeLight, dark: s.themeDark, system: s.themeSystem }[pref];
  const label = `${s.themeLabel}: ${name}`;
  return (
    <button type="button" className="theme-toggle" aria-label={label} title={label} data-pref={v ? pref : undefined}
      onClick={() => setThemePref(NEXT[pref])}>
      {pref === "light" ? (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
          <circle cx="12" cy="12" r="4" />
          <path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" />
        </svg>
      ) : pref === "dark" ? (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <path d="M21 12.8A9 9 0 1 1 11.2 3 7 7 0 0 0 21 12.8z" />
        </svg>
      ) : (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
          <rect x="3" y="4" width="18" height="13" rx="2" />
          <path d="M8 21h8M12 17v4" />
        </svg>
      )}
    </button>
  );
}
