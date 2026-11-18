"use client";

import Sheet from "./Sheet";
import Contact from "./Contact";
import Footer from "./Footer";
import { sheets } from "@/lib/content";

const S = sheets[5];

/* ============================================================
   SHEET 06, CONTACT
   The last sheet of the home page, on the night ground: "Get in touch"
   with the phone chat over the pin wall (Contact), then the footer
   street, which ends the route (Footer).

   This sheet, its slot and <main> carry no transform, filter,
   will-change, contain or content-visibility, ever: the pin wall inside
   is position:fixed and would otherwise be pinned to them (see
   Contact.tsx). It slides over Journey by the sticky stack alone, and
   nothing covers it, so it needs no veil.

   footerRef goes on the <footer>, so the bottom nav can step aside while
   the footer's text rows (title block, legal line) pass behind it.
   ============================================================ */
export default function ContactSheet({ footerRef }: { footerRef?: React.RefObject<HTMLElement | null> }) {
  return (
    <Sheet id={S.id} n={S.n} label={S.label} ground="night" className="contact" labelledBy="h-contact">
      <Contact />
      <Footer footerRef={footerRef} />
    </Sheet>
  );
}
