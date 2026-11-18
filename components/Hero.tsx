"use client";

import { useEffect, useRef, useState } from "react";
import dynamic from "next/dynamic";
import { gsap } from "@/lib/motion";
import { hero, identity, nav, route, work } from "@/lib/content";
import { usePortrait, PORTRAIT_SRC } from "./Portrait";
import { Rail, Elbow, Stop, StopLabel } from "./Route";
import { Memorial, Facades, Railing, Robot, Dimension, Kerb, type Tone } from "./HeroScene";
import TaxiDrawing from "./TaxiDrawing";
import { createSpan, OUTRO } from "./LoaderBridge";
import { BlueprintMask, CopyLine, InkMask, createExposure, useExposure } from "./Exposure";

const HeroOrb = dynamic(() => import("./HeroOrb"), { ssr: false });
const HeroPortrait = dynamic(() => import("./HeroPortrait"), { ssr: false });

/* ============================================================
   SHEET 01: THE HERO, AND THE LOADER IN IT

   The first sheet of the drawing set, on cream: the ribbon, Parth's
   name sign-painted in navy with a stepped brick shade, the role under
   a highlighter swipe, one line of billing and two buttons; and on the
   right a drawn Kolkata street (HeroScene.tsx): the facades, the
   Victoria Memorial on a yellow halftone disc, Parth leaning on the
   Strand Road railing (the lit relief, HeroPortrait.tsx), the taxi at
   the kerb facing left with the robot on its rack, and a dimension
   line from Kolkata to Jaipur. The taxi route starts at the Home stop
   by the taxi's tail, and the scroll drives the taxi itself off along
   the kerb to the gutter, shrinking as it goes, until it is the small
   route taxi (the "road" stand-in, THE JOURNEY in lib/motion.ts).

   It renders inside <Sheet> (HomeSheet.tsx), as eight layers for the
   Exposure (Exposure.tsx): ink back (the back of the street), blueprint
   back, the portrait canvas, ink front (railing, taxi, robot),
   blueprint front, then the copy in ink and in blueprint, and the copy
   line. The copy is on top of the street so the big taxi, driven off
   by the scroll, passes behind the role, the billing and the buttons,
   never over them; it never overlaps the portrait, so Parth still
   stands in front of everything else.

   THE LOADER IS THE HERO: SPAN CLOSED. Nothing is laid over the sheet:
   the name is inked in place, in the h1 itself, so when loading ends it
   is already where it stays and nothing about it moves. While the page
   gets ready the Howrah Bridge is erected on the sheet as the progress
   (LoaderBridge.ts): towers, anchor arms, cantilever arms with two
   creeper cranes, and the suspended span closing at 100%, a readout on
   its centre line. Rivets go in red-hot and cool to navy, and the name,
   pencilled in as its plan, is lowered onto it letter by letter on
   cables, riveted and painted navy, each line's brick shade stepping
   in once it is down. It cannot pass 80% until the fonts and the
   portrait are genuinely ready; backstops make sure nobody is ever
   stuck. At the close a brick SPAN CLOSED stamp lands, the barrier
   lifts, the small waiting taxi (the hero's own, scaled down) drives
   across, and the view pushes in on it until it is the big hero taxi
   at rest, while the memorial, Parth, the railing, the copy and the
   route arrive round the name.
   ============================================================ */

/* The build reaches 80% in 1.04s and holds there until the fonts and
   the portrait are ready; the last 20% then takes 0.26s. */
const MORPH_MS = 1300;
const HOLD = 0.8;
const BAIL_MS = 6000;

/* The two buttons' words come from the copy file: the nav's own Contact,
   and the heading of the work sheet the second button opens. */
const CTA_CONTACT = nav.find((n) => n.href === "#contact")?.label ?? "";
const CTA_WORK = work.heading.join(" ");

/* The role breaks after its "&" and nowhere else: each half keeps its
   spaces unbreakable, and .h-role's max-width (styles/s1-hero.css) is
   narrower than the whole line, so it sets as two lines, each with its
   own swipe, at every width. A role without "&" is one line. */
const ROLE = (() => {
  const r = identity.role;
  const i = r.indexOf(" & ");
  if (i < 0) return r;
  const keep = (t: string) => t.replace(/ /g, " ");
  return `${keep(r.slice(0, i + 2))} ${keep(r.slice(i + 3))}`;
})();

export default function Hero({ onDone }: { onDone: () => void }) {
  const root = useRef<HTMLDivElement>(null);
  const copy = useRef<HTMLDivElement>(null);
  const front = useRef<HTMLDivElement>(null);

  const doneCb = useRef(onDone);
  doneCb.current = onDone;

  const portrait = usePortrait();
  const [orbReady, setOrbReady] = useState(false);
  const [portraitReady, setPortraitReady] = useState(false);

  /* One Exposure state per hero, shared with the portrait. */
  const [exposure] = useState(createExposure);
  useExposure(root, exposure);

  /* Readiness is read inside the rAF loop, so it lives in refs. */
  const fontsReady = useRef(false);
  const centreReady = useRef(false);
  useEffect(() => {
    // one-way: a late portrait answer must not undo the bail below
    centreReady.current ||= portrait === "yes" ? portraitReady : portrait === "no" && orbReady;
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
    const layer = root.current;
    const sheet = layer?.closest<HTMLElement>(".sheet");
    const copyBox = copy.current;
    const name = copyBox?.querySelector<HTMLElement>("h1.h-name");
    if (!layer || !sheet || !copyBox || !name) return;

    /* The landed flag ends the held-back state in CSS (the street hidden,
       the name in outline). Set once the outro's start values are in place,
       so nothing shows a frame early. */
    const land = () => {
      sheet.dataset.landed = "";
    };

    /* Timers and the rAF loop are torn down explicitly rather than returned
       from the context callback, so cleanup never depends on how the
       context treats a returned function. */
    let teardown: (() => void) | undefined;

    const ctx = gsap.context((self) => {
      /* The bridge, built on the sheet (LoaderBridge.ts), and the name
         lowered onto its plan, letter by letter. */
      const span = createSpan(sheet, layer, name);
      const t0 = performance.now();
      const now = () => (performance.now() - t0) / 1000;
      let p = 0;
      span.frame(0, 0, -1);
      /* Placed small by the barrier: now the taxi may show. */
      sheet.dataset.span = "";

      let rz = 0;
      let closed = -1;
      const onResize = () => {
        clearTimeout(rz);
        rz = window.setTimeout(() => {
          span.rebuild();
          if (closed < 0) span.frame(now(), p, -1);
        }, 120);
      };
      window.addEventListener("resize", onResize);

      let last = performance.now();
      let raf = 0;
      let started = false;

      const outro = () => {
        if (started) return;
        started = true;
        cancelAnimationFrame(raf);
        p = 1;
        closed = now();
        span.frame(closed, 1, 0);

        /* The outro starts from the rAF loop or the backstop timer, after
           the context callback has returned, so it is built through
           self.add: that keeps its selectors inside the hero (the strip,
           the nav and the work notes carry the same attributes) and lets
           ctx.revert() kill it on unmount. */
        self.add(() => {
          const vm = layer.querySelector(":scope > .h-stage > .h-vm");
          const dims = layer.querySelectorAll(":scope > .h-stage > .h-dim, :scope > .h-stage > .h-dimlab");
          const railing = front.current?.querySelector(".h-railing") ?? null;
          /* The hero's own stretch of the route (driveRoute puts the
             small route taxi in the sheet too, hidden until the big one
             has driven off and shrunk into it). */
          const route = sheet.querySelectorAll(":scope > .rail, :scope > .elbow, :scope > .stop, :scope > .stoplab, :scope > .route-car");
          const ribbon = copyBox.querySelector(".h-ribbon");
          const rises = copyBox.querySelectorAll("[data-intro-hide]:not(.h-ribbon)");
          /* Parth stands up from behind the kerb: his box rises its own
             height while a clip holds the kerb line (read once, here). */
          const kerb = span.kerb();
          const rise = Array.from(sheet.querySelectorAll<HTMLElement>("[data-intro-rise]")).map((el) => {
            const box = el.parentElement!.getBoundingClientRect();
            return { el, h: box.height, cut: box.bottom - kerb };
          });
          const proxy = { o: 0 };
          const lift = { v: 0 };
          gsap
            .timeline()
            /* The bridge, the stamp and the push, frame by frame. */
            .to(proxy, { o: OUTRO, duration: OUTRO, ease: "none", onUpdate: () => span.frame(closed + proxy.o, 1, proxy.o) }, 0)
            .add(() => {
              /* Landed: the bridge goes, and a resize must not build it again. */
              window.removeEventListener("resize", onResize);
              clearTimeout(rz);
              span.remove();
              delete sheet.dataset.span; // lets a held layout refresh run (lib/motion.ts)
            }, OUTRO)
            /* The memorial comes up round the name. */
            .fromTo(
              vm,
              { opacity: 0, scale: 0.8, transformOrigin: "50% 62%" },
              { opacity: 1, scale: 1, duration: 0.74, ease: "power3.out", clearProps: "transform,transformOrigin" },
              0.56
            )
            .fromTo(
              lift,
              { v: 0 },
              {
                v: 1,
                duration: 0.94,
                ease: "power3.out",
                onUpdate: () => {
                  for (const r of rise) {
                    const dy = (1 - lift.v) * r.h;
                    const c = r.cut + dy;
                    r.el.style.transform = lift.v >= 1 ? "none" : `translate3d(0, ${dy.toFixed(1)}px, 0)`;
                    r.el.style.clipPath = c > 0 && lift.v < 1 ? `inset(0 0 ${c.toFixed(1)}px 0)` : "";
                  }
                },
              },
              0.62
            )
            /* The railing is planted up from the kerb at full ink: a fade
               would lay a cream veil over the rising portrait. */
            .fromTo(railing, { clipPath: "inset(100% 0% 0% 0%)" }, { clipPath: "inset(0% 0% 0% 0%)", duration: 0.3, ease: "power3.out", clearProps: "clipPath" }, 0.92)
            /* Hand off while the portrait is still climbing, so the nav
               and the rest of the page arrive with it, not after it. */
            .add(() => doneCb.current(), 0.9)
            /* The copy round the name: the ribbon settles from above, the
               rest rises from below, so nothing passes behind the letters. */
            .fromTo(ribbon, { y: -24, opacity: 0 }, { y: 0, opacity: 1, duration: 0.9, ease: "power3.out" }, 0.95)
            .fromTo(rises, { y: 40, opacity: 0 }, { y: 0, opacity: 1, duration: 0.9, stagger: 0.08, ease: "power3.out" }, 1.03)
            .fromTo([...dims, ...route], { opacity: 0 }, { opacity: 1, duration: 0.4, ease: "none" }, 1.1);
          /* Every start value above is now set inline, so the held-back
             state can go without a frame of the street showing early. */
          land();
        });
      };

      const tick = (at: number) => {
        raf = requestAnimationFrame(tick);
        /* Wall-clock, not per-frame: a slow machine drops frames, and a
           per-frame cap would stretch the intro with it. The cap only
           guards against a jump after the tab was hidden. The floor is
           there because the first rAF stamp can be earlier than the
           performance.now() taken above when the main thread is busy, and
           a negative step would run the build backwards. */
        const dt = Math.max(0, Math.min(at - last, 250));
        last = at;

        const ready = fontsReady.current && centreReady.current;
        p = Math.min(ready ? 1 : HOLD, p + dt / MORPH_MS);
        if (p >= 1) outro();
        else span.frame(now(), p, -1);
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
        clearTimeout(rz);
        window.removeEventListener("resize", onResize);
        span.remove();
        delete sheet.dataset.span;
      };
    }, sheet);

    return () => {
      teardown?.();
      ctx.revert();
      for (const el of sheet.querySelectorAll<HTMLElement>("[data-intro-rise]")) {
        el.style.transform = "";
        el.style.clipPath = "";
      }
      delete sheet.dataset.landed;
    };
  }, []);

  const portraitLayer = (
    /* The rise is on the inner box; the outer one is placed by CSS. */
    <div className="h-portrait" data-x-canvas="">
      <div data-intro-rise="" className="h-full w-full">
        {portrait === "yes" && (
          <HeroPortrait label={identity.fullName} onReady={() => setPortraitReady(true)} exposure={exposure} />
        )}
      </div>
    </div>
  );

  return (
    <>
      {/* L1: the ink print, back: the street behind Parth. */}
      <div ref={root} className="h-layer h-ink-back">
        <div className="h-stage">
          <Back tone="ink" />
        </div>
        <Kerb />
      </div>

      {/* L2: its blueprint copy, revealed under the line. */}
      <BlueprintMask className="h-bp-back">
        <div className="h-layer h-bp g-blue">
          <div className="h-stage">
            <Back tone="bp" />
          </div>
          <Kerb />
        </div>
      </BlueprintMask>

      {/* L3: Parth. The canvas prints both versions itself (uEdge). */}
      <div className="h-layer h-canvas">
        <div className="h-stage">
          {portraitLayer}
          {portrait === "no" && (
            <div className="h-orb">
              <div data-intro-rise="" className="h-full w-full">
                <HeroOrb onReady={() => setOrbReady(true)} />
              </div>
            </div>
          )}
          {/* Without scripts nothing above runs: the plain cut-out. */}
          <noscript>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img className="h-photo" src={PORTRAIT_SRC} alt={identity.fullName} />
          </noscript>
        </div>
      </div>

      {/* L4: the ink print, front: the railing he leans on, the taxi. */}
      <div ref={front} className="h-layer h-ink-front">
        <div className="h-stage">
          <Front tone="ink" />
        </div>
      </div>

      {/* L5: its blueprint copy. */}
      <BlueprintMask className="h-bp-front">
        <div className="h-layer h-bp">
          <div className="h-stage">
            <Front tone="bp" />
          </div>
        </div>
      </BlueprintMask>

      {/* L6: the copy in ink, above the street, so the taxi drives
          behind it. Clipped to above the line: the blueprint copy takes
          over below it. */}
      <InkMask className="h-ink-copy">
        <div ref={copy} className="h-layer">
          <Copy tone="ink" />
        </div>
      </InkMask>

      {/* L7: its blueprint copy, revealed under the line. */}
      <BlueprintMask className="h-bp-copy">
        <div className="h-layer h-bp">
          <Copy tone="bp" />
        </div>
      </BlueprintMask>

      {/* L8: the copy line, with About's tab riding it. */}
      <CopyLine />

      {/* The route starts here: the Home stop at the taxi's tail, along
          the road under it, round the corner and down the gutter. The
          big taxi itself drives the road (stand="road"). */}
      <Rail dir="h" rtl className="r-hero" stand="road" />
      <Elbow corner="tl" className="e-hero" />
      <Rail className="r-hero-v" />
      <Stop className="s-home" />
      <StopLabel decorative className="hand s-home-lab">
        {route.stops[0]}
      </StopLabel>
    </>
  );
}

/* ============================================================
   THE COPY, in either print. The blueprint one is the same layout in
   pale line (aria-hidden, its buttons out of the tab order), so the two
   register exactly under the line.
   ============================================================ */
function Copy({ tone }: { tone: Tone }) {
  const ink = tone === "ink";
  const [first, ...more] = identity.fullName.split(" ");
  const last = more.join(" ");
  const intro = ink ? { "data-intro-hide": "" } : {};
  /* The name never rises in: the loader writes it in place (above), so
     it is there from the first paint. */
  const avoid = ink ? { "data-x-avoid": "" } : {};
  /* What the big taxi keeps clear of as it drives off (THE HERO'S
     DRIVE in lib/motion.ts): the words, and the ribbon and the buttons
     as whole boxes. The blueprint copy lies exactly under the ink one. */
  const text = ink ? { "data-drive-avoid": "" } : {};
  const box = ink ? { "data-drive-avoid": "box" } : {};
  const name = (
    <>
      <span className="l1" {...avoid} {...text}>
        {first}
      </span>{" "}
      <span className="l2" {...avoid} {...text}>
        {last}
      </span>
    </>
  );
  return (
    <div className="h-copy" aria-hidden={ink ? undefined : true}>
      <p className="h-ribbon" {...intro} {...box}>
        <i aria-hidden="true" />
        {hero.ribbon}
        <i aria-hidden="true" />
      </p>
      {ink ? (
        /* Labelled, since the loader inks it letter by letter. */
        <h1 id="h-home" className="h-name" aria-label={identity.fullName}>
          {name}
        </h1>
      ) : (
        <p className="h-name">{name}</p>
      )}
      <p className="h-role" {...intro} {...avoid} {...text}>
        {ink ? <span className="hl">{ROLE}</span> : ROLE}
      </p>
      <p className="h-billing" {...intro} {...text}>
        {hero.billing}
      </p>
      <div className="h-ctas" {...intro} {...(ink ? { "data-x-ctas": "" } : {})}>
        <a className="btn solid" href="#contact" data-hover tabIndex={ink ? undefined : -1} {...box}>
          {CTA_CONTACT}
          <svg className="arr" viewBox="0 0 24 24" fill="none" aria-hidden="true" focusable="false">
            <path d="M5 12h13M12.5 6.5 18 12l-5.5 5.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </a>
        <a className="btn line" href="#work" data-hover tabIndex={ink ? undefined : -1} {...box}>
          {CTA_WORK}
        </a>
      </div>
    </div>
  );
}

/* The street behind Parth. */
function Back({ tone }: { tone: Tone }) {
  return (
    <>
      <Facades tone={tone} />
      <Memorial tone={tone} />
      <Dimension tone={tone} />
    </>
  );
}

/* In front of him: the railing, then the taxi with the robot riding its
   rack (one box, so they move together). Two boxes deep: the outer one
   is the intro's (the drive in, ink print only), the inner one the
   journey's, which drives it off with the scroll and shrinks it into the
   route taxi. Both prints carry the stand-in mark, so the blueprint copy
   moves in lock-step with the ink one under the Exposure's line. */
function Front({ tone }: { tone: Tone }) {
  return (
    <>
      <Railing tone={tone} />
      <div className="h-car" {...(tone === "ink" ? { "data-intro-car": "" } : {})}>
        <div className="h-drive" data-stand-car="road" data-stand-from="rest">
          <Robot tone={tone} />
          <TaxiDrawing tone={tone} />
        </div>
      </div>
    </>
  );
}
