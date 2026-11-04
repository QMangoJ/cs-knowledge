// Fails if first-load JS (gzip) of a step page exceeds budget.json. Run after `npm run build`.
import fs from "node:fs"; import zlib from "node:zlib";
const b = JSON.parse(fs.readFileSync("budget.json", "utf8"));
const html = fs.readFileSync(`out/${b.page}`, "utf8");
const srcs = [...new Set(html.match(/\/_next\/static\/[^"']+\.js/g) ?? [])];
const total = srcs.reduce((n, s) => n + zlib.gzipSync(fs.readFileSync(`out${s}`)).length, 0);
const kb = total / 1024;
console.log(`${b.page}: ${srcs.length} scripts, ${kb.toFixed(1)} KB gzip (budget ${b.stepPageJsGzipKB} KB)`);
process.exit(kb <= b.stepPageJsGzipKB ? 0 : 1);
