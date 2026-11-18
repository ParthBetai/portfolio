import Sheet from "./Sheet";
import Ventures from "./Ventures";
import { Rail } from "./Route";
import { sheets } from "@/lib/content";

/* ============================================================
   SHEET 05: JOURNEY
   Blueprint blue, sliding over Work with the cream copy line as its
   leading edge (Ventures draws it). The gutter rail runs its full
   height; Ventures draws the heading, the ghat, the railway timeline and
   the two venture cards.
   ============================================================ */
const S = sheets[4];

export default function JourneySheet() {
  return (
    <Sheet id={S.id} n={S.n} label={S.label} ground="blue" className="journey" labelledBy="h-journey">
      <Rail style={{ top: 0, bottom: 0 }} />
      <Ventures />
    </Sheet>
  );
}
