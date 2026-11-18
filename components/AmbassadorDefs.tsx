import { AMB, AMB_OUT, AMB_TOP, BODY, GLASS, TOP_VB, WELLS } from "./Ambassador";

/* ============================================================
   AMBASSADOR DEFS
   The detailed Kolkata taxi, drawn once per page as an SVG <symbol> and
   used everywhere it appears in colour: the hero, the bridge deck, the
   footer street, the nav road, the title block, the 404.
   Ambassador.tsx (variant "color" or "outline") renders a <use> of it.

   Side on, facing right: the tall domed cabin set well back, the front
   wing rising into a brow over the big round headlamp, the long tail and
   short nose, chrome bumpers and hub caps. The wheel arches are filled
   (WELLS) in the night navy, so the car never reads as a cut-out with
   the ground showing through its arches. The outline symbol is the same
   car with a navy keyline round the body, for small sizes on pale grounds
   (the nav). The top symbol is the same car seen from above, for the
   small taxi that drives the route.

   Rendered once in the root layout, as a 0x0 absolutely placed svg:
   never display:none, which would stop the gradients and the symbol
   from painting where they are used. Every id is namespaced (taxi-).
   ============================================================ */
export default function AmbassadorDefs() {
  return (
    <svg
      width="0"
      height="0"
      aria-hidden="true"
      focusable="false"
      style={{ position: "absolute", width: 0, height: 0, overflow: "hidden" }}
    >
      <defs>
        <linearGradient id="taxi-g-body" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#ffdc45" />
          <stop offset=".42" stopColor="#f6c400" />
          <stop offset=".78" stopColor="#e9b500" />
          <stop offset="1" stopColor="#c99a00" />
        </linearGradient>
        <linearGradient id="taxi-g-glass" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#3a4258" />
          <stop offset=".55" stopColor="#171b2c" />
          <stop offset="1" stopColor="#0d1020" />
        </linearGradient>
        <radialGradient id="taxi-g-hub" cx=".38" cy=".34" r=".8">
          <stop offset="0" stopColor="#fff" />
          <stop offset=".45" stopColor="#d4d4da" />
          <stop offset="1" stopColor="#8a8a94" />
        </radialGradient>
        <linearGradient id="taxi-g-chrome" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#fff" />
          <stop offset=".45" stopColor="#cfcfd6" />
          <stop offset="1" stopColor="#7d7d88" />
        </linearGradient>
        <clipPath id="taxi-glass-clip">
          <path d={GLASS} />
        </clipPath>

        <symbol id={AMB} viewBox="-0.5 -0.5 49 19" overflow="visible">
          {/* the arches, filled, then the tyres, hub rings and caps */}
          <path d={WELLS} fill="#0e1332" />
          <circle cx="12.2" cy="14.3" r="3.75" fill="#141311" />
          <circle cx="38.5" cy="14.3" r="3.75" fill="#141311" />
          <circle cx="12.2" cy="14.3" r="3.35" fill="none" stroke="#3d3a35" strokeWidth=".3" />
          <circle cx="38.5" cy="14.3" r="3.35" fill="none" stroke="#3d3a35" strokeWidth=".3" />
          <circle cx="12.2" cy="14.3" r="2.55" fill="#e9e6df" />
          <circle cx="38.5" cy="14.3" r="2.55" fill="#e9e6df" />
          <circle cx="12.2" cy="14.3" r="2" fill="url(#taxi-g-hub)" />
          <circle cx="38.5" cy="14.3" r="2" fill="url(#taxi-g-hub)" />
          <g fill="#3d3a35">
            <circle cx="13.4" cy="14.3" r=".26" />
            <circle cx="11" cy="14.3" r=".26" />
            <circle cx="12.2" cy="15.5" r=".26" />
            <circle cx="12.2" cy="13.1" r=".26" />
            <circle cx="39.7" cy="14.3" r=".26" />
            <circle cx="37.3" cy="14.3" r=".26" />
            <circle cx="38.5" cy="15.5" r=".26" />
            <circle cx="38.5" cy="13.1" r=".26" />
          </g>
          {/* the body, a lit line along the roof, the glass with its
              reflections, then the pillars over the glass */}
          <path fill="url(#taxi-g-body)" d={BODY} />
          <path
            d="M15.6 1.55 C17.6 .55 21 .35 24.4 .5 C26.6 .6 28.5 .85 29.6 1.5"
            fill="none"
            stroke="#fff1a8"
            strokeWidth=".35"
            strokeLinecap="round"
            opacity=".85"
          />
          <path fill="url(#taxi-g-glass)" d={GLASS} />
          <g clipPath="url(#taxi-glass-clip)" opacity=".22" fill="#fff">
            <path d="M17.4 7 L20.6 1 L22 1 L18.8 7 Z" />
            <path d="M24.6 7 L27.4 1.2 L28 1.3 L25.3 7 Z" />
          </g>
          <path stroke="url(#taxi-g-body)" strokeWidth=".6" d="M30.05 6.9 L29.75 3.1" />
          <rect x="21.2" y="1" width="1.25" height="6.1" fill="#f2be00" />
          <path stroke="#f2be00" strokeWidth=".7" d="M16.1 6.9 L16.4 1.9" />
          {/* door shut lines, the waist crease and its highlight, the
              handles and the shade along the sill */}
          <g stroke="#0b0b0a" strokeWidth=".3" fill="none" opacity=".34">
            <path d="M33.2 7.5 L33.25 14.5" />
            <path d="M21.82 7.1 V14.5" />
            <path d="M16.05 7.1 V10.1" />
          </g>
          <path d="M45.2 9.35 L40.75 9.31 M36.25 9.3 C28 9.3 16 9.4 2.3 9.6" fill="none" stroke="#c49600" strokeWidth=".5" />
          <path
            d="M45.2 9.05 L40.9 9.02 M36.1 9.0 C28 9.0 16 9.1 2.5 9.3"
            fill="none"
            stroke="#fff7cf"
            strokeWidth=".22"
            opacity=".9"
          />
          <rect x="23.1" y="7.9" width="1.5" height=".36" rx=".18" fill="url(#taxi-g-chrome)" />
          <rect x="34.1" y="7.9" width="1.5" height=".36" rx=".18" fill="url(#taxi-g-chrome)" />
          <path d="M17 13.4 L34 13.4 L34.2 14.6 L16.7 14.6 Z" fill="#a67f00" opacity=".35" />
          {/* chrome bumpers, the grille edge, the headlamp and the tail lamp */}
          <path
            fill="url(#taxi-g-chrome)"
            d="M44.1 11.25 L47.4 11.25 C48 11.25 48.25 11.75 48.25 12.375 C48.25 13 47.95 13.5 47.4 13.5 L44.1 13.5 Z"
          />
          <path
            fill="url(#taxi-g-chrome)"
            d="M3.9 11.25 L.6 11.25 C0 11.25 -.25 11.75 -.25 12.375 C-.25 13 .05 13.5 .6 13.5 L3.9 13.5 Z"
          />
          <rect x="47" y="9.6" width=".85" height="1.7" fill="#c9c9cf" />
          <circle cx="46.2" cy="8.3" r="1.4" fill="#f6f4ec" stroke="#c9c9cf" strokeWidth=".4" />
          <circle cx="45.9" cy="8" r=".45" fill="#fff" />
          <path fill="#b42f1f" d="M1.25 8.75 C.95 9.1 .75 9.6 .68 10.2 L.7 11.3 L1.75 11.3 L1.75 8.6 Z" />
        </symbol>

        <symbol id={AMB_OUT} viewBox="-0.5 -0.5 49 19" overflow="visible">
          <use href={`#${AMB}`} />
          <path d={BODY} fill="none" stroke="#1d2a6e" strokeWidth=".55" strokeLinejoin="round" />
        </symbol>

        {/* The same car seen from above, nose to the right: the small
            taxi that drives the route (lib/motion.ts driveRoute). Flat
            colour and a navy keyline, no gradients, so it stays crisp at
            24 to 28px and turned to any angle. A printed shadow (an offset
            copy, never a filter) lifts it off the line it rides. */}
        <symbol id={AMB_TOP} viewBox={TOP_VB} overflow="visible">
          <rect x="2.1" y="2.4" width="28" height="12.2" rx="3.8" fill="#0b1030" opacity=".26" />
          {/* the four wheels, just showing past the body */}
          <g fill="#141311">
            <rect x="5.4" y=".55" width="4.2" height="1.6" rx=".6" />
            <rect x="21" y=".55" width="4.2" height="1.6" rx=".6" />
            <rect x="5.4" y="12.85" width="4.2" height="1.6" rx=".6" />
            <rect x="21" y="12.85" width="4.2" height="1.6" rx=".6" />
          </g>
          {/* the body: a long boot, the cabin set back, the rounded nose */}
          <path
            d="M3.6 1.4 H24.6 C27.4 1.4 29.4 3.1 29.6 5.4 V9.6 C29.4 11.9 27.4 13.6 24.6 13.6 H3.6 C2.1 13.6 1 12.5 1 11 V4 C1 2.5 2.1 1.4 3.6 1.4 Z"
            fill="#f6c400"
            stroke="#1d2a6e"
            strokeWidth="1.05"
            strokeLinejoin="round"
          />
          {/* the bonnet's two creases */}
          <path d="M21.6 4.6 H27.6 M21.6 10.4 H27.6" stroke="#c49600" strokeWidth=".5" strokeLinecap="round" />
          {/* windscreen and rear window, the roof between them */}
          <path d="M16.6 2.9 C19 3 20.6 3.5 21.3 4.6 V10.4 C20.6 11.5 19 12 16.6 12.1 Z" fill="#171b2c" />
          <path d="M8.4 3.2 C6.9 3.3 6.1 3.8 5.7 4.8 V10.2 C6.1 11.2 6.9 11.7 8.4 11.8 Z" fill="#171b2c" />
          <path d="M17.6 3.6 L19.6 4.2 M17.6 11.4 L19.6 10.8" stroke="#fff" strokeWidth=".45" opacity=".3" strokeLinecap="round" />
          {/* the roof sign, across the roof */}
          <rect x="11.2" y="5" width="2.8" height="5" rx=".7" fill="#fdf3cf" stroke="#1d2a6e" strokeWidth=".6" />
          {/* headlamps and tail lamps */}
          <circle cx="28.3" cy="3.9" r="1" fill="#fff7d6" stroke="#1d2a6e" strokeWidth=".4" />
          <circle cx="28.3" cy="11.1" r="1" fill="#fff7d6" stroke="#1d2a6e" strokeWidth=".4" />
          <rect x="1.35" y="2.9" width=".9" height="2" rx=".35" fill="#b42f1f" />
          <rect x="1.35" y="10.1" width=".9" height="2" rx=".35" fill="#b42f1f" />
        </symbol>
      </defs>
    </svg>
  );
}
