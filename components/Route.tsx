/* ============================================================
   ROUTE
   The taxi's route down the page, built per sheet from static pieces at
   fixed offsets: rails (straight runs), elbows (rounded corners), stops
   (rings on the line), spurs (one branch from the gutter out to a piece
   of content), stations (the stops a list hangs from) and the terminus
   (where it ends, in the footer). There is never one page-tall drawing
   and nothing is measured per scroll: each piece is placed by its sheet's
   own CSS, in the --rx / --cl / --R / --rw terms of styles/f0-base.css,
   and takes its colours from the ground it sits on (--ri, --rh).

   Every piece is markup only (no state), so it works in server and
   client components alike, and is fully solid without scripts.
   On the home page driveRoute (lib/motion.ts) chains every rail and
   elbow into one journey and the small taxi drives it with the scroll:
   the line is solid behind the taxi and pencilled ahead of it. A rail
   with `stand` is one a bigger taxi drives instead (the hero's road, the
   bridge deck, the footer kerb), the car marked data-stand-car with the
   same name. Elsewhere (the footer on an info page) every rail and
   elbow fills with the reading line. Spurs keep the reading-line fill
   everywhere.

   All of it is decorative (aria-hidden); a stop label that names
   something the visitor should read is HTML text beside it.
   ============================================================ */

type Piece = {
  className?: string;
  style?: React.CSSProperties;
};

const cx = (...c: (string | false | undefined)[]) => c.filter(Boolean).join(" ");
const standAttr = (stand?: string) => (stand ? { "data-stand": stand } : {});

/** A straight run. "v" runs down the gutter (left is set for you); "h"
    runs across, filling from the left, or from the right with rtl.
    `stand` names the stand-in car that drives it (see STAND-INS in
    lib/motion.ts). */
export function Rail({
  dir = "v",
  rtl = false,
  stand,
  className,
  style,
}: Piece & { dir?: "v" | "h"; rtl?: boolean; stand?: string }) {
  return (
    <i
      className={cx("rail", dir, rtl && "rtl", className)}
      style={style}
      aria-hidden="true"
      {...standAttr(stand)}
    >
      <b />
    </i>
  );
}

/** A rounded corner of --R: tl draws the top and left edges (a turn from
    going left to going down, say), tr the top and right, bl the bottom
    and left, br the bottom and right. */
export function Elbow({ corner, className, style }: Piece & { corner: "tl" | "tr" | "bl" | "br" }) {
  return <i className={cx("elbow", `e-${corner}`, className)} style={style} aria-hidden="true" />;
}

/** A ring on the line, on the gutter unless the class moves it. */
export function Stop({ className, style }: Piece) {
  return <i className={cx("stop", className)} style={style} aria-hidden="true" />;
}

/** The handwritten word beside a stop (Kalam, 19px; 17px on phone).
    Mark it decorative when the same word is HTML text nearby. */
export function StopLabel({
  children,
  className,
  style,
  decorative = false,
}: {
  children: React.ReactNode;
  className?: string;
  style?: React.CSSProperties;
  decorative?: boolean;
}) {
  return (
    <span className={cx("stoplab", className)} style={style} aria-hidden={decorative || undefined}>
      {children}
    </span>
  );
}

/** One branch from the gutter to a piece of content: put it inside the
    content's own positioned box (whose left edge is the --cl column); it
    meets the gutter at the box's vertical middle and ends in a stop
    there. */
export function Spur() {
  return (
    <>
      <Rail dir="h" className="r-spur" />
      <Stop className="s-spur" />
    </>
  );
}

/** The stop a list row hangs from (the service rows), with a thin lead
    to the row. Filled while its row is open. Put it in the row's own
    positioned box inside the --cl column. */
export function Station({ on = false, className, style }: Piece & { on?: boolean }) {
  return <i className={cx("station", on && "on", className)} style={style} aria-hidden="true" />;
}

/** Where the route ends: a heavier ring with a filled centre. Place it
    with a class; "You've arrived" beside it is a .arrived span. */
export function Terminus({ className, style }: Piece) {
  return <i className={cx("stop", "s-end", className)} style={style} aria-hidden="true" />;
}
