import type { Viewport } from "next";
import "@/styles/tokens.css";
import "@/styles/globals.css";
import "@/styles/ui-v2.css";
import { RootShell, rootMetadata } from "@/components/RootShell";

export const metadata = rootMetadata("en");
/* themeColor is NOT set here: it must follow the manually chosen theme, not
 * just the OS preference, so the pre-paint script in RootShell owns a single
 * <meta name="theme-color"> and ThemeToggle keeps it updated on switch. */
export const viewport: Viewport = { viewportFit: "cover" };

export default function Layout({ children }: { children: React.ReactNode }) {
  return <RootShell lang="en">{children}</RootShell>;
}
