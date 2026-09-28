// Screenshot checker: drives a headless Chromium through a plan and saves
// screenshots plus a log of console errors. Used to check every change
// visually at desktop and phone sizes.
//
// One-off setup (nothing is added to package.json):
//   npm i --no-save playwright-core
// Usage, with the dev server running:
//   node scripts/screenshots.mjs plan.json
// A plan:
//   { "url": "http://127.0.0.1:3000/", "width": 1440, "height": 900,
//     "mobile": false, "reducedMotion": true, "out": "shots",
//     "steps": [ {"wait": 7000}, {"goto": "#contact"}, {"move": [900, 400]},
//                {"hover": "css"}, {"click": "css"}, {"wheel": 400, "times": 2},
//                {"eval": "js expression"}, {"shot": "name"} ] }
// Keys inside one step run in this order: wait, goto, scrollTo, wheel,
// scrollToSel, move, hover, click, eval, shot. The home page intro locks
// scrolling for about five seconds, so start with a wait of ~7000.
// "reducedMotion": true is what a PC with animations switched off sees.
// Screenshots and log.json land in <out>, next to the plan file.
import { chromium } from "playwright-core";
import fs from "node:fs";
import path from "node:path";

const BROWSER = [
  process.env.BROWSER_PATH,
  "C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe",
  "C:/Program Files/Google/Chrome/Application/chrome.exe",
  "/usr/bin/chromium",
  "/usr/bin/chromium-browser",
  "/usr/bin/google-chrome",
  "/usr/bin/microsoft-edge",
  "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
].find((p) => p && fs.existsSync(p));
if (!BROWSER) throw new Error("No Chromium-based browser found. Set BROWSER_PATH.");

const plan = JSON.parse(fs.readFileSync(process.argv[2], "utf8"));
const outDir = path.join(path.dirname(process.argv[2]), plan.out || "out");
fs.mkdirSync(outDir, { recursive: true });

const browser = await chromium.launch({
  executablePath: BROWSER,
  headless: true,
  args: plan.software ? ["--use-angle=swiftshader", "--enable-unsafe-swiftshader"] : ["--ignore-gpu-blocklist"],
});
const ctx = await browser.newContext({
  viewport: { width: plan.width || 1440, height: plan.height || 900 },
  deviceScaleFactor: 1,
  reducedMotion: plan.reducedMotion ? "reduce" : "no-preference",
  isMobile: !!plan.mobile,
  hasTouch: !!plan.mobile,
});
if (plan.init) await ctx.addInitScript(plan.init);
const page = await ctx.newPage();
const logs = [];
page.on("console", (m) => { if (["error", "warning"].includes(m.type())) logs.push(`[${m.type()}] ${m.text()}`); });
page.on("pageerror", (e) => logs.push(`[pageerror] ${e.message}`));

await page.goto(plan.url, { waitUntil: plan.waitUntil || "domcontentloaded", timeout: 60000 });
const results = [];
for (const s of plan.steps) {
  if (s.wait) await page.waitForTimeout(s.wait);
  if (s.goto) await page.evaluate((sel) => { const el = sel === "bottom" ? null : document.querySelector(sel); const y = el ? el.getBoundingClientRect().top + window.scrollY + (0) : document.documentElement.scrollHeight; const l = window.__lenis; if (l && l.scrollTo) l.scrollTo(y, { immediate: true, force: true }); else window.scrollTo(0, y); }, s.goto);
  if (s.scrollTo !== undefined) await page.evaluate((y) => window.scrollTo(0, y), s.scrollTo);
  if (s.wheel) { for (let i = 0; i < (s.times || 1); i++) { await page.mouse.wheel(0, s.wheel); await page.waitForTimeout(s.gap || 60); } }
  if (s.scrollToSel) await page.evaluate((sel) => { const el = document.querySelector(sel); if (el) window.scrollTo(0, el.getBoundingClientRect().top + window.scrollY + (0)); }, s.scrollToSel);
  if (s.move) await page.mouse.move(s.move[0], s.move[1], { steps: 8 });
  if (s.hover) { try { await page.hover(s.hover, { timeout: 3000 }); } catch (e) { logs.push(`[hover-fail] ${s.hover}`); } }
  if (s.click) { try { await page.click(s.click, { timeout: 3000 }); } catch (e) { logs.push(`[click-fail] ${s.click}`); } }
  if (s.eval) results.push({ eval: s.eval.slice(0, 60), value: await page.evaluate(s.eval) });
  if (s.shot) await page.screenshot({ path: path.join(outDir, `${s.shot}.png`), fullPage: !!s.full });
}
fs.writeFileSync(path.join(outDir, "log.json"), JSON.stringify({ logs, results }, null, 2));
console.log(JSON.stringify({ outDir, logs: logs.slice(0, 30), results }, null, 2));
await browser.close();
