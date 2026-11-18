"use client";

import { useEffect, useRef } from "react";
import { gsap, scrub, driveVeil } from "@/lib/motion";

/* ============================================================
   THE PASTE-UP (Services to Work)
   The Work sheet arrives the way a poster goes up on a wall: a roll of
   fresh paper on its torn top edge, with wet paste streaks on the old
   sheet just above. It is a child of the Work sheet, so it rides the
   sheet's own sticky slide for free: there is no clone, no clip and no
   added scroll length.

   The scrub writes two things only, each an opacity of one box:
     1. the whole paste-up's opacity, which goes to 0 once the sheet's
        top has passed 30% of the viewport (the roll has been laid);
     2. the Services sheet's veil (driveVeil), 0 to 20% as Work covers it.

   Without scripts it is not rendered at all (data-js-only): the deckle
   edge carries the idea on its own. Soft mode runs the same scrub, locked
   to the scroll.
   ============================================================ */
export default function PasteUp() {
  const root = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = root.current;
    const sheet = el?.closest<HTMLElement>(".sheet");
    if (!el || !sheet) return;

    const ctx = gsap.context(() => {
      /* The roll is laid once the top passes 30%; it comes back on the way
         up, so the slide reads the same in both directions. */
      gsap.fromTo(
        el,
        { opacity: 1 },
        {
          opacity: 0,
          ease: "none",
          scrollTrigger: { trigger: sheet, start: "top 36%", end: "top 30%", scrub: scrub() },
        }
      );
    }, el);

    /* The old sheet dims a little under the new one. Services renders the
       veil (Sheet's veil prop); nothing to do on a page without it. */
    const veil = document.querySelector<HTMLElement>('.sheet[data-sheet-id="services"] > .veil');
    const undoVeil = veil ? driveVeil(veil, { max: 0.2 }) : () => {};

    return () => {
      undoVeil();
      ctx.revert();
    };
  }, []);

  return (
    <div ref={root} className="pasteedge" aria-hidden="true" data-js-only="">
      <div className="streaks" />
      <div className="roll" />
    </div>
  );
}
