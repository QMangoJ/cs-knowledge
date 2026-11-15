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
  await page.goto(`${base}/os/syscall/5/`);
  await page.waitForTimeout(400);
  ok((await page.locator(".step h2").textContent()) === "切到内核态", `${tag} direct /5/ shows the step now at position 5 (was step 4 before the overview step was prepended)`);
  rsc.length = 0;
  await page.keyboard.press("ArrowRight");
  ok(page.url().endsWith("/os/syscall/6/"), `${tag} ArrowRight -> /6/`);
  await page.locator(".stepnav button", { hasText: "上一步" }).click();
  ok(page.url().endsWith("/os/syscall/5/"), `${tag} prev button -> /5/`);
  // Layout mode follows the main-area width (viewport minus the 240px menu): grid + steplist at >= 1120px content width.
  if (vp.width >= 1360) {
    await page.locator(".steplist a").first().click();
  } else {
    await page.locator(".step-chips .chip").first().click();
  }
  ok(page.url().endsWith("/os/syscall/"), `${tag} step list -> step 1`);
  ok(await page.locator(".stepnav button", { hasText: "上一步" }).isDisabled(), `${tag} prev disabled on step 1`);
  ok((await page.locator(".step h2").textContent()) === "概况", `${tag} step 1 is the synthesized overview step`);
  ok((await page.locator(".log tbody tr").count()) === 0, `${tag} log rows = 0 on the overview step (log starts with the first real step)`);
  await page.goBack();
  await page.waitForFunction(() => document.querySelectorAll('.log tbody tr').length === 4, null, { timeout: 3000 }).catch(() => {});
  ok(page.url().endsWith("/os/syscall/5/") && (await page.locator(".log tbody tr").count()) === 4, `${tag} back -> /5/ with 4 log rows`);
  await page.reload();
  ok((await page.locator(".step h2").textContent()) === "切到内核态", `${tag} reload stays on the step at /5/`);
  ok(rsc.length === 0, `${tag} no RSC fetch while stepping ${rsc.join(",")}`);
  const sw = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
  ok(sw <= 0, `${tag} no horizontal scroll (${sw})`);
  if (vp.width < 1360) {
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

// ---- no autoplay: the step player must never advance on its own ----
const np = await browser.newPage({ viewport: { width: 1440, height: 900 } });
await np.goto(`${base}/os/syscall/2/`);
const npTitle = await np.locator(".step h2").textContent();
ok((await np.locator(".stepnav button", { hasText: "播放" }).count()) === 0 && (await np.locator(".stepnav .speeds").count()) === 0, "noautoplay: no play button / speed control in step nav");
await np.waitForTimeout(5200);
ok(np.url().endsWith("/os/syscall/2/") && (await np.locator(".step h2").textContent()) === npTitle, "noautoplay: step unchanged after 5.2s dwell");
await np.locator(".stepnav button", { hasText: "下一步" }).click();
ok(np.url().endsWith("/os/syscall/3/"), "noautoplay: manual next still works after dwell");
await np.close();

// ---- P2 lesson: co/bus-dma (12 player steps = 概况 + 10 + 设计) ----
const bd = await browser.newPage({ viewport: { width: 1440, height: 900 } });
await bd.goto(`${base}/co/bus-dma/`);
ok((await bd.locator(".step h2").textContent())?.length > 0, "p2 bus-dma: step 1 renders");
ok((await bd.locator(".step-chips .chip").count()) === 12, "p2 bus-dma: 12 step chips");
await bd.goto(`${base}/co/bus-dma/12/`);
ok((await bd.locator(".step h2").textContent())?.length > 0, "p2 bus-dma: step 12 renders");
await bd.close();

// ---- P2 lessons: memory-consistency / grpc / distributions / np-completeness (player step counts incl. synthesized steps) ----
for (const [slugPath, steps, label] of [["co/memory-consistency", 12, "memory-consistency"], ["network/grpc", 12, "grpc"], ["math/distributions", 13, "distributions"], ["dsa/np-completeness", 13, "np-completeness"]]) {
  const pg = await browser.newPage({ viewport: { width: 1440, height: 900 } });
  await pg.goto(`${base}/${slugPath}/`);
  ok((await pg.locator(".step h2").textContent())?.length > 0, `p2 ${label}: step 1 renders`);
  ok((await pg.locator(".step-chips .chip").count()) === steps, `p2 ${label}: ${steps} step chips`);
  await pg.goto(`${base}/${slugPath}/${steps}/`);
  ok((await pg.locator(".step h2").textContent())?.length > 0, `p2 ${label}: last step renders`);
  await pg.close();
}

// ---- always-on agents lesson: ai/always-on-agents (13 player steps = 概况 + 10 + 终端 + 设计) ----
{
  const pg = await browser.newPage({ viewport: { width: 1440, height: 900 } });
  await pg.goto(`${base}/ai/always-on-agents/`);
  ok((await pg.locator(".step h2").textContent())?.length > 0, "always-on-agents: step 1 renders");
  ok((await pg.locator(".step-chips .chip").count()) === 13, "always-on-agents: 13 step chips");
  await pg.goto(`${base}/ai/always-on-agents/13/`);
  ok((await pg.locator(".step h2").textContent())?.length > 0, "always-on-agents: last step renders");
  await pg.close();
}

// ---- phase 2: quiz removed, manual done, new interactions ----
const q = await browser.newPage({ viewport: { width: 1440, height: 900 } });
const qerr = []; q.on("pageerror", (e) => qerr.push(e.message)); q.on("console", (m) => m.type() === "error" && qerr.push(m.text()));
let qBeacon = false; q.on("requestfailed", (r) => { if (r.url().includes("cloudflareinsights.com")) qBeacon = true; });
await q.goto(`${base}/os/syscall/12/`);
ok((await q.locator(".quiz").count()) === 0, "phase2 no quiz rendered on last step");
await q.goto(`${base}/os/syscall/5/`);
ok((await q.locator(".now-bar").count()) >= 1, "phase2 now-bar present on canvas");
await q.goto(`${base}/os/syscall/12/`);
await q.locator(".mark-done").click();
ok(await q.evaluate(() => localStorage.getItem("cs-done:os/syscall") === "1"), "phase2 manual mark-done writes cs-done key");
await q.goto(`${base}/`);
ok((await q.locator("text=数据存储").count()) >= 1 && (await q.locator("text=数学基础").count()) >= 1, "phase2 home has data + math sections");
ok((await q.locator(".route-steps li").count()) === 9, "phase2 route has 9 stages (ai added in phase10)");
await q.goto(`${base}/dsa/binary-search/5/`);
ok((await q.locator(".codeblock .cl.hl").count()) === 1, "phase2 code line highlight on binary search step");
await q.locator(".stepnav .scrub").evaluate((el) => el.focus());
await q.keyboard.press("ArrowRight"); await q.keyboard.press("ArrowRight");
await q.waitForFunction(() => location.pathname.endsWith("/7/"), null, { timeout: 3000 }).catch(() => {});
ok(q.url().endsWith("/dsa/binary-search/7/"), "phase2 scrub slider jumps two steps");
await q.goto(`${base}/dsa/hash-table/10/`);
await q.locator(".lab-hash").waitFor({ timeout: 8000 }).catch(() => {});
ok((await q.locator(".lab-hash").count()) === 1, "phase2 hash playground mounted");
await q.locator(".lab-hash .lab-row button").nth(1).click();
ok((await q.locator(".lab-hash .bs-cell").count()) === 8, "phase2 hash playground preset renders 8 slots");
await q.goto(`${base}/dsa/bfs-dfs/10/`);
await q.locator(".lab-graph").waitFor({ timeout: 8000 }).catch(() => {});
ok((await q.locator(".lab-graph").count()) === 1, "phase2 graph walk mounted");
await q.locator(".lab-graph .lab-row button").nth(1).click();
await q.locator(".lab-graph .lab-row button").last().click(); // single-step may vary; ensure no crash
await q.goto(`${base}/dsa/dijkstra/12/`);
await q.locator(".lab-dij").waitFor({ timeout: 8000 }).catch(() => {});
ok((await q.locator(".lab-dij").count()) === 1, "phase2 dijkstra lab mounted");
await q.locator(".lab-dij .lab-row button", { hasText: "源点 F" }).click();
ok((await q.locator(".lab-dij .bs-cell").count()) === 6, "phase2 dijkstra lab source F renders");
for (const u of ["/data/btree-index/", "/data/transactions/", "/math/probability/", "/co/gpu-simt/", "/network/http2-quic/", "/os/file-system/"]) {
  const rr = await q.goto(`${base}${u}`);
  ok(rr.status() === 200, `phase2 new topic ${u} 200`);
}
await q.goto(`${base}/network/tcp-handshake/14/`);
ok((await q.locator(".design .design-item").count()) === 3, "phase3 design renders as the last step with 3 mechanisms on tcp-handshake");
ok((await q.locator(".design").textContent()).includes("两将军"), "phase3 design block covers two generals");
ok(qerr.filter((e) => !(qBeacon && e.includes("ERR_CERT_AUTHORITY_INVALID"))).length === 0, `phase2 pages no console errors ${qerr.join(";")}`);
await q.close();

// ---- phase 4: app-screen layout + coherence layer ----
const w = await browser.newPage({ viewport: { width: 1440, height: 900 } });
const werr = []; w.on("pageerror", (e) => werr.push(e.message)); w.on("console", (m) => m.type() === "error" && werr.push(m.text()));
let wBeacon = false; w.on("requestfailed", (r) => { if (r.url().includes("cloudflareinsights.com")) wBeacon = true; });
await w.goto(`${base}/os/syscall/`);
const fit = await w.evaluate(() => {
  const main = document.querySelector(".site-main");
  const r = document.querySelector(".app-screen").getBoundingClientRect();
  const sb = document.querySelector(".stage-body").getBoundingClientRect();
  const det = document.querySelector(".p-details");
  return { screenH: r.height, mainH: main.clientHeight, mainScrolls: main.scrollHeight > main.clientHeight + 1, stageBodyH: sb.height, detH: det.clientHeight, stageH: document.querySelector(".p-stage").getBoundingClientRect().height };
});
ok(Math.abs(fit.screenH - fit.mainH) <= 2, `phase5 fullscreen: app screen fills the main area (${Math.round(fit.screenH)} vs main ${fit.mainH})`);
ok(!fit.mainScrolls, "phase5 fullscreen: page body never scrolls on a course page");
ok(fit.stageBodyH >= 150 && fit.stageBodyH < 640, `phase5 overview step: stage body height sane (${Math.round(fit.stageBodyH)}px)`);
ok(Math.abs(fit.detH - fit.stageH) < 190, `phase5 details column aligns with stage row and scrolls inside (${Math.round(fit.detH)} vs stage ${Math.round(fit.stageH)})`);
for (const u of ["/os/syscall/7/", "/network/tcp-handshake/4/", "/dsa/hash-table/5/", "/co/cache/5/", "/dsa/dynamic-programming/6/", "/dsa/bst-trees/7/"]) {
  await w.goto(`${base}${u}`);
  const dh = await w.evaluate(() => document.querySelector(".stage-body").getBoundingClientRect().height);
  ok(dh <= 580, `phase5 dense sample ${u}: stage body capped (${Math.round(dh)}px <= 580)`);
}
await w.goto(`${base}/os/syscall/`);
const m5 = await browser.newPage({ viewport: { width: 390, height: 844 } });
await m5.goto(`${base}/os/syscall/`);
const m5r = await m5.evaluate(() => ({ sw: document.documentElement.scrollWidth, sb: document.querySelector(".stage-body").getBoundingClientRect().height }));
ok(m5r.sw <= 390, `phase5 390 no horizontal overflow (scrollWidth ${m5r.sw})`);
ok(m5r.sb <= 330, `phase5 390 stage body capped by the stage region (${Math.round(m5r.sb)}px)`);
await m5.close();
ok((await w.locator(".position-card").count()) === 1, "phase4 position card on step 1");
ok((await w.locator(".position-card").textContent()).includes("系统调用接口"), "phase4 position names its block");
ok((await w.locator(".p-station").textContent()).includes("第 1 站"), "phase4 station label in topbar");
ok((await w.locator(".below").count()) === 0, "phase4 no below-the-screen content on course pages (fullscreen stage only)");
ok((await w.locator(".sidenav .sn-topic").count()) >= 40, "phase4 site menu lists the courses");
ok((await w.locator(".sidenav .sn-topic.current").first().getAttribute("href")).includes("/os/syscall/"), "phase4 menu highlights the current topic (syscall)");
await w.locator(".sidenav .sn-topic[href='/distributed/mq-governance/']").first().click();
await w.waitForFunction(() => location.pathname.includes("/distributed/mq-governance/"), null, { timeout: 5000 }).catch(() => {});
ok(w.url().includes("/distributed/mq-governance/"), "phase4 menu jumps from a course page straight to mq-governance");
ok((await w.locator(".step h2").textContent()) === "概况", "phase4 mq-governance step 1 is the overview step");
ok((await w.locator(".sidenav .sn-topic.current").first().getAttribute("href")).includes("/distributed/mq-governance/"), "phase4 menu highlight follows the jump");
await w.goto(`${base}/`);
ok((await w.locator(".journey-step").count()) === 8, "phase4 home journey has 8 stages (ai ring added in phase10)");
ok((await w.locator(".subject-guide .kernel-diagram").count()) === 1, "phase4 home OS guide has kernel diagram");
ok((await w.locator(".subject-guide").count()) === 8, "phase4 home has 8 subject guides (ai added in phase10)");
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
ok((await x.locator(".sidenav .sn-topic[href='/os/context-switch/']").count()) >= 1, "phase6 threads neighbours reachable via menu (context-switch)");
await x.goto(`${base}/os/threads-scheduling/13/`);
ok((await x.locator(".design .design-item").count()) >= 2, "phase6 threads design renders on the last step");
await x.goto(`${base}/os/context-switch/11/`);
ok((await x.locator(".stepnav a.btn").getAttribute("href")).includes("/os/threads-scheduling/"), "phase6 context-switch last step next-topic button links to threads");
await x.goto(`${base}/dsa/greedy/`);
ok((await x.locator(".p-station").textContent()).includes("共 11 站"), "phase6 DSA path now has 11 stations (P2 np-completeness appended)");
await x.goto(`${base}/dsa/greedy/13/`);
ok((await x.locator(".design .design-item").count()) >= 2, "phase6 greedy design renders on the last step");
await x.goto(`${base}/dsa/dynamic-programming/13/`);
ok((await x.locator(".stepnav a.btn").getAttribute("href")).includes("/dsa/greedy/"), "phase6 dp last step next-topic button links to greedy");
await x.goto(`${base}/dsa/string-matching/`);
ok((await x.locator(".sidenav .sn-topic[href='/dsa/greedy/']").count()) >= 1, "phase6 string-matching neighbours reachable via menu (greedy)");
ok(xerr.filter((e) => !(xBeacon && e.includes("ERR_CERT_AUTHORITY_INVALID"))).length === 0, `phase6 pages no console errors ${xerr.join(";")}`);
// ---- phase 7: db-internals topic (data station 2 of 4) ----
const rr7 = await x.goto(`${base}/data/db-internals/`);
ok(rr7.status() === 200, "phase7 new topic /data/db-internals/ 200");
ok((await x.locator(".p-station").textContent()).includes("第 2 站"), "phase7 db-internals is data station 2");
ok((await x.locator(".p-station").textContent()).includes("共 7 站"), "phase7 data path station total (updated by phase8 expansion to 7)");
await x.goto(`${base}/data/db-internals/15/`);
ok((await x.locator(".design .design-item").count()) >= 2, "phase7 db-internals design renders on the last step");
ok((await x.locator(".stepnav a.btn").getAttribute("href")).includes("/data/transactions/"), "phase7 db-internals last step next-topic button links to transactions");
await x.goto(`${base}/data/btree-index/13/`);
ok((await x.locator(".stepnav a.btn").getAttribute("href")).includes("/data/db-internals/"), "phase7 btree last step next-topic button links to db-internals");
await x.goto(`${base}/data/transactions/`);
ok((await x.locator(".sidenav .sn-topic[href='/data/db-internals/']").count()) >= 1, "phase7 transactions neighbours reachable via menu (db-internals)");
ok(xerr.filter((e) => !(xBeacon && e.includes("ERR_CERT_AUTHORITY_INVALID"))).length === 0, `phase7 pages no console errors ${xerr.join(";")}`);
// ---- phase 8: data expansion (query-execution / locks-deadlocks / replication, data stations 5-7 of 7) ----
for (const u of ["/data/query-execution/", "/data/locks-deadlocks/", "/data/replication/"]) {
  const rr = await x.goto(`${base}${u}`);
  ok(rr.status() === 200, `phase8 new topic ${u} 200`);
}
await x.goto(`${base}/data/query-execution/`);
ok((await x.locator(".p-station").textContent()).includes("第 5 站"), "phase8 query-execution is data station 5");
ok((await x.locator(".p-station").textContent()).includes("共 7 站"), "phase8 data path now has 7 stations");
ok((await x.locator(".sidenav .sn-topic[href='/data/lsm-kv/']").count()) >= 1, "phase8 query-execution neighbours reachable via menu (lsm-kv)");
await x.goto(`${base}/data/query-execution/13/`);
ok((await x.locator(".design .design-item").count()) >= 2, "phase8 query-execution design renders on the last step");
ok((await x.locator(".stepnav a.btn").getAttribute("href")).includes("/data/locks-deadlocks/"), "phase8 query-execution last step next-topic button links to locks-deadlocks");
await x.goto(`${base}/data/lsm-kv/12/`);
ok((await x.locator(".stepnav a.btn").getAttribute("href")).includes("/data/query-execution/"), "phase8 lsm-kv last step next-topic button links to query-execution");
await x.goto(`${base}/data/locks-deadlocks/`);
ok((await x.locator(".p-station").textContent()).includes("第 6 站"), "phase8 locks-deadlocks is data station 6");
await x.goto(`${base}/data/locks-deadlocks/14/`);
ok((await x.locator(".design .design-item").count()) >= 2, "phase8 locks-deadlocks design renders on the last step");
ok((await x.locator(".stepnav a.btn").getAttribute("href")).includes("/data/replication/"), "phase8 locks last step next-topic button links to replication");
await x.goto(`${base}/data/replication/`);
ok((await x.locator(".p-station").textContent()).includes("第 7 站"), "phase8 replication is data station 7");
ok((await x.locator(".sidenav .sn-topic[href='/data/locks-deadlocks/']").count()) >= 1, "phase8 replication neighbours reachable via menu (locks-deadlocks)");
await x.goto(`${base}/data/replication/13/`);
ok((await x.locator(".design .design-item").count()) >= 2, "phase8 replication design renders on the last step");
ok(xerr.filter((e) => !(xBeacon && e.includes("ERR_CERT_AUTHORITY_INVALID"))).length === 0, `phase8 pages no console errors ${xerr.join(";")}`);

// ---- Phase 9: distributed subject (5 lessons) ----
for (const u of ["/distributed/why-hard/", "/distributed/cap-consistency/", "/distributed/raft-consensus/", "/distributed/time-and-transactions/", "/distributed/mq-governance/"]) {
  const rr = await x.goto(base + u);
  ok(rr.status() === 200, `phase9 distributed topic ${u} 200`);
}
await x.goto(`${base}/distributed/why-hard/`);
ok((await x.locator(".p-station").textContent()).includes("第 1 站"), "phase9 why-hard is distributed station 1");
ok((await x.locator(".p-station").textContent()).includes("共 5 站"), "phase9 distributed path has 5 stations");
await x.goto(`${base}/distributed/why-hard/13/`);
ok((await x.locator(".design .design-item").count()) >= 2, "phase9 why-hard design renders on the last step");
ok((await x.locator(".stepnav a.btn").getAttribute("href")).includes("/distributed/cap-consistency/"), "phase9 why-hard last step next-topic button links to cap-consistency");
await x.goto(`${base}/distributed/cap-consistency/`);
ok((await x.locator(".p-station").textContent()).includes("第 2 站"), "phase9 cap-consistency is distributed station 2");
ok((await x.locator(".sidenav .sn-topic[href='/distributed/why-hard/']").count()) >= 1, "phase9 cap neighbours reachable via menu (why-hard)");
await x.goto(`${base}/distributed/cap-consistency/13/`);
ok((await x.locator(".stepnav a.btn").getAttribute("href")).includes("/distributed/raft-consensus/"), "phase9 cap last step next-topic button links to raft-consensus");
await x.goto(`${base}/distributed/raft-consensus/`);
ok((await x.locator(".p-station").textContent()).includes("第 3 站"), "phase9 raft-consensus is distributed station 3");
await x.goto(`${base}/distributed/raft-consensus/13/`);
ok((await x.locator(".stepnav a.btn").getAttribute("href")).includes("/distributed/time-and-transactions/"), "phase9 raft last step next-topic button links to time-and-transactions");
await x.goto(`${base}/distributed/time-and-transactions/`);
ok((await x.locator(".p-station").textContent()).includes("第 4 站"), "phase9 time-and-transactions is distributed station 4");
await x.goto(`${base}/distributed/time-and-transactions/13/`);
ok((await x.locator(".design .design-item").count()) >= 2, "phase9 time-and-transactions design renders on the last step");
ok((await x.locator(".stepnav a.btn").getAttribute("href")).includes("/distributed/mq-governance/"), "phase9 time-and-transactions last step next-topic button links to mq-governance (new bridge)");
// ---- Phase 9b: the new mq-governance lesson (13 player steps = 概况 + 10 + 终端 + 设计) ----
await x.goto(`${base}/distributed/mq-governance/`);
ok((await x.locator(".p-station").textContent()).includes("第 5 站"), "phase9 mq-governance is distributed station 5");
ok((await x.locator(".step h2").textContent()) === "概况", "phase9 mq-governance step 1 is the overview step");
ok((await x.locator(".step-chips .chip").count()) === 13, "phase9 mq-governance has 13 step chips");
ok((await x.locator(".sidenav .sn-topic.current").first().getAttribute("href")).includes("/distributed/mq-governance/"), "phase9 menu highlights mq-governance");
await x.goto(`${base}/distributed/mq-governance/4/`);
ok((await x.locator(".step .body").textContent()).includes("业务场景示意"), "phase9 mq-governance queue step carries the labelled ad-review case");
ok((await x.locator(".step .body").textContent()).includes("30,000"), "phase9 mq-governance worked example shows the verified backlog number");
await x.goto(`${base}/distributed/mq-governance/12/`);
ok((await x.locator(".term-window").count()) === 1, "phase9 mq-governance terminal renders as its own step before design");
await x.goto(`${base}/distributed/mq-governance/13/`);
ok((await x.locator(".design .design-item").count()) === 3, "phase9 mq-governance design step renders 3 mechanisms");
ok((await x.locator(".in-step-sources li").count()) >= 5, "phase9 mq-governance design step carries the compact source list");
ok(xerr.filter((e) => !(xBeacon && e.includes("ERR_CERT_AUTHORITY_INVALID"))).length === 0, `phase9 pages no console errors ${xerr.join(";")}`);

// ---- Phase 10: ai subject (5 lessons) ----
for (const u of ["/ai/neural-backprop/", "/ai/attention-transformer/", "/ai/training/", "/ai/inference-kv-cache/"]) {
  const rr = await x.goto(base + u);
  ok(rr.status() === 200, `phase10 ai topic ${u} 200`);
}
await x.goto(`${base}/ai/neural-backprop/`);
ok((await x.locator(".p-station").textContent()).includes("第 1 站"), "phase10 neural-backprop is ai station 1");
ok((await x.locator(".p-station").textContent()).includes("共 5 站"), "phase10 ai path has 5 stations (always-on-agents appended)");
await x.goto(`${base}/ai/neural-backprop/13/`);
ok((await x.locator(".design .design-item").count()) >= 2, "phase10 neural-backprop design renders on the last step");
ok((await x.locator(".stepnav a.btn").getAttribute("href")).includes("/ai/attention-transformer/"), "phase10 backprop last step next-topic button links to attention-transformer");
await x.goto(`${base}/ai/attention-transformer/`);
ok((await x.locator(".p-station").textContent()).includes("第 2 站"), "phase10 attention is ai station 2");
ok((await x.locator(".sidenav .sn-topic[href='/ai/neural-backprop/']").count()) >= 1, "phase10 attention neighbours reachable via menu (neural-backprop)");
await x.goto(`${base}/ai/attention-transformer/13/`);
ok((await x.locator(".stepnav a.btn").getAttribute("href")).includes("/ai/training/"), "phase10 attention last step next-topic button links to training");
await x.goto(`${base}/ai/training/`);
ok((await x.locator(".p-station").textContent()).includes("第 3 站"), "phase10 training is ai station 3");
await x.goto(`${base}/ai/training/13/`);
ok((await x.locator(".stepnav a.btn").getAttribute("href")).includes("/ai/inference-kv-cache/"), "phase10 training last step next-topic button links to inference-kv-cache");
await x.goto(`${base}/ai/inference-kv-cache/`);
ok((await x.locator(".p-station").textContent()).includes("第 4 站"), "phase10 inference-kv-cache is ai station 4");
await x.goto(`${base}/ai/inference-kv-cache/12/`);
ok((await x.locator(".design .design-item").count()) >= 2, "phase10 inference design renders on the last step");
ok(xerr.filter((e) => !(xBeacon && e.includes("ERR_CERT_AUTHORITY_INVALID"))).length === 0, `phase10 pages no console errors ${xerr.join(";")}`);
await x.close();

// ---- site menu on mobile: drawer from the header button ----
{
  const mp = await browser.newPage({ viewport: { width: 390, height: 844 } });
  await mp.goto(`${base}/os/syscall/`);
  ok(await mp.locator(".sidenav:not(.drawer)").isHidden(), "menu mobile: fixed sidebar hidden at 390px");
  ok((await mp.locator(".sidenav.drawer.open").count()) === 0, "menu mobile: drawer starts closed");
  await mp.locator(".nav-toggle").click();
  ok((await mp.locator(".sidenav.drawer.open").count()) === 1, "menu mobile: drawer opens from the header button");
  ok((await mp.locator(".sidenav.drawer .sn-topic.current").first().getAttribute("href")).includes("/os/syscall/"), "menu mobile: drawer highlights the current topic");
  await mp.locator(".sidenav.drawer .sn-topic[href='/distributed/mq-governance/']").click();
  await mp.waitForFunction(() => location.pathname.includes("/distributed/mq-governance/"), null, { timeout: 5000 }).catch(() => {});
  ok(mp.url().includes("/distributed/mq-governance/"), "menu mobile: drawer link jumps to mq-governance");
  ok((await mp.locator(".sidenav.drawer.open").count()) === 0, "menu mobile: drawer closes after navigation");
  await mp.close();
}
await w.close();
await browser.close();
