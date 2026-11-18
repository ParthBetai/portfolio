/* ============================================================
   NIGHT STREET
   Where the route ends: a Kolkata street at night under the footer's
   hanging sign. The kerb and the paving, the dark road with its dashed
   centre line, and a cast-iron lamp post (fluted base, two collars, a
   scroll bracket) whose yellow lantern throws a faint cone and a crisp
   pool of light on the pavement where the taxi parks. The taxi itself is
   not in here: it is its own box (Footer.tsx), so it can drive in.

   One drawing, 1440 x 380 units, in two crops: the whole width for
   tablets and desktops, and its right-hand end (from x 840, 600 wide)
   for phones, where the lamp and the parked taxi are all that fit.
   Static server markup with a fixed node count and no filters; the
   positions in styles/s6-contact.css (kerb, terminus, taxi) are worked
   out from the same units.
   ============================================================ */
import { C } from "./drawings/kit";

/* The drawing set's palette (kit.ts); P and P2 are the cast iron and its lit edges. */
const { nline: NLINE, taxi: TAXI, key: KEY, iron: P, iron2: P2 } = C;

/* The kerb's y, the post's x, and the lantern hanging off the bracket. */
const K = 300;
const LX = 1250;
const LAN_X = LX - 112;
const LAN_Y = 44;

function street(): string {
  let d = "";
  /* the cone, from the lantern's foot down to the pool */
  d += `<path d="M${LAN_X - 15} ${LAN_Y + 42} L${LAN_X - 150} ${K + 2} H${LAN_X + 170} L${LAN_X + 15} ${LAN_Y + 42} Z" fill="${NLINE}" opacity=".07"/>`;
  d += `<path d="M${LAN_X - 15} ${LAN_Y + 42} H${LAN_X + 15}" stroke="${TAXI}" stroke-width="2"/>`;
  /* the road */
  d += `<rect x="0" y="${K}" width="1440" height="80" fill="#0a0e26"/>`;
  /* the paving: slanted joints and the back edge */
  let pv = "";
  for (let x = 0; x < 1440; x += 60) pv += `M${x} ${K - 40} l20 40 `;
  d += `<path d="${pv}" stroke="${NLINE}" stroke-opacity=".06" stroke-width="1.4"/>`;
  d += `<path d="M0 ${K - 40} H1440" stroke="${NLINE}" stroke-opacity=".1" stroke-width="1.4"/>`;
  /* the pool of light, three hard steps rather than a blur */
  d += `<ellipse cx="${LAN_X + 10}" cy="${K - 14}" rx="200" ry="18" fill="#2a3168"/>`;
  d += `<ellipse cx="${LAN_X + 10}" cy="${K - 14}" rx="128" ry="11" fill="#353d7a"/>`;
  d += `<ellipse cx="${LAN_X + 10}" cy="${K - 14}" rx="60" ry="5.5" fill="#444c8a"/>`;
  /* the kerb and the centre line */
  d += `<path d="M0 ${K} H1440" stroke="${NLINE}" stroke-opacity=".32" stroke-width="2.4"/>`;
  let dash = "";
  for (let x = 20; x < 1440; x += 90) dash += `M${x} ${K + 44} h44 `;
  d += `<path d="${dash}" stroke="${NLINE}" stroke-opacity=".16" stroke-width="2"/>`;
  /* the post: fluted base, collar, column, two rings and the finial */
  d += `<path d="M${LX - 22} ${K} L${LX - 16} ${K - 46} H${LX + 16} L${LX + 22} ${K} Z" fill="${P}" stroke="${KEY}" stroke-width="1.5"/>`;
  d += `<path d="M${LX - 10} ${K - 4} L${LX - 8} ${K - 42} M${LX - 3} ${K - 4} V${K - 42} M${LX + 3} ${K - 4} V${K - 42} M${LX + 10} ${K - 4} L${LX + 8} ${K - 42}" stroke="${P2}" stroke-width="1.6"/>`;
  d += `<rect x="${LX - 19}" y="${K - 54}" width="38" height="9" rx="3" fill="${P2}" stroke="${KEY}" stroke-width="1.5"/>`;
  d += `<rect x="${LX - 6}" y="44" width="12" height="${K - 98}" fill="${P}" stroke="${KEY}" stroke-width="1.5"/>`;
  for (const y of [110, 180]) d += `<rect x="${LX - 10}" y="${y}" width="20" height="7" rx="2" fill="${P2}" stroke="${KEY}" stroke-width="1.2"/>`;
  d += `<circle cx="${LX}" cy="38" r="8" fill="${P2}" stroke="${KEY}" stroke-width="1.5"/>`;
  /* the scroll bracket */
  d += `<path d="M${LX} 52 C${LX - 30} 52 ${LX - 60} 40 ${LAN_X + 6} 36" stroke="${P}" stroke-width="6" fill="none" stroke-linecap="round"/>`;
  d += `<path d="M${LX - 4} 70 C${LX - 30} 70 ${LX - 44} 58 ${LX - 40} 50 C${LX - 36} 44 ${LX - 28} 50 ${LX - 32} 55" stroke="${P2}" stroke-width="3" fill="none" stroke-linecap="round"/>`;
  /* the lantern: cap, lit glass with its glazing bars, and the bottom */
  d += `<path d="M${LAN_X - 4} 24 h8 v6 h-8 Z" fill="${P2}"/><path d="M${LAN_X} 16 V24" stroke="${P2}" stroke-width="2.4"/>`;
  d += `<path d="M${LAN_X - 22} ${LAN_Y} H${LAN_X + 22} L${LAN_X + 12} 30 H${LAN_X - 12} Z" fill="${P}" stroke="${KEY}" stroke-width="1.5"/>`;
  d += `<path d="M${LAN_X - 20} ${LAN_Y} H${LAN_X + 20} L${LAN_X + 15} ${LAN_Y + 42} H${LAN_X - 15} Z" fill="${TAXI}" stroke="${KEY}" stroke-width="1.5"/>`;
  d += `<path d="M${LAN_X - 7} ${LAN_Y} L${LAN_X - 5} ${LAN_Y + 42} M${LAN_X + 7} ${LAN_Y} L${LAN_X + 5} ${LAN_Y + 42} M${LAN_X - 18} ${LAN_Y + 20} H${LAN_X + 18}" stroke="${P}" stroke-width="2.2"/>`;
  d += `<path d="M${LAN_X - 17} ${LAN_Y + 42} H${LAN_X + 17} L${LAN_X + 8} ${LAN_Y + 50} H${LAN_X - 8} Z" fill="${P}" stroke="${KEY}" stroke-width="1.5"/>`;
  return d;
}

/* Built once per server process: the same string for both crops. */
const ART = street();

export default function NightStreet() {
  return (
    <>
      <svg
        className="nstreet d"
        viewBox="0 0 1440 380"
        preserveAspectRatio="xMidYMax meet"
        aria-hidden="true"
        focusable="false"
        dangerouslySetInnerHTML={{ __html: ART }}
      />
      <svg
        className="nstreet m"
        viewBox="840 0 600 380"
        preserveAspectRatio="xMidYMax meet"
        aria-hidden="true"
        focusable="false"
        dangerouslySetInnerHTML={{ __html: ART }}
      />
    </>
  );
}
