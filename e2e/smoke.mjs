// Local smoke test against a static server on out/. Usage: node e2e/smoke.mjs http://127.0.0.1:4173
// In the Muse sandbox the only Chromium is /opt/meta-chromium/chrome, which needs the
// WebGL domain-policy args, and live-site runs need CS_E2E_PROXY (an unauthenticated local relay).
import { chromium } from "playwright-core";
import fs from "node:fs";
import { createHash } from "node:crypto";
const base = process.argv[2] ?? "http://127.0.0.1:4173";
const exe = process.env.CHROME ?? (fs.existsSync("/usr/bin/google-chrome") ? "/usr/bin/google-chrome" : "/opt/meta-chromium/chrome");
const launchArgs = ["--no-sandbox"];
const polPath = "/var/lib/hatch-browser/rootfs-base/usr/share/hatch/chromium/webgl-allowed-domains.txt";
if (exe.includes("meta-chromium") && fs.existsSync(polPath)) {
  launchArgs.push(`--hatch-webgl-allowed-domains-file=${polPath}`);
  launchArgs.push(`--hatch-webgl-allowed-domains-sha256=${createHash("sha256").update(fs.readFileSync(polPath)).digest("hex")}`);
}
const launchOpts = { executablePath: exe, args: launchArgs };
if (process.env.CS_E2E_PROXY) launchOpts.proxy = { server: process.env.CS_E2E_PROXY };
const browser = await chromium.launch(launchOpts);
const fail = (m) => { console.error("FAIL", m); process.exitCode = 1; };
const ok = (c, m) => (c ? console.log("ok  ", m) : fail(m));
for (const vp of [{ width: 1440, height: 900 }, { width: 1280, height: 800 }, { width: 390, height: 844 }, { width: 375, height: 667 }]) {
  const page = await browser.newPage({ viewport: vp });
  const errors = []; page.on("pageerror", (e) => errors.push(e.message)); page.on("console", (m) => m.type() === "error" && errors.push(m.text()));
  // Live-only artifact: Cloudflare's auto-injected analytics beacon fails TLS through the sandbox proxy.
  let beaconFailed = false;
  page.on("requestfailed", (r) => { if (r.url().includes("cloudflareinsights.com")) beaconFailed = true; });
  const realErrors = () => errors.filter((e) => !(beaconFailed && e.includes("ERR_CERT_AUTHORITY_INVALID")));
  const rsc = []; page.on("request", (r) => { if (/\/os\/syscall\/.*(_rsc=|\.txt)/.test(r.url())) rsc.push(r.url()); });
  const tag = `${vp.width}x${vp.height}`;
  await page.goto(`${base}/os/syscall/4/`);
  await page.waitForTimeout(400);
  ok((await page.locator(".step h2").textContent()) === "切到内核态", `${tag} direct /4/ shows step 4`);
  rsc.length = 0;
  await page.keyboard.press("ArrowRight");
  ok(page.url().endsWith("/os/syscall/5/"), `${tag} ArrowRight -> /5/`);
  await page.locator(".stepnav button", { hasText: "上一步" }).click();
  ok(page.url().endsWith("/os/syscall/4/"), `${tag} prev button -> /4/`);
  if (vp.width >= 1280) {
    await page.locator(".steplist a").first().click();
  } else {
    await page.locator(".step-chips .chip").first().click();
  }
  ok(page.url().endsWith("/os/syscall/"), `${tag} step list -> step 1`);
  ok(await page.locator(".stepnav button", { hasText: "上一步" }).isDisabled(), `${tag} prev disabled on step 1`);
  ok((await page.locator(".log tbody tr").count()) === 1, `${tag} log rows = 1 on step 1`);
  await page.goBack();
  await page.waitForFunction(() => document.querySelectorAll('.log tbody tr').length === 4, null, { timeout: 3000 }).catch(() => {});
  ok(page.url().endsWith("/os/syscall/4/") && (await page.locator(".log tbody tr").count()) === 4, `${tag} back -> /4/ with 4 log rows`);
  await page.reload();
  ok((await page.locator(".step h2").textContent()) === "切到内核态", `${tag} reload stays on step 4`);
  ok(rsc.length === 0, `${tag} no RSC fetch while stepping ${rsc.join(",")}`);
  const sw = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
  ok(sw <= 0, `${tag} no horizontal scroll (${sw})`);
  if (vp.width < 1280) {
    const y = await page.evaluate(() => [".canvas-wrap", ".step", ".p-logbar"].map((q) => document.querySelector(q).getBoundingClientRect().top));
    ok(y[0] < y[1] && y[1] < y[2], `${tag} mobile order 画布→讲解→日志 (${y.map(Math.round)})`);
  }
  fs.mkdirSync("/tmp/cs-shots", { recursive: true });
  await page.screenshot({ path: `/tmp/cs-shots/cs-m0-${tag}.png`, fullPage: true });
  ok(realErrors().length === 0, `${tag} no console errors ${realErrors().join(";")}`);
  await page.close();
}
const p = await browser.newPage();
const r = await p.goto(`${base}/os/syscall/99/`).catch(() => null);
ok(r ? r.status() === 404 : base.startsWith("https://"), "unknown step -> 404");

// ---- phase 2: quiz removed, manual done, new interactions ----
const q = await browser.newPage({ viewport: { width: 1440, height: 900 } });
const qerr = []; q.on("pageerror", (e) => qerr.push(e.message)); q.on("console", (m) => m.type() === "error" && qerr.push(m.text()));
let qBeacon = false; q.on("requestfailed", (r) => { if (r.url().includes("cloudflareinsights.com")) qBeacon = true; });
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
ok(qerr.filter((e) => !(qBeacon && e.includes("ERR_CERT_AUTHORITY_INVALID"))).length === 0, `phase2 pages no console errors ${qerr.join(";")}`);
await q.close();

// ---- phase 4: app-screen layout + coherence layer ----
const w = await browser.newPage({ viewport: { width: 1440, height: 900 } });
const werr = []; w.on("pageerror", (e) => werr.push(e.message)); w.on("console", (m) => m.type() === "error" && werr.push(m.text()));
let wBeacon = false; w.on("requestfailed", (r) => { if (r.url().includes("cloudflareinsights.com")) wBeacon = true; });
await w.goto(`${base}/os/syscall/`);
const fit = await w.evaluate(() => {
  const r = document.querySelector(".app-screen").getBoundingClientRect();
  const sb = document.querySelector(".stage-body").getBoundingClientRect();
  const det = document.querySelector(".p-details");
  return { screenH: r.height, ih: window.innerHeight, stageBodyH: sb.height, detScrolls: det.scrollHeight > det.clientHeight + 4, detH: det.clientHeight, stageH: document.querySelector(".p-stage").getBoundingClientRect().height };
});
ok(fit.screenH < fit.ih - 140, `phase5 sparse step: app screen hugs content, no fake full-viewport blank (${Math.round(fit.screenH)} vs viewport ${fit.ih})`);
ok(fit.stageBodyH >= 230 && fit.stageBodyH < 460, `phase5 sparse step: stage body height adaptive (${Math.round(fit.stageBodyH)}px, was ~560 fixed)`);
ok(fit.detScrolls && Math.abs(fit.detH - fit.stageH) < 190, `phase5 details column aligns with stage row and scrolls inside (${Math.round(fit.detH)} vs stage ${Math.round(fit.stageH)})`);
for (const u of ["/os/syscall/6/", "/network/tcp-handshake/3/", "/dsa/hash-table/4/", "/co/cache/4/", "/dsa/dynamic-programming/5/", "/dsa/bst-trees/6/"]) {
  await w.goto(`${base}${u}`);
  const dh = await w.evaluate(() => document.querySelector(".stage-body").getBoundingClientRect().height);
  ok(dh <= 580, `phase5 dense sample ${u}: stage body capped (${Math.round(dh)}px <= 580)`);
}
await w.goto(`${base}/os/syscall/`);
const m5 = await browser.newPage({ viewport: { width: 390, height: 844 } });
await m5.goto(`${base}/os/syscall/`);
const m5r = await m5.evaluate(() => ({ sw: document.documentElement.scrollWidth, sb: document.querySelector(".stage-body").getBoundingClientRect().height }));
ok(m5r.sw <= 390, `phase5 390 no horizontal overflow (scrollWidth ${m5r.sw})`);
ok(m5r.sb < 320, `phase5 390 stage body adaptive (${Math.round(m5r.sb)}px)`);
await m5.close();
ok((await w.locator(".position-card").count()) === 1, "phase4 position card on step 1");
ok((await w.locator(".position-card").textContent()).includes("系统调用接口"), "phase4 position names its block");
ok((await w.locator(".p-station").textContent()).includes("第 1 站"), "phase4 station label in topbar");
ok((await w.locator(".below .kernel-diagram").count()) === 1, "phase4 OS kernel diagram below screen");
ok((await w.locator(".below .kernel-diagram .pano-chip.current").textContent()).includes("系统调用"), "phase4 kernel diagram highlights current topic");
ok((await w.locator(".below .kernel-diagram .pano-gap").count()) === 0, "phase6 kernel diagram has no gap placeholder left");
ok((await w.locator(".below .kernel-diagram").textContent()).includes("线程与调度"), "phase6 kernel diagram pins the threads-scheduling topic");
ok((await w.locator(".bridge .bridge-card").count()) === 2, "phase4 bridge has prev/next cards");
ok((await w.locator(".bridge a.bridge-title").first().getAttribute("href")).includes("/os/fork-exec/"), "phase4 bridge next links to fork-exec");
await w.goto(`${base}/os/fork-exec/`);
ok((await w.locator(".bridge a.bridge-title").first().getAttribute("href")).includes("/os/syscall/"), "phase4 fork-exec bridge prev links to syscall");
await w.goto(`${base}/`);
ok((await w.locator(".journey-step").count()) === 6, "phase4 home journey has 6 stages");
ok((await w.locator(".subject-guide .kernel-diagram").count()) === 1, "phase4 home OS guide has kernel diagram");
ok((await w.locator(".subject-guide").count()) === 6, "phase4 home has 6 subject guides");
const cardHs = await w.evaluate(() => [...document.querySelectorAll(".subject .topic-card")].slice(0, 3).map((el) => Math.round(el.getBoundingClientRect().height)));
ok(Math.max(...cardHs) - Math.min(...cardHs) <= 1, `phase4 first-row cards equal height (${cardHs})`);
ok(werr.filter((e) => !(wBeacon && e.includes("ERR_CERT_AUTHORITY_INVALID"))).length === 0, `phase4 pages no console errors ${werr.join(";")}`);
// ---- phase 6: P1 topics (threads-scheduling / greedy / string-matching) ----
const x = await browser.newPage({ viewport: { width: 1440, height: 900 } });
const xerr = []; x.on("pageerror", (e) => xerr.push(e.message)); x.on("console", (m) => m.type() === "error" && xerr.push(m.text()));
let xBeacon = false; x.on("requestfailed", (r) => { if (r.url().includes("cloudflareinsights.com")) xBeacon = true; });
for (const u of ["/os/threads-scheduling/", "/dsa/greedy/", "/dsa/string-matching/"]) {
  const rr = await x.goto(`${base}${u}`);
  ok(rr.status() === 200, `phase6 new topic ${u} 200`);
}
await x.goto(`${base}/os/threads-scheduling/`);
ok((await x.locator(".p-station").textContent()).includes("第 4 站"), "phase6 threads is OS station 4");
ok((await x.locator(".p-station").textContent()).includes("共 9 站"), "phase6 OS path now has 9 stations");
ok((await x.locator(".design .design-item").count()) >= 2, "phase6 threads design block renders");
ok((await x.locator(".bridge a.bridge-title").first().getAttribute("href")).includes("/os/context-switch/"), "phase6 threads bridge prev links to context-switch");
await x.goto(`${base}/os/context-switch/`);
ok((await x.locator(".bridge a.bridge-title").last().getAttribute("href")).includes("/os/threads-scheduling/"), "phase6 context-switch bridge next links to threads");
await x.goto(`${base}/dsa/greedy/`);
ok((await x.locator(".p-station").textContent()).includes("共 10 站"), "phase6 DSA path now has 10 stations");
ok((await x.locator(".design .design-item").count()) >= 2, "phase6 greedy design block renders");
await x.goto(`${base}/dsa/dynamic-programming/`);
ok((await x.locator(".bridge a.bridge-title").last().getAttribute("href")).includes("/dsa/greedy/"), "phase6 dp bridge next links to greedy");
await x.goto(`${base}/dsa/string-matching/`);
ok((await x.locator(".bridge a.bridge-title").first().getAttribute("href")).includes("/dsa/greedy/"), "phase6 string-matching bridge prev links to greedy");
ok(xerr.filter((e) => !(xBeacon && e.includes("ERR_CERT_AUTHORITY_INVALID"))).length === 0, `phase6 pages no console errors ${xerr.join(";")}`);
// ---- phase 7: db-internals topic (data station 2 of 4) ----
const rr7 = await x.goto(`${base}/data/db-internals/`);
ok(rr7.status() === 200, "phase7 new topic /data/db-internals/ 200");
ok((await x.locator(".p-station").textContent()).includes("第 2 站"), "phase7 db-internals is data station 2");
ok((await x.locator(".p-station").textContent()).includes("共 4 站"), "phase7 data path now has 4 stations");
ok((await x.locator(".design .design-item").count()) >= 2, "phase7 db-internals design block renders");
ok((await x.locator(".bridge a.bridge-title").first().getAttribute("href")).includes("/data/btree-index/"), "phase7 db-internals bridge prev links to btree-index");
ok((await x.locator(".bridge a.bridge-title").last().getAttribute("href")).includes("/data/transactions/"), "phase7 db-internals bridge next links to transactions");
await x.goto(`${base}/data/btree-index/`);
ok((await x.locator(".bridge a.bridge-title").last().getAttribute("href")).includes("/data/db-internals/"), "phase7 btree bridge next links to db-internals");
await x.goto(`${base}/data/transactions/`);
ok((await x.locator(".bridge a.bridge-title").first().getAttribute("href")).includes("/data/db-internals/"), "phase7 transactions bridge prev links to db-internals");
ok(xerr.filter((e) => !(xBeacon && e.includes("ERR_CERT_AUTHORITY_INVALID"))).length === 0, `phase7 pages no console errors ${xerr.join(";")}`);
// ---- phase 8: data expansion (query-execution / locks-deadlocks / replication, data stations 5-7 of 7) ----
for (const u of ["/data/query-execution/", "/data/locks-deadlocks/", "/data/replication/"]) {
  const rr = await x.goto(`${base}${u}`);
  ok(rr.status() === 200, `phase8 new topic ${u} 200`);
}
await x.goto(`${base}/data/query-execution/`);
ok((await x.locator(".p-station").textContent()).includes("第 5 站"), "phase8 query-execution is data station 5");
ok((await x.locator(".p-station").textContent()).includes("共 7 站"), "phase8 data path now has 7 stations");
ok((await x.locator(".design .design-item").count()) >= 2, "phase8 query-execution design block renders");
ok((await x.locator(".bridge a.bridge-title").first().getAttribute("href")).includes("/data/lsm-kv/"), "phase8 query-execution bridge prev links to lsm-kv");
ok((await x.locator(".bridge a.bridge-title").last().getAttribute("href")).includes("/data/locks-deadlocks/"), "phase8 query-execution bridge next links to locks-deadlocks");
await x.goto(`${base}/data/lsm-kv/`);
ok((await x.locator(".bridge a.bridge-title").last().getAttribute("href")).includes("/data/query-execution/"), "phase8 lsm-kv bridge next links to query-execution");
await x.goto(`${base}/data/locks-deadlocks/`);
ok((await x.locator(".p-station").textContent()).includes("第 6 站"), "phase8 locks-deadlocks is data station 6");
ok((await x.locator(".design .design-item").count()) >= 2, "phase8 locks-deadlocks design block renders");
ok((await x.locator(".bridge a.bridge-title").first().getAttribute("href")).includes("/data/query-execution/"), "phase8 locks bridge prev links to query-execution");
ok((await x.locator(".bridge a.bridge-title").last().getAttribute("href")).includes("/data/replication/"), "phase8 locks bridge next links to replication");
await x.goto(`${base}/data/replication/`);
ok((await x.locator(".p-station").textContent()).includes("第 7 站"), "phase8 replication is data station 7");
ok((await x.locator(".design .design-item").count()) >= 2, "phase8 replication design block renders");
ok((await x.locator(".bridge a.bridge-title").first().getAttribute("href")).includes("/data/locks-deadlocks/"), "phase8 replication bridge prev links to locks-deadlocks");
ok(xerr.filter((e) => !(xBeacon && e.includes("ERR_CERT_AUTHORITY_INVALID"))).length === 0, `phase8 pages no console errors ${xerr.join(";")}`);
await x.close();
await w.close();
await browser.close();
