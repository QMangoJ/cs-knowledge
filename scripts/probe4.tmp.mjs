import { chromium } from "playwright-core";
const b = await chromium.launch({ executablePath: process.env.CHROME, args: ["--no-sandbox"] });
const base = "http://127.0.0.1:4174";
const ctx = await b.newContext({ viewport: { width: 390, height: 844 } });
const page = await ctx.newPage();
async function lastStepInfo(path) {
  await page.goto(base + path + "/", { waitUntil: "networkidle" });
  const total = await page.evaluate(() => document.querySelector(".p-stepcount")?.textContent?.match(/共 (\d+) 步/)?.[1]);
  await page.goto(base + path + "/" + total + "/", { waitUntil: "networkidle" });
  return page.evaluate((total) => {
    const nav = document.querySelector(".stepnav");
    const btn = [...(nav?.querySelectorAll("button, a") || [])].find((e) => (e.innerText || "").includes("下一个主题"));
    if (!btn) return { total, note: "no next-topic btn" };
    const r = btn.getBoundingClientRect();
    const stage = document.querySelector(".p-stage")?.getBoundingClientRect();
    return { total, btnText: btn.innerText.replace(/\n/g, " ").slice(0, 40), btnRight: Math.round(r.right), btnLeft: Math.round(r.left), viewport: innerWidth, stageRight: stage && Math.round(stage.right), fullyVisible: r.right <= innerWidth + 1 && r.left >= -1 };
  }, total);
}
for (const p of ["/os/io-multiplexing", "/co/instruction-cycle", "/distributed/mq-governance", "/network/http2-quic", "/go/goroutine-channel", "/network/grpc"]) {
  console.log(p, JSON.stringify(await lastStepInfo(p)));
}
await b.close();
