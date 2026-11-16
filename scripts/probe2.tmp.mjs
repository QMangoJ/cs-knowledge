import { chromium } from "playwright-core";
const b = await chromium.launch({ executablePath: process.env.CHROME, args: ["--no-sandbox"] });
const page = await (await b.newContext({ viewport: { width: 1440, height: 900 } })).newPage();
const base = "http://127.0.0.1:4174";
async function dupCheck(url) {
  await page.goto(url, { waitUntil: "networkidle" });
  return page.evaluate(() => {
    const stage = document.querySelector(".p-stage")?.innerText || "";
    const details = document.querySelector(".p-details")?.innerText || "";
    const sentences = (s) => s.split(/[。！？\n]/).map((x) => x.trim()).filter((x) => x.length >= 15);
    const sSet = new Set(sentences(stage));
    return {
      dup: sentences(details).filter((x) => sSet.has(x)).slice(0, 1),
      quizOpts: document.querySelectorAll(".quiz-opt").length,
      hasQuiz: !!document.querySelector(".quiz"),
      stageClasses: document.querySelector(".step")?.className,
    };
  });
}
console.log("grpc last step:", JSON.stringify(await dupCheck(base + "/network/grpc/12/")));
console.log("origins last step:", JSON.stringify(await dupCheck(base + "/go/origins/11/")));
console.log("binary-search step8:", JSON.stringify(await dupCheck(base + "/dsa/binary-search/8/")));
// code block scrollability on goroutine step 6
await page.goto(base + "/go/goroutine-channel/6/", { waitUntil: "networkidle" });
const codeInfo = await page.evaluate(() => {
  const pre = document.querySelector(".codeblock pre");
  if (!pre) return "no codeblock";
  const cs = getComputedStyle(pre);
  return { overflowX: cs.overflowX, sw: pre.scrollWidth, cw: pre.clientWidth, canScroll: pre.scrollWidth > pre.clientWidth && (cs.overflowX === "auto" || cs.overflowX === "scroll") };
});
console.log("goroutine step6 code pre:", JSON.stringify(codeInfo));
// grpc code step for comparison (step with .proto code)
await page.goto(base + "/network/grpc/4/", { waitUntil: "networkidle" });
const codeInfo2 = await page.evaluate(() => {
  const pre = document.querySelector(".codeblock pre");
  if (!pre) return "no codeblock";
  const cs = getComputedStyle(pre);
  return { overflowX: cs.overflowX, sw: pre.scrollWidth, cw: pre.clientWidth };
});
console.log("grpc step4 code pre:", JSON.stringify(codeInfo2));
// /go/ page text
await page.goto(base + "/go/", { waitUntil: "networkidle" });
const goText = await page.evaluate(() => document.body.innerText.slice(0, 800));
console.log("=== /go/ page ===\n", goText);
await b.close();
