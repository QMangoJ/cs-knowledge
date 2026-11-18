"use client";

import { useEffect } from "react";
import { markRead } from "@/lib/csapp/progress";
import { SECTION_IDS } from "@/lib/csapp/types";

export function ScrollSpy({ ch, onActive }: { ch: number; onActive: (id: string) => void }) {
  useEffect(() => {
    const ids = SECTION_IDS.filter((x) => x !== "quiz");
    const nodes = ids.map((id) => document.getElementById(id)).filter(Boolean) as HTMLElement[];
    if (!nodes.length) return;
    const io = new IntersectionObserver(
      (entries) => {
        const visible = entries.filter((e) => e.isIntersecting).sort((a, b) => b.intersectionRatio - a.intersectionRatio);
        if (visible[0]?.target?.id) {
          onActive(visible[0].target.id);
          markRead(ch, visible[0].target.id);
        }
      },
      { rootMargin: "-20% 0px -55% 0px", threshold: [0, 0.25, 0.5, 1] },
    );
    nodes.forEach((n) => io.observe(n));
    return () => io.disconnect();
  }, [ch, onActive]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "j" || e.key === "J" || e.key === "k" || e.key === "K") {
        const ids = [...SECTION_IDS];
        const cur = document.querySelector(".sb-secs a.is-active")?.getAttribute("href")?.replace("#", "") || "mainline";
        const i = ids.indexOf(cur as (typeof ids)[number]);
        const next = e.key.toLowerCase() === "j" ? Math.min(ids.length - 1, i + 1) : Math.max(0, i - 1);
        const id = ids[next]!;
        if (id === "quiz") location.href = `${location.pathname.includes('/en/') ? '/en' : ''}/csapp/${ch}/quiz/`;
        else document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" });
      } else if (e.key === "q" || e.key === "Q") {
        location.href = `${location.pathname.includes('/en/') ? '/en' : ''}/csapp/${ch}/quiz/`;
      } else if (e.key === "[") {
        if (ch > 1) location.href = `${location.pathname.includes('/en/') ? '/en' : ''}/csapp/${ch - 1}/`;
      } else if (e.key === "]") {
        if (ch < 12) location.href = `${location.pathname.includes('/en/') ? '/en' : ''}/csapp/${ch + 1}/`;
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [ch]);

  return null;
}
