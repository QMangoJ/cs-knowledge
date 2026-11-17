import type { Metadata } from "next";
import { stringsFor, SITE_URL, type Lang } from "@/i18n";
import { loadContent, pageTopics, topicForLang } from "@/lib/content";
import { stepPath } from "@/lib/paths";
import { SiteShell, type NavSubject } from "@/components/nav/SiteShell";
import { UsageTracker } from "@/components/UsageTracker";

/** Shared root layout for both language trees (app/(zh) and app/(en)/en).
 *  Each route group has its own thin layout.tsx exporting this component
 *  with its language, because a static export needs one <html lang> per tree. */
export function rootMetadata(lang: Lang): Metadata {
  const s = stringsFor(lang);
  return {
    metadataBase: new URL(SITE_URL),
    title: s.siteName,
    description: s.tagline,
    manifest: "/manifest.webmanifest",
    icons: { icon: "/favicon.svg", apple: "/apple-touch-icon.png" },
    // statusBarStyle "black": an opaque black bar with white text. The old
    // "black-translucent" floated white status text over the page itself —
    // illegible on the light theme's near-white background, and the page ran
    // underneath it. "black" keeps the text readable under both colour
    // schemes because the bar carries its own background; the CSS
    // safe-area-inset-top padding stays as a fallback for translucent modes.
    appleWebApp: { capable: true, title: s.siteName, statusBarStyle: "black" },
  };
}

/* Runs before first paint: resolves the theme (stored choice → system
 * preference) and stamps it on <html data-theme> plus the theme-color meta,
 * so the page never flashes the wrong theme. The token blocks keyed on
 * [data-theme] in tokens.css do the rest. Keep THEME_KEY in sync with
 * src/components/nav/ThemeToggle.tsx. */
const THEME_INIT = `(function(){try{var t=localStorage.getItem("cs-theme");if(t!=="light"&&t!=="dark"){t=window.matchMedia("(prefers-color-scheme: dark)").matches?"dark":"light";}var d=document.documentElement;d.dataset.theme=t;d.style.colorScheme=t;var m=document.querySelector('meta[name="theme-color"]');if(!m){m=document.createElement("meta");m.setAttribute("name","theme-color");document.head.appendChild(m);}m.setAttribute("content",t==="dark"?"#0b1020":"#fcfdfe");}catch(e){}})();`;

/* Chinese tree only: a reader who chose English and later lands on the site
 * root from outside is offered the English home page. Only "/" redirects —
 * a deep link shared by someone else always lands where it points. */
const LANG_INIT = `(function(){try{if(localStorage.getItem("cs-lang")==="en"&&location.pathname==="/"){location.replace("/en/");}}catch(e){}})();`;

export function RootShell({ lang, children }: { lang: Lang; children: React.ReactNode }) {
  const c = loadContent();
  const s = stringsFor(lang);
  const topics = pageTopics();
  const nav: NavSubject[] = c.subjects
    .map((sub) => ({
      id: sub.id,
      name: s.subjects[sub.id as keyof typeof s.subjects] ?? sub.id,
      topics: topics
        .filter((x) => x.subject === sub.id)
        .sort((a, b) => a.order - b.order)
        .map((x) => {
          const disp = topicForLang(c, x, lang);
          return { id: x.id, title: disp.title, href: stepPath(x.subject, x.slug, 0, lang) };
        }),
    }))
    .filter((sub) => sub.topics.length > 0);
  return (
    <html lang={lang === "en" ? "en" : "zh-CN"} suppressHydrationWarning>
      <body>
        {/* Plain inline scripts as the first body nodes — NOT next/script:
            its beforeInteractive queue executes too late in a static
            export. Literal scripts here run synchronously during parse,
            before any visible content, so theme/language are set pre-paint. */}
        {lang === "zh" && <script dangerouslySetInnerHTML={{ __html: LANG_INIT }} />}
        <script dangerouslySetInnerHTML={{ __html: THEME_INIT }} />
        <SiteShell lang={lang} nav={nav}>{children}</SiteShell>
        <UsageTracker />
        {/* Web Analytics beacon: added only after Daniel approves (needs token). */}
      </body>
    </html>
  );
}
