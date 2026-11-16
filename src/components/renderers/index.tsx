import dynamic from "next/dynamic";
import type { CanvasState } from "@/lib/schema";
import { plainText } from "@/lib/terms";
import { Swimlane } from "./Swimlane";

// Loaded only on pages that use them, so OS/CO pages don't ship this code.
const Datastate = dynamic(() => import("./Datastate").then((m) => m.Datastate));
const LabHost = dynamic(() => import("../labs/LabHost").then((m) => m.LabHost), { ssr: false });

type Lane = { id: string; label: string };

/** Canvas labels live in SVG / tight boxes where term popovers can't go:
 *  strip glossary markers to their display text (the same terms stay
 *  clickable in the step's reading text). */
function stripDeep<T>(v: T): T {
  if (typeof v === "string") return plainText(v) as T;
  if (Array.isArray(v)) return v.map((x) => stripDeep(x)) as T;
  if (v && typeof v === "object") return Object.fromEntries(Object.entries(v).map(([k, x]) => [k, stripDeep(x)])) as T;
  return v;
}

export function Canvas({ state, lanes }: { state: CanvasState; lanes?: Lane[] }) {
  const s = stripDeep(state);
  const ls = lanes?.map((l) => ({ ...l, label: plainText(l.label) }));
  switch (s.kind) {
    case "swimlane": return <Swimlane state={s} lanes={ls} />;
    case "datastate": return <Datastate state={s} />;
    case "lab": return <LabHost state={s} />;
  }
}
