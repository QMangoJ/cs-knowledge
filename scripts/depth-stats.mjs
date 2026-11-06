import fs from "node:fs"; import path from "node:path"; import YAML from "yaml";
const walk = (d) => fs.readdirSync(d, { withFileTypes: true }).flatMap((e) => e.isDirectory() ? walk(path.join(d, e.name)) : e.name === "zh.yaml" ? [path.join(d, e.name)] : []);
const rows = [];
for (const f of walk("content/topics")) {
  const t = YAML.parse(fs.readFileSync(f, "utf8"));
  const bodyChars = t.steps.reduce((s, st) => s + (st.body?.length ?? 0), 0);
  const minStep = Math.min(...t.steps.map((st) => st.body?.length ?? 0));
  rows.push({ id: t.id, steps: t.steps.length, bodyChars, minStep, design: (t.design ?? []).length, minutes: t.minutes });
}
rows.sort((a, b) => a.id.localeCompare(b.id));
for (const r of rows) console.log(`${r.id}\tsteps=${r.steps}\tbody=${r.bodyChars}\tminStep=${r.minStep}\tdesign=${r.design}\tmin=${r.minutes}`);
console.log("TOTAL topics:", rows.length, "body chars:", rows.reduce((s, r) => s + r.bodyChars, 0));
