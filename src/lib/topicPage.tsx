import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Player, type PlayerNav } from "@/components/player/Player";
import { ReaderV2, type ReaderNavData } from "@/components/player/ReaderV2";
import { isV2Reader } from "./ui-v2";
import { findTopic, loadContent, pageTopics, subjectPath } from "./content";
import { toView } from "./view";
import { plainText } from "./terms";
import { stepPath } from "./paths";
import { t } from "@/i18n";

/** Course page = the fullscreen player only. Overview/design/terminal live inside the
 *  synthesized step list (see lib/view.ts); cross-topic wayfinding is the site menu plus
 *  the player's own next-topic button on the last step. */
export function topicMetadata(subject: string, slug: string, index: number): Metadata {
  const topic = findTopic(subject, slug);
  if (!topic) return {};
  const step = toView(topic, loadContent().sources, loadContent().glossary).steps[index];
  if (!step) return {};
  const title = `${plainText(step.title)} · ${plainText(topic.title)} · ${t.siteName}`;
  const description = plainText(step.tldr);
  return {
    title,
    description,
    alternates: { canonical: stepPath(subject, slug, index) },
    openGraph: { title, description, images: [`/og/${topic.subject}-${topic.slug}.png`], type: "article" },
    robots: topic.status === "published" ? undefined : { index: false },
  };
}

export function TopicPage({ subject, slug, index }: { subject: string; slug: string; index: number }) {
  const topic = findTopic(subject, slug);
  if (!topic) notFound();
  const { sources, subjects, glossary } = loadContent();
  const info = subjects.find((s) => s.id === topic.subject);
  if (!info) notFound();
  const view = toView(topic, sources, glossary);
  if (!view.steps[index]) notFound();
  const all = pageTopics();
  const path = subjectPath(all, subject);
  const si = path.indexOf(topic);
  const nextT = si >= 0 && si < path.length - 1 ? path[si + 1]! : null;
  const blockName = info.blocks.find((b) => b.topics.includes(topic.id))?.name ?? "";
  const playerNav: PlayerNav = { blockName, station: si + 1, totalStations: path.length };
  const nextTopic = nextT ? { href: stepPath(nextT.subject, nextT.slug, 0), title: plainText(nextT.title) } : null;
  // UI v2 sample gate: exactly one topic renders through the new reader.
  if (isV2Reader(topic.id)) {
    const byId = new Map(path.map((x) => [x.id, x]));
    const pick = (id: string) => {
      const x = byId.get(id);
      return x ? { id: x.id, subject: x.subject, slug: x.slug, title: x.title } : null;
    };
    const blocks = info.blocks.map((b) => ({
      name: b.name,
      topics: b.topics.map(pick).filter((x): x is NonNullable<typeof x> => !!x),
    }));
    const grouped = new Set(blocks.flatMap((b) => b.topics.map((x) => x.id)));
    const readerNav: ReaderNavData = {
      blocks,
      ungrouped: path.filter((x) => !grouped.has(x.id)).map((x) => ({ id: x.id, subject: x.subject, slug: x.slug, title: x.title })),
    };
    return <ReaderV2 topic={view} initialStep={index} nextTopic={nextTopic} nav={playerNav} readerNav={readerNav} />;
  }
  return <Player topic={view} initialStep={index} nextTopic={nextTopic} nav={playerNav} />;
}
