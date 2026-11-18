"use client";

/* One tiling noise layer over the entire page: the tooth of printed paper.

   The texture is an inline SVG rather than a PNG: it costs no request,
   scales to any DPR, and can be tuned by changing one number. The noise
   is recoloured to the deep display navy, with its alpha taken from the
   noise itself, so it lands as plain specks on every ground with no blend
   mode: navy specks read as paper tooth on the cream and the grid paper,
   and all but vanish into the blue and the night. The browser rasterises
   the tile once; nothing here is a live filter on the page. */
const noise = `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='180' height='180'%3E%3Cfilter id='n' x='0' y='0' width='100%25' height='100%25'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.82' numOctaves='3' stitchTiles='stitch'/%3E%3CfeColorMatrix values='0 0 0 0 0.075 0 0 0 0 0.102 0 0 0 0 0.29 2.4 0 0 0 -0.9'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E")`;

export default function Grain() {
  return <div className="grain" aria-hidden style={{ ["--grain-src" as string]: noise }} />;
}
