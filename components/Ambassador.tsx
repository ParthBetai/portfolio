/* ============================================================
   AMBASSADOR
   The Kolkata taxi, everywhere it appears. Four prints of one car, picked
   with `variant`:

     color    the detailed taxi in colour: a <use> of the symbol that
              AmbassadorDefs.tsx draws once in the root layout (gradient
              body, glass with reflections, chrome, filled wheel wells).
              The hero, the bridge deck, the footer street, the 404.
     outline  the same with a navy keyline round the body, for small sizes
              on pale grounds (the bottom nav's 30px taxi).
     ink      a one-colour print with knocked-out glass and hubs: the
              ticket stub, the loader's kerb, the page-change sheet.
     line     cyanotype linework (the blueprint copy in the Exposure).

   `flip` turns it to face left. `rack` adds the roof rack the hero's
   robot rides on; `shadow` a soft ground shadow. Every print is
   decorative (aria-hidden).

   One more drawing of the car lives in AmbassadorDefs.tsx as AMB_TOP:
   the taxi seen from above, which driveRoute (lib/motion.ts) puts on
   the route line itself, turned to the way it is driving.
   ============================================================ */

/* Paths in the car's own 48 x 18 units, shared with AmbassadorDefs.tsx
   and with any drawing that needs the silhouette (the share image). */
export const BODY =
  "M9.9 7.3 C7.6 7.35 5.4 7.45 3.9 7.75 C2.2 8.1 1.15 9.1 .9 10.5 L.95 12.6 C1.1 13.4 1.7 14 2.7 14.1 L7.9 14.55 C8.6 14.6 9 14.625 9.05 14.625 C9 11.9 10.6 10.1 12.8 10.1 C15 10.1 16.6 11.9 16.6 14.625 L34.3 14.625 A4.38 4.38 0 1 1 42.7 14.625 L43.6 14.55 C45.4 14.45 46.8 14 47.2 13.2 L47.6 11.4 C47.8 10.4 47.9 9.4 47.8 8.4 C47.6 7.275 46.5 6.2 44.9 6.2 C43.1 6.2 41.4 6.578 39.6 6.906 C37.6 7.1 35.4 7.3 33.1 7.3 L30.7 2.2 C30.1 1 28.7 .4 26.4 .2 C24.7 .05 23.1 0 21.4 0 C18.6 0 16.4 .45 14.9 1.4 C13.2 2.5 11.8 4.8 11 6.5 C10.7 7 10.4 7.25 9.9 7.3 Z";
/* The two wheel arches, filled so the taxi never reads as a cut-out. */
export const WELLS =
  "M9.05 14.625 C9 11.9 10.6 10.1 12.8 10.1 C15 10.1 16.6 11.9 16.6 14.625 Z M34.3 14.625 A4.38 4.38 0 1 1 42.7 14.625 Z";
export const GLASS =
  "M31.55 6.75 L13.35 6.75 C13.8 5.1 14.7 3.3 16.2 2.25 C17.9 1.4 19.7 1.125 21.9 1.125 C24.6 1.125 27 1.35 28.4 1.9 C28.95 2.15 29.3 2.5 29.6 2.95 Z";

/* The symbol ids AmbassadorDefs.tsx defines. */
export const AMB = "taxi-amb";
export const AMB_OUT = "taxi-amb-out";
/* The car seen from above, nose to the right, in a 31 x 15 box. */
export const AMB_TOP = "taxi-amb-top";
export const TOP_VB = "0 0 31 15";

/* The colour symbol's box (half a unit of room round the car). */
const VB = "-0.5 -0.5 49 19";

export type TaxiVariant = "color" | "outline" | "ink" | "line";

type TaxiProps = {
  variant: TaxiVariant;
  /** Width in px; the height follows the car's proportions. */
  width?: number;
  /** Face left instead of right. */
  flip?: boolean;
  /** The roof rack the hero's robot rides on. */
  rack?: boolean;
  /** A soft shadow on the ground under the wheels (color, outline). */
  shadow?: boolean;
  /** ink: the print colour; line: the line colour; color/outline: the
      rack's colour. Any CSS colour, var() included. */
  ink?: string;
  /** ink: the knock-out colour (glass, hubs); line: the fill behind the
      lines (the ground). */
  paper?: string;
  className?: string;
  style?: React.CSSProperties;
  /** Marks the svg as a stand-in taxi's body (STAND-INS in lib/motion.ts). */
  "data-stand-body"?: string;
};

/* The roof rack, drawn above the car in its units. */
function Rack({ color, width }: { color: string; width: number }) {
  return (
    <g fill="none" style={{ stroke: color }} strokeWidth={width} strokeLinecap="round">
      <path d="M16.4 1.15 L16.4 -.7 M27.6 .45 L27.6 -.7 M22 .02 L22 -.7" />
      <path d="M15.2 -.7 H28.9" />
    </g>
  );
}

/* Cyanotype linework: the body silhouette filled in the ground colour,
   then every edge drawn in the line colour. */
function LineCar({ L, base, rack }: { L: string; base: string; rack: boolean }) {
  const s = (w: number): React.CSSProperties => ({ stroke: L, strokeWidth: w });
  const fill = { fill: base };
  return (
    <g>
      <path d={WELLS} style={fill} />
      {[12.2, 38.5].map((x) => (
        <g key={x}>
          <circle cx={x} cy="14.3" r="3.7" style={{ ...fill, ...s(1.4) }} />
          <circle cx={x} cy="14.3" r="2.95" fill="none" style={s(0.8)} opacity=".6" />
          <circle cx={x} cy="14.3" r="2" style={{ ...fill, ...s(0.9) }} />
          <circle cx={x} cy="14.3" r="1.2" fill="none" style={s(0.8)} opacity=".55" />
        </g>
      ))}
      {rack && <Rack color={L} width={1.4} />}
      <path d={BODY} style={fill} />
      <path d={GLASS} style={{ fill: "rgb(226 235 255 / 0.10)", ...s(0.9) }} />
      <path
        d="M18.2 6.2 L20.4 1.9 M19.4 6.2 L21.0 3.0 M25.6 6.2 L27.4 2.0"
        style={{ stroke: "rgb(226 235 255 / 0.55)", strokeWidth: 1.2 }}
        strokeLinecap="round"
      />
      <g style={{ ...fill, ...s(0.9) }} strokeLinejoin="round">
        <path d="M29.45 2.85 L29.95 2.95 L30.4 6.95 L29.75 6.95 Z" />
        <rect x="21.2" y="1.0" width="1.25" height="5.95" />
        <path d="M16.0 6.95 L16.3 1.95 L16.95 1.8 L16.65 6.95 Z" />
      </g>
      <path d={BODY} fill="none" style={s(1.4)} strokeLinejoin="round" />
      <g fill="none" style={s(0.9)} strokeLinecap="round" opacity=".75">
        <path d="M33.2 7.5 L33.25 14.5" />
        <path d="M21.82 7.1 V14.5" />
        <path d="M16.05 7.1 V10.1" />
        <path d="M15.4 1.75 C17 .95 19.2 .62 21.4 .62 C24.2 .62 27 .82 28.9 1.45" />
        <path d="M45.2 9.5 L40.75 9.46 M36.25 9.45 C28 9.45 16 9.55 2.3 9.75" />
      </g>
      <path d="M23.1 8.1 H24.6 M34.1 8.1 H35.6" style={s(0.9)} strokeLinecap="round" />
      <g style={{ ...fill, ...s(0.9) }}>
        <path d="M44.1 11.25 L47.4 11.25 C48 11.25 48.25 11.75 48.25 12.375 C48.25 13 47.95 13.5 47.4 13.5 L44.1 13.5 Z" />
        <path d="M3.9 11.25 L.6 11.25 C0 11.25 -.25 11.75 -.25 12.375 C-.25 13 .05 13.5 .6 13.5 L3.9 13.5 Z" />
      </g>
      <circle cx="46.2" cy="8.3" r="1.4" style={{ ...fill, ...s(0.9) }} />
      <path style={{ ...fill, ...s(0.9) }} d="M1.25 8.75 C.95 9.1 .75 9.6 .68 10.2 L.7 11.3 L1.75 11.3 L1.75 8.6 Z" />
    </g>
  );
}

export default function Ambassador({ variant, width = 64, flip = false, rack = false, shadow = false, ink, paper, className = "", style, ...rest }: TaxiProps) {
  const box: React.CSSProperties = { overflow: "visible", ...(flip ? { transform: "scaleX(-1)" } : {}), ...style };
  const cls = `block ${className}`;
  const body = rest["data-stand-body"] !== undefined ? { "data-stand-body": rest["data-stand-body"] } : {};

  if (variant === "ink") {
    /* A one-colour print: the wheels, body and pillars in the ink, the
       glass and hub centres knocked out to the paper. */
    const col = ink ?? "var(--color-ink)";
    const knock = paper ?? "var(--color-card)";
    return (
      <svg viewBox="-1 -1 50 20" width={width} height={+((width * 20) / 50).toFixed(1)} aria-hidden="true" focusable="false" className={cls} style={box} {...body}>
        {rack && <Rack color={col} width={0.6} />}
        <g style={{ fill: col }}>
          <circle cx="12.2" cy="14.3" r="3.7" />
          <circle cx="38.5" cy="14.3" r="3.7" />
          <path d={BODY} />
        </g>
        <path d={GLASS} style={{ fill: knock }} />
        <g style={{ fill: col }}>
          <rect x="21.2" y="1" width="1.25" height="6.1" />
          <path d="M16.1 6.9 L16.4 1.9 L17 1.9 L16.8 6.9Z M30.05 6.9 L29.75 3.1 L30.3 3.1 L30.6 6.9Z" />
        </g>
        <circle cx="12.2" cy="14.3" r="1.6" style={{ fill: knock }} />
        <circle cx="38.5" cy="14.3" r="1.6" style={{ fill: knock }} />
      </svg>
    );
  }

  const h = +((width * 19) / 49).toFixed(1);
  if (variant === "line") {
    return (
      <svg viewBox={VB} width={width} height={h} aria-hidden="true" focusable="false" className={cls} style={box} {...body}>
        <LineCar L={ink ?? "var(--color-bline)"} base={paper ?? "var(--color-blue)"} rack={rack} />
      </svg>
    );
  }

  return (
    <svg viewBox={VB} width={width} height={h} aria-hidden="true" focusable="false" className={cls} style={box} {...body}>
      {shadow && <ellipse cx="24.2" cy="18.15" rx="22.5" ry=".9" fill="#0b1030" opacity=".28" />}
      {rack && <Rack color={ink ?? "var(--color-ink)"} width={0.22} />}
      <use href={`#${variant === "outline" ? AMB_OUT : AMB}`} />
    </svg>
  );
}
