"use client";

import { useCallback, useEffect, useId, useRef } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import Ambassador from "./Ambassador";
import HangingSign from "./HangingSign";
import NightStreet from "./NightStreet";
import Sheet from "./Sheet";
import SocialIcon from "./SocialIcon";
import { Elbow, Rail, Terminus } from "./Route";
import { contact, footer, identity, legal, notes, socials, strip, ui } from "@/lib/content";
import { useYear } from "@/lib/useYear";
import { gsap, canTransform, driveRoute, maxScroll, naturalTop, onStand, scrub, soft } from "@/lib/motion";

/* ============================================================
   THE FOOTER STREET
   The same footer closes every page, at the foot of the last (night)
   sheet: the hanging enamel sign (HangingSign), then the night street
   (NightStreet) where the taxi parks under the lamp and the route ends
   in its terminus ring, "You've arrived". Over the street: the sign-off,
   the email, the line about what Parth is open to and Get in touch.
   Under it, the drawing's title block (name and role, the two work
   locations, and "Connections": the social links as logos) and the
   legal line.

   What moves here, all siblings of the contact sheet's pin wall and
   never its ancestors:
     · the sign drops in from behind its bar and swings once, a damped
       rotation, scrubbed by the scroll as the bar comes up the screen.
       On a page where the bar is already on screen when it loads (an
       info page on a tall monitor) it plays once by itself instead;
     · on the home page the parked taxi is the route's own taxi for its
       last stretch, a stand-in like the one on the Howrah Bridge deck
       (STAND-INS in lib/motion.ts): the kerb rail is marked
       stand="kerb" and the taxi data-stand-car="kerb". The small route
       taxi comes down the gutter and round the corner and hands over at
       the kerb's start; this taxi then drives the kerb with the scroll,
       the line filling to its tail, and stops at its own CSS place, its
       tail just past the terminus ring, at the deepest scroll. The
       journey owns its transform and visibility, so nothing here writes
       either. "You've arrived" is written in as it pulls up (onStand),
       so the label never sits on a taxi that is still driving.
   Without scripts all of it is where it ends up: the taxi parked, the
   line solid, the label there.

   On the other pages the route pieces here fill with the reading line
   (driveRoute, fill only) and the taxi is simply parked: there is no
   journey for it to end.
   ============================================================ */

/* The last share of the kerb, as the taxi pulls up, over which "You've
   arrived" is written in. */
const ARRIVE = 0.14;

export default function Footer({ footerRef }: { footerRef?: React.RefObject<HTMLElement | null> }) {
  const own = useRef<HTMLElement | null>(null);
  const swing = useRef<HTMLDivElement>(null);
  const hang = useRef<HTMLDivElement>(null);
  const label = useRef<HTMLSpanElement>(null);
  const year = useYear();
  const newTab = useId();

  /* The same footer on every page. On the home page Get in touch is an
     in-page jump (SmoothScroll delegates it); anywhere else it leads to
     the home page's contact sheet, which the home page then travels to
     once its intro hands off. */
  const pathname = usePathname();
  const home = pathname === "/";

  /* The bottom nav steps aside while the footer's text rows (title block,
     legal line, marked data-nav-avoid) pass behind it, so the page hands
     in a ref of its own; this keeps one for the motion too. */
  const setRoot = useCallback(
    (node: HTMLElement | null) => {
      own.current = node;
      if (footerRef) footerRef.current = node;
    },
    [footerRef]
  );

  useEffect(() => {
    const root = own.current;
    const sw = swing.current;
    const hg = hang.current;
    const lb = label.current;
    if (!root || !sw || !hg || !lb) return;

    const undoRoute = home ? null : driveRoute(root);

    /* ---- "You've arrived" ---------------------------------------------
       Home page only, where the taxi drives the kerb: hidden until the
       journey reaches the kerb, then written in over the last ARRIVE of
       it, so it is wholly there exactly when the taxi stops, and gone
       again if the reader scrolls back up. Opacity only, written only
       when it changes. When the journey is undone (u = 1, off) it goes
       back to the markup's state. */
    let shown = -1;
    const offStand = home
      ? onStand("kerb", (u, on) => {
          const o = on ? Math.min(1, Math.max(0, (u - (1 - ARRIVE)) / ARRIVE)) : u >= 1 ? 1 : 0;
          const v = Math.round(o * 100) / 100;
          if (v === shown) return;
          shown = v;
          if (on || v === 0) lb.style.opacity = String(v);
          else lb.style.removeProperty("opacity");
        })
      : null;

    const ctx = gsap.context(() => {
      /* ---- the sign drops and swings once ---------------------------
         One progress value v from 0 to 1: the drop takes the first
         five-eighths of it, the swing (three half-periods, dying away)
         all of it, so at v = 1 the sign hangs still where the markup
         has it. Only the swing box's transform is written. */
      if (canTransform(sw)) {
        let drop = sw.offsetHeight + 24;
        const q = { v: 0 };
        const setY = gsap.quickSetter(sw, "y", "px") as (v: number) => void;
        const setR = gsap.quickSetter(sw, "rotation", "deg") as (v: number) => void;
        const paint = () => {
          const v = q.v;
          setY(-(1 - Math.min(1, v * 1.6)) * drop);
          setR(Math.sin(v * Math.PI * 3) * 4 * (1 - v));
        };

        const onScreenAtLoad = naturalTop(hg) - window.innerHeight * 0.95 < 8;
        if (onScreenAtLoad) {
          /* Nothing to scroll for: it drops once by itself. Soft motion
             leaves it hanging. */
          if (!soft()) {
            paint();
            gsap.to(q, { v: 1, duration: 2.2, delay: 0.5, ease: "power1.out", onUpdate: paint });
          }
        } else {
          const at = (share: number) => () => {
            const r = hg.getBoundingClientRect();
            return r.top + window.scrollY - window.innerHeight * share;
          };
          const end = () => Math.min(at(0.5)(), maxScroll());
          const start = () => Math.min(at(0.95)(), end() - 1);
          gsap.to(q, {
            v: 1,
            ease: "none",
            onUpdate: paint,
            scrollTrigger: {
              trigger: hg,
              start,
              end,
              scrub: scrub(),
              invalidateOnRefresh: true,
              onRefresh: () => {
                drop = sw.offsetHeight + 24;
                paint();
              },
            },
          });
          paint();
        }
      }
    }, root);

    return () => {
      ctx.revert();
      gsap.set(sw, { clearProps: "transform" });
      undoRoute?.();
      offStand?.();
      lb.style.removeProperty("opacity");
    };
  }, [home]);

  return (
    <footer ref={setRoot} className="foot">
      <div className="hang-wrap">
        <Rail className="r-foot-hang" />
        <div ref={hang}>
          <HangingSign swingRef={swing} />
        </div>
      </div>

      <div className="streetwrap">
        <NightStreet />
        {/* On the home page the journey drives this taxi along the kerb
            (see the header); its CSS place is where it parks. */}
        <div
          className="ftaxi"
          data-stand-car={home ? "kerb" : undefined}
          data-park={home ? "rest" : undefined}
          aria-hidden="true"
        >
          <Ambassador variant="color" width={296} shadow />
        </div>

        <div className="arrive">
          <p className="hand signoff">{notes.signoff}</p>
          <a className="fmail" href={`mailto:${identity.email}`}>
            {identity.email}
          </a>
          <p className="fblurb">{contact.footerBlurb}</p>
          {home ? (
            <a className="btn cream" href="#contact">
              {contact.heading.join(" ")}
              <ArrowR />
            </a>
          ) : (
            <Link className="btn cream" href="/#contact">
              {contact.heading.join(" ")}
              <ArrowR />
            </Link>
          )}
        </div>

        <Rail className="r-foot" />
        <Elbow corner="bl" className="e-foot" />
        <Rail dir="h" className="r-kerb" stand={home ? "kerb" : undefined} />
        <Terminus />
        {/* The status strip says the same in words, so this one is the
            drawing's label only. */}
        <span ref={label} className="hand arrived" aria-hidden="true">
          {strip.arrived}
        </span>
      </div>

      <div className="foot-in">
        {/* The drawing's title block: name and role, the two work
            locations, and the social links as logos under their own
            label. The rules between the cells are the grid's 1px gaps
            (s6-contact.css), so they hold however the cells wrap. */}
        <div className="tblock2" data-nav-avoid>
          {footer.titleBlock.map((cell, i) => {
            if ("socials" in cell) {
              /* Logos only, so each link's name is its accessible name
                 (and its tooltip), and one shared note says it opens a
                 new tab. */
              const links = (
                <>
                  <ul className="soc">
                    {socials.map((s) => (
                      <li key={s.label}>
                        <a
                          href={s.href}
                          target="_blank"
                          rel="noopener noreferrer"
                          aria-label={s.label}
                          aria-describedby={newTab}
                          title={s.label}
                        >
                          <SocialIcon name={s.label} size={22} />
                        </a>
                      </li>
                    ))}
                  </ul>
                  <span id={newTab} hidden>
                    {ui.newTab}
                  </span>
                </>
              );
              return (
                <dl key="socials" className="tb-soc">
                  <dt>{cell.dt}</dt>
                  <dd>{links}</dd>
                </dl>
              );
            }
            return (
              <dl key={cell.dt} className={i === 0 ? "tb-name" : undefined}>
                <dt>{cell.dt}</dt>
                {cell.dd && <dd>{cell.dd}</dd>}
              </dl>
            );
          })}
        </div>

        <div className="flegal" data-nav-avoid>
          <p>
            © {year} {identity.fullName}
          </p>
          <nav aria-label="Legal">
            <ul>
              {legal.pages.map((p) => (
                <li key={p.href}>
                  <Link href={p.href} aria-current={pathname === p.href ? "page" : undefined}>
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

/* ============================================================
   FOOTER SHEET
   The info pages and the 404 end on the same street: a night sheet of
   its own, with no tab (it is the page's foot, not a stop to jump to),
   sliding over the page's one sheet like Contact slides over Journey.
   On the home page the footer is part of Sheet 06 instead
   (ContactSheet.tsx).
   ============================================================ */
export function FooterSheet({ n = "02" }: { n?: string }) {
  return (
    <Sheet id="footer" n={n} label="Footer" ground="night" tab="none" className="footsheet">
      <Footer />
    </Sheet>
  );
}

function ArrowR() {
  return (
    <svg className="arr" viewBox="0 0 20 20" aria-hidden="true" focusable="false" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 10h13M11 5l5 5-5 5" />
    </svg>
  );
}
