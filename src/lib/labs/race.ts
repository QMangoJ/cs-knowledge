// counter++ as read / add / write per thread, optionally guarded by a mutex (lock before read, unlock after write).
export type Op = "read" | "add" | "write";
export const OPS: Op[] = ["read", "add", "write"];
export type Thread = { pc: number; reg: number; blocked: boolean };
export type RaceState = { counter: number; threads: Thread[]; owner: number | null; trace: string[] };

export const initRace = (n = 2, counter = 0): RaceState => ({ counter, threads: Array.from({ length: n }, () => ({ pc: 0, reg: 0, blocked: false })), owner: null, trace: [] });
/** Advance thread t by one op. Returns a new state; a thread that can't take the lock is marked blocked. */
export function stepRace(s: RaceState, t: number, useLock: boolean): RaceState {
  const th = s.threads.map((x) => ({ ...x })), me = th[t]!, name = `T${t + 1}`;
  if (me.pc >= OPS.length) return s;
  let { counter, owner } = s; const trace = [...s.trace];
  if (useLock && me.pc === 0 && owner !== t) {
    if (owner !== null) { me.blocked = true; trace.push(`${name} 等锁`); return { counter, threads: th, owner, trace }; }
    owner = t; trace.push(`${name} 加锁`);
  }
  me.blocked = false;
  const op = OPS[me.pc]!;
  if (op === "read") me.reg = counter; else if (op === "add") me.reg += 1; else counter = me.reg;
  trace.push(`${name} ${op === "read" ? `读 ${me.reg}` : op === "add" ? `算 ${me.reg}` : `写 ${counter}`}`);
  me.pc++;
  if (useLock && me.pc === OPS.length && owner === t) { owner = null; trace.push(`${name} 解锁`); th.forEach((x) => (x.blocked = false)); }
  return { counter, threads: th, owner, trace };
}
/** Product schedule labels like "T1r"/"T2w": each request runs that thread up to and including the named op
 * (so "w" without an explicit "a" does add+write). Requests blocked on the lock are retried after the others. */
export function runLabels(labels: string[], useLock: boolean, initial = 0, n = 2): RaceState {
  let s = initRace(n, initial); const q = labels.map((l) => ({ t: Number(l.match(/T(\d+)/)?.[1] ?? 1) - 1, op: Math.max(0, "raw".indexOf(l.slice(-1))) })); let guard = 0;
  while (q.length && guard++ < 1000) {
    const r = q.shift()!;
    while (s.threads[r.t]!.pc <= r.op) { const before = s.threads[r.t]!.pc; s = stepRace(s, r.t, useLock); if (s.threads[r.t]!.pc === before) { q.push(r); break; } }
  }
  return s;
}
/** Runs a requested order like [0,1,0,1,0,1]; blocked requests are retried after the others (as the scheduler would). */
export function runSchedule(order: number[], useLock: boolean, n = 2): RaceState {
  let s = initRace(n); const q = [...order]; let guard = 0;
  while (q.length && guard++ < 1000) { const t = q.shift()!; const before = s.threads[t]!.pc; s = stepRace(s, t, useLock); if (s.threads[t]!.pc === before && s.threads[t]!.pc < OPS.length) q.push(t); }
  return s;
}

// Deadlock: each thread acquires locks in its order, one acquire per turn, round-robin; never releases until done.
export type WaitResult = { holds: Record<string, string>; waits: Record<string, string>; deadlock: boolean; cycle: string[]; finished: string[] };
export function simulateLocks(order: Record<string, string[]>): WaitResult {
  const names = Object.keys(order), pos: Record<string, number> = Object.fromEntries(names.map((n) => [n, 0]));
  const owner: Record<string, string> = {}, waits: Record<string, string> = {}, finished: string[] = [];
  for (let round = 0; round < 100; round++) {
    let progressed = false;
    for (const t of names) {
      if (finished.includes(t)) continue;
      const want = order[t]![pos[t]!];
      if (want === undefined) { finished.push(t); for (const l of Object.keys(owner)) if (owner[l] === t) delete owner[l]; progressed = true; continue; }
      if (owner[want] === undefined || owner[want] === t) { owner[want] = t; delete waits[t]; pos[t]!++; progressed = true; } else waits[t] = want;
    }
    if (!progressed) break;
  }
  const cycle = findCycle(waits, owner);
  const holds: Record<string, string> = {}; for (const [l, t] of Object.entries(owner)) holds[l] = t;
  return { holds, waits, deadlock: cycle.length > 0, cycle, finished };
}
function findCycle(waits: Record<string, string>, owner: Record<string, string>): string[] {
  for (const start of Object.keys(waits)) {
    const path: string[] = []; let t: string | undefined = start;
    while (t && !path.includes(t)) { path.push(t); const l: string | undefined = waits[t]; t = l ? owner[l] : undefined; }
    if (t) return path.slice(path.indexOf(t)).flatMap((x) => [x, waits[x]!]);
  }
  return [];
}
