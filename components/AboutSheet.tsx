"use client";

import Sheet from "./Sheet";
import { Rail } from "./Route";
import Intro, { ABOUT_HEADING_ID } from "./Intro";
import Marquee from "./Marquee";
import { sheets } from "@/lib/content";

/* ============================================================
   SHEET 02: ABOUT, ON BLUEPRINT
   The second sheet of the set, in blue. Top to bottom: "Intro" and the
   paragraph, with the ticket and, under it, the floppy in its detail
   circle beside them, then the tram band over the four stack rows. The
   route has no spur on this sheet: it runs straight down the gutter.

   The route runs the full height of the gutter; the route taxi drives it
   and the line fills behind the taxi (driveRoute, page.tsx). Its styles are app/styles/s3-about.css,
   all scoped to .about.

   This sheet's slide over the hero is what drives the hero's Exposure
   line (Hero, S1); nothing here needs to know about it.
   ============================================================ */

const S = sheets[1];

export default function AboutSheet() {
  return (
    <Sheet id={S.id} n={S.n} label={S.label} ground="blue" className="about" labelledBy={ABOUT_HEADING_ID}>
      <Rail style={{ top: 0, bottom: 0 }} />
      <Intro />
      <Marquee />
    </Sheet>
  );
}
