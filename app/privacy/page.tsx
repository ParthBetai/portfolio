import type { Metadata } from "next";
import { pageMeta } from "@/lib/site";
import LegalPage, { A, H2, LI, P, Strong, UL } from "@/components/LegalPage";
import { identity, legal } from "@/lib/content";

export const metadata: Metadata = pageMeta(
  "Privacy policy",
  "What this site collects (almost nothing), where it goes and how to ask about it.",
  "/privacy"
);

/* Every sentence here describes how the site actually behaves. If a
   component starts storing, sending or loading something new, this page
   has to change with it, and legal.updated with it. */
export default function PrivacyPage() {
  const mail = `mailto:${identity.email}`;

  return (
    <LegalPage eyebrow="Legal" title="Privacy policy" updated={legal.updated} path="/privacy">
      <P>
        This is my personal portfolio. I built it to show my work, not to learn about the people who
        visit it. I collect almost nothing, and the little that does move around is explained below in
        plain words.
      </P>

      <H2>The short version</H2>
      <UL>
        <LI>No cookies.</LI>
        <LI>No analytics, no trackers, no ad scripts, no third party scripts of any kind.</LI>
        <LI>Nothing saved in your browser: no cookies, no local storage.</LI>
        <LI>
          The chat on the contact phone sends your message straight to my inbox. Nothing is stored
          on the site.
        </LI>
        <LI>I never sell or share what you send me.</LI>
      </UL>

      <H2>What stays on your device</H2>
      <P>
        Nothing. The site doesn&apos;t save anything in your browser: no cookies and no local storage.
        An older version could remember a setting for switching animations off; if your browser still
        has it, the site deletes it the next time you visit. There&apos;s more on the{" "}
        <A href="/cookies">cookies page</A>.
      </P>

      <H2>The contact chat</H2>
      <P>
        The phone in the contact section looks like a chat, but it&apos;s really a small form. It asks
        for your name, your email address, what it&apos;s about and your message. Nothing leaves your
        browser until you press send at the end. Reloading the page before then clears it.
      </P>
      <P>
        When you press send, those four answers go to this site&apos;s server, which passes them on as
        a single email to my inbox at <A href={mail}>{identity.email}</A>. The email is delivered by{" "}
        <Strong>Resend</Strong>, an email delivery service (see{" "}
        <A href="https://resend.com/legal/privacy-policy">Resend&apos;s privacy policy</A>). The site
        itself keeps no copy and has no database. To stop the form being used for spam, the server
        briefly remembers your IP address in memory to limit how many messages can be sent in a short
        time; it isn&apos;t written anywhere and is forgotten within a day.
      </P>
      <P>
        I use what you wrote only to reply to you. I keep messages only for as long as I need them to
        reply and follow up, and I never sell them, share them or add you to a mailing list. If the
        chat can&apos;t send, it offers to open your own email app instead, with everything filled in.
      </P>

      <H2>What other services see</H2>
      <P>
        Loading any website means your browser talks to a few servers, and each of them sees your IP
        address, the way a shop sees who walks in. For this site, that&apos;s:
      </P>
      <UL>
        <LI>
          <Strong>The hosting provider.</Strong> It keeps standard access logs (things like your IP
          address, the page asked for, your browser type and the time) to run and protect the
          service. If the site is hosted on Vercel, that&apos;s Vercel, under{" "}
          <A href="https://vercel.com/legal/privacy-policy">Vercel&apos;s privacy policy</A>. I
          don&apos;t use these logs to identify anyone.
        </LI>
        <LI>
          <Strong>Resend,</Strong> only if you send a message through the contact chat, as described
          above.
        </LI>
      </UL>
      <P>
        That&apos;s the complete list. The fonts, the photos and the resume PDF are stored on this site
        itself, so there is no request to Google Fonts, an image host or any file host.
      </P>

      <H2>Links to other sites</H2>
      <P>
        The site links to my profiles on LinkedIn, GitHub, Instagram and X. Once you follow one of
        those links you&apos;re on their site, under their own privacy policies, and nothing about your
        visit here goes with you beyond what your browser normally shares when you follow a link.
      </P>

      <H2 id="your-rights">Your rights</H2>
      <P>You can always email me to:</P>
      <UL>
        <LI>ask what I hold about you (usually just an email thread, if you wrote to me),</LI>
        <LI>ask me to correct it, or</LI>
        <LI>ask me to delete it.</LI>
      </UL>
      <P>
        Write to <A href={mail}>{identity.email}</A> and I&apos;ll sort it out as quickly as I can.
        India&apos;s Digital Personal Data Protection Act, 2023 sets out rights like these, and
        I&apos;m happy to honour them whoever you are and wherever you&apos;re writing from.
      </P>

      <H2>Children</H2>
      <P>
        This site isn&apos;t aimed at children, and I don&apos;t knowingly collect anything from them. If
        you think a child has sent me personal details, email me and I&apos;ll delete them.
      </P>

      <H2>Changes</H2>
      <P>
        If the way the site works changes, this page changes with it and the date at the top moves
        forward. I won&apos;t start collecting something new without saying so here first.
      </P>

      <H2>Contact</H2>
      <P>
        Questions about any of this? Email me at <A href={mail}>{identity.email}</A>.
      </P>
    </LegalPage>
  );
}
