"use client";

import { useEffect } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { DrawSVGPlugin } from "gsap/DrawSVGPlugin";
import { AMB_TOP, TOP_VB } from "@/components/Ambassador";

/* Registered once, here, rather than in every component. DrawSVG draws
   the plotted lines and arrows on (stroke draw-ons with no dash maths). */
if (typeof window !== "undefined") {
  gsap.registerPlugin(ScrollTrigger, DrawSVGPlugin);
}

export { gsap, ScrollTrigger };

/* ============================================================
   MOTION POLICY

   Two levels:

     full: everything, including smooth-scroll inertia and the
           velocity-driven extras (the stack rows' surge with scroll speed).
     soft: the OS asked for reduced motion. Every reveal, the loader, the
           pin wall, the marquees, the hovers and the resume animation
           still run at full strength: they are what the page *is*. What
           drops is the motion that moves the page under you: scroll
           inertia and velocity effects.

   Treating the OS setting as a kill switch was the bug that made this
   site look dead: Windows ships with "Animation effects" off on many
   installs (LTSC and VMs especially), browsers then report reduced
   motion to every page, and a kill switch turns the whole design off
   for people who never asked for that.
   ============================================================ */
/** The OS asked for less motion: skip inertia and velocity-driven extras only. */
export const soft = () =>
  typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

/** The scrub every scroll-driven piece uses: smoothed in full motion,
    locked to the scroll in soft (the same picture at every position,
    without the lag that reads as the page drifting). */
export const scrub = (): true | number => (soft() ? true : 0.6);

/* ============================================================
   NATURAL FLOW

   The sheets are sticky (see THE SHEET STACK in styles/f0-base.css): a
   sheet holds still while the next one slides over it. Anything measured
   while a sheet is stuck is off by however long it has been stuck, so
   every measurement is taken in natural flow, with html[data-measure]
   turning the sticky sheets back to plain relative boxes. ScrollTrigger
   does that around every refresh by itself (the two listeners below);
   naturalTop and withMeasure do it for one-off reads.

   Sticky never changes the layout, only where a stuck sheet is painted,
   so switching it off and on again moves nothing: no scroll jump, no
   reflow of the page below.
   ============================================================ */
if (typeof window !== "undefined") {
  const html = document.documentElement;
  ScrollTrigger.addEventListener("refreshInit", () => {
    html.dataset.measure = "";
    window.clearTimeout(refreshTimer); // a queued sheet refresh is covered by this one
  });
  ScrollTrigger.addEventListener("refresh", () => {
    delete html.dataset.measure;
  });
}

/** Runs fn with the sheets in natural flow (nesting is safe). */
export function withMeasure<T>(fn: () => T): T {
  const html = document.documentElement;
  if ("measure" in html.dataset) return fn();
  html.dataset.measure = "";
  try {
    return fn();
  } finally {
    delete html.dataset.measure;
  }
}

/** An element's top in the document, as if no sheet were stuck. */
export function naturalTop(el: Element): number {
  return withMeasure(() => el.getBoundingClientRect().top + window.scrollY);
}

/** The deepest the page can scroll. */
export const maxScroll = () => ScrollTrigger.maxScroll(window);

/* ============================================================
   JUMPS

   Every in-page jump goes through here: Lenis's scrollTo in full motion
   (so it eases like the rest of the page), a native smooth scroll in
   soft. The target lands where a native anchor jump would put it (Lenis
   ignores both of these): under the root's scroll-padding-top, which
   StatusStrip sets to the strip's height, plus the target's own
   scroll-margin-top, 84px on the sheet anchors, so the sheet's index tab
   shows whole below the strip. Never scrollIntoView: the scroll padding
   the nav keeps at the bottom for focus would stop it short.

   With focus: true (what a link click should do), focus moves to the
   target without scrolling, so the next Tab carries on from there; the
   browser's own focus move is lost with preventDefault.
   ============================================================ */

export function jumpTo(
  target: string | HTMLElement | number,
  { duration = 1.4, focus = false }: { duration?: number; focus?: boolean } = {}
): boolean {
  let y: number;
  let el: HTMLElement | null = null;
  if (typeof target === "number") {
    y = target;
  } else {
    /* getElementById, not querySelector: an id that is not a valid CSS
       selector would make querySelector throw. */
    el = typeof target === "string" ? document.getElementById(target.replace(/^#/, "")) : target;
    if (!el) return false;
    const margin = parseFloat(getComputedStyle(el).scrollMarginTop) || 0;
    const pad = parseFloat(getComputedStyle(document.documentElement).scrollPaddingTop) || 0;
    y = naturalTop(el) - margin - pad;
  }
  y = Math.max(0, Math.min(y, maxScroll()));

  const lenis = window.__lenis;
  if (lenis) lenis.scrollTo(y, { duration });
  else window.scrollTo({ top: y, behavior: "smooth" });

  if (focus && el) {
    if (!el.hasAttribute("tabindex")) el.setAttribute("tabindex", "-1");
    el.focus({ preventScroll: true });
  }
  return true;
}

/* ============================================================
   STICKY SHEETS

   useSheetStick(ref) is called by Sheet.tsx for its own <section>. One
   ResizeObserver watches every sheet; when a sheet's height changes it
   writes --stick = min(0, viewport height - sheet height) in the next
   frame and sets data-stick, which is what turns stickiness on (so a
   sheet is never sticky before its --stick is known: a tall sheet stuck
   at top 0 would hide its own bottom). The viewport height comes from
   resize, never from scroll. A height change also refreshes
   ScrollTrigger, once things have settled (an accordion opening changes
   height for half a second; refreshing every frame of that would stall
   the page).

   And the keyboard guard (WCAG 2.4.11): a control in a sheet that a later
   sheet now covers can still take focus. When it does, the page scrolls
   to where that control sits in natural flow, out from under the cover.
   ============================================================ */
const sheets = new Set<HTMLElement>();
const heights = new WeakMap<HTMLElement, number>();
let ro: ResizeObserver | null = null;
let writeRaf = 0;
let refreshTimer = 0;
let guardOn = false;

const sheetNo = (el: HTMLElement) => Number(el.dataset.sheet ?? 0) || 0;

function writeSticks() {
  writeRaf = 0;
  const vh = window.innerHeight;
  sheets.forEach((el) => {
    const h = heights.get(el);
    if (h === undefined) return;
    el.style.setProperty("--stick", `${Math.min(0, Math.round(vh - h))}px`);
    if (!("stick" in el.dataset)) el.dataset.stick = "";
  });
}
const queueWrite = () => {
  if (!writeRaf) writeRaf = requestAnimationFrame(writeSticks);
};
const queueRefresh = () => {
  window.clearTimeout(refreshTimer);
  /* Held while the home loader is up (scroll is locked, nothing reads the
     positions yet): a whole-page measure would stall its build. */
  const go = () => {
    if (document.querySelector(".hero[data-span]")) refreshTimer = window.setTimeout(go, 220);
    else ScrollTrigger.refresh();
  };
  refreshTimer = window.setTimeout(go, 220);
};

function onResized(entries: ResizeObserverEntry[]) {
  let changed = false;
  for (const e of entries) {
    const el = e.target as HTMLElement;
    const h = e.borderBoxSize?.[0]?.blockSize ?? (e.target as HTMLElement).offsetHeight;
    if (heights.get(el) !== h) {
      heights.set(el, h);
      changed = true;
    }
  }
  if (!changed) return;
  queueWrite();
  queueRefresh();
}

/* Read after the browser's own focus scroll, which does not know about
   sticky boxes: it scrolls as if the control would move with the page,
   and a control in a stuck sheet does not. So the check waits two frames,
   then looks at where the control actually is: under a later sheet (or
   its tab), or above the top of the viewport (under the status strip).

   The landing puts the control 35% down the viewport, but never past the
   point where its own sheet starts to stick: deeper than that, the next
   sheet is already sliding over it and the control would land covered
   again. At that cap only the next sheet's tab shows, at the foot of the
   viewport, and every sheet keeps its last 62px free of text, so the
   control is clear. Read on focus only, never per frame. */
let guardRaf = 0;
function onFocusIn(e: FocusEvent) {
  const t = e.target;
  /* keyboard focus only: a clicked control is one the visitor can already see */
  if (!(t instanceof HTMLElement) || !t.matches(":focus-visible")) return;
  const own = t.closest<HTMLElement>(".sheet");
  if (!own || !sheets.has(own)) return;
  cancelAnimationFrame(guardRaf);
  guardRaf = requestAnimationFrame(() => {
    guardRaf = requestAnimationFrame(() => {
      guardRaf = 0;
      if (document.activeElement !== t) return;
      const r = t.getBoundingClientRect();
      if (!r.width && !r.height) return;
      const n = sheetNo(own);
      let hidden = r.top < 44;
      sheets.forEach((s) => {
        if (hidden || sheetNo(s) <= n) return;
        const sr = s.getBoundingClientRect();
        /* 40px above the sheet: its index tab rides over the one before. */
        if (sr.top - 40 < r.bottom && sr.bottom > r.top) hidden = true;
      });
      if (!hidden) return;
      const vh = window.innerHeight;
      const ownBottom = naturalTop(own) + own.offsetHeight;
      jumpTo(Math.min(naturalTop(t) - vh * 0.35, ownBottom - vh), { duration: 0.8 });
    });
  });
}

function onWindowResize() {
  queueWrite();
}

/** Makes a sheet sticky inside its slot (see above). Sheet.tsx calls it. */
export function useSheetStick(ref: React.RefObject<HTMLElement | null>) {
  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    if (!ro) {
      ro = new ResizeObserver(onResized);
      window.addEventListener("resize", onWindowResize, { passive: true });
    }
    if (!guardOn) {
      guardOn = true;
      document.addEventListener("focusin", onFocusIn);
    }
    sheets.add(el);
    ro.observe(el);

    return () => {
      ro?.unobserve(el);
      sheets.delete(el);
      heights.delete(el);
      el.style.removeProperty("--stick");
      delete el.dataset.stick;
      if (!sheets.size) {
        ro?.disconnect();
        ro = null;
        window.removeEventListener("resize", onWindowResize);
        document.removeEventListener("focusin", onFocusIn);
        guardOn = false;
        cancelAnimationFrame(writeRaf);
        cancelAnimationFrame(guardRaf);
        guardRaf = 0;
        writeRaf = 0;
        window.clearTimeout(refreshTimer);
      }
    };
  }, [ref]);
}

/* ============================================================
   THE PIN WALL GUARD

   The contact section's pin wall is a position:fixed canvas. A
   transform, filter, will-change, contain or content-visibility on any
   of its ancestors (its sheet, the sheet's slot, main) makes that
   ancestor its containing block, and the wall then sizes itself to the
   whole page instead of the viewport. canTransform(el) says whether el
   is clear of that: false for any ancestor of the wall (the element
   marked data-pin-wall, or the Contact sheet itself when nothing is
   marked yet). Every helper here checks it, and so should any scroll
   effect that transforms a big box.
   ============================================================ */
export function canTransform(el: Element | null): boolean {
  if (!el) return false;
  const wall =
    document.querySelector("[data-pin-wall]") ?? document.querySelector('.sheet[data-sheet-id="contact"]');
  if (wall && (el === wall || el.contains(wall))) {
    if (process.env.NODE_ENV !== "production") {
      console.warn("Refused: this element holds the contact pin wall and must never be transformed.", el);
    }
    return false;
  }
  return true;
}

/* ============================================================
   THE OUTGOING-SHEET VEIL

   driveVeil(veil) darkens a sheet as the next one slides over it: the
   .veil inside it (Sheet's veil prop renders one) goes from clear to
   `max` while the next sheet's top travels from the bottom of the
   viewport to the top. Only the veil's opacity is tweened. It refuses
   the Contact sheet, which nothing covers and nothing may touch.
   ============================================================ */
export function driveVeil(veil: HTMLElement, { max = 0.2 }: { max?: number } = {}): () => void {
  const sheet = veil.closest<HTMLElement>(".sheet");
  if (!sheet || sheet.dataset.sheetId === "contact" || !canTransform(sheet)) return () => {};
  const next = sheet.parentElement?.nextElementSibling?.nextElementSibling?.querySelector<HTMLElement>(
    ":scope > .sheet"
  );
  if (!next) return () => {};
  const tween = gsap.fromTo(
    veil,
    { opacity: 0 },
    {
      opacity: max,
      ease: "none",
      scrollTrigger: { trigger: next, start: "top bottom", end: "top top", scrub: scrub() },
    }
  );
  return () => {
    tween.scrollTrigger?.kill();
    tween.kill();
    gsap.set(veil, { clearProps: "opacity" });
  };
}

/* ============================================================
   THE ROUTE

   driveRoute(root) wires the route pieces inside root (Route.tsx). Two
   ways, picked by `car`:

     fill only (the footer on an info page): every piece marked
       rail and elbow fills with the reading line, 55% down the viewport,
       measured in natural flow, and empties again on the way back up.
       Vertical rails fill over their own length, horizontal ones over
       140px; elbows switch between solid and dotted as the line passes.

     the journey (the home page, car: true): one small taxi drives the
       whole route with the scroll, from the Home stop by the hero's taxi
       to the terminus at "You've arrived", and the line fills to it, so
       it is always solid behind the taxi and pencilled ahead. Spurs
       (the branches out to the work) keep the fill-only scrub.

   Every end is clamped to the deepest scroll, so at the bottom of the
   page the whole route is solid and the taxi has arrived. Without
   scripts, and before this runs, every piece is solid and there is no
   small taxi (it is made here).
   ============================================================ */
const READ = 0.55;

/** The old reading-line scrub, for pieces no taxi drives. */
function fillByReadingLine(rails: HTMLElement[], elbows: HTMLElement[]): () => void {
  const tweens: gsap.core.Tween[] = [];
  const triggers: ScrollTrigger[] = [];

  rails.forEach((rail) => {
    const b = rail.querySelector<HTMLElement>(":scope > b");
    if (!b) return;
    const vertical = rail.classList.contains("v");
    const prop = vertical ? "scaleY" : "scaleX";
    const end = () => {
      const r = rail.getBoundingClientRect();
      const top = r.top + window.scrollY - window.innerHeight * READ;
      return Math.min(vertical ? top + r.height : top + 140, maxScroll());
    };
    const start = () => {
      const r = rail.getBoundingClientRect();
      return Math.min(r.top + window.scrollY - window.innerHeight * READ, end() - 1);
    };
    tweens.push(
      gsap.fromTo(
        b,
        { [prop]: 0 },
        {
          [prop]: 1,
          ease: "none",
          /* A 2D scale, so the 4px ink line is painted at its real size.
             GSAP's default translate3d puts it on its own layer, which
             Chrome rasterises at the tiny starting scale and stretches:
             a rail that has only just begun reads as a soft, see-through
             smear instead of a crisp line. */
          force3D: false,
          scrollTrigger: { trigger: rail, start, end, scrub: scrub(), invalidateOnRefresh: true },
        }
      )
    );
  });

  elbows.forEach((elbow) => {
    const start = () => {
      const r = elbow.getBoundingClientRect();
      return Math.min(r.top + window.scrollY - window.innerHeight * READ, maxScroll() - 1);
    };
    const set = (self: ScrollTrigger) => elbow.classList.toggle("ahead", self.scroll() < self.start);
    triggers.push(
      ScrollTrigger.create({
        trigger: elbow,
        start,
        end: () => maxScroll(),
        /* The enter and leave callbacks, not onToggle: an elbow near the
           foot has its start clamped to a 1px range, and a scroll that
           reaches the bottom jumps it from 0 to 1 without ever being
           active, so onToggle never fires and the last corner would stay
           dotted beside the terminus. These fire even on that jump. */
        onEnter: set,
        onLeave: set,
        onEnterBack: set,
        onLeaveBack: set,
        onRefresh: set,
      })
    );
  });

  return () => {
    tweens.forEach((t) => {
      t.scrollTrigger?.kill();
      t.kill();
    });
    triggers.forEach((t) => t.kill());
    rails.forEach((r) => {
      const b = r.querySelector<HTMLElement>(":scope > b");
      if (b) gsap.set(b, { clearProps: "transform" });
    });
    elbows.forEach((e) => e.classList.remove("ahead"));
  };
}

/* ============================================================
   STAND-INS

   On three stretches a bigger taxi drives instead of the small one: the
   hero's own big taxi on the road out of the Home stop, the one on the
   Howrah Bridge deck, and (when the footer marks it) the one that parks
   on the street at the end. The rail says which stretch
   (<Rail stand="deck">, data-stand) and the car says it stands in for
   it (data-stand-car="deck"). While the journey is on that rail the
   small taxi hides and the stand-in shows, centred where the journey
   puts it, and the rail fills to its tail; off that rail it hides.
   Where it ends is data-park on the car: "end" (the default) stops with
   its nose at the rail's far end, where the small taxi takes over
   again; "rest" drives on to wherever its own CSS puts it, so a car
   that parks past the end of the line (the footer's, beyond the
   terminus) ends exactly where it stands without scripts.

   data-stand-from="rest" is the other way round, for the hero's taxi:
   it starts where its own CSS parks it (the no-JS picture) and drives
   off, shrinking, into the small taxi (THE HERO'S DRIVE, below). Every
   element carrying the name moves together (the hero's ink print and
   its blueprint copy under the Exposure). Its place is read from
   layout offsets, never from a box an intro may be moving.

   onStand(name, fn) tells a component where its stand-in is, for
   anything it draws with it (the lamps that light up behind the deck
   taxi): fn(u, on), u from 0 at the rail's start to 1 at its end.
   ============================================================ */
type StandFn = (u: number, on: boolean) => void;
const standFns = new Map<string, Set<StandFn>>();

export function onStand(name: string, fn: StandFn): () => void {
  let set = standFns.get(name);
  if (!set) standFns.set(name, (set = new Set()));
  set.add(fn);
  return () => {
    set.delete(fn);
  };
}

/* ============================================================
   THE HERO'S DRIVE

   The page scrolls from the first notch: About starts up over the stuck
   hero at once, and the hero's big taxi drives off in that same scroll,
   shrinking into the small route taxi, with nothing overlapping on the
   way. Where it can go is fixed by the sheet: the copy sits to its left
   and low, so the car has to be small before it passes under the
   buttons; About comes up from below; and the copy line runs ahead of
   About turning everything under it into the blueprint print. So:

     - it starts parked (the no-JS picture) and shrinks towards its nose,
       the way the footer's taxi grows as it arrives, the other way
       round; then it drives off to the left along the kerb, still
       shrinking, and pulls up at About's stop;
     - the hand-over is at About's ring: the small taxi takes over just
       above About's index tab (never across its label), heading left,
       and curves down into the ring (the entry arc chained in front of
       About's approach, THE JOURNEY below), so it is one taxi, the same
       size and heading, on the same spot;
     - it never sinks below About's top edge or the copy line: when they
       come up under it they carry it up (it rides the line, wheels on
       it), so it is never cut by the line and never covered, and it is
       still the ink print at the hand-over. The line waits for it
       (exposureLine, heroLine.delay) just long enough for that;
     - its path (how early it shrinks, how late it pulls away, how long
       the drive lasts) is planned once per refresh against the copy's
       boxes, About's tab and the line's riding tab (the elements marked
       data-drive-avoid), and the first plan that keeps the car clear of
       all of them at every sample wins. Every frame is then arithmetic
       of the scroll, the same in soft and full motion.
   ============================================================ */

/** The copy line's delay, in px of scroll (see exposureLine). */
export const heroLine = { delay: 0 };
const lineFns = new Set<() => void>();
/** Called whenever the hero's drive is planned again, so the line can
    follow its new delay at once. */
export function onHeroLine(fn: () => void): () => void {
  lineFns.add(fn);
  return () => {
    lineFns.delete(fn);
  };
}

/** Where THE EXPOSURE's copy line ends (reaches the hero's top), in px
    of scroll, from natural-flow tops: the hero is stuck at
    min(0, viewport - its height) while the line is on it, and the line
    runs at twice About's speed, so it leaves the hero's foot as About
    starts up and reaches its top when About is half way up. */
export function exposureEnd(heroTop: number, heroH: number, aboutTop: number, vh: number): number {
  const stick = Math.min(0, vh - heroH);
  const overlap = heroTop + heroH - aboutTop;
  return aboutTop - vh + overlap + (vh - stick) / 2;
}

/** The copy line's y in the hero, from its top, at scroll s: the hero's
    height while it is still off the foot, 0 once it has reached the top,
    later by heroLine.delay than About alone would put it. */
export const exposureLine = (s: number, end: number, heroH: number) =>
  Math.max(0, Math.min(heroH, 2 * (end + heroLine.delay - s)));

/* ============================================================
   THE JOURNEY

   The route is chained once per ScrollTrigger refresh, in natural flow:
   from the Home stop, each rail or elbow joined to the next at its
   nearest end, every piece in its own sheet's coordinates. Between two
   sheets the chain takes the next sheet's index tab: a short approach
   from the tab's ring (the sheet's route stop) to its first rail.

   Then a schedule, also once per refresh: a list of (scroll, distance
   along the route) anchors, read with straight lines between them, so
   each frame is a lookup and some arithmetic. Nothing is measured per
   frame. The rules it is built from:

     the reading line  down the gutter the taxi rides 55% down the
                       viewport, so the line fills under it as the page
                       scrolls, as it always has;
     the stops         a sheet that is stuck while the next slides over
                       it carries the taxi on down its gutter, and the
                       taxi meets the next sheet's ring as it rises:
                       there it changes sheets, at the same point on the
                       screen. The rest of the old sheet's gutter is
                       under the new sheet by then, so it fills unseen.
                       From the ring the taxi eases back to the reading
                       line (never faster than 1.5 times the scroll, nor
                       slower than 0.6);
     the runs          the corners and the level stretches (the bridge,
                       the kerb) are driven while they are on screen: the
                       bridge from when its corner is 84% down the
                       viewport to when the bank's corner is 16% down,
                       the kerb from 84% down to the deepest scroll;
     the hero          the big taxi drives the hero's whole stretch (THE
                       HERO'S DRIVE above) from the top of the page and
                       hands over at About's ring, through an entry arc
                       that comes down into the ring from above the tab;
     the end           the taxi reaches the terminus at the deepest
                       scroll.

   Each frame the taxi is drawn inside the sheet it is on, so the sheet's
   own sticky slide carries it and it can never drift off its line. The
   one exception is the moment the next sheet's tab rides over it on the
   way to the ring: it is drawn in that sheet then, over the tab, at the
   same place on the screen. Where a sheet is on screen comes from the
   sticky arithmetic (STICKY SHEETS above): its natural top, the --stick
   it sticks at and the 100svh it stays stuck for.
   ============================================================ */
type SheetM = { el: HTMLElement; top: number; stickAt: number; stickTop: number; slack: number; tab: number };
type Stand = {
  name: string;
  /* the stand-in and any copies of it (the hero's blueprint print) */
  cars: HTMLElement[];
  c0: number;
  c1: number;
  rest: number;
  half: number;
  park: "end" | "rest";
  on?: boolean;
};
/* The hero's drive (THE HERO'S DRIVE): the cars, the scroll it hands
   over at, the road it fills, and its pose at any scroll before that:
   the nose's x and the box's foot in the hero and the scale. */
type Pose = { x: number; B: number; k: number; t: number };
type Drive = {
  cars: HTMLElement[];
  sh: number;
  /* the scroll the small taxi then takes over the entry arc */
  arcS: number;
  delay: number;
  road: Seg;
  /* the road fills to the car's tail: its right end and the tail at
     the hand-over, where the road is whole */
  tailEnd: number;
  /* the distance along the route at the hand-over (the entry arc) */
  Lend: number;
  X0: number;
  B0: number;
  bw: number;
  pose: (s: number) => Pose;
  on?: boolean;
};
type Seg = {
  sheet: number;
  arc: boolean;
  x0: number;
  y0: number;
  x1: number;
  y1: number;
  cx: number;
  cy: number;
  r: number;
  a0: number;
  a1: number;
  L0: number;
  L1: number;
  gutter: boolean;
  el: HTMLElement | null;
  stand: Stand | null;
  /* the last fill written, so a frame only touches what changed */
  last: number;
};
type Model = {
  sheets: SheetM[];
  segs: Seg[];
  anchors: [number, number][];
  end: number;
  carW: number;
  carH: number;
  drive: Drive | null;
};

const screenTop = (m: SheetM, s: number) =>
  s < m.stickAt ? m.top - s : s < m.stickAt + m.slack ? m.stickTop : m.top + m.slack - s;

function pointAt(g: Seg, L: number): [number, number, number] {
  const t = g.L1 > g.L0 ? Math.min(1, Math.max(0, (L - g.L0) / (g.L1 - g.L0))) : 0;
  if (!g.arc) {
    return [g.x0 + (g.x1 - g.x0) * t, g.y0 + (g.y1 - g.y0) * t, Math.atan2(g.y1 - g.y0, g.x1 - g.x0)];
  }
  const a = g.a0 + (g.a1 - g.a0) * t;
  /* the heading is the tangent, turned the way the arc is swept */
  return [g.cx + g.r * Math.cos(a), g.cy + g.r * Math.sin(a), a + (g.a1 > g.a0 ? Math.PI / 2 : -Math.PI / 2)];
}

/* The piece at distance L. Where two meet, the later one: a change of
   sheet puts the taxi on the new sheet's ring, not the old one's tail. */
function segAt(segs: Seg[], L: number): Seg {
  let lo = 0;
  let hi = segs.length - 1;
  while (lo < hi) {
    const mid = (lo + hi) >> 1;
    if (segs[mid].L1 <= L) lo = mid + 1;
    else hi = mid;
  }
  return segs[lo];
}

function lamAt(anchors: [number, number][], s: number): number {
  if (s <= anchors[0][0]) return anchors[0][1];
  let lo = 0;
  let hi = anchors.length - 1;
  if (s >= anchors[hi][0]) return anchors[hi][1];
  /* the last anchor at or before s: where two share a scroll (a change of
     sheet), the later one wins */
  while (lo < hi) {
    const mid = (lo + hi + 1) >> 1;
    if (anchors[mid][0] <= s) lo = mid;
    else hi = mid - 1;
  }
  const [s0, l0] = anchors[lo];
  const [s1, l1] = anchors[lo + 1];
  return s1 > s0 ? l0 + ((l1 - l0) * (s - s0)) / (s1 - s0) : l1;
}

/* The first s in [a, b] where f drops to 0 or below: an 8px scan for
   the first crossing (f need not stay below it afterwards: a sheet that
   scrolls away moves everything again), then bisection inside it. */
function cross(f: (s: number) => number, a: number, b: number): number {
  if (f(a) <= 0) return a;
  let lo = a;
  for (;;) {
    const hi = Math.min(b, lo + 8);
    if (f(hi) <= 0) {
      b = hi;
      break;
    }
    if (hi >= b) return b;
    lo = hi;
  }
  a = lo;
  for (let i = 0; i < 30; i++) {
    const m = (a + b) / 2;
    if (f(m) > 0) a = m;
    else b = m;
  }
  return b;
}

/* The car seen from above (AmbassadorDefs.tsx), made here so it exists
   only with scripts. */
function makeCar(): HTMLElement {
  const car = document.createElement("i");
  car.className = "route-car";
  car.setAttribute("aria-hidden", "true");
  car.innerHTML = `<svg viewBox="${TOP_VB}" focusable="false"><use href="#${AMB_TOP}"/></svg>`;
  return car;
}

function chain(root: ParentNode, car: HTMLElement): Model | null {
  const vh = window.innerHeight;
  const sy = window.scrollY;
  const sheetEls = Array.from(root.querySelectorAll<HTMLElement>(".sheet"));
  if (!sheetEls.length) return null;
  const motion = "motion" in document.documentElement.dataset;
  const sheets: SheetM[] = sheetEls.map((el) => {
    const r = el.getBoundingClientRect();
    const slot = el.parentElement;
    const last = !slot?.nextElementSibling;
    const sticky = motion && "stick" in el.dataset && !!slot && !last;
    const stickTop = parseFloat(el.style.getPropertyValue("--stick")) || 0;
    const slack = sticky && slot ? parseFloat(getComputedStyle(slot, "::after").height) || 0 : 0;
    const tab = el.querySelector<HTMLElement>(":scope > .sheet-tab:not(.is-inner)");
    const top = r.top + sy;
    return { el, top, stickAt: sticky ? top - stickTop : Infinity, stickTop, slack, tab: tab ? tab.offsetHeight : 0 };
  });
  const sheetOf = new Map(sheetEls.map((el, i) => [el, i]));
  const lefts = sheetEls.map((el) => el.getBoundingClientRect().left);
  const tops = sheetEls.map((el) => el.getBoundingClientRect().top);

  /* Every drawn piece as ends in its sheet's coordinates. */
  type Piece = { el: HTMLElement; sheet: number; ends: [number, number][]; arc?: { cx: number; cy: number; r: number; a: [number, number] } };
  const pieces: Piece[] = [];
  root.querySelectorAll<HTMLElement>(".rail, .elbow").forEach((el) => {
    if (el.classList.contains("r-spur")) return;
    const sh = el.closest<HTMLElement>(".sheet");
    const k = sh ? sheetOf.get(sh) : undefined;
    if (k === undefined) return;
    const b = el.getBoundingClientRect();
    if (!b.width && !b.height) return;
    const L = b.left - lefts[k];
    const T = b.top - tops[k];
    if (el.classList.contains("rail")) {
      if (el.classList.contains("v")) {
        const x = L + b.width / 2;
        pieces.push({ el, sheet: k, ends: [[x, T], [x, T + b.height]] });
      } else {
        const y = T + b.height / 2;
        pieces.push({ el, sheet: k, ends: [[L, y], [L + b.width, y]] });
      }
      return;
    }
    const cs = getComputedStyle(el);
    const rw = Math.max(parseFloat(cs.borderTopWidth) || 0, parseFloat(cs.borderBottomWidth) || 0);
    const R = b.width;
    const r = R - rw / 2;
    const c = el.classList;
    /* each corner's centre and the polar angles of its two ends */
    const [cx, cy, a0, a1] = c.contains("e-tl")
      ? [L + R, T + R, 180, 270]
      : c.contains("e-tr")
        ? [L, T + R, 270, 360]
        : c.contains("e-bl")
          ? [L + R, T, 180, 90]
          : [L, T, 0, 90];
    const rad = (d: number) => (d * Math.PI) / 180;
    const end = (a: number): [number, number] => [cx + r * Math.cos(rad(a)), cy + r * Math.sin(rad(a))];
    pieces.push({ el, sheet: k, ends: [end(a0), end(a1)], arc: { cx, cy, r, a: [rad(a0), rad(a1)] } });
  });
  if (!pieces.length) return null;

  const nat = (k: number, p: [number, number]): [number, number] => [p[0], p[1] + sheets[k].top];

  /* Where it starts: the Home stop, else the top of the first piece. */
  const home = root.querySelector<HTMLElement>(".stop.s-home");
  let at: [number, number] | null = null;
  if (home) {
    const b = home.getBoundingClientRect();
    if (b.width) at = [b.left + b.width / 2, b.top + b.height / 2 + sy];
  }
  if (!at) {
    const first = pieces.reduce((a, p) => (nat(p.sheet, p.ends[0])[1] < nat(a.sheet, a.ends[0])[1] ? p : a));
    at = nat(first.sheet, first.ends[0]);
  }

  const segs: Seg[] = [];
  let L = 0;
  const push = (g: Omit<Seg, "L0" | "L1" | "last" | "stand" | "gutter">, len: number) => {
    segs.push({ ...g, L0: L, L1: L + len, gutter: false, stand: null, last: NaN });
    L += len;
  };
  const line = (k: number, x0: number, y0: number, x1: number, y1: number, el: HTMLElement | null) =>
    push({ sheet: k, arc: false, x0, y0, x1, y1, cx: 0, cy: 0, r: 0, a0: 0, a1: 0, el }, Math.hypot(x1 - x0, y1 - y0));

  /* The small taxi's box. */
  const cb = car.getBoundingClientRect();
  const carW = cb.width || 28;
  const carH = cb.height || 14;

  /* A sheet whose big taxi starts parked (the hero, THE HERO'S DRIVE)
     hands over at the next sheet's ring, through an entry arc that comes
     down into the ring from above its tab: radius at least the sheet's
     own corners, and enough that the small taxi at its start (side on,
     the big one's proportions) clears the top of the tab. */
  const restCar = root.querySelector<HTMLElement>('[data-stand-from="rest"]');
  const restSheetEl = restCar?.closest<HTMLElement>(".sheet");
  const restSheet = restSheetEl ? (sheetOf.get(restSheetEl) ?? -1) : -1;
  const restBody = restCar?.querySelector<HTMLElement>("[data-stand-body]");
  const restAspect = (() => {
    const b = restBody?.getBoundingClientRect();
    return b && b.width ? b.height / b.width : 0.4;
  })();
  let cornerR = 0;
  let entry: Seg | null = null;

  const used = new Set<Piece>();
  let prevSheet = -1;
  for (;;) {
    let p: Piece | null = null;
    let bestEnd = 0;
    let bestD = 60;
    for (const q of pieces) {
      if (used.has(q)) continue;
      for (let i = 0; i < 2; i++) {
        const n = nat(q.sheet, q.ends[i]);
        const d = Math.hypot(n[0] - at[0], n[1] - at[1]);
        if (d < bestD) {
          bestD = d;
          p = q;
          bestEnd = i;
        }
      }
    }
    if (!p) break;
    used.add(p);
    const [s0, s1] = bestEnd === 0 ? [p.ends[0], p.ends[1]] : [p.ends[1], p.ends[0]];
    const k = p.sheet;
    if (prevSheet === -1) {
      /* from the stop's centre to the line, if they are not one point */
      const a = [at[0], at[1] - sheets[k].top];
      if (Math.hypot(a[0] - s0[0], a[1] - s0[1]) > 0.5) line(k, a[0], a[1], s0[0], s0[1], null);
    } else if (k !== prevSheet && sheets[k].tab) {
      const ring = -sheets[k].tab / 2;
      if (prevSheet === restSheet && restSheet >= 0) {
        /* the entry arc, from above the tab's right half, heading left,
           a quarter turn down into the ring */
        const r = Math.max(cornerR, Math.ceil(sheets[k].tab / 2 + 5 + (carW * restAspect) / 2));
        const cx = s0[0] + r;
        push({ sheet: k, arc: true, x0: cx, y0: ring - r, x1: s0[0], y1: ring, cx, cy: ring, r, a0: Math.PI * 1.5, a1: Math.PI, el: null }, (r * Math.PI) / 2);
        entry = segs[segs.length - 1];
      }
      /* the approach: from the new sheet's ring down to its first rail */
      line(k, s0[0], ring, s0[0], s0[1], null);
    }
    if (p.arc) {
      cornerR = Math.max(cornerR, p.arc.r);
      const [a0, a1] = bestEnd === 0 ? p.arc.a : [p.arc.a[1], p.arc.a[0]];
      push({ sheet: k, arc: true, x0: s0[0], y0: s0[1], x1: s1[0], y1: s1[1], cx: p.arc.cx, cy: p.arc.cy, r: p.arc.r, a0, a1, el: p.el }, (p.arc.r * Math.PI) / 2);
    } else {
      line(k, s0[0], s0[1], s1[0], s1[1], p.el);
    }
    prevSheet = k;
    at = nat(k, s1);
  }
  if (!segs.length) return null;

  /* The gutter: the leftmost vertical line. Its runs (and the approaches)
     are the stretches the reading line drives. */
  let gx = Infinity;
  segs.forEach((g) => {
    if (!g.arc && Math.abs(g.x0 - g.x1) < 0.5 && g.y1 >= g.y0) gx = Math.min(gx, g.x0);
  });
  segs.forEach((g) => {
    /* the entry arc counts as the start of its sheet's gutter stretch,
       which then drives it like the approach after it */
    g.gutter = g === entry || (!g.arc && Math.abs(g.x0 - g.x1) < 0.5 && g.y1 >= g.y0 && Math.abs(g.x0 - gx) < 4);
  });

  /* The hero's car at rest, for THE HERO'S DRIVE: its body's box in the
     sheet, the rest of the car (the robot) as fractions of that box. */
  let parked: { g: Seg; cars: HTMLElement[]; X0: number; B0: number; bw: number; bh: number; extra: number[] | null } | null = null;

  /* Stand-ins, measured where their CSS puts them. */
  for (const g of segs) {
    const name = g.el?.dataset.stand;
    if (!name || g.arc) continue;
    const cars = Array.from(root.querySelectorAll<HTMLElement>(`[data-stand-car="${name}"]`));
    const sc = cars[0];
    if (!sc) continue;
    const k = g.sheet;
    const dir = g.x1 >= g.x0 ? 1 : -1;
    const prev = sc.style.transform;
    sc.style.transform = "none";
    // the loader may be holding the car small at its bridge (LoaderBridge.ts)
    const intro = sc.closest<HTMLElement>("[data-intro-car]");
    const introPrev = intro?.style.transform ?? "";
    if (intro) intro.style.transform = "none";
    if (sc.dataset.standFrom === "rest") {
      const body = sc.querySelector("[data-stand-body]") ?? sc.firstElementChild ?? sc;
      const bb = body.getBoundingClientRect();
      const sb = sc.getBoundingClientRect();
      const parts = Array.from(sc.children)
        .filter((c) => c !== body)
        .map((c) => c.getBoundingClientRect());
      sc.style.transform = prev;
      if (intro) intro.style.transform = introPrev;
      /* The box's place in its sheet from layout offsets (an intro may be
         sliding a box round it); the body's place in the box from the
         two rects, which any such slide moves alike. */
      let x = 0;
      let y = 0;
      let e: HTMLElement | null = sc;
      while (e && e !== sheets[k].el) {
        x += e.offsetLeft;
        y += e.offsetTop;
        e = e.offsetParent as HTMLElement | null;
      }
      if (e !== sheets[k].el) {
        x = sb.left - lefts[k];
        y = sb.top - tops[k];
      }
      /* scaled about its nose on the road (the body's bottom left: it
         faces left), so it shrinks towards where it is heading and stays
         on the road while it does */
      const ox = bb.left - sb.left;
      const oy = bb.bottom - sb.top;
      cars.forEach((c) => (c.style.transformOrigin = `${ox.toFixed(2)}px ${oy.toFixed(2)}px`));
      /* the rest of the car (the robot on the rack), one box round it */
      let extra: number[] | null = null;
      for (const r of parts) {
        if (!r.width) continue;
        const f = [(r.left - bb.left) / bb.width, (r.top - bb.top) / bb.height, (r.right - bb.left) / bb.width, (r.bottom - bb.top) / bb.height];
        extra = extra ? [Math.min(extra[0], f[0]), Math.min(extra[1], f[1]), Math.max(extra[2], f[2]), Math.max(extra[3], f[3])] : f;
      }
      parked = { g, cars, X0: x + ox, B0: y + oy, bw: bb.width, bh: bb.height, extra };
      continue;
    }
    const b = (sc.firstElementChild ?? sc).getBoundingClientRect();
    sc.style.transform = prev;
    if (intro) intro.style.transform = introPrev;
    const half = b.width / 2;
    const rest = b.left - lefts[k] + half;
    const park = sc.dataset.park === "rest" ? "rest" : "end";
    g.stand = { name, cars, c0: g.x0 + dir * half, c1: park === "rest" ? rest : g.x1 - dir * half, rest, half, park };
  }

  /* ---- the schedule ---------------------------------------------- */
  const maxS = maxScroll();
  const R = vh * READ;
  const blocks: { k: number; gutter: boolean; a: number; b: number }[] = [];
  segs.forEach((g, i) => {
    const last = blocks[blocks.length - 1];
    if (last && last.k === g.sheet && last.gutter === g.gutter) last.b = i;
    else blocks.push({ k: g.sheet, gutter: g.gutter, a: i, b: i });
  });

  /* A gutter stretch: the distance along it at a given y in its sheet.
     Above its start it runs on back (negative ground still to cover),
     so "how far behind the reading line" stays true before the line
     reaches the stretch. */
  const lamAtY = (bl: (typeof blocks)[number], y: number) => {
    if (y < segs[bl.a].y0) return segs[bl.a].L0 + (y - segs[bl.a].y0);
    for (let i = bl.a; i <= bl.b; i++) {
      const g = segs[i];
      if (y <= g.y0) return g.L0;
      if (y > g.y1) continue;
      if (!g.arc) return g.L0 + (y - g.y0);
      /* an arc (the entry arc) goes down steadily: find the point at y */
      let lo = g.L0;
      let hi = g.L1;
      for (let j = 0; j < 24; j++) {
        const mid = (lo + hi) / 2;
        if (pointAt(g, mid)[1] < y) lo = mid;
        else hi = mid;
      }
      return (lo + hi) / 2;
    }
    return segs[bl.b].L1;
  };
  const yAt = (Lv: number) => {
    const g = segAt(segs, Lv);
    return pointAt(g, Lv)[1];
  };
  const taxiScreen = (k: number, Lv: number, s: number) => screenTop(sheets[k], s) + yAt(Lv);

  /* How the taxi moves down a stretch from (s0, L0): towards the reading
     line at 1.5 times the scroll when behind it, 0.6 when ahead, then on
     it. */
  const follow = (bl: (typeof blocks)[number], s0: number, l0: number) => {
    const k = bl.k;
    const end = segs[bl.b].L1;
    const onLine = (s: number) => lamAtY(bl, s + R - sheets[k].top);
    const behind = l0 < onLine(s0);
    return (s: number) => {
      const ramp = l0 + (behind ? 1.5 : 0.6) * (s - s0);
      return Math.min(end, behind ? Math.min(ramp, onLine(s)) : Math.max(ramp, onLine(s)));
    };
  };

  /* ---- the hero's drive (THE HERO'S DRIVE) ------------------------ */
  const drive = parked && entry ? planDrive(parked, entry) : null;

  function planDrive(P: NonNullable<typeof parked>, E: Seg): Drive {
    const hs = sheets[restSheet];
    const as = sheets[E.sheet];
    const H = hs.el.offsetHeight;
    /* About's top in the hero, and the copy line, at scroll s */
    const aTop = (s: number) => screenTop(as, s) - screenTop(hs, s);
    const xEnd = exposureEnd(hs.top, H, as.top, vh);
    const lineY = (s: number, delay: number) => Math.max(0, Math.min(H, 2 * (xEnd + delay - s)));
    /* The hand-over: the small taxi's length, centred on the entry arc's
       start, which rides with About. */
    const k1 = carW / Math.max(1, P.bw);
    const h1 = k1 * P.bh;
    const dx = lefts[E.sheet] - lefts[restSheet];
    const n1 = E.x0 + dx - carW / 2;
    const B1 = (s: number) => aTop(s) + E.y0 + h1 / 2;
    /* The tyres' foot above the box's foot, as a share of its height
       (TaxiDrawing's 49 x 19 box): what stands on the line. */
    const WF = 0.024;
    /* The car's shape as parts of its box (side on, facing left): the
       body, low and full length; the cabin and the rack; the robot. */
    const shape: number[][] = [
      [0.005, 0.353, 0.995, 0.976],
      [0.314, -0.011, 0.788, 0.41],
    ];
    if (P.extra) shape.push(P.extra);

    /* What it keeps clear of, in the hero, from layout (an intro may
       still be moving the copy): the copy's text and buttons, and the
       line's riding tab (its y is from the line). */
    type Box = { l: number; t: number; r: number; b: number; line: boolean };
    const avoid: Box[] = [];
    const x0 = lefts[restSheet];
    const offIn = (el: HTMLElement, stop: HTMLElement) => {
      let x = 0;
      let y = 0;
      let e: HTMLElement | null = el;
      while (e && e !== stop) {
        x += e.offsetLeft;
        y += e.offsetTop;
        e = e.offsetParent as HTMLElement | null;
      }
      return [x, y];
    };
    hs.el.querySelectorAll<HTMLElement>("[data-drive-avoid]").forEach((el) => {
      const kind = el.dataset.driveAvoid;
      if (kind === "line") {
        const ln = el.closest<HTMLElement>("[data-x-line]");
        if (!ln) return;
        const [x, y] = offIn(el, ln);
        avoid.push({ l: x + ln.offsetLeft, t: y, r: x + ln.offsetLeft + el.offsetWidth, b: y + el.offsetHeight, line: true });
        return;
      }
      const [x, y] = offIn(el, hs.el);
      let l = x;
      let r = x + el.offsetWidth;
      if (kind !== "box") {
        /* text: as wide as its words, not its block */
        const rg = document.createRange();
        rg.selectNodeContents(el);
        const b = rg.getBoundingClientRect();
        if (b.width) {
          l = b.left - x0;
          r = b.right - x0;
        }
      }
      avoid.push({ l, t: y, r, b: y + el.offsetHeight, line: false });
    });
    /* About's own index tab, riding its top edge */
    const tabEl = as.el.querySelector<HTMLElement>(":scope > .sheet-tab:not(.is-inner)");
    const tab = tabEl ? { l: tabEl.offsetLeft + dx, r: tabEl.offsetLeft + dx + tabEl.offsetWidth, h: as.tab } : null;

    const PAD = 4;
    const pose = (s: number, sh: number, a: number, b: number, delay: number): Pose => {
      const t = Math.min(1, Math.max(0, s / sh));
      /* it eases away from the kerb, drives, and eases into the arc */
      const ta = Math.pow(t, a);
      const x = P.X0 + (n1 - P.X0) * (1 - (1 - ta) * (1 - ta));
      /* shrinking evenly in perspective (k1 ^ share), front-loaded by b */
      const k = Math.pow(k1, 1 - Math.pow(1 - t, b));
      /* from the kerb to the arc's height in the second half, and never
         lower than the copy line or About's top edge under it: those
         carry it up, wheels on them. Over About's tab (and on the way to
         it) the edge it rides is the tab's top, the arc's own height. */
      const u = Math.max(0, t - 0.5) * 2;
      const b1 = B1(s);
      const base = P.B0 + (b1 - P.B0) * u * u * (3 - 2 * u);
      const foot = WF * k * P.bh;
      const near = tab ? Math.min(1, Math.max(0, (tab.r + 48 - x) / 48)) : 0;
      const edge = aTop(s) - 2 + (b1 - aTop(s) + 2) * near;
      const B = Math.min(base, lineY(s, delay) - 1 + foot, edge + foot);
      return { x, B, k, t };
    };
    const hits = (p: Pose, s: number, delay: number, skip: Set<Box | null>) => {
      const w = p.k * P.bw;
      const h = p.k * P.bh;
      const T = p.B - h;
      const at = aTop(s);
      if (p.B - WF * h > at - 1) return true;
      const ln = lineY(s, delay);
      const test = (o: Box | null, l: number, t: number, r: number, b: number) => {
        if (skip.has(o) || t >= at) return false;
        for (const q of shape) {
          if (p.x + q[0] * w < r + PAD && p.x + q[2] * w > l - PAD && T + q[1] * h < b + PAD && T + q[3] * h > t - PAD) return true;
        }
        return false;
      };
      for (const o of avoid) {
        if (o.line) {
          if (ln <= 0.5 || ln >= H - 0.5) continue;
          if (test(o, o.l, o.t + ln, o.r, o.b + ln)) return true;
        } else if (test(o, o.l, o.t, o.r, o.b)) return true;
      }
      return !!tab && test(null, tab.l, at - tab.h, tab.r, at);
    };
    const delayFor = (sh: number) => Math.max(0, (B1(sh) + 1 - WF * h1) / 2 - xEnd + sh + 0.5);
    /* Whatever the car already touches where its CSS parks it is the
       drawing as designed: never held against it. */
    const skip = new Set<Box | null>();
    {
      const p = pose(0, 1, 1, 1, 0);
      [...avoid, null].forEach((o) => {
        if (hits(p, 0, 0, new Set([...avoid, null].filter((q) => q !== o)))) skip.add(o);
      });
    }
    /* After the hand-over the small taxi takes the entry arc at 1.5
       times the scroll (the schedule below), riding up with About as it
       goes: it must clear the copy too. Its box turned to its heading. */
    const arcLen = E.L1 - E.L0;
    const arcS = arcLen / 1.5;
    const arcClear = (sh: number, delay: number) => {
      for (let j = 1; j <= 8; j++) {
        const s = sh + (arcS * j) / 8;
        const [cx, cy, an] = pointAt(E, E.L0 + (arcLen * j) / 8);
        const hx = Math.abs(Math.cos(an)) * (carW / 2) + Math.abs(Math.sin(an)) * (carH / 2);
        const hy = Math.abs(Math.sin(an)) * (carW / 2) + Math.abs(Math.cos(an)) * (carH / 2);
        const X = cx + dx;
        const Y = cy + aTop(s);
        const ln = lineY(s, delay);
        for (const o of avoid) {
          if (skip.has(o)) continue;
          const t = o.line ? o.t + ln : o.t;
          const bt = o.line ? o.b + ln : o.b;
          if (o.line && (ln <= 0.5 || ln >= H - 0.5)) continue;
          if (t >= aTop(s)) continue;
          if (X - hx < o.r + PAD && X + hx > o.l - PAD && Y - hy < bt + PAD && Y + hy > t - PAD) return false;
        }
      }
      return true;
    };
    const N = 48;
    const fits = (sh: number, a: number, b: number) => {
      const delay = delayFor(sh);
      for (let i = 0; i <= N; i++) {
        const s = (sh * i) / N;
        if (hits(pose(s, sh, a, b, delay), s, delay, skip)) return false;
      }
      return arcClear(sh, delay);
    };
    /* The plan that keeps it clear and gives the shrink the most scroll:
       how far the page has scrolled when the car is down to k1 ^ 0.6 (a
       sixth of its size or so; the rest is the small car's run). A
       longer drive with the same shrink wins a tie, then the earliest
       pull-away. A drive is at most a quarter of a screen. */
    const As = [1.5, 2, 2.6, 3.4, 4.5];
    const Bs = [1, 1.35, 1.8, 2.4, 3.2, 4.2, 5.5, 7];
    let plan: [number, number, number] | null = null;
    let best = -1;
    for (let sh = Math.round(vh * 0.26); sh >= 24; sh -= 6) {
      /* no b can beat the best so far at this length or shorter */
      if (sh * (1 - Math.pow(0.4, 1 / Bs[0])) <= best + 1) break;
      for (const b of Bs) {
        const m = sh * (1 - Math.pow(0.4, 1 / b));
        if (m <= best + 1) break;
        const a = As.find((a) => fits(sh, a, b));
        if (a) {
          plan = [sh, a, b];
          best = m;
          break;
        }
      }
    }
    if (!plan) {
      plan = [Math.max(24, Math.round(vh * 0.1)), 3.4, 7];
      if (process.env.NODE_ENV !== "production") console.warn("driveRoute: no clear path for the hero's taxi at this size");
    }
    const [sh, a, b] = plan;
    const delay = delayFor(sh);
    return {
      cars: P.cars,
      sh,
      arcS,
      delay,
      road: P.g,
      tailEnd: n1 + 0.995 * carW,
      Lend: E.L0,
      X0: P.X0,
      B0: P.B0,
      bw: P.bw,
      pose: (s: number) => pose(s, sh, a, b, delay),
    };
  }

  /* With the hero's drive the schedule starts at its hand-over: the
     small taxi takes the entry arc down into About's ring at 1.5 times
     the scroll, and About's stretch carries on from the ring. */
  const anchors: [number, number][] =
    drive && entry
      ? [
          [drive.sh, drive.Lend],
          [drive.sh + drive.arcS, entry.L1],
        ]
      : [[0, 0]];
  let cur: [number, number] = [anchors[anchors.length - 1][0], anchors[anchors.length - 1][1]];
  const add = (s: number, l: number) => {
    anchors.push([s, l]);
    cur = [s, l];
  };

  /* The moment a follow motion joins the reading line, as an anchor, if
     that comes after s0 and before s1. */
  const join = (bl: (typeof blocks)[number], m: (s: number) => number, s0: number, s1: number) => {
    const onLine = (s: number) => lamAtY(bl, s + R - sheets[bl.k].top);
    const sj = cross((s) => Math.abs(m(s) - onLine(s)) - 0.5, s0, s1);
    if (sj > s0 && sj < s1) anchors.push([sj, m(sj)]);
  };

  /* Drives a stretch from cur into a fixed (s, L): along the follow
     motion, then straight in at 1.5 times the scroll if it has ground
     to make up, 0.6 if it is early (or straight from cur, if even that
     is not enough). */
  const into = (bl: (typeof blocks)[number], ts: number, tl: number) => {
    const m = follow(bl, cur[0], cur[1]);
    const fast = tl > m(ts);
    const v = fast ? 1.5 : 0.6;
    /* how far the straight line in, started at s, falls short of the
       target: it changes sign once, where the line in must leave */
    const short = (s: number) => tl - m(s) - v * (ts - s);
    const sx = cross((s) => (fast ? -short(s) : short(s)), cur[0], ts);
    if (sx > cur[0] && sx < ts) {
      join(bl, m, cur[0], sx);
      add(sx, m(sx));
    }
    add(ts, tl);
  };

  for (let bi = 0; bi < blocks.length; bi++) {
    const bl = blocks[bi];
    const next = blocks[bi + 1];
    const k = bl.k;
    const first = segs[bl.a];
    const lastSeg = segs[bl.b];
    /* the hero's stretch is the big taxi's drive (above) */
    if (drive && k === restSheet) continue;

    if (!bl.gutter) {
      /* a run: the hero's road, the bridge's U-turn, the kerb */
      if (bi === 0) continue; /* the hero's road: from 0 to the meeting below */
      const y0 = first.y0 + sheets[k].top;
      const y1 = lastSeg.y1 + sheets[k].top;
      const len = lastSeg.L1 - first.L0;
      const final = !next;
      let ts = y0 - vh * 0.84;
      /* The last run (the foot corner and the kerb) ends at the deepest
         scroll, which can leave it only a couple of hundred px of scroll,
         and the footer's big taxi drives it as a stand-in: give it at
         least len / 2.5 where it can, but never start it before its
         corner is up on the screen. */
      if (final) ts = Math.max(Math.min(ts, maxS - len / 2.5), y0 - vh);
      ts = Math.max(ts, cur[0] + (first.L0 - cur[1]) / 2.2);
      if (final) ts = Math.min(ts, maxS - len / 6);
      const prevBl = blocks[bi - 1];
      if (prevBl?.gutter) into(prevBl, ts, first.L0);
      else add(ts, first.L0);
      const te = final ? maxS : Math.max(y1 - vh * 0.16, ts + len / 6);
      add(te, lastSeg.L1);
      continue;
    }

    /* a stretch: does it end at a change of sheet? */
    if (next && next.k !== k) {
      const ns = sheets[next.k];
      const ring = (s: number) => screenTop(ns, s) - ns.tab / 2;
      if (bi === 0 || (bi === 1 && !blocks[0].gutter)) {
        /* the hero: the taxi gets to the top of its gutter just as the
           next sheet's ring climbs to it */
        const top = first.L0;
        const sh = cross((s) => ring(s) - taxiScreen(k, top, s), 0, maxS);
        if (sh >= maxS && process.env.NODE_ENV !== "production") console.warn("driveRoute: the next sheet's ring never meets the taxi", ns.el);
        add(sh, top);
        add(sh, segs[next.a].L0);
        continue;
      }
      const m = follow(bl, cur[0], cur[1]);
      const sh = cross((s) => ring(s) - taxiScreen(k, m(s), s), cur[0], maxS);
      if (sh >= maxS && process.env.NODE_ENV !== "production") console.warn("driveRoute: the next sheet's ring never meets the taxi", ns.el);
      join(bl, m, cur[0], sh);
      add(sh, m(sh));
      add(sh, segs[next.a].L0);
      continue;
    }
    if (!next) {
      /* the route ends on a stretch: arrive at the deepest scroll */
      into(bl, maxS, lastSeg.L1);
    }
    /* else a run follows in this sheet, which drives into it */
  }

  /* Never backwards, and never past the deepest scroll. */
  for (let i = 1; i < anchors.length; i++) {
    anchors[i][0] = Math.min(maxS, Math.max(anchors[i][0], anchors[i - 1][0]));
    anchors[i][1] = Math.max(anchors[i][1], anchors[i - 1][1]);
  }
  return { sheets, segs, anchors, end: L, carW, carH, drive };
}

export function driveRoute(root: ParentNode = document, { car: drive = false }: { car?: boolean } = {}): () => void {
  if (!drive) {
    return fillByReadingLine(
      Array.from(root.querySelectorAll<HTMLElement>(".rail")),
      Array.from(root.querySelectorAll<HTMLElement>(".elbow"))
    );
  }

  const undoSpurs = fillByReadingLine(Array.from(root.querySelectorAll<HTMLElement>(".rail.r-spur")), []);
  const car = makeCar();
  let model: Model | null = null;
  let host: HTMLElement | null = null;
  let shown: boolean | null = null;

  /* over: a fill worked out by the caller (the hero's road, to the big
     taxi's tail) */
  const fill = (g: Seg, L: number, cx: number | null, over?: number) => {
    const el = g.el;
    if (!el) return;
    if (el.classList.contains("elbow")) {
      const ahead = L < (g.L0 + g.L1) / 2;
      if (g.last !== +ahead) {
        g.last = +ahead;
        el.classList.toggle("ahead", ahead);
      }
      return;
    }
    const len = g.L1 - g.L0;
    let f = len > 0 ? Math.min(1, Math.max(0, (L - g.L0) / len)) : L >= g.L0 ? 1 : 0;
    if (g.stand && cx !== null && L < g.L1) {
      /* a stand-in's rail fills to the car's tail */
      const dir = g.x1 >= g.x0 ? 1 : -1;
      f = Math.min(1, Math.max(0, ((cx - dir * g.stand.half - g.x0) * dir) / Math.max(1, len)));
    }
    if (over !== undefined) f = over;
    f = Math.round(f * 1000) / 1000;
    if (f === g.last) return;
    g.last = f;
    const b = el.firstElementChild as HTMLElement | null;
    /* 2D, see fillByReadingLine */
    if (b) b.style.transform = Math.abs(g.y1 - g.y0) > Math.abs(g.x1 - g.x0) ? `scaleY(${f})` : `scaleX(${f})`;
  };

  const paint = (s: number) => {
    const m = model;
    if (!m) return;
    let L = Math.min(m.end, Math.max(0, lamAt(m.anchors, s)));

    /* The hero's drive: until it hands over, the big taxi is the taxi,
       and the hero's road fills to its tail (the rest of the hero's
       stretch with it, at the same share). */
    let standing = false;
    let roadFill: number | undefined;
    const d = m.drive;
    if (d) {
      const on = s < d.sh;
      if (on !== d.on) {
        d.on = on;
        /* parked, it is visible by its own CSS: hand that back rather
           than force it over anything that hides its sheet */
        d.cars.forEach((c) => (on ? c.style.removeProperty("visibility") : (c.style.visibility = "hidden")));
      }
      const p = on ? d.pose(s) : null;
      if (p) {
        const t = `translate3d(${(p.x - d.X0).toFixed(2)}px,${(p.B - d.B0).toFixed(2)}px,0) scale(${p.k.toFixed(4)})`;
        d.cars.forEach((c) => (c.style.transform = t));
        const g0 = d.road;
        const tail = p.x + 0.995 * p.k * d.bw;
        roadFill = Math.min(1, Math.max(0, (g0.x0 - tail) / Math.max(1, g0.x0 - d.tailEnd)));
        L = g0.L0 + (d.Lend - g0.L0) * roadFill;
        standing = true;
      }
      standFns.get("road")?.forEach((fn) => fn(p ? p.t : 1, on));
    }
    const g = segAt(m.segs, L);

    /* stand-ins first: one of them may be the taxi just now */
    m.segs.forEach((sg) => {
      const st = sg.stand;
      if (!st) return;
      const u = Math.min(1, Math.max(0, (L - sg.L0) / Math.max(1, sg.L1 - sg.L0)));
      const on = L >= sg.L0 && (L < sg.L1 || (st.park === "rest" && L >= sg.L1));
      const cx = st.c0 + (st.c1 - st.c0) * u;
      if (on !== st.on) {
        st.on = on;
        st.cars.forEach((c) => (c.style.visibility = on ? "visible" : "hidden"));
      }
      if (on) {
        const t = `translate3d(${(cx - st.rest).toFixed(2)}px,0,0)`;
        st.cars.forEach((c) => (c.style.transform = t));
        standing = true;
      }
      fill(sg, L, cx);
      standFns.get(st.name)?.forEach((fn) => fn(u, on));
    });

    m.segs.forEach((sg) => {
      if (!sg.stand) fill(sg, L, null, d && sg === d.road ? roadFill : undefined);
    });

    if (shown !== !standing) {
      shown = !standing;
      car.style.visibility = shown ? "visible" : "hidden";
    }
    if (standing) return;

    const [x, y, a] = pointAt(g, L);
    let k = g.sheet;
    let yy = y;
    /* drawn in the next sheet while that sheet's tab rides over it */
    const nk = k + 1;
    if (nk < m.sheets.length) {
      const ys = screenTop(m.sheets[k], s) + y;
      const nt = screenTop(m.sheets[nk], s);
      if (nt - m.sheets[nk].tab < ys + m.carW / 2) {
        k = nk;
        yy = ys - nt;
      }
    }
    const sheet = m.sheets[k].el;
    if (host !== sheet) {
      sheet.appendChild(car);
      host = sheet;
    }
    car.style.transform = `translate3d(${(x - m.carW / 2).toFixed(2)}px,${(yy - m.carH / 2).toFixed(2)}px,0) rotate(${((a * 180) / Math.PI).toFixed(2)}deg)`;
  };

  const build = () => {
    /* measured on the first sheet, where it sits before anything moves */
    const first = root.querySelector<HTMLElement>(".sheet");
    if (!first) return;
    if (!car.isConnected) {
      first.appendChild(car);
      host = first;
    }
    car.style.transform = "none";
    model = withMeasure(() => chain(root, car));
    /* the copy line waits for the hero's taxi (THE HERO'S DRIVE) */
    heroLine.delay = model?.drive?.delay ?? 0;
    lineFns.forEach((fn) => fn());
    /* each rail fills from the end the taxi comes in at */
    model?.segs.forEach((g) => {
      const b = g.el?.classList.contains("rail") ? (g.el.firstElementChild as HTMLElement | null) : null;
      if (!b) return;
      b.style.transformOrigin =
        Math.abs(g.y1 - g.y0) > Math.abs(g.x1 - g.x0) ? (g.y1 >= g.y0 ? "50% 0" : "50% 100%") : g.x1 >= g.x0 ? "0 50%" : "100% 50%";
    });
  };

  const st = ScrollTrigger.create({
    start: 0,
    end: () => maxScroll(),
    onRefresh: (self) => {
      build();
      paint(self.scroll());
    },
    onUpdate: (self) => paint(self.scroll()),
  });
  build();
  paint(window.scrollY);

  if (process.env.NODE_ENV !== "production") {
    (window as unknown as { __route?: () => Model | null }).__route = () => model;
  }

  return () => {
    st.kill();
    undoSpurs();
    car.remove();
    const m = model;
    m?.drive?.cars.forEach((c) => {
      c.style.removeProperty("transform");
      c.style.removeProperty("visibility");
      c.style.removeProperty("transform-origin");
    });
    if (m?.drive) standFns.get("road")?.forEach((fn) => fn(1, false));
    heroLine.delay = 0;
    lineFns.forEach((fn) => fn());
    m?.segs.forEach((g) => {
      if (g.stand) {
        g.stand.cars.forEach((c) => {
          c.style.removeProperty("transform");
          c.style.removeProperty("visibility");
          c.style.removeProperty("transform-origin");
        });
        standFns.get(g.stand.name)?.forEach((fn) => fn(1, false));
      }
      const el = g.el;
      if (!el) return;
      el.classList.remove("ahead");
      const b = el.firstElementChild as HTMLElement | null;
      if (b && el.classList.contains("rail")) {
        b.style.removeProperty("transform");
        b.style.removeProperty("transform-origin");
      }
    });
    model = null;
  };
}

/* ============================================================
   PLAYS ONCE

   playOnce(targets, from, to) for the pencil work (notes, arrows,
   stamps, drawings): each target jumps to `from` when this runs and
   plays to `to` once, the first time its top passes 85% of the viewport
   (clamped to the deepest scroll, so a drawing near the foot of the page
   still plays). Never undone on the way back up, like ink on paper.
   Markup stays the final state, so without scripts all of it is simply
   there. Returns a cleanup.
   ============================================================ */
export function playOnce(
  targets: gsap.DOMTarget,
  from: gsap.TweenVars,
  to: gsap.TweenVars,
  { at = 0.85 }: { at?: number } = {}
): () => void {
  const els = gsap.utils.toArray<Element>(targets);
  if (!els.length) return () => {};
  gsap.set(els, from);
  const tweens: gsap.core.Tween[] = [];
  const triggers = ScrollTrigger.batch(els, {
    once: true,
    start: (self: ScrollTrigger) => {
      const r = (self.trigger as Element).getBoundingClientRect();
      return Math.min(r.top + window.scrollY - window.innerHeight * at, maxScroll() - 1);
    },
    onEnter: (batch) => {
      tweens.push(gsap.to(batch, { ...to, overwrite: "auto" }));
    },
  });
  return () => {
    triggers.forEach((t) => t.kill());
    tweens.forEach((t) => t.kill());
    gsap.set(els, { clearProps: Object.keys(from).join(",") });
  };
}

/* ============================================================
   TEXT HELPERS
   ============================================================ */

/* Renders a string where *asterisked* words become the light accent
   (the light word of a weight-contrast title). Returns plain segments
   the caller maps over. */
export function parseAccent(text: string): { text: string; accent: boolean }[] {
  return text
    .split(/(\*[^*]+\*)/g)
    .filter(Boolean)
    .map((seg) =>
      seg.startsWith("*") && seg.endsWith("*")
        ? { text: seg.slice(1, -1), accent: true }
        : { text: seg, accent: false }
    );
}
