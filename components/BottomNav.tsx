"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { gsap, ScrollTrigger, withMeasure } from "@/lib/motion";
import { nav } from "@/lib/content";
import Ambassador from "./Ambassador";

/* Sheet anchor ids come straight from the nav hrefs, so adding a link in
   content.ts is enough for the tracking to pick it up. */
const idOf = (href: string) => href.replace(/^#/, "");
const IDS = nav.map((item) => idOf(item.href));

/* The taxi on the road under the labels, in px (the outline print). */
const TAXI = 30;
/* Where the page is being read: a line 40% down the viewport. A label
   lights once its sheet's top has come up past it. */
const READ = 0.4;
/* The taxi waits under the lit label for most of the sheet and drives to
   the next label over the last quarter of the way there. */
const DRIVE = 0.75;

/* Where typing happens. While one of these has focus the nav steps
   aside: on a phone the keyboard pushes a fixed bar up, straight over
   the field being typed in. A read-only field opens no keyboard (the
   phone chat's "Message" box), so it keeps the nav. */
const FIELD =
  'input:not([readonly], [type="checkbox"], [type="radio"], [type="button"], [type="submit"], [type="reset"], [type="range"], [type="file"], [type="color"], [type="hidden"]), textarea:not([readonly]), select, [contenteditable="true"], [contenteditable=""]';
const isField = (el: EventTarget | null) => el instanceof Element && el.matches(FIELD);

const clamp01 = (v: number) => Math.max(0, Math.min(1, v));

/* ============================================================
   BOTTOM NAV
   The home page's section nav, drawn as a stretch of the taxi route: a
   cream pill floating above the bottom edge with the five labels, and
   under them a dashed road with the little outlined Ambassador on it.
   The taxi parks under the section being read and drives on to the next
   label over the last quarter of each sheet, so it arrives as the next
   label lights. Journey has no label of its own: it sits between Work
   and Contact, so Work stays lit over it, and Contact lights only once
   the Contact sheet's top passes 40% of the viewport.

   Everything is read from one ScrollTrigger over the whole page (start 0,
   end max): the sheet tops are measured in natural flow at each refresh
   (naturalTop, so a stuck sheet never skews them) and the label centres
   when the row changes size, so a scroll costs arithmetic and one
   quickSetter write of the taxi's x, never a layout read.

   It arrives when the intro hands off (`show`), and gets out of the way
   while a text field has focus and while one of the footer's text rows
   (the title block, the legal line) is passing behind it. Jumps
   are plain hash links: SmoothScroll sends them through jumpTo, which
   lands on the sheet's anchor and moves focus there.
   Styles: .bnav in app/styles/s2-chrome.css.
   ============================================================ */
export default function BottomNav({
  show,
  footer,
}: {
  show: boolean;
  /* The footer's wrapper on the home page: where to look for the rows
     the nav steps aside for. */
  footer?: React.RefObject<HTMLElement | null>;
}) {
  const shell = useRef<HTMLElement>(null);
  const row = useRef<HTMLUListElement>(null);
  const road = useRef<HTMLDivElement>(null);
  const car = useRef<HTMLSpanElement>(null);

  /* Server and no-JS render: Home lit, the taxi under it (CSS default). */
  const [active, setActive] = useState(IDS[0] ?? "home");

  /* Handlers bound once read these, so they live in refs. */
  const shownRef = useRef(false);
  const typing = useRef(false);
  const overFooter = useRef(false);
  const hiddenRef = useRef<boolean | null>(null);
  /* The hide and show tween: one live tween, killed and replaced, and
     kept out of any GSAP context, which would record every one made over
     a long read until it is reverted. */
  const moveTween = useRef<gsap.core.Tween | null>(null);

  useEffect(
    () => () => {
      moveTween.current?.kill();
      moveTween.current = null;
    },
    []
  );

  /* Out of the way or back, whichever the two reasons add up to. Guarded
     on the last value, and inert until the intro has handed over. */
  const apply = useCallback(() => {
    const el = shell.current;
    if (!el || !shownRef.current) return;
    const hide = typing.current || overFooter.current;
    if (hiddenRef.current === hide) return;
    hiddenRef.current = hide;

    moveTween.current?.kill();
    moveTween.current = null;
    const to = hide ? { yPercent: 170, autoAlpha: 0 } : { yPercent: 0, autoAlpha: 1 };
    moveTween.current = gsap.to(el, {
      ...to,
      duration: hide ? 0.4 : 0.7,
      ease: hide ? "power2.in" : "expo.out",
      overwrite: "auto",
    });
  }, []);

  /* --- entrance ---------------------------------------------------- */
  /* The nav carries data-intro-hide, so the boot script's CSS keeps it
     invisible over the loader between first paint and hydration; the
     GSAP set below takes over from that. Without JavaScript neither
     applies and the nav is simply there. */
  useEffect(() => {
    const el = shell.current;
    if (!el) return;

    if (!show) {
      shownRef.current = false;
      gsap.set(el, { yPercent: 170, autoAlpha: 0 });
      return;
    }

    shownRef.current = true;
    hiddenRef.current = null;
    if (typing.current || overFooter.current) {
      apply();
      return;
    }
    hiddenRef.current = false;
    moveTween.current?.kill();
    moveTween.current = gsap.fromTo(
      el,
      { yPercent: 170, autoAlpha: 0 },
      { yPercent: 0, autoAlpha: 1, duration: 0.9, ease: "expo.out", delay: 0.15 }
    );
  }, [show, apply]);

  /* --- stepping aside ---------------------------------------------- */
  useEffect(() => {
    /* focusout comes first when focus moves between two fields, so it
       asks where focus is going rather than clearing and flickering. */
    const onIn = (e: FocusEvent) => {
      typing.current = isField(e.target);
      apply();
    };
    const onOut = (e: FocusEvent) => {
      typing.current = isField(e.relatedTarget);
      apply();
    };
    document.addEventListener("focusin", onIn);
    document.addEventListener("focusout", onOut);

    return () => {
      document.removeEventListener("focusin", onIn);
      document.removeEventListener("focusout", onOut);
    };
  }, [apply]);

  /* --- keep focus out from under the nav --------------------------- */
  /* The same as the strip does at the top: Tab never parks a link
     behind the floating pill. */
  useEffect(() => {
    const el = shell.current;
    if (!el || typeof ResizeObserver === "undefined") return;
    const html = document.documentElement;
    const prev = html.style.scrollPaddingBottom;
    const ro = new ResizeObserver(() => {
      html.style.scrollPaddingBottom = `${el.offsetHeight + 28}px`;
    });
    ro.observe(el);
    return () => {
      ro.disconnect();
      html.style.scrollPaddingBottom = prev;
    };
  }, []);

  /* --- the lit label, the taxi and the footer's rows -------------- */
  useEffect(() => {
    const list = row.current;
    const lane = road.current;
    const taxi = car.current;
    const layer = shell.current?.parentElement;
    if (!list || !lane || !taxi || !layer) return;

    const links = Array.from(list.querySelectorAll<HTMLAnchorElement>("a"));
    const setX = gsap.quickSetter(taxi, "x", "px") as (v: number) => void;
    const last = IDS.length - 1;

    /* Measured, never per scroll: where each sheet starts in natural
       flow, the reading line's offset, and where the taxi parks under
       each label (its left edge, in the road's own box; the nav only
       ever moves vertically, so horizontal offsets are unaffected). */
    let tops: number[] = [];
    let lineAt = 0;
    let parks: number[] = [];
    let lit = -1;
    /* The footer's text rows, [top, bottom] in the document, and the band
       of the viewport the pill covers when it is up, [top, bottom]. The
       nav steps aside only while a row actually crosses that band: the
       sign and the street above the rows are drawings it can float over,
       and at the very bottom of the page the rows have risen clear of it,
       so it comes back with Contact lit and the taxi parked under it.
       (Watching the whole footer hid the nav for the last tenth of the
       page, sign, street and all.) */
    let avoid: [number, number][] = [];
    let band: [number, number] = [0, 0];

    const measureTops = () => {
      /* The rows the footer marks with data-nav-avoid: its title block
         and legal line. */
      const scope = footer?.current ?? document;
      const rows = Array.from(scope.querySelectorAll<HTMLElement>("[data-nav-avoid]"));
      /* Every read in one pass of natural flow. The rows sit in the
         Contact sheet, the last, which never sticks, so their natural
         place is where they really scroll past. */
      withMeasure(() => {
        const y = window.scrollY;
        tops = IDS.map((id) => {
          const el = document.getElementById(id);
          return el ? el.getBoundingClientRect().top + y : Infinity;
        });
        avoid = rows.map((el) => {
          const r = el.getBoundingClientRect();
          return [r.top + y, r.bottom + y];
        });
        /* The fixed layer rather than the pill: GSAP moves the pill, and
           the band is where it rests while it is up. */
        const b = layer.getBoundingClientRect();
        band = [b.top, b.bottom];
      });
      lineAt = window.innerHeight * READ;
    };
    const measureParks = () => {
      const left = lane.getBoundingClientRect().left;
      parks = links.map((a) => {
        const r = a.getBoundingClientRect();
        return r.left + r.width / 2 - left - TAXI / 2;
      });
    };

    const update = (scroll: number) => {
      if (!parks.length || !tops.length) return;
      const y = scroll + lineAt;
      let k = 0;
      for (let i = 1; i <= last; i++) if (y >= tops[i]) k = i;
      const next = Math.min(last, k + 1);
      const u = k < last && Number.isFinite(tops[next]) ? clamp01((y - tops[k]) / Math.max(1, tops[next] - tops[k])) : 0;
      const t = u > DRIVE ? (u - DRIVE) / (1 - DRIVE) : 0;
      setX(parks[k] + (parks[next] - parks[k]) * t);
      if (k !== lit) {
        lit = k;
        setActive(IDS[k]);
      }

      let over = false;
      for (const [a, b] of avoid) if (a - scroll < band[1] && b - scroll > band[0]) over = true;
      if (over !== overFooter.current) {
        overFooter.current = over;
        apply();
      }
    };

    measureTops();
    measureParks();
    update(window.scrollY);

    const st = ScrollTrigger.create({
      start: 0,
      end: "max",
      onUpdate: (self) => update(self.scroll()),
      onRefresh: (self) => {
        measureTops();
        measureParks();
        update(self.scroll());
      },
    });

    /* The row changes size when the web font arrives, at a breakpoint, or
       with text zoom: the taxi's parking places move with it. */
    const ro =
      typeof ResizeObserver === "undefined"
        ? null
        : new ResizeObserver(() => {
            measureParks();
            update(window.scrollY);
          });
    ro?.observe(list);

    return () => {
      st.kill();
      ro?.disconnect();
      gsap.set(taxi, { clearProps: "transform" });
    };
  }, [footer, apply]);

  return (
    /* The fixed layer centres the pill and lets clicks through around it;
       GSAP only ever moves the pill inside, which has no transform of its
       own in CSS. data-bottom-nav: without scripts the footer keeps room
       for it (see the WITHOUT JAVASCRIPT rules in globals.css). */
    <div data-bottom-nav className="bnav-layer">
      <nav ref={shell} aria-label="Primary" data-intro-hide data-ground="cream" className="bnav">
        <ul ref={row} className="labs">
          {nav.map((item) => {
            const id = idOf(item.href);
            return (
              <li key={item.href}>
                {/* data-label: the bold copy that reserves the lit width,
                    so lighting a label never nudges its neighbours. */}
                <a href={item.href} aria-current={active === id ? "true" : undefined} data-label={item.label} data-hover>
                  {item.label}
                </a>
              </li>
            );
          })}
        </ul>
        <div ref={road} className="road" aria-hidden="true">
          <i className="dash" />
          <span ref={car} className="ntaxi">
            <Ambassador variant="outline" width={TAXI} />
          </span>
        </div>
      </nav>
    </div>
  );
}
