"use client";
import { useLang } from "@/i18n/client";
import { setThemePref, useTheme, type ThemePref } from "@/lib/theme";

const ICON: Record<ThemePref, React.ReactNode> = {
  light: (
    <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" aria-hidden="true">
      <circle cx="8" cy="8" r="3" />
      <path d="M8 1.5v1.5M8 13v1.5M1.5 8H3M13 8h1.5M3.4 3.4l1 1M11.6 11.6l1 1M3.4 12.6l1-1M11.6 4.4l1-1" />
    </svg>
  ),
  dark: (
    <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" aria-hidden="true">
      <path d="M13.5 9.5A5.5 5.5 0 0 1 6.5 2.5a5.5 5.5 0 1 0 7 7Z" />
    </svg>
  ),
  system: (
    <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true">
      <rect x="2" y="3" width="12" height="8.5" rx="1.5" />
      <path d="M5.5 14h5" strokeLinecap="round" />
    </svg>
  ),
};
const ORDER: ThemePref[] = ["light", "dark", "system"];

/** Sidebar light/dark/system radiogroup — shares src/lib/theme.ts with the header toggle. */
export function ThemeSwitch() {
  const { s } = useLang();
  const v = useTheme();
  const pref = v?.pref ?? "system";
  const names: Record<ThemePref, string> = { light: s.themeLight, dark: s.themeDark, system: s.themeSystem };
  const onKey = (e: React.KeyboardEvent) => {
    if (e.key !== "ArrowRight" && e.key !== "ArrowLeft") return;
    e.preventDefault();
    const i = ORDER.indexOf(pref);
    setThemePref(ORDER[(i + (e.key === "ArrowRight" ? 1 : ORDER.length - 1)) % ORDER.length]!);
  };
  return (
    <div className="theme-sw" role="radiogroup" aria-label={s.themeLabel} onKeyDown={onKey}>
      {ORDER.map((p) => (
        <button key={p} type="button" role="radio" aria-checked={v ? pref === p : false} tabIndex={pref === p ? 0 : -1}
          title={names[p]} onClick={() => setThemePref(p)}>
          {ICON[p]}
          <span>{names[p]}</span>
        </button>
      ))}
    </div>
  );
}
