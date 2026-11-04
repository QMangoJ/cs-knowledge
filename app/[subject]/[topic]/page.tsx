import { pageTopics } from "@/lib/content";
import { TopicPage, topicMetadata } from "@/lib/topicPage";

export const dynamicParams = false;
type P = { params: Promise<{ subject: string; topic: string }> };

export function generateStaticParams() {
  return pageTopics().map((x) => ({ subject: x.subject, topic: x.slug }));
}
export async function generateMetadata({ params }: P) {
  const { subject, topic } = await params;
  return topicMetadata(subject, topic, 0);
}
export default async function Page({ params }: P) {
  const { subject, topic } = await params;
  return <TopicPage subject={subject} slug={topic} index={0} />;
}
