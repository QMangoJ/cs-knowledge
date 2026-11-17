import fs from "node:fs";
import path from "node:path";
import YAML from "yaml";
import { z } from "zod";
import { GlossaryEntry, SourceDef, SubjectsEnFile, SubjectsFile, Topic, checkTopic, type Issue, type JourneyStep, type SubjectInfo, type SubjectInfoEn, type Topic as TopicT } from "./schema";
import { MARKER_RE } from "./terms";
import type { Lang } from "@/i18n";

export class ContentError extends Error {}

export type Content = {
  topics: Topic[];
  /** English lesson overlays keyed by topic id (content/topics/** /en.yaml).
   *  Absent lessons fall back to the Chinese canonical topic at render time. */
  topicsEn: Map<string, Topic>;
  sources: Map<string, SourceDef>;
  subjects: SubjectInfo[];
  journey: JourneyStep[];
  subjectsEn: SubjectInfoEn[];
  journeyEn: JourneyStep[];
  issues: Issue[];
  glossary: Map<string, GlossaryEntry>;
};

/** Subjects/journey in the requested language: English fields from
 *  subjects.en.yaml where present, Chinese canonical values everywhere else. */
export function localizedSubjects(c: Content, lang: Lang): SubjectInfo[] {
  if (lang === "zh") return c.subjects;
  const enById = new Map(c.subjectsEn.map((s) => [s.id, s]));
  return c.subjects.map((s) => {
    const en = enById.get(s.id);
    if (!en) return s;
    return {
      ...s,
      tagline: en.tagline,
      blocks: s.blocks.map((b, i) => {
        const eb = en.blocks[i];
        return eb ? { ...b, name: eb.name, blurb: eb.blurb, gaps: eb.gaps.length ? eb.gaps : b.gaps } : b;
      }),
    };
  });
}

export function localizedJourney(c: Content, lang: Lang): JourneyStep[] {
  if (lang === "zh") return c.journey;
  const enBySubject = new Map(c.journeyEn.map((j) => [j.subject, j]));
  return c.journey.map((j) => enBySubject.get(j.subject) ?? j);
}

/** The topic to render for a language: the en.yaml overlay when it exists. */
export function topicForLang(c: Content, topic: Topic, lang: Lang): Topic {
  if (lang === "zh") return topic;
  return c.topicsEn.get(topic.id) ?? topic;
}

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

function walk(dir: string): { file: string; lang: Lang }[] {
  if (!fs.existsSync(dir)) return [];
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap((e) => {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) return walk(p);
    if (e.name === "zh.yaml") return [{ file: p, lang: "zh" as Lang }];
    if (e.name === "en.yaml") return [{ file: p, lang: "en" as Lang }];
    return [];
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
  // English overlay for subjects/journey (optional file; validated against the
  // Chinese canonical structure so a drifted translation fails the build).
  let subjectsEn: SubjectInfoEn[] = [];
  let journeyEn: JourneyStep[] = [];
  const enSubPath = path.join(root, "subjects.en.yaml");
  if (fs.existsSync(enSubPath)) {
    const enParsed = SubjectsEnFile.safeParse(YAML.parse(fs.readFileSync(enSubPath, "utf8")));
    if (!enParsed.success) {
      for (const e of enParsed.error.issues) issues.push({ level: "error", where: `subjects.en.yaml ${e.path.join(".")}`, msg: e.message });
    } else {
      subjectsEn = enParsed.data.subjects;
      journeyEn = enParsed.data.journey;
      const zhById = new Map(subjects.map((s) => [s.id, s]));
      for (const es of subjectsEn) {
        const zs = zhById.get(es.id);
        if (!zs) { issues.push({ level: "error", where: "subjects.en.yaml", msg: `英文学科 ${es.id} 在 subjects.yaml 里不存在` }); continue; }
        if (es.blocks.length !== zs.blocks.length) issues.push({ level: "error", where: `subjects.en.yaml ${es.id}`, msg: `英文板块数 ${es.blocks.length} 与中文 ${zs.blocks.length} 不一致（按位置对齐）` });
      }
      const zhJourneySubjects = new Set(journey.map((j) => j.subject));
      for (const ej of journeyEn) {
        if (!zhJourneySubjects.has(ej.subject)) issues.push({ level: "error", where: "subjects.en.yaml journey", msg: `英文 journey 的学科 ${ej.subject} 不在中文 journey 里` });
      }
    }
  }
  // Glossary: the merged glossary.yaml plus per-subject glossary-frag-*.yaml fragments.
  const glossary = new Map<string, GlossaryEntry>();
  const glossFiles = ["glossary.yaml", ...fs.readdirSync(root).filter((f) => /^glossary-frag-.+\.yaml$/.test(f)).sort()];
  for (const gf of glossFiles) {
    const gp = path.join(root, gf);
    if (!fs.existsSync(gp)) continue;
    const gParsed = z.array(GlossaryEntry).safeParse(YAML.parse(fs.readFileSync(gp, "utf8")));
    if (!gParsed.success) {
      for (const e of gParsed.error.issues) issues.push({ level: "error", where: `${gf} ${e.path.join(".")}`, msg: e.message });
      continue;
    }
    for (const entry of gParsed.data) {
      const prev = glossary.get(entry.term);
      if (prev && (prev.full !== entry.full || prev.explain !== entry.explain)) {
        issues.push({ level: "error", where: gf, msg: `术语「${entry.term}」在多处定义且内容不一致（先见 full=${prev.full}）` });
      } else glossary.set(entry.term, entry);
    }
  }
  const topics: Topic[] = [];
  const topicsEn = new Map<string, Topic>();
  const files = walk(path.join(root, "topics")).sort((a, b) => a.file.localeCompare(b.file));
  for (const { file, lang } of files) {
    const rel = path.relative(root, file);
    const r = Topic.safeParse(YAML.parse(fs.readFileSync(file, "utf8")));
    if (!r.success) {
      for (const e of r.error.issues) issues.push({ level: "error", where: `${rel} ${e.path.join(".")}`, msg: e.message });
      continue;
    }
    issues.push(...checkTopic(r.data, sources));
    // English overlays skip the cross-topic coherence and glossary-marker
    // scans below: those run on the Chinese canonical tree only (the English
    // glossary does not exist yet; revisit when the first subject is translated).
    if (lang === "en") topicsEn.set(r.data.id, r.data);
    else topics.push(r.data);
  }
  topics.sort((a, b) => a.subject.localeCompare(b.subject) || a.order - b.order);
  issues.push(...checkCoherence(topics, subjects));
  // Term markers: every [[...]] in any topic text field must be well-formed and in the glossary.
  // Scan string values (not the JSON serialization, whose nested arrays contain literal "[["),
  // and skip code blocks, whose [[...]] array syntax is not a marker.
  const collectTexts = (v: unknown, out: string[]): void => {
    if (typeof v === "string") out.push(v);
    else if (Array.isArray(v)) for (const x of v) collectTexts(x, out);
    else if (v && typeof v === "object") for (const [k, x] of Object.entries(v)) if (k !== "code") collectTexts(x, out);
  };
  for (const t of topics) {
    const texts: string[] = [];
    collectTexts(t, texts);
    let opens = 0;
    const marks: RegExpMatchArray[] = [];
    for (const s of texts) {
      opens += (s.match(/\[\[/g) ?? []).length;
      marks.push(...s.matchAll(MARKER_RE));
    }
    if (opens !== marks.length) issues.push({ level: "error", where: t.id, msg: `有 ${opens - marks.length} 处 [[ 标记未闭合或格式错误` });
    for (const m of marks) {
      const key = (m[2] ?? m[1])!.trim();
      if (!glossary.has(key)) issues.push({ level: "error", where: t.id, msg: `术语标记 [[${key}]] 不在术语表（glossary.yaml / glossary-frag-*.yaml）` });
    }
  }
  return { topics, topicsEn, sources, subjects, journey, subjectsEn, journeyEn, issues, glossary };
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
