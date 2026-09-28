import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/site";
import { legal } from "@/lib/content";

/* Absolute URLs come from NEXT_PUBLIC_SITE_URL, see lib/site.ts. */
const SITE = SITE_URL;

export default function sitemap(): MetadataRoute.Sitemap {
  /* The policy pages change when legal.updated does, so that is their
     real modification date. It is written for people ("23 September
     2026"); this only ever runs in Node at build time, whose parser reads
     that form, and a date it can't read is left out rather than sent as
     "Invalid Date". The home page changes too often to track by hand, so
     it gets no date rather than a wrong one. */
  const parsed = new Date(`${legal.updated} 00:00 UTC`);
  const updated = Number.isNaN(parsed.getTime()) ? undefined : parsed;

  const pages = ["/privacy", "/terms", "/cookies", "/accessibility", "/credits"];

  return [
    { url: `${SITE}/`, changeFrequency: "monthly", priority: 1 },
    ...pages.map((path) => ({
      url: `${SITE}${path}`,
      lastModified: updated,
      changeFrequency: "yearly" as const,
      priority: 0.3,
    })),
  ];
}
