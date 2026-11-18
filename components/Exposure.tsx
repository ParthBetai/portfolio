"use client";

import { useEffect } from "react";
import { gsap, ScrollTrigger, exposureEnd, exposureLine, onHeroLine } from "@/lib/motion";
import { sheets } from "@/lib/content";

/* ============================================================
   THE EXPOSURE
   Sheet 01 to 02. The hero is sticky in its slot and the About sheet
   slides up over it; ahead of About's rising edge a copy line runs up
   the hero, and everything below the line is the blueprint print of
   the same drawing: the blue grid, the name in pale line, the taxi as
   linework, the memorial in white line, the railing in outline, the
   portrait as a blue duotone. There is no pin and no added scroll
   length: the line is driven by About's own slide,

     line y (viewport) = 2 * (About's top - (100svh - 26px)) + 100svh

   so it leaves the hero's bottom as About starts to rise and reaches
   its top when About is half way up; later by heroLine.delay, the few
   px of scroll the line waits so the hero's taxi, driving off in the
   same scroll, is never cut by it (exposureLine and THE HERO'S DRIVE in
   lib/motion.ts). It is locked to the scroll, like the taxi, so the two
   always agree.

   The hero is eight layers (Hero.tsx): ink back, blueprint back, the
   portrait canvas, ink front, blueprint front, ink copy, blueprint copy
   and this line. The blueprint layers sit in masks: a clipping box
   moved down to the line and an inner box moved back up by the same
   amount, so the print stands still while its window opens. The ink
   copy, on top of the street, sits in the same pair turned the other
   way up (InkMask), so its window closes from below as the line
   rises. The canvas between them splits
   itself in its shaders (HeroPortrait.tsx, uEdge), told where the line
   is through the shared ExposureState. Only transforms are written,
   and nothing is measured per scroll: the positions are read once per
   ScrollTrigger refresh, in natural flow.
   ============================================================ */

/** What the hero's portrait needs to know about the line. One object per
    hero, mutated in place; `onChange` is the portrait's to set. */
export type ExposureState = {
  /** The line's y in the portrait canvas box, in CSS px from its top.
      Infinity while the line is off the hero's bottom (no blueprint). */
  edge: number;
  /** About has covered the hero: the canvas may stop. */
  covered: boolean;
  /** 0 with the line at the bottom, 1 at the top. */
  p: number;
  onChange: (() => void) | null;
};

export function createExposure(): ExposureState {
  return { edge: Infinity, covered: false, p: 0, onChange: null };
}

/** The copy line: a cream rule with a drafting scale under it, a
    crosshair at each end and About's tab riding it on the right. */
export function CopyLine() {
  const about = sheets[1];
  return (
    <div className="h-xline" data-x-line="" aria-hidden="true" data-js-only="">
      <i className="h-xc l" />
      <i className="h-xc r" />
      <span className="sheet-tab h-xt" data-x-tab="" data-drive-avoid="line">
        <span className="tn">{about.n}</span>
        <span className="tl">{about.label}</span>
      </span>
    </div>
  );
}

/** A blueprint layer inside its mask. Inert and hidden from assistive
    technology: the ink print says everything. */
export function BlueprintMask({ className, children }: { className: string; children: React.ReactNode }) {
  return (
    <div className={`h-mask ${className}`} data-x-mask="" aria-hidden="true" inert data-js-only="">
      <div className="h-mask-in" data-x-in="">
        {children}
      </div>
    </div>
  );
}

/** The ink copy's window: the same pair of boxes the other way up (CSS,
    .h-mask-ink), so it shows only what is above the line while the
    blueprint copy shows what is below. Not inert: it is the real copy,
    and without scripts it simply shows everything. */
export function InkMask({ className, children }: { className: string; children: React.ReactNode }) {
  return (
    <div className={`h-mask h-mask-ink ${className}`} data-x-mask="">
      <div className="h-mask-in" data-x-in="">
        {children}
      </div>
    </div>
  );
}

/* An element's top inside the hero, from the offset chain: layout only,
   so a transform (the portrait's rise during the intro) never skews it. */
function offsetIn(el: HTMLElement, root: HTMLElement) {
  let y = 0;
  let e: HTMLElement | null = el;
  while (e && e !== root) {
    y += e.offsetTop;
    e = e.offsetParent as HTMLElement | null;
  }
  return y;
}

/** Drives the line from About's slide. `inside` is any element in the
    hero sheet. */
export function useExposure(inside: React.RefObject<HTMLElement | null>, state: ExposureState) {
  useEffect(() => {
    const hero = inside.current?.closest<HTMLElement>(".sheet");
    const about = document.querySelector<HTMLElement>(`.sheet[data-sheet-id="${sheets[1].id}"]`);
    if (!hero || !about) return;

    const outs = Array.from(hero.querySelectorAll<HTMLElement>("[data-x-mask]"));
    const ins = Array.from(hero.querySelectorAll<HTMLElement>("[data-x-in]"));
    const line = hero.querySelector<HTMLElement>("[data-x-line]");
    const tab = hero.querySelector<HTMLElement>("[data-x-tab]");
    const ctas = hero.querySelector<HTMLElement>("[data-x-ctas]");
    /* The ink copy's lines the riding tab must never sit on. */
    const words = Array.from(hero.querySelectorAll<HTMLElement>("[data-x-avoid]"));
    const canvas = hero.querySelector<HTMLElement>("[data-x-canvas]");

    /* Read at each refresh, under html[data-measure] (natural flow). */
    let H = hero.offsetHeight || 1;
    let canvasTop = 0;
    let btnTop = 0;
    let btnBottom = 0;
    let tabLeft = 0;
    let tabRight = 0;
    let tabTop = 0;
    let tabBottom = 0;
    let avoid: { top: number; bottom: number; left: number; right: number }[] = [];
    let s1 = 1;
    let sCover = 1;
    const measure = () => {
      H = hero.offsetHeight || 1;
      canvasTop = canvas ? offsetIn(canvas, hero) : 0;
      if (ctas) {
        btnTop = offsetIn(ctas, hero);
        btnBottom = btnTop + ctas.offsetHeight;
      }
      /* The tab rides the line at a fixed place, so its box is known up
         to the line's y. Where a line of the copy reaches across under it
         (the name on a narrow phone), the tab steps aside there too. The
         words' extent comes from a range over their text (their blocks
         are as wide as the copy); only x is read from it, which no
         vertical intro transform can skew. */
      if (tab) {
        tabLeft = tab.offsetLeft;
        tabRight = tabLeft + tab.offsetWidth;
        tabTop = tab.offsetTop;
        tabBottom = tabTop + tab.offsetHeight;
      }
      const x0 = hero.getBoundingClientRect().left;
      avoid = words.map((w) => {
        const r = document.createRange();
        r.selectNodeContents(w);
        const b = r.getBoundingClientRect();
        const top = offsetIn(w, hero);
        return { top, bottom: top + w.offsetHeight, left: b.left - x0, right: b.right - x0 };
      });
      const vh = window.innerHeight;
      const aboutTop = about.getBoundingClientRect().top + window.scrollY;
      /* Line y in the hero = 2 * (aboutTop - s - (vh - 26)) + vh - stick
         while the hero is stuck (at min(0, viewport - its height)), which
         it is from the moment the line enters (the line meets the hero's
         bottom exactly as it sticks), so the line moves linearly with
         scroll until s1, where it reaches the top. */
      s1 = exposureEnd(hero.getBoundingClientRect().top + window.scrollY, H, aboutTop, vh);
      /* About covers what is left of the hero once its top reaches the
         viewport's. */
      sCover = aboutTop;
    };

    let lastShown: boolean | null = null;
    let lastOff: boolean | null = null;
    let lastY = NaN;
    let exposing = false;
    const apply = (raw: number) => {
      const y = Math.max(0, Math.min(H, raw));
      if (y === lastY) return;
      lastY = y;
      /* the masks and the line are promoted only while it is on the hero */
      const on = y > 0 && y < H;
      if (on !== exposing) {
        exposing = on;
        hero.classList.toggle("is-exposing", on);
      }
      const down = `translate3d(0, ${y}px, 0)`;
      const up = `translate3d(0, ${-y}px, 0)`;
      for (const o of outs) o.style.transform = down;
      for (const i of ins) i.style.transform = up;
      if (line) {
        line.style.transform = down;
        const shown = y > 0.5 && y < H - 0.5;
        if (shown !== lastShown) {
          line.style.visibility = shown ? "visible" : "hidden";
          lastShown = shown;
        }
      }
      if (tab) {
        const off =
          (y > btnTop - 50 && y < btnBottom + 50) ||
          avoid.some(
            (a) => a.right > tabLeft - 12 && a.left < tabRight + 12 && y + tabBottom > a.top - 8 && y + tabTop < a.bottom + 8
          );
        if (off !== lastOff) {
          tab.classList.toggle("off", off);
          lastOff = off;
        }
      }
      state.p = 1 - y / H;
      state.edge = y >= H ? Infinity : y - canvasTop;
      state.onChange?.();
    };

    /* Locked to the scroll, never smoothed on its own: the hero's taxi
       is, and the line must agree with it to the px. In full motion
       Lenis already smooths the scroll itself. */
    let ctx: gsap.Context | undefined;
    let trigger: ScrollTrigger | undefined;
    const now = () => {
      lastY = NaN;
      apply(exposureLine(trigger ? trigger.scroll() : window.scrollY, s1, H));
    };
    ctx = gsap.context(() => {
      trigger = ScrollTrigger.create({
        trigger: about,
        start: () => {
          measure();
          return 0;
        },
        end: "max",
        onUpdate: (self) => apply(exposureLine(self.scroll(), s1, H)),
        /* a refresh (fonts, a resize) puts the line straight back where
           the scroll says */
        onRefresh: now,
      });
      ScrollTrigger.create({
        trigger: about,
        start: () => sCover,
        end: "max",
        onToggle: (self) => {
          state.covered = self.isActive;
          state.onChange?.();
        },
      });
    });

    measure();
    now();
    /* the taxi's drive was planned again: the line's delay may differ */
    const offLine = onHeroLine(now);

    return () => {
      offLine();
      ctx?.revert();
      ctx = undefined;
      trigger = undefined;
      hero.classList.remove("is-exposing");
      for (const o of outs) o.style.transform = "";
      for (const i of ins) i.style.transform = "";
      if (line) {
        line.style.transform = "";
        line.style.visibility = "";
      }
      state.edge = Infinity;
      state.covered = false;
      state.p = 0;
    };
  }, [inside, state]);
}
