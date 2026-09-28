/* Server-safe on purpose: layout.tsx is a Server Component, and a value
   imported from a "use client" module arrives there as a client reference
   rather than the string itself. */

export const MOTION_KEY = "motion";

/* Inline script body for <head>: sets data-motion before first paint so
   CSS keyframes (marquee, grain) never flash into the wrong state. It
   also removes the choice the old footer Motion button used to save:
   the button is gone, and a saved "off" would otherwise have no way back. */
export const motionBootScript = `try{localStorage.removeItem('${MOTION_KEY}')}catch(e){}try{document.documentElement.dataset.motion=matchMedia('(prefers-reduced-motion: reduce)').matches?'soft':'full'}catch(e){document.documentElement.dataset.motion='full'}`;
