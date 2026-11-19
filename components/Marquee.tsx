"use client";

import { useEffect, useId, useRef, useState } from "react";
import { gsap, ScrollTrigger, soft } from "@/lib/motion";
import { stackLabels, stacks } from "@/lib/content";
import TramBand from "./TramBand";
import { aboutHeld, holdAbout } from "./FactsTicket";

/* How many times each row's list is laid end to end. The loop translates
   by exactly -50%, so half the track (two copies) has to be wider than the
   widest track we support. At 2560px two copies of the shortest row (the
   six practices, about 1200px a copy at desktop size) still clear it, and
   nothing needs measuring. */
const COPIES = 4;

/* Hovering the rows slows every one to this fraction of its base speed,
   so a name you are trying to read stops running away from you. */
const HOVER_RATE = 0.25;

/* The rows hold very different amounts (eight hardware skills, seventeen
   things being learned), so a fixed duration per row would make the long
   rows race. Duration scales with a rough length instead: the letters in
   one list plus about seven letters' worth of padding and separator per
   name. STEP makes each row a touch slower than the one above, so the
   band never moves in lockstep. */
const PACE = 0.25;
const STEP = 0.08;
const lap = (items: string[], i: number) =>
  ((items.join("").length + items.length * 7) * PACE * (1 + i * STEP)).toFixed(1);

/* The enamel tins lean a little, each its own way (never past 0.6deg). */
const TILT = [-0.6, 0.4, -0.3, 0.6];

/* ============================================================
   THE TRAM BAND AND THE STACK ROWS (bottom of Sheet 02)
   The tram (TramBand.tsx) heads four rows: Stack, Intelligent systems,
   Hardware and Learning. Each row is an enamel tin with its name (teal,
   chrome rim, end rivets) and the names running through a clipped track
   that fades in at its left edge and starts on a whole word.

   The drift itself is a pure CSS animation set inline: it runs before
   hydration, survives a busy main thread, and keeps going in soft mode.
   JavaScript only ever adjusts those animations through the Web
   Animations API (playbackRate, pause/play), never owns them, so if the
   script fails the rows still move. On top of that:
     · the pause button stops and restarts every row, and
       the ticket's rolling roles with them                (full + soft)
     · hover eases the rows down to a quarter speed          (full + soft)
     · off screen the loops pause                            (full + soft)
     · scroll velocity surges the loops, settling once the
       scroll stops                                          (full only)

   It is a named region with a plain heading and list per row for
   assistive tech; the tins and the moving copies are aria-hidden.
   ============================================================ */
export default function Marquee() {
  const root = useRef<HTMLDivElement>(null);
  const titleId = useId();
  /* Starts from the sheet's shared hold, so a pause outlives a remount. */
  const [paused, setPaused] = useState(aboutHeld);
  /* Read by the observer and the hover handlers, which are set up once. */
  const held = useRef(paused);
  const anims = useRef<Animation[]>([]);

  useEffect(() => {
    const band = root.current;
    if (!band) return;

    /* The CSSAnimation objects behind the inline `animation` styles.
       Guarded for the rare engine without getAnimations: the CSS loop
       still plays. */
    const list = Array.from(band.querySelectorAll<HTMLElement>("[data-track]")).flatMap((el) =>
      typeof el.getAnimations === "function" ? el.getAnimations() : []
    );
    anims.current = list;
    if (held.current) list.forEach((a) => a.pause());

    /* Two independent speed factors, multiplied, each tweening toward its
       own rest value of 1. Setting playbackRate preserves currentTime, so
       speed changes never make the rows jump. */
    const hover = { rate: 1 };
    const boost = { rate: 1 };
    const apply = () => {
      const rate = hover.rate * boost.rate;
      list.forEach((a) => {
        a.playbackRate = rate;
      });
    };

    let hoverTo: gsap.QuickToFunc | undefined;
    let trigger: ScrollTrigger | undefined;
    let idle = 0;

    const ctx = gsap.context(() => {
      hoverTo = gsap.quickTo(hover, "rate", { duration: 0.8, ease: "power2.out", onUpdate: apply });

      /* The surge is the one thing soft mode drops: it moves with the
         scroll rather than with the reader. */
      if (!soft()) {
        const boostTo = gsap.quickTo(boost, "rate", { duration: 0.4, ease: "power2.out", onUpdate: apply });
        /* ScrollTrigger rather than a raw scroll listener: it is fed by
           Lenis, gives a smoothed velocity, and only calls onUpdate while
           the rows are on screen. */
        trigger = ScrollTrigger.create({
          trigger: band,
          start: "top bottom",
          end: "bottom top",
          onUpdate: (self) => {
            boostTo(gsap.utils.clamp(1, 4, 1 + Math.abs(self.getVelocity()) / 1000));
            /* onUpdate only fires while the page moves, so the return to
               rest is a short idle timer rather than a per-frame check. */
            window.clearTimeout(idle);
            idle = window.setTimeout(() => boostTo(1), 120);
          },
        });
      }
    }, band);

    /* Pointer only. On touch, pointerenter fires as a scroll begins. */
    const rows = band.querySelector<HTMLElement>("[data-rows]");
    const onEnter = (e: PointerEvent) => {
      if (e.pointerType !== "touch") hoverTo?.(HOVER_RATE);
    };
    const onLeave = () => hoverTo?.(1);
    rows?.addEventListener("pointerenter", onEnter);
    rows?.addEventListener("pointerleave", onLeave);

    /* Pause the loops while the rows are off screen. The margin starts
       them just before they scroll into view, so they never enter frozen.
       A pause the visitor asked for wins. */
    let io: IntersectionObserver | undefined;
    if (typeof IntersectionObserver !== "undefined" && rows) {
      io = new IntersectionObserver(
        (entries) => {
          const visible = entries[entries.length - 1]?.isIntersecting ?? true;
          list.forEach((a) => (visible && !held.current ? a.play() : a.pause()));
        },
        { rootMargin: "160px 0px" }
      );
      io.observe(rows);
    }

    return () => {
      rows?.removeEventListener("pointerenter", onEnter);
      rows?.removeEventListener("pointerleave", onLeave);
      io?.disconnect();
      window.clearTimeout(idle);
      trigger?.kill();
      ctx.revert();
      /* Hand the loops back to CSS exactly as found, so a StrictMode
         remount starts from base speed and running. */
      list.forEach((a) => {
        a.playbackRate = 1;
        if (a.playState === "paused") a.play();
      });
      anims.current = [];
    };
  }, []);

  /* The pause button (WCAG 2.2.2): stops every row where it is, and
     plays them again from there, and holds the ticket's rolling roles
     (FactsTicket) with them: all the moving text on the sheet. */
  const toggle = () => {
    const next = !held.current;
    held.current = next;
    setPaused(next);
    holdAbout(next);
    anims.current.forEach((a) => (next ? a.pause() : a.play()));
  };

  return (
    <div ref={root} className="tramband">
      <TramBand />

      {/* Only with scripts: without them there is nothing to pause with. */}
      <button
        type="button"
        className="pause"
        aria-label={stackLabels.pause}
        aria-pressed={paused}
        onClick={toggle}
        data-js-only
      >
        <svg viewBox="0 0 20 20" aria-hidden="true">
          {paused ? (
            <path d="M7 4.5v11l9-5.5z" fill="currentColor" stroke="currentColor" strokeWidth="1.4" strokeLinejoin="round" />
          ) : (
            <path d="M7 5v10M13 5v10" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" />
          )}
        </svg>
      </button>

      <section className="rows" data-rows aria-labelledby={titleId}>
        <h2 id={titleId} className="sr-only">
          {stackLabels.heading}
        </h2>
        {stacks.map((row, i) => {
          /* One flat list of COPIES back-to-back lists. -50% of it is
             exactly COPIES/2 lists, so the seam lands on an identical
             frame, and both directions start on a whole word. */
          const items = Array.from({ length: COPIES }, () => row.items).flat();
          return (
            <div key={row.label} className="mrow">
              {/* What a screen reader gets instead of the drift: the label
                  and each name once, in order. */}
              <h3 className="sr-only">{row.label}</h3>
              <ul className="sr-only">
                {row.items.map((item, k) => (
                  <li key={k}>{item}</li>
                ))}
              </ul>
              <span className="tin" aria-hidden="true" style={{ "--tilt": `${TILT[i % TILT.length]}deg` } as React.CSSProperties}>
                {row.label}
              </span>
              <div className="track" aria-hidden="true">
                <p
                  data-track
                  className="items"
                  style={{
                    animation: `${i % 2 === 0 ? "marquee" : "marquee-reverse"} ${lap(row.items, i)}s linear infinite`,
                  }}
                >
                  {items.map((item, k) => (
                    <span key={k}>{item}</span>
                  ))}
                </p>
              </div>
            </div>
          );
        })}
      </section>
    </div>
  );
}
