// Sweep the 4 new lessons on the local production build (out/ on :4174).
import { chromium } from "playwright-core";
const CHROME = process.env.CHROME;
const base = "http://127.0.0.1:4174";
const lessons = [
  { path: "/go/origins", steps: 11 },
  { path: "/go/goroutine-channel", steps: 12 },
  { path: "/go/interfaces-composition", steps: 12 },
  { path: "/network/rest-graphql", steps: 14 },
];
const problems = [];
const notes = [];
const browser = await chromium.launch({ executablePath: CHROME, args: ["--no-sandbox"] });

async function checkPage(page, url, label) {
  const errors = [];
  const onErr = (e) => errors.push(String(e.message || e));
  page.on("pageerror", onErr);
  const resp = await page.goto(url, { waitUntil: "networkidle" });
  if (!resp || resp.status() !== 200) problems.push(`${label}: HTTP ${resp?.status()}`);
  await page.waitForTimeout(150);
  const r = await page.evaluate(() => {
    const stage = document.querySelector(".p-stage");
    const details = document.querySelector(".p-details");
    const txt = (el) => (el ? el.innerText : "");
    const sentences = (s) => s.split(/[。！？\n]/).map((x) => x.trim()).filter((x) => x.length >= 15);
    const sSet = new Set(sentences(txt(stage)));
    const dup = sentences(txt(details)).filter((x) => sSet.has(x));
    const rawMarker = /\[\[[^\]]{1,40}\]\]/.test(txt(stage) + txt(details));
    const hOverflow = document.documentElement.scrollWidth - window.innerWidth;
    // clipped: content wider than box while overflow hidden/clip (not scrollable)
    const clipped = [];
    document.querySelectorAll(".p-stage *, .p-details *").forEach((el) => {
      const cs = getComputedStyle(el);
      if (el.scrollWidth > el.clientWidth + 2 && cs.overflowX !== "auto" && cs.overflowX !== "scroll") {
        const t = (el.innerText || el.textContent || "").trim().slice(0, 40);
        if (t) clipped.push(`${el.tagName}.${String(el.className).slice(0, 30)}: ${t}`);
      }
    });
    const canvasText = (document.querySelector(".canvas-wrap")?.innerText || "").trim();
    return {
      h2: document.querySelector(".step h2")?.textContent || "",
      stepcount: document.querySelector(".p-stepcount")?.textContent?.trim() || "",
      dup: [...new Set(dup)],
      rawMarker,
      hOverflow,
      clipped: clipped.slice(0, 4),
      canvasLen: canvasText.length,
      detailsScroll: details ? { sh: details.scrollHeight, ch: details.clientHeight } : null,
    };
  });
  if (!r.h2) problems.push(`${label}: no step h2`);
  if (r.rawMarker) problems.push(`${label}: raw [[ ]] marker visible`);
  if (r.hOverflow > 1) problems.push(`${label}: horizontal overflow ${r.hOverflow}px`);
  if (r.dup.length) problems.push(`${label}: stage/details duplicate sentence(s): ${r.dup[0].slice(0, 60)}…`);
  if (r.clipped.length) problems.push(`${label}: clipped: ${r.clipped.join(" | ")}`);
  if (errors.length) problems.push(`${label}: page errors: ${errors[0]}`);
  return r;
}

for (const vp of [{ name: "desktop", width: 1440, height: 900 }, { name: "mobile", width: 390, height: 844 }]) {
  const ctx = await browser.newContext({ viewport: { width: vp.width, height: vp.height } });
  const page = await ctx.newPage();
  page.on("console", (m) => { if (m.type() === "error") problems.push(`console[${vp.name}]: ${m.text().slice(0, 120)}`); });
  for (const lesson of lessons) {
    for (let s = 1; s <= lesson.steps; s++) {
      const url = s === 1 ? `${base}${lesson.path}/` : `${base}${lesson.path}/${s}/`;
      const r = await checkPage(page, url, `${lesson.path} step${s} [${vp.name}]`);
      if (s === 1 && vp.name === "desktop") notes.push(`${lesson.path}: stepcount="${r.stepcount}" canvasTextLen(step1)=${r.canvasLen} detailsScroll=${JSON.stringify(r.detailsScroll)}`);
      if (s > 1 && s < lesson.steps && r.canvasLen === 0) problems.push(`${lesson.path} step${s} [${vp.name}]: canvas empty`);
    }
  }
  // quiz interaction on origins last step (desktop only is fine, do both cheaply)
  await page.goto(`${base}/go/origins/11/`, { waitUntil: "networkidle" });
  const quizCount = await page.locator(".quiz-opt").count();
  notes.push(`origins last step quiz options [${vp.name}]: ${quizCount}`);
  await ctx.close();
}

// structural pages
const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
const page = await ctx.newPage();
await page.goto(base + "/", { waitUntil: "networkidle" });
const home = await page.locator("body").innerText();
notes.push(`home has Go 语言: ${home.includes("Go 语言")}; progress snippet: ${(home.match(/总进度：[^\n]*/) || ["?"])[0]}`);
await page.goto(base + "/go/", { waitUntil: "networkidle" });
const goPage = await page.locator("body").innerText();
notes.push(`/go/ lists 3 lessons: ${["Go 为什么诞生", "goroutine 与 channel", "接口与组合"].every((t) => goPage.includes(t))}`);
await page.goto(base + "/network/grpc/7/", { waitUntil: "networkidle" }).catch(() => {});
const grpcSteps = await page.evaluate(() => document.querySelector(".p-stepcount")?.textContent?.trim());
notes.push(`grpc stepcount: ${grpcSteps}`);
await page.goto(base + "/network/", { waitUntil: "networkidle" });
const netPage = await page.locator("body").innerText();
notes.push(`/network/ lists rest-graphql: ${netPage.includes("REST 与 GraphQL")}`);
await ctx.close();
await browser.close();

console.log("=== NOTES ===");
notes.forEach((n) => console.log(" -", n));
console.log(`=== PROBLEMS (${problems.length}) ===`);
problems.forEach((p) => console.log(" !", p));
