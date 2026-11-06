import type { PerfKind } from "./run";

export type Stmt = { en: string; zh: string };
export type Case = { name: string; args: unknown[]; expect: unknown };
export type PerfCase = { name: string; kind: PerfKind; note: string };
export type Problem = {
  slug: string; group: "practice" | "mock"; title: string; titleZh: string; lesson: string;
  complexity: string; stub: string; statement: Stmt[]; examples: { input: string; output: string }[];
  cases: Case[]; perf?: PerfCase; reference: string; explainZh: string;
};

const P: Problem[] = [
{
  slug: "binary-gap", group: "practice", title: "Binary Gap", titleZh: "二进制间距", lesson: "Codility Lesson 1 · Iterations（迭代）", complexity: "O(log N) 时间，O(1) 空间",
  stub: "function solution(N) {\n  // your code here\n}\n",
  statement: [
    { en: "A binary gap within a positive integer N is any maximal sequence of consecutive zeros that is surrounded by ones at both ends in the binary representation of N.", zh: "正整数 N 的「二进制间距」是指：在 N 的二进制表示中，两端都被 1 包围的一段极大连续 0 序列。" },
    { en: "For example, 9 = 1001₂ has a binary gap of length 2; 529 = 1000010001₂ has two gaps, of length 4 and 3; 20 = 10100₂ has a gap of length 1; 15 = 1111₂ and 32 = 100000₂ have no binary gap.", zh: "例如 9 = 1001₂ 有一个长度为 2 的间距；529 = 1000010001₂ 有两个间距，长度分别为 4 和 3；20 = 10100₂ 有一个长度为 1 的间距；15 = 1111₂ 与 32 = 100000₂ 没有二进制间距。" },
    { en: "Write a function solution(N) returning the length of the longest binary gap, or 0 if N has none. Constraints: N is an integer within [1..2,147,483,647]. Trailing zeros never count, because they are not surrounded by ones at both ends.", zh: "写函数 solution(N)，返回最长二进制间距的长度；若不存在则返回 0。约束：N 为 [1..2,147,483,647] 内的整数。注意末尾的 0 永远不算，因为它们右端没有 1 包围。" },
  ],
  examples: [{ input: "N = 1041 (10000010001₂)", output: "5" }, { input: "N = 9", output: "2" }],
  cases: [
    { name: "9 -> 2", args: [9], expect: 2 }, { name: "529 -> 4", args: [529], expect: 4 },
    { name: "20 -> 1", args: [20], expect: 1 }, { name: "15 -> 0", args: [15], expect: 0 },
    { name: "32 -> 0", args: [32], expect: 0 }, { name: "1041 -> 5", args: [1041], expect: 5 },
    { name: "1 -> 0", args: [1], expect: 0 }, { name: "max int -> 0", args: [2147483647], expect: 0 },
  ],
  reference: "function solution(N) {\n  let best = 0, cur = 0, seenOne = false;\n  while (N > 0) {\n    if (N & 1) { if (seenOne) best = Math.max(best, cur); seenOne = true; cur = 0; }\n    else if (seenOne) cur++;\n    N >>= 1;\n  }\n  return best;\n}",
  explainZh: "思路：从最低位往高位逐位扫描。用 seenOne 标记「已经遇到过 1」——只有在两个 1 之间的 0 才计数，末尾（低位侧先遇到的、左端没有 1 的）0 自然被排除。每遇到新的 1 就结算一次当前长度。时间 O(log N)（位数），空间 O(1)。易错点：先把 N 转成字符串再数也可以，但同样要注意结尾的 0 不能算。",
},
{
  slug: "cyclic-rotation", group: "practice", title: "Cyclic Rotation", titleZh: "数组循环右移", lesson: "Codility Lesson 2 · Arrays（数组）", complexity: "O(N) 时间，O(N) 空间",
  stub: "function solution(A, K) {\n  // your code here\n}\n",
  statement: [
    { en: "Rotating an array once means shifting each element one position to the right; the last element moves to the front.", zh: "把数组旋转一次，意思是每个元素向右移动一位；最后一个元素挪到最前面。" },
    { en: "Write a function solution(A, K) returning array A rotated K times. Constraints: N and K are within [0..100]; each element of A is within [-1000..1000]. Watch out: K can be larger than N, and A can be empty.", zh: "写函数 solution(A, K)，返回把 A 旋转 K 次后的数组。约束：N 与 K 都在 [0..100] 内；A 的元素在 [-1000..1000] 内。注意：K 可能大于 N，且 A 可能为空数组。" },
  ],
  examples: [{ input: "A = [3, 8, 9, 7, 6], K = 3", output: "[9, 7, 6, 3, 8]" }, { input: "A = [1, 2, 3, 4], K = 4", output: "[1, 2, 3, 4]" }],
  cases: [
    { name: "basic", args: [[3, 8, 9, 7, 6], 3], expect: [9, 7, 6, 3, 8] },
    { name: "zeros", args: [[0, 0, 0], 1], expect: [0, 0, 0] },
    { name: "full turns", args: [[1, 2, 3, 4], 4], expect: [1, 2, 3, 4] },
    { name: "empty", args: [[], 3], expect: [] },
    { name: "single, K>N", args: [[5], 7], expect: [5] },
  ],
  reference: "function solution(A, K) {\n  const n = A.length;\n  if (n === 0) return [];\n  const shift = K % n;\n  return A.slice(n - shift).concat(A.slice(0, n - shift));\n}",
  explainZh: "思路：旋转 n 次回到原样，所以真正的位移只有 K % N。右移 shift 位 = 把最后 shift 个元素整段搬到前面，用两次 slice + concat 一次完成，不要真的一步步挪 K 次。下标法（result[(i + shift) % N] = A[i]）同样 O(N)。易错点：空数组先返回，避免对 0 取模。",
},
{
  slug: "odd-occurrences", group: "practice", title: "Odd Occurrences In Array", titleZh: "数组中落单的数", lesson: "Codility Lesson 2 · Arrays（数组）", complexity: "O(N) 时间，O(1) 额外空间",
  stub: "function solution(A) {\n  // your code here\n}\n",
  statement: [
    { en: "A non-empty array A consisting of N integers is given. The array contains an odd number of elements, and each element of the array can be paired with another element that has the same value, except for one element that is left unpaired.", zh: "给定一个由 N 个整数组成的非空数组 A。数组的元素个数是奇数，其中每个元素都能和另一个相同值的元素配对，只有一个元素落单、没有配对。" },
    { en: "Write a function solution(A) that, given an array A consisting of N integers fulfilling the above conditions, returns the value of the unpaired element.", zh: "写一个函数 solution(A)，给定满足上述条件的、由 N 个整数组成的数组 A，返回那个没有配对的元素的 value。" },
    { en: "Assume that: N is an odd integer within the range [1..1,000,000]; each element of array A is an integer within the range [1..1,000,000,000]; all but one of the values in A occur an even number of times. Required complexity: O(N) time, O(1) extra space.", zh: "假设：N 是 [1..1,000,000] 范围内的奇数；数组 A 的每个元素是 [1..1,000,000,000] 范围内的整数；A 中除一个值以外，其他每个值都出现偶数次。要求的复杂度：时间 O(N)，额外空间 O(1)。" },
  ],
  examples: [{ input: "A = [9, 3, 9, 3, 9, 7, 9]", output: "7" }],
  cases: [
    { name: "basic", args: [[9, 3, 9, 3, 9, 7, 9]], expect: 7 },
    { name: "single", args: [[42]], expect: 42 },
    { name: "small", args: [[1, 2, 1]], expect: 2 },
    { name: "large value", args: [[1000000000, 5, 5]], expect: 1000000000 },
  ],
  reference: "function solution(A) {\n  let x = 0;\n  for (const v of A) x ^= v;\n  return x;\n}",
  explainZh: "思路：异或的两个性质——a ^ a = 0、a ^ 0 = a，且满足交换律。把全部元素依次异或，成对出现的值互相抵消成 0，最后剩下的就是落单的那个。一次遍历、O(1) 额外空间。用计数对象/Set 也能做对，但空间是 O(N)，不满足题目要求。",
},
{
  slug: "frog-jmp", group: "practice", title: "Frog Jmp", titleZh: "青蛙跳", lesson: "Codility Lesson 3 · Time Complexity（时间复杂度）", complexity: "O(1) 时间与空间",
  stub: "function solution(X, Y, D) {\n  // your code here\n}\n",
  statement: [
    { en: "A frog at position X wants to reach a position >= Y. Each jump covers exactly D. Count the minimal number of jumps.", zh: "一只青蛙在位置 X，想到达位置 >= Y。它每次跳跃恰好跳 D 的距离。求最少需要跳多少次。" },
    { en: "Write a function solution(X, Y, D). Constraints: X, Y and D are within [1..1,000,000,000]. Required: O(1). No loops.", zh: "写函数 solution(X, Y, D)。约束：X、Y、D 都在 [1..1,000,000,000] 内。要求：O(1)，不要用循环。" },
  ],
  examples: [{ input: "X = 10, Y = 85, D = 30", output: "3" }],
  cases: [
    { name: "basic", args: [10, 85, 30], expect: 3 },
    { name: "already there", args: [5, 5, 10], expect: 0 },
    { name: "exact landing", args: [3, 12, 3], expect: 3 },
  ],
  perf: { name: "huge (performance): X=1, Y=1e9, D=1", kind: "frog-huge", note: "循环模拟要跳近 10 亿次必然超时；公式一次算完。限时 1000 ms。" },
  reference: "function solution(X, Y, D) {\n  if (Y <= X) return 0;\n  return Math.ceil((Y - X) / D);\n}",
  explainZh: "思路：距离差 Y − X 除以每跳 D，向上取整就是最少跳数——最后一跳可以跳过头。一行公式 O(1)。易错点：一格一格模拟在 Y − X 接近 10 亿时直接超时，这正是本题（Lesson 3 时间复杂度）要考的判断。",
},
{
  slug: "perm-missing-elem", group: "practice", title: "Perm Missing Elem", titleZh: "缺失的排列元素", lesson: "Codility Lesson 3 · Time Complexity（时间复杂度）", complexity: "O(N) 时间，O(1) 额外空间",
  stub: "function solution(A) {\n  // your code here\n}\n",
  statement: [
    { en: "An array A of N distinct integers within [1..N+1] is a permutation missing exactly one element. Find the missing element.", zh: "数组 A 里有 N 个互不相同的整数，取值在 [1..N+1] 内，它是一个恰好缺了一个元素的排列。找出缺失的那个元素。" },
    { en: "Write a function solution(A). Constraints: N is within [0..100,000]; each element of A is within [1..N+1]. Required: O(N) or O(N log N).", zh: "写函数 solution(A)。约束：N 在 [0..100,000] 内；A 的元素在 [1..N+1] 内。要求：O(N) 或 O(N log N)。" },
  ],
  examples: [{ input: "A = [2, 3, 1, 5]", output: "4" }],
  cases: [
    { name: "basic", args: [[2, 3, 1, 5]], expect: 4 },
    { name: "empty -> 1", args: [[]], expect: 1 },
    { name: "[1] -> 2", args: [[1]], expect: 2 },
    { name: "[2] -> 1", args: [[2]], expect: 1 },
    { name: "missing last", args: [[1, 2, 3, 4, 5, 6, 7, 8, 9, 10]], expect: 11 },
  ],
  reference: "function solution(A) {\n  const n = A.length;\n  const expected = ((n + 1) * (n + 2)) / 2;\n  let sum = 0;\n  for (const v of A) sum += v;\n  return expected - sum;\n}",
  explainZh: "思路：完整的 1..N+1 之和是 (N+1)(N+2)/2，减去数组实际之和，差就是缺的那个数。一次遍历 O(N)。注记：JS 数字是双精度浮点，整数在 2^53 内精确，所以本题规模下求和不会溢出——但在 C/Java 里要用 long，心里要有这根弦。异或法（全部数与 1..N+1 异或）同样可行。",
},
{
  slug: "tape-equilibrium", group: "practice", title: "Tape Equilibrium", titleZh: "胶带平衡点", lesson: "Codility Lesson 3 · Time Complexity（时间复杂度）— 经典性能坑", complexity: "O(N) 时间，O(1) 额外空间",
  stub: "function solution(A) {\n  // your code here\n}\n",
  statement: [
    { en: "An array A of N integers is given. For a split point P (0 < P < N), the difference is |(sum of the first P elements) − (sum of the remaining elements)|. Find the minimal possible difference.", zh: "给定一个由 N 个整数组成的数组 A。对于切分点 P（0 < P < N），差值定义为 |(前 P 个元素之和) − (其余元素之和)|。求所有切分点中可能的最小差值。" },
    { en: "Constraints: N is within [2..100,000]; each element of A is within [-1,000..1,000]. Required: O(N). The naive recompute-both-sides approach is O(N²) and the large performance test will expose it — that contrast is the whole point of this exercise.", zh: "约束：N 在 [2..100,000] 内；A 的元素在 [-1,000..1,000] 内。要求：O(N)。每个切分点都重新累加两边是 O(N²)，大输入的性能用例会直接把它暴露出来——这个对比正是本题的意义所在。" },
  ],
  examples: [{ input: "A = [3, 1, 2, 4, 3]", output: "1（P=3 时 |6 − 7| = 1）" }],
  cases: [
    { name: "basic", args: [[3, 1, 2, 4, 3]], expect: 1 },
    { name: "pair", args: [[1, 1]], expect: 0 },
    { name: "extremes", args: [[-1000, 1000]], expect: 2000 },
    { name: "negatives", args: [[-10, -20, -30]], expect: 0 },
  ],
  perf: { name: "large input (performance): N=100,000", kind: "tape-large", note: "O(N²) 写法在 100,000 个元素上要算约 50 亿次加法（浏览器里也要数秒）；O(N) 前缀和只要几毫秒。限时 1000 ms。原练习包的 Node 版用例是 30,000 个元素——浏览器 JIT 太快会让 O(N²) 蒙混过关，所以这里按约束上限取 100,000。" },
  reference: "function solution(A) {\n  let total = 0;\n  for (const v of A) total += v;\n  let left = 0, best = Infinity;\n  for (let p = 0; p < A.length - 1; p++) {\n    left += A[p];\n    best = Math.min(best, Math.abs(total - 2 * left));\n  }\n  return best;\n}",
  explainZh: "思路：先求总和 total。左半边逐个累加 left，右半边就是 total − left，差 = |total − 2·left|，一次遍历扫完所有切分点（注意 P 不能等于 N，最后一个元素必须留在右边）。关键是右半边的和由减法得来，而不是每个点重算——这是前缀和思想的入门形态。",
},
{
  slug: "frog-river-one", group: "mock", title: "Frog River One", titleZh: "青蛙过河", lesson: "Mock 01 · Task 1（目标 25 分钟）— Codility Lesson 4 · Counting Elements", complexity: "O(N) 时间，O(X) 空间",
  stub: "function solution(X, A) {\n  // your code here\n}\n",
  statement: [
    { en: "A frog wants to cross from position 0 to position X+1. Leaves fall onto the river; A[K] is the position where a leaf falls at time K (seconds). Find the earliest time when leaves cover every position from 1 to X, so the frog can jump.", zh: "青蛙想从位置 0 过河到位置 X+1。树叶不断落到河面上：A[K] 表示在时刻 K（秒）落叶的位置。求树叶第一次盖满 1 到 X 全部位置的最早时刻，那时青蛙就能跳过去。" },
    { en: "Write a function solution(X, A) returning the earliest time K, or -1 if impossible. Constraints: N and X are within [1..100,000]; each element of A is within [1..X]. Required: O(N).", zh: "写函数 solution(X, A)，返回最早时刻 K；若永远盖不满则返回 -1。约束：N 与 X 都在 [1..100,000] 内；A 的元素在 [1..X] 内。要求：O(N)。" },
  ],
  examples: [{ input: "X = 5, A = [1, 3, 1, 4, 2, 3, 5, 4]", output: "6" }],
  cases: [
    { name: "basic", args: [5, [1, 3, 1, 4, 2, 3, 5, 4]], expect: 6 },
    { name: "never covered", args: [5, [1, 3, 1, 4, 2, 3]], expect: -1 },
    { name: "instant", args: [1, [1]], expect: 0 },
    { name: "reverse order", args: [3, [3, 2, 1]], expect: 2 },
  ],
  reference: "function solution(X, A) {\n  const seen = new Set();\n  for (let k = 0; k < A.length; k++) {\n    seen.add(A[k]);\n    if (seen.size === X) return k;\n  }\n  return -1;\n}",
  explainZh: "思路：用 Set 记录已经落过叶子的位置（自动去重），边扫边看已覆盖的不同位置数是否达到 X，第一次达到的下标 k 就是答案；扫完都没达到返回 -1。易错点：叶子会重复落（例子里 1 和 3 都落了两次），只数「不同位置」的数量，不要按落叶次数算。",
},
{
  slug: "perm-check", group: "mock", title: "Perm Check", titleZh: "排列判定", lesson: "Mock 01 · Task 2（目标 20 分钟）— Codility Lesson 4 · Counting Elements", complexity: "O(N) 时间与空间",
  stub: "function solution(A) {\n  // your code here\n}\n",
  statement: [
    { en: "Check whether array A is a permutation of 1..N (each value exactly once).", zh: "判断数组 A 是否是 1..N 的一个排列（每个值恰好出现一次）。" },
    { en: "Write a function solution(A) returning 1 if it is a permutation, else 0. Constraints: N is within [1..100,000]; each element of A is within [1..1,000,000,000]. Required: O(N) or O(N log N).", zh: "写函数 solution(A)，是排列时返回 1，否则返回 0。约束：N 在 [1..100,000] 内；A 的元素在 [1..1,000,000,000] 内。要求：O(N) 或 O(N log N)。" },
  ],
  examples: [{ input: "A = [4, 1, 3, 2]", output: "1" }, { input: "A = [4, 1, 3]", output: "0" }],
  cases: [
    { name: "is permutation", args: [[4, 1, 3, 2]], expect: 1 },
    { name: "missing element", args: [[4, 1, 3]], expect: 0 },
    { name: "duplicate", args: [[1, 1]], expect: 0 },
    { name: "single ok", args: [[1]], expect: 1 },
    { name: "single bad", args: [[2]], expect: 0 },
    { name: "huge value", args: [[1000000000]], expect: 0 },
  ],
  reference: "function solution(A) {\n  const n = A.length;\n  const seen = new Set();\n  for (const v of A) {\n    if (v < 1 || v > n || seen.has(v)) return 0;\n    seen.add(v);\n  }\n  return 1;\n}",
  explainZh: "思路：长度为 N 的数组是 1..N 的排列，当且仅当每个元素都落在 [1..N] 内且互不重复（鸽巢原理：N 个不重复的合法值必然恰好占满）。用 Set 一遍扫完判重与越界。易错点：元素上限是 10 亿而不是 N，必须显式查范围；只查「求和等于 N(N+1)/2」会被 [1,1,4] 这类反例骗过。",
},
{
  slug: "max-counters", group: "mock", title: "Max Counters", titleZh: "最大计数器", lesson: "Mock 01 · Task 3（目标 40 分钟）— Codility Lesson 4 · Counting Elements，懒传播一课", complexity: "O(N + M) 时间，O(N) 空间",
  stub: "function solution(N, A) {\n  // your code here\n}\n",
  statement: [
    { en: "There are N counters, initially 0. Array A of M operations: if A[K] = X with 1 <= X <= N, counter X increases by 1; if A[K] = N+1, ALL counters are set to the current maximum counter value.", zh: "有 N 个计数器，初值都是 0。数组 A 给出 M 个操作：若 A[K] = X 且 1 <= X <= N，则第 X 个计数器加 1；若 A[K] = N+1，则把所有计数器都设为当前计数器的最大值。" },
    { en: "Write a function solution(N, A) returning the final counters as an array. Constraints: N and M are within [1..100,000]. Required: O(N+M). Setting every counter on each max-operation is O(N·M) and fails the performance test. The trick: don't apply the max to everyone — remember it and reconcile lazily.", zh: "写函数 solution(N, A)，返回最终的计数器数组。约束：N 与 M 都在 [1..100,000] 内。要求：O(N+M)。每次 max 操作都去逐个设置全部计数器是 O(N·M)，过不了性能用例。窍门：不要把最大值真的刷给每个人——记住它，事后懒结算。" },
  ],
  examples: [{ input: "N = 5, A = [3, 4, 4, 6, 1, 4, 4]", output: "[3, 2, 2, 4, 2]" }],
  cases: [
    { name: "basic", args: [5, [3, 4, 4, 6, 1, 4, 4]], expect: [3, 2, 2, 4, 2] },
    { name: "single counter", args: [1, [2, 1, 1, 2]], expect: [2] },
    { name: "no max op", args: [3, [1, 1, 1]], expect: [3, 0, 0] },
  ],
  perf: { name: "large input (performance): N=50,000, 100,000 ops", kind: "counters-large", note: "每次 max 操作都全量赋值是 O(N·M) 必超时；懒基线做法线性完成。限时 1000 ms。" },
  reference: "function solution(N, A) {\n  const counters = new Array(N).fill(0);\n  let base = 0, currentMax = 0;\n  for (const op of A) {\n    if (op === N + 1) { base = currentMax; continue; }\n    const i = op - 1;\n    if (counters[i] < base) counters[i] = base;\n    counters[i]++;\n    if (counters[i] > currentMax) currentMax = counters[i];\n  }\n  for (let i = 0; i < N; i++) if (counters[i] < base) counters[i] = base;\n  return counters;\n}",
  explainZh: "思路（懒传播）：维护一个全局基线 base，表示「所有计数器至少是这个值」。遇到 max 操作只做 base = currentMax，一步搞定，不逐个赋值；某个计数器被单独加之前，先把它抬到 base 再加。最后统一把低于 base 的补齐。每个操作都是 O(1)，总复杂度 O(N+M)。这是分摊/懒计算思想在计数问题里的经典应用。",
},
];
export const PROBLEMS = P;
export const problemBySlug = (slug: string) => P.find((p) => p.slug === slug);
