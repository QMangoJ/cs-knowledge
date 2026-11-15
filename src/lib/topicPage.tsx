import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Player, type PlayerNav } from "@/components/player/Player";
import { findTopic, loadContent, pageTopics, subjectPath } from "./content";
import { toView } from "./view";
import { stepPath } from "./paths";
import { t } from "@/i18n";

/** Course page = the fullscreen player only. Overview/design/terminal live inside the
 *  synthesized step list (see lib/view.ts); cross-topic wayfinding is the site menu plus
 *  the player's own next-topic button on the last step. */
export function topicMetadata(subject: string, slug: string, index: number): Metadata {
  const topic = findTopic(subject, slug);
  if (!topic) return {};
  const step = toView(topic, loadContent().sources).steps[index];
  if (!step) return {};
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
  if (!topic) notFound();
  const { sources, subjects } = loadContent();
  const info = subjects.find((s) => s.id === topic.subject);
  if (!info) notFound();
  const view = toView(topic, sources);
  if (!view.steps[index]) notFound();
  const all = pageTopics();
  const path = subjectPath(all, subject);
  const si = path.indexOf(topic);
  const nextT = si >= 0 && si < path.length - 1 ? path[si + 1]! : null;
  const blockName = info.blocks.find((b) => b.topics.includes(topic.id))?.name ?? "";
  const playerNav: PlayerNav = { blockName, station: si + 1, totalStations: path.length };
  const nextTopic = nextT ? { href: stepPath(nextT.subject, nextT.slug, 0), title: nextT.title } : null;
  return <Player topic={view} initialStep={index} nextTopic={nextTopic} nav={playerNav} />;
}
