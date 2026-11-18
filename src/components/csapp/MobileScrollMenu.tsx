"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";

export type ScrollMenuItem = {
  id: string;
  label: string;
  short: string;
};

export type ScrollMenuAction = {
  label: string;
  href: string;
};

const elemOf = (t: EventTarget | null): Element | null =>
  t instanceof Element ? t : (t as Node | null)?.parentElement ?? null;

/** Compact floating right-edge scroll menu on narrow viewports (< 1024px)
 *  where .sb and .rail are hidden. Fades in after scrolling past the hero
 *  and lets the user jump between sections or back to top without opening
 *  the main drawer. */
export function MobileScrollMenu({
  title,
  topLabel = "↑ 顶部",
  ariaLabel,
  items,
  actions,
  onSelectSection,
}: {
  title: string;
  topLabel?: string;
  ariaLabel?: string;
  items: ScrollMenuItem[];
  actions?: ScrollMenuAction[];
  onSelectSection?: (id: string) => void;
}) {
  const [visible, setVisible] = useState(false);
  const [open, setOpen] = useState(false);
  const [activeId, setActiveId] = useState<string>(items[0]?.id ?? "");
  const wrapRef = useRef<HTMLDivElement>(null);
  const itemsRef = useRef(items);
  useEffect(() => { itemsRef.current = items; }, [items]);

  const getMain = useCallback(
    () => wrapRef.current?.closest(".csapp-root")?.querySelector<HTMLElement>(".main") ?? null,
    [],
  );

  useEffect(() => {
    const main = getMain();
    if (!main) return;
    let raf = 0;

    const update = () => {
      raf = 0;
      setVisible(main.scrollTop > 72);
      const list = itemsRef.current;
      const targets = list
        .map((it) => ({ id: it.id, el: document.getElementById(it.id) }))
        .filter((x): x is { id: string; el: HTMLElement } => !!x.el);
      if (!targets.length) return;
      if (main.scrollTop + main.clientHeight >= main.scrollHeight - 24) {
        setActiveId(targets[targets.length - 1]!.id);
        return;
      }
      const mTop = main.getBoundingClientRect().top;
      const threshold = main.clientHeight * 0.32;
      let cur = targets[0]!.id;
      for (const t of targets) {
        if (t.el.getBoundingClientRect().top - mTop <= threshold) cur = t.id;
      }
      setActiveId(cur);
    };

    const onScroll = () => {
      if (!raf) raf = requestAnimationFrame(update);
    };

    update();
    main.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => {
      if (raf) cancelAnimationFrame(raf);
      main.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
    };
  }, [getMain]);

  useEffect(() => {
    if (!open) return;
    const onDown = (e: PointerEvent) => {
      if (!elemOf(e.target)?.closest(".ms-wrap")) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("pointerdown", onDown);
    window.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("pointerdown", onDown);
      window.removeEventListener("keydown", onKey);
    };
  }, [open]);

  const jump = (id: string) => {
    const el = document.getElementById(id);
    if (el) {
      const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      el.scrollIntoView({ behavior: reduce ? "auto" : "smooth", block: "start" });
    }
    setActiveId(id);
    onSelectSection?.(id);
    setOpen(false);
  };

  const scrollToTop = () => {
    const main = getMain();
    if (main) {
      const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      main.scrollTo({ top: 0, behavior: reduce ? "auto" : "smooth" });
    }
    setOpen(false);
  };

  const activeItem = items.find((it) => it.id === activeId) ?? items[0];

  return (
    <div ref={wrapRef} className={`ms-wrap${visible || open ? " is-vis" : ""}${open ? " is-open" : ""}`}>
      {open && (
        <div className="ms-pop" role="dialog" aria-label={title}>
          <div className="ms-head">
            <span className="ms-title">{title}</span>
            <button type="button" className="ms-top" onClick={scrollToTop}>{topLabel}</button>
          </div>
          <ol className="ms-list">
            {items.map((it) => (
              <li key={it.id}>
                <button
                  type="button"
                  className={it.id === activeId ? "ms-item is-on" : "ms-item"}
                  onClick={() => jump(it.id)}
                >
                  <span className="ms-short">{it.short}</span>
                  <span className="ms-lbl">{it.label}</span>
                </button>
              </li>
            ))}
          </ol>
          {actions && actions.length > 0 && (
            <div className="ms-foot">
              {actions.map((act) => (
                <Link key={act.href} href={act.href} className="ms-act" onClick={() => setOpen(false)}>
                  {act.label}
                </Link>
              ))}
            </div>
          )}
        </div>
      )}
      <button
        type="button"
        className="ms-trigger"
        aria-expanded={open}
        aria-label={ariaLabel ?? title}
        onClick={() => setOpen((v) => !v)}
      >
        <span className="ms-ticks" aria-hidden="true">
          {items.map((it) => (
            <i key={it.id} className={it.id === activeId ? "is-on" : undefined} />
          ))}
        </span>
        <span className="ms-cur">{activeItem?.short ?? title}</span>
      </button>
    </div>
  );
}
