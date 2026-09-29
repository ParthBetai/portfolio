"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { gsap, reduced } from "@/lib/motion";
import { identity, nav } from "@/lib/content";

type LenisLike = {
  scrollTo?: (t: string | number, o?: object) => void;
  stop?: () => void;
  start?: () => void;
};

/* Read at call time, never cached: SmoothScroll creates and destroys the
   instance on its own schedule (and not at all in soft or off mode). */
const getLenis = () => (window as unknown as { __lenis?: LenisLike }).__lenis;

/* Section ids come straight from the nav hrefs, so adding a link in
   content.ts is enough for the active-section tracking to pick it up. */
const idOf = (href: string) => href.replace(/^#/, "");

const SHEET_ID = "nav-sheet";

/* The bar only stays pinned for keyboard focus. A mouse click also focuses
   the link it lands on, and treating that as "in use" would stop the bar
   from ever hiding after the first nav click. */
function hasKeyboardFocus(scope: HTMLElement | null) {
  const el = document.activeElement;
  if (!scope || !(el instanceof HTMLElement) || !scope.contains(el)) return false;
  try {
    return el.matches(":focus-visible");
  } catch {
    /* Very old engines don't know the pseudo-class, err on keeping it up. */
    return true;
  }
}

export default function Nav({ show }: { show: boolean }) {
  const root = useRef<HTMLDivElement>(null);
  const header = useRef<HTMLElement>(null);
  const sheet = useRef<HTMLDivElement>(null);
  const menuBtn = useRef<HTMLButtonElement>(null);
  const firstLink = useRef<HTMLAnchorElement>(null);

  /* One GSAP context for the component's whole life. Tweens are added to
     it as they happen, so a close can animate out of an open instead of
     the open being reverted from under it, and unmount still reverts
     every inline style this component ever wrote. */
  const ctxRef = useRef<gsap.Context | null>(null);

  /* Scroll and focus handlers read these, so they live in refs rather than
     state: the handlers are bound once and must see the current values. */
  const shownRef = useRef(false);
  const hiddenRef = useRef(false);
  const openRef = useRef(false);
  const wasOpen = useRef(false);
  const lastY = useRef(0);
  const releaseLock = useRef<(() => void) | null>(null);
  /* The scroll hide/show tween. Kept out of the context on purpose: a
     context records every tween created through it until it is reverted,
     and this one is made on every change of scroll direction, over a long
     read that is an unbounded list. One live tween, killed and replaced. */
  const hideTween = useRef<gsap.core.Tween | null>(null);

  const [open, setOpen] = useState(false);
  const [stuck, setStuck] = useState(false);
  const [active, setActive] = useState(idOf(nav[0]?.href ?? "#home"));

  /* --- context ---------------------------------------------------- */
  /* Declared first so every effect below finds it in the same commit. */
  useEffect(() => {
    const ctx = gsap.context(() => {}, root);
    ctxRef.current = ctx;
    return () => {
      hideTween.current?.kill();
      hideTween.current = null;
      ctx.revert();
      ctxRef.current = null;
    };
  }, []);

  /* Slides the bar out of the way or back. Guarded on the last value so a
     scroll that keeps going the same way doesn't restart the tween every
     frame, and inert until the intro has handed the nav over. */
  const setHidden = useCallback((hide: boolean) => {
    const el = header.current;
    const ctx = ctxRef.current;
    if (!el || !ctx || !shownRef.current || hiddenRef.current === hide) return;
    hiddenRef.current = hide;
    const yPercent = hide ? -110 : 0;
    hideTween.current?.kill();
    hideTween.current = null;
    if (reduced()) gsap.set(el, { yPercent });
    /* overwrite:auto, if the intro slide is still running, this takes
       over yPercent from it rather than the two fighting. */
    else
      hideTween.current = gsap.to(el, {
        yPercent,
        duration: 0.5,
        ease: "power3.out",
        overwrite: "auto",
      });
  }, []);

  /* --- entrance ---------------------------------------------------- */
  /* The header also carries data-intro-hide, so the boot script's CSS keeps
     it invisible over the loader between first paint and hydration, the
     GSAP set below takes over from that inline. Without JavaScript neither
     applies and the nav is simply there. */
  useEffect(() => {
    const el = header.current;
    const ctx = ctxRef.current;
    if (!el || !ctx) return;
    const items = Array.from(el.querySelectorAll<HTMLElement>("[data-nav-item]"));

    if (!show) {
      shownRef.current = false;
      /* Motion off has no intro to wait behind (the hero hands off on its
         first effect), so pre-hiding would only flash the bar away and
         back. */
      if (!reduced()) ctx.add(() => gsap.set(el, { yPercent: -110, autoAlpha: 0 }));
      return;
    }

    shownRef.current = true;
    hiddenRef.current = false;
    lastY.current = window.scrollY;

    ctx.add(() => {
      if (reduced()) {
        /* Explicit, not just "leave it": if motion is switched back on
           later, the intro-hide CSS would otherwise re-hide the bar. */
        gsap.set(el, { yPercent: 0, autoAlpha: 1 });
        return;
      }
      gsap.fromTo(
        el,
        { yPercent: -110, autoAlpha: 0 },
        { yPercent: 0, autoAlpha: 1, duration: 0.9, ease: "expo.out" }
      );
      gsap.fromTo(
        items,
        { autoAlpha: 0, y: -14 },
        { autoAlpha: 1, y: 0, duration: 0.9, ease: "expo.out", stagger: 0.06, delay: 0.1 }
      );
    });
  }, [show]);

  /* --- scroll: scrim + hide on the way down ------------------------- */
  useEffect(() => {
    const el = header.current;

    /* Over the hero the bar floats on black and needs nothing behind it.
       Past it, content scrolls underneath and collides with the labels , 
       so the scrim arrives exactly when it starts being needed. */
    const updateScrim = () => setStuck(window.scrollY > window.innerHeight * 0.8);

    const onScroll = () => {
      const y = window.scrollY;
      updateScrim();

      if (!shownRef.current) {
        lastY.current = y;
        return;
      }

      /* Down and clear of the top: get out of the way of the content.
         Up, or back near the top: return. An unchanged position decides
         nothing, Lenis can emit repeat values at the end of its ease. */
      if (y > lastY.current && y > 80) {
        if (!openRef.current && !hasKeyboardFocus(el)) setHidden(true);
      } else if (y < lastY.current || y <= 80) {
        setHidden(false);
      }
      lastY.current = y;
    };

    /* Tabbing into a bar that is parked off-screen would put the focus
       ring somewhere nobody can see it. */
    const onFocusIn = () => setHidden(false);

    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    /* Resize only re-measures the scrim. Mobile browsers fire resize as the
       URL bar collapses mid-swipe; running the hide logic there would pop
       the bar back in on every downward scroll. */
    window.addEventListener("resize", updateScrim);
    el?.addEventListener("focusin", onFocusIn);
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", updateScrim);
      el?.removeEventListener("focusin", onFocusIn);
    };
  }, [setHidden]);

  /* --- active section --------------------------------------------- */
  /* A one-percent band a little above the middle of the viewport: whichever
     section is crossing it is the one being read. A thin band means only one
     section can match at a time, so there is nothing to arbitrate. */
  useEffect(() => {
    if (typeof IntersectionObserver === "undefined") return;
    const sections = nav
      .map((item) => document.getElementById(idOf(item.href)))
      .filter((s): s is HTMLElement => s !== null);
    if (!sections.length) return;

    const io = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) setActive(entry.target.id);
        }
      },
      { rootMargin: "-45% 0px -54% 0px", threshold: 0 }
    );
    sections.forEach((s) => io.observe(s));
    return () => io.disconnect();
  }, []);

  /* --- mobile sheet: animation + focus ----------------------------- */
  useEffect(() => {
    openRef.current = open;
    const el = sheet.current;
    const ctx = ctxRef.current;
    if (!el || !ctx) return;
    const words = Array.from(el.querySelectorAll<HTMLElement>("[data-sheet-word]"));

    if (open) {
      wasOpen.current = true;
      /* The Close button lives in the bar, it has to be on screen. */
      setHidden(false);
      ctx.add(() => {
        gsap.killTweensOf([el, ...words]);
        /* Visibility first and synchronously, so the focus call below lands
           on a link the browser considers focusable. */
        gsap.set(el, { visibility: "visible" });
        if (reduced()) {
          gsap.set(el, { opacity: 1 });
          gsap.set(words, { yPercent: 0 });
          return;
        }
        gsap.fromTo(el, { opacity: 0 }, { opacity: 1, duration: 0.45, ease: "power2.out" });
        gsap.fromTo(
          words,
          { yPercent: 110 },
          { yPercent: 0, duration: 0.9, ease: "expo.out", stagger: 0.06, delay: 0.08 }
        );
      });
      firstLink.current?.focus({ preventScroll: true });
      return;
    }

    /* Nothing to close on first mount. */
    if (!wasOpen.current) return;
    wasOpen.current = false;
    ctx.add(() => {
      gsap.killTweensOf([el, ...words]);
      /* autoAlpha ends on visibility:hidden, opacity alone would leave the
         links tabbable and announced while the menu is shut. */
      if (reduced()) gsap.set(el, { autoAlpha: 0 });
      else gsap.to(el, { autoAlpha: 0, duration: 0.35, ease: "power2.in" });
    });
    menuBtn.current?.focus({ preventScroll: true });
  }, [open, setHidden]);

  /* --- mobile sheet: scroll lock ----------------------------------- */
  /* Lenis drives scrolling from its own rAF loop and ignores overflow:hidden
     entirely, so the page has to be stopped at the source as well. Only
     touches anything while open, on mount it must not clear the lock the
     page holds during the intro. */
  useEffect(() => {
    if (!open) return;
    const html = document.documentElement;
    const prev = html.style.overflow;
    html.style.overflow = "hidden";
    getLenis()?.stop?.();

    let released = false;
    const release = () => {
      if (released) return;
      released = true;
      html.style.overflow = prev;
      getLenis()?.start?.();
    };
    releaseLock.current = release;

    return () => {
      release();
      releaseLock.current = null;
    };
  }, [open]);

  /* --- mobile sheet: keyboard + breakpoint ------------------------- */
  useEffect(() => {
    if (!open) return;
    const scope = root.current;

    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        setOpen(false);
        return;
      }
      if (e.key !== "Tab" || !scope) return;

      /* Keep Tab inside the bar + sheet. The sheet covers the page, so
         letting focus walk into the content behind it would put the ring on
         something the visitor cannot see. Elements with no boxes (the
         desktop links, display:none on phones) drop out on their own. */
      const items = Array.from(scope.querySelectorAll<HTMLElement>("a[href], button")).filter(
        (n) => n.getClientRects().length > 0 && !n.closest("[inert]")
      );
      if (!items.length) return;
      const first = items[0];
      const last = items[items.length - 1];
      const current = document.activeElement;

      if (e.shiftKey && (current === first || !scope.contains(current))) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && (current === last || !scope.contains(current))) {
        e.preventDefault();
        first.focus();
      }
    };

    /* Rotating a phone past the breakpoint hides the sheet with md:hidden
       but would leave the page locked, close it properly instead. */
    const mq = window.matchMedia("(min-width: 768px)");
    const onBreakpoint = () => mq.matches && setOpen(false);

    window.addEventListener("keydown", onKey);
    mq.addEventListener("change", onBreakpoint);
    return () => {
      window.removeEventListener("keydown", onKey);
      mq.removeEventListener("change", onBreakpoint);
    };
  }, [open]);

  /* Anchor jumps go through Lenis so they inherit the page's easing instead
     of teleporting; native smooth scrolling covers soft mode, and motion off
     just jumps. */
  const go = useCallback((e: React.MouseEvent<HTMLAnchorElement>, href: string) => {
    /* Leave modified clicks (new tab, new window) to the browser. */
    if (e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;

    /* getElementById, not querySelector: an id that isn't a valid CSS
       selector (one starting with a digit, say) would make querySelector
       throw and break the click entirely. */
    const target = document.getElementById(idOf(href));
    setOpen(false);
    if (!target) return;
    e.preventDefault();

    /* Release the menu's lock now rather than after React commits the
       close: a stopped Lenis silently ignores scrollTo. */
    releaseLock.current?.();

    const lenis = getLenis();
    if (lenis?.scrollTo) lenis.scrollTo(href, { duration: 1.4 });
    else target.scrollIntoView({ behavior: reduced() ? "auto" : "smooth" });
  }, []);

  return (
    <div ref={root}>
      <header
        ref={header}
        data-intro-hide
        /* Only colour-ish properties transition here: GSAP owns transform
           and opacity on this element, and a CSS transition on either would
           fight every tween. */
        className="fixed inset-x-0 top-0 z-50 transition-[background-color,border-color,backdrop-filter] duration-500"
        style={{
          backgroundColor: stuck ? "rgba(5,5,5,0.72)" : "transparent",
          backdropFilter: stuck ? "blur(14px)" : "none",
          WebkitBackdropFilter: stuck ? "blur(14px)" : "none",
          borderBottom: `1px solid ${stuck ? "var(--color-hairline)" : "transparent"}`,
        }}
      >
        <div className="gutter flex items-center justify-between py-5 md:py-6">
          <a
            href="#home"
            onClick={(e) => go(e, "#home")}
            data-nav-item
            data-hover
            /* Vertical padding pulled back by margin: an 11px label alone is
               too small a tap target, and the bar's height must not change. */
            className="t-mono -my-2 inline-block py-2 text-bone"
          >
            {identity.name}
            <span aria-hidden="true" className="text-acid">
              .
            </span>
            <span className="sr-only">, back to top</span>
          </a>

          <nav aria-label="Primary" className="hidden md:block">
            <ul className="flex items-center gap-8 lg:gap-10">
              {nav.map((item) => {
                const current = active === idOf(item.href);
                return (
                  <li key={item.href}>
                    <a
                      href={item.href}
                      onClick={(e) => go(e, item.href)}
                      aria-current={current ? "true" : undefined}
                      data-nav-item
                      data-hover
                      className={`t-mono group relative inline-block py-1 transition-colors duration-300 hover:text-acid ${
                        current ? "text-bone" : "text-ash"
                      }`}
                    >
                      {item.label}
                      {/* Draws from the left on hover and keyboard focus;
                          stays drawn under the section being read. */}
                      <span
                        aria-hidden="true"
                        className={`pointer-events-none absolute inset-x-0 -bottom-0.5 h-px origin-left bg-acid transition-transform duration-500 ease-out-expo ${
                          current
                            ? "scale-x-100"
                            : "scale-x-0 group-hover:scale-x-100 group-focus-visible:scale-x-100"
                        }`}
                      />
                    </a>
                  </li>
                );
              })}
            </ul>
          </nav>

          <button
            ref={menuBtn}
            type="button"
            onClick={() => setOpen((v) => !v)}
            aria-expanded={open}
            aria-controls={SHEET_ID}
            data-nav-item
            data-hover
            /* Hidden without scripts, when it could not open the sheet. */
            data-js-only
            /* Negative margin grows the hit area without moving the label
               off the gutter line. */
            className="t-mono -m-3 p-3 text-bone md:hidden"
          >
            {open ? "Close" : "Menu"}
          </button>
        </div>
      </header>

      {/* Mobile sheet. A sibling of the header, not a child: the header's
          backdrop-filter and transform would otherwise become the containing
          block for this fixed layer and shrink it to the bar's height.
          Closed means `invisible` + inert, never just transparent. */}
      <div
        id={SHEET_ID}
        ref={sheet}
        inert={!open}
        /* Short landscape phones can't fit five display-size lines; the sheet
           scrolls itself, and Lenis is told to leave that scroll alone. */
        data-lenis-prevent
        className="invisible fixed inset-0 z-40 overflow-y-auto overscroll-contain bg-void md:hidden"
      >
        <nav aria-label="Menu" className="gutter flex min-h-full flex-col justify-center pb-10 pt-24">
          <ul className="rule">
            {nav.map((item, i) => {
              const current = active === idOf(item.href);
              return (
                <li key={item.href} className="border-b border-hairline">
                  <a
                    ref={i === 0 ? firstLink : undefined}
                    href={item.href}
                    onClick={(e) => go(e, item.href)}
                    aria-current={current ? "true" : undefined}
                    data-hover
                    className="group flex items-end justify-between gap-4 py-3"
                  >
                    <span className="line-mask min-w-0">
                      <span
                        data-sheet-word
                        className="t-display block text-bone transition-colors duration-300 group-hover:text-acid group-focus-visible:text-acid"
                        /* ~13vw like the reference, capped by height so a
                           landscape phone doesn't get one word per screen. */
                        style={{ fontSize: "min(13vw, 12vh)" }}
                      >
                        {item.label}
                      </span>
                    </span>
                    <span
                      aria-hidden="true"
                      className={`t-mono shrink-0 pb-1 transition-colors duration-300 ${
                        current ? "text-acid" : "text-ash"
                      }`}
                    >
                      {String(i + 1).padStart(2, "0")}
                    </span>
                  </a>
                </li>
              );
            })}
          </ul>
        </nav>
      </div>
    </div>
  );
}
