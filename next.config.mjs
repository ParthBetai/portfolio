const isDev = process.env.NODE_ENV !== "production";

/* ============================================================
   CONTENT SECURITY POLICY
   Built from a list so each directive reads on its own line, and so a
   dev-only or prod-only source is one `&&` rather than a second copy of
   the whole string.

   What the page actually loads, and therefore all it is allowed to:
     · scripts, styles, fonts: this origin only. The three typefaces are
       self-hosted through next/font/local, and three.js, GSAP and Lenis
       are bundled into our own chunks, and the resume PDF is a file in
       /public.
     · images: this origin (portraits in /public), data: (the grain
       texture is an inline SVG data URI), blob: (only a script already
       running on this page can mint a blob: URL, so it opens nothing to
       the outside). The project photos are Parth's own files in
       /public/work, so no image host is allowed at all.
     · connections: this origin only. The one backend call is the contact
       chat posting to /api/contact on this same origin; that route talks
       to the email provider server-side, so the browser never does. No
       analytics and no third-party API.

   Why script-src still carries 'unsafe-inline':
     Every page here is statically prerendered by the App Router, and a
     prerendered page ships inline scripts of its own (the RSC payload
     and hydration bootstrap, self.__next_f.push(...)), plus the site's
     motion boot script in app/layout.tsx that sets data-motion before
     first paint. Nonces would be the stricter answer, but a nonce must
     change on every response, which forces every page to render
     dynamically on each request. Hashes do not help either: the
     hydration scripts differ per page and per build, and once a hash is
     present browsers ignore 'unsafe-inline' entirely.

   Why that is acceptable on this site:
     'unsafe-inline' matters when an attacker can get markup into the
     page. Here nothing can. There is no user-generated content, no
     database, no query-string or hash value rendered into HTML, and the
     only dangerouslySetInnerHTML is a constant string written at build
     time. No third-party script is loaded. The policy still does real
     work: it stops the page being framed, stops it loading or sending
     data anywhere but its own origin, and blocks
     plugins, <base> hijacking and form posts to foreign origins.

   'unsafe-eval' and ws:/wss: are development-only. The dev server's
   webpack runtime and React Refresh evaluate modules with eval, and
   hot reload talks over a websocket. Production needs neither: three.js,
   GSAP and Lenis contain no eval or new Function in the code we import.
   ============================================================ */
const csp = [
  ["default-src", "'self'"],
  ["script-src", "'self'", "'unsafe-inline'", isDev && "'unsafe-eval'"],
  ["style-src", "'self'", "'unsafe-inline'"],
  ["img-src", "'self'", "data:", "blob:"],
  ["font-src", "'self'"],
  ["connect-src", "'self'", isDev && "ws:", isDev && "wss:"],
  ["worker-src", "'self'", "blob:"],
  ["media-src", "'self'"],
  ["object-src", "'none'"],
  ["base-uri", "'self'"],
  ["form-action", "'self'", "mailto:"],
  ["frame-ancestors", "'none'"],
  ["frame-src", "'none'"],
  ["manifest-src", "'self'"],
  /* Production only: in dev the server is plain http on 127.0.0.1, and
     there is nothing to upgrade to. A local `npm run start` is also plain
     http but does send this; Chrome and Firefox leave loopback alone,
     while Safari may try https://127.0.0.1 and fail to load assets, so
     check a local production run in Chrome. */
  !isDev && ["upgrade-insecure-requests"],
]
  .filter(Boolean)
  .map((directive) => directive.filter(Boolean).join(" "))
  .join("; ");

const securityHeaders = [
  { key: "Content-Security-Policy", value: csp },
  /* Two years, the value hstspreload.org recommends. Browsers ignore
     this header over plain http, so it only takes effect once the site is
     served over TLS, and it is left out of dev entirely so a local run
     never pins localhost to https. */
  ...(isDev
    ? []
    : [{ key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains; preload" }]),
  /* Stops a browser second-guessing a file's type, so a text response
     can never be run as a script. */
  { key: "X-Content-Type-Options", value: "nosniff" },
  /* frame-ancestors above is the modern form; this covers browsers that
     predate it. Both say the same thing: nobody may frame this site, so
     it cannot be dressed up for clickjacking. */
  { key: "X-Frame-Options", value: "DENY" },
  /* Other sites learn which site sent a visitor, never which page. */
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  /* A portfolio needs none of these. Switching them off means even a
     compromised script could not ask for the camera or location. */
  {
    key: "Permissions-Policy",
    value:
      "camera=(), microphone=(), geolocation=(), payment=(), usb=(), browsing-topics=()",
  },
  /* The social links open in new tabs; this keeps those tabs from
     holding a handle back to this window, on top of rel="noopener". */
  { key: "Cross-Origin-Opener-Policy", value: "same-origin" },
  /* Our fonts, chunks and images may be used by this site, not
     hot-linked into someone else's. */
  { key: "Cross-Origin-Resource-Policy", value: "same-site" },
];

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  /* No "X-Powered-By: Next.js": there is no reason to tell a scanner
     which framework, and so which advisories, to try. */
  poweredByHeader: false,

  /* Explicit, though it is also the default: shipping source maps would
     publish the original source, comments and all. */
  productionBrowserSourceMaps: false,

  /* The site uses plain <img> and never next/image, so the on-demand
     image optimiser at /_next/image is dead weight. Turning it off makes
     that endpoint answer 404, which removes the server's only image
     decoding path (sharp and libvips) from reach. Several of Next's
     most serious advisories have lived in exactly that endpoint. */
  images: { unoptimized: true },

  async headers() {
    return [{ source: "/:path*", headers: securityHeaders }];
  },
};

export default nextConfig;
