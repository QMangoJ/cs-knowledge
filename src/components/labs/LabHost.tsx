import dynamic from "next/dynamic";
import { useMemo } from "react";
import type { LabState } from "@/lib/schema";
import { fmt } from "@/i18n";
import { useLang } from "@/i18n/client";
import { LABS } from "./registry";

export function LabHost({ state }: { state: LabState }) {
  const { s } = useLang();
  const load = LABS[state.lab];
  const Lab = useMemo(() => (load ? dynamic(load, { ssr: false, loading: () => <p className="lab-loading">{s.labLoading}</p> }) : null), [load, s]);
  return (
    <div className={state.params?.wide === true ? "lab lab-wide" : "lab"}>
      {Lab ? <Lab state={state} /> : <p className="lab-missing">{fmt(s.labMissing, { lab: state.lab })}</p>}
      {state.caption && <p className="ds-caption">{state.caption}</p>}
    </div>
  );
}
