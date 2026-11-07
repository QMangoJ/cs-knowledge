import type { Topic, SourceDef, SubjectInfo } from "@/lib/schema";
import { SubjectDiagram, type TopicLinks } from "@/components/coherence/Panorama";
import { t, REPO_URL } from "@/i18n";
import { issueUrl } from "@/lib/paths";

export type PathNav = {
  station: number;
  totalStations: number;
  prev: { id: string; title: string; href: string } | null;
  next: { id: string; title: string; href: string } | null;
};

/** Everything below the app screen: panorama, overview, design rationale,
 *  terminal, aggregated sources, and the prev/next bridge. Server-rendered. */
export function TopicBelow({ topic, sources, info, links, nav }: {
  topic: Topic;
  sources: Record<string, SourceDef>;
  info: SubjectInfo;
  links: TopicLinks;
  nav: PathNav;
}) {
  const subjectName = t.subjects[topic.subject];
  const cited: { ref: string; locator: string; claim: string; url?: string; steps: number[] }[] = [];
  topic.steps.forEach((s, si) => {
    for (const c of s.sources) {
      const hit = cited.find((x) => x.ref === c.ref && x.locator === c.locator && x.claim === c.claim);
      if (hit) { if (!hit.steps.includes(si + 1)) hit.steps.push(si + 1); }
      else cited.push({ ref: c.ref, locator: c.locator, claim: c.claim, url: c.url, steps: [si + 1] });
    }
  });
  return (
    <div className="below">
      <section className="below-sec pano-sec" aria-label={t.panorama}>
        <h2>{t.panorama} · {subjectName}</h2>
        <p className="below-lede">
          这是{subjectName}的全景：本科由 {info.blocks.length} 个板块组成，本课在
          <b>「{info.blocks.find((b) => b.topics.includes(topic.id))?.name}」</b>板块，
          是推荐路径上的<b>第 {nav.station} 站 / 共 {nav.totalStations} 站</b>。图里高亮的就是你正在学的这一课。
        </p>
        <SubjectDiagram info={info} links={links} currentId={topic.id} />
      </section>

      <section className="below-sec" aria-label={t.overview}>
        <h2>{t.overview}</h2>
        <p className="premise">{topic.premise}</p>
        <dl className="kv">{topic.overview.map((o) => <div key={o.key}><dt>{o.key}</dt><dd>{o.value}</dd></div>)}</dl>
      </section>

      {topic.design && topic.design.length > 0 && (
        <section className="below-sec design" aria-label={t.design}>
          <h2>{t.design}</h2>
          {topic.design.map((d) => (
            <div key={d.mechanism} className="design-item">
              <h4>{d.mechanism}</h4>
              <p><b>{t.dProblem}：</b>{d.problem}</p>
              <p><b>{t.dChoice}：</b>{d.choice}</p>
              <p><b>{t.dTradeoff}：</b>{d.tradeoff}</p>
              <p><b>{t.dRoot}：</b>{d.root}</p>
            </div>
          ))}
        </section>
      )}

      {topic.terminal && topic.terminal.length > 0 && (
        <section className="below-sec terminal" aria-label={t.terminal}>
          <h2>{t.terminal}</h2>
          <ul>{topic.terminal.map((c, i) => <li key={i}><code>{c.cmd}</code>{c.note && <p>{c.note}</p>}</li>)}</ul>
        </section>
      )}

      {cited.length > 0 && (
        <section className="below-sec sources" aria-label={t.sources}>
          <h2>{t.sources}</h2>
          <ol>
            {cited.map((c, i) => {
              const d = sources[c.ref];
              return (
                <li key={i}>
                  <a href={c.url ?? d?.url} target="_blank" rel="noopener noreferrer">[{i + 1}] {d?.title ?? c.ref} · {c.locator} ↗</a>
                  <span className="src-steps">（第 {c.steps.join("、")} 步）</span>
                  <p className="claim">{c.claim}</p>
                </li>
              );
            })}
          </ol>
        </section>
      )}

      <section className="below-sec bridge" aria-label={t.bridge}>
        <h2>{t.bridge}</h2>
        <div className="bridge-grid">
          {nav.prev ? (
            <div className="bridge-card">
              <p className="eyebrow">{t.bridgePrev} · 第 {nav.station - 1} 站</p>
              <a className="bridge-title" href={nav.prev.href}>← {nav.prev.title}</a>
              {topic.bridge?.prev && <p>{topic.bridge.prev}</p>}
            </div>
          ) : (
            <div className="bridge-card muted-card">
              <p className="eyebrow">{t.bridgePrev}</p>
              <p>这是{subjectName}推荐路径的第一站，前面没有课——从这里开始建立本科的第一个概念。</p>
            </div>
          )}
          <div className="bridge-here">
            <span className="bridge-station">{subjectName} 第 {nav.station} / {nav.totalStations} 站</span>
            <b>{topic.title}</b>
          </div>
          {nav.next ? (
            <div className="bridge-card">
              <p className="eyebrow">{t.bridgeNext} · 第 {nav.station + 1} 站</p>
              <a className="bridge-title" href={nav.next.href}>{nav.next.title} →</a>
              {topic.bridge?.next && <p>{topic.bridge.next}</p>}
            </div>
          ) : (
            <div className="bridge-card muted-card">
              <p className="eyebrow">{t.bridgeNext}</p>
              <p>这是{subjectName}推荐路径的最后一站。本科的板块已经走完，接下来去学习路线里的下一科，或回到全景图查漏补缺。</p>
            </div>
          )}
        </div>
      </section>

      <p className="below-report">
        <a className="report" href={issueUrl(REPO_URL, topic.id, 1, topic.steps[0]?.title ?? topic.title)} target="_blank" rel="noopener noreferrer">{t.reportError} ↗</a>
      </p>
    </div>
  );
}
