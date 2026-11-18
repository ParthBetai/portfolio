import type { Metadata } from "next";
import { pageMeta } from "@/lib/site";
import LegalPage, { A, H2, LI, P, Strong, UL } from "@/components/LegalPage";
import { identity, legal } from "@/lib/content";

export const metadata: Metadata = pageMeta(
  "Accessibility",
  "What this site does to work for everyone, where it still falls short, and how to tell me.",
  "/accessibility"
);

/* Each item under "What's in place" maps to real code: the scroll keys to
   SmoothScroll, the motion levels to lib/motion.ts, the cursor rules to
   globals.css. Keep them in step. */
export default function AccessibilityPage() {
  const mail = `mailto:${identity.email}`;

  return (
    <LegalPage title="Accessibility" updated={legal.updated} path="/accessibility">
      <P>
        I want this site to work for everyone, however you browse: with a keyboard, a screen reader,
        zoomed in, on an old phone, or with animations turned down. The goal is to meet the{" "}
        <A href="https://www.w3.org/TR/WCAG22/">Web Content Accessibility Guidelines (WCAG) 2.2</A> at
        level AA.
      </P>

      <H2>What&apos;s in place</H2>
      <UL>
        <LI>
          <Strong>Keyboard access.</Strong> Every link, button and form field can be reached with Tab.
          The up and down arrows, Page Up, Page Down, Home, End and Space (Shift + Space to go back) all
          scroll the page, even while smooth scrolling is on.
        </LI>
        <LI>
          <Strong>Visible focus.</Strong> Whatever has keyboard focus gets an outline in a colour
          picked for the sheet it sits on: navy on the cream and paper sheets, pale blue on the blue
          ones and taxi yellow on the night ones. The sheets slide over one another as you scroll, and
          a focused link that ends up under one is brought back into view.
        </LI>
        <LI>
          <Strong>Skip link.</Strong> The first press of Tab shows a &ldquo;Skip to content&rdquo; link
          that jumps straight past the navigation.
        </LI>
        <LI>
          <Strong>Structure.</Strong> Each section has a real heading, in order, so you can move around
          by headings with a screen reader. Links and buttons are real links and buttons.
        </LI>
        <LI>
          <Strong>Images.</Strong> Project photos have text descriptions. Purely decorative pieces, like
          the 3D pin wall, the other WebGL effects and the background grain, are hidden from assistive
          technology so they don&apos;t get in the way.
        </LI>
        <LI>
          <Strong>The tech stack.</Strong> The scrolling rows of skills and tools also exist as a plain
          list for screen readers, so nothing is only available as moving text, and a pause button
          beside them stops every row.
        </LI>
        <LI>
          <Strong>Contact chat.</Strong> New messages are announced to screen readers as they arrive,
          the answer box is labelled for each question, and the quick replies are ordinary buttons.
          My email address is also written out beside the phone.
        </LI>
        <LI>
          <Strong>Resume preview.</Strong> The floppy disk and the file in the chat open a preview of
          my resume. Focus moves into it and stays there until you close it with the Close button or
          Escape, then goes back to where you were. The PDF itself is a text document, so screen
          readers can read the downloaded file.
        </LI>
      </UL>

      <H2>Motion</H2>
      <P>Animation is a big part of this site, so it comes in two levels:</P>
      <UL>
        <LI>
          <Strong>Full.</Strong> Everything, including smooth scrolling and the effects that react to
          how fast you scroll.
        </LI>
        <LI>
          <Strong>Softer.</Strong> If your device is set to reduce motion, the site respects it. Smooth
          scrolling and the speed-driven effects switch off, so the page never moves under you, while
          the rest of the animation still plays.
        </LI>
      </UL>
      <P>
        The custom cursor only appears with a precise pointer, like a mouse or trackpad. It never shows
        on touch screens, and it never replaces the normal text cursor in form fields, so you can always
        see where you&apos;re typing.
      </P>

      <H2>Known limitations</H2>
      <P>I&apos;d rather be honest about these than pretend they aren&apos;t there:</P>
      <UL>
        <LI>
          On the home page the opening animation holds the page still for a moment before you can
          scroll.
        </LI>
        <LI>
          The one-liner in the bar at the top of the page changes every four seconds. It holds while
          you point at it and while the tab is in the background, and screen readers get every line
          once as plain text, but there is no keyboard control to stop it.
        </LI>
        <LI>
          The list of roles I&apos;m open to, on the ticket in the About section, rolls through one
          entry at a time. It holds while you point at it and while it&apos;s off screen, and screen
          readers get the whole list once as plain text, but there is no keyboard control to stop it.
        </LI>
        <LI>
          If the contact chat can&apos;t send your message, it offers to open your email app instead.
          Emailing me directly always works too.
        </LI>
        <LI>
          The very large headings are set at fixed sizes. At high zoom, part of a heading can be cut
          off at the edge of the screen. The full words are still there as normal text for screen
          readers.
        </LI>
        <LI>
          Links to LinkedIn, GitHub, Instagram and X take you to sites I don&apos;t control.
        </LI>
      </UL>

      <H2>Tell me what&apos;s not working</H2>
      <P>
        If something on the site is hard to use, or doesn&apos;t work with the way you browse, please
        tell me. Email <A href={mail}>{identity.email}</A> with the page, what went wrong and, if you
        can, the device, browser or assistive technology you use. I read every message and I&apos;ll
        work on a fix.
      </P>
    </LegalPage>
  );
}
