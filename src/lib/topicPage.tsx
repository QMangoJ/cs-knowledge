import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Player, type PlayerNav } from "@/components/player/Player";
import { TopicBelow, type PathNav } from "@/components/player/TopicBelow";
import type { TopicLinks } from "@/components/coherence/Panorama";
import { findTopic, loadContent, pageTopics, subjectPath } from "./content";
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
  const { sources, subjects } = loadContent();
  const info = subjects.find((s) => s.id === topic.subject);
  if (!info) notFound();
  const all = pageTopics();
  const links: TopicLinks = Object.fromEntries(all.map((x) => [x.id, { id: x.id, title: x.title, href: stepPath(x.subject, x.slug, 0) }]));
  const path = subjectPath(all, subject);
  const si = path.indexOf(topic);
  const prevT = si > 0 ? path[si - 1]! : null;
  const nextT = si >= 0 && si < path.length - 1 ? path[si + 1]! : null;
  const blockName = info.blocks.find((b) => b.topics.includes(topic.id))?.name ?? "";
  const nav: PathNav = {
    station: si + 1, totalStations: path.length,
    prev: prevT ? { id: prevT.id, title: prevT.title, href: stepPath(prevT.subject, prevT.slug, 0) } : null,
    next: nextT ? { id: nextT.id, title: nextT.title, href: stepPath(nextT.subject, nextT.slug, 0) } : null,
  };
  const playerNav: PlayerNav = {
    blockName, station: nav.station, totalStations: nav.totalStations,
    blocks: info.blocks.map((b) => ({
      name: b.name,
      topics: b.topics.filter((id) => links[id]).map((id) => links[id]!),
      gaps: b.gaps,
    })),
  };
  return (
    <>
      <Player topic={toView(topic)} initialStep={index} nextTopic={nav.next} nav={playerNav} />
      <TopicBelow topic={topic} sources={Object.fromEntries(sources)} info={info} links={links} nav={nav} />
    </>
  );
}
