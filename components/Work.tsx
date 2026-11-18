"use client";

import { Fragment, useEffect, useRef } from "react";
import { gsap, playOnce, parseAccent } from "@/lib/motion";
import { work, type Project } from "@/lib/content";
import { DECKLE, C } from "./drawings/kit";
import SosRelay from "./drawings/SosRelay";
import HumanoidExploded from "./drawings/HumanoidExploded";
import CarPlan from "./drawings/CarPlan";
import EvTrack from "./drawings/EvTrack";
import PasteUp from "./PasteUp";
import RegMark from "./RegMark";
import Stamp from "./Stamp";
import Medal from "./Medal";
import { Spur, StopLabel } from "./Route";

/* ============================================================
   SHEET 04: SELECTED WORK
   Green engineering grid paper, pasted up over Services. Its torn
   (deckle) top edge is the seam, and with scripts the paste-up rides it
   (PasteUp.tsx). Then the heading with a four-row index, and the four
   projects, split by dashed cutting lines.

   Each project hangs off the taxi route: a spur from the gutter to its
   numbered stop, with the kind beside it in the hand (the route's stop
   names, content.ts route.stops). Then the title in weight contrast, the
   badge as a highlighter swipe (the first-place badge gets the medal
   instead), the body, the parts list of tags, and a print of the build
   held down with kraft tape, rubber-stamped where there is a real
   verdict. On the right, a drawing plate: the build as a technical
   drawing with numbered balloons, and every word of it in HTML (the
   legend, the red callout, the payload card, the note).

   Rendered inside WorkSheet (the Sheet, its gutter rail). The markup is
   the final state; the motion only plays it in, once each, the first
   time a piece reaches the reading line (playOnce):
     1. the drawing fades up and its leader lines draw on;
     2. the print drops onto the page and settles its 2 degrees;
     3. the stamp presses, a beat later;
     4. the handwritten notes appear.
   Soft mode plays the same: none of it follows the scroll's speed.
   ============================================================ */

/* The drawing for each project, by its index. A project without one
   (a new entry in content.ts) simply has no plate and runs full width. */
const DRAWINGS: Partial<Record<string, () => React.JSX.Element>> = {
  "01": SosRelay,
  "02": HumanoidExploded,
  "03": CarPlan,
  "04": EvTrack,
};

/* Only real URLs open a new tab. A new tab of this same page would just
   be confusing. */
const isExternal = (href: string) => /^https?:\/\//i.test(href);

/* Links come from content.ts, but an href is still an injection point:
   a stray "javascript:" or "data:" URL there would run on click. Allow
   only web, mail and same-site targets, and drop bare "#" placeholders
   so a project never shows a button that goes nowhere. */
const isSafeHref = (href: string) => {
  const h = href.trim();
  return h.length > 1 && /^(https?:\/\/|mailto:|\/(?!\/)|#)/i.test(h);
};

const linksOf = (p: Project) => (p.links ?? []).filter((l) => l.label.trim() && isSafeHref(l.href));

/* The medal stands in for the highlighter on a placing ("1st place in
   ..."): a badge that is a result, not a description. */
const isPlacing = (badge: string) => /^\d+(st|nd|rd|th)\b/i.test(badge.trim());

export default function Work() {
  const root = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = root.current;
    if (!el) return;
    const q = (s: string) => Array.from(el.querySelectorAll(s));
    /* The leader lines belong to their drawing, so they start from the
       drawing's own trigger. Triggered one by one, a long leader low in
       the plate would wait for its own top to reach the reading line and
       the faded-in drawing would show balloons pointing at nothing. */
    const leads = q(".plate .dw [data-lead]");
    const leadTweens: gsap.core.Tween[] = [];
    if (leads.length) gsap.set(leads, { drawSVG: "0%" });
    const undo = [
      playOnce(
        q(".plate .dw"),
        { opacity: 0, y: 16 },
        {
          opacity: 1,
          y: 0,
          duration: 0.9,
          ease: "power2.out",
          onStart(this: gsap.core.Tween) {
            const mine = this.targets<Element>().flatMap((d) => Array.from(d.querySelectorAll("[data-lead]")));
            if (mine.length) {
              leadTweens.push(gsap.to(mine, { drawSVG: "100%", duration: 0.7, delay: 0.35, ease: "power1.inOut" }));
            }
          },
        },
        { at: 0.8 }
      ),
      /* The print drops onto the page: a little above, turned 2 degrees
         more, then it settles. Only the outer .pdrop moves; the print's
         own tilt stays in CSS on .photo. */
      playOnce(q(".pdrop"), { opacity: 0, y: -28, rotation: 2 }, { opacity: 1, y: 0, rotation: 0, duration: 0.8, ease: "back.out(1.4)" }, { at: 0.86 }),
      /* The stamp presses once: in from a little above the paper (larger),
         then it lands. The span inside the static blend holder is what
         scales, so the multiply never sits on a transformed box. */
      playOnce(q(".stampwrap > span"), { opacity: 0, scale: 1.18 }, { opacity: 1, scale: 1, duration: 0.42, delay: 0.55, ease: "power3.in" }, { at: 0.86 }),
      playOnce(q(".pnote, .red, .paycard"), { opacity: 0 }, { opacity: 1, duration: 0.6, delay: 0.5, ease: "power1.out" }, { at: 0.85 }),
    ];
    return () => {
      undo.forEach((u) => u());
      /* Leave the leaders whole: a StrictMode remount or a later route
         visit starts again from complete lines, never from 0%. */
      leadTweens.forEach((t) => t.kill());
      if (leads.length) gsap.set(leads, { clearProps: "strokeDasharray,strokeDashoffset" });
      gsap.killTweensOf(el.querySelectorAll("*"));
    };
  }, []);

  return (
    <>
      {/* The torn top edge, in the paper's own colour, laid over the seam. */}
      <svg className="deckle" viewBox="0 0 1440 30" preserveAspectRatio="none" aria-hidden="true" focusable="false">
        <path fill={C.paper} d={DECKLE} stroke="rgba(29,42,110,.3)" strokeWidth={1} vectorEffect="non-scaling-stroke" />
      </svg>
      <PasteUp />

      <div ref={root} className="wk-in">
        <div className="wk-head">
          <h2 className="t-head wc" id="h-work">
            <b>{work.heading[0]}</b> <span>{work.heading[1]}</span>
          </h2>
          <div className="wk-side">
            <p className="blurb">{work.blurb}</p>
            <ol className="index" aria-label="Projects">
              {work.projects.map((p) => (
                <li key={p.index}>
                  <a href={`#p${p.index}`}>
                    <span className="ix">{p.index}</span>
                    <span className="it">{p.title.replace(/\*/g, "")}</span>
                    <span className="ik">{p.kind}</span>
                  </a>
                </li>
              ))}
            </ol>
          </div>
        </div>

        {work.projects.map((p, i) => (
          <Fragment key={p.index}>
            {i > 0 && <Cut />}
            <Project p={p} />
          </Fragment>
        ))}
      </div>
    </>
  );
}

function Project({ p }: { p: Project }) {
  const titleId = `work-${p.index}-title`;
  const plainTitle = p.title.replace(/\*/g, "");
  const links = linksOf(p);
  const d = p.drawing;
  const Drawing = DRAWINGS[p.index];
  const stamp = d?.stamp;

  return (
    <article className={`proj${Drawing ? "" : " no-plate"}`} id={`p${p.index}`} aria-labelledby={titleId}>
      <div className="pcopy">
        {/* The project's stop on the route: the spur from the gutter, the
            numbered ring, and the kind in the hand. */}
        <p className="pidx">
          <Spur />
          <span className="pn">
            <span className="sr-only">Project </span>
            {p.index}
          </span>
          <StopLabel className="hand">{p.kind}</StopLabel>
        </p>

        <h3 className="ptitle" id={titleId}>
          {parseAccent(p.title).map((s, j) => (s.accent ? <span key={j}>{s.text}</span> : <Fragment key={j}>{s.text}</Fragment>))}
        </h3>

        {p.badge &&
          (isPlacing(p.badge) ? (
            <p className="badge">
              <Medal />
              <span>{p.badge}</span>
            </p>
          ) : (
            <p className="badge">
              <span className="hl">{p.badge}</span>
            </p>
          ))}

        <p className="pbody">{p.body}</p>

        <ul className="tags" aria-label="Built with">
          {p.tags.map((t) => (
            <li key={t}>{t}</li>
          ))}
        </ul>

        {/* No links, no buttons: a button that points at "#" only teaches
            people that the buttons on this page lie. */}
        {links.length > 0 && (
          <div className="plinks">
            {links.map((l, k) => {
              const external = isExternal(l.href);
              return (
                <a
                  key={`${l.label}-${l.href}`}
                  href={l.href}
                  {...(external ? { target: "_blank", rel: "noopener noreferrer" } : {})}
                  data-hover
                  className={`btn ${k === 0 ? "solid" : "line"}`}
                >
                  {/github/i.test(l.label) && <GithubMark />}
                  {l.label}
                  {/* Several projects can share a label like "GitHub", which
                      is ambiguous in a screen reader's link list, so name
                      the project. */}
                  <span className="sr-only">{`: ${plainTitle}${external ? " (opens in a new tab)" : ""}`}</span>
                </a>
              );
            })}
          </div>
        )}

        {/* The print. .pdrop is what drops in; .photo keeps the tilt. */}
        <div className="pdrop">
          <div className="photo">
            <i className="kraft" aria-hidden="true" />
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={p.image}
              alt={p.alt}
              loading="lazy"
              decoding="async"
              width={1800}
              height={1125}
              draggable={false}
              style={p.focus ? { objectPosition: p.focus } : undefined}
            />
            {stamp && (
              <span className="stampwrap" aria-hidden="true">
                <span>
                  <Stamp id={p.index} top={stamp.top} mid={stamp.mid} mid2={stamp.mid2} bottom={stamp.bottom} />
                </span>
              </span>
            )}
          </div>
        </div>
      </div>

      {Drawing && (
        <figure className="plate">
          <div className="dwrap">
            <Drawing />
            {d?.red && <p className="red hand">{d.red}</p>}
            {d?.card && (
              <div className="paycard">
                <b>{d.card.title}</b>
                {d.card.lines.map((line) => (
                  <span key={line} className="hand">
                    {line}
                  </span>
                ))}
              </div>
            )}
          </div>
          {d && d.legend.length > 0 && (
            <ol className="legend hand" aria-label="Drawing key">
              {d.legend.map((line) => (
                <li key={line}>{line}</li>
              ))}
            </ol>
          )}
          {d?.note && <figcaption className="pnote hand">{d.note}</figcaption>}
        </figure>
      )}
    </article>
  );
}

/* The divider between two projects: a dashed cutting line with a
   registration mark at its middle. No lettered ends: on a drawing those
   name a section view, and this sheet has none for them to point to. */
function Cut() {
  return (
    <div className="cut" aria-hidden="true">
      <span />
      <RegMark corner="tl" size={22} className="cm" />
      <span />
    </div>
  );
}

/* GitHub mark (Octicons), in currentColor so it follows the button. */
function GithubMark() {
  return (
    <svg aria-hidden="true" viewBox="0 0 16 16" fill="currentColor" className="arr">
      <path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.013 8.013 0 0016 8c0-4.42-3.58-8-8-8z" />
    </svg>
  );
}
