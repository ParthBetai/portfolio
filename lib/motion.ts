"use client";

import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

/* Registered once, here, rather than in every component. */
if (typeof window !== "undefined") {
  gsap.registerPlugin(ScrollTrigger);
}

export { gsap, ScrollTrigger };

/* ============================================================
   MOTION POLICY

   Two levels:

     full: everything, including smooth-scroll inertia and the
           velocity-driven extras (skew, shine kicks, dust push).
     soft: the OS asked for reduced motion. Every reveal, the loader, the
           pin wall, the marquees, the hovers and the resume animation
           still run at full strength: they are what the page *is*. What
           drops is the motion that moves the page under you: scroll
           inertia and velocity effects.

   There used to be a third level, "off", set by a Motion button in the
   footer. The button is gone; "off" stays in the type and reduced() stays
   exported so the static code paths in the components keep compiling,
   but nothing sets it any more (the boot script also clears the old
   saved choice, so nobody is left stuck with a dead page).

   Treating the OS setting as a kill switch was the bug that made this
   site look dead: Windows ships with "Animation effects" off on many
   installs (LTSC and VMs especially), browsers then report reduced
   motion to every page, and a kill switch turns the whole design off
   for people who never asked for that.
   ============================================================ */
export type MotionLevel = "full" | "soft" | "off";

export function motionLevel(): MotionLevel {
  if (typeof window === "undefined") return "full";
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "soft" : "full";
}

/** The old explicit off switch. Nothing sets it now, so this is false. */
export const reduced = () => motionLevel() === "off";

/** The OS asked for less motion: skip inertia and velocity-driven extras only. */
export const soft = () => motionLevel() !== "full";


/* ============================================================
   TEXT HELPERS
   ============================================================ */

/* Splits a string into per-word spans, each wrapped in an overflow-hidden
   line box so the word can be revealed by translating it upward.
   Returns the word elements for staggering. */
export function splitWords(el: HTMLElement): HTMLElement[] {
  if (el.dataset.split === "done") {
    return Array.from(el.querySelectorAll<HTMLElement>("[data-word]"));
  }

  const words = (el.textContent ?? "").trim().split(/\s+/);
  el.textContent = "";

  const out: HTMLElement[] = [];
  words.forEach((word, i) => {
    const mask = document.createElement("span");
    mask.style.display = "inline-block";
    mask.style.overflow = "hidden";
    mask.style.verticalAlign = "top";
    /* Descenders would be clipped by overflow:hidden, pad and pull back. */
    mask.style.paddingBottom = "0.12em";
    mask.style.marginBottom = "-0.12em";

    const inner = document.createElement("span");
    inner.style.display = "inline-block";
    inner.textContent = word;
    inner.dataset.word = "";

    mask.appendChild(inner);
    el.appendChild(mask);
    if (i < words.length - 1) el.appendChild(document.createTextNode(" "));
    out.push(inner);
  });

  el.dataset.split = "done";
  return out;
}

/* Renders a string where *asterisked* words become serif-italic accents.
   Returns plain segments the caller maps over. */
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
