// Renders page 1 of public/Parth-Betai-Resume.pdf to public/resume-preview.webp,
// the image the resume preview shows. Run it again whenever the PDF changes.
//
// Browsers can't reliably show a PDF inside the page (phones won't render one
// in a frame, and the site's security headers forbid frames anyway), so the
// preview is a picture of the page, made once here with pdf.js in a headless
// Chromium browser.
//
// One-off setup (nothing is added to package.json):
//   npm i --no-save pdfjs-dist playwright-core
// Then, from the project root:
//   node scripts/render-resume-preview.mjs [width=1800] [webpQuality=0.92]
//
// It looks for Edge, Chrome or Chromium in the usual places (Windows, Linux,
// macOS). Set BROWSER_PATH to point at another Chromium-based browser.
import http from "node:http";
import fs from "node:fs";
import path from "node:path";
import { createRequire } from "node:module";
import { chromium } from "playwright-core";

const ROOT = process.cwd();
const require = createRequire(path.join(ROOT, "package.json"));
const PDFJS = path.dirname(require.resolve("pdfjs-dist/package.json"));
const PDF = path.join(ROOT, "public/Parth-Betai-Resume.pdf");
const OUT = path.join(ROOT, "public/resume-preview.webp");
const WIDTH = Number(process.argv[2] || 1800);
const QUALITY = Number(process.argv[3] || 0.92);
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

const html = `<!doctype html><meta charset="utf-8"><body style="margin:0">
<canvas id="c"></canvas>
<script type="module">
import * as pdfjs from "/pdf.mjs";
pdfjs.GlobalWorkerOptions.workerSrc = "/pdf.worker.mjs";
const doc = await pdfjs.getDocument({ url: "/resume.pdf", cMapUrl: "/cmaps/", cMapPacked: true, standardFontDataUrl: "/standard_fonts/" }).promise;
const page = await doc.getPage(1);
const base = page.getViewport({ scale: 1 });
const vp = page.getViewport({ scale: ${WIDTH} / base.width });
const c = document.getElementById("c");
c.width = Math.round(vp.width);
c.height = Math.round(vp.height);
const ctx = c.getContext("2d");
ctx.fillStyle = "#fff";
ctx.fillRect(0, 0, c.width, c.height);
await page.render({ canvasContext: ctx, viewport: vp, background: "#ffffff" }).promise;
window.__done = { width: c.width, height: c.height };
</script>`;

// Only these files are served, and only to this machine (127.0.0.1, a
// random free port), for the few seconds the render takes.
const files = {
  "/pdf.mjs": path.join(PDFJS, "build/pdf.mjs"),
  "/pdf.worker.mjs": path.join(PDFJS, "build/pdf.worker.mjs"),
  "/resume.pdf": PDF,
};
const types = { ".mjs": "text/javascript", ".pdf": "application/pdf" };
const server = http.createServer((req, res) => {
  const url = decodeURIComponent(new URL(req.url, "http://x").pathname);
  if (url === "/") {
    res.writeHead(200, { "content-type": "text/html" });
    return res.end(html);
  }
  let file = files[url];
  if (!file && /^\/(cmaps|standard_fonts)\/[\w.-]+$/.test(url)) file = path.join(PDFJS, url);
  if (!file || !fs.existsSync(file)) {
    res.writeHead(404);
    return res.end();
  }
  res.writeHead(200, { "content-type": types[path.extname(file)] || "application/octet-stream" });
  fs.createReadStream(file).pipe(res);
});
await new Promise((r) => server.listen(0, "127.0.0.1", r));

const browser = await chromium.launch({ executablePath: BROWSER, headless: true });
try {
  const page = await browser.newPage();
  page.on("pageerror", (e) => console.error("[pageerror]", e.message));
  await page.goto(`http://127.0.0.1:${server.address().port}/`);
  await page.waitForFunction(() => window.__done, null, { timeout: 60000 });
  const info = await page.evaluate(() => window.__done);
  const data = await page.evaluate(
    (q) => document.getElementById("c").toDataURL("image/webp", q),
    QUALITY
  );
  if (!data.startsWith("data:image/webp")) throw new Error("This browser can't encode WebP.");
  const buf = Buffer.from(data.split(",")[1], "base64");
  fs.writeFileSync(OUT, buf);
  console.log(
    `Wrote ${path.relative(ROOT, OUT)}: ${info.width}x${info.height}, ${(buf.length / 1024).toFixed(0)} KB.`
  );
  console.log(
    `If the size changed, update PREVIEW and the aspect-[${info.width}/${info.height}] class in components/ResumePreview.tsx.`
  );
} finally {
  await browser.close();
  server.close();
}
