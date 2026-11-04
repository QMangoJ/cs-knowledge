import fs from "node:fs";
import path from "node:path";
import YAML from "yaml";
import { z } from "zod";
import { SourceDef, Topic, checkTopic, type Issue } from "./schema";

export class ContentError extends Error {}

export type Content = { topics: Topic[]; sources: Map<string, SourceDef>; issues: Issue[] };

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
  return { topics, sources, issues };
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
