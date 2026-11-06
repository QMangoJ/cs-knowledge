// Local smoke test against a static server on out/. Usage: node e2e/smoke.mjs http://127.0.0.1:4173
import { chromium } from "playwright-core";
const base = process.argv[2] ?? "http://127.0.0.1:4173";
const browser = await chromium.launch({ executablePath: process.env.CHROME ?? "/usr/bin/google-chrome", args: ["--no-sandbox"] });
const fail = (m) => { console.error("FAIL", m); process.exitCode = 1; };
const ok = (c, m) => (c ? console.log("ok  ", m) : fail(m));
for (const vp of [{ width: 1440, height: 900 }, { width: 1280, height: 800 }, { width: 390, height: 844 }, { width: 375, height: 667 }]) {
  const page = await browser.newPage({ viewport: vp });
  const errors = []; page.on("pageerror", (e) => errors.push(e.message)); page.on("console", (m) => m.type() === "error" && errors.push(m.text()));
  const rsc = []; page.on("request", (r) => { if (/\/os\/syscall\/.*(_rsc=|\.txt)/.test(r.url())) rsc.push(r.url()); });
  const tag = `${vp.width}x${vp.height}`;
  await page.goto(`${base}/os/syscall/4/`);
  ok((await page.locator(".step h2").textContent()) === "切到内核态", `${tag} direct /4/ shows step 4`);
  rsc.length = 0;
  await page.keyboard.press("ArrowRight");
  ok(page.url().endsWith("/os/syscall/5/"), `${tag} ArrowRight -> /5/`);
  await page.locator(".stepnav button", { hasText: "上一步" }).click();
  ok(page.url().endsWith("/os/syscall/4/"), `${tag} prev button -> /4/`);
  await page.locator(".steplist a").first().click();
  ok(page.url().endsWith("/os/syscall/"), `${tag} step list -> step 1`);
  ok(await page.locator(".stepnav button", { hasText: "上一步" }).isHidden(), `${tag} no prev on step 1`);
  ok((await page.locator(".log tbody tr").count()) === 1, `${tag} log rows = 1 on step 1`);
  await page.goBack();
  await page.waitForFunction(() => document.querySelectorAll('.log tbody tr').length === 4, null, { timeout: 3000 }).catch(() => {});
  ok(page.url().endsWith("/os/syscall/4/") && (await page.locator(".log tbody tr").count()) === 4, `${tag} back -> /4/ with 4 log rows`);
  await page.reload();
  ok((await page.locator(".step h2").textContent()) === "切到内核态", `${tag} reload stays on step 4`);
  ok(rsc.length === 0, `${tag} no RSC fetch while stepping ${rsc.join(",")}`);
  const sw = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
  ok(sw <= 0, `${tag} no horizontal scroll (${sw})`);
  if (vp.width < 1024) {
    const y = await page.evaluate(() => [".canvas-wrap", ".col-explain", ".log"].map((q) => document.querySelector(q).getBoundingClientRect().top));
    ok(y[0] < y[1] && y[1] < y[2], `${tag} mobile order 画布→讲解→日志 (${y.map(Math.round)})`);
  }
  await page.screenshot({ path: `/workspace/scratch/cs-m0-${tag}.png`, fullPage: true });
  ok(errors.length === 0, `${tag} no console errors ${errors.join(";")}`);
  await page.close();
}
const p = await browser.newPage();
const r = await p.goto(`${base}/os/syscall/99/`);
ok(r.status() === 404, "unknown step -> 404");

// ---- phase 2: quiz removed, manual done, new interactions ----
const q = await browser.newPage({ viewport: { width: 1440, height: 900 } });
const qerr = []; q.on("pageerror", (e) => qerr.push(e.message)); q.on("console", (m) => m.type() === "error" && qerr.push(m.text()));
await q.goto(`${base}/os/syscall/11/`);
ok((await q.locator(".quiz").count()) === 0, "phase2 no quiz rendered on last step");
ok((await q.locator(".now-bar").count()) >= 1, "phase2 now-bar present on canvas");
await q.locator(".mark-done").click();
ok(await q.evaluate(() => localStorage.getItem("cs-done:os/syscall") === "1"), "phase2 manual mark-done writes cs-done key");
await q.goto(`${base}/`);
ok((await q.locator("text=数据存储").count()) >= 1 && (await q.locator("text=数学基础").count()) >= 1, "phase2 home has data + math sections");
ok((await q.locator(".route-steps li").count()) === 7, "phase2 route has 7 stages");
await q.goto(`${base}/dsa/binary-search/4/`);
ok((await q.locator(".codeblock .cl.hl").count()) === 1, "phase2 code line highlight on binary search step");
await q.locator(".stepnav .scrub").evaluate((el) => el.focus());
await q.keyboard.press("ArrowRight"); await q.keyboard.press("ArrowRight");
await q.waitForFunction(() => location.pathname.endsWith("/6/"), null, { timeout: 3000 }).catch(() => {});
ok(q.url().endsWith("/dsa/binary-search/6/"), "phase2 scrub slider jumps to step 6");
await q.goto(`${base}/dsa/hash-table/9/`);
await q.locator(".lab-hash").waitFor({ timeout: 8000 }).catch(() => {});
ok((await q.locator(".lab-hash").count()) === 1, "phase2 hash playground mounted");
await q.locator(".lab-hash .lab-row button").nth(1).click();
ok((await q.locator(".lab-hash .bs-cell").count()) === 8, "phase2 hash playground preset renders 8 slots");
await q.goto(`${base}/dsa/bfs-dfs/9/`);
await q.locator(".lab-graph").waitFor({ timeout: 8000 }).catch(() => {});
ok((await q.locator(".lab-graph").count()) === 1, "phase2 graph walk mounted");
await q.locator(".lab-graph .lab-row button").nth(1).click();
await q.locator(".lab-graph .lab-row button").last().click(); // single-step may vary; ensure no crash
await q.goto(`${base}/dsa/dijkstra/11/`);
await q.locator(".lab-dij").waitFor({ timeout: 8000 }).catch(() => {});
ok((await q.locator(".lab-dij").count()) === 1, "phase2 dijkstra lab mounted");
await q.locator(".lab-dij .lab-row button", { hasText: "源点 F" }).click();
ok((await q.locator(".lab-dij .bs-cell").count()) === 6, "phase2 dijkstra lab source F renders");
for (const u of ["/data/btree-index/", "/data/transactions/", "/math/probability/", "/co/gpu-simt/", "/network/http2-quic/", "/os/file-system/"]) {
  const rr = await q.goto(`${base}${u}`);
  ok(rr.status() === 200, `phase2 new topic ${u} 200`);
}
await q.goto(`${base}/network/tcp-handshake/`);
ok((await q.locator(".design .design-item").count()) === 3, "phase3 design block renders 3 mechanisms on tcp-handshake");
ok((await q.locator(".design").textContent()).includes("两将军"), "phase3 design block covers two generals");
ok(qerr.length === 0, `phase2 pages no console errors ${qerr.join(";")}`);
await q.close();
await browser.close();
