import { footer } from "@/lib/content";

/* ============================================================
   HANGING SIGN
   The footer's enamel signboard, the last of the three sign-painted
   pieces on the page: a bar fixed to the wall by two brackets, and from
   it, on real chain links, a teal sign with a cream keyline, a scroll
   flourish in each corner, "Parth" painted in cream with its brick
   shade and the role (identity.role) under it. Below it hangs a cream
   sub-board in brick, "Let's build something".

   The sign, its chains and the sub-board are one box, .swing, which the
   footer drops in from behind the bar and lets swing once (Footer.tsx);
   .hang clips it above the bar. The words are HTML, so they are read
   out; the hardware is decorative.
   ============================================================ */

/* A chain of alternating links: a round one seen face on, then a
   narrow one seen edge on, every 11 units. */
function Chain({ h }: { h: number }) {
  const links = [];
  for (let y = 0, k = 0; y < h; y += 11, k++) {
    links.push(
      k % 2 ? (
        <rect key={y} x="2.6" y={y} width="2.8" height="13" rx="1.4" fill="#d6d6dc" stroke="#6e6e78" strokeWidth=".8" />
      ) : (
        <rect key={y} x="0.5" y={y} width="7" height="13" rx="3.5" fill="none" stroke="#c9c9cf" strokeWidth="2" />
      )
    );
  }
  return (
    <svg className="chain" viewBox={`0 0 8 ${h}`} width="8" height={h} aria-hidden="true" focusable="false">
      {links}
    </svg>
  );
}

/* The corner flourish: a scroll in cream ending in a yellow dot. */
function Flourish({ corner }: { corner: "tl" | "tr" | "bl" | "br" }) {
  return (
    <svg className={`fl ${corner}`} viewBox="0 0 40 40" aria-hidden="true" focusable="false">
      <path
        d="M4 36 C4 18 12 8 30 6 M4 36 C10 26 18 22 24 24 C28 26 26 31 22 30"
        fill="none"
        stroke="#f3ead6"
        strokeWidth="2"
        strokeLinecap="round"
      />
      <circle cx="32" cy="6" r="2.4" fill="#f6c400" />
    </svg>
  );
}

export default function HangingSign({ swingRef }: { swingRef?: React.RefObject<HTMLDivElement | null> }) {
  const { word, under, sub } = footer.signboard;
  return (
    <div className="hang">
      <div className="bar" aria-hidden="true">
        <i className="brk l" />
        <i className="brk r" />
      </div>
      <div className="swing" ref={swingRef}>
        <div className="chains" aria-hidden="true">
          <Chain h={66} />
          <Chain h={66} />
        </div>
        <p className="sign">
          <Flourish corner="bl" />
          <Flourish corner="br" />
          <Flourish corner="tl" />
          <Flourish corner="tr" />
          <span className="word painted shade-sign">{word}</span>{" "}
          <span className="under">{under}</span>
        </p>
        <div className="subwires" aria-hidden="true">
          <Chain h={26} />
          <Chain h={26} />
        </div>
        <p className="subsign">{sub}</p>
      </div>
    </div>
  );
}
