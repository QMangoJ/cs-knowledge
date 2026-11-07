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
- dsa/greedy、dsa/string-matching（KMP/BM）：（已补，2026-11-07 第四轮）
- os/threads-scheduling（线程模型、调度指标、FCFS/SJF/STCF/RR、MLFQ、优先级反转）：（已补，2026-11-07 第四轮）

P2（只记录，不排期）：总线与 DMA、内存一致性模型、gRPC 与序列化、概率分布与假设检验、计算理论（NP 完全性直觉）。

---

## 2026-11-07 第三轮：深度加厚 + 「为什么这样设计」

- 全部 32 个主题正文（steps body）由 45,192 字增至 150,490 字（3.33×），每课均 ≥3 倍、每步 body ≥300 字（脚本 scripts/depth-stats.mjs 逐课统计），步数普遍扩到 9–14，按对应教材章节结构补子话题。
- 全部 32 个主题新增 Topic 级 design 区块（每课 2–3 个机制，四要素：根本问题 / 为什么是这个方案 / 权衡 / 底层根源），schema 强制 published 主题 design ≥2 条；Player 在每课页头渲染独立区块。
- TCP 握手/挥手三点已按 Daniel 要求补齐：两将军不可能性（新步 two-generals + design）、为什么两次不够（新步 why-not-two + design）、四次挥手与 TIME_WAIT（half-close / timewait-ack / timewait 三步 + design）。
- 仍未补（P1 剩余）：无——已于第四轮全部补齐（见下）。

---

## 2026-11-07 第四轮：P1 三课补齐（贪心 / 字符串匹配 / 线程与调度）

- 新增 os/threads-scheduling（11 步，正文 6,504 字，design 3 条）：线程与进程的共享/独享清单、Linux 任务模型（clone 共享谱）、切换成本账、调度指标（周转/响应/公平）、FCFS 护航效应与 SJF 最优（OSTEP 例：平均周转 110 → 50）、STCF、作业时长不可知、MLFQ 五规则与防钻空子记账、优先级反转与 Pathfinder 案例、优先级继承。
- 新增 dsa/greedy（11 步，正文 6,317 字，design 3 条）：活动选择与交换论证、贪心选择性 + 最优子结构两道检查、找零反例（币制 1/3/4 凑 6：贪心 3 枚 vs 最优 2 枚）、分数背包与 0/1 背包分界（160 vs 220）、哈夫曼合并（经典频率总成本 224）、带权区间调度出局、最小生成树切割性质（例图总造价 13）、Dijkstra 贪心重审与负边反例（定案 2/4 vs 真实 1/3）、拟阵与对拍验证纪律。
- 新增 dsa/string-matching（11 步，正文 6,717 字，design 3 条）：问题定义、朴素法 Θ((n−m+1)m) 最坏构造、信息浪费的病理、KMP 思想、π 手算（模式 ABABCABAB：π = 0,0,1,2,0,1,2,3,4）、扫描走例（命中偏移 10）、摊还分析、BM 坏字符/好后缀与最好约 n/m、Rabin-Karp 与有限自动机（π 是自动机转移表的压缩）、选型、标准库 Two-Way 与向量化朴素法。
- 引用核实（本轮）：OSTEP Ch.7（cpu-sched.pdf）与 Ch.8（cpu-sched-mlfq.pdf）原文已逐条对照（指标定义、护航数值例、SJF/STCF 最优性表述、MLFQ 五规则、99% 钻空子与累计记账修正）；Mars Pathfinder 优先级反转据 JPL 团队负责人 Glenn Reeves 与 Mike Jones 的一手记述整理稿核查（1997-07-04 登陆、气象任务持信息总线锁、通信任务抢占、看门狗重启、从地球打开优先级继承开关），新增来源 mars-pathfinder；Boyer-Moore 原始论文出处经 Crossref 记录核对（CACM 20(10):762-772，DOI 10.1145/359842.359859），新增来源 boyer-moore-1977；其余引用沿用已 verified 的 ostep / csapp / linux-man-pages / linux-kernel-docs / xv6-book / clrs。
- 连贯性接入：subjects.yaml 中 OS「进程管理」板块的「线程与调度（待补）」虚线占位已由真课替换；DSA 新增「贪心：每步只取眼前最优」「字符串里的模式」两个板块。OS 路径 order 顺延：threads-scheduling 为第 4 站，virtual-memory 5、page-fault 6、lock 7、file-system 8、io-multiplexing 9；DSA 扩至 10 站（greedy 9、string-matching 10）。邻居桥同步：context-switch 的 next 改指向线程课、virtual-memory 的 prev 改自线程课承接、lock 的 prev 改为从线程的共享清单承接、dynamic-programming 新增指向 greedy 的 next。position/bridge 长句全站查重仍为 0 重复（构建期硬校验）。
- 至此 P1 缺口全部清零；全站 35 课。

---

## 2026-11-07 第五轮：新增 data/db-internals（数据库底层：页、日志与一次读写之旅）

- 新增 data/db-internals（12 步，正文 5,708 字，design 3 条，order 2）：三件套心智模型（页文件/Buffer Pool/只追加日志）、页的等大与乘法定位、读写以页为单位的三个根本原因、页解剖（页头/记录区/空闲/页目录槽位）、Buffer Pool 与 OS 虚拟内存的同构、一次写入之旅四幕（定位上桌 → 行锁 + undo 留底 → redo 刷盘与提交成立 → 检查点刷脏与断电恢复）、一次读取之旅两幕（缓冲池命中与耗时数量级 → 沿 undo 版本链做快照可见性判定）、SQLite/WAL 对照收尾。内容取材自 Daniel 已认可的独立讲解页「数据库底层之旅」，按课程体例重写、文风向通俗靠（比方先落地再给术语，深度不降）。
- 引用核实（本轮）：新增来源 mysql-innodb-docs（MySQL 官方手册/内部文档：默认页大小 16384、redo 为预写日志且提交时刷盘、undo 保留旧版本供并发事务读取、检查点与崩溃恢复）与 sqlite-docs（SQLite 官方 File Format 与 WAL 文档：默认页大小 4096、WAL 追加整页帧、检查点回搬、单写者），均于 2026-11-07 对官方页面核对后标 verified；页解剖的槽位页布局沿用已 verified 的 cmu-15445。
- 连贯性接入：subjects.yaml 数据存储科新增板块「引擎内幕：页、日志与一次读写」；数据存储路径由 3 站扩为 4 站（btree-index 1、db-internals 2、transactions 3、lsm-kv 4，order 已顺延）。邻居桥同步：btree-index 的 next 改指向本课（页在系统里的日常）、transactions 的 prev 改自本课写入之旅承接、transactions 的 position 首句同步改指本课；本课 position 与 prev/next 桥全新撰写。position/bridge 长句全站查重仍为 0 重复（构建期硬校验）。
- 至此全站 36 课。

---

## 2026-11-07 第六轮：数据存储科补三课（查询执行 / 锁与死锁 / 主从复制）

- 新增 data/query-execution（10 步，正文 5,807 字，design 3 条，order 5）：从单行到任意查询、优化器与执行器分工、统计信息（行数/基数/直方图）与成本模型（以页计价）、选索引的选择性账（回表 vs 全表扫的数字账）、连接顺序与中间结果、三连接算法（嵌套循环/哈希/排序合并，含「MySQL 未实现排序合并」的诚实标注）、执行计划流水线树与 EXPLAIN ANALYZE、计划翻车与纠错序。
- 新增 data/locks-deadlocks（11 步，正文 6,152 字，design 3 条，order 6）：丢失更新与锁的动机、锁挂在索引记录上（反直觉起点）、记录锁/间隙锁/临键锁谱系与 (10,20] 区间形状、间隙锁防幻读与两个例外、锁与 MVCC 的分工（快照读 vs 当前读、半一致性读）、等待队列与超时兜底、死锁成环与四条件对号、等待图检测与可关闭性、按改动行数挑牺牲者、少死锁的工程习惯。
- 新增 data/replication（10 步，正文 5,934 字，design 3 条，order 7）：复制的三个理由与写不可摊的边界、binlog 与 redo 两本账的区分、三线程复制链与 relay log、三种 binlog 格式的取舍、异步延迟的成因链与并行重放、写后读不一致的三档对策、半同步的签收语义与超时降级、故障切换的裁决与旧主隔离、脑裂与 fencing、一致性谱系定位、D1 同构收尾。
- 引用核实（本轮）：新增来源 mysql-optimizer-docs（10.9.6 直方图用于行数估算、10.2.1.4 哈希连接的适用条件与内存上限）、mysql-locking-docs（17.7.1 记录锁锁索引记录/间隙锁/临键锁/RC 关闭间隙锁、17.7.5.2 死锁检测按改动行数挑小事务回滚且高并发可关闭）、mysql-replication-docs（19.2.1 三种格式与 ROW 默认、19.2.3 三线程与 replica_parallel_workers 并行应用、19.4.10 半同步签收语义与超时降级、异步宕机丢事务与旧主隔离），均于 2026-11-07 对 MySQL 8.4 官方手册页面逐项核对后标 verified。
- 连贯性接入：数据存储科新增板块「查询的执行」「锁与死锁」「复制：一本账，多个副本」；数据存储路径由 4 站扩为 7 站。邻居桥同步：lsm-kv 新增 next 指向查询执行课、query-execution 新增 next 指向锁课、locks-deadlocks 新增 next 指向复制课；三课 position 与桥全新撰写。position/bridge 长句全站查重仍为 0 重复（构建期硬校验）。e2e 新增 phase8 共 17 条断言。
- 至此全站 39 课。

---

## 2026-11-07 第七轮：新科「分布式系统」（4 课）

- 新增 distributed/why-hard（10 步，正文 4,173 字，design 3 条，第 1 站）：单机四条隐含假设（调用即达/失败即知/时钟唯一/状态一处）逐条作废、节点间只有消息、部分失败作为定义性特征、死与慢不可区分与超时无正确值、墙钟漂移、延迟物理下限、重试放大与故障检测的概率性、分布式换来的三样东西（规模/容错/就近）、全科地图。
- 新增 distributed/cap-consistency（10 步，正文 4,519 字，design 3 条，第 2 站）：一致性作为协议契约、CAP 准确含义（线性一致/可用/分区为前提，分区时才二选一）、分区十分钟的选 A/选 C 两笔账、「平时三选二」误读纠正、PACELC 补上平时延迟一半、谱系三档（线性一致/因果一致/最终一致与购物车并集合并、会话保证补丁）、MySQL 异步主从/半同步/D1 的站位回扣、选档三问法。
- 新增 distributed/raft-consensus（10 步，正文 4,721 字，design 3 条，第 3 站）：裁决问题与共识定义、复制状态机收敛问题、任期与强主、完整一轮选举（含平票与随机超时）、完整一轮日志复制与多数派提交规则、多数派交集安全性证明骨架（交集留痕 + 选举限制）、故障三演（半路宕机/分区少数派/旧主任期作废）、成员变更单步替换、与两将军问题的三处前提划界（非拜占庭 + 多数派可达）、共识在控制面的落点。
- 新增 distributed/time-and-transactions（10 步，正文 4,866 字，design 3 条，第 4 站）：墙钟裁决的静默翻车（最后写入者胜丢新值）、happens-before 因果定义、Lamport 时钟三规则与单向局限、向量时钟三值判定与冲突检测、要全序即是共识问题（附 TrueTime 把误差换成等待的思路）、跨机事务原子性缺口、2PC 两段全程、协调者阻塞之痛与可用性乘积、Saga 补偿 + 幂等 + 去重退路、落点「先问能不能不做分布式事务」与全科收官。
- 引用核实（本轮）：新增来源 ddia（Kleppmann《Designing Data-Intensive Applications》，作者站 dataintensive.net 已核对；引用定位于第 8 章部分失败/不可靠时钟/故障检测/happens-before/逻辑时钟、第 9 章线性一致与 CAP 语境/共识/2PC、第 5 章购物车并集收敛）与 raft-paper（Ongaro & Ousterhout, USENIX ATC 2014；raft.github.io 与论文已核对：复制状态机结构、选举与随机超时、多数派提交、5 台容忍 2 台故障），均于 2026-11-07 核实后标 verified。
- 连贯性接入：subjects.yaml 新增学科 distributed（tagline + 四个板块，与四课一一对应）；首页「程序的一生」旅程在网络后新增一环「走出单机」（旅程 6 环变 7 环）；schema 枚举、i18n 学科名、首页 ROUTE 与学科区同步接入（基础设施提交 5402a2e）；ROADMAP 首条改为「分布式进阶：消息队列、限流与重试、服务治理」。四课桥链完整（why-hard → cap → raft → time-and-transactions），position/bridge 长句全站查重仍为 0 重复（构建期硬校验）。e2e 新增 phase9 共 16 条断言，phase2 路线断言更新为 8 站、phase4 旅程/学科导览更新为 7。
- 至此全站 43 课，学科 7 科。

---

## 2026-11-07 第八轮：新科「人工智能」（4 课）

- 新增 ai/neural-backprop（10 步，正文 4,384 字，design 3 条，第 1 站）：神经元作为加权求和机器、损失作为唯一可导记分牌、一次前向 + 一次反向的完整之旅。算例全程手算并由脚本复核：x=1、w1=0.5、w2=2 时前向得 1.0、损失 0.5；三棒梯度 dL/dout=−1、dL/dw2=−0.5、dL/dw1=−2；学习率 0.1 更新后（w1=0.7、w2=2.05）再前向得 1.435、损失 ≈0.16。另讲梯度连乘的爆炸/消失种子、反向一趟算全部梯度的摊销原理与激活必存的纪律。
- 新增 ai/attention-transformer（10 步，正文 4,645 字，design 3 条，第 2 站）：RNN 的距离账与并行账、注意力作为可导查表、QKV 三分工、softmax 算例（原始分 [2,1,0] → 权重 [0.665,0.245,0.09]，脚本复核；加权和 14.25 的指代消解演示）、√d 缩放、多头与位置编码、Transformer 层三件套（前馈/残差/归一化）、因果掩码与自回归、n² 平方账。design 正面落在「为什么并行性赢了表达力之争」：胜负手是硬件经济学而非纸面表达力。
- 新增 ai/training（10 步，正文 4,665 字，design 3 条，第 3 站）：以 7B 模型混合精度 + Adam 逐项算显存账——参数 14 GB + 梯度 14 GB + FP32 主权重 28 GB + Adam 双动量 56 GB = 16 字节/参数 ≈ 112 GB（脚本复核），由此逼出分布式训练；激活随批×序列涨、梯度检查点以约 1/3 计算换显存；计算账由乘加计数推出前向 2N / 反向 4N / 训练 6N；batch 与学习率连体、梯度噪声的双面性、GPU/SIMT 呼应、一步时间构成与 MFU 三到五成的经验区间、训练贵于推理的三重乘积。
- 新增 ai/inference-kv-cache（9 步，正文 4,202 字，design 3 条，第 4 站）：prefill/decode 两段与各自瓶颈、无缓存的平方重算、KV 缓存机制与内存账（2×32 层×4096×2B = 524,288 B/token，脚本复核；4K 上下文单条约 2 GB、32 并发或 128K 单条约 69 GB）、decode 的带宽瓶颈与量化的真动机、连续批处理按 token 调度、PagedAttention 与 OS 分页同构、投机解码的分布等价保证、推理作为独立生意的成本结构收官。
- 引用核实（本轮）：新增来源 attention-paper（arXiv:1706.03762，摘要与第 3.1/3.2 节定位已核对：缩放点积注意力、多头、纯注意力弃循环）、adam-paper（arXiv:1412.6980，摘要与算法 1 已核对：双矩估计）、speculative-decoding（arXiv:2211.17192，摘要已核对：起草—验证与输出分布不变、T5-XXL 2–3 倍加速）；PagedAttention 沿用库内已 verified 的 vllm-pagedattention。本课全部教学数字（反向传播算例、softmax、显存账、6N、KV 尺寸）均以脚本逐项复算，与正文一致。
- 连贯性接入：subjects.yaml 新增学科 ai（tagline + 四个板块）；首页旅程在数学之后新增收官一环「程序从数据里学」（旅程 7 环变 8 环）；首页 ROUTE 与学科区同步接入 ai。桥链完整（backprop → attention → training → inference），training 的 prereq 点名 co/gpu-simt、attention 与 distributed/time 的 aiLink 互文。position/bridge 长句全站查重仍为 0 重复（构建期硬校验）。e2e 新增 phase10 共 16 条断言，phase2 路线断言更新为 9 站、phase4 旅程/学科导览更新为 8。
- 至此全站 47 课，学科 8 科。三阶段扩建（数据补三 + 分布式四 + 人工智能四，共 11 课）全部完成。
