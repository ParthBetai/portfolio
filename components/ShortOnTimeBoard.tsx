import { services } from "@/lib/content";

/* ============================================================
   "SHORT ON TIME?"
   A teal enamel street board beside the Services heading, the one
   sign-painted piece on this sheet: four screws, a cream keyline inset
   from the edge, a slight tilt, the title in painted letters with the
   board's stepped shade. It is a plain link to the Work sheet, so it
   works without scripts; with them SmoothScroll sends it through
   jumpTo, which lands on the sheet's anchor and focuses it.
   On a phone it sits under the heading, before the list.
   ============================================================ */
export default function ShortOnTimeBoard() {
  const { title, line } = services.shortcut;
  return (
    <a className="board" href="#work" data-hover>
      <span className="screws" aria-hidden="true" />
      <b className="painted shade-board">{title}</b>
      <span className="bl">
        {line}
        <svg
          className="arr"
          viewBox="0 0 20 20"
          aria-hidden="true"
          fill="none"
          stroke="currentColor"
          strokeWidth={1.8}
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M3 10h13M11 5l5 5-5 5" />
        </svg>
      </span>
    </a>
  );
}
