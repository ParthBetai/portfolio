"use client";

import { Fragment, useEffect, useId, useRef } from "react";
import type { RefObject } from "react";
import { gsap, ScrollTrigger, reduced, parseAccent } from "@/lib/motion";
import { identity, intro } from "@/lib/content";
import ResumeDisk from "./ResumeDisk";

/* ============================================================
   INTRO / ABOUT
   Two columns on a desktop: a portrait slot on the left, and on the right
   a chrome heading over a frosted card holding the paragraph. On a phone
   the heading moves above both, centred, so the section still opens with
   its name before anything else.

   The paragraph is the section's event: each word lifts from dim to full
   as it passes through the viewport, so reading speed and scroll speed
   become the same gesture. Words are rendered as spans in the markup
   rather than split at runtime. The accent italics survive, and the text
   is complete and legible in the HTML whether or not JS ever runs.
   ============================================================ */

export default function Intro() {
  const root = useRef<HTMLElement>(null);
  const heading = useRef<HTMLHeadingElement>(null);
  const paragraph = useRef<HTMLParagraphElement>(null);

  /* A second, background-removed photo (intro.photo in content.ts) can
     take the left column. Without one the slot holds a short card of plain
     facts: the things a photo caption would tell you, written the way a
     person would say them. A setting rather than a probe, so the page
     never asks the server for a file that isn't there. */
  const photo = intro.photo;

  useEffect(() => {
    const ctx = gsap.context(() => {
      /* Nothing is pre-hidden in CSS, so skipping the tweens is enough. */
      if (reduced()) return;

      const h = heading.current;
      const p = paragraph.current;

      /* Exact reference values. `reverse` on leave-back means the heading
         sinks away again if you scroll back above it, so it re-arrives
         every time rather than being spent after the first pass. */
      if (h) {
        gsap.fromTo(
          h,
          { y: 100, opacity: 0 },
          {
            y: 0,
            opacity: 1,
            duration: 1,
            ease: "power3.out",
            scrollTrigger: { trigger: h, start: "top 85%", toggleActions: "play none none reverse" },
          }
        );
      }

      /* The word scrub. Colour and opacity move together: opacity alone
         leaves the dim words reading as grey-on-grey mush, colour alone
         keeps them too loud. Linear ease + raw scrub so the lit edge sits
         exactly where the scroll position says it should. */
      if (p) {
        const words = p.querySelectorAll<HTMLElement>(".word");
        gsap.fromTo(
          words,
          { color: "#52525b", opacity: 0.2 },
          {
            color: "#edede6",
            opacity: 1,
            stagger: 0.1,
            ease: "none",
            scrollTrigger: { trigger: p, start: "top 85%", end: "bottom 50%", scrub: true },
          }
        );
      }
    }, root);

    return () => ctx.revert();
  }, []);

  const words = intro.body.trim().split(/\s+/);

  return (
    <section id="about" ref={root} className="gutter relative bg-void pb-20 pt-24 md:pt-32">
      {/* One grid, three children, so the phone order (heading, portrait,
          card) and the desktop placement (portrait left spanning both rows,
          heading and card stacked right) come from the same markup, with
          no duplicated heading for the two layouts. */}
      <div className="mx-auto grid max-w-7xl items-center gap-y-12 md:gap-y-16 lg:grid-cols-2 lg:gap-x-24 lg:gap-y-8">
        {/* self-end / self-start keep the heading and card touching at the
            row seam when the portrait is taller and the rows stretch. */}
        <header className="text-center lg:col-start-2 lg:row-start-1 lg:self-end lg:text-left">
          <p className="t-mono mb-4 text-ash md:mb-6">{intro.eyebrow}</p>
          {/* Title case, not the display face's uppercase: at wdth 125 an
              uppercase INTRO is wider than the lg column and would run out
              of the grid. Capped with clamp at lg for the same reason: the
              10.5rem reference size is reached on wide screens, but at
              1024px the column is too narrow for it. */}
          <h2
            ref={heading}
            className="t-display chrome text-[20vw] normal-case leading-[0.85] sm:text-[16vw] lg:text-[length:clamp(7rem,11vw,10.5rem)]"
          >
            {intro.heading}
          </h2>
        </header>

        <div className="flex justify-center lg:col-start-1 lg:row-span-2 lg:row-start-1">
          {/* The resume disk lies on the card's lower-right corner on a
              desktop, as if it was dropped on the desk next to it. It is
              positioned out of flow there, so the bottom padding is the
              room it hangs into. Below lg there is no room beside the
              card, so it sits under it in the normal flow instead. */}
          <div className="flex w-full max-w-md flex-col items-center lg:pb-[12rem]">
            <div className="group/facts relative flex w-full flex-col items-center">
              {photo ? (
                /* eslint-disable-next-line @next/next/no-img-element */
                <img
                  src={photo}
                  alt={`${identity.fullName}, ${identity.role}`}
                  draggable={false}
                  /* The cutout arrives after the card it replaces, and it is a
                     different height, so every trigger below this section needs
                     re-measuring once it has a size. */
                  onLoad={() => ScrollTrigger.refresh()}
                  className="h-auto w-56 object-contain drop-shadow-2xl md:w-64 lg:w-72"
                />
              ) : (
                <Facts />
              )}
              {/* While the rows are rolling, each shows one short entry, so
                  the disk can come up as far as the last row's rule: the
                  card has no text on the right there. The tilt is
                  anticlockwise so the corner that rises is the one out past
                  the card's edge, not the one near the rolling words. With
                  motion off (or before JS) the rows hold their full lists,
                  which run the whole width of the card, so the disk only
                  overlaps the card's bottom padding. It is absolute, so the
                  move shifts nothing else on the page. */}
              <ResumeDisk
                className="mt-10 lg:absolute lg:right-[-4.5rem] lg:top-[calc(100%-1rem)] lg:mt-0 lg:group-has-[[data-rolling]]/facts:top-[calc(100%-5.25rem)]"
                diskClassName="-rotate-3 lg:-rotate-6"
              />
            </div>
          </div>
        </div>

        <div className="mx-auto w-full max-w-2xl lg:col-start-2 lg:row-start-2 lg:max-w-none lg:self-start">
          <div className="glass rounded-3xl p-6 transition-colors duration-500 hover:border-white/15 hover:bg-white/[0.07] md:p-10">
            <p
              ref={paragraph}
              className="text-base font-light leading-relaxed text-bone md:text-lg lg:text-xl"
            >
              {words.map((raw, i) => (
                <Fragment key={i}>
                  <span className="word">
                    {parseAccent(raw).map((seg, j) =>
                      seg.accent ? (
                        <em key={j} className="t-serif">
                          {seg.text}
                        </em>
                      ) : (
                        <Fragment key={j}>{seg.text}</Fragment>
                      )
                    )}
                  </span>
                  {i < words.length - 1 ? " " : null}
                </Fragment>
              ))}
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}

/* ============================================================
   THE SHORT VERSION
   Stands in for the portrait, so it answers what a photo and its caption
   would: where he works from and what he's doing. It used to be a fake
   terminal typing out "whoami", which is the first thing every developer
   template reaches for. A list of facts in plain words reads like a
   person instead.

   The last row is the only moving part: the roles he's open to roll
   through their list one entry at a time, like a flip board, in copper so
   the eye finds the one thing on the card that changes.
   ============================================================ */

/* An entry sits still for HOLD, then rolls out over SWAP. Together they
   make the ~1.8s cadence: slow enough to read each one, quick enough that
   the list feels alive rather than stuck. */
const HOLD = 1.25;
const SWAP = 0.55;

function Facts() {
  const card = useRef<HTMLDivElement>(null);
  /* The roller waits for its own row, not for the card: the card's top
     edge comes into view a whole card height before its last row does,
     and by then it would already be a few entries in. */
  const rolling = useRef<HTMLDivElement>(null);
  const titleId = useId();

  useEffect(() => {
    const el = card.current;
    if (!el || reduced()) return;

    const ctx = gsap.context(() => {
      /* Rows settle in one after another, like a list being read out. */
      gsap.fromTo(
        el.querySelectorAll<HTMLElement>("[data-fact]"),
        { y: 16, opacity: 0 },
        {
          y: 0,
          opacity: 1,
          duration: 0.7,
          ease: "expo.out",
          stagger: 0.06,
          scrollTrigger: { trigger: el, start: "top 80%" },
        }
      );
    }, el);

    return () => ctx.revert();
  }, []);

  return (
    <div
      ref={card}
      role="group"
      aria-labelledby={titleId}
      className="glass w-full max-w-md rounded-2xl p-6 md:p-7"
    >
      <div className="flex items-center gap-2.5">
        <h3 id={titleId} className="t-mono text-ash">
          {intro.factsTitle}
        </h3>
      </div>

      <dl className="mt-4">
        {intro.facts.map((fact) => (
          <div key={fact.label} data-fact className="border-t border-white/[0.07] py-3.5">
            <dt className="t-mono text-[10px] text-ash md:text-[11px]">{fact.label}</dt>
            <dd className="mt-1 text-base leading-snug text-bone md:text-lg">{fact.value}</dd>
          </div>
        ))}

        {/* Last row, so no bottom padding: the card's own padding closes it. */}
        <div ref={rolling} data-fact className="border-t border-white/[0.07] pb-0 pt-3.5">
          <dt className="t-mono text-[10px] text-ash md:text-[11px]">{intro.availableLabel}</dt>
          <dd className="mt-1 text-base leading-snug text-acid md:text-lg">
            <Roller words={intro.available} watch={rolling} className="block" />
          </dd>
        </div>
      </dl>
    </div>
  );
}

/* ============================================================
   ROLLER
   One list, one entry showing at a time, rolling up to the next.

   Two slots take turns: the current entry sits in flow and gives the box
   its size, the other waits below it, out of flow, for the next one. The
   box's width and height tween between the two, so the row never snaps.

   Screen readers get the list once, in order, with commas. The moving
   entry is aria-hidden, so nobody hears a new word announced every 1.8s.
   With motion off, and before JS, the whole list shows as plain text.
   ============================================================ */

type Watched = RefObject<HTMLElement | null>;

function Roller({
  words,
  delay = 0,
  watch,
  className = "",
}: {
  words: readonly string[];
  /* Extra wait before the first swap, so two rollers can take turns. */
  delay?: number;
  /* Whose visibility pauses the loop. Rollers that share a card should
     share this, so they pause and resume on the same frame and keep
     their offset from each other. Defaults to the roller itself. */
  watch?: Watched;
  className?: string;
}) {
  const wrap = useRef<HTMLSpanElement>(null);
  const list = useRef<HTMLSpanElement>(null);
  const box = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    const wrapEl = wrap.current;
    const listEl = list.current;
    const boxEl = box.current;
    const target = watch?.current ?? wrapEl;
    if (!wrapEl || !listEl || !boxEl || !target) return;

    /* Motion off: the full list is already in the markup. One entry has
       nothing to roll to, and the static list already shows it. */
    if (reduced()) return;
    const slots = Array.from(boxEl.querySelectorAll<HTMLElement>("[data-slot]"));
    if (words.length < 2 || slots.length < 2) return;

    /* Swap the static list for the rolling box. data-rolling tells the
       layout around the card that each row is down to one short entry
       (see the resume disk in Intro). */
    listEl.hidden = true;
    boxEl.hidden = false;
    wrapEl.dataset.rolling = "";
    slots[0].textContent = words[0];
    slots[1].style.position = "absolute";
    gsap.set(slots[0], { yPercent: 0, opacity: 1 });
    gsap.set(slots[1], { yPercent: 100, opacity: 0 });

    /* Held outside any gsap context: the swaps are made on a timer, long
       after a context callback would have returned, so ctx.revert() would
       never see them. Cleanup kills everything by hand. */
    let swap: ReturnType<typeof gsap.timeline> | undefined;
    let index = 0;
    let current = 0;

    const roll = () => {
      /* A stall long enough to reach the next beat before this swap has
         landed: finish it on the spot rather than stack a second on it. */
      swap?.progress(1);
      const out = slots[current];
      const next = slots[1 - current];
      index = (index + 1) % words.length;

      /* Measure the box around the old entry, then hand the in-flow role
         to the new one and measure again. Both slots get their measured
         width pinned while the box tweens between the two sizes: an entry
         long enough to wrap on a narrow phone would otherwise re-wrap at
         every intermediate width and wobble. Once it lands, everything
         goes back to auto and follows the text again (font swaps,
         breakpoint changes) on its own. */
      const from = boxEl.getBoundingClientRect();
      out.style.width = `${out.getBoundingClientRect().width}px`;
      out.style.position = "absolute";
      next.textContent = words[index];
      next.style.width = "";
      next.style.position = "";
      const to = boxEl.getBoundingClientRect();
      next.style.width = `${next.getBoundingClientRect().width}px`;
      current = 1 - current;

      /* The box clips, so a width tween running in step with the roll
         slices letters: a longer entry comes in cut off on the right, a
         longer one going out loses its tail. So the box widens ahead of a
         longer entry arriving, and narrows only once a longer one has
         mostly left. */
      const grows = to.width >= from.width;

      swap = gsap
        .timeline({
          /* Dropped once spent, so the observer below only ever pauses and
             resumes something still running, never a finished animation. */
          onComplete: () => {
            swap = undefined;
            gsap.set(boxEl, { clearProps: "width,height" });
            out.style.width = "";
            next.style.width = "";
          },
        })
        .fromTo(boxEl, { height: from.height }, { height: to.height, duration: SWAP, ease: "power3.inOut" }, 0)
        /* fromTo renders its start at once, even when it is placed later
           in the timeline, so the box holds the old width until then
           instead of snapping to the new entry's for a frame. */
        .fromTo(
          boxEl,
          { width: from.width },
          { width: to.width, duration: SWAP * 0.6, ease: grows ? "power2.out" : "power2.inOut" },
          grows ? 0 : SWAP * 0.4
        )
        /* Same ease and distance on both entries, so they read as one strip
           rolling up rather than two things crossing. */
        .fromTo(
          out,
          { yPercent: 0, opacity: 1 },
          { yPercent: -100, opacity: 0, duration: SWAP, ease: "power3.inOut" },
          0
        )
        .fromTo(
          next,
          { yPercent: 100, opacity: 0 },
          { yPercent: 0, opacity: 1, duration: SWAP, ease: "power3.inOut" },
          0
        );
    };

    /* The beat: hold, swap, repeat. One repeating timeline rather than a
       fresh delayedCall after every swap, because a chain re-arms from
       whichever frame the last swap happened to finish on and loses that
       overshoot every cycle. On a busy page the drift adds up fast, and
       two rollers set half a cycle apart end up swapping in step. A repeat
       is measured from the timeline's own start, so the offset holds for
       as long as the page is open. */
    const clock = gsap.timeline({ repeat: -1, delay, paused: true });
    clock.call(roll, undefined, HOLD).to({}, { duration: SWAP }, HOLD);

    /* Nobody needs the list rolling while it is off screen. Pausing also
       means the first entry you see is held for its full beat instead of
       being caught halfway through a swap. */
    let io: IntersectionObserver | undefined;
    if (typeof IntersectionObserver === "undefined") {
      clock.play();
    } else {
      io = new IntersectionObserver((entries) => {
        if (entries[entries.length - 1].isIntersecting) {
          clock.resume();
          swap?.resume();
        } else {
          clock.pause();
          swap?.pause();
        }
      });
      io.observe(target);
    }

    return () => {
      io?.disconnect();
      clock.kill();
      swap?.kill();
      /* clearProps "all" wipes the inline position and width as well as
         GSAP's own props, so a StrictMode remount starts from the markup
         again. */
      gsap.set([boxEl, ...slots], { clearProps: "all" });
      slots.forEach((s) => {
        s.textContent = "";
      });
      boxEl.hidden = true;
      listEl.hidden = false;
      delete wrapEl.dataset.rolling;
    };
  }, [words, delay, watch]);

  return (
    <span ref={wrap} className={className}>
      <span className="sr-only">{words.join(", ")}</span>
      {/* Each entry is its own inline-block, so the list wraps between
          entries and never leaves half of one ("intern") at the start of
          the next line. The dot rides inside the entry before it, behind a
          non-breaking space. An entry wider than the card still wraps
          inside its own block. */}
      <span ref={list} aria-hidden>
        {words.map((w, i) => (
          <Fragment key={i}>
            <span className="inline-block">
              {w}
              {i < words.length - 1 ? "\u00a0·" : null}
            </span>
            {i < words.length - 1 ? " " : null}
          </Fragment>
        ))}
      </span>
      {/* Empty in the markup on purpose: the effect fills the slots, so
          React never has text of its own in here to fight over. align-
          bottom stops the clipped box sitting on the baseline and pushing
          an extra descender's worth of space under it. max-w-full lets a
          long entry wrap inside the card on a narrow phone rather than
          run out of it. */}
      <span
        ref={box}
        aria-hidden
        hidden
        className="relative inline-block max-w-full overflow-hidden align-bottom"
      >
        <span data-slot className="left-0 top-0 inline-block" />
        <span data-slot className="left-0 top-0 inline-block" />
      </span>
    </span>
  );
}
