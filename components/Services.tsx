"use client";

import { useEffect, useRef, useState } from "react";
import { ScrollTrigger, playOnce } from "@/lib/motion";
import { services } from "@/lib/content";
import { Rail, Station } from "@/components/Route";
import BridgeBand from "@/components/BridgeBand";
import ShortOnTimeBoard from "@/components/ShortOnTimeBoard";
import ServicePlotter from "@/components/ServicePlotter";

/* ============================================================
   WHAT I CAN DO (Sheet 03, inside ServicesSheet)
   Top to bottom: the bridge crossing (BridgeBand), the heading with its
   handwritten note and the "Short on time?" board, the seven services as
   an accordion hung on the route like stations on a line (the open row's
   station is filled), the plotter card beside it from 761px up, and the
   rooftops seam that closes the sheet.

   Rows expand via grid-template-rows 0fr to 1fr, which transitions to
   *content* height: no measuring, nothing to redo on resize, and it keeps
   working when the copy changes. Without scripts every panel shows open
   (globals.css, [data-svc-panel]) and every row says so.
   ============================================================ */

/* Line icons for the rows, keyed by service title (24 box). Decorative:
   the title beside each says the same. */
const ICONS: Record<string, React.ReactNode> = {
  "Mobile Development": (
    <>
      <rect x="7" y="2.5" width="10" height="19" rx="2" />
      <path d="M10.5 18.5h3" />
    </>
  ),
  "Robotics & Embedded Systems": (
    <>
      <path d="M4 21h8M8 21v-4l5-6 5 2" />
      <circle cx="8" cy="17" r="1.6" />
      <circle cx="13" cy="11" r="1.6" />
      <path d="M18 13l2-3m-2 3l2.5 1" />
    </>
  ),
  "AI & Automation": (
    <>
      <rect x="6" y="6" width="12" height="12" rx="1.5" />
      <path d="M9 2.5v3.5M12 2.5v3.5M15 2.5v3.5M9 18v3.5M12 18v3.5M15 18v3.5M2.5 9H6M2.5 12H6M2.5 15H6M18 9h3.5M18 12h3.5M18 15h3.5" />
    </>
  ),
  "Full-Stack Development": (
    <>
      <path d="M12 3l9 5-9 5-9-5 9-5z" />
      <path d="M3 12.5l9 5 9-5M3 16.5l9 5 9-5" />
    </>
  ),
  Cybersecurity: (
    <>
      <rect x="5" y="10.5" width="14" height="10" rx="1.5" />
      <path d="M8 10.5V7.5a4 4 0 018 0v3" />
      <path d="M12 14.5v2.5" />
    </>
  ),
  "Web Design & Branding": (
    <>
      <rect x="2.5" y="4" width="19" height="16" rx="1.5" />
      <path d="M2.5 8.5h19" />
      <circle cx="5.5" cy="6.2" r=".6" />
      <path d="M6 12h7M6 15h5" />
    </>
  ),
  "DevOps & Tooling": (
    <>
      <circle cx="12" cy="12" r="3" />
      <path d="M12 2.5v3M12 18.5v3M2.5 12h3M18.5 12h3M5.3 5.3l2.1 2.1M16.6 16.6l2.1 2.1M5.3 18.7l2.1-2.1M16.6 7.4l2.1-2.1" />
    </>
  ),
};

/* The heading's id: ServicesSheet hands it to the sheet as its label. */
export const SERVICES_HEADING_ID = "h-services";

export default function Services() {
  const root = useRef<HTMLDivElement>(null);
  /* One row at a time. The first starts open, so the sheet shows what a
     panel holds. */
  const [open, setOpen] = useState<number | null>(0);
  const lastOpen = useRef<number | null>(0);
  /* Row 01's starting open state is not a choice: until a row is clicked
     the plotter is not held, so from 1024px up it follows the scroll. */
  const [picked, setPicked] = useState(false);
  /* What the plotter shows: the row under a mouse, else the one with
     keyboard focus, else the open one. Touch never sets hover. */
  const [hover, setHover] = useState<number | null>(null);
  const [focus, setFocus] = useState<number | null>(null);
  const list = useRef<HTMLUListElement>(null);
  /* False in the server HTML and while hydrating, true once React runs.
     Without scripts globals.css shows every panel open, so until then the
     panels are not inert and the rows say they are expanded: an inert
     panel would be visible but unreadable to a screen reader. Set after
     mount, so the first client render matches. */
  const [live, setLive] = useState(false);
  useEffect(() => setLive(true), []);

  /* The handwritten note is pencilled in once, as it comes up the page.
     The markup is its final state, so without scripts it is simply there. */
  useEffect(() => {
    const note = root.current?.querySelector<HTMLElement>(".svc-note");
    if (!note) return;
    return playOnce(note, { opacity: 0, y: 10 }, { opacity: 1, y: 0, duration: 0.9, ease: "power2.out" });
  }, []);

  /* Opening a row pushes everything below it down. The sheet stack
     refreshes ScrollTrigger when a sheet's height settles, but the rows'
     own grid transition takes 600ms, so refresh once more after it has
     finished: every trigger further down the page then measures from the
     final layout. The ref skips StrictMode's second mount, where nothing
     changed. */
  useEffect(() => {
    if (lastOpen.current === open) return;
    lastOpen.current = open;
    const t = window.setTimeout(() => ScrollTrigger.refresh(), 650);
    return () => window.clearTimeout(t);
  }, [open]);

  return (
    <>
      <BridgeBand />

      <div ref={root} className="svc">
        <Rail className="r-svc-in" />

        <div className="svc-head">
          <div>
            <h2 className="t-head wc" id={SERVICES_HEADING_ID}>
              {/* The space between the halves is real text, so readers
                  get "What I can do". */}
              <b>{services.heading[0]}</b> <span>{services.heading[1]}</span>
            </h2>
            <p className="hand svc-note">{services.note}</p>
          </div>
          <ShortOnTimeBoard />
        </div>

        <div className="svc-grid">
          <ul ref={list} className="srows" onPointerLeave={() => setHover(null)}>
            {services.items.map((item, i) => {
              const isOpen = open === i;
              const btnId = `svc-btn-${i}`;
              const panelId = `svc-panel-${i}`;
              return (
                <li
                  key={item.title}
                  data-srow
                  className={isOpen ? "open" : undefined}
                  onPointerEnter={(e) => {
                    if (e.pointerType !== "touch") setHover(i);
                  }}
                >
                  <h3>
                    <button
                      id={btnId}
                      type="button"
                      className="srow"
                      /* Functional update: decided against the latest
                         state, so two clicks batched into one render
                         cannot disagree. */
                      onClick={() => {
                        setPicked(true);
                        setOpen((cur) => (cur === i ? null : i));
                      }}
                      aria-expanded={live ? isOpen : true}
                      aria-controls={panelId}
                      /* Keyboard focus moves the plotter too. A mouse
                         click also focuses the button, and that should
                         not. */
                      onFocus={(e) => {
                        if (e.currentTarget.matches(":focus-visible")) setFocus(i);
                      }}
                      onBlur={() => setFocus((cur) => (cur === i ? null : cur))}
                      data-hover
                    >
                      <span className="sn">{String(i + 1).padStart(2, "0")}</span>
                      <svg
                        className="ico"
                        viewBox="0 0 24 24"
                        aria-hidden="true"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth={1.5}
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      >
                        {ICONS[item.title]}
                      </svg>
                      <span className="st">{item.title}</span>
                      {/* Plus while closed, minus while open, from
                          aria-expanded in the stylesheet, so the server
                          HTML (every row open) draws minus too. */}
                      <span className="tg" aria-hidden="true" />
                    </button>
                  </h3>

                  {/* Closed panels are inert, not just collapsed: at 0fr
                      their text would otherwise still be announced. No
                      role="region": without scripts all seven are open at
                      once, and that many region landmarks is noise. */}
                  <div
                    data-svc-panel
                    id={panelId}
                    inert={live && !isOpen}
                    className="pwrap"
                    style={{
                      gridTemplateRows: isOpen ? "1fr" : "0fr",
                      opacity: isOpen ? 1 : 0,
                    }}
                  >
                    <div className="pclip">
                      <div className="panel">
                        <ul className="pts">
                          {item.points.map((p) => (
                            <li key={p}>{p}</li>
                          ))}
                        </ul>
                        <p>{item.body}</p>
                      </div>
                    </div>
                  </div>

                  <Station on={isOpen} />
                </li>
              );
            })}
          </ul>

          <ServicePlotter hover={hover ?? focus} open={picked ? open : null} track={list} />
        </div>
      </div>

      {/* The seam into the paste-up: North Kolkata rooftops at night, a
          static self-hosted drawing, with the route running on down the
          gutter in front of it. */}
      <div className="roofs-wrap" aria-hidden="true">
        {/* eslint-disable-next-line @next/next/no-img-element -- a static decorative svg, nothing for next/image to optimise */}
        <img className="roofs" src="/art/rooftops.svg" alt="" width={1440} height={170} loading="lazy" decoding="async" />
        <Rail style={{ top: 0, bottom: 0 }} />
      </div>
    </>
  );
}
