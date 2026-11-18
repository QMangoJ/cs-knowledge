"use client";

export type Grade = "know" | "fuzzy" | "miss";

const quizKey = (ch: number) => `csapp:quiz:${ch}`;
const readKey = (ch: number) => `csapp:read:${ch}`;

export function loadQuiz(ch: number): (Grade | null)[] {
  try {
    const raw = localStorage.getItem(quizKey(ch));
    if (!raw) return Array(8).fill(null);
    const arr = JSON.parse(raw) as (Grade | null)[];
    return Array.from({ length: 8 }, (_, i) => arr[i] ?? null);
  } catch {
    return Array(8).fill(null);
  }
}

export function saveQuiz(ch: number, grades: (Grade | null)[]) {
  try {
    localStorage.setItem(quizKey(ch), JSON.stringify(grades));
  } catch { /* private mode */ }
}

export function loadReadSections(ch: number): string[] {
  try {
    const raw = localStorage.getItem(readKey(ch));
    return raw ? (JSON.parse(raw) as string[]) : [];
  } catch {
    return [];
  }
}

export function markRead(ch: number, sectionId: string) {
  const cur = new Set(loadReadSections(ch));
  cur.add(sectionId);
  try {
    localStorage.setItem(readKey(ch), JSON.stringify([...cur]));
  } catch { /* */ }
}

export function chapterProgress(ch: number): number {
  const g = loadQuiz(ch);
  const known = g.filter((x) => x === "know").length;
  const read = loadReadSections(ch).length;
  // 50% reading (7 sections) + 50% quiz knows
  return Math.round(((read / 7) * 50) + ((known / 8) * 50));
}

export function overallProgress(chapterIds: number[]): { pct: number; started: number; done: number } {
  let sum = 0;
  let started = 0;
  let done = 0;
  for (const id of chapterIds) {
    const p = chapterProgress(id);
    sum += p;
    if (p > 0) started += 1;
    if (p >= 90) done += 1;
  }
  return { pct: chapterIds.length ? Math.round(sum / chapterIds.length) : 0, started, done };
}
