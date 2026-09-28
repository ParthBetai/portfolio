"use client";

import { useEffect, useRef } from "react";
import { usePathname } from "next/navigation";
import { reduced } from "@/lib/motion";

/* An engineering reticle instead of the usual dot and trailing ring.

   Idle, it is four corner brackets around a small square centre point,
   with a coordinate readout beside it. The centre sits exactly on the
   pointer and the brackets trail it by a hair, like a camera gimbal
   catching up with its target.

   Over anything clickable the brackets let go of the pointer and lock onto
   the element instead: each corner travels to a corner of its box, and the
   readout turns into a one-word action label under it. Target lock, not a
   hover glow.

   Pointer-only. Touch devices never see it and keep their native
   behaviour, since a custom cursor on touch is a bug, not a feature. */

/* What counts as a target. data-hover stays first so existing markup keeps
   working; the rest means a plain link or button locks without needing the
   attribute. */
const ACTION = '[data-hover], a[href], button, [role="button"], label, summary';
/* The element whose semantics pick the label, when the matched target is a
   data-hover wrapper rather than the control itself. */
const KIND = 'a[href], button, [role="button"], label, summary';
/* Mirrors the selector globals.css uses to bring the native I-beam back.
   Hiding the reticle anywhere else would leave no cursor at all. */
const FIELD = 'input, textarea, select, [contenteditable="true"]';
/* An embed draws its own native cursor and swallows pointer events, so
   the reticle would freeze at its edge next to a second cursor. */
const STEP_ASIDE = `${FIELD}, iframe`;
const DISABLED = ':disabled, [aria-disabled="true"]';

const HALF = 13; // idle reticle is a 26px square
const ARM = 7; // bracket arm length, matches the SVG box below
const PAD = 6; // breathing room between a locked box and its target
const SQUEEZE = 0.18; // how far the brackets pull in on press
const SQUEEZE_MAX = 12; // …capped, or a full-width row would collapse by 200px
const EDGE = 3; // keep everything this far inside the viewport
const DOT = 3;

/* Rough mono metrics for the readout: JetBrains advances 0.6em, plus the
   0.12em tracking, at 9px. Estimating avoids measuring the text, which
   would force a layout in the middle of the frame. */
const CHAR_W = 9 * 0.72;
const TEXT_H = 10;

/* Per-frame lerp factors are tuned at 60fps. Converting them to a per-dt
   factor keeps the lag identical on a 144Hz monitor and a 30fps laptop. */
const step = (rate: number, dt: number) => 1 - Math.pow(1 - rate, dt / (1000 / 60));

/* The centre point is not lerped at all: it sits on the pointer. The rest
   chases it at these rates. Idle, the brackets and readout stay close
   enough to feel attached. Locking onto a target, or letting go of one, is
   slower, so the move between the pointer and a box stays visible. */
const FOLLOW = 0.5;
const LOCK = 0.34;
const FADE = 0.35;
/* After a release the brackets ease from the lock rate back up to the
   follow rate over this long, so the trip home is seen, not a jump. */
const RELEASE_MS = 220;

const pad4 = (v: number) => String(Math.min(9999, Math.max(0, Math.round(v)))).padStart(4, "0");

/* A short verb for what clicking will do. The owner can override any
   target with data-cursor="…" on the element. */
function labelFor(el: Element): string {
  const kind = el.matches(KIND) ? el : el.closest(KIND);
  const own = (el.getAttribute("data-cursor") ?? kind?.getAttribute("data-cursor") ?? "").trim();
  if (own) return own.toUpperCase().slice(0, 24);
  if (!kind) return "GO";

  const tag = kind.tagName.toLowerCase();
  if (tag === "button" || kind.getAttribute("role") === "button") return "PRESS";
  if (tag === "a") {
    let url: URL | null = null;
    try {
      url = new URL(kind.getAttribute("href") ?? "", window.location.href);
    } catch {
      /* a malformed href still navigates somewhere, so it is just GO */
    }
    if (url?.protocol === "mailto:") return "MAIL";
    if (url && /^https?:$/.test(url.protocol) && url.origin !== window.location.origin) {
      return "OPEN ↗";
    }
    return "GO";
  }
  return "SELECT"; // <label>, <summary>
}

const Corner = ({ d, r }: { d: string; r: React.Ref<SVGSVGElement> }) => (
  <svg
    ref={r}
    width={ARM}
    height={ARM}
    viewBox={`0 0 ${ARM} ${ARM}`}
    fill="none"
    stroke="currentColor"
    strokeWidth={1.5}
    className="absolute left-0 top-0 will-change-transform"
    focusable={false}
  >
    <path d={d} />
  </svg>
);

export default function Cursor() {
  const root = useRef<HTMLDivElement>(null);
  const tl = useRef<SVGSVGElement>(null);
  const tr = useRef<SVGSVGElement>(null);
  const br = useRef<SVGSVGElement>(null);
  const bl = useRef<SVGSVGElement>(null);
  const dot = useRef<HTMLSpanElement>(null);
  const readout = useRef<HTMLSpanElement>(null);

  /* Lets a route change ask the loop to look again: the element the
     reticle is locked on has just been swapped out, and the pointer has
     not moved, so no pointer event is coming to say so. */
  const recheck = useRef<() => void>(() => {});
  const pathname = usePathname();

  useEffect(() => {
    const box = root.current;
    const dotEl = dot.current;
    const text = readout.current;
    const cTL = tl.current;
    const cTR = tr.current;
    const cBR = br.current;
    const cBL = bl.current;
    if (!box || !dotEl || !text || !cTL || !cTR || !cBR || !cBL) return;
    if (!window.matchMedia("(hover: hover) and (pointer: fine)").matches || reduced()) return;

    box.style.display = "block";

    /* ---- input state ---------------------------------------------- */
    let px = 0;
    let py = 0;
    let seen = false; // no pointermove yet: stay hidden rather than sit at 0,0
    let inWindow = true;
    let inField = false;
    let pressed = false;
    let moved = false;
    let lock: Element | null = null;
    let rect: DOMRect | null = null;
    let recheckDue = false;
    let lastRecheck = -Infinity;
    let releasedAt = -Infinity;

    let vw = document.documentElement.clientWidth;
    let vh = document.documentElement.clientHeight;

    /* ---- lerped state ----------------------------------------------
       Positions: dot x,y · corners TL, TR, BR, BL (x,y each) · readout x,y.
       Opacities: whole reticle · centre point · readout. */
    const cur = new Array<number>(12).fill(0);
    const tgt = new Array<number>(12).fill(0);
    const op = [0, 1, 0.55];
    const opT = [0, 1, 0.55];
    let snap = false;

    let textLen = 0;
    const setText = (s: string) => {
      if (text.textContent !== s) text.textContent = s;
      textLen = s.length;
    };
    const coords = () => `X ${pad4(px)}  Y ${pad4(py)}`;

    const setLock = (next: Element | null) => {
      if (next === lock) return;
      /* Same clock as the rAF timestamp the loop compares it with. */
      if (lock && !next) releasedAt = performance.now();
      lock = next;
      rect = null;
      /* The readout blinks off and fades back in with its new text, the
         way an instrument display refreshes, instead of the old label
         sliding across the page. */
      op[2] = 0;
      setText(lock ? labelFor(lock) : coords());
    };

    const resolve = (el: EventTarget | null) => {
      if (!(el instanceof Element)) {
        inField = false;
        setLock(null);
        return;
      }
      inField = !!el.closest(STEP_ASIDE);
      let next: Element | null = null;
      if (!inField) {
        const hit = el.closest(ACTION);
        if (hit && !hit.matches(DISABLED)) next = hit;
      }
      setLock(next);
    };

    const hitTest = () => resolve(document.elementFromPoint(px, py));

    /* ---- the loop -------------------------------------------------- */
    let raf = 0;
    let last = 0;
    let frame = 0;
    let still = 0;

    const tf = (x: number, y: number) => `translate3d(${x.toFixed(2)}px, ${y.toFixed(2)}px, 0)`;

    const write = () => {
      dotEl.style.transform = tf(cur[0] - DOT / 2, cur[1] - DOT / 2);
      /* Each bracket is a 7px box; translate puts its outer corner on the
         reticle corner, so the offset depends on which way it faces. */
      cTL.style.transform = tf(cur[2], cur[3]);
      cTR.style.transform = tf(cur[4] - ARM, cur[5]);
      cBR.style.transform = tf(cur[6] - ARM, cur[7] - ARM);
      cBL.style.transform = tf(cur[8], cur[9] - ARM);
      text.style.transform = tf(cur[10], cur[11]);
      box.style.opacity = op[0].toFixed(3);
      dotEl.style.opacity = op[1].toFixed(3);
      text.style.opacity = op[2].toFixed(3);
    };

    const targets = () => {
      let L: number;
      let T: number;
      let R: number;
      let B: number;

      if (lock && rect) {
        L = Math.max(rect.left - PAD, EDGE);
        T = Math.max(rect.top - PAD, EDGE);
        R = Math.min(rect.right + PAD, vw - EDGE);
        B = Math.min(rect.bottom + PAD, vh - EDGE);
        /* Never frame tighter than the idle reticle: on a 12px icon the
           brackets would cross each other. */
        if (R - L < HALF * 2) {
          const m = (L + R) / 2;
          L = m - HALF;
          R = m + HALF;
        }
        if (B - T < HALF * 2) {
          const m = (T + B) / 2;
          T = m - HALF;
          B = m + HALF;
        }
        if (pressed) {
          const sx = Math.min(((R - L) / 2) * SQUEEZE, SQUEEZE_MAX);
          const sy = Math.min(((B - T) / 2) * SQUEEZE, SQUEEZE_MAX);
          L += sx;
          R -= sx;
          T += sy;
          B -= sy;
        }
      } else {
        const h = pressed ? HALF * (1 - SQUEEZE) : HALF;
        L = px - h;
        R = px + h;
        T = py - h;
        B = py + h;
      }

      tgt[0] = px;
      tgt[1] = py;
      tgt[2] = L;
      tgt[3] = T;
      tgt[4] = R;
      tgt[5] = T;
      tgt[6] = R;
      tgt[7] = B;
      tgt[8] = L;
      tgt[9] = B;

      /* Readout: under the target's bottom-left when locked, off the
         bottom-right of the reticle when idle. Near an edge it flips to
         the other side rather than running off the screen. */
      const w = textLen * CHAR_W;
      let rx: number;
      let ry: number;
      if (lock && rect) {
        rx = L;
        ry = B + 6;
        if (ry + TEXT_H > vh - EDGE) ry = T - 6 - TEXT_H;
      } else {
        rx = R + 6;
        ry = B + 4;
        if (rx + w > vw - EDGE) rx = L - 6 - w;
        if (ry + TEXT_H > vh - EDGE) ry = T - 4 - TEXT_H;
      }
      tgt[10] = Math.min(Math.max(rx, EDGE), vw - EDGE - w);
      tgt[11] = Math.min(Math.max(ry, EDGE), vh - EDGE - TEXT_H);

      opT[0] = seen && inWindow && !inField ? 1 : 0;
      opT[1] = lock ? 0 : 1;
      opT[2] = lock ? 0.9 : 0.55;
    };

    const tick = (t: number) => {
      const dt = last ? Math.min(Math.max(t - last, 1), 64) : 1000 / 60;
      last = t;
      frame++;

      const wasMoved = moved;
      moved = false;

      /* Scrolling slides content under a still pointer, and no pointer
         event reports it. Hit-testing is a forced layout, so it is
         throttled to a few times a second while the page moves. */
      if (recheckDue && t - lastRecheck >= 80) {
        recheckDue = false;
        lastRecheck = t;
        hitTest();
      }

      /* Locked targets are re-measured every frame: magnetic buttons lean
         toward the pointer, and the brackets have to ride along. Reads
         happen before any write, so the layout is still clean. */
      let rectMoved = false;
      if (lock && !lock.isConnected) hitTest();
      if (lock) {
        const r = lock.getBoundingClientRect();
        if (r.width === 0 && r.height === 0) {
          setLock(null); // display:none'd under the pointer
        } else if (lock.matches(DISABLED)) {
          /* A control can be disabled after a click, under a pointer that
             has not moved. A dead control is not a target. */
          setLock(null);
        } else {
          rectMoved =
            !rect ||
            Math.abs(r.left - rect.left) +
              Math.abs(r.top - rect.top) +
              Math.abs(r.width - rect.width) +
              Math.abs(r.height - rect.height) >
              0.05;
          rect = r;
          /* A target can slide out from under a still pointer, say a row
             an accordion above it just pushed down. No pointer event says
             so, so when it moves and the pointer ends up outside its box,
             look again. Only on movement: a static box with an overflowing
             child under the pointer would otherwise re-test forever and
             keep the loop awake. */
          if (
            rectMoved &&
            (px < r.left - 1 || px > r.right + 1 || py < r.top - 1 || py > r.bottom + 1)
          ) {
            recheckDue = true;
          }
        }
      }

      targets();

      let settled = !wasMoved && !rectMoved && !recheckDue;
      if (snap) {
        for (let i = 0; i < cur.length; i++) cur[i] = tgt[i];
        snap = false;
      } else {
        /* indices 0 and 1 are the centre point: no easing, no lag */
        cur[0] = tgt[0];
        cur[1] = tgt[1];
        /* A release found by a hit-test inside this tick is stamped after
           the frame's timestamp, so the difference can dip below zero. */
        const since = Math.max(0, t - releasedAt);
        const rate = lock
          ? LOCK
          : since < RELEASE_MS
            ? LOCK + (FOLLOW - LOCK) * (since / RELEASE_MS)
            : FOLLOW;
        const a = step(rate, dt);
        for (let i = 2; i < cur.length; i++) {
          cur[i] += (tgt[i] - cur[i]) * a;
          if (Math.abs(tgt[i] - cur[i]) > 0.08) settled = false;
        }
      }
      const aOp = step(FADE, dt);
      for (let i = 0; i < op.length; i++) {
        op[i] += (opT[i] - op[i]) * aOp;
        if (Math.abs(opT[i] - op[i]) > 0.004) settled = false;
      }

      /* The coordinate text changes every other frame at most: it is read
         as a flicker of numbers, and rewriting text is a layout. */
      if (!lock && frame % 2 === 0) setText(coords());

      if (settled && ++still >= 8) {
        for (let i = 0; i < cur.length; i++) cur[i] = tgt[i];
        for (let i = 0; i < op.length; i++) op[i] = opT[i];
        if (!lock) setText(coords());
        write();
        raf = 0;
        return; // asleep until the next pointer event
      }
      if (!settled) still = 0;

      write();
      raf = requestAnimationFrame(tick);
    };

    const wake = () => {
      still = 0;
      if (!raf) {
        last = 0;
        raf = requestAnimationFrame(tick);
      }
    };

    /* ---- events: all delegated, nothing bound per element ------------ */
    const onMove = (e: PointerEvent) => {
      if (e.pointerType === "touch") return;
      px = e.clientX;
      py = e.clientY;
      /* The centre point is written straight from the event as well as in
         the loop. Where a browser delivers pointer events after that
         frame's rAF has already run, waiting for the loop would leave the
         dot a frame behind the pointer. */
      dotEl.style.transform = tf(px - DOT / 2, py - DOT / 2);
      moved = true;
      inWindow = true;
      /* A right-click menu can swallow the pointerup. */
      if (e.buttons === 0) pressed = false;
      if (!seen) {
        seen = true;
        /* The native cursor goes only once ours can take its place, so
           there is never a moment with no cursor at all. */
        document.body.dataset.cursor = "on";
        setText(coords());
      }
      /* While invisible, jump straight to the pointer, so coming back into
         the window never shows the reticle flying in from where it left. */
      if (op[0] < 0.02) snap = true;
      resolve(e.target);
      wake();
    };

    const onOver = (e: PointerEvent) => {
      if (e.pointerType === "touch") return;
      px = e.clientX;
      py = e.clientY;
      inWindow = true;
      resolve(e.target);
      wake();
    };

    const onOut = (e: PointerEvent) => {
      /* No related target means the pointer went off the page entirely. */
      if (e.pointerType === "touch" || e.relatedTarget !== null) return;
      inWindow = false;
      wake();
    };

    const onLeave = () => {
      inWindow = false;
      wake();
    };

    const onDown = (e: PointerEvent) => {
      if (e.pointerType === "touch") return;
      pressed = true;
      wake();
    };

    const onUp = () => {
      if (!pressed) return;
      pressed = false;
      wake();
    };

    const onScroll = () => {
      if (!seen) return;
      recheckDue = true;
      wake();
    };

    const onResize = () => {
      vw = document.documentElement.clientWidth;
      vh = document.documentElement.clientHeight;
      onScroll();
    };

    /* A key can close the menu that holds the locked link. Only worth a
       hit-test when something is locked, so typing in the form costs
       nothing. Passive: focus and key handling are never touched. */
    const onKey = () => {
      if (lock) onScroll();
    };

    recheck.current = onScroll;

    window.addEventListener("pointermove", onMove, { passive: true });
    window.addEventListener("pointerover", onOver, { passive: true });
    window.addEventListener("pointerout", onOut, { passive: true });
    window.addEventListener("pointerdown", onDown, { passive: true });
    window.addEventListener("pointerup", onUp, { passive: true });
    window.addEventListener("pointercancel", onUp, { passive: true });
    window.addEventListener("blur", onUp);
    window.addEventListener("resize", onResize, { passive: true });
    window.addEventListener("keydown", onKey, { passive: true });
    /* Capture, because scroll does not bubble and inner scrollers count. */
    document.addEventListener("scroll", onScroll, { capture: true, passive: true });
    document.addEventListener("pointerleave", onLeave);

    return () => {
      cancelAnimationFrame(raf);
      raf = 0;
      recheck.current = () => {};
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerover", onOver);
      window.removeEventListener("pointerout", onOut);
      window.removeEventListener("pointerdown", onDown);
      window.removeEventListener("pointerup", onUp);
      window.removeEventListener("pointercancel", onUp);
      window.removeEventListener("blur", onUp);
      window.removeEventListener("resize", onResize);
      window.removeEventListener("keydown", onKey);
      document.removeEventListener("scroll", onScroll, { capture: true });
      document.removeEventListener("pointerleave", onLeave);
      delete document.body.dataset.cursor;
      box.style.display = "";
      box.style.opacity = "";
    };
  }, []);

  /* Client-side navigation replaces the page under a still pointer. */
  useEffect(() => {
    recheck.current();
  }, [pathname]);

  return (
    /* A 0×0 fixed origin: children are placed only by transform, and
       difference blending keeps the bone-white strokes readable on the
       black page, the copper rows and the white buttons alike. Hidden until
       the effect decides this device gets a custom cursor at all. */
    <div
      ref={root}
      aria-hidden="true"
      className="pointer-events-none fixed left-0 top-0 z-[70] hidden h-0 w-0 text-bone mix-blend-difference"
      style={{ opacity: 0 }}
    >
      <Corner r={tl} d="M0.75 7V0.75H7" />
      <Corner r={tr} d="M0 0.75H6.25V7" />
      <Corner r={br} d="M6.25 0V6.25H0" />
      <Corner r={bl} d="M7 6.25H0.75V0" />
      <span
        ref={dot}
        className="absolute left-0 top-0 block bg-current will-change-transform"
        style={{ width: DOT, height: DOT }}
      />
      <span
        ref={readout}
        className="absolute left-0 top-0 block whitespace-pre font-mono text-[9px] leading-none tabular-nums tracking-[0.12em] uppercase will-change-transform"
        style={{ opacity: 0.55 }}
      />
    </div>
  );
}
