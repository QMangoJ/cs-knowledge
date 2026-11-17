// Bilingual frame-message templates for the lab trace functions.
//
// Why this table lives here instead of src/i18n/*.json: the lab lib modules
// are loaded standalone by scripts/lab-selftest.mts with plain Node (no path
// aliases, no JSON imports), so they cannot read the app's string tables.
// The templates are keyed per lab, mirroring the i18n tables' {placeholder}
// convention; components pass their current language into the trace calls.
export type LabLang = "zh" | "en";

const fmt = (tpl: string, vars: Record<string, string | number>): string =>
  tpl.replace(/\{(\w+)\}/g, (m, k: string) => (k in vars ? String(vars[k]) : m));

export const LAB_MSG = {
  zh: {
    hash: {
      empty: "空表，容量 {cap}，h(k) = k mod {cap}，冲突时线性探测（往后顺延一格再试）。",
      resize: "负载因子将超过 0.7：容量翻倍到 {cap}，全部 {size} 个键按新模数重新散列（rehash）。",
      insertDirect: "插入 {k}：h={home}，槽位空闲，直接落座（探测 1 次）。",
      insertProbed: "插入 {k}：h={home} 被占，顺延探测 {probes} 次后落座。",
    },
    heap: {
      empty: "空堆。从左到右逐个插入：新元素先放数组末尾，再与父节点比较、逐层上浮（sift-up）。",
      insert: "插入 {v}：上浮 {moves} 次后就位。堆顶（下标 0）是当前最小值 {top}。",
      extract: "取出最小值 {top}：末尾元素补到堆顶再逐层下沉（sift-down），恢复堆序。",
      done: "全部取出完毕，取出顺序即从小到大：{list}——这正是堆排序的后半程。",
    },
    graph: {
      bfsInit: "队列初始化：[{start}]（标记已入队，避免重复入队）。",
      bfsVisit: "出队访问 {u}，其未见邻居 {fresh} 依次入队尾。",
      dfsInit: "栈初始化：[{start}]（入栈即标记，保证每个节点只入栈一次）。",
      dfsVisit: "出栈访问 {u}，未见邻居 {fresh} 压栈（后压的先出）。",
      end: "{container}已空，遍历结束：{order}。",
      queue: "队列",
      stack: "栈",
      none: "（无）",
      joiner: "、",
    },
    dijkstra: {
      init: "初始：dist[{source}]=0，其余为 ∞。",
      settle: "未定节点中 dist 最小的是 {u}（{d}），定版；松弛其出边{updates}。",
      update: "，更新 {ups}",
      noUpdate: "，无更新",
      done: "全部定版。最短距离：{list}。",
      joiner: "、",
      listJoiner: "，",
    },
    cache: {
      intro: "直接映射缓存：{lines} 行 × 块 {block}B。地址先除以块大小得块号，块号 mod {lines} 决定行号，商是标签。",
      hit: "访问 {a}（块 {blk}）：行 {index} 标签 {tag} 命中 ✓",
      miss: "访问 {a}（块 {blk}）：行 {index} 未命中，把块 {blk} 装入该行（标签记 {tag}），同块的其余 {rest} 字节也一并进缓存。",
      end: "结束：命中 {hits} 次，未命中 {misses} 次，命中率 {rate}%。",
    },
    race: {
      waitLock: "{name} 等锁",
      lock: "{name} 加锁",
      unlock: "{name} 解锁",
      read: "{name} 读 {v}",
      add: "{name} 算 {v}",
      write: "{name} 写 {v}",
    },
  },
  en: {
    hash: {
      empty: "Empty table, capacity {cap}, h(k) = k mod {cap}; on a collision, linear probing tries the next slot along.",
      resize: "The load factor would pass 0.7: capacity doubles to {cap}, and all {size} keys are rehashed under the new modulus.",
      insertDirect: "Insert {k}: h={home}, the slot is free — seated right away (1 probe).",
      insertProbed: "Insert {k}: h={home} is taken — seated after {probes} probes.",
    },
    heap: {
      empty: "Empty heap. Insert one by one from left to right: each new element is placed at the end of the array, then sifts up, comparing against its parent level by level.",
      insert: "Insert {v}: sifted up {moves} times and settled. The heap top (index 0) is the current minimum, {top}.",
      extract: "Extract the minimum {top}: the last element moves to the top and sifts down, restoring the heap order.",
      done: "All extracted, and the extraction order is ascending: {list} — that is exactly the second half of heapsort.",
    },
    graph: {
      bfsInit: "Queue initialized: [{start}] (marked as enqueued, so it never enters twice).",
      bfsVisit: "Dequeue and visit {u}; its unseen neighbours {fresh} join the back of the queue.",
      dfsInit: "Stack initialized: [{start}] (marked on push, so every node is pushed exactly once).",
      dfsVisit: "Pop and visit {u}; its unseen neighbours {fresh} are pushed (the last one pushed pops first).",
      end: "The {container} is empty; the traversal is complete: {order}.",
      queue: "queue",
      stack: "stack",
      none: "(none)",
      joiner: ", ",
    },
    dijkstra: {
      init: "Initial state: dist[{source}]=0, all others are ∞.",
      settle: "Among the unsettled nodes, {u} has the smallest dist ({d}) — settle it and relax its outgoing edges{updates}.",
      update: ", updating {ups}",
      noUpdate: ", with no updates",
      done: "All settled. Shortest distances: {list}.",
      joiner: ", ",
      listJoiner: ", ",
    },
    cache: {
      intro: "A direct-mapped cache: {lines} lines × {block} B blocks. Dividing the address by the block size gives the block number; the block number mod {lines} picks the line, and the quotient is the tag.",
      hit: "Access {a} (block {blk}): line {index}, tag {tag} — hit ✓",
      miss: "Access {a} (block {blk}): line {index} — miss. Block {blk} is loaded into the line (tag recorded as {tag}), and the other {rest} bytes of the block come into the cache along with it.",
      end: "Done: {hits} hits, {misses} misses, hit rate {rate}%.",
    },
    race: {
      waitLock: "{name} waits for the lock",
      lock: "{name} acquires the lock",
      unlock: "{name} releases the lock",
      read: "{name} reads {v}",
      add: "{name} computes {v}",
      write: "{name} writes {v}",
    },
  },
} as const;

export type LabMessages = (typeof LAB_MSG)["zh"];

export function labMsg(lang: LabLang): LabMessages {
  return LAB_MSG[lang] as LabMessages;
}

export { fmt as labFmt };
