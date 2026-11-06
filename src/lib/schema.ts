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
/** Per-element highlight for datastate canvases. */
export const Mark = z.enum(["active", "visited", "done", "found", "pivot", "muted", "new"]);
const Val = z.union([z.string(), z.number()]);
const Cell = z.object({ v: Val, sub: z.string().optional(), mark: Mark.optional(),
  /** Hash-table chaining: nodes linked below this cell. */
  chain: z.array(z.object({ v: Val, mark: Mark.optional() })).optional() });
export const ArrayRow = z.object({
  label: z.string().optional(),
  /** boxes (default) or bars (height ∝ numeric value, for sorting). */
  display: z.enum(["boxes", "bars"]).optional(),
  cells: z.array(Cell).min(1),
  /** Insert a visual gap before these indices (sub-arrays, partitions). */
  breaks: z.array(z.number().int()).optional(),
  pointers: z.array(z.object({ at: z.number().int(), label: z.string() })).optional(),
  range: z.object({ from: z.number().int(), to: z.number().int(), label: z.string().optional() }).optional(),
});
export const DatastateState = z.object({
  kind: z.literal("datastate"),
  structure: z.enum(["array", "tree", "graph"]),
  caption: z.string().optional(),
  /** structure=array: one or more rows (e.g. before/after, recursion levels). */
  rows: z.array(ArrayRow).optional(),
  /** structure=tree: complete binary tree in level order (heap layout); showArray also draws the backing array. */
  tree: z.object({ nodes: z.array(Cell).min(1), showArray: z.boolean().optional() }).optional(),
  /** structure=graph: x/y in 0–100. */
  graph: z.object({
    directed: z.boolean().optional(),
    nodes: z.array(z.object({ id: z.string(), label: z.string().optional(), x: z.number().min(0).max(100), y: z.number().min(0).max(100), note: z.string().optional(), mark: Mark.optional() })).min(1),
    edges: z.array(z.object({ from: z.string(), to: z.string(), w: Val.optional(), mark: Mark.optional() })),
  }).optional(),
  /** Side table next to the drawing (distance table, heap contents…). */
  table: z.object({ title: z.string().optional(), columns: z.array(z.string()).min(1), rows: z.array(z.array(Val)), highlight: z.array(z.number().int()).optional() }).optional(),
  /** Side panels: queue, stack, distance table, notes. */
  aux: z.array(z.object({ label: z.string(), items: z.array(Val) })).optional(),
  registers: z.array(z.object({ name: z.string(), value: z.string(), changed: z.boolean().optional() })).optional(),
});
/** Reader-driven mini experiment; component is lazy-loaded by id (src/components/labs). */
export const LabState = z.object({
  kind: z.literal("lab"),
  lab: z.string().regex(/^[a-z0-9-]+$/),
  caption: z.string().optional(),
  params: z.record(z.string(), z.unknown()).optional(),
  /** Fixed cases the lab must reproduce, matching the prose (input → expected). */
  cases: z.array(z.object({ input: z.record(z.string(), z.unknown()), expect: z.record(z.string(), z.unknown()) })).optional(),
  registers: z.array(z.object({ name: z.string(), value: z.string(), changed: z.boolean().optional() })).optional(),
});
export const CanvasState = z.discriminatedUnion("kind", [SwimlaneState, DatastateState, LabState]);

export const StepCode = z.object({ lang: z.string().min(1), code: z.string().min(1), note: z.string().optional(), highlight: z.number().int().min(1).optional() });
export const QuizItem = z.object({
  q: z.string().min(1),
  options: z.array(z.string().min(1)).length(4),
  answer: z.number().int().min(0).max(3),
  explain: z.string().min(1),
});
export const Step = z.object({
  id: z.string().regex(/^[a-z0-9-]+$/),
  title: z.string().min(1),
  tldr: z.string().min(1),
  body: z.string().min(1),
  code: StepCode.optional(),
  points: z.array(z.string().min(1)).optional(),
  mistake: z.string().min(1).optional(),
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
  subject: z.enum(["os", "co", "dsa", "network", "data", "math"]),
  slug: z.string().regex(/^[a-z0-9-]+$/),
  order: z.number().int(),
  status: z.enum(["published", "draft", "coming-soon"]),
  license: z.enum(["CC-BY-4.0", "CC-BY-NC-SA-4.0"]).default("CC-BY-4.0"),
  title: z.string(), summary: z.string(), premise: z.string(),
  level: z.enum(["基础", "进阶"]).optional(),
  minutes: z.number().int().positive().optional(),
  prereq: z.array(z.string()).optional(),
  objectives: z.array(z.string().min(1)).optional(),
  aiLink: z.string().min(1).optional(),
  design: z.array(z.object({
    mechanism: z.string().min(1), problem: z.string().min(1),
    choice: z.string().min(1), tradeoff: z.string().min(1), root: z.string().min(1),
  })).optional(),
  quiz: z.array(QuizItem).optional(),
  overview: z.array(KV),
  visual: z.enum(["swimlane", "datapath", "datastate", "lab"]),
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
export type QuizItem = z.infer<typeof QuizItem>;
export type StepCode = z.infer<typeof StepCode>;
export type Topic = z.infer<typeof Topic>;
export type CanvasState = z.infer<typeof CanvasState>;
export type SwimlaneState = z.infer<typeof SwimlaneState>;
export type DatastateState = z.infer<typeof DatastateState>;
export type LabState = z.infer<typeof LabState>;

export type Issue = { level: "error" | "warn"; where: string; msg: string };

/** Content integrity rules (source-verification gate removed 2026-11-04). Returns all issues. */
export function checkTopic(t: Topic, sources: Map<string, SourceDef>): Issue[] {
  const out: Issue[] = [];
  const hard = (where: string, msg: string) => out.push({ level: "error", where, msg });
  const base = `${t.subject}/${t.slug}`;
  if (t.id !== base) hard(base, `id 应为 ${base}`);
  if (t.status === "published" && t.steps.length < 1) hard(base, "published 主题没有步骤");
  if (t.status === "published" && (!t.design || t.design.length < 2)) hard(base, "published 主题必须有至少 2 条 design（为什么这样设计）");
  const seen = new Set<string>();
  for (const s of t.steps) {
    const w = `${base} step ${s.id}`;
    if (seen.has(s.id)) hard(w, "步骤 id 重复");
    seen.add(s.id);
    if (s.derivation === "adapted" && t.license !== "CC-BY-NC-SA-4.0") hard(w, "derivation=adapted 但主题未设 license: CC-BY-NC-SA-4.0");
    if (s.canvas.kind !== t.visual && s.canvas.kind !== "lab") hard(w, `canvas.kind=${s.canvas.kind} 与 visual=${t.visual} 不一致`);
    if (t.lanes && s.canvas.kind === "swimlane") {
      const lanes = new Set(t.lanes.map((l) => l.id));
      const actors = new Set(s.canvas.actors.map((a) => a.id));
      for (const a of s.canvas.actors) if (!lanes.has(a.lane)) hard(w, `actor ${a.id} 的 lane ${a.lane} 不存在`);
      for (const m of s.canvas.messages) if (!actors.has(m.from) || !actors.has(m.to)) hard(w, `message ${m.id} 指向不存在的 actor`);
    }
    if (s.canvas.kind === "datastate") {
      const c = s.canvas, need = { array: c.rows, tree: c.tree, graph: c.graph }[c.structure];
      if (!need) hard(w, `structure=${c.structure} 但缺少对应数据（rows / tree / graph）`);
      if (c.graph) {
        const ids = new Set(c.graph.nodes.map((n) => n.id));
        for (const e of c.graph.edges) if (!ids.has(e.from) || !ids.has(e.to)) hard(w, `edge ${e.from}-${e.to} 指向不存在的节点`);
      }
      for (const r of c.rows ?? []) {
        for (const p of r.pointers ?? []) if (p.at < 0 || p.at >= r.cells.length) hard(w, `pointer ${p.label} 越界`);
        if (r.range && (r.range.from < 0 || r.range.to >= r.cells.length || r.range.from > r.range.to)) hard(w, "range 越界");
        if (r.display === "bars" && r.cells.some((x) => typeof x.v !== "number")) hard(w, "bars 的值必须是数字");
      }
      if (c.table) c.table.rows.forEach((r, i) => { if (r.length !== c.table!.columns.length) hard(w, `table 第 ${i + 1} 行列数不对`); });
    }
    s.sources.forEach((c, i) => {
      if (!sources.has(c.ref)) hard(`${w} source#${i + 1}`, `ref=${c.ref} 不在 sources.yaml`);
    });
  }
  return out;
}
