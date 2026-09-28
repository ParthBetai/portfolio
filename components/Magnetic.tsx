"use client";

import { useEffect, useRef } from "react";
import { gsap, reduced } from "@/lib/motion";

/* Wraps a control so it leans toward the cursor while the pointer is near,
   and springs back when it leaves. The label moves further than the shell,
   which is what makes it read as weight rather than a slide.

   Pointer-only: on touch there is no hover state to anticipate, and the
   offset would just make the target harder to hit. */
export default function Magnetic({
  children,
  strength = 0.35,
  className = "",
}: {
  children: React.ReactNode;
  strength?: number;
  className?: string;
}) {
  const shell = useRef<HTMLSpanElement>(null);
  const inner = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    const el = shell.current;
    const label = inner.current;
    if (!el || !label) return;
    if (reduced() || !window.matchMedia("(hover: hover) and (pointer: fine)").matches) {
      return;
    }

    const xTo = gsap.quickTo(el, "x", { duration: 0.5, ease: "power3.out" });
    const yTo = gsap.quickTo(el, "y", { duration: 0.5, ease: "power3.out" });
    const lxTo = gsap.quickTo(label, "x", { duration: 0.65, ease: "power3.out" });
    const lyTo = gsap.quickTo(label, "y", { duration: 0.65, ease: "power3.out" });

    const onMove = (e: PointerEvent) => {
      const r = el.getBoundingClientRect();
      const dx = e.clientX - (r.left + r.width / 2);
      const dy = e.clientY - (r.top + r.height / 2);
      xTo(dx * strength);
      yTo(dy * strength);
      lxTo(dx * strength * 0.45);
      lyTo(dy * strength * 0.45);
    };

    const onLeave = () => {
      xTo(0);
      yTo(0);
      lxTo(0);
      lyTo(0);
    };

    el.addEventListener("pointermove", onMove);
    el.addEventListener("pointerleave", onLeave);
    return () => {
      el.removeEventListener("pointermove", onMove);
      el.removeEventListener("pointerleave", onLeave);
    };
  }, [strength]);

  return (
    <span ref={shell} className={`inline-block will-change-transform ${className}`}>
      <span ref={inner} className="inline-block will-change-transform">
        {children}
      </span>
    </span>
  );
}
