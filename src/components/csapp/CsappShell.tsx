import type { ReactNode } from "react";
import "@/styles/csapp/csapp.css";

/** Scope wrapper for the G/H design system. Theme comes from <html data-theme>
 *  (site-wide, src/lib/theme.ts) — this wrapper holds no theme state. */
export function CsappShell({ children, className }: { children: ReactNode; className?: string }) {
  return <div className={className ? `csapp-root ${className}` : "csapp-root"}>{children}</div>;
}
