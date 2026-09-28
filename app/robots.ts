import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/site";

/* Absolute URLs come from NEXT_PUBLIC_SITE_URL, see lib/site.ts. */
const SITE = SITE_URL;

/* Every page is public and meant to be found. The one thing kept out is
   the contact endpoint, which is not a page. Hiding a path here would not
   protect it anyway: robots.txt is a public list that polite crawlers
   follow and everyone else reads. The endpoint protects itself. */
export default function robots(): MetadataRoute.Robots {
  return {
    rules: { userAgent: "*", allow: "/", disallow: "/api/" },
    sitemap: `${SITE}/sitemap.xml`,
  };
}
