"use client";

/* One tiling noise layer over the entire page.

   The texture is an inline SVG feTurbulence rather than a PNG, it costs
   no request, scales to any DPR, and can be tuned by changing one number.
   Without it the large flat blacks band on cheap panels and the chrome
   gradients look like plastic. */
const noise = `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='180' height='180'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.82' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E")`;

export default function Grain() {
  return <div className="grain" aria-hidden style={{ ["--grain-src" as string]: noise }} />;
}
