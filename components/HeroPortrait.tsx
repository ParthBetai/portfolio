"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import * as THREE from "three";
import { reduced } from "@/lib/motion";
import { PORTRAIT_SRC } from "./Portrait";

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
   warm light on the right (the photo's own orange rim) pick it up, the
   ones turning away from the cool left light lose some.

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
const FADE_FROM = 0.02;
const FADE_TO = 0.3;

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

  gl_FragColor = vec4(toSrgb(c) * a, a);
}`;

/* A soft occlusion on the backdrop behind him: the cutout's alpha from a
   small mip, so it is already blurred. */
const SHADE_FRAG = /* glsl */ `
uniform sampler2D uMap;
uniform float uStrength;
uniform vec2 uFade;
varying vec2 vUv;
void main() {
  float a = textureLod(uMap, vUv, 5.0).a;
  a *= smoothstep(uFade.x, uFade.y + 0.2, vUv.y) * uStrength;
  gl_FragColor = vec4(0.0, 0.0, 0.0, a);
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
}: {
  src?: string;
  depthSrc?: string;
  label?: string;
  onReady?: () => void;
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
    const loader = new THREE.TextureLoader();
    const textures: THREE.Texture[] = [];
    let map: THREE.Texture | null = null;

    /* A texture that arrives after unmount is disposed on arrival. */
    const load = (url: string, setup: (t: THREE.Texture) => void) =>
      new Promise<THREE.Texture>((resolve, reject) => {
        loader.load(
          url,
          (t) => {
            if (!alive) {
              t.dispose();
              return reject(new Error("unmounted"));
            }
            setup(t);
            textures.push(t);
            resolve(t);
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
      /* Linear-light gains: the orange and the blue of the photo's rims. */
      uWarm: { value: new THREE.Vector3(1.0, 0.62, 0.34).multiplyScalar(1.15) },
      uCool: { value: new THREE.Vector3(0.36, 0.56, 1.0).multiplyScalar(1.0) },
      uFade: { value: new THREE.Vector2(FADE_FROM, FADE_TO) },
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

    /* The occlusion sits on a plane behind him that does not turn, scaled
       so it lines up at rest; the parallax against it is part of the 3D. */
    const SHADE_Z = -0.22;
    const shadeScale = (CAM_Z - SHADE_Z) / CAM_Z;
    const shadeGeo = new THREE.PlaneGeometry(ASPECT, 1, 1, 1);
    shadeGeo.translate(0, 0.5, 0);
    const shadeUniforms = {
      uMap: { value: null as THREE.Texture | null },
      uStrength: { value: 0.32 },
      uFade: { value: new THREE.Vector2(FADE_FROM, FADE_TO) },
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
       photo (a touch larger, and a touch lower, as light from above would). */
    const s = shadeScale * 1.04;
    shade.scale.setScalar(s);
    shade.position.set(0, (VIEW_H / 2) * (1 - s) - 0.012, SHADE_Z);
    shade.renderOrder = 0;
    shade.visible = false;
    scene.add(shade);

    /* ---- sizing ----------------------------------------------------- */
    const resize = () => {
      const w = el.clientWidth || 1;
      const h = el.clientHeight || 1;
      renderer.setSize(w, h, false);
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
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
    const still = reduced();
    let raf = 0;
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

    const tick = (now: number) => {
      if (!running) return;
      raf = requestAnimationFrame(tick);
      frame(now);
    };
    const start = () => {
      if (running || still || !map || !visible || document.hidden) return;
      running = true;
      prev = performance.now();
      raf = requestAnimationFrame(tick);
    };
    const stop = () => {
      running = false;
      cancelAnimationFrame(raf);
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
      ([m, d]) => {
        if (!alive) return;
        map = m;
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
      textures.forEach((t) => t.dispose());
      map = null;
      renderer.dispose();
      if (canvas.parentNode === el) el.removeChild(canvas);
    };
  }, [mode, src, depthSrc, signal]);

  if (mode === "flat") return <FlatPortrait src={src} label={label} onReady={signal} />;

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
   same idle float and waist fade, framed exactly like the relief so the
   layout does not move when it is used.
   ============================================================ */
const FADE_MASK =
  "linear-gradient(to top, transparent 2%, rgba(0,0,0,0.16) 9%, rgba(0,0,0,0.5) 16%, rgba(0,0,0,0.84) 23%, #000 30%)";

function FlatPortrait({ src, label, onReady }: { src: string; label?: string; onReady: () => void }) {
  const tilt = useRef<HTMLDivElement>(null);
  const img = useRef<HTMLImageElement>(null);

  /* A cached image can finish before the handler is attached. */
  useEffect(() => {
    if (img.current?.complete) onReady();
  }, [onReady]);

  useEffect(() => {
    const el = tilt.current;
    if (!el || reduced()) return;

    let px = 0;
    let py = 0;
    let lastMove = -1e9;
    const onMove = (e: PointerEvent) => {
      if (e.pointerType === "touch") return;
      px = Math.max(-1, Math.min(1, (e.clientX / window.innerWidth) * 2 - 1));
      py = Math.max(-1, Math.min(1, (e.clientY / window.innerHeight) * 2 - 1));
      lastMove = performance.now();
    };
    window.addEventListener("pointermove", onMove, { passive: true });

    let raf = 0;
    let prev = performance.now();
    const t0 = prev;
    let yaw = 0;
    let pitch = 0;
    const tick = (now: number) => {
      raf = requestAnimationFrame(tick);
      if (document.hidden) return;
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
      el.style.transform = `translateY(${lift.toFixed(2)}%) rotateX(${(-pitch).toFixed(3)}deg) rotateY(${yaw.toFixed(3)}deg)`;
    };
    raf = requestAnimationFrame(tick);

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("pointermove", onMove);
      el.style.transform = "";
    };
  }, []);

  return (
    <div className="flex h-full w-full items-end justify-center" style={{ perspective: "1600px" }}>
      <div
        ref={tilt}
        className="will-change-transform"
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
          style={{ maskImage: FADE_MASK, WebkitMaskImage: FADE_MASK }}
        />
      </div>
    </div>
  );
}
