"use client";

import { useEffect, useRef, useState } from "react";
import dynamic from "next/dynamic";
import { gsap, ScrollTrigger, reduced, soft } from "@/lib/motion";
import { identity } from "@/lib/content";
import { usePortrait } from "./Portrait";
import Dust from "./Dust";
import Magnetic from "./Magnetic";

const HeroOrb = dynamic(() => import("./HeroOrb"), { ssr: false });
const HeroPortrait = dynamic(() => import("./HeroPortrait"), { ssr: false });

/* ============================================================
   THE HERO IS THE LOADING SCREEN

   Same sequence as the reference, rebuilt:

   1. Your name sits dead centre in chrome type.
   2. It decodes into the hero word one letter at a time: the letter at
      the frontier flickers through glyphs before it lands, so it reads
      as a signal resolving rather than a string being swapped.
   3. The word glides up, the role and actions rise in on a stagger, and
      the centrepiece climbs from below the screen into place: Parth's
      photo as a lit relief that turns toward the pointer, or the chrome
      orb when there is no photo.

   The decode is the progress bar. It advances at a steady pace but
   cannot pass 80% until the fonts and the centrepiece are genuinely
   ready, so the visitor watches real loading, not a fixed timer, and
   a hard backstop finishes it regardless, so nobody is ever stuck here.
   ============================================================ */

const GLYPHS = "ABCDEFGHIJKLMNOPQRSTUVWXYZ#%&*+=/<>";
const MORPH_MS = 1700;
const HOLD = 0.8;
const BAIL_MS = 6000;

export default function Hero({ onDone }: { onDone: () => void }) {
  const root = useRef<HTMLElement>(null);
  const word = useRef<HTMLHeadingElement>(null);
  const pct = useRef<HTMLSpanElement>(null);
  const bar = useRef<HTMLSpanElement>(null);

  const doneCb = useRef(onDone);
  doneCb.current = onDone;

  const portrait = usePortrait();
  const [orbReady, setOrbReady] = useState(false);
  const [portraitReady, setPortraitReady] = useState(false);
  const [introDone, setIntroDone] = useState(false);

  /* Readiness is read inside the rAF loop, so it lives in refs. */
  const fontsReady = useRef(false);
  const centreReady = useRef(false);
  useEffect(() => {
    centreReady.current = portrait === "yes" ? portraitReady : portrait === "no" && orbReady;
  }, [portrait, orbReady, portraitReady]);

  useEffect(() => {
    if (!document.fonts) {
      fontsReady.current = true;
      return;
    }
    document.fonts.ready.then(() => (fontsReady.current = true));
  }, []);

  /* --- the loader ------------------------------------------------- */
  useEffect(() => {
    const el = word.current;
    if (!el) return;

    const target = identity.heroWord.toUpperCase();
    const from = identity.name.toUpperCase();

    /* Timers and the rAF loop are torn down explicitly rather than returned
       from the context callback, so cleanup never depends on how the
       context treats a returned function. */
    let teardown: (() => void) | undefined;

    const ctx = gsap.context(() => {
      /* Motion off: no intro at all, everything starts in place. */
      if (reduced()) {
        el.textContent = target;
        gsap.set("[data-loader-ui]", { display: "none" });
        /* The outro never runs, so place the word where it would have landed:
           at dead centre the centrepiece covers the role beneath it. */
        gsap.set("[data-word-pos]", { y: -window.innerHeight * (window.innerWidth < 768 ? 0.17 : 0.07) });
        setIntroDone(true);
        doneCb.current();
        return;
      }

      el.textContent = from;

      let p = 0;
      let frame = 0;
      let flicker = GLYPHS[0];
      let last = performance.now();
      let raf = 0;
      let started = false;

      const render = (v: number) => {
        const resolved = Math.floor(v * target.length);
        if (frame % 2 === 0) flicker = GLYPHS[(Math.random() * GLYPHS.length) | 0];
        let s = "";
        for (let n = 0; n < target.length; n++) {
          if (n < resolved) s += target[n];
          else if (n === resolved && v < 1) s += flicker;
          else if (n < from.length) s += from[n];
        }
        el.textContent = s;
        if (pct.current) pct.current.textContent = String(Math.round(v * 100)).padStart(3, "0");
        if (bar.current) bar.current.style.transform = `scaleX(${v})`;
      };

      const outro = () => {
        if (started) return;
        started = true;
        cancelAnimationFrame(raf);
        render(1);

        const mobile = window.innerWidth < 768;
        const tl = gsap.timeline({ onComplete: () => setIntroDone(true) });

        tl.to("[data-loader-ui]", { opacity: 0, y: 12, duration: 0.5, ease: "power2.out" }, 0)
          /* Word glides up to make room for the centrepiece. */
          .to(
            "[data-word-pos]",
            {
              y: -window.innerHeight * (mobile ? 0.17 : 0.07),
              duration: 1.5,
              ease: "power3.inOut",
            },
            0.2
          )
          .fromTo(
            "[data-intro-rise]",
            { y: "100vh" },
            { y: 0, duration: 1.5, ease: "power3.out" },
            0.45
          )
          .fromTo(
            "[data-intro-hide]",
            { y: 50, opacity: 0 },
            { y: 0, opacity: 1, duration: 1.2, stagger: 0.2, ease: "power3.out" },
            0.7
          )
          /* Hand off while the centrepiece is still climbing, so the nav
             and the rest of the page arrive with it, not after it. */
          .add(() => doneCb.current(), 1.0);
      };

      const tick = (now: number) => {
        raf = requestAnimationFrame(tick);
        frame++;
        /* Wall-clock, not per-frame: a slow machine drops frames, and a
           per-frame cap would stretch the intro with it. The cap only
           guards against a jump after the tab was hidden. */
        const dt = Math.min(now - last, 250);
        last = now;

        const ready = fontsReady.current && centreReady.current;
        const cap = ready ? 1 : HOLD;
        p = Math.min(cap, p + dt / MORPH_MS);
        render(p);

        if (p >= 1) outro();
      };
      raf = requestAnimationFrame(tick);

      /* Backstops. The first stops waiting on assets; the second finishes
         even if rAF never ran (a tab opened in the background). */
      const bail = window.setTimeout(() => {
        fontsReady.current = true;
        centreReady.current = true;
      }, BAIL_MS);
      const force = window.setTimeout(outro, BAIL_MS + 2500);

      teardown = () => {
        cancelAnimationFrame(raf);
        clearTimeout(bail);
        clearTimeout(force);
      };
    }, root);

    return () => {
      teardown?.();
      ctx.revert();
    };
  }, []);

  /* --- lighting --------------------------------------------------- */
  /* --shine positions the specular band on .chrome. Three inputs share one
     quickTo so they blend: an idle drift (the metal is never still), the
     cursor, and (in full motion only) a kick from scroll velocity. */
  useEffect(() => {
    const el = word.current;
    if (!el || reduced()) return;

    const proxy = { v: 50 };
    const setShine = gsap.quickTo(proxy, "v", {
      duration: 0.8,
      ease: "power3.out",
      onUpdate: () => el.style.setProperty("--shine", `${proxy.v}%`),
    });

    let pointer: number | null = null;
    const drift = gsap.to(
      { p: 0 },
      {
        p: 1,
        duration: 6,
        repeat: -1,
        yoyo: true,
        ease: "sine.inOut",
        onUpdate: function () {
          if (pointer !== null) return;
          setShine(12 + (this.targets()[0] as { p: number }).p * 76);
        },
      }
    );

    const onMove = (e: PointerEvent) => {
      pointer = 8 + (e.clientX / window.innerWidth) * 84;
      setShine(pointer);
    };
    window.addEventListener("pointermove", onMove, { passive: true });

    const st = soft()
      ? null
      : ScrollTrigger.create({
          trigger: root.current,
          start: "top top",
          end: "bottom top",
          onUpdate: (self) => {
            const kick = gsap.utils.clamp(-36, 36, self.getVelocity() / 120);
            setShine(gsap.utils.clamp(0, 100, (pointer ?? 50) + kick));
          },
        });

    return () => {
      drift.kill();
      st?.kill();
      window.removeEventListener("pointermove", onMove);
    };
  }, []);

  /* --- scroll exit ------------------------------------------------ */
  /* Created only after the intro, so it never fights the outro tweens.
     Scroll-linked, so it runs in soft motion too: the visitor drives it. */
  useEffect(() => {
    if (!introDone || reduced()) return;
    const ctx = gsap.context(() => {
      gsap
        .timeline({
          scrollTrigger: {
            trigger: root.current,
            start: "top top",
            end: "bottom top",
            scrub: soft() ? true : 1,
          },
        })
        .to("[data-word-scroll]", { yPercent: -45, scale: 1.16, ease: "none" }, 0)
        .to("[data-scroll-fade]", { opacity: 0, y: -40, ease: "none" }, 0)
        .to("[data-centre]", { y: 120, scale: 1.04, ease: "none" }, 0)
        .to("[data-hero-dust]", { opacity: 0.2, ease: "none" }, 0);
    }, root);
    return () => ctx.revert();
  }, [introDone]);

  const isOrb = portrait !== "yes";

  return (
    <section
      ref={root}
      id="home"
      className="relative h-[100svh] overflow-hidden [@media(min-height:640px)]:min-h-[600px]"
      style={{
        background:
          "radial-gradient(circle at 50% 46%, #1e1e23 0%, #0b0b0d 46%, #050505 80%)",
      }}
    >
      {/* Drifting dust: keeps the hero alive before any scroll. */}
      <div data-hero-dust className="absolute inset-0 opacity-80">
        <Dust />
      </div>

      {/* ---- the word, with the role and actions anchored to its edges -- */}
      {/* Every positioned box below is split in two: Tailwind centres the
          outer one and GSAP only ever moves the inner one. Tailwind's
          translate utilities set the CSS translate property, and when GSAP
          first parses an element that has one it folds it into its own
          transform, the -50% is lost and the box jumps by half its width. */}
      <div className="absolute left-1/2 top-1/2 z-0 -translate-x-1/2 -translate-y-1/2">
        <div data-word-pos>
        <div data-word-scroll className="relative will-change-transform">
          <h1
            ref={word}
            aria-label={identity.heroWord}
            className="t-display chrome whitespace-nowrap text-center text-[clamp(3.6rem,12.6vw,14rem)] leading-[0.82]"
            /* Slightly narrower than the other display type so PORTFOLIO fits
               the viewport: the role and actions anchor to its edges. */
            style={{ fontVariationSettings: '"wdth" 104' }}
          >
            {identity.name}
          </h1>

          {/* Role: under the word's left edge (centred on a phone). */}
          <div className="absolute left-1/2 top-full mt-6 -translate-x-1/2 md:left-[1.2%] md:mt-8 md:translate-x-0">
            <div data-scroll-fade>
              <p data-intro-hide className="flex items-baseline gap-2.5 whitespace-nowrap">
                <span className="t-display text-[1.35rem] leading-none text-bone md:text-[clamp(1.25rem,2.1vw,2.1rem)]">
                  Software
                </span>
                {/* A flex row draws no space; this one is for text readers. */}
                {" "}
                <span className="t-serif text-[1.7rem] leading-none text-ash md:text-[clamp(1.6rem,2.7vw,2.7rem)]">
                  Developer
                </span>
              </p>
            </div>
          </div>

          {/* Actions: under the word's right edge (stacked on a phone). */}
          <div className="absolute left-1/2 top-full mt-[4.6rem] -translate-x-1/2 md:left-auto md:right-[2%] md:mt-7 md:translate-x-0">
            <div data-scroll-fade>
            <div data-intro-hide className="flex items-center gap-3">
              <Magnetic strength={0.4}>
                <a
                  href="#about"
                  data-hover
                  aria-label="Scroll to about"
                  className="group grid h-11 w-11 place-items-center rounded-full border border-white/15 bg-black/20 text-bone backdrop-blur-md transition-colors duration-300 hover:border-acid hover:text-acid md:h-12 md:w-12"
                >
                  <svg
                    width="15"
                    height="15"
                    viewBox="0 0 24 24"
                    fill="none"
                    aria-hidden
                    className="transition-transform duration-500 group-hover:rotate-45"
                  >
                    <path
                      d="M17 7L7 17M7 17h9M7 17V8"
                      stroke="currentColor"
                      strokeWidth="2.2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                </a>
              </Magnetic>
              <Magnetic strength={0.3}>
                <a
                  href="#contact"
                  data-hover
                  className="block rounded-full border border-white/15 bg-black/20 px-6 py-3 backdrop-blur-md transition-colors duration-300 hover:border-acid"
                >
                  <span className="t-serif text-lg leading-none text-bone">Contact</span>
                </a>
              </Magnetic>
            </div>
            </div>
          </div>
        </div>
        </div>
      </div>

      {/* ---- centrepiece: Parth's photo, or the chrome orb ----------- */}
      {/* The portrait box is the relief's canvas: 0.9 wide per 1 high, the
          photo filling its height and the middle ~79% of its width, so he
          can turn without clipping. On a desktop it stands on the hero's
          bottom edge with the waist fade just below the fold and the hair
          over the lower part of the word; the role line scales with the
          width so it always ends before his head. On a phone, and on a tablet
          held upright, it is sized by width (on a phone the figure is ~93vw
          and the transparent sides are clipped by the section) and hung
          from the word's line so the head clears the role and the Contact
          button whatever the screen's height. */}
      <div
        className={`pointer-events-none absolute left-1/2 z-10 -translate-x-1/2 ${
          isOrb
            ? "bottom-[-13vh] h-[min(66vh,640px)] w-[min(66vh,640px)] max-md:bottom-[-4vh] max-md:h-[min(118vw,560px)] max-md:w-[min(118vw,560px)]"
            : "bottom-[-9%] aspect-[0.9] h-[min(74%,52vw)] max-md:top-[calc(33%+168px-14.75vw)] max-md:bottom-auto max-md:h-auto max-md:w-[118vw] md:portrait:top-[calc(43%+91px-4.9vw)] md:portrait:bottom-auto md:portrait:h-auto md:portrait:w-[81vw]"
        }`}
      >
        <div data-centre className="h-full w-full will-change-transform">
          <div data-intro-rise className="h-full w-full">
            {portrait === "yes" && (
              <HeroPortrait label={identity.fullName} onReady={() => setPortraitReady(true)} />
            )}
            {portrait === "no" && <HeroOrb onReady={() => setOrbReady(true)} />}
          </div>
        </div>
      </div>

      {/* Ground fade, so the centrepiece stands on the page. */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 bottom-0 z-20 h-36"
        style={{ background: "linear-gradient(to top, #050505 10%, transparent)" }}
      />

      {/* ---- loader readout --------------------------------------------
          Decoration, so hidden from screen readers: after the outro it is
          only faded out, and would still read "Loading 100". Without
          scripts it never moves, so it is not shown at all. */}
      <div data-loader-ui data-js-only aria-hidden className="pointer-events-none absolute inset-x-0 bottom-0 z-30 gutter pb-7">
        <div className="t-mono flex items-end justify-between text-ash">
          <span>Loading</span>
          <span ref={pct} className="tabular-nums text-bone">
            000
          </span>
        </div>
        <div className="mt-3 h-px w-full overflow-hidden bg-white/10">
          <span
            ref={bar}
            className="block h-full w-full origin-left bg-bone/70"
            style={{ transform: "scaleX(0)" }}
          />
        </div>
      </div>
    </section>
  );
}
