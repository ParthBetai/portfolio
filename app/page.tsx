"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import SmoothScroll from "@/components/SmoothScroll";
import Nav from "@/components/Nav";
import Hero from "@/components/Hero";
import Intro from "@/components/Intro";
import Marquee from "@/components/Marquee";
import Services from "@/components/Services";
import Work from "@/components/Work";
import Ventures from "@/components/Ventures";
import Contact from "@/components/Contact";
import Footer from "@/components/Footer";
import { gsap, ScrollTrigger, reduced } from "@/lib/motion";

type LenisLike = { stop?: () => void; start?: () => void };

export default function Page() {
  /* Flips when the hero's intro hands off: the nav slides in, the page
     unlocks, and everything below the hero fades up. */
  const [done, setDone] = useState(false);
  const rest = useRef<HTMLDivElement>(null);
  const foot = useRef<HTMLDivElement>(null);

  const onDone = useCallback(() => setDone(true), []);

  /* Always start at the top, a restored scroll position would drop the
     visitor into the middle of the page behind the intro. */
  useEffect(() => {
    if ("scrollRestoration" in history) history.scrollRestoration = "manual";
    window.scrollTo(0, 0);
  }, []);

  /* Scroll is locked for the length of the intro, like the reference. */
  useEffect(() => {
    if (done) return;
    const html = document.documentElement;
    const lenis = (window as unknown as { __lenis?: LenisLike }).__lenis;
    html.style.overflow = "hidden";
    lenis?.stop?.();
    return () => {
      html.style.overflow = "";
      (window as unknown as { __lenis?: LenisLike }).__lenis?.start?.();
    };
  }, [done]);

  /* Below-the-hero content: hidden during the intro, then fades up.
     The rise is a relative `top` offset, not a transform. Any transform on
     this wrapper, even for the second it takes to play, makes it the
     containing block for the contact section's fixed pin wall, which
     would then size itself to the whole page instead of the viewport. */
  useEffect(() => {
    const el = rest.current;
    if (!el || reduced()) return;
    /* The footer sits outside <main> (it is the page's footer landmark,
       not part of its content) but arrives with everything else. */
    const els = foot.current ? [el, foot.current] : [el];
    if (!done) {
      gsap.set(els, { autoAlpha: 0 });
      return;
    }
    gsap.fromTo(
      els,
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
     starts at the top, so once it hands off, travel to the section the
     link asked for. */
  useEffect(() => {
    if (!done) return;
    const id = decodeURIComponent(window.location.hash.slice(1));
    if (!id) return;
    const t = window.setTimeout(() => {
      const target = document.getElementById(id);
      if (!target) return;
      const lenis = (window as unknown as { __lenis?: { scrollTo?: (t: HTMLElement, o?: object) => void } })
        .__lenis;
      if (lenis?.scrollTo) lenis.scrollTo(target, { duration: 1.4 });
      else target.scrollIntoView({ behavior: "smooth" });
    }, 1200);
    return () => window.clearTimeout(t);
  }, [done]);

  return (
    <>
      <SmoothScroll />

      <Nav show={done} />

      <main id="main">
        <Hero onDone={onDone} />
        <div ref={rest} className="relative">
          <Intro />
          <Marquee />
          <Services />
          <Work />
          <Ventures />
          <Contact />
        </div>
      </main>
      <div ref={foot} className="relative">
        <Footer />
      </div>
    </>
  );
}
