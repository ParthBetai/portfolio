"use client";

import { useEffect, useState } from "react";

/* The page is statically prerendered, so `new Date().getFullYear()` in a
   component body is frozen at BUILD time. On 1 January the server HTML and
   the client's first render disagree and React logs a hydration mismatch , 
   and the footer shows last year until the site is rebuilt.

   Reading the clock after mount keeps the markup deterministic and the
   year correct. Renders an empty string for one frame, which is invisible
   next to a copyright line. */
export function useYear(): string {
  const [year, setYear] = useState("");
  useEffect(() => setYear(String(new Date().getFullYear())), []);
  return year;
}
