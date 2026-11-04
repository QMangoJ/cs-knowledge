import dynamic from "next/dynamic";
import type { CanvasState } from "@/lib/schema";
import { Swimlane } from "./Swimlane";

// Loaded only on pages that use them, so OS/CO pages don't ship this code.
const Datastate = dynamic(() => import("./Datastate").then((m) => m.Datastate));
const LabHost = dynamic(() => import("../labs/LabHost").then((m) => m.LabHost), { ssr: false });

type Lane = { id: string; label: string };
export function Canvas({ state, lanes }: { state: CanvasState; lanes?: Lane[] }) {
  switch (state.kind) {
    case "swimlane": return <Swimlane state={state} lanes={lanes} />;
    case "datastate": return <Datastate state={state} />;
    case "lab": return <LabHost state={state} />;
  }
}
