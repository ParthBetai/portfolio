import type { Metadata } from "next";
import { pageMeta } from "@/lib/site";
import LegalPage, { A, H2, LI, P, Strong, UL } from "@/components/LegalPage";
import { identity, legal } from "@/lib/content";

export const metadata: Metadata = pageMeta(
  "Credits",
  "The typefaces and open source tools behind this site.",
  "/credits"
);

/* `use` mirrors the font roles in app/globals.css. */
const fonts = [
  {
    name: "Archivo",
    by: "Omnibus-Type",
    href: "https://www.omnibus-type.com/fonts/archivo/",
    use: "the display type and body copy",
  },
  {
    name: "Instrument Serif",
    by: "Instrument",
    href: "https://github.com/Instrument/instrument-serif",
    use: "the italic accents",
  },
  {
    name: "JetBrains Mono",
    by: "JetBrains",
    href: "https://www.jetbrains.com/lp/mono/",
    use: "labels and small print",
  },
];

const tools = [
  { name: "Next.js", href: "https://nextjs.org/" },
  { name: "React", href: "https://react.dev/" },
  { name: "GSAP", href: "https://gsap.com/" },
  { name: "Lenis", href: "https://lenis.dev/" },
  { name: "Three.js", href: "https://threejs.org/" },
  { name: "Tailwind CSS", href: "https://tailwindcss.com/" },
];

export default function CreditsPage() {
  return (
    <LegalPage title="Credits" updated={legal.updated} path="/credits">
      <P>Nobody builds anything alone. Here&apos;s everyone and everything this site leans on.</P>

      <H2>Design and build</H2>
      <P>
        Designed and built by <Strong>{legal.owner}</Strong> in Jaipur, India. Say hello at{" "}
        <A href={`mailto:${identity.email}`}>{identity.email}</A>.
      </P>

      <H2>Typefaces</H2>
      <UL>
        {fonts.map((f) => (
          <LI key={f.name}>
            <A href={f.href}>{f.name}</A> by {f.by}, for {f.use}
          </LI>
        ))}
      </UL>
      <P>
        All three are used under the <A href="https://openfontlicense.org/">SIL Open Font License 1.1</A>{" "}
        and served from this site, not from a font service.
      </P>

      <H2>Photography</H2>
      <P>
        The project photos, the screenshots and the portrait are my own: pictures of the actual builds,
        taken while making them.
      </P>

      <H2>Built with</H2>
      <P>Open source, all of it. Thank you to everyone who maintains these:</P>
      <UL>
        {tools.map((t) => (
          <LI key={t.name}>
            <A href={t.href}>{t.name}</A>
          </LI>
        ))}
      </UL>
    </LegalPage>
  );
}
