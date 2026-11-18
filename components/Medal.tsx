import { C } from "./drawings/kit";

/* ============================================================
   MEDAL
   The small first-place medal in front of the humanoid's badge
   ("1st place in Robotics · IIT Hyderabad"): a yellow disc with a
   dotted brick ring and "1st", on a brick and navy ribbon, keylined in
   night navy like every painted piece. Decorative: the badge beside it
   says the same in HTML.
   ============================================================ */
export default function Medal() {
  return (
    <svg className="medal" viewBox="0 0 44 56" aria-hidden="true" focusable="false">
      <path d="M12 30 L6 54 L14 49 L19 55 L22 34Z" fill={C.brick} />
      <path d="M32 30 L38 54 L30 49 L25 55 L22 34Z" fill={C.ink} />
      <circle cx={22} cy={20} r={18} fill={C.taxi} stroke="#0e1332" strokeWidth={2} />
      <circle cx={22} cy={20} r={13} fill="none" stroke={C.brick} strokeWidth={1.4} strokeDasharray="2 2" />
      <text className="medal-type" x={22} y={25} textAnchor="middle" fontSize={13} fill="#0e1332">
        1st
      </text>
    </svg>
  );
}
