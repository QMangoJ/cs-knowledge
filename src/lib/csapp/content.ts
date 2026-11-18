import fs from "node:fs";
import path from "node:path";
import type { Chapter, CsappIndex } from "./types";
export type { Chapter, CsappIndex, QuizItem, Stage } from "./types";
export { SECTION_IDS } from "./types";

const ROOT = path.join(process.cwd(), "content/csapp");

export function loadCsappIndex(): CsappIndex {
  return JSON.parse(fs.readFileSync(path.join(ROOT, "index.json"), "utf8")) as CsappIndex;
}

export function loadChapter(id: number): Chapter {
  const file = path.join(ROOT, `ch${String(id).padStart(2, "0")}.json`);
  return JSON.parse(fs.readFileSync(file, "utf8")) as Chapter;
}

export function allChapterIds(): number[] {
  return loadCsappIndex().chapters.map((c) => c.id);
}
