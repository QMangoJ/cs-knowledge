#!/usr/bin/env node
// §8.4 review checklist. Usage: npm run review -- [--topic os/syscall] [--stale 180] [--check-links]
import fs from "node:fs";
import path from "node:path";
import YAML from "yaml";

const args = process.argv.slice(2);
const opt = (k) => { const i = args.indexOf(k); return i >= 0 ? args[i + 1] : undefined; };
const onlyTopic = opt("--topic");
const stale = opt("--stale") ? Number(opt("--stale")) : undefined;
const checkLinks = args.includes("--check-links");
const root = process.env.CS_CONTENT_DIR ?? path.join(process.cwd(), "content");

const sources = new Map((YAML.parse(fs.readFileSync(path.join(root, "sources.yaml"), "utf8")) ?? []).map((s) => [s.id, s]));
const walk = (d) => fs.existsSync(d) ? fs.readdirSync(d, { withFileTypes: true }).flatMap((e) => e.isDirectory() ? walk(path.join(d, e.name)) : e.name === "zh.yaml" ? [path.join(d, e.name)] : []) : [];
const today = new Date();
const daysSince = (d) => Math.floor((today - new Date(d)) / 86400000);
const esc = (s) => String(s ?? "").replace(/\|/g, "\\|").replace(/\n/g, " ");

const rows = [];
let blocking = 0;
for (const f of walk(path.join(root, "topics")).sort()) {
  const t = YAML.parse(fs.readFileSync(f, "utf8"));
  if (onlyTopic && t.id !== onlyTopic) continue;
  if (t.status === "published" && (!t.reviewedBy || !t.reviewedAt)) { rows.push([t.id, "—", "主题缺 Daniel 签字", "", "", "missing-signoff", ""]); blocking++; }
  for (const s of t.steps ?? []) {
    for (const c of s.sources ?? []) {
      const isStale = stale !== undefined && c.status === "verified" && c.checkedAt && daysSince(c.checkedAt) > stale;
      if (c.status === "verified" && !isStale) continue;
      if (c.status === "pending" || c.status === "disputed") blocking++;
      const src = sources.get(c.ref);
      rows.push([t.id, s.id, c.claim, `${src?.title ?? c.ref} · ${c.locator}`, c.url ?? src?.url ?? "", isStale ? "stale" : c.status, c.checkedAt ?? ""]);
    }
  }
}

if (rows.length) {
  console.log("| 主题 | 步骤 | claim | 来源 + locator | URL | 状态 | 上次核对 |\n|---|---|---|---|---|---|---|");
  for (const r of rows) console.log(`| ${r.map(esc).join(" | ")} |`);
}

if (checkLinks) {
  const urls = new Set([...sources.values()].map((s) => s.url).concat(rows.map((r) => r[4]).filter(Boolean)));
  const bad = [];
  for (const u of urls) {
    try { const r = await fetch(u, { method: "GET", redirect: "follow" }); if (r.status !== 200) bad.push(`${r.status} ${u}`); }
    catch (e) { bad.push(`ERR ${u} (${e.message})`); }
  }
  if (bad.length) { console.log("\n非 200 链接："); for (const b of bad) console.log(`- ${b}`); blocking += bad.length; }
}

process.exit(blocking > 0 ? 1 : 0);
