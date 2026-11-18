"use client";

import { useEffect, useRef } from "react";
import { playOnce } from "@/lib/motion";
import { ventures } from "@/lib/content";

/* ============================================================
   SHEET 05: FOUNDER JOURNEY
   Blueprint blue. Its leading edge is the cream copy line of the
   Exposure in miniature (ticks and two crosshairs), riding the sheet's
   own slide over the grid paper, so the blueprint arrives behind its own
   exposure line. Nothing clips and nothing is pinned.

   Then the heading, and the ghat: a landing with a colonnade, nine
   treads down to the water and two country boats moored at it, one per
   venture. The drawing is a self-hosted image (public/art/ghat.svg, and
   ghat-m.svg on phones, which keeps the pavilion and both whole boats);
   the boats' tags and the note on the water are HTML. On desktop the
   tags hang over their boats on leaders; on a phone they sit in a row
   above the drawing.

   Under it, the railway timeline: Psquare's line runs to its buffer,
   the turnout carries the route across ("Pivoted to Afferex"), and
   Afferex's line runs on and fades. Then the two ventures as title
   blocks.

   Rendered inside JourneySheet (the Sheet, its gutter rail). Motion is
   only the handwriting appearing, once (playOnce); the markup is the
   final state.
   ============================================================ */

/* Timeline layout, in % of the track: where each line starts, where
   the switch label sits and where each year falls. Tied to the .seg,
   .turnout and .buf offsets in styles/s5-work.css. */
const LINE_AT = ["0%", "66.7%"];
const SWITCH_AT = "40%";
const YEAR_AT = ["0%", "20%", "60%"];
const TICK_AT = ["20%", "60%"];

export default function Ventures() {
  const root = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = root.current;
    if (!el) return;
    const notes = Array.from(el.querySelectorAll(".jnote, .tl-sw"));
    return playOnce(notes, { opacity: 0 }, { opacity: 1, duration: 0.8, delay: 0.2, ease: "power1.out" }, { at: 0.85 });
  }, []);

  const [b1, b2] = ventures.boatTags;

  return (
    <div ref={root}>
      {/* The copy line: the sheet's leading edge. */}
      <div className="xedge" aria-hidden="true">
        <i className="jr-xc l" />
        <i className="jr-xc r" />
      </div>

      <div className="jr-in">
        <div className="jr-head">
          <h2 className="t-head wc" id="h-journey">
            <b>{ventures.heading[0]}</b> <span>{ventures.heading[1]}</span>
          </h2>
          <p className="blurb">{ventures.blurb}</p>
        </div>
      </div>

      <div className="ghat">
        {/* Not lazy: a nav jump lands straight on this sheet, and a lazy
            image there arrives a beat after the sheet does (the water
            pops in under the tags). Both files together are about 22KB,
            fetched at low priority. */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img className="ghatsvg d-only" src="/art/ghat.svg" alt="" width={1440} height={370} decoding="async" fetchPriority="low" draggable={false} />
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img className="ghatsvg m-only" src="/art/ghat-m.svg" alt="" width={760} height={340} decoding="async" fetchPriority="low" draggable={false} />
        {b1 && (
          <p className="btag b1">
            <b>{b1.name}</b>
            <span>{b1.line}</span>
          </p>
        )}
        {b2 && (
          <p className="btag b2">
            <b>{b2.name}</b>
            <span>{b2.line}</span>
          </p>
        )}
        <p className="jnote hand">{ventures.note}</p>
      </div>

      <div className="jr-low">
        <div className="rail-tl">
          {ventures.timeline.labels.map((l, i) => (
            <span key={l} className="tl-lab" style={{ left: LINE_AT[i] }}>
              {l}
            </span>
          ))}
          <span className="tl-sw hand" style={{ left: SWITCH_AT }}>
            {ventures.timeline.switch}
          </span>
          <div className="track" aria-hidden="true">
            <i className="seg s1" />
            <i className="buf b-a" />
            <svg className="turnout" viewBox="0 0 300 40" preserveAspectRatio="none" focusable="false">
              <g fill="none" stroke="#e2ebff" strokeWidth={2} vectorEffect="non-scaling-stroke">
                <path d="M0 8 C110 8 190 8 300 8" strokeDasharray="3 5" opacity={0.7} vectorEffect="non-scaling-stroke" />
                <path d="M0 22 C110 22 190 22 300 22" strokeDasharray="3 5" opacity={0.7} vectorEffect="non-scaling-stroke" />
                <path d="M0 8 C60 8 90 24 150 28 M0 22 C60 22 90 34 150 36" vectorEffect="non-scaling-stroke" />
              </g>
            </svg>
            <i className="seg s2" />
            <i className="buf b-b" />
            {TICK_AT.map((at) => (
              <span key={at} className="tick" style={{ left: at }} />
            ))}
          </div>
          {ventures.timeline.years.map((y, i) => (
            <span key={y} className="yr" style={{ left: YEAR_AT[i] }}>
              {y}
            </span>
          ))}
        </div>

        <ul className="vcards" aria-label="Ventures, oldest first">
          {ventures.items.map((v, i) => (
            <li key={v.name}>
              <article className="vcard" aria-labelledby={`venture-${i}`}>
                <header>
                  <h3 id={`venture-${i}`}>{v.name}</h3>
                  <span>{v.kind}</span>
                </header>
                <p className="vst">{v.status}</p>
                <p className="vbody">{v.body}</p>
                <ul className="vfacts" aria-label="In short">
                  {v.facts.map((f) => (
                    <li key={f}>{f}</li>
                  ))}
                </ul>
              </article>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
