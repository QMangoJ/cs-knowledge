import { marked } from "marked";
import type { Topic, SourceDef, GlossaryEntry } from "./schema";
import { collectKeys, termsInHtml } from "./terms";

/** Serializable props for the client Player: body pre-rendered to HTML at build time.
 *  The player step list is synthesized: 概况 (premise + overview) first, the topic's own
 *  steps next, 在终端里看一看 (when the topic has terminal items) before the last step,
 *  and 为什么这样设计 (design + compact sources) last. Real step i (0-based) therefore
 *  appears at player position i + 1 (1-based step number i + 2). */
export type SpecialKind = "overview" | "terminal" | "design";
type RawStep = Topic["steps"][number];
export type ViewStep = Omit<RawStep, "body" | "canvas"> & {
  bodyHtml: string;
  canvas?: RawStep["canvas"];
  special?: SpecialKind;
};
export type CitedSource = { ref: string; title: string; locator: string; claim: string; url?: string; steps: number[] };
export type TermInfo = { full: string; explain: string };
export type ViewTopic = Omit<Topic, "steps"> & { steps: ViewStep[]; cited: CitedSource[]; terms: Record<string, TermInfo> };
export type ViewSources = Record<string, SourceDef>;

/** Player step count for a topic: 1 (概况) + own steps + terminal step when present + 1 (设计). */
export function extendedStepCount(t: Topic): number {
  return t.steps.length + 2 + (t.terminal && t.terminal.length > 0 ? 1 : 0);
}

export function toView(t: Topic, sources: Map<string, SourceDef>, glossary: Map<string, GlossaryEntry> = new Map()): ViewTopic {
  const terms: Record<string, TermInfo> = {};
  for (const key of collectKeys([JSON.stringify(t)])) {
    const g = glossary.get(key);
    if (g) terms[key] = { full: g.full, explain: g.explain };
  }
  const md = (s: string) => termsInHtml(marked.parse(s, { async: false }));
  const cited: CitedSource[] = [];
  t.steps.forEach((s, si) => {
    for (const c of s.sources) {
      const hit = cited.find((x) => x.ref === c.ref && x.locator === c.locator && x.claim === c.claim);
      if (hit) { if (!hit.steps.includes(si + 2)) hit.steps.push(si + 2); }
      else cited.push({ ref: c.ref, title: sources.get(c.ref)?.title ?? c.ref, locator: c.locator, claim: c.claim, url: c.url ?? sources.get(c.ref)?.url, steps: [si + 2] });
    }
  });
  const synth = (base: Pick<ViewStep, "id" | "title" | "tldr" | "special"> & { bodyHtml: string }): ViewStep => ({
    derivation: "original", sources: [], log: [], ...base,
  });
  const steps: ViewStep[] = [
    // bodyHtml stays empty: the premise already renders once as this step's tldr in the
    // details column (and once on the stage cover). Putting it in the body too printed
    // the same paragraph twice back-to-back in the details column.
    synth({ id: "x-overview", title: "概况", special: "overview", tldr: t.premise, bodyHtml: "" }),
    ...t.steps.map(({ body, ...s }) => ({ ...s, bodyHtml: md(body) })),
  ];
  if (t.terminal && t.terminal.length > 0) {
    steps.push(synth({
      id: "x-terminal", title: "在终端里看一看", special: "terminal",
      tldr: "把这一课的概念落到真命令上：先猜输出，再对照正文核对。",
      bodyHtml: md("正文里讲的机制，大多能在一条命令的输出里找到影子。跑之前先猜一遍它会打印什么、哪一段对应正文的哪句话，再看注脚核对。"),
    }));
  }
  steps.push(synth({
    id: "x-design", title: "为什么这样设计", special: "design",
    tldr: "本课每个机制背后的根本问题、方案选择、权衡与底层根源，附全部出处。",
    bodyHtml: "",
  }));
  const { steps: _rawSteps, ...rest } = t;
  return { ...rest, steps, cited, terms };
}
