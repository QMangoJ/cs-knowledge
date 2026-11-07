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
  const rsc = []; page.on("request", (r) => { if (/\/os\/syscall\/.*(_rsc=|\.txt)/.test(r.url())) rsc.push(r.url()); });
  const tag = `${vp.width}x${vp.height}`;
  await page.goto(`${base}/os/syscall/4/`);
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
  if (vp.width < 1280) {
    const y = await page.evaluate(() => [".canvas-wrap", ".step", ".p-logbar"].map((q) => document.querySelector(q).getBoundingClientRect().top));
    ok(y[0] < y[1] && y[1] < y[2], `${tag} mobile order 画布→讲解→日志 (${y.map(Math.round)})`);
  }
  fs.mkdirSync("/tmp/cs-shots", { recursive: true });
  await page.screenshot({ path: `/tmp/cs-shots/cs-m0-${tag}.png`, fullPage: true });
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

// ---- phase 4: app-screen layout + coherence layer ----
const w = await browser.newPage({ viewport: { width: 1440, height: 900 } });
const werr = []; w.on("pageerror", (e) => werr.push(e.message)); w.on("console", (m) => m.type() === "error" && werr.push(m.text()));
await w.goto(`${base}/os/syscall/`);
const fit = await w.evaluate(() => {
  const r = document.querySelector(".app-screen").getBoundingClientRect();
  return { bottom: r.bottom, ih: window.innerHeight };
});
ok(Math.abs(fit.bottom - fit.ih) <= 4, `phase4 app screen ends at viewport bottom (${Math.round(fit.bottom)} vs ${fit.ih})`);
ok((await w.locator(".position-card").count()) === 1, "phase4 position card on step 1");
ok((await w.locator(".position-card").textContent()).includes("系统调用接口"), "phase4 position names its block");
ok((await w.locator(".p-station").textContent()).includes("第 1 站"), "phase4 station label in topbar");
ok((await w.locator(".below .kernel-diagram").count()) === 1, "phase4 OS kernel diagram below screen");
ok((await w.locator(".below .kernel-diagram .pano-chip.current").textContent()).includes("系统调用"), "phase4 kernel diagram highlights current topic");
ok((await w.locator(".below .kernel-diagram .pano-gap").textContent()).includes("线程与调度"), "phase4 kernel diagram shows scheduling gap placeholder");
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
ok(werr.length === 0, `phase4 pages no console errors ${werr.join(";")}`);
await w.close();
await browser.close();
