"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import SmoothScroll from "@/components/SmoothScroll";
import StatusStrip from "@/components/StatusStrip";
import BottomNav from "@/components/BottomNav";
import HomeSheet from "@/components/HomeSheet";
import AboutSheet from "@/components/AboutSheet";
import ServicesSheet from "@/components/ServicesSheet";
import WorkSheet from "@/components/WorkSheet";
import JourneySheet from "@/components/JourneySheet";
import ContactSheet from "@/components/ContactSheet";
import { gsap, ScrollTrigger, driveRoute, jumpTo } from "@/lib/motion";

export default function Page() {
  /* Flips when the hero's intro hands off: the nav slides in, the page
     unlocks, and every sheet after the first fades up. */
  const [done, setDone] = useState(false);
  const main = useRef<HTMLElement>(null);
  const foot = useRef<HTMLElement>(null);

  const onDone = useCallback(() => setDone(true), []);

  /* Always start at the top, a restored scroll position would drop the
     visitor into the middle of the page behind the intro. */
  useEffect(() => {
    if ("scrollRestoration" in history) history.scrollRestoration = "manual";
    window.scrollTo(0, 0);
  }, []);

  /* Scroll is locked for the length of the intro, and pinned to the top:
     browser Back into this page can restore the old position after the
     effect above has run, which would leave the intro playing off screen
     over a blank, locked page. */
  useEffect(() => {
    if (done) return;
    const html = document.documentElement;
    const lenis = window.__lenis;
    html.style.overflow = "hidden";
    lenis?.stop();
    const top = () => {
      if (window.scrollY) window.scrollTo(0, 0);
    };
    top();
    window.addEventListener("scroll", top, { passive: true });
    return () => {
      window.removeEventListener("scroll", top);
      html.style.overflow = "";
      window.__lenis?.start();
    };
  }, [done]);

  /* The taxi route: the small taxi drives it with the scroll, from the
     Home stop to "You've arrived", and the line is solid behind it and
     pencilled ahead (driveRoute, THE JOURNEY in lib/motion.ts). */
  useEffect(() => {
    const el = main.current;
    if (!el) return;
    return driveRoute(el, { car: true });
  }, []);

  /* Every sheet after the first: hidden during the intro, then fades up.
     The rise is a relative `top` offset on each slot, not a transform.
     Any transform on a slot, even for the second it takes to play, makes
     it the containing block for the contact sheet's fixed pin wall, which
     would then size itself to the whole page instead of the viewport.
     The footer is part of the Contact sheet, so it arrives with it. */
  useEffect(() => {
    const el = main.current;
    if (!el) return;
    const slots = Array.from(el.querySelectorAll<HTMLElement>(":scope > .sheet-slot")).slice(1);
    if (!slots.length) return;
    if (!done) {
      gsap.set(slots, { autoAlpha: 0 });
      return;
    }
    gsap.fromTo(
      slots,
      { autoAlpha: 0, top: 60 },
      {
        autoAlpha: 1,
        top: 0,
        duration: 1.1,
        ease: "power3.out",
        clearProps: "top",
        onComplete: () => ScrollTrigger.refresh(),
      }
    );
  }, [done]);

  /* Arriving from another page's footer ("/#contact"): the intro always
     starts at the top, so once it hands off, travel to the sheet the link
     asked for. */
  useEffect(() => {
    if (!done) return;
    /* A mangled share link ("#%") makes the decode throw, and an
       uncaught throw here would take the whole page down with it. */
    let id = "";
    try {
      id = decodeURIComponent(window.location.hash.slice(1));
    } catch {
      return;
    }
    if (!id) return;
    const t = window.setTimeout(() => jumpTo(id, { focus: true }), 1200);
    return () => window.clearTimeout(t);
  }, [done]);

  /* The six sheets of the drawing set, in order (lib/content.ts sheets).
     Each wrapper owns its sheet, its heading id and its piece of the
     route; see the sheet contract in the README. */
  return (
    <>
      <SmoothScroll />

      {/* The strip and the bottom nav wait behind the intro; the bottom nav
          steps aside while the footer's text rows pass behind it. */}
      <StatusStrip home show={done} />
      <BottomNav show={done} footer={foot} />

      <main id="main" ref={main} className="sheet-stack">
        <HomeSheet onDone={onDone} />
        <AboutSheet />
        <ServicesSheet />
        <WorkSheet />
        <JourneySheet />
        <ContactSheet footerRef={foot} />
      </main>
    </>
  );
}
