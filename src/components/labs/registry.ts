import type { ComponentType } from "react";
import type { LabState } from "@/lib/schema";

export type LabProps = { state: LabState };
/** id → lazy import. Each lab is its own chunk; nothing here is in the step page's initial JS. P1/P2 labs register here. */
export const LABS: Record<string, () => Promise<{ default: ComponentType<LabProps> }>> = {};
