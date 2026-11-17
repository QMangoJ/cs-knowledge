"use client";
import { createContext, useContext } from "react";
import { stringsFor, type Lang, type Strings } from "./index";

export type LangCtx = { lang: Lang; s: Strings };

const Ctx = createContext<LangCtx>({ lang: "zh", s: stringsFor("zh") });
export const LangProvider = Ctx.Provider;

/** Language + UI strings for client components. The provider is rendered by
 *  SiteShell (which receives the language of the current page tree from the
 *  root layout), so every component under the shell sees the right table. */
export function useLang(): LangCtx {
  return useContext(Ctx);
}
