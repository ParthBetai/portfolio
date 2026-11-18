/* ============================================================
   BRIDGE ART
   The Howrah Bridge crossing at the head of Sheet 03, as static SVG
   markup strings. Pure data: nothing here touches React or the DOM, and
   it is computed once when the module loads, from a seeded random
   sequence, so the server and the browser build the same strings and
   hydration never disagrees.

   The band is split into separate boxes so a scrub only ever touches a
   box's opacity or transform (BridgeBand.tsx):
     SCENE  the static picture: the city blocks on the far bank, the
            river with its ripples, the masonry piers, the deck and its
            girder, the country boat, the unlit lamp heads
     TRUSS  the cantilever truss (with the far-side truss behind it),
            one <g> drawn by two svg roots, navy and cream
     LIT    the lit layer: lamps, their broken reflection streaks and the
            boat's lantern, revealed behind the taxi by a sliding mask
   All three share one viewBox, so their boxes line up at any width.
   About 400 nodes in all (the plan's budget for the band).
   ============================================================ */

import { C, f1, seededPM } from "./drawings/kit";

/* The drawing set's palette (kit.ts): these strings are SVG attributes,
   which cannot read CSS variables. */
const { ink: INK, nline: NLINE, taxi: TAXI, key: KEY } = C;

export const VIEWBOX = "-400 246 2240 554";
export const TRUSS_ID = "br-truss";

/* The deck's top edge, in viewBox units. The band's route deck sits at
   0.6625 of the band's height, which is this line once the slice crops
   the viewBox (s4-services.css .r-br-deck). */
export const D = 600;

/* The top chord: a cantilever arm rising to each tower, then the
   suspended span between the two, mirrored about x 720. */
export function topY(x: number) {
  const m = x > 720 ? 1440 - x : x;
  if (m <= 331) return 530 - ((m - 120) / 211) * 230;
  if (m <= 571) return 300 + ((m - 331) / 240) * 155;
  return 455 - 30 * Math.sin((Math.PI * (m - 571)) / 298);
}
/* The panel points along the truss, symmetric about the middle. */
export function panels() {
  const xs = new Set<number>();
  const add = (a: number, b: number, n: number) => {
    for (let i = 0; i <= n; i++) {
      const v = +(a + ((b - a) * i) / n).toFixed(2);
      xs.add(v);
      xs.add(+(1440 - v).toFixed(2));
    }
  };
  add(120, 331, 6);
  add(331, 571, 7);
  add(571, 720, 4);
  return [...xs].sort((a, b) => a - b);
}
/* Lamp posts every 88 units, except where a tower stands. */
const LAMPS: number[] = [];
for (let x = 60; x < 1440; x += 88) {
  if (Math.abs(x - 331) < 30 || Math.abs(x - 1109) < 30) continue;
  LAMPS.push(x);
}
const PIERS: [number, number][] = [
  [-400, 156],
  [279, 383],
  [1057, 1161],
  [1284, 1840],
];
const inPier = (cx: number) => PIERS.some(([a, b]) => cx > a - 6 && cx < b + 6);

/* A lamp's reflection: short broken streaks that spread as they go
   down, never one smooth gradient. */
function streaks(cx: number, col: string, op: number, seedv: number, n = 8) {
  /* seeded per piece, so each piece always comes out the same */
  const rnd = seededPM(seedv);
  let d = "";
  for (let i = 0; i < n; i++) {
    const y = D + 36 + i * 15 + rnd() * 6;
    const len = 4 + rnd() * 7;
    const x = cx + (rnd() - 0.5) * (6 + i * 2.2);
    d += `M${f1(x)} ${f1(y)} v${f1(len)} `;
  }
  return `<path d="${d}" stroke="${col}" stroke-opacity="${op}" stroke-width="2.6" stroke-linecap="round"/>`;
}

/* the country boat, mid river */
const BX = 760;
const BY = 688;
const BW = 150;

function scene() {
  let s = "";
  /* the city on the far bank, faint, with a few temple tops */
  const blocks: [number, number, number][] = [
    [380, 560, 60], [440, 548, 40], [480, 540, 90], [570, 520, 30], [600, 532, 120], [720, 516, 26],
    [746, 532, 120], [866, 520, 30], [896, 540, 90], [986, 548, 40], [1026, 560, 60],
  ];
  let b = "";
  for (const [x, y, w] of blocks) {
    b += `<rect x="${x}" y="${y}" width="${w}" height="${D - y}"/>`;
    if (w <= 30) b += `<path d="M${x - 3} ${y} L${x + w / 2} ${y - 22} L${x + w + 3} ${y} Z"/>`;
  }
  s += `<g fill="${INK}" opacity=".26">${b}</g>`;
  /* the river: a navy body below the deck in every sky */
  s += `<rect x="-400" y="${D + 20}" width="2240" height="${800 - D}" fill="#182052"/>`;
  const rnd = seededPM(9);
  let wv = "";
  for (let i = 0; i < 64; i++) {
    const x = -300 + rnd() * 2040;
    const y = D + 60 + rnd() * 130;
    const w = 16 + rnd() * 34;
    wv += `M${f1(x)} ${f1(y)} q${f1(w / 4)} -4 ${f1(w / 2)} 0 t${f1(w / 2)} 0 `;
  }
  s += `<path d="${wv}" fill="none" stroke="${NLINE}" stroke-opacity=".14" stroke-width="1.6" stroke-linecap="round"/>`;
  /* faint ripples under every lamp (the lit layer draws them yellow) */
  for (const x of LAMPS) if (!inPier(x + 9)) s += streaks(x + 9, NLINE, 0.2, x);
  /* piers as dark masonry with courses, joints and cutwaters */
  for (const [a, c] of PIERS) {
    const x0 = Math.max(a, -400);
    const x1 = Math.min(c, 1840);
    s += `<path d="M${x0} ${D + 26} H${x1} L${x1 + (c < 1840 ? 6 : 0)} 800 H${x0 - (a > -400 ? 6 : 0)} Z" fill="#11173f"/>`;
    let cr = "";
    for (let y = D + 40; y < 800; y += 16) cr += `M${x0} ${y} H${x1} `;
    let jn = "";
    for (let y = D + 26, k = 0; y < 800; y += 16, k++) for (let x = x0 + (k % 2 ? 14 : 0); x < x1; x += 28) jn += `M${x} ${y} v16 `;
    s += `<path d="${cr}" stroke="#2a3370" stroke-width="1.2"/><path d="${jn}" stroke="#2a3370" stroke-width="1" opacity=".7"/>`;
    s += `<path d="M${x0} ${D + 64} H${x1}" stroke="#56609a" stroke-opacity=".5" stroke-width="1.4"/>`;
  }
  /* the deck and its lower girder, riveted */
  s += `<rect x="-400" y="${D}" width="2240" height="26" fill="#1b2150"/><rect x="-400" y="${D + 26}" width="2240" height="12" fill="#10163c"/>`;
  let rv = "";
  for (let x = -396; x < 1840; x += 22) rv += `<circle cx="${x}" cy="${D + 32}" r="1.6"/>`;
  s += `<g fill="#3a4170">${rv}</g>`;
  /* the country boat, its lantern unlit here */
  s += `<g><path d="M${BX} ${BY} Q${BX + BW * 0.1} ${BY + 26} ${BX + BW * 0.32} ${BY + 30} H${BX + BW * 0.68} Q${BX + BW * 0.9} ${BY + 26} ${BX + BW} ${BY} Q${BX + BW / 2} ${BY + 12} ${BX} ${BY} Z" fill="#232a5c" stroke="${NLINE}" stroke-opacity=".8" stroke-width="1.8"/>`;
  s += `<path d="M${BX - 6} ${BY - 9} Q${BX} ${BY - 2} ${BX + 6} ${BY + 3} M${BX + BW + 6} ${BY - 9} Q${BX + BW} ${BY - 2} ${BX + BW - 6} ${BY + 3}" stroke="${NLINE}" stroke-opacity=".7" stroke-width="2" fill="none" stroke-linecap="round"/>`;
  s += `<path d="M${BX + BW * 0.3} ${BY + 8} V${BY - 8} Q${BX + BW * 0.5} ${BY - 38} ${BX + BW * 0.7} ${BY - 8} V${BY + 8} Z" fill="#1b2149" stroke="${NLINE}" stroke-opacity=".75" stroke-width="1.6"/>`;
  s += `<path d="M${BX + BW * 0.84} ${BY + 2} V${BY - 18}" stroke="${NLINE}" stroke-opacity=".75" stroke-width="1.4"/>`;
  s += `<rect x="${BX + BW * 0.84 - 5}" y="${BY - 30}" width="10" height="12" rx="2" fill="#3a4170" stroke="${KEY}" stroke-width="1.2"/></g>`;
  /* the lamp heads, unlit */
  s += `<g fill="#3a4170">${LAMPS.map((x) => `<circle cx="${x + 9}" cy="${D - 82}" r="5"/>`).join("")}</g>`;
  return s;
}

function truss() {
  const xs = panels();
  let t = "";
  /* the far-side truss, offset up and left and faint */
  const far = `M120 ${D}` + xs.map((x) => ` L${x} ${f1(topY(x))}`).join("") + ` L1320 ${D}`;
  t += `<g transform="translate(-14 -10)" opacity=".3"><path stroke-width="2" d="${far}"/><path stroke-width="1.1" d="${xs.map((x) => `M${x} ${D} V${f1(topY(x))}`).join(" ")}"/></g>`;
  /* deck rails and the railing posts */
  t += `<path stroke-width="2.4" d="M-400 ${D} H1840 M-400 ${D + 26} H1840"/><path stroke-width="1.2" d="M-400 ${D - 9} H1840"/>`;
  let posts = "";
  for (let x = -396; x < 1840; x += 12) posts += `M${x} ${D - 9} V${D} `;
  t += `<path stroke-width=".9" d="${posts}"/>`;
  /* the top chord */
  t += `<path stroke-width="3.6" stroke-linejoin="round" d="M120 ${D}${xs.map((x) => ` L${x} ${f1(topY(x))}`).join("")} L1320 ${D}"/>`;
  /* verticals and K bracing panel by panel */
  let br = "";
  for (let i = 0; i < xs.length - 1; i++) {
    const a = xs[i];
    const c = xs[i + 1];
    const ta = topY(a);
    const tc = topY(c);
    const mid = (a + c) / 2;
    const m = mid > 720 ? 1440 - mid : mid;
    br += `M${c} ${D} V${f1(tc)} `;
    if (m > 571) br += mid < 720 ? `M${a} ${f1(ta)} L${c} ${D} ` : `M${a} ${D} L${c} ${f1(tc)} `;
    else {
      const tt = mid < 331 || (mid > 720 && mid < 1109);
      if (tt) {
        const my = (tc + D) / 2;
        br += `M${c} ${f1(my)} L${a} ${f1(ta)} M${c} ${f1(my)} L${a} ${D} `;
      } else {
        const my = (ta + D) / 2;
        br += `M${a} ${f1(my)} L${c} ${f1(tc)} M${a} ${f1(my)} L${c} ${D} `;
      }
    }
  }
  t += `<path stroke-width="1.7" d="${br}"/>`;
  /* the two towers, cross braced, with their caps */
  for (const tx of [331, 1109]) {
    t += `<path stroke-width="3.4" d="M${tx - 15} ${D} L${tx - 12} 268 M${tx + 15} ${D} L${tx + 12} 268"/>`;
    let xb = "";
    for (let y = 280; y < D - 20; y += 40) xb += `M${tx - 13} ${y} L${tx + 13} ${y + 40} M${tx + 13} ${y} L${tx - 13} ${y + 40} `;
    t += `<path stroke-width="1.2" d="${xb}"/><rect x="${tx - 19}" y="256" width="38" height="13" rx="2" stroke-width="2.2"/>`;
  }
  /* the joints */
  t += `<g fill="currentColor" stroke="none">${xs.map((x) => `<circle cx="${x}" cy="${f1(topY(x))}" r="3"/><circle cx="${x}" cy="${D}" r="3"/>`).join("")}</g>`;
  /* the lamp posts with their swan necks */
  let posts2 = "";
  for (const x of LAMPS) posts2 += `M${x} ${D - 9} V${D - 76} q0 -6 7 -6 `;
  t += `<path stroke-width="1.6" d="${posts2}"/>`;
  return t;
}

function lit() {
  let l = "";
  for (const x of LAMPS) {
    l += `<circle cx="${x + 9}" cy="${D - 82}" r="11" fill="${TAXI}" opacity=".22"/><circle cx="${x + 9}" cy="${D - 82}" r="5" fill="${TAXI}"/>`;
    if (!inPier(x + 9)) l += streaks(x + 9, TAXI, 0.55, x);
  }
  l += `<rect x="${BX + BW * 0.84 - 5}" y="${BY - 30}" width="10" height="12" rx="2" fill="${TAXI}" stroke="${KEY}" stroke-width="1.2"/>`;
  l += `<path d="M${BX + BW * 0.84 - 2} ${BY + 42} v8 M${BX + BW * 0.84 + 3} ${BY + 58} v6 M${BX + BW * 0.84 - 1} ${BY + 72} v5" stroke="${TAXI}" stroke-opacity=".6" stroke-width="2.6" stroke-linecap="round"/>`;
  return l;
}

export const SCENE = scene();
export const TRUSS = truss();
export const LIT = lit();
