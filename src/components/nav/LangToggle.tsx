"use client";
import { usePathname } from "next/navigation";
import { counterpartPath, LANG_KEY } from "@/i18n";
import { useLang } from "@/i18n/client";

/** Language switch in the site header, next to the theme toggle. A plain
 *  anchor on purpose: the other language lives under a different root
 *  layout, so the switch is a full document load of the same page's other
 *  version. The choice is stored so the root-entry script can honour it. */
export function LangToggle() {
  const { lang, s } = useLang();
  const pathname = usePathname() ?? "/";
  // On a 404 page there is no counterpart to jump to; offer the other home.
  const href = pathname.startsWith("/_not-found")
    ? (lang === "zh" ? "/en/" : "/")
    : counterpartPath(lang, pathname);
  const store = () => {
    try { localStorage.setItem(LANG_KEY, lang === "zh" ? "en" : "zh"); } catch { /* private mode */ }
  };
  return (
    <a className="lang-toggle" href={href} onClick={store} aria-label={s.langSwitchLabel} title={s.langSwitchLabel} hrefLang={lang === "zh" ? "en" : "zh-CN"}>
      {s.langSwitchText}
    </a>
  );
}
