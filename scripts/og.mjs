// Generates public/og/<subject>-<slug>.png (1200x630) for each topic, using local Chrome. Run manually: node scripts/og.mjs
import fs from "node:fs"; import path from "node:path"; import YAML from "yaml"; import { chromium } from "playwright-core";
const walk = (d) => fs.readdirSync(d, { withFileTypes: true }).flatMap((e) => e.isDirectory() ? walk(path.join(d, e.name)) : e.name === "zh.yaml" ? [path.join(d, e.name)] : []);
const esc = (s) => s.replace(/[&<>]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;" })[c]);
const b = await chromium.launch({ executablePath: process.env.CHROME ?? "/usr/bin/google-chrome", args: ["--no-sandbox"] });
const p = await b.newPage({ viewport: { width: 1200, height: 630 } });
for (const f of walk("content/topics")) {
  const t = YAML.parse(fs.readFileSync(f, "utf8"));
  await p.setContent(`<body style="margin:0;width:1200px;height:630px;background:#fcfdfe;font-family:'Noto Sans CJK SC','PingFang SC',sans-serif;color:#16358f;box-sizing:border-box;padding:72px;border:12px solid #16358f;display:flex;flex-direction:column;justify-content:space-between">
  <div style="font:600 28px monospace;color:#5b72a6">计算机科学 · ${esc(t.premise)}</div>
  <div><div style="font-size:64px;font-weight:700;color:#0a2a7a;line-height:1.25">${esc(t.title)}</div><div style="font-size:30px;margin-top:24px;color:#5b72a6">${esc(t.summary)}</div></div>
  <div style="font:24px monospace;color:#8597c2">cs.ki-toko.com/${t.subject}/${t.slug}/ · ${t.steps.length} 步</div></body>`);
  await p.screenshot({ path: `public/og/${t.subject}-${t.slug}.png` });
  console.log("wrote", `public/og/${t.subject}-${t.slug}.png`);
}
await b.close();
