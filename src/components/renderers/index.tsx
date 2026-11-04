import type { CanvasState } from "@/lib/schema";
import { Swimlane } from "./Swimlane";

type Lane = { id: string; label: string };
export function Canvas({ state, lanes }: { state: CanvasState; lanes?: Lane[] }) {
  switch (state.kind) {
    case "swimlane": return <Swimlane state={state} lanes={lanes} />;
  }
}
