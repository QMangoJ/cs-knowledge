"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useLang } from "@/i18n/client";
import { prefixPath } from "@/i18n";
import { ThemeSwitch } from "./ThemeSwitch";
import { chapterProgress, loadReadSections, overallProgress } from "@/lib/csapp/progress";
import type { CsappIndex } from "@/lib/csapp/types";
import { SECTION_IDS } from "@/lib/csapp/types";

const SEC_TITLE: Record<string, string> = {
  mainline: "本章主线",
  concepts: "核心概念",
  backend: "后端 / 全栈视角",
  frontend: "和前端的关系",
  interview: "面试常考点",
  quiz: "自测 8 题",
  refs: "对应小节",
};

export function Sidebar({
  index,
  current,
  activeSection,
  mode,
}: {
  index: CsappIndex;
  current: number | "home";
  activeSection?: string;
  mode: "home" | "chapter" | "quiz";
}) {
  const [prog, setProg] = useState<Record<number, number>>({});
  const [read, setRead] = useState<string[]>([]);
  const [overall, setOverall] = useState({ pct: 0, started: 0, done: 0 });
  const { lang } = useLang();
  const [hoverCh, setHoverCh] = useState<number | null>(null);
  const base = prefixPath(lang, "/csapp");

  useEffect(() => {
    const ids = index.chapters.map((c) => c.id);
    const map: Record<number, number> = {};
    for (const id of ids) map[id] = chapterProgress(id);
    setProg(map);
    setOverall(overallProgress(ids));
    if (typeof current === "number") setRead(loadReadSections(current));
  }, [index, current]);

  useEffect(() => {
    const onHover = (e: Event) => {
      const ch = Number((e as CustomEvent).detail);
      setHoverCh(Number.isFinite(ch) ? ch : null);
    };
    const onLeave = () => setHoverCh(null);
    document.addEventListener("csapp-map-hover", onHover);
    document.addEventListener("csapp-map-leave", onLeave);
    return () => {
      document.removeEventListener("csapp-map-hover", onHover);
      document.removeEventListener("csapp-map-leave", onLeave);
    };
  }, []);

  const ring = (p: number) => {
    if (p <= 0) return null;
    const c = 31.4;
    return (
      <svg className="ring" viewBox="0 0 12 12" aria-label={`${p}%`}>
        <circle cx="6" cy="6" r="5" />
        <circle className="arc" cx="6" cy="6" r="5" strokeDasharray={`${(c * p) / 100} ${c}`} />
      </svg>
    );
  };

  return (
    <aside className="sb">
      <div className="sb-head">
        <div className="sb-kicker">CSAPP · 第 3 版</div>
        <Link href={`${base}/`} className="sb-title">一个程序的一生</Link>
        <div className="sb-sub">12 章系统笔记</div>
      </div>

      <Link href={`${base}/`} className={`sb-overview${current === "home" ? " is-active" : ""}`}>
        <span className="sb-ov-ico" aria-hidden="true" />
        总览
      </Link>

      <div className="sb-label"><span>章节</span><span>{overall.done}/12</span></div>
      <div className="sb-list">
        {index.chapters.map((ch) => {
          const isCurrent = current === ch.id;
          const p = prog[ch.id] ?? 0;
          const hover = hoverCh === ch.id;
          return (
            <div
              key={ch.id}
              className={`sb-ch${isCurrent ? " is-current" : ""}${hover ? " is-hover" : ""}${p > 0 ? " is-started" : ""}${p >= 90 ? " is-done" : ""}`}
              data-ch={ch.id}
              onPointerEnter={(e) => { if (e.pointerType === "mouse") document.dispatchEvent(new CustomEvent("csapp-sb-hover", { detail: ch.id })); }}
              onPointerLeave={(e) => { if (e.pointerType === "mouse") document.dispatchEvent(new Event("csapp-sb-leave")); }}
            >
              <Link href={`${base}/${ch.id}/`} className="sb-link">
                <span className="sb-num">{String(ch.id).padStart(2, "0")}</span>
                <span className="sb-name">{ch.title}</span>
                <span className="sb-prog">{ring(p)}</span>
              </Link>
              {isCurrent && mode !== "home" && (
                <div className="sb-secs">
                  {SECTION_IDS.map((id) => (
                    <a
                      key={id}
                      href={id === "quiz" ? `${base}/${ch.id}/quiz/` : mode === "quiz" ? `${base}/${ch.id}/#${id}` : `#${id}`}
                      className={`${activeSection === id ? "is-active" : ""} ${read.includes(id) ? "is-read" : ""}`}
                    >
                      <i aria-hidden="true" />
                      {SEC_TITLE[id]}
                    </a>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>

      <div className="sb-foot">
        <div className="sb-foot-row"><span>总进度</span><b>{overall.pct}%</b></div>
        <div className="sb-foot-bar" aria-hidden="true"><i style={{ width: `${overall.pct}%` }} /></div>
        <div className="sb-foot-row sm"><span>已开始 {overall.started} 章</span><span>完成 {overall.done}</span></div>
        <ThemeSwitch />
        <div className="sb-foot-row sm" style={{ marginTop: 12 }}>
          <Link href={prefixPath(lang, "/")}>← 返回 CS 首页</Link>
        </div>
      </div>
    </aside>
  );
}
