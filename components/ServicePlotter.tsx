"use client";

import { memo, useEffect, useId, useRef, useState } from "react";
import type { RefObject } from "react";
import { gsap, ScrollTrigger, reduced } from "@/lib/motion";
import { services } from "@/lib/content";
import {
  INK,
  TONE,
  PAPER,
  LAYOUT,
  PL_ROWS,
  PL_CHARS,
  TITLE_CHARS,
  drawingFor,
  fit,
  sheetOps,
} from "@/components/ServiceDrawings";
import type { Ink, Layout, Op } from "@/components/ServiceDrawings";

/* ============================================================
   THE BLUEPRINT PLOTTER
   "What I can do" as an engineering drawing set: one sheet per service,
   drawn live by a pen plotter. The sheet is a real drawing sheet (grid,
   zoned frame, parts list, title block) and each service has its own
   technical drawing on it, from ServiceDrawings.ts.

   Like the drum it replaced, it is a picture of the list, not a second
   control: the rows stay the only thing you can click, so the whole
   thing is aria-hidden and ignores the pointer.

   How a sheet is plotted:
     1. the drawing on the sheet lifts off (a quick fade)
     2. the pen travels to the first stroke and draws the outlines, then
        hidden and centre lines, then dimensions, then the balloons.
        Each balloon types its row into the parts list as it lands.
     3. the pen heads back to the title block, the title and drawing
        number type in, and it parks on the revision letter.
   Every stroke is revealed by sliding its dash along it, and the pen rides
   the end of the one stroke being drawn (getPointAtLength on that path
   only). The whole plot is one tween on one number, so retargeting is a
   kill and a fresh plan from wherever the pen happens to be.

   Which sheet: from lg up the sheet rides a sticky column beside the list
   and shows the row level with it; hovering, focusing or opening a row
   takes over, and leaving hands back to the scroll. Below lg it sits
   above the list and plots the row you open. It only works on screen: off
   screen the plot pauses, and a change of sheet waits until it is back.

   Two sheets are in the markup, portrait and a landscape one for
   tablets, and CSS shows one. Each has its own engine; the hidden one is
   never on screen, so it never plots.

   Soft mode (the OS asked for less motion) plots exactly the same. It only
   drops the page's inertia and scroll-velocity effects, and this uses
   neither.
   ============================================================ */

type P = [number, number];

const ITEMS = services.items;
const N = ITEMS.length;
const pad = (n: number) => String(n).padStart(2, "0");
const plain = (s: string) => s.replace(/\*/g, "");

/* ---- timing, seconds ------------------------------------------------ */
const DRAW = 1.3; // every stroke of a sheet, however many there are
const LIFT = 0.2; // the old drawing fading off
const TYPE = 0.34; // the title typing in, as the pen comes home
const ROW_TYPE = 0.26; // one parts-list row, as its balloon lands
/* Pen-up moves cost this much of a drawn unit: the pen travels a good
   deal faster than it draws. */
const TRAVEL = 0.32;
/* Hatching is revealed as a whole while the pen sweeps its box. */
const HATCH = 0.7;

/* The pen ring: open while the pen is up or parked (it circles the
   revision letter then), pressed smaller while it draws. */
const RING_UP = 6.2;
const RING_DOWN = 4.6;

/* Order on the sheet: outlines, then hidden and centre lines and
   hatching, then dimensions and notes, then the balloons. */
const RANK: Record<Ink, number> = {
  obj: 0,
  hl: 0,
  hid: 1,
  cl: 1,
  hatch: 1,
  thin: 2,
  lead: 3,
  frame: 4,
  frame2: 4,
  gmin: 4,
  gmaj: 4,
};

const DRAWINGS: Op[][] = ITEMS.map((it, i) => drawingFor(it.title, i));
const SHEETS: Record<Layout, Op[]> = { portrait: sheetOps("portrait"), landscape: sheetOps("landscape") };

function fmtXY(p: P) {
  const f = (v: number) => Math.max(0, v).toFixed(1).padStart(5, "0");
  return `X ${f(p[0])}  Y ${f(p[1])}`;
}

/* The text that changes from sheet to sheet, by slot name. */
function slotsFor(i: number, layout: Layout): Record<string, string> {
  const it = ITEMS[i];
  const s: Record<string, string> = {
    title: fit(plain(it.title).toUpperCase(), TITLE_CHARS),
    dwg: pad(i + 1),
    sheet: `${pad(i + 1)}/${pad(N)}`,
    xy: fmtXY(LAYOUT[layout].park),
  };
  for (let r = 0; r < PL_ROWS; r++) s[`pl${r}`] = it.points[r] ? fit(it.points[r].toUpperCase(), PL_CHARS) : "";
  return s;
}
const SLOTS = ["title", "dwg", "sheet", ...Array.from({ length: PL_ROWS }, (_, r) => `pl${r}`)];

/* One dash pattern, cut off after `s` units of a path `len` long, so a
   dashed line can be drawn on progressively without losing its dashes. */
function partialDash(pat: number[], s: number, len: number) {
  const period = pat.reduce((a, b) => a + b, 0);
  const whole = Math.floor(s / period);
  const out: number[] = [];
  for (let i = 0; i < whole; i++) out.push(...pat);
  let r = s - whole * period;
  for (let j = 0; j < pat.length && r > 0; j++) {
    const take = Math.min(pat[j], r);
    out.push(+take.toFixed(3));
    r -= take;
  }
  if (out.length % 2 === 0) out.push(0);
  out.push(Math.ceil(len + period));
  return out.join(" ");
}

const sineInOut = (u: number) => 0.5 - Math.cos(Math.PI * u) / 2;

/* ============================================================
   THE SHEET, as static SVG. Rendered once: after mount everything on it
   is driven directly, and nothing React renders later touches it.
   ============================================================ */
function OpEl({ op, clip, slotText }: { op: Op; clip: string; slotText?: string }) {
  if (op.k === "p") {
    const k = INK[op.ink];
    return (
      <path
        data-op="p"
        data-ink={op.ink}
        d={op.d}
        fill="none"
        stroke={k.c}
        strokeOpacity={k.o}
        strokeWidth={k.w}
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeDasharray={k.dash?.join(" ")}
      />
    );
  }
  if (op.k === "t") {
    const t = TONE[op.tone];
    return (
      <text
        data-op="t"
        data-slot={op.slot}
        data-lag={op.lag}
        x={op.x}
        y={op.y}
        fontSize={op.size}
        fill={t.c}
        fillOpacity={t.o}
        textAnchor={op.anchor}
        fontWeight={op.bold ? 500 : undefined}
        transform={op.rot ? `rotate(${op.rot} ${op.x} ${op.y})` : undefined}
      >
        {op.slot ? slotText ?? "" : op.s}
      </text>
    );
  }
  if (op.k === "dot") {
    return <circle data-op="dot" cx={op.x} cy={op.y} r={op.r} fill={op.ink === "hl" ? "#e0895a" : "#edede6"} fillOpacity={0.9} />;
  }
  if (op.k === "hatch") {
    const k = INK.hatch;
    return (
      <path
        data-op="hatch"
        data-box={op.box.join(" ")}
        d={op.d}
        clipPath={`url(#${clip})`}
        fill="none"
        stroke={k.c}
        strokeOpacity={k.o}
        strokeWidth={k.w}
      />
    );
  }
  return <rect x={op.x} y={op.y} width={op.w} height={op.h} fill={PAPER} />;
}

const Sheet = memo(function Sheet({ uid, layout }: { uid: string; layout: Layout }) {
  const S = LAYOUT[layout];
  const sheet = SHEETS[layout];
  const first = slotsFor(0, layout);
  const id = (part: string, j: number) => `${uid}-${layout[0]}-${part}-${j}`;
  const clips: { key: string; d: string }[] = [];
  sheet.forEach((op, j) => op.k === "hatch" && clips.push({ key: id("s", j), d: op.clip }));
  DRAWINGS.forEach((ops, d) => ops.forEach((op, j) => op.k === "hatch" && clips.push({ key: id(`d${d}`, j), d: op.clip })));
  return (
    <svg
      viewBox={`0 0 ${S.w} ${S.h}`}
      className="block h-auto w-full font-mono select-none"
      style={{ letterSpacing: "0.04em" }}
      focusable={false}
    >
      <defs>
        {clips.map((c) => (
          <clipPath key={c.key} id={c.key}>
            <path d={c.d} />
          </clipPath>
        ))}
      </defs>

      <g data-sheet>
        {sheet.map((op, j) => (
          <OpEl key={j} op={op} clip={id("s", j)} slotText={op.k === "t" && op.slot ? first[op.slot] : undefined} />
        ))}
      </g>

      {/* The gantry: the bar the pen carriage rides on, spanning the bed.
          Only there while the pen is working. */}
      <g data-gantry transform={`translate(0 ${S.park[1]})`} opacity={0}>
        <path d={`M4 0H${S.w - 4}`} stroke="#edede6" strokeOpacity={0.12} strokeWidth={0.5} />
        <rect x={4.5} y={-2.2} width={8.5} height={4.4} rx={0.8} fill="#edede6" fillOpacity={0.16} />
        <rect x={S.w - 13} y={-2.2} width={8.5} height={4.4} rx={0.8} fill="#edede6" fillOpacity={0.16} />
      </g>

      {DRAWINGS.map((ops, d) => (
        <g key={d} data-dwg={d} visibility={d === 0 ? undefined : "hidden"}>
          {ops.map((op, j) => (
            <OpEl key={j} op={op} clip={id(`d${d}`, j)} />
          ))}
        </g>
      ))}

      {/* The pen head: a ring with four ticks, like the site's cursor. The
          centre dot is the tip, shown only while it is down on the sheet. */}
      <g data-pen transform={`translate(${S.park[0]} ${S.park[1]})`} stroke="#e0895a" fill="none" strokeWidth={0.85}>
        <circle r={6.2} strokeOpacity={0.16} strokeWidth={3.2} />
        <circle data-ring r={RING_UP} />
        <path d="M-11.5 0H-8M8 0H11.5M0 -11.5V-8M0 8V11.5" strokeLinecap="round" />
        <circle data-tip r={1.1} fill="#e0895a" stroke="none" opacity={0} />
      </g>
    </svg>
  );
});

/* ============================================================
   THE ENGINE, one per sheet
   ============================================================ */
type Item = {
  el: SVGPathElement;
  kind: "path" | "hatch";
  len: number;
  a: P;
  b: P;
  dash: number[] | null;
  rank: number;
  /* text and dots shown when this stroke is done */
  after: SVGElement[];
  /* the balloon number, when this stroke is a balloon */
  balloon: number;
};
type Seg =
  | { kind: "travel"; from: P; to: P; t0: number; t1: number }
  | { kind: "path" | "hatch"; item: Item; t0: number; t1: number };
type Typing = { slot: string; text: string; t0: number; dur: number };
type Env = {
  track: HTMLElement;
  led: HTMLSpanElement;
  status: HTMLSpanElement;
  setJob: (i: number) => void;
};
type Engine = { hold: (i: number | null) => void; stop: () => void };

function startEngine(bed: HTMLElement, layout: Layout, env: Env): Engine | null {
  const S = LAYOUT[layout];
  const PARK = S.park;
  const svg = bed.querySelector("svg");
  const pen = svg?.querySelector<SVGGElement>("[data-pen]");
  const ring = pen?.querySelector<SVGCircleElement>("[data-ring]");
  const tip = pen?.querySelector<SVGCircleElement>("[data-tip]");
  const gantry = svg?.querySelector<SVGGElement>("[data-gantry]");
  if (!svg || !pen || !ring || !tip || !gantry) return null;

  const groups = Array.from(svg.querySelectorAll<SVGGElement>("[data-dwg]"));
  const slotEls: Record<string, SVGTextElement> = {};
  svg.querySelectorAll<SVGTextElement>("[data-sheet] [data-slot]").forEach((el) => {
    slotEls[el.dataset.slot as string] = el;
  });
  const slotNames = SLOTS.filter((n) => slotEls[n]);
  const first = slotsFor(0, layout);
  const still = reduced();

  /* ---- state --------------------------------------------------------- */
  let visible = false; // this sheet is on screen
  let ready = false; // it has been on screen once, and the first plot is due
  let desk = false; // lg and up: the scroll picks the sheet
  let scrollRow = 0;
  let held: number | null = null; // hover, keyboard focus or the open row
  let target = 0; // the drawing that should be up
  let shown = -1; // the drawing that is up, or being plotted
  const onSheet: boolean[] = Array(N).fill(false);
  let scrollTimer = 0;
  let backTimer = 0;
  let firstTimer = 0;

  /* ---- the pen ------------------------------------------------------- */
  let penAt: P = [PARK[0], PARK[1]];
  let penMode: "park" | "up" | "down" | "" = "";
  const movePen = (p: P) => {
    penAt = p;
    pen.setAttribute("transform", `translate(${p[0].toFixed(2)} ${p[1].toFixed(2)})`);
    gantry.setAttribute("transform", `translate(0 ${p[1].toFixed(2)})`);
    const xy = slotEls.xy;
    if (xy) xy.textContent = fmtXY(p);
  };
  const setMode = (m: "park" | "up" | "down") => {
    if (m === penMode) return;
    penMode = m;
    ring.setAttribute("r", String(m === "down" ? RING_DOWN : RING_UP));
    tip.setAttribute("opacity", m === "down" ? "1" : "0");
    gantry.setAttribute("opacity", m === "park" ? "0" : "1");
    /* No blinking when parked: a blinking light pulled the eye away
       from the drawing. The pen simply rests. */
  };

  /* The readout below the sheet is shared by both engines, and only the
     one on screen writes to it. Its mark is solid while the pen works and
     dims when it rests: a state, not a flicker. */
  const setBusy = (busy: boolean) => {
    env.led.style.opacity = busy && visible ? "1" : "0.35";
  };
  const setStatus = (s: string) => {
    if (visible && env.status.textContent !== s) env.status.textContent = s;
  };

  /* ---- reading a drawing, once ----------------------------------------
     Lengths and end points come from the paths themselves. That is
     geometry, not layout, and it is done once per drawing. */
  const items: (Item[] | null)[] = Array(N).fill(null);
  const itemsOf = (d: number): Item[] => {
    const known = items[d];
    if (known) return known;
    const list: Item[] = [];
    let last: Item | null = null;
    const early: SVGElement[] = [];
    for (const node of Array.from(groups[d].children)) {
      const el = node as SVGElement;
      const kind = el.getAttribute("data-op");
      if (kind === "p" || kind === "hatch") {
        let it: Item;
        if (kind === "p") {
          const p = el as SVGPathElement;
          const len = Math.max(0.01, p.getTotalLength());
          const s = p.getPointAtLength(0);
          const e = p.getPointAtLength(len);
          const ink = (p.getAttribute("data-ink") ?? "obj") as Ink;
          it = { el: p, kind: "path", len, a: [s.x, s.y], b: [e.x, e.y], dash: INK[ink].dash ?? null, rank: RANK[ink], after: [], balloon: 0 };
        } else {
          const [x0, y0, x1, y1] = (el.getAttribute("data-box") ?? "0 0 0 0").split(" ").map(Number);
          it = { el: el as SVGPathElement, kind: "hatch", len: Math.hypot(x1 - x0, y1 - y0), a: [x0, y1], b: [x1, y0], dash: null, rank: RANK.hatch, after: [], balloon: 0 };
        }
        if (early.length) it.after.push(...early.splice(0));
        list.push(it);
        last = it;
      } else if (last) {
        last.after.push(el);
        if (kind === "t" && last.rank === RANK.lead && /^\d$/.test(el.textContent ?? "")) last.balloon = Number(el.textContent);
      } else {
        early.push(el);
      }
    }
    /* Array.prototype.sort is stable, so each rank keeps drawing order. */
    list.sort((x, y) => x.rank - y.rank);
    items[d] = list;
    return list;
  };

  /* ---- states of a stroke -------------------------------------------- */
  const hideItem = (it: Item) => {
    it.el.style.visibility = "hidden";
    it.el.style.strokeDasharray = "";
    it.el.style.strokeDashoffset = "";
    it.el.style.opacity = "";
    for (const a of it.after) {
      a.style.transition = "none";
      a.style.opacity = "0";
    }
  };
  const drawItem = (it: Item, s: number) => {
    it.el.style.visibility = "visible";
    if (it.kind === "hatch") {
      it.el.style.opacity = (s / it.len).toFixed(3);
    } else if (it.dash) {
      it.el.style.strokeDasharray = partialDash(it.dash, s, it.len);
    } else {
      it.el.style.strokeDasharray = `${it.len} ${it.len}`;
      it.el.style.strokeDashoffset = (it.len - s).toFixed(2);
    }
  };
  const finishItem = (it: Item, instant = false) => {
    it.el.style.visibility = "visible";
    it.el.style.strokeDasharray = "";
    it.el.style.strokeDashoffset = "";
    it.el.style.opacity = "";
    for (const a of it.after) {
      const lag = Number(a.getAttribute("data-lag") ?? 0);
      a.style.transition = instant ? "none" : `opacity 0.18s ease-out ${lag}ms`;
      a.style.opacity = "1";
    }
  };

  /* ---- the plot ------------------------------------------------------ */
  let tween: ReturnType<typeof gsap.to> | null = null;
  let segs: Seg[] = [];
  let typing: Typing[] = [];
  let cursor = 0;
  let total = 0;
  /* the title block text of the sheet being lifted, while it fades, and
     the opacity it starts from (less than 1 if a fade was cut short) */
  let fading = false;
  let fadeFrom = 1;

  const lift = (d: number) => {
    const g = groups[d];
    onSheet[d] = false;
    gsap.killTweensOf(g);
    gsap.to(g, {
      opacity: 0,
      duration: LIFT,
      ease: "power1.out",
      onComplete: () => {
        g.style.visibility = "hidden";
        itemsOf(d).forEach(hideItem);
      },
    });
  };

  const plan = (d: number) => {
    const list = itemsOf(d);
    const weights: { w: number; make: (t0: number, t1: number) => Seg }[] = [];
    let at: P = penAt;
    const travel = (to: P) => {
      const from = at;
      const dist = Math.hypot(to[0] - from[0], to[1] - from[1]);
      if (dist > 0.05) weights.push({ w: dist * TRAVEL, make: (t0, t1) => ({ kind: "travel", from, to, t0, t1 }) });
      at = to;
    };
    for (const it of list) {
      travel(it.a);
      weights.push({ w: it.kind === "hatch" ? it.len * HATCH : it.len, make: (t0, t1) => ({ kind: it.kind, item: it, t0, t1 }) });
      at = it.b;
    }
    travel([PARK[0], PARK[1]]);
    const sum = weights.reduce((a, w) => a + w.w, 0) || 1;
    /* The lift runs under the first travel, so strokes start just after. */
    let t = LIFT * 0.5;
    segs = weights.map((w) => {
      const dt = (w.w / sum) * DRAW;
      const seg = w.make(t, t + dt);
      t += dt;
      return seg;
    });
    const end = t;

    const next = slotsFor(d, layout);
    typing = [];
    /* each parts-list row types in as its balloon lands */
    for (const s of segs) {
      if (s.kind === "path" && s.item.balloon > 0 && s.item.balloon <= PL_ROWS) {
        const r = s.item.balloon - 1;
        typing.push({ slot: `pl${r}`, text: next[`pl${r}`], t0: s.t1, dur: ROW_TYPE });
      }
    }
    for (let r = 0; r < PL_ROWS; r++) {
      if (!typing.some((x) => x.slot === `pl${r}`)) typing.push({ slot: `pl${r}`, text: next[`pl${r}`], t0: end - 0.1, dur: ROW_TYPE });
    }
    /* the title block, as the pen comes home across it */
    typing.push({ slot: "title", text: next.title, t0: end - 0.22, dur: TYPE });
    typing.push({ slot: "dwg", text: next.dwg, t0: end - 0.06, dur: 0.12 });
    typing.push({ slot: "sheet", text: next.sheet, t0: end, dur: 0.2 });
    typing = typing.filter((x) => slotEls[x.slot]);
    total = Math.max(end, ...typing.map((x) => x.t0 + x.dur));
    cursor = 0;
  };

  const frame = (t: number) => {
    /* whatever the old sheet had in its title block fades as it lifts,
       then clears for the new one to type into */
    if (fading) {
      if (t < LIFT) {
        const o = (fadeFrom * (1 - t / LIFT)).toFixed(3);
        for (const n of slotNames) slotEls[n].style.opacity = o;
      } else {
        for (const n of slotNames) {
          slotEls[n].textContent = "";
          slotEls[n].style.opacity = "";
        }
        fading = false;
      }
    }

    while (cursor < segs.length && t >= segs[cursor].t1) {
      const s = segs[cursor];
      if (s.kind === "travel") movePen(s.to);
      else {
        finishItem(s.item);
        movePen(s.item.b);
      }
      cursor++;
    }
    if (cursor < segs.length) {
      const s = segs[cursor];
      if (t >= s.t0) {
        const u = Math.min(1, (t - s.t0) / Math.max(1e-4, s.t1 - s.t0));
        if (s.kind === "travel") {
          setMode("up");
          const e = sineInOut(u);
          movePen([s.from[0] + (s.to[0] - s.from[0]) * e, s.from[1] + (s.to[1] - s.from[1]) * e]);
        } else {
          setMode("down");
          const it = s.item;
          const len = u * it.len;
          drawItem(it, len);
          if (it.kind === "hatch") movePen([it.a[0] + (it.b[0] - it.a[0]) * u, it.a[1] + (it.b[1] - it.a[1]) * u]);
          else {
            const pt = it.el.getPointAtLength(len);
            movePen([pt.x, pt.y]);
          }
        }
      }
    } else {
      setMode("park");
    }

    if (!fading) {
      for (const ty of typing) {
        if (t < ty.t0) continue;
        const n = Math.min(ty.text.length, Math.ceil(((t - ty.t0) / ty.dur) * ty.text.length));
        const el = slotEls[ty.slot];
        const s = ty.text.slice(0, n);
        if (el.textContent !== s) el.textContent = s;
      }
    }
    setStatus(t >= total ? "READY" : `PLOT ${String(Math.min(99, Math.floor((t / total) * 100))).padStart(2, "0")}%`);
  };

  const plot = (d: number) => {
    tween?.kill();
    tween = null;
    /* Nothing to fade the first time round. */
    fading = shown >= 0 && slotNames.some((n) => slotEls[n].textContent);
    fadeFrom = fading ? Math.min(1, Number(slotEls[slotNames[0]].style.opacity || 1)) : 1;
    for (let o = 0; o < N; o++) if (o !== d && onSheet[o]) lift(o);
    const g = groups[d];
    gsap.killTweensOf(g);
    g.style.opacity = "1";
    g.style.visibility = "visible";
    itemsOf(d).forEach(hideItem);
    onSheet[d] = true;
    shown = d;
    env.setJob(d);

    if (still) {
      itemsOf(d).forEach((it) => finishItem(it, true));
      const next = slotsFor(d, layout);
      for (const n of slotNames) {
        slotEls[n].textContent = next[n];
        slotEls[n].style.opacity = "";
      }
      fading = false;
      movePen([PARK[0], PARK[1]]);
      setMode("park");
      setStatus("READY");
      return;
    }

    plan(d);
    setBusy(true);
    const proxy = { t: 0 };
    tween = gsap.to(proxy, {
      t: total,
      duration: total,
      ease: "none",
      onUpdate: () => frame(proxy.t),
      onComplete: () => {
        frame(total);
        setMode("park");
        setBusy(false);
        tween = null;
      },
    });
  };

  /* ---- what to show ---------------------------------------------------
     A held row wins. Otherwise the scroll picks, from lg up; below lg the
     sheet stays on whatever it last plotted. */
  const want = () => held ?? (desk ? scrollRow : target);
  const apply = () => {
    target = want();
    if (ready && visible && target !== shown) plot(target);
  };

  /* ---- on screen or not ---------------------------------------------- */
  const io = new IntersectionObserver(
    ([entry]) => {
      visible = entry.isIntersecting;
      if (visible) {
        if (!ready) {
          /* A beat after it first comes into view, so the reveal is under
             way before the pen starts. */
          if (!firstTimer) {
            firstTimer = window.setTimeout(() => {
              ready = true;
              apply();
            }, 320);
          }
          return;
        }
        apply();
        if (tween) {
          tween.resume();
          setBusy(true);
        }
        if (shown >= 0) env.setJob(shown);
      } else {
        tween?.pause();
        setBusy(false);
      }
    },
    { rootMargin: "40px 0px" }
  );
  io.observe(bed);

  /* ---- the scroll, from lg up ---------------------------------------- */
  const mm = gsap.matchMedia();
  mm.add("(min-width: 1024px)", () => {
    desk = true;
    let rows: number[] = [];
    let span = 1;
    const read = () => {
      rows = Array.from(env.track.querySelectorAll<HTMLElement>("[data-svc-row]")).map((r) => r.offsetTop);
      span = Math.max(1, env.track.offsetHeight);
    };
    const rowAt = (p: number) => {
      const y = p * span;
      let r = 0;
      for (let i = 0; i < rows.length; i++) if (y >= rows[i]) r = i;
      return r;
    };
    read();
    /* The sheet is centred on screen once it is stuck, so the row level
       with it is the one crossing the middle of the viewport. Row
       positions are read on refresh only, never per frame. */
    const st = ScrollTrigger.create({
      trigger: env.track,
      start: "top center",
      end: "bottom center",
      onRefresh: read,
      onUpdate: (self) => {
        const r = rowAt(self.progress);
        if (r === scrollRow) return;
        scrollRow = r;
        /* Settle on a row before plotting it, so a fast scroll through the
           list does not restart the pen at every row it passes. */
        window.clearTimeout(scrollTimer);
        scrollTimer = window.setTimeout(apply, 110);
      },
    });
    scrollRow = rowAt(st.progress);
    apply();
    return () => {
      desk = false;
      window.clearTimeout(scrollTimer);
    };
  });

  /* Ready to plot: everything off the sheet, the pen parked. */
  groups.forEach((g, d) => {
    g.style.visibility = "hidden";
    itemsOf(d).forEach(hideItem);
  });
  for (const n of slotNames) slotEls[n].textContent = "";
  movePen([PARK[0], PARK[1]]);
  setMode("park");

  return {
    hold: (i) => {
      window.clearTimeout(backTimer);
      if (i !== null) {
        held = i;
        apply();
        return;
      }
      /* A beat before handing back, so crossing from one row to the next
         never plots the scroll's row in between. */
      backTimer = window.setTimeout(() => {
        held = null;
        apply();
      }, 140);
    },
    stop: () => {
      window.clearTimeout(scrollTimer);
      window.clearTimeout(backTimer);
      window.clearTimeout(firstTimer);
      io.disconnect();
      mm.revert();
      tween?.kill();
      gsap.killTweensOf(groups);
      /* Back to the sheet the server rendered: drawing 01, finished. */
      groups.forEach((g, d) => {
        g.style.cssText = "";
        itemsOf(d).forEach((it) => {
          it.el.style.cssText = "";
          it.after.forEach((a) => (a.style.cssText = ""));
        });
      });
      for (const n of slotNames) {
        slotEls[n].textContent = first[n];
        slotEls[n].style.cssText = "";
      }
      pen.setAttribute("transform", `translate(${PARK[0]} ${PARK[1]})`);
      pen.style.cssText = "";
      gantry.setAttribute("transform", `translate(0 ${PARK[1]})`);
      gantry.setAttribute("opacity", "0");
      ring.setAttribute("r", String(RING_UP));
      tip.setAttribute("opacity", "0");
      if (slotEls.xy) slotEls.xy.textContent = first.xy;
    },
  };
}

/* ============================================================
   THE COMPONENT
   ============================================================ */
type Props = {
  /* The row under a mouse (or with keyboard focus), if any. */
  hover: number | null;
  /* The expanded row, if any. */
  open: number | null;
  /* The list of rows. From lg up the sheet shows the row beside it. */
  track: RefObject<HTMLElement | null>;
};

/* The sheet itself. Near black with a hint of blue, lit a little from the
   top left. The shadow is invisible on the page and only shows when a lit
   row slides underneath, which is when the sheet should look like it
   lies on top. */
const BED = {
  background: "radial-gradient(130% 95% at 32% 22%, #0b1119 0%, #080c11 45%, #070a0e 70%)",
  boxShadow: "inset 0 1px 0 rgba(255,255,255,0.04), 0 30px 60px -18px rgba(0,0,0,0.85), 0 12px 26px rgba(0,0,0,0.5)",
};

export default function ServicePlotter({ hover, open, track }: Props) {
  const uid = useId().replace(/[^a-zA-Z0-9_-]/g, "");
  const root = useRef<HTMLDivElement>(null);
  const rig = useRef<HTMLDivElement>(null);
  const led = useRef<HTMLSpanElement>(null);
  const status = useRef<HTMLSpanElement>(null);
  const engines = useRef<Engine[]>([]);
  const [job, setJob] = useState(0);

  useEffect(() => {
    const rootEl = root.current;
    const rigEl = rig.current;
    const ledEl = led.current;
    const statusEl = status.current;
    const trackEl = track.current;
    if (!rootEl || !rigEl || !ledEl || !statusEl || !trackEl) return;

    const env: Env = { track: trackEl, led: ledEl, status: statusEl, setJob };
    const list = Array.from(rootEl.querySelectorAll<HTMLElement>("[data-bed]"))
      .map((bed) => startEngine(bed, bed.dataset.bed as Layout, env))
      .filter((e): e is Engine => !!e);
    engines.current = list;

    /* The sheet arrives: up from below as its rail comes into view. */
    const ctx = gsap.context(() => {
      if (reduced()) return;
      const trigger = rootEl.parentElement ?? rootEl;
      gsap.fromTo(
        rigEl,
        { autoAlpha: 0, y: 40 },
        { autoAlpha: 1, y: 0, duration: 1.2, ease: "power3.out", scrollTrigger: { trigger, start: "top 88%" } }
      );
    }, rootEl);

    return () => {
      engines.current = [];
      list.forEach((e) => e.stop());
      ctx.revert();
      statusEl.textContent = "READY";
    };
  }, [track]);

  useEffect(() => {
    engines.current.forEach((e) => e.hold(hover ?? open));
  }, [hover, open]);

  const now = ITEMS[job];

  return (
    <div
      ref={root}
      aria-hidden
      className="pointer-events-none relative w-full max-w-[22rem] select-none md:max-w-none lg:sticky lg:top-[calc(50vh_-_var(--sheet-w)_*_0.5625_-_20px)] lg:w-[var(--sheet-w)]"
    >
      <div ref={rig}>
        {/* Portrait everywhere but a tablet, where a landscape sheet spans
            the page under the heading instead. */}
        <div data-bed="portrait" className="relative overflow-hidden rounded-[3px] border border-white/[0.07] md:hidden lg:block" style={BED}>
          <Sheet uid={uid} layout="portrait" />
        </div>
        <div data-bed="landscape" className="relative hidden overflow-hidden rounded-[3px] border border-white/[0.07] md:block lg:hidden" style={BED}>
          <Sheet uid={uid} layout="landscape" />
        </div>

        {/* The plotter's readout: which sheet, and what the pen is doing.
            A dark plate of its own, like the drum's, so it stays legible
            over a lit row. */}
        <div className="t-mono mt-2 flex h-8 items-center gap-2 rounded-[3px] border border-white/[0.07] bg-[#0a0a0c] px-3 text-[10px] tracking-[0.1em] shadow-[inset_0_1px_0_rgba(255,255,255,0.04),0_8px_22px_rgba(0,0,0,0.55)]">
          <span
            ref={led}
            className="block h-[5px] w-[5px] shrink-0 bg-acid"
            style={{ opacity: 0.35 }}
          />
          <span className="shrink-0 tabular-nums text-bone">
            DWG {pad(job + 1)}
            <span className="text-ash-dim">/{pad(N)}</span>
          </span>
          <span className="min-w-0 flex-1 truncate text-ash">{plain(now.title)}</span>
          <span ref={status} className="shrink-0 tabular-nums text-ash">
            READY
          </span>
        </div>
      </div>
    </div>
  );
}
