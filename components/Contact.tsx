"use client";

import { useEffect, useRef } from "react";
import dynamic from "next/dynamic";
import { gsap, reduced, splitWords } from "@/lib/motion";
import { contact, identity, socials } from "@/lib/content";
import SocialIcon from "./SocialIcon";
import PhoneChat from "./PhoneChat";

/* Three.js is the heaviest code on the page, and the pin wall sits at
   the very bottom of it, so it is not part of what someone downloads to
   read the hero. ssr:false because it needs a real canvas; there is
   nothing meaningful to prerender. */
const PinField = dynamic(() => import("./PinField"), { ssr: false });

/* ============================================================
   CONTACT
   Built on the reference's window trick: the pin wall is position:fixed
   to the viewport, and this section clips it with clip-path. The section
   therefore acts as a window: the wall holds still while the page slides
   over it, appearing as the section scrolls in and disappearing behind
   the footer.

   Two rules keep the trick working:
     · clip-path, not overflow, does the clipping. overflow never clips a
       fixed descendant; clip-path does, and unlike transform or filter it
       does not turn the section into the fixed element's containing block.
     · nothing between the wall and the viewport may carry a transform,
       filter or will-change. Any of those would pin the "fixed" wall to
       that ancestor and it would scroll with the page. The reveals below
       only ever move the words and rows, never a wrapper, and the phone's
       3D lives on its own elements, which are siblings of the wall.

   The form is the conversation on the phone (see PhoneChat). Its last
   step posts to /api/contact, which emails the message to Parth; if that
   fails, the visitor's own mail app is offered with it filled in.
   ============================================================ */
export default function Contact() {
  const root = useRef<HTMLElement>(null);

  useEffect(() => {
    /* Only the explicit motion-off switch skips the reveals. Nothing is
       pre-hidden in the markup, so skipping them leaves everything in place. */
    if (reduced()) return;

    const ctx = gsap.context(() => {
      const head = root.current?.querySelector<HTMLElement>("[data-contact-head]");
      if (head) {
        const words = splitWords(head);
        /* background-clip:text does not reliably reach text inside
           transformed children, so the chrome moves from the line onto
           each word once the line is split. Without JS the line keeps it. */
        head.classList.remove("chrome");
        words.forEach((w) => w.classList.add("chrome"));

        gsap.fromTo(
          words,
          { yPercent: 108 },
          {
            yPercent: 0,
            duration: 1.1,
            ease: "expo.out",
            stagger: 0.07,
            scrollTrigger: { trigger: head, start: "top 88%" },
          }
        );
      }

      /* Elements, not selector strings, for the trigger: a string trigger
         is looked up document-wide, and this section must not latch onto
         another component's markup. */
      const copy = root.current?.querySelector<HTMLElement>("[data-copy]");
      const rows = root.current?.querySelectorAll<HTMLElement>("[data-reveal]");
      if (copy && rows?.length) {
        gsap.fromTo(
          rows,
          { opacity: 0, y: 22 },
          {
            opacity: 1,
            y: 0,
            duration: 0.9,
            ease: "expo.out",
            stagger: 0.08,
            scrollTrigger: { trigger: copy, start: "top 75%" },
          }
        );
      }
    }, root);

    /* Everything here lives inside the GSAP context (no listeners,
       observers or timers of its own), so reverting it, which kills the
       ScrollTriggers and restores inline styles, is the whole teardown.
       The wall and the phone tear down their own. */
    return () => ctx.revert();
  }, []);

  return (
    <section
      id="contact"
      ref={root}
      className="relative overflow-hidden"
      style={{ clipPath: "inset(0)" }}
    >
      {/* Fixed to the viewport; this section is the window onto it. It
          must stay a direct child. See the note above the component. */}
      <PinField windowRef={root} />

      {/* A light overall dim. The wall is dark already; this only keeps
          its brightest pins from competing with the copy. */}
      <div aria-hidden className="pointer-events-none absolute inset-0 bg-black/15" />

      {/* The wall rises out of the page instead of starting at a hard
          line: the section above ends on flat void, so the top of the
          window fades in from that same colour. It starts a few pixels
          above the edge: the section top can land between pixels, and the
          canvas and this overlay round that edge differently. */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 -top-1 h-40 bg-linear-to-b from-void from-[4px] to-transparent md:h-56"
      />
      {/* And it sinks back into the footer's black the same way, rather
          than stopping at a hard line where the footer begins. */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 -bottom-1 h-28 bg-linear-to-t from-black from-[4px] to-transparent md:h-40"
      />

      {/* Legibility on the copy side only, so the wall still shows round
          the phone. Two columns: the copy is left, so the fade runs left
          to right. Stacked: the copy sits on top, so darken the top and
          let it clear by the time the phone starts. */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 hidden lg:block"
        style={{
          background:
            "radial-gradient(95% 110% at 0% 50%, rgba(5,5,5,0.88) 8%, rgba(5,5,5,0.62) 30%, rgba(5,5,5,0.18) 52%, transparent 66%)",
        }}
      />
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 lg:hidden"
        style={{
          background:
            "linear-gradient(180deg, rgba(5,5,5,0.85) 0%, rgba(5,5,5,0.55) 30%, rgba(5,5,5,0.1) 52%, rgba(5,5,5,0.1) 85%, rgba(5,5,5,0.55) 100%)",
        }}
      />

      <div className="relative z-10 mx-auto grid min-h-[100svh] w-full max-w-7xl items-center gap-16 gutter py-24 md:py-32 lg:grid-cols-12 lg:gap-8 lg:py-28">
        {/* ---- copy ------------------------------------------------------ */}
        <div data-copy className="lg:col-span-5">
          <h2 className="t-display text-[13vw] leading-[0.92] md:text-[5vw]">
            <span data-contact-head className="chrome block">
              {contact.heading[0]}
            </span>
            {/* Never drawn between two blocks; it keeps "Get in touch"
                one phrase for text readers. */}
            {" "}
            <span className="t-serif block text-ash">{contact.heading[1]}</span>
          </h2>

          <p data-reveal className="mt-8 max-w-sm text-base leading-relaxed text-ash">
            {contact.blurb}
          </p>

          <dl className="mt-12 space-y-8">
            <div data-reveal>
              <dt className="t-mono mb-2 text-ash">Email</dt>
              <dd>
                <a
                  href={`mailto:${identity.email}`}
                  data-hover
                  className="text-lg text-bone [overflow-wrap:anywhere] transition-colors duration-300 hover:text-acid md:text-xl"
                >
                  {identity.email}
                </a>
              </dd>
            </div>
            <div data-reveal>
              <dt className="t-mono mb-3 text-ash">Work locations</dt>
              <dd>
                <ul className="space-y-2">
                  <li className="flex items-baseline gap-4">
                    <span className="t-mono w-[5.5rem] shrink-0 text-ash">Primary</span>
                    <span className="text-lg text-bone md:text-xl">{identity.locations.primary}</span>
                  </li>
                  <li className="flex items-baseline gap-4">
                    <span className="t-mono w-[5.5rem] shrink-0 text-ash">Secondary</span>
                    <span className="text-lg text-bone md:text-xl">{identity.locations.secondary}</span>
                  </li>
                </ul>
              </dd>
            </div>
            <div data-reveal>
              <dt className="t-mono mb-3 text-ash">Follow</dt>
              <dd>
                <ul className="flex flex-wrap gap-3">
                  {socials.map((s) => (
                    <li key={s.label}>
                      <a
                        href={s.href}
                        target="_blank"
                        rel="noopener noreferrer"
                        aria-label={s.label}
                        data-hover
                        className="inline-flex h-11 w-11 items-center justify-center rounded-full bg-white/10 text-bone transition-colors duration-300 hover:bg-white/20 hover:text-acid"
                      >
                        <SocialIcon name={s.label} />
                      </a>
                    </li>
                  ))}
                </ul>
              </dd>
            </div>
          </dl>
        </div>

        {/* ---- the phone ------------------------------------------------- */}
        <div className="lg:col-span-7">
          <PhoneChat />
        </div>
      </div>
    </section>
  );
}
