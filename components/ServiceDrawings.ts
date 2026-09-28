/* ============================================================
   SERVICE DRAWINGS
   The geometry behind the blueprint plotter in "What I can do": one
   engineering drawing per service, plus the sheet they are drawn on
   (frame, zones, grid, parts list, title block).

   Pure data. Nothing here touches React or the DOM, so the same ops can be
   rendered by the component and by a plain script when checking the line
   work. Every stroke is one continuous subpath: the plotter reveals a
   stroke by sliding its dash along it, and a dash restarts at every
   subpath, so a path with two pieces would appear all at once. That is
   why arrowheads retrace their own wings and why balloons are drawn as a
   leader that runs straight on into its circle.

   Units are sheet units. The drawings sit inside x 14..386, y 14..330,
   which both sheet layouts (see THE SHEET at the bottom) leave free, and
   a sheet renders at roughly one CSS pixel per unit on a desktop.

   Conventions, as on a real drawing:
     obj    visible outlines, the heaviest line
     thin   dimension, extension and leader lines
     cl     centre lines, long dash and dot
     hid    hidden edges, short dashes
     hatch  section hatching, 45 degrees
     hl     the one thing on each sheet drawn in the accent
   ============================================================ */

export type Ink = "obj" | "thin" | "lead" | "cl" | "hid" | "hl" | "hatch" | "frame" | "frame2" | "gmin" | "gmaj";
export type Tone = "bone" | "ash" | "dim" | "hl";
export type Anchor = "start" | "middle" | "end";
type P = [number, number];

export type PathOp = { k: "p"; d: string; ink: Ink };
export type TextOp = {
  k: "t";
  x: number;
  y: number;
  s: string;
  size: number;
  anchor: Anchor;
  rot: number;
  tone: Tone;
  bold?: boolean;
  /* Named fields the plotter retypes when the sheet changes. */
  slot?: string;
  /* Extra delay in ms before the text shows, after the stroke it belongs
     to is finished. Lets a block of lines come up one after another. */
  lag?: number;
};
export type DotOp = { k: "dot"; x: number; y: number; r: number; ink: "obj" | "hl" };
export type HatchOp = { k: "hatch"; clip: string; d: string; box: [number, number, number, number] };
export type BoxOp = { k: "box"; x: number; y: number; w: number; h: number };
export type Op = PathOp | TextOp | DotOp | HatchOp | BoxOp;

export const PAPER = "#070a0e";
const BONE = "#edede6";
const ACID = "#e0895a";

export const INK: Record<Ink, { c: string; o: number; w: number; dash?: number[] }> = {
  obj: { c: BONE, o: 0.9, w: 1.05 },
  thin: { c: BONE, o: 0.46, w: 0.5 },
  lead: { c: BONE, o: 0.6, w: 0.55 },
  cl: { c: BONE, o: 0.36, w: 0.5, dash: [9, 2.2, 1.4, 2.2] },
  hid: { c: BONE, o: 0.5, w: 0.55, dash: [3, 1.8] },
  hl: { c: ACID, o: 1, w: 1.15 },
  hatch: { c: BONE, o: 0.3, w: 0.42 },
  frame: { c: BONE, o: 0.5, w: 0.8 },
  frame2: { c: BONE, o: 0.24, w: 0.5 },
  gmin: { c: "#7fa6dc", o: 0.07, w: 0.5 },
  gmaj: { c: "#7fa6dc", o: 0.13, w: 0.5 },
};

export const TONE: Record<Tone, { c: string; o: number }> = {
  bone: { c: BONE, o: 0.84 },
  ash: { c: "#8e8e96", o: 1 },
  dim: { c: "#5b5b64", o: 1 },
  hl: { c: ACID, o: 1 },
};

/* JetBrains Mono advances 0.6em per glyph, so text width is known without
   measuring it. */
export const MONO_ADVANCE = 0.6;

/* ---- vector helpers ------------------------------------------------- */
const RAD = Math.PI / 180;
const r2 = (v: number) => Math.round(v * 100) / 100;
const q = (p: P) => `${r2(p[0])} ${r2(p[1])}`;
const add = (a: P, b: P): P => [a[0] + b[0], a[1] + b[1]];
const sub = (a: P, b: P): P => [a[0] - b[0], a[1] - b[1]];
const mul = (a: P, s: number): P => [a[0] * s, a[1] * s];
const unit = (a: P): P => {
  const l = Math.hypot(a[0], a[1]) || 1;
  return [a[0] / l, a[1] / l];
};
/* Angles are screen angles: 0 points right, 90 points down. */
const polar = (c: P, r: number, deg: number): P => [c[0] + r * Math.cos(deg * RAD), c[1] + r * Math.sin(deg * RAD)];

export const line = (a: P, b: P) => `M${q(a)}L${q(b)}`;
export const poly = (pts: P[], close = false) => `M${pts.map(q).join("L")}${close ? "Z" : ""}`;
export const rrect = (x: number, y: number, w: number, h: number, r = 0) => {
  if (!r) return `M${q([x, y])}H${r2(x + w)}V${r2(y + h)}H${r2(x)}Z`;
  const k = Math.min(r, w / 2, h / 2);
  const A = `A${r2(k)} ${r2(k)} 0 0 1`;
  return (
    `M${q([x + k, y])}H${r2(x + w - k)}${A} ${q([x + w, y + k])}V${r2(y + h - k)}` +
    `${A} ${q([x + w - k, y + h])}H${r2(x + k)}${A} ${q([x, y + h - k])}V${r2(y + k)}${A} ${q([x + k, y])}Z`
  );
};
/* Starts at the top and runs clockwise, which is how a hand draws one. */
export const circle = (c: P, r: number) =>
  `M${q([c[0], c[1] - r])}A${r2(r)} ${r2(r)} 0 1 1 ${q([c[0], c[1] + r])}A${r2(r)} ${r2(r)} 0 1 1 ${q([c[0], c[1] - r])}Z`;
export const arc = (c: P, r: number, a0: number, a1: number) => {
  const large = Math.abs(a1 - a0) > 180 ? 1 : 0;
  const sweep = a1 > a0 ? 1 : 0;
  return `M${q(polar(c, r, a0))}A${r2(r)} ${r2(r)} 0 ${large} ${sweep} ${q(polar(c, r, a1))}`;
};
const ellipse = (c: P, rx: number, ry: number) =>
  `M${q([c[0] - rx, c[1]])}A${r2(rx)} ${r2(ry)} 0 1 1 ${q([c[0] + rx, c[1]])}A${r2(rx)} ${r2(ry)} 0 1 1 ${q([c[0] - rx, c[1]])}Z`;
const star = (c: P, R: number, r: number) =>
  poly(
    Array.from({ length: 10 }, (_, i) => polar(c, i % 2 ? r : R, -90 + i * 36)),
    true
  );

/* A spur gear as one closed outline. Straight flanks: at drawing scale they
   read as involute teeth and keep the path short. */
const gear = (c: P, z: number, rp: number, m: number, phase: number) => {
  const rt = rp + m;
  const rr = rp - 1.25 * m;
  const tau = 360 / z;
  let d = "";
  for (let i = 0; i < z; i++) {
    const a = phase + i * tau;
    const p = [
      polar(c, rr, a - 0.27 * tau),
      polar(c, rt, a - 0.13 * tau),
      polar(c, rt, a + 0.13 * tau),
      polar(c, rr, a + 0.27 * tau),
    ];
    d += i === 0 ? `M${q(p[0])}` : `A${r2(rr)} ${r2(rr)} 0 0 1 ${q(p[0])}`;
    d += `L${q(p[1])}A${r2(rt)} ${r2(rt)} 0 0 1 ${q(p[2])}L${q(p[3])}`;
  }
  return `${d}A${r2(rr)} ${r2(rr)} 0 0 1 ${q(polar(c, rr, phase - 0.27 * tau))}Z`;
};

/* Pins along one edge of a chip: the path runs along the edge (on top of
   the body outline) and out and back for each pin, so all of them are one
   stroke. */
const pins = (a: P, b: P, count: number, len: number, w: number) => {
  const u = unit(sub(b, a));
  const n: P = [u[1], -u[0]];
  const total = Math.hypot(b[0] - a[0], b[1] - a[1]);
  const pitch = total / count;
  const pts: P[] = [a];
  for (let i = 0; i < count; i++) {
    const m = pitch * (i + 0.5);
    const s = add(a, mul(u, m - w / 2));
    const e = add(a, mul(u, m + w / 2));
    pts.push(s, add(s, mul(n, len)), add(e, mul(n, len)), e);
  }
  pts.push(b);
  return poly(pts);
};

/* ---- the drawing kit ------------------------------------------------ */
const AL = 4; // arrowhead length
const AW = 1.15; // arrowhead half width
const wings = (tip: P, dir: P): [P, P] => {
  const n: P = [-dir[1], dir[0]];
  const back = sub(tip, mul(dir, AL));
  return [add(back, mul(n, AW)), sub(back, mul(n, AW))];
};

class Kit {
  ops: Op[] = [];

  p(d: string, ink: Ink = "obj") {
    this.ops.push({ k: "p", d, ink });
  }
  t(x: number, y: number, s: string, o: Partial<Omit<TextOp, "k" | "x" | "y" | "s">> = {}) {
    this.ops.push({
      k: "t",
      x: r2(x),
      y: r2(y),
      s,
      size: o.size ?? 5.8,
      anchor: o.anchor ?? "middle",
      rot: o.rot ?? 0,
      tone: o.tone ?? "bone",
      bold: o.bold,
      slot: o.slot,
      lag: o.lag,
    });
  }
  dot(c: P, r = 1.1, ink: "obj" | "hl" = "obj") {
    this.ops.push({ k: "dot", x: r2(c[0]), y: r2(c[1]), r, ink });
  }
  cl(a: P, b: P) {
    this.p(line(a, b), "cl");
  }
  /* 45 degree section lines inside `clip`, which is any closed path. */
  hatch(clip: string, box: [number, number, number, number], angle = 45, gap = 3) {
    const a = -angle * RAD;
    const d: P = [Math.cos(a), Math.sin(a)];
    const m: P = [-d[1], d[0]];
    const [x0, y0, x1, y1] = box;
    const cs: P[] = [
      [x0, y0],
      [x1, y0],
      [x1, y1],
      [x0, y1],
    ];
    const pm = cs.map((c) => c[0] * m[0] + c[1] * m[1]);
    const pd = cs.map((c) => c[0] * d[0] + c[1] * d[1]);
    const d0 = Math.min(...pd);
    const d1 = Math.max(...pd);
    let s = "";
    for (let v = Math.ceil(Math.min(...pm) / gap) * gap; v <= Math.max(...pm); v += gap) {
      s += `M${q(add(mul(m, v), mul(d, d0)))}L${q(add(mul(m, v), mul(d, d1)))}`;
    }
    this.ops.push({ k: "hatch", clip, d: s, box });
  }
  /* A linear dimension from p1 to p2, `off` units out along the normal
     (positive is up for a left-to-right pair). `outside` puts the arrows
     outside the extension lines, for gaps too small to hold them. */
  dim(p1: P, p2: P, off: number, text: string, o: { outside?: boolean; shift?: number; ext?: boolean } = {}) {
    const u = unit(sub(p2, p1));
    const n: P = [u[1], -u[0]];
    const s = Math.sign(off) || 1;
    const a = add(p1, mul(n, off));
    const b = add(p2, mul(n, off));
    if (o.ext !== false) {
      this.p(line(add(p1, mul(n, s * 1.6)), add(a, mul(n, s * 2.4))), "thin");
      this.p(line(add(p2, mul(n, s * 1.6)), add(b, mul(n, s * 2.4))), "thin");
    }
    if (!o.outside) {
      const [a1, a2] = wings(a, mul(u, -1));
      const [b1, b2] = wings(b, u);
      this.p(poly([a1, a, a2, a, b, b1, b, b2]), "thin");
    } else {
      const [a1, a2] = wings(a, u);
      const [b1, b2] = wings(b, mul(u, -1));
      this.p(poly([sub(a, mul(u, 8)), a, a1, a, a2, a, b, b1, b, b2, b, add(b, mul(u, 8))]), "thin");
    }
    let th = Math.atan2(u[1], u[0]) / RAD;
    if (th >= 89.99) th -= 180;
    else if (th < -90.01) th += 180;
    const up: P = [Math.sin(th * RAD), -Math.cos(th * RAD)];
    const pos = add(add(mul(add(a, b), 0.5), mul(u, o.shift ?? 0)), mul(up, 1.7));
    this.t(pos[0], pos[1], text, { rot: r2(th) });
  }
  /* An angle between two rays from c, a0 < a1, arrows at both ends. */
  angle(c: P, r: number, a0: number, a1: number, text: string, tr = r + 6.5) {
    const p0 = polar(c, r, a0);
    const p1 = polar(c, r, a1);
    const [w0a, w0b] = wings(p0, [Math.sin(a0 * RAD), -Math.cos(a0 * RAD)]);
    const [w1a, w1b] = wings(p1, [-Math.sin(a1 * RAD), Math.cos(a1 * RAD)]);
    const large = a1 - a0 > 180 ? 1 : 0;
    this.p(
      `M${q(w0a)}L${q(p0)}L${q(w0b)}L${q(p0)}A${r2(r)} ${r2(r)} 0 ${large} 1 ${q(p1)}L${q(w1a)}L${q(p1)}L${q(w1b)}`,
      "thin"
    );
    const tp = polar(c, tr, (a0 + a1) / 2);
    this.t(tp[0], tp[1] + 2, text);
  }
  /* A direction-of-motion arc: arrow at the a1 end. */
  turn(c: P, r: number, a0: number, a1: number) {
    const p1 = polar(c, r, a1);
    const dir: P = a1 > a0 ? [-Math.sin(a1 * RAD), Math.cos(a1 * RAD)] : [Math.sin(a1 * RAD), -Math.cos(a1 * RAD)];
    const [w1, w2] = wings(p1, dir);
    this.p(`${arc(c, r, a0, a1)}L${q(w1)}L${q(p1)}L${q(w2)}`, "thin");
  }
  /* A straight flow arrow. */
  arrow(a: P, b: P, ink: Ink = "thin") {
    const [w1, w2] = wings(b, unit(sub(b, a)));
    this.p(poly([a, b, w1, b, w2]), ink);
  }
  /* Item balloon: a leader from the part (dot end) running on into the
     circle, then the item number. Text and dots always follow the stroke
     they belong to: the plotter shows them when that stroke is done. */
  balloon(n: number, b: P, t: P, r = 5.6) {
    const v = unit(sub(t, b));
    const e = add(b, mul(v, r));
    const o = sub(b, mul(v, r));
    this.p(`M${q(t)}L${q(e)}A${r} ${r} 0 1 1 ${q(o)}A${r} ${r} 0 1 1 ${q(e)}`, "lead");
    this.dot(t, 1);
    this.t(b[0], b[1] + 2.1, String(n), { size: 6 });
  }
  /* A leader with an arrow on the part, a shoulder, and a note. */
  note(t: P, knee: P, text: string, side: 1 | -1 = 1) {
    const [w1, w2] = wings(t, unit(sub(t, knee)));
    const end = add(knee, [side * 7, 0]);
    this.p(poly([w1, t, w2, t, knee, end]), "thin");
    this.t(end[0] + side * 1.6, end[1] + 2, text, { anchor: side > 0 ? "start" : "end" });
  }
  /* View title, underlined, with an optional scale beneath. */
  label(x: number, y: number, s: string, scale?: string) {
    const w = s.length * 5.6 * MONO_ADVANCE + (s.length - 1) * 0.8;
    this.p(line([x - w / 2, y + 2.2], [x + w / 2, y + 2.2]), "thin");
    this.t(x, y, s, { size: 5.6, tone: "ash" });
    if (scale) this.t(x, y + 8.4, `SCALE ${scale}`, { size: 4.6, tone: "dim" });
  }
}

/* ============================================================
   01  MOBILE: front and side elevation, a detail of the camera
   ============================================================ */
function mobile(k: Kit) {
  const X = 96;
  const Y = 58;
  const W = 100;
  const H = 204;
  const R = 14;
  const cx = X + W / 2;
  const i = 4.5;
  const sx = X + i;
  const sy = Y + i;
  const sw = W - 2 * i;
  const cam: P = [cx, sy + 8.5];

  k.p(rrect(X, Y, W, H, R));
  k.p(rrect(sx, sy, sw, H - 2 * i, R - i));
  k.p(circle(cam, 2.6));
  /* the carousel, with its neighbours peeking in at the edges */
  k.p(rrect(sx + 10.5, 86, sw - 21, 50, 3.5));
  k.p(poly([[sx, 90], [sx + 4.5, 90], [sx + 4.5, 132], [sx, 132]]));
  k.p(poly([[sx + sw, 90], [sx + sw - 4.5, 90], [sx + sw - 4.5, 132], [sx + sw, 132]]));
  [-7, 0, 7].forEach((o) => k.p(circle([cx + o, 144], 1.3)));
  [-22, -11, 0, 11, 22].forEach((o) => k.p(star([cx + o, 158.5], 3.5, 1.5)));
  [177, 197].forEach((y, j) => {
    k.p(rrect(sx + 10.5, y - 4.5, 9, 9, 1.5));
    k.p(line([sx + 25, y - 1.5], [sx + sw - 10.5, y - 1.5]), "thin");
    k.p(line([sx + 25, y + 3], [sx + 25 + (j ? 30 : 40), y + 3]), "thin");
  });
  /* Android's own navigation bar: back, home, recents */
  k.p(line([sx, 234], [sx + sw, 234]), "thin");
  k.p(poly([[cx - 22.5, 246], [cx - 16.5, 242.4], [cx - 16.5, 249.6]], true));
  k.p(circle([cx, 246], 3.4));
  k.p(rrect(cx + 13.2, 242.8, 6.4, 6.4, 0.8));

  /* right side elevation: buttons face the viewer, the camera bump
     stands proud of the back */
  const SX = 228;
  const SW = 11;
  const scx = SX + SW / 2;
  k.p(rrect(SX, Y, SW, H, 4.5));
  k.p(rrect(SX + 3, 96, 5, 20, 1.5));
  k.p(rrect(SX + 3, 124, 5, 34, 1.5));
  k.p(`M${SX + SW} 66H${SX + SW + 2}Q${SX + SW + 3.5} 66 ${SX + SW + 3.5} 67.5V92.5Q${SX + SW + 3.5} 94 ${SX + SW + 2} 94H${SX + SW}`);

  k.cl([cx, Y - 9], [cx, Y + H + 9]);
  k.cl([scx, Y - 9], [scx, Y + H + 9]);

  /* detail A: the punch-hole camera at 4:1 */
  k.p(circle(cam, 8), "thin");
  k.t(cx + 12.5, cam[1] + 2, "A", { size: 6.4, tone: "ash" });
  const D: P = [322, 104];
  k.p(circle(D, 30), "thin");
  k.p(circle(D, 10.4));
  k.p(circle(D, 6.8), "hl");
  k.p(circle(D, 2.6));
  k.cl([D[0] - 36, D[1]], [D[0] + 36, D[1]]);
  k.cl([D[0], D[1] - 36], [D[0], D[1] + 36]);

  k.dim([X, Y], [X + W, Y], 16, "72.4");
  k.dim([SX, Y], [SX + SW, Y], 16, "8.2", { outside: true });
  k.dim([X, Y], [X, Y + H], -20, "146.1");
  k.note(polar(D, 10.4, -45), [346, 64], "Ø3.2");
  k.note(polar([X + W - R, Y + H - R], R, 45), [212, 280], "R14");
  k.note([SX + 8, 106], [258, 100], "PWR");
  k.note([SX + 8, 141], [258, 147], "VOL");

  k.balloon(3, [214, 96], [sx + sw - 10.5, 104]);
  k.balloon(4, [214, 150], [cx + 25.5, 157.4]);
  k.balloon(2, [214, 196], [sx + sw - 10.5, 195.5]);
  k.balloon(1, [214, 240], [cx + 19.6, 246]);

  k.label(cx, 290, "FRONT");
  k.label(scx, 290, "SIDE");
  k.label(D[0], 150, "DETAIL A", "4 : 1");
}

/* ============================================================
   02  ROBOTICS: a three-joint servo arm in side elevation
   ============================================================ */
/* The outline of a link between two joint discs: its sides, joined round
   the far side of each disc (on top of the disc outlines already there). */
function link(a: P, ra: number, b: P, rb: number, hw: number) {
  const u = unit(sub(b, a));
  const n: P = [-u[1], u[0]];
  const ta = Math.sqrt(ra * ra - hw * hw);
  const tb = Math.sqrt(rb * rb - hw * hw);
  const a1 = add(add(a, mul(u, ta)), mul(n, hw));
  const a2 = sub(add(a, mul(u, ta)), mul(n, hw));
  const b1 = add(sub(b, mul(u, tb)), mul(n, hw));
  const b2 = sub(sub(b, mul(u, tb)), mul(n, hw));
  return `M${q(a1)}L${q(b1)}A${rb} ${rb} 0 0 0 ${q(b2)}L${q(a2)}A${ra} ${ra} 0 0 0 ${q(a1)}Z`;
}
/* A rounded slot between two points. */
function slot(a: P, b: P, r: number) {
  const u = unit(sub(b, a));
  const n: P = [-u[1], u[0]];
  return `M${q(add(a, mul(n, r)))}L${q(add(b, mul(n, r)))}A${r} ${r} 0 0 0 ${q(sub(b, mul(n, r)))}L${q(sub(a, mul(n, r)))}A${r} ${r} 0 0 0 ${q(add(a, mul(n, r)))}Z`;
}

function robotics(k: Kit) {
  const G = 282; // ground
  const J1: P = [136, 226];
  const J2: P = [208, 136];
  const J3: P = [292, 166];
  const r1 = 14;
  const r2j = 11;
  const r3 = 7;

  /* base enclosure, column, and the shoulder */
  k.p(rrect(80, G - 22, 116, 22, 2));
  const cy = r2(J1[1] + Math.sqrt(r1 * r1 - 100));
  k.p(`M${J1[0] - 10} ${cy}V${G - 22}H${J1[0] + 10}V${cy}`);
  k.p(circle(J1, r1));
  k.p(link(J1, r1, J2, r2j, 8));
  k.p(slot(add(J1, mul(unit(sub(J2, J1)), 26)), sub(J2, mul(unit(sub(J2, J1)), 22)), 3.2));
  k.p(circle(J2, r2j));
  k.p(link(J2, r2j, J3, r3, 5.5));
  k.p(circle(J3, r3));
  k.p(circle(J1, 4.5));
  k.p(circle(J2, 3.4));
  k.p(circle(J3, 2.2));

  /* the gripper, open, along the forearm */
  const u: P = unit(sub(J3, J2));
  const n: P = [-u[1], u[0]];
  const g = (x: number, y: number): P => add(add(J3, mul(u, x)), mul(n, y));
  k.p(
    poly(
      [g(6.4, -7.5), g(15, -7.5), g(27, -10.5), g(34, -6), g(30.5, -3.6), g(22, -4.6), g(15, -3.4),
       g(15, 3.4), g(22, 4.6), g(30.5, 3.6), g(34, 6), g(27, 10.5), g(15, 7.5), g(6.4, 7.5)],
      true
    ),
    "hl"
  );

  /* ultrasonic sensor on the front of the base, and the board inside */
  k.p(rrect(196, G - 19, 3, 16, 0.6));
  k.p(rrect(199, G - 17.5, 5.5, 5.5, 1));
  k.p(rrect(199, G - 10, 5.5, 5.5, 1));
  k.p(rrect(88, G - 16, 62, 8, 1), "hid");

  /* ground, cut */
  k.p(line([60, G], [226, G]));
  k.hatch(rrect(60, G, 166, 6), [60, G, 226, G + 6], 45, 3.2);

  /* axes */
  k.cl(sub(J1, mul(unit(sub(J2, J1)), 20)), add(J2, mul(unit(sub(J2, J1)), 36)));
  k.cl(sub(J2, mul(u, 16)), add(J3, mul(u, 12)));
  k.cl([J1[0], J1[1] - 22], [J1[0], G - 26]);

  /* joint angles and the direction each joint turns */
  const a1 = Math.atan2(J2[1] - J1[1], J2[0] - J1[0]) / RAD;
  const a2 = Math.atan2(J3[1] - J2[1], J3[0] - J2[0]) / RAD;
  k.p(line([J1[0] + r1 + 2, J1[1]], [J1[0] + 52, J1[1]]), "thin");
  k.angle(J1, 44, a1, 0, `${Math.round(-a1)}°`, 52);
  k.angle(J2, 30, a1, a2, `${Math.round(a2 - a1)}°`, 39);
  k.turn(J1, 24, 150, 200);
  k.turn(J3, 16, 110, 60);

  /* under the forearm: above it is the elbow angle's arc */
  k.dim(J2, J3, -22, "90");

  /* detail B: the servo in plan */
  const sX = 44;
  const sY = 72;
  k.p(
    `M${sX} ${sY}H${sX + 64}V${sY + 10}H${sX + 72}Q${sX + 74} ${sY + 10} ${sX + 74} ${sY + 12}V${sY + 20}Q${sX + 74} ${sY + 22} ${sX + 72} ${sY + 22}H${sX + 64}V${sY + 32}H${sX}V${sY + 22}H${sX - 8}Q${sX - 10} ${sY + 22} ${sX - 10} ${sY + 20}V${sY + 12}Q${sX - 10} ${sY + 10} ${sX - 8} ${sY + 10}H${sX}Z`
  );
  k.p(circle([sX - 5, sY + 16], 1.8));
  k.p(circle([sX + 69, sY + 16], 1.8));
  k.p(circle([sX + 16, sY + 16], 7.5));
  k.p(slot([sX + 16, sY + 2], [sX + 16, sY + 30], 3.4));
  k.p(circle([sX + 16, sY + 16], 2.2));
  k.p(poly([[sX + 64, sY + 26], [sX + 84, sY + 26], [sX + 84, sY + 44]]), "thin");
  k.p(poly([[sX + 64, sY + 28.5], [sX + 81.5, sY + 28.5], [sX + 81.5, sY + 44]]), "thin");
  k.p(rrect(sX + 78.5, sY + 44, 8.5, 9, 1));
  k.cl([sX - 16, sY + 16], [sX + 80, sY + 16]);
  k.cl([sX + 16, sY - 6], [sX + 16, sY + 38]);
  k.dim([sX, sY], [sX + 64, sY], 12, "22.8");

  k.balloon(1, [60, 244], [100, G - 12]);
  k.balloon(2, [226, 250], [204.5, G - 7.5]);
  k.balloon(3, [120, 130], [sX + 50, sY + 32]);
  k.balloon(4, [150, 112], [sX + 87, sY + 49]);

  k.label(62, 300, "SIDE ELEVATION");
  k.label(sX + 32, 150, "DETAIL B", "2 : 1");
}

/* ============================================================
   03  AI & AUTOMATION: a network feeding a processor, looped back
   ============================================================ */
function ai(k: Kit) {
  const R = 8.5;
  const L0 = [118, 150, 182].map((y): P => [62, y]);
  const L1 = [102, 134, 166, 198].map((y): P => [118, y]);
  const L2 = [138, 162].map((y): P => [174, y]);
  const all = [...L0, ...L1, ...L2];
  all.forEach((c) => k.p(circle(c, R)));
  const edge = (a: P, b: P) => {
    const u = unit(sub(b, a));
    k.p(line(add(a, mul(u, R + 1.2)), sub(b, mul(u, R + 1.2))), "thin");
  };
  L0.forEach((a) => L1.forEach((b) => edge(a, b)));
  L1.forEach((a) => L2.forEach((b) => edge(a, b)));

  /* the processor, pins on four sides, a gear on the die */
  const C: P = [266, 150];
  const H = 38;
  k.p(rrect(C[0] - H, C[1] - H, 2 * H, 2 * H, 2.5));
  k.p(pins([C[0] - H, C[1] - H], [C[0] + H, C[1] - H], 5, 7, 3.4));
  k.p(pins([C[0] + H, C[1] - H], [C[0] + H, C[1] + H], 5, 7, 3.4));
  k.p(pins([C[0] + H, C[1] + H], [C[0] - H, C[1] + H], 5, 7, 3.4));
  k.p(pins([C[0] - H, C[1] + H], [C[0] - H, C[1] - H], 5, 7, 3.4));
  k.p(rrect(C[0] - 23, C[1] - 23, 46, 46, 1.5), "thin");
  k.p(gear(C, 10, 12.5, 2.3, -90), "hl");
  k.p(circle(C, 4.2));
  k.dot([C[0] - H + 6, C[1] - H + 6], 1.8);

  /* network out, into the pins */
  L2.forEach((c) => k.arrow([c[0] + R + 1.5, c[1]], [C[0] - H - 7.5, c[1]]));

  /* the loop: output fed back to the input */
  const loop = `M${C[0] + H + 7.5} ${C[1]}H${C[0] + H + 40}V252H${L0[2][0]}V${L0[2][1] + R + 5.2}`;
  const tip: P = [L0[2][0], L0[2][1] + R + 1.2];
  const [w1, w2] = wings(tip, [0, -1]);
  k.p(loop, "hid");
  k.p(poly([[tip[0], tip[1] + 4], tip, w1, tip, w2]), "thin");
  k.t(200, 248.5, "FEEDBACK", { size: 5, tone: "ash" });

  k.cl([C[0] - H - 14, C[1]], [C[0] + H + 14, C[1]]);
  k.cl([C[0], C[1] - H - 14], [C[0], C[1] + H + 14]);

  k.dim([C[0] - H, C[1] - H - 7], [C[0] + H, C[1] - H - 7], 12, "14.0", { ext: true });
  k.dim(
    [C[0] - H + (2 * H) / 5 * 3.5 - 0, C[1] + H + 7],
    [C[0] - H + (2 * H) / 5 * 4.5, C[1] + H + 7],
    -8,
    "1.27",
    { outside: true }
  );

  /* activation, plotted */
  const gx = 44;
  const gy = 272;
  k.arrow([gx, gy + 40], [gx, gy - 2]);
  k.arrow([gx - 4, gy + 20], [gx + 96, gy + 20]);
  let sig = "";
  for (let i = 0; i <= 40; i++) {
    const x = -6 + (12 * i) / 40;
    const y = 1 / (1 + Math.exp(-x));
    sig += `${i ? "L" : "M"}${q([gx + 4 + (i / 40) * 84, gy + 36 - y * 32])}`;
  }
  k.p(sig);
  k.t(gx + 5, gy + 2, "σ(x)", { anchor: "start", size: 5.6, tone: "ash" });
  k.p(line([gx + 46, gy + 17], [gx + 46, gy + 23]), "thin");
  k.t(gx + 49, gy + 27.5, "0", { anchor: "start", size: 4.6, tone: "dim" });
  k.label(gx + 46, gy + 50, "ACTIVATION");

  k.balloon(2, [36, 88], [L0[0][0] - 6, L0[0][1] - 6]);
  k.balloon(1, [118, 70], [L1[0][0], L1[0][1] - R]);
  k.balloon(4, [196, 104], [L2[0][0] + 6, L2[0][1] - 6]);
  k.balloon(3, [334, 96], [C[0] + 9, C[1] - 9]);

  k.t(62, 222, "IN", { size: 5, tone: "ash" });
  k.t(118, 222, "HIDDEN", { size: 5, tone: "ash" });
  k.t(174, 222, "OUT", { size: 5, tone: "ash" });
  k.label(266, 214, "PROCESSOR");
}

/* ============================================================
   04  FULL-STACK: client, server and data layers, isometric
   ============================================================ */
function fullstack(k: Kit) {
  /* z = 0 is the floor the database stands on. */
  const O: P = [160, 290];
  const iso = (x: number, y: number, z: number): P => [O[0] + (x - y) * 0.866, O[1] + (x + y) * 0.5 - z];

  /* A box as a hand draws one: the silhouette, then the two inner edges
     that meet at the near corner. */
  const box = (hx: number, hy: number, z0: number, z1: number, cy = 0) => {
    const v = (x: number, y: number, z: number) => iso(x, cy + y, z);
    k.p(poly([v(-hx, -hy, z1), v(hx, -hy, z1), v(hx, -hy, z0), v(hx, hy, z0), v(-hx, hy, z0), v(-hx, hy, z1)], true));
    k.p(poly([v(-hx, hy, z1), v(hx, hy, z1), v(hx, -hy, z1)]));
    k.p(line(v(hx, hy, z1), v(hx, hy, z0)));
  };

  /* the client: a thin panel, the page laid out on its face */
  const ux = 42;
  const uy = 32;
  const uz = 215;
  box(ux, uy, uz - 5, uz);
  const f = (x: number, y: number) => iso(x, y, uz);
  k.p(line(f(-37, -22), f(37, -22)), "thin");
  k.p(line(f(-18, -22), f(-18, 27)), "thin");
  k.p(poly([f(-12, -16), f(36, -16), f(36, 2), f(-12, 2)], true), "thin");
  k.p(poly([f(-12, 8), f(8, 8), f(8, 27), f(-12, 27)], true), "thin");
  k.p(poly([f(14, 8), f(36, 8), f(36, 27), f(14, 27)], true), "thin");
  [-8, 2, 12].forEach((y) => k.p(line(f(-34, y), f(-24, y)), "thin"));

  /* the server: a block, rack slots on one face, vents on the other */
  const a = 24;
  const az0 = 99;
  const az1 = 129;
  box(a, a, az0, az1);
  [121, 114, 107].forEach((z) => {
    k.p(line(iso(-13, a, z), iso(18, a, z)), "thin");
    k.dot(iso(-18, a, z), 0.9);
  });
  const face = poly([iso(a, a, az1), iso(a, -a, az1), iso(a, -a, az0), iso(a, a, az0)], true);
  k.hatch(face, [iso(a, a, az1)[0], iso(a, -a, az1)[1], iso(a, -a, az0)[0], iso(a, a, az0)[1]], 30, 3.4);

  /* the queue, off to one side at a lower level */
  const qy = 80;
  box(9, 22, 70, 84, qy);
  [69, 80, 91].forEach((y) => k.p(poly([iso(-9, y, 84), iso(9, y, 84), iso(9, y, 70)]), "thin"));

  /* the data: a cylinder, on its own axis */
  const cr = 26;
  const rx = cr * 1.2247;
  const ry = cr * 0.7071;
  const c0 = iso(0, 0, 0);
  const c1 = iso(0, 0, 36);
  k.p(ellipse(c1, rx, ry));
  k.p(`M${q([c1[0] - rx, c1[1]])}V${r2(c0[1])}A${r2(rx)} ${r2(ry)} 0 0 0 ${q([c1[0] + rx, c0[1]])}V${r2(c1[1])}`);
  [12, 24].forEach((z) => {
    const y = c1[1] + z;
    k.p(`M${q([c1[0] - rx, y])}A${r2(rx)} ${r2(ry)} 0 0 0 ${q([c1[0] + rx, y])}`, "thin");
  });
  k.cl([c0[0], c1[1] - ry - 8], [c0[0], c0[1] + ry + 8]);

  /* request down, response up; the request is the accent */
  k.arrow([155, 112.5], [155, 136.5], "hl");
  k.arrow([165, 136.5], [165, 118.5]);
  k.arrow([155, 215.5], [155, 233]);
  k.arrow([165, 233], [165, 215.5]);
  k.arrow(iso(-12, a + 2, 101), iso(0, qy - 17, 85));

  /* levels, like a section through a building */
  const ex = 298;
  const el = (p: P, text: string) => {
    k.p(line([p[0] + 3, p[1]], [ex + 34, p[1]]), "thin");
    k.p(poly([[ex - 3.2, p[1] - 5], [ex + 3.2, p[1] - 5], [ex, p[1]], [ex - 3.2, p[1] - 5]]), "thin");
    k.t(ex + 6, p[1] - 2, text, { anchor: "start", size: 5.4, tone: "ash" });
  };
  el(iso(ux, -uy, uz), `EL +${uz}`);
  el(iso(a, -a, az1), `EL +${az1}`);
  el([c1[0] + rx, c1[1]], "EL +36");
  el([c1[0] + rx, c0[1]], "EL ±0");

  /* the axes, bottom left */
  const t0: P = [44, 300];
  k.arrow(t0, [t0[0], t0[1] - 15]);
  k.arrow(t0, [t0[0] + 13, t0[1] + 7.5]);
  k.arrow(t0, [t0[0] - 13, t0[1] + 7.5]);
  k.t(t0[0], t0[1] - 18.5, "Z", { size: 4.8, tone: "ash" });
  k.t(t0[0] + 17, t0[1] + 11.5, "X", { size: 4.8, tone: "ash" });
  k.t(t0[0] - 17, t0[1] + 11.5, "Y", { size: 4.8, tone: "ash" });

  k.balloon(1, [62, 44], f(-30, -4));
  k.balloon(2, [72, 166], iso(-6, a, 117.5));
  k.balloon(3, [226, 272], [c1[0] + rx - 1.5, 268]);
  k.balloon(4, [44, 214], iso(0, qy - 4, 84));

  k.label(106, 324, "ISOMETRIC");
}

/* ============================================================
   05  CYBERSECURITY: a padlock, exploded, inside a shield
   ============================================================ */
function cyber(k: Kit) {
  const cx = 150;
  const shield = `M${cx} 40Q${cx + 40} 56 ${cx + 86} 50L${cx + 86} 150Q${cx + 86} 250 ${cx} 306Q${cx - 86} 250 ${cx - 86} 150L${cx - 86} 50Q${cx - 40} 56 ${cx} 40Z`;
  const inner = `M${cx} 49Q${cx + 36} 63 ${cx + 78} 58L${cx + 78} 150Q${cx + 78} 243 ${cx} 296Q${cx - 78} 243 ${cx - 78} 150L${cx - 78} 58Q${cx - 36} 63 ${cx} 49Z`;
  k.p(shield);
  k.p(inner, "thin");

  /* shackle, lifted clear of the body */
  k.p(`M124 136V102A26 26 0 0 1 176 102V126H168V102A18 18 0 0 0 132 102V136Z`);
  /* body, with the bores the shackle drops into */
  k.p(rrect(104, 160, 92, 72, 9));
  k.p(line([104, 172], [196, 172]), "thin");
  k.p(poly([[124, 160], [124, 186], [132, 186], [132, 160]]), "hid");
  k.p(poly([[168, 160], [168, 180], [176, 180], [176, 160]]), "hid");
  /* the keyway */
  const ky = 192;
  const yy = ky + Math.sqrt(49 - 9);
  k.p(`M${cx - 3} ${r2(yy)}A7 7 0 1 1 ${cx + 3} ${r2(yy)}L${cx + 4.5} ${ky + 17}H${cx - 4.5}Z`, "hl");

  /* the key, lined up under the keyway */
  const by = 274;
  const jy = by - Math.sqrt(100 - 9);
  k.p(
    `M${cx - 3} ${r2(jy)}V246L${cx} 242.5L${cx + 3} 246V249L${cx + 7} 251V254.5L${cx + 3} 256.5V259.5L${cx + 7} 261.5V264L${cx + 3} ${r2(jy - 0.5)}V${r2(jy)}A10 10 0 1 1 ${cx - 3} ${r2(jy)}Z`
  );
  k.p(circle([cx, by + 2], 3.2));

  /* explosion lines */
  k.cl([128, 120], [128, 190]);
  k.cl([172, 116], [172, 184]);
  k.cl([cx, 214], [cx, 240]);

  /* cutting plane through the long leg */
  const cy0 = 122;
  k.p(line([110, cy0], [119, cy0]), "obj");
  k.p(line([137, cy0], [146, cy0]), "obj");
  k.arrow([110, cy0], [110, cy0 - 9]);
  k.arrow([146, cy0], [146, cy0 - 9]);
  k.t(106, cy0 - 3, "A", { size: 5.6, tone: "ash", anchor: "end" });
  k.t(150, cy0 - 3, "A", { size: 5.6, tone: "ash", anchor: "start" });

  /* section A-A: the leg is solid bar */
  const S: P = [314, 104];
  k.p(circle(S, 11));
  k.hatch(circle(S, 11), [S[0] - 12, S[1] - 12, S[0] + 12, S[1] + 12], 45, 2.6);
  k.cl([S[0] - 17, S[1]], [S[0] + 17, S[1]]);
  k.cl([S[0], S[1] - 17], [S[0], S[1] + 17]);
  k.label(S[0], 136, "SECTION A-A", "2 : 1");

  k.dim([124, 102], [176, 102], 40, "26");
  k.dim([196, 160], [196, 232], 16, "36");
  k.dim([S[0] - 11, S[1] + 11], [S[0] + 11, S[1] + 11], -8, "Ø8");

  k.balloon(1, [270, 196], [cx + 84, 178]);
  k.balloon(2, [262, 272], [cx + 10, by]);
  k.balloon(3, [44, 212], [104, 206]);
  k.balloon(4, [44, 110], [124, 116]);

  k.label(cx, 322, "EXPLODED VIEW");
}

/* ============================================================
   06  WEB DESIGN & BRANDING: a page on a grid, golden section, a nib
   ============================================================ */
function web(k: Kit) {
  /* the page at 0.15: 1440 x 900 is 216 x 135, under a 14 high chrome */
  const X = 40;
  const Y = 50;
  const W = 216;
  const H = 149;
  k.p(rrect(X, Y, W, H, 5));
  k.p(line([X, Y + 14], [X + W, Y + 14]));
  [0, 8, 16].forEach((o) => k.p(circle([X + 9 + o, Y + 7], 2)));
  k.p(rrect(X + 48, Y + 3.5, 132, 7, 3.5), "thin");

  /* six columns of 32 between 12 margins */
  const L = X + 12;
  const R = X + W - 12;
  const top = Y + 14;
  for (let i = 0; i <= 6; i++) k.p(line([L + i * 32, top + 4], [L + i * 32, Y + H - 4]), "hid");

  /* nav, headline, copy, call to action */
  k.p(circle([L + 4, top + 9], 3.4));
  [[R - 58, R - 46], [R - 40, R - 26], [R - 20, R]].forEach(([p, e]) => k.p(line([p, top + 9], [e, top + 9]), "thin"));
  k.p(line([L, top + 28], [L + 86, top + 28]));
  k.p(line([L, top + 37], [L + 70, top + 37]));
  k.p(line([L, top + 48], [L + 86, top + 48]), "thin");
  k.p(line([L, top + 54], [L + 74, top + 54]), "thin");
  k.p(rrect(L, top + 62, 32, 10, 2));

  /* The hero is a golden rectangle: cut a square off it, again and again,
     round the inside, then join the squares with quarter circles. */
  const PHI = (1 + Math.sqrt(5)) / 2;
  const gw = 96;
  const gh = gw / PHI;
  const gx = R - gw;
  const gy = top + 18;
  k.p(rrect(gx, gy, gw, gh));
  let x0 = gx;
  let y0 = gy;
  let w = gw;
  let h = gh;
  let spiral = `M${q([gx, gy + gh])}`;
  const cuts: string[] = [];
  for (let i = 0; i < 7; i++) {
    const s = i % 2 === 0 ? h : w;
    const A = `A${r2(s)} ${r2(s)} 0 0 1`;
    if (i % 4 === 0) {
      cuts.push(line([x0 + s, y0], [x0 + s, y0 + h]));
      spiral += `${A} ${q([x0 + s, y0])}`;
      x0 += s;
      w -= s;
    } else if (i % 4 === 1) {
      cuts.push(line([x0, y0 + s], [x0 + w, y0 + s]));
      spiral += `${A} ${q([x0 + s, y0 + s])}`;
      y0 += s;
      h -= s;
    } else if (i % 4 === 2) {
      cuts.push(line([x0 + w - s, y0], [x0 + w - s, y0 + h]));
      spiral += `${A} ${q([x0 + w - s, y0 + s])}`;
      w -= s;
    } else {
      cuts.push(line([x0, y0 + h - s], [x0 + w, y0 + h - s]));
      spiral += `${A} ${q([x0, y0 + h - s])}`;
      h -= s;
    }
  }
  cuts.slice(0, 5).forEach((c) => k.p(c, "thin"));
  /* The eye the spiral winds into, and the two diagonals that cross
     there: one of the whole rectangle, one of what is left after the
     first square. */
  const eye: P = [x0 + w / 2, y0 + h / 2];
  const through = (x: number, y: number, rw: number, rh: number): [P, P] => {
    const off = (p: P, e: P) =>
      Math.abs((e[0] - p[0]) * (p[1] - eye[1]) - (p[0] - eye[0]) * (e[1] - p[1])) / Math.hypot(e[0] - p[0], e[1] - p[1]);
    const d1: [P, P] = [[x, y], [x + rw, y + rh]];
    const d2: [P, P] = [[x, y + rh], [x + rw, y]];
    return off(...d1) < off(...d2) ? d1 : d2;
  };
  k.cl(...through(gx, gy, gw, gh));
  k.cl(...through(gx + gh, gy, gw - gh, gh));
  k.p(spiral, "hl");

  /* three cards: an image, a caption, and a buy button on the last */
  [0, 1, 2].forEach((c) => {
    const x = L + c * 68;
    const y = top + 88;
    k.p(rrect(x, y, 56, 38, 2));
    k.p(`M${x + 4} ${y + 4}H${x + 52}V${y + 22}H${x + 4}Z`, "thin");
    k.p(`M${x + 4} ${y + 4}L${x + 52} ${y + 22}`, "thin");
    k.p(`M${x + 52} ${y + 4}L${x + 4} ${y + 22}`, "thin");
    k.p(line([x + 4, y + 29], [x + (c === 2 ? 26 : 38), y + 29]), "thin");
    if (c === 2) k.p(rrect(x + 32, y + 26, 20, 7, 1.5));
  });

  k.dim([X, Y], [X + W, Y], 12, "1440");
  k.dim([X, Y + 14], [X, Y + H], -12, "900");
  k.note([R, gy + gh - 8], [266, gy + gh + 4], "φ 1.618");

  /* the nib, drawing a curve with the pen tool */
  const tip: P = [338, 228];
  const s = (x: number, y: number) => q([tip[0] + x, tip[1] + y]);
  k.p(`M${s(0, 0)}C${s(4, -16)} ${s(14, -32)} ${s(15, -48)}L${s(17, -64)}L${s(-17, -64)}L${s(-15, -48)}C${s(-14, -32)} ${s(-4, -16)} ${s(0, 0)}Z`);
  k.p(`M${s(-19, -64)}L${s(-19, -84)}Q${s(-19, -88)} ${s(-15, -88)}L${s(15, -88)}Q${s(19, -88)} ${s(19, -84)}L${s(19, -64)}Z`);
  k.p(circle([tip[0], tip[1] - 36], 3.2));
  k.p(line([tip[0], tip[1] - 32.8], [tip[0], tip[1] - 3]), "thin");
  k.p(line([tip[0] - 15, tip[1] - 48], [tip[0] + 15, tip[1] - 48]), "thin");
  k.cl([tip[0], tip[1] - 96], [tip[0], tip[1] + 8]);
  const a0: P = [296, 262];
  const h0: P = [300, 236];
  const h1: P = [326, 262];
  k.p(`M${q(a0)}C${q(h0)} ${q(h1)} ${q(tip)}`);
  k.p(line(a0, h0), "thin");
  k.p(line(tip, h1), "thin");
  k.p(rrect(a0[0] - 1.8, a0[1] - 1.8, 3.6, 3.6));
  k.dot(h0, 1.2);
  k.dot(h1, 1.2);

  k.balloon(1, [274, 60], [X + W - 24, Y + 7]);
  k.balloon(2, [274, 92], [gx + gh + 26.4, gy + 22]);
  k.balloon(3, [80, 226], [L + 28, top + 124]);
  k.balloon(4, [230, 226], [L + 136 + 42, top + 121]);

  k.label(X + W / 2, 236, "LAYOUT  1440 × 900");
  k.label(tip[0], 284, "NIB DETAIL");
}

/* ============================================================
   07  DEVOPS & TOOLING: gears, a branch graph, a pipeline, a terminal
   ============================================================ */
function devops(k: Kit) {
  const A: P = [104, 108];
  const zA = 14;
  const zB = 9;
  const m = 5;
  const rA = (m * zA) / 2;
  const rB = (m * zB) / 2;
  const ang = 32;
  const B: P = polar(A, rA + rB, ang);
  const tauB = 360 / zB;
  k.p(gear(A, zA, rA, m, ang));
  k.p(gear(B, zB, rB, m, ang + 180 + tauB / 2));
  k.p(`M${A[0] - 2} ${r2(A[1] - Math.sqrt(64 - 4))}V${A[1] - 11}H${A[0] + 2}V${r2(A[1] - Math.sqrt(64 - 4))}A8 8 0 1 1 ${A[0] - 2} ${r2(A[1] - Math.sqrt(64 - 4))}Z`);
  k.p(circle(A, 14), "thin");
  [45, 135, 225, 315].forEach((a) => k.p(circle(polar(A, 21.5, a), 3.8)));
  k.p(circle(B, 4.6));
  k.p(circle(B, 8.5), "thin");
  k.p(circle(A, rA), "cl");
  k.p(circle(B, rB), "cl");
  k.cl([A[0] - rA - 12, A[1]], [A[0] + rA + 12, A[1]]);
  k.cl([A[0], A[1] - rA - 12], [A[0], A[1] + rA + 12]);
  k.cl([B[0] - rB - 10, B[1]], [B[0] + rB + 10, B[1]]);
  k.cl([B[0], B[1] - rB - 10], [B[0], B[1] + rB + 10]);
  k.turn(A, rA + 13, 196, 244);
  k.turn(B, rB + 12, 20, -24);
  k.t(A[0] - 30, A[1] + 58, `z ${zA}   m ${m}`, { size: 5.4, tone: "ash" });

  /* the branch graph */
  const gy = 262;
  const cs = [44, 72, 128, 156];
  k.p(line([36, gy], [176, gy]));
  k.p(`M${72 + 3} ${gy - 1.5}C${86} ${gy - 20} ${96} ${gy - 20} ${100} ${gy - 20}C${104} ${gy - 20} ${114} ${gy - 20} ${128 - 3} ${gy - 1.5}`);
  cs.forEach((x) => k.p(circle([x, gy], 3)));
  k.p(circle([100, gy - 20], 3));
  k.t(106, gy - 24, "feat", { anchor: "start", size: 5, tone: "ash" });
  k.t(180, gy + 2, "main", { anchor: "start", size: 5, tone: "ash" });

  /* the pipeline into the terminal */
  const py = 170;
  k.p(poly([[196, py - 4], [300, py - 4], [300, py + 14], [307, py + 14], [296, py + 26], [285, py + 14], [292, py + 14], [292, py + 4], [196, py + 4]], true), "hl");
  [222, 248, 274].forEach((x) => k.p(line([x, py - 4], [x, py + 4]), "thin"));
  k.t(209, py - 7, "BUILD", { size: 4.8, tone: "ash" });
  k.t(235, py - 7, "TEST", { size: 4.8, tone: "ash" });
  k.t(261, py - 7, "SHIP", { size: 4.8, tone: "ash" });

  const tX = 206;
  const tY = 200;
  k.p(rrect(tX, tY, 158, 100, 5));
  k.p(line([tX, tY + 13], [tX + 158, tY + 13]));
  [0, 8, 16].forEach((o) => k.p(circle([tX + 9 + o, tY + 6.5], 2)));
  const lines = ["$ git push origin main", "> build ......... ok", "> test .......... ok", "> deploy ........ ok", "$"];
  lines.forEach((s, i) =>
    k.t(tX + 9, tY + 27 + i * 12, s, { anchor: "start", size: 5.8, tone: i % 4 === 0 ? "bone" : "ash", lag: i * 110 })
  );

  k.dim(A, B, 42, `${rA + rB}`);

  k.balloon(1, [60, 222], [44, gy - 3]);
  k.balloon(2, [36, 60], polar(A, rA + 4, 216));
  k.balloon(3, [240, 136], [250, py - 4]);
  k.balloon(4, [196, 104], polar(B, rB + 4, -40));

  k.label(104, 190, "GEAR TRAIN");
  k.label(106, 300, "BRANCHES");
  k.label(285, 318, "CI / CD");
}

/* ---- the seven sheets, in services order ---------------------------- */
const build = (f: (k: Kit) => void) => {
  const k = new Kit();
  f(k);
  return k.ops;
};

/* Picked by what the title says rather than by position, so reordering
   the services in content.ts keeps each drawing on its own service. */
const SHEETS: { test: RegExp; ops: () => Op[] }[] = [
  { test: /mobile|android|app/i, ops: () => build(mobile) },
  { test: /robot|embedded|hardware/i, ops: () => build(robotics) },
  { test: /\bai\b|automation|machine/i, ops: () => build(ai) },
  { test: /stack|backend|web dev/i, ops: () => build(fullstack) },
  { test: /secur|cyber/i, ops: () => build(cyber) },
  { test: /design|brand/i, ops: () => build(web) },
  { test: /devops|tool|deploy|cloud/i, ops: () => build(devops) },
];

export function drawingFor(title: string, i: number): Op[] {
  const hit = SHEETS.find((s) => s.test.test(title));
  return (hit ?? SHEETS[i % SHEETS.length]).ops();
}

/* ============================================================
   THE SHEET
   Frame with zones, grid, notes, parts list and title block. Text that
   changes per drawing carries a slot name.

   Two layouts, both with the drawing in the same place, so every drawing
   works on either:
     portrait   400 x 450, title block and parts list along the bottom.
                The sheet everywhere except tablets.
     landscape  640 x 360, the same blocks stacked down the right, with a
                revision table and a scale bar above them, as on an A3
                landscape drawing. On a tablet it spans the page.
   ============================================================ */
export type Layout = "portrait" | "landscape";
type Box = { x: number; y: number; w: number; h: number };
type Spec = {
  w: number;
  h: number;
  /* zones across and down */
  zx: number;
  zy: number;
  tb: Box;
  pl: Box & { row: number };
  notes: P;
  proj: P;
  readout: P;
  /* landscape only */
  rev?: P;
  bar?: P;
  /* where the pen rests: circling the revision letter, centred in the
     last cell of the title block */
  park: P;
};

export const FRAME_IN = 14;
export const PL_ROWS = 4;
const TB_W = 236;
const TB_H = 52;
const PL_H = 50;
const park = (tb: Box): P => [tb.x + 223, tb.y + 26 + 19.5 - 2.2];

const portraitTB: Box = { x: 150, y: 384, w: TB_W, h: TB_H };
const landscapeTB: Box = { x: 390, y: 294, w: TB_W, h: TB_H };

export const LAYOUT: Record<Layout, Spec> = {
  portrait: {
    w: 400,
    h: 450,
    zx: 4,
    zy: 4,
    tb: portraitTB,
    pl: { x: 150, y: 334, w: TB_W, h: PL_H, row: 10 },
    notes: [24, 352],
    proj: [36, 402],
    readout: [24, 428],
    park: park(portraitTB),
  },
  landscape: {
    w: 640,
    h: 360,
    zx: 6,
    zy: 4,
    tb: landscapeTB,
    pl: { x: 390, y: 244, w: TB_W, h: PL_H, row: 10 },
    notes: [400, 66],
    proj: [412, 202],
    readout: [24, 340],
    rev: [390, 14],
    bar: [400, 150],
    park: park(landscapeTB),
  },
};

/* The portrait sheet's numbers, for anything that only knows one sheet. */
export const SHEET_W = LAYOUT.portrait.w;
export const SHEET_H = LAYOUT.portrait.h;
export const PARK = LAYOUT.portrait.park;

export const DRAWN_BY = "P. BETAI";
export const DRAWN_ON = "24.09.26";

export function sheetOps(layout: Layout = "portrait"): Op[] {
  const k = new Kit();
  const S = LAYOUT[layout];
  const F = FRAME_IN;
  const W = S.w;
  const H = S.h;

  /* grid: minor every 16, major every 80, on the same lines as the
     drawings on both layouts */
  let gmin = "";
  let gmaj = "";
  for (let x = 24; x <= W - F; x += 16) {
    const s = `M${x} ${F}V${H - F}`;
    if ((x - 40) % 80 === 0) gmaj += s;
    else gmin += s;
  }
  for (let y = 30; y <= H - F; y += 16) {
    const s = `M${F} ${y}H${W - F}`;
    if ((y - 30) % 80 === 0) gmaj += s;
    else gmin += s;
  }
  k.p(gmin, "gmin");
  k.p(gmaj, "gmaj");

  k.p(rrect(4, 4, W - 8, H - 8), "frame2");
  k.p(rrect(F, F, W - 2 * F, H - 2 * F), "frame");

  /* zones: numbers across, letters down, ticks at the boundaries */
  const zx = (W - 2 * F) / S.zx;
  const zy = (H - 2 * F) / S.zy;
  let ticks = "";
  for (let i = 1; i < S.zx; i++) {
    const x = r2(F + i * zx);
    ticks += `M${x} 4V${F}M${x} ${H - F}V${H - 4}`;
  }
  for (let i = 1; i < S.zy; i++) {
    const y = r2(F + i * zy);
    ticks += `M4 ${y}H${F}M${W - F} ${y}H${W - 4}`;
  }
  /* centring marks run a little into the field */
  ticks += `M${W / 2} 4V${F + 6}M${W / 2} ${H - F - 6}V${H - 4}M4 ${H / 2}H${F + 6}M${W - F - 6} ${H / 2}H${W - 4}`;
  k.p(ticks, "frame2");
  for (let i = 0; i < S.zx; i++) {
    const x = F + (i + 0.5) * zx;
    k.t(x, 10.8, String(i + 1), { size: 4.8, tone: "dim" });
    k.t(x, H - 7.2, String(i + 1), { size: 4.8, tone: "dim" });
  }
  for (let i = 0; i < S.zy; i++) {
    const y = F + (i + 0.5) * zy + 1.8;
    k.t(9, y, "ABCDEF"[i], { size: 4.8, tone: "dim" });
    k.t(W - 9, y, "ABCDEF"[i], { size: 4.8, tone: "dim" });
  }

  const PL = S.pl;
  const TB = S.tb;

  /* parts list, read upward from the title block, header at the bottom */
  k.ops.push({ k: "box", x: PL.x, y: PL.y, w: PL.w, h: PL.h + TB.h });
  let pl = rrect(PL.x, PL.y, PL.w, PL.h);
  for (let r = 1; r <= PL_ROWS; r++) pl += `M${PL.x} ${PL.y + r * PL.row}H${PL.x + PL.w}`;
  pl += `M${PL.x + 20} ${PL.y}V${PL.y + PL.h}`;
  k.p(pl, "frame2");
  k.t(PL.x + 10, PL.y + PL.h - 3.2, "ITEM", { size: 4.2, tone: "dim" });
  k.t(PL.x + 24, PL.y + PL.h - 3.2, "DESCRIPTION", { size: 4.2, tone: "dim", anchor: "start" });
  for (let r = 0; r < PL_ROWS; r++) {
    const y = PL.y + PL.h - PL.row * (r + 1) - 3;
    k.t(PL.x + 10, y, String(r + 1), { size: 5.6, tone: "ash" });
    k.t(PL.x + 24, y, "", { size: 5.6, tone: "bone", anchor: "start", slot: `pl${r}` });
  }

  /* title block */
  const { x, y, w, h } = TB;
  const r1 = y + 26;
  let tb = rrect(x, y, w, h);
  tb += `M${x} ${r1}H${x + w}M${x + 82} ${y}V${r1}`;
  const cells = [x + 46, x + 86, x + 132, x + 168, x + 210];
  cells.forEach((cx) => (tb += `M${cx} ${r1}V${y + h}`));
  k.p(tb, "frame");
  k.t(x + 5, y + 11.5, "PARTH BETAI", { size: 7, anchor: "start", tone: "bone", bold: true });
  k.t(x + 5, y + 20, "ROBOTICS / SOFTWARE", { size: 4.2, anchor: "start", tone: "dim" });
  k.t(x + 87, y + 7, "TITLE", { size: 4.2, anchor: "start", tone: "dim" });
  k.t(x + 87, y + 19.5, "", { size: 7.6, anchor: "start", tone: "bone", slot: "title" });
  const fields: [number, string, string, string?][] = [
    [x, "DRAWN", DRAWN_BY],
    [cells[0], "DATE", DRAWN_ON],
    [cells[1], "DWG NO.", "", "dwg"],
    [cells[2], "SCALE", "1:1"],
    [cells[3], "SHEET", "", "sheet"],
    [cells[4], "REV", "A"],
  ];
  fields.forEach(([fx, label, value, slot]) => {
    k.t(fx + 3.5, r1 + 7, label, { size: 4.2, anchor: "start", tone: "dim" });
    /* The revision letter sits centred in its cell: the pen parks on it. */
    if (label === "REV") k.t(S.park[0], r1 + 19.5, value, { size: 6.2, tone: "bone" });
    else k.t(fx + 3.5, r1 + 19.5, value, { size: slot === "dwg" ? 8.6 : 6.2, anchor: "start", tone: "bone", slot });
  });

  /* notes, and the third-angle projection symbol */
  const [nx, ny] = S.notes;
  k.t(nx, ny, "NOTES", { size: 4.8, tone: "dim", anchor: "start" });
  ["1. DIMENSIONS IN MM", "2. DO NOT SCALE DRAWING", "3. BREAK SHARP EDGES"].forEach((s, i) =>
    k.t(nx, ny + 9 + i * 7.5, s, { size: 4.6, tone: "ash", anchor: "start" })
  );
  const [px0, py0] = S.proj;
  k.p(poly([[px0 - 9, py0 - 4], [px0 + 9, py0 - 7], [px0 + 9, py0 + 7], [px0 - 9, py0 + 4]], true), "frame");
  k.p(circle([px0 + 28, py0], 7), "frame");
  k.p(circle([px0 + 28, py0], 4), "frame");
  k.p(`M${px0 - 13} ${py0}H${px0 + 13}M${px0 + 18} ${py0}H${px0 + 38}M${px0 + 28} ${py0 - 10}V${py0 + 10}`, "frame2");

  /* revision table, top right */
  if (S.rev) {
    const [rx, ry] = S.rev;
    const cols = [rx + 22, rx + 150, rx + 200];
    let rt = rrect(rx, ry, TB_W, 24);
    rt += `M${rx} ${ry + 10}H${rx + TB_W}`;
    cols.forEach((c) => (rt += `M${c} ${ry}V${ry + 24}`));
    k.p(rt, "frame2");
    [["REV", rx], ["DESCRIPTION", cols[0]], ["DATE", cols[1]], ["APPD", cols[2]]].forEach(([s, cx]) =>
      k.t((cx as number) + 3.5, ry + 7, s as string, { size: 4.2, anchor: "start", tone: "dim" })
    );
    [["A", rx], ["FIRST ISSUE", cols[0]], [DRAWN_ON, cols[1]], ["PB", cols[2]]].forEach(([s, cx]) =>
      k.t((cx as number) + 3.5, ry + 19.5, s as string, { size: 5.4, anchor: "start", tone: "ash" })
    );
  }

  /* scale bar: alternate tens filled, in millimetres */
  if (S.bar) {
    const [bx, by] = S.bar;
    const u = 16;
    let bar = rrect(bx, by, u * 5, 4);
    for (let i = 1; i < 5; i++) bar += `M${bx + i * u} ${by}V${by + 4}`;
    k.p(bar, "frame");
    for (let i = 0; i < 5; i += 2) k.hatch(rrect(bx + i * u, by, u, 4), [bx + i * u, by, bx + (i + 1) * u, by + 4], 45, 1.4);
    for (let i = 0; i <= 5; i++) k.t(bx + i * u, by + 11, String(i * 10), { size: 4.2, tone: "dim" });
    k.t(bx + 5 * u + 6, by + 4.2, "MM", { size: 4.2, tone: "dim", anchor: "start" });
  }

  /* live readout of the pen */
  k.t(S.readout[0], S.readout[1], "X 000.0  Y 000.0", { size: 4.8, tone: "dim", anchor: "start", slot: "xy" });

  return k.ops;
}

/* Fits a parts-list line to its cell, in whole glyphs. */
export const PL_CHARS = Math.floor((TB_W - 28) / (5.6 * MONO_ADVANCE));
export const TITLE_CHARS = Math.floor((TB_W - 92) / (7.6 * MONO_ADVANCE));
export const fit = (s: string, n: number) => (s.length > n ? `${s.slice(0, n - 1).trimEnd()}…` : s);
