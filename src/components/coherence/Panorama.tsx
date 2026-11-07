import Link from "next/link";
import type { SubjectBlock, SubjectInfo } from "@/lib/schema";

export type TopicLink = { id: string; title: string; href: string };
export type TopicLinks = Record<string, TopicLink>;

function TopicChip({ link, currentId }: { link: TopicLink; currentId?: string }) {
  const cur = link.id === currentId;
  return <Link className={cur ? "pano-chip current" : "pano-chip"} href={link.href} aria-current={cur ? "page" : undefined}>{link.title}</Link>;
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
  return (
    <div className="pano-flow" role="list" aria-label={`${info.id} 全景板块`}>
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
  const [iface, ...kernelBlocks] = info.blocks;
  return (
    <div className="kernel-diagram" aria-label="操作系统内核结构图">
      <div className="kd-user">
        <span className="kd-tag">用户态</span>
        <span className="kd-user-items">你写的程序 · shell · 浏览器 · 数据库服务</span>
      </div>
      <div className="kd-arrow" aria-hidden="true">↓ 只能从这扇门进 ↓</div>
      {iface && (
        <div className={iface.topics.includes(currentId ?? "") ? "kd-iface current-block" : "kd-iface"}>
          <BlockBody block={iface} links={links} currentId={currentId} />
        </div>
      )}
      <div className="kd-kernel">
        <span className="kd-tag">内核态 · 操作系统内核</span>
        <div className="kd-grid">
          {kernelBlocks.map((b) => (
            <div key={b.name} className={b.topics.includes(currentId ?? "") ? "pano-block current-block" : "pano-block"}>
              <BlockBody block={b} links={links} currentId={currentId} />
            </div>
          ))}
        </div>
      </div>
      <div className="kd-arrow" aria-hidden="true">↓ 驱动与控制 ↓</div>
      <div className="kd-hw">
        <span className="kd-tag">硬件</span>
        <span className="kd-user-items">CPU · 内存 · 磁盘 · 网卡 · 终端</span>
      </div>
    </div>
  );
}

export function SubjectDiagram({ info, links, currentId }: { info: SubjectInfo; links: TopicLinks; currentId?: string }) {
  return info.id === "os"
    ? <OsKernelDiagram info={info} links={links} currentId={currentId} />
    : <BlockFlow info={info} links={links} currentId={currentId} />;
}
