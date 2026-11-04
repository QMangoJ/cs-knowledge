import type { Metadata, Viewport } from "next";
import Link from "next/link";
import "@/styles/tokens.css";
import "@/styles/globals.css";
import { t, SITE_URL } from "@/i18n";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: t.siteName,
  description: t.tagline,
  icons: { icon: "/favicon.svg" },
};
export const viewport: Viewport = { themeColor: [{ media: "(prefers-color-scheme: dark)", color: "#0b1020" }, { color: "#fcfdfe" }] };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="zh-CN">
      <body>
        <header className="site-header"><Link href="/">{t.siteName}</Link><span className="hint">{t.keyboardHint}</span></header>
        <main>{children}</main>
        <footer className="site-footer">{t.footer}</footer>
        {/* Web Analytics beacon: added only after Daniel approves (needs token). */}
      </body>
    </html>
  );
}
