/* Server-safe on purpose: layout.tsx is a Server Component, and a value
   imported from a "use client" module arrives there as a client reference
   rather than the string itself. */

export const MOTION_KEY = "motion";

/* Inline script body for <head>: sets data-motion before first paint so
   CSS keyframes (marquee, grain) never flash into the wrong state. It
   also removes the choice the old footer Motion button used to save:
   the button is gone, and a saved "off" would otherwise have no way back.
   On the home page it also turns off scroll restoration before the router
   can restore an old position: the intro always plays from the top.
   If the page script never runs (a failed chunk), no sheet ever gets
   data-stick: 8 s after load the flag comes off, so the no-JS layout
   shows instead of a page held hidden for an intro that never plays. */
export const motionBootScript = `try{if(location.pathname==='/')history.scrollRestoration='manual'}catch(e){}try{localStorage.removeItem('${MOTION_KEY}')}catch(e){}try{document.documentElement.dataset.motion=matchMedia('(prefers-reduced-motion: reduce)').matches?'soft':'full'}catch(e){document.documentElement.dataset.motion='full'}addEventListener('load',function(){setTimeout(function(){if(!document.querySelector('.sheet[data-stick]'))delete document.documentElement.dataset.motion},8e3)});`;
