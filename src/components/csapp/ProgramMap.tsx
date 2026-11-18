"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useLang } from "@/i18n/client";
import { prefixPath } from "@/i18n";
import type { CsappIndex } from "@/lib/csapp/types";
import { chapterProgress } from "@/lib/csapp/progress";

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

  const titleOf = (id: number) => index.chapters.find((c) => c.id === id)?.title ?? "";

  return (
    <div className="map card spot">
      <div className="map-head">
        <h2>一个程序的一生</h2>
        <p className="muted">从比特到并发：悬停节点会同步左侧目录</p>
      </div>
      <div className="map-stages">
        {index.stages.map((st) => (
          <div key={st.id} className="map-stage">
            <div className="map-stage-h">
              <span className="map-roman">{st.id}</span>
              <div>
                <b>{st.title}</b>
                <span>{st.blurb}</span>
              </div>
            </div>
            <div className="map-nodes">
              {st.chapters.map((id) => {
                const p = prog[id] ?? 0;
                const isHover = hover === id;
                return (
                  <Link
                    key={id}
                    href={`${base}/${id}/`}
                    className={`node spot${isHover ? " is-hover" : ""}${p > 0 ? " is-started" : ""}`}
                    data-ch={id}
                    onMouseEnter={() => {
                      setHover(id);
                      document.dispatchEvent(new CustomEvent("csapp-map-hover", { detail: id }));
                    }}
                    onMouseLeave={() => {
                      setHover(null);
                      document.dispatchEvent(new Event("csapp-map-leave"));
                    }}
                  >
                    <span className="node-num">{String(id).padStart(2, "0")}</span>
                    <span className="node-title">{titleOf(id)}</span>
                    {p > 0 && <span className="node-pct">{p}%</span>}
                  </Link>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
