"use client";

import { useCallback, useEffect, useId, useImperativeHandle, useLayoutEffect, useRef, useState } from "react";
import type { ComponentType, CSSProperties, MouseEvent as ReactMouseEvent, Ref, RefObject } from "react";
import { createPortal } from "react-dom";
import { gsap, reduced } from "@/lib/motion";
import { identity, resume } from "@/lib/content";

/* ============================================================
   RESUME PREVIEW
   What opens when someone clicks the floppy (or the file in the chat):
   the resume as a sheet of paper, big enough to read, with the download
   one click away. A PDF cannot be shown inside the page here (the CSP
   blocks frames, and phone browsers do not render PDFs in frames anyway),
   so the page is a picture of the PDF, rendered once with pdf.js and
   committed as /resume-preview.webp. Replace it whenever the PDF changes.

   Opening from the disk is the disc coming out of its case. A copy of
   the floppy, drawn from the same art, lifts off the desk in exactly the
   pose the real one was in and flies into a pool of light in the middle
   of the room, which dims and blurs around it. Its shutter slides open
   and a silver disc slides up out of it like a tray ejecting, while the
   empty case drops away. The disc turns to face you and spins up, a
   ring counts the file in, and when the page is ready the disc turns
   edge-on and the resume swings out of it folded in three, unfolds, and
   settles into the page you read. Closing folds it back into the disc,
   the disc back into the floppy, and the floppy flies home, shutting its
   shutter on the way. From the chat the file card simply grows into the
   page, like opening an attachment on a phone.

   The OS reduced-motion setting does not shorten any of this: that
   setting is on for many people who never asked for it (see
   lib/motion.ts), and the opening is a user-started sequence, not motion
   that moves the page under anyone.

   The dialog is not a <dialog>: showModal() puts it in the browser's top
   layer, above the custom cursor, and the visitor would be left with no
   pointer at all. It is a fixed layer between the nav (z-50) and the
   cursor (z-70). Everything else on the page is made inert while it is
   open, the smooth scroll is stopped and the page scroll locked.

   Every moving part is driven from one plain object of numbers, and one
   write() turns those numbers into styles. Opening, closing, skipping
   and closing half way through opening are then all just tweens of the
   same numbers, from wherever they happen to be.
   ============================================================ */

/* The window event the chat's file card sends. detail: { rect: { x, y,
   width, height } } in viewport pixels, the card's box. The preview
   calls preventDefault() on it when it opens, so the sender can tell
   nobody was listening and let its link download the file instead. */
export const PREVIEW_EVENT = "resume:preview";

const PREVIEW = { src: "/resume-preview.webp", width: 1800, height: 2546 } as const;

/* Where the floppy is on the page and exactly how it is posed, read at
   the click, so the preview's copy can take its place without a jump. */
export type DiskFrame = {
  /* Centre of the disk on screen, and its laid-out size. */
  cx: number;
  cy: number;
  w: number;
  h: number;
  /* The angle it lies at on the desk, in radians. */
  angle: number;
  /* The perspective it is drawn with, in page pixels. */
  perspective: number;
  /* Its pose: lift toward the viewer (px), tilt (deg), press squash. */
  lift: number;
  rx: number;
  ry: number;
  sx: number;
  sy: number;
  /* The shutter now and fully open, in percent of the shutter's width. */
  shutter: number;
  travel: number;
  /* How far the oxide disk inside has turned, in degrees. */
  spin: number;
  /* Where the light sits on the face (a CSS length, "" for the middle). */
  gx: string;
  /* Its shadows on the desk. */
  near: number;
  far: { o: number; x: number; y: number; s: number };
};

/* What the floppy lets the preview do to it. */
export type DiskDrive = {
  frame: () => DiskFrame;
  /* true: hide it while the copy is out. false: put it back, at rest. */
  lend: (on: boolean) => void;
};

/* The floppy's artwork, shared with ResumeDisk so the copy that flies is
   the same object. mediaRef, when given, adds the silver disc the copy
   shows through its head window. */
export type FloppyArtProps = {
  faceRef?: Ref<HTMLSpanElement>;
  shutterRef?: Ref<HTMLSpanElement>;
  discRef?: Ref<HTMLSpanElement>;
  mediaRef?: Ref<HTMLSpanElement>;
};

export type PreviewApi = { open: (opener: HTMLElement) => boolean };

type Rect = { x: number; y: number; width: number; height: number };
type Origin = { kind: "disk"; frame: DiskFrame } | { kind: "card"; rect: Rect } | { kind: "none" };
type Session = { id: number; origin: Origin; opener: HTMLElement | null };
type Phase = "opening" | "open" | "closing";
type Mode = "still" | "plain" | "disk" | "card";
type LenisLike = { stop: () => void; start: () => void; isStopped?: boolean };

const useIso = typeof window !== "undefined" ? useLayoutEffect : useEffect;

/* Keys that scroll. The page's smooth scroll listens for them on window
   and cancels them, so inside the preview they stop short of it. */
const SCROLL_KEYS = new Set(["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight", "PageUp", "PageDown", "Home", "End", " "]);

const FOCUSABLE = 'a[href], button:not([disabled]), [tabindex]:not([tabindex="-1"])';

/* The sheet's width. Fitted, it is as tall as the space between the
   bars allows (0.707 is the page's width over its height), and on a
   phone as wide as the screen. A phone on its side has so little height
   that a whole page would be a stamp, so there it takes the width and
   scrolls instead. Zoomed, it is wide enough to read the body text
   comfortably, which on a phone means panning sideways.
   Widths are in cqw, the scroller's own width, not vw: where scrollbars
   take up room (Windows) its gutters are not part of 100vw, and a sheet
   sized to the window would overflow sideways. The height budget is the
   bars' padding plus the caption line under the page, so a fitted page
   never leaves a pixel to scroll. */
const FIT_W =
  "w-[min(calc(100cqw_-_1.5rem),calc((100svh_-_11.25rem_-_env(safe-area-inset-bottom))*0.707))] md:w-[min(calc(100cqw_-_4rem),calc((100svh_-_8.75rem)*0.707))] [@media(max-height:520px)_and_(min-width:640px)]:w-[min(calc(100cqw_-_4rem),44rem)]";
const ZOOM_W = "w-[max(760px,min(1240px,calc(100cqw_-_6rem)))]";

const pages = `${resume.pages} page${resume.pages === 1 ? "" : "s"}`;
const ALT = `Preview of ${identity.fullName}'s ${resume.pages === 1 ? "one" : resume.pages}-page resume`;

/* The readout counts the file in using the size printed on the label. */
const SIZE = (() => {
  const m = /^\s*([\d.]+)\s*([a-z]+)\s*$/i.exec(resume.size);
  const n = m ? parseFloat(m[1]) : NaN;
  return m && Number.isFinite(n) && n > 0 ? { total: n, unit: m[2].toUpperCase() } : null;
})();
const counter = (k: number) =>
  SIZE
    ? `${String(Math.round(k * SIZE.total)).padStart(String(Math.round(SIZE.total)).length, "0")} / ${SIZE.total} ${SIZE.unit}`
    : `${Math.round(k * 100)}%`;

/* The page's own shadow, shared by the sheet and the folded copy of it
   so nothing changes when one hands over to the other. */
const PAGE_SHADOW = "shadow-[0_1px_2px_rgba(0,0,0,0.3),0_34px_90px_-28px_rgba(0,0,0,0.95),0_14px_34px_-18px_rgba(0,0,0,0.6)]";

/* ---- the disc -----------------------------------------------------------
   A recordable DVD seen from its data side in a dark room. Radii follow a
   real one (percent of its radius): the 15mm hole, the clear clamping
   ring with its stacking ridge, a bright mirror band, then the data area,
   which reflects the dark room as gunmetal and only lights up where the
   light catches it, as a white streak with a rainbow beside it. */
const DISC_HOLE: CSSProperties = {
  maskImage: "radial-gradient(circle closest-side, transparent 12.3%, #000 12.9%)",
  WebkitMaskImage: "radial-gradient(circle closest-side, transparent 12.3%, #000 12.9%)",
};

const DISC_BASE: CSSProperties = {
  background:
    "radial-gradient(circle closest-side, rgba(214,221,232,0.1) 0 13.4%, rgba(214,221,232,0.2) 13.4% 21%, rgba(214,221,232,0.12) 24%, rgba(236,240,248,0.34) 26.8%, rgba(255,255,255,0.66) 27.6%, rgba(220,226,236,0.26) 28.6%, rgba(200,208,220,0.1) 29.6% 33.4%, rgba(96,100,108,0.95) 34%, #d8dbe1 35.2%, #a3a7af 36.6%, #4e5158 38.4%, #585b63 58%, #4a4d54 84%, #3b3e44 96.4%, rgba(226,231,240,0.6) 97%, rgba(200,208,220,0.16) 97.8% 99%, rgba(255,255,255,0.6) 99.5%, rgba(255,255,255,0) 100%)",
};

/* The light on it. It does not turn with the disc (a reflection stays
   where the light is), only drifts as the sheen sweeps across. */
const DISC_LIGHT: CSSProperties = {
  background:
    "conic-gradient(from 0deg, rgba(255,255,255,0) 0deg, rgba(255,255,255,0.8) 6deg, rgba(255,255,255,0) 17deg, rgba(160,110,255,0) 21deg, rgba(160,110,255,0.55) 33deg, rgba(80,150,255,0.6) 45deg, rgba(70,230,220,0.6) 57deg, rgba(130,255,110,0.55) 69deg, rgba(255,236,90,0.6) 81deg, rgba(255,140,70,0.55) 93deg, rgba(255,70,150,0.5) 105deg, rgba(255,70,150,0) 122deg, rgba(0,0,0,0) 174deg, rgba(255,255,255,0.7) 186deg, rgba(255,255,255,0) 197deg, rgba(255,70,150,0) 201deg, rgba(255,70,150,0.45) 213deg, rgba(255,140,70,0.5) 225deg, rgba(255,236,90,0.55) 237deg, rgba(130,255,110,0.5) 249deg, rgba(70,230,220,0.55) 261deg, rgba(80,150,255,0.55) 273deg, rgba(160,110,255,0.5) 285deg, rgba(160,110,255,0) 302deg, rgba(255,255,255,0) 360deg)",
  maskImage: "radial-gradient(circle closest-side, transparent 33.8%, #000 34.6% 96.6%, transparent 97.2%)",
  WebkitMaskImage: "radial-gradient(circle closest-side, transparent 33.8%, #000 34.6% 96.6%, transparent 97.2%)",
  mixBlendMode: "screen",
};

/* What turns with it: the written part of the data area, a shade darker
   than the blank rest, so the spin shows even at speed. */
const DISC_WRITTEN: CSSProperties = {
  background:
    "conic-gradient(from 0deg, rgba(0,0,0,0.24) 0deg 196deg, rgba(0,0,0,0) 214deg 246deg, rgba(255,255,255,0.09) 254deg, rgba(0,0,0,0) 266deg 344deg, rgba(0,0,0,0.24) 360deg)",
  maskImage: "radial-gradient(circle closest-side, transparent 38.4%, #000 39.2% 84%, transparent 89%)",
  WebkitMaskImage: "radial-gradient(circle closest-side, transparent 38.4%, #000 39.2% 84%, transparent 89%)",
};

const DISC_GLOSS: CSSProperties = {
  background:
    "linear-gradient(140deg, rgba(255,255,255,0.13) 0%, rgba(255,255,255,0) 36%, rgba(255,255,255,0) 66%, rgba(255,255,255,0.05) 100%)",
  boxShadow: "inset 0 0 0 1px rgba(255,255,255,0.16), inset 0 0 18px rgba(0,0,0,0.45)",
};

/* ---- the folded page ------------------------------------------------- */
const PAPER_BACK = "linear-gradient(180deg, #f5f4ef, #e9e7df)";
/* Where the folds were, fading out as the page flattens. */
const CREASE = [
  "linear-gradient(0deg, rgba(0,0,0,0.14), rgba(0,0,0,0) 5%)",
  "linear-gradient(180deg, rgba(0,0,0,0.1), rgba(0,0,0,0) 4%, rgba(0,0,0,0) 96%, rgba(0,0,0,0.1))",
  "linear-gradient(180deg, rgba(0,0,0,0.14), rgba(0,0,0,0) 5%)",
] as const;

/* ---- the choreography's fixed numbers ---------------------------------- */
/* The floppy's tilt, top edge away, while it is presented in the middle:
   enough to show its thickness and make the disc rise up and away out of
   it like a tray. */
const PRESENT_TILT = 14;
const TAU = Math.PI / 180;

/* ---- preloading ------------------------------------------------------
   Started on hover, focus or press of anything that opens the preview,
   and in idle time once the chat has sent the file, so the page is
   usually decoded before it is needed. The readout's progress ring
   waits for it for real: on a slow connection it holds near the end
   until the picture is in. */
let ready = false;
let warming: Promise<boolean> | null = null;

export function warmResumePreview(): Promise<boolean> {
  if (typeof window === "undefined") return Promise.resolve(false);
  if (ready) return Promise.resolve(true);
  if (!warming) {
    const img = new Image();
    img.decoding = "async";
    img.src = PREVIEW.src;
    const loaded =
      typeof img.decode === "function"
        ? img.decode()
        : new Promise<void>((res, rej) => {
            img.onload = () => res();
            img.onerror = () => rej(new Error("preview failed to load"));
          });
    warming = loaded.then(
      () => {
        ready = true;
        return true;
      },
      () => {
        /* Let the next attempt try again. */
        warming = null;
        return false;
      }
    );
  }
  return warming;
}

/* The chat card's rect arrives through a window event, so it is checked
   before anything trusts it. */
function readRect(detail: unknown): Rect | null {
  if (!detail || typeof detail !== "object") return null;
  const r = (detail as { rect?: unknown }).rect;
  if (!r || typeof r !== "object") return null;
  const { x, y, width, height } = r as Record<string, unknown>;
  if (![x, y, width, height].every((n) => typeof n === "number" && Number.isFinite(n))) return null;
  const vw = window.innerWidth;
  const vh = window.innerHeight;
  const w = width as number;
  const h = height as number;
  if (w < 8 || h < 8 || w > vw * 1.5 || h > vh * 1.5) return null;
  const cx = (x as number) + w / 2;
  const cy = (y as number) + h / 2;
  if (cx < -vw || cx > vw * 2 || cy < -vh || cy > vh * 2) return null;
  return { x: x as number, y: y as number, width: w, height: h };
}

export default function ResumePreview({
  drive,
  api,
  Art,
}: {
  drive: RefObject<DiskDrive | null>;
  api: RefObject<PreviewApi | null>;
  /* The floppy's artwork, for the copy that flies. Without it, opening
     from the disk falls back to a plain fade. */
  Art?: ComponentType<FloppyArtProps>;
}) {
  const [session, setSession] = useState<Session | null>(null);
  const [phase, setPhase] = useState<Phase>("opening");
  const [zoom, setZoom] = useState(false);
  const [img, setImg] = useState<"wait" | "ok" | "broken">("wait");

  const live = useRef<Session | null>(null);
  const seq = useRef(0);
  const state = useRef<Phase>("opening");
  const ctl = useRef<{ close: () => void; skip: () => void } | null>(null);
  const zoomAnim = useRef<Animation | null>(null);
  const zoomFrom = useRef<{ r: DOMRect; u: number; v: number; x: number; y: number } | null>(null);
  const startedAt = useRef(0);

  const root = useRef<HTMLDivElement>(null);
  const dim = useRef<HTMLDivElement>(null);
  const blur = useRef<HTMLDivElement>(null);
  const scroller = useRef<HTMLDivElement>(null);
  const box = useRef<HTMLDivElement>(null);
  const sheet = useRef<HTMLDivElement>(null);
  const tint = useRef<HTMLSpanElement>(null);
  const topBar = useRef<HTMLDivElement>(null);
  const bottomBar = useRef<HTMLDivElement>(null);
  const caption = useRef<HTMLSpanElement>(null);
  const heading = useRef<HTMLHeadingElement>(null);
  const dlTop = useRef<HTMLAnchorElement>(null);
  const dlBottom = useRef<HTMLAnchorElement>(null);
  /* The disk's stage. Its many small parts are found by data-k inside
     it; the floppy copy's own parts come back through the art's refs. */
  const stage = useRef<HTMLDivElement>(null);
  const copyFace = useRef<HTMLSpanElement>(null);
  const copyShutter = useRef<HTMLSpanElement>(null);
  const copyOxide = useRef<HTMLSpanElement>(null);
  const copySilver = useRef<HTMLSpanElement>(null);

  const titleId = useId();
  const metaId = useId();
  const ringTextId = `disc-${useId().replace(/[^a-zA-Z0-9_-]/g, "")}`;

  const begin = useCallback((origin: Origin, opener: HTMLElement | null) => {
    if (live.current) return false;
    const next: Session = { id: ++seq.current, origin, opener };
    live.current = next;
    startedAt.current = performance.now();
    state.current = reduced() ? "open" : "opening";
    setPhase(state.current);
    setZoom(false);
    setImg(ready ? "ok" : "wait");
    setSession(next);
    /* Once the picture is decoded, re-render so every copy of it paints
       synchronously (see the img below). */
    void warmResumePreview().then((ok) => {
      if (ok && live.current === next) setImg((v) => (v === "broken" ? v : "ok"));
    });
    return true;
  }, []);

  useImperativeHandle(
    api,
    () => ({
      open: (opener: HTMLElement) => {
        if (live.current) return false;
        const f = drive.current?.frame();
        return begin(f ? { kind: "disk", frame: f } : { kind: "none" }, opener);
      },
    }),
    [begin, drive]
  );

  /* ---- the chat's file card ------------------------------------------ */
  useEffect(() => {
    const onPreview = (e: Event) => {
      const rect = readRect((e as CustomEvent<unknown>).detail);
      const a = document.activeElement;
      const opened = begin(rect ? { kind: "card", rect } : { kind: "none" }, a instanceof HTMLElement && a !== document.body ? a : null);
      if (opened) e.preventDefault();
    };
    window.addEventListener(PREVIEW_EVENT, onPreview);
    return () => window.removeEventListener(PREVIEW_EVENT, onPreview);
  }, [begin]);

  /* A real unmount (not a close) must not leave the guard set. */
  useEffect(
    () => () => {
      live.current = null;
    },
    []
  );

  /* ---- one session: modal, then the choreography ------------------ */
  useIso(() => {
    if (!session) return;
    const rootEl = root.current;
    const dimEl = dim.current;
    const blurEl = blur.current;
    const scrollEl = scroller.current;
    const boxEl = box.current;
    const sheetEl = sheet.current;
    const tintEl = tint.current;
    const topEl = topBar.current;
    const botEl = bottomBar.current;
    const capEl = caption.current;
    if (!rootEl || !dimEl || !blurEl || !scrollEl || !boxEl || !sheetEl || !tintEl || !topEl || !botEl || !capEl) {
      return;
    }

    const origin = session.origin;
    /* Where the chat's card is. Re-read on the way back, because the
       phone keeps tilting toward the pointer while the preview is open. */
    let cardRect: Rect | null = origin.kind === "card" ? origin.rect : null;

    /* ---- the disk's stage, if this session has one ---------------------- */
    const stageEl = stage.current;
    const pick = <T extends Element>(k: string) => stageEl?.querySelector<T>(`[data-k="${k}"]`) ?? null;
    const St = (() => {
      if (origin.kind !== "disk" || !stageEl) return null;
      const parts = {
        carrier: pick<HTMLDivElement>("carrier"),
        near: pick<HTMLSpanElement>("near"),
        far: pick<HTMLSpanElement>("far"),
        rig: pick<HTMLDivElement>("rig"),
        floppy: pick<HTMLDivElement>("floppy"),
        dvd: pick<HTMLDivElement>("dvd"),
        light: pick<HTMLSpanElement>("light"),
        spin: pick<HTMLSpanElement>("spin"),
        detail: pick<HTMLSpanElement>("detail"),
        ring: pick<SVGSVGElement>("ring"),
        arc: pick<SVGCircleElement>("arc"),
        arcGlow: pick<SVGCircleElement>("arc-glow"),
        head: pick<SVGCircleElement>("head"),
        glint: pick<HTMLSpanElement>("glint"),
        readWrap: pick<HTMLDivElement>("read-wrap"),
        read: pick<HTMLDivElement>("read"),
        label: pick<HTMLSpanElement>("label"),
        count: pick<HTMLSpanElement>("count"),
        led: pick<HTMLSpanElement>("led"),
        paper: pick<HTMLDivElement>("paper"),
        paperRig: pick<HTMLDivElement>("paper-rig"),
        paperShadow: pick<HTMLSpanElement>("paper-shadow"),
        flapTop: pick<HTMLDivElement>("flap-top"),
        flapBot: pick<HTMLDivElement>("flap-bottom"),
        shadeTop: pick<HTMLSpanElement>("shade-0"),
        shadeBot: pick<HTMLSpanElement>("shade-2"),
        shadeTopBack: pick<HTMLSpanElement>("shade-back-0"),
        shadeBotBack: pick<HTMLSpanElement>("shade-back-2"),
        crease0: pick<HTMLSpanElement>("crease-0"),
        crease1: pick<HTMLSpanElement>("crease-1"),
        crease2: pick<HTMLSpanElement>("crease-2"),
        face: copyFace.current,
        shutter: copyShutter.current,
        oxide: copyOxide.current,
        silver: copySilver.current,
      };
      for (const v of Object.values(parts)) if (!v) return null;
      return parts as { [K in keyof typeof parts]: NonNullable<(typeof parts)[K]> };
    })();

    let mode: Mode = reduced()
      ? "still"
      : origin.kind === "disk" && St && drive.current
        ? "disk"
        : origin.kind === "card"
          ? "card"
          : "plain";

    /* The copy takes the disk's place before focus leaves it: moving
       focus blurs the disk, and it would start to answer that. */
    if (mode === "disk") drive.current?.lend(true);

    /* ---- modal ----------------------------------------------------
       Everything beside the dialog goes inert: no focus, no clicks, no
       screen reader. Decoration that is already aria-hidden (the custom
       cursor, the grain) has nothing in it to reach and is left alone. */
    const marked: HTMLElement[] = [];
    for (const el of Array.from(document.body.children)) {
      if (el === rootEl || !(el instanceof HTMLElement)) continue;
      if (el.getAttribute("aria-hidden") === "true" || el.inert) continue;
      el.inert = true;
      marked.push(el);
    }

    /* The page stays where it is. Where the scrollbar takes up room,
       scrollbar-gutter keeps that room when overflow:hidden removes the
       bar, so nothing shifts sideways. Overlay scrollbars take none. */
    const html = document.documentElement;
    const prevOverflow = html.style.overflow;
    const prevGutter = html.style.scrollbarGutter;
    const classicBar = window.innerWidth > html.clientWidth;
    html.style.overflow = "hidden";
    if (classicBar) html.style.scrollbarGutter = "stable";
    const lenis = (window as unknown as { __lenis?: LenisLike }).__lenis;
    const stoppedLenis = !!lenis && !lenis.isStopped;
    if (stoppedLenis) lenis.stop();

    /* Straight to the primary action, whichever copy of it is showing. */
    const visible = (el: HTMLElement | null): el is HTMLElement => !!el && el.getClientRects().length > 0;
    const primary = [dlTop.current, dlBottom.current].find(visible) ?? heading.current;
    primary?.focus({ preventScroll: true });

    /* ---- the numbers everything is drawn from ------------------------
       Disk:
         fl    the floppy's flight from the desk to the middle
         cs    its shadows on the desk (1 while it sits there)
         sh    its shutter, 0 shut to 1 open
         dv    the silver disc showing through its window
         ej    the disc sliding up out of it
         sk    the empty floppy dropping away
         dz    the disc turning to face you and coming forward
         vs    the disc's spin, in turns a second
         sw    the light sweeping across it
         ring, rd, prog   the progress ring, the readout, the count
         df    the disc turning edge-on
         sf    the folded page swinging out of the edge
         sg    the page growing into place
         ut, ub   its top and bottom thirds unfolding
       Chat card:  m (the card turning into the page), tint (its colour)
       Plain:      fade
       All:        dim, blur, ui (the toolbars) */
    const START = {
      fl: 0, cs: 1, sh: 0, dv: 0, ej: 0, sk: 0, dz: 0, vs: 0, sw: 0, ring: 0, rd: 0, prog: 0,
      df: 0, sf: 0, sg: 0, ut: 0, ub: 0, m: 0, tint: 1, fade: 0, dim: 0, blur: 0, ui: 0,
    };
    const END = {
      fl: 1, cs: 0, sh: 1, dv: 1, ej: 1, sk: 1, dz: 1, vs: 0, sw: 1, ring: 0, rd: 0, prog: 1,
      df: 1, sf: 1, sg: 1, ut: 1, ub: 1, m: 1, tint: 0, fade: 1, dim: 1, blur: 1, ui: 1,
    };
    const s = { ...(mode === "still" ? END : START) };
    if (origin.kind === "disk") s.sh = mode === "still" ? 1 : Math.min(1, Math.max(0, origin.frame.shutter / (origin.frame.travel || 1)));

    let phaseNow: Phase = mode === "still" ? "open" : "opening";
    let dead = false;
    let tl: ReturnType<typeof gsap.timeline> | null = null;
    const timers = new Set<number>();
    const anims: Animation[] = [];

    const goPhase = (p: Phase) => {
      phaseNow = p;
      state.current = p;
      setPhase(p);
    };

    /* ---- geometry ---------------------------------------------------- */
    type Box = { cx: number; cy: number; w: number; h: number; left: number; top: number };
    const pageBox = (): Box => {
      const b = boxEl.getBoundingClientRect();
      return { cx: b.left + b.width / 2, cy: b.top + b.height / 2, w: b.width, h: b.height, left: b.left, top: b.top };
    };
    let F = pageBox();

    /* The disk's stage, laid out for this window. The copy is drawn at
       the size it is shown in the middle (so it is sharp there) and
       scaled down to the disk's size on the desk. */
    type DiskGeo = {
      D: DiskFrame;
      Wb: number;
      Hb: number;
      Dm: number;
      u: number;
      X: number;
      Y: number;
      A: { cx: number; cy: number; a: number; k: number; lz: number; rx: number; ry: number; sx: number; sy: number };
      B: { cx: number; cy: number };
      arc: number;
      dir: number;
      yIn: number;
      yOut: number;
      zIn: number;
      dsIn: number;
      dsRead: number;
      sc0: number;
    };
    let G: DiskGeo | null = null;

    const layoutDisk = (D: DiskFrame): DiskGeo | null => {
      if (!St) return null;
      const vw = window.innerWidth;
      const vh = window.innerHeight;
      const Wb = Math.max(96, Math.round(Math.min(280, vw * 0.56, vh * 0.31)));
      const Hb = (Wb * 94) / 90;
      const Dm = Math.max(120, Math.round(Math.min(320, vw * 0.66, vh * 0.4)));
      const u = Wb / (D.w || Wb);
      const P = D.perspective * u;
      const X = vw / 2;
      const Y = vh * 0.42;

      /* The disc inside, between the layers of the case, and where it is
         once it has slid clear of the top edge. */
      const dIn = Wb * 0.84;
      const dsIn = dIn / Dm;
      const yIn = Hb * 0.03;
      const zIn = -3.5 * u;
      const yOut = -Hb / 2 - dIn / 2 - Wb * 0.05;
      /* The floppy is placed so the disc it ejects ends up exactly in the
         pool of light, the tilt and the perspective included. */
      const th = PRESENT_TILT * TAU;
      const yP = yOut * Math.cos(th) - zIn * Math.sin(th);
      const zP = yOut * Math.sin(th) + zIn * Math.cos(th);
      const pk = P / (P - zP);
      const B = { cx: X, cy: Y - yP * pk };

      const A = {
        cx: D.cx,
        cy: D.cy,
        a: (D.angle * 180) / Math.PI,
        k: 1 / u,
        lz: D.lift * u,
        rx: D.rx,
        ry: D.ry,
        sx: D.sx,
        sy: D.sy,
      };

      const c = St.carrier.style;
      c.width = `${Wb}px`;
      c.height = `${Hb}px`;
      c.perspective = `${P.toFixed(1)}px`;
      c.setProperty("--d", `${u.toFixed(4)}px`);
      St.near.style.filter = `blur(${(5 * u).toFixed(2)}px)`;
      St.far.style.filter = `blur(${(18 * u).toFixed(2)}px)`;
      const d = St.dvd.style;
      d.width = d.height = `${Dm}px`;
      d.marginLeft = d.marginTop = `${-Dm / 2}px`;
      const p = St.paper.style;
      p.left = `${F.left}px`;
      p.top = `${F.top}px`;
      p.width = `${F.w}px`;
      p.height = `${F.h}px`;
      St.glint.style.height = `${Math.round(Dm * 1.06)}px`;
      /* The readout sits under the ring, held at the width of its longest
         label so it does not jump when the label changes. */
      St.label.textContent = `Reading ${resume.fileName}`;
      St.read.style.width = "";
      St.read.style.width = `${St.read.offsetWidth}px`;
      St.readWrap.style.left = `${X}px`;
      St.readWrap.style.top = `${Math.round(Y + Dm * 0.58 + 18)}px`;
      /* A pool of light where the disc will be, the room dark around it. */
      dimEl.style.background = [
        `radial-gradient(circle at ${X}px ${Y}px, rgba(237,237,230,0.07), rgba(237,237,230,0) ${Math.round(Dm * 1.3)}px)`,
        `radial-gradient(ellipse ${Math.round(vw * 0.75)}px ${Math.round(vh * 0.7)}px at ${X}px ${Y}px, rgba(4,4,5,0.66), rgba(4,4,5,0.92))`,
      ].join(",");

      return {
        D,
        Wb,
        Hb,
        Dm,
        u,
        X,
        Y,
        A,
        B,
        arc: Math.min(110, 30 + Math.hypot(B.cx - A.cx, B.cy - A.cy) * 0.12),
        dir: Math.sign(B.cx - A.cx) || 1,
        yIn,
        yOut,
        zIn,
        dsIn,
        dsRead: 1 / pk,
        sc0: Math.min(1, (Dm * 0.92) / F.w),
      };
    };

    if (mode === "disk" && origin.kind === "disk") {
      G = layoutDisk(origin.frame);
      if (!G) mode = "plain";
    }

    /* ---- drawing ------------------------------------------------------ */
    let lastCount = "";
    let lastGx = "";
    let lastRate = -1;
    let lastProg = -1;
    const px = (n: number) => `${n.toFixed(2)}px`;
    const deg = (n: number) => `${n.toFixed(3)}deg`;
    const clamp01 = (n: number) => Math.min(1, Math.max(0, n));

    const drawDisk = () => {
      if (!St || !G) return;
      const { D, Wb, Hb, Dm, u, X, Y, A, B, arc, dir } = G;

      /* The paper has landed: the real sheet takes over and the stage goes. */
      const landed = s.sf >= 1 && s.sg >= 1 && s.ut >= 1 && s.ub >= 1;
      stageEl!.style.visibility = landed ? "hidden" : "visible";
      sheetEl.style.visibility = landed ? "" : "hidden";
      if (landed) return;

      /* ---- the floppy's flight: a shallow arc, tipping back and turning
         as it goes, from the desk's pose to the presenting pose. */
      const f = s.fl;
      const bump = Math.sin(Math.PI * f);
      const x = A.cx + (B.cx - A.cx) * f;
      const y = A.cy + (B.cy - A.cy) * f - bump * arc;
      const k = A.k * Math.pow(1 / A.k, f);
      const rz = A.a * (1 - f) - dir * 7 * bump;
      St.carrier.style.transform = `translate3d(${px(x - Wb / 2)}, ${px(y - Hb / 2)}, 0) rotate(${deg(rz)}) scale(${k.toFixed(5)})`;
      const q = Math.min(1, f * 3);
      const rx = A.rx + (PRESENT_TILT - A.rx) * f + 16 * bump;
      const ry = A.ry * (1 - f) - dir * 14 * bump;
      const lz = A.lz * (1 - f) + bump * Wb * 0.1;
      St.rig.style.transform = `translateZ(${px(lz)}) rotateY(${deg(ry)}) rotateX(${deg(rx)}) scale(${(A.sx + (1 - A.sx) * q).toFixed(4)}, ${(A.sy + (1 - A.sy) * q).toFixed(4)})`;
      /* The light on the metal follows the copy's own tilt, as it does on
         the page. */
      const gx = `${(50 + ry * 2.8 + rx * 0.8).toFixed(1)}%`;
      if (gx !== lastGx) {
        lastGx = gx;
        St.face.style.setProperty("--gx", gx);
      }
      St.near.style.opacity = (D.near * s.cs).toFixed(3);
      St.far.style.opacity = (D.far.o * s.cs).toFixed(3);
      St.far.style.transform = `translate3d(${px(D.far.x * u)}, ${px(D.far.y * u)}, 0) scale(${D.far.s.toFixed(3)})`;
      St.shutter.style.transform = `translate3d(${(s.sh * D.travel).toFixed(3)}%, 0, 0)`;
      St.oxide.style.transform = `rotate(${deg(D.spin + f * 200 + s.ej * 260)})`;
      St.silver.style.opacity = s.dv.toFixed(3);

      /* ---- the empty case drops away. Its layers fade one by one through
         --fo, so it keeps its thickness while it goes. */
      const e = s.sk;
      St.floppy.style.transform = e > 0 ? `translate3d(0, ${px(e * 0.8 * Hb)}, ${px(-e * 0.3 * Wb)}) rotateX(${deg(e * 34)})` : "";
      St.floppy.style.setProperty("--fo", Math.pow(1 - e, 1.5).toFixed(3));
      St.floppy.style.visibility = e >= 1 ? "hidden" : "";

      /* ---- the disc: up out of the case, round to face you, edge-on. */
      const ej = s.ej;
      const dz = s.dz;
      const dy = G.yIn + (G.yOut - G.yIn) * ej;
      const ds = G.dsIn + (G.dsRead - G.dsIn) * dz;
      St.dvd.style.transform = `translate3d(0, ${px(dy)}, ${px(G.zIn)}) rotateX(${deg(-PRESENT_TILT * dz)}) rotateY(${deg(90 * s.df)}) scale(${ds.toFixed(5)})`;
      St.dvd.style.visibility = ej > 0 && s.df < 1 ? "" : "hidden";
      St.light.style.transform = `rotate(${deg(-38 + s.sw * 76)})`;
      /* At speed the written part blurs into the rest, the way a real
         disc's detail does. */
      St.detail.style.opacity = (1 - 0.7 * clamp01(s.vs / 3)).toFixed(3);
      const rate = Math.round(s.vs * 100) / 100;
      if (rate !== lastRate) {
        lastRate = rate;
        anims[0] && (anims[0].playbackRate = rate);
      }
      St.ring.style.opacity = s.ring.toFixed(3);
      St.ring.style.transform = `scale(${(0.9 + 0.1 * s.ring).toFixed(4)})`;
      const pr = Math.round(s.prog * 1000) / 1000;
      if (pr !== lastProg) {
        lastProg = pr;
        const dash = `${pr} 1`;
        St.arc.setAttribute("stroke-dasharray", dash);
        St.arcGlow.setAttribute("stroke-dasharray", dash);
        const t = (pr * 360 - 90) * TAU;
        St.head.setAttribute("cx", (60 + 58 * Math.cos(t)).toFixed(2));
        St.head.setAttribute("cy", (60 + 58 * Math.sin(t)).toFixed(2));
        St.head.style.opacity = pr > 0.004 && pr < 0.999 ? "1" : "0";
      }

      /* A line of light as the disc passes edge-on. */
      const gl = Math.max(0, 1 - Math.abs(s.df + s.sf - 1) * 3.2);
      St.glint.style.opacity = gl.toFixed(3);
      St.glint.style.transform = `translate3d(${px(X - 1)}, ${px(Y - Dm * 0.53)}, 0) scaleY(${(0.55 + 0.45 * gl).toFixed(3)})`;

      /* The readout under the ring. */
      St.read.style.opacity = s.rd.toFixed(3);
      St.read.style.transform = `translate3d(0, ${px((1 - s.rd) * 8)}, 0)`;
      const cnt = counter(s.prog);
      if (cnt !== lastCount) {
        lastCount = cnt;
        St.count.textContent = cnt;
      }

      /* ---- the page: out of the disc's edge, folded in three, then
         growing into its place and unfolding, settling flat. */
      St.paper.style.visibility = s.sf > 0 ? "" : "hidden";
      if (s.sf > 0) {
        const g = s.sg;
        const sc = G.sc0 * Math.pow(1 / G.sc0, g);
        const tilt = 18 * (1 - g) * (1 - g);
        St.paperRig.style.transform = `translate3d(${px((X - F.cx) * (1 - g))}, ${px((Y - F.cy) * (1 - g))}, 0) scale3d(${sc.toFixed(5)}, ${sc.toFixed(5)}, ${sc.toFixed(5)}) rotateY(${deg(-90 * (1 - s.sf))}) rotateX(${deg(tilt)})`;
        const at = 180 * (1 - s.ut);
        const ab = 180 * (1 - s.ub);
        St.flapTop.style.transform = `translateZ(1.5px) rotateX(${deg(-at)})`;
        St.flapBot.style.transform = `translateZ(0.8px) rotateX(${deg(ab)})`;
        /* Turned away from the light, a flap goes a little grey. */
        const shT = Math.sin(at * TAU);
        const shB = Math.sin(ab * TAU);
        St.shadeTop.style.opacity = (0.3 * shT).toFixed(3);
        St.shadeTopBack.style.opacity = (0.22 * shT).toFixed(3);
        St.shadeBot.style.opacity = (0.3 * shB).toFixed(3);
        St.shadeBotBack.style.opacity = (0.22 * shB).toFixed(3);
        const crease = (1 - Math.min(s.ut, s.ub)).toFixed(3);
        St.crease0.style.opacity = crease;
        St.crease1.style.opacity = crease;
        St.crease2.style.opacity = crease;
        /* Its shadow covers only as much page as is open. */
        St.paperShadow.style.transform = `translate3d(0, ${px(((1 - s.ut) * F.h) / 3)}, -2px) scaleY(${((1 + s.ut + s.ub) / 3).toFixed(4)})`;
        St.paperShadow.style.opacity = (0.35 + 0.65 * g).toFixed(3);
      }
    };

    const drawSheet = () => {
      if (mode === "card" && cardRect) {
        const C = cardRect;
        const m = s.m;
        const s0 = C.width / F.w;
        const sc = s0 * Math.pow(1 / s0, m);
        const ccx = C.x + C.width / 2;
        const ccy = C.y + C.height / 2;
        const x = ccx + (F.cx - ccx) * m;
        const y = ccy + (F.cy - ccy) * m;
        /* At the start only a card-shaped band of the page shows, so the
           card itself seems to stretch into the sheet. */
        const iy = Math.max(0, (F.h - C.height / s0) / 2) * (1 - m);
        const rad = (16 / s0) * (1 - m) + 3 * m;
        sheetEl.style.transform = `translate3d(${px(x - F.cx)}, ${px(y - F.cy)}, 0) scale(${sc.toFixed(5)})`;
        sheetEl.style.clipPath = m < 1 ? `inset(${px(iy)} 0 round ${px(rad)})` : "";
        tintEl.style.opacity = s.tint.toFixed(3);
        return;
      }
      if (mode === "plain") {
        sheetEl.style.opacity = s.fade.toFixed(3);
        sheetEl.style.transform = s.fade >= 1 ? "" : `scale(${(0.965 + 0.035 * s.fade).toFixed(4)})`;
      }
    };

    const write = () => {
      dimEl.style.opacity = s.dim.toFixed(3);
      blurEl.style.opacity = s.blur.toFixed(3);
      if (mode === "disk") drawDisk();
      else drawSheet();

      const u = s.ui;
      const lift = (1 - u) * 22;
      topEl.style.opacity = u.toFixed(3);
      topEl.style.transform = u >= 0.999 ? "" : `translate3d(0, ${px(-lift)}, 0)`;
      botEl.style.opacity = u.toFixed(3);
      botEl.style.transform = u >= 0.999 ? "" : `translate3d(0, ${px(lift)}, 0)`;
      capEl.style.opacity = u.toFixed(3);
    };

    /* Once it has landed the page carries no transform at all, so it is
       rasterised flat and the text is as sharp as the image allows. */
    const clearSheet = () => {
      sheetEl.style.transform = "";
      sheetEl.style.clipPath = "";
      sheetEl.style.visibility = "";
      sheetEl.style.opacity = "";
      sheetEl.style.willChange = "";
      tintEl.style.opacity = "0";
    };

    const later = (fn: () => void, ms: number) => {
      const t = window.setTimeout(() => {
        timers.delete(t);
        fn();
      }, ms);
      timers.add(t);
      return t;
    };

    /* Runs fn when the picture is decoded, or after max ms regardless. */
    const whenReady = (fn: () => void, max: number) => {
      let done = false;
      const go = () => {
        if (done || dead) return;
        done = true;
        window.clearTimeout(t);
        timers.delete(t);
        fn();
      };
      const t = later(go, max);
      void warmResumePreview().then(go);
    };

    const opened = () => {
      if (dead || phaseNow !== "opening") return;
      Object.assign(s, END);
      write();
      clearSheet();
      if (stageEl) stageEl.style.visibility = "hidden";
      scrollEl.style.overflow = "";
      goPhase("open");
    };

    const finish = () => {
      if (dead) return;
      live.current = null;
      setSession(null);
    };

    /* ---- the disc's motor ---------------------------------------------------
       Compositor animations, so they keep turning smoothly while the
       timeline waits for the picture, and their speed is just a rate. */
    if (mode === "disk" && St) {
      if (typeof St.spin.animate === "function") {
        const spinAnim = St.spin.animate([{ transform: "rotate(0deg)" }, { transform: "rotate(360deg)" }], {
          duration: 1000,
          iterations: Infinity,
        });
        spinAnim.playbackRate = 0;
        anims.push(spinAnim);
      }
    }

    /* ---- opening ------------------------------------------------------ */
    tintEl.style.opacity = mode === "card" ? "1" : "0";
    if (mode === "still") {
      write();
      clearSheet();
    } else {
      /* Nothing scrolls while it moves: the sheet is far from where it
         will sit, and its overflow would otherwise flash scrollbars. */
      scrollEl.style.overflow = "hidden";
      if (mode !== "disk") sheetEl.style.willChange = "transform";
      write();
      tl = gsap.timeline({ onUpdate: write, onComplete: opened });

      if (mode === "disk" && St) {
        const t = tl;
        const label = St.label;
        /* The last tenth of the ring is the picture actually arriving: on
           a slow connection the disc keeps spinning there until it has. */
        const hold = () => {
          if (ready) return;
          t.pause();
          whenReady(() => {
            if (phaseNow === "opening") t.resume();
          }, 6000);
        };
        t.to(s, { dim: 1, duration: 0.5, ease: "power2.out" }, 0)
          .to(s, { blur: 1, duration: 0.6, ease: "power2.inOut" }, 0.05)
          .to(s, { cs: 0, duration: 0.26, ease: "power2.out" }, 0)
          .to(s, { fl: 1, duration: 0.58, ease: "power3.inOut" }, 0)
          .to(s, { dv: 1, duration: 0.4, ease: "power1.inOut" }, 0.1)
          .to(s, { sh: 1, duration: 0.26, ease: "power2.inOut" }, 0.38)
          /* the tray: the disc slides up out of the case */
          .to(s, { ej: 1, duration: 0.46, ease: "power2.inOut" }, 0.54)
          .to(s, { vs: 0.5, duration: 0.4, ease: "power1.in" }, 0.54)
          /* the empty case drops away as the disc comes round to face you */
          .to(s, { sk: 1, duration: 0.5, ease: "power2.in" }, 0.9)
          .to(s, { dz: 1, duration: 0.44, ease: "power3.out" }, 0.92)
          .to(s, { ring: 1, rd: 1, duration: 0.3, ease: "power2.out" }, 0.96)
          .to(s, { sw: 1, duration: 0.9, ease: "sine.inOut" }, 0.92)
          /* reading: spin up, count the file in */
          .to(s, { vs: 3.2, duration: 0.46, ease: "power2.in" }, 1.0)
          .to(s, { prog: 0.9, duration: 0.42, ease: "power1.inOut" }, 1.0)
          .call(hold, undefined, 1.42)
          .call(
            () => {
              label.textContent = "Opening";
            },
            undefined,
            1.43
          )
          .to(s, { prog: 1, duration: 0.12, ease: "power1.out" }, 1.43)
          .to(s, { rd: 0, ring: 0, duration: 0.2, ease: "power1.in" }, 1.5)
          /* the disc turns edge-on and the page swings out of it */
          .to(s, { df: 1, duration: 0.17, ease: "power2.in" }, 1.52)
          .to(s, { vs: 0, duration: 0.2, ease: "power1.out" }, 1.69)
          .to(s, { sf: 1, duration: 0.22, ease: "power2.out" }, 1.69)
          .to(s, { sg: 1, duration: 0.6, ease: "expo.out" }, 1.72)
          .to(s, { ut: 1, duration: 0.34, ease: "power3.inOut" }, 1.78)
          .to(s, { ub: 1, duration: 0.34, ease: "power3.inOut" }, 1.9)
          .to(s, { ui: 1, duration: 0.5, ease: "expo.out" }, 2.08);
      } else if (mode === "card") {
        /* The card's face gives way to the page almost at once, so there
           is never an empty card sitting in the chat, and the page then
           leaves fast and settles slowly, like a file opened on a phone. */
        const t = tl;
        t.to(s, { dim: 1, duration: 0.3, ease: "power2.out" }, 0)
          .to(s, { tint: 0, duration: 0.26, ease: "power1.out" }, 0.02)
          .call(
            () => {
              if (ready) return;
              t.pause();
              whenReady(() => {
                if (phaseNow === "opening") t.resume();
              }, 900);
            },
            undefined,
            0.06
          )
          .to(s, { blur: 1, duration: 0.45, ease: "power2.out" }, 0.04)
          .to(s, { m: 1, duration: 0.64, ease: "power3.out" }, 0.04)
          .to(s, { ui: 1, duration: 0.5, ease: "expo.out" }, 0.4);
      } else {
        tl.to(s, { dim: 1, blur: 1, duration: 0.3, ease: "power2.out" }, 0)
          .to(s, { fade: 1, duration: 0.45, ease: "expo.out" }, 0.04)
          .to(s, { ui: 1, duration: 0.35, ease: "power2.out" }, 0.12);
      }
    }

    /* A click or Escape during the opening lands it at once. */
    const skip = () => {
      if (phaseNow !== "opening" || !tl) return;
      const t = tl;
      tl = null;
      t.kill();
      opened();
    };

    /* ---- closing ------------------------------------------------------ */
    const close = () => {
      if (dead) return;
      if (phaseNow === "closing") {
        finish();
        return;
      }
      /* A keyboard can reach Close before the opening has finished: land
         it first, then take it all back from there. */
      if (phaseNow === "opening") skip();
      goPhase("closing");
      tl?.kill();
      zoomAnim.current?.cancel();
      if (mode === "still") {
        finish();
        return;
      }
      scrollEl.style.overflow = "hidden";
      /* From wherever the page is now: zoomed and scrolled is fine. */
      F = pageBox();
      if (mode === "disk") {
        const D = drive.current?.frame();
        G = D ? layoutDisk(D) : null;
        if (!G) {
          mode = "plain";
          if (stageEl) stageEl.style.visibility = "hidden";
          sheetEl.style.visibility = "";
        }
      }
      if (mode !== "disk") sheetEl.style.willChange = "transform";
      /* The phone under the preview has kept following the pointer, so
         the card may have turned a little: land where it is now. Only a
         nearby box counts, in case focus had wandered somewhere else. */
      const o = session.opener;
      if (mode === "card" && cardRect && o && o.isConnected) {
        const r = o.getBoundingClientRect();
        const c = cardRect;
        const near =
          Math.abs(r.left + r.width / 2 - (c.x + c.width / 2)) < 120 &&
          Math.abs(r.top + r.height / 2 - (c.y + c.height / 2)) < 120 &&
          Math.abs(r.width - c.width) < c.width * 0.3 &&
          r.height >= 8;
        if (near) cardRect = { x: r.left, y: r.top, width: r.width, height: r.height };
      }
      tl = gsap.timeline({ onUpdate: write, onComplete: finish });

      if (mode === "disk") {
        /* The same trip backwards, quicker: fold, into the disc, the disc
           into the case, shutter shut, home. */
        tl.to(s, { ui: 0, duration: 0.14, ease: "power2.in" }, 0)
          .to(s, { ub: 0, duration: 0.24, ease: "power2.inOut" }, 0.04)
          .to(s, { ut: 0, duration: 0.24, ease: "power2.inOut" }, 0.12)
          .to(s, { sg: 0, duration: 0.38, ease: "power3.inOut" }, 0.04)
          .to(s, { sf: 0, duration: 0.12, ease: "power2.in" }, 0.36)
          .to(s, { df: 0, duration: 0.12, ease: "power2.out" }, 0.48)
          .to(s, { vs: 1, duration: 0.16, ease: "power1.out" }, 0.48)
          .to(s, { sk: 0, duration: 0.3, ease: "power3.out" }, 0.46)
          .to(s, { dz: 0, duration: 0.22, ease: "power2.inOut" }, 0.5)
          .to(s, { ej: 0, duration: 0.24, ease: "power2.in" }, 0.66)
          .to(s, { sh: 0, duration: 0.12, ease: "power3.out" }, 0.9)
          .to(s, { vs: 0, duration: 0.2, ease: "power1.out" }, 0.9)
          .to(s, { dv: 0, duration: 0.24, ease: "power1.inOut" }, 0.9)
          .to(s, { fl: 0, duration: 0.42, ease: "power3.inOut" }, 0.92)
          .to(s, { cs: 1, duration: 0.2, ease: "power2.in" }, 1.14)
          .to(s, { blur: 0, duration: 0.4, ease: "power2.inOut" }, 0.9)
          .to(s, { dim: 0, duration: 0.36, ease: "power2.out" }, 0.98);
      } else if (mode === "card") {
        tl.to(s, { ui: 0, duration: 0.16, ease: "power2.in" }, 0)
          .to(s, { m: 0, duration: 0.46, ease: "power3.inOut" }, 0.02)
          .to(s, { tint: 1, duration: 0.2, ease: "power1.in" }, 0.28)
          .to(s, { blur: 0, dim: 0, duration: 0.4, ease: "power2.inOut" }, 0.12);
      } else {
        tl.to(s, { ui: 0, fade: 0, dim: 0, blur: 0, duration: 0.24, ease: "power2.in" }, 0);
      }
    };

    ctl.current = { close, skip };

    /* ---- keys ------------------------------------------------------------
       On window, in the capture phase, so they work wherever focus is. */
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        if (phaseNow === "opening") skip();
        else close();
        return;
      }

      if (e.key === "Tab") {
        const list = Array.from(rootEl.querySelectorAll<HTMLElement>(FOCUSABLE)).filter(visible);
        if (!list.length) return;
        const first = list[0];
        const last = list[list.length - 1];
        const at = document.activeElement;
        if (e.shiftKey && (at === first || at === rootEl || !rootEl.contains(at))) {
          e.preventDefault();
          last.focus();
        } else if (!e.shiftKey && (at === last || !rootEl.contains(at))) {
          e.preventDefault();
          first.focus();
        }
        return;
      }

      if (SCROLL_KEYS.has(e.key) && !e.altKey && !e.ctrlKey && !e.metaKey) {
        e.stopPropagation();
        const t = e.target instanceof Element ? e.target : null;
        /* Space presses a focused button. */
        if (e.key === " " && t?.closest("button")) return;
        /* Focus is on the toolbar, which does not scroll, so the keys are
           steered to the page. Not while it is flying in or out: the
           flight was measured from where the page sat, and scrolling under
           it would make it land in the wrong place. */
        e.preventDefault();
        if (phaseNow !== "open") return;
        const page = scrollEl.clientHeight * 0.85;
        const step = 64;
        const d: Record<string, [number, number]> = {
          ArrowDown: [0, step],
          ArrowUp: [0, -step],
          ArrowRight: [step, 0],
          ArrowLeft: [-step, 0],
          PageDown: [0, page],
          PageUp: [0, -page],
          " ": [0, e.shiftKey ? -page : page],
          Home: [0, -1e6],
          End: [0, 1e6],
        };
        const [left, top] = d[e.key] ?? [0, 0];
        scrollEl.scrollBy({ left, top, behavior: mode === "still" ? "auto" : "smooth" });
      }
    };
    window.addEventListener("keydown", onKey, true);

    return () => {
      dead = true;
      tl?.kill();
      timers.forEach((t) => window.clearTimeout(t));
      timers.clear();
      anims.forEach((a) => a.cancel());
      window.removeEventListener("keydown", onKey, true);
      zoomAnim.current?.cancel();
      zoomAnim.current = null;
      ctl.current = null;
      marked.forEach((el) => {
        el.inert = false;
      });
      html.style.overflow = prevOverflow;
      html.style.scrollbarGutter = prevGutter;
      if (stoppedLenis) (window as unknown as { __lenis?: LenisLike }).__lenis?.start();
      /* Focus first, then the disk: it decides whether to open again
         from whether it has keyboard focus. */
      const o = session.opener;
      if (o && o.isConnected) o.focus({ preventScroll: true });
      if (origin.kind === "disk") drive.current?.lend(false);
    };
  }, [session, drive]);

  /* ---- zoom ------------------------------------------------------------
     The point that was clicked stays under the pointer, and the page
     grows from its old size to its new one rather than jumping. */
  const toggleZoom = useCallback((x?: number, y?: number) => {
    const b = box.current;
    if (!b || state.current !== "open") return;
    const r = b.getBoundingClientRect();
    const px = x ?? window.innerWidth / 2;
    const py = y ?? window.innerHeight / 2;
    const clamp01 = (n: number) => Math.min(1, Math.max(0, n));
    zoomFrom.current = { r, u: clamp01((px - r.left) / r.width), v: clamp01((py - r.top) / r.height), x: px, y: py };
    setZoom((z) => !z);
  }, []);

  useIso(() => {
    const from = zoomFrom.current;
    const b = box.current;
    const sc = scroller.current;
    zoomFrom.current = null;
    if (!from || !b || !sc) return;
    const r2 = b.getBoundingClientRect();
    sc.scrollLeft += r2.left + from.u * r2.width - from.x;
    sc.scrollTop += r2.top + from.v * r2.height - from.y;
    if (reduced() || typeof b.animate !== "function") return;
    const r3 = b.getBoundingClientRect();
    zoomAnim.current?.cancel();
    zoomAnim.current = b.animate(
      [
        {
          transformOrigin: "0 0",
          transform: `translate(${(from.r.left - r3.left).toFixed(2)}px, ${(from.r.top - r3.top).toFixed(2)}px) scale(${(from.r.width / r3.width).toFixed(5)})`,
        },
        { transformOrigin: "0 0", transform: "none" },
      ],
      { duration: 520, easing: "cubic-bezier(0.16, 1, 0.3, 1)" }
    );
  }, [zoom]);

  const onBackdrop = (e: ReactMouseEvent<HTMLDivElement>) => {
    const t = e.target as HTMLElement;
    if (t === e.currentTarget || t.hasAttribute("data-backdrop")) ctl.current?.close();
  };

  if (!session || typeof document === "undefined") return null;

  const fit = !zoom;
  const zoomLabel = zoom ? "Fit to screen" : "Zoom in";
  const ghost =
    "inline-flex items-center justify-center gap-2 rounded-full border border-white/[0.12] text-bone/85 transition-colors duration-300 hover:border-white/35 hover:text-bone";
  /* Once the warm-up has decoded the picture, every copy of it paints in
     the same frame as its element: with async decoding a brand new img
     can stay blank for a few frames, which showed as an empty white page. */
  const decoding = ready || img === "ok" ? "sync" : "async";
  const withStage = session.origin.kind === "disk" && !!Art;

  return createPortal(
    <div
      ref={root}
      role="dialog"
      aria-modal="true"
      aria-labelledby={titleId}
      aria-describedby={metaId}
      data-lenis-prevent
      /* Focusable from script only, so a click on the page or the dark
         around it keeps focus inside the dialog instead of dropping it
         on <body>, where the keys would no longer reach the preview. */
      tabIndex={-1}
      className="fixed inset-0 z-[65] overflow-hidden text-bone outline-none"
    >
      {/* Backdrop: the room dimming round a pool of light, and a blur. */}
      <div ref={dim} aria-hidden className="absolute inset-0 bg-[rgba(4,4,5,0.84)]" />
      <div
        ref={blur}
        aria-hidden
        className="absolute inset-0 bg-[rgba(5,5,5,0.32)] backdrop-blur-[14px] backdrop-saturate-[0.7]"
      />

      {/* ---- the page ---------------------------------------------- */}
      <div
        ref={scroller}
        onClick={onBackdrop}
        className="@container absolute inset-0 z-[3] overflow-auto overscroll-contain [scrollbar-color:rgba(237,237,230,0.22)_transparent] [scrollbar-gutter:stable_both-edges] [scrollbar-width:thin]"
      >
        <div
          data-backdrop=""
          className="flex min-h-full w-max min-w-full px-3 pb-[calc(5.25rem_+_env(safe-area-inset-bottom))] pt-[4.25rem] md:px-8 md:pb-6 md:pt-[5.5rem]"
        >
          {/* Auto margins centre it, and unlike justify-center they never
              push a zoomed page off the left edge where it could not be
              scrolled back to. */}
          <div data-backdrop="" className="m-auto flex flex-col items-center gap-3">
            <div ref={box} className={`relative aspect-[1800/2546] shrink-0 ${zoom ? ZOOM_W : FIT_W}`}>
              <div
                ref={sheet}
                onClick={(e) => {
                  e.stopPropagation();
                  toggleZoom(e.clientX, e.clientY);
                }}
                data-hover={fit && phase === "open" ? "" : undefined}
                data-cursor={fit ? "ZOOM" : undefined}
                className={`absolute inset-0 overflow-hidden rounded-[3px] bg-white ${PAGE_SHADOW} [touch-action:manipulation]`}
              >
                {img !== "ok" && (
                  <span className="t-mono absolute inset-x-0 top-1/2 -translate-y-1/2 px-6 text-center !text-[10px] text-[#8a8a91]">
                    {img === "broken" ? "Preview unavailable. The PDF download still works." : "Loading preview"}
                  </span>
                )}
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={PREVIEW.src}
                  width={PREVIEW.width}
                  height={PREVIEW.height}
                  alt={ALT}
                  draggable={false}
                  decoding={decoding}
                  onLoad={() => {
                    ready = true;
                    setImg("ok");
                  }}
                  onError={() => setImg("broken")}
                  className={`pointer-events-none relative block h-full w-full select-none ${img === "broken" ? "invisible" : ""}`}
                />
                <span ref={tint} aria-hidden className="pointer-events-none absolute inset-0 bg-[#17171b]" />
              </div>
            </div>
            {/* How to drive it, under the page, where the eye already is. */}
            <p aria-hidden className="t-mono whitespace-nowrap text-center !text-[9px] leading-[14px] !tracking-[0.16em] text-ash">
              <span ref={caption} className="inline-block">
                {fit ? `Page 1 of ${resume.pages} · ` : ""}
                <span className="[@media(hover:hover)]:hidden">Tap the page to {fit ? "zoom" : "fit"}</span>
                <span className="hidden [@media(hover:hover)]:inline">Click the page to {fit ? "zoom" : "fit"} · Esc to close</span>
              </span>
            </p>
          </div>
        </div>
      </div>

      {/* ---- the disk's stage ---------------------------------------
          Everything here is decoration over the real dialog, and goes
          once the page has landed. */}
      {withStage && Art && (
        <div ref={stage} aria-hidden className="pointer-events-none absolute inset-0 z-[5] overflow-hidden">
          {/* The floppy, and the disc inside it. The carrier places and
              sizes it (and holds the perspective, scaled with it); the rig
              poses it; the floppy wrapper lets the case drop away on its
              own while the disc stays. */}
          <div data-k="carrier" className="absolute left-0 top-0 origin-center">
            <span data-k="near" className="absolute inset-x-[3%] bottom-[-2.5%] top-[5%] block rounded-[5%] bg-black/80" />
            <span data-k="far" className="absolute inset-x-[1%] bottom-[-7%] top-[10%] block rounded-[8%] bg-black/70" />
            <div data-k="rig" className="absolute inset-0 [transform-style:preserve-3d]">
              <div data-k="floppy" className="absolute inset-0 [transform-style:preserve-3d]">
                <Art faceRef={copyFace} shutterRef={copyShutter} discRef={copyOxide} mediaRef={copySilver} />
              </div>
              <div data-k="dvd" className="absolute left-1/2 top-1/2">
                <span className="absolute inset-[3%] block rounded-full shadow-[0_28px_60px_-18px_rgba(0,0,0,0.95)]" />
                <span className="absolute inset-0 block rounded-full" style={DISC_HOLE}>
                  <span className="absolute inset-0 block rounded-full" style={DISC_BASE} />
                  <span data-k="light" className="absolute inset-0 block rounded-full" style={DISC_LIGHT} />
                  <span data-k="spin" className="absolute inset-0 block rounded-full">
                    <span data-k="detail" className="absolute inset-0 block rounded-full">
                      <span className="absolute inset-0 block rounded-full" style={DISC_WRITTEN} />
                      {/* The ID moulded into the clear ring round the hub. */}
                      <svg viewBox="0 0 200 200" className="absolute inset-0 block h-full w-full" focusable="false">
                        <defs>
                          <path id={ringTextId} d="M100 100m-20.6 0a20.6 20.6 0 1 1 41.2 0a20.6 20.6 0 1 1-41.2 0" />
                        </defs>
                        <text fill="rgba(236,240,248,0.5)" fontSize="3.5" letterSpacing="0.62" style={{ fontFamily: "var(--font-mono)" }}>
                          <textPath href={`#${ringTextId}`}>
                            {`${identity.fullName.toUpperCase()} · RESUME · ${resume.size} · ${resume.updated.toUpperCase()} `}
                            <tspan fill="#e0895a">●</tspan>
                          </textPath>
                        </text>
                      </svg>
                    </span>
                  </span>
                  <span className="absolute inset-0 block rounded-full" style={DISC_GLOSS} />
                </span>
                {/* The progress ring, with a bright head like a laser. */}
                <svg
                  data-k="ring"
                  viewBox="0 0 120 120"
                  className="absolute left-[-8%] top-[-8%] block h-[116%] w-[116%] overflow-visible"
                  style={{ opacity: 0 }}
                  focusable="false"
                >
                  <circle cx="60" cy="60" r="58" fill="none" stroke="rgba(237,237,230,0.12)" strokeWidth="0.45" />
                  <circle
                    data-k="arc-glow"
                    cx="60"
                    cy="60"
                    r="58"
                    fill="none"
                    stroke="rgba(224,137,90,0.2)"
                    strokeWidth="3.2"
                    strokeLinecap="round"
                    pathLength={1}
                    strokeDasharray="0 1"
                    transform="rotate(-90 60 60)"
                  />
                  <circle
                    data-k="arc"
                    cx="60"
                    cy="60"
                    r="58"
                    fill="none"
                    stroke="#e0895a"
                    strokeWidth="0.9"
                    strokeLinecap="round"
                    pathLength={1}
                    strokeDasharray="0 1"
                    transform="rotate(-90 60 60)"
                  />
                  <circle data-k="head" cx="60" cy="2" r="1.5" fill="#fff1e6" style={{ opacity: 0 }} />
                </svg>
              </div>
            </div>
          </div>

          <span
            data-k="glint"
            className="absolute left-0 top-0 block w-[2px] origin-center rounded-full bg-[linear-gradient(180deg,transparent,rgba(255,255,255,0.95)_30%,rgba(255,255,255,0.95)_70%,transparent)] shadow-[0_0_10px_2px_rgba(255,255,255,0.25)]"
            style={{ opacity: 0 }}
          />

          {/* The drive's readout, under the ring. */}
          <div data-k="read-wrap" className="absolute left-0 top-0 -translate-x-1/2">
            <div
              data-k="read"
              className="t-mono flex min-w-[15.5rem] flex-col gap-2.5 rounded-[10px] border border-white/[0.09] bg-[rgba(12,12,14,0.92)] px-3.5 py-3 !text-[9.5px] shadow-[0_14px_34px_-14px_rgba(0,0,0,0.95)]"
              style={{ opacity: 0 }}
            >
              <span className="flex items-center gap-2 whitespace-nowrap text-bone/85">
                <span data-k="led" className="block h-[5px] w-[5px] shrink-0 rounded-full bg-acid" />
                <span data-k="label">Reading {resume.fileName}</span>
              </span>
              <span className="flex items-center gap-3 whitespace-nowrap">
                <span className="relative block h-[2px] flex-1 overflow-hidden rounded-full bg-white/10">
                  <span className="absolute inset-y-0 left-0 block w-full origin-left bg-acid/70" style={{ transform: "scaleX(0)" }} data-k="bar" />
                </span>
                <span data-k="count" className="tabular-nums text-ash">
                  {counter(0)}
                </span>
              </span>
            </div>
          </div>

          {/* The page, folded in three the way a letter is: the bottom third
              up, the top third down over it. */}
          <div data-k="paper" className="absolute left-0 top-0 [perspective:1800px]" style={{ visibility: "hidden" }}>
            <div data-k="paper-rig" className="absolute inset-0 [transform-style:preserve-3d]">
              <span data-k="paper-shadow" className={`absolute inset-0 block origin-top rounded-[3px] ${PAGE_SHADOW}`} />
              <div className="absolute inset-x-0 top-1/3 h-1/3 [transform-style:preserve-3d]">
                <Slice n={1} decoding={decoding} />
              </div>
              <div data-k="flap-bottom" className="absolute inset-x-0 top-2/3 h-1/3 origin-top [transform-style:preserve-3d]">
                <Slice n={2} decoding={decoding} />
                <Back n={2} />
              </div>
              <div data-k="flap-top" className="absolute inset-x-0 top-0 h-1/3 origin-bottom [transform-style:preserve-3d]">
                <Slice n={0} decoding={decoding} />
                <Back n={0} />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ---- toolbar ------------------------------------------------ */}
      <div className="absolute inset-x-0 top-0 z-[4]">
        <div
          ref={topBar}
          className="flex h-14 items-center gap-3 border-b border-white/[0.07] bg-[rgba(9,9,11,0.8)] pl-4 pr-2.5 backdrop-blur-xl md:h-[68px] md:gap-4 md:px-6 lg:px-8"
        >
          <FileGlyph />
          <div className="min-w-0 flex-1">
            <h2
              ref={heading}
              id={titleId}
              tabIndex={-1}
              className="truncate text-[13px] font-semibold leading-tight text-bone outline-none md:text-sm"
            >
              {resume.fileName}
            </h2>
            <p id={metaId} className="t-mono mt-1 truncate !text-[9px] !tracking-[0.14em] text-ash">
              PDF · {resume.size} · {pages}
              <span className="hidden sm:inline"> · Updated {resume.updated}</span>
            </p>
          </div>

          <div className="hidden items-center gap-2 md:flex">
            <button
              type="button"
              onClick={() => toggleZoom()}
              aria-label={zoomLabel}
              data-cursor={zoom ? "FIT" : "ZOOM"}
              className={`${ghost} h-10 px-4 text-[12.5px] font-medium`}
            >
              <ZoomIcon out={zoom} />
              {zoom ? "Fit" : "Zoom"}
            </button>
            <a
              href={resume.href}
              target="_blank"
              rel="noopener noreferrer"
              data-cursor="OPEN"
              className={`${ghost} h-10 px-4 text-[12.5px] font-medium`}
            >
              <NewTabIcon />
              <span className="lg:hidden">New tab</span>
              <span className="hidden lg:inline">Open in new tab</span>
              <span className="sr-only">, PDF</span>
            </a>
            <a
              ref={dlTop}
              href={resume.href}
              download={resume.fileName}
              type="application/pdf"
              data-cursor="DOWNLOAD"
              className="inline-flex h-10 items-center gap-2 rounded-full bg-acid pl-4 pr-5 text-[13px] font-semibold text-void transition-colors duration-300 hover:bg-bone"
            >
              <DownloadIcon />
              Download PDF
            </a>
          </div>

          <span aria-hidden className="hidden h-6 w-px bg-white/10 md:block" />
          <button
            type="button"
            onClick={() => ctl.current?.close()}
            aria-label="Close preview"
            data-cursor="CLOSE"
            className={`${ghost} h-11 w-11 shrink-0 md:h-10 md:w-10`}
          >
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" aria-hidden focusable="false">
              <path d="M2.5 2.5l9 9M11.5 2.5l-9 9" />
            </svg>
          </button>
        </div>
      </div>

      {/* On a phone the actions sit at the bottom, under the thumb. */}
      <div className="absolute inset-x-0 bottom-0 z-[4] md:hidden">
        <div
          ref={bottomBar}
          className="flex items-center gap-2 border-t border-white/[0.07] bg-[rgba(9,9,11,0.84)] px-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] pt-3 backdrop-blur-xl"
        >
          <button
            type="button"
            onClick={() => toggleZoom()}
            aria-label={zoomLabel}
            data-cursor={zoom ? "FIT" : "ZOOM"}
            className={`${ghost} h-12 w-12 shrink-0`}
          >
            <ZoomIcon out={zoom} />
          </button>
          <a
            href={resume.href}
            target="_blank"
            rel="noopener noreferrer"
            data-cursor="OPEN"
            className={`${ghost} h-12 shrink-0 px-4 text-[13px] font-medium`}
          >
            <NewTabIcon />
            New tab
            <span className="sr-only">, opens the PDF</span>
          </a>
          <a
            ref={dlBottom}
            href={resume.href}
            download={resume.fileName}
            type="application/pdf"
            data-cursor="DOWNLOAD"
            className="inline-flex h-12 min-w-0 flex-1 items-center justify-center gap-2 rounded-full bg-acid px-5 text-[14px] font-semibold text-void transition-colors duration-300 active:bg-bone"
          >
            <DownloadIcon />
            Download PDF
          </a>
        </div>
      </div>

      {/* While it opens, any click just lands it. Not the second click of
          a double-click, though: a floppy looks like a file icon, people
          double-click those, and the second click would skip the whole
          opening the first one started. */}
      {phase === "opening" && (
        <div
          aria-hidden
          className="absolute inset-0 z-[6]"
          onClick={(e) => {
            if (e.detail > 1 || performance.now() - startedAt.current < 320) return;
            ctl.current?.skip();
          }}
        />
      )}
    </div>,
    document.body
  );
}

/* ---- the folded page's parts ------------------------------------------ */

/* One third of the page, front side: the same picture, shifted so each
   third shows its own part of it. */
function Slice({ n, decoding }: { n: 0 | 1 | 2; decoding: "sync" | "async" }) {
  const round = n === 0 ? "rounded-t-[3px]" : n === 2 ? "rounded-b-[3px]" : "";
  return (
    <span className={`absolute inset-0 block overflow-hidden bg-white [backface-visibility:hidden] ${round}`}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={PREVIEW.src}
        width={PREVIEW.width}
        height={PREVIEW.height}
        alt=""
        draggable={false}
        decoding={decoding}
        className="absolute left-0 block h-[300%] w-full max-w-none select-none"
        style={{ top: `${-100 * n}%` }}
      />
      <span data-k={`crease-${n}`} className="absolute inset-0 block" style={{ background: CREASE[n], opacity: 0 }} />
      {n !== 1 && <span data-k={`shade-${n}`} className="absolute inset-0 block bg-black" style={{ opacity: 0 }} />}
    </span>
  );
}

/* The back of a flap: plain paper, and on the one that ends up outside
   when the page is folded, the file's name, like an addressed letter. */
function Back({ n }: { n: 0 | 2 }) {
  return (
    <span
      className={`@container absolute inset-0 block overflow-hidden [backface-visibility:hidden] ${n === 0 ? "rounded-b-[3px]" : "rounded-t-[3px]"}`}
      style={{ transform: "rotateX(180deg)", background: PAPER_BACK }}
    >
      {n === 0 && (
        <span className="absolute inset-0 flex flex-col items-center justify-center gap-[1.6cqw]">
          <span className="flex items-center gap-[1.4cqw] font-mono text-[2.5cqw] font-medium uppercase leading-none tracking-[0.16em] text-[#3a3b42]">
            <span className="block h-[2.2cqw] w-[2.2cqw] rounded-full bg-[#e0895a] shadow-[0_0.5px_0.5px_rgba(0,0,0,0.3)]" />
            {resume.fileName}
          </span>
          <span className="font-mono text-[1.9cqw] uppercase leading-none tracking-[0.2em] text-[#8a8b92]">
            PDF · {resume.size} · {pages}
          </span>
        </span>
      )}
      <span data-k={`shade-back-${n}`} className="absolute inset-0 block bg-black" style={{ opacity: 0 }} />
    </span>
  );
}

/* ---- icons ----------------------------------------------------------- */

/* The same page-with-a-folded-corner as the file in the chat. */
function FileGlyph() {
  return (
    <span aria-hidden className="relative block h-[34px] w-[27px] shrink-0 md:h-[38px] md:w-[30px]">
      <svg viewBox="0 0 34 42" fill="none" focusable="false" className="h-full w-full">
        <path
          d="M3 1h20l10 10v27a3 3 0 0 1-3 3H3a3 3 0 0 1-3-3V4a3 3 0 0 1 3-3Z"
          fill="#edede6"
          fillOpacity="0.09"
          stroke="#edede6"
          strokeOpacity="0.24"
        />
        <path d="M23 1v7a3 3 0 0 0 3 3h7" stroke="#edede6" strokeOpacity="0.24" />
      </svg>
      <span className="absolute bottom-[5px] left-[3px] rounded-[2.5px] bg-acid px-[3px] py-[1px] font-mono text-[6.5px] font-bold leading-none tracking-[0.06em] text-void md:bottom-[6px]">
        PDF
      </span>
    </span>
  );
}

function ZoomIcon({ out }: { out: boolean }) {
  return (
    <svg width="15" height="15" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" aria-hidden focusable="false">
      <circle cx="7" cy="7" r="4.75" />
      <path d="M10.5 10.5 14 14M5 7h4" />
      {!out && <path d="M7 5v4" />}
    </svg>
  );
}

function NewTabIcon() {
  return (
    <svg width="13" height="13" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden focusable="false">
      <path d="M8.5 1.75h3.75V5.5M12.25 1.75 6.5 7.5M10.5 8.5v2.75a1 1 0 0 1-1 1h-6.75a1 1 0 0 1-1-1V4.5a1 1 0 0 1 1-1H5.5" />
    </svg>
  );
}

function DownloadIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.3" strokeLinecap="round" strokeLinejoin="round" aria-hidden focusable="false">
      <path d="M12 4v11M6.5 10 12 15.5 17.5 10M5 20h14" />
    </svg>
  );
}
