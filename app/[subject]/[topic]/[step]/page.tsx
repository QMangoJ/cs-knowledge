import { pageTopics } from "@/lib/content";
import { TopicPage, topicMetadata } from "@/lib/topicPage";

export const dynamicParams = false;
type P = { params: Promise<{ subject: string; topic: string; step: string }> };

/** Steps 2..N; step 1 is the topic root. */
export function generateStaticParams() {
  return pageTopics().flatMap((x) => x.steps.slice(1).map((_, i) => ({ subject: x.subject, topic: x.slug, step: String(i + 2) })));
}
export async function generateMetadata({ params }: P) {
  const { subject, topic, step } = await params;
  return topicMetadata(subject, topic, Number(step) - 1);
}
export default async function Page({ params }: P) {
  const { subject, topic, step } = await params;
  return <TopicPage subject={subject} slug={topic} index={Number(step) - 1} />;
}
