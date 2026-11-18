"use client";

import { useEffect, useRef } from "react";
import dynamic from "next/dynamic";
import { gsap, playOnce } from "@/lib/motion";
import { contact, identity, notes } from "@/lib/content";
import { Rail } from "./Route";
import PhoneChat from "./PhoneChat";

/* Three.js is the heaviest code on the page, and the pin wall sits at
   the very bottom of it, so it is not part of what someone downloads to
   read the hero. ssr:false because it needs a real canvas; there is
   nothing meaningful to prerender. */
const PinField = dynamic(() => import("./PinField"), { ssr: false });

/* ============================================================
   CONTACT
   The top of Sheet 06: "Get in touch" with its yellow hand underline,
   the blurb and the email on the left; on the right the phone, whose
   chat is the contact form (PhoneChat), standing in front of the pin
   wall (PinField).

   The phone is the sheet's one call to action, so it gets the hero's
   print: Parth's portrait stands in front of the Victoria Memorial on a
   yellow halftone disc, and the phone stands in front of the same disc,
   cream with the memorial's yellow dots at the memorial's screen angle,
   drawn out into a speech balloon whose tail sweeps toward the copy. It
   sits behind the phone's head like the disc behind Parth's, and is the
   brightest thing on the night sheet without a lamp or a glow (the
   footer's street lamp is the page's only light). The margin note is the
   label of the box you type in, written beside it with a yellow hand
   arrow from the words to the field (under the phone where it fills the
   column). All of it is static paint on siblings of the window, never
   its ancestors, placed from --phw and --phh, the phone's size
   (s6-contact.css).

   The wall is the reference's window trick, on a smaller window: the
   wall's canvas is position:fixed and viewport sized, and the .pinwin
   box behind the phone clips it with clip-path, so the wall holds still
   while the page slides past that opening. Two rules keep it working:
     · clip-path, not overflow, does the clipping. overflow never clips a
       fixed descendant; clip-path does, and unlike transform or filter
       it does not become the fixed box's containing block;
     · nothing between the wall and the viewport may carry a transform,
       filter, will-change, contain or content-visibility: not .pinwin,
       not this grid, not the sheet, its slot or main. Any of those would
       pin the "fixed" wall to that box. The phone's 3D lives on its own
       elements, which are siblings of the window, and so do the
       balloon's print-in and the footer's swinging sign. PinField checks the contract in
       development (its host's box must be the viewport).

   Without WebGL or scripts the window shows its printed dots instead.
   ============================================================ */
export default function Contact() {
  const root = useRef<HTMLDivElement>(null);
  const win = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = root.current;
    if (!el) return;
    /* Pencil work, played once: the underline under "touch" draws itself
       and the note by the message box fades in. The markup is the
       finished state, so without scripts both are simply there. */
    const undo: Array<() => void> = [];
    const line = el.querySelector<SVGPathElement>(".ul path");
    if (line) undo.push(playOnce(line, { drawSVG: "0%" }, { drawSVG: "100%", duration: 0.9, ease: "power2.inOut", delay: 0.2 }));
    /* The note is the message box's label, so it must never lag its
       arrow: it fires on the arrow's own line (0.95), and its shorter
       delay brings it in just before the arrow starts drawing. Under the
       phone the note sits a few px below the arrow, so on the default
       line it would wait a tenth of a screen of scroll with a bare arrow
       on show. */
    const note = el.querySelector<HTMLElement>(".ctn");
    if (note) undo.push(playOnce(note, { opacity: 0 }, { opacity: 1, duration: 0.8, ease: "power1.out", delay: 0.5 }, { at: 0.95 }));
    /* The note's arrow is drawn on the same way, a beat later. There are
       two (beside the phone, or under it), and only the one shown is
       played; the other keeps its finished markup for a later resize. */
    const arrow = Array.from(el.querySelectorAll<SVGSVGElement>(".ct-point"))
      .filter((svg) => svg.getClientRects().length)
      .flatMap((svg) => Array.from(svg.querySelectorAll<SVGPathElement>("path")));
    if (arrow.length) {
      undo.push(
        playOnce(arrow, { drawSVG: "0%" }, { drawSVG: "100%", duration: 0.7, ease: "power2.inOut", delay: 0.7, stagger: 0.35 }, { at: 0.95 })
      );
    }
    /* The balloon is printed in as the phone comes up: it turns and
       grows into place behind the phone's head, a beat before the label.
       A sibling of the pin wall's window, so this transform is allowed. */
    const balloon = el.querySelector<SVGSVGElement>(".ct-balloon");
    if (balloon) {
      undo.push(
        playOnce(
          balloon,
          { opacity: 0, scale: 0.8, rotation: -14, transformOrigin: "50% 50%" },
          { opacity: 1, scale: 1, rotation: 0, duration: 1.1, ease: "power3.out", delay: 0.15 },
          { at: 0.8 }
        )
      );
    }
    return () => {
      undo.forEach((u) => u());
      if (line) gsap.set(line, { clearProps: "stroke-dasharray,stroke-dashoffset" });
      if (arrow.length) gsap.set(arrow, { clearProps: "stroke-dasharray,stroke-dashoffset" });
    };
  }, []);

  return (
    <div ref={root} className="ct-grid" data-chat-zone>
      <Rail className="r-ct" />

      <div className="ct-copy">
        <h2 id="h-contact" className="t-head ct-head">
          {contact.heading[0]}{" "}
          <span className="ul">
            {contact.heading[1]}
            <svg viewBox="0 0 300 24" preserveAspectRatio="none" aria-hidden="true" focusable="false">
              <path d="M4 16 C70 6 150 4 296 12" fill="none" stroke="#f6c400" strokeWidth="4" strokeLinecap="round" />
            </svg>
          </span>
        </h2>
        <p className="ctb">{contact.blurb}</p>
        <a className="ct-mail" href={`mailto:${identity.email}`}>
          {identity.email}
          <svg className="arr" viewBox="0 0 20 20" aria-hidden="true" focusable="false" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <path d="M5 15L15 5M7 5h8v8" />
          </svg>
        </a>
      </div>

      <div className="ct-phone">
        {/* The window onto the fixed wall. PinField must stay inside it,
            and it must stay free of transforms; see the note above. */}
        <div ref={win} className="pinwin" aria-hidden="true">
          <PinField windowRef={win} />
        </div>
        {/* The printed balloon behind the phone's head; painted over the
            window, under the phone, and never anything the wall sits in. */}
        <svg className="ct-balloon" viewBox="0 0 600 640" aria-hidden="true" focusable="false">
          <defs>
            <pattern id="ct-balloon-dots" width="10" height="10" patternUnits="userSpaceOnUse" patternTransform="rotate(18)">
              <circle cx="5" cy="5" r="2.35" style={{ fill: "var(--color-acid)" }} />
            </pattern>
          </defs>
          <path d={BALLOON} style={{ fill: "var(--color-cream)" }} />
          <path d={BALLOON} fill="url(#ct-balloon-dots)" opacity="0.85" />
        </svg>
        {/* The note is the message box's label: beside the phone on the
            box's line, its arrow running from the words to the field;
            under the phone, pointing up at it, where the phone fills the
            column. Read after the email and before the chat, as before. */}
        <p className="hand ctn">{notes.contact}</p>
        <svg className="ct-point ct-point-side" viewBox="0 0 84 40" aria-hidden="true" focusable="false" fill="none" stroke="#f6c400" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round">
          <path d="M4 22 C22 31 48 30 78 20" />
          <path d="M64 12 L79 20 L67 31" />
        </svg>
        <svg className="ct-point ct-point-under" viewBox="0 0 44 50" aria-hidden="true" focusable="false" fill="none" stroke="#f6c400" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round">
          <path d="M40 43 C22 45 12 33 12 6" />
          <path d="M3 16 L12 4 L21 15" />
        </svg>
        <div className="ct-dev">
          <PhoneChat />
        </div>
      </div>
    </div>
  );
}

/* The balloon, in the 600 x 640 box: a circle (centre 300,300, r 290)
   opened between 120 and 150 degrees for a tail that sweeps down to the
   lower left, toward the copy. One outline, so the halftone over it is
   printed once and never doubles where the tail meets the round. */
const BALLOON = "M155 551A290 290 0 1 0 49 445Q52 560 16 628Q104 600 155 551Z";
