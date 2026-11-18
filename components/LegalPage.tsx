import Link from "next/link";
import Sheet from "./Sheet";
import { FooterSheet } from "./Footer";
import StatusStrip from "./StatusStrip";
import { legal, notFound } from "@/lib/content";

/* ============================================================
   LEGAL PAGE
   The shell every policy and info page shares: one cream sheet of the
   drawing set, its index tab reading "Legal" under the status strip,
   then the same night footer sheet that ends the home page, sliding
   over it. The page itself is a Server Component: the prose is text to
   be read, so it needs nothing hydrated. Only the sheets' stickiness and
   the footer's motion are scripted, and without scripts the two sheets
   simply flow.

   Navy ink on cream throughout (11.3:1 for the body, 5.7:1 for the
   date), links underlined so they never depend on colour alone.
   Styles: .legalsheet and .lg in app/styles/s6-contact.css.
   ============================================================ */

const MONTHS = [
  "january", "february", "march", "april", "may", "june",
  "july", "august", "september", "october", "november", "december",
];

/* legal.updated is written for people ("23 September 2026"); <time>
   wants YYYY-MM-DD. Parsed strictly by hand: anything that doesn't match
   drops the machine-readable attribute instead of publishing a wrong one,
   and the visible date still shows exactly as written. */
function isoDate(human: string): string | undefined {
  const m = /^(\d{1,2})\s+([a-z]+)\s+(\d{4})$/i.exec(human.trim());
  if (!m) return undefined;
  const month = MONTHS.indexOf(m[2].toLowerCase());
  if (month < 0) return undefined;
  return `${m[3]}-${String(month + 1).padStart(2, "0")}-${m[1].padStart(2, "0")}`;
}

/* ------------------------------------------------------------
   PROSE
   Small components, so each page reads as plain markup. Their look is
   one set of rules under .lg-body in the stylesheet.
   ------------------------------------------------------------ */
export function H2({ children, id }: { children: React.ReactNode; id?: string }) {
  return <h2 id={id}>{children}</h2>;
}

export function P({ children }: { children: React.ReactNode }) {
  return <p>{children}</p>;
}

export function UL({ children }: { children: React.ReactNode }) {
  return <ul>{children}</ul>;
}

export function LI({ children }: { children: React.ReactNode }) {
  return <li>{children}</li>;
}

export function Strong({ children }: { children: React.ReactNode }) {
  return <strong>{children}</strong>;
}

/* One link style for the prose. Internal paths go through next/link so
   moving between policy pages is a client navigation; anything on
   another origin opens in a new tab and says so to screen readers. */
export function A({ href, children }: { href: string; children: React.ReactNode }) {
  /* "//host" is protocol-relative, i.e. another site, so it is not an
     internal path even though it starts with a slash. */
  if (href.startsWith("/") && !href.startsWith("//")) {
    return (
      <Link href={href} data-hover>
        {children}
      </Link>
    );
  }

  const external = /^https?:\/\//i.test(href);
  /* Only web and mail links are allowed out. Anything else (javascript:,
     data:, a stray protocol-relative URL) renders as plain text, so a
     bad href in the copy can never become a clickable script. */
  if (!external && !/^mailto:/i.test(href)) {
    return <span>{children}</span>;
  }
  return (
    <a href={href} data-hover {...(external ? { target: "_blank", rel: "noopener noreferrer" } : {})}>
      {children}
      {external && <span className="sr-only"> (opens in a new tab)</span>}
    </a>
  );
}

/* ------------------------------------------------------------
   SHELL
   ------------------------------------------------------------ */
export default function LegalPage({
  title,
  updated,
  path,
  children,
}: {
  title: string;
  updated: string;
  /* This page's own href. It names the sheet's anchor; the footer marks
     the current page itself. */
  path?: string;
  children: React.ReactNode;
}) {
  const slug = path?.replace(/[^a-z0-9-]/gi, "") || "info";
  const iso = isoDate(updated);
  /* One long word ("Accessibility") at the standard size is wider than a
     phone, so a title with one steps down a size there. */
  const long = Math.max(...title.split(/\s+/).map((w) => w.length)) > 9;

  return (
    <>
      {/* The same strip as the home page; its name tag goes home. */}
      <StatusStrip />

      <main id="main" className="sheet-stack">
        <Sheet
          id={slug}
          n="01"
          label={legal.tabLabel}
          ground="cream"
          tab="inner"
          className="legalsheet"
          labelledBy={`h-${slug}`}
        >
          <article className="lg">
            <Link href="/" className="lg-back" data-hover>
              <svg aria-hidden="true" focusable="false" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                <path d="M17 10H4M9 5l-5 5 5 5" />
              </svg>
              {notFound.cta}
            </Link>
            <h1 id={`h-${slug}`} className={`t-head${long ? " is-long" : ""}`}>
              {title}
            </h1>
            <p className="lg-upd">Last updated {iso ? <time dateTime={iso}>{updated}</time> : updated}</p>
            <div className="lg-body">{children}</div>
          </article>
        </Sheet>

        {/* The same footer as the home page, so the bottom of the site
            never changes from page to page. */}
        <FooterSheet />
      </main>
    </>
  );
}
