import { notFound } from "next/navigation";
import { PROBLEMS, problemBySlug } from "@/lib/coding/problems";
import { ProblemRunner } from "@/components/coding/ProblemRunner";
import Link from "next/link";

export const dynamicParams = false;
export function generateStaticParams() { return PROBLEMS.map((p) => ({ slug: p.slug })); }
type P = { params: Promise<{ slug: string }> };
export async function generateMetadata({ params }: P) {
  const { slug } = await params; const p = problemBySlug(slug);
  return p ? { title: `${p.title} · 面试刷题 · 计算机科学`, description: `${p.titleZh}：${p.lesson}，目标复杂度 ${p.complexity}` } : {};
}
export default async function Page({ params }: P) {
  const { slug } = await params; const p = problemBySlug(slug);
  if (!p) notFound();
  return (
    <div className="coding-wrap">
      <p className="eyebrow"><Link href="/coding/">← 面试刷题</Link> · {p.lesson}</p>
      <h1>{p.title} · {p.titleZh}</h1>
      <p className="summary">目标复杂度：{p.complexity}</p>
      <section aria-label="题面">
        {p.statement.map((s, i) => (
          <div key={i} className="stmt-pair"><p className="en">{s.en}</p><p className="zh">{s.zh}</p></div>
        ))}
        <h3>示例</h3>
        <ul>{p.examples.map((e, i) => <li key={i}><code>{e.input}</code> → <code>{e.output}</code></li>)}</ul>
      </section>
      <ProblemRunner problem={p} />
    </div>
  );
}
