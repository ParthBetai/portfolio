// Makes the link preview images: app/opengraph-image.jpg and
// app/twitter-image.jpg (1200x630, the card LinkedIn, WhatsApp, X and
// others show when someone shares the site) and app/apple-icon.png
// (180x180, the icon for "Add to Home Screen" on an iPhone). Next.js
// picks all three up from app/ by their file names.
//
// It draws them from the site's own pieces: the self-hosted fonts, the
// cut-out portrait and the copper horizon from the footer. Run it again
// after changing the portrait, the name or the role.
//
// One-off setup (nothing is added to package.json):
//   npm i --no-save playwright-core
// Then, from the project root:
//   node scripts/make-share-image.mjs
//
// It looks for Edge, Chrome or Chromium in the usual places (Windows, Linux,
// macOS). Set BROWSER_PATH to point at another Chromium-based browser.
import fs from "node:fs";
import path from "node:path";
import { chromium } from "playwright-core";

const ROOT = process.cwd();
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

const b64 = (p) => fs.readFileSync(path.join(ROOT, p)).toString("base64");
const archivo = b64("app/fonts/archivo-latin-standard-normal.woff2");
const portrait = b64("public/portrait.webp");

/* The name, role and places are read from content.ts rather than copied,
   so the card can't drift from the site. A plain regex is enough for the
   few simple strings it needs. */
const content = fs.readFileSync(path.join(ROOT, "lib/content.ts"), "utf8");
const pick = (key) => {
  const m = new RegExp(`${key}:\\s*"([^"]+)"`).exec(content);
  if (!m) throw new Error(`content.ts: ${key} not found`);
  return m[1];
};
const fullName = pick("fullName");
const role = pick("role");
const primary = pick("primary");
const secondary = pick("secondary");
const [roleFirst, ...roleRest] = role.split(" ");
const esc = (s) => s.replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]);
const city = (s) => s.split(",")[0].trim();

const fonts = `@font-face{font-family:A;src:url(data:font/woff2;base64,${archivo}) format("woff2");font-weight:100 900;font-stretch:62% 125%}`;

/* Same four-layer atmosphere as the footer's planet rim. */
const GLOW = [
  "0 -1px 0 1px rgba(255,214,184,0.85)",
  "0 -6px 26px 5px rgba(224,137,90,0.6)",
  "0 -34px 100px 34px rgba(170,88,48,0.4)",
  "0 -90px 220px 90px rgba(96,46,24,0.3)",
].join(",");

const card = `<!doctype html><meta charset="utf-8"><style>${fonts}
*{box-sizing:border-box;margin:0}
body{width:1200px;height:630px;overflow:hidden;position:relative;background:#050505;font-family:A,sans-serif;color:#edede6;-webkit-font-smoothing:antialiased}
.haze{position:absolute;inset:0;background:radial-gradient(ellipse 70% 55% at 62% 100%,rgba(200,112,66,.34) 0%,rgba(110,52,26,.18) 45%,transparent 75%)}
.planet{position:absolute;left:50%;top:83%;width:3000px;height:1500px;margin-left:-1500px;border-radius:50%;background:#000;box-shadow:${GLOW};transform:rotate(-5deg)}
.flare{position:absolute;left:640px;top:calc(83% - 60px);width:520px;height:120px;mix-blend-mode:screen;transform:rotate(-5deg);background:radial-gradient(closest-side,rgba(255,226,204,.75),rgba(224,137,90,.3) 45%,transparent)}
.me{position:absolute;right:28px;bottom:0;height:604px;width:auto;-webkit-mask-image:linear-gradient(180deg,#000 72%,transparent 99%);mask-image:linear-gradient(180deg,#000 72%,transparent 99%)}
.copy{position:absolute;left:76px;top:84px;width:640px}
.eyebrow{font-weight:500;font-size:17px;letter-spacing:.1em;text-transform:uppercase;color:#7a7a82}
h1{margin-top:26px;font-weight:900;font-stretch:125%;font-size:132px;line-height:.86;letter-spacing:-.03em;text-transform:uppercase;
  background-image:linear-gradient(100deg,transparent 18%,rgba(255,255,255,.9) 36%,#fff 40%,rgba(255,255,255,.9) 44%,transparent 62%),linear-gradient(177deg,#fdfdff 0%,#d6d6de 17%,#8e8e99 33%,#55555f 46%,#3a3a44 52%,#6e6e79 62%,#b4b4bf 76%,#ededf3 88%,#9a9aa5 100%);
  background-size:100% 100%,100% 50%;background-repeat:no-repeat,repeat-y;-webkit-background-clip:text;background-clip:text;color:transparent}
.role{margin-top:34px;font-size:40px;letter-spacing:-.01em}
.role b{font-weight:900;font-stretch:125%;text-transform:uppercase;letter-spacing:-.02em}
.role span{font-weight:250;color:#9a9aa2}
.meta{margin-top:22px;font-size:21px;line-height:1.5;color:#8a8a92}
</style>
<div class="haze"></div><div class="planet"></div><div class="flare"></div>
<img class="me" src="data:image/webp;base64,${portrait}" alt="">
<div class="copy">
  <p class="eyebrow">Portfolio</p>
  <h1>${esc(fullName).replace(" ", "<br>")}</h1>
  <p class="role"><b>${esc(roleFirst)}</b> <span>${esc(roleRest.join(" "))}</span></p>
  <p class="meta">Android apps, robots and websites<br>${esc(city(primary))} and ${esc(city(secondary))}, India</p>
</div>`;

/* The favicon's mark, full bleed: iOS rounds the corners itself. */
const icon = `<!doctype html><style>*{margin:0}body{width:180px;height:180px;background:#050505}</style>
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32" width="180" height="180"><rect width="32" height="32" fill="#050505"/><path d="M10.5 24V8.5h6.5a4.75 4.75 0 0 1 0 9.5h-6.5" fill="none" stroke="#edede6" stroke-width="3" stroke-linecap="square" stroke-linejoin="miter"/><circle cx="23.5" cy="23" r="2.3" fill="#e0895a"/></svg>`;

const browser = await chromium.launch({ executablePath: BROWSER, headless: true });
try {
  const page = await browser.newPage({ viewport: { width: 1200, height: 630 }, deviceScaleFactor: 1 });
  await page.setContent(card, { waitUntil: "load" });
  await page.evaluate(() => document.fonts.ready);
  /* JPEG: a photo-like card is a third of the size of the PNG, and
     some apps give up on large preview images. */
  const og = path.join(ROOT, "app/opengraph-image.jpg");
  await page.screenshot({ path: og, type: "jpeg", quality: 90 });
  fs.copyFileSync(og, path.join(ROOT, "app/twitter-image.jpg"));

  await page.setViewportSize({ width: 180, height: 180 });
  await page.setContent(icon, { waitUntil: "load" });
  await page.screenshot({ path: path.join(ROOT, "app/apple-icon.png") });

  for (const f of ["opengraph-image.jpg", "twitter-image.jpg", "apple-icon.png"]) {
    console.log(`Wrote app/${f}: ${(fs.statSync(path.join(ROOT, "app", f)).size / 1024).toFixed(0)} KB`);
  }
} finally {
  await browser.close();
}
