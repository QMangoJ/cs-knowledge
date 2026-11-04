import Link from "next/link";
import { loadContent } from "@/lib/content";
import { stepPath } from "@/lib/paths";
import { t } from "@/i18n";

const SUBJECTS = ["os", "co", "dsa"] as const;

export default function Home() {
  const { topics } = loadContent();
  const prod = process.env.CS_PRODUCTION === "1";
  return (
    <div className="home">
      <h1>{t.siteName}</h1>
      <p className="summary">{t.tagline}</p>
      {SUBJECTS.map((s) => {
        const list = topics.filter((x) => x.subject === s && (x.status !== "draft" || !prod));
        return (
          <section key={s} className="subject">
            <h2>{t.subjects[s]}</h2>
            {list.length === 0 ? <p className="muted">{t.comingSoon}</p> : (
              <ul className="cards">
                {list.map((x) => x.status === "coming-soon" ? (
                  <li key={x.id} className="topic-card disabled"><h3>{x.title}</h3><p>{x.summary}</p><span className="badge">{t.comingSoon}</span></li>
                ) : (
                  <li key={x.id} className="topic-card"><Link href={stepPath(x.subject, x.slug, 0)}><h3>{x.title}</h3><p>{x.summary}</p>{x.status === "draft" && <span className="badge pending">{t.draft}</span>}</Link></li>
                ))}
              </ul>
            )}
          </section>
        );
      })}
    </div>
  );
}
