// Browser verification suite (local production build): serve out/ on 4174 first, then
// CHROME=<chrome path> node scripts/browser-verify.mjs — 45 assertions: homepage/progress, topic walks,
// quiz + localStorage, both labs, coding judge (pass/fail/perf-trap), network topics, 390px viewport.
import { chromium } from "playwright-core";
const CHROME = process.env.CHROME ?? "/usr/bin/google-chrome";
const base = process.env.BASE ?? "http://127.0.0.1:4174";
let pass = 0, fail = 0; const fails = [];
const ok = (c, m) => { if (c) { pass++; console.log("ok  ", m); } else { fail++; fails.push(m); console.log("FAIL", m); } };
const browser = await chromium.launch({ executablePath: CHROME, args: ["--no-sandbox"] });
const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
const page = await ctx.newPage();
const errors = []; page.on("pageerror", (e) => errors.push(e.message)); page.on("console", (m) => m.type() === "error" && errors.push(m.text()));

// 1 homepage
await page.goto(base + "/");
ok(await page.locator("text=学习路线").first().isVisible(), "home: route section");
ok(await page.locator("text=计算机网络").first().isVisible(), "home: network subject");
ok(await page.locator("text=面试刷题").first().isVisible(), "home: coding card");
ok(await page.locator("text=规划中").first().isVisible(), "home: roadmap coming-soon");
ok(await page.locator(".progress-wrap").isVisible(), "home: progress bar");
const cardMeta = await page.locator(".topic-card .card-meta").first().textContent();
ok(/步/.test(cardMeta), "home: card shows steps/minutes: " + cardMeta.trim());

// 2 binary-search walk all steps
await page.goto(base + "/dsa/binary-search/");
const titles = [];
for (let i = 0; i < 8; i++) {
  titles.push(await page.locator(".step h2").textContent());
  if (i < 7) await page.locator(".stepnav button", { hasText: "下一步" }).click(), await page.waitForTimeout(120);
}
ok(titles.length === 8 && new Set(titles).size === 8, "bs: walked 8 distinct steps: " + titles.join(" | "));
await page.goto(base + "/dsa/binary-search/4/");
ok(await page.locator(".codeblock pre code").first().isVisible(), "bs step4: code block rendered");
ok((await page.locator(".codeblock").first().textContent()).includes("binarySearch"), "bs step4: code is the standard implementation");
ok(await page.locator(".points").isVisible(), "bs step4: points rendered");
ok(await page.locator(".mistake").isVisible(), "bs step4: mistake rendered");
await page.goto(base + "/dsa/binary-search/5/");
ok((await page.locator(".codeblock").first().textContent()).includes("lowerBound"), "bs step5: lower_bound code");
// quiz on last step
await page.goto(base + "/dsa/binary-search/8/");
ok(await page.locator(".objectives").isVisible(), "bs: objectives in header");
ok(await page.locator(".ai-link").isVisible(), "bs: aiLink in header");
for (const t of ["lo < hi，a[mid] < x 时 lo = mid + 1", "避免 lo + hi 超出固定位数整数上限而溢出", "upper_bound − lower_bound = 5 − 2 = 3", "可行性随答案单调"]) {
  await page.locator(".quiz-opt", { hasText: t }).first().click(); await page.waitForTimeout(60);
}
ok(await page.locator(".quiz-done").isVisible(), "bs quiz: all correct -> done banner");
const lsDone = await page.evaluate(() => localStorage.getItem("cs-done:dsa/binary-search"));
ok(lsDone === "1", "bs quiz: localStorage done written");
await page.goto(base + "/");
const homeText = await page.locator(".home").textContent();
ok(/总进度：1 \/ 21/.test(homeText), "home after quiz: progress 1/21 shown");
const bsCard = await page.locator(".topic-card", { hasText: "二分查找" }).first().textContent();
ok(bsCard.includes("✓"), "home: binary-search card shows check");

// 3 binary-search lab: step 6
await page.goto(base + "/dsa/binary-search/6/");
await page.waitForSelector(".lab-bs", { timeout: 8000 });
await page.locator(".lab-bs button", { hasText: "找 7" }).click();
for (let i = 0; i < 6; i++) { const b = page.locator(".lab-bs button", { hasText: "单步" }); if (!(await b.isEnabled())) break; await b.click(); await page.waitForTimeout(60); }
let labOut = await page.locator(".lab-bs .lab-out").first().textContent();
ok(/不存在/.test(labOut) && /3 次/.test(await page.locator(".lab-bs").textContent()), "lab target 7: not found with 3 comparisons: " + labOut.trim());
await page.locator(".lab-bs input[placeholder='自定义目标']").fill("2");
await page.locator(".lab-bs button", { hasText: "查找" }).click();
for (let i = 0; i < 6; i++) { const b = page.locator(".lab-bs button", { hasText: "单步" }); if (!(await b.isEnabled())) break; await b.click(); await page.waitForTimeout(60); }
labOut = await page.locator(".lab-bs .lab-out").first().textContent();
ok(/找到 2，下标 0/.test(labOut), "lab target 2 (boundary min): found at 0: " + labOut.trim());
await page.locator(".lab-bs button", { hasText: "找 56" }).click();
await page.locator(".lab-bs button", { hasText: "播放" }).click();
await page.waitForTimeout(3500);
labOut = await page.locator(".lab-bs .lab-out").first().textContent();
ok(/找到 56，下标 7/.test(labOut), "lab target 56 (boundary max) via play: found at 7: " + labOut.trim());

// 4 sort-compare lab
await page.goto(base + "/dsa/merge-quick-sort/8/");
await page.waitForSelector(".lab-sort", { timeout: 8000 });
await page.locator(".lab-sort button", { hasText: "已排序" }).click();
for (let i = 0; i < 14; i++) { const b = page.locator(".lab-sort button", { hasText: "单步" }); if (!(await b.isEnabled())) break; await b.click(); await page.waitForTimeout(40); }
const sortText = await page.locator(".lab-sort").textContent();
ok(sortText.includes("比较 12 次") && sortText.includes("比较 28 次"), "sort-compare sorted preset: merge 12 vs quick 28");

// 5 walk os/syscall + co/cache fully
for (const [path, n, name] of [["/os/syscall/", 7, "syscall"], ["/co/cache/", 8, "cache"], ["/network/tcp-handshake/", 6, "tcp"]]) {
  await page.goto(base + path);
  let steps = 0;
  for (let i = 0; i < n; i++) {
    if (await page.locator(".step h2").isVisible()) steps++;
    if (i < n - 1) { const b = page.locator(".stepnav button", { hasText: "下一步" }); if (await b.count()) { await b.click(); await page.waitForTimeout(80); } }
  }
  ok(steps === n, `${name}: walked ${steps}/${n} steps`);
  ok(await page.locator("svg").first().isVisible(), `${name}: canvas svg renders on last step`);
}
for (const p of ["/network/http-streaming/", "/network/dns-cdn/"]) {
  await page.goto(base + p);
  ok(await page.locator("svg").first().isVisible(), p + " first step canvas");
  const n = p.includes("http") ? 5 : 5;
  await page.goto(base + p + n + "/");
  ok(await page.locator(".step h2").isVisible(), p + " last step renders");
}

// 6 coding: odd-occurrences reference -> pass; wrong -> fail
await page.goto(base + "/coding/odd-occurrences/");
await page.locator("#code-editor").fill("function solution(A) {\n  let x = 0;\n  for (const v of A) x ^= v;\n  return x;\n}");
await page.locator("button", { hasText: "运行测试" }).click();
await page.waitForTimeout(300);
ok((await page.locator(".test-results li.pass").count()) === 4, "coding odd: reference passes 4/4");
ok(await page.evaluate(() => localStorage.getItem("cs-coding-done:odd-occurrences")) === "1", "coding odd: done persisted");
await page.locator("#code-editor").fill("function solution(A) { return A[0]; }");
await page.locator("button", { hasText: "运行测试" }).click();
await page.waitForTimeout(300);
ok((await page.locator(".test-results li.fail").count()) >= 1, "coding odd: wrong solution judged fail");
// tape perf trap
await page.goto(base + "/coding/tape-equilibrium/");
await page.locator("#code-editor").fill("function solution(A) { let best = Infinity; for (let p = 1; p < A.length; p++) { let l = 0, r = 0; for (let i = 0; i < p; i++) l += A[i]; for (let i = p; i < A.length; i++) r += A[i]; best = Math.min(best, Math.abs(l - r)); } return best; }");
await page.locator("button", { hasText: "运行测试" }).click();
await page.waitForTimeout(600);
const tapeText = await page.locator(".test-results").textContent();
ok(/太慢|large input/.test(tapeText) && (await page.locator(".test-results li.fail").count()) >= 1, "coding tape: O(n^2) caught by perf case");
// max-counters reference pass
await page.goto(base + "/coding/max-counters/");
await page.locator("#code-editor").fill("function solution(N, A) {\n  const counters = new Array(N).fill(0);\n  let base = 0, currentMax = 0;\n  for (const op of A) {\n    if (op === N + 1) { base = currentMax; continue; }\n    const i = op - 1;\n    if (counters[i] < base) counters[i] = base;\n    counters[i]++;\n    if (counters[i] > currentMax) currentMax = counters[i];\n  }\n  for (let i = 0; i < N; i++) if (counters[i] < base) counters[i] = base;\n  return counters;\n}");
await page.locator("button", { hasText: "运行测试" }).click();
await page.waitForTimeout(300);
ok((await page.locator(".test-results li.fail").count()) === 0, "coding max-counters: reference all pass incl perf");
await page.goto(base + "/coding/");
ok(/当前进度：2 \/ 9/.test(await page.locator(".coding-wrap").textContent()), "coding index: progress 2/9 persisted after reload");

// 7 mobile 390
const mctx = await browser.newContext({ viewport: { width: 390, height: 844 } });
const mp = await mctx.newPage();
const merr = []; mp.on("pageerror", (e) => merr.push(e.message));
for (const u of ["/", "/dsa/binary-search/4/", "/coding/", "/coding/binary-gap/", "/network/tcp-handshake/"]) {
  await mp.goto(base + u);
  const sw = await mp.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
  const h1 = await mp.locator("h1").first().textContent().catch(() => "");
  ok(sw <= 1 && h1.length > 0, `mobile 390 ${u}: no h-overflow (${sw}), h1="${h1.trim().slice(0, 20)}"`);
}
ok(merr.length === 0, "mobile: no page errors " + merr.join(";"));
ok(errors.length === 0, "desktop: no console/page errors: " + errors.join(" | ").slice(0, 300));
console.log(`\nTOTAL ${pass} pass, ${fail} fail`);
if (fails.length) console.log("FAILURES:\n- " + fails.join("\n- "));
await browser.close();
process.exit(fail ? 1 : 0);
