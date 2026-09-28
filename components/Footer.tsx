"use client";

import { useEffect, useId, useRef } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { gsap, reduced } from "@/lib/motion";
import { contact, identity, legal, nav, resume, socials } from "@/lib/content";
import { useYear } from "@/lib/useYear";
import Magnetic from "@/components/Magnetic";
import SocialIcon from "./SocialIcon";

type LenisLike = {
  scrollTo?: (t: string | number, o?: object) => void;
  stop?: () => void;
  start?: () => void;
};

/* The contact section is the footer's own call to action, so it is not
   repeated in the link row: "Get in touch" already goes there. */
const links = nav.filter((n) => n.href !== "#contact");

/* ============================================================
   PLANET HORIZON
   The reference ships this as a glow image; here it is built from CSS so
   it stays sharp at any width and costs no request. Four layers:

     haze    · a wide radial wash of copper rising from the bottom edge
     planet  · a huge black ellipse whose stacked box-shadows are the
               atmosphere; only its upper rim is ever on screen
     flare   · a hot spot on the rim, screen-blended so it only adds light
     overlay · fades the top of the footer back to black so the copy
               above the horizon stays legible

   The planet is centred with left:50% + a negative margin rather than a
   Tailwind translate: translate-* sets the separate `translate` property,
   which would stack with the rotate below and with anything GSAP adds.
   On phones it is drawn much larger: at 230vw a narrow screen sees enough
   of the ellipse that the rim bends into a dome; scaling it up flattens
   the visible arc back into a horizon.
   ============================================================ */
const PLANET_GLOW = [
  "0 -1px 0 1px rgba(255,214,184,0.85)",
  "0 -6px 26px 5px rgba(224,137,90,0.6)",
  "0 -34px 100px 34px rgba(170,88,48,0.4)",
  "0 -90px 220px 90px rgba(96,46,24,0.3)",
].join(", ");

/* The page ends here. By the last screen the accent isn't competing with
   anything, so this is the one place it is allowed to be atmosphere
   rather than affordance. */
export default function Footer() {
  const root = useRef<HTMLElement>(null);
  /* The same footer closes every page. On the home page its section links
     are in-page jumps; anywhere else they lead back to that section of
     the home page. */
  const pathname = usePathname();
  const home = pathname === "/";
  const pathnameIs = (href: string) => pathname === href;
  const to = (hash: string) => (home ? hash : `/${hash}`);
  const mark = useRef<HTMLDivElement>(null);
  const year = useYear();
  /* useId rather than fixed strings: the contact section renders the same
     icons, and two elements sharing an id would point a screen reader at
     the wrong one. */
  const findId = useId();
  const newTabId = useId();

  useEffect(() => {
    const footer = root.current;
    const word = mark.current;
    /* The OS reduced-motion setting keeps both effects: neither is
       velocity-driven, they just follow the scrollbar. */
    if (!footer || !word || reduced()) return;

    const ctx = gsap.context(() => {
      /* Sunrise: the horizon starts low and dim and climbs into place as
         the footer scrolls up, so the glow arrives with the last screen
         instead of sitting there waiting. Scrubbed, so scrolling back sets
         it again. */
      gsap.fromTo(
        "[data-horizon]",
        { yPercent: 22, opacity: 0.45 },
        {
          yPercent: 0,
          opacity: 1,
          ease: "none",
          scrollTrigger: { trigger: footer, start: "top bottom", end: "bottom bottom", scrub: true },
        }
      );

      /* Wordmark: letters rise out of their own masks one after another.
         Reversed on the way back up so the reveal happens every visit, not
         just the first. */
      gsap.fromTo(
        word.querySelectorAll("[data-char]"),
        { yPercent: 110 },
        {
          yPercent: 0,
          stagger: 0.05,
          duration: 1.1,
          ease: "expo.out",
          scrollTrigger: { trigger: word, start: "top 90%", toggleActions: "play none none reverse" },
        }
      );
    }, footer);

    return () => ctx.revert();
  }, []);

  /* Anchor jumps go through Lenis so they share the page's easing; with
     Lenis off (soft motion) the browser does the smooth scroll, and with
     motion off it simply jumps. */
  const go = (e: React.MouseEvent<HTMLAnchorElement>) => {
    const href = e.currentTarget.getAttribute("href");
    if (!href || href.length < 2 || !href.startsWith("#")) return;
    /* getElementById, not querySelector: an id that starts with a digit is
       not a valid CSS selector, and querySelector would throw on it. */
    const target = document.getElementById(href.slice(1));
    if (!target) return;

    e.preventDefault();
    const lenis = (window as unknown as { __lenis?: LenisLike }).__lenis;
    if (lenis?.scrollTo) lenis.scrollTo(href, { offset: 0, duration: 1.4 });
    else target.scrollIntoView({ behavior: reduced() ? "auto" : "smooth" });

    /* preventDefault also cancels the browser's focus move, which would
       leave a keyboard user parked in the footer, and their next Tab would
       drag the page straight back down. Hand focus to the section instead
       (without letting it scroll, the jump above owns that). */
    const el = target as HTMLElement;
    if (!el.hasAttribute("tabindex")) el.setAttribute("tabindex", "-1");
    el.focus({ preventScroll: true });
  };

  return (
    <footer
      ref={root}
      /* A floor, not a fixed height. On a 320px phone the stacked contact
         block, the icon row and the wrapped legal links come close to the
         whole 640px, and with a fixed height anything past that was
         clipped by overflow-hidden, legal links first. Now the wordmark
         band gives up its space first and, past that, the footer grows.
         Whenever everything fits, this is the same box as before. */
      className="relative flex min-h-[max(100svh,640px)] flex-col justify-between overflow-hidden bg-black text-bone"
    >
      {/* ---- background: planet horizon ------------------------------ */}
      {/* GSAP moves this wrapper for the sunrise; the breathing loop lives
          on the child so the two transforms never overwrite each other. */}
      <div data-horizon aria-hidden className="pointer-events-none absolute inset-0">
        <div className="absolute inset-0" style={{ animation: "breathe 7s ease-in-out infinite" }}>
          <div
            className="absolute inset-0"
            style={{
              background:
                "radial-gradient(ellipse 95% 62% at 50% 100%, rgba(200,112,66,0.45) 0%, rgba(110,52,26,0.24) 42%, transparent 74%)",
            }}
          />

          <div
            className="absolute left-1/2 top-[72%] ml-[-210vw] h-[240vw] w-[420vw] rounded-[50%] bg-black md:top-[70%] md:ml-[-115vw] md:h-[125vw] md:w-[230vw]"
            style={{ transform: "rotate(-7deg)", boxShadow: PLANET_GLOW }}
          />

          {/* The flare's top sits half its height (6vw) above the planet's
              top so its centre lands on the rim. Tied to the same 72% /
              70% as the planet, so it tracks the rim at every size. */}
          <div
            className="absolute left-[22%] top-[calc(72%_-_6vw)] h-[12vw] w-[46vw] mix-blend-screen md:top-[calc(70%_-_6vw)]"
            style={{
              transform: "rotate(-7deg)",
              background:
                "radial-gradient(closest-side, rgba(255,226,204,0.9), rgba(224,137,90,0.35) 45%, transparent)",
            }}
          />

          <div className="absolute inset-0 bg-linear-to-b from-black via-black/55 to-transparent" />
        </div>
      </div>

      {/* ---- content -------------------------------------------------- */}
      <div className="relative z-10 flex min-h-0 flex-1 flex-col gutter py-10 md:py-12">
        <div className="flex flex-col justify-between gap-10 md:flex-row">
          {/* min-w-0 lets a long address wrap instead of widening the row */}
          <div className="min-w-0">
            <p className="mb-2 text-sm text-ash">Connect with me</p>
            <a
              href={`mailto:${identity.email}`}
              data-hover
              className="inline-block max-w-full break-words text-2xl font-medium tracking-tight transition-colors duration-300 hover:text-acid sm:text-4xl md:text-5xl"
            >
              {identity.email}
            </a>

            <nav aria-label="Footer" className="mt-6 flex flex-wrap gap-x-6 gap-y-2 text-sm text-bone/80">
              {links.map((l) => (
                <a
                  key={l.href}
                  href={to(l.href)}
                  onClick={go}
                  data-hover
                  className="transition-colors duration-300 hover:text-bone"
                >
                  {l.label}
                </a>
              ))}
              {/* The floppy in the intro is the showpiece; this is the plain
                  route for someone who scrolled straight to the bottom. */}
              <a
                href={resume.href}
                download={resume.fileName}
                data-cursor="DOWNLOAD"
                className="inline-flex items-center gap-1.5 text-acid transition-colors duration-300 hover:text-bone"
              >
                Resume
                <svg
                  aria-hidden
                  focusable="false"
                  width="13"
                  height="13"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M12 4v12" />
                  <path d="m6 11 6 6 6-6" />
                  <path d="M5 20h14" />
                </svg>
                <span className="sr-only">(PDF, {resume.size})</span>
              </a>
            </nav>
          </div>

          <div className="flex flex-col items-start gap-3 md:items-end md:text-right">
            <p className="text-lg font-medium md:text-2xl">{contact.footerNote}</p>
            <p className="max-w-xs text-sm text-ash">{contact.footerBlurb}</p>
            <Magnetic className="mt-3">
              <a
                href={to("#contact")}
                onClick={go}
                data-hover
                className="inline-flex rounded-full bg-bone px-6 py-3 text-sm font-medium text-void transition-colors duration-300 hover:bg-acid"
              >
                Get in touch
              </a>
            </Magnetic>
          </div>
        </div>

        {/* ---- socials ------------------------------------------------ */}
        {/* Icons only: four logos read faster than four words, and the row
            stops competing with the email above it. Each link still has a
            spoken name (aria-label) and a hover name (title), and one shared
            hidden line tells screen readers the links open a new tab. On a
            320px phone the label and the icons do not fit side by side, so
            the row wraps and the icons drop under the label. */}
        <div className="mt-8 flex flex-wrap items-center justify-between gap-x-6 gap-y-3 border-t border-white/10 py-5 md:mt-14 md:py-6">
          <p id={findId} className="t-mono text-ash">
            Find me
          </p>
          <ul aria-labelledby={findId} className="flex items-center gap-3">
            {socials.map((s) => (
              /* flex, so Magnetic's inline-block shell sits flush instead of
                 on a text baseline with a sliver of line box under it. */
              <li key={s.label} className="flex">
                <Magnetic>
                  <a
                    href={s.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label={s.label}
                    aria-describedby={newTabId}
                    title={s.label}
                    data-hover
                    className="grid h-12 w-12 place-items-center rounded-full border border-white/15 bg-white/[0.04] text-bone transition-colors duration-300 hover:border-acid hover:bg-acid/10 hover:text-acid"
                  >
                    <SocialIcon name={s.label} size={20} />
                  </a>
                </Magnetic>
              </li>
            ))}
          </ul>
          <span id={newTabId} className="sr-only">
            Opens in a new tab
          </span>
        </div>

        {/* ---- wordmark ---------------------------------------------- */}
        {/* Decorative: the name is already in the copyright line below.
            Sized to the viewport width and allowed to take real space. It
            used to be capped by a container-query height, but the footer's
            height is a minimum, not a fixed value, and Chrome doesn't treat
            a column flex box with only a min-height as having a definite
            height. The container resolved to 0 and so did the wordmark.
            Now the band has an intrinsic height and the footer simply grows
            on the rare screen where everything doesn't fit, so nothing
            overlaps the links above it. */}
        <div className="flex flex-1 items-center justify-center py-6">
          <div
            ref={mark}
            aria-hidden
            className="t-display pointer-events-none select-none whitespace-nowrap text-[21vw] leading-none text-bone"
          >
            {Array.from(identity.name).map((c, i) => (
              /* Each mask is padded sideways and pulled back by the same
                 amount: the display tracking is negative, so an unpadded
                 box is narrower than the glyph and would shave its edge. */
              <span
                key={i}
                className="inline-block overflow-hidden align-top"
                style={{ paddingInline: "0.06em", marginInline: "-0.06em" }}
              >
                <span data-char className="inline-block">
                  {c === " " ? " " : c}
                </span>
              </span>
            ))}
          </div>
        </div>

        {/* ---- legal ------------------------------------------------ */}
        {/* Phones stack the copyright over the links. From md the copyright
            holds the left edge and the links wrap from the right, so a
            narrow tablet breaks them onto a second line instead of pushing
            the copyright off the row. */}
        <div className="t-mono flex flex-col gap-3 text-[10px] text-ash md:flex-row md:items-center md:justify-between md:gap-8 md:text-xs">
          <p className="md:shrink-0">
            © {year} {identity.fullName}. All rights reserved.
          </p>
          <nav aria-label="Legal" className="min-w-0">
            <ul className="flex flex-wrap gap-x-5 gap-y-2 md:justify-end">
              {legal.pages.map((p) => (
                <li key={p.href}>
                  {/* py-1.5 cancelled by -my-1.5: the 10px type is only
                      about 15px tall, and the padding lifts each tap target
                      past 24px on phones without moving the layout. */}
                  <Link
                    href={p.href}
                    data-hover
                    aria-current={pathnameIs(p.href) ? "page" : undefined}
                    className={`-my-1.5 inline-block py-1.5 transition-colors duration-300 hover:text-bone ${
                      pathnameIs(p.href) ? "text-bone" : ""
                    }`}
                  >
                    {p.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
        </div>
      </div>
    </footer>
  );
}
