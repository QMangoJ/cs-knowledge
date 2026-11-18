import { notFound } from "next/navigation";
import { allChapterIds, loadChapter, loadCsappIndex } from "@/lib/csapp/content";
import { ChapterView } from "@/components/csapp/ChapterView";
type P = { params: Promise<{ ch: string }> };
export function generateStaticParams() { return allChapterIds().map((ch) => ({ ch: String(ch) })); }
export default async function Page({ params }: P) {
  const id = Number((await params).ch);
  if (!Number.isInteger(id) || id < 1 || id > 12) notFound();
  return <ChapterView index={loadCsappIndex()} chapter={loadChapter(id)} />;
}
