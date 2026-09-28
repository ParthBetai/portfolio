import type { Metadata } from "next";
import { identity, socials } from "@/lib/content";

/* The site's public address, used for absolute links: the sitemap,
   robots.txt, canonical links, the link preview tags and the structured
   data.

   Set NEXT_PUBLIC_SITE_URL to the real domain (for example in the Vercel
   project settings). Without it, a Vercel build uses the project's own
   production address, which Vercel provides to every build, and a local
   build uses localhost, so nothing ever points at somebody else's site.
   `||` rather than `??` so an empty variable falls back too; the
   trailing slash is trimmed so paths never double up. */
const vercel = process.env.VERCEL_PROJECT_PRODUCTION_URL;
export const SITE_URL = (
  process.env.NEXT_PUBLIC_SITE_URL ||
  (vercel ? `https://${vercel}` : "") ||
  "http://localhost:3000"
).replace(/\/+$/, "");

/* The X handle, taken from the profile link, for link preview credits. */
export const xHandle = socials.find((s) => s.label === "X")?.href.split("/").filter(Boolean).pop();

/* Metadata for an info page. A page that sets its own openGraph or
   twitter block replaces the layout's whole block rather than merging
   into it, and that includes the preview image Next would otherwise add
   from app/opengraph-image.jpg. So each page gets complete ones here: its
   own title in the link preview, its own address, and the shared image. */
export function pageMeta(title: string, description: string, path: string): Metadata {
  const full = `${title} · ${identity.fullName}`;
  const image = { url: "/opengraph-image.jpg", width: 1200, height: 630, alt: `${identity.fullName}, ${identity.role}` };
  return {
    title,
    description,
    alternates: { canonical: path },
    openGraph: { type: "website", siteName: identity.fullName, locale: "en_IN", title: full, description, url: path, images: [image] },
    twitter: { card: "summary_large_image", title: full, description, images: [{ ...image, url: "/twitter-image.jpg" }], ...(xHandle ? { creator: `@${xHandle}` } : {}) },
  };
}
