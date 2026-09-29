"use client";

import { useEffect, useRef, useState } from "react";
import type { CSSProperties } from "react";
import { gsap, reduced } from "@/lib/motion";
import { identity, resume } from "@/lib/content";
import ResumePreview, { warmResumePreview } from "./ResumePreview";
import type { DiskDrive, DiskFrame, FloppyArtProps, PreviewApi } from "./ResumePreview";

/* ============================================================
   THE RESUME DISK
   The resume is a file, so it comes on a 3.5" floppy: the object that
   still means "save" to everyone who has ever clicked the icon. The whole
   disk is a link to the PDF, and clicking it reads the file: the preview
   (ResumePreview) opens straight out of the disk, with the download in
   its toolbar.

   It is built from flat layers in CSS 3D rather than a model or an image.
   A stack of six silhouettes a pixel apart gives it real thickness, so
   the edge shows when it tilts. On top sit the pieces a real disk has:
   the recessed track and the brushed metal shutter with its slot, the
   head window behind it, the embossed insert arrow, the write-protect and
   density holes, and a paper label written on by hand.

   Hover or keyboard focus lifts it off the desk and slides the shutter
   across, the way a drive does, so you can see the oxide disk turning
   inside. Clicking hands it to the preview: a copy drawn from the same
   art (FloppyArt, below) takes its place in the same pose, flies to the
   middle of the screen and ejects the disc, and the disk here stays
   hidden until that copy lands back on the exact spot it left.

   It stays a real <a href download>, so without JavaScript, or with a
   middle, Ctrl, Cmd or Shift click, or "Save link as", the browser still
   just gets the file. Only a plain click is turned into the preview.

   Every element GSAP moves is a bare wrapper that carries only layout
   classes. Tailwind's translate/rotate/scale utilities set separate CSS
   properties GSAP cannot see, and inline styles on a moved element would
   be wiped by the cleanup's clearProps.
   ============================================================ */

type Phase = "idle" | "open" | "focus" | "read";

/* The cut corner, top right. The same silhouette is reused for every
   layer of the stack so the edge lines up all the way round. */
const CHAMFER = "polygon(0 0, 95.4% 0, 100% 4.4%, 100% 100%, 0 100%)";

/* Shutter geometry, in percent of the disk (width for x, height for y).
   Closed, it covers the head window with solid metal and its own slot
   shows the plastic track underneath. Open, it has slid right by exactly
   the distance that puts its slot over the window. */
const SHUTTER_TRAVEL = (15.5 / 48) * 100; // 15.5% of the disk, in shutter widths

/* How high it lifts off the desk when hovered. */
const LIFT = 30;

/* The perspective on the link, below. The preview's copy scales it with
   its own size so the tilt reads the same at any size. */
const PERSPECTIVE = 900;

/* Thickness, front to back, 6px on a 210px disk (a real one is about
   3.3mm on 90mm). The front layers are lit plastic and each one behind is
   darker, so when the disk tilts the edge reads as a rounded, shaded side
   rather than a flat black band lost against the page. */
const LAYERS = [
  { z: -1, c: "#3a3a41" },
  { z: -2, c: "#2e2e34" },
  { z: -3, c: "#242429" },
  { z: -4, c: "#1b1b1f" },
  { z: -5, c: "#131316" },
  { z: -6, c: "#0a0a0c" },
] as const;

const RIM: CSSProperties = {
  clipPath: CHAMFER,
  /* The moulded edge: light catches the top-left lip. */
  background: "linear-gradient(150deg, #5c5c64 0%, #2e2e34 14%, #18181b 48%, #0c0c0e 100%)",
};

const BODY: CSSProperties = {
  clipPath: CHAMFER,
  background: [
    "radial-gradient(130% 85% at 12% 0%, rgba(255,255,255,0.065), transparent 55%)",
    "linear-gradient(172deg, #232327 0%, #1a1a1d 42%, #131315 100%)",
  ].join(","),
};

const SHEEN: CSSProperties = {
  clipPath: CHAMFER,
  background:
    "linear-gradient(118deg, transparent calc(var(--gx, 50%) - 34%), rgba(255,255,255,0.05) var(--gx, 50%), transparent calc(var(--gx, 50%) + 34%))",
};

/* The head window in the case, which the open shutter lines up with. */
const WINDOW: CSSProperties = { clipPath: "inset(6% 43.5% 63% 43.5% round 1px)" };

const MEDIA: CSSProperties = {
  background: [
    /* where the oxide meets the hub */
    "radial-gradient(circle, transparent 0 29.4%, rgba(0,0,0,0.7) 30%, transparent 32%)",
    /* tracks: rings too fine to count, which just give the oxide a satin
       grain rather than a flat fill */
    "repeating-radial-gradient(circle, rgba(255,238,220,0.028) 0 0.5px, transparent 0.5px 1.5px)",
    /* an uneven coating, broad and soft. It is the only thing that shows
       the disk turning: the window slowly brightens and dims as it goes */
    "conic-gradient(from 0deg, rgba(255,226,196,0.1), transparent 18%, rgba(0,0,0,0.3) 34%, transparent 50%, rgba(255,226,196,0.07) 64%, transparent 80%, rgba(255,226,196,0.1))",
    /* brown-black iron oxide */
    "radial-gradient(circle, #30261e 0%, #1f1813 48%, #130f0b 100%)",
  ].join(","),
};

/* The metal hub. Only its outer rim ever shows, at the foot of the
   window, down inside the case where little light reaches, so it is kept
   to shadowed steel: bright enough to read as metal, never so bright it
   looks like the end of a tube. The conic sheen turns with it. */
const HUB: CSSProperties = {
  background: [
    "conic-gradient(from 20deg, rgba(255,255,255,0.22), transparent 22%, rgba(0,0,0,0.3) 40%, transparent 58%, rgba(255,255,255,0.18) 76%, transparent 90%, rgba(255,255,255,0.22))",
    "radial-gradient(circle, #0a0a0b 0 22%, #3b3d42 23%, #62656c 60%, #8b8e95 86%, #55575d 93%, #19191c 98%)",
  ].join(","),
};

/* What the preview's copy shows in the window once it is in the air: the
   disc inside is a silver one, and the rainbow on it is the first hint of
   what is about to come out. */
const SILVER: CSSProperties = {
  opacity: 0,
  background: [
    "conic-gradient(from 210deg, transparent 0 4%, rgba(185,140,255,0.55) 9%, rgba(110,190,255,0.55) 14%, rgba(120,255,190,0.5) 19%, rgba(255,232,110,0.55) 24%, rgba(255,120,160,0.45) 29%, transparent 35% 54%, rgba(255,255,255,0.5) 57%, transparent 61%)",
    "radial-gradient(circle, #121215 0 13%, #c9ccd3 14.5%, #8c9098 34%, #5d6068 70%, #4a4d54 100%)",
  ].join(","),
};

/* Light lying across the oxide: a flat surface catches it as one diagonal
   band, which stays put while the disk turns under it and drifts a little
   with the tilt. */
const GLINT: CSSProperties = {
  background:
    "linear-gradient(162deg, transparent calc(var(--gx, 50%) * 0.4 + 2%), rgba(255,236,214,0.09) calc(var(--gx, 50%) * 0.4 + 9%), transparent calc(var(--gx, 50%) * 0.4 + 17%))",
};

const PLATE: CSSProperties = {
  /* evenodd punches the slot out of the plate, so whatever is under it,
     plastic or oxide, really shows through. */
  clipPath:
    "polygon(evenodd, 0 0, 100% 0, 100% 100%, 0 100%, 0 0, 12.5% 14.8%, 39.58% 14.8%, 39.58% 91.4%, 12.5% 91.4%, 12.5% 14.8%)",
  background: [
    /* specular band that follows the tilt */
    "linear-gradient(100deg, transparent calc(var(--gx, 50%) - 24%), rgba(255,255,255,0.5) var(--gx, 50%), transparent calc(var(--gx, 50%) + 24%))",
    /* brushed grain */
    "repeating-linear-gradient(180deg, rgba(255,255,255,0.07) 0 1px, rgba(0,0,0,0.045) 1px 2px)",
    /* the fold where the plate wraps over the top edge */
    "linear-gradient(180deg, #ffffff 0, #f1f2f4 2.5%, #7d8088 4.2%, transparent 7%)",
    "linear-gradient(180deg, #dcdee2 0%, #b4b7bd 30%, #9b9ea5 56%, #b9bcc2 82%, #d2d4d8 100%)",
  ].join(","),
};

const TRACK: CSSProperties = {
  background: "linear-gradient(180deg, #0c0c0e, #121214 70%, #151517)",
};

const ARROW: CSSProperties = { clipPath: "polygon(50% 0, 100% 100%, 0 100%)" };

const PAPER: CSSProperties = {
  background: [
    "linear-gradient(180deg, rgba(255,255,255,0.45), transparent 26%)",
    "radial-gradient(120% 90% at 80% 110%, rgba(120,100,60,0.08), transparent 60%)",
    "linear-gradient(180deg, #efeee6, #e5e2d6)",
  ].join(","),
};

const RULES: CSSProperties = {
  background:
    "repeating-linear-gradient(180deg, transparent 0, transparent calc(33.333% - 1px), rgba(60,86,150,0.2) calc(33.333% - 1px), rgba(60,86,150,0.2) 33.333%)",
};

/* Flat printed vinyl, not a bead: the colour is even, with only a faint
   sheen and a slightly darker rim where it has been pressed down. */
const STICKER: CSSProperties = {
  background: [
    "linear-gradient(150deg, rgba(255,255,255,0.18), transparent 55%)",
    "radial-gradient(circle, #e0895a 0 84%, #c47547 92%, #e0895a 100%)",
  ].join(","),
};

/* Blue-black ballpoint. */
const INK = "#1f2a5c";

/* The face and every layer of the stack read their opacity from --fo, so
   the preview's copy can fade the whole disk without flattening it (an
   opacity on the 3D wrapper itself would squash the stack into one
   plane). Depth is in units of --d, which the copy scales with its size.
   On the page neither is set, so both fall back to plain values. */
const FADE = "var(--fo, 1)";

/* ---- the art ----------------------------------------------------------
   One set of markup for both disks: the one on the page and the copy the
   preview flies to the middle of the screen, so the copy is the same
   object down to the handwriting. */
function FloppyArt({ faceRef, shutterRef, discRef, mediaRef }: FloppyArtProps) {
  const pages = `${resume.pages} page${resume.pages === 1 ? "" : "s"}`;
  return (
    <>
      {LAYERS.map((l) => (
        <span
          key={l.z}
          className="absolute inset-0 block rounded-[2.4%]"
          style={{
            clipPath: CHAMFER,
            background: l.c,
            opacity: FADE,
            transform: `translateZ(calc(var(--d, 1px) * ${l.z}))`,
          }}
        />
      ))}

      {/* ---- the face -------------------------------------------- */}
      <span ref={faceRef} className="@container absolute inset-0 block" style={{ opacity: FADE }}>
        <span className="absolute inset-0 block rounded-[2.4%]" style={RIM} />
        <span className="absolute inset-[1.5px] block rounded-[2.2%]" style={BODY} />

        {/* The track the shutter slides in, a step below the face. */}
        <span
          className="absolute left-[19.5%] right-[10.5%] top-0 block h-[43%] rounded-b-[2px] shadow-[inset_0_1px_2px_rgba(0,0,0,0.85),inset_0_-1px_0_rgba(255,255,255,0.06),0_1px_0_rgba(255,255,255,0.05)]"
          style={TRACK}
        />

        {/* The head window, and the disk turning behind it. */}
        <span className="absolute inset-0 block" style={WINDOW}>
          <span className="absolute inset-0 block bg-[#0a0807]" />
          <span
            ref={discRef}
            className="absolute left-[4%] top-[calc(47%-46cqw)] block aspect-square w-[92%] rounded-full"
          >
            <span className="absolute inset-0 block rounded-full" style={MEDIA} />
            <span
              className="absolute left-1/2 top-1/2 block h-[30%] w-[30%] -translate-x-1/2 -translate-y-1/2 rounded-full"
              style={HUB}
            />
            {mediaRef && <span ref={mediaRef} className="absolute inset-0 block rounded-full" style={SILVER} />}
          </span>
          <span className="absolute inset-0 block" style={GLINT} />
        </span>
        <span className="absolute bottom-[63%] left-[43.5%] right-[43.5%] top-[6%] block rounded-[1px] shadow-[inset_0_2px_3px_rgba(0,0,0,0.95),inset_0_0_0_1px_rgba(0,0,0,0.7)]" />

        <span
          ref={shutterRef}
          className="absolute left-[22%] top-0 block h-[40.5%] w-[48%] rounded-b-[2px] shadow-[0_1px_1.5px_rgba(0,0,0,0.75)]"
        >
          <span className="absolute inset-0 block rounded-b-[2px]" style={PLATE} />
          {/* The slot's pressed edge: dark outline, a lit lower lip,
              and the shadow the metal casts down into the hole. */}
          <span className="absolute left-[12.5%] top-[14.8%] block h-[76.6%] w-[27.08%] rounded-[1px] shadow-[inset_0_1px_1.5px_rgba(0,0,0,0.8),0_0_0_0.5px_rgba(58,60,66,0.9),0_1px_0_0.5px_rgba(255,255,255,0.4)]" />
          <span className="absolute bottom-[12%] right-[9%] block font-mono text-[3.4cqw] font-bold leading-none tracking-[0.06em] text-black/25 [text-shadow:0_0.5px_0_rgba(255,255,255,0.5)]">
            HD
          </span>
        </span>

        {/* Embossed insert arrow, top left. */}
        <span className="absolute left-[7.2%] top-[6%] block h-[5.2%] w-[6.4%] bg-black/70" style={ARROW} />
        <span
          className="absolute left-[7.2%] top-[5.4%] block h-[5.2%] w-[6.4%] bg-[linear-gradient(180deg,#45454c,#222226)]"
          style={ARROW}
        />

        {/* Write-protect hole, slider across it, and the density hole. */}
        <span className="absolute left-[3.8%] top-[87.4%] block aspect-square w-[6.2%] rounded-[1.5px] bg-[#030304] shadow-[inset_0_1px_2px_rgba(0,0,0,1),0_1px_0_rgba(255,255,255,0.07)]">
          <span className="absolute inset-x-[14%] bottom-[12%] block h-[44%] rounded-[1px] bg-[#26262b] shadow-[inset_0_1px_0_rgba(255,255,255,0.1)]" />
        </span>
        <span className="absolute right-[3.8%] top-[87.4%] block aspect-square w-[6.2%] rounded-[1.5px] bg-[#030304] shadow-[inset_0_1px_2px_rgba(0,0,0,1),0_1px_0_rgba(255,255,255,0.07)]" />

        {/* The label area is moulded a step down; the paper sits in it. */}
        <span className="absolute bottom-0 left-[11%] right-[11%] top-[47%] block rounded-t-[3px] bg-[#141417] shadow-[inset_0_1px_1.5px_rgba(0,0,0,0.75),0_-1px_0_rgba(255,255,255,0.05)]" />
        <span
          className="absolute bottom-[2.6%] left-[12.8%] right-[12.8%] top-[49%] block rounded-[2px] shadow-[0_1px_1px_rgba(0,0,0,0.55)]"
          style={PAPER}
        >
          <span className="absolute inset-x-[6%] bottom-[20%] top-[31%] block" style={RULES} />
          <span className="absolute left-[7%] right-[26%] top-[8%] block whitespace-nowrap font-mono text-[3.2cqw] uppercase leading-none tracking-[0.08em] text-[#55565e]">
            PDF · {resume.size} · {pages}
          </span>
          <span
            className="font-serif italic absolute left-[8%] top-[27%] block origin-left -rotate-[4deg] whitespace-nowrap text-[10.5cqw] leading-none"
            style={{ color: INK }}
          >
            {identity.fullName}
          </span>
          <span
            className="font-serif italic absolute left-[24%] top-[52%] block origin-left -rotate-[2.5deg] whitespace-nowrap text-[11.5cqw] leading-none"
            style={{ color: INK }}
          >
            Resume
            <svg
              viewBox="0 0 60 8"
              fill="none"
              className="absolute -bottom-[0.18em] left-[-4%] h-[0.3em] w-[108%]"
              focusable={false}
            >
              <path
                d="M1.5 5.2C14 3.4 30 2.6 58.5 3.4"
                stroke={INK}
                strokeWidth="1.1"
                strokeLinecap="round"
                opacity="0.8"
              />
            </svg>
          </span>
          <span className="absolute bottom-[7%] left-[7%] block whitespace-nowrap font-mono text-[2.9cqw] uppercase leading-none tracking-[0.08em] text-[#6c6d74]">
            Updated {resume.updated}
          </span>
          {/* A colour-coding dot, stuck on a little crooked. */}
          <span
            className="absolute right-[6%] top-[-5%] block h-[8cqw] w-[8cqw] rounded-full shadow-[0_0.5px_0.5px_rgba(0,0,0,0.35)]"
            style={STICKER}
          />
        </span>

        <span className="pointer-events-none absolute inset-0 block rounded-[2.4%]" style={SHEEN} />
      </span>
    </>
  );
}

export default function ResumeDisk({
  className = "",
  diskClassName = "",
}: {
  /* Where the disk and its hint sit. */
  className?: string;
  /* The angle it lies at. Only the disk turns, so the hint under it stays
     level and reads as interface rather than as part of the object. */
  diskClassName?: string;
}) {
  const frame = useRef<HTMLDivElement>(null);
  const turn = useRef<HTMLDivElement>(null);
  const link = useRef<HTMLAnchorElement>(null);
  const flip = useRef<HTMLSpanElement>(null);
  const tilt = useRef<HTMLSpanElement>(null);
  const face = useRef<HTMLSpanElement>(null);
  const shutter = useRef<HTMLSpanElement>(null);
  const disc = useRef<HTMLSpanElement>(null);
  const near = useRef<HTMLSpanElement>(null);
  const far = useRef<HTMLSpanElement>(null);
  const drive = useRef<DiskDrive | null>(null);
  const preview = useRef<PreviewApi | null>(null);
  const [phase, setPhase] = useState<Phase>("idle");

  /* The preview's page is fetched in idle time once the disk comes near
     the screen. A phone has no hover to start it early, and the press
     alone comes too late for a slow connection. Once only, and not at all
     when the visitor has asked the browser to save data. */
  useEffect(() => {
    const a = link.current;
    const conn = (navigator as Navigator & { connection?: { saveData?: boolean } }).connection;
    if (!a || conn?.saveData || typeof IntersectionObserver === "undefined") return;
    let idle = 0;
    let timer = 0;
    const io = new IntersectionObserver(
      (entries) => {
        if (!entries.some((e) => e.isIntersecting)) return;
        io.disconnect();
        const go = () => void warmResumePreview();
        if (typeof window.requestIdleCallback === "function") idle = window.requestIdleCallback(go, { timeout: 2500 });
        else timer = window.setTimeout(go, 800);
      },
      { rootMargin: "600px 0px" }
    );
    io.observe(a);
    return () => {
      io.disconnect();
      if (idle) window.cancelIdleCallback(idle);
      window.clearTimeout(timer);
    };
  }, []);

  useEffect(() => {
    const frameEl = frame.current;
    const turnEl = turn.current;
    const a = link.current;
    const flipEl = flip.current;
    const tiltEl = tilt.current;
    const faceEl = face.current;
    const shutterEl = shutter.current;
    const discEl = disc.current;
    const nearEl = near.current;
    const farEl = far.current;
    if (!frameEl || !turnEl || !a || !flipEl || !tiltEl || !faceEl || !shutterEl || !discEl || !nearEl || !farEl) {
      return;
    }

    /* Motion off: nothing moves, but the shutter still answers hover and
       focus, instantly, because it is how the disk says "this is live".
       Reduced-motion from the OS is not "off": it gets all of this. */
    const still = reduced();
    const fine = window.matchMedia("(hover: hover) and (pointer: fine)").matches;
    const MAX = 14;

    let hovering = false;
    let focused = false;
    let pressed = false;
    /* Lent to the preview: its copy is out in the room, this one is
       hidden and does not answer the pointer until it comes back. */
    let lent = false;
    let open = false;

    /* ---- arriving ------------------------------------------------------
       It drops onto the desk: tipped back on its bottom edge, it falls
       flat as it scrolls in, and its shadow arrives as it lands. */
    const ctx = gsap.context(() => {
      if (still) return;
      gsap
        .timeline({ scrollTrigger: { trigger: a, start: "top 92%" } })
        .fromTo(
          flipEl,
          { rotationX: 72, y: -28, opacity: 0, transformOrigin: "50% 100%" },
          { rotationX: 0, y: 0, opacity: 1, duration: 1.2, ease: "expo.out" },
          0
        )
        .fromTo(
          [nearEl, farEl],
          { opacity: 0 },
          { opacity: (i: number) => (i === 0 ? 1 : 0.55), duration: 0.9, ease: "power2.out" },
          0.2
        );
    }, frameEl);

    /* ---- the disk inside -------------------------------------------------
       Always "running" but at timeScale 0 until the shutter opens, so it
       can spin up and wind down like a drive motor instead of starting
       and stopping dead. */
    const spin = still ? null : gsap.to(discEl, { rotation: 360, duration: 8, ease: "none", repeat: -1, paused: true });
    spin?.timeScale(0);
    /* Once it has wound all the way down it is paused as well, so a disk
       nobody is touching is not still being rendered every frame at zero
       speed. A new spin-up cancels the pending pause via overwrite. */
    const spinTo = (v: number, d: number) => {
      if (!spin) return;
      if (v > 0) spin.resume();
      gsap.to(spin, {
        timeScale: v,
        duration: d,
        ease: "power2.inOut",
        overwrite: true,
        onComplete: v > 0 ? undefined : () => void spin.pause(),
      });
    };

    /* ---- open and closed -------------------------------------------- */
    const setOpen = (next: boolean) => {
      if (next === open) return;
      open = next;
      if (still) {
        gsap.set(shutterEl, { xPercent: next ? SHUTTER_TRAVEL : 0 });
        return;
      }
      /* Driven open, sprung shut: the close is quicker than the open. */
      gsap.to(
        shutterEl,
        next
          ? { xPercent: SHUTTER_TRAVEL, duration: 0.55, ease: "power2.inOut", overwrite: "auto" }
          : { xPercent: 0, duration: 0.3, ease: "power3.out", overwrite: "auto" }
      );
      gsap.to(tiltEl, { z: next ? LIFT : 0, duration: 0.6, ease: "power3.out", overwrite: "auto" });
      /* Lifting off, the tight contact shadow gives way to a wider, softer
         one further below it. */
      gsap.to(nearEl, { opacity: next ? 0.25 : 1, duration: 0.5, ease: "power2.out", overwrite: "auto" });
      gsap.to(farEl, {
        opacity: next ? 1 : 0.55,
        y: next ? 20 : 0,
        scale: next ? 1.08 : 1,
        duration: 0.6,
        ease: "power3.out",
        overwrite: "auto",
      });
      spinTo(next ? 1 : 0, next ? 1.2 : 0.7);
    };

    const sync = () => {
      if (lent) {
        setPhase("read");
        return;
      }
      setOpen(hovering || focused);
      setPhase(hovering ? "open" : focused ? "focus" : "idle");
    };

    /* ---- tilt toward the pointer -------------------------------------
       Smoothed through a proxy so the transform, the shadow and the metal
       glint all read the same eased value on the same frame. */
    const proxy = { rx: 0, ry: 0 };
    const setRX = gsap.quickSetter(tiltEl, "rotationX", "deg") as (v: number) => void;
    const setRY = gsap.quickSetter(tiltEl, "rotationY", "deg") as (v: number) => void;
    const setShadowX = gsap.quickSetter(farEl, "x", "px") as (v: number) => void;
    const apply = () => {
      setRX(proxy.rx);
      setRY(proxy.ry);
      setShadowX(-proxy.ry * 0.8);
      faceEl.style.setProperty("--gx", `${(50 + proxy.ry * 2.8 + proxy.rx * 0.8).toFixed(2)}%`);
    };
    const toRX = gsap.quickTo(proxy, "rx", { duration: 0.8, ease: "power3.out", onUpdate: apply });
    const toRY = gsap.quickTo(proxy, "ry", { duration: 0.8, ease: "power3.out", onUpdate: apply });

    /* Whether the pointer is close enough to be tilting it. */
    let engaged = false;
    const settle = () => {
      engaged = false;
      toRX(0);
      toRY(0);
    };

    /* The parent lays the disk down at an angle. Reading it back means the
       pointer maths works in the disk's own axes, so "right" is always its
       right edge, whatever angle it was dropped at. */
    let angle = 0;
    const readAngle = () => {
      const deg = parseFloat(getComputedStyle(turnEl).rotate);
      angle = Number.isFinite(deg) ? (deg * Math.PI) / 180 : 0;
    };

    const onMove = (e: PointerEvent) => {
      if (e.pointerType === "touch" || lent) return;
      const r = a.getBoundingClientRect();
      const gx = e.clientX - (r.left + r.width / 2);
      const gy = e.clientY - (r.top + r.height / 2);
      const c = Math.cos(angle);
      const s = Math.sin(angle);
      const dx = gx * c + gy * s;
      const dy = -gx * s + gy * c;
      const size = a.offsetWidth;
      /* Full strength within a disk's width of its centre, fading to
         nothing at a bit over twice that, so it notices you coming. */
      const pull = gsap.utils.clamp(0, 1, (size * 2.2 - Math.hypot(dx, dy)) / (size * 1.2));
      /* Out of range: settle once, then leave the tweens alone. Feeding
         them zero on every move elsewhere on the page would keep them
         restarting and rewriting the transform and glint each frame. */
      if (pull === 0) {
        if (engaged) settle();
        return;
      }
      engaged = true;
      toRY(gsap.utils.clamp(-1, 1, dx / (size * 0.6)) * MAX * pull);
      toRX(gsap.utils.clamp(-1, 1, -dy / (size * 0.6)) * MAX * pull);
    };

    /* No related target means the pointer left the window altogether. */
    const onOut = (e: PointerEvent) => {
      if (e.relatedTarget === null) settle();
    };

    /* The window-wide listener only exists while the disk is on screen. */
    let listening = false;
    const listen = (on: boolean) => {
      if (on === listening) return;
      listening = on;
      if (on) {
        readAngle();
        window.addEventListener("pointermove", onMove, { passive: true });
        window.addEventListener("pointerout", onOut, { passive: true });
      } else {
        window.removeEventListener("pointermove", onMove);
        window.removeEventListener("pointerout", onOut);
      }
    };

    let io: IntersectionObserver | undefined;
    if (!still && fine && typeof IntersectionObserver !== "undefined") {
      io = new IntersectionObserver(
        (entries) => {
          const vis = entries[entries.length - 1].isIntersecting;
          listen(vis);
          if (!vis) settle();
        },
        { rootMargin: "160px" }
      );
      io.observe(a);
      window.addEventListener("resize", readAngle, { passive: true });
    }

    /* ---- lent to the preview ---------------------------------------------
       Where the disk is and exactly how it is posed, so the preview's copy
       can take its place without a jump: lifted, tilted, squashed by the
       press, shutter half open, whatever it was doing at the click. The
       link's box is not moved by the tilt inside it, so its centre is the
       disk's centre at any angle. */
    const num = (el: Element, p: string) => {
      const v = Number(gsap.getProperty(el, p));
      return Number.isFinite(v) ? v : 0;
    };
    const frameOf = (): DiskFrame => {
      readAngle();
      const r = a.getBoundingClientRect();
      return {
        cx: r.left + r.width / 2,
        cy: r.top + r.height / 2,
        w: a.offsetWidth,
        h: a.offsetHeight,
        angle,
        perspective: PERSPECTIVE,
        lift: num(tiltEl, "z"),
        rx: num(tiltEl, "rotationX"),
        ry: num(tiltEl, "rotationY"),
        sx: num(tiltEl, "scaleX") || 1,
        sy: num(tiltEl, "scaleY") || 1,
        shutter: num(shutterEl, "xPercent"),
        travel: SHUTTER_TRAVEL,
        spin: num(discEl, "rotation"),
        gx: faceEl.style.getPropertyValue("--gx"),
        near: num(nearEl, "opacity"),
        far: { o: num(farEl, "opacity"), x: num(farEl, "x"), y: num(farEl, "y"), s: num(farEl, "scale") || 1 },
      };
    };

    /* Hidden while the copy is out, and put back to rest, which is the
       pose the copy lands in: flat on the desk, shutter shut. When it
       comes back it picks up hover and focus from wherever they are now,
       and opens again from rest if it should. */
    const hide = (on: boolean) => {
      const v = on ? "hidden" : "";
      flipEl.style.visibility = v;
      nearEl.style.visibility = v;
      farEl.style.visibility = v;
    };
    const lend = (on: boolean) => {
      if (on) {
        if (lent) return;
        lent = true;
        hide(true);
        pressed = false;
        engaged = false;
        gsap.killTweensOf([tiltEl, shutterEl, nearEl, farEl]);
        toRX(0);
        toRY(0);
        toRX.tween.progress(1);
        toRY.tween.progress(1);
        proxy.rx = 0;
        proxy.ry = 0;
        apply();
        gsap.set(tiltEl, { z: 0, scaleX: 1, scaleY: 1 });
        gsap.set(shutterEl, { xPercent: 0 });
        gsap.set(nearEl, { opacity: 1 });
        gsap.set(farEl, { opacity: 0.55, x: 0, y: 0, scale: 1 });
        open = false;
        if (spin) {
          gsap.killTweensOf(spin);
          spin.timeScale(0);
          spin.pause();
        }
        sync();
        return;
      }
      if (!lent) return;
      lent = false;
      hide(false);
      /* The pointer and focus may have moved on while the preview was
         open, and no enter or leave arrived for the page underneath. */
      hovering = fine && a.matches(":hover");
      focused = a.matches(":focus-visible");
      sync();
    };

    drive.current = { frame: frameOf, lend };

    /* ---- hover, focus, press, click ------------------------------------
       Touch has no hover, so touch pointers never open it by hovering; a
       tap goes straight to the preview. */
    const onEnter = (e: PointerEvent) => {
      void warmResumePreview();
      if (e.pointerType === "touch") return;
      hovering = true;
      sync();
    };
    const release = () => {
      if (!pressed) return;
      pressed = false;
      if (!still && !lent) gsap.to(tiltEl, { scaleX: 1, scaleY: 1, duration: 0.5, ease: "back.out(3)", overwrite: "auto" });
    };
    const onLeave = (e: PointerEvent) => {
      release();
      if (e.pointerType === "touch") return;
      hovering = false;
      sync();
    };
    /* Primary button only. A right click opens the context menu ("Save
       link as" is a fair way to get the file too), which swallows the
       pointerup, so the disk would stay squashed until the pointer left. */
    const onDown = (e: PointerEvent) => {
      if (e.button !== 0 || lent) return;
      void warmResumePreview();
      pressed = true;
      if (!still) gsap.to(tiltEl, { scaleX: 0.975, scaleY: 0.955, duration: 0.14, ease: "power2.out", overwrite: "auto" });
    };
    /* Only keyboard focus opens it. A mouse click focuses the link too,
       and the shutter would then stay open after the pointer had gone. */
    const onFocus = () => {
      void warmResumePreview();
      focused = a.matches(":focus-visible");
      sync();
    };
    const onBlur = () => {
      focused = false;
      sync();
    };
    /* A plain click (or Enter) opens the preview. Anything with a
       modifier keeps the browser's own meaning, and if the preview is
       somehow not there the link simply downloads. */
    const onClick = (e: MouseEvent) => {
      if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
      const p = preview.current;
      if (!p) return;
      e.preventDefault();
      p.open(a);
    };

    a.addEventListener("pointerenter", onEnter);
    a.addEventListener("pointerleave", onLeave);
    a.addEventListener("pointerdown", onDown);
    a.addEventListener("pointerup", release);
    a.addEventListener("pointercancel", release);
    a.addEventListener("focus", onFocus);
    a.addEventListener("blur", onBlur);
    a.addEventListener("click", onClick);

    return () => {
      io?.disconnect();
      listen(false);
      window.removeEventListener("resize", readAngle);
      a.removeEventListener("pointerenter", onEnter);
      a.removeEventListener("pointerleave", onLeave);
      a.removeEventListener("pointerdown", onDown);
      a.removeEventListener("pointerup", release);
      a.removeEventListener("pointercancel", release);
      a.removeEventListener("focus", onFocus);
      a.removeEventListener("blur", onBlur);
      a.removeEventListener("click", onClick);
      drive.current = null;
      ctx.revert();
      if (spin) {
        gsap.killTweensOf(spin);
        spin.kill();
      }
      gsap.killTweensOf([tiltEl, shutterEl, nearEl, farEl, proxy]);
      gsap.set([flipEl, tiltEl, shutterEl, discEl, nearEl, farEl], { clearProps: "all" });
      hide(false);
      faceEl.style.removeProperty("--gx");
      setPhase("idle");
    };
  }, []);

  return (
    <div ref={frame} className={`relative flex w-fit flex-col items-center ${className}`}>
      <div ref={turn} className={diskClassName}>
        <a
          ref={link}
          href={resume.href}
          download={resume.fileName}
          type="application/pdf"
          data-cursor="PREVIEW"
          aria-haspopup="dialog"
          draggable={false}
          className="relative block aspect-[90/94] w-40 select-none rounded-[6px] outline-offset-[6px] [-webkit-tap-highlight-color:transparent] [perspective:900px] sm:w-44 lg:w-[210px]"
        >
          {/* The link's name, as text rather than an aria-label, so the
              parts about the preview can step aside without scripts
              (data-js-only), when the disk is a plain download. */}
          <span className="sr-only">
            <span data-js-only>Preview </span>
            {`${identity.fullName}'s resume, PDF, ${resume.size}.`}
            <span data-js-only> Opens a preview you can download from.</span>
          </span>
          {/* Shadows on the desk. They stay flat while the disk moves above
              them: a tight dark one where it touches, a wide soft one that
              takes over as it lifts. */}
          <span
            ref={near}
            aria-hidden
            className="pointer-events-none absolute inset-x-[3%] bottom-[-2.5%] top-[5%] rounded-[5%] bg-black/80 blur-[5px]"
          />
          <span
            ref={far}
            aria-hidden
            className="pointer-events-none absolute inset-x-[1%] bottom-[-7%] top-[10%] rounded-[8%] bg-black/70 opacity-[0.55] blur-[18px]"
          />

          <span ref={flip} aria-hidden className="absolute inset-0 block [transform-style:preserve-3d]">
            <span ref={tilt} className="absolute inset-0 block will-change-transform [transform-style:preserve-3d]">
              <FloppyArt faceRef={face} shutterRef={shutter} discRef={disc} />
            </span>
          </span>
        </a>
      </div>

      {/* The hint under the disk. Hover-only on a mouse; always shown on
          touch, where there is no hover to reveal it. While the preview
          has the disk the hint steps out of the way. Without scripts the
          disk is a plain download, so there is no preview to promise. */}
      <span
        aria-hidden
        data-js-only
        data-phase={phase === "idle" || phase === "read" ? undefined : phase}
        className={`t-mono relative mt-6 flex h-4 [@media(hover:hover)]:mt-10 items-center gap-2 whitespace-nowrap text-[10px] text-ash opacity-0 transition-opacity duration-300 data-[phase]:opacity-100 ${
          phase === "read" ? "" : "[@media(hover:none)]:opacity-100"
        }`}
      >
        {/* An eye: it opens for a look first, the download is inside. */}
        <svg width="11" height="9" viewBox="0 0 12 10" fill="none" className="text-acid" focusable={false}>
          <path
            d="M1 5s1.9-3.4 5-3.4S11 5 11 5 9.1 8.4 6 8.4 1 5 1 5Z"
            stroke="currentColor"
            strokeWidth="1.3"
            strokeLinejoin="round"
          />
          <circle cx="6" cy="5" r="1.45" fill="currentColor" />
        </svg>
        <span>
          {phase === "focus" ? (
            "Press Enter to preview"
          ) : (
            <>
              <span className="[@media(hover:hover)]:hidden">Tap to preview</span>
              <span className="hidden [@media(hover:hover)]:inline">Click to preview</span>
            </>
          )}
        </span>
      </span>

      {/* Mounted once, here, because the disk is always on the page. It
          renders nothing until it opens, then portals into <body>. */}
      <ResumePreview drive={drive} api={preview} Art={FloppyArt} />
    </div>
  );
}
