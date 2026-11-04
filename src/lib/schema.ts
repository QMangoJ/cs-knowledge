import { z } from "zod";

export const SourceStatus = z.enum(["verified", "pending", "unverified", "disputed"]);
export const SourceDef = z.object({ id: z.string().min(1), title: z.string().min(1), url: z.string().url(), license: z.string().optional() });
const isoDate = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "必须是 YYYY-MM-DD");

export const SourceCitation = z.object({
  ref: z.string().min(1),
  locator: z.string().min(1, "locator 必填"),
  url: z.string().url().optional(),
  claim: z.string().min(1),
  status: SourceStatus,
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
  sources: z.array(SourceCitation),
  canvas: CanvasState,
  log: z.array(z.record(z.string(), z.string())),
});

export const Topic = z.object({
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
});

export type SourceDef = z.infer<typeof SourceDef>;
export type SourceCitation = z.infer<typeof SourceCitation>;
export type Step = z.infer<typeof Step>;
export type Topic = z.infer<typeof Topic>;
export type CanvasState = z.infer<typeof CanvasState>;
export type SwimlaneState = z.infer<typeof SwimlaneState>;

export type Issue = { level: "error" | "warn"; where: string; msg: string };

/** §8.2 cross-field rules. Returns all issues (does not stop at first). */
export function checkTopic(t: Topic, sources: Map<string, SourceDef>, today = new Date().toISOString().slice(0, 10)): Issue[] {
  const out: Issue[] = [];
  const pub = t.status === "published";
  const soft = (where: string, msg: string) => out.push({ level: pub ? "error" : "warn", where, msg });
  const hard = (where: string, msg: string) => out.push({ level: "error", where, msg });
  const base = `${t.subject}/${t.slug}`;
  if (t.id !== base) hard(base, `id 应为 ${base}`);
  if (pub && (t.steps.length < 1)) hard(base, "published 主题没有步骤");
  if (pub && (!t.reviewedBy || !t.reviewedAt)) hard(base, "published 主题缺 reviewedBy/reviewedAt（Daniel 签字）");
  const seen = new Set<string>();
  for (const s of t.steps) {
    const w = `${base} step ${s.id}`;
    if (seen.has(s.id)) hard(w, "步骤 id 重复");
    seen.add(s.id);
    if (s.sources.length === 0) soft(w, "sources 为空");
    if (s.derivation === "adapted" && t.license !== "CC-BY-NC-SA-4.0") hard(w, "derivation=adapted 但主题未设 license: CC-BY-NC-SA-4.0");
    if (s.canvas.kind !== t.visual) hard(w, `canvas.kind=${s.canvas.kind} 与 visual=${t.visual} 不一致`);
    if (t.lanes && s.canvas.kind === "swimlane") {
      const lanes = new Set(t.lanes.map((l) => l.id));
      const actors = new Set(s.canvas.actors.map((a) => a.id));
      for (const a of s.canvas.actors) if (!lanes.has(a.lane)) hard(w, `actor ${a.id} 的 lane ${a.lane} 不存在`);
      for (const m of s.canvas.messages) if (!actors.has(m.from) || !actors.has(m.to)) hard(w, `message ${m.id} 指向不存在的 actor`);
    }
    s.sources.forEach((c, i) => {
      const cw = `${w} source#${i + 1}`;
      if (!sources.has(c.ref)) hard(cw, `ref=${c.ref} 不在 sources.yaml`);
      if (c.status === "verified") {
        if (!c.checkedBy || !c.checkedAt) hard(cw, "verified 但缺 checkedBy/checkedAt");
        else if (c.checkedAt > today) hard(cw, `checkedAt ${c.checkedAt} 在未来`);
      }
      if (c.status === "pending") soft(cw, "status=pending");
      if (c.status === "disputed") soft(cw, "status=disputed");
      if (c.status === "unverified" && !c.note) hard(cw, "unverified 必须有 note");
    });
  }
  return out;
}
