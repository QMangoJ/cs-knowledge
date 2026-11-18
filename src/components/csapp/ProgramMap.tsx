"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useLang } from "@/i18n/client";
import { prefixPath } from "@/i18n";
import type { CsappIndex } from "@/lib/csapp/types";
import { chapterProgress } from "@/lib/csapp/progress";

/** Prototype map: chapter 1 is the full-route tour row, the rest sit in the
 *  five stages. Hover syncs with the sidebar via csapp-map-* / csapp-sb-* events. */
export function ProgramMap({ index }: { index: CsappIndex }) {
  const { lang } = useLang();
  const base = prefixPath(lang, "/csapp");
  const [hover, setHover] = useState<number | null>(null);
  const [prog, setProg] = useState<Record<number, number>>({});

  useEffect(() => {
    const map: Record<number, number> = {};
    for (const c of index.chapters) map[c.id] = chapterProgress(c.id);
    setProg(map);
  }, [index]);

  useEffect(() => {
    const onHover = (e: Event) => setHover(Number((e as CustomEvent).detail));
    const onLeave = () => setHover(null);
    document.addEventListener("csapp-sb-hover", onHover);
    document.addEventListener("csapp-sb-leave", onLeave);
    return () => {
      document.removeEventListener("csapp-sb-hover", onHover);
      document.removeEventListener("csapp-sb-leave", onLeave);
    };
  }, []);

  const ch = (id: number) => index.chapters.find((c) => c.id === id);
  const enter = (id: number) => { setHover(id); document.dispatchEvent(new CustomEvent("csapp-map-hover", { detail: id })); };
  const leave = () => { setHover(null); document.dispatchEvent(new Event("csapp-map-leave")); };
  const tour = ch(1);
  const p1 = prog[1] ?? 0;

  return (
    <section className="map" id="csapp-map">
      {tour && (
        <Link href={`${base}/1/`} className={`map-tour spot${hover === 1 ? " is-hover" : ""}`} data-ch={1}
          onPointerEnter={(e) => { if (e.pointerType === "mouse") enter(1); }}
          onPointerLeave={(e) => { if (e.pointerType === "mouse") leave(); }}
          onFocus={() => enter(1)} onBlur={leave}>
          <span className="node-no">01</span>
          <span className="mt-name">{tour.title}</span>
          <span className="mt-tag">全程导览 · {tour.subtitle}</span>
          {p1 > 0 && <span className="mt-prog">{p1}%</span>}
        </Link>
      )}
      <div className="map-stages">
        {index.stages.map((st) => (
          <div key={st.id} className="stage" data-stage={st.id}>
            <div className="stage-head"><span className="stage-no">{st.id}</span><b>{st.title}</b><small>{st.blurb}</small></div>
            <div className="stage-nodes">
              {st.chapters.filter((id) => id !== 1).map((id) => {
                const p = prog[id] ?? 0;
                return (
                  <Link key={id} href={`${base}/${id}/`} data-ch={id}
                    className={`spot node${hover === id ? " is-hover" : ""}${p > 0 ? " is-started" : ""}`}
                    onPointerEnter={(e) => { if (e.pointerType === "mouse") enter(id); }}
                    onPointerLeave={(e) => { if (e.pointerType === "mouse") leave(); }}
                    onFocus={() => enter(id)} onBlur={leave}>
                    <span className="node-no">{String(id).padStart(2, "0")}</span>
                    <span className="node-name">{ch(id)?.title}</span>
                    <span className="node-tag">{ch(id)?.subtitle}</span>
                  </Link>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
