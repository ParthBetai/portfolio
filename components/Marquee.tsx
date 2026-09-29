"use client";

import { useEffect, useId, useRef } from "react";
import { gsap, ScrollTrigger, reduced, soft } from "@/lib/motion";
import { stacks } from "@/lib/content";

/* How many times each row's list is laid end to end. The loop translates
   by exactly -50%, so half the track (two copies) has to be wider than the
   widest screen we support. At 2560px two copies of the shortest row
   (the six AI practices, about 1700px a copy at desktop size) still
   clear the edge, and nothing needs measuring. */
const COPIES = 4;

/* Hovering the band slows every row to this fraction of its base speed,
   so a name you are trying to read stops running away from you. */
const HOVER_RATE = 0.25;

/* The rows hold very different amounts (eight hardware skills, eighteen
   things being learned), so a fixed duration per row would make the long
   rows race. Duration scales with a rough length instead: the letters in
   one list plus about seven letters' worth of padding and separator per
   name. PACE is tuned so the first row keeps the ~38s lap it always had,
   and STEP makes each row a touch slower than the one above, so the band
   never moves in lockstep. */
const PACE = 0.25;
const STEP = 0.08;
const lap = (items: string[], i: number) =>
  ((items.join("").length + items.length * 7) * PACE * (1 + i * STEP)).toFixed(1);

/* Every chip is as wide as the widest label, so the four chips end at the
   same point down the band instead of four pills of four different
   lengths. Each chip stacks all the labels in one grid cell and shows only
   its own, so the cell takes the widest of them in whatever font is on
   screen: nothing needs measuring, and it holds before the webfont
   arrives. Counting letters is not enough, because t-mono is not a
   monospace face ("HARDWARE" runs wider than eight zeros). The other
   labels are drawn with ::before content, so they take their width but
   text readers see only the row's own. */
const LABELS = stacks.map((r) => r.label);

/* Four labelled rows of tech names drifting in alternating directions, in
   a band directly under the intro.

   The drift itself is a pure CSS animation set inline, like the reference:
   it runs before hydration, survives a busy main thread, and keeps going
   in soft mode. JavaScript only ever *adjusts* those animations through
   the Web Animations API (playbackRate, pause/play). It never owns them,
   so if the script fails the band still moves.

   On top of that:
     · hover eases the rows down to a quarter speed        (full + soft)
     · off screen the loops pause, so they are not ticking
       for the whole session several screens away          (full + soft)
     · scroll velocity surges the loops and skews the rows,
       settling once the scroll stops                      (full only)

   Each row's label is pinned at its left edge over a fade, and the names
   slide under it. The band now says something real (what Parth works with
   and what he is still learning), so it is a named region with a plain
   heading and list per row for assistive tech. The moving copies are
   aria-hidden: four copies of every name, read out forever, would be noise.

   With motion switched off there is nothing to do here: the
   html[data-motion="off"] rule in globals.css already freezes keyframes. */
export default function Marquee() {
  const root = useRef<HTMLElement>(null);
  const titleId = useId();

  useEffect(() => {
    const band = root.current;
    if (!band || reduced()) return;

    const rows = Array.from(band.querySelectorAll<HTMLElement>("[data-row]"));
    /* The CSSAnimation objects behind the inline `animation` styles. Reading
       them flushes style, so they exist by the time this runs. Guarded for
       the rare engine without getAnimations: the CSS loop still plays. */
    const anims = Array.from(band.querySelectorAll<HTMLElement>("[data-track]")).flatMap((el) =>
      typeof el.getAnimations === "function" ? el.getAnimations() : []
    );

    /* Two independent speed factors, multiplied. Hover and scroll can be
       active at the same time; keeping them separate means neither has to
       know what the other is doing, and both tween toward their own rest
       value of 1. */
    const hover = { rate: 1 };
    const boost = { rate: 1 };
    const apply = () => {
      const rate = hover.rate * boost.rate;
      /* Setting playbackRate preserves currentTime, so speed changes never
         make the rows jump. */
      anims.forEach((a) => {
        a.playbackRate = rate;
      });
    };

    /* Held outside the context callback so the teardown below can reach
       every listener, observer and timer explicitly. */
    let hoverTo: gsap.QuickToFunc | undefined;
    let trigger: ScrollTrigger | undefined;
    let idle = 0;

    const ctx = gsap.context(() => {
      /* quickTo setters are created once here. Each call retargets the same
         tween, so neither hover nor scroll allocates a tween per event. */
      hoverTo = gsap.quickTo(hover, "rate", {
        duration: 0.8,
        ease: "power2.out",
        onUpdate: apply,
      });

      /* Velocity extras are the one thing soft mode drops: they move with
         the scroll rather than with the reader. */
      if (!soft()) {
        const boostTo = gsap.quickTo(boost, "rate", {
          duration: 0.4,
          ease: "power2.out",
          onUpdate: apply,
        });
        /* Skew goes on the row wrapper, never the track: the track's
           transform belongs to the CSS animation, which would override
           anything GSAP wrote there. The label chip and its fade are
           siblings of this wrapper, not children, so they stay level. */
        const skewTo = rows.map((row) =>
          gsap.quickTo(row, "skewY", { duration: 0.5, ease: "power3.out" })
        );

        const settle = () => {
          boostTo(1);
          skewTo.forEach((set) => set(0));
        };

        /* ScrollTrigger rather than a raw scroll listener: it is already fed
           by Lenis, gives a smoothed velocity, and only calls onUpdate while
           the band is actually in the viewport. */
        trigger = ScrollTrigger.create({
          trigger: band,
          start: "top bottom",
          end: "bottom top",
          onUpdate: (self) => {
            /* Motion can be switched off mid-visit from the footer. */
            if (reduced()) return;
            const v = self.getVelocity();
            /* Clamped so a flung scroll surges the band without tipping it
               into nonsense. */
            boostTo(gsap.utils.clamp(1, 4, 1 + Math.abs(v) / 1000));
            const skew = gsap.utils.clamp(-5, 5, v / 300);
            skewTo.forEach((set) => set(skew));

            /* onUpdate only fires while the page moves, so the return to
               rest is a short idle timer rather than a per-frame check. */
            window.clearTimeout(idle);
            idle = window.setTimeout(settle, 120);
          },
        });
      }
    }, band);

    /* Pointer only. On touch, pointerenter fires as a scroll begins, and
       braking the rows then would fight the velocity surge. */
    const onEnter = (e: PointerEvent) => {
      if (e.pointerType === "touch") return;
      hoverTo?.(HOVER_RATE);
    };
    const onLeave = () => hoverTo?.(1);
    band.addEventListener("pointerenter", onEnter);
    band.addEventListener("pointerleave", onLeave);

    /* Pause the loops while the band is off screen. The margin starts them
       just before they scroll into view, so they never enter frozen. */
    let io: IntersectionObserver | undefined;
    if (typeof IntersectionObserver !== "undefined") {
      io = new IntersectionObserver(
        (entries) => {
          /* play() on a loop frozen by the motion-off rule would restart it
             and flash the start frame, so leave it alone. */
          if (reduced()) return;
          const visible = entries[entries.length - 1]?.isIntersecting ?? true;
          anims.forEach((a) => (visible ? a.play() : a.pause()));
        },
        { rootMargin: "160px 0px" }
      );
      io.observe(band);
    }

    return () => {
      band.removeEventListener("pointerenter", onEnter);
      band.removeEventListener("pointerleave", onLeave);
      io?.disconnect();
      window.clearTimeout(idle);
      trigger?.kill();
      ctx.revert();
      /* Hand the loops back to CSS exactly as found, so a StrictMode
         remount (or a later mount) starts from base speed and running. */
      anims.forEach((a) => {
        a.playbackRate = 1;
        if (a.playState === "paused") a.play();
      });
    };
  }, []);

  return (
    <section
      ref={root}
      aria-labelledby={titleId}
      /* isolate keeps the chips' z-index inside the band, so it can never
         compete with the nav or the cursor layered over the page. */
      className="relative isolate flex select-none flex-col gap-3 overflow-hidden border-t border-white/5 bg-[#030303] py-5"
    >
      <h2 id={titleId} className="sr-only">
        Tech stack
      </h2>

      {stacks.map((row, i) => {
        /* One flat list of COPIES back-to-back lists. -50% of it is exactly
           COPIES/2 lists, so the seam lands on an identical frame. */
        const items = Array.from({ length: COPIES }, () => row.items).flat();

        return (
          /* Positioned but never transformed: the pinned label lives here,
             beside the skewed wrapper rather than inside it. */
          <div key={row.label} className="relative">
            {/* What a screen reader gets instead of the drift: the label
                and each name once, in order. */}
            <h3 className="sr-only">{row.label}</h3>
            <ul className="sr-only">
              {row.items.map((item, k) => (
                <li key={k}>{item}</li>
              ))}
            </ul>

            <div data-row aria-hidden>
              <div
                data-track
                className="flex w-max items-baseline whitespace-nowrap"
                style={{
                  /* Alternating direction; the duration comes from lap(). */
                  animation: `${i % 2 === 0 ? "marquee" : "marquee-reverse"} ${lap(row.items, i)}s linear infinite`,
                }}
              >
                {items.map((item, k) => {
                  return (
                    <span key={k} className="flex items-baseline">
                      <span
                        /* Every name the same: grey, upper case, evenly
                           spaced. An odd one out in a second typeface
                           looked like decoration for its own sake. */
                        className="px-4 text-sm font-medium uppercase tracking-[0.14em] text-ash md:px-8 md:text-lg"
                      >
                        {item}
                      </span>
                      {/* A small square on the cap-height centre line, not a
                          full stop on the baseline: it separates the names
                          without reading as punctuation. */}
                      <span className="mx-1 inline-block h-[3px] w-[3px] -translate-y-[0.3em] bg-ash-dim text-sm md:mx-3 md:h-1 md:w-1 md:text-lg" />
                    </span>
                  );
                })}
              </div>
            </div>

            {/* The pinned label. Solid under the chip, then a short fade, so
                the names soften just before they slip under it whatever
                the label's length. It reaches half the row gap up and down,
                so neighbouring rails meet and a row mid-skew cannot peek
                out between them. The outer rails run on through the band's
                padding (py-5) to its clipped edge, since a skew lifts the
                left end of the first and last rows into that strip too. */}
            <div
              aria-hidden
              className={`pointer-events-none absolute left-0 z-10 flex ${
                i === 0 ? "-top-5" : "-top-1.5"
              } ${i === stacks.length - 1 ? "-bottom-5" : "-bottom-1.5"}`}
            >
              {/* The outer rails reach 14px further than the inner ones, so
                  they pad that back out: the chip centres on its row, not
                  on the rail. */}
              <div
                className={`flex items-center bg-[#030303] pl-3 md:pl-5 ${i === 0 ? "pt-3.5" : ""} ${
                  i === stacks.length - 1 ? "pb-3.5" : ""
                }`}
              >
                {/* One chip design for every row: a copper label in a dark
                    pill, and nothing else competing with it.
                    From md up the row box is a touch taller than the
                    caps, and baseline alignment drops them about 2px below
                    its centre, so the chip is nudged down to meet them. Nothing animates the chip, so a Tailwind
                    translate is safe here. */}
                <span className="t-mono grid whitespace-nowrap rounded-full border border-white/10 bg-carbon px-3 py-1.5 text-[9px] leading-none text-acid md:translate-y-0.5 md:text-[11px]">
                  <span className="col-start-1 row-start-1">{row.label}</span>
                  {LABELS.filter((label) => label !== row.label).map((label) => (
                    <span
                      key={label}
                      data-label={label}
                      className="invisible col-start-1 row-start-1 before:content-[attr(data-label)]"
                    />
                  ))}
                </span>
              </div>
              <div className="w-6 bg-linear-to-r from-[#030303] to-transparent md:w-10" />
            </div>
          </div>
        );
      })}

      {/* The right edge fades too, so names drift in out of the dark
          instead of being sliced off by the edge of the screen. */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-y-0 right-0 z-10 w-10 bg-linear-to-l from-[#030303] to-transparent md:w-24"
      />
    </section>
  );
}
