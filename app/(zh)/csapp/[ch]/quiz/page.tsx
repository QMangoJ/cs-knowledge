import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { allChapterIds, loadChapter, loadCsappIndex } from "@/lib/csapp/content";
import { QuizView } from "@/components/csapp/QuizView";

type P = { params: Promise<{ ch: string }> };

export function generateStaticParams() {
  return allChapterIds().map((ch) => ({ ch: String(ch) }));
}

export async function generateMetadata({ params }: P): Promise<Metadata> {
  const { ch } = await params;
  const id = Number(ch);
  if (!Number.isInteger(id) || id < 1 || id > 12) return {};
  const c = loadChapter(id);
  return { title: `自测 · 第 ${id} 章 ${c.title} · CSAPP`, description: `第 ${id} 章自测 8 题` };
}

export default async function Page({ params }: P) {
  const { ch } = await params;
  const id = Number(ch);
  if (!Number.isInteger(id) || id < 1 || id > 12) notFound();
  return <QuizView index={loadCsappIndex()} chapter={loadChapter(id)} />;
}
