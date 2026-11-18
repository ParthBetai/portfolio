import { Bal, C } from "./kit";

/* ============================================================
   WORK 01: THE SOS RELAY
   A hop diagram of the offline SOS app. The yellow phone (no signal
   bars) sends; each phone after it picks the SOS up and passes it on
   (dashed hops, balloons 1 to 3). The red dotted loop back with a cross
   is the ID that stops an SOS being relayed forever. The words for all
   of it are HTML in the plate (the legend, the red note and the payload
   card).
   ============================================================ */

const P: [number, number][] = [
  [96, 300],
  [262, 178],
  [424, 292],
  [584, 172],
];

const arc = ([x1, y1]: [number, number], [x2, y2]: [number, number], bend: number) =>
  `M${x1} ${y1} Q${(x1 + x2) / 2} ${(y1 + y2) / 2 + bend} ${x2} ${y2}`;

function Phone({ x, y, sos = false }: { x: number; y: number; sos?: boolean }) {
  const L = C.ink;
  return (
    <g transform={`translate(${x} ${y})`}>
      <rect x={-26} y={-46} width={52} height={92} rx={10} fill={sos ? C.taxi : C.paper} stroke={L} strokeWidth={1.8} />
      <rect x={-19} y={-37} width={38} height={68} rx={4} fill={sos ? "#fff6c9" : "#f7f7f1"} stroke={L} strokeWidth={1.1} />
      <rect x={-7} y={-42} width={14} height={3} rx={1.5} fill={L} />
      {sos ? (
        <>
          <text className="dw-type" x={0} y={3} textAnchor="middle" fontSize={14} fontWeight={800} fill={L}>
            SOS
          </text>
          {/* no bars: the signal icon, struck through */}
          <g transform="translate(20 -60)" stroke={L} strokeWidth={1.5} fill="none">
            <path d="M0 8 V10 M4 5 V10 M8 2 V10 M12 -1 V10" strokeLinecap="round" />
            <path d="M-3 -3 L15 13" stroke={C.brick} strokeWidth={2.2} strokeLinecap="round" />
          </g>
        </>
      ) : (
        <path d="M-10 -14 H10 M-10 -5 H6 M-10 4 H8" stroke={L} strokeWidth={1.1} opacity={0.6} />
      )}
    </g>
  );
}

export default function SosRelay() {
  const L = C.ink;
  return (
    <svg className="dw dw-wide dw-sos" viewBox="0 -46 680 566" aria-hidden="true" focusable="false">
      <defs>
        <marker id="wk-ah-s" viewBox="0 0 10 10" refX={8} refY={5} markerWidth={7} markerHeight={7} orient="auto-start-reverse">
          <path d="M0 1 L9 5 L0 9" fill="none" stroke={L} strokeWidth={1.6} />
        </marker>
        <marker id="wk-ah-r" viewBox="0 0 10 10" refX={8} refY={5} markerWidth={7} markerHeight={7} orient="auto-start-reverse">
          <path d="M0 1 L9 5 L0 9" fill="none" stroke={C.brick} strokeWidth={1.6} />
        </marker>
      </defs>
      {/* the first phone's broadcast */}
      <g fill="none" stroke={L} strokeWidth={1.3} opacity={0.45}>
        <path d="M52 258 A60 60 0 0 1 140 258 M36 240 A82 82 0 0 1 156 240 M20 222 A104 104 0 0 1 172 222" />
      </g>
      {/* the hops */}
      <g fill="none" stroke={L} strokeWidth={1.7} strokeDasharray="7 6" markerEnd="url(#wk-ah-s)">
        <path d={arc([130, 270], [230, 200], -36)} />
        <path d={arc([294, 206], [394, 270], -38)} />
        <path d={arc([456, 270], [554, 200], -36)} />
      </g>
      {/* the relay back that the ID stops */}
      <path d="M578 120 C530 40 334 40 276 118" fill="none" stroke={C.brick} strokeWidth={1.8} strokeDasharray="3 5" markerEnd="url(#wk-ah-r)" />
      <g transform="translate(427 66)" stroke={C.brick} strokeWidth={2.6} strokeLinecap="round">
        <path d="M-10 -10 L10 10 M10 -10 L-10 10" />
      </g>
      <Phone x={P[0][0]} y={P[0][1]} sos />
      <Phone x={P[1][0]} y={P[1][1]} />
      <Phone x={P[2][0]} y={P[2][1]} />
      <Phone x={P[3][0]} y={P[3][1]} />
      {[1, 2, 3].map((i) => (
        <Bal key={i} n={i} x={P[i][0] + 34} y={P[i][1] - 50} />
      ))}
    </svg>
  );
}
