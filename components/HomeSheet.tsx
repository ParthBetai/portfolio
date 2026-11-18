"use client";

import Sheet from "./Sheet";
import Hero from "./Hero";
import { sheets } from "@/lib/content";

/* ============================================================
   SHEET 01: HOME
   The first sheet of the drawing set: cream, its index tab inside
   under the status strip (there is no sheet above it to ride on), the
   hero, which is its own loader (Hero.tsx). `onDone` fires when the
   loader hands off, which unlocks the page (app/page.tsx).
   ============================================================ */
export default function HomeSheet({ onDone }: { onDone: () => void }) {
  const s = sheets[0];
  return (
    <Sheet id={s.id} n={s.n} label={s.label} ground="cream" tab="inner" className="hero" labelledBy="h-home">
      <Hero onDone={onDone} />
    </Sheet>
  );
}
