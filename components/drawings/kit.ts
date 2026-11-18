import { createElement as h } from "react";

/* ============================================================
   DRAWING KIT (Sheet 04 Work)
   The shared parts of the four project drawings and the stamps: the
   inks, the numbered balloon, the leader line and a few pieces of
   geometry.

   The drawings are printed on the plate's fixed off-white, never on a
   ground that changes, so their inks are plain hex values (an SVG
   presentation attribute cannot read a CSS variable everywhere). They
   match the tokens in app/globals.css.

   Every word in a drawing is HTML beside it (the legend, the red note,
   the payload card): the SVG carries only balloon numerals, the
   stamps' lettering and the SOS on the phone, and is aria-hidden. The balloons grow on phones
   (r 27, numerals 30 units, see s5-work.css) so their numerals still
   render at 14px or more.
   ============================================================ */
export const C = {
  ink: "#1d2a6e",
  paper: "#e7eee0",
  fill: "#eef2e8",
  taxi: "#f6c400",
  brick: "#b42f1f",
  chrome: "#c9c9cf",
  tyre: "#14161b",
  glass: "#cdd9ee",
  /* the print keyline shared by every painted piece (navy-deep) */
  key: "#0e1332",
  /* cream line work on navy (the bridge band, the night street) */
  nline: "#efe7d6",
  /* the night street's cast iron and its lit edges */
  iron: "#2a3166",
  iron2: "#3a4480",
  /* the tram band's poles and its pale blue line */
  pole: "#0f2459",
  bline: "#e2ebff",
};

/** A number to one decimal place, so server and client print the same path. */
export const f1 = (n: number) => n.toFixed(1);

/** A numbered balloon: the ring and its numeral (the legend's number). */
export function Bal({ n, x, y }: { n: number; x: number; y: number }) {
  return h(
    "g",
    { className: "bal" },
    h("circle", { cx: x, cy: y, r: 15, fill: C.paper, stroke: C.ink, strokeWidth: 1.6 }),
    h("text", { x, y, dy: ".36em", textAnchor: "middle", fontWeight: 700, fontSize: 17, fill: C.ink }, n)
  );
}

/** A leader from a part to its balloon: a thin line with a dot on the part.
    data-lead marks it for the one-time draw-on. */
export function Lead({ x1, y1, x2, y2 }: { x1: number; y1: number; x2: number; y2: number }) {
  return h(
    "g",
    null,
    h("path", { d: `M${x1} ${y1} L${x2} ${y2}`, stroke: C.ink, strokeWidth: 1.1, fill: "none", "data-lead": "" }),
    h("circle", { cx: x1, cy: y1, r: 3, fill: C.ink })
  );
}

/* A small seeded generator (Park and Miller), so every random-looking
   detail (the deckle's tears, a stamp's worn spots) is the same on every
   render, on the server and in the browser. */
export function seeded(seed: number) {
  let s = seed;
  return () => (s = (s * 16807) % 2147483647) / 2147483647;
}

/* The same sequence scaled the other way, (s - 1) / (M - 1): the bridge's
   ripples and lamp streaks were drawn with it, so it stays its own. */
export function seededPM(seed: number) {
  let s = seed;
  return () => ((s = (s * 16807) % 2147483647) - 1) / 2147483646;
}

/* The torn top edge of the Work sheet: a 1440 x 30 strip, torn every 5
   to 18 units with the odd deeper bite, filled in the paper colour. */
export const DECKLE = (() => {
  const r = seeded(13 * 7919 + 13);
  let d = "M0 30 L0 14";
  let x = 0;
  while (x < 1440) {
    x += 5 + r() * 13;
    d += ` L${f1(x)} ${f1(5 + r() * 9 + (r() < 0.08 ? 6 : 0))}`;
  }
  return d + " L1440 30 Z";
})();

/** A five-pointed star centred on cx, cy (the EV stamp's centre). */
export function starPath(cx: number, cy: number, R: number) {
  let d = "";
  for (let i = 0; i < 10; i++) {
    const a = -Math.PI / 2 + (i * Math.PI) / 5;
    const rr = i % 2 ? R * 0.45 : R;
    d += (i ? "L" : "M") + f1(cx + Math.cos(a) * rr) + " " + f1(cy + Math.sin(a) * rr);
  }
  return d + "Z";
}
