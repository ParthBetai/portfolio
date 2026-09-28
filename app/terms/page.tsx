import type { Metadata } from "next";
import { pageMeta } from "@/lib/site";
import LegalPage, { A, H2, LI, P, UL } from "@/components/LegalPage";
import { identity, legal } from "@/lib/content";

export const metadata: Metadata = pageMeta(
  "Terms of use",
  "The ground rules for using this site, in plain language.",
  "/terms"
);

export default function TermsPage() {
  const mail = `mailto:${identity.email}`;

  return (
    <LegalPage eyebrow="Legal" title="Terms of use" updated={legal.updated} path="/terms">
      <P>
        These are the ground rules for using this site. They&apos;re short, because it&apos;s a
        portfolio and there isn&apos;t much to agree to. By using the site you accept them.
      </P>

      <H2>Who runs this site</H2>
      <P>
        This site is run by {legal.owner}, a student and developer based in Jaipur, India. When these
        terms say &ldquo;I&rdquo; or &ldquo;me&rdquo;, that&apos;s who they mean. You can reach me at{" "}
        <A href={mail}>{identity.email}</A>.
      </P>

      <H2>Using the site fairly</H2>
      <P>You&apos;re welcome to browse, read, share links and get in touch. Please don&apos;t:</P>
      <UL>
        <LI>try to break, overload or get into parts of the site or its hosting that aren&apos;t public,</LI>
        <LI>scrape or copy it in bulk, or run automated tools that put a heavy load on it,</LI>
        <LI>use the contact chat or my email to send spam, scams or anything harmful,</LI>
        <LI>pass off my work, my name or this site as your own.</LI>
      </UL>
      <P>
        If you spot a security problem, thank you. Please email me the details instead of testing it on
        the live site, and I&apos;ll fix it as fast as I can.
      </P>

      <H2>Who owns what</H2>
      <P>
        The text, code and design of this site are © {legal.owner}. You can link to any page and quote a
        short piece with credit, but please ask before reusing larger parts of it.
      </P>
      <P>
        The project photos, screenshots and the portrait are mine too. The typefaces are used under the{" "}
        <A href="https://openfontlicense.org/">SIL Open Font License 1.1</A>. Everyone involved is named
        on the <A href="/credits">credits page</A>.
      </P>

      <H2>About the projects</H2>
      <P>
        The project write-ups describe things I&apos;ve built, as honestly as I can. They&apos;re there to
        inform, not to make an offer. Any real work together is agreed separately and in writing.
      </P>

      <H2>No guarantees</H2>
      <P>
        The site is provided &ldquo;as is&rdquo;. I work to keep it accurate, fast and online, but I
        can&apos;t promise it will always be error-free, complete or available.
      </P>

      <H2>Limits on liability</H2>
      <P>
        As far as the law allows, I&apos;m not responsible for any loss or damage that comes from using
        this site or relying on what&apos;s on it. Nothing here limits any right you have that the law
        doesn&apos;t allow to be limited.
      </P>

      <H2>Links to other sites</H2>
      <P>
        Some links lead to other sites, like my LinkedIn, GitHub, Instagram and X profiles. I
        don&apos;t control them and I&apos;m not responsible for what they show or how they
        handle your data. Their own terms apply once you&apos;re there.
      </P>

      <H2>Changes to the site</H2>
      <P>
        This is a living portfolio. Pages, projects and features can change or disappear at any time,
        and the site may be offline now and then.
      </P>

      <H2>Governing law</H2>
      <P>
        These terms are governed by the laws of India. Any dispute that can&apos;t be settled by simply
        talking it through will be handled by the courts in Jaipur, Rajasthan.
      </P>

      <H2>Changes to these terms</H2>
      <P>
        If I update these terms, the new version goes up on this page and the date at the top changes.
        Using the site after that means you accept the updated terms.
      </P>

      <H2>Contact</H2>
      <P>
        Questions about these terms? Email me at <A href={mail}>{identity.email}</A>. For how the site
        handles your data, see the <A href="/privacy">privacy policy</A>.
      </P>
    </LegalPage>
  );
}
