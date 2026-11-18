import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { allChapterIds, loadChapter, loadCsappIndex } from "@/lib/csapp/content";
import { ChapterView } from "@/components/csapp/ChapterView";

type P = { params: Promise<{ ch: string }> };

export function generateStaticParams() {
  return allChapterIds().map((ch) => ({ ch: String(ch) }));
}

export async function generateMetadata({ params }: P): Promise<Metadata> {
  const { ch } = await params;
  const id = Number(ch);
  if (!Number.isInteger(id) || id < 1 || id > 12) return {};
  const c = loadChapter(id);
  return { title: `第 ${id} 章 · ${c.title} · CSAPP`, description: c.oneLiner };
}

export default async function Page({ params }: P) {
  const { ch } = await params;
  const id = Number(ch);
  if (!Number.isInteger(id) || id < 1 || id > 12) notFound();
  return <ChapterView index={loadCsappIndex()} chapter={loadChapter(id)} />;
}
