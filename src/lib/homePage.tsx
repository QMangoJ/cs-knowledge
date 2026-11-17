import { loadContent, localizedJourney, localizedSubjects, topicForLang } from "@/lib/content";
import { extendedStepCount } from "@/lib/view";
import { plainText } from "@/lib/terms";
import { Home, type HomeTopic } from "@/components/home/Home";
import type { Lang } from "@/i18n";

/** Shared home page for both language trees. Lesson titles/summaries come
 *  from the language's overlay when one exists (Chinese fallback otherwise);
 *  subjects and journey are localised through the content loader. */
export function HomePage({ lang }: { lang: Lang }) {
  const c = loadContent();
  const prod = process.env.CS_PRODUCTION === "1";
  const list: HomeTopic[] = c.topics
    .filter((x) => x.status !== "draft" || !prod)
    .map((x) => {
      const disp = topicForLang(c, x, lang);
      return {
        id: x.id, subject: x.subject, slug: x.slug, title: disp.title, summary: plainText(disp.summary), status: x.status,
        steps: extendedStepCount(x), level: x.level, minutes: x.minutes, prereq: x.prereq,
      };
    });
  return <Home topics={list} subjects={localizedSubjects(c, lang)} journey={localizedJourney(c, lang)} />;
}
