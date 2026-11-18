"use client";

import { useEffect } from "react";
import Lenis from "lenis";
import { gsap, ScrollTrigger, jumpTo, soft } from "@/lib/motion";

/* The one Lenis instance, for jumpTo, the loader lock and the preview. */
declare global {
  interface Window {
    __lenis?: Lenis;
  }
}

/* Lenis drives the scroll position; ScrollTrigger reads it.
   Driving ScrollTrigger from GSAP's ticker (rather than Lenis's own RAF)
   keeps both on one loop, so triggers never evaluate against a stale
   scroll position, the usual cause of reveals firing a frame late.

   It also owns in-page jumps: any plain link to "#something" on this page
   (a sheet's index tab, the hero's buttons, a board, a footer link) goes
   through jumpTo, which lands on the anchor's natural position (honouring
   its scroll-margin-top) and moves focus there, in both motion levels.
   A component that handles its own click and calls preventDefault keeps
   its own behaviour. */
export default function SmoothScroll() {
  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
      const a = e.target instanceof Element ? e.target.closest("a[href]") : null;
      if (!a || (a.getAttribute("target") ?? "_self") !== "_self") return;
      const href = a.getAttribute("href") ?? "";
      /* "#work" and "/#work" while on the home page both mean "here". */
      const hash = href.startsWith("#") ? href : href.startsWith("/#") && location.pathname === "/" ? href.slice(1) : "";
      if (hash.length < 2) return;
      /* A malformed escape ("#%") throws: leave that link to the browser. */
      let id = "";
      try {
        id = decodeURIComponent(hash.slice(1));
      } catch {
        return;
      }
      if (!document.getElementById(id)) return;
      e.preventDefault();
      jumpTo(id, { focus: true });
    };
    /* Window, bubbling: React's own handlers (on the document) have run
       by then, so one that already took the click shows defaultPrevented. */
    window.addEventListener("click", onClick);
    return () => window.removeEventListener("click", onClick);
  }, []);

  useEffect(() => {
    /* Inertia is the one thing "soft" motion drops: it moves the page
       under the reader. Native scrolling, ScrollTrigger still works. */
    if (soft()) {
      ScrollTrigger.refresh();
      document.fonts?.ready.then(() => ScrollTrigger.refresh());
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

    /* Exposed for jumpTo and the nav's anchor scrolling. */
    window.__lenis = lenis;

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
      delete window.__lenis;
    };
  }, []);

  return null;
}
