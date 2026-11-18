"use client";

import { useEffect, useRef } from "react";
import { gsap, scrub, onStand } from "@/lib/motion";
import Ambassador from "@/components/Ambassador";
import { Rail, Elbow } from "@/components/Route";
import { VIEWBOX, TRUSS_ID, SCENE, TRUSS, LIT } from "@/components/BridgeArt";

/* ============================================================
   THE BRIDGE CROSSING
   The head of Sheet 03: the taxi crosses the Howrah Bridge as the
   Services sheet slides up over About. Its height is max(270px, 24.8vw)
   (--bh), so the band's height always governs the art's slice.

   The band is a stack of separate boxes so the one scrub only ever
   writes a box's opacity or transform (never an SVG child, a custom
   property, a filter or a size):
     three sky divs   day, dusk and night, cross-faded by opacity
     svg.scene        the static picture (BridgeArt SCENE)
     two truss roots  the same <g> in navy and in cream; the cream one
                      fades in as night falls
     .litmask         a box that slides with the taxi (translateX), with
                      the lit layer inside sliding back the other way, so
                      the lamps and their reflections light up behind the
                      taxi while the art itself stays put
     .decktaxi        a full-width box with the car centred on its left
                      edge, moved by translateX alone
   and the route's U-turn: down the gutter, along the deck, down the
   right side, back along the Strand bank and down the gutter into the
   sheet.

   The taxi on the deck is the route's own taxi for that stretch: the
   journey (driveRoute, lib/motion.ts) brings the small taxi down the
   gutter, hands over to this one where the gutter meets the deck
   (data-stand-car="deck", the deck rail is stand="deck"), drives it
   across with the scroll, filling the deck rail to its tail, and takes
   the small one on down the right side at the far end. Off the deck it
   is hidden, so there is only ever one taxi on the route. onStand tells
   this band where it is, for the lamps.

   The sky and the truss keep their own scrub, while the band crosses
   the viewport, from its top meeting the viewport bottom to its bottom
   leaving the top, the same in soft mode (scrub()).

   At rest (no scripts) it is dusk with the taxi at 62% and the lamps lit
   behind it, which is what the CSS draws.
   ============================================================ */

export default function BridgeBand() {
  const root = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = root.current;
    if (!el) return;
    const q = <T extends Element>(sel: string) => el.querySelector<T>(sel);
    const day = q<HTMLElement>(".sky.day");
    const dusk = q<HTMLElement>(".sky.dusk");
    const night = q<HTMLElement>(".sky.night");
    const ink = q<SVGSVGElement>(".tr-ink");
    const cream = q<SVGSVGElement>(".tr-cream");
    const mask = q<HTMLElement>(".litmask");
    const lit = q<SVGSVGElement>(".litmask > .lit");
    const taxi = q<HTMLElement>(".decktaxi");
    const deck = q<HTMLElement>(".r-br-deck");
    if (!day || !dusk || !night || !ink || !cream || !mask || !lit || !taxi || !deck) return;

    /* The lamps are lit up to the deck taxi's middle: where it starts is
       read when ScrollTrigger refreshes (in natural flow), never per
       frame. The journey puts the car's middle half a car in from each
       end of the deck rail, the same arithmetic as here. */
    let band = 1;
    let from = 0;
    let to = 1;
    const measure = () => {
      band = Math.max(1, el.clientWidth);
      const half = ((taxi.firstElementChild as HTMLElement | null)?.getBoundingClientRect().width ?? 112) / 2;
      from = deck.offsetLeft + half;
      to = deck.offsetLeft + deck.offsetWidth - half;
    };
    let lastU = -1;
    const light = (u: number) => {
      if (u === lastU) return;
      lastU = u;
      const x = from + (to - from) * u;
      gsap.set(mask, { x: x - band, xPercent: 0 });
      gsap.set(lit, { x: band - x, xPercent: 0 });
    };

    const ctx = gsap.context(() => {
      const tl = gsap.timeline({
        defaults: { ease: "none" },
        scrollTrigger: {
          trigger: el,
          start: "top bottom",
          end: "bottom top",
          scrub: scrub(),
          invalidateOnRefresh: true,
          onRefresh: () => {
            measure();
            const u = lastU < 0 ? 0 : lastU;
            lastU = -1;
            light(u);
          },
        },
      });
      /* the sky: day to dusk over the first half, dusk to night over the
         second */
      tl.fromTo(day, { opacity: 1 }, { opacity: 0, duration: 0.5 }, 0)
        .fromTo(dusk, { opacity: 0 }, { opacity: 1, duration: 0.5 }, 0)
        .to(dusk, { opacity: 0, duration: 0.5 }, 0.5)
        .fromTo(night, { opacity: 0 }, { opacity: 1, duration: 0.5 }, 0.5)
        /* the truss turns from navy to cream once it is dark enough */
        .fromTo(ink, { opacity: 1 }, { opacity: 0, duration: 0.26 }, 0.62)
        .fromTo(cream, { opacity: 0 }, { opacity: 1, duration: 0.26 }, 0.62);
    }, el);

    measure();
    light(0);
    const off = onStand("deck", (u) => light(u));

    return () => {
      off();
      ctx.revert();
      gsap.set([mask, lit], { clearProps: "transform" });
    };
  }, []);

  return (
    <div ref={root} className="bridge" aria-hidden="true">
      <div className="sky day" />
      <div className="sky dusk" />
      <div className="sky night" />
      {/* the truss, defined once and drawn by the two roots below */}
      <svg className="br-defs" width="0" height="0">
        <defs>
          <g id={TRUSS_ID} fill="none" stroke="currentColor" dangerouslySetInnerHTML={{ __html: TRUSS }} />
        </defs>
      </svg>
      <svg className="scene" viewBox={VIEWBOX} preserveAspectRatio="xMidYMid slice" dangerouslySetInnerHTML={{ __html: SCENE }} />
      <svg className="scene tr-ink" viewBox={VIEWBOX} preserveAspectRatio="xMidYMid slice">
        <use href={`#${TRUSS_ID}`} />
      </svg>
      <svg className="scene tr-cream" viewBox={VIEWBOX} preserveAspectRatio="xMidYMid slice">
        <use href={`#${TRUSS_ID}`} />
      </svg>
      <div className="litmask">
        <svg className="scene lit" viewBox={VIEWBOX} preserveAspectRatio="xMidYMid slice" dangerouslySetInnerHTML={{ __html: LIT }} />
      </div>
      <div className="bankstrip" />

      <Rail className="r-br-a" />
      <Elbow corner="bl" className="e-br-a" />
      <Rail dir="h" className="r-br-deck" stand="deck" />
      <Elbow corner="tr" className="e-br-b" />
      <Rail className="r-br-b" />
      <Elbow corner="br" className="e-br-c" />
      <Rail dir="h" rtl className="r-br-bank" />
      <Elbow corner="tl" className="e-br-d" />
      <Rail className="r-br-down" />

      <div className="decktaxi" data-stand-car="deck">
        <Ambassador variant="color" width={112} shadow className="dtaxi" />
      </div>
    </div>
  );
}
