import { chromium } from "playwright-core";
const b = await chromium.launch({ executablePath: process.env.CHROME, args: ["--no-sandbox"] });
const page = await (await b.newContext({ viewport: { width: 1440, height: 900 } })).newPage();
await page.goto("http://127.0.0.1:4174/go/origins/", { waitUntil: "networkidle" });
const info = await page.evaluate(() => {
  const classes = new Set();
  document.querySelectorAll("*").forEach(e => e.className && typeof e.className === "string" && e.className.split(/\s+/).forEach(c => classes.add(c)));
  const stepEl = document.querySelector(".step");
  return {
    title: document.title,
    h2: stepEl?.querySelector("h2")?.textContent,
    bodyStart: document.body.innerText.slice(0, 400),
    classes: [...classes].filter(c => /step|stage|detail|player|canvas|data|cell|log|nav/i.test(c)),
  };
});
console.log(JSON.stringify(info, null, 1));
await b.close();
