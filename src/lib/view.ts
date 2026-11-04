import { marked } from "marked";
import type { Topic, SourceDef } from "./schema";

/** Serializable props for the client Player: body pre-rendered to HTML at build time. */
export type ViewStep = Omit<Topic["steps"][number], "body"> & { bodyHtml: string };
export type ViewTopic = Omit<Topic, "steps"> & { steps: ViewStep[] };
export type ViewSources = Record<string, SourceDef>;

export function toView(t: Topic): ViewTopic {
  return { ...t, steps: t.steps.map(({ body, ...s }) => ({ ...s, bodyHtml: marked.parse(body, { async: false }) })) };
}
