"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { plainText } from "@/lib/terms";
import { prefixPath, stringsFor, type Lang } from "@/i18n";
import { LangProvider } from "@/i18n/client";
import { ThemeToggle } from "./ThemeToggle";
import { LangToggle } from "./LangToggle";

export type NavTopic = { id: string; title: string; href: string };
export type NavSubject = { id: string; name: string; topics: NavTopic[] };

const norm = (p: string) => p.replace(/\/$/, "") || "/";
const isCurrent = (pathname: string, href: string) => {
  const h = norm(href), p = norm(pathname);
  return p === h || p.startsWith(h + "/");
};

/** localStorage key for the set of subject ids whose lesson lists the user
 *  has expanded in the sidenav. The subject containing the current page is
 *  always rendered expanded regardless of this set. */
const OPEN_SUBJECTS_KEY = "cs-nav-open-subjects";
const CODING_SUBJECT_ID = "coding";
const CSAPP_SUBJECT_ID = "csapp";

/** App shell: header + two-level course menu (学科 → 课程) + main + footer.
 *  Desktop: fixed in-flow sidebar. Narrow viewports: the same list becomes an
 *  off-canvas drawer behind the header's menu button. The list is rendered twice
 *  (sidebar + drawer) and CSS shows exactly one of them per breakpoint. */
/** Scroll one sidenav container so its current-page link is fully visible.
 *  Manual scrollTop math (not scrollIntoView) so only this container moves —
 *  never the page or the main column. If the link is already fully visible,
 *  leave the scroll position alone (nearest semantics: no jump when moving
 *  between neighbouring lessons). Otherwise place the link ~1/4 from the top
 *  of the container, keeping its subject heading and preceding items in view
 *  instead of pinning it to an edge. */
function scrollCurrentIntoView(aside: HTMLElement | null) {
  if (!aside || aside.clientHeight === 0) return;
  const link = aside.querySelector<HTMLElement>('[aria-current="page"]');
  if (!link) return;
  const a = aside.getBoundingClientRect();
  const l = link.getBoundingClientRect();
  if (l.top >= a.top && l.bottom <= a.bottom) return;
  const itemTop = aside.scrollTop + (l.top - a.top);
  aside.scrollTop = Math.max(0, itemTop - aside.clientHeight * 0.25);
}

export function SiteShell({ lang, nav, children }: { lang: Lang; nav: NavSubject[]; children: React.ReactNode }) {
  const s = stringsFor(lang);
  const homeHref = prefixPath(lang, "/");
  const codingHref = prefixPath(lang, "/coding/");
  const csappHref = prefixPath(lang, "/csapp/");
  const pathname = usePathname() ?? "/";
  const [open, setOpen] = useState(false);
  /** Expanded subjects per the user's stored preference; null until
   *  localStorage has been read (first paint matches SSR: only the current
   *  subject expanded). */
  const [storedOpen, setStoredOpen] = useState<string[] | null>(null);
  // The desktop sidebar as a whole can collapse away to give the content
  // area the full width; the toggle lives in the header (same slot as the
  // drawer button on narrow viewports) and the choice persists.
  const [navCollapsed, setNavCollapsed] = useState(false);
  useEffect(() => {
    try { setNavCollapsed(localStorage.getItem("cs-nav-collapsed") === "1"); } catch { /* private mode */ }
  }, []);
  const toggleNavCollapsed = () => setNavCollapsed((v) => {
    try { localStorage.setItem("cs-nav-collapsed", v ? "0" : "1"); } catch { /* private mode */ }
    return !v;
  });
  const desktopNavRef = useRef<HTMLElement | null>(null);
  const drawerNavRef = useRef<HTMLElement | null>(null);
  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(OPEN_SUBJECTS_KEY);
      const parsed: unknown = raw ? JSON.parse(raw) : [];
      setStoredOpen(Array.isArray(parsed) ? parsed.filter((x): x is string => typeof x === "string") : []);
    } catch { setStoredOpen([]); }
  }, []);
  const currentSubjectId =
    nav.find((s) => s.topics.some((x) => isCurrent(pathname, x.href)))?.id ??
    (isCurrent(pathname, csappHref) ? CSAPP_SUBJECT_ID : null) ??
    (isCurrent(pathname, codingHref) ? CODING_SUBJECT_ID : null);
  const isSubjectOpen = (id: string) =>
    id === currentSubjectId || (storedOpen?.includes(id) ?? false);
  const toggleSubject = (id: string) => {
    setStoredOpen((prev) => {
      const base = prev ?? [];
      const next = base.includes(id) ? base.filter((x) => x !== id) : [...base, id];
      try { window.localStorage.setItem(OPEN_SUBJECTS_KEY, JSON.stringify(next)); } catch { /* storage unavailable */ }
      return next;
    });
  };
  useEffect(() => { setOpen(false); }, [pathname]);
  useEffect(() => {
    scrollCurrentIntoView(desktopNavRef.current);
    scrollCurrentIntoView(drawerNavRef.current);
  }, [pathname]);
  useEffect(() => { if (open) scrollCurrentIntoView(drawerNavRef.current); }, [open ]);
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") setOpen(false); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  /** One subject block: the name is a button toggling its lesson list.
   *  `prefix` keeps element ids unique across the two rendered copies
   *  (desktop sidebar + mobile drawer). */
  const subjectBlock = (prefix: string, id: string, name: string, topics: NavTopic[]) => {
    const expanded = isSubjectOpen(id);
    const panelId = `${prefix}-topics-${id}`;
    return (
      <div key={id} className="sn-subject">
        <button
          type="button"
          className="sn-subject-name"
          aria-expanded={expanded}
          aria-controls={panelId}
          onClick={() => toggleSubject(id)}
        >
          <span>{name}</span>
          <span className="sn-chevron" aria-hidden="true">▸</span>
        </button>
        {expanded && (
          <div id={panelId}>
            {topics.map((x) => {
              const cur = isCurrent(pathname, x.href);
              return (
                <Link key={x.id} href={x.href} prefetch={false} className={cur ? "sn-topic current" : "sn-topic"} aria-current={cur ? "page" : undefined}>{plainText(x.title)}</Link>
              );
            })}
          </div>
        )}
      </div>
    );
  };

  const renderList = (prefix: string) => (
    <nav className="sidenav-list" aria-label={s.navLabel}>
      <Link href={homeHref} prefetch={false} className={norm(pathname) === norm(homeHref) ? "sn-home current" : "sn-home"} aria-current={norm(pathname) === norm(homeHref) ? "page" : undefined}>{s.home}</Link>
      {nav.map((sub) => subjectBlock(prefix, sub.id, sub.name, sub.topics))}
      {subjectBlock(prefix, CSAPP_SUBJECT_ID, s.csapp, [
        { id: "csapp-home", title: s.csappNavTitle, href: csappHref },
      ])}
      {subjectBlock(prefix, CODING_SUBJECT_ID, s.coding, [
        { id: "coding-practice", title: s.codingNavTitle, href: codingHref },
      ])}
    </nav>
  );

  return (
    <LangProvider value={{ lang, s }}>
    <div className="shell">
      <header className="site-header">
        <div className="header-left">
          <button type="button" className="nav-toggle" aria-expanded={open} aria-label={open ? s.menuClose : s.menuOpen} onClick={() => setOpen((v) => !v)}>☰</button>
          <button type="button" className="nav-collapse-toggle" aria-expanded={!navCollapsed}
            aria-label={navCollapsed ? s.navExpand : s.navCollapse} title={navCollapsed ? s.navExpand : s.navCollapse}
            onClick={toggleNavCollapsed}>{navCollapsed ? "»" : "«"}</button>
          <Link href={homeHref}>{s.siteName}</Link>
        </div>
        <div className="header-right">
          <span className="hint">{s.keyboardHint}</span>
          <LangToggle />
          <ThemeToggle />
        </div>
      </header>
      <div className="shell-row">
        {!navCollapsed && (
          <aside className="sidenav" ref={desktopNavRef}>
            {renderList("sb")}
          </aside>
        )}
        {open && <div className="nav-backdrop" onClick={() => setOpen(false)} aria-hidden="true" />}
        <aside className={open ? "sidenav drawer open" : "sidenav drawer"} ref={drawerNavRef}>{renderList("dr")}</aside>
        <main className="site-main">{children}</main>
      </div>
      <footer className="site-footer">{s.footer}</footer>
    </div>
    </LangProvider>
  );
}
