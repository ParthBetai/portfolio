"use client";

import { Fragment, useEffect, useId, useRef } from "react";
import type { RefObject } from "react";
import { gsap, playOnce } from "@/lib/motion";
import { identity, intro } from "@/lib/content";
import Ambassador from "./Ambassador";

/* ============================================================
   THE SHORT VERSION, ON A TICKET
   The one facts card on the page, printed on cream card stock like a
   tram or bus ticket: the title and the name across the top, four cells
   two by two (where he works from, what he is doing, and what he is
   available to work as), and a stub past a dashed tear line with a
   punched hole and the taxi printed in one ink. One column on a phone,
   with the stub kept on the right.

   It answers what a photo and its caption would, in plain words. The
   last cell is the only moving part: the roles he is open to roll
   through one at a time, each on a marker band, so the eye finds the
   one thing on the card that changes.
   ============================================================ */

export default function FactsTicket() {
  const card = useRef<HTMLDivElement>(null);
  /* The roller waits for its own cell, not for the card: the card's top
     edge comes into view well before its last row does. */
  const rolling = useRef<HTMLDivElement>(null);
  const titleId = useId();

  /* The cells settle in one after another, like a list being read out,
     once. Nothing is pre-hidden in CSS, so without this they are just
     there. */
  useEffect(() => {
    const el = card.current;
    if (!el) return;
    return playOnce(
      el.querySelectorAll<HTMLElement>("[data-fact]"),
      { y: 16, opacity: 0 },
      { y: 0, opacity: 1, duration: 0.7, ease: "expo.out", stagger: 0.06 },
      { at: 0.88 }
    );
  }, []);

  return (
    <div ref={card} role="group" aria-labelledby={titleId} className="ticket" data-ground="cream">
      <div className="tk-main">
        <div className="tk-head">
          <h3 id={titleId}>{intro.factsTitle}</h3>
          <span>{identity.fullName}</span>
        </div>
        <dl className="tk-grid">
          {intro.facts.map((fact) => (
            <div key={fact.label} data-fact>
              <dt>{fact.label}</dt>
              <dd>{fact.value}</dd>
            </div>
          ))}
          <div ref={rolling} data-fact className="roller">
            <dt>{intro.availableLabel}</dt>
            <dd>
              <Roller words={intro.available} watch={rolling} />
            </dd>
          </div>
        </dl>
      </div>
      {/* The stub: a punched hole and the car in the card's one ink. */}
      <div className="tk-stub" aria-hidden="true">
        <i className="punch" />
        <Ambassador variant="ink" width={64} />
      </div>
    </div>
  );
}

/* ============================================================
   ROLLER
   One list, one entry showing at a time, rolling up to the next.

   Two slots take turns: the current entry sits in flow and gives the box
   its size, the other waits below it, out of flow, for the next one. The
   box's width and height tween between the two, so the entry never snaps.

   The box shares one grid cell with an invisible copy of every entry, so
   the cell always stands as tall as the longest entry at the current
   width. The box resizes inside it; the ticket, and everything under it
   on the sheet, never moves while the list rolls.

   Screen readers get the list once, in order, with commas. The moving
   entry is aria-hidden, so nobody hears a new word announced every 1.8s.
   Before JS, and without it, the whole list shows as plain text.
   ============================================================ */

/* An entry sits still for HOLD, then rolls out over SWAP. Together they
   make the ~1.8s cadence: slow enough to read each one, quick enough that
   the list feels alive rather than stuck. */
const HOLD = 1.25;
const SWAP = 0.55;

type Watched = RefObject<HTMLElement | null>;

/* The marker band goes on an inline span inside the slot, not on the
   slot: the slot is an inline-block, so a band on it would paint the
   full width of the box under an entry that wraps to a second line. */
/* Layout size, not the on-screen box: the ticket is tilted, and the
   bounding rect of anything on it comes back a few pixels taller (and
   wider) than the box really is. Tweening to those numbers would grow the
   cell past its tallest entry on every roll. Fractional, unlike
   offsetWidth, so a pinned width never rounds down into a re-wrap. */
const size = (el: HTMLElement) => {
  const cs = getComputedStyle(el);
  return { width: parseFloat(cs.width), height: parseFloat(cs.height) };
};

const fill = (slot: HTMLElement, word: string) => {
  const mark = document.createElement("span");
  mark.className = "hlm";
  mark.textContent = word;
  slot.replaceChildren(mark);
};

function Roller({
  words,
  watch,
}: {
  words: readonly string[];
  /* Whose visibility pauses the loop. Defaults to the roller itself. */
  watch?: Watched;
}) {
  const wrap = useRef<HTMLSpanElement>(null);
  const list = useRef<HTMLSpanElement>(null);
  const stack = useRef<HTMLSpanElement>(null);
  const box = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    const wrapEl = wrap.current;
    const listEl = list.current;
    const stackEl = stack.current;
    const boxEl = box.current;
    const target = watch?.current ?? wrapEl;
    if (!wrapEl || !listEl || !stackEl || !boxEl || !target) return;

    const slots = Array.from(boxEl.querySelectorAll<HTMLElement>("[data-slot]"));
    if (words.length < 2 || slots.length < 2) return;

    /* Swap the static list for the rolling box. */
    listEl.hidden = true;
    stackEl.hidden = false;
    wrapEl.dataset.rolling = "";
    fill(slots[0], words[0]);
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
         goes back to auto and follows the text again. */
      const from = size(boxEl);
      out.style.width = `${size(out).width}px`;
      out.style.position = "absolute";
      fill(next, words[index]);
      next.style.width = "";
      next.style.position = "";
      const to = size(boxEl);
      next.style.width = `${size(next).width}px`;
      current = 1 - current;

      /* The box clips, so the box widens ahead of a longer entry arriving,
         and narrows only once a longer one has mostly left; a width tween
         in step with the roll would slice letters. */
      const grows = to.width >= from.width;

      swap = gsap
        .timeline({
          onComplete: () => {
            swap = undefined;
            gsap.set(boxEl, { clearProps: "width,height" });
            out.style.width = "";
            next.style.width = "";
          },
        })
        .fromTo(boxEl, { height: from.height }, { height: to.height, duration: SWAP, ease: "power3.inOut" }, 0)
        .fromTo(
          boxEl,
          { width: from.width },
          { width: to.width, duration: SWAP * 0.6, ease: grows ? "power2.out" : "power2.inOut" },
          grows ? 0 : SWAP * 0.4
        )
        /* Same ease and distance on both entries, so they read as one strip
           rolling up rather than two things crossing. */
        .fromTo(out, { yPercent: 0, opacity: 1 }, { yPercent: -100, opacity: 0, duration: SWAP, ease: "power3.inOut" }, 0)
        .fromTo(next, { yPercent: 100, opacity: 0 }, { yPercent: 0, opacity: 1, duration: SWAP, ease: "power3.inOut" }, 0);
    };

    /* The beat: hold, swap, repeat. One repeating timeline rather than a
       fresh delayedCall after every swap, because a chain re-arms from
       whichever frame the last swap happened to finish on and drifts. */
    const clock = gsap.timeline({ repeat: -1, paused: true });
    clock.call(roll, undefined, HOLD).to({}, { duration: SWAP }, HOLD);

    /* Nobody needs the list rolling while it is off screen. Pausing also
       means the first entry you see is held for its full beat. A pointer
       resting on the cell holds it too, so an entry can be read for as
       long as it takes (the list never stops on its own). */
    let seen = typeof IntersectionObserver === "undefined";
    let held = false;
    const run = () => {
      if (seen && !held) {
        clock.resume();
        swap?.resume();
      } else {
        clock.pause();
        swap?.pause();
      }
    };
    const hold = () => {
      held = true;
      run();
    };
    const free = () => {
      held = false;
      run();
    };
    target.addEventListener("pointerenter", hold);
    target.addEventListener("pointerleave", free);

    let io: IntersectionObserver | undefined;
    if (seen) {
      run();
    } else {
      io = new IntersectionObserver((entries) => {
        seen = entries[entries.length - 1].isIntersecting;
        run();
      });
      io.observe(target);
    }

    return () => {
      io?.disconnect();
      target.removeEventListener("pointerenter", hold);
      target.removeEventListener("pointerleave", free);
      clock.kill();
      swap?.kill();
      /* clearProps "all" wipes the inline position and width as well as
         GSAP's own props, so a StrictMode remount starts from the markup. */
      gsap.set([boxEl, ...slots], { clearProps: "all" });
      slots.forEach((s) => {
        s.textContent = "";
      });
      stackEl.hidden = true;
      listEl.hidden = false;
      delete wrapEl.dataset.rolling;
    };
  }, [words, watch]);

  return (
    <span ref={wrap}>
      <span className="sr-only">{words.join(", ")}</span>
      {/* Each entry is its own inline-block, so the list wraps between
          entries and never leaves half of one at the start of the next
          line. The dot rides inside the entry before it. */}
      <span ref={list} aria-hidden="true">
        {words.map((w, i) => (
          <Fragment key={i}>
            <span className="inline-block">
              <span className="hlm">{w}</span>
              {i < words.length - 1 ? " ·" : null}
            </span>
            {i < words.length - 1 ? " " : null}
          </Fragment>
        ))}
      </span>
      {/* Shown only once the roller starts, so the list above is all a
          page without scripts ever has. Every child takes the same cell:
          the invisible sizers hold it at the tallest entry, and the box
          rolls inside it, laid out the same way so the heights agree. */}
      <span
        ref={stack}
        aria-hidden="true"
        hidden
        className="grid grid-cols-[minmax(0,1fr)] items-start justify-items-start"
      >
        {words.map((w, i) => (
          <span key={i} className="invisible max-w-full [grid-area:1/1]">
            <span className="inline-block">
              <span className="hlm">{w}</span>
            </span>
          </span>
        ))}
        {/* Empty in the markup on purpose: the effect fills the slots, so
            React never has text of its own in here to fight over. */}
        <span ref={box} className="relative max-w-full overflow-hidden [grid-area:1/1]">
          <span data-slot className="left-0 top-0 inline-block" />
          <span data-slot className="left-0 top-0 inline-block" />
        </span>
      </span>
    </span>
  );
}
