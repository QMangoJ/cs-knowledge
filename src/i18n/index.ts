import zh from "./zh.json";
import en from "./en.json";

export type Lang = "zh" | "en";
export type Strings = typeof zh;

/** Both UI string tables. en.json is key-checked against zh.json by
 *  tests/i18n.test.ts, so the cast is safe. */
export const STRINGS: Record<Lang, Strings> = { zh, en: en as unknown as Strings };

/** Back-compat default (Chinese) for the few call sites that have not been
 *  threaded with a language yet. New code should use stringsFor(lang) or the
 *  useLang() hook from ./client. */
export const t = zh;

export function stringsFor(lang: Lang): Strings {
  return STRINGS[lang];
}

/** localStorage key for the reader's language choice; the language toggle
 *  writes it, and the zh root layout's pre-paint script reads it to offer the
 *  English home page when arriving at "/" from outside. */
export const LANG_KEY = "cs-lang";

/** URL prefix of a language tree: Chinese lives at the root, English under /en. */
export function langPrefix(lang: Lang): string {
  return lang === "en" ? "/en" : "";
}

/** Prefix an absolute site path for a language tree ("/" → "/en/"). */
export function prefixPath(lang: Lang, path: string): string {
  if (lang === "zh") return path;
  return path === "/" ? "/en/" : `/en${path}`;
}

/** The same page in the other language: add or strip the /en prefix. */
export function counterpartPath(lang: Lang, pathname: string): string {
  if (lang === "zh") return pathname === "/" ? "/en/" : `/en${pathname}`;
  const stripped = pathname.replace(/^\/en(?=\/|$)/, "");
  return stripped === "" ? "/" : stripped;
}

/** "{name}" placeholder substitution for the format strings in the tables. */
export function fmt(tpl: string, vars: Record<string, string | number>): string {
  return tpl.replace(/\{(\w+)\}/g, (m, k: string) => (k in vars ? String(vars[k]) : m));
}

export const REPO_URL = "https://github.com/QMangoJ/cs-knowledge";
export const SITE_URL = "https://cs.ki-toko.com";
