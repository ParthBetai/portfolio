"use client";

import { useEffect } from "react";
import Lenis from "lenis";
import { gsap, ScrollTrigger, soft } from "@/lib/motion";

/* Lenis drives the scroll position; ScrollTrigger reads it.
   Driving ScrollTrigger from GSAP's ticker (rather than Lenis's own RAF)
   keeps both on one loop, so triggers never evaluate against a stale
   scroll position, the usual cause of reveals firing a frame late. */
export default function SmoothScroll() {
  useEffect(() => {
    /* Inertia is the one thing "soft" motion drops: it moves the page
       under the reader. Native scrolling, ScrollTrigger still works. */
    if (soft()) {
      ScrollTrigger.refresh();
      return;
    }

    const lenis = new Lenis({
      duration: 1.05,
      /* Long, flat tail, the page keeps a little mass after you let go
         without feeling like it's fighting you. */
      easing: (t: number) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      touchMultiplier: 1.6,
    });

    lenis.on("scroll", ScrollTrigger.update);

    const tick = (time: number) => lenis.raf(time * 1000);
    gsap.ticker.add(tick);
    gsap.ticker.lagSmoothing(0);

    /* Expose for the nav's anchor scrolling. */
    (window as unknown as { __lenis?: Lenis }).__lenis = lenis;

    /* Lenis owns the scroll position, so native keyboard scrolling either
       does nothing or gets snapped back on the next frame. Route the
       scroll keys through Lenis instead, without this the page is
       unusable for anyone not using a wheel or trackpad. */
    const onKey = (e: KeyboardEvent) => {
      /* A key event normally targets the focused element, but one sent to
         the document or window has no closest(), so check first. */
      const el = e.target instanceof Element ? e.target : null;
      /* Never hijack typing, or a control that handles its own keys. */
      if (
        el?.closest("input, textarea, select, [contenteditable=''], [contenteditable='true']")
      ) {
        return;
      }

      const page = window.innerHeight * 0.9;
      const line = 80;
      let to: number | null = null;

      switch (e.key) {
        case "End":
          to = document.documentElement.scrollHeight;
          break;
        case "Home":
          to = 0;
          break;
        case "PageDown":
          to = lenis.scroll + page;
          break;
        case "PageUp":
          to = lenis.scroll - page;
          break;
        case "ArrowDown":
          to = lenis.scroll + line;
          break;
        case "ArrowUp":
          to = lenis.scroll - line;
          break;
        case " ":
          /* Space scrolls, Shift+Space scrolls back, but not when it
             would swallow activating a focused button. */
          if (el?.closest("button, a, [role='button']")) return;
          to = lenis.scroll + (e.shiftKey ? -page : page);
          break;
        default:
          return;
      }

      e.preventDefault();
      lenis.scrollTo(to, { duration: 0.8 });
    };
    window.addEventListener("keydown", onKey);

    /* Fonts change metrics, which changes every trigger's start/end. */
    document.fonts?.ready.then(() => ScrollTrigger.refresh());

    return () => {
      window.removeEventListener("keydown", onKey);
      gsap.ticker.remove(tick);
      lenis.destroy();
      delete (window as unknown as { __lenis?: Lenis }).__lenis;
    };
  }, []);

  return null;
}
