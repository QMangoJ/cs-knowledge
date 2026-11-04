# Lab steps: YAML fields (P1/P2, not implemented yet)

Every lab step uses the common shape (already in schema as `LabState`):

```yaml
canvas:
  kind: lab
  lab: <id>            # component id, lazy-loaded from src/components/labs
  caption: ...         # optional
  params: {...}        # initial/default values and allowed ranges (per lab, below)
  cases:               # fixed examples the lab must reproduce = the numbers used in the prose
    - input: {...}
      expect: {...}
```

## P1
| lab id | topic | params | cases (input → expect) |
|---|---|---|---|
| `bit-editor` | co/number-representation | `width` (8/16/32), `mode` (unsigned/twos/float32), `value` initial | `{bits:"11111111", mode:twos}` → `{decimal:-1}`; `{value:0.1, mode:float32}` → `{bits:"0 01111011 1001…", stored:"0.100000001490116"}` |
| `addr-split` | os/virtual-memory | `vaBits` (48), `pageSize` (4096), `levels` (4), `bitsPerLevel` (9), `address` initial (hex) | `{address:"0x7ffd1234abcd"}` → `{indices:[255,500,145,330], offset:"0xbcd"}` |
| `pipeline-chart` | co/pipeline | `stages` (["IF","ID","EX","MEM","WB"]), `program` (list of instr with deps), `forwarding` (bool), `branchPenalty` | lw x1 → add x3,x1 → sub x5,x3: `{forwarding:false}` → `{cycles:11, stalls:4}`; `{forwarding:true}` → `{cycles:8, stalls:1}` |
| `interleave` | os/lock | `threads` (2), `opsPerThread` (["read","add","write"]), `useLock` (bool), `schedule` (optional fixed interleaving) | `{schedule:[T1r,T2r,T1w,T2w], useLock:false}` → `{counter:1}`; same with lock → `{counter:2}` |
| `wait-for-graph` (same lab, mode) | os/lock | `locks`, `acquireOrder` per thread | `{T1:[A,B],T2:[B,A]}` → `{deadlock:true, cycle:[T1,T2]` (threads in the wait-for cycle; T1 waits B held by T2, T2 waits A held by T1)`}` |

## P2
| lab id | topic | params | cases |
|---|---|---|---|
| `cache-sim` | co/cache | `size`, `lineSize`, `assoc`, `policy` (LRU/FIFO), `pattern` (row/col/stride + `stride`), `n` | `{pattern:row,n:…}` → `{hitRate:…}`; `{pattern:col}` → `{hitRate:…}` |
| `sched-gantt` | os/context-switch | `policy` (FIFO/RR/CFS-like), `quantum`, `switchCost`, `procs` [{name, arrive, burst}] | `{policy:RR, quantum:2}` → `{order:[…], avgWait:…}` |
| `hash-playground` | dsa/hash-table | `buckets`, `loadThreshold`, `hash` (mod/sum), `keys` initial | `{keys:[Alice,Bob], buckets:8}` → `{bucketOf:{Alice:3,Bob:3}}` (must match prose) |
| `sort-compare` | dsa/merge-quick-sort | `algorithms`, `input` preset (random/sorted/reversed), `n`, `pivot` (first/random/median3) | `{input:sorted, pivot:first}` → `{quickComparisons≈n²/2}` |
| `dijkstra-edit` | dsa/dijkstra | `graph` (nodes/edges as in datastate), `source`, `allowNegative` | the step graph → `{dist:{A:0,B:3,C:6,D:8,E:8}}`; with a negative edge → `{wrong:true}` warning |
| `graph-walk` | dsa/bfs-dfs | `graph`, `start`, `mode` (bfs/dfs), editable edges | step graph from A → `{bfs:[A,B,C,D,E,F], dfs:[A,B,D,C,E,F]}` |

Product side: add `cases` with the exact numbers used in the step body so the lab can be tested against the prose.


## P1 implementation notes

Implemented in `src/components/labs/*` (UI) and `src/lib/labs/*` (pure logic). Fixed cases run with `node --experimental-strip-types scripts/lab-selftest.mts`. The draft topic `content/topics/os/lab-test` exercises every lab and is excluded from `CS_PRODUCTION` builds. Each lab also re-runs its YAML `cases` in the browser and shows ✓/✗.
