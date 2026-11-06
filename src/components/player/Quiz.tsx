"use client";
import { useState } from "react";
import type { QuizItem } from "@/lib/schema";
import { doneKey, isDone, setDone } from "@/lib/progress";
import { t } from "@/i18n";

export function Quiz({ items, topicId }: { items: QuizItem[]; topicId: string }) {
  const [picked, setPicked] = useState<Record<number, number>>({});
  const [done, setDoneState] = useState(() => (typeof window !== "undefined" ? isDone(doneKey(topicId)) : false));
  const correct = items.filter((q, i) => picked[i] === q.answer).length;
  const allRight = correct === items.length;
  const pick = (i: number, j: number) => {
    const np = { ...picked, [i]: j };
    setPicked(np);
    if (items.every((q, k) => np[k] === q.answer)) { setDone(doneKey(topicId)); setDoneState(true); }
  };
  return (
    <section className="quiz" aria-label={t.quiz}>
      <h3>{t.quiz}</h3>
      <p className="quiz-progress">{t.quizProgress.replace("{ok}", String(correct)).replace("{total}", String(items.length))}{done && ` · ${t.done}`}</p>
      {items.map((q, i) => {
        const p = picked[i];
        return (
          <div key={i} className="quiz-q">
            <p className="quiz-stem">{i + 1}. {q.q}</p>
            <div className="quiz-opts">
              {q.options.map((o, j) => {
                const cls = p === undefined ? "" : j === q.answer ? "right" : j === p ? "wrong" : "";
                return <button key={j} type="button" className={`quiz-opt ${cls}`} onClick={() => pick(i, j)}>{o}</button>;
              })}
            </div>
            {p !== undefined && <p className={`quiz-explain ${p === q.answer ? "ok" : "bad"}`}>{p === q.answer ? "✓ " : "✗ "}{q.explain}</p>}
          </div>
        );
      })}
      {allRight && <p className="quiz-done">{t.quizDone}</p>}
    </section>
  );
}

export function MarkDone({ topicId }: { topicId: string }) {
  const [done, setDoneState] = useState(() => (typeof window !== "undefined" ? isDone(doneKey(topicId)) : false));
  if (done) return <p className="mark-done done">{t.done}</p>;
  return <button type="button" className="mark-done" onClick={() => { setDone(doneKey(topicId)); setDoneState(true); }}>{t.markDone}</button>;
}
