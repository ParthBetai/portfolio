"use client";

import { useEffect, useRef, type RefObject } from "react";
import * as THREE from "three";
import { RoomEnvironment } from "three/addons/environments/RoomEnvironment.js";
import { gsap, ScrollTrigger, reduced } from "@/lib/motion";

/* ============================================================
   PIN FIELD
   The contact section's backdrop: a pin-art wall, the desk toy where a
   hand pressed in from behind comes out the front as a relief. Thousands
   of square gunmetal pins sit flush in a tilted board; the cursor pushes
   them out, typing in the chat sends rings across them, and when nothing
   is happening they breathe.

   Same window trick as the globe it replaced: the host is position:fixed
   and viewport-sized, and Contact's clip-path turns the section into a
   window onto it. So this renders the whole viewport, not a box.

   One InstancedMesh, one draw call. Every pin's height is worked out in
   the vertex shader from a handful of uniforms (pointer, its wake, a
   dozen ripples, the reveal front), so a frame costs a few uniform
   uploads and never a buffer rewrite. Only the top four corners of each
   box move, which keeps the side normals valid: a side is just
   stretched along its own plane.
   ============================================================ */

const FOV = 32;
/* How far the board leans back from the viewer. Enough that the pins'
   sides show when they rise, not so much that the far half is a smear. */
const TILT = THREE.MathUtils.degToRad(34);
const DIST = 10;

/* Pin footprint as a share of the grid pitch. The rest is the gap, which
   the void shows through: that dark lattice is what makes it read as
   separate pins rather than a bumpy sheet. */
const FILL = 0.84;
/* Length of each pin below the rest plane, in pitches. It only has to be
   longer than the deepest ripple trough so a pin never lifts off. */
const DEPTH = 0.8;

/* Typing sends up to a dozen pulses a second, so there are enough slots
   that a keystroke ring has almost always faded before its slot is
   needed again. A ring cut off while still standing would pop. */
const RIPPLES = 12;
/* Seconds a ring lasts: a keystroke's is short, the final send's long.
   The ripple loop in the shader uses the same formula. */
const ripLife = (strength: number) => 1 + 2 * strength;
/* How much of a ring is left, the same envelope the shader draws, so
   the slot picked for a new ring is the one that will be missed least. */
const ripLeft = (age: number, strength: number) => {
  const life = ripLife(strength);
  if (strength <= 0 || age < 0 || age >= life) return 0;
  const t = clamp((age - life * 0.5) / (life * 0.5), 0, 1);
  return Math.exp(-age * 1.05) * (0.6 + 2.8 * strength) * (1 - t * t * (3 - 2 * t));
};
/* Seconds a pushed pin takes to sink back once the cursor has moved on.
   Long enough to leave a visible stroke, like the toy keeping a hand
   print for a moment; short enough that the wall never looks dirty. */
const WAKE = 0.9;
const TRAIL = 12;

/* Cursor dome, in pitches: radius and peak height. */
const DOME_R = 12;
const DOME_H = 4.2;

/* The lamp over the cursor: height in pitches, and its power idle and
   with a pointer on the wall. Higher means a wider, softer pool. */
const LAMP_Z = 12;
const LAMP_IDLE = 3.2;
const LAMP_ON = 5.5;

/* Scroll parallax across the section's full pass through the viewport. */
const PAR_TILT = THREE.MathUtils.degToRad(7);
const PAR_PAN = 0.7;
const PAR_DOLLY = 0.05;
/* Pointer sway of the camera, radians. */
const SWAY_X = THREE.MathUtils.degToRad(1.6);
const SWAY_Y = THREE.MathUtils.degToRad(1.0);

/* Instance budgets. The grid is sized to the viewport, then the pitch
   grows until it fits: an ultrawide gets the full column count with
   fewer rows, a phone gets fewer, larger pins. Software GL runs the
   vertex shader on the CPU and only ever draws the wall once (see
   holdStill), so it gets a coarse board that draws quickly. */
const CAP_GPU = 8800;
/* When the wall is built ahead of time: comfortably after the intro
   (about five seconds) has handed the page over. */
const IDLE_BUILD_MS = 7000;
const CAP_SOFT = 2600;

function density(w: number, softwareGL: boolean) {
  if (softwareGL) return { cols: clamp(Math.round(w / 24), 26, 64), budget: CAP_SOFT };
  if (w < 768) return { cols: clamp(Math.round(w / 9), 36, 60), budget: 5200 };
  return { cols: clamp(Math.round(w / 14), 64, 124), budget: CAP_GPU };
}

function clamp(v: number, lo: number, hi: number) {
  return v < lo ? lo : v > hi ? hi : v;
}

/* Probed once per page load on a throwaway canvas, before the real
   renderer exists, because antialias can only be chosen at creation.
   StrictMode's second mount reuses the answer. */
let softwareCache: boolean | null = null;
function isSoftwareGL(): boolean {
  if (softwareCache !== null) return softwareCache;
  let result = false;
  try {
    const probe = document.createElement("canvas");
    const gl = (probe.getContext("webgl2") || probe.getContext("webgl")) as WebGLRenderingContext | null;
    if (gl) {
      const dbg = gl.getExtension("WEBGL_debug_renderer_info");
      const gpu = String(dbg ? gl.getParameter(dbg.UNMASKED_RENDERER_WEBGL) : gl.getParameter(gl.RENDERER));
      result = /swiftshader|llvmpipe|basic render|software|warp/i.test(gpu);
      /* Hand the context straight back; browsers cap how many can live. */
      gl.getExtension("WEBGL_lose_context")?.loseContext();
    }
  } catch {
    /* No verdict: treat it as hardware, the renderer will fail on its own if not. */
  }
  softwareCache = result;
  return result;
}

/* ------------------------------------------------------------
   SHADER EDITS
   (Shader comments stay ASCII: some GLSL compilers reject anything
   else, even inside a comment.)
   ------------------------------------------------------------ */

/* Ashima Arts 2D simplex noise (MIT). Two octaves of it drive the idle
   swell; 2D is plenty for a surface and half the cost of 3D. */
const NOISE2 = /* glsl */ `
vec3 pinPermute(vec3 x){return mod(((x*34.0)+1.0)*x,289.0);}
float pinNoise(vec2 v){
  const vec4 C=vec4(0.211324865405187,0.366025403784439,-0.577350269189626,0.024390243902439);
  vec2 i=floor(v+dot(v,C.yy));
  vec2 x0=v-i+dot(i,C.xx);
  vec2 i1=(x0.x>x0.y)?vec2(1.0,0.0):vec2(0.0,1.0);
  vec4 x12=x0.xyxy+C.xxzz;
  x12.xy-=i1;
  i=mod(i,289.0);
  vec3 p=pinPermute(pinPermute(i.y+vec3(0.0,i1.y,1.0))+i.x+vec3(0.0,i1.x,1.0));
  vec3 m=max(0.5-vec3(dot(x0,x0),dot(x12.xy,x12.xy),dot(x12.zw,x12.zw)),0.0);
  m=m*m;m=m*m;
  vec3 x=2.0*fract(p*C.www)-1.0;
  vec3 h=abs(x)-0.5;
  vec3 ox=floor(x+0.5);
  vec3 a0=x-ox;
  m*=1.79284291400159-0.85373472095314*(a0*a0+h*h);
  vec3 g;
  g.x=a0.x*x0.x+h.x*x0.y;
  g.yz=a0.yz*x12.xz+h.yz*x12.yw;
  return 130.0*dot(m,g);
}`;

const VARYINGS = /* glsl */ `
varying float vPinH;
varying float vPinZ;
varying float vPinTop;
varying float vPinSeed;
varying vec2 vPinUv;
varying vec3 vPinAxisX;
varying vec3 vPinAxisY;
varying float vPinFx;
`;

/* Everything below is in pitches: one unit is one pin spacing, so the
   same numbers read the same on a phone's coarse board and a desktop's
   fine one. */
const VERT_PARS = /* glsl */ `
#define PIN_RIPPLES ${RIPPLES}
#define PIN_TRAIL ${TRAIL}
uniform float uTime;
uniform float uPitch;
uniform float uFill;
uniform float uDepth;
uniform vec3 uPointer;
uniform vec2 uDome;
uniform vec3 uTrail[PIN_TRAIL];
uniform vec4 uRip[PIN_RIPPLES];
uniform vec2 uActive;
uniform float uReveal;
uniform vec4 uSweep;
uniform float uIdle;
uniform vec2 uScan;
${VARYINGS}
${NOISE2}

/* Round-shouldered falloff, flat at both ends so the dome has no crease
   at its rim and no point at its crown. */
float pinBump(float t){ t = clamp(t, 0.0, 1.0); float q = 1.0 - t * t; return q * q; }

/* Smooth max: where the wake overlaps the dome they merge into one
   ridge instead of meeting in a V. */
float pinSmax(float a, float b, float k){
  float h = max(k - abs(a - b), 0.0) / k;
  return max(a, b) + h * h * k * 0.25;
}

float pinFx;

float pinHeight(vec2 gp){
  /* Reveal: a front sweeps the diagonal from the near-left corner (s=0)
     to the far-right one (s=1). Behind it the surface is live; on it,
     a crest of pins overshoots and settles. */
  float s = dot(gp - uSweep.xy, uSweep.zw);
  float front = uReveal * 1.5 - 0.25;
  float shown = smoothstep(0.0, 0.25, front - s);
  float lead = (front - s - 0.06) / 0.07;
  float crest = exp(-lead * lead);

  float n = pinNoise(gp * 0.045 + vec2(uTime * 0.045, -uTime * 0.03)) * 0.7
          + pinNoise(gp * 0.11 + vec2(-uTime * 0.07, uTime * 0.05)) * 0.3;
  float idle = (n * 0.5 + 0.5) * uIdle * (0.8 + 0.2 * sin(uTime * 0.7));

  /* uActive says whether any wake marker or ripple is live. It is the
     same for every vertex, so skipping the loops costs no divergence,
     and a wall nobody is touching skips twenty iterations per vertex. */
  float dome = uPointer.z * uDome.y * pinBump(length(gp - uPointer.xy) / uDome.x);
  if (uActive.x > 0.5) {
    for (int i = 0; i < PIN_TRAIL; i++) {
      vec3 t = uTrail[i];
      if (t.z > 0.002) {
        dome = pinSmax(dome, t.z * uDome.y * pinBump(length(gp - t.xy) / (uDome.x * 0.78)), 0.9);
      }
    }
  }

  /* Each ripple is a travelling ring with a shallow trough behind it,
     fading as it widens. Stronger pulses run faster, wider, taller and
     longer, and every ring eases all the way out over the back half of
     its life instead of being cut off at the end. */
  float rip = 0.0;
  if (uActive.y > 0.5) for (int i = 0; i < PIN_RIPPLES; i++) {
    vec4 r = uRip[i];
    float age = uTime - r.z;
    float life = 1.0 + 2.0 * r.w;
    if (r.w <= 0.0 || age < 0.0 || age > life) continue;
    float radius = age * (10.0 + 12.0 * r.w);
    float w = 1.4 + 2.4 * r.w;
    float dr = length(gp - r.xy) - radius;
    float env = exp(-age * 1.05) * (0.6 + 2.8 * r.w)
              * (1.0 - smoothstep(life * 0.5, life, age));
    float a = dr / w;
    float b = (dr + w * 1.9) / w;
    rip += env * (exp(-a * a) - 0.35 * exp(-b * b));
  }

  float sd = (gp.y - uScan.x) / 2.2;
  float scan = uScan.y * exp(-sd * sd);

  /* Ripples and the reveal crest light up on their own account, not just
     by height: a ring is only a pin or two tall, but it should read as
     light running through the wall. */
  pinFx = clamp(crest * 0.9 + max(rip, 0.0) * 0.55, 0.0, 1.0);

  float h = shown * (idle + dome + rip + scan) + crest * 2.2;
  /* Bounded both ways: nothing reaches the camera, and no trough is
     deeper than the pin is long. */
  return clamp(h, -0.6, 5.4);
}
`;

const VERT_MAIN = /* glsl */ `
#include <begin_vertex>
/* The instance matrix only ever holds a translation: the pin's cell. */
vec2 pinCell = instanceMatrix[3].xy / uPitch;
float pinH = pinHeight(pinCell);
vPinH = pinH;
vPinFx = pinFx;
vPinTop = step(0.5, normal.z);
vPinZ = position.z > 0.0 ? pinH : -uDepth;
vPinUv = uv;
vPinSeed = fract(sin(dot(pinCell, vec2(12.9898, 78.233))) * 43758.5453);
vPinAxisX = normalize(normalMatrix * vec3(1.0, 0.0, 0.0));
vPinAxisY = normalize(normalMatrix * vec3(0.0, 1.0, 0.0));
transformed.xy *= uPitch * uFill;
transformed.z = vPinZ * uPitch;
`;

const FRAG_PARS = /* glsl */ `
uniform vec3 uAcid;
uniform float uGlow;
uniform vec2 uResolution;
uniform vec3 uVoid;
uniform float uVignette;
${VARYINGS}
`;

/* Machined pins are never perfectly alike: a touch of albedo and
   roughness drift per pin is what stops the wall looking rendered. */
const FRAG_COLOR = /* glsl */ `
#include <color_fragment>
diffuseColor.rgb *= 0.95 + 0.1 * vPinSeed;
`;
const FRAG_ROUGH = /* glsl */ `
#include <roughnessmap_fragment>
roughnessFactor = clamp(roughnessFactor + (vPinSeed - 0.5) * 0.08, 0.08, 1.0);
`;

/* A chamfer faked in the normal: near each edge of a pin's top, the
   normal leans out toward that edge. The four bevels then catch the key,
   the cursor light and the rim from different sides, which is most of
   what makes a pin look cut from metal. */
const FRAG_NORMAL = /* glsl */ `
#include <normal_fragment_maps>
float pinEdge = 0.0;
/* Each bevel fades out as it narrows below about a pixel, which the far,
   foreshortened rows do first. Left in, those sub-pixel highlights
   crawl and sparkle as the lamp moves. Derivatives are taken here,
   outside the branch, where they are defined. */
const float pinBw = 0.12;
vec2 pinBevel = smoothstep(vec2(0.6), vec2(1.8), pinBw / max(fwidth(vPinUv), vec2(1e-4)));
if (vPinTop > 0.5) {
  float el = 1.0 - smoothstep(0.0, pinBw, vPinUv.x);
  float er = 1.0 - smoothstep(0.0, pinBw, 1.0 - vPinUv.x);
  float eb = 1.0 - smoothstep(0.0, pinBw, vPinUv.y);
  float et = 1.0 - smoothstep(0.0, pinBw, 1.0 - vPinUv.y);
  normal = normalize(normal + (normalize(vPinAxisX) * (er - el) * pinBevel.x
                             + normalize(vPinAxisY) * (et - eb) * pinBevel.y) * 0.9);
  pinEdge = max(max(el, er), max(eb, et));
}
`;

/* The copper is light from behind the board. Pins at rest seal it in;
   push them out and it spills up their exposed sides, brightest low down
   near the board, so a rise reads as a gap opening onto something lit
   rather than a painted blob. Tops stay bare metal, with only a hint of
   it catching the bevels at the peak. */
const FRAG_EMISSIVE = /* glsl */ `
#include <emissivemap_fragment>
float pinRise = max(smoothstep(0.5, 4.0, vPinH), vPinFx) * uGlow;
float pinLow = 1.0 - smoothstep(vPinH - 2.4, vPinH + 0.01, vPinZ);
float pinFres = pow(1.0 - saturate(dot(normal, normalize(vViewPosition))), 4.0);
totalEmissiveRadiance += vPinTop > 0.5
  ? uAcid * pinRise * pinRise * pinEdge * 0.3
  : uAcid * pinRise * (0.12 + 0.88 * pinLow + pinFres * 0.3);
`;

/* Crease darkness. The part of a side that shows is the strip above the
   neighbouring pin; near the rest plane that strip sits deep in the
   lattice and should get almost no light. */
const FRAG_AO = /* glsl */ `
#include <aomap_fragment>
float pinAO = vPinTop > 0.5 ? 1.0 : mix(0.05, 1.0, smoothstep(vPinH - 1.8, vPinH, vPinZ));
reflectedLight.directDiffuse *= pinAO;
reflectedLight.indirectDiffuse *= pinAO;
reflectedLight.directSpecular *= pinAO;
reflectedLight.indirectSpecular *= pinAO;
`;

/* Runs after fog and the sRGB conversion, so uVoid is the page colour
   as written in CSS. */
const FRAG_VIGNETTE = /* glsl */ `
#include <fog_fragment>
vec2 pinSv = gl_FragCoord.xy / uResolution - 0.5;
float pinVig = smoothstep(0.22, 0.78, length(pinSv * vec2(0.92, 1.18)));
gl_FragColor.rgb = mix(gl_FragColor.rgb, uVoid, pinVig * uVignette);
`;

type PinFieldProps = {
  /* The section acting as the window. Pointer input and the render loop
     are both gated on it; the fixed host always covers the viewport. */
  windowRef: RefObject<HTMLElement | null>;
};

export default function PinField({ windowRef }: PinFieldProps) {
  const host = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = host.current;
    const section = windowRef.current;
    if (!el || !section) return;

    let disposed = false;
    /* Filled in by build(). Teardown calls it if the scene ever existed. */
    let destroy: (() => void) | null = null;

    /* ---- lazy build ------------------------------------------------------
       The wall is the last thing on the page. Nothing is created (no
       context, no shader compile) during the intro. Once the page has
       settled it is built in the browser's next idle moment, so the setup
       work never lands in the middle of a scroll. If someone gets within
       a viewport of the section before that (a nav jump), it is built
       there and then. It only draws while the section is on screen. */
    let idleTimer = 0;
    let idleId = 0;
    const make = () => {
      if (destroy || disposed) return;
      buildIO.disconnect();
      window.clearTimeout(idleTimer);
      destroy = build(el, section);
    };
    const buildIO = new IntersectionObserver((entries) => entries.some((e) => e.isIntersecting) && make(), {
      rootMargin: "100% 0px",
    });
    buildIO.observe(section);

    /* A visitor on a data saver keeps the old behaviour: nothing is set up
       unless they actually scroll down to it. */
    const saveData = (navigator as Navigator & { connection?: { saveData?: boolean } }).connection?.saveData;
    if (!saveData) {
      idleTimer = window.setTimeout(() => {
        if (typeof window.requestIdleCallback === "function") idleId = window.requestIdleCallback(make, { timeout: 4000 });
        else make();
      }, IDLE_BUILD_MS);
    }

    return () => {
      disposed = true;
      buildIO.disconnect();
      window.clearTimeout(idleTimer);
      if (idleId && typeof window.cancelIdleCallback === "function") window.cancelIdleCallback(idleId);
      destroy?.();
      destroy = null;
    };
  }, [windowRef]);

  return <div ref={host} aria-hidden className="pointer-events-none fixed inset-0" />;
}

/* ------------------------------------------------------------
   SCENE
   Returns its own teardown, or null if WebGL is unavailable (the
   section is then simply the copy and the chat on the void).
   ------------------------------------------------------------ */
function build(el: HTMLDivElement, section: HTMLElement): (() => void) | null {
  const softwareGL = isSoftwareGL();

  let renderer: THREE.WebGLRenderer;
  try {
    renderer = new THREE.WebGLRenderer({
      antialias: !softwareGL,
      alpha: false,
      powerPreference: "high-performance",
    });
  } catch {
    return null;
  }
  renderer.setClearColor(0x050505, 1);
  /* Neutral rather than ACES: ACES pulls the mid-bright accent toward
     brown, and the glow has to read as the site's copper, not mud. */
  renderer.toneMapping = THREE.NeutralToneMapping;
  renderer.toneMappingExposure = 1.0;
  const canvas = renderer.domElement;
  canvas.style.cssText = "position:absolute;inset:0;width:100%;height:100%;display:block";
  el.appendChild(canvas);

  const scene = new THREE.Scene();
  const fog = new THREE.Fog(0x050505, 8, 14);
  scene.fog = fog;

  /* Studio reflections at low strength: enough that the metal has
     something to mirror, not so much that the wall lights up. */
  const pmrem = new THREE.PMREMGenerator(renderer);
  const room = new RoomEnvironment();
  const envRT = pmrem.fromScene(room, 0.04);

  const camera = new THREE.PerspectiveCamera(FOV, 1, 0.1, 60);

  /* The board lies in its own XY plane with pins pointing +Z, then leans
     back about X so its top edge recedes. */
  const board = new THREE.Group();
  board.rotation.x = -TILT;
  scene.add(board);
  board.updateMatrixWorld(true);

  const capacity = softwareGL ? CAP_SOFT : CAP_GPU;

  /* ---- uniforms ------------------------------------------------------- */
  const trail = Array.from({ length: TRAIL }, () => new THREE.Vector3(0, 0, 0));
  const ripples = Array.from({ length: RIPPLES }, () => new THREE.Vector4(0, 0, -100, 0));
  const uniforms = {
    uTime: { value: 0 },
    uPitch: { value: 0.1 },
    uFill: { value: FILL },
    uDepth: { value: DEPTH },
    uPointer: { value: new THREE.Vector3(0, 0, 0) },
    uDome: { value: new THREE.Vector2(DOME_R, DOME_H) },
    uTrail: { value: trail },
    uRip: { value: ripples },
    uActive: { value: new THREE.Vector2(0, 0) },
    uReveal: { value: 0 },
    uSweep: { value: new THREE.Vector4(0, 0, 0.01, 0.01) },
    uIdle: { value: 0.8 },
    uScan: { value: new THREE.Vector2(-1000, 0) },
    uAcid: { value: new THREE.Color(0xe0895a) },
    uGlow: { value: 0.75 },
    uResolution: { value: new THREE.Vector2(1, 1) },
    /* Output space, after the sRGB conversion: 5/255. */
    uVoid: { value: new THREE.Vector3(5 / 255, 5 / 255, 5 / 255) },
    uVignette: { value: 0.72 },
  };

  /* ---- pins ------------------------------------------------------------
     A unit box: the shader scales it to the pitch, so a resize only
     rewrites instance translations, never the geometry. */
  const geo = new THREE.BoxGeometry(1, 1, 1);
  /* The bottom face (the last of the six) sits below the board and can
     never be seen. Dropping its triangles saves a sixth of the vertex
     shading, which is where this wall spends its time. */
  const boxIndex = geo.getIndex();
  if (boxIndex) {
    geo.setIndex(Array.from(boxIndex.array).slice(0, boxIndex.count - 6));
    geo.clearGroups();
  }
  const mat = new THREE.MeshStandardMaterial({
    color: 0x616366,
    metalness: 0.9,
    roughness: 0.32,
    envMap: envRT.texture,
    envMapIntensity: 0.14,
  });
  mat.onBeforeCompile = (shader) => {
    Object.assign(shader.uniforms, uniforms);
    shader.vertexShader = shader.vertexShader
      .replace("#include <common>", `#include <common>\n${VERT_PARS}`)
      .replace("#include <begin_vertex>", VERT_MAIN);
    shader.fragmentShader = shader.fragmentShader
      .replace("#include <common>", `#include <common>\n${FRAG_PARS}`)
      .replace("#include <color_fragment>", FRAG_COLOR)
      .replace("#include <roughnessmap_fragment>", FRAG_ROUGH)
      .replace("#include <normal_fragment_maps>", FRAG_NORMAL)
      .replace("#include <emissivemap_fragment>", FRAG_EMISSIVE)
      .replace("#include <aomap_fragment>", FRAG_AO)
      .replace("#include <fog_fragment>", FRAG_VIGNETTE);
  };

  const pins = new THREE.InstancedMesh(geo, mat, capacity);
  pins.instanceMatrix.setUsage(THREE.StaticDrawUsage);
  /* Heights come from the shader, so the CPU-side bounds are wrong by
     design. The board always fills the frame anyway. */
  pins.frustumCulled = false;
  board.add(pins);

  /* ---- lights (positions in board space) -------------------------------
     A cool key from the viewer's upper left for form, a copper rim from
     beyond the far edge kept faint enough that it only tints the far
     bevels, and a warm-white lamp that hovers over the cursor: the
     brightest thing on the wall is always wherever the visitor is. */
  const key = new THREE.DirectionalLight(0xe2e5e9, 0.22);
  key.position.set(-6, -4, 8);
  const rim = new THREE.DirectionalLight(0xe0895a, 0.12);
  rim.position.set(-2, 14, 3);
  const lamp = new THREE.PointLight(0xf2f0e6, 0, 0, 2);
  board.add(key, rim, lamp);

  /* ---- geometry of the view -------------------------------------------- */
  const raycaster = new THREE.Raycaster();
  const plane = new THREE.Plane(new THREE.Vector3(0, Math.sin(TILT), Math.cos(TILT)), 0);
  const tmpV = new THREE.Vector3();
  const tmpN = new THREE.Vector2();
  const lookTarget = new THREE.Vector3();

  let vw = 1;
  let vh = 1;
  const view = { cx: 0, cy: 0, hw: 30, hh: 20 };

  /* The camera orbits the board centre: the scroll pass tips it up or
     down and pans along the board; the pointer adds a small sway. */
  const pose = (pass: number, swayX: number, swayY: number) => {
    const phi = (0.5 - pass) * PAR_TILT + swayY;
    const r = DIST * (1 + (pass - 0.5) * PAR_DOLLY);
    const zc = r * Math.cos(phi);
    camera.position.set(zc * Math.sin(swayX), r * Math.sin(phi), zc * Math.cos(swayX));
    /* Pan along the board's own Y: as the page scrolls on, the wall
       drifts up a little, slower than the page. That lag is the depth. */
    const pan = (0.5 - pass) * PAR_PAN;
    lookTarget.set(0, pan * Math.cos(TILT), -pan * Math.sin(TILT));
    camera.lookAt(lookTarget);
    camera.updateMatrixWorld();
  };

  /* Viewport point to board space, in pitches. Null if the ray misses,
     which only a degenerate camera could cause. */
  const toBoard = (cx: number, cy: number, out: THREE.Vector2) => {
    tmpN.set((cx / vw) * 2 - 1, -(cy / vh) * 2 + 1);
    raycaster.setFromCamera(tmpN, camera);
    if (!raycaster.ray.intersectPlane(plane, tmpV)) return null;
    board.worldToLocal(tmpV);
    const p = uniforms.uPitch.value;
    return out.set(tmpV.x / p, tmpV.y / p);
  };

  /* ---- fit ------------------------------------------------------------- */
  /* The grid as last laid out, in board units, and the viewport width it
     was laid out for. */
  const grid = { w: 0, x0: 0, y0: 0, x1: 0, y1: 0 };
  /* Scan line travel, in pitches: from below the near edge to past the
     far one, so it wraps where nobody can see it. */
  const scan = { from: -40, to: 70 };
  let sizeKey = "";

  const fit = () => {
    /* Measured off the host: window.inner*
       includes a classic scrollbar and disagrees with the fixed box on
       phones. */
    const w = el.clientWidth || window.innerWidth || 1;
    const h = el.clientHeight || window.innerHeight || 1;
    /* Software GL shades every pixel on the CPU, so it renders under one
       device pixel: on a board that coarse the softness does not show,
       and the one frame it draws (on load and on resize) takes half the
       time. */
    const dpr = window.devicePixelRatio || 1;
    const ratio = softwareGL ? 0.75 : Math.max(Math.min(dpr, 1), Math.min(dpr, 1.5) * dprScale);
    /* The window resize event and the ResizeObserver both land here for
       the same change, and setSize clears the canvas even when nothing
       changed. Only do the work once. */
    const key = `${w}x${h}@${ratio}`;
    if (key === sizeKey) return;
    sizeKey = key;
    vw = w;
    vh = h;
    renderer.setPixelRatio(ratio);
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
    const buf = renderer.getDrawingBufferSize(new THREE.Vector2());
    uniforms.uResolution.value.copy(buf);

    /* Where the four frustum corners land on the board, at both ends of
       the scroll pass, is the area the pins must cover. */
    let minX = Infinity;
    let maxX = -Infinity;
    let minY = Infinity;
    let maxY = -Infinity;
    for (const pass of [0, 0.5, 1]) {
      pose(pass, 0, 0);
      for (const [sx, sy] of [
        [-1, -1],
        [1, -1],
        [1, 1],
        [-1, 1],
      ]) {
        tmpN.set(sx, sy);
        raycaster.setFromCamera(tmpN, camera);
        if (!raycaster.ray.intersectPlane(plane, tmpV)) continue;
        board.worldToLocal(tmpV);
        minX = Math.min(minX, tmpV.x);
        maxX = Math.max(maxX, tmpV.x);
        minY = Math.min(minY, tmpV.y);
        maxY = Math.max(maxY, tmpV.y);
      }
    }

    /* A phone's address bar changes the viewport height every time the
       scroll direction flips. If the width is the same and the pins
       already laid out still cover the view, keep them: re-gridding would
       shift every pin on the wall mid-scroll. */
    const kept =
      w === grid.w && minX >= grid.x0 && maxX <= grid.x1 && minY >= grid.y0 && maxY <= grid.y1;

    if (!kept) {
      /* The margin absorbs the pointer sway and a pin's own half-width,
         and leaves room for the address bar to come and go. */
      const padX = (maxX - minX) * 0.05;
      const padY = (maxY - minY) * 0.05;
      minX -= padX;
      maxX += padX;
      minY -= padY;
      maxY += padY;
      const W = maxX - minX;
      const H = maxY - minY;

      const { cols, budget } = density(w, softwareGL);
      const cap = Math.min(budget, capacity);
      let pitch = Math.max(W / cols, Math.sqrt((W * H) / cap));
      let nx = 0;
      let ny = 0;
      for (let guard = 0; guard < 40; guard++) {
        nx = Math.ceil(W / pitch) + 1;
        ny = Math.ceil(H / pitch) + 1;
        if (nx * ny <= cap) break;
        pitch *= 1.03;
      }

      const m = new THREE.Matrix4();
      let k = 0;
      for (let j = 0; j < ny; j++) {
        for (let i = 0; i < nx; i++) {
          m.makeTranslation(minX + i * pitch, minY + j * pitch, 0);
          pins.setMatrixAt(k++, m);
        }
      }
      pins.count = k;
      pins.instanceMatrix.needsUpdate = true;
      uniforms.uPitch.value = pitch;
      grid.w = w;
      grid.x0 = minX;
      grid.y0 = minY;
      grid.x1 = minX + (nx - 1) * pitch;
      grid.y1 = minY + (ny - 1) * pitch;
      scan.from = minY / pitch - 8;
      scan.to = grid.y1 / pitch + 8;

      /* The reveal runs along this diagonal, near-left to far-right,
         normalised so s spans 0..1 over the board. */
      const dx = W / pitch;
      const dy = H / pitch;
      const len = Math.hypot(dx * 0.6, dy);
      const ux = (dx * 0.6) / len;
      const uy = dy / len;
      const span = dx * ux + dy * uy;
      uniforms.uSweep.value.set(minX / pitch, minY / pitch, ux / span, uy / span);
    }

    /* Fog from the middle of the frame to just past the far edge, so the
       top of the wall dissolves into the page instead of ending. */
    pose(0.5, 0, 0);
    const depthAt = (sy: number) => {
      tmpN.set(0, sy);
      raycaster.setFromCamera(tmpN, camera);
      if (!raycaster.ray.intersectPlane(plane, tmpV)) return DIST;
      return tmpV.applyMatrix4(camera.matrixWorldInverse).z * -1;
    };
    fog.near = depthAt(0.05);
    fog.far = depthAt(1) * 1.03;

    /* The board point under the middle of the screen and how far the
       visible wall reaches from it, in pitches: the lamp's idle path is
       laid out in these terms so it lands in the same place on every
       screen. */
    const at = new THREE.Vector2();
    toBoard(vw * 0.5, vh * 0.5, at);
    view.cx = at.x;
    view.cy = at.y;
    toBoard(vw, vh * 0.5, at);
    view.hw = Math.max(1, at.x - view.cx);
    toBoard(vw * 0.5, 0, at);
    view.hh = Math.max(1, at.y - view.cy);

    board.updateMatrixWorld(true);
    pose(passSmooth, swayX, swayY);
    if (still) applyStatic();
    else if (!running) {
      /* So the first frame, before the loop has run, is already lit. */
      idleAt(time, lampPos);
      placeLamp();
    }
    /* setSize has just cleared the canvas. Draw straight away, loop or
       not: the loop's frame may already have run this tick, and the page
       would show an empty wall until the next one. */
    render();
  };

  /* ---- motion state ------------------------------------------------------ */
  /* Software GL holds the wall still too, not just motion off. Measured
     under SwiftShader, even the coarse board at under one device pixel
     costs about half a second a frame, and that time comes out of the
     same process that scrolls the page: the whole site ran at 2fps while
     this section was on screen, 59fps with the wall stopped. One good
     frame is worth more there than a moving one.
     Soft motion (the OS asking for reduced motion) is not a reason to
     hold still or tone anything down: the site drops only scroll inertia
     and effects driven by scroll velocity for it, and nothing here reads
     velocity. The cursor dome, the ripples, the scroll parallax, the
     pointer sway and the scan line all run exactly as in full motion. */
  const holdStill = () => reduced() || softwareGL;
  let still = holdStill();

  let raf = 0;
  let running = false;
  let near = false;
  let ready = false;
  let lost = false;
  let pageVisible = document.visibilityState !== "hidden";
  let last = 0;
  let time = 0;

  /* Frame-time governor state (see the loop). */
  let dprScale = 1;
  let frameAvg = 1 / 60;
  let framesSeen = 0;

  let reveal = still ? 1 : 0;
  let passSmooth = 0.5;
  let swayX = 0;
  let swayY = 0;

  /* Pointer, in client px, and whether it is over the section. */
  let hasPointer = false;
  let clientX = 0;
  let clientY = 0;
  let presence = 0;
  const target = new THREE.Vector2();
  const dome = new THREE.Vector2();
  const domeVel = new THREE.Vector2();
  const lastTrail = new THREE.Vector2(1e9, 1e9);
  const trailBorn = new Float32Array(TRAIL).fill(-100);
  let trailIdx = 0;

  const lampPos = new THREE.Vector2(0, 0);
  const idleLamp = new THREE.Vector2();
  let lampPower = LAMP_IDLE;

  /* With no pointer the lamp drifts a slow loop right of centre, in and
     out from behind the chat, so a touch screen or an idle mouse still
     sees light moving over the metal. */
  const idleAt = (t: number, out: THREE.Vector2) =>
    out.set(
      view.cx + view.hw * (0.38 + 0.5 * Math.sin(t * 0.11)),
      view.cy + view.hh * (0.05 + 0.35 * Math.sin(t * 0.17 + 1))
    );

  const placeLamp = () => {
    const p = uniforms.uPitch.value;
    lamp.position.set(lampPos.x * p, lampPos.y * p, LAMP_Z * p);
    lamp.intensity = lampPower;
  };

  const applyStatic = () => {
    /* A single held frame: fully revealed, a gentle frozen swell,
       nothing following anything. The lamp is parked just past the
       phone rather than behind it, so the one frame still shows light
       moving over metal and not a flat grid. */
    time = 21;
    reveal = 1;
    presence = 0;
    uniforms.uTime.value = time;
    uniforms.uReveal.value = 1;
    uniforms.uIdle.value = 0.9;
    uniforms.uPointer.value.set(0, 0, 0);
    uniforms.uScan.value.set(-1000, 0);
    for (const t of trail) t.z = 0;
    for (const r of ripples) r.w = 0;
    uniforms.uActive.value.set(0, 0);
    passSmooth = 0.5;
    swayX = swayY = 0;
    lampPos.set(view.cx + view.hw * 0.74, view.cy + view.hh * 0.12);
    lampPower = LAMP_IDLE * 1.2;
    pose(0.5, 0, 0);
    placeLamp();
  };

  const render = () => {
    if (lost || !ready) return;
    renderer.render(scene, camera);
  };

  /* ---- scroll ------------------------------------------------------------ */
  let revealST: ScrollTrigger | null = null;
  let passST: ScrollTrigger | null = null;
  const ctx = gsap.context(() => {
    revealST = ScrollTrigger.create({ trigger: section, start: "top bottom", end: "top 20%" });
    passST = ScrollTrigger.create({ trigger: section, start: "top bottom", end: "bottom top" });
  });

  /* ---- loop --------------------------------------------------------------- */
  const frame = (now: number) => {
    raf = requestAnimationFrame(frame);
    const raw = Math.max((now - last) / 1000, 0);
    const dt = Math.min(raw, 0.05);
    last = now;

    /* A lattice this dense is nearly all triangle edges, which is where
       antialiasing gets expensive, and a high-DPI laptop on integrated
       graphics feels it first. If the wall cannot hold about 36fps once
       it has settled (a long warm-up, so page-load jank never counts),
       step the pixel ratio down, twice at most and never below one
       device pixel, rather than stutter the scroll. */
    frameAvg += (Math.min(raw, 0.2) - frameAvg) * 0.03;
    if (++framesSeen > 180 && frameAvg > 1 / 36 && dprScale > 0.7) {
      dprScale = dprScale > 0.9 ? 0.8 : 0.67;
      framesSeen = 0;
      frameAvg = 1 / 60;
      fit();
    }
    time += dt;

    /* Reveal follows the scroll, eased, and never faster than one sweep
       in about a second, so a jump straight to #contact still plays it. */
    const revealTarget = revealST ? revealST.progress : 1;
    let dr = (revealTarget - reveal) * (1 - Math.exp(-dt * 6));
    dr = clamp(dr, -dt * 0.9, dt * 0.9);
    reveal += dr;

    const passTarget = passST ? passST.progress : 0.5;
    passSmooth += (passTarget - passSmooth) * (1 - Math.exp(-dt * 5));

    /* Pointer presence: in only while the pointer is over the section.
       The rect is read per frame because the page scrolls under a
       still mouse. */
    let inside = false;
    if (hasPointer) {
      const r = section.getBoundingClientRect();
      inside = clientX >= r.left && clientX <= r.right && clientY >= r.top && clientY <= r.bottom;
    }
    presence += ((inside ? 1 : 0) - presence) * (1 - Math.exp(-dt * 4));

    /* Camera sway toward the pointer. */
    const sx = inside ? (clientX / vw - 0.5) * 2 * SWAY_X : 0;
    const sy = inside ? -(clientY / vh - 0.5) * 2 * SWAY_Y : 0;
    const ks = 1 - Math.exp(-dt * 2.5);
    swayX += (sx - swayX) * ks;
    swayY += (sy - swayY) * ks;
    pose(passSmooth, swayX, swayY);

    if (inside && toBoard(clientX, clientY, target)) {
      /* Entering from nothing: start the dome under the pointer rather
         than letting it race over from wherever it last was. */
      if (presence < 0.05) {
        dome.copy(target);
        domeVel.set(0, 0);
        lastTrail.copy(target);
      }
    }

    /* A critically damped spring gives the dome a little mass: it lags a
       fast flick and settles without wobbling. Sub-stepped so it stays
       stable on a slow frame. */
    const omega = 11;
    const steps = Math.max(1, Math.ceil(dt / (1 / 120)));
    const h = dt / steps;
    for (let s = 0; s < steps; s++) {
      const ax = omega * omega * (target.x - dome.x) - 2 * omega * domeVel.x;
      const ay = omega * omega * (target.y - dome.y) - 2 * omega * domeVel.y;
      domeVel.x += ax * h;
      domeVel.y += ay * h;
      dome.x += domeVel.x * h;
      dome.y += domeVel.y * h;
    }
    uniforms.uPointer.value.set(dome.x, dome.y, presence);

    /* The wake: drop a marker every few pins travelled and let each one
       sink back over WAKE seconds. The spacing stretches with speed so
       the markers always span the whole wake: a fast flick never
       recycles a marker that is still standing, which would pop. */
    const spacing = Math.max(2.6, (domeVel.length() * WAKE) / TRAIL);
    if (presence > 0.05 && dome.distanceTo(lastTrail) > spacing) {
      trail[trailIdx].set(dome.x, dome.y, 0);
      trailBorn[trailIdx] = time;
      trailIdx = (trailIdx + 1) % TRAIL;
      lastTrail.copy(dome);
    }
    let wakeLive = false;
    for (let i = 0; i < TRAIL; i++) {
      const age = (time - trailBorn[i]) / WAKE;
      /* Ease-out: pins hold most of their height, then settle. */
      const a = age < 1 ? 1 - age * age * (3 - 2 * age) : 0;
      trail[i].z = a * presence * 0.9;
      if (trail[i].z > 0.002) wakeLive = true;
    }
    let ripLive = false;
    for (const r of ripples) if (r.w > 0 && time - r.z < ripLife(r.w)) ripLive = true;
    uniforms.uActive.value.set(wakeLive ? 1 : 0, ripLive ? 1 : 0);

    /* The pointer takes the lamp over from its idle drift as it arrives. */
    const p = uniforms.uPitch.value;
    idleAt(time, idleLamp);
    lampPos.set(
      idleLamp.x + (dome.x - idleLamp.x) * presence,
      idleLamp.y + (dome.y - idleLamp.y) * presence
    );
    lampPower = LAMP_IDLE + presence * (LAMP_ON - LAMP_IDLE);
    lamp.position.set(lampPos.x * p, lampPos.y * p, LAMP_Z * p);
    lamp.intensity = lampPower;

    /* A faint line of raised pins scanning up the wall every ten seconds. */
    const cycle = (time % 10) / 10;
    uniforms.uScan.value.set(scan.from + cycle * (scan.to - scan.from), 0.22);

    uniforms.uTime.value = time;
    uniforms.uReveal.value = reveal;
    render();
  };

  const start = () => {
    if (running || still || !near || !pageVisible || !ready || lost) return;
    running = true;
    last = performance.now();
    framesSeen = 0;
    frameAvg = 1 / 60;
    raf = requestAnimationFrame(frame);
  };
  const stop = () => {
    running = false;
    cancelAnimationFrame(raf);
  };

  /* ---- input -------------------------------------------------------------- */
  const onMove = (e: PointerEvent) => {
    /* On touch, pointermove fires while scrolling; the dome would chase
       every swipe. Touch gets taps instead (below). */
    if (e.pointerType === "touch") return;
    hasPointer = true;
    clientX = e.clientX;
    clientY = e.clientY;
  };
  const onOut = (e: PointerEvent) => {
    if (e.relatedTarget) return;
    hasPointer = false;
  };

  const ripple = (cx: number, cy: number, strength: number) => {
    if (still || !ready || lost) return;
    const at = toBoard(clamp(cx, 0, vw), clamp(cy, 0, vh), new THREE.Vector2());
    if (!at) return;
    /* The slot with the least ring left in it, not simply the next in
       turn: a burst of keystrokes must not cut off the big ring a send
       started a moment earlier. */
    let slot = 0;
    let least = Infinity;
    for (let i = 0; i < RIPPLES; i++) {
      const left = ripLeft(time - ripples[i].z, ripples[i].w);
      if (left < least) {
        least = left;
        slot = i;
      }
    }
    ripples[slot].set(at.x, at.y, time, strength);
  };

  /* A tap or click on the bare wall (not on a control) sends a small ring,
     so the surface answers touch screens too. */
  const onDown = (e: PointerEvent) => {
    const t = e.target as Element | null;
    if (t?.closest?.("a, button, input, textarea, select, label, summary, [role=button], [data-hover]")) return;
    const r = section.getBoundingClientRect();
    if (e.clientX < r.left || e.clientX > r.right || e.clientY < r.top || e.clientY > r.bottom) return;
    ripple(e.clientX, e.clientY, 0.4);
  };

  /* The chat in front dispatches these: keystrokes 0.25, messages 0.6,
     the final send 1. Anything malformed is dropped, not guessed at. */
  const onPulse = (e: Event) => {
    const d = (e as CustomEvent<unknown>).detail as { x?: unknown; y?: unknown; strength?: unknown } | null;
    if (!d || typeof d !== "object") return;
    const { x, y, strength } = d;
    if (typeof x !== "number" || typeof y !== "number" || !Number.isFinite(x) || !Number.isFinite(y)) return;
    const s = typeof strength === "number" && Number.isFinite(strength) ? clamp(strength, 0, 1) : 0.5;
    if (s <= 0) return;
    ripple(x, y, s);
  };

  /* ---- observers ---------------------------------------------------------- */
  const io = new IntersectionObserver(
    ([entry]) => {
      near = entry.isIntersecting;
      if (near) start();
      else stop();
    },
    { rootMargin: "120px 0px" }
  );

  const onVisibility = () => {
    pageVisible = document.visibilityState !== "hidden";
    if (pageVisible) start();
    else stop();
  };

  /* Input only matters while the wall moves; held still, nothing
     listens for the pointer or the chat at all. */
  let listening = false;
  const listen = (on: boolean) => {
    if (on === listening) return;
    listening = on;
    if (on) {
      window.addEventListener("pointermove", onMove, { passive: true });
      window.addEventListener("pointerout", onOut);
      window.addEventListener("pointerdown", onDown, { passive: true });
      window.addEventListener("pinfield:pulse", onPulse);
    } else {
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerout", onOut);
      window.removeEventListener("pointerdown", onDown);
      window.removeEventListener("pinfield:pulse", onPulse);
      hasPointer = false;
    }
  };

  /* Follows data-motion on <html>. Nothing changes it after load now that
     the footer toggle is gone; this only keeps the wall honest if that
     ever comes back. */
  const motionWatch = new MutationObserver(() => {
    const wasStill = still;
    still = holdStill();
    listen(!still);
    if (still) {
      stop();
      applyStatic();
      render();
    } else if (wasStill) {
      uniforms.uIdle.value = 0.8;
      start();
    }
  });

  let resizeRaf = 0;
  const onResize = () => {
    cancelAnimationFrame(resizeRaf);
    resizeRaf = requestAnimationFrame(fit);
  };
  const ro = new ResizeObserver(onResize);

  const onLost = () => {
    /* No restore path (so no preventDefault, which would ask the browser
       for one): the wall is decoration. Stop cleanly and leave the
       section on its own background. */
    lost = true;
    stop();
    canvas.style.visibility = "hidden";
  };
  canvas.addEventListener("webglcontextlost", onLost);

  fit();
  uniforms.uReveal.value = reveal;

  /* Compile off the main thread where the browser can, so the first
     frame does not hitch the scroll that brought the section in. With
     KHR_parallel_shader_compile, compile() only queues the work and the
     program says when it is done. This polls it on a timer it can cancel,
     rather than using compileAsync: that one keeps polling after
     teardown and throws on the disposed material, and after a context
     loss it never stops polling. */
  let alive = true;
  let compileTimer = 0;
  const poll = () => {
    compileTimer = 0;
    if (!alive || lost) return;
    const program = (renderer.properties.get(mat) as { currentProgram?: { isReady(): boolean } })
      .currentProgram;
    if (program && !program.isReady()) {
      compileTimer = window.setTimeout(poll, 16);
      return;
    }
    /* Ready, or compile() never got that far: the first render then
       compiles the old way, which is slower but still correct. */
    ready = true;
    render();
    start();
  };
  try {
    renderer.compile(scene, camera);
  } catch {
    /* Left to the first render. */
  }
  poll();

  ro.observe(el);
  io.observe(section);
  window.addEventListener("resize", onResize);
  listen(!still);
  document.addEventListener("visibilitychange", onVisibility);
  motionWatch.observe(document.documentElement, { attributes: true, attributeFilter: ["data-motion"] });

  /* ---- teardown ------------------------------------------------------------ */
  return () => {
    alive = false;
    stop();
    clearTimeout(compileTimer);
    cancelAnimationFrame(resizeRaf);
    ctx.revert();
    io.disconnect();
    ro.disconnect();
    motionWatch.disconnect();
    window.removeEventListener("resize", onResize);
    listen(false);
    document.removeEventListener("visibilitychange", onVisibility);
    canvas.removeEventListener("webglcontextlost", onLost);

    scene.clear();
    pins.dispose();
    geo.dispose();
    mat.dispose();
    envRT.dispose();
    pmrem.dispose();
    room.dispose();
    renderer.dispose();
    /* Give the context back now rather than at garbage collection: the
       hero has one too, and browsers cap how many can be alive. A context
       that is already lost has nothing to give back, and asking again
       only logs a GL error. */
    if (!lost) renderer.forceContextLoss();
    canvas.remove();
  };
}
