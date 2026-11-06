# 课程完整性与准确性审计（2026-11-07）

核查范围：全部 21 个已发布主题（OS 6 / 组成 6 / DSA 6 / 网络 3），逐主题提取实质性事实断言对照一手来源（OSTEP、CSAPP、MIT OCW、Linux man-pages 与 kernel 文档、RFC 原文、MDN、Joshua Bloch 博文、vLLM 论文等）核实；64 道课末题逐题独立解算；各主题代码块实跑或逐行推演（DSA 的 TS 实现抽出运行断言、Python 浮点/C 的 fork+mutex 片段实测、shell 命令逐个验证存在与用法）。

## 核查计数

| 学科 | 断言（组） | 正确 | 错误 | 不精确 | 无权威依据 |
|---|---|---|---|---|---|
| 操作系统 6 课 | 94 | 63 | 2 | 19 | 10 |
| 组成原理 6 课 | 91 | 69 | 2 | 17 | 3 |
| 数据结构与算法 6 课 | 73 | 53 | 1 | 约 14 | 约 4 |
| 计算机网络 3 课 | 52 | 27 | 5 | 13 | 7 |
| 合计 | 310 | 212 | 10 | 约 63 | 约 24 |

处置：10 条错误全部改正文；约 63 条不精确逐条改写为有把握的表述（数字加量级/条件限定）；约 24 条无权威依据的删除具体数字或降格为「量级示意/经验口径」。仓库引用条目 140 条已全部为 `status: verified`（checkedAt 2026-11-07）。

典型错误（已修）：

- OS：errno 被写成「全局变量」→ 实为线程本地变量（man 3 errno）；上下文切换开销占比「不到千分之一」与自身给出的微秒级成本自相矛盾，已改按量级估算。
- 组成：流水线一节把「排序后分支更好预测」的经典例子写反；缓存延迟阶梯「每跨一级差一个数量级」不实（相邻约数倍、L1 到 SSD 累计约五个数量级）。
- DSA：哈希表 aiLink 把 embedding 说成哈希表——实为 id 直索引矩阵，「真哈希」是 hashing trick；计数排序复杂度漏了值域项 k。
- 网络：FIN 与 ACK「无法合并」错误（无数据时可合并成三包）；TIME_WAIT 把规范的 2MSL 与 Linux 实际 60 秒混为一谈；SSE 消费代码未处理跨 chunk 的半行/半个事件（已整段重写并实测逻辑）。

quiz 复核：64 题逐题独立解算，答案唯一性、answer 下标与 explain 一致性全部通过，未改题；发现答案位置严重偏斜（61/64 在下标 1）——组件不打乱选项，属可钻空子的隐患（2026-11-07 Daniel 定版撤掉课末自测后，此问题随渲染移除而消失，数据保留在仓库）。

未核实清单（诚实边界）：

- lab 案例的期望计数属站内自洽断言，由 lab selftest 与浏览器实测覆盖，不冒充外部事实。
- 个别「工程经验」数字（如网卡/调度经验量级）已按「经验口径」在正文中明示，不标为规范事实。

## 完整性差距（对照 MIT EECS 核心课程地图 + 前端转 AI 工程的目标）

已覆盖：进程/虚拟内存/锁、指令与流水线/缓存、哈希/二分/排序/堆/图遍历/最短路、TCP/HTTP 流式/DNS-CDN。

太浅（2026-11-07 已加深）：dijkstra（补 Bellman-Ford 步 + 实验室）、binary-heap（补 decrease-key 步 + 实验室）、page-fault（补页置换 LRU/Clock 步）、fork-exec（补 IPC 步）、bfs-dfs（补并查集步 + 遍历实验室）、hash-table / cache（各补可换输入实验室）。

P0 缺失（2026-11-07 第二阶段补全）：

1. os/file-system —— 文件、inode、目录、日志与崩溃一致性：任何后端与数据工作都绕不开。
2. os/io-multiplexing —— 阻塞 vs 非阻塞、select/poll/epoll：推理服务高并发的地基。
3. co/gpu-simt —— GPU 的 SIMT 执行与显存层级：AI 工程最贴身的硬件课。
4. dsa/bst-trees —— 二叉搜索树与平衡（AVL/红黑直觉）：索引与有序容器的前置。
5. dsa/dynamic-programming —— 状态与转移、背包与序列 DP：算法面试与优化问题的主力。
6. data/btree-index（新学科「数据存储」）—— B+ 树与数据库索引：为什么索引是 B+ 树不是二叉树。
7. data/transactions —— 事务、隔离级别、MVCC 与 WAL：写系统的正确性底线。
8. network/congestion —— 流量控制与拥塞控制：TCP 完整性的另一半。

P1 缺失（尽量补，剩余在此标注状态）：

- network/http2-quic —— HTTP/2 多路复用、队头阻塞与 QUIC/HTTP/3。（已补）
- data/lsm-kv —— LSM 树与 KV 存储、向量索引入门。（已补）
- math/probability（新学科「数学基础」）—— 条件概率、贝叶斯、期望与方差。（已补）
- dsa/greedy、dsa/string-matching（KMP/Trie）：未补，列入下一轮。
- os/threads-scheduling（调度算法 MLFQ/CFS 深入）：未补，列入下一轮。

P2（只记录，不排期）：总线与 DMA、内存一致性模型、gRPC 与序列化、概率分布与假设检验、计算理论（NP 完全性直觉）。

---

## 2026-11-07 第三轮：深度加厚 + 「为什么这样设计」

- 全部 32 个主题正文（steps body）由 45,192 字增至 150,490 字（3.33×），每课均 ≥3 倍、每步 body ≥300 字（脚本 scripts/depth-stats.mjs 逐课统计），步数普遍扩到 9–14，按对应教材章节结构补子话题。
- 全部 32 个主题新增 Topic 级 design 区块（每课 2–3 个机制，四要素：根本问题 / 为什么是这个方案 / 权衡 / 底层根源），schema 强制 published 主题 design ≥2 条；Player 在每课页头渲染独立区块。
- TCP 握手/挥手三点已按 Daniel 要求补齐：两将军不可能性（新步 two-generals + design）、为什么两次不够（新步 why-not-two + design）、四次挥手与 TIME_WAIT（half-close / timewait-ack / timewait 三步 + design）。
- 仍未补（P1 剩余）：dsa/greedy、dsa/string-matching、os/threads-scheduling。
