import type { Metadata } from "next";
import { pageMeta } from "@/lib/site";
import LegalPage, { A, H2, LI, P, Strong, UL } from "@/components/LegalPage";
import { identity, legal } from "@/lib/content";

export const metadata: Metadata = pageMeta(
  "Cookies",
  "This site doesn't use cookies, and it doesn't store anything else in your browser either.",
  "/cookies"
);

/* True as long as nothing on the site calls document.cookie, writes to
   storage, or embeds a third party widget. The only storage call left is
   the boot script in lib/motionBoot.ts removing the old "motion" key. */
export default function CookiesPage() {
  return (
    <LegalPage eyebrow="Legal" title="Cookies" updated={legal.updated} path="/cookies">
      <P>
        <Strong>This site doesn&apos;t use cookies.</Strong> Not for analytics, not for ads, not for
        anything. That&apos;s also why you didn&apos;t have to click through a cookie banner to get here.
      </P>

      <H2>Nothing else either</H2>
      <P>
        The site doesn&apos;t use local storage, session storage or any other way of keeping data in
        your browser. An older version had a Motion button that could save one setting (the key{" "}
        <Strong>motion</Strong> with the value <Strong>off</Strong>) in local storage. That button is
        gone, and if your browser still holds the old setting, the site deletes it on your next visit.
      </P>

      <H2>Third party cookies</H2>
      <P>
        Nothing on this site is embedded from somewhere else: no videos, maps, social media widgets or
        ad scripts, and every image and font is served from this site itself. So there are no third
        party cookies at all.
      </P>

      <H2>Sites you visit from here</H2>
      <P>
        If you follow a link to LinkedIn, GitHub, Instagram or X, those sites may set
        their own cookies under their own policies. That happens on their side, not this one.
      </P>

      <H2>Questions</H2>
      <P>
        Email me at <A href={`mailto:${identity.email}`}>{identity.email}</A>. The{" "}
        <A href="/privacy">privacy policy</A> covers everything else about your data.
      </P>
    </LegalPage>
  );
}
