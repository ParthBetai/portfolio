"use client";

import { useEffect, useState } from "react";

/* The hero photo: a background-removed cutout of Parth, cut at the waist.
   WebP with a lossless alpha channel, a fraction of the size of the PNG.
   The hero shows it as a lit relief (HeroPortrait) and falls back to the
   chrome orb if the file is missing.

   The photo is probed rather than rendered-and-caught: an <img> in the
   server HTML 404s before React hydrates, so an onError handler never
   gets the chance to fire. The probe also tells the loader when it can
   stop waiting: "no" is an answer, not a hang. */
export const PORTRAIT_SRC = "/portrait.webp";

export type PortraitState = "pending" | "yes" | "no";

export function usePortrait(src = PORTRAIT_SRC): PortraitState {
  const [state, setState] = useState<PortraitState>("pending");

  useEffect(() => {
    let alive = true;
    const probe = new Image();
    probe.onload = () => alive && setState("yes");
    probe.onerror = () => alive && setState("no");
    probe.src = src;
    void import("./HeroPortrait"); // fetch the relief code alongside the photo, not after it
    return () => {
      alive = false;
    };
  }, [src]);

  return state;
}
