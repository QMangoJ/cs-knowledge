import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { PROBLEMS, problemBySlug, type Problem } from "@/lib/coding/problems";
import { CodingIndex } from "@/components/coding/CodingIndex";
import { ProblemRunner } from "@/components/coding/ProblemRunner";
import { prefixPath, stringsFor, type Lang } from "@/i18n";

/** Shared bodies for the coding pages in both language trees
 *  (app/(zh)/coding and app/(en)/en/coding are thin wrappers). */

export function codingMetadata(lang: Lang): Metadata {
  const s = stringsFor(lang);
  return { title: s.codingMetaTitle, description: s.codingMetaDesc };
}

export function CodingIndexPage({ lang }: { lang: Lang }) {
  return <CodingIndex problems={PROBLEMS} />;
}

export function codingProblemMetadata(slug: string, lang: Lang): Metadata {
  const p = problemBySlug(slug);
  if (!p) return {};
  const s = stringsFor(lang);
  return {
    title: `${p.title} · ${s.coding} · ${s.siteName}`,
    description: lang === "en"
      ? `${p.title} — ${p.lesson}; target complexity ${p.complexity}`
      : `${p.titleZh}：${p.lesson}，目标复杂度 ${p.complexity}`,
  };
}

export function CodingProblemPage({ slug, lang }: { slug: string; lang: Lang }) {
  const p: Problem | undefined = problemBySlug(slug);
  if (!p) notFound();
  const s = stringsFor(lang);
  return (
    <div className="coding-wrap">
      <p className="eyebrow"><Link href={prefixPath(lang, "/coding/")}>{s.backToCoding}</Link> · {p.lesson}</p>
      <h1>{lang === "en" ? p.title : `${p.title} · ${p.titleZh}`}</h1>
      <p className="summary">{s.targetComplexity}{p.complexity}</p>
      <section aria-label={s.statementLabel}>
        {p.statement.map((st, i) => (
          <div key={i} className="stmt-pair"><p className="en">{st.en}</p>{lang === "zh" && <p className="zh">{st.zh}</p>}</div>
        ))}
        <h3>{s.examplesTitle}</h3>
        <ul>{p.examples.map((e, i) => <li key={i}><code>{e.input}</code> → <code>{e.output}</code></li>)}</ul>
      </section>
      <ProblemRunner problem={p} />
    </div>
  );
}
