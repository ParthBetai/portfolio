"use client";

import { useEffect, useRef } from "react";
import { reduced } from "@/lib/motion";

/* Slow drifting dust behind the hero type.

   The hero is otherwise static once its entrance has played, and a page
   where nothing moves until you scroll reads as a screenshot. This gives
   it a constant, very low-amplitude life without competing with the
   wordmark, the particles are barely above the background value and
   never cross into the accent.

   2D canvas rather than WebGL: a few hundred additive dots do not justify
   another GL context on a page that already has the portrait and the
   pin wall. */
export default function Dust() {
  const ref = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const cv = ref.current;
    if (!cv || reduced()) return;

    const ctx = cv.getContext("2d", { alpha: true });
    if (!ctx) return;

    let raf = 0;
    let w = 0;
    let h = 0;
    const dpr = Math.min(window.devicePixelRatio, 2);

    type P = { x: number; y: number; z: number; vx: number; vy: number; r: number };
    let dots: P[] = [];

    const seed = () => {
      /* Count scales with area so a phone is not rendering a desktop's
         worth of particles. */
      const n = Math.round(Math.min(260, Math.max(70, (w * h) / 9000)));
      dots = Array.from({ length: n }, () => ({
        x: Math.random() * w,
        y: Math.random() * h,
        z: Math.random(),
        vx: (Math.random() - 0.5) * 0.12,
        vy: -0.05 - Math.random() * 0.14,
        r: 0.4 + Math.random() * 1.5,
      }));
    };

    const resize = () => {
      w = cv.clientWidth;
      h = cv.clientHeight;
      cv.width = Math.round(w * dpr);
      cv.height = Math.round(h * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      seed();
    };
    resize();
    const ro = new ResizeObserver(resize);
    ro.observe(cv);

    /* Pointer pushes the nearer particles slightly, parallax you feel
       rather than notice. */
    let mx = -9999;
    let my = -9999;
    const onMove = (e: PointerEvent) => {
      const r = cv.getBoundingClientRect();
      mx = e.clientX - r.left;
      my = e.clientY - r.top;
    };
    window.addEventListener("pointermove", onMove, { passive: true });

    let visible = true;
    const io = new IntersectionObserver(([e]) => (visible = e.isIntersecting), {
      threshold: 0,
    });
    io.observe(cv);

    const tick = () => {
      raf = requestAnimationFrame(tick);
      if (!visible) return;

      ctx.clearRect(0, 0, w, h);
      ctx.globalCompositeOperation = "lighter";

      for (const d of dots) {
        d.x += d.vx;
        d.y += d.vy;

        const dx = d.x - mx;
        const dy = d.y - my;
        const dist = Math.hypot(dx, dy);
        if (dist < 150) {
          const push = ((150 - dist) / 150) * 0.5 * (0.3 + d.z);
          d.x += (dx / (dist || 1)) * push;
          d.y += (dy / (dist || 1)) * push;
        }

        /* wrap rather than respawn, so density never pulses */
        if (d.y < -8) d.y = h + 8;
        if (d.x < -8) d.x = w + 8;
        if (d.x > w + 8) d.x = -8;

        const a = 0.05 + d.z * 0.22;
        ctx.beginPath();
        ctx.arc(d.x, d.y, d.r * (0.5 + d.z), 0, Math.PI * 2);
        ctx.fillStyle = `rgba(210,214,226,${a})`;
        ctx.fill();
      }

      ctx.globalCompositeOperation = "source-over";
    };
    tick();

    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
      io.disconnect();
      window.removeEventListener("pointermove", onMove);
    };
  }, []);

  return (
    <canvas
      ref={ref}
      aria-hidden
      className="pointer-events-none absolute inset-0 h-full w-full"
    />
  );
}
