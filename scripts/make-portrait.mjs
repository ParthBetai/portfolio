// Cutout + depth map for the hero portrait (public/portrait.webp and
// public/portrait-depth.png), made from the original photo in
// assets/portrait-source.jpg.
//
// One-off setup (nothing is added to package.json):
//   npm i --no-save playwright-core
// Then, from the project root:
//   node scripts/make-portrait.mjs --publish      (writes both files to public/)
//   node scripts/make-portrait.mjs                (only writes them, plus debug
//                                                  images, to a temp folder)
// Uses a Chromium-based browser: set BROWSER_PATH if it is not found.
//
// Only works for a photo like this one: the subject already cut out and
// placed on pure black.
//
// The source is an earlier cutout composited onto pure black (every background
// pixel is exactly 0, apart from JPEG ringing next to the edges). So:
//   1. key the background with a flood fill from the top/left/right borders
//      through near-exact black (max channel <= T0). A flood cannot enter the
//      black t-shirt or dark hair unless there is an unbroken near-zero path.
//   2. soft alpha on the edge band: the photo is C = a * F over black, so
//      a = C / F where F is the foreground colour estimated from opaque pixels
//      just inside the edge (brightness-weighted masked blur). Where F is too
//      dark for the ratio to be stable (black shirt), a 2px geometric ramp on
//      the flood boundary is used instead.
//   3. un-premultiply against black: edge colour = F (blended toward C / a as
//      alpha rises), so the edge carries no dark fringe on a lighter backdrop.
//   4. feather alpha by about a pixel, drop specks, encode WebP (lossy RGB,
//      lossless alpha).
//   5. depth: exact Euclidean distance transform of the silhouette at quarter
//      size, a rounded profile, biases (head and crossed forearms forward,
//      shoulders and torso sides back), a wide blur, dither, 8-bit PNG.
import { chromium } from "playwright-core";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";

const ROOT = process.cwd();
const SRC = path.join(ROOT, "assets/portrait-source.jpg");
const PUB = path.join(ROOT, "public");
const DBG = path.join(os.tmpdir(), "portrait-cutout");
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
fs.mkdirSync(DBG, { recursive: true });
const Q = Number(process.argv[2] || 0.9);

const b64 = fs.readFileSync(SRC).toString("base64");
const browser = await chromium.launch({
  executablePath: BROWSER,
  headless: true,
});
const page = await browser.newPage();
page.on("console", (m) => console.log("[page]", m.text()));
page.on("pageerror", (e) => console.error("[pageerror]", e.message));
await page.setContent("<body style='margin:0'></body>");

const out = await page.evaluate(
  async ({ b64, Q, PROBE }) => {
    const img = new Image();
    img.src = "data:image/jpeg;base64," + b64;
    await img.decode();
    const W = img.naturalWidth, H = img.naturalHeight, N = W * H;
    const cv = (w, h) => { const c = document.createElement("canvas"); c.width = w; c.height = h; return c; };
    const src = cv(W, H);
    const sx = src.getContext("2d", { willReadFrequently: true });
    sx.drawImage(img, 0, 0);
    const D = sx.getImageData(0, 0, W, H).data;

    const R = new Float32Array(N), G = new Float32Array(N), B = new Float32Array(N), M = new Float32Array(N);
    for (let i = 0; i < N; i++) {
      R[i] = D[i * 4]; G[i] = D[i * 4 + 1]; B[i] = D[i * 4 + 2];
      M[i] = Math.max(R[i], G[i], B[i]);
    }
    const clamp = (v, a, b) => (v < a ? a : v > b ? b : v);
    const sstep = (a, b, v) => { const t = clamp((v - a) / (b - a), 0, 1); return t * t * (3 - 2 * t); };

    /* ---- 1. flood fill ------------------------------------------------ */
    const T0 = 2;
    const bg = new Uint8Array(N);
    const q = new Int32Array(N);
    let qh = 0, qt = 0;
    const seed = (i) => { if (!bg[i] && M[i] <= T0) { bg[i] = 1; q[qt++] = i; } };
    for (let x = 0; x < W; x++) seed(x);
    for (let y = 0; y < H; y++) { seed(y * W); seed(y * W + W - 1); }
    while (qh < qt) {
      const i = q[qh++], x = i % W, y = (i / W) | 0;
      if (x > 0) seed(i - 1);
      if (x < W - 1) seed(i + 1);
      if (y > 0) seed(i - W);
      if (y < H - 1) seed(i + W);
    }
    // keep only the largest 8-connected foreground component, the rest is ringing
    const lab = new Int32Array(N).fill(-1);
    let best = -1, bestN = 0, nl = 0;
    const sizes = [];
    for (let s = 0; s < N; s++) {
      if (bg[s] || lab[s] >= 0) continue;
      let h = 0, t = 0; q[t++] = s; lab[s] = nl; let n = 0;
      while (h < t) {
        const i = q[h++]; n++;
        const x = i % W, y = (i / W) | 0;
        for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) {
          const xx = x + dx, yy = y + dy;
          if (xx < 0 || yy < 0 || xx >= W || yy >= H) continue;
          const j = yy * W + xx;
          if (!bg[j] && lab[j] < 0) { lab[j] = nl; q[t++] = j; }
        }
      }
      sizes.push(n);
      if (n > bestN) { bestN = n; best = nl; }
      nl++;
    }
    const fg = new Uint8Array(N);
    for (let i = 0; i < N; i++) fg[i] = lab[i] === best ? 1 : 0;

    /* ---- exact EDT (Felzenszwalb) ------------------------------------ */
    const INF = 1e20;
    function edt1(f, n, d, v, z) {
      let k = 0; v[0] = 0; z[0] = -INF; z[1] = INF;
      for (let qq = 1; qq < n; qq++) {
        let s = ((f[qq] + qq * qq) - (f[v[k]] + v[k] * v[k])) / (2 * qq - 2 * v[k]);
        while (s <= z[k]) { k--; s = ((f[qq] + qq * qq) - (f[v[k]] + v[k] * v[k])) / (2 * qq - 2 * v[k]); }
        k++; v[k] = qq; z[k] = s; z[k + 1] = INF;
      }
      k = 0;
      for (let qq = 0; qq < n; qq++) { while (z[k + 1] < qq) k++; d[qq] = (qq - v[k]) * (qq - v[k]) + f[v[k]]; }
    }
    // distance from each pixel where inside(i) to the nearest pixel where !inside
    function edt(inside, w, h) {
      const g = new Float64Array(w * h);
      for (let i = 0; i < w * h; i++) g[i] = inside[i] ? INF : 0;
      const n = Math.max(w, h);
      const f = new Float64Array(n), d = new Float64Array(n), v = new Int32Array(n), z = new Float64Array(n + 1);
      for (let x = 0; x < w; x++) {
        for (let y = 0; y < h; y++) f[y] = g[y * w + x];
        edt1(f, h, d, v, z);
        for (let y = 0; y < h; y++) g[y * w + x] = d[y];
      }
      for (let y = 0; y < h; y++) {
        for (let x = 0; x < w; x++) f[x] = g[y * w + x];
        edt1(f, w, d, v, z);
        for (let x = 0; x < w; x++) g[y * w + x] = Math.sqrt(d[x]);
      }
      return g;
    }
    const dIn = edt(fg, W, H);

    /* ---- box blur helpers -------------------------------------------- */
    function boxH(a, w, h, r) {
      const o = new Float32Array(w * h);
      for (let y = 0; y < h; y++) {
        let s = 0; const row = y * w;
        for (let x = -r; x <= r; x++) s += a[row + clamp(x, 0, w - 1)];
        for (let x = 0; x < w; x++) {
          o[row + x] = s / (2 * r + 1);
          s += a[row + clamp(x + r + 1, 0, w - 1)] - a[row + clamp(x - r, 0, w - 1)];
        }
      }
      return o;
    }
    function boxV(a, w, h, r) {
      const o = new Float32Array(w * h);
      for (let x = 0; x < w; x++) {
        let s = 0;
        for (let y = -r; y <= r; y++) s += a[clamp(y, 0, h - 1) * w + x];
        for (let y = 0; y < h; y++) {
          o[y * w + x] = s / (2 * r + 1);
          s += a[clamp(y + r + 1, 0, h - 1) * w + x] - a[clamp(y - r, 0, h - 1) * w + x];
        }
      }
      return o;
    }
    const blur = (a, w, h, r, passes = 2) => { let o = a; for (let p = 0; p < passes; p++) o = boxV(boxH(o, w, h, r), w, h, r); return o; };

    /* ---- 2. foreground colour estimate -------------------------------- */
    /* BAND: how far inside the flood boundary the soft edge can reach. It is
       wide because JPEG ringing and the old cutout's dark falloff put a few
       px of near-black, non-zero pixels outside the real edge. */
    const BAND = 26;
    // interior colour: brightness-weighted masked blur of a ring just inside the band
    const wt = new Float32Array(N), wr = new Float32Array(N), wg = new Float32Array(N), wb = new Float32Array(N);
    for (let i = 0; i < N; i++) {
      if (fg[i] && dIn[i] >= BAND && dIn[i] <= BAND + 8) {
        const w = (M[i] + 8) * (M[i] + 8);
        wt[i] = w; wr[i] = R[i] * w; wg[i] = G[i] * w; wb[i] = B[i] * w;
      }
    }
    const bt = blur(wt, W, H, 7), br = blur(wr, W, H, 7), bgc = blur(wg, W, H, 7), bb = blur(wb, W, H, 7);
    const bt2 = blur(wt, W, H, 18), br2 = blur(wr, W, H, 18), bg2 = blur(wg, W, H, 18), bb2 = blur(wb, W, H, 18);
    const FR = new Float32Array(N), FG = new Float32Array(N), FB = new Float32Array(N);
    for (let i = 0; i < N; i++) {
      if (bt[i] > 1e-3) { FR[i] = br[i] / bt[i]; FG[i] = bgc[i] / bt[i]; FB[i] = bb[i] / bt[i]; }
      else if (bt2[i] > 1e-4) { FR[i] = br2[i] / bt2[i]; FG[i] = bg2[i] / bt2[i]; FB[i] = bb2[i] / bt2[i]; }
      else { FR[i] = R[i]; FG[i] = G[i]; FB[i] = B[i]; }
    }

    /* Edge reference. A soft edge pixel is C = a * F, and F is the colour of the
       opaque edge it fades from. Walking inward from the flood boundary, a soft
       edge is a rising ramp (brightness climbs as alpha climbs) that ends at the
       first peak: the opaque edge, often a rim-lit band, and in the hair up to
       ~20 px in (the photo has a soft blue bloom there). Past that peak the
       pixel is behind an opaque edge, so it is opaque whatever its brightness
       (the dark sleeve behind its thin rim line, for example).
       Pass 1, outside in: a pixel is on the ramp if a shallower ramp neighbour
       is no brighter than it (3x3-smoothed), and it cannot end while it is
       still in the near-black noise, so a speck of JPEG noise is never taken
       for an opaque edge.
       Pass 2, inside out: a ramp pixel's reference is the peak its ramp climbs
       to, and the peak's colour travels with it. */
    const Ms = new Float32Array(N), Rs = new Float32Array(N), Gs = new Float32Array(N), Bs = new Float32Array(N);
    for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
      let sm = 0, sr = 0, sg = 0, sb = 0, n = 0;
      for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) {
        const xx = clamp(x + dx, 0, W - 1), yy = clamp(y + dy, 0, H - 1), j = yy * W + xx;
        sm += M[j]; sr += R[j]; sg += G[j]; sb += B[j]; n++;
      }
      const i = y * W + x;
      Ms[i] = sm / n; Rs[i] = sr / n; Gs[i] = sg / n; Bs[i] = sb / n;
    }
    // interior brightness, kept for ramps that end in noise
    const IM = new Float32Array(N);
    for (let i = 0; i < N; i++) IM[i] = Math.max(FR[i], FG[i], FB[i]);
    const up = new Uint8Array(N);
    const P = new Float32Array(N);
    {
      const band = [];
      for (let i = 0; i < N; i++) if (fg[i] && dIn[i] < BAND) band.push(i);
      band.sort((a, b) => dIn[a] - dIn[b]);
      const nb = (i, f) => {
        const x = i % W, y = (i / W) | 0;
        for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) {
          if (!dx && !dy) continue;
          const xx = x + dx, yy = y + dy;
          if (xx < 0 || yy < 0 || xx >= W || yy >= H) continue;
          f(yy * W + xx);
        }
      };
      // a ramp cannot end in the noise on the black: a peak must be clearly lit
      const PEAK_MIN = 10;
      for (const i of band) {
        if (dIn[i] < 1.5) { up[i] = 1; continue; }
        let u = 0;
        nb(i, (j) => { if (!u && up[j] && dIn[j] < dIn[i] && (Ms[i] >= Ms[j] - 0.5 || Ms[j] < PEAK_MIN)) u = 1; });
        up[i] = u;
      }
      for (let n = band.length - 1; n >= 0; n--) {
        const i = band[n];
        if (!up[i]) continue;
        let best = Ms[i], bj = -1;
        nb(i, (j) => { if (up[j] && dIn[j] > dIn[i] && P[j] > best) { best = P[j]; bj = j; } });
        P[i] = best;
        if (bj < 0 && best < PEAK_MIN) {
          // a ramp that tops out in the noise is not an edge: measure it against the interior
          P[i] = Math.max(PEAK_MIN, IM[i]);
          FR[i] = Rs[i]; FG[i] = Gs[i]; FB[i] = Bs[i];
        } else if (bj < 0) { FR[i] = Rs[i]; FG[i] = Gs[i]; FB[i] = Bs[i]; }
        else { FR[i] = FR[bj]; FG[i] = FG[bj]; FB[i] = FB[bj]; }
      }
      for (const i of band) {
        if (!up[i]) continue;
        const m = Math.max(FR[i], FG[i], FB[i], 1), s = P[i] / m;
        FR[i] *= s; FG[i] *= s; FB[i] *= s;
      }
    }

    /* ---- alpha --------------------------------------------------------- */
    const A = new Float32Array(N);
    const N0 = 2.5; // JPEG noise floor on the black
    for (let i = 0; i < N; i++) {
      if (!fg[i]) { A[i] = 0; continue; }
      const d = dIn[i];
      if (d >= BAND || !up[i]) { A[i] = 1; continue; }
      const ar = clamp((M[i] - N0) / Math.max(P[i] - N0, 1), 0, 1);
      A[i] = Math.max(ar, sstep(BAND - 8, BAND, d));
    }
    /* Opacity only grows inward. The photo's soft edges (a blue bloom of up to
       ~20 px round the hair, JPEG blur elsewhere) ramp up toward an opaque rim,
       but inside that rim a dark strand can read as a low ratio. Visiting the
       band from the outside in and carrying the max of the shallower
       neighbours keeps everything behind an opaque edge opaque, so the ratio
       can only soften the outside of the silhouette, never punch holes in it. */
    {
      const band = [];
      for (let i = 0; i < N; i++) if (fg[i] && dIn[i] < BAND) band.push(i);
      band.sort((a, b) => dIn[a] - dIn[b]);
      for (const i of band) {
        const x = i % W, y = (i / W) | 0;
        let mx = A[i];
        for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) {
          if (!dx && !dy) continue;
          const xx = x + dx, yy = y + dy;
          if (xx < 0 || yy < 0 || xx >= W || yy >= H) continue;
          const j = yy * W + xx;
          if (fg[j] && dIn[j] < dIn[i] && A[j] > mx) mx = A[j];
        }
        A[i] = mx;
      }
    }
    // feather ~1px on the edge band only: [1 2 1] x [1 2 1]
    const A2 = new Float32Array(N);
    for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
      const i = y * W + x;
      if (fg[i] && dIn[i] >= BAND + 1) { A2[i] = A[i]; continue; }
      let s = 0, ws = 0;
      for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) {
        const xx = clamp(x + dx, 0, W - 1), yy = clamp(y + dy, 0, H - 1);
        const w = (dx ? 1 : 2) * (dy ? 1 : 2);
        s += A[yy * W + xx] * w; ws += w;
      }
      A2[i] = s / ws;
    }
    // drop faint specks: keep the main body plus pieces of hair that are clearly there
    const on = new Uint8Array(N);
    for (let i = 0; i < N; i++) on[i] = A2[i] > 0.035 ? 1 : 0;
    lab.fill(-1); nl = 0; best = -1; bestN = 0;
    const compMax = [], compN = [];
    for (let s = 0; s < N; s++) {
      if (!on[s] || lab[s] >= 0) continue;
      let h = 0, t = 0; q[t++] = s; lab[s] = nl; let n = 0, mx = 0;
      while (h < t) {
        const i = q[h++]; n++; mx = Math.max(mx, A2[i]);
        const x = i % W, y = (i / W) | 0;
        for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) {
          const xx = x + dx, yy = y + dy;
          if (xx < 0 || yy < 0 || xx >= W || yy >= H) continue;
          const j = yy * W + xx;
          if (on[j] && lab[j] < 0) { lab[j] = nl; q[t++] = j; }
        }
      }
      compMax.push(mx); compN.push(n);
      if (n > bestN) { bestN = n; best = nl; }
      nl++;
    }
    let dropped = 0;
    for (let i = 0; i < N; i++) {
      if (!on[i]) { A2[i] = 0; continue; }
      const c = lab[i];
      if (c !== best && !(compN[c] >= 40 && compMax[c] >= 0.3)) { A2[i] = 0; dropped++; }
    }

    /* ---- 3. colour: un-premultiply against black ---------------------- */
    const OUT = new Uint8ClampedArray(N * 4);
    for (let i = 0; i < N; i++) {
      const a = A2[i];
      let r, g, b;
      if (a >= 0.985) { r = R[i]; g = G[i]; b = B[i]; }
      else if (a <= 0.001) { r = FR[i]; g = FG[i]; b = FB[i]; }
      else {
        const inv = 1 / Math.max(a, 0.04);
        const ur = Math.min(255, R[i] * inv), ug = Math.min(255, G[i] * inv), ub = Math.min(255, B[i] * inv);
        const k = sstep(0.3, 0.985, a);
        r = FR[i] + (ur - FR[i]) * k; g = FG[i] + (ug - FG[i]) * k; b = FB[i] + (ub - FB[i]) * k;
      }
      OUT[i * 4] = r; OUT[i * 4 + 1] = g; OUT[i * 4 + 2] = b; OUT[i * 4 + 3] = Math.round(a * 255);
    }
    const oc = cv(W, H);
    oc.getContext("2d").putImageData(new ImageData(OUT, W, H), 0, 0);
    const webp = oc.toDataURL("image/webp", Q);
    const png = oc.toDataURL("image/png");

    // bounding box + a few landmarks for the component / depth biases
    let x0 = W, x1 = 0, y0 = H, y1 = 0;
    for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) if (A2[y * W + x] > 0.5) { x0 = Math.min(x0, x); x1 = Math.max(x1, x); y0 = Math.min(y0, y); y1 = Math.max(y1, y); }

    /* ---- 5. depth map (quarter size: it is a very smooth field) ------- */
    const S = 4;
    const w2 = Math.floor(W / S), h2 = Math.floor(H / S), n2 = w2 * h2;
    const sil = new Uint8Array(n2);
    for (let y = 0; y < h2; y++) for (let x = 0; x < w2; x++) {
      let a = 0;
      for (let dy = 0; dy < S; dy++) for (let dx = 0; dx < S; dx++) a += A2[(y * S + dy) * W + x * S + dx];
      sil[y * w2 + x] = a / (S * S) > 0.5 ? 1 : 0;
    }
    // the photo is cut at the bottom: treat the bottom edge as open (body continues)
    const PADB = 100;
    const silPad = new Uint8Array(w2 * (h2 + PADB));
    for (let y = 0; y < h2 + PADB; y++) for (let x = 0; x < w2; x++) silPad[y * w2 + x] = sil[Math.min(y, h2 - 1) * w2 + x];
    const dist = edt(silPad, w2, h2 + PADB);
    const Z = new Float32Array(n2);
    const RB = 128 / S; // roundness radius, ~128 px at full size
    for (let y = 0; y < h2; y++) for (let x = 0; x < w2; x++) {
      const i = y * w2 + x;
      const t = Math.min(dist[i] / RB, 1);
      const round = 1 - (1 - t) * (1 - t) * (1 - t); // soft shoulder at the edge, flat centre
      Z[i] = round * 0.55;
    }
    // biases, written in full-size pixel coordinates
    const X = (px) => px / S, Y = (py) => py / S;
    const gauss2 = (x, y, cx, cy, rx, ry) => Math.exp(-(((x - cx) / rx) ** 2 + ((y - cy) / ry) ** 2) / 2);
    for (let y = 0; y < h2; y++) for (let x = 0; x < w2; x++) {
      const i = y * w2 + x;
      if (!silPad[i]) { Z[i] = 0; continue; }
      let z = Z[i];
      // head: an ellipsoid forward of the neck
      z += 0.3 * gauss2(x, y, X(528), Y(350), X(150), Y(190));
      // crossed forearms: a band well in front of the chest
      z += 0.34 * gauss2(x, y, X(560), Y(1175), X(560), Y(115));
      // chest a touch forward of the belly line
      z += 0.08 * gauss2(x, y, X(545), Y(820), X(300), Y(200));
      // shoulders and torso sides fall back
      const xn = (x - X(545)) / X(540);
      z *= 1 - 0.28 * Math.min(1, xn * xn);
      Z[i] = z;
    }
    // wide blur (about 30 px at full size) so the relief is smooth, then dither to 8 bits
    const Zb = blur(Z, w2, h2, Math.round(18 / S), 3);
    let zmax = 0;
    for (let i = 0; i < n2; i++) zmax = Math.max(zmax, Zb[i]);
    const dimg = new Uint8ClampedArray(n2 * 4);
    let seedr = 1234567;
    const rnd = () => ((seedr = (seedr * 1103515245 + 12345) & 0x7fffffff) / 0x7fffffff);
    for (let i = 0; i < n2; i++) {
      const v = clamp((Zb[i] / zmax) * 255 + (rnd() - 0.5), 0, 255);
      dimg[i * 4] = dimg[i * 4 + 1] = dimg[i * 4 + 2] = v; dimg[i * 4 + 3] = 255;
    }
    const dc = cv(w2, h2);
    dc.getContext("2d").putImageData(new ImageData(dimg, w2, h2), 0, 0);
    const depth = dc.toDataURL("image/png");

    /* ---- debug composites --------------------------------------------- */
    const comp = (bgCol) => {
      const c = cv(W, H); const x = c.getContext("2d");
      x.fillStyle = bgCol; x.fillRect(0, 0, W, H); x.drawImage(oc, 0, 0);
      return c;
    };
    const dbg = {};
    for (const [k, col] of [["void", "#050505"], ["grey", "#7a7a7a"], ["white", "#ffffff"], ["hero", "#1e1e23"]]) dbg[k] = comp(col).toDataURL("image/png");
    // flood overlay
    const fo = cv(W, H); const fx = fo.getContext("2d"); fx.drawImage(src, 0, 0);
    const fd = fx.getImageData(0, 0, W, H);
    for (let i = 0; i < N; i++) if (bg[i]) { fd.data[i * 4] = 120; fd.data[i * 4 + 1] = 0; fd.data[i * 4 + 2] = 60; }
    fx.putImageData(fd, 0, 0);
    dbg.flood = fo.toDataURL("image/png");
    // alpha as grey
    const ac = cv(W, H); const ad = new Uint8ClampedArray(N * 4);
    for (let i = 0; i < N; i++) { ad[i * 4] = ad[i * 4 + 1] = ad[i * 4 + 2] = A2[i] * 255; ad[i * 4 + 3] = 255; }
    ac.getContext("2d").putImageData(new ImageData(ad, W, H), 0, 0);
    dbg.alpha = ac.toDataURL("image/png");

    // zoom sheet: crops x3 over grey and white and void
    const crops = { hairTop: [430, 70, 200, 130], hairRight: [600, 110, 130, 170], earL: [340, 330, 110, 150], earR: [640, 300, 110, 150], fingers: [880, 880, 150, 150], shoulderL: [170, 590, 150, 120], shoulderR: [760, 560, 170, 120], sleeveL: [40, 940, 120, 130], sleeveR: [980, 880, 100, 130], waistL: [170, 1300, 120, 156], waistR: [850, 1290, 120, 166] };
    const Z3 = 3;
    const keys = Object.keys(crops);
    const sheet = cv(3 * 200 * Z3 / 1.5, keys.length * 170 * Z3 / 1.5);
    const shx = sheet.getContext("2d"); shx.imageSmoothingEnabled = false;
    shx.fillStyle = "#300"; shx.fillRect(0, 0, sheet.width, sheet.height);
    const cols = [comp("#050505"), comp("#7a7a7a"), comp("#ffffff")];
    const cellW = sheet.width / 3, cellH = sheet.height / keys.length;
    keys.forEach((k, r) => {
      const [cx, cy, cw, ch] = crops[k];
      const s = Math.min((cellW - 6) / cw, (cellH - 6) / ch);
      cols.forEach((c, j) => shx.drawImage(c, cx, cy, cw, ch, j * cellW + 3, r * cellH + 3, cw * s, ch * s));
    });
    dbg.sheet = sheet.toDataURL("image/png");

    let probe = null;
    if (PROBE) { const [px, py, pw, ph] = PROBE; probe = []; for (let y = py; y < py + ph; y++) { const row = []; for (let x = px; x < px + pw; x++) { const i = y * W + x; row.push(fg[i] ? (up[i] ? "u" : "o") + M[i] + "/" + Math.round(P[i]) + "/" + dIn[i].toFixed(0) + "=" + A2[i].toFixed(2) : "bg" + M[i]); } probe.push(y + ": " + row.join(" ")); } }
    return { probe, W, H, webp, png, depth, dbg, bbox: [x0, y0, x1, y1], comps: sizes.length, dropped, zmax };
  },
  { b64, Q, PROBE: process.env.PROBE ? JSON.parse(process.env.PROBE) : null }
);

const save = (file, dataUrl) => { const buf = Buffer.from(dataUrl.split(",")[1], "base64"); fs.writeFileSync(file, buf); return buf.length; };
const sWebp = save(path.join(DBG, "portrait.webp"), out.webp);
const sPng = save(path.join(DBG, "portrait.png"), out.png);
const sDepth = save(path.join(DBG, "portrait-depth.png"), out.depth);
for (const [k, v] of Object.entries(out.dbg)) save(path.join(DBG, `dbg_${k}.png`), v);
if (process.argv.includes("--publish")) {
  fs.copyFileSync(path.join(DBG, "portrait.webp"), path.join(PUB, "portrait.webp"));
  fs.copyFileSync(path.join(DBG, "portrait-depth.png"), path.join(PUB, "portrait-depth.png"));
}
if (out.probe) console.log(out.probe.join(String.fromCharCode(10)));
console.log(JSON.stringify({ W: out.W, H: out.H, bbox: out.bbox, comps: out.comps, dropped: out.dropped, zmax: out.zmax, kb: { webp: sWebp >> 10, png: sPng >> 10, depth: sDepth >> 10 } }));
await browser.close();
