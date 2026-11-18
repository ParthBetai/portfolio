"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import * as THREE from "three";
import { gsap } from "@/lib/motion";
import { PORTRAIT_SRC } from "./Portrait";
import type { ExposureState } from "./Exposure";

/* ============================================================
   THE HERO PORTRAIT, AS A LIT RELIEF

   The cutout (public/portrait.webp) is laid on a finely subdivided plane
   and pushed toward the camera by a depth map (public/portrait-depth.png:
   the silhouette's distance transform, rounded, with the head and the
   crossed forearms brought forward). Nothing is modelled: the depth only
   decides how the photo turns, so the face is never reshaped.

   Facing forward it is the photo, pixel for pixel. Every raised vertex is
   slid back along its camera ray, so at rest it projects exactly where the
   flat pixel was, and the lighting is a difference against the rest pose,
   so at rest it adds nothing. Only when the relief turns toward the
   pointer do the parallax and the light change: surfaces turning into the
   warm light on the right (the photo's own orange rim, pushed toward the
   yellow disc printed behind him) pick it up, the ones turning
   away from the cool left light lose some.

   He stands behind the Strand Road railing on the cream sheet, so the
   waist fade is short (the railing hides the cut), and the only shadow
   is a hard, printed one: his silhouette in faint navy ink, a few pixels
   down and to the right. Nothing soft or dark rings him (a blurred
   occlusion read as a grey halo).

   THE EXPOSURE. When the About sheet slides up, a copy line runs up the
   hero ahead of it and everything below the line is the blueprint print
   (Exposure.tsx). This canvas sits between the two prints' layers, so it
   draws the split itself: the hero passes the line's height in through
   `exposure`, and below it (gl_FragCoord, in both shaders) the photo is
   printed as a blue duotone and the shadow in the deep navy of the blue
   sheet. No second canvas, no filter. Once About covers the hero the loop
   stops.

   Both images were made once from the original photo: the cutout keyed
   off its black backdrop with soft edges un-premultiplied against the
   black (no dark fringe), the depth map from the cutout's silhouette.

   If WebGL is missing, runs in software, or loses its context, the plain
   cutout is shown with a CSS tilt instead.
   `?portrait=flat` forces that fallback, for checking it.
   ============================================================ */

export const PORTRAIT_DEPTH = "/portrait-depth.png";

/* The cutout's pixel size, so the plane has the photo's proportions. */
const IMG_W = 1080;
const IMG_H = 1456;
const ASPECT = IMG_W / IMG_H;

/* Framing, in units of the plane's height. The plane's bottom sits on the
   canvas's bottom edge (the waist fades out there) and TOP leaves room
   above the hair for the float. The canvas is wider than the plane, so the
   arms never clip when he turns. */
const TOP = 0.05;
const VIEW_H = 1 + TOP;
/** The plane's share of the canvas height, for the flat fallback to match. */
export const PLANE_SHARE = 1 / VIEW_H;
const CAM_Z = 3.2;

/* How far the relief rises, and where it turns about: the chest, halfway
   into the relief, so the face and the silhouette move in opposite
   directions like a real object's. */
const DEPTH = 0.15;
const PIVOT_Y = 0.45;
const PIVOT_Z = 0.06;

/* Degrees. */
const YAW = 9;
const PITCH = 4;
const SWAY_YAW = 1.4;
const SWAY_PITCH = 0.6;

/* The waist fade: alpha ramps in over this much of the plane's height. */
const FADE_FROM = 0.0;
const FADE_TO = 0.05;

/* The blueprint print below the copy line: the photo's grey level mapped
   through three stops (shadow, mid, light), in sRGB, the same curve the
   drawings' cyanotype uses. */
const DUO = [
  [0.05, 0.12, 0.33],
  [0.3, 0.42, 0.7],
  [0.88, 0.92, 1.0],
] as const;

/* The printed shadow: its offset down and to the right, in units of the
   plane's height (about 6px on a desktop), and the ink's strength: faint,
   and sampled at full resolution, so it reads as a crisp offset print
   rather than a soft fringe along the hair and shoulders. */
const PRINT_OFFSET = 0.0095;
const PRINT_ALPHA = 0.1;

const DEG = Math.PI / 180;

const VERT = /* glsl */ `
uniform sampler2D uDepth;
uniform vec2 uTexel;
uniform float uAmount;
uniform float uAspect;
uniform vec3 uCam;
varying vec2 vUv;
varying vec3 vN;
varying vec3 vN0;

float h(vec2 uv) { return texture2D(uDepth, uv).r; }

void main() {
  vUv = uv;
  float d = h(uv);
  vec2 e = uTexel * 2.0;
  float dx = (h(uv + vec2(e.x, 0.0)) - h(uv - vec2(e.x, 0.0))) / (2.0 * e.x * uAspect);
  float dy = (h(uv + vec2(0.0, e.y)) - h(uv - vec2(0.0, e.y))) / (2.0 * e.y);
  vec3 n = normalize(vec3(-dx * uAmount, -dy * uAmount, 1.0));
  /* At rest the camera looks straight down -z, so the rest normal in view
     space is the object normal. */
  vN0 = n;
  vN = normalize(normalMatrix * n);

  float z = d * uAmount;
  vec3 p = position;
  /* Slide the raised point back along its camera ray (uCam is the camera in
     this mesh's rest space), so facing forward it lands on the flat
     photo's pixel and only a turn reveals the depth. */
  p.xy = mix(p.xy, uCam.xy, z / uCam.z);
  p.z = z;
  gl_Position = projectionMatrix * modelViewMatrix * vec4(p, 1.0);
}`;

const FRAG = /* glsl */ `
uniform sampler2D uMap;
uniform vec3 uWarmDir;
uniform vec3 uCoolDir;
uniform vec3 uWarmDir0;
uniform vec3 uCoolDir0;
uniform vec3 uWarm;
uniform vec3 uCool;
uniform vec2 uFade;
uniform float uEdge;
uniform vec3 uDuo0;
uniform vec3 uDuo1;
uniform vec3 uDuo2;
varying vec2 vUv;
varying vec3 vN;
varying vec3 vN0;

vec3 toLinear(vec3 c) {
  return mix(c / 12.92, pow((c + 0.055) / 1.055, vec3(2.4)), step(0.04045, c));
}
vec3 toSrgb(vec3 c) {
  return mix(c * 12.92, 1.055 * pow(c, vec3(1.0 / 2.4)) - 0.055, step(0.0031308, c));
}

void main() {
  /* The texture is uploaded premultiplied and sampled as raw sRGB values,
     so mipmaps and filtering blend the way the browser blends an <img>. */
  vec4 t = texture2D(uMap, vUv);
  float a = t.a * smoothstep(uFade.x, uFade.y, vUv.y);
  if (a < 0.002) discard;
  vec3 c = toLinear(t.rgb / max(t.a, 1e-4));

  vec3 n = normalize(vN);
  vec3 n0 = normalize(vN0);
  float w = max(dot(n, uWarmDir), 0.0) - max(dot(n0, uWarmDir0), 0.0);
  float k = max(dot(n, uCoolDir), 0.0) - max(dot(n0, uCoolDir0), 0.0);
  c *= max(vec3(0.0), 1.0 + uWarm * w + uCool * k);
  /* A trace of light on the black shirt, which multiplying cannot reach. */
  c += (uWarm * max(w, 0.0) + uCool * max(k, 0.0)) * 0.012;

  vec3 o = toSrgb(c);
  /* Below the copy line: the blueprint print, a duotone of the lit photo. */
  if (gl_FragCoord.y < uEdge) {
    float g = clamp(dot(o, vec3(0.2126, 0.7152, 0.0722)), 0.0, 1.0);
    o = g < 0.5 ? mix(uDuo0, uDuo1, g * 2.0) : mix(uDuo1, uDuo2, g * 2.0 - 1.0);
  }
  gl_FragColor = vec4(o * a, a);
}`;

/* The printed shadow on the field behind him: the cutout's own alpha, so
   its edge is as crisp as his, in faint ink (premultiplied), fading at
   the waist with him. */
const SHADE_FRAG = /* glsl */ `
uniform sampler2D uMap;
uniform float uStrength;
uniform vec3 uInk;
uniform vec3 uInkBp;
uniform vec2 uFade;
uniform float uEdge;
varying vec2 vUv;
void main() {
  float a = textureLod(uMap, vUv, 0.0).a;
  a *= smoothstep(uFade.x, uFade.y, vUv.y) * uStrength;
  bool bp = gl_FragCoord.y < uEdge;
  /* On the blue a faint navy would vanish, so the copy prints it deeper. */
  if (bp) a *= 2.2;
  gl_FragColor = vec4((bp ? uInkBp : uInk) * a, a);
}`;

const SHADE_VERT = /* glsl */ `
varying vec2 vUv;
void main() {
  vUv = uv;
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}`;

type Mode = "gl" | "flat";

export default function HeroPortrait({
  src = PORTRAIT_SRC,
  depthSrc = PORTRAIT_DEPTH,
  label,
  onReady,
  exposure,
}: {
  src?: string;
  depthSrc?: string;
  label?: string;
  onReady?: () => void;
  /** The Exposure's state (Exposure.tsx): the copy line's height in this
      box and whether About has covered the hero. */
  exposure?: ExposureState;
}) {
  const host = useRef<HTMLDivElement>(null);
  /* Client-only (the hero loads it with ssr: false), so the flag can be read
     on the first render. */
  const [mode, setMode] = useState<Mode>(() =>
    typeof window !== "undefined" && new URLSearchParams(window.location.search).get("portrait") === "flat"
      ? "flat"
      : "gl"
  );

  /* Held in a ref so a parent re-render can't restart the scene. */
  const readyCb = useRef(onReady);
  readyCb.current = onReady;
  const sent = useRef(false);
  const signal = useCallback(() => {
    if (sent.current) return;
    sent.current = true;
    readyCb.current?.();
  }, []);

  useEffect(() => {
    if (mode !== "gl") return;
    const el = host.current;
    if (!el) return;

    let alive = true;
    const toFlat = () => {
      if (alive) setMode("flat");
    };

    let renderer: THREE.WebGLRenderer;
    try {
      /* No MSAA: the silhouette is the texture's alpha, not a geometry edge. */
      renderer = new THREE.WebGLRenderer({ antialias: false, alpha: true, premultipliedAlpha: true });
    } catch {
      toFlat();
      return;
    }

    /* Software WebGL runs every vertex on the CPU; a 35k-vertex relief is
       not worth that. The flat cutout looks the same facing forward. */
    const gl = renderer.getContext();
    const dbg = gl.getExtension("WEBGL_debug_renderer_info");
    const gpu = String(dbg ? gl.getParameter(dbg.UNMASKED_RENDERER_WEBGL) : gl.getParameter(gl.RENDERER));
    if (/swiftshader|llvmpipe|basic render|software|warp/i.test(gpu)) {
      renderer.dispose();
      toFlat();
      return;
    }

    const canvas = renderer.domElement;
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    renderer.setClearColor(0x000000, 0);
    renderer.toneMapping = THREE.NoToneMapping;
    Object.assign(canvas.style, { width: "100%", height: "100%", display: "block" });
    el.appendChild(canvas);

    const onLost = (e: Event) => {
      e.preventDefault();
      toFlat();
    };
    canvas.addEventListener("webglcontextlost", onLost);

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(
      (2 * Math.atan(VIEW_H / 2 / CAM_Z)) / DEG,
      1,
      0.1,
      20
    );
    camera.position.set(0, VIEW_H / 2, CAM_Z);

    /* ---- textures ------------------------------------------------ */
    const textures: THREE.Texture[] = [];
    let map: THREE.Texture | null = null;

    /* Decoded off the main thread as ImageBitmaps, so the first frame only
       uploads them (a 1080px WebP decode there froze the loader on phones).
       WebGL ignores its unpack flags for bitmaps, so the flip is done at
       decode and the premultiply on the GPU (premultiply() below). Safari
       before 17 and Firefox before 98 ignore the decode options (three's
       GLTFLoader gates the same way), so they keep the <img> loader and its
       unpack flags. */
    const ua = navigator.userAgent;
    const safari = /^((?!chrome|android).)*safari/i.test(ua) ? Number(ua.match(/Version\/(\d+)/)?.[1] ?? 0) : 99;
    const firefox = Number(ua.match(/Firefox\/(\d+)\./)?.[1] ?? 99);
    const bitmaps = typeof createImageBitmap === "function" && safari >= 17 && firefox >= 98;
    const free = (t: THREE.Texture) => {
      t.dispose();
      (t.image as Partial<ImageBitmap>).close?.(); // a bitmap holds its pixels until closed
    };

    /* A texture that arrives after unmount is freed on arrival. One loader
       per image: an ImageBitmapLoader reads its options when the fetch lands. */
    const load = (url: string, setup: (t: THREE.Texture) => void) =>
      new Promise<THREE.Texture>((resolve, reject) => {
        const arrive = (t: THREE.Texture) => {
          if (!alive) {
            free(t);
            return reject(new Error("unmounted"));
          }
          setup(t);
          textures.push(t);
          resolve(t);
        };
        if (!bitmaps) {
          new THREE.TextureLoader().load(url, arrive, undefined, reject);
          return;
        }
        new THREE.ImageBitmapLoader()
          .setOptions({ imageOrientation: "flipY", colorSpaceConversion: "none", premultiplyAlpha: "none" })
          .load(
            url,
            (bmp) => {
              const t = new THREE.Texture(bmp);
              t.flipY = false;
              t.needsUpdate = true;
              arrive(t);
            },
            undefined,
            reject
          );
      });

    /* ---- scene ------------------------------------------------------ */
    const pivot = new THREE.Group();
    pivot.position.set(0, PIVOT_Y, PIVOT_Z);
    scene.add(pivot);

    const warm0 = new THREE.Vector3(0.8, 0.25, 0.55).normalize();
    const cool0 = new THREE.Vector3(-0.8, 0.1, 0.55).normalize();
    const uniforms = {
      uMap: { value: null as THREE.Texture | null },
      uDepth: { value: null as THREE.Texture | null },
      uTexel: { value: new THREE.Vector2(1, 1) },
      uAmount: { value: DEPTH },
      uAspect: { value: ASPECT },
      uCam: { value: new THREE.Vector3(0, VIEW_H / 2, CAM_Z) },
      uWarmDir: { value: warm0.clone() },
      uCoolDir: { value: cool0.clone() },
      uWarmDir0: { value: warm0 },
      uCoolDir0: { value: cool0 },
      /* Linear-light gains: the photo's orange rim warmed toward the taxi
         yellow around him, and the blue of its cool rim. */
      uWarm: { value: new THREE.Vector3(1.0, 0.76, 0.24).multiplyScalar(1.15) },
      uCool: { value: new THREE.Vector3(0.36, 0.56, 1.0).multiplyScalar(1.0) },
      uFade: { value: new THREE.Vector2(FADE_FROM, FADE_TO) },
      /* Below this height in the drawing buffer (from its bottom, as
         gl_FragCoord counts) the blueprint print shows. -1: none of it. */
      uEdge: { value: -1 },
      uDuo0: { value: new THREE.Vector3(...DUO[0]) },
      uDuo1: { value: new THREE.Vector3(...DUO[1]) },
      uDuo2: { value: new THREE.Vector3(...DUO[2]) },
    };

    const geo = new THREE.PlaneGeometry(ASPECT, 1, 160, 216);
    geo.translate(0, 0.5, 0);
    const mat = new THREE.ShaderMaterial({
      uniforms,
      vertexShader: VERT,
      fragmentShader: FRAG,
      transparent: true,
      premultipliedAlpha: true,
      depthWrite: false,
      depthTest: false,
    });
    const mesh = new THREE.Mesh(geo, mat);
    mesh.position.set(0, -PIVOT_Y, -PIVOT_Z);
    mesh.renderOrder = 1;
    pivot.add(mesh);

    /* The shadow sits on a plane behind him that does not turn, scaled so it
       lines up at rest; the parallax against it is part of the 3D: as he
       turns, he lifts off the field. */
    const SHADE_Z = -0.22;
    const shadeScale = (CAM_Z - SHADE_Z) / CAM_Z;
    const shadeGeo = new THREE.PlaneGeometry(ASPECT, 1, 1, 1);
    shadeGeo.translate(0, 0.5, 0);
    const shadeUniforms = {
      uMap: { value: null as THREE.Texture | null },
      uStrength: { value: PRINT_ALPHA },
      /* The ink-deep token, #131a4a, as raw sRGB like the photo; under the
         copy line the night-deep #0e1332. */
      uInk: { value: new THREE.Vector3(19 / 255, 26 / 255, 74 / 255) },
      uInkBp: { value: new THREE.Vector3(14 / 255, 19 / 255, 50 / 255) },
      uFade: { value: new THREE.Vector2(FADE_FROM, FADE_TO) },
      /* Shares the relief's edge uniform, so the two always split as one. */
      uEdge: uniforms.uEdge,
    };
    const shadeMat = new THREE.ShaderMaterial({
      uniforms: shadeUniforms,
      vertexShader: SHADE_VERT,
      fragmentShader: SHADE_FRAG,
      transparent: true,
      premultipliedAlpha: true,
      depthWrite: false,
      depthTest: false,
    });
    const shade = new THREE.Mesh(shadeGeo, shadeMat);
    /* Scaled about the camera's eye line so that at rest it projects onto the
       photo exactly, then offset (scaled the same way) down and right. */
    const s = shadeScale;
    shade.scale.setScalar(s);
    shade.position.set(PRINT_OFFSET * s, (VIEW_H / 2) * (1 - s) - PRINT_OFFSET * s, SHADE_Z);
    shade.renderOrder = 0;
    shade.visible = false;
    scene.add(shade);

    /* ---- sizing ----------------------------------------------------- */
    /* The copy line arrives in this box's CSS pixels from its top; the
       shaders want drawing-buffer pixels from the bottom. */
    let boxH = 1;
    let bufH = 1;
    const applyEdge = () => {
      const y = exposure ? exposure.edge : Infinity;
      uniforms.uEdge.value = Number.isFinite(y) ? (boxH - y) * (bufH / boxH) : -1;
    };
    const resize = () => {
      const w = el.clientWidth || 1;
      const h = el.clientHeight || 1;
      renderer.setSize(w, h, false);
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      boxH = h;
      bufH = canvas.height || h;
      applyEdge();
    };
    resize();
    const ro = new ResizeObserver(() => {
      resize();
      if (map) renderer.render(scene, camera);
    });
    ro.observe(el);

    /* ---- pointer ---------------------------------------------------- */
    /* Mouse and pen only: a finger dragging to scroll is not pointing. */
    let px = 0;
    let py = 0;
    let lastMove = -1e9;
    const onMove = (e: PointerEvent) => {
      if (e.pointerType === "touch") return;
      px = THREE.MathUtils.clamp((e.clientX / window.innerWidth) * 2 - 1, -1, 1);
      py = THREE.MathUtils.clamp((e.clientY / window.innerHeight) * 2 - 1, -1, 1);
      lastMove = performance.now();
    };
    const onLeave = () => {
      lastMove = -1e9;
    };
    window.addEventListener("pointermove", onMove, { passive: true });
    document.documentElement.addEventListener("pointerleave", onLeave);

    /* ---- loop ------------------------------------------------------- */
    let running = false;
    let visible = true;
    let prev = performance.now();
    const t0 = prev;
    let yaw = 0;
    let pitch = 0;
    let lx = 0;
    let ly = 0;

    const frame = (now: number) => {
      const dt = Math.min((now - prev) / 1000, 0.05);
      prev = now;
      const t = (now - t0) / 1000;

      /* The pointer leads while it moves; after a few still seconds it lets
         go and the float takes over. */
      const idle = THREE.MathUtils.smoothstep((now - lastMove) / 1000, 2.5, 5);
      const tx = px * (1 - idle);
      const ty = py * (1 - idle);
      const sway = 0.45 + 0.55 * idle;
      const targetYaw = tx * YAW + Math.sin(t * 0.55) * SWAY_YAW * sway;
      const targetPitch = ty * PITCH + Math.sin(t * 0.43 + 1.3) * SWAY_PITCH * sway;

      const ease = 1 - Math.exp(-dt * 3.2);
      yaw += (targetYaw - yaw) * ease;
      pitch += (targetPitch - pitch) * ease;
      lx += (tx - lx) * ease;
      ly += (ty - ly) * ease;

      pivot.rotation.set(pitch * DEG, yaw * DEG, 0);
      /* Breath: a slow rise and settle, a few pixels at most. */
      pivot.position.y = PIVOT_Y + Math.sin(t * 1.15) * 0.0032;

      /* The rim lights lean toward the pointer too, a little. */
      uniforms.uWarmDir.value.set(0.8 + lx * 0.3, 0.25 - ly * 0.2, 0.55).normalize();
      uniforms.uCoolDir.value.set(-0.8 + lx * 0.3, 0.1 - ly * 0.2, 0.55).normalize();

      renderer.render(scene, camera);
    };

    /* The loop rides GSAP's ticker rather than its own requestAnimationFrame,
       so it draws after the Exposure's scrub has moved the copy line in the
       same frame (the CSS masks and the shader split stay in step). If a
       frame was already drawn when the line moves anyway (a listener added
       ahead of this one), onChange draws it again below. */
    let drawnFrame = -1;
    const tick = () => {
      drawnFrame = gsap.ticker.frame;
      frame(performance.now());
    };
    const start = () => {
      if (running || !map || !visible || document.hidden || exposure?.covered) return;
      running = true;
      prev = performance.now();
      gsap.ticker.add(tick);
    };
    const stop = () => {
      if (!running) return;
      running = false;
      gsap.ticker.remove(tick);
    };

    const io = new IntersectionObserver(
      ([e]) => {
        visible = e.isIntersecting;
        if (visible) start();
        else stop();
      },
      { threshold: 0 }
    );
    io.observe(el);
    const onVis = () => (document.hidden ? stop() : start());
    document.addEventListener("visibilitychange", onVis);

    /* The Exposure moves the line (and covers the hero) by scrolling, so
       each change is drawn at once when the loop is not running anyway. */
    if (exposure) {
      exposure.onChange = () => {
        applyEdge();
        if (exposure.covered) stop();
        else start();
        if (map && (!running || drawnFrame === gsap.ticker.frame)) renderer.render(scene, camera);
      };
    }

    /* Chrome's bitmap premultiply truncates where the <img> unpack rounded
       (a step darker on the soft rim), so the photo is decoded straight and
       premultiplied here, texel for texel, rounding as before: the texture
       stays byte for byte the same, mipmaps and all. */
    let premultiplied: THREE.WebGLRenderTarget | null = null;
    const premultiply = (t: THREE.Texture) => {
      const { width, height } = t.image as ImageBitmap;
      const rt = (premultiplied = new THREE.WebGLRenderTarget(width, height, {
        depthBuffer: false,
        colorSpace: THREE.NoColorSpace,
        generateMipmaps: t.generateMipmaps,
        minFilter: t.minFilter,
        magFilter: t.magFilter,
        anisotropy: t.anisotropy,
      }));
      t.generateMipmaps = false; // the source is only read texel for texel
      t.minFilter = THREE.NearestFilter; // so it is complete without mipmaps
      const quad = new THREE.Mesh(
        new THREE.PlaneGeometry(2, 2),
        new THREE.ShaderMaterial({
          uniforms: { uSrc: { value: t } },
          vertexShader: "void main() { gl_Position = vec4(position.xy, 0.0, 1.0); }",
          fragmentShader:
            // integer maths: float c * a lands a step low on exact halves
            "uniform sampler2D uSrc; void main() { uvec4 c = uvec4(texelFetch(uSrc, ivec2(gl_FragCoord.xy), 0) * 255.0 + 0.5); gl_FragColor = vec4(vec3((c.rgb * c.a * 2u + 255u) / 510u), float(c.a)) / 255.0; }",
          blending: THREE.NoBlending,
          depthTest: false,
          depthWrite: false,
        })
      );
      quad.frustumCulled = false;
      renderer.setRenderTarget(rt);
      renderer.render(quad, camera);
      renderer.setRenderTarget(null);
      quad.geometry.dispose();
      quad.material.dispose();
      free(t);
      return rt.texture;
    };

    Promise.all([
      load(src, (t) => {
        t.colorSpace = THREE.NoColorSpace;
        t.premultiplyAlpha = true;
        t.generateMipmaps = true;
        t.minFilter = THREE.LinearMipmapLinearFilter;
        t.magFilter = THREE.LinearFilter;
        t.anisotropy = Math.min(8, renderer.capabilities.getMaxAnisotropy());
      }),
      load(depthSrc, (t) => {
        t.colorSpace = THREE.NoColorSpace;
        t.generateMipmaps = false;
        t.minFilter = THREE.LinearFilter;
        t.magFilter = THREE.LinearFilter;
      }),
    ]).then(
      ([photo, d]) => {
        if (!alive) return;
        const m = (map = bitmaps ? premultiply(photo) : photo);
        const img = d.image as { width: number; height: number };
        uniforms.uMap.value = m;
        uniforms.uDepth.value = d;
        uniforms.uTexel.value.set(1 / img.width, 1 / img.height);
        shadeUniforms.uMap.value = m;
        shade.visible = true;
        /* First frame uploads the textures and compiles the shaders;
           report ready once it has landed. */
        frame(performance.now());
        requestAnimationFrame(() => alive && signal());
        start();
      },
      () => toFlat()
    );

    return () => {
      alive = false;
      stop();
      if (exposure) exposure.onChange = null;
      io.disconnect();
      ro.disconnect();
      document.removeEventListener("visibilitychange", onVis);
      window.removeEventListener("pointermove", onMove);
      document.documentElement.removeEventListener("pointerleave", onLeave);
      canvas.removeEventListener("webglcontextlost", onLost);
      geo.dispose();
      mat.dispose();
      shadeGeo.dispose();
      shadeMat.dispose();
      textures.forEach(free);
      premultiplied?.dispose();
      map = null;
      renderer.dispose();
      if (canvas.parentNode === el) el.removeChild(canvas);
    };
  }, [mode, src, depthSrc, signal, exposure]);

  if (mode === "flat") return <FlatPortrait src={src} label={label} onReady={signal} exposure={exposure} />;

  return (
    <div
      ref={host}
      role={label ? "img" : undefined}
      aria-label={label}
      aria-hidden={label ? undefined : true}
      className="h-full w-full"
    />
  );
}

/* ============================================================
   FALLBACK: the cutout itself, with a CSS tilt toward the pointer and the
   same idle float, waist fade and printed shadow, framed exactly like the
   relief so the layout does not move when it is used.

   Its blueprint print is a second copy of the cutout inside a translate
   mask (the same mask the Exposure uses for its layers): a static holder
   in the blue, clipped to his silhouette, with the photo blended onto it
   by luminosity, so it reads as a blue duotone without a filter. The tilt
   holds still while the copy line crosses him, so the two prints stay in
   register with the line.
   ============================================================ */
const FADE_MASK = `linear-gradient(to top, transparent ${FADE_FROM * 100}%, #000 ${FADE_TO * 100}%)`;

/* The relief's printed shadow as a hard drop shadow. Its offset is in
   container units of the canvas box, so it scales like the relief's. */
const PRINT_CQH = ((PRINT_OFFSET / VIEW_H) * 100).toFixed(3);
const PRINT_SHADOW = `drop-shadow(${PRINT_CQH}cqh ${PRINT_CQH}cqh 0 rgb(19 26 74 / ${PRINT_ALPHA}))`;

function FlatPortrait({
  src,
  label,
  onReady,
  exposure,
}: {
  src: string;
  label?: string;
  onReady: () => void;
  exposure?: ExposureState;
}) {
  const tilt = useRef<HTMLDivElement>(null);
  const img = useRef<HTMLImageElement>(null);
  const maskOut = useRef<HTMLDivElement>(null);
  const maskIn = useRef<HTMLDivElement>(null);

  /* A cached image can finish before the handler is attached. */
  useEffect(() => {
    if (img.current?.complete) onReady();
  }, [onReady]);

  /* One effect owns both the copy line's mask and the tilt loop, because
     the Exposure has a single onChange slot and both answer to it. */
  useEffect(() => {
    const box = tilt.current;
    if (!box) return;
    const out = maskOut.current;
    const inn = maskIn.current;
    const host = box.parentElement;

    /* ---- the copy line ---------------------------------------------- */
    /* The line is given in the canvas box; the mask lives in the image's
       own box, which stands on the canvas box's bottom edge. Both heights
       are cached here and refreshed by a ResizeObserver, so the scrub's
       per-frame call only writes the two transforms and never forces a
       layout right after the Exposure's own writes. */
    let off = 0;
    let boxH = 0;
    const measure = () => {
      boxH = box.clientHeight;
      off = host ? host.clientHeight - boxH : 0;
    };
    const applyMask = () => {
      if (!exposure || !out || !inn) return;
      const y = Number.isFinite(exposure.edge) ? Math.max(0, exposure.edge - off) : boxH;
      out.style.transform = `translate3d(0, ${y}px, 0)`;
      inn.style.transform = `translate3d(0, ${-y}px, 0)`;
    };
    measure();
    applyMask();
    const ro = new ResizeObserver(() => {
      measure();
      applyMask();
    });
    ro.observe(box);
    if (host) ro.observe(host);

    /* ---- the tilt --------------------------------------------------- */
    /* It holds still while the copy line is on him, so the two prints stay
       in register, and stops outright once About has covered the hero.
       The Exposure's onChange wakes it again. */
    const held = () => !!exposure && (exposure.covered || (exposure.p > 0 && exposure.p < 1));

    let px = 0;
    let py = 0;
    let lastMove = -1e9;
    const onMove = (e: PointerEvent) => {
      if (e.pointerType === "touch") return;
      px = Math.max(-1, Math.min(1, (e.clientX / window.innerWidth) * 2 - 1));
      py = Math.max(-1, Math.min(1, (e.clientY / window.innerHeight) * 2 - 1));
      lastMove = performance.now();
    };

    let raf = 0;
    let running = false;
    let prev = performance.now();
    const t0 = prev;
    let yaw = 0;
    let pitch = 0;
    const tick = (now: number) => {
      if (!running) return;
      if (held()) {
        running = false;
        return;
      }
      raf = requestAnimationFrame(tick);
      if (document.hidden) {
        prev = now;
        return;
      }
      const dt = Math.min((now - prev) / 1000, 0.05);
      prev = now;
      const t = (now - t0) / 1000;
      const s = Math.min(1, Math.max(0, ((now - lastMove) / 1000 - 2.5) / 2.5));
      const idle = s * s * (3 - 2 * s);
      const sway = 0.45 + 0.55 * idle;
      const ty = px * (1 - idle) * YAW + Math.sin(t * 0.55) * SWAY_YAW * sway;
      const tp = py * (1 - idle) * PITCH + Math.sin(t * 0.43 + 1.3) * SWAY_PITCH * sway;
      const ease = 1 - Math.exp(-dt * 3.2);
      yaw += (ty - yaw) * ease;
      pitch += (tp - pitch) * ease;
      const lift = Math.sin(t * 1.15) * 0.3;
      box.style.transform = `translateY(${lift.toFixed(2)}%) rotateX(${(-pitch).toFixed(3)}deg) rotateY(${yaw.toFixed(3)}deg)`;
    };
    const start = () => {
      if (running || held()) return;
      running = true;
      prev = performance.now();
      raf = requestAnimationFrame(tick);
    };

    window.addEventListener("pointermove", onMove, { passive: true });
    if (exposure) {
      exposure.onChange = () => {
        applyMask();
        start();
      };
    }
    start();

    return () => {
      running = false;
      cancelAnimationFrame(raf);
      ro.disconnect();
      if (exposure) exposure.onChange = null;
      window.removeEventListener("pointermove", onMove);
      box.style.transform = "";
    };
  }, [exposure]);

  const silhouette = `url(${src})`;
  return (
    <div
      className="flex h-full w-full items-end justify-center"
      style={{ perspective: "1600px", containerType: "size" }}
    >
      <div
        ref={tilt}
        className="relative will-change-transform"
        style={{ height: `${PLANE_SHARE * 100}%`, transformOrigin: "50% 45%" }}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          ref={img}
          src={src}
          alt={label ?? ""}
          draggable={false}
          onLoad={onReady}
          onError={onReady}
          className="block h-full w-auto select-none"
          style={{ maskImage: FADE_MASK, WebkitMaskImage: FADE_MASK, filter: PRINT_SHADOW }}
        />
        {exposure && (
          <div
            ref={maskOut}
            aria-hidden="true"
            className="absolute inset-0 overflow-hidden"
            style={{ transform: "translate3d(0, 100%, 0)" }}
          >
            <div ref={maskIn} className="absolute inset-0" style={{ transform: "translate3d(0, -100%, 0)" }}>
              <div
                className="absolute inset-0"
                style={{
                  background: "var(--color-blue)",
                  maskImage: silhouette,
                  WebkitMaskImage: silhouette,
                  maskSize: "100% 100%",
                  WebkitMaskSize: "100% 100%",
                }}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={src}
                  alt=""
                  draggable={false}
                  className="block h-full w-auto select-none"
                  style={{ mixBlendMode: "luminosity", opacity: 0.85 }}
                />
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
