import Sheet from "./Sheet";
import Work from "./Work";
import { Rail } from "./Route";
import { sheets } from "@/lib/content";

/* ============================================================
   SHEET 04: WORK
   The grid-paper sheet, pasted up over Services (ground "paper"). The
   gutter rail runs its full height; Work draws everything else (the
   deckle edge, the paste-up riding it, the heading, the index and the
   four projects with their spurs off this rail).
   ============================================================ */
const S = sheets[3];

export default function WorkSheet() {
  return (
    <Sheet id={S.id} n={S.n} label={S.label} ground="paper" className="work" labelledBy="h-work">
      <Rail style={{ top: 0, bottom: 0 }} />
      <Work />
    </Sheet>
  );
}
