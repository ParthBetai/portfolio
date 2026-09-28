"use client";

import { useEffect, useRef } from "react";
import { gsap, reduced, parseAccent } from "@/lib/motion";
import { work, type Project } from "@/lib/content";
import Magnetic from "./Magnetic";

/* ============================================================
   SELECTED WORK

   Projects alternate sides so the eye zig-zags down the page instead
   of running a column. Each picture sits in a fixed frame and is cut
   oversized inside it, then drifts on scroll. The frame stays put and
   the image moves within it, which reads as depth without shifting any
   layout.

   Three motions per project, all started by GSAP so nothing is hidden
   if the script never runs:
     1. the frame unmasks from the top down (clip-path, not a fade: the
        picture is revealed, not turned up)
     2. the image parallaxes through the frame, scrubbed to scroll
     3. the copy rises in on a short stagger

   Only the explicit motion-off toggle skips them. The OS reduced-motion
   setting (soft) keeps all three: none of them is velocity-driven, so
   none of them moves the page under the reader.
   ============================================================ */

type LenisLike = {
  scrollTo?: (t: string | number, o?: object) => void;
  stop?: () => void;
  start?: () => void;
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

const linksOf = (p: Project) =>
  (p.links ?? []).filter((l) => l.label.trim() && isSafeHref(l.href));

export default function Work() {
  const root = useRef<HTMLElement>(null);

  useEffect(() => {
    /* Motion off: every element is already in its final state in the
       markup, so there is nothing to undo. Just don't animate. */
    if (reduced()) return;

    const ctx = gsap.context(() => {
      /* --- header ------------------------------------------------ */
      const head = root.current?.querySelector<HTMLElement>("[data-work-head]");
      if (head) {
        gsap.fromTo(
          head,
          { y: 60, opacity: 0 },
          {
            y: 0,
            opacity: 1,
            duration: 1.2,
            ease: "expo.out",
            scrollTrigger: { trigger: head, start: "top 85%" },
          }
        );
      }

      /* --- projects ---------------------------------------------- */
      gsap.utils.toArray<HTMLElement>("[data-project]").forEach((card) => {
        const frame = card.querySelector<HTMLElement>("[data-frame]");
        const img = card.querySelector<HTMLElement>("[data-img]");
        const copy = card.querySelector<HTMLElement>("[data-project-copy]");

        if (frame) {
          gsap.fromTo(
            frame,
            { clipPath: "inset(0 0 100% 0)" },
            {
              clipPath: "inset(0 0 0% 0)",
              duration: 1.3,
              ease: "expo.out",
              scrollTrigger: { trigger: frame, start: "top 78%" },
            }
          );
        }

        /* The image is cut 8% taller than the frame at each end, which
           covers the 7% drift either way (7% of 116% is about 8.1%)
           everywhere except the very ends of the scrub, and there the
           whole article is off screen. Scrubbed against the article so
           the drift spans the full time it is visible, whichever side
           the frame is on. */
        if (img) {
          gsap.fromTo(
            img,
            { yPercent: -7 },
            {
              yPercent: 7,
              ease: "none",
              scrollTrigger: {
                trigger: card,
                start: "top bottom",
                end: "bottom top",
                scrub: true,
              },
            }
          );
        }

        /* Triggered on the copy itself, not the article: on phones the
           copy sits a full frame-height below the article's top, and an
           article trigger would play the stagger while it is off screen. */
        if (copy) {
          gsap.fromTo(
            copy.children,
            { y: 30, opacity: 0 },
            {
              y: 0,
              opacity: 1,
              duration: 1,
              ease: "expo.out",
              stagger: 0.08,
              scrollTrigger: { trigger: copy, start: "top 72%" },
            }
          );
        }
      });
    }, root);

    /* Nothing is attached outside GSAP here (no listeners, observers or
       timers), so reverting the context, which kills its ScrollTriggers
       and restores inline styles, is the complete teardown. */
    return () => ctx.revert();
  }, []);

  /* Same route as the nav's anchors: through Lenis when it is driving the
     page so the jump inherits its easing, native otherwise. Read at click
     time, never cached, because SmoothScroll creates and destroys the
     instance on its own schedule. */
  const toContact = (e: React.MouseEvent<HTMLAnchorElement>) => {
    const target = document.getElementById("contact");
    if (!target) return;

    e.preventDefault();
    const lenis = (window as unknown as { __lenis?: LenisLike }).__lenis;
    if (lenis?.scrollTo) lenis.scrollTo("#contact", { duration: 1.4 });
    else target.scrollIntoView({ behavior: reduced() ? "auto" : "smooth" });

    /* preventDefault also cancels the browser's focus move, so a keyboard
       user would stay parked up here and their next Tab would drag the
       page straight back. Hand focus to the section without letting it
       scroll; the jump above owns that. */
    if (!target.hasAttribute("tabindex")) target.setAttribute("tabindex", "-1");
    target.focus({ preventScroll: true });
  };

  return (
    <section id="work" ref={root} className="gutter relative bg-void pb-24 pt-10 md:pt-20">
      {/* --- header ------------------------------------------------ */}
      {/* Heading, blurb and button rise as one, so on a phone the heading
          never slides up through the blurb stacked under it. */}
      <header
        data-work-head
        className="mb-20 flex flex-col gap-8 lg:mb-32 lg:flex-row lg:items-end lg:justify-between"
      >
        {/* One line, never wrapped: the serif word is meant to sit on the
            display word's baseline, not drop beneath it. */}
        <h2
          /* Wraps on a phone: at wdth 125, "SELECTED work" is wider than a
             390px screen, and on one line the serif word ran off the edge. */
          className="t-display text-[12vw] leading-[0.9] sm:whitespace-nowrap sm:text-[8vw] md:text-[6vw] lg:text-[5.2vw]"
        >
          <span className="chrome">{work.heading[0]}</span>{" "}
          {/* t-serif already resets the inherited uppercase; normal-case
              is kept so the word renders exactly as written in content. */}
          <span className="t-serif normal-case text-ash">{work.heading[1]}</span>
        </h2>

        <div className="lg:w-4/12">
          <p className="mb-8 text-sm leading-relaxed text-ash md:text-base">{work.blurb}</p>
          <Magnetic>
            <a
              href="#contact"
              onClick={toContact}
              data-hover
              className="group/btn inline-flex items-center gap-2 rounded-full bg-acid px-6 py-2.5 text-xs font-medium text-void transition-colors duration-300 hover:bg-bone md:text-sm"
            >
              Work with me
              <ArrowDownRight />
            </a>
          </Magnetic>
        </div>
      </header>

      {/* --- projects ---------------------------------------------- */}
      <div className="flex flex-col gap-24 lg:gap-40">
        {work.projects.map((p, i) => {
          const plainTitle = p.title.replace(/\*/g, "");
          const links = linksOf(p);
          const titleId = `work-${p.index}-title`;

          return (
            <article
              key={p.index}
              data-project
              aria-labelledby={titleId}
              className={`group flex flex-col items-center justify-between gap-12 lg:gap-16 ${
                i % 2 === 0 ? "lg:flex-row" : "lg:flex-row-reverse"
              }`}
            >
              {/* frame */}
              <div
                data-frame
                className="relative aspect-[16/10] w-full overflow-hidden rounded-sm bg-[#111] lg:w-6/12"
              >
                {/* The hover zoom lives on this wrapper, not on the img. GSAP
                    (3.11+) folds any CSS `scale`/`translate`/`rotate` into
                    its own transform the first time it parses an element and
                    then pins those properties to "none" inline, so a
                    group-hover:scale-105 on the parallaxed img would be
                    silently dead whenever motion is on. Split across two
                    elements, CSS owns the zoom and GSAP owns the drift. */}
                <div className="absolute inset-0 transition-[scale] duration-700 ease-out-expo group-hover:scale-105">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    data-img
                    src={p.image}
                    alt={p.alt}
                    loading="lazy"
                    decoding="async"
                    width={1800}
                    height={1125}
                    draggable={false}
                    style={p.focus ? { objectPosition: p.focus } : undefined}
                    /* Oversized with top/height, never a translate or scale
                       class: GSAP owns this element's transform. */
                    className="absolute left-0 top-[-8%] h-[116%] w-full object-cover opacity-90 transition-opacity duration-700 ease-out-expo group-hover:opacity-100"
                  />
                </div>
                {/* Grounds the bottom edge so the frame doesn't end on a
                    bright seam against the void. */}
                <div
                  aria-hidden
                  className="pointer-events-none absolute inset-0 bg-linear-to-t from-black/50 to-transparent"
                />
              </div>

              {/* copy. Its direct children are what the stagger reveals,
                  so each row below stays a single element. min-w-0 lets a
                  long title or badge wrap instead of widening the column. */}
              <div
                data-project-copy
                className="flex w-full min-w-0 flex-col items-start lg:w-5/12"
              >
                {/* Number and kind on one line, so a skimmer can tell a
                    robot from an app before reading the title. */}
                {/* .t-mono is unlayered CSS that pins its own weight and
                    size, so it outranks any plain Tailwind utility. The "!"
                    on font-bold here and text-[10px] in the badge is what
                    lets them apply at all. */}
                <p className="mb-5 flex flex-wrap items-center gap-3">
                  <span className="t-mono font-bold! text-acid">{p.index}</span>
                  <span aria-hidden className="h-px w-8 shrink-0 bg-ash-dim" />
                  <span className="t-mono text-ash">{p.kind}</span>
                </p>

                {p.badge && (
                  <p className="t-mono mb-5 inline-flex max-w-full items-center gap-2 rounded-full border border-acid/35 bg-acid/10 px-3 py-1 text-[10px]! text-acid">
                    <span className="min-w-0">{p.badge}</span>
                  </p>
                )}

                <h3
                  id={titleId}
                  className="t-display mb-6 max-w-full text-[8vw] leading-[1.02] [overflow-wrap:anywhere] sm:text-[6vw] md:text-[3.3vw]"
                >
                  {parseAccent(p.title).map((s, j) =>
                    s.accent ? (
                      <span key={j} className="t-serif normal-case text-ash">
                        {s.text}
                      </span>
                    ) : (
                      <span key={j}>{s.text}</span>
                    )
                  )}
                </h3>

                <p className="mb-8 text-sm font-light leading-relaxed text-ash md:text-base">
                  {p.body}
                </p>

                <ul
                  aria-label="Built with"
                  className={`flex flex-wrap gap-2 ${links.length > 0 ? "mb-8" : ""}`}
                >
                  {p.tags.map((t) => (
                    <li
                      key={t}
                      className="t-mono rounded-full border border-white/15 px-3 py-1.5 text-ash"
                    >
                      {t}
                    </li>
                  ))}
                </ul>

                {/* No links, no buttons. A pill that points at "#" only
                    teaches people that the buttons on this page lie. */}
                {links.length > 0 && (
                  <div className="flex flex-wrap items-center gap-3">
                    {links.map((l, k) => {
                      const external = isExternal(l.href);
                      const primary = k === 0;
                      return (
                        <Magnetic key={`${l.label}-${l.href}`}>
                          <a
                            href={l.href}
                            {...(external ? { target: "_blank", rel: "noopener noreferrer" } : {})}
                            data-hover
                            className={
                              primary
                                ? "group/btn inline-flex items-center gap-2 rounded-full bg-acid px-6 py-2.5 text-xs font-medium text-void transition-colors duration-300 hover:bg-bone md:text-sm"
                                : "inline-flex items-center gap-2 rounded-full border border-white/30 px-6 py-2.5 text-xs font-medium text-bone transition-colors duration-300 hover:bg-bone hover:text-void md:text-sm"
                            }
                          >
                            {!primary && /github/i.test(l.label) && <GithubMark />}
                            {l.label}
                            {/* Several projects can share a label like
                                "GitHub", which is ambiguous in a screen
                                reader's link list, so name the project. */}
                            <span className="sr-only">
                              {`: ${plainTitle}${external ? " (opens in a new tab)" : ""}`}
                            </span>
                            {primary && <ArrowUpRight />}
                          </a>
                        </Magnetic>
                      );
                    })}
                  </div>
                )}
              </div>
            </article>
          );
        })}
      </div>
    </section>
  );
}

/* Small up-right arrow for the copper pills that lead somewhere else.
   Nudges along its own diagonal on hover (named group, so hovering the
   article doesn't trigger it). */
function ArrowUpRight() {
  return (
    <svg
      aria-hidden
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      className="h-3.5 w-3.5 transition-transform duration-300 group-hover/btn:-translate-y-0.5 group-hover/btn:translate-x-0.5 md:h-4 md:w-4"
    >
      <path d="M4.5 19.5l15-15m0 0H8.25m11.25 0v11.25" />
    </svg>
  );
}

/* The header pill stays on this page and goes further down it, so its
   arrow points down the page rather than out of it. */
function ArrowDownRight() {
  return (
    <svg
      aria-hidden
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      className="h-3.5 w-3.5 transition-transform duration-300 group-hover/btn:translate-x-0.5 group-hover/btn:translate-y-0.5 md:h-4 md:w-4"
    >
      <path d="M4.5 4.5l15 15m0 0V8.25m0 11.25H8.25" />
    </svg>
  );
}

/* GitHub mark (Octicons), filled with currentColor so it inverts with the
   pill on hover. */
function GithubMark() {
  return (
    <svg aria-hidden viewBox="0 0 16 16" fill="currentColor" className="h-3.5 w-3.5 md:h-4 md:w-4">
      <path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.013 8.013 0 0016 8c0-4.42-3.58-8-8-8z" />
    </svg>
  );
}
