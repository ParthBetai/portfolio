import { Bal, C, Lead } from "./kit";

/* ============================================================
   WORK 02: THE MINI HUMANOID, EXPLODED
   The robot pulled apart along its centre line: head, the body with
   the Arduino in it, the servo driver board beside it, and the servos
   at each joint, each on a dashed line back to where it fits. Bottom
   right, four small silhouettes of the robot itself in the poses its
   sequences ease between. Balloons: 1 servos, 2 the PWM servo driver
   board, 3 the Arduino, 4 the sequences.
   ============================================================ */
const N = C.ink;
const F = C.fill;

function Servo({ x, y, r = 0 }: { x: number; y: number; r?: number }) {
  return (
    <g transform={`translate(${x} ${y}) rotate(${r})`}>
      <rect x={-16} y={-10} width={32} height={20} rx={2} fill={F} stroke={N} strokeWidth={1.8} />
      <rect x={-20} y={-3} width={40} height={6} rx={1} fill="none" stroke={N} strokeWidth={1.2} />
      <circle cx={8} cy={0} r={4.6} fill={F} stroke={N} strokeWidth={1.6} />
    </g>
  );
}

const Dash = ({ x1, y1, x2, y2 }: { x1: number; y1: number; x2: number; y2: number }) => (
  <path d={`M${x1} ${y1} L${x2} ${y2}`} stroke={N} strokeWidth={1} strokeDasharray="4 4" opacity={0.7} />
);

/* One pose: head, body, two arms (la, ra: their swing in degrees) and two
   legs (kick: the right leg's swing). */
function Pose({ x, la, ra, kick }: { x: number; la: number; ra: number; kick: number }) {
  const st = { fill: F, stroke: N, strokeWidth: 1.3, strokeLinejoin: "round" as const };
  return (
    <g transform={`translate(${x} 0)`}>
      <rect x={-7} y={-40} width={14} height={10} rx={2} {...st} />
      <rect x={-9} y={-29} width={18} height={17} rx={2} {...st} />
      <rect x={-3} y={-29} width={4} height={13} rx={1.5} transform={`rotate(${la} -9 -27) translate(-10 0)`} {...st} />
      <rect x={-1} y={-29} width={4} height={13} rx={1.5} transform={`rotate(${ra} 9 -27) translate(8 0)`} {...st} />
      <rect x={-7} y={-12} width={5} height={14} rx={1.5} {...st} />
      <rect x={2} y={-12} width={5} height={14} rx={1.5} transform={`rotate(${kick} 4.5 -12)`} {...st} />
    </g>
  );
}

const POSES = [
  { la: 10, ra: -10, kick: 0 },
  { la: 10, ra: -150, kick: 0 },
  { la: 150, ra: -150, kick: 0 },
  { la: 150, ra: -10, kick: -40 },
];

export default function HumanoidExploded() {
  return (
    <svg className="dw" viewBox="84 0 530 350" aria-hidden="true" focusable="false">
      {/* the centre line */}
      <path d="M200 0 V350" stroke={N} strokeWidth={0.8} strokeDasharray="12 4 2 4" opacity={0.5} fill="none" />
      <g transform="translate(80 0)">
        {/* head */}
        <rect x={92} y={10} width={56} height={44} rx={10} fill={F} stroke={N} strokeWidth={2} />
        <circle cx={110} cy={32} r={5} fill="none" stroke={N} strokeWidth={1.8} />
        <circle cx={130} cy={32} r={5} fill="none" stroke={N} strokeWidth={1.8} />
        <Dash x1={120} y1={54} x2={120} y2={86} />
        {/* body and the Arduino inside it */}
        <rect x={76} y={86} width={88} height={96} rx={8} fill={F} stroke={N} strokeWidth={2.2} />
        <rect x={90} y={102} width={60} height={40} rx={3} fill={N} fillOpacity={0.1} stroke={N} strokeWidth={1.5} />
        {Array.from({ length: 8 }, (_, i) => (
          <rect key={i} x={93 + i * 7} y={105} width={3.5} height={3.5} fill={N} />
        ))}
        {/* the servo driver board */}
        <rect x={196} y={114} width={76} height={40} rx={3} fill={F} stroke={N} strokeWidth={1.8} />
        {Array.from({ length: 8 }, (_, i) => (
          <path key={i} d={`M${204 + i * 8.5} 142 v8`} stroke={N} strokeWidth={2.4} />
        ))}
        <Dash x1={164} y1={134} x2={196} y2={134} />
        {/* shoulders and arms */}
        <Servo x={42} y={98} />
        <Dash x1={58} y1={98} x2={76} y2={102} />
        <Servo x={198} y={74} />
        <Dash x1={182} y1={80} x2={164} y2={96} />
        <Servo x={28} y={152} r={90} />
        <Dash x1={30} y1={134} x2={40} y2={114} />
        <Servo x={214} y={196} r={90} />
        {/* hips, knees, feet */}
        <Servo x={96} y={216} r={90} />
        <Servo x={144} y={216} r={90} />
        <Dash x1={96} y1={198} x2={96} y2={182} />
        <Dash x1={144} y1={198} x2={144} y2={182} />
        <Servo x={92} y={276} r={90} />
        <Servo x={148} y={276} r={90} />
        <Dash x1={94} y1={258} x2={96} y2={232} />
        <Dash x1={146} y1={258} x2={144} y2={232} />
        <path d="M70 306 h50 M126 306 h50" stroke={N} strokeWidth={3} strokeLinecap="round" />
      </g>
      {/* the poses, eased one into the next */}
      <g transform="translate(424 290)">
        {POSES.map((p, i) => (
          <g key={i}>
            <Pose x={i * 48} {...p} />
            {i < 3 && <path d={`M${i * 48 + 16} -18 h16`} stroke={N} strokeWidth={1.2} strokeDasharray="3 3" />}
          </g>
        ))}
      </g>
      <Lead x1={296} y1={80} x2={380} y2={60} />
      <Bal n={1} x={396} y={60} />
      <Lead x1={352} y1={134} x2={420} y2={134} />
      <Bal n={2} x={436} y={134} />
      <Lead x1={238} y1={124} x2={364} y2={196} />
      <Bal n={3} x={380} y={196} />
      {/* clear of 3 even at the phone size (r 27) */}
      <Bal n={4} x={452} y={220} />
    </svg>
  );
}
