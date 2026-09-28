"use client";

import { useEffect, useId, useRef } from "react";
import { gsap, ScrollTrigger, reduced } from "@/lib/motion";
import { ventures } from "@/lib/content";

type Venture = (typeof ventures.items)[number];

/* ============================================================
   FOUNDER JOURNEY
   A short chapter after the work: the two businesses so far, oldest
   first. Its object is a stretch of railway. Psquare ran on a branch
   line that ends at a buffer stop, a switch carries the route across to
   the main line (the pivot), and Afferex is the next station, where the
   line also ends at a buffer stop: both ventures are wound down. The
   dashed track past it is the next chapter, not built yet.

   On a desktop the line runs across the top and each venture hangs off
   its station. On a phone the same line turns vertical and runs down the
   left edge of the stacked cards. The two drawings are separate
   decorations (both aria-hidden); the cards are one list for both.

   Motion: the route draws with the scroll and the cards rise in. Soft
   mode is exactly the same, since nothing here reads scroll velocity.
   There are no loops and no blinking lights: an earlier version ran a
   glowing dot along the line and blinked a "live" LED, and both were
   decoration for its own sake. With motion off everything is already drawn.
   ============================================================ */

/* The desktop line is to scale. One month is 2.6% of the width, counted
   from Jul 2024, which puts Afferex (Mar 2026, month 20) at 52%: exactly
   where the second card's column starts, so its station sits on the
   card's edge. The rest follows from the dates. */
const MONTH = 2.6;
const at = (month: number) => `${month * MONTH}%`;
const H = {
  wrap: 12, //       Jul 2025, Psquare winds down and the switch begins
  stop: 14, //       the branch runs on a little to its buffer stop
  join: 17, //       Nov 2025, the switch meets the main line
  station: 20, //    Mar 2026, Afferex
  end: 23, //        its own buffer stop, a little further on
};
/* Year boundaries on the same scale. The first is the start of the line
   (Jul 2024), the others are the 1st of January. */
const YEARS = [
  { label: "2024", month: 0 },
  { label: "2025", month: 6 },
  { label: "2026", month: 18 },
];

/* Rail heights inside the desktop track, in px. Centres sit on the half
   pixel so a 1px line and the curve's hairline land on the same row. */
const TOP = 24; //   main line (Afferex)
const LOW = 64; //   branch line (Psquare)
const TRACK_H = 84;

/* Phone rails, in px from the list's left edge. */
const V_A = 7; //    branch (Psquare)
const V_B = 23; //   main line (Afferex)
const STRIP_H = 76; // the switch between the two cards

const ACID = "#e0895a";
/* The lit branch: warm white, dimmer than the main line but clearly
   brighter than the unlit rail it is drawn over. The switch picks up
   where it ends and warms to copper on the way to the main line. */
const BRANCH_FROM = "rgb(237 237 230 / 0.22)";
const BRANCH_TO = "rgb(237 237 230 / 0.55)";

export default function Ventures() {
  const root = useRef<HTMLElement>(null);
  const wrap = useRef<HTMLDivElement>(null);
  const titleId = useId();
  /* useId can contain characters that break url(#...) references. */
  const gid = `vg${titleId.replace(/[^a-zA-Z0-9_-]/g, "")}`;

  useEffect(() => {
    const el = root.current;
    const box = wrap.current;
    /* Motion off: the markup is the finished state. Nothing to do. */
    if (!el || !box || reduced()) return;

    const q =<T extends Element = HTMLElement>(sel: string) => el.querySelector<T>(sel);

    /* --- reveals, both layouts ------------------------------------- */
    const ctx = gsap.context(() => {
      const head = q("[data-v-head]");
      if (head) {
        gsap.fromTo(
          head,
          { y: 60, opacity: 0 },
          {
            y: 0,
            opacity: 1,
            duration: 1.2,
            ease: "expo.out",
            scrollTrigger: { trigger: head, start: "top 85%" },
          }
        );
      }
      el.querySelectorAll<HTMLElement>("[data-v-body]").forEach((body) => {
        gsap.fromTo(
          body.querySelectorAll("[data-rise]"),
          { y: 26, opacity: 0 },
          {
            y: 0,
            opacity: 1,
            duration: 1,
            ease: "expo.out",
            stagger: 0.07,
            scrollTrigger: { trigger: body, start: "top 86%" },
          }
        );
      });
    }, el);

    /* --- the line: drawn differently per layout -------------------- */
    const mm = gsap.matchMedia();
    mm.add(
      { wide: "(min-width: 1024px)", narrow: "(max-width: 1023.98px)" },
      (c) => {
        const wide = !!(c.conditions as { wide?: boolean }).wide;
        const m = wide ? "h" : "v";
        const nodeB = q(`[data-node-b-${m}]`);
        if (!nodeB) return;

        if (wide) {
          const track = q("[data-track-h]");
          if (!track) return;
          const tl = gsap.timeline({ defaults: { ease: "none" } });
          tl.fromTo(q("[data-h-lit-a]"), { scaleX: 0 }, { scaleX: 1, duration: 0.5, transformOrigin: "0% 50%" }, 0)
            .fromTo(
              q("[data-h-lit-curve]"),
              { clipPath: "inset(-3px 100% -3px 0%)" },
              { clipPath: "inset(-3px 0% -3px 0%)", duration: 0.24 }
            )
            .fromTo(q("[data-h-lit-b]"), { scaleX: 0 }, { scaleX: 1, duration: 0.13, transformOrigin: "0% 50%" })
            .fromTo(nodeB, { scale: 0.45, opacity: 0.3 }, { scale: 1, opacity: 1, duration: 0.07, ease: "back.out(3)" })
            .fromTo(q("[data-h-drop-b]"), { scaleY: 0 }, { scaleY: 1, duration: 0.05, transformOrigin: "50% 0%" }, "<")
            .fromTo(q("[data-h-lit-c]"), { scaleX: 0 }, { scaleX: 1, duration: 0.05, transformOrigin: "0% 50%" }, "<")
            .fromTo(q("[data-h-edge-b]"), { scaleY: 0 }, { scaleY: 1, duration: 0.22, transformOrigin: "50% 0%" });

          ScrollTrigger.create({
            animation: tl,
            trigger: track,
            start: "top 90%",
            end: "top 45%",
            scrub: 0.8,
          });
        } else {
          const litA = q("[data-v-lit-a]");
          /* The unlit rail under it has the same box and is never scaled.
             Triggering off the lit rail itself would measure it squashed
             to nothing by its own scaleY(0), so its start and end would
             coincide and the line would snap on instead of drawing. */
          const railA = q("[data-v-rail-a]") ?? litA;
          const curve = q("[data-v-lit-curve]");
          const litB = q("[data-v-lit-b]");
          const dropB = q("[data-v-drop-b]");
          /* The tip of the line rides at 72% of the screen height, so
             each piece draws as it passes that line, one after another. */
          if (litA && railA) {
            gsap.fromTo(
              litA,
              { scaleY: 0 },
              {
                scaleY: 1,
                transformOrigin: "50% 0%",
                ease: "none",
                scrollTrigger: { trigger: railA, start: "top 72%", end: "bottom 72%", scrub: 0.5 },
              }
            );
          }
          if (curve) {
            gsap.fromTo(
              curve,
              { clipPath: "inset(0% -3px 100% -3px)" },
              {
                clipPath: "inset(0% -3px 0% -3px)",
                ease: "none",
                scrollTrigger: { trigger: curve, start: "top 72%", end: "bottom 72%", scrub: 0.5 },
              }
            );
          }
          const arrive = gsap.timeline({
            scrollTrigger: {
              trigger: nodeB,
              start: "center 72%",
              toggleActions: "play none none reverse",
            },
          });
          if (litB) arrive.fromTo(litB, { scaleY: 0 }, { scaleY: 1, duration: 0.15, ease: "none", transformOrigin: "50% 0%" });
          arrive.fromTo(nodeB, { scale: 0.45, opacity: 0.3 }, { scale: 1, opacity: 1, duration: 0.45, ease: "back.out(3)" });
          if (dropB) {
            arrive.fromTo(
              dropB,
              { scaleY: 0 },
              { scaleY: 1, duration: 0.9, ease: "power2.out", transformOrigin: "50% 0%" },
              "<"
            );
          }
        }

      },
      el
    );

    return () => {
      mm.revert();
      ctx.revert();
    };
  }, []);

  return (
    <section
      id="journey"
      ref={root}
      aria-labelledby={titleId}
      className="gutter relative bg-void pb-20 pt-8 md:pb-24 lg:pt-10"
    >
      {/* A hairline across the top marks the change of chapter after the
          last project, the way a new part starts on a fresh page. */}
      <div aria-hidden className="rule mb-12 md:mb-16" />

      {/* The heading and its blurb rise as one: on a phone the blurb sits
          right under the heading, and a heading rising on its own slid up
          through it. */}
      <header
        data-v-head
        className="mb-12 flex flex-col gap-6 lg:mb-14 lg:flex-row lg:items-end lg:justify-between"
      >
        <div>
          <p className="t-mono mb-4 text-ash md:mb-5">{ventures.eyebrow}</p>
          <h2
            id={titleId}
            className="t-display text-[13vw] leading-[0.9] sm:whitespace-nowrap sm:text-[9vw] md:text-[7vw] lg:text-[4.6vw]"
          >
            <span className="chrome">{ventures.heading[0]}</span>{" "}
            <span className="t-serif normal-case text-ash">{ventures.heading[1]}</span>
          </h2>
        </div>
        <p className="max-w-md text-sm leading-relaxed text-ash md:text-base lg:w-4/12 lg:max-w-none">
          {ventures.blurb}
        </p>
      </header>

      {/* isolate keeps the stations and chip layering inside this box, so
          none of it can compete with the nav or the cursor. */}
      <div ref={wrap} className="relative isolate">
        <TrackH gid={gid} />

        <ol aria-label="Ventures, oldest first" className="grid lg:grid-cols-2 lg:gap-x-[4%]">
          {ventures.items.map((v, i) => (
            <li key={v.name} className="relative">
              <Card v={v} index={i} />
              {i === 0 && <SwitchV gid={gid} />}
            </li>
          ))}
        </ol>

      </div>
    </section>
  );
}

/* ============================================================
   DESKTOP TRACK
   ============================================================ */
function TrackH({ gid }: { gid: string }) {
  return (
    <div
      data-track-h
      aria-hidden
      className="pointer-events-none relative hidden select-none lg:block"
      style={{ height: TRACK_H }}
    >
      {/* year boundaries: a tick through the main line, the year above */}
      {YEARS.map((y) => (
        <span key={y.label} className="absolute top-0" style={{ left: at(y.month) }}>
          <span className="t-mono block text-[10px]! leading-none text-ash">{y.label}</span>
          <span className="absolute left-0 w-px bg-white/15" style={{ top: TOP - 6, height: 13 }} />
        </span>
      ))}

      {/* main line: laid up to the station and its buffer stop, then dashed
          and fading: the next chapter */}
      <span className="absolute left-0 h-px bg-white/[0.07]" style={{ top: TOP, width: at(H.station) }} />
      {/* a tick for every month under it, like a rule: twenty of them,
          one every 5% of this span */}
      <span
        className="absolute left-0 h-[4px]"
        style={{
          top: TOP + 1,
          width: at(H.station),
          backgroundImage: "repeating-linear-gradient(90deg, rgb(255 255 255 / 0.13) 0 1px, transparent 1px 5%)",
        }}
      />
      <span
        className="absolute right-0 h-px"
        style={{
          top: TOP,
          left: `calc(${at(H.end)} + 9px)`,
          backgroundImage: "repeating-linear-gradient(90deg, rgb(237 237 230 / 0.2) 0 4px, transparent 4px 10px)",
          maskImage: "linear-gradient(90deg, #000 10%, transparent 85%)",
          WebkitMaskImage: "linear-gradient(90deg, #000 10%, transparent 85%)",
        }}
      />

      {/* branch line, to its buffer stop */}
      <span className="absolute left-0 h-px bg-white/[0.06]" style={{ top: LOW, width: at(H.stop) }} />
      <BufferStop left={at(H.stop)} top={LOW} />

      {/* the main line's own buffer stop, just past Afferex */}
      <span className="absolute h-px bg-white/[0.07]" style={{ top: TOP, left: at(H.station), width: at(H.end - H.station) }} />
      <BufferStop left={at(H.end)} top={TOP} />

      {/* the switch, unlit underneath and lit on top */}
      <Curve orient="h" gid={gid} />

      {/* the lit route */}
      <span
        data-h-lit-a
        className="absolute left-0 h-px origin-left"
        style={{ top: LOW, width: at(H.wrap), background: `linear-gradient(90deg, ${BRANCH_FROM}, ${BRANCH_TO})` }}
      />
      <span
        data-h-lit-b
        className="absolute h-px origin-left bg-acid"
        style={{ top: TOP, left: at(H.join), width: at(H.station - H.join) }}
      />
      <span
        data-h-lit-c
        className="absolute h-px origin-left"
        style={{
          top: TOP,
          left: at(H.station),
          width: at(H.end - H.station),
          background: `linear-gradient(90deg, ${ACID}, rgb(224 137 90 / 0.35))`,
        }}
      />

      {/* where the switch sits: a label on the line, metro-map style */}
      <span
        className="t-mono absolute z-[5] -translate-x-1/2 -translate-y-1/2 rounded-full border border-white/12 bg-void px-2 py-[3px] text-[9px]! leading-none text-bone/70"
        style={{ left: at((H.wrap + H.join) / 2), top: (TOP + LOW) / 2 + 0.5 }}
      >
        Pivot
      </span>

      {/* stations, with a stub down to each card */}
      <span className="absolute w-px bg-white/10" style={{ left: 0, top: LOW, height: TRACK_H - LOW }} />
      <span
        data-h-drop-b
        className="absolute w-px origin-top"
        style={{
          left: at(H.station),
          top: TOP,
          height: TRACK_H - TOP,
          background: `linear-gradient(180deg, ${ACID}, rgb(224 137 90 / 0.35))`,
        }}
      />

      <span data-r-a-h className="absolute z-[4] -ml-[5.5px] -mt-[5.5px]" style={{ left: 0, top: LOW + 0.5 }}>
        <NodeA />
      </span>
      <span data-r-b-h className="absolute z-[4] -ml-[7.5px] -mt-[7.5px]" style={{ left: at(H.station), top: TOP + 0.5 }}>
        <NodeB m="h" />
      </span>
    </div>
  );
}

/* ============================================================
   PHONE SWITCH
   The strip between the two stacked cards: the branch runs on to its
   buffer stop while the route curves across to the main line.
   ============================================================ */
function SwitchV({ gid }: { gid: string }) {
  return (
    <div aria-hidden className="pointer-events-none relative select-none lg:hidden" style={{ height: STRIP_H }}>
      <span className="absolute top-0 w-px bg-white/[0.06]" style={{ left: V_A, height: 34 }} />
      <span className="absolute h-[1.5px] w-[11px] bg-ash-dim" style={{ left: V_A - 5, top: 34 }} />
      <Curve orient="v" gid={gid} />
      <span
        className="t-mono absolute left-11 z-[5] -translate-y-1/2 rounded-full border border-white/12 bg-void px-2 py-[3px] text-[9px]! leading-none text-bone/70"
        style={{ top: STRIP_H / 2 }}
      >
        Pivot
      </span>
    </div>
  );
}

/* The S-bend of the switch. Stretched to its box with non-scaling
   strokes, so it stays a hairline at any width. */
function Curve({ orient, gid }: { orient: "h" | "v"; gid: string }) {
  const h = orient === "h";
  /* The box sits on whole pixels, because Chrome snaps an SVG's box to
     the pixel grid and a half-pixel top would land the curve a hair off
     the rails it joins. The half pixel that puts the stroke on the rails'
     centre line moves into the path instead: 1.25 units of the 40px
     height, or 3.125 units of the 16px width. */
  const d = h ? "M0 101.25 C50 101.25 50 1.25 100 1.25" : "M3.125 0 C3.125 50 103.125 50 103.125 100";
  const id = `${gid}-${orient}`;
  const style = h
    ? { left: at(H.wrap), width: at(H.join - H.wrap), top: TOP, height: LOW - TOP }
    : { left: V_A, width: V_B - V_A, top: 0, height: STRIP_H };
  const svg = "absolute overflow-visible";
  return (
    <>
      <svg className={svg} style={style} viewBox="0 0 100 100" preserveAspectRatio="none">
        <path d={d} fill="none" stroke="rgb(255 255 255 / 0.08)" strokeWidth={1} vectorEffect="non-scaling-stroke" />
      </svg>
      <svg
        {...{ [h ? "data-h-lit-curve" : "data-v-lit-curve"]: "" }}
        {...{ [h ? "data-r-curve-h" : "data-r-curve-v"]: "" }}
        className={svg}
        style={style}
        viewBox="0 0 100 100"
        preserveAspectRatio="none"
      >
        <defs>
          <linearGradient id={id} x1="0" y1="0" x2={h ? "1" : "0"} y2={h ? "0" : "1"}>
            <stop offset="0%" stopColor="#edede6" stopOpacity={0.55} />
            <stop offset="100%" stopColor={ACID} />
          </linearGradient>
        </defs>
        <path d={d} fill="none" stroke={`url(#${id})`} strokeWidth={1.25} vectorEffect="non-scaling-stroke" />
      </svg>
    </>
  );
}

/* Psquare's station: a dim hollow ring. */
function NodeA() {
  return (
    <span className="flex h-[11px] w-[11px] items-center justify-center rounded-full border border-ash-dim bg-void">
      <span className="h-[3px] w-[3px] rounded-full bg-ash-dim" />
    </span>
  );
}

/* The end of a line: an upright bar with two short arms toward the
   track, the way a buffer stop is drawn on a railway diagram. */
function BufferStop({ left, top }: { left: string; top: number }) {
  return (
    <>
      <span className="absolute w-[1.5px] bg-ash-dim" style={{ left, top: top - 5, height: 11 }} />
      <span className="absolute h-px w-[5px] bg-ash-dim" style={{ left: `calc(${left} - 5px)`, top: top - 5 }} />
      <span className="absolute h-px w-[5px] bg-ash-dim" style={{ left: `calc(${left} - 5px)`, top: top + 5 }} />
    </>
  );
}

/* Afferex's station: the same hollow ring as Psquare's, in copper
   because it is the latest stop on the line. The outer span carries the
   scale the draw gives it, so it is kept bare. */
function NodeB({ m }: { m: "h" | "v" }) {
  return (
    <span {...{ [`data-node-b-${m}`]: "" }} className="relative block h-[15px] w-[15px]">
      <span className="absolute inset-0 flex items-center justify-center rounded-full border border-acid/70 bg-void">
        <span className="h-[4px] w-[4px] rounded-full bg-acid" />
      </span>
    </span>
  );
}

/* ============================================================
   CARD
   ============================================================ */
function Card({ v, index }: { v: Venture; index: number }) {
  const first = index === 0;
  /* The most recent venture reads brighter, whether or not it is running. */
  const latest = index === ventures.items.length - 1;
  /* Phone: which rail this card hangs from. */
  const rail = first ? V_A : V_B;

  return (
    <article aria-labelledby={`venture-${index}`} className="relative pb-2 pl-11 pt-0 lg:pl-6 lg:pt-6">
      {/* --- phone rail ---------------------------------------------- */}
      <span aria-hidden className="pointer-events-none lg:hidden">
        {first ? (
          <>
            <span data-v-rail-a className="absolute bottom-0 w-px bg-white/[0.06]" style={{ left: rail, top: 10 }} />
            <span
              data-v-lit-a
              className="absolute bottom-0 w-px origin-top"
              style={{ left: rail, top: 10, background: `linear-gradient(180deg, ${BRANCH_FROM}, ${BRANCH_TO})` }}
            />
            <span data-r-a-v className="absolute z-[4]" style={{ left: rail + 0.5 - 5.5, top: 10 - 5.5 }}>
              <NodeA />
            </span>
          </>
        ) : (
          <>
            {/* the last few pixels of the route, from the switch into the
                station, then the line runs on down the card */}
            <span data-v-lit-b className="absolute top-0 w-px origin-top bg-acid" style={{ left: rail, height: 10 }} />
            <span
              data-v-drop-b
              className="absolute bottom-0 w-px origin-top"
              style={{ left: rail, top: 10, background: "linear-gradient(180deg, rgb(224 137 90 / 0.55), rgb(224 137 90 / 0))" }}
            />
            <span data-r-b-v className="absolute z-[4]" style={{ left: rail + 0.5 - 7.5, top: 10 - 7.5 }}>
              <NodeB m="v" />
            </span>
          </>
        )}
      </span>

      {/* --- desktop edge: the station's stub carries on down the card -- */}
      <span
        aria-hidden
        {...(first ? {} : { "data-h-edge-b": "" })}
        className="pointer-events-none absolute bottom-0 left-0 top-0 hidden w-px origin-top lg:block"
        style={{
          background: first
            ? "linear-gradient(180deg, rgb(255 255 255 / 0.1), rgb(255 255 255 / 0))"
            : "linear-gradient(180deg, rgb(224 137 90 / 0.45), rgb(224 137 90 / 0))",
        }}
      />

      {/* --- copy. Its [data-rise] rows are what the reveal staggers. --- */}
      <div data-v-body className="flex min-w-0 flex-col items-start">
        <p data-rise className="mb-4 flex h-5 items-center">
          <span
            className={`t-mono inline-flex items-center rounded-full border px-2.5 py-1 text-[10px]! leading-none ${
              v.live ? "border-acid/40 text-acid" : "border-white/10 text-ash"
            }`}
          >
            {v.status}
          </span>
        </p>

        <h3
          data-rise
          id={`venture-${index}`}
          className={`t-display max-w-full text-[length:clamp(1.9rem,9vw,2.75rem)] leading-[0.95] [overflow-wrap:anywhere] lg:text-[length:clamp(2rem,2.6vw,2.8rem)] ${
            latest ? "text-bone" : "text-bone/55"
          }`}
        >
          {v.name}
        </h3>

        <p data-rise className="t-mono mt-4 text-ash">
          {v.role}
          <span aria-hidden className="px-2 text-ash-dim">
            ·
          </span>
          <span className="sr-only">, </span>
          {v.period}
        </p>

        <p data-rise className="t-serif mt-1.5 text-lg text-bone/70 md:text-xl">
          {v.kind}
        </p>

        <p data-rise className="mt-4 max-w-[60ch] text-sm font-light leading-relaxed text-ash md:text-[15px]">
          {v.body}
        </p>

        <ul data-rise aria-label="In short" className="mt-5 flex flex-wrap gap-2">
          {v.facts.map((f) => (
            <li
              key={f}
              className={`t-mono rounded-full border px-2.5 py-1.5 text-[10px]! leading-none text-ash ${
                latest ? "border-white/15" : "border-white/[0.08]"
              }`}
            >
              {f}
            </li>
          ))}
        </ul>
      </div>
    </article>
  );
}
