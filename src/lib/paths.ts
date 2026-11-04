/** Step index is 0-based; URL step number is 1-based; step 1 lives at the topic root. */
export function stepPath(subject: string, slug: string, index: number): string {
  return index === 0 ? `/${subject}/${slug}/` : `/${subject}/${slug}/${index + 1}/`;
}
export function issueUrl(repo: string, topicId: string, stepNo: number, stepTitle: string): string {
  const q = new URLSearchParams({ template: "content-error.yml", title: `[内容纠错] ${topicId} 第 ${stepNo} 步：${stepTitle}`, topic: topicId, step: String(stepNo) });
  return `${repo}/issues/new?${q.toString()}`;
}
