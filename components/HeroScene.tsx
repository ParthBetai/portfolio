/* ============================================================
   HERO SCENE
   The drawn street of Sheet 01, as static markup in two prints of the
   same plate: "ink" (navy on the cream sheet, with the colour taxi and
   the Victoria Memorial on its yellow disc) and "bp" (the cyanotype
   copy the Exposure reveals as the About sheet slides up). Every piece
   is its own box positioned in
   the hero's 980 x 830 design box (.h-stage, sized by --u in
   styles/s1-hero.css), so nothing here is measured or rebuilt at
   runtime, and the two prints line up exactly.

   Back pieces (behind Parth): the facades, the memorial, the dimension
   line. Front pieces (in front of him): the railing he leans on, the
   robot on the roof rack, the taxi (TaxiDrawing.tsx), the last two
   facing left, the way the taxi drives off. The Exposure keeps them in
   separate layers so the relief canvas can sit between them.

   All of it is decorative except the two dimension labels, which are
   HTML text in the ink print (and aria-hidden in the copy).
   ============================================================ */
import { hero } from "@/lib/content";

export type Tone = "ink" | "bp";

/* The print colours, as the drawing set's tokens. */
const LINE = { ink: "var(--color-ink)", bp: "var(--color-bline)" } as const;

/* ---- the Victoria Memorial, in elevation ---------------------------- */
/* The north front of the white marble memorial on the Maidan, drawn as
   an elevation in a 600 x 620 box whose centre line runs behind Parth's
   head: the great dome on its drum, the lantern and the bronze Angel of
   Victory on her ball, the two front corner chhatris on the central
   block, the arched portico with its paired columns and the sculpture
   group on the attic, the wings and the two end pavilions with their
   cupolas, the plinth and the broad steps. The dome is drawn a little
   wider than the real one so it still reads round his head; he hides
   the rest of the middle, which is why the outer pavilions are kept.

   Three inks: the marble (cream-2), the navy keyline, and the taxi
   yellow as a halftone disc behind the dome and a shade on its right
   flank. The copy prints it as pale line on the blue. Every opaque
   piece covers the faint facades drawing behind it. One path per kind
   of piece keeps it to a few dozen nodes. */
const MX = 300;
const n = (v: number) => +v.toFixed(1);
/** A closed box. */
const box = (x0: number, y0: number, x1: number, y1: number) => `M${n(x0)} ${n(y0)}H${n(x1)}V${n(y1)}H${n(x0)}Z`;
/** A round-headed opening `w` wide, springing at `spring`. */
const arch = (cx: number, w: number, spring: number, foot: number) => {
  const r = w / 2;
  return `M${n(cx - r)} ${foot}V${spring}A${n(r)} ${n(r)} 0 0 1 ${n(cx + r)} ${spring}V${foot}Z`;
};
/** A dome `w` wide on `base`, its crown at `apex`: the memorial's profile,
    full at the haunch and drawn in to the crown. */
const dome = (cx: number, w: number, base: number, apex: number) => {
  const h = w / 2;
  const H = base - apex;
  return (
    `M${n(cx - h)} ${base}C${n(cx - h)} ${n(base - 0.56 * H)} ${n(cx - 0.54 * h)} ${n(apex + 0.04 * H)} ${cx} ${apex}` +
    `C${n(cx + 0.54 * h)} ${n(apex + 0.04 * H)} ${n(cx + h)} ${n(base - 0.56 * H)} ${n(cx + h)} ${base}Z`
  );
};
const ball = (cx: number, cy: number, r: number) => `M${n(cx - r)} ${cy}a${r} ${r} 0 1 0 ${2 * r} 0a${r} ${r} 0 1 0 ${-2 * r} 0Z`;
const each = <T,>(xs: T[], f: (x: T) => string) => xs.map(f).join("");

/* The two end pavilions and their cupolas. */
const PAV = [31, 600 - 31];
/* The front corner chhatris on the central block. */
const CHH = [165, 600 - 165];
/* Window bays: the wings' and the central block's either side of the portico. */
const WING_BAYS = [84, 116, 484, 516];
const BLOCK_BAYS = [172, 208, 392, 428];
const DRUM_BAYS = [204, 236, 268, 300, 332, 364, 396];

const VM = {
  wings: box(60, 410, 540, 572) + box(56, 402, 544, 410),
  pavilions:
    each(PAV, (c) => box(c - 31, 380, c + 31, 572)) +
    box(0, 372, 66, 380) +
    box(534, 372, 600, 380) +
    each(PAV, (c) => box(c - 23, 364, c + 23, 372) + box(c - 17, 344, c + 17, 364) + dome(c, 38, 344, 316)),
  drum: box(180, 262, 420, 388),
  collar: box(168, 250, 432, 262),
  dome: dome(MX, 250, 250, 106),
  /* The right flank in shade: from the crown down the right rib. */
  shade: `M${MX} 106C367.5 111.8 425 168.2 425 250H360C358 182 334 126 306 108Z`,
  lantern: box(287, 88, 313, 106) + dome(MX, 32, 88, 76) + box(296, 71, 304, 76) + ball(MX, 66, 5),
  block: box(140, 392, 460, 572) + box(134, 384, 466, 392),
  chhatris: each(
    CHH,
    (c) =>
      box(c - 26, 376, c + 26, 384) +
      box(c - 20, 338, c + 20, 376) +
      `M${c - 27} 338L${c - 22} 331H${c + 22}L${c + 27} 338Z` +
      dome(c, 40, 331, 297)
  ),
  portico:
    box(236, 350, 364, 572) +
    box(230, 340, 370, 350) +
    box(246, 322, 354, 340) +
    /* The sculpture group on the attic. */
    "M262 322C268 308 282 301 292 300C293 291 307 291 308 300C318 301 332 308 338 322Z",
  columns: each([244, 256, 336, 348], (x) => box(x, 352, x + 8, 572)),
  steps: box(0, 572, 600, 606) + box(228, 572, 372, 584) + box(216, 584, 384, 596) + box(204, 596, 396, 606),
  /* Openings, tinted: every window and arch. */
  openings:
    each(WING_BAYS, (c) => box(c - 8, 420, c + 8, 452) + arch(c, 16, 500, 548)) +
    each(PAV, (c) => box(c - 8, 400, c + 8, 440) + arch(c, 24, 470, 548) + arch(c, 10, 354, 364)) +
    each(BLOCK_BAYS, (c) => box(c - 9, 404, c + 9, 444) + arch(c, 20, 500, 552)) +
    each(DRUM_BAYS, (c) => arch(c, 14, 284, 318)) +
    arch(294, 6, 96, 104) +
    arch(306, 6, 96, 104) +
    each(CHH, (c) => arch(c, 18, 356, 376)) +
    arch(MX, 48, 452, 572) +
    arch(MX, 22, 398, 428),
  /* Fine lines, each drawn just after the piece it is cut into: the
     drum's terrace, the dome's ribs, the string courses, the finials. */
  terrace: "M180 336H420",
  ribs: "M240 250C242 182 266 126 294 108M360 250C358 182 334 126 306 108",
  courses: "M62 470H140M460 470H538M140 470H236M364 470H460",
  detail:
    each(PAV, (c) => `M${c} 316V306`) +
    each(CHH, (c) => `M${c} 297V286`),
  finials: each(PAV, (c) => ball(c, 304, 2.2)) + each(CHH, (c) => ball(c, 284, 2.5)),
  /* The Angel of Victory: robe, head, wings, and the bugle raised. */
  angel:
    "M295.5 61L304.5 61L302.4 44L297.6 44Z" +
    ball(MX, 40.5, 3) +
    "M298 46C290 42 284 34 281 24C288 29 294 36 299.5 43Z" +
    "M302 46C310 42 316 34 319 24C312 29 306 36 300.5 43Z" +
    "M313.5 26L319.5 31L318.8 24Z",
  bugle: "M302 45L309 36L315 28.5",
};

export function Memorial({ tone }: { tone: Tone }) {
  const bp = tone === "bp";
  /* Pattern ids per print: both prints are on the page at once. */
  const dots = `hero-vm-dots-${tone}`;
  const fine = `hero-vm-fine-${tone}`;
  const key = bp ? "var(--color-bline)" : "var(--color-night-deep)";
  const marble: React.CSSProperties = { fill: bp ? "var(--color-blue)" : "var(--color-cream-2)", stroke: key };
  const open: React.CSSProperties = { fill: key, fillOpacity: bp ? 0.22 : 0.16, stroke: key };
  const solid: React.CSSProperties = { fill: key, stroke: "none" };
  const line: React.CSSProperties = { fill: "none", stroke: key };
  return (
    <svg className="h-vm" viewBox="0 0 600 620" aria-hidden="true" focusable="false">
      <defs>
        <pattern id={dots} width="10" height="10" patternUnits="userSpaceOnUse" patternTransform="rotate(18)">
          <circle cx="5" cy="5" r={bp ? 1.4 : 2.35} style={{ fill: bp ? "var(--color-bline)" : "var(--color-acid)" }} />
        </pattern>
        <pattern id={fine} width="7" height="7" patternUnits="userSpaceOnUse" patternTransform="rotate(18)">
          <circle cx="3.5" cy="3.5" r="1.25" style={{ fill: bp ? "var(--color-bline)" : "#e8b800" }} />
        </pattern>
      </defs>
      {/* The warm disc behind the dome, on a base in the ground colour. */}
      <circle cx={MX} cy="232" r="192" style={{ fill: bp ? "var(--color-blue)" : "var(--color-cream)" }} />
      <circle cx={MX} cy="232" r="192" fill={`url(#${dots})`} opacity={bp ? 0.3 : 0.85} />
      <g strokeLinejoin="round" strokeLinecap="round">
        <path className="k" d={VM.wings} style={marble} />
        <path className="k" d={VM.pavilions} style={marble} />
        <path className="k" d={VM.drum} style={marble} />
        <path className="d" d={VM.terrace} style={line} />
        <path className="k" d={VM.collar} style={marble} />
        <path className="k" d={VM.dome} style={marble} />
        <path d={VM.shade} fill={`url(#${fine})`} opacity={bp ? 0.3 : 0.75} />
        <path className="d" d={VM.ribs} style={line} />
        <path className="k" d={VM.lantern} style={marble} />
        <path className="k" d={VM.block} style={marble} />
        <path className="k" d={VM.chhatris} style={marble} />
        <path className="k" d={VM.portico} style={marble} />
        <path className="k" d={VM.columns} style={marble} />
        <path className="k" d={VM.steps} style={marble} />
        <path className="d" d={VM.courses} style={line} />
        <path className="d" d={VM.openings} style={open} />
        <path className="d" d={VM.detail} style={line} />
        <path d={VM.finials} style={solid} />
        <path d={VM.angel} style={solid} />
        <path className="vm-bugle" d={VM.bugle} style={line} />
      </g>
    </svg>
  );
}

/* ---- North Kolkata facades: a self-hosted drawing at 10% ------------ */
export function Facades({ tone }: { tone: Tone }) {
  return (
    /* eslint-disable-next-line @next/next/no-img-element */
    <img className="h-facades" src={`/art/facades-${tone}.svg`} alt="" aria-hidden="true" draggable={false} />
  );
}

/* ---- the Strand Road railing he leans on ---------------------------- */
/* Its top rail is at his forearms. xMinYMax slice keeps the rail heights
   while the run is cut to whatever width the box has. In the copy it is
   drawn in outline, filled solid in the ground so it covers the ink one
   beneath it exactly. */
const RAIL_W = 640;
const BALUSTERS = Array.from({ length: Math.ceil((RAIL_W - 12) / 13) }, (_, i) => 12 + i * 13);
const PILLARS = Array.from({ length: Math.ceil((RAIL_W - 30) / 104) }, (_, i) => 30 + i * 104);
const JOINTS = Array.from({ length: Math.ceil((RAIL_W - 40) / 120) }, (_, i) => 40 + i * 120);

export function Railing({ tone }: { tone: Tone }) {
  const bp = tone === "bp";
  const N = LINE[tone];
  const body: React.CSSProperties = bp
    ? { fill: "var(--color-blue)", stroke: N, strokeWidth: 1.3 }
    : { fill: N, strokeWidth: 0 };
  return (
    <svg className="h-railing" viewBox={`0 -7 ${RAIL_W} 125`} preserveAspectRatio="xMinYMax slice" aria-hidden="true" focusable="false">
      <g style={body}>
        {/* The plinth and its joints. The copy's plinth is a solid tint of
            the blue (6% of the line colour), not a translucent one, so the
            stone plinth of the ink print never shows through. */}
        <rect x="0" y="92" width={RAIL_W} height="26" style={{ fill: bp ? "#264584" : "#e2d8c3", stroke: N, strokeWidth: 2 }} />
        {JOINTS.map((x) => (
          <path key={`j${x}`} d={`M${x} 96 V114`} style={{ stroke: N, strokeOpacity: 0.35, strokeWidth: 1 }} />
        ))}
        <rect x="0" y="8" width={RAIL_W} height="8" rx="3" />
        <rect x="0" y="80" width={RAIL_W} height="6" />
        {BALUSTERS.map((x) => (
          <g key={`b${x}`}>
            <rect x={x} y="15" width="2.4" height="66" />
            {x % 26 === 12 && <circle cx={x + 1.2} cy="48" r="4.6" style={{ fill: "none", stroke: N, strokeWidth: 1.5 }} />}
          </g>
        ))}
        {PILLARS.map((x) => (
          <g key={`p${x}`}>
            <rect x={x - 6} y="2" width="14" height="90" rx="2" />
            <circle cx={x + 1} cy="0" r="6" />
            <rect x={x - 8} y="40" width="18" height="5" rx="1" />
          </g>
        ))}
      </g>
    </svg>
  );
}

/* ---- the mini humanoid on the roof rack, waving --------------------- */
/* The robot that won at IIT Hyderabad (work.projects), drawn small, riding
   the rack of the taxi (styles/s1-hero.css puts it over the rack). */
export function Robot({ tone }: { tone: Tone }) {
  const bp = tone === "bp";
  const line = LINE[tone];
  const g: React.CSSProperties = {
    fill: bp ? "var(--color-blue)" : "#dfe6f2",
    stroke: line,
    strokeWidth: bp ? 1.3 : 1.5,
    strokeLinejoin: "round",
  };
  const solid: React.CSSProperties = { fill: line, stroke: "none" };
  return (
    <svg className="h-bot" viewBox="0 0 60 100" aria-hidden="true" focusable="false">
      <g style={g}>
        <rect x="17" y="2" width="26" height="17" rx="3" />
        <circle cx="24.5" cy="10.5" r="4.2" style={{ fill: "none" }} />
        <circle cx="35.5" cy="10.5" r="4.2" style={{ fill: "none" }} />
        <circle cx="24.5" cy="10.5" r="1.6" style={solid} />
        <circle cx="35.5" cy="10.5" r="1.6" style={solid} />
        <rect x="25" y="19" width="10" height="5" />
        <rect x="13" y="24" width="34" height="30" rx="2" />
        <rect x="19" y="30" width="12" height="9" style={{ fill: "none" }} />
        <g style={solid}>
          {[0, 1, 2, 3, 4].map((i) => (
            <circle key={i} cx={20 + i * 5} cy="46" r="1" />
          ))}
        </g>
        <rect x="3" y="24" width="10" height="12" rx="1.5" />
        <rect x="47" y="24" width="10" height="12" rx="1.5" />
        <rect x="4.5" y="37" width="7" height="15" rx="1.5" />
        <rect x="4" y="53" width="8" height="6" rx="2" />
        <rect x="48.5" y="8" width="7" height="15" rx="1.5" />
        <rect x="48" y="1" width="8" height="6" rx="2" />
        <rect x="15" y="54" width="30" height="6" rx="1" />
        <rect x="17" y="60" width="10" height="15" rx="1.5" />
        <rect x="33" y="60" width="10" height="15" rx="1.5" />
        <circle cx="22" cy="77" r="2.6" />
        <circle cx="38" cy="77" r="2.6" />
        <rect x="17" y="80" width="10" height="13" rx="1.5" />
        <rect x="33" y="80" width="10" height="13" rx="1.5" />
        <rect x="12" y="93" width="16" height="6" rx="1.5" />
        <rect x="32" y="93" width="16" height="6" rx="1.5" />
      </g>
    </svg>
  );
}

/* ---- the dimension line under the taxi ------------------------------ */
/* From Kolkata (home) to Jaipur (where he studies): a drafting dimension
   with arrowheads and end ticks, the two places in Kalam below it. The
   line is stretched to its box; the strokes stay 1px. */
export function Dimension({ tone }: { tone: Tone }) {
  const [from, to] = hero.dimension;
  return (
    <>
      <svg className="h-dim" viewBox="0 0 700 20" preserveAspectRatio="none" aria-hidden="true" focusable="false">
        <g style={{ stroke: LINE[tone] }} strokeWidth="1" fill="none">
          <path d="M1 0 V20 M699 0 V20 M1 10 H699" vectorEffect="non-scaling-stroke" />
          <path d="M9 6 L1 10 L9 14 M691 6 L699 10 L691 14" vectorEffect="non-scaling-stroke" />
        </g>
      </svg>
      <div className="h-dimlab" aria-hidden={tone === "bp" || undefined}>
        <span className="hand">{from}</span>
        <span className="hand">{to}</span>
      </div>
    </>
  );
}

/* The kerb the taxi stands on, ruled across the whole sheet. */
export function Kerb() {
  return <div className="h-kerb" aria-hidden="true" />;
}
