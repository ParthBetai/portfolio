"use client";

import { useEffect, useRef } from "react";
import type { ReactNode } from "react";
import { gsap, scrub } from "@/lib/motion";
import { stacks } from "@/lib/content";
import { C } from "./drawings/kit";

/* ============================================================
   THE TRAM BAND
   A Kolkata street in section above the stack rows: poles with their
   bracket arms, the sagging messenger wire and the contact wire on its
   hangers, the rail along the bottom, and a two-car tram (cream upper
   panels over navy, sash windows with a couple of shutters down, roof
   ventilators, bogies with two axles each, the raked cab with its
   destination dome reading "Stack", a yellow headlamp, a lifeguard and
   the trolley pole up to the contact wire).

   The wires are static (one svg for desktop and tablet, one for phone,
   where the wires sit lower over a 200px band). The tram is its own svg
   in its own box, and that box is the only thing that moves: a
   reversible translateX scrub of about 420px while the band crosses
   the viewport. At rest and without scripts it stands at the centre.

   All decorative: the stack it heads is the rows below (Marquee.tsx).
   Geometry ported from the drawing set's tramWires() and tramCars().
   ============================================================ */

/* The drawing set's palette (kit.ts). */
const { key: KEY, pole: POLE, bline: BLINE, chrome: CHROME } = C;
const f1 = (n: number) => Math.round(n * 10) / 10;

/* The keyline every painted part shares. */
const K = { stroke: KEY, strokeWidth: 1.5, strokeLinejoin: "round" as const };

/* Poles every 420 units across a 1440 street; the messenger wire sags
   22 units between each pair. phone drops the wires 49 units so they
   clear the shorter band. */
function Wires({ phone }: { phone: boolean }) {
  const R = 222;
  const Y = phone ? 49 : 0;
  const poles = [150, 570, 990, 1410];
  const mess = (x: number) => {
    for (let i = 0; i < poles.length - 1; i++) {
      const a = poles[i];
      const b = poles[i + 1];
      if (x >= a && x <= b) {
        const u = (x - a) / (b - a);
        return Y + 40 + 22 * 4 * u * (1 - u);
      }
    }
    const u = x < poles[0] ? (poles[0] - x) / 420 : (x - poles[3]) / 420;
    return Y + 40 + 22 * 4 * u * (1 - u) * 0.9;
  };
  let m = `M-20 ${f1(mess(-20))}`;
  for (let x = 0; x <= 1460; x += 20) m += ` L${x} ${f1(mess(x))}`;
  let hang = "";
  for (let x = 30; x < 1440; x += 46) hang += `M${x} ${f1(mess(x))} V${74 + Y} `;
  return (
    <svg
      className={`wires ${phone ? "m-only" : "d-only"}`}
      viewBox="0 0 1440 230"
      preserveAspectRatio="xMidYMax slice"
      aria-hidden="true"
    >
      {poles.map((p) => (
        <g key={p}>
          <path d={`M${p} ${R} V18`} stroke={POLE} strokeWidth="7" />
          <path d={`M${p - 6} ${R} h12`} stroke={POLE} strokeWidth="9" />
          <circle cx={p} cy="15" r="6" fill={POLE} />
          <path d={`M${p} ${34 + Y} H${p + 76} M${p} ${56 + Y} L${p + 50} ${36 + Y}`} stroke={POLE} strokeWidth="2.6" fill="none" />
        </g>
      ))}
      <path d={m} stroke={BLINE} strokeOpacity=".5" strokeWidth="1.4" fill="none" />
      <path d={`M0 ${74 + Y} H1440`} stroke={BLINE} strokeOpacity=".75" strokeWidth="1.7" />
      <path d={hang} stroke={BLINE} strokeOpacity=".25" strokeWidth="1" />
      <path d={`M0 ${R} H1440`} stroke={CHROME} strokeWidth="3" />
      <path d={`M0 ${R + 5} H1440`} stroke={BLINE} strokeOpacity=".25" strokeWidth="1" />
    </svg>
  );
}

/* One car, x to x + w, facing right. The leading car has the raked cab,
   the dome, the headlamp and the lifeguard; the trailer a tail lamp. */
function Car({ x, w, front = false, pole = false, sign = "" }: { x: number; w: number; front?: boolean; pole?: boolean; sign?: string }) {
  const cream = "#efe7d6";
  const navy = "#1d2a6e";
  const top = 30;
  const waist = 82;
  const bot = 120;
  const fx = x + w;
  const parts: ReactNode[] = [];

  /* the roof and its ventilators */
  parts.push(<path key="roof" d={`M${x + 8} ${top + 2} Q${x + w / 2} ${top - 10} ${x + w - 8} ${top + 2} Z`} fill="#d9cfba" {...K} />);
  for (let k = x + 30; k < x + w - 30; k += 22) {
    parts.push(<rect key={`v${k}`} x={k} y={top - 7} width="12" height="5" rx="1.5" fill="#cfc4ad" {...K} />);
  }
  /* the body: raked at the cab, flat at the coupler end */
  const body = front
    ? `M${x} ${top + 2} H${fx - 22} Q${fx - 6} ${top + 4} ${fx} ${top + 30} L${fx + 4} ${bot - 4} Q${fx + 4} ${bot} ${fx - 2} ${bot} H${x} Z`
    : `M${x} ${top + 2} H${fx} V${bot} H${x} Z`;
  parts.push(<path key="body" d={body} fill={cream} {...K} />);
  /* lower panels in navy, a cream lining and the blue rocker */
  const lower = front
    ? `M${x} ${waist} H${fx + 2} L${fx + 4} ${bot - 4} Q${fx + 4} ${bot} ${fx - 2} ${bot} H${x} Z`
    : `M${x} ${waist} H${fx} V${bot} H${x} Z`;
  parts.push(<path key="lower" d={lower} fill={navy} {...K} />);
  parts.push(<path key="lining" d={`M${x} ${waist + 6} H${front ? fx + 2 : fx}`} stroke={cream} strokeWidth="1.6" opacity=".8" />);
  parts.push(<rect key="rocker" x={x} y={bot - 9} width={w + (front ? 2 : 0)} height="9" fill="#3d63b8" {...K} />);

  /* seven windows: sash bars, two shutters down, the door in the middle */
  const n = 7;
  const gap = 6;
  const x0 = x + 14;
  const inner = front ? w - 50 : w - 28;
  const ww = (inner - gap * (n - 1)) / n;
  for (let i = 0; i < n; i++) {
    const wx = x0 + i * (ww + gap);
    if (i === 3) {
      parts.push(<rect key={`d${i}`} x={f1(wx)} y={top + 10} width={f1(ww)} height={waist - top - 4} rx="2" fill={navy} {...K} />);
      parts.push(<path key={`dl${i}`} d={`M${f1(wx + ww / 2)} ${top + 12} V${waist + 4}`} stroke={cream} strokeWidth="1" opacity=".6" />);
      continue;
    }
    const shut = i === 1 || i === 5;
    parts.push(<rect key={`w${i}`} x={f1(wx)} y={top + 12} width={f1(ww)} height="34" rx="2" fill={shut ? "#c9b98f" : "#f3dfa6"} {...K} />);
    if (shut) {
      let l = "";
      for (let yy = top + 17; yy < top + 46; yy += 4) l += `M${f1(wx + 2)} ${yy} H${f1(wx + ww - 2)} `;
      parts.push(<path key={`s${i}`} d={l} stroke={KEY} strokeWidth=".8" opacity=".55" />);
    } else {
      parts.push(
        <path key={`b${i}`} d={`M${f1(wx + ww / 2)} ${top + 12} V${top + 46} M${f1(wx)} ${top + 24} H${f1(wx + ww)}`} stroke={KEY} strokeWidth="1.1" />
      );
    }
  }

  if (front) {
    /* the raked windscreen, and the dome with the destination box */
    parts.push(<path key="screen" d={`M${fx - 26} ${top + 10} H${fx - 12} Q${fx - 3} ${top + 14} ${fx} ${top + 40} H${fx - 26} Z`} fill="#2b3566" {...K} />);
    parts.push(
      <path key="dome" d={`M${fx - 48} ${top + 2} Q${fx - 44} ${top - 22} ${fx - 20} ${top - 22} Q${fx - 6} ${top - 20} ${fx - 4} ${top + 4} Z`} fill="#d9cfba" {...K} />
    );
    parts.push(<rect key="dest" x={fx - 44} y={top - 17} width="34" height="13" rx="2" fill={KEY} />);
    if (sign) {
      parts.push(
        <text key="sign" className="rolltext" x={fx - 27} y={top - 7} textAnchor="middle" fontSize="10" fill="#f3ead6">
          {sign}
        </text>
      );
    }
    /* headlamp and lifeguard */
    parts.push(<circle key="lamp" cx={fx + 1} cy={waist + 12} r="5" fill="#f6c400" {...K} />);
    parts.push(<path key="guard" d={`M${fx - 6} ${bot + 2} L${fx + 12} ${bot + 6} L${fx + 12} ${bot + 12} L${fx - 6} ${bot + 12} Z`} fill={CHROME} {...K} />);
    parts.push(<path key="slats" d={`M${fx - 2} ${bot + 4} V${bot + 12} M${fx + 3} ${bot + 5} V${bot + 12} M${fx + 8} ${bot + 6} V${bot + 12}`} stroke={KEY} strokeWidth="1" />);
  } else {
    parts.push(<circle key="tail" cx={x + 3} cy={waist + 12} r="4" fill="#b42f1f" {...K} />);
  }

  /* two bogies, two axles each */
  for (const bxp of [x + w * 0.2, x + w * 0.8]) {
    parts.push(<rect key={`bg${bxp}`} x={f1(bxp - 30)} y={bot + 2} width="60" height="10" rx="3" fill={KEY} />);
    for (const ax of [bxp - 17, bxp + 17]) {
      parts.push(<circle key={`a${ax}`} cx={f1(ax)} cy={bot + 15} r="9" fill="#1a1f40" stroke={CHROME} strokeWidth="2" />);
      parts.push(<circle key={`h${ax}`} cx={f1(ax)} cy={bot + 15} r="2.5" fill={CHROME} />);
    }
  }

  /* the trolley pole, from its base on the roof up to the contact wire */
  if (pole) {
    const px = x + w * 0.62;
    parts.push(<rect key="pbase" x={px - 16} y={top - 12} width="32" height="6" rx="2" fill={CHROME} {...K} />);
    parts.push(<path key="pole" d={`M${px} ${top - 10} L${px - 104} -12`} stroke={cream} strokeWidth="2.6" strokeLinecap="round" />);
    parts.push(<path key="pkey" d={`M${px} ${top - 10} L${px - 104} -12`} stroke={KEY} strokeWidth=".8" strokeLinecap="round" opacity=".6" />);
  }

  return <g>{parts}</g>;
}

export default function TramBand() {
  const cars = useRef<HTMLDivElement>(null);

  /* The glide: the cars' own box, from 210px left of centre as the band
     enters at the foot of the viewport to 210px right as it leaves the
     top; a little less on a phone, so the tram never leaves the frame
     entirely. Measured in natural flow (lib/motion.ts sets
     html[data-measure] at every refresh). */
  useEffect(() => {
    const el = cars.current;
    const band = el?.parentElement;
    if (!el || !band) return;
    const travel = () => Math.min(420, window.innerWidth * 0.6) / 2;
    const ctx = gsap.context(() => {
      gsap.fromTo(
        el,
        { x: () => -travel() },
        {
          x: () => travel(),
          ease: "none",
          immediateRender: true,
          scrollTrigger: { trigger: band, start: "top bottom", end: "bottom top", scrub: scrub(), invalidateOnRefresh: true },
        }
      );
    });
    return () => ctx.revert();
  }, []);

  return (
    <div className="tramwrap" aria-hidden="true">
      <Wires phone={false} />
      <Wires phone />
      <div ref={cars} className="tramcars">
        <svg className="tram" viewBox="-4 -40 664 188">
          <Car x={4} w={300} />
          <rect x="304" y="96" width="22" height="8" fill={KEY} />
          {/* The destination dome names the first row below. */}
          <Car x={326} w={300} front pole sign={stacks[0].label} />
        </svg>
      </div>
    </div>
  );
}
