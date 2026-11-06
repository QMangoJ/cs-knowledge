"use client";
import { useEffect, useState } from "react";
import { doneKey, isDone, setDone } from "@/lib/progress";
import { t } from "@/i18n";

/** Manual completion only (Daniel 2026-11-07: no self-tests; he tracks practice himself).
 *  The storage key is unchanged, so topics previously completed via the old quiz stay done. */
export function MarkDone({ topicId }: { topicId: string }) {
  const [done, setDoneState] = useState(false);
  useEffect(() => { setDoneState(isDone(doneKey(topicId))); }, [topicId]);
  if (done) return <p className="mark-done done">{t.done}</p>;
  return <button type="button" className="mark-done" onClick={() => { setDone(doneKey(topicId)); setDoneState(true); }}>{t.markDone}</button>;
}
