import { chromium } from "playwright-core";
const base = "http://127.0.0.1:4173";
const browser = await chromium.launch({ executablePath: process.env.CHROME, args: ["--no-sandbox"] });
const ok = (c, m) => console.log(c ? "ok  " : "FAIL", m);
const p = await browser.newPage({ viewport: { width: 1440, height: 900 } });
const errs = []; p.on("pageerror", e => errs.push(e.message)); p.on("console", m => m.type() === "error" && errs.push(m.text()));
await p.goto(`${base}/co/cache/8/`); // sim-lab step (9 steps: lab is step 8 -> /9/? cache steps now 9: why1 miss2 hit3 mapping4 replace-write5 locality6 sim-lab7 coherence8 -> check both
await p.goto(`${base}/co/cache/8/`);
await p.locator(".lab-cache").waitFor({ timeout: 8000 }).catch(() => {});
ok((await p.locator(".lab-cache").count()) === 1, "cache-sim mounted on cache step 8");
await p.locator(".lab-cache .lab-row button").nth(1).click();
ok((await p.locator(".lab-cache .bs-cell").count()) === 8, "cache-sim renders 8 lines after preset switch");
await p.goto(`${base}/dsa/binary-heap/8/`);
await p.locator(".lab-heap").waitFor({ timeout: 8000 }).catch(() => {});
ok((await p.locator(".lab-heap").count()) === 1, "heap-lab mounted");
await p.locator(".lab-heap input").fill("5,2,8");
await p.locator(".lab-heap .lab-row button").last().click();
ok((await p.locator(".lab-heap .bs-cell").count()) >= 1, "heap-lab custom input accepted");
// code-canvas linkage on gpu topic (code step) + dp knapsack highlight
await p.goto(`${base}/dsa/dynamic-programming/4/`);
ok((await p.locator(".codeblock .cl.hl").count()) === 1, "knapsack code highlight present");
// mobile 390: new topic + lab page overflow
const m = await browser.newPage({ viewport: { width: 390, height: 844 } });
await m.goto(`${base}/data/btree-index/3/`);
ok(await m.evaluate(() => document.documentElement.scrollWidth - window.innerWidth) <= 0, "390 btree no h-overflow");
await m.goto(`${base}/dsa/hash-table/6/`);
await m.locator(".lab-hash").waitFor({ timeout: 8000 }).catch(() => {});
ok(await m.evaluate(() => document.documentElement.scrollWidth - window.innerWidth) <= 0, "390 hash lab no h-overflow");
// coding intact + home progress after manual done (fresh profile: mark one, check text)
await m.goto(`${base}/coding/`);
ok((await m.locator("text=Codility").count()) >= 1, "coding index renders");
await p.goto(`${base}/os/file-system/7/`);
await p.locator(".mark-done").click();
await p.goto(`${base}/`);
const prog = await p.locator(".route .muted").last().textContent();
ok(/1 \/ 32/.test(prog ?? ""), `home progress reflects manual done (${(prog ?? "").trim()})`);
ok(errs.length === 0, `no console errors: ${errs.join(";")}`);
await browser.close();
