"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { gsap, ScrollTrigger, maxScroll } from "@/lib/motion";
import { strip } from "@/lib/content";

/* How long each one-liner stays up, and how long the roll to the next
   one takes. */
const HOLD_MS = 4000;
const ROLL_S = 0.7;

/* ============================================================
   STATUS STRIP
   The cream title strip across the top of every page, like the strip
   along the top edge of a drawing set: the circled initial and the name
   on the left, one line at a time from strip.lines in the middle (only
   above 1180px, where a whole line fits), and how much of the page has
   been seen on the right. It is opaque, so nothing on the sheets below
   shows through it, and it sits on its own cream ground for the focus
   ring and the cursor (data-ground).

   On the home page it waits behind the intro and slides down when the
   hero hands off (`show`); the name then jumps back to the hero (a plain
   hash link: SmoothScroll sends it through jumpTo). On every other page
   it is simply there and the name goes to the home page.
   Styles: .strip in app/styles/s2-chrome.css.
   ============================================================ */
export default function StatusStrip({ home = false, show = true }: { home?: boolean; show?: boolean }) {
  const bar = useRef<HTMLElement>(null);
  const lineBox = useRef<HTMLSpanElement>(null);
  const reel = useRef<HTMLSpanElement>(null);
  const [seen, setSeen] = useState(0);

  /* --- entrance ---------------------------------------------------- */
  /* On the home page the bar carries data-intro-hide, so the boot
     script's CSS keeps it invisible over the loader between first paint
     and hydration; the GSAP set below takes over from that. Without
     JavaScript neither applies and the bar is simply there. */
  useEffect(() => {
    const el = bar.current;
    if (!el || !home) return;
    const ctx = gsap.context(() => {
      if (!show) {
        gsap.set(el, { yPercent: -100, autoAlpha: 0 });
        return;
      }
      gsap.fromTo(
        el,
        { yPercent: -100, autoAlpha: 0 },
        { yPercent: 0, autoAlpha: 1, duration: 0.9, ease: "expo.out" }
      );
    }, bar);
    return () => ctx.revert();
  }, [home, show]);

  /* --- how much has been seen -------------------------------------- */
  /* A whole number of the way to the deepest scroll (end: "max"), so the
     state only changes a hundred times over the page however often the
     scroll fires. It reads 100, and the strip says "You've arrived", only
     at the very bottom: rounding would claim it half a percent early.
     ScrollTrigger refreshes whenever the page's height changes (the
     sheets report it, see useSheetStick), so the end follows the content
     fading in after the intro and the service rows opening.
     While scrolling it uses the trigger's own end, which ScrollTrigger
     worked out at its last refresh: asking for the page's height on every
     scrolled frame would make the browser lay the page out again in the
     middle of the scrubs' writes. maxScroll() is read once, at mount. */
  useEffect(() => {
    const read = (y: number, max: number) => {
      if (max < 2 || y >= max - 2) return 100;
      return Math.min(99, Math.max(0, Math.round((y / max) * 100)));
    };
    const fromTrigger = (self: ScrollTrigger) => setSeen(read(self.scroll(), self.end));
    const st = ScrollTrigger.create({
      start: 0,
      end: "max",
      onUpdate: fromTrigger,
      onRefresh: fromTrigger,
    });
    setSeen(read(window.scrollY, maxScroll()));
    return () => st.kill();
  }, []);

  /* --- keep focus out from under the bar ---------------------------- */
  /* A fixed bar covers whatever the browser scrolls a focused link to at
     the very top. Scroll padding the height of the bar makes Tab stop
     short of it. Measured, because the bar is shorter on phones. */
  useEffect(() => {
    const el = bar.current;
    if (!el || typeof ResizeObserver === "undefined") return;
    const html = document.documentElement;
    const prev = html.style.scrollPaddingTop;
    const ro = new ResizeObserver(() => {
      html.style.scrollPaddingTop = `${el.offsetHeight}px`;
    });
    ro.observe(el);
    return () => {
      ro.disconnect();
      html.style.scrollPaddingTop = prev;
    };
  }, []);

  /* --- the one-liners ---------------------------------------------- */
  /* The reel is every line stacked, with the first repeated at the end:
     each roll moves it up one row, and after the copy it jumps back to
     the real first line, which looks the same. The one thing in the
     navigation that loops. It holds while the tab is hidden, while the
     pointer rests on it, and while the line is not shown at all (1180px
     and narrower), so a line can be read to the end. */
  useEffect(() => {
    const el = reel.current;
    const box = lineBox.current;
    const n = strip.lines.length;
    if (!el || !box || n < 2 || !show) return;

    const step = 100 / (n + 1);
    let i = 0;
    let timer = 0;
    let tween: gsap.core.Tween | null = null;
    let resting = false;

    const hiddenLine = () => document.hidden || box.offsetParent === null;
    const schedule = () => {
      window.clearTimeout(timer);
      if (resting) return;
      timer = window.setTimeout(roll, HOLD_MS);
    };

    const roll = () => {
      /* Not shown: wait another hold rather than roll unseen. */
      if (hiddenLine()) {
        schedule();
        return;
      }
      i += 1;
      const done = () => {
        if (i >= n) {
          i = 0;
          gsap.set(el, { yPercent: 0 });
        }
        tween = null;
        schedule();
      };
      tween = gsap.to(el, { yPercent: -step * i, duration: ROLL_S, ease: "power3.inOut", onComplete: done });
    };

    const onVisibility = () => {
      if (document.hidden) window.clearTimeout(timer);
      else if (!tween) schedule();
    };
    const onEnter = () => {
      resting = true;
      window.clearTimeout(timer);
    };
    const onLeave = () => {
      resting = false;
      if (!tween) schedule();
    };

    schedule();
    document.addEventListener("visibilitychange", onVisibility);
    box.addEventListener("pointerenter", onEnter);
    box.addEventListener("pointerleave", onLeave);
    return () => {
      window.clearTimeout(timer);
      tween?.kill();
      gsap.set(el, { clearProps: "transform" });
      document.removeEventListener("visibilitychange", onVisibility);
      box.removeEventListener("pointerenter", onEnter);
      box.removeEventListener("pointerleave", onLeave);
    };
  }, [show]);

  /* The circled initial is decoration: the link is spoken by its
     aria-label, which starts with the visible name. */
  const name = (
    <>
      <i aria-hidden="true">{strip.name.charAt(0)}</i>
      {strip.name}
    </>
  );

  return (
    <header
      ref={bar}
      data-status-strip
      data-ground="cream"
      data-intro-hide={home ? "" : undefined}
      className="strip"
    >
      {home ? (
        <a href="#home" aria-label={`${strip.name}, back to top`} data-hover className="sname">
          {name}
        </a>
      ) : (
        <Link href="/" aria-label={`${strip.name}, home page`} data-hover className="sname">
          {name}
        </Link>
      )}

      {/* The lines, once, for screen readers and text readers; the roll
          itself is decoration and is hidden from them, so nothing is
          announced every four seconds. */}
      <p className="sr-only">{strip.lines.join(" ")}</p>

      {/* Without scripts it shows the first line. */}
      <span ref={lineBox} aria-hidden="true" className="sline">
        <span ref={reel} className="reel">
          {[...strip.lines, strip.lines[0]].map((line, i) => (
            <span key={i}>{line}</span>
          ))}
        </span>
      </span>

      {/* Only scripts can count, so without them the reading steps aside
          (data-js-only) rather than claiming 0% all the way down. At the
          bottom of the page it becomes "You've arrived". */}
      <p data-js-only className="seen">
        {seen >= 100 ? (
          strip.arrived
        ) : (
          <>
            {strip.seen} <b>{seen}%</b>
          </>
        )}
      </p>
    </header>
  );
}
