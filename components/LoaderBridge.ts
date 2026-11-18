/* ============================================================
   SPAN CLOSED: THE LOADER'S BRIDGE (Hero.tsx drives it)

   The Howrah Bridge is erected on the cream sheet as the progress:
   the towers rise out of their piers, the anchor arms and the
   cantilever arms go out panel by panel with two creeper cranes on
   the tips, and the suspended span closes at 100%. Rivets go in
   red-hot and cool to navy. Over it the name, pencilled in as its
   plan, is lowered letter by letter on cables onto that plan, in red
   primer, riveted and painted navy, its shade stepping in. At the
   close a brick "SPAN CLOSED" stamp lands, the barrier lifts, the
   small waiting taxi (the hero's own, scaled down) drives across and
   the view pushes in on it until it is the big hero taxi at rest.

   Pure DOM, built once from measured boxes (and again on a resize),
   then frame(t, p, o) is a function of the wall clock t (s), the
   progress p (0 to 1) and the time since the close o (s, negative
   before): it writes only transforms, opacities, dash offsets and a
   few SVG attributes, never reads layout. The geometry is the Services
   band's own (BridgeArt.ts), in its art units.
   ============================================================ */
import { D, panels, topY } from "./BridgeArt";
import { f1, seededPM } from "./drawings/kit";

const cl = (v: number, a = 0, b = 1) => Math.min(b, Math.max(a, v));
const lin = (t: number, a: number, b: number) => cl((t - a) / (b - a));
const o3 = (x: number) => 1 - Math.pow(1 - x, 3);
const io2 = (x: number) => (x < 0.5 ? 2 * x * x : 1 - Math.pow(-2 * x + 2, 2) / 2);
const io3 = (x: number) => (x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2);

/* The left half's panel points, 120 to 720 (18 of them). */
const HALF = panels().filter((x) => x <= 720);
/* When the close's own beats happen, in seconds after it (o). */
export const OUTRO = 2.3;

type Member = { el: SVGPathElement; s: number; e: number; f: number };
type Rivet = { el: SVGGElement; x: number; born: number; tb: number };
type Tip = { a: number; c: number; s: number; e: number };

export function createSpan(hero: HTMLElement, inkBack: HTMLElement, name: HTMLElement) {
  const $ = <T extends Element = HTMLElement>(s: string, r: ParentNode = hero) => r.querySelector<T>(s);
  const stage = $(".h-stage", inkBack)!;
  const car = $("[data-intro-car]")!;
  const drive = $(".h-drive", car)!;
  const taxi = $(".h-taxi", car)!;
  const kerbEl = $(":scope > .h-kerb", inkBack)!;

  /* ---- the name: a cable lowers each letter onto its plan ---- */
  /* The h1 keeps React's text, pencilled in by CSS as the plan (a
     hairline outline, its shade per line); the letters are an overlay
     inside it (its layer, its containing block), one per character on
     its measured origin. */
  const lines = Array.from(name.children) as HTMLElement[];
  const FALL = 0.34; // s from above the sheet down to the plan
  const LET = 0.06; // s after touching down the cable lets go
  type Letter = { el: HTMLElement; cab: HTMLElement; rv: HTMLElement[]; len: number; drop: number; thr: number; dir: number; at: number };
  let N: { ov: HTMLElement; em: number; L: Letter[]; ends: number[] } | null = null;
  /* Measured once (and again on a resize or once the fonts are in);
     each letter keeps its wall-clock birth across a rebuild. */
  const buildName = () => {
    const at = N?.L.map((l) => l.at) ?? [];
    N?.ov.remove();
    const nr = name.getBoundingClientRect();
    const cs = getComputedStyle(name);
    const em = parseFloat(cs.fontSize);
    const g = document.createElement("canvas").getContext("2d")!;
    g.font = `850 ${em}px ${cs.fontFamily}`;
    /* the cables hang from just above the sheet, in the h1's coordinates */
    const sheetY = nr.top - hero.getBoundingClientRect().top;
    const cabTop = -sheetY - 40;
    const ov = document.createElement("div");
    ov.className = "bb-name";
    ov.setAttribute("aria-hidden", "true");
    const rig = document.createElement("div");
    rig.className = "bb-rig";
    ov.append(rig);
    const raw: { ch: string; x: number; y: number; w: number; h: number; base: number; line: number }[] = [];
    lines.forEach((l, line) => {
      const tn = l.firstChild as Text;
      /* the baseline, from a zero box sat on it */
      const pr = document.createElement("span");
      pr.style.cssText = "display:inline-block;width:0;height:0";
      l.append(pr);
      const base = pr.getBoundingClientRect().top - nr.top;
      pr.remove();
      const r = document.createRange();
      for (let i = 0; i < tn.length; i++) {
        r.setStart(tn, i);
        r.setEnd(tn, i + 1);
        const b = r.getBoundingClientRect();
        raw.push({ ch: tn.data[i], x: b.left - nr.left, y: b.top - nr.top, w: b.width, h: b.height, base, line });
      }
    });
    const n = raw.length;
    const L = raw.map((c, i) => {
      /* the next letter's origin closes the advance (a line's last keeps its own width) */
      const nx = raw[i + 1];
      const adv = nx && nx.line === c.line ? nx.x - c.x : c.w;
      const ax = c.x + adv / 2;
      const ay = c.base - g.measureText(c.ch).actualBoundingBoxAscent - 0.03 * em; // the girder sits just over the ink
      const el = document.createElement("span");
      el.className = "bb-nl";
      el.textContent = c.ch;
      el.style.cssText = `left:${c.x.toFixed(2)}px;top:${c.y.toFixed(2)}px;line-height:${c.h}px;transform-origin:${f1(ax - c.x)}px ${f1(ay - c.y)}px;z-index:${c.line ? 1 : 2};visibility:hidden`; // line 2 is lowered behind line 1, never through it
      ov.append(el);
      const len = ay - cabTop;
      const cab = document.createElement("div");
      cab.className = "bb-cab";
      cab.style.cssText = `left:${f1(ax)}px;top:${f1(cabTop)}px;height:${f1(len)}px;visibility:hidden`;
      cab.innerHTML = `<i style="width:${f1(Math.max(0.5 * adv, 0.22 * em))}px"></i>`;
      rig.append(cab);
      /* two rivets under it: an ink dot, its red-hot face on top */
      const rv = [0.28, 0.72].map((f) => {
        const d = document.createElement("b");
        d.className = "bb-nr";
        d.style.cssText = `left:${f1(c.x + f * adv)}px;top:${f1(c.base + 0.035 * em)}px`;
        d.innerHTML = "<i></i>";
        rig.append(d);
        return d;
      });
      /* "P" comes in at once, the last at p .6, so even a fast load has the name down, navy and shaded as SPAN CLOSED lands */
      return { el, cab, rv, len, drop: sheetY + c.base + 0.15 * em + 40, thr: 0.02 + (0.58 * i) / (n - 1), dir: i % 2 ? -1 : 1, at: at[i] ?? -1 };
    });
    name.append(ov);
    N = { ov, em, L, ends: lines.map((_, li) => raw.reduce((k, c, i) => (c.line === li ? i : k), -1)) };
  };
  /* React's own markup again: the overlay goes and the plain text paints
     the same letters and shade. */
  const restore = () => {
    N?.ov.remove();
    N = null;
    for (const l of lines) delete l.dataset.sh;
  };
  /* The fonts swap in (display: swap): a first measure on the fallback
     face would misplace every letter. */
  if (document.fonts && document.fonts.status !== "loaded") void document.fonts.ready.then(() => N && buildName());

  let G: ReturnType<typeof build> | null = null;
  let clip: HTMLDivElement | null = null;

  function build() {
    clip?.remove();
    const hr = hero.getBoundingClientRect();
    const W = hero.clientWidth;
    const H = hero.clientHeight;
    const st = stage.getBoundingClientRect();
    const kerbY = kerbEl.getBoundingClientRect().top - hr.top + 0.8;
    const nameB = name.getBoundingClientRect().bottom - hr.top;
    const u = st.width / 980;
    /* The fit: up to 0.76 of the art scale, the towers clear of the name,
       and the whole bridge inside the sheet, from the left anchor pier
       (art 102) to the small taxi (T px, about 74 art units, never under
       24px) waiting past the barrier (art 1352). */
    const k = Math.min(0.76, (kerbY - nameB - 20) / 344, (W - 50) / 1324, (W - 74) / 1250);
    const T = Math.max(24, 74 * k);
    const cx = Math.min(Math.max(st.left - hr.left + 410 * u, 24 + 618 * k), W - 26 - T - 632 * k);
    /* the centre line runs up past the readout */
    const clTop = topY(720) - 52 - Math.max(138, 64 / k);
    /* Held upright (phone, tablet) the bridge would stand far under the
       name, so its deck is raised to under the name, the river fills
       below, and the push pans down to the kerb. */
    const deckY = Math.min(kerbY, nameB + 0.05 * H + (D - clTop) * k);
    const X = (a: number) => cx + (a - 720) * k;
    const Y = (b: number) => deckY + (b - D) * k;
    const px = (v: number) => f1(v / k); // a screen width in art units
    const yb = D + (H - deckY) / k + 8;
    const PH = { tow: [0.03, 0.24], anc: [0.24, 0.47], can: [0.47, 0.7], sus: [0.7, 1] };

    const members: { id: string; s: number; e: number }[] = [];
    const rivets: { id: string; x: number; born: number }[] = [];
    let main = "";
    let far = "";
    let riv = "";
    const mem = (d: string, w: number, s: number, e: number, layer = "main") => {
      const id = "bm" + members.length;
      const tag = `<path id="${id}" class="m" pathLength="1" stroke-width="${px(w)}" d="${d}" visibility="hidden"/>`;
      if (layer === "far") far += tag;
      else main += tag;
      members.push({ id, s, e });
    };
    const rivet = (x: number, y: number, born: number) => {
      const id = "br" + rivets.length;
      riv += `<g id="${id}" transform="translate(${f1(x)} ${f1(y)})" visibility="hidden"><circle class="rv" r="0"/><circle class="rh" r="0"/></g>`;
      rivets.push({ id, x, born });
    };

    /* the river, the two earth-hatched banks, four piers, a country boat */
    let scene = "";
    const bankTop = D + 40;
    const water = D + 48;
    /* a deep river (a raised deck) gets a bed, the earth hatched below it */
    const bed = yb - water > 400 ? water + 0.6 * (yb - water) : yb;
    const hatch = `<pattern id="bbHatch" width="${px(7)}" height="${px(7)}" patternUnits="userSpaceOnUse" patternTransform="rotate(45)"><path d="M0 0 V${px(7)}" stroke="var(--color-ink)" stroke-width="${px(1)}" stroke-opacity=".42"/></pattern>`;
    const bank = (s: number) => {
      const m = (x: number) => (s < 0 ? x : 1440 - x);
      const edge = `M${m(-4000)} ${bankTop} L${m(214)} ${bankTop} C${m(236)} ${bankTop} ${m(246)} ${water + 4} ${m(262)} ${bed}`;
      return `<path d="${edge} L${m(-4000)} ${bed} Z" fill="url(#bbHatch)"/><path d="${edge}" fill="none" stroke="var(--color-ink)" stroke-width="${px(1.3)}"/>`;
    };
    const rnd = seededPM(11);
    let waves = "";
    for (let i = 0; i < 12; i++) {
      const y = water + 6 + ((bed - water - 18) * (i + rnd() * 0.6)) / 12;
      const x = 280 + rnd() * 760;
      const w = 50 + rnd() * 90;
      waves += `<path class="wv" data-ph="${f1(rnd() * 6)}" d="M${f1(x)} ${f1(y)} q${f1(w / 4)} -${px(2.2)} ${f1(w / 2)} 0 t${f1(w / 2)} 0" fill="none" stroke="var(--color-ink)" stroke-opacity=".38" stroke-width="${px(1.1)}" stroke-linecap="round"/>`;
    }
    scene += `<path d="M262 ${water} H1178" stroke="var(--color-ink)" stroke-opacity=".55" stroke-width="${px(1)}"/>` + waves;
    scene += bank(-1) + bank(1);
    if (bed < yb) scene += `<path d="M-4000 ${f1(bed)} H5440 V${f1(yb)} H-4000 Z" fill="url(#bbHatch)"/><path d="M262 ${f1(bed)} H1178" stroke="var(--color-ink)" stroke-width="${px(1.3)}"/>`;
    const pier = (x0: number, x1: number, y0: number, y1: number, cut: boolean) => {
      let s = `<path d="M${x0} ${y0} H${x1} V${y1} H${x0} Z" fill="var(--color-cream)" stroke="var(--color-ink)" stroke-width="${px(1.4)}"/>`;
      let c = "";
      for (let y = y0 + 16; y < y1 - 4; y += Math.max(16, 11 / k)) c += `M${x0} ${f1(y)} H${x1} `;
      if (c) s += `<path d="${c}" stroke="var(--color-ink)" stroke-opacity=".35" stroke-width="${px(0.8)}"/>`;
      if (cut) s += `<path d="M${x0 - 8} ${water} H${x1 + 8}" stroke="var(--color-ink)" stroke-width="${px(1.4)}"/>`;
      return s;
    };
    for (const tx of [331, 1109]) scene += pier(tx - 36, tx + 36, D + 22, bed, true);
    for (const ax of [120, 1320]) scene += pier(ax - 18, ax + 18, D + 22, bankTop + 8, false);
    /* the country boat, drifting */
    const BW = Math.max(92, 30 / k);
    /* a deep river (a raised deck) carries the boat and its name lower */
    const drop = Math.max(0, bed - water - 300) * 0.25;
    scene +=
      `<g id="bbBoat"><path d="M0 0 Q${BW * 0.1} ${BW * 0.17} ${BW * 0.32} ${BW * 0.2} H${BW * 0.68} Q${BW * 0.9} ${BW * 0.17} ${BW} 0 Q${BW / 2} ${BW * 0.08} 0 0 Z" fill="var(--color-cream)" stroke="var(--color-ink)" stroke-width="${px(1.3)}" stroke-linejoin="round"/>` +
      `<path d="M${BW * 0.3} ${BW * 0.05} V-${BW * 0.05} Q${BW * 0.5} -${BW * 0.25} ${BW * 0.7} -${BW * 0.05} V${BW * 0.05}" fill="var(--color-cream-2)" stroke="var(--color-ink)" stroke-width="${px(1.2)}"/>` +
      `<path d="M${BW * 0.84} 0 V-${BW * 0.22} M-${BW * 0.05} -${BW * 0.07} Q0 -${BW * 0.01} ${BW * 0.05} ${BW * 0.02}" fill="none" stroke="var(--color-ink)" stroke-width="${px(1.2)}" stroke-linecap="round"/></g>`;
    scene += `<text class="hand" x="410" y="${f1(Math.min(bed - 30, Math.max(water + 98, D + 78 + 0.3 * BW + 26 / k) + drop))}" font-size="${px(19)}" letter-spacing="${px(0.6)}">Hooghly</text>`;

    /* the plan: a dashed pencil outline of the whole bridge, and the
       brick centre line where the halves will meet */
    const chord =
      `M120 ${D} V530 ` +
      [...HALF.slice(1), ...HALF.slice(0, -1).reverse().map((x) => 1440 - x)].map((x) => `L${x} ${f1(topY(x))}`).join(" ") +
      ` V${D}`;
    let ghost = chord + ` M120 ${D + 20} H1320`;
    for (const tx of [331, 1109])
      ghost += ` M${tx - 15} ${D} L${tx - 12} 268 M${tx + 15} ${D} L${tx + 12} 268 M${tx - 19} 256 H${tx + 19} V269 H${tx - 19} Z`;
    const ghostG =
      `<clipPath id="bbWipe"><rect id="bbWipeR" x="-4000" y="-4000" width="0" height="9000"/></clipPath><g clip-path="url(#bbWipe)"><path class="ghost" d="${ghost}" stroke-width="${px(1)}" stroke-dasharray="${px(5)} ${px(4)}"/>` +
      `<path class="cl" d="M720 ${f1(clTop)} V${D + 58}" stroke-width="${px(1.2)}" stroke-dasharray="${px(14)} ${px(4)} ${px(2)} ${px(4)}"/></g>`;

    /* the towers rise out of their piers */
    for (const tx of [331, 1109]) {
      const [p0, p1] = PH.tow;
      const sp = p1 - p0;
      mem(`M${tx - 15} ${D} L${tx - 12} 268`, 2.6, p0, p0 + 0.5 * sp);
      mem(`M${tx + 15} ${D} L${tx + 12} 268`, 2.6, p0 + 0.04 * sp, p0 + 0.54 * sp);
      for (let i = 0, y = 560; y >= 280; y -= 40, i++) {
        const s = p0 + (0.14 + (0.62 * i) / 8) * sp;
        mem(`M${tx - 13.5} ${y + 40} L${tx + 13.5} ${y} M${tx + 13.5} ${y + 40} L${tx - 13.5} ${y}`, 1, s, s + 0.16 * sp);
      }
      mem(`M${tx - 19} 269 V256 H${tx + 19} V269 Z`, 1.6, p0 + 0.86 * sp, p1);
      for (const x of [tx - 12, tx + 12]) rivet(x, 268, p1);
      for (const x of [tx - 15, tx + 15]) rivet(x, D, p0 + 0.5 * sp);
    }

    /* panel by panel: girder, handrail, vertical, top chord, bracing */
    const sched = (n: number, [p0, p1]: number[]) => {
      const L = (1.5 * (p1 - p0)) / n;
      return (j: number) => {
        const s = n > 1 ? p0 + ((p1 - p0 - L) * j) / (n - 1) : p0;
        return (a: number, b: number): [number, number] => [s + a * L, s + b * L];
      };
    };
    const segs = (from: number, to: number) => HALF.slice(from, to + 1).slice(0, -1).map((x, i) => [x, HALF[from + i + 1]]);
    const phases: [number[][], number[]][] = [
      [segs(0, 6), PH.anc],
      [segs(6, 13), PH.can],
      [segs(13, 17), PH.sus],
    ];
    const tips: { L: Tip[]; R: Tip[] } = { L: [], R: [] }; // top chord members that carry the tip
    for (const side of [1, -1]) {
      const m = (x: number) => (side > 0 ? x : 1440 - x);
      const mx = (d: string) => (side > 0 ? d : d.replace(/(M|L|H)(-?[\d.]+)/g, (_q, c, v) => c + f1(1440 - +v)));
      for (const [list, ph] of phases) {
        const at = sched(list.length, ph);
        list.forEach(([a, c], j) => {
          const w = at(j);
          const ta = topY(a);
          const tc = topY(c);
          if (a === 120) {
            const [s, e] = w(0, 0.3);
            mem(mx(`M120 ${D} V530`), 2.4, s, e);
            rivet(m(120), D, e);
            rivet(m(120), 530, e);
          }
          mem(mx(`M${a} ${D + 20} L${c} ${D + 20}`), 2, ...w(0, 0.45));
          mem(mx(`M${a} ${D - 9} L${c} ${D - 9}`), 0.9, ...w(0.1, 0.5));
          mem(mx(`M${c} ${D} L${c} ${f1(tc)}`), 1.4, ...w(0.3, 0.7));
          const [ts, te] = w(0.45, 0.85);
          mem(mx(`M${a} ${f1(ta)} L${c} ${f1(tc)}`), 2.6, ts, te);
          tips[side > 0 ? "L" : "R"].push({ a: m(a), c: m(c), s: ts, e: te });
          const midx = (a + c) / 2;
          let br;
          if (midx > 571) br = `M${a} ${f1(ta)} L${c} ${D}`;
          else if (midx < 331) {
            const my = (tc + D) / 2;
            br = `M${c} ${f1(my)} L${a} ${f1(ta)} M${c} ${f1(my)} L${a} ${D}`;
          } else {
            const my = (ta + D) / 2;
            br = `M${a} ${f1(my)} L${c} ${f1(tc)} M${a} ${f1(my)} L${c} ${D}`;
          }
          mem(mx(br), 1.05, ...w(0.6, 1));
          /* the far-side truss, faint, alongside */
          mem(mx(`M${a - 14} ${f1(ta - 10)} L${c - 14} ${f1(tc - 10)} M${c - 14} ${D - 10} L${c - 14} ${f1(tc - 10)}`), 1.1, ...w(0.45, 1), "far");
          rivet(m(c), D, te);
          rivet(m(c), tc, te);
        });
      }
    }

    /* two creeper cranes on the cantilever tips, a red girder on each hook */
    const crane = (s: number, id: string) =>
      `<g id="${id}" opacity="0"><g transform="scale(${s} 1)">` +
      `<path d="M-8 0 H8 M0 0 V-38 L48 -31 M0 -38 L-16 0 M0 -24 L22 -33" fill="none" stroke="var(--color-ink)" stroke-width="${px(1.4)}" stroke-linecap="round" stroke-linejoin="round"/>` +
      `<g class="hook"><path d="M46 -31 V-6" stroke="var(--color-ink)" stroke-width="${px(0.9)}"/><path d="M33 -4 H59" stroke="var(--color-stamp)" stroke-width="${px(3.2)}" stroke-linecap="square"/><path d="M41 -6 L46 -10 L51 -6" fill="none" stroke="var(--color-ink)" stroke-width="${px(0.8)}"/></g>` +
      `</g></g>`;
    /* the gap, dimensioned, shrinking */
    const dimY = +f1(topY(720) - 52);
    const dimG = `<g id="bbDim" opacity="0"><path id="bbDimL" d="" fill="none" stroke="var(--color-ink)" stroke-width="${px(1)}"/><path id="bbDimA" d="" fill="none" stroke="var(--color-ink)" stroke-width="${px(1)}" stroke-linejoin="round"/></g>`;
    /* the striped barrier on the Kolkata bank */
    const bx = 1352;
    const barrier =
      `<g transform="translate(${bx} ${D})"><path d="M0 0 V-34 M-5 0 H5" stroke="var(--color-ink)" stroke-width="${px(1.6)}" fill="none"/>` +
      `<g id="bbArm"><path d="M0 -28 H-58" stroke="var(--color-ink)" stroke-width="${px(5.4)}" stroke-linecap="round"/><path d="M-2 -28 H-56" stroke="var(--color-cream)" stroke-width="${px(3.2)}"/><path d="M-2 -28 H-56" stroke="var(--color-stamp)" stroke-width="${px(3.2)}" stroke-dasharray="${px(5)} ${px(5)}"/></g>` +
      `<circle cy="-28" r="${px(2.6)}" fill="var(--color-ink)"/></g>`;

    const tr = `translate(${f1(cx - 720 * k)} ${f1(deckY - D * k)}) scale(${k.toFixed(5)})`;
    /* the readout and the stamp shrink with a small bridge */
    const ts = cl(k / 0.73, 0.7, 1);
    const svg = (inner: string) =>
      `<svg width="${W}" height="${H}" viewBox="0 0 ${W} ${H}" aria-hidden="true" focusable="false"><g transform="${tr}">${inner}</g></svg>`;
    const c = document.createElement("div");
    c.className = "bb-clip";
    c.setAttribute("aria-hidden", "true");
    c.innerHTML =
      `<div class="bb-far" style="opacity:.32">${svg(far)}</div>` +
      `<div class="bb">${svg(`<defs>${hatch}</defs>${scene}${ghostG}${main}${barrier}${riv}${dimG}${crane(1, "bbCrL")}${crane(-1, "bbCrR")}`)}` +
      `<div class="bb-read" style="left:${f1(cx)}px;top:${f1(Y(dimY) - 14)}px;font-size:${f1(16 * ts)}px"><span>Loading</span><b>000</b></div>` +
      `<div class="bb-stamp" style="left:${f1(cx)}px;top:${f1(Y(dimY) - 8)}px">SPAN CLOSED</div></div>`;
    inkBack.append(c);
    clip = c;
    const q = <T extends Element>(s: string) => c.querySelector<T>(s)!;

    /* The push: one pivot, the taxi's nose on the kerb, measured with
       the car at rest, so the push lands exactly on the hero taxi. */
    car.style.transform = "";
    const tx = taxi.getBoundingClientRect();
    const P = { x: tx.left - hr.left + tx.width * (0.25 / 49), y: kerbY };
    const s0 = T / tx.width;
    car.style.transformOrigin = `${f1(P.x - (st.left - hr.left))}px ${f1(P.y - (st.top - hr.top))}px`;
    return {
      W,
      k,
      P,
      T,
      ts,
      deck: deckY,
      drop,
      s0,
      Zend: 1 / s0,
      stopX: X(bx) + 6, // the nose waits at the barrier
      bb: q<HTMLElement>(".bb"),
      far: q<HTMLElement>(".bb-far"),
      members: members.map((m) => ({ ...m, el: c.querySelector<SVGPathElement>("#" + m.id)!, f: -1 }) as Member),
      rivets: rivets.map((r) => ({ ...r, el: c.querySelector<SVGGElement>("#" + r.id)!, tb: -1 }) as Rivet),
      waves: Array.from(c.querySelectorAll<SVGPathElement>(".wv")),
      boat: q<SVGGElement>("#bbBoat"),
      wipe: q<SVGRectElement>("#bbWipeR"),
      read: q<HTMLElement>(".bb-read"),
      num: q<HTMLElement>(".bb-read b"),
      stamp: q<HTMLElement>(".bb-stamp"),
      dim: q<SVGGElement>("#bbDim"),
      dimL: q<SVGPathElement>("#bbDimL"),
      dimA: q<SVGPathElement>("#bbDimA"),
      dimY,
      cranes: [
        ["L", q<SVGGElement>("#bbCrL")],
        ["R", q<SVGGElement>("#bbCrR")],
      ] as const,
      tips,
      arm: q<SVGGElement>("#bbArm"),
    };
  }

  const set = (el: HTMLElement | SVGElement, prop: string, v: string) => {
    const s = el.style as unknown as Record<string, string>;
    if (s[prop] !== v) s[prop] = v;
  };
  /* An SVG attribute write invalidates style even when the value is the
     same: a cooled rivet would cost a recalc every frame for nothing. */
  const attr = (el: Element, a: string, v: string) => {
    if (el.getAttribute(a) !== v) el.setAttribute(a, v);
  };
  /* Rivets born before a rebuild keep their wall-clock birth. */
  let births: (number | undefined)[] = [];

  /* One frame. t: wall seconds since the loader began; p: progress;
     o: seconds since the close (negative before). */
  function frame(t: number, p: number, o: number) {
    /* the name */
    if (o < 0.42) {
      if (!N) buildName();
      const { L, em } = N!;
      for (const F of L) {
        if (F.at < 0 && p >= F.thr) F.at = t;
        if (F.at < 0) continue;
        const a = t - F.at;
        const r = a - FALL; // since it touched down
        /* down on the cable, braking into the plan, a touch of give on landing */
        const give = r > 0 ? 0.018 * em * Math.exp(-22 * r) * Math.sin(40 * r) : 0;
        const dy = -F.drop * (1 - o3(lin(a, 0, FALL))) + give;
        /* the swing, picked up on the way down and gone by .56 s */
        const dx = F.dir * 0.05 * em * Math.sin(13 * a) * Math.pow(1 - lin(a, 0.05, 0.56), 2) * lin(a, 0, 0.12);
        set(F.el, "visibility", "visible");
        /* red-oxide primer on the way down and while the rivets are hot, then painted navy in .1 s (oklab, so no plum on the way) */
        set(F.el, "color", r > 0.22 ? "" : `color-mix(in oklab, var(--color-ink-deep) ${f1(100 * lin(r, 0.12, 0.22))}%, var(--color-stamp))`);
        set(F.el, "transform", a > 0.6 ? "" : `translate(${dx.toFixed(2)}px, ${dy.toFixed(2)}px) rotate(${((-dx / em) * 26).toFixed(2)}deg)`);
        /* the cable follows, then lets go and runs back up */
        const gone = r > LET + 0.22;
        set(F.cab, "visibility", gone ? "hidden" : "visible");
        if (!gone) {
          const up = Math.pow(lin(r, LET, LET + 0.22), 2) * (F.len + 40);
          set(F.cab, "transform", `translate(${dx.toFixed(2)}px, ${(dy - up).toFixed(2)}px) rotate(${((-Math.atan2(dx, F.len) * 180) / Math.PI).toFixed(3)}deg)`);
        }
        /* the rivets go in red-hot as it lands, cool, then go */
        const op = r < 0 ? "0" : (1 - lin(r, 0.2, 0.3)).toFixed(2);
        for (const d of F.rv) {
          set(d, "opacity", op);
          if (op === "0") continue;
          set(d.firstChild as HTMLElement, "opacity", (1 - lin(r, 0, 0.2)).toFixed(2));
          set(d, "transform", `scale(${(r < 0.05 ? 0.5 + r / 0.05 : 1.5 - 0.5 * lin(r, 0.05, 0.2)).toFixed(3)})`);
        }
      }
      /* Each line's shade steps in once its last letter has landed: none,
         then a layer per step up to the hero's own (data-sh 9, s1-hero.css). */
      N!.ends.forEach((i, li) => {
        const at = L[i].at;
        const sh = String(at < 0 ? 0 : Math.min(9, Math.floor(lin(t - at - FALL, 0, 0.24) * 10)));
        if (lines[li].dataset.sh !== sh) lines[li].dataset.sh = sh;
      });
    } else if (N) restore();

    const g = G!;
    /* the push: everything scales about the taxi's nose on the deck,
       and pans down to the kerb when the deck was raised */
    const e = io2(lin(o, 0.36, 1.16));
    const Z = Math.pow(g.Zend, e);
    const dy = (g.P.y - g.deck) * e;
    const fadeB = 1 - lin(Math.log(Z), Math.log(2.2), Math.log(5.5));
    set(clip!, "display", fadeB <= 0 ? "none" : "");
    /* a raised deck would leave the kerb crossing the river: it waits for the push */
    if (g.deck < g.P.y - 1) set(kerbEl, "opacity", String(Math.round((1 - fadeB) * 100) / 100));
    if (fadeB > 0) {
      const zt = (z: number) =>
        `translate(${f1(g.P.x)}px, ${f1(g.deck + dy)}px) scale(${z.toFixed(4)}) translate(${f1(-g.P.x)}px, ${f1(-g.deck)}px)`;
      set(g.bb, "transform", Z > 1.0001 ? zt(Z) : "");
      set(g.far, "transform", Z > 1.0001 ? zt(Math.pow(Z, 0.86)) : "");
      set(g.bb, "opacity", fadeB < 1 ? String(Math.round(fadeB * 100) / 100) : "");
      set(g.far, "opacity", String(Math.round(32 * fadeB) / 100));
      attr(g.wipe, "width", f1(4000 + 120 + 1400 * o3(lin(t, 0, 0.5))));
      for (const m of g.members) {
        const f = lin(p, m.s, m.e);
        if (f === m.f) continue;
        m.f = f;
        attr(m.el, "visibility", f <= 0 ? "hidden" : "visible");
        m.el.style.strokeDashoffset = (1 - f).toFixed(4);
      }
      g.rivets.forEach((r, i) => {
        if (r.tb < 0 && p >= r.born) r.tb = births[i] ??= t;
        const a = t - r.tb;
        if (r.tb < 0) return attr(r.el, "visibility", "hidden");
        attr(r.el, "visibility", "visible");
        const base = 2.3 / g.k;
        const sw = a < 0.12 ? 0.4 + (1.3 * a) / 0.12 : 1.7 - 0.7 * lin(a, 0.12, 0.4);
        let heat = 1 - lin(a, 0, 0.4);
        /* at the close the heat runs out from the middle once more */
        const a2 = o - (Math.abs(r.x - 720) / 600) * 0.55;
        let swell = sw;
        if (a2 > 0) {
          const h2 = a2 < 0.08 ? a2 / 0.08 : 1 - lin(a2, 0.08, 0.42);
          heat = Math.max(heat, h2);
          swell = Math.max(sw, 1 + 0.45 * h2);
        }
        const [c1, c2] = r.el.children;
        const rr = f1(base * swell);
        attr(c1, "r", rr);
        attr(c2, "r", rr);
        attr(c2, "opacity", heat.toFixed(2));
      });
      /* the river keeps drifting, the boat with it */
      g.waves.forEach((w) => attr(w, "transform", `translate(${f1(9 * Math.sin(t * 1.3 + +(w.dataset.ph ?? 0)))} 0)`));
      attr(g.boat, "transform", `translate(${f1(600 + 22 * t)} ${f1(D + 78 + g.drop)}) rotate(${f1(1.6 * Math.sin(t * 2.1))})`);
      /* the readout, on the centre line */
      const rv = 1 - lin(o, 0, 0.06);
      set(g.read, "opacity", String(rv * lin(t, 0.18, 0.4)));
      const pc = String(Math.round(p * 100)).padStart(3, "0");
      if (g.num.textContent !== pc) g.num.textContent = pc; // a text write lays the page out again
      /* the cranes ride the tips and lift off at the close */
      const tipOf = (list: Tip[]) => {
        let x: number | null = null;
        for (const s of list) {
          if (s.s < 0.465) continue;
          const f = lin(p, s.s, s.e);
          if (f > 0) x = s.a + (s.c - s.a) * f;
        }
        return x;
      };
      const tl = tipOf(g.tips.L);
      const trr = tipOf(g.tips.R);
      for (const [side, el] of g.cranes) {
        const x = side === "L" ? tl : trr;
        if (x == null) {
          attr(el, "opacity", "0");
          continue;
        }
        const lift = o3(lin(o, 0, 0.45));
        attr(el, "opacity", (lin(p, 0.47, 0.52) * (1 - lin(o, 0, 0.07))).toFixed(3)); // gone before the stamp lands
        attr(el, "transform", `translate(${f1(x)} ${f1(topY(x) - 70 * lift)})`);
        const sway = 7 * Math.sin(t * 3.1 + (side === "L" ? 0 : 1.7)) * (1 - 0.6 * lin(p, 0.95, 1));
        attr(el.querySelector(".hook")!, "transform", `rotate(${f1(sway)} 46 -31)`);
      }
      /* the gap dimension */
      if (tl != null && trr != null && trr - tl > 6) {
        const y = g.dimY;
        const a = tl + 4;
        const b = trr - 4;
        const ah = 7;
        attr(g.dimL, "d", `M${f1(a)} ${f1(y - 8)} V${f1(y + 8)} M${f1(b)} ${f1(y - 8)} V${f1(y + 8)} M${f1(a)} ${f1(y)} H${f1(b)}`);
        attr(
          g.dimA,
          "d",
          `M${f1(a + ah * 1.6)} ${f1(y - ah * 0.55)} L${f1(a)} ${f1(y)} L${f1(a + ah * 1.6)} ${f1(y + ah * 0.55)} M${f1(b - ah * 1.6)} ${f1(y - ah * 0.55)} L${f1(b)} ${f1(y)} L${f1(b - ah * 1.6)} ${f1(y + ah * 0.55)}`
        );
        attr(g.dim, "opacity", (lin(p, 0.47, 0.5) * rv).toFixed(3));
      } else attr(g.dim, "opacity", "0");
      /* the stamp lands */
      const sp = lin(o, 0.06, 0.22);
      set(g.stamp, "opacity", sp > 0 ? String(Math.min(1, sp * 2.2)) : "0");
      set(g.stamp, "transform", `translate(-50%, -50%) rotate(-7deg) scale(${((1.6 - 0.6 * o3(sp)) * g.ts).toFixed(3)})`);
      /* the barrier lifts */
      attr(g.arm, "transform", `rotate(${f1(84 * o3(lin(o, 0.02, 0.32)))} 0 -28)`);
    }

    /* The taxi: the hero's own, small at the barrier, then the push. */
    const inX = g.W + g.T + 26;
    const xb =
      o < 0
        ? g.stopX + (inX - g.stopX) * (1 - o3(lin(t, 0.1, 0.85)))
        : g.stopX + (g.P.x - g.stopX) * io3(lin(o, 0.14, 0.82));
    const s = Z * g.s0;
    const cy = g.deck + dy - g.P.y;
    if (o >= OUTRO || (Math.abs(s - 1) < 1e-4 && Math.abs(xb - g.P.x) < 0.01 && Math.abs(cy) < 0.01)) set(car, "transform", "");
    else set(car, "transform", `translate(${f1(Z * (xb - g.P.x))}px, ${f1(cy)}px) scale(${s.toFixed(5)})`);
  }

  /* Rasterised at full size only once it rests: a layer painted small
     would be blurred by the push. */
  drive.style.willChange = "auto";
  G = build();
  return {
    frame,
    /* the kerb line on screen, for the portrait's rise: read live, since the
       page can still be scrolled at build time (Back restoring a position) */
    kerb: () => kerbEl.getBoundingClientRect().top,
    rebuild: () => {
      births = G!.rivets.map((r) => (r.tb < 0 ? undefined : r.tb));
      G = build();
      if (N) buildName();
    },
    remove: () => {
      clip?.remove();
      restore();
      car.style.transform = "";
      car.style.transformOrigin = "";
      kerbEl.style.opacity = "";
      drive.style.willChange = "";
    },
  };
}
