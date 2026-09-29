import type { Metadata, Viewport } from "next";
import localFont from "next/font/local";
import { identity, meta, socials } from "@/lib/content";
import { SITE_URL, xHandle } from "@/lib/site";
import Cursor from "@/components/Cursor";
import Grain from "@/components/Grain";
import RouteProgress from "@/components/RouteProgress";
import { motionBootScript } from "@/lib/motionBoot";
import "./globals.css";

/* Fonts are self-hosted (files in app/fonts, taken from the Fontsource
   packages). next/font/google fetches from Google on every build, and that
   fetch failed intermittently, a build that can break on someone else's
   network is not a build you can deploy on. */

/* Archivo's width axis carries the display type (wdth 125, the hero at
   104), so this is the variable file with both weight and width. */
const archivo = localFont({
  src: "./fonts/archivo-latin-standard-normal.woff2",
  weight: "100 900",
  style: "normal",
  display: "swap",
  variable: "--f-archivo",
  declarations: [{ prop: "font-stretch", value: "62% 125%" }],
});

const instrument = localFont({
  src: "./fonts/instrument-serif-latin-400-italic.woff2",
  weight: "400",
  style: "italic",
  display: "swap",
  variable: "--f-instrument",
});

const jetbrains = localFont({
  src: [
    { path: "./fonts/jetbrains-mono-latin-400-normal.woff2", weight: "400", style: "normal" },
    { path: "./fonts/jetbrains-mono-latin-500-normal.woff2", weight: "500", style: "normal" },
  ],
  display: "swap",
  variable: "--f-jetbrains",
});

/* The preview images themselves are files: app/opengraph-image.jpg and
   app/twitter-image.jpg (made by scripts/make-share-image.mjs). Next adds
   their tags, sizes and alt text on its own, as absolute URLs built from
   metadataBase. No og:url or canonical here: this layout wraps every page,
   and each page would inherit the home page's address. */
export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: { default: meta.title, template: "%s · Parth Betai" },
  description: meta.description,
  applicationName: identity.fullName,
  authors: [{ name: identity.fullName }],
  creator: identity.fullName,
  /* Stops iOS turning a date or a number in the copy into a phone link. */
  formatDetection: { telephone: false, address: false, email: false },
  openGraph: {
    type: "website",
    siteName: identity.fullName,
    locale: "en_IN",
    title: meta.title,
    description: meta.description,
  },
  twitter: {
    card: "summary_large_image",
    title: meta.title,
    description: meta.description,
    ...(xHandle ? { creator: `@${xHandle}` } : {}),
  },
};

/* Structured data for search engines: who the site is about and where
   else he is. Built from content.ts at build time, never from anything a
   visitor sends, and "<" is escaped so no string in it can close the
   script tag early. */
const person = {
  "@context": "https://schema.org",
  "@type": "Person",
  name: identity.fullName,
  url: SITE_URL,
  image: `${SITE_URL}/portrait.webp`,
  jobTitle: identity.role,
  email: `mailto:${identity.email}`,
  address: { "@type": "PostalAddress", addressLocality: identity.locations.primary.split(",")[0], addressCountry: "IN" },
  sameAs: socials.map((s) => s.href),
  knowsAbout: ["Android development", "React Native", "Bluetooth Low Energy", "Robotics", "Embedded systems", "Web development"],
};
const personJson = JSON.stringify(person).replace(/</g, "\\u003c");

export const viewport: Viewport = {
  themeColor: "#050505",
  colorScheme: "dark",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html
      lang="en"
      className={`${archivo.variable} ${instrument.variable} ${jetbrains.variable}`}
      /* data-motion is written by the boot script before hydration */
      suppressHydrationWarning
    >
      <head>
        {/* Sets the motion level before first paint, so CSS loops and the
            loader never flash into the wrong state. */}
        <script dangerouslySetInnerHTML={{ __html: motionBootScript }} />
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: personJson }} />
      </head>
      <body>
        <a
          href="#main"
          className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[90] focus:rounded-full focus:bg-acid focus:px-5 focus:py-3 focus:text-sm focus:text-void"
        >
          Skip to content
        </a>
        {/* Site-wide, so the policy pages get the same cursor and texture. */}
        <Cursor />
        <Grain />
        <RouteProgress />
        {children}
      </body>
    </html>
  );
}
