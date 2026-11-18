import type { Metadata } from "next";
import Link from "next/link";
import Ambassador from "@/components/Ambassador";
import { FooterSheet } from "@/components/Footer";
import Sheet from "@/components/Sheet";
import StatusStrip from "@/components/StatusStrip";
import { notFound } from "@/lib/content";

export const metadata: Metadata = {
  title: "Page not found",
};

/* ============================================================
   WRONG TURN
   The 404 is one night sheet of the drawing set: a plain "404" in the
   sheet heading face, the yellow taxi on a short road of its own, turned
   round to face back the way it came, then the line and a cream button
   home. The footer sheet slides over it as on every other page.

   Rendered inside the root layout, so the grain, the cursor and the skip
   link (which targets #main) all carry over. Static on purpose: a 404
   should never be the page that fails to load, so its one bit of motion,
   the taxi rolling in once and stopping, is plain CSS (@starting-style
   in styles/s6-contact.css) and needs no script. With reduced motion,
   or where that is not supported, the taxi is simply parked there.
   ============================================================ */
export default function NotFound() {
  return (
    <>
      <StatusStrip />
      <main id="main" className="sheet-stack">
        <Sheet id="nf" n="01" label="404" ground="night" tab="none" className="nfsheet" labelledBy="h-nf">
          <div className="nf">
            <h1 id="h-nf" className="t-head nfnum">
              404
              <span className="sr-only">, page not found</span>
            </h1>
            <div className="nfroad" aria-hidden="true">
              <div className="nftaxi">
                <span className="roll">
                  <Ambassador variant="color" width={150} flip shadow />
                </span>
              </div>
            </div>
            <p className="t-head nft">{notFound.title}</p>
            <p className="nfb">{notFound.body}</p>
            <Link href="/" className="btn cream" data-hover>
              {notFound.cta}
            </Link>
          </div>
        </Sheet>

        {/* The same footer as every other page. */}
        <FooterSheet />
      </main>
    </>
  );
}
