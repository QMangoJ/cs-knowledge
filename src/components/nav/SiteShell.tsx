"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { t } from "@/i18n";

export type NavTopic = { id: string; title: string; href: string };
export type NavSubject = { id: string; name: string; topics: NavTopic[] };

const norm = (p: string) => p.replace(/\/$/, "") || "/";
const isCurrent = (pathname: string, href: string) => {
  const h = norm(href), p = norm(pathname);
  return p === h || p.startsWith(h + "/");
};

/** App shell: header + two-level course menu (学科 → 课程) + main + footer.
 *  Desktop: fixed in-flow sidebar. Narrow viewports: the same list becomes an
 *  off-canvas drawer behind the header's menu button. The list is rendered twice
 *  (sidebar + drawer) and CSS shows exactly one of them per breakpoint. */
export function SiteShell({ nav, children }: { nav: NavSubject[]; children: React.ReactNode }) {
  const pathname = usePathname() ?? "/";
  const [open, setOpen] = useState(false);
  useEffect(() => { setOpen(false); }, [pathname]);
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") setOpen(false); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const list = (
    <nav className="sidenav-list" aria-label="全部课程">
      <Link href="/" prefetch={false} className={pathname === "/" ? "sn-home current" : "sn-home"} aria-current={pathname === "/" ? "page" : undefined}>首页</Link>
      {nav.map((s) => (
        <div key={s.id} className="sn-subject">
          <p className="sn-subject-name">{s.name}</p>
          {s.topics.map((x) => {
            const cur = isCurrent(pathname, x.href);
            return (
              <Link key={x.id} href={x.href} prefetch={false} className={cur ? "sn-topic current" : "sn-topic"} aria-current={cur ? "page" : undefined}>{x.title}</Link>
            );
          })}
        </div>
      ))}
      <div className="sn-subject">
        <p className="sn-subject-name">{t.coding}</p>
        <Link href="/coding/" prefetch={false} className={isCurrent(pathname, "/coding/") ? "sn-topic current" : "sn-topic"} aria-current={isCurrent(pathname, "/coding/") ? "page" : undefined}>Codility 风格练习与模拟考</Link>
      </div>
    </nav>
  );

  return (
    <div className="shell">
      <header className="site-header">
        <div className="header-left">
          <button type="button" className="nav-toggle" aria-expanded={open} aria-label="打开课程菜单" onClick={() => setOpen((v) => !v)}>☰</button>
          <Link href="/">{t.siteName}</Link>
        </div>
        <span className="hint">{t.keyboardHint}</span>
      </header>
      <div className="shell-row">
        <aside className="sidenav">{list}</aside>
        {open && <div className="nav-backdrop" onClick={() => setOpen(false)} aria-hidden="true" />}
        <aside className={open ? "sidenav drawer open" : "sidenav drawer"}>{list}</aside>
        <main className="site-main">{children}</main>
      </div>
      <footer className="site-footer">{t.footer}</footer>
    </div>
  );
}
