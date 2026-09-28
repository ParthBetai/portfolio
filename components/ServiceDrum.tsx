"use client";

import { useEffect, useRef, useState } from "react";
import type { CSSProperties, ReactNode, RefObject } from "react";
import { gsap, ScrollTrigger, reduced } from "@/lib/motion";
import { services } from "@/lib/content";

/* ============================================================
   THE CAPABILITY DRUM
   The services list, cut into a machined selector: a seven-sided prism
   on an axle, one face per service, like the number wheel of a
   combination lock. It is built in DOM and CSS 3D, the same way as the
   floppy in the intro and the phone in contact, so it stays sharp at any
   size and costs nothing to load.

   It is a picture of the list, not a second control. The rows stay the
   only thing you can click; this repeats them, so it is aria-hidden and
   ignores the pointer.

   How it moves:
     full  it turns with the page. While it sits beside the list, the face
           in the window is the row beside it, and it clicks from one face
           to the next rather than drifting, the way a detent wheel does.
           Hovering or opening a row spins it straight to that face, with
           a small overshoot and a knock when it lands.
     soft  exactly the same. Soft only drops the page's inertia and its
           scroll-velocity effects, and the drum uses neither.
     off   it never moves. It shows face 01, or the open row's face.

   Structure, outside in:
     root    size and, from lg up, the sticky slot (Tailwind only)
     rig     GSAP only: the reveal
     scale   Tailwind scale per breakpoint; the geometry below is in px
             at one native size
     camera  static inline transform: looked at from a little above and
             to the left, so the end of the drum and its axle show
     jolt    GSAP only: the knock when a detent lands
     rotor   rotateX written by apply() on every frame it turns
   Lighting is faked per face from its angle to a light above the viewer:
   faces rolling under go dark, the one in the window catches a sheen.
   ============================================================ */

const ITEMS = services.items;
const N = ITEMS.length;
const STEP = 360 / N;
const RAD = Math.PI / 180;

/* ---- geometry, native px ------------------------------------------ */
const W = 300; // flange to flange, along the axle
const FW = W - 8; // the faces stop short of the flanges, so nothing intersects
const A = 108; // axle to the middle of a face
const FH = 2 * A * Math.tan(Math.PI / N); // face height
const R = A / Math.cos(Math.PI / N); // axle to an edge: the radius the prism sweeps
const FR = 129; // flange radius, proud of the edges
const RIM = 10; // width of the chrome rim ring on each flange
const END = -W / 2; // the visible (left) end
const SCENE_W = 420;
const SCENE_H = 320;
const CX = 198;
const CY = 150;
const CAMERA = "rotateX(-7deg) rotateY(22deg)";

/* Crop marks at the corners of the window. They sit a few px outside the
   radius the prism sweeps, so a turning edge never passes through one. */
const MARK_Y = FH / 2 + 1.6;
const MARK_Z = A + 3.2;

/* ---- light ----------------------------------------------------------
   One lamp, above and in front. Angles are a face's tilt from facing the
   viewer, positive when it is turned up toward the lamp. It sits only a
   little above the eye: any higher and the face rolling up over the top
   out-lights the one in the window, and the selection stops reading. */
const LAMP = 12;
const HOT = 10; // where the specular peaks: between the lamp and the eye

const px = (n: number) => `${n.toFixed(2)}px`;
const clamp = (v: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, v));
const wrap = (d: number) => ((((d + 180) % 360) + 360) % 360) - 180;
const lambert = (t: number) => Math.max(0, Math.cos((t - LAMP) * RAD));
const shadeAt = (t: number) => (Math.abs(t) >= 92 ? 1 : 1 - (0.1 + 0.9 * Math.pow(lambert(t), 1.5)));
const glossAt = (t: number) =>
  Math.abs(t) >= 90 ? 0 : 0.08 + 0.92 * Math.pow(Math.max(0, Math.cos((t - HOT) * RAD)), 30);
/* The sheen is a band on a layer three faces tall. Sliding it the other
   way from the turn keeps the reflection roughly still on screen while
   the metal moves under it, which is what sells the rotation. */
const sheenAt = (t: number) => `translate3d(0, ${clamp(t * 0.75, -33, 33).toFixed(2)}%, 0)`;

/* Brushed steel for the static round parts, which are faceted prisms:
   each facet gets the tone the lamp would give it. */
const steel = (t: number) => {
  const d = lambert(t);
  const s = Math.pow(Math.max(0, Math.cos((t - 16) * RAD)), 14);
  const v = Math.min(1, 0.09 + 0.5 * d * d + 0.55 * s);
  const g = Math.round(16 + 220 * v);
  return `rgb(${g}, ${Math.min(255, g + 2)}, ${Math.min(255, g + 6)})`;
};

/* Settles on each face and moves briskly between them, so a scroll-driven
   turn reads as a ratchet rather than a slide. */
const ratchet = (c: number) => {
  const n = Math.floor(c);
  const f = clamp((c - n - 0.25) / 0.5, 0, 1);
  return n + f * f * (3 - 2 * f);
};

/* A regular polygon for clip-path. `offset` 0.5 puts the side midpoints,
   not the corners, on the axes, which lines them up with the faces. */
const polygon = (sides: number, offset = 0.5) =>
  `polygon(${Array.from({ length: sides }, (_, i) => {
    const a = (i + offset) * (360 / sides) * RAD;
    return `${(50 + 50 * Math.cos(a)).toFixed(3)}% ${(50 + 50 * Math.sin(a)).toFixed(3)}%`;
  }).join(", ")})`;
const HEX = polygon(6);

const pad = (n: number) => String(n).padStart(2, "0");
const plain = (s: string) => s.replace(/\*/g, "");

/* ---- surfaces ------------------------------------------------------- */
const FACE: CSSProperties = {
  background: [
    /* brushed along the axle, fine and uneven */
    "repeating-linear-gradient(180deg, rgba(255,255,255,0.024) 0 1px, transparent 1px 2.5px, rgba(0,0,0,0.07) 2.5px 3.5px, transparent 3.5px 5px)",
    "linear-gradient(180deg, #2a2b30 0%, #232428 52%, #1d1e22 100%)",
  ].join(","),
  /* chamfered edges: the top lip catches the lamp, the bottom falls away */
  boxShadow:
    "inset 0 1px 0 rgba(255,255,255,0.16), inset 0 2px 0 rgba(255,255,255,0.03), inset 0 -1px 0 rgba(0,0,0,0.75), inset 1px 0 0 rgba(255,255,255,0.05), inset -1px 0 0 rgba(0,0,0,0.5)",
};

const SHEEN: CSSProperties = {
  background:
    "linear-gradient(174deg, transparent 36%, rgba(255,255,255,0.05) 43%, rgba(255,255,255,0.2) 48.6%, rgba(255,255,255,0.32) 50%, rgba(255,255,255,0.2) 51.4%, rgba(255,255,255,0.05) 57%, transparent 64%)",
  mixBlendMode: "screen",
};

/* An annulus mask, in px of a disc of radius FR. */
const ring = (r0: number, r1: number) => {
  const a = ((r0 / FR) * 100).toFixed(2);
  const b = ((r1 / FR) * 100).toFixed(2);
  const m = `radial-gradient(circle closest-side, transparent ${a}%, #000 ${a}%, #000 ${b}%, transparent ${b}%)`;
  return { WebkitMaskImage: m, maskImage: m } as CSSProperties;
};

/* The flanges turn with the drum. Their faces are dark turned steel, so
   the only things that show the turn are the graduations. */
const FLANGE: CSSProperties = {
  borderRadius: "50%",
  background: [
    "repeating-radial-gradient(circle, rgba(255,255,255,0.028) 0 0.7px, transparent 0.7px 2.4px)",
    "radial-gradient(circle, #2c2d32 0%, #222327 55%, #1a1b1f 88%, #111114 100%)",
  ].join(","),
};
/* One hairline every fifth of a face, a longer one at each face centre.
   repeating-conic-gradient starts at 12 o'clock; +90 turns 0 to the front. */
const MINOR: CSSProperties = {
  borderRadius: "50%",
  background: `repeating-conic-gradient(from ${(90 - 0.3).toFixed(2)}deg, rgba(220,222,228,0.32) 0deg 0.6deg, transparent 0.6deg ${(STEP / 5).toFixed(4)}deg)`,
  ...ring(108, 117),
};
const MAJOR: CSSProperties = {
  borderRadius: "50%",
  background: `repeating-conic-gradient(from ${(90 - 0.55).toFixed(2)}deg, rgba(236,237,241,0.7) 0deg 1.1deg, transparent 1.1deg ${STEP.toFixed(4)}deg)`,
  ...ring(100, 117),
};

/* The chrome rim does not turn, so its anisotropic highlight stays put
   while the graduations run underneath it, as on a real dial. */
const RIM_RING: CSSProperties = {
  borderRadius: "50%",
  background: [
    /* the groove where rim meets face, and the outer arris */
    `radial-gradient(circle closest-side, rgba(0,0,0,0.7) ${(((FR - RIM) / FR) * 100).toFixed(2)}%, transparent ${(((FR - RIM + 1.4) / FR) * 100).toFixed(2)}%, transparent 98.6%, rgba(0,0,0,0.55) 99.4%)`,
    "conic-gradient(from 205deg, #6f7178, #eef0f3 9%, #7a7c83 20%, #3f4146 33%, #b4b6bc 45%, #5a5c62 58%, #34363a 70%, #d4d5da 84%, #6f7178)",
  ].join(","),
  ...ring(FR - RIM, FR),
};

/* The spot-faced boss the axle comes out of. It does not turn, so its
   anisotropic highlight, the bright spokes of a machined face, stays put
   while the numbers on the drum go round it. */
const SPOT: CSSProperties = {
  borderRadius: "50%",
  background: [
    "repeating-radial-gradient(circle, rgba(0,0,0,0.2) 0 0.6px, transparent 0.6px 1.8px)",
    "conic-gradient(from 210deg, #4a4c52, #9fa1a8 9%, #505257 21%, #3a3b40 33%, #8a8c93 47%, #45474c 60%, #34353a 72%, #7c7e85 86%, #4a4c52)",
  ].join(","),
  boxShadow: "inset 0 0 0 1.5px rgba(0,0,0,0.55), 0 0 0 1px rgba(255,255,255,0.08)",
};

const CHROME_FACE: CSSProperties = {
  background: [
    "repeating-radial-gradient(circle, rgba(0,0,0,0.16) 0 0.5px, transparent 0.5px 1.5px)",
    "conic-gradient(from 200deg, #8d8f96, #f1f2f5 12%, #74767d 28%, #c9cbd1 46%, #5f6168 64%, #e2e3e7 82%, #8d8f96)",
  ].join(","),
};

/* ---- icons -----------------------------------------------------------
   One family: 48 grid, 1.6 stroke, round ends, no fills. Picked by what
   the title says rather than by position, so reordering the services in
   content.ts keeps each icon on its own service. */
const GLYPHS: { test: RegExp; draw: ReactNode }[] = [
  {
    test: /mobile|android|app/i,
    draw: (
      <>
        <rect x="14.5" y="5" width="19" height="38" rx="4.5" />
        <path d="M21.5 9.3h5" />
        <path d="M18.5 17h11M18.5 21.5h6.5" />
        <path d="M21 38.6h6" />
        <path d="M35.6 13.5v5" />
      </>
    ),
  },
  {
    test: /robot|embedded|hardware/i,
    draw: (
      <>
        <path d="M9.5 42.5h21" />
        <path d="M14 42.5v-4.2a2.3 2.3 0 0 1 2.3-2.3h7.4a2.3 2.3 0 0 1 2.3 2.3v4.2" />
        <path d="M20 33.7V36" />
        <circle cx="20" cy="30.5" r="3.2" />
        <path d="M21.83 27.87 27.57 19.63" />
        <circle cx="29.4" cy="17" r="3.2" />
        <path d="M32.39 18.14l5.41 2.06" />
        <path d="M37.8 20.2l3.6-3.1M37.8 20.2l2.4 4.2" />
      </>
    ),
  },
  {
    test: /\bai\b|automation|machine/i,
    draw: (
      <>
        <path d="M21 8.5c.8 6.9 3.6 9.7 10.5 10.5-6.9.8-9.7 3.6-10.5 10.5-.8-6.9-3.6-9.7-10.5-10.5 6.9-.8 9.7-3.6 10.5-10.5z" />
        <circle cx="36.5" cy="34" r="2.8" />
        <path d="M27.2 25.2l7.27 6.87" />
        <circle cx="12" cy="38.5" r="1.9" />
        <path d="M16.9 25.4l-4.26 11.31" />
      </>
    ),
  },
  {
    test: /stack|backend|web dev/i,
    draw: (
      <>
        <path d="M24 8l16 8-16 8-16-8z" />
        <path d="M8 23.5l16 8 16-8" />
        <path d="M8 31l16 8 16-8" />
      </>
    ),
  },
  {
    test: /secur|cyber/i,
    draw: (
      <>
        <path d="M24 6l14 5.5V22c0 9-5.6 15.3-14 19-8.4-3.7-14-10-14-19V11.5z" />
        <circle cx="24" cy="21" r="3.4" />
        <path d="M24 24.4v5.4" />
      </>
    ),
  },
  {
    test: /design|brand/i,
    draw: (
      <>
        <path d="M24 42.5 15.5 28l4-15h9l4 15z" />
        <path d="M24 42.5V30.2" />
        <circle cx="24" cy="28" r="2.2" />
        <path d="M18.5 13V8.5h11V13" />
      </>
    ),
  },
  {
    test: /devops|tool|deploy|cloud/i,
    draw: (
      <>
        <rect x="6.5" y="9.5" width="35" height="29" rx="3.5" />
        <path d="M6.5 16h35" />
        <path d="M11 12.8h.01M14.2 12.8h.01M17.4 12.8h.01" />
        <path d="M13 23l4.5 4-4.5 4" />
        <path d="M21 31.5h8" />
      </>
    ),
  },
];

const FALLBACK: ReactNode = (
  <>
    <circle cx="24" cy="24" r="13" />
    <path d="M24 7v8M24 33v8M7 24h8M33 24h8" />
  </>
);

function Glyph({ title, className }: { title: string; className?: string }) {
  const g = GLYPHS.find((x) => x.test.test(title));
  return (
    <svg
      viewBox="0 0 48 48"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.6}
      strokeLinecap="round"
      strokeLinejoin="round"
      focusable={false}
      className={className}
    >
      {g ? g.draw : FALLBACK}
    </svg>
  );
}

/* ---- static parts ----------------------------------------------------
   A faceted cylinder along the axle, from x0 to x1 (x0 < x1). */
function Prism({ sides, apothem, x0, x1, turn = 0 }: { sides: number; apothem: number; x0: number; x1: number; turn?: number }) {
  const len = x1 - x0;
  const h = 2 * apothem * Math.tan(Math.PI / sides) + 0.6;
  const xc = (x0 + x1) / 2;
  return (
    <>
      {Array.from({ length: sides }, (_, j) => {
        const ang = j * (360 / sides) + turn;
        return (
          <span
            key={j}
            className="absolute block [backface-visibility:hidden]"
            style={{
              width: px(len),
              height: px(h),
              left: px(-len / 2),
              top: px(-h / 2),
              transform: `translateX(${px(xc)}) rotateX(${ang.toFixed(2)}deg) translateZ(${px(apothem)})`,
              /* a hint of the turning marks along its length */
              background: `linear-gradient(90deg, rgba(0,0,0,0.18), transparent 30%, transparent 70%, rgba(0,0,0,0.22)), ${steel(wrap(ang))}`,
            }}
          />
        );
      })}
    </>
  );
}

/* A flat round (or polygonal) part facing out of the left end at x. */
function Cap({ x, r, style, children }: { x: number; r: number; style: CSSProperties; children?: ReactNode }) {
  return (
    <span
      className="absolute block"
      style={{
        width: px(2 * r),
        height: px(2 * r),
        left: px(-r),
        top: px(-r),
        transform: `translateX(${px(x)}) rotateY(-90deg)`,
        ...style,
      }}
    >
      {children}
    </span>
  );
}

type Props = {
  /* The row under a mouse (or with keyboard focus), if any. */
  hover: number | null;
  /* The expanded row, if any. */
  open: number | null;
  /* The list of rows. From lg up the drum shows the row beside it. */
  track: RefObject<HTMLElement | null>;
};

export default function ServiceDrum({ hover, open, track }: Props) {
  const root = useRef<HTMLDivElement>(null);
  const rig = useRef<HTMLDivElement>(null);
  const scene = useRef<HTMLDivElement>(null);
  const jolt = useRef<HTMLDivElement>(null);
  const rotor = useRef<HTMLDivElement>(null);
  const shades = useRef<(HTMLSpanElement | null)[]>([]);
  const sheens = useRef<(HTMLSpanElement | null)[]>([]);
  const numbers = useRef<(HTMLSpanElement | null)[]>([]);
  const pawlL = useRef<HTMLSpanElement>(null);
  const pawlR = useRef<HTMLSpanElement>(null);
  const marks = useRef<(HTMLSpanElement | null)[]>([]);
  const led = useRef<HTMLSpanElement>(null);
  const deg = useRef<HTMLSpanElement>(null);
  const api = useRef<((h: number | null, o: number | null) => void) | null>(null);
  const [face, setFace] = useState(0);

  useEffect(() => {
    const rootEl = root.current;
    const rigEl = rig.current;
    const sceneEl = scene.current;
    const joltEl = jolt.current;
    const rotorEl = rotor.current;
    const pawlLEl = pawlL.current;
    const pawlREl = pawlR.current;
    const markEls = marks.current.filter((m): m is HTMLSpanElement => !!m);
    const ledEl = led.current;
    const degEl = deg.current;
    const trackEl = track.current;
    const shadeEls = shades.current;
    const sheenEls = sheens.current;
    const numberEls = numbers.current;
    if (!rootEl || !rigEl || !sceneEl || !joltEl || !rotorEl || !pawlLEl || !pawlREl || !ledEl || !degEl || !trackEl) return;

    const still = reduced();

    /* rot is where the drum is told to be; spin is the arrival turn on
       top of it. Kept apart so a hover during the arrival adds to it
       instead of cancelling it. */
    const proxy = { rot: 0 };
    const spin = { v: 0 };
    const hidden: boolean[] = [];
    let shown = -1;

    const paint = (total: number, report: boolean) => {
      rotorEl.style.transform = `rotateX(${total.toFixed(3)}deg)`;
      for (let k = 0; k < N; k++) {
        const t = wrap(total - k * STEP);
        const shade = shadeEls[k];
        const sheen = sheenEls[k];
        const num = numberEls[k];
        if (!shade || !sheen || !num) continue;
        /* Faces round the back are hidden anyway: write them once, then
           leave them alone until they come round again. */
        if (Math.abs(t) > 100) {
          if (!hidden[k]) {
            shade.style.opacity = "1";
            sheen.style.opacity = "0";
            hidden[k] = true;
          }
          continue;
        }
        hidden[k] = false;
        shade.style.opacity = shadeAt(t).toFixed(3);
        sheen.style.opacity = glossAt(t).toFixed(3);
        sheen.style.transform = sheenAt(t);
        num.style.setProperty("--shine", `${(50 + t * 1.6).toFixed(1)}%`);
      }

      /* The pointers are sprung against the drum: each edge pushes them
         out a hair as it passes the window, then they drop back. */
      const u = total / STEP;
      const f = u - Math.floor(u);
      const lift = Math.pow(Math.max(0, 1 - Math.abs(f - 0.5) / 0.24), 2);
      const nudge = `translate3d(${(lift * 3.5).toFixed(2)}px, 0, 0)`;
      pawlLEl.style.transform = nudge;
      pawlREl.style.transform = nudge;

      const a = ((total % 360) + 360) % 360;
      degEl.textContent = `${a.toFixed(1).padStart(5, "0")}°`;

      if (report) {
        const n = ((Math.round(u) % N) + N) % N;
        if (n !== shown) {
          shown = n;
          setFace(n);
        }
      }
    };
    const apply = () => paint(proxy.rot + spin.v, true);

    /* ---- the knock when a detent lands ------------------------------ */
    const knock = () => {
      gsap
        .timeline()
        .to(joltEl, { y: 1.8, duration: 0.045, ease: "power2.out", overwrite: true })
        .to(joltEl, { y: -0.7, duration: 0.07, ease: "power2.inOut" })
        .to(joltEl, { y: 0, duration: 0.32, ease: "power3.out" });
      gsap.fromTo(markEls, { opacity: 1 }, { opacity: 0.8, duration: 0.9, ease: "power2.out", overwrite: true });
      gsap.fromTo(ledEl, { opacity: 0.15 }, { opacity: 1, duration: 0.36, ease: "steps(3)", overwrite: true });
    };

    /* ---- scroll ----------------------------------------------------- */
    let scrollAngle = () => 0;
    let mode: "scroll" | "held" = still ? "held" : "scroll";
    /* Follows the scroll with a little lag. A fresh overwriting tween per
       update rather than quickTo: the detent tweens below overwrite
       whatever is running on the proxy, and a killed quickTo stays dead. */
    const chase = (t: number) =>
      gsap.to(proxy, { rot: t, duration: 0.7, ease: "power3.out", overwrite: true, onUpdate: apply });

    /* A detent wheel never rests between faces. The scroll can stop with a
       row boundary right at the window, so once it has been still for a
       moment the drum drops into the nearest detent and knocks. */
    let aimed = 0;
    let settleTimer = 0;
    const settle = () => {
      if (mode !== "scroll") return;
      const target = Math.round(aimed / STEP) * STEP;
      if (Math.abs(target - aimed) < 0.5) return;
      gsap.to(proxy, { rot: target, duration: 0.45, ease: "back.out(1.7)", overwrite: true, onUpdate: apply, onComplete: knock });
    };
    const aim = (t: number) => {
      aimed = t;
      chase(t);
      window.clearTimeout(settleTimer);
      settleTimer = window.setTimeout(settle, 220);
    };

    const ctx = gsap.context(() => {
      if (still) return;
      /* The rail the drum rides in, not the drum: once it is stuck, the
         drum's own position no longer says where the section is. */
      const trigger = rootEl.parentElement ?? rootEl;
      gsap.fromTo(
        rigEl,
        { autoAlpha: 0, y: 40 },
        { autoAlpha: 1, y: 0, duration: 1.2, ease: "power3.out", scrollTrigger: { trigger, start: "top 88%" } }
      );
      /* It arrives spinning and runs down onto face 01. */
      gsap.fromTo(
        spin,
        { v: -360 },
        {
          v: 0,
          duration: 2.1,
          ease: "power4.out",
          onUpdate: apply,
          onComplete: knock,
          scrollTrigger: { trigger, start: "top 88%" },
        }
      );
    }, rootEl);

    let mm: ReturnType<typeof gsap.matchMedia> | undefined;
    if (!still) {
      mm = gsap.matchMedia();
      /* Beside the list: the face in the window is the row level with it.
         Row positions are read on refresh only, never per frame. */
      mm.add("(min-width: 1024px)", () => {
        let rows: { top: number; h: number }[] = [];
        let total = 1;
        const read = () => {
          rows = Array.from(trackEl.querySelectorAll<HTMLElement>("[data-svc-row]")).map((r) => ({
            top: r.offsetTop,
            h: Math.max(1, r.offsetHeight),
          }));
          total = Math.max(1, trackEl.offsetHeight);
        };
        const angleOf = (p: number) => {
          const y = p * total;
          let c = 0;
          for (let i = 0; i < rows.length; i++) {
            if (y >= rows[i].top) c = i + (y - rows[i].top) / rows[i].h - 0.5;
          }
          return ratchet(clamp(c, 0, N - 1)) * STEP;
        };
        /* Where the window is on screen while the drum is stuck: the
           sticky slot is centred, and the front face sits a little below
           the scene's centre because the camera looks down on it. Read on
           refresh, like the rows. */
        const windowY = () =>
          window.innerHeight / 2 - rootEl.offsetHeight / 2 + (sceneEl.offsetHeight / SCENE_H) * (CY + 13);
        read();
        const st = ScrollTrigger.create({
          trigger: trackEl,
          start: () => `top ${windowY()}px`,
          end: () => `bottom ${windowY()}px`,
          onRefresh: read,
          onUpdate: (self) => {
            if (mode === "scroll") aim(angleOf(self.progress));
          },
        });
        scrollAngle = () => angleOf(st.progress);
        if (mode === "scroll") {
          proxy.rot = scrollAngle();
          apply();
        }
        return () => {
          scrollAngle = () => 0;
        };
      });
      /* Above the list, on smaller screens: it turns one face either side
         of 01 as it passes through the viewport. */
      mm.add("(max-width: 1023.98px)", () => {
        const angleOf = (p: number) => ratchet((p - 0.5) * 2) * STEP;
        const st = ScrollTrigger.create({
          trigger: rootEl,
          start: "top bottom",
          end: "bottom top",
          onUpdate: (self) => {
            if (mode === "scroll") aim(angleOf(self.progress));
          },
        });
        scrollAngle = () => angleOf(st.progress);
        if (mode === "scroll") {
          proxy.rot = scrollAngle();
          apply();
        }
        return () => {
          scrollAngle = () => 0;
        };
      });
    }

    /* ---- selection -------------------------------------------------- */
    const nearest = (d: number) => d + 360 * Math.round((proxy.rot - d) / 360);
    let back = 0;

    /* A spin onto a detent: overshoot, settle, knock. */
    const spinTo = (target: number) => {
      const faces = Math.abs(target - proxy.rot) / STEP;
      if (faces < 0.004) {
        gsap.killTweensOf(proxy);
        return;
      }
      gsap.to(proxy, {
        rot: target,
        duration: 0.42 + faces * 0.09,
        ease: "back.out(2.4)",
        overwrite: true,
        onUpdate: apply,
        onComplete: knock,
      });
    };

    const hold = (i: number) => {
      mode = "held";
      const target = nearest(i * STEP);
      if (still) {
        proxy.rot = target;
        apply();
        return;
      }
      spinTo(target);
    };

    /* Handing back to the scroll. Keep the pose and drop whole turns so
       the drum is on the same winding as the scroll angle (rebuilding rot
       from the scroll angle would snap straight to it, or wind a full
       extra turn), then spin the short way onto the detent nearest the
       scroll position. Going to the raw angle instead would glide past
       the detent and then settle back onto it: two moves for one. */
    const release = () => {
      mode = "scroll";
      window.clearTimeout(settleTimer);
      const t = scrollAngle();
      proxy.rot -= 360 * Math.round((proxy.rot - t) / 360);
      aimed = Math.round(t / STEP) * STEP;
      spinTo(aimed);
    };

    api.current = (h, o) => {
      window.clearTimeout(back);
      if (still) {
        hold(o ?? 0);
        return;
      }
      const i = h ?? o;
      if (i !== null) {
        hold(i);
        return;
      }
      /* A beat before letting go, so crossing from one row to the next
         never sends it back to the scroll position in between. */
      back = window.setTimeout(release, 140);
    };

    apply();

    return () => {
      window.clearTimeout(back);
      window.clearTimeout(settleTimer);
      api.current = null;
      mm?.revert();
      ctx.revert();
      gsap.killTweensOf([proxy, spin, joltEl, ledEl, ...markEls]);
      gsap.set(joltEl, { clearProps: "transform" });
      gsap.set([ledEl, ...markEls], { clearProps: "opacity" });
      /* Back to the pose the server rendered. */
      for (let k = 0; k < N; k++) hidden[k] = false;
      paint(0, false);
      rotorEl.style.removeProperty("transform");
      pawlLEl.style.removeProperty("transform");
      pawlREl.style.removeProperty("transform");
    };
  }, [track]);

  useEffect(() => {
    api.current?.(hover, open);
  }, [hover, open]);

  const now = ITEMS[face];

  return (
    <div
      ref={root}
      aria-hidden
      className="pointer-events-none relative w-[294px] select-none sm:w-[336px] md:w-[357px] lg:sticky lg:top-[calc(50vh_-_134px)] lg:w-[302px] xl:top-[calc(50vh_-_154px)] xl:w-[353px] 2xl:top-[calc(50vh_-_173px)] 2xl:w-[403px]"
    >
      <div ref={rig}>
        <div ref={scene} className="relative h-[224px] sm:h-[256px] md:h-[272px] lg:h-[230px] xl:h-[269px] 2xl:h-[307px]">
          <div
            className="absolute left-0 top-0 origin-top-left scale-[0.7] sm:scale-[0.8] md:scale-[0.85] lg:scale-[0.72] xl:scale-[0.84] 2xl:scale-[0.96]"
            style={{ width: SCENE_W, height: SCENE_H }}
          >
            {/* Shadows on the page behind. Black on black is invisible, so
                they only show when a lit row slides underneath, which is
                exactly when the drum should look like it stands off it. */}
            <span
              className="absolute block rounded-[50%] bg-black/60 blur-[30px]"
              style={{ left: 40, width: 330, top: CY - 70, height: 230 }}
            />
            <span
              className="absolute block rounded-[50%] bg-black/85 blur-[12px]"
              style={{ left: 70, width: 290, top: CY + 118, height: 30 }}
            />

            <div className="absolute inset-0 [perspective:1150px]">
              <div
                className="absolute block [transform-style:preserve-3d]"
                style={{ left: CX, top: CY, transform: CAMERA }}
              >
                <div ref={jolt} className="absolute block [transform-style:preserve-3d]">
                  {/* ---- the turning part ---------------------------- */}
                  <div ref={rotor} className="absolute block will-change-transform [transform-style:preserve-3d]">
                    {ITEMS.map((item, k) => {
                      const t0 = wrap(-k * STEP);
                      const h = FH + 0.8;
                      return (
                        <div
                          key={item.title}
                          className="absolute overflow-hidden [backface-visibility:hidden]"
                          style={{
                            ...FACE,
                            width: FW,
                            height: px(h),
                            left: -FW / 2,
                            top: px(-h / 2),
                            transform: `rotateX(${(-k * STEP).toFixed(3)}deg) translateZ(${A}px)`,
                          }}
                        >
                          <div className="absolute inset-0 flex flex-col justify-between pb-[14px] pl-[24px] pr-[20px] pt-[12px]">
                            <div className="flex items-center gap-3.5">
                              <span
                                ref={(el) => {
                                  numbers.current[k] = el;
                                }}
                                className="chrome font-display text-[44px] leading-[0.9] font-medium tabular-nums"
                              >
                                {pad(k + 1)}
                              </span>
                              {/* an engraved rule: a cut, and its lit lower lip */}
                              <span className="mt-1 block h-[2px] flex-1 border-t border-black/70 shadow-[0_1px_0_rgba(255,255,255,0.07)]" />
                              <Glyph title={item.title} className="h-[46px] w-[46px] shrink-0 text-[#d7d8dd]" />
                            </div>
                            <span className="t-mono truncate text-[11px] tracking-[0.13em] text-[#b3b4bb] [text-shadow:0_-1px_0_rgba(0,0,0,0.6)]">
                              {plain(item.title)}
                            </span>
                          </div>
                          <span
                            ref={(el) => {
                              sheens.current[k] = el;
                            }}
                            className="absolute inset-x-0 top-[-100%] block h-[300%]"
                            style={{ ...SHEEN, opacity: glossAt(t0), transform: sheenAt(t0) }}
                          />
                          <span
                            ref={(el) => {
                              shades.current[k] = el;
                            }}
                            className="absolute inset-0 block bg-black"
                            style={{ opacity: shadeAt(t0) }}
                          />
                        </div>
                      );
                    })}

                    {/* Flanges, turning with the drum. Each is a face with a
                        couple of darker slices behind it for thickness. The
                        left one is seen from outside and carries the dial;
                        of the right one only the inner face shows, round
                        the far end of the prism. */}
                    <Cap x={END + 2.8} r={FR} style={{ borderRadius: "50%", background: "#0c0c0e" }} />
                    <Cap x={END + 1.4} r={FR} style={{ borderRadius: "50%", background: "#141417" }} />
                    <Cap x={END} r={FR} style={FLANGE}>
                      <span className="absolute inset-0 block" style={MAJOR} />
                      <span className="absolute inset-0 block" style={MINOR} />
                      {ITEMS.map((item, k) => {
                        const a = k * STEP;
                        const rn = 88;
                        return (
                          <span
                            key={item.title}
                            className="absolute block font-mono text-[10px] leading-none tracking-[0.04em] text-[#9d9ea6] [text-shadow:0_1px_0_rgba(0,0,0,0.85)]"
                            style={{
                              left: px(FR + rn * Math.cos(a * RAD)),
                              top: px(FR + rn * Math.sin(a * RAD)),
                              transform: `translate(-50%, -50%) rotate(${(a + 90).toFixed(2)}deg)`,
                            }}
                          >
                            {pad(k + 1)}
                          </span>
                        );
                      })}
                    </Cap>
                    <Cap x={-END - 0.2} r={FR} style={{ borderRadius: "50%", background: "#0c0c0e" }} />
                    <Cap x={-END - 1.6} r={FR} style={{ borderRadius: "50%", background: "#141417" }} />
                    <Cap x={-END - 3} r={FR} style={FLANGE}>
                      <span className="absolute inset-0 block" style={MINOR} />
                    </Cap>
                  </div>

                  {/* ---- the parts that stay put --------------------- */}
                  {/* chrome rims, each with a copper index at the window and a
                      sprung pointer that each passing edge nudges outward */}
                  <Cap x={END - 0.5} r={FR} style={RIM_RING} />
                  <Cap x={-END - 3.5} r={FR} style={RIM_RING} />
                  {[END - 1, -END - 3.8].map((x, s) => (
                    <Cap key={x} x={x} r={FR} style={{}}>
                      <span
                        className="absolute block bg-acid"
                        style={{ left: 2 * FR - RIM - 1, top: FR - 0.9, width: RIM + 1, height: 1.8 }}
                      />
                      <span
                        ref={s === 0 ? pawlL : pawlR}
                        className="absolute block"
                        style={{ left: 2 * FR - RIM - 9, top: FR - 4, width: 7, height: 8 }}
                      >
                        <span className="block h-full w-full bg-acid" style={{ clipPath: "polygon(100% 0, 0 50%, 100% 100%)" }} />
                      </span>
                    </Cap>
                  ))}

                  <Cap x={END - 1.5} r={60} style={SPOT} />
                  {[0, 1, 2, 3, 4].map((i) => (
                    <Cap
                      key={i}
                      x={END - 2.3 - i * 1.1}
                      r={27}
                      style={
                        i === 4
                          ? { ...CHROME_FACE, borderRadius: "50%", boxShadow: "inset 0 0 0 1px rgba(0,0,0,0.35)" }
                          : { borderRadius: "50%", background: ["#5d5f65", "#4a4c52", "#3a3b40", "#2d2e32"][i] }
                      }
                    />
                  ))}
                  <Prism sides={10} apothem={9} x0={END - 23} x1={END - 7} />
                  <Prism sides={6} apothem={13} x0={END - 32} x1={END - 21} />
                  <Cap x={END - 32} r={13 / Math.cos(Math.PI / 6)} style={{ ...CHROME_FACE, clipPath: HEX }} />
                  {/* the axle's end, proud of the nut, with its centre drill */}
                  <Cap
                    x={END - 33.5}
                    r={6.5}
                    style={{
                      borderRadius: "50%",
                      background:
                        "radial-gradient(circle, #1a1b1e 0 18%, #6b6d74 26%, transparent 34%), conic-gradient(from 160deg, #b7b9bf, #f4f5f7 20%, #7d7f86 45%, #d7d8dc 70%, #b7b9bf)",
                      boxShadow: "0 0 0 1px rgba(0,0,0,0.45)",
                    }}
                  />

                  {/* The window: crop marks at the corners of the face in
                      front, opening outward so they never cross the drum. */}
                  {(
                    [
                      [-1, -1],
                      [1, -1],
                      [-1, 1],
                      [1, 1],
                    ] as const
                  ).map(([sx, sy], i) => (
                    <span
                      key={i}
                      ref={(el) => {
                        marks.current[i] = el;
                      }}
                      className={`absolute block border-acid opacity-[0.8] ${sx < 0 ? "border-l-[1.5px]" : "border-r-[1.5px]"} ${
                        sy < 0 ? "border-b-[1.5px]" : "border-t-[1.5px]"
                      }`}
                      style={{
                        width: 16,
                        height: 9,
                        left: 0,
                        top: 0,
                        transform: `translate3d(${px(sx < 0 ? -FW / 2 + 6 : FW / 2 - 22)}, ${px(sy < 0 ? -MARK_Y - 9 : MARK_Y)}, ${px(MARK_Z)})`,
                      }}
                    />
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* The readout: which face is in the window, and the drum's angle.
            A dark plate of its own, like an instrument's display, so it
            stays legible when a lit row passes behind it. The longest
            title has to fit whole, so the angle only shows where the
            plate is wide enough to carry both. */}
        <div className="t-mono mt-2 flex h-8 items-center gap-2 rounded-[3px] border border-white/[0.07] bg-[#0a0a0c] px-3 text-[10px] tracking-[0.1em] shadow-[inset_0_1px_0_rgba(255,255,255,0.04),0_8px_22px_rgba(0,0,0,0.55)]">
          {/* A small solid mark in the accent, no glow. */}
          <span ref={led} className="block h-[5px] w-[5px] shrink-0 bg-acid" />
          <span className="shrink-0 tabular-nums text-bone">
            {pad(face + 1)}
            <span className="text-ash-dim">/{pad(N)}</span>
          </span>
          <span className="min-w-0 flex-1 truncate text-ash">{plain(now.title)}</span>
          <span ref={deg} className="hidden shrink-0 tabular-nums text-ash-dim md:inline lg:hidden xl:inline">
            000.0°
          </span>
        </div>
      </div>
    </div>
  );
}
