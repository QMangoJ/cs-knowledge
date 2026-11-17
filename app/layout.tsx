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
export const viewport: Viewport = { viewportFit: "cover", themeColor: [{ media: "(prefers-color-scheme: dark)", color: "#0b1020" }, { color: "#fcfdfe" }] };

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
    <html lang="zh-CN">
      <body>
        <SiteShell nav={nav}>{children}</SiteShell>
        <UsageTracker />
        {/* Web Analytics beacon: added only after Daniel approves (needs token). */}
      </body>
    </html>
  );
}
