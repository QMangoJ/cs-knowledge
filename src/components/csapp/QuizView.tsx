"use client";

import type { Chapter, CsappIndex } from "@/lib/csapp/types";
import { Sidebar } from "./Sidebar";
import { Spotlight } from "./Spotlight";
import { CsappShell } from "./CsappShell";
import { QuizDeck } from "./QuizDeck";

export function QuizView({ index, chapter }: { index: CsappIndex; chapter: Chapter }) {
  return (
    <CsappShell>
      <Spotlight />
      <Sidebar index={index} current={chapter.id} activeSection="quiz" mode="quiz" />
      <div className="main">
        <QuizDeck ch={chapter.id} title={chapter.title} items={chapter.quiz} />
      </div>
    </CsappShell>
  );
}
