import { Bal, C, Lead } from "./kit";

/* ============================================================
   WORK 04: THE EV TRACK, IN SECTION
   The model's track cut through: the transmitter coil set into it, the
   car above with its receiver, the field lines between them, the sensor
   at the entry, the solar panel and the sun, the three 18650 cells in
   their holder and the relay, wired in the order the body describes.
   Balloons: 1 solar panel, 2 cells, 3 sensor, 4 relay, 5 coil.
   ============================================================ */
const N = C.ink;
const F = C.fill;

const HATCH = (() => {
  let d = "";
  for (let x = 20; x < 640; x += 12) d += `M${x} 340 l12 -12 `;
  return d;
})();

export default function EvTrack() {
  return (
    <svg className="dw dw-wide" viewBox="0 0 660 420" aria-hidden="true" focusable="false">
      {/* the track in section */}
      <path d="M20 300 H640" stroke={N} strokeWidth={2.2} />
      <rect x={20} y={300} width={620} height={40} fill={N} fillOpacity={0.06} stroke={N} strokeWidth={1.4} />
      <path d={HATCH} stroke={N} strokeWidth={0.8} opacity={0.35} />
      {/* the transmitter coil set into the track */}
      <g transform="translate(400 312)">
        <rect x={-70} y={-6} width={140} height={22} rx={4} fill={F} stroke={N} strokeWidth={1.6} />
        {[-54, -38, -22, -6, 10, 26, 42].map((x) => (
          <ellipse key={x} cx={x + 6} cy={5} rx={5} ry={8} fill="none" stroke={N} strokeWidth={1.4} />
        ))}
      </g>
      {/* field lines up to the car */}
      <g fill="none" stroke={N} strokeWidth={1.2} strokeDasharray="3 4" opacity={0.7}>
        <path d="M352 300 C352 278 448 278 448 300" />
        <path d="M366 300 C366 286 434 286 434 300" />
      </g>
      {/* the car on the track, its receiver underneath */}
      <g transform="translate(330 222)">
        <path
          d="M6 56 L10 38 C14 30 22 28 34 28 L50 10 L96 10 L116 28 C130 28 140 33 140 44 L140 56 Z"
          fill={C.taxi}
          stroke={N}
          strokeWidth={1.8}
          strokeLinejoin="round"
        />
        <path d="M54 14 L46 28 H72 V14 Z M78 14 V28 H108 L94 14 Z" fill={C.glass} stroke={N} strokeWidth={1.3} />
        <rect x={50} y={56} width={46} height={8} rx={2} fill={F} stroke={N} strokeWidth={1.3} />
        <circle cx={34} cy={64} r={13} fill={C.tyre} />
        <circle cx={34} cy={64} r={5} fill={C.chrome} />
        <circle cx={112} cy={64} r={13} fill={C.tyre} />
        <circle cx={112} cy={64} r={5} fill={C.chrome} />
      </g>
      {/* the sensor at the track entry */}
      <g transform="translate(250 270)">
        <rect x={-10} y={0} width={20} height={30} rx={3} fill={F} stroke={N} strokeWidth={1.6} />
        <circle cx={-3} cy={9} r={3.2} fill="none" stroke={N} strokeWidth={1.3} />
        <circle cx={3.6} cy={9} r={3.2} fill="none" stroke={N} strokeWidth={1.3} />
        <path d="M12 8 L58 -4 M12 12 L58 14" stroke={N} strokeWidth={1} strokeDasharray="3 3" opacity={0.7} />
      </g>
      {/* the sun */}
      <g transform="translate(40 60)">
        <circle cx={18} cy={6} r={12} fill="none" stroke={N} strokeWidth={1.6} />
        <path
          d="M18 -14 V-10 M18 22 V26 M-2 6 H2 M34 6 H38 M4 -8 L7 -5 M29 17 L32 20 M4 20 L7 17 M29 -5 L32 -8"
          stroke={N}
          strokeWidth={1.4}
          strokeLinecap="round"
        />
      </g>
      {/* the solar panel on its stand */}
      <g transform="translate(50 110)">
        <path d="M0 46 L56 0 L132 18 L76 64 Z" fill={F} stroke={N} strokeWidth={1.8} />
        <path d="M19 30.7 L94 49 M38 15.3 L113 33.5 M25 25 L101 43 M28 41 L84 -5 M56 46 L111 1 M42 55 L98 9" stroke={N} strokeWidth={1} opacity={0.6} />
        <path d="M66 58 V190 M50 190 H82" stroke={N} strokeWidth={2} />
      </g>
      {/* three 18650 cells in their holder */}
      <g transform="translate(170 196)">
        <rect x={0} y={0} width={128} height={62} rx={5} fill={F} stroke={N} strokeWidth={1.8} />
        {[0, 1, 2].map((i) => (
          <g key={i}>
            <rect x={10 + i * 38} y={9} width={32} height={44} rx={6} fill="#dfe6f0" stroke={N} strokeWidth={1.4} />
            <rect x={20 + i * 38} y={5} width={12} height={5} rx={1.5} fill={N} />
            <path d={`M${18 + i * 38} 24 H${34 + i * 38}`} stroke={N} strokeWidth={1} opacity={0.5} />
          </g>
        ))}
      </g>
      {/* the relay module */}
      <g transform="translate(470 196)">
        <rect x={0} y={0} width={92} height={56} rx={4} fill={F} stroke={N} strokeWidth={1.8} />
        <rect x={14} y={12} width={40} height={32} rx={2} fill={C.glass} stroke={N} strokeWidth={1.3} />
        <circle cx={72} cy={20} r={5} fill={C.taxi} stroke={N} strokeWidth={1.2} />
        <path d="M64 38 h18 M64 44 h18" stroke={N} strokeWidth={1.6} />
      </g>
      {/* wires: panel to cells, cells to relay, sensor to relay, relay to coil */}
      <g fill="none" stroke={N} strokeWidth={1.6} strokeLinecap="round">
        <path d="M150 150 C190 150 200 170 210 196" />
        <path d="M298 214 H470" />
        <path d="M262 270 C262 252 300 246 330 246 H440 C460 246 470 244 470 240" />
        <path d="M516 252 C516 290 470 300 470 312" />
      </g>
      <g fill={N}>
        <circle cx={210} cy={196} r={3} />
        <circle cx={470} cy={214} r={3} />
        <circle cx={470} cy={312} r={3} />
      </g>
      <Lead x1={120} y1={120} x2={120} y2={36} />
      <Bal n={1} x={136} y={28} />
      <Lead x1={234} y1={196} x2={234} y2={150} />
      <Bal n={2} x={234} y={136} />
      <Lead x1={244} y1={296} x2={196} y2={384} />
      <Bal n={3} x={180} y={392} />
      <Lead x1={530} y1={196} x2={560} y2={140} />
      <Bal n={4} x={572} y={128} />
      <Lead x1={436} y1={328} x2={476} y2={392} />
      <Bal n={5} x={490} y={400} />
    </svg>
  );
}
