import type { ComponentType } from "react";
import type { LabState } from "@/lib/schema";

export type LabProps = { state: LabState };
type Loader = () => Promise<{ default: ComponentType<LabProps> }>;

/** id → lazy chunk. LabHost wraps each loader in next/dynamic, so no lab code ships with the step page. */
export const LABS: Record<string, Loader> = {
  "bit-editor": () => import("./BitEditor"),
  "addr-split": () => import("./AddrSplit"),
  "pipeline-chart": () => import("./PipelineChart"),
  interleave: () => import("./Interleave"),
  "wait-for-graph": () => import("./WaitForGraph"),
  "binary-search-lab": () => import("./BinarySearchLab"),
  "sort-compare": () => import("./SortCompare"),
};
