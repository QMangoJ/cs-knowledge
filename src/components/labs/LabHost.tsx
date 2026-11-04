import dynamic from "next/dynamic";
import { useMemo } from "react";
import type { LabState } from "@/lib/schema";
import { LABS } from "./registry";

export function LabHost({ state }: { state: LabState }) {
  const load = LABS[state.lab];
  const Lab = useMemo(() => (load ? dynamic(load, { ssr: false, loading: () => <p className="lab-loading">实验加载中…</p> }) : null), [load]);
  return (
    <div className="lab">
      {Lab ? <Lab state={state} /> : <p className="lab-missing">实验「{state.lab}」尚未上线</p>}
      {state.caption && <p className="ds-caption">{state.caption}</p>}
    </div>
  );
}
