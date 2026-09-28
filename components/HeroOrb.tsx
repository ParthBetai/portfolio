"use client";

import { useEffect, useRef } from "react";
import * as THREE from "three";
import { RoomEnvironment } from "three/addons/environments/RoomEnvironment.js";
import { reduced } from "@/lib/motion";

/* The hero's centerpiece when there is no portrait: a liquid-chrome orb.

   It is made of the same material as the wordmark, a mirror metal lit by
   a studio environment, so the type and the object read as one set. The
   surface is displaced by two octaves of simplex noise in the vertex
   shader; normals are rebuilt from neighbouring displaced samples, so the
   reflections flow across the ripples instead of sitting on a smooth ball.

   A copper rim light behind-left puts the only colour on it: a warm edge
   in the accent's hue, kept low so it reads as light on metal, not a glow. */

/* Ashima Arts 3D simplex noise (MIT). */
const NOISE = /* glsl */ `
vec3 mod289(vec3 x){return x-floor(x*(1.0/289.0))*289.0;}
vec4 mod289(vec4 x){return x-floor(x*(1.0/289.0))*289.0;}
vec4 permute(vec4 x){return mod289(((x*34.0)+1.0)*x);}
vec4 taylorInvSqrt(vec4 r){return 1.79284291400159-0.85373472095314*r;}
float snoise(vec3 v){
  const vec2 C=vec2(1.0/6.0,1.0/3.0);
  const vec4 D=vec4(0.0,0.5,1.0,2.0);
  vec3 i=floor(v+dot(v,C.yyy));
  vec3 x0=v-i+dot(i,C.xxx);
  vec3 g=step(x0.yzx,x0.xyz);
  vec3 l=1.0-g;
  vec3 i1=min(g.xyz,l.zxy);
  vec3 i2=max(g.xyz,l.zxy);
  vec3 x1=x0-i1+C.xxx;
  vec3 x2=x0-i2+C.yyy;
  vec3 x3=x0-D.yyy;
  i=mod289(i);
  vec4 p=permute(permute(permute(i.z+vec4(0.0,i1.z,i2.z,1.0))+i.y+vec4(0.0,i1.y,i2.y,1.0))+i.x+vec4(0.0,i1.x,i2.x,1.0));
  float n_=0.142857142857;
  vec3 ns=n_*D.wyz-D.xzx;
  vec4 j=p-49.0*floor(p*ns.z*ns.z);
  vec4 x_=floor(j*ns.z);
  vec4 y_=floor(j-7.0*x_);
  vec4 x=x_*ns.x+ns.yyyy;
  vec4 y=y_*ns.x+ns.yyyy;
  vec4 h=1.0-abs(x)-abs(y);
  vec4 b0=vec4(x.xy,y.xy);
  vec4 b1=vec4(x.zw,y.zw);
  vec4 s0=floor(b0)*2.0+1.0;
  vec4 s1=floor(b1)*2.0+1.0;
  vec4 sh=-step(h,vec4(0.0));
  vec4 a0=b0.xzyw+s0.xzyw*sh.xxyy;
  vec4 a1=b1.xzyw+s1.xzyw*sh.zzww;
  vec3 p0=vec3(a0.xy,h.x);
  vec3 p1=vec3(a0.zw,h.y);
  vec3 p2=vec3(a1.xy,h.z);
  vec3 p3=vec3(a1.zw,h.w);
  vec4 norm=taylorInvSqrt(vec4(dot(p0,p0),dot(p1,p1),dot(p2,p2),dot(p3,p3)));
  p0*=norm.x;p1*=norm.y;p2*=norm.z;p3*=norm.w;
  vec4 m=max(0.6-vec4(dot(x0,x0),dot(x1,x1),dot(x2,x2),dot(x3,x3)),0.0);
  m=m*m;
  return 42.0*dot(m*m,vec4(dot(p0,x0),dot(p1,x1),dot(p2,x2),dot(p3,x3)));
}`;

export default function HeroOrb({ onReady }: { onReady?: () => void }) {
  const host = useRef<HTMLDivElement>(null);
  /* Held in a ref so a parent re-render can't restart the scene. */
  const readyCb = useRef(onReady);
  readyCb.current = onReady;

  useEffect(() => {
    const el = host.current;
    if (!el) return;

    let signalled = false;
    const signal = () => {
      if (signalled) return;
      signalled = true;
      readyCb.current?.();
    };

    let renderer: THREE.WebGLRenderer;
    try {
      renderer = new THREE.WebGLRenderer({
        antialias: true,
        alpha: true,
        powerPreference: "high-performance",
      });
    } catch {
      /* No WebGL: the loader must still finish. */
      signal();
      return;
    }

    /* Software WebGL (VMs, remote desktops, blocklisted GPUs) runs the
       vertex shader on the CPU. Detect it and build a lighter orb so the
       page stays smooth there: 17k vertices instead of 100k. */
    const gl = renderer.getContext();
    const dbg = gl.getExtension("WEBGL_debug_renderer_info");
    const gpu = String(dbg ? gl.getParameter(dbg.UNMASKED_RENDERER_WEBGL) : gl.getParameter(gl.RENDERER));
    const softwareGL = /swiftshader|llvmpipe|basic render|software|warp/i.test(gpu);

    renderer.setPixelRatio(softwareGL ? 1 : Math.min(window.devicePixelRatio, 2));
    renderer.setClearColor(0x000000, 0);
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.05;
    el.appendChild(renderer.domElement);
    Object.assign(renderer.domElement.style, { width: "100%", height: "100%", display: "block" });

    const scene = new THREE.Scene();

    /* Studio reflections. Without an environment a metal has nothing to
       mirror and renders black. */
    const pmrem = new THREE.PMREMGenerator(renderer);
    const room = new RoomEnvironment();
    const envRT = pmrem.fromScene(room, 0.04);
    scene.environment = envRT.texture;

    const camera = new THREE.PerspectiveCamera(30, 1, 0.1, 50);
    camera.position.set(0, 0, 5.4);

    const uniforms = {
      uTime: { value: 0 },
      uAmp: { value: 0.24 },
      uFreq: { value: 0.82 },
    };

    const geo = new THREE.IcosahedronGeometry(1, softwareGL ? 16 : 40);
    const mat = new THREE.MeshPhysicalMaterial({
      color: 0xffffff,
      metalness: 1,
      roughness: 0.06,
      clearcoat: 1,
      clearcoatRoughness: 0.08,
      envMapIntensity: 1.4,
    });

    mat.onBeforeCompile = (shader) => {
      Object.assign(shader.uniforms, uniforms);
      shader.vertexShader = shader.vertexShader
        .replace(
          "#include <common>",
          /* glsl */ `#include <common>
uniform float uTime;
uniform float uAmp;
uniform float uFreq;
${NOISE}
float disp(vec3 p){
  float a = snoise(p * uFreq + vec3(uTime * 0.17, uTime * 0.11, -uTime * 0.09));
  float b = snoise(p * uFreq * 1.9 - vec3(uTime * 0.16));
  return a * uAmp + b * uAmp * 0.07;
}
vec3 orthogonalTo(vec3 v){
  return normalize(abs(v.x) > abs(v.z) ? vec3(-v.y, v.x, 0.0) : vec3(0.0, -v.z, v.y));
}`
        )
        /* Rebuild the normal from two neighbouring displaced points so the
           lighting follows the ripples. */
        .replace(
          "#include <beginnormal_vertex>",
          /* glsl */ `
vec3 nBase = normalize(normal);
vec3 tAxis = orthogonalTo(nBase);
vec3 bAxis = normalize(cross(nBase, tAxis));
float eps = 0.012;
vec3 pC = position + nBase * disp(position);
vec3 pT = position + tAxis * eps; pT += normalize(pT) * disp(pT);
vec3 pB = position + bAxis * eps; pB += normalize(pB) * disp(pB);
vec3 objectNormal = normalize(cross(pT - pC, pB - pC));`
        )
        .replace("#include <begin_vertex>", "vec3 transformed = pC;");
    };

    const orb = new THREE.Mesh(geo, mat);
    scene.add(orb);

    const key = new THREE.DirectionalLight(0xffffff, 1.3);
    key.position.set(3, 3, 4);
    const rim = new THREE.DirectionalLight(0xe0895a, 2.2);
    rim.position.set(-3.5, 1.2, -2.6);
    const under = new THREE.DirectionalLight(0x8fa3ff, 0.6);
    under.position.set(0, -4, 1);
    scene.add(key, rim, under);

    /* ---- interaction ---------------------------------------------- */
    let tx = 0;
    let ty = 0;
    let rx = 0;
    let ry = 0;
    let energy = 0;
    const onMove = (e: PointerEvent) => {
      tx = (e.clientY / window.innerHeight - 0.5) * 0.5;
      ty = (e.clientX / window.innerWidth - 0.5) * 0.8;
      energy = Math.min(1, energy + 0.08);
    };
    window.addEventListener("pointermove", onMove, { passive: true });

    /* ---- sizing ----------------------------------------------------- */
    const resize = () => {
      const w = el.clientWidth || 1;
      const h = el.clientHeight || 1;
      renderer.setSize(w, h, false);
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
    };
    resize();
    const ro = new ResizeObserver(resize);
    ro.observe(el);

    let visible = true;
    const io = new IntersectionObserver(([e]) => (visible = e.isIntersecting), { threshold: 0 });
    io.observe(el);

    const still = reduced();

    /* First frame compiles the shader; report ready after it lands. */
    renderer.render(scene, camera);
    requestAnimationFrame(signal);

    let raf = 0;
    let prev = performance.now();

    const tick = () => {
      raf = requestAnimationFrame(tick);
      const now = performance.now();
      const dt = Math.min((now - prev) / 1000, 0.05);
      prev = now;
      if (!visible) return;

      uniforms.uTime.value += dt;
      energy *= 0.96;
      uniforms.uAmp.value += (0.24 + energy * 0.08 - uniforms.uAmp.value) * 0.05;

      rx += (tx - rx) * 0.045;
      ry += (ty - ry) * 0.045;
      orb.rotation.x = rx;
      orb.rotation.y += dt * 0.12;
      orb.rotation.z = ry * 0.25;
      orb.position.x = ry * 0.12;

      renderer.render(scene, camera);
    };

    if (!still) tick();

    return () => {
      cancelAnimationFrame(raf);
      io.disconnect();
      ro.disconnect();
      window.removeEventListener("pointermove", onMove);
      scene.remove(orb, key, rim, under);
      geo.dispose();
      mat.dispose();
      envRT.dispose();
      pmrem.dispose();
      room.dispose();
      renderer.dispose();
      if (renderer.domElement.parentNode === el) el.removeChild(renderer.domElement);
    };
  }, []);

  return <div ref={host} aria-hidden className="h-full w-full" />;
}
