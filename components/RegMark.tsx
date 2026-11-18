/* ============================================================
   REGISTRATION MARK
   The crosshair a printer lines the sheets of a set up by: a circle with
   a cross through it, set inside each corner of every sheet. Decorative
   only, and drawn in currentColor so it takes the sheet's ink.
   ============================================================ */
export default function RegMark({
  corner,
  size = 26,
  className = "",
}: {
  corner: "tl" | "tr" | "bl" | "br";
  size?: number;
  className?: string;
}) {
  const h = size / 2;
  return (
    <svg
      className={`reg-mark ${corner} ${className}`}
      width={size}
      height={size}
      viewBox={`0 0 ${size} ${size}`}
      aria-hidden="true"
      focusable="false"
    >
      <g fill="none" stroke="currentColor" strokeWidth="1">
        <circle cx={h} cy={h} r={(h * 0.56).toFixed(1)} />
        <path d={`M${h} 0 V${size} M0 ${h} H${size}`} />
      </g>
    </svg>
  );
}
