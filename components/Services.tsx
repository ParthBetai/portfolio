"use client";

import { Fragment, useEffect, useRef, useState } from "react";
import { gsap, ScrollTrigger, reduced, parseAccent } from "@/lib/motion";
import { services } from "@/lib/content";
import ServiceDrum from "@/components/ServiceDrum";
import ServicePlotter from "@/components/ServicePlotter";

/* The picture beside the list. "plotter" is the blueprint sheet a pen
   plotter draws live; "drum" is the CSS 3D rotary drum it replaced. Change
   this one word to switch: both take the same props and the same slot. */
const VISUAL: "plotter" | "drum" = "plotter";

/* The column the picture takes from lg up; row content starts after it.
   The plotter's column is its sheet plus a gutter either side. The sheet
   is as wide as it can be while (a) the longest row title still fits on
   one line beside it, the vw term, and (b) it fits between the nav and
   the bottom edge with its readout on a short screen, the vh term. */
const LOOK = {
  plotter: {
    Picture: ServicePlotter,
    /* On a tablet the sheet turns landscape and spans the page under the
       heading, so it is not pulled up beside it like the drum. */
    rail: "pointer-events-none gutter relative mt-10 md:mt-12 lg:absolute lg:inset-y-0 lg:left-0 lg:z-20 lg:mt-0",
    body: "lg:[--sheet-w:min(22rem,calc(61vw_-_18rem),calc((100vh_-_12rem)_*_0.8889))] xl:[--sheet-w:min(30rem,calc(61vw_-_23rem),calc((100vh_-_12rem)_*_0.8889))] 2xl:[--sheet-w:min(34rem,calc(61vw_-_23rem),calc((100vh_-_12rem)_*_0.8889))] lg:[--svc-col:calc(var(--sheet-w)_+_5rem)] xl:[--svc-col:calc(var(--sheet-w)_+_8rem)]",
  },
  drum: {
    Picture: ServiceDrum,
    rail: "pointer-events-none gutter relative mt-10 md:mt-[calc(8px_-_13.2vw)] lg:absolute lg:inset-y-0 lg:left-0 lg:z-20 lg:mt-0",
    body: "lg:[--svc-col:24rem] xl:[--svc-col:29rem] 2xl:[--svc-col:33rem]",
  },
}[VISUAL];

type LenisLike = {
  scrollTo?: (t: string | number, o?: object) => void;
  stop?: () => void;
  start?: () => void;
};

/* ------------------------------------------------------------
   FLOOD STATES
   A row is "flooded" (copper field, black ink) in two cases:
     1. the pointer is over it, but only on devices that can truly hover.
        On touch, :hover sticks after a tap and would leave a row lit
        that the reader never meant to highlight.
     2. it is open. An open row stays lit on every device, which is also
        what tells a touch user which row they expanded.
   Every descendant that changes colour uses the same pair of variants,
   so they are spelled out once here. Full literal class names, so the
   Tailwind scanner still finds them.
   ------------------------------------------------------------ */
const FLOOD_FILL =
  "[@media(hover:hover)]:group-hover:scale-y-100 group-data-[open=true]:scale-y-100";
const FLOOD_INK =
  "[@media(hover:hover)]:group-hover:text-void group-data-[open=true]:text-void";
const FLOOD_INK_SOFT =
  "[@media(hover:hover)]:group-hover:text-void/75 group-data-[open=true]:text-void/75";
/* The global focus ring is acid, which vanishes on an acid flood. */
const FLOOD_RING =
  "[@media(hover:hover)]:group-hover:focus-visible:outline-void group-data-[open=true]:focus-visible:outline-void";
/* The CTA inverts against the flood so it never disappears into it. */
const FLOOD_CTA =
  "[@media(hover:hover)]:group-hover:bg-void [@media(hover:hover)]:group-hover:text-acid group-data-[open=true]:bg-void group-data-[open=true]:text-acid";

/* A capability list as a catalogue of full-bleed rows. Hovering a row
   floods it edge to edge with the accent: the one place on the page the
   copper is allowed to cover a whole surface, because the whole surface is
   the control.

   Rows expand via grid-template-rows 0fr → 1fr, which transitions to
   *content* height: no measuring, nothing to redo on resize, and it keeps
   working when the copy changes. */
export default function Services() {
  const root = useRef<HTMLElement>(null);
  /* One row at a time, none to start: the list reads as an index first. */
  const [open, setOpen] = useState<number | null>(null);
  const lastOpen = useRef<number | null>(null);
  /* What the picture shows: the row under a mouse, else the one with
     keyboard focus, else the open one. Touch never sets hover. */
  const [hover, setHover] = useState<number | null>(null);
  const [focus, setFocus] = useState<number | null>(null);
  const list = useRef<HTMLDivElement>(null);
  /* False in the server HTML and while hydrating, true once React runs.
     Without scripts globals.css shows every panel open, so until then the
     panels are not inert and the rows say they are expanded: an inert
     panel would be visible but unreadable to a screen reader, and its
     link dead. Set after mount, so the first client render matches. */
  const [live, setLive] = useState(false);
  useEffect(() => setLive(true), []);

  useEffect(() => {
    const el = root.current;
    if (!el || reduced()) return;

    const ctx = gsap.context(() => {
      /* The heading drops in from above. The trigger is its static wrapper,
         not the heading itself: the heading is the thing being moved, and
         measuring a moving target would shift the start point by the
         offset. */
      const headWrap = el.querySelector<HTMLElement>("[data-svc-headwrap]");
      const head = el.querySelector<HTMLElement>("[data-svc-head]");
      if (head && headWrap) {
        gsap.fromTo(
          head,
          { y: -100, opacity: 0 },
          {
            y: 0,
            opacity: 1,
            duration: 1.2,
            ease: "power3.out",
            scrollTrigger: {
              trigger: headWrap,
              start: "top 85%",
              toggleActions: "play none none reverse",
            },
          }
        );
      }

      const list = el.querySelector<HTMLElement>("[data-svc-list]");
      const rows = el.querySelectorAll<HTMLElement>("[data-svc-row]");
      if (list && rows.length) {
        gsap.fromTo(
          rows,
          { y: 30, opacity: 0 },
          {
            y: 0,
            opacity: 1,
            stagger: 0.07,
            duration: 0.9,
            ease: "expo.out",
            scrollTrigger: { trigger: list, start: "top 85%" },
          }
        );
      }
    }, el);

    return () => ctx.revert();
  }, []);

  /* Opening a row pushes everything below it down, and ScrollTrigger only
     re-measures on window resize, so every trigger further down the page
     would fire early. Re-measure once the expand transition has settled.
     The ref skips StrictMode's second mount, where nothing changed. */
  useEffect(() => {
    if (lastOpen.current === open) return;
    lastOpen.current = open;
    const t = window.setTimeout(() => ScrollTrigger.refresh(), 650);
    return () => window.clearTimeout(t);
  }, [open]);

  /* Same route as the nav's anchors: through Lenis when it is driving the
     page so the jump inherits its easing, native otherwise. */
  const toWork = (e: React.MouseEvent<HTMLAnchorElement>) => {
    e.preventDefault();
    const lenis = (window as unknown as { __lenis?: LenisLike }).__lenis;
    if (lenis?.scrollTo) {
      lenis.scrollTo("#work", { offset: 0, duration: 1.4 });
    } else {
      document
        .getElementById("work")
        ?.scrollIntoView({ behavior: reduced() ? "auto" : "smooth" });
    }
  };

  return (
    <section id="services" ref={root} className="relative bg-void pt-16 pb-16 md:pt-24 md:pb-20">
      {/* The body: heading and list together, so the picture's rail can
          run the full height of both. --svc-col is the column the picture
          takes from lg up; row content starts after it. */}
      <div className={`relative ${LOOK.body}`}>
      {/* Right-aligned, like the reference: the heading hangs off the
          opposite edge from the intro above it, so the page zig-zags. */}
      <div data-svc-headwrap className="gutter">
        <h2
          data-svc-head
          className="t-display chrome text-right text-[13vw] leading-[0.88] md:text-[7.5vw]"
        >
          {/* The space between the lines is never drawn (it sits between
              two blocks), but text readers get "What I can do", not
              "What Ican do". */}
          {services.heading.map((line, i) => (
            <Fragment key={line}>
              {i > 0 && " "}
              <span className="block">
                {parseAccent(line).map((seg, j) =>
                  seg.accent ? (
                    <span key={j} className="t-serif">
                      {seg.text}
                    </span>
                  ) : (
                    <span key={j}>{seg.text}</span>
                  )
                )}
              </span>
            </Fragment>
          ))}
        </h2>
      </div>

      {/* The picture. On a phone it sits between the heading and the list.
          On a tablet the heading only fills the right half: the drum is
          pulled up into the empty left half beside it (the heading is two
          lines of 7.5vw at 0.88 leading: 13.2vw tall), the plotter's
          landscape sheet spans the page under it. From lg up the
          wrapper becomes a rail down the left of the whole body and the
          picture rides it sticky, beside the heading at first, then level
          with whichever rows are mid-screen. It floats over the rows (they
          pass under it, flood and all) and ignores the pointer, so the
          rows beneath stay the controls. */}
      <div className={LOOK.rail}>
        <LOOK.Picture hover={hover ?? focus} open={open} track={list} />
      </div>

      {/* Full bleed: the rows run edge to edge so the flood does too. Only
          the content inside each row sits on the gutter. */}
      <div
        ref={list}
        data-svc-list
        onPointerLeave={() => setHover(null)}
        className="relative mt-10 border-t border-white/15 md:mt-12"
      >
        {services.items.map((item, i) => {
          const isOpen = open === i;
          const btnId = `svc-btn-${i}`;
          const panelId = `svc-panel-${i}`;

          return (
            <div
              key={item.title}
              data-svc-row
              data-open={isOpen}
              onPointerEnter={(e) => {
                if (e.pointerType !== "touch") setHover(i);
              }}
              className="group relative overflow-hidden border-b border-white/15"
            >
              {/* The flood. Rises from the bottom edge and sinks back into
                  it, so leaving a row reads as the colour draining out
                  rather than switching off. */}
              <span
                aria-hidden
                className={`absolute inset-0 origin-bottom scale-y-0 bg-acid transition-transform duration-500 ${FLOOD_FILL}`}
                style={{ transitionTimingFunction: "var(--ease-out-expo)" }}
              />

              <h3 className="relative z-10">
                <button
                  id={btnId}
                  type="button"
                  /* Functional update: decided against the latest state,
                     not the render this handler was created in, so two
                     clicks batched into one render can't disagree. */
                  onClick={() => setOpen((cur) => (cur === i ? null : i))}
                  aria-expanded={live ? isOpen : true}
                  aria-controls={panelId}
                  /* Keyboard focus moves the picture too. A mouse click also
                     focuses the button, and that should not. */
                  onFocus={(e) => {
                    if (e.currentTarget.matches(":focus-visible")) setFocus(i);
                  }}
                  onBlur={() => setFocus((cur) => (cur === i ? null : cur))}
                  data-hover
                  /* The button spans the full row and the row clips its
                     overflow, so the focus ring has to sit inside the edge
                     or it is cut off entirely. */
                  className={`gutter flex w-full items-center gap-4 py-6 text-left focus-visible:outline-offset-[-6px] md:gap-8 md:py-8 lg:pl-[var(--svc-col)] ${FLOOD_RING}`}
                >
                  <span
                    className={`w-8 shrink-0 font-display text-lg leading-none font-medium tabular-nums text-bone transition-colors duration-300 md:w-14 md:text-3xl ${FLOOD_INK}`}
                  >
                    {String(i + 1).padStart(2, "0")}
                  </span>

                  {/* One line from tablet up, so the list reads as a clean
                      ledger. On a phone the longer titles ("Robotics &
                      Embedded Systems") would be cut to an ellipsis and lose
                      the word that matters, so there they wrap instead. */}
                  <span
                    className={`t-display min-w-0 flex-1 text-[4.4vw] leading-[1.05] text-bone transition-colors duration-300 sm:truncate sm:text-[3vw] sm:leading-none md:text-[1.75vw] ${FLOOD_INK}`}
                  >
                    {parseAccent(item.title).map((seg, j) =>
                      seg.accent ? (
                        <span key={j} className="t-serif">
                          {seg.text}
                        </span>
                      ) : (
                        <span key={j}>{seg.text}</span>
                      )
                    )}
                  </span>

                  {/* Points down-right while closed (the content is below),
                      swings up-right once open. Rotation via the CSS
                      `rotate` property; nothing else transforms this. */}
                  <svg
                    aria-hidden
                    viewBox="0 0 24 24"
                    fill="none"
                    className={`h-8 w-8 shrink-0 text-acid md:h-10 md:w-10 ${FLOOD_INK} ${
                      isOpen ? "-rotate-45" : "rotate-45"
                    }`}
                    style={{
                      transition: "rotate 500ms var(--ease-out-expo), color 300ms ease",
                    }}
                  >
                    <path
                      d="M5 12h14M12 5l7 7-7 7"
                      stroke="currentColor"
                      strokeWidth={1.5}
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                </button>
              </h3>

              {/* Closed panels are inert, not just collapsed: at 0fr the
                  links inside would otherwise stay tabbable and announced.
                  Without scripts no row can open, so globals.css shows
                  every panel open (data-svc-panel) and `live` keeps them
                  out of inert. */}
              <div
                data-svc-panel
                id={panelId}
                role="region"
                aria-labelledby={btnId}
                inert={live && !isOpen}
                className="relative z-10 grid transition-[grid-template-rows,opacity] duration-600"
                style={{
                  gridTemplateRows: isOpen ? "1fr" : "0fr",
                  opacity: isOpen ? 1 : 0,
                  transitionTimingFunction: "var(--ease-in-out-quart)",
                }}
              >
                <div className="min-h-0 overflow-hidden">
                  <div className="gutter lg:pl-[var(--svc-col)]">
                    {/* Indented to the title's left edge, so the panel reads
                        as belonging to the row rather than to the index.
                        Two columns only once the picture's column leaves room. */}
                    <div className="grid gap-8 pb-10 pl-12 md:pb-14 md:pl-[5.5rem] xl:grid-cols-2 xl:gap-16">
                      <ul className="space-y-2.5">
                        {item.points.map((p) => (
                          <li
                            key={p}
                            className={`flex items-baseline gap-3 text-sm text-bone transition-colors duration-300 md:text-base ${FLOOD_INK}`}
                          >
                            <span
                              aria-hidden
                              className={`shrink-0 text-[10px] text-acid transition-colors duration-300 ${FLOOD_INK}`}
                            >
                              ■
                            </span>
                            {p}
                          </li>
                        ))}
                      </ul>

                      <div>
                        <p
                          className={`max-w-xl text-base leading-relaxed font-light text-pretty text-ash transition-colors duration-300 md:text-lg ${FLOOD_INK_SOFT}`}
                        >
                          {item.body}
                        </p>

                        {/* The first service is the one Selected work opens
                            with, so it is the one that points at proof.
                            A real link to #work: it still works with no JS. */}
                        {i === 0 && (
                          <a
                            href="#work"
                            onClick={toWork}
                            data-hover
                            className={`mt-8 inline-flex items-center gap-3 bg-acid px-6 py-3 text-xs font-bold tracking-wider text-void uppercase transition-colors duration-300 ${FLOOD_CTA} ${FLOOD_RING}`}
                          >
                            {/* Corner brackets frame the label like a
                                viewfinder: top-left before, bottom-right
                                after. */}
                            <span
                              aria-hidden
                              className="h-2 w-2 self-start border-t border-l border-current"
                            />
                            View projects
                            <span
                              aria-hidden
                              className="h-2 w-2 self-end border-r border-b border-current"
                            />
                          </a>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
      </div>
    </section>
  );
}
