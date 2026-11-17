import type { Metadata, Viewport } from "next";
import "@/styles/tokens.css";
import "@/styles/globals.css";
import "@/styles/ui-v2.css";
import { t, SITE_URL } from "@/i18n";
import { loadContent, pageTopics } from "@/lib/content";
import { stepPath } from "@/lib/paths";
import { SiteShell, type NavSubject } from "@/components/nav/SiteShell";
import { UsageTracker } from "@/components/UsageTracker";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: t.siteName,
  description: t.tagline,
  manifest: "/manifest.webmanifest",
  icons: { icon: "/favicon.svg", apple: "/apple-touch-icon.png" },
  // statusBarStyle "black": an opaque black bar with white text. The old
  // "black-translucent" floated white status text over the page itself —
  // illegible on the light theme's near-white background, and the page ran
  // underneath it. "black" keeps the text readable under both colour
  // schemes because the bar carries its own background; the CSS
  // safe-area-inset-top padding stays as a fallback for translucent modes.
  appleWebApp: { capable: true, title: t.siteName, statusBarStyle: "black" },
};
/* themeColor is NOT set here: it must follow the manually chosen theme, not
 * just the OS preference, so the pre-paint script below owns a single
 * <meta name="theme-color"> and ThemeToggle keeps it updated on switch. */
export const viewport: Viewport = { viewportFit: "cover" };

/* Runs before first paint: resolves the theme (stored choice → system
 * preference) and stamps it on <html data-theme> plus the theme-color meta,
 * so the page never flashes the wrong theme. The token blocks keyed on
 * [data-theme] in tokens.css do the rest. Keep THEME_KEY in sync with
 * src/components/nav/ThemeToggle.tsx. */
const THEME_INIT = `(function(){try{var t=localStorage.getItem("cs-theme");if(t!=="light"&&t!=="dark"){t=window.matchMedia("(prefers-color-scheme: dark)").matches?"dark":"light";}var d=document.documentElement;d.dataset.theme=t;d.style.colorScheme=t;var m=document.querySelector('meta[name="theme-color"]');if(!m){m=document.createElement("meta");m.setAttribute("name","theme-color");document.head.appendChild(m);}m.setAttribute("content",t==="dark"?"#0b1020":"#fcfdfe");}catch(e){}})();`;

export default function RootLayout({ children }: { children: React.ReactNode }) {
  const { subjects } = loadContent();
  const topics = pageTopics();
  const nav: NavSubject[] = subjects
    .map((s) => ({
      id: s.id,
      name: t.subjects[s.id as keyof typeof t.subjects] ?? s.id,
      topics: topics
        .filter((x) => x.subject === s.id)
        .sort((a, b) => a.order - b.order)
        .map((x) => ({ id: x.id, title: x.title, href: stepPath(x.subject, x.slug, 0) })),
    }))
    .filter((s) => s.topics.length > 0);
  return (
    <html lang="zh-CN" suppressHydrationWarning>
      <body>
        {/* Plain inline script as the first body node — NOT next/script:
            its beforeInteractive queue executes too late in a static
            export. A literal script here runs synchronously during parse,
            before any visible content, so the theme is set pre-paint. */}
        <script dangerouslySetInnerHTML={{ __html: THEME_INIT }} />
        <SiteShell nav={nav}>{children}</SiteShell>
        <UsageTracker />
        {/* Web Analytics beacon: added only after Daniel approves (needs token). */}
      </body>
    </html>
  );
}
