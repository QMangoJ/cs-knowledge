import { chromium } from "playwright-core";
const b = await chromium.launch({ executablePath: process.env.CHROME, args: ["--no-sandbox"] });
const base = "http://127.0.0.1:4174";
async function navInfo(page, url) {
  await page.goto(url, { waitUntil: "networkidle" });
  return page.evaluate(() => {
    const nav = document.querySelector(".stepnav");
    if (!nav) return "no stepnav";
    const cs = getComputedStyle(nav);
    const btns = [...nav.querySelectorAll("button, a")].map((el) => {
      const r = el.getBoundingClientRect();
      return { text: (el.innerText || "").replace(/\n/g, " ").slice(0, 44), w: Math.round(r.width), right: Math.round(r.right), clipped: el.scrollWidth > el.clientWidth + 2 };
    });
    return { sw: nav.scrollWidth, cw: nav.clientWidth, overflowX: cs.overflowX, btns };
  });
}
const ctxM = await b.newContext({ viewport: { width: 390, height: 844 } });
const pm = await ctxM.newPage();
console.log("goroutine last [mobile]:", JSON.stringify(await navInfo(pm, base + "/go/goroutine-channel/12/")));
console.log("grpc last [mobile]:", JSON.stringify(await navInfo(pm, base + "/network/grpc/12/")));
const el = await pm.locator(".stepnav").first();
await el.screenshot({ path: "/tmp/stepnav-goroutine-mobile.png" });
const ctxD = await b.newContext({ viewport: { width: 1440, height: 900 } });
const pd = await ctxD.newPage();
console.log("origins last [desktop]:", JSON.stringify(await navInfo(pd, base + "/go/origins/11/")));
console.log("mq last [desktop]:", JSON.stringify(await navInfo(pd, base + "/distributed/mq-governance/9/")));
await b.close();
