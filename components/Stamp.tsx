import { C, seeded, starPath } from "./drawings/kit";

/* ============================================================
   RUBBER STAMP
   A round rubber stamp in the brick ink, pressed on a project photo:
   two rings, the top and bottom words set on arcs, and a word (or two)
   in the middle; with no middle word the centre is a drawn star (the EV
   model's "exhibited twice"). Every word restates a fact the project's
   badge or body already gives in HTML, so the whole stamp is
   decorative.

   The worn ink is a fixed mask of small holes and one dry streak, drawn
   once from a seed, never a live turbulence filter. The multiply blend
   and the tilt live on the static holder in Work.tsx (.stampwrap); the
   stamp itself is what presses down once, so nothing that blends is
   ever transformed.
   ============================================================ */
export default function Stamp({
  id,
  top,
  mid,
  mid2,
  bottom,
}: {
  /** Unique per stamp on the page: it prefixes the svg's own ids. */
  id: string;
  top: string;
  mid?: string;
  mid2?: string;
  bottom: string;
}) {
  /* Each stamp wears differently: the seed comes from its id. */
  const r = seeded(7 + ([...id].reduce((a, ch) => a * 31 + ch.charCodeAt(0), 0) % 997));
  const holes = Array.from({ length: 70 }, () => ({
    cx: (r() * 160).toFixed(1),
    cy: (r() * 160).toFixed(1),
    r: (0.6 + r() * 2.2).toFixed(1),
  }));
  const k = `wk-st-${id}`;
  return (
    <svg className="stamp-svg" viewBox="0 0 160 160" aria-hidden="true" focusable="false">
      <defs>
        <path id={`${k}-t`} d="M80 80 m-57 0 a57 57 0 1 1 114 0" />
        <path id={`${k}-b`} d="M80 80 m-57 0 a57 57 0 0 0 114 0" />
        <mask id={`${k}-wear`}>
          <rect width={160} height={160} fill="#fff" />
          <g fill="#000">
            {holes.map((c, i) => (
              <circle key={i} cx={c.cx} cy={c.cy} r={c.r} />
            ))}
          </g>
          <path d="M0 120 L160 96 L160 104 L0 130Z" fill="#000" opacity={0.35} />
        </mask>
      </defs>
      <g mask={`url(#${k}-wear)`}>
        <g fill="none" stroke={C.brick}>
          <circle cx={80} cy={80} r={74} strokeWidth={4} />
          <circle cx={80} cy={80} r={66} strokeWidth={1.5} />
          <circle cx={80} cy={80} r={42} strokeWidth={1.5} />
          <path d="M28 80 h8 M124 80 h8" strokeWidth={3} />
        </g>
        <g className="stamp-type" fill={C.brick}>
          <text fontSize={14.5} letterSpacing={2}>
            <textPath href={`#${k}-t`} startOffset="50%" textAnchor="middle">
              {top}
            </textPath>
          </text>
          <text fontSize={13} letterSpacing={1.4} dy={11}>
            <textPath href={`#${k}-b`} startOffset="50%" textAnchor="middle">
              {bottom}
            </textPath>
          </text>
          {mid ? (
            <text x={80} y={mid2 ? 82 : 88} fontSize={mid2 ? 22 : 26} textAnchor="middle">
              {mid}
            </text>
          ) : (
            <path d={starPath(80, 80, 18)} />
          )}
          {mid2 && (
            <text x={80} y={101} fontSize={14} textAnchor="middle" letterSpacing={1}>
              {mid2}
            </text>
          )}
        </g>
      </g>
    </svg>
  );
}
