import type { Metadata, Viewport } from "next";
import "@/styles/tokens.css";
import "@/styles/globals.css";
import "@/styles/ui-v2.css";
import Link from "next/link";
import { RootShell } from "@/components/RootShell";
import { stringsFor } from "@/i18n";

/** Global fallback 404 for paths outside both language trees. With two root
 *  layouts (route groups), a top-level not-found renders without a layout,
 *  so it brings its own RootShell — the Chinese one, matching the pre-i18n
 *  behaviour where the only tree was Chinese. In-tree notFound() calls use
 *  each group's own not-found.tsx instead. */
export const viewport: Viewport = { viewportFit: "cover" };
export const metadata: Metadata = { title: stringsFor("zh").siteName, description: stringsFor("zh").tagline };

const s = stringsFor("zh");
export default function NotFound() {
  return (
    <RootShell lang="zh">
      <div className="home"><h1>404 · {s.notFound}</h1><p><Link href="/">{s.home}</Link></p></div>
    </RootShell>
  );
}
