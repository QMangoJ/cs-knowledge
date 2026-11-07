import fs from "node:fs";
import path from "node:path";
import YAML from "yaml";
import { z } from "zod";
import { SourceDef, SubjectsFile, Topic, checkTopic, type Issue, type JourneyStep, type SubjectInfo, type Topic as TopicT } from "./schema";

export class ContentError extends Error {}

export type Content = { topics: Topic[]; sources: Map<string, SourceDef>; subjects: SubjectInfo[]; journey: JourneyStep[]; issues: Issue[] };

/** Recommended path inside a subject: its pageable topics in `order` sequence. */
export function subjectPath(topics: TopicT[], subject: string): TopicT[] {
  return topics.filter((t) => t.subject === subject && t.status !== "coming-soon").sort((a, b) => a.order - b.order);
}

/** Cross-topic coherence rules: panorama coverage, bridge ends, and an anti-boilerplate
 *  duplicate-sentence gate over position/bridge texts (the 148x filler incident must not recur). */
export function checkCoherence(topics: TopicT[], subjects: SubjectInfo[]): Issue[] {
  const out: Issue[] = [];
  const hard = (where: string, msg: string) => out.push({ level: "error", where, msg });
  const byId = new Map(topics.map((t) => [t.id, t]));
  const seenBlock = new Map<string, string>();
  for (const s of subjects) {
    for (const b of s.blocks) {
      for (const id of b.topics) {
        const t = byId.get(id);
        if (!t) { hard(`subjects.yaml ${s.id}/${b.name}`, `板块引用了不存在的课 ${id}`); continue; }
        if (t.subject !== s.id) hard(`subjects.yaml ${s.id}/${b.name}`, `${id} 不属于 ${s.id} 科`);
        if (seenBlock.has(id)) hard(`subjects.yaml ${s.id}/${b.name}`, `${id} 同时出现在「${seenBlock.get(id)}」与「${b.name}」`);
        seenBlock.set(id, b.name);
      }
    }
  }
  for (const t of topics) {
    if (t.status === "published" && !seenBlock.has(t.id)) hard(t.id, "published 课没有出现在本科全景的任何板块里");
  }
  for (const s of subjects) {
    const path = subjectPath(topics, s.id).filter((t) => t.status === "published");
    path.forEach((t, i) => {
      if (i > 0 && !t.bridge?.prev) hard(t.id, `是本科路径第 ${i + 1} 站，必须有 bridge.prev（回收上一课 ${path[i - 1]!.id} 的具体概念）`);
      if (i < path.length - 1 && !t.bridge?.next) hard(t.id, `是本科路径第 ${i + 1} 站，必须有 bridge.next（预告下一课 ${path[i + 1]!.id} 要解决的具体问题）`);
      if (i === 0 && t.bridge?.prev) hard(t.id, "是本科路径第一站，不应有 bridge.prev");
      if (i === path.length - 1 && t.bridge?.next) hard(t.id, "是本科路径最后一站，不应有 bridge.next");
    });
  }
  // Anti-boilerplate: no sentence (>=15 chars) may repeat across any two topics' position/bridge texts.
  const sentOwner = new Map<string, string>();
  for (const t of topics) {
    const texts: [string, string | undefined][] = [["position", t.position], ["bridge.prev", t.bridge?.prev], ["bridge.next", t.bridge?.next]];
    for (const [field, text] of texts) {
      if (!text) continue;
      for (const raw of text.split(/[。！？；]/)) {
        const s = raw.replace(/\s+/g, "").trim();
        if (s.length < 15) continue;
        const prev = sentOwner.get(s);
        if (prev && prev !== `${t.id}:${field}`) hard(`${t.id} ${field}`, `与 ${prev} 出现重复长句（套话查重）：「${s.slice(0, 40)}…」`);
        else sentOwner.set(s, `${t.id}:${field}`);
      }
    }
  }
  return out;
}

function walk(dir: string): string[] {
  if (!fs.existsSync(dir)) return [];
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap((e) => {
    const p = path.join(dir, e.name);
    return e.isDirectory() ? walk(p) : e.name === "zh.yaml" ? [p] : [];
  });
}

/** Reads and validates all content. Never throws on rule issues; use loadTopics() for build. */
export function readContent(root = path.join(process.cwd(), "content")): Content {
  const issues: Issue[] = [];
  const srcRaw = YAML.parse(fs.readFileSync(path.join(root, "sources.yaml"), "utf8"));
  const srcParsed = z.array(SourceDef).safeParse(srcRaw);
  if (!srcParsed.success) {
    for (const e of srcParsed.error.issues) issues.push({ level: "error", where: `sources.yaml ${e.path.join(".")}`, msg: e.message });
  }
  const sources = new Map((srcParsed.data ?? []).map((s) => [s.id, s]));
  const subParsed = SubjectsFile.safeParse(YAML.parse(fs.readFileSync(path.join(root, "subjects.yaml"), "utf8")));
  if (!subParsed.success) {
    for (const e of subParsed.error.issues) issues.push({ level: "error", where: `subjects.yaml ${e.path.join(".")}`, msg: e.message });
  }
  const subjects = subParsed.data?.subjects ?? [];
  const journey = subParsed.data?.journey ?? [];
  const topics: Topic[] = [];
  for (const file of walk(path.join(root, "topics")).sort()) {
    const rel = path.relative(root, file);
    const r = Topic.safeParse(YAML.parse(fs.readFileSync(file, "utf8")));
    if (!r.success) {
      for (const e of r.error.issues) issues.push({ level: "error", where: `${rel} ${e.path.join(".")}`, msg: e.message });
      continue;
    }
    issues.push(...checkTopic(r.data, sources));
    topics.push(r.data);
  }
  topics.sort((a, b) => a.subject.localeCompare(b.subject) || a.order - b.order);
  issues.push(...checkCoherence(topics, subjects));
  return { topics, sources, subjects, journey, issues };
}

let cache: Content | undefined;
/** Build-time entry: prints warnings, throws with ALL errors listed. */
export function loadContent(): Content {
  if (cache) return cache;
  const c = readContent();
  for (const i of c.issues.filter((i) => i.level === "warn")) console.warn(`[content-warn] ${i.where}: ${i.msg}`);
  const errs = c.issues.filter((i) => i.level === "error");
  if (errs.length) throw new ContentError(`内容校验失败（${errs.length} 处）:\n` + errs.map((i) => `  [content-error] ${i.where}: ${i.msg}`).join("\n"));
  cache = c;
  return c;
}

/** Topics that get pages. Drafts are included unless CS_PRODUCTION=1 (deploy build). */
export function pageTopics(): Topic[] {
  const prod = process.env.CS_PRODUCTION === "1";
  const list = loadContent().topics.filter((t) => t.status === "published" || (!prod && t.status === "draft"));
  if (prod && list.length === 0) throw new ContentError("CS_PRODUCTION=1 但没有 published 主题：上线构建需要至少一个经 Daniel 签字的主题。");
  return list;
}

export function findTopic(subject: string, slug: string): Topic | undefined {
  return pageTopics().find((t) => t.subject === subject && t.slug === slug);
}
