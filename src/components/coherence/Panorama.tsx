import type { SubjectBlock, SubjectInfo } from "@/lib/schema";
import { plainText } from "@/lib/terms";
import { fmt } from "@/i18n";
import { useLang } from "@/i18n/client";

export type TopicLink = { id: string; title: string; href: string };
export type TopicLinks = Record<string, TopicLink>;

function TopicChip({ link, currentId }: { link: TopicLink; currentId?: string }) {
  const cur = link.id === currentId;
  return <a className={cur ? "pano-chip current" : "pano-chip"} href={link.href} aria-current={cur ? "page" : undefined}>{plainText(link.title)}</a>;
}

function BlockBody({ block, links, currentId }: { block: SubjectBlock; links: TopicLinks; currentId?: string }) {
  return (
    <>
      <h4>{block.name}</h4>
      <p>{block.blurb}</p>
      <div className="pano-chips">
        {block.topics.map((id) => links[id] ? <TopicChip key={id} link={links[id]} currentId={currentId} /> : null)}
        {block.gaps.map((g) => (
          <span key={g.title} className="pano-gap" title={g.note}>{g.title}<small>{g.note}</small></span>
        ))}
      </div>
    </>
  );
}

/** Generic subject panorama: blocks in path order as a flow of boxes. */
export function BlockFlow({ info, links, currentId }: { info: SubjectInfo; links: TopicLinks; currentId?: string }) {
  const { s } = useLang();
  return (
    <div className="pano-flow" role="list" aria-label={fmt(s.panoBlocksLabel, { id: info.id })}>
      {info.blocks.map((b, i) => (
        <div key={b.name} className={b.topics.includes(currentId ?? "") ? "pano-block current-block" : "pano-block"} role="listitem">
          {i > 0 && <span className="pano-arrow" aria-hidden="true">→</span>}
          <BlockBody block={b} links={links} currentId={currentId} />
        </div>
      ))}
    </div>
  );
}

/** OS panorama as an actual kernel structure diagram:
 *  user programs → syscall interface band → kernel blocks → hardware. */
export function OsKernelDiagram({ info, links, currentId }: { info: SubjectInfo; links: TopicLinks; currentId?: string }) {
  const { s } = useLang();
  const [iface, ...kernelBlocks] = info.blocks;
  return (
    <div className="kernel-diagram" aria-label={s.kdLabel}>
      <div className="kd-user">
        <span className="kd-tag">{s.kdUserTag}</span>
        <span className="kd-user-items">{s.kdUserItems}</span>
      </div>
      <div className="kd-arrow" aria-hidden="true">{s.kdGateIn}</div>
      {iface && (
        <div className={iface.topics.includes(currentId ?? "") ? "kd-iface current-block" : "kd-iface"}>
          <BlockBody block={iface} links={links} currentId={currentId} />
        </div>
      )}
      <div className="kd-kernel">
        <span className="kd-tag">{s.kdKernelTag}</span>
        <div className="kd-grid">
          {kernelBlocks.map((b) => (
            <div key={b.name} className={b.topics.includes(currentId ?? "") ? "pano-block current-block" : "pano-block"}>
              <BlockBody block={b} links={links} currentId={currentId} />
            </div>
          ))}
        </div>
      </div>
      <div className="kd-arrow" aria-hidden="true">{s.kdGateOut}</div>
      <div className="kd-hw">
        <span className="kd-tag">{s.kdHwTag}</span>
        <span className="kd-user-items">{s.kdHwItems}</span>
      </div>
    </div>
  );
}

export function SubjectDiagram({ info, links, currentId }: { info: SubjectInfo; links: TopicLinks; currentId?: string }) {
  return info.id === "os"
    ? <OsKernelDiagram info={info} links={links} currentId={currentId} />
    : <BlockFlow info={info} links={links} currentId={currentId} />;
}
