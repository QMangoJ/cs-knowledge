export type QuizItem = { q: string; hint: string; a: string };
export type Chapter = {
  id: number;
  title: string;
  subtitle: string;
  oneLiner: string;
  mainline: string[];
  conceptsMd: string;
  backendMd: string;
  frontendMd: string;
  interview: string[];
  quiz: QuizItem[];
  refs: string[];
};
export type Stage = { id: string; title: string; blurb: string; chapters: number[] };
export type CsappIndex = {
  chapters: { id: number; title: string; subtitle: string }[];
  stages: Stage[];
  sections: { id: string; title: string }[];
};

export const SECTION_IDS = [
  "mainline",
  "concepts",
  "backend",
  "frontend",
  "interview",
  "quiz",
  "refs",
] as const;
