"use client";

import { useRef } from "react";
import { useSheetStick } from "@/lib/motion";
import RegMark from "./RegMark";

/* ============================================================
   SHEET
   One sheet of the drawing set. Every section of the home page is one
   (01 Home to 06 Contact), and so are the info pages and the 404.

   It renders three things in a row, which is what the sheet stack in
   styles/f0-base.css expects as direct children of <main class="sheet-
   stack">:

     1. the anchor: an in-flow, zero-height div carrying the id. It is
        the jump target (jumpTo in lib/motion.ts, scroll-margin-top 84px),
        so a jump lands where the sheet arrives in natural flow, whatever
        is stuck at the time;
     2. the slot: the box the sheet sticks inside. Later slots stack
        above earlier ones (z-index from the sheet number);
     3. the sheet itself: a <section> in its ground (cream, blue, night
        or paper), with the frame, the four registration marks and the
        index tab, whose circled number is the sheet's route stop.

   With scripts the sheet sticks until the next one has covered it
   (useSheetStick); without them the sheets flow, each overlapping the
   one before by 26px.

   The section components inside a sheet must not carry the sheet's id
   themselves (the anchor has it), and their heading id goes in
   labelledBy.
   ============================================================ */
export type Ground = "cream" | "blue" | "night" | "paper";

export default function Sheet({
  id,
  n,
  label,
  ground,
  className = "",
  labelledBy,
  tab = "edge",
  veil = false,
  children,
}: {
  /** The anchor's id: the jump target ("about"). */
  id: string;
  /** The sheet number, two digits ("02"). Also its route stop. */
  n: string;
  /** The index tab's word ("About"). */
  label: string;
  ground: Ground;
  /** Extra classes on the sheet itself ("about"). */
  className?: string;
  /** The id of the sheet's heading, for aria-labelledby. */
  labelledBy?: string;
  /** "edge" rides the top edge over the sheet before; "inner" sits inside
      under the status strip (a first sheet, with nothing above it). */
  tab?: "edge" | "inner" | "none";
  /** Renders a .veil for driveVeil (the outgoing-sheet wash). */
  veil?: boolean;
  children?: React.ReactNode;
}) {
  const ref = useRef<HTMLElement>(null);
  useSheetStick(ref);

  return (
    <>
      <div className="sheet-anchor" id={id} />
      <div className="sheet-slot" style={{ zIndex: Number(n) || 1 }}>
        <section
          ref={ref}
          className={`sheet g-${ground} ${className}`}
          data-ground={ground}
          data-sheet={n}
          data-sheet-id={id}
          aria-labelledby={labelledBy}
        >
          <div className="sheet-frame" aria-hidden="true" />
          <RegMark corner="tl" />
          <RegMark corner="tr" />
          <RegMark corner="bl" />
          <RegMark corner="br" />
          {tab !== "none" && (
            <a className={`sheet-tab${tab === "inner" ? " is-inner" : ""}`} href={`#${id}`}>
              <span className="tn">{n}</span>
              <span className="tl">{label}</span>
            </a>
          )}
          {veil && <div className="veil" aria-hidden="true" data-js-only="" />}
          {children}
        </section>
      </div>
    </>
  );
}
