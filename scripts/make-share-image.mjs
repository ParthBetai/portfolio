// Makes the link preview images and the icons:
//   public/opengraph-image.jpg and public/twitter-image.jpg (1200x630, the card
//   LinkedIn, WhatsApp, X and others show when someone shares the site),
//   public/apple-icon.png (180x180, "Add to Home Screen" on an iPhone) and
//   public/icon.svg (the favicon).
// They are plain public/ files linked from app/layout.tsx metadata.
//
// It draws them from the site's own pieces: the self-hosted Archivo, the
// drawing set's tokens (copied below as constants), the name, role and
// ribbon read from lib/content.ts, and the taxi itself, rendered from
// components/Ambassador.tsx and components/AmbassadorDefs.tsx, so the car
// on the card and in the icons is always the car on the page.
//
// The card is Sheet 01 in miniature: the cream drafting sheet with its
// frame and registration marks, the brick "Portfolio" ribbon, the name in
// the hero's sign-painted shade, the role on its highlighter swipe, and
// the taxi on the kerb with its front half exposed as the blueprint copy
// (the line drawing on the cyanotype blue, lined up with the colour car).
// The icons are the colour taxi with a cream roof rack on a navy tile.
//
// Run it again after changing the name, the role, the ribbon, the taxi
// or the palette. If the card's words change, update SHARE_ALT in
// app/layout.tsx, which describes it.
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
import { pathToFileURL } from "node:url";
import ts from "typescript";
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

const archivo = fs.readFileSync(path.join(ROOT, "app/fonts/archivo-latin-standard-normal.woff2")).toString("base64");

/* The name, role and ribbon are read from content.ts rather than copied,
   so the card can't drift from the site. A plain regex is enough for the
   few simple strings it needs. */
const content = fs.readFileSync(path.join(ROOT, "lib/content.ts"), "utf8");
const pick = (key) => {
  const m = new RegExp(`\\b${key}:\\s*"([^"]+)"`).exec(content);
  if (!m) throw new Error(`content.ts: ${key} not found`);
  return m[1];
};
const fullName = pick("fullName");
const role = pick("role");
const ribbon = pick("ribbon");
const esc = (s) => s.replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]);

/* ---- the taxi, from the site's own components ------------------------
   The two .tsx files are compiled to plain modules in node_modules/.cache
   (so their react imports resolve from the project) and rendered to
   static markup. */
const CACHE = path.join(ROOT, "node_modules/.cache/make-share-image");
fs.mkdirSync(CACHE, { recursive: true });
for (const name of ["Ambassador", "AmbassadorDefs"]) {
  const src = fs.readFileSync(path.join(ROOT, `components/${name}.tsx`), "utf8");
  const out = ts.transpileModule(src, {
    compilerOptions: { module: ts.ModuleKind.ESNext, target: ts.ScriptTarget.ES2020, jsx: ts.JsxEmit.ReactJSX },
  }).outputText.replace(/from "\.\/Ambassador"/g, 'from "./Ambassador.mjs"');
  fs.writeFileSync(path.join(CACHE, `${name}.mjs`), out);
}
const load = (name) => import(pathToFileURL(path.join(CACHE, `${name}.mjs`)).href);
const { default: Ambassador } = await load("Ambassador");
const { default: AmbassadorDefs } = await load("AmbassadorDefs");
const { createElement: h } = await import("react");
const { renderToStaticMarkup } = await import("react-dom/server");

const defsSvg = renderToStaticMarkup(h(AmbassadorDefs));
const defsOnly = /<defs>[\s\S]*<\/defs>/.exec(defsSvg)?.[0];
if (!defsOnly) throw new Error("AmbassadorDefs: no <defs> found");
const svgInner = (markup) => /^<svg[^>]*>([\s\S]*)<\/svg>$/.exec(markup)?.[1] ?? "";

/* The drawing set's tokens (app/globals.css). */
const CREAM = "#f3eee3";
const INK = "#1d2a6e";
const INK_DEEP = "#131a4a";
const BLUE = "#1a3a7c";
const BLINE = "#e2ebff";
const BRICK = "#b42f1f";
const TAXI = "#f6c400";

/* The hero's sign-painted shade (--shade-hero in styles/f0-base.css). */
const SHADE = [
  ...[0.006, 0.012].map((e) => `${e}em ${e}em 0 ${CREAM}`),
  ...[0.018, 0.024, 0.03, 0.036, 0.042, 0.048, 0.054].map((e) => `${e.toFixed(3)}em ${e.toFixed(3)}em 0 ${BRICK}`),
].join(",");

const reg = (corner) =>
  `<svg class="reg ${corner}" width="26" height="26" viewBox="0 0 26 26"><g fill="none" stroke="currentColor" stroke-width="1"><circle cx="13" cy="13" r="7.3"/><path d="M13 0 V26 M0 13 H26"/></g></svg>`;

const colourCar = renderToStaticMarkup(h(Ambassador, { variant: "color", width: 600, rack: true, ink: INK }));
const lineCar = renderToStaticMarkup(h(Ambassador, { variant: "line", width: 600, rack: true, ink: BLINE, paper: BLUE }));

const card = `<!doctype html><meta charset="utf-8"><style>
@font-face{font-family:A;src:url(data:font/woff2;base64,${archivo}) format("woff2");font-weight:100 900;font-stretch:62% 125%}
*{box-sizing:border-box;margin:0}
body{width:1200px;height:630px;overflow:hidden;position:relative;font-family:A,sans-serif;color:${INK};-webkit-font-smoothing:antialiased;
  background:${CREAM} radial-gradient(circle,rgb(29 42 110 / .17) 1.05px,transparent 1.5px) 0 0/24px 24px}
.frame{position:absolute;inset:14px;border:1px solid currentColor;opacity:.2}
.frame::before{content:"";position:absolute;inset:5px;border:1px solid currentColor;border-left:0;opacity:.55}
.reg{position:absolute;opacity:.6}.tl{top:1px;left:1px}.tr{top:1px;right:1px}.bl{bottom:1px;left:1px}.br{bottom:1px;right:1px}
.copy{position:absolute;left:84px;top:96px;z-index:2}
.ribbon{display:inline-flex;align-items:center;gap:10px;background:${BRICK};color:#f8f0e0;font-weight:750;font-size:15px;letter-spacing:.02em;padding:7px 26px;margin-left:4px;
  clip-path:polygon(0 0,100% 0,calc(100% - 12px) 50%,100% 100%,0 100%,12px 50%)}
.ribbon i{width:5px;height:5px;border-radius:50%;background:${TAXI};display:block}
.name{margin-top:16px;font-weight:850;font-stretch:96%;letter-spacing:-.04em;line-height:.84;font-size:97px;color:${INK_DEEP};text-shadow:${SHADE}}
.name span{display:block}.name .l2{margin-left:.04em}
/* Two lines at most, kept clear of the taxi's roof rack; each line gets
   its own highlighter swipe (clone), as the hero's role does. */
.role{margin-top:28px;max-width:440px;font-weight:750;font-size:34px;letter-spacing:-.025em;line-height:1.18;color:${INK_DEEP}}
.hl{background-image:linear-gradient(98deg,transparent .12em,rgb(246 196 0 / .85) .2em,rgb(246 196 0 / .72) 55%,rgb(246 196 0 / .88) calc(100% - .3em),transparent calc(100% - .1em));
  background-size:100% .58em;background-position:0 82%;background-repeat:no-repeat;padding:0 .14em;margin:0 -.14em;
  -webkit-box-decoration-break:clone;box-decoration-break:clone}
.kerb{position:absolute;left:0;right:0;bottom:92px;border-top:1.6px solid ${INK}}
.taxi{position:absolute;right:40px;bottom:96px;width:600px;height:232px}
.taxi svg{position:absolute;inset:0;width:100%;height:100%;overflow:visible}
.bp{position:absolute;inset:-40px -40px -40px 50%;overflow:hidden;background-color:${BLUE};
  background-image:radial-gradient(ellipse at 50% 35%,transparent 50%,rgb(6 16 52 / .32)),linear-gradient(rgb(226 235 255 / .10) 1px,transparent 1px),linear-gradient(90deg,rgb(226 235 255 / .10) 1px,transparent 1px),linear-gradient(rgb(226 235 255 / .045) 1px,transparent 1px),linear-gradient(90deg,rgb(226 235 255 / .045) 1px,transparent 1px);
  background-size:100% 100%,120px 120px,120px 120px,24px 24px,24px 24px}
.bp svg{inset:auto;left:-300px;top:40px;width:600px;height:232px}
.cut{position:absolute;left:300px;top:-40px;bottom:-40px;border-left:2.5px solid ${CREAM}}
</style>
${defsSvg}
<div class="frame"></div>${reg("tl")}${reg("tr")}${reg("bl")}${reg("br")}
<div class="kerb"></div>
<div class="copy">
  <p class="ribbon"><i></i>${esc(ribbon)}<i></i></p>
  <p class="name">${esc(fullName).split(" ").map((w, i) => `<span${i ? ' class="l2"' : ""}>${w}</span>`).join("")}</p>
  <p class="role"><span class="hl">${esc(role)}</span></p>
</div>
<div class="taxi">${colourCar}<div class="bp">${lineCar}</div><i class="cut"></i></div>`;

/* The icon: the colour taxi with a cream roof rack, on the navy. The
   box round the car is widened upwards so the rack fits. */
const iconCar = svgInner(renderToStaticMarkup(h(Ambassador, { variant: "color", width: 48, rack: true, ink: CREAM })));
const iconSvg = (size, radius) => {
  const w = +(size * 0.82).toFixed(2);
  const ht = +((w * 27) / 49).toFixed(2);
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${size} ${size}">${defsOnly}<rect width="${size}" height="${size}" rx="${radius}" fill="${INK}"/><svg x="${((size - w) / 2).toFixed(2)}" y="${((size - ht) / 2).toFixed(2)}" width="${w}" height="${ht}" viewBox="-0.5 -4 49 27" overflow="visible">${iconCar}</svg></svg>`;
};

/* The favicon: rounded like the tiles in the mockup. The iPhone icon is
   full bleed, since iOS rounds the corners itself. */
fs.writeFileSync(path.join(ROOT, "public/icon.svg"), iconSvg(32, 7) + "\n");

const browser = await chromium.launch({ executablePath: BROWSER, headless: true });
try {
  const page = await browser.newPage({ viewport: { width: 1200, height: 630 }, deviceScaleFactor: 1 });
  await page.setContent(card, { waitUntil: "load" });
  await page.evaluate(() => document.fonts.ready);
  /* JPEG: some apps give up on large preview images, and a JPEG of this
     card is a fraction of the PNG. */
  const og = path.join(ROOT, "public/opengraph-image.jpg");
  await page.screenshot({ path: og, type: "jpeg", quality: 90 });
  fs.copyFileSync(og, path.join(ROOT, "public/twitter-image.jpg"));

  await page.setViewportSize({ width: 180, height: 180 });
  await page.setContent(`<!doctype html><style>*{margin:0}body{width:180px;height:180px}body>svg{display:block;width:180px;height:180px}</style>${iconSvg(180, 0)}`, {
    waitUntil: "load",
  });
  await page.screenshot({ path: path.join(ROOT, "public/apple-icon.png") });

  for (const f of ["opengraph-image.jpg", "twitter-image.jpg", "apple-icon.png", "icon.svg"]) {
    console.log(`Wrote public/${f}: ${(fs.statSync(path.join(ROOT, "public", f)).size / 1024).toFixed(1)} KB`);
  }
} finally {
  await browser.close();
}
