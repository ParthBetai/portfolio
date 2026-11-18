"use client";

import { useEffect, useRef } from "react";
import { parseAccent, playOnce } from "@/lib/motion";
import { intro, notes, resume } from "@/lib/content";
import FactsTicket from "./FactsTicket";
import ResumeDisk from "./ResumeDisk";

/* ============================================================
   INTRO (Sheet 02, About)
   The sheet's content column: "Intro" and the paragraph on the left;
   on the right the one facts card (a ticket) and, under it, the resume
   floppy half out of its paper sleeve, with its handwritten note on a
   leader. The sheet itself, its route rail and the tram band below are
   AboutSheet's and Marquee's.

   One column from 1023px down: the ticket, then the floppy and its note
   as one row under it.

   The heading's id is the sheet's label (Sheet labelledBy="h-about").
   ============================================================ */

export const ABOUT_HEADING_ID = "h-about";

export default function Intro() {
  return (
    <div className="in">
      <div className="ab-grid">
        <div className="ab-copy">
          <h2 id={ABOUT_HEADING_ID} className="t-head">
            {intro.heading}
          </h2>
          <p className="lede">
            {/* A *word* in content.ts is the light accent word. */}
            {parseAccent(intro.body).map((seg, i) => (seg.accent ? <em key={i}>{seg.text}</em> : seg.text))}
          </p>
        </div>
        <div className="ab-side">
          <FactsTicket />
          <div className="disk">
            {/* Pulled out of the sleeve at an angle; the disk reads the
                angle back so its tilt still follows the pointer square on. */}
            <ResumeDisk className="dview" diskClassName="sl-turn" under={<SleeveBack />} over={<SleeveFront />} />
            <ResumeNote />
          </div>
        </div>
      </div>
    </div>
  );
}

/* ============================================================
   THE SLEEVE
   A navy disk on a blue sheet was easy to read past, and a cream circle
   behind it (round thirteen) read as a sticker. Floppies came in paper
   sleeves, so this one is half pulled out of its own: a cream envelope
   in the ticket's stock, its front panel over the disk's foot with a
   thumb notch cut in the mouth, its back panel showing either side of
   the disk inside, and "Resume" printed on the front under a highlighter
   swipe, with the file's size. The light cream on the blue is what the
   eye finds first after the heading; the word on it says what it is.

   Both panels are static art inside the disk's link (ResumeDisk's
   `under` and `over`), so the whole sleeve is part of what you click,
   and they sit on the disk's angle with a small turn of their own. They
   are not part of the disk: when the preview takes the disk out, the
   sleeve stays behind, empty. Sizes are in units of the disk (the
   link's box), so one drawing serves every width.
   ============================================================ */

function SleeveBack() {
  return <span className="sl-back" aria-hidden="true" />;
}

function SleeveFront() {
  return (
    <span className="sl-front" aria-hidden="true">
      <span className="sl-print">
        <b>Resume</b>
        <span>{resume.size}</span>
      </span>
    </span>
  );
}

/* ============================================================
   THE NOTE BY THE DISK
   "my resume's on this floppy", in his handwriting, on a leader from the
   disk: a floppy does not say "resume" to everyone at a glance, and a
   note says it the way a person would, without a button. The leader runs
   out from the disk's edge to the words, the way a drawing ties a note
   to its part. Drawn out and written in once when it first
   comes into view, then left alone; without scripts it is simply there.
   ============================================================ */

function ResumeNote() {
  const text = useRef<HTMLParagraphElement>(null);
  const lead = useRef<HTMLElement>(null);

  useEffect(() => {
    const el = text.current;
    const ln = lead.current;
    if (!el || !ln) return;
    const undoLead = playOnce(
      ln,
      { scaleX: 0, transformOrigin: "0% 50%" },
      { scaleX: 1, duration: 0.6, ease: "power2.out", delay: 0.15 },
      { at: 0.9 }
    );
    const undoNote = playOnce(el, { y: 10, opacity: 0 }, { y: 0, opacity: 1, duration: 0.7, ease: "power3.out", delay: 0.45 }, { at: 0.9 });
    return () => {
      undoLead();
      undoNote();
    };
  }, []);

  return (
    <div className="callout">
      <i ref={lead} className="leader" aria-hidden="true" />
      {/* The tilt is on the wrapper: the words inside are what GSAP moves. */}
      <div className="note-tilt">
        <p ref={text} className="hand">
          {notes.resume}
        </p>
      </div>
    </div>
  );
}
