"use client";

import Sheet from "./Sheet";
import Services, { SERVICES_HEADING_ID } from "./Services";
import { sheets } from "@/lib/content";

/* ============================================================
   SHEET 03: SERVICES, AT NIGHT
   The third sheet of the set, on the navy night ground. Top to bottom:
   the Howrah Bridge crossing (the taxi drives over as the sheet slides
   up over About), "What I can do" with the "Short on time?" board, the
   seven services hung on the route like stations on a line beside the
   plotter, and the rooftops seam the Work sheet is pasted up over.

   The route here is not one gutter rail: it comes down the gutter into
   the bridge, runs along the deck (where the deck taxi stands in for the
   route's small taxi), turns down the right side, comes back along the
   Strand bank and carries on down the gutter as the station line. Every piece of it lives in Services and
   BridgeBand, so this wrapper adds none. Styles: app/styles/
   s4-services.css, all scoped to .services.

   The veil is the dark wash this sheet takes on while Work is pasted up
   over it; Work's paste-up (S5) drives its opacity.
   ============================================================ */

const S = sheets[2];

export default function ServicesSheet() {
  return (
    <Sheet id={S.id} n={S.n} label={S.label} ground="night" className="services" labelledBy={SERVICES_HEADING_ID} veil>
      <Services />
    </Sheet>
  );
}
