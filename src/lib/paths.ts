import { langPrefix, type Lang } from "@/i18n";

/** Step index is 0-based; URL step number is 1-based; step 1 lives at the topic root.
 *  The English tree mirrors the Chinese one under /en (lang defaults to zh). */
export function stepPath(subject: string, slug: string, index: number, lang: Lang = "zh"): string {
  const base = index === 0 ? `/${subject}/${slug}/` : `/${subject}/${slug}/${index + 1}/`;
  return langPrefix(lang) + base;
}
export function issueUrl(repo: string, topicId: string, stepNo: number, stepTitle: string): string {
  const q = new URLSearchParams({ template: "content-error.yml", title: `[内容纠错] ${topicId} 第 ${stepNo} 步：${stepTitle}`, topic: topicId, step: String(stepNo) });
  return `${repo}/issues/new?${q.toString()}`;
}
