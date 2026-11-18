import { Bal, C, Lead, f1 } from "./kit";

/* ============================================================
   WORK 03: THE OBSTACLE-AVOIDING CAR, IN PLAN
   The car seen from above, nose to the right, with the ultrasonic
   sensor's yellow cone ahead and the two dashed cones it checks to
   either side before it turns (the dotted arc with arrows is the
   sensor's sweep on its servo). A hatched wall ahead is the obstacle.
   Balloons: 1 the Arduino, 2 the sensor on its servo, 3 the motor
   driver board, 4 the battery pack, 5 the geared motors.
   ============================================================ */
const N = C.ink;
const SX = 418;
const SY = 230;

/* A cone from the sensor: centred on `deg`, 26 degrees wide, `len` long. */
function cone(deg: number, len: number) {
  const r = (d: number) => (d * Math.PI) / 180;
  const a1 = r(deg - 13);
  const a2 = r(deg + 13);
  return `M${SX} ${SY} L${f1(SX + len * Math.cos(a1))} ${f1(SY + len * Math.sin(a1))} A${len} ${len} 0 0 1 ${f1(SX + len * Math.cos(a2))} ${f1(SY + len * Math.sin(a2))} Z`;
}

const WHEELS: [number, number][] = [
  [150, 112],
  [330, 112],
  [150, 316],
  [330, 316],
];
const MOTORS: [number, number][] = [
  [150, 150],
  [330, 150],
  [150, 286],
  [330, 286],
];

export default function CarPlan() {
  return (
    <svg className="dw dw-wide" viewBox="0 30 660 420" aria-hidden="true" focusable="false">
      <defs>
        <marker id="wk-ah-c" viewBox="0 0 10 10" refX={8} refY={5} markerWidth={7} markerHeight={7} orient="auto-start-reverse">
          <path d="M0 1 L9 5 L0 9" fill="none" stroke={N} strokeWidth={1.6} />
        </marker>
      </defs>
      <g stroke={N} strokeWidth={1.6} strokeLinejoin="round">
        <path d={cone(0, 170)} fill="rgba(246,196,0,.5)" />
        <path d={cone(-62, 130)} fill="none" strokeDasharray="6 5" />
        <path d={cone(62, 130)} fill="none" strokeDasharray="6 5" />
        <path
          d={`M${SX + 96} ${SY - 112} A150 150 0 0 1 ${SX + 96} ${SY + 112}`}
          fill="none"
          strokeDasharray="2 5"
          markerStart="url(#wk-ah-c)"
          markerEnd="url(#wk-ah-c)"
          opacity={0.7}
        />
        {/* the obstacle */}
        <rect x={600} y={190} width={26} height={80} fill="none" />
        <path d="M600 200 L626 190 M600 214 L626 204 M600 228 L626 218 M600 242 L626 232 M600 256 L626 246 M600 270 L626 260" strokeWidth={1} opacity={0.55} />
        {/* wheels, hubs and the geared motors behind them */}
        <g fill={C.tyre}>
          {WHEELS.map(([x, y]) => (
            <rect key={`w${x}${y}`} x={x - 34} y={y} width={68} height={32} rx={7} />
          ))}
        </g>
        <g fill={C.taxi}>
          {WHEELS.map(([x, y]) => (
            <rect key={`h${x}${y}`} x={x - 14} y={y + 8} width={28} height={16} rx={3} />
          ))}
        </g>
        <g fill={C.taxi}>
          {MOTORS.map(([x, y]) => (
            <rect key={`m${x}${y}`} x={x - 22} y={y - 6} width={44} height={14} rx={2} />
          ))}
        </g>
        {/* chassis, the Arduino and its board, the battery pack */}
        <rect x={96} y={146} width={300} height={168} rx={14} fill="#e3e8ee" fillOpacity={0.8} />
        <rect x={180} y={176} width={120} height={84} rx={4} fill={C.glass} />
        <rect x={196} y={190} width={72} height={44} rx={3} fill="#f6f6f2" />
        <path d="M196 248 H288" strokeDasharray="2 3" />
        <rect x={110} y={270} width={150} height={20} rx={10} fill="#cfd8e6" />
        <rect x={110} y={250} width={150} height={20} rx={10} fill="#cfd8e6" opacity={0.9} />
        <rect x={372} y={208} width={28} height={44} rx={3} fill={C.glass} />
        {/* the servo and the sensor's two transducers */}
        <circle cx={SX - 8} cy={SY} r={7} fill="#f6f6f2" />
        <rect x={SX - 2} y={SY - 34} width={14} height={68} rx={2} fill={C.glass} />
        <circle cx={SX + 12} cy={SY - 17} r={9} fill="#f6f6f2" />
        <circle cx={SX + 12} cy={SY + 17} r={9} fill="#f6f6f2" />
      </g>
      <Lead x1={232} y1={200} x2={232} y2={64} />
      <Bal n={1} x={232} y={50} />
      <Lead x1={SX + 6} y1={SY - 30} x2={SX + 6} y2={64} />
      <Bal n={2} x={SX + 6} y={50} />
      <Lead x1={380} y1={246} x2={380} y2={410} />
      <Bal n={3} x={380} y={424} />
      <Lead x1={150} y1={340} x2={150} y2={410} />
      <Bal n={4} x={150} y={424} />
      <Lead x1={250} y1={280} x2={266} y2={410} />
      <Bal n={5} x={266} y={424} />
    </svg>
  );
}
