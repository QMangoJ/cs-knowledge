"use client";

import Link from "next/link";
import { useCallback, useState } from "react";
import { useLang } from "@/i18n/client";
import { prefixPath } from "@/i18n";
import type { Chapter, CsappIndex } from "@/lib/csapp/types";
import { Md } from "@/lib/csapp/md";
import { markRead } from "@/lib/csapp/progress";
import { Sidebar } from "./Sidebar";
import { Spotlight } from "./Spotlight";
import { CsappShell } from "./CsappShell";
import { ScrollSpy } from "./ScrollSpy";
import { MobileScrollMenu } from "./MobileScrollMenu";
import { Pipeline, StorageHierarchy, LatencyBars } from "./Diagrams";

export function ChapterView({ index, chapter }: { index: CsappIndex; chapter: Chapter }) {
  const { lang } = useLang();
  const base = prefixPath(lang, "/csapp");
  const home = prefixPath(lang, "/");
  const [active, setActive] = useState("mainline");
  const onActive = useCallback((id: string) => setActive(id), []);
  const ch = chapter.id;
  const prev = index.chapters.find((c) => c.id === ch - 1);
  const next = index.chapters.find((c) => c.id === ch + 1);

  return (
    <CsappShell>
      <Spotlight />
      <ScrollSpy ch={ch} onActive={onActive} />
      <Sidebar index={index} current={ch} activeSection={active} mode="chapter" />
      <div className="main">
        <div className="topbar">
          <div className="crumbs">
            <Link href={`${base}/`}>CSAPP</Link>
            <span>/</span>
            <span>第 {ch} 章</span>
          </div>
          <div className="tb-r">
            {prev && <Link href={`${base}/${prev.id}/`}><kbd>[</kbd> 上一章</Link>}
            {next && <Link href={`${base}/${next.id}/`}>下一章 <kbd>]</kbd></Link>}
          </div>
          <div className="tb-progress" aria-hidden="true"><i style={{ width: "0%" }} /></div>
        </div>

        <article className="ch-article">
          <header className="ch-hero">
            <div className="ch-kicker">第 {ch} 章</div>
            <h1>{chapter.title}</h1>
            <p className="lede">{chapter.oneLiner}</p>
          </header>

          <section id="mainline" className="ch-sec">
            <h2>本章主线</h2>
            <ol className="mainline">
              {chapter.mainline.map((x, i) => (
                <li key={i}><span className="ml-n">{i + 1}</span><p>{x}</p></li>
              ))}
            </ol>
          </section>

          <section id="concepts" className="ch-sec">
            <h2>核心概念</h2>
            <Md md={chapter.conceptsMd} className="prose" />
            {ch === 1 && (
              <>
                <h3>编译流水线</h3>
                <Pipeline />
                <h3>存储层次</h3>
                <StorageHierarchy />
                <h3>延迟数量级</h3>
                <LatencyBars />
              </>
            )}
          </section>

          <section id="backend" className="ch-sec">
            <h2>后端 / 全栈视角</h2>
            <div className="callout callout-back spot">
              <Md md={chapter.backendMd} className="prose" />
            </div>
          </section>

          <section id="frontend" className="ch-sec">
            <h2>和前端的关系</h2>
            <div className="callout callout-front card spot">
              <Md md={chapter.frontendMd} className="prose" />
            </div>
          </section>

          <section id="interview" className="ch-sec">
            <h2>面试常考点</h2>
            <ul className="chips">
              {chapter.interview.map((x, i) => (
                <li key={i}><Link href={`${base}/${ch}/quiz/`} className="chip" onClick={() => markRead(ch, "interview")}>{x}</Link></li>
              ))}
            </ul>
          </section>

          <section id="quiz" className="ch-sec">
            <div className="quiz-entry card spot">
              <h2>自测 8 题</h2>
              <p>一题一卡：先想，再翻答案，最后自评会了 / 模糊 / 不会。</p>
              <Link className="btn" href={`${base}/${ch}/quiz/`} onClick={() => markRead(ch, "quiz")}>开始自测 <kbd>Q</kbd></Link>
            </div>
          </section>

          <section id="refs" className="ch-sec">
            <h2>对应小节</h2>
            <ul className="refs">
              {chapter.refs.map((x) => <li key={x}>{x}</li>)}
            </ul>
          </section>

          <nav className="ch-next">
            {next ? (
              <Link href={`${base}/${next.id}/`} className="card spot">
                <span>下一章</span>
                <b>第 {next.id} 章 · {next.title}</b>
                <span>{next.subtitle}</span>
              </Link>
            ) : (
              <Link href={`${base}/`} className="card spot"><span>已是最后一章</span><b>返回总览</b></Link>
            )}
          </nav>
        </article>

        <aside className="rail">
          <div className="rail-card">
            <div className="rail-label">本章</div>
            <ol>
              <li><a href="#mainline">主线</a></li>
              <li><a href="#concepts">概念</a></li>
              <li><a href="#backend">后端</a></li>
              <li><a href="#frontend">前端</a></li>
              <li><a href="#interview">面试</a></li>
              <li><a href={`${base}/${ch}/quiz/`}>自测</a></li>
              <li><a href="#refs">小节</a></li>
            </ol>
            <p className="rail-keys"><kbd>J</kbd>/<kbd>K</kbd> 节 · <kbd>Q</kbd> 自测</p>
          </div>
        </aside>
      </div>
      <MobileScrollMenu
        title="本章目录"
        items={[
          { id: "mainline", short: "主线", label: "本章主线" },
          { id: "concepts", short: "概念", label: "核心概念" },
          { id: "backend", short: "后端", label: "后端 / 全栈视角" },
          { id: "frontend", short: "前端", label: "和前端的关系" },
          { id: "interview", short: "面试", label: "面试常考点" },
          { id: "quiz", short: "自测", label: "自测 8 题" },
          { id: "refs", short: "小节", label: "对应小节" },
        ]}
        actions={[
          { label: "开始自测 →", href: `${base}/${ch}/quiz/` },
          { label: "十二章总览", href: `${base}/` },
        ]}
        onSelectSection={(id) => { setActive(id); markRead(ch, id); }}
      />
    </CsappShell>
  );
}
