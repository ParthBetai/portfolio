"use client";

import { useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import Ambassador from "./Ambassador";
import RegMark from "./RegMark";
import { ui } from "@/lib/content";

/* ============================================================
   ROUTE PROGRESS
   The "Loading" screen shown between pages, from the moment a link to
   another page is clicked until that page has arrived: a cream drawing
   sheet, like the home page's loader, with the one-ink taxi driving
   along the kerb and the road inking in behind it (a CSS loop, see
   PAGE-CHANGE SHEET in styles/f0-base.css).

   This used to be app/loading.tsx, but Next wraps every page under a
   loading file in a Suspense boundary. Even a fully prebuilt page then
   ships its content in a hidden block that an inline script reveals,
   so with scripts off the whole site stayed blank behind this screen,
   and text readers saw the page as a hidden fragment. Watching clicks
   instead keeps every page plain HTML.

   It waits a moment before showing: the deployed site's pages are
   prebuilt and usually arrive at once, and a screen that blinks on and
   off reads as a glitch. In local development a page is compiled the
   first time it is opened, which can take seconds; that is when this
   earns its place.
   ============================================================ */

/* A navigation shorter than this never shows the screen. */
const SHOW_AFTER_MS = 160;
/* If a page never arrives (network gone, a click the router ignored),
   the screen lets go rather than trapping the visitor behind it. */
const GIVE_UP_MS = 15000;

export default function RouteProgress() {
  const pathname = usePathname();
  const [shown, setShown] = useState(false);
  const showTimer = useRef(0);
  const giveUp = useRef(0);

  /* The new page is here: clear everything. */
  useEffect(() => {
    window.clearTimeout(showTimer.current);
    window.clearTimeout(giveUp.current);
    setShown(false);
  }, [pathname]);

  useEffect(() => {
    const reset = () => {
      window.clearTimeout(showTimer.current);
      window.clearTimeout(giveUp.current);
      setShown(false);
    };

    /* Capture phase, so this sees the click before the router's own
       handler calls preventDefault on it. */
    const onClick = (e: MouseEvent) => {
      if (e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
      const a = e.target instanceof Element ? e.target.closest("a") : null;
      if (!a || a.hasAttribute("download")) return;
      if (a.target && a.target !== "_self") return;
      let url: URL;
      try {
        url = new URL(a.href, window.location.href);
      } catch {
        return;
      }
      /* Only other pages of this site. Jumps within the page (#about),
         mail links and files are not page changes. */
      if (url.origin !== window.location.origin) return;
      if (url.pathname === window.location.pathname) return;
      if (/\.[a-z0-9]+$/i.test(url.pathname)) return;

      window.clearTimeout(showTimer.current);
      window.clearTimeout(giveUp.current);
      showTimer.current = window.setTimeout(() => setShown(true), SHOW_AFTER_MS);
      giveUp.current = window.setTimeout(reset, GIVE_UP_MS);
    };

    /* Coming back through the browser's page cache restores the old page
       with this state frozen in it. */
    window.addEventListener("pageshow", reset);
    document.addEventListener("click", onClick, true);
    return () => {
      window.removeEventListener("pageshow", reset);
      document.removeEventListener("click", onClick, true);
      reset();
    };
  }, []);

  if (!shown) return null;

  /* Above the nav (z-50), below the cursor (z-70), the same layer the
     resume preview uses. */
  return (
    <div className="g-cream fixed inset-0 z-[65]" data-ground="cream">
      <div className="sheet-frame" aria-hidden="true" />
      <RegMark corner="tl" />
      <RegMark corner="tr" />
      <RegMark corner="bl" />
      <RegMark corner="br" />
      <p role="status" className="absolute bottom-[170px] left-[var(--cl)] text-[16px] font-bold text-ink">
        {ui.loading}
      </p>
      <div className="rp-road" aria-hidden="true">
        <i className="rp-bar" />
        <span className="rp-car">
          <Ambassador variant="ink" width={54} paper="var(--color-cream)" />
        </span>
      </div>
    </div>
  );
}
