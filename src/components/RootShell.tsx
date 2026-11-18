import type { Metadata } from "next";
import { loadContent, pageTopics, topicForLang } from "@/lib/content";
import { loadCsappIndex } from "@/lib/csapp/content";
import { prefixPath, stringsFor, SITE_URL, type Lang } from "@/i18n";
import { stepPath } from "@/lib/paths";
import { SiteShell, type NavSubject, type NavTopic } from "@/components/nav/SiteShell";
import { UsageTracker } from "@/components/UsageTracker";
import { THEME_INIT } from "@/lib/themeInit";

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

/* Pre-paint theme script: see src/lib/theme.ts (single source for home,
 * CSAPP and lessons). */

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
  const csapp = loadCsappIndex();
  const csappTopics: NavTopic[] = [
    { id: "csapp-home", title: s.csappNavTitle, href: prefixPath(lang, "/csapp/"), exact: true },
    ...csapp.chapters.map((ch) => ({
      id: `csapp-ch-${ch.id}`,
      title: `${String(ch.id).padStart(2, "0")} · ${ch.title}`,
      href: prefixPath(lang, `/csapp/${ch.id}/`),
    })),
  ];
  return (
    <html lang={lang === "en" ? "en" : "zh-CN"} suppressHydrationWarning>
      <body>
        {/* Plain inline scripts as the first body nodes — NOT next/script:
            its beforeInteractive queue executes too late in a static
            export. Literal scripts here run synchronously during parse,
            before any visible content, so theme/language are set pre-paint. */}
        {lang === "zh" && <script dangerouslySetInnerHTML={{ __html: LANG_INIT }} />}
        <script dangerouslySetInnerHTML={{ __html: THEME_INIT }} />
        <SiteShell lang={lang} nav={nav} csappTopics={csappTopics}>{children}</SiteShell>
        <UsageTracker />
        {/* Web Analytics beacon: added only after Daniel approves (needs token). */}
      </body>
    </html>
  );
}
