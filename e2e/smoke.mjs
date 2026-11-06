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
  await page.goto(`${base}/os/syscall/3/`);
  ok((await page.locator(".step h2").textContent()) === "切到内核态", `${tag} direct /3/ shows step 3`);
  rsc.length = 0;
  await page.keyboard.press("ArrowRight");
  ok(page.url().endsWith("/os/syscall/4/"), `${tag} ArrowRight -> /4/`);
  await page.locator(".stepnav button", { hasText: "上一步" }).click();
  ok(page.url().endsWith("/os/syscall/3/"), `${tag} prev button -> /3/`);
  await page.locator(".steplist a").first().click();
  ok(page.url().endsWith("/os/syscall/"), `${tag} step list -> step 1`);
  ok(await page.locator(".stepnav button", { hasText: "上一步" }).isHidden(), `${tag} no prev on step 1`);
  ok((await page.locator(".log tbody tr").count()) === 1, `${tag} log rows = 1 on step 1`);
  await page.goBack();
  await page.waitForFunction(() => document.querySelectorAll('.log tbody tr').length === 3, null, { timeout: 3000 }).catch(() => {});
  ok(page.url().endsWith("/os/syscall/3/") && (await page.locator(".log tbody tr").count()) === 3, `${tag} back -> /3/ with 3 log rows`);
  await page.reload();
  ok((await page.locator(".step h2").textContent()) === "切到内核态", `${tag} reload stays on step 3`);
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
await browser.close();
