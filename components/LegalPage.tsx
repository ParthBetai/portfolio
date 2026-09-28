import Link from "next/link";
import Footer from "./Footer";
import { identity, legal } from "@/lib/content";

/* ============================================================
   LEGAL PAGE
   The shell every policy and info page shares. A Server Component with
   no client JavaScript of its own: these pages are text to be read, so
   there is nothing here to hydrate and nothing that can fail to load.

   Contrast is deliberately higher than the home page. The body copy sits
   at bone/70 rather than ash: ash on void is about 4.6:1, which is fine
   for a short caption and tiring for four screens of policy. bone/70
   lands around 8:1, and the smallest mono text stays above 4.5:1.
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
   Small components rather than a descendant-selector wrapper, so each
   page reads as plain markup and every style lives in one place.
   ------------------------------------------------------------ */
const body = "text-base leading-relaxed text-bone/70 break-words md:text-lg";

export function H2({ children, id }: { children: React.ReactNode; id?: string }) {
  return (
    /* t-display is set at 0.84 for single giant lines. A heading this
       small can wrap, and two lines at 0.84 collide. */
    <h2 id={id} className="t-display mb-4 mt-14 text-xl leading-[1.1] text-bone md:text-2xl">
      {children}
    </h2>
  );
}

export function P({ children }: { children: React.ReactNode }) {
  return <p className={`mb-4 ${body}`}>{children}</p>;
}

export function UL({ children }: { children: React.ReactNode }) {
  return <ul className="mb-6 space-y-3">{children}</ul>;
}

export function LI({ children }: { children: React.ReactNode }) {
  return (
    <li className={`flex gap-3 ${body}`}>
      {/* The outer box is exactly one line of the item's own text (1lh),
          so the small square centres on the first line however the text
          wraps or scales. */}
      <span aria-hidden className="flex h-[1lh] shrink-0 items-center">
        <span className="text-[10px] leading-none text-acid">■</span>
      </span>
      <span className="min-w-0">{children}</span>
    </li>
  );
}

export function Strong({ children }: { children: React.ReactNode }) {
  return <strong className="font-medium text-bone">{children}</strong>;
}

/* One link style for the prose. Internal paths go through next/link so
   moving between policy pages is a client navigation; anything on
   another origin opens in a new tab and says so to screen readers. */
export function A({ href, children }: { href: string; children: React.ReactNode }) {
  const cls =
    "text-bone underline decoration-white/25 underline-offset-4 transition-colors duration-300 hover:decoration-acid";

  /* "//host" is protocol-relative, i.e. another site, so it is not an
     internal path even though it starts with a slash. */
  if (href.startsWith("/") && !href.startsWith("//")) {
    return (
      <Link href={href} data-hover className={cls}>
        {children}
      </Link>
    );
  }

  const external = /^https?:\/\//i.test(href);
  /* Only web and mail links are allowed out. Anything else (javascript:,
     data:, a stray protocol-relative URL) renders as plain text, so a
     bad href in the copy can never become a clickable script. */
  if (!external && !/^mailto:/i.test(href)) {
    return <span className="text-bone">{children}</span>;
  }
  return (
    <a
      href={href}
      data-hover
      className={cls}
      {...(external ? { target: "_blank", rel: "noopener noreferrer" } : {})}
    >
      {children}
      {external && <span className="sr-only"> (opens in a new tab)</span>}
    </a>
  );
}

/* ------------------------------------------------------------
   SHELL
   ------------------------------------------------------------ */
export default function LegalPage({
  eyebrow = "Info",
  title,
  updated,
  path,
  children,
}: {
  eyebrow?: string;
  title: string;
  updated: string;
  /* This page's own href, so the footer can mark it as the current one.
     A Server Component has no usePathname, and passing it costs nothing. */
  path?: string;
  children: React.ReactNode;
}) {
  /* The display face is at its widest here, so one long word
     ("Accessibility") at the standard size is wider than a phone and
     than the text column. Titles with a long word step down a size;
     break-words is the last resort for anything longer still. */
  const longest = Math.max(...title.split(/\s+/).map((w) => w.length));
  const size =
    longest > 9
      ? "text-[9vw] sm:text-[3.5rem] md:text-[4.25rem]"
      : "text-[13vw] sm:text-[4.5rem] md:text-[5.5rem]";

  const iso = isoDate(updated);
  const year = legal.updated.match(/\d{4}/)?.[0];

  /* Links on these pages are 11px mono. A min height keeps every target
     at least 24px tall (the WCAG 2.2 minimum) without making the type any
     bigger: min-h-6 in the footer rows, a roomier min-h-10 up top. */
  const hit = "inline-flex items-center transition-colors duration-300";

  return (
    <div className="min-h-screen bg-void text-bone">
      <header className="gutter flex items-center justify-between gap-6 py-6">
        <Link href="/" data-hover className={`t-mono ${hit} min-h-10 text-bone hover:text-acid`}>
          {identity.name}
          <span aria-hidden className="text-acid">
            .
          </span>
          <span className="sr-only">, home page</span>
        </Link>

        <Link
          href="/"
          data-hover
          className={`t-mono ${hit} min-h-10 gap-2 text-bone/60 hover:text-acid`}
        >
          <svg
            aria-hidden
            focusable="false"
            width="14"
            height="14"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.75"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M19 12H5" />
            <path d="m12 19-7-7 7-7" />
          </svg>
          Back to home
        </Link>
      </header>

      <main id="main" className="gutter mx-auto max-w-3xl pb-24 pt-16 md:pt-24">
        <p className="t-mono mb-6 text-bone/55">{eyebrow}</p>

        <h1 className={`t-display chrome break-words text-balance leading-[0.9] ${size}`}>{title}</h1>

        <p className="t-mono mt-8 text-bone/55">
          Last updated {iso ? <time dateTime={iso}>{updated}</time> : updated}
        </p>

        <div className="mt-12 md:mt-16">{children}</div>
      </main>

      {/* The same footer as the home page, so the bottom of the site never
          changes from page to page. */}
      <Footer />
    </div>
  );
}
