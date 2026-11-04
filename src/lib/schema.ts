import { z } from "zod";

export const SourceStatus = z.enum(["verified", "pending", "unverified", "disputed"]);
export const SourceDef = z.object({ id: z.string().min(1), title: z.string().min(1), url: z.string().url(), license: z.string().optional() });
const isoDate = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "必须是 YYYY-MM-DD");

export const SourceCitation = z.object({
  ref: z.string().min(1),
  locator: z.string().min(1, "locator 必填"),
  url: z.string().url().optional(),
  claim: z.string().min(1),
  status: SourceStatus.optional(),
  checkedBy: z.string().optional(),
  checkedAt: isoDate.optional(),
  note: z.string().optional(),
});

const KV = z.object({ key: z.string(), value: z.string() });

export const SwimlaneState = z.object({
  kind: z.literal("swimlane"),
  actors: z.array(z.object({ lane: z.string(), id: z.string(), label: z.string(), state: z.string().optional(), highlight: z.boolean().optional() })),
  messages: z.array(z.object({ id: z.string(), from: z.string(), to: z.string(), label: z.string(), active: z.boolean().optional() })),
  registers: z.array(z.object({ name: z.string(), value: z.string(), changed: z.boolean().optional() })).optional(),
});
export const CanvasState = z.discriminatedUnion("kind", [SwimlaneState]);

export const Step = z.object({
  id: z.string().regex(/^[a-z0-9-]+$/),
  title: z.string().min(1),
  tldr: z.string().min(1),
  body: z.string().min(1),
  keyFields: z.array(KV).optional(),
  derivation: z.enum(["original", "adapted"]),
  sources: z.array(SourceCitation).default([]),
  canvas: CanvasState,
  log: z.array(z.record(z.string(), z.string())),
});

export const TERMINAL_KEY = "在终端里看一看";
export const TerminalItem = z.object({ cmd: z.string().min(1), note: z.string().optional() });
/** "cmd　note；cmd2　note2" (full-width space between command and note, ； between items). */
export function parseTerminal(v: string) {
  return v.split("；").map((x) => x.trim()).filter(Boolean).map((x) => {
    const i = x.indexOf("\u3000");
    return i < 0 ? { cmd: x } : { cmd: x.slice(0, i).trim(), note: x.slice(i + 1).trim() || undefined };
  });
}

const TopicBase = z.object({
  id: z.string(),
  subject: z.enum(["os", "co", "dsa"]),
  slug: z.string().regex(/^[a-z0-9-]+$/),
  order: z.number().int(),
  status: z.enum(["published", "draft", "coming-soon"]),
  license: z.enum(["CC-BY-4.0", "CC-BY-NC-SA-4.0"]).default("CC-BY-4.0"),
  title: z.string(), summary: z.string(), premise: z.string(),
  overview: z.array(KV),
  visual: z.enum(["swimlane", "datapath", "datastate"]),
  lanes: z.array(z.object({ id: z.string(), label: z.string() })).optional(),
  logColumns: z.array(z.object({ key: z.string(), label: z.string() })),
  legend: z.array(z.object({ key: z.string(), label: z.string(), token: z.string().optional() })).optional(),
  steps: z.array(Step),
  reviewedBy: z.string().optional(),
  reviewedAt: isoDate.optional(),
  terminal: z.array(TerminalItem).optional(),
});
/** Accepts the sidebar section either as `terminal:` or as an overview entry keyed 在终端里看一看 (lifted out of overview). */
export const Topic = TopicBase.transform((t) => {
  const kv = t.overview.find((o) => o.key === TERMINAL_KEY);
  if (!kv) return t;
  return { ...t, overview: t.overview.filter((o) => o !== kv), terminal: [...(t.terminal ?? []), ...parseTerminal(kv.value)] };
});

export type SourceDef = z.infer<typeof SourceDef>;
export type SourceCitation = z.infer<typeof SourceCitation>;
export type Step = z.infer<typeof Step>;
export type Topic = z.infer<typeof Topic>;
export type CanvasState = z.infer<typeof CanvasState>;
export type SwimlaneState = z.infer<typeof SwimlaneState>;

export type Issue = { level: "error" | "warn"; where: string; msg: string };

/** Content integrity rules (source-verification gate removed 2026-11-04). Returns all issues. */
export function checkTopic(t: Topic, sources: Map<string, SourceDef>): Issue[] {
  const out: Issue[] = [];
  const hard = (where: string, msg: string) => out.push({ level: "error", where, msg });
  const base = `${t.subject}/${t.slug}`;
  if (t.id !== base) hard(base, `id 应为 ${base}`);
  if (t.status === "published" && t.steps.length < 1) hard(base, "published 主题没有步骤");
  const seen = new Set<string>();
  for (const s of t.steps) {
    const w = `${base} step ${s.id}`;
    if (seen.has(s.id)) hard(w, "步骤 id 重复");
    seen.add(s.id);
    if (s.derivation === "adapted" && t.license !== "CC-BY-NC-SA-4.0") hard(w, "derivation=adapted 但主题未设 license: CC-BY-NC-SA-4.0");
    if (s.canvas.kind !== t.visual) hard(w, `canvas.kind=${s.canvas.kind} 与 visual=${t.visual} 不一致`);
    if (t.lanes && s.canvas.kind === "swimlane") {
      const lanes = new Set(t.lanes.map((l) => l.id));
      const actors = new Set(s.canvas.actors.map((a) => a.id));
      for (const a of s.canvas.actors) if (!lanes.has(a.lane)) hard(w, `actor ${a.id} 的 lane ${a.lane} 不存在`);
      for (const m of s.canvas.messages) if (!actors.has(m.from) || !actors.has(m.to)) hard(w, `message ${m.id} 指向不存在的 actor`);
    }
    s.sources.forEach((c, i) => {
      if (!sources.has(c.ref)) hard(`${w} source#${i + 1}`, `ref=${c.ref} 不在 sources.yaml`);
    });
  }
  return out;
}
