import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Player } from "@/components/player/Player";
import { findTopic, loadContent, pageTopics } from "./content";
import { toView } from "./view";
import { stepPath } from "./paths";
import { t } from "@/i18n";

export function topicMetadata(subject: string, slug: string, index: number): Metadata {
  const topic = findTopic(subject, slug);
  const step = topic?.steps[index];
  if (!topic || !step) return {};
  const title = `${step.title} · ${topic.title} · ${t.siteName}`;
  return {
    title,
    description: step.tldr,
    alternates: { canonical: stepPath(subject, slug, index) },
    openGraph: { title, description: step.tldr, images: [`/og/${topic.subject}-${topic.slug}.png`], type: "article" },
    robots: topic.status === "published" ? undefined : { index: false },
  };
}

export function TopicPage({ subject, slug, index }: { subject: string; slug: string; index: number }) {
  const topic = findTopic(subject, slug);
  if (!topic || !topic.steps[index]) notFound();
  const all = pageTopics();
  const i = all.indexOf(topic);
  const n = all[i + 1];
  const { sources } = loadContent();
  return (
    <Player topic={toView(topic)} sources={Object.fromEntries(sources)} initialStep={index}
      nextTopic={n ? { href: stepPath(n.subject, n.slug, 0), title: n.title } : null} />
  );
}
