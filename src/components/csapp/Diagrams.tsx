/** Self-drawn HTML/CSS diagrams used in chapter 1 (and reusable callouts). */

export function Pipeline() {
  const steps = [
    ["预处理", "preprocess", ".i", "展开 #include、#define"],
    ["编译", "compile", ".s", "源码 → 汇编文本"],
    ["汇编", "assemble", ".o", "汇编 → 机器指令"],
    ["链接", "link", "a.out", "拼成可执行文件"],
  ];
  return (
    <div className="pipe" aria-label="编译流水线">
      {steps.map(([zh, en, ext, desc], i) => (
        <div key={en} className="pipe-step">
          {i > 0 && <span className="pipe-arrow" aria-hidden="true">→</span>}
          <div className="pipe-card">
            <b>{zh}</b>
            <code>{en}</code>
            <span className="pipe-ext">{ext}</span>
            <p>{desc}</p>
          </div>
        </div>
      ))}
    </div>
  );
}

export function StorageHierarchy() {
  const rows = [
    ["L0", "寄存器", "当前指令正在用的数"],
    ["L1–L3", "芯片上的 cache", "最近的热数据"],
    ["L4", "主存 DRAM", "代码和数据的主要栖身地"],
    ["L5", "本地磁盘", "文件与可执行程序"],
    ["L6", "远程存储", "最慢但容量很大"],
  ];
  return (
    <div className="hier" aria-label="存储层次">
      {rows.map(([lv, name, desc]) => (
        <div key={lv} className="hier-row">
          <span className="hier-lv">{lv}</span>
          <b>{name}</b>
          <span>{desc}</span>
        </div>
      ))}
    </div>
  );
}

export function LatencyBars() {
  const rows: [string, string, number][] = [
    ["一次主存读写", "几十 – 几百 ns", 1],
    ["一次本机 SSD 读写", "几十 – 几百 μs", 2],
    ["同机房网络往返", "0.1 – 1 ms", 3],
    ["跨地区网络往返", "几十 – 100+ ms", 4],
  ];
  return (
    <div className="lat" aria-label="延迟数量级">
      {rows.map(([name, val, w]) => (
        <div key={name} className="lat-row">
          <span>{name}</span>
          <div className="lat-track"><i style={{ width: `${w * 22}%` }} /></div>
          <b>{val}</b>
        </div>
      ))}
    </div>
  );
}
