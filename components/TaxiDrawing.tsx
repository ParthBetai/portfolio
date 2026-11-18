/* ============================================================
   THE HERO TAXI
   The 640-unit Ambassador standing on the hero's kerb with the robot
   riding its roof rack, in the two prints of the Exposure:

     ink  the colour taxi (the shared symbol from AmbassadorDefs.tsx),
          with the rack in navy and a soft shadow on the road;
     bp   cyanotype linework. Only the body silhouette and the wheel
          wells are filled, in the blue, so the colour taxi beneath is
          covered exactly and there is no box round the car.

   It faces left, towards the gutter: on the home page the scroll drives
   it off along the kerb to the route, shrinking as it goes, until it is
   the small route taxi (THE JOURNEY in lib/motion.ts). data-stand-body
   marks it as the car's body for that hand-over (the robot rides along
   but is not measured).

   Its size and place come from .h-taxi in styles/s1-hero.css; the
   width passed here is only the svg's intrinsic size.
   ============================================================ */
import Ambassador from "./Ambassador";
import type { Tone } from "./HeroScene";

export default function TaxiDrawing({ tone }: { tone: Tone }) {
  if (tone === "bp") {
    return (
      <Ambassador
        variant="line"
        width={640}
        flip
        rack
        ink="var(--color-bline)"
        paper="var(--color-blue)"
        className="h-taxi"
        data-stand-body=""
      />
    );
  }
  return <Ambassador variant="color" width={640} flip rack shadow ink="var(--color-ink)" className="h-taxi" data-stand-body="" />;
}
