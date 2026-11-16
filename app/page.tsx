import { loadContent } from "@/lib/content";
import { extendedStepCount } from "@/lib/view";
import { plainText } from "@/lib/terms";
import { Home, type HomeTopic } from "@/components/home/Home";

export default function Page() {
  const { topics, subjects, journey } = loadContent();
  const prod = process.env.CS_PRODUCTION === "1";
  const list: HomeTopic[] = topics
    .filter((x) => x.status !== "draft" || !prod)
    .map((x) => ({
      id: x.id, subject: x.subject, slug: x.slug, title: x.title, summary: plainText(x.summary), status: x.status,
      steps: extendedStepCount(x), level: x.level, minutes: x.minutes, prereq: x.prereq,
    }));
  return <Home topics={list} subjects={subjects} journey={journey} />;
}
