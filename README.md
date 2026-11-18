# Parth Betai · Portfolio

Personal portfolio of Parth Betai: a single, heavily animated page with a 3D hero,
plus five short info pages. Built with Next.js 15, React 19, Tailwind CSS v4,
GSAP, Lenis and three.js.

**This README is the project's complete memory.** It holds everything known
about the site, about Parth, every decision made so far and why, and what is
still open. Anyone picking the project up (a person or an assistant, on any
machine) should read all of it before changing anything, and must **update it
in the same change** whenever something is added, removed or decided. Record
each change in the [Changelog](#15-changelog) with its date.

---

## Contents

1. [Continuing the work](#1-continuing-the-work)
2. [About Parth](#2-about-parth)
3. [How Parth wants things done](#3-how-parth-wants-things-done)
4. [Running the project](#4-running-the-project)
5. [File map](#5-file-map)
6. [The page, section by section](#6-the-page-section-by-section)
7. [The other pages](#7-the-other-pages)
8. [Content: lib/content.ts](#8-content-libcontentts)
9. [Design system](#9-design-system)
10. [Motion policy](#10-motion-policy)
11. [Security](#11-security)
12. [The contact email (Resend)](#12-the-contact-email-resend)
13. [Assets and helper scripts](#13-assets-and-helper-scripts)
14. [Deploying](#14-deploying)
15. [Changelog](#15-changelog)
16. [Open items and known limitations](#16-open-items-and-known-limitations)
17. [Hard-won lessons (read before editing)](#17-hard-won-lessons-read-before-editing)

---

## 1. Continuing the work

- **Start here.** Read this whole file. Then read `lib/content.ts` (all copy) and
  skim `app/globals.css` (tokens and type roles).
- **Where things stand (18 Nov 2026):** the site has been **redesigned a
  second time**, as **"The Drawing Set, Kolkata edition"** (the twelfth
  round, 5 to 12 Oct), and Parth's first list of eleven fixes to it has
  been worked through (the thirteenth round, 12 to 13 Oct), then his
  six-item fourteenth round (13 Oct: the hero note gone, a loading screen
  that is never empty, the hero taxi facing left and driven off by the
  scroll into the route taxi, the floppy in a paper sleeve, the plotter's
  title block, the lantern and the inbox label at the phone), then the
  fifteenth round (16 Nov: the hero no longer holds the page still while
  its taxi shrinks, and a printed halftone speech balloon replaces the
  Contact lantern), then the new loader he picked from four concepts,
  Span closed (17 Nov, section 6), then the 25 fixes from a full code
  review and his name craned in by cable inside that loader (18 Nov,
  the sixteenth round in the Changelog). He approved
  the drawing set on 5 Oct: of three directions he chose "A+B+C all 3
  combined all major elements", and approved navy replacing black. The
  page is his own numbered set of drawing sheets, 01 Home to 06 Contact,
  that stick and slide over one another, with one inked taxi route
  running down the gutter, and since the thirteenth round one small taxi
  drives that route with the scroll, from the hero's Home stop to "You've
  arrived" on the footer street (since the fourteenth round the hero's
  big taxi drives off the kerb and shrinks into it at the gutter). See
  [section 6](#6-the-page-section-by-section) for the sheets,
  [section 9](#9-design-system) for the design system and the Changelog
  (twelfth to fifteenth rounds). It replaces the yellow-and-black
  "Kolkata taxi" look of 30 Sep and 1 Oct, which was never pushed.
  - **State:** everything up to the sixteenth round is verified in a
    **production build** made on 18 Nov and served on 127.0.0.1:3001:
    the typecheck and `next build` pass (15 pages, 0 `hidden id="S:"`
    segments in the built home page), and the home page, the five info
    pages and the 404 at 1440x900 and 390x844 in full motion, soft mode
    and without JavaScript show 0 sideways overflow, 0 CSP violations and
    no console errors (42 runs). Against the pre-fix baseline tour the
    only differences are time-based (the plotter mid-draw and now
    following the scroll, the ticket's rolling role, the stack ticker,
    the phone chat's clock). The loader (Span closed with the craned
    name) was recorded frame by frame on that build with reduced motion
    on. **Pushed to GitHub on 18 Nov 2026** (`main`), at Parth's request;
    not deployed. The polish pass and the closing reviews of the
    sixteenth round were still running at the time of the push.
  - **Open before committing: dependency advisories.** On 13 Oct
    `npm audit --omit=dev` reported 3 advisories published since the last
    clean audit: next 15.5.26 (moderate, SSG and ISR cache poisoning in
    self-hosted apps; fixed in 15.5.27), sharp below 0.35.5 (high, its
    librsvg dependency) and source-map-js 1.2.1 or older (high, a
    denial-of-service on crafted source maps). Fixing them means
    downloading package updates, so it waits for Parth's go-ahead (still
    waiting after Span closed, 17 Nov). The site itself was not changed
    for them.
  - **Checked for the fifteenth round** (dev server, headless Edge; the
    full list is in its Changelog entry): the typecheck; the hero drive
    stepped down and back up in full and soft motion at six laptop sizes
    from 1280x600 to 1536x730, with nothing overlapping (never both
    taxis or neither, the car never over the copy, About's tab or the
    copy line); the home page, the five info pages and the 404 at 1440,
    1024, 768, 390 and 360px wide, in full motion and without
    JavaScript (0 sideways overflow, 0 CSP violations). Work now starts
    at 4.16 screens at 1440x900 and 4.84 at 390x844 (scripts on, natural
    flow; the hero's 0.36-screen run-out is gone).
  - **Checked for the fourteenth round** (dev server, headless Edge): the
    typecheck; the home page, the five info pages and the 404 at 1440,
    1024, 768, 390 and 360px wide in full motion, walked to the bottom (0
    sideways overflow, 0 CSP violations, no console errors or hydration
    warnings), and the same pages in soft mode and without JavaScript;
    soft and full mode at rest give the same state at seven scroll
    positions at 1440 and 390 (the hero taxi on both prints, the rail,
    the sleeve, the lantern (since replaced by the balloon), the phone's
    label, the title block); the
    Contact pin wall's ancestors carry no transform, filter, will-change
    or contain at any width; the home page cleans up its ScrollTriggers
    and listeners across client navigations and StrictMode's double
    mount; the loader in full motion at 1440x900 and 390x844 (frames
    every 200ms, before Span closed: the memorial plots from the first frame, the parked
    loader taxi is inside the frame at every width from 360 to 1440, and
    the plot does no layout reads after its one measurement); the hero
    drive at 1280x720, 1366x768, 1440x900 and 1536x864 (wherever the big
    taxi crosses the role, the billing or the buttons, the copy is on top
    at every sample); the Exposure at three heights at 1440 and 390 (ink
    copy above the line, blueprint copy below); the inbox label never
    later than its arrow, in full and soft motion, at 820x1180, 768,
    390, 360, 1024, 1280 and 1440. Work then started at 4.52 screens at
    1440x900, 5.07 at 1366x768, 5.31 at 1280x720, 5.20 at 390x844 and
    6.04 at 360x740 (scripts on, natural flow, with the hero's 0.36-screen
    drive run-out that the fifteenth round removed).
  - **Checked for the thirteenth round** (dev server, headless Edge): the
    typecheck; the home page, the five info pages and the 404 at 1440,
    1024, 768, 390 and 360px wide, in full motion, soft mode and without
    JavaScript (0 sideways overflow, 0 CSP violations, no page errors or
    hydration warnings beyond the two dev-only notes in section 16); the
    route taxi sampled every 4 to 40px of scroll, down and back up, at
    1440x900, 390x844, 1280x720 and 820x1180, and in Lenis wheel runs
    (exactly one taxi, on its line and not covered, in every sample, and
    parked past the terminus at the deepest scroll); full and soft mode
    parked at the same scroll positions give identical taxi, rail and
    label states; the loader's name holds still to the pixel from the end
    of its decode through the hand-off at 1440x900 and 390x844; no
    ancestor of the Contact pin wall carries a transform, filter,
    will-change or contain at any width; Back from an info page lands on
    the hero at the top; no em dash and no tool or model name in the
    source. Work now starts at 4.16 screens at 1440x900, 4.71 at
    1366x768, 4.95 at 1280x720, 4.84 at 390x844 and 5.68 at 360x740
    (scripts on, natural flow), against gates of 5.0, 5.3, 5.6, 6.0 and
    6.6; with "In numbers" it was 4.61, 5.24, 5.57, 5.61 and 6.58.
  - **Checked for the twelfth round** (dev server, soft mode): the
    typecheck; whole-page tours at 1440x900, 1024x768, 768x1024, 390x844
    and 360x740 with and without JavaScript (0 sideways overflow, 0 CSP
    violations, no console errors); every bottom-nav item, index tab, Work
    index row, the board, the hero buttons and the footer's Get in touch
    clicked and landing on their sheets; the Exposure, the bridge sky, the
    paste-up, the footer sign and the parked taxi at their mid-points; the
    five info pages and the 404 at both sizes, with and without
    JavaScript.
  - **Port:** Parth runs another project on port 3000, so this one is
    previewed on **3001** (see [section 4](#4-running-the-project)).
    `npm run dev` itself still uses 3000.
  - The contact email is configured locally but a real test message has not
    been sent (see [section 12](#12-the-contact-email-resend)).
- **Repository:** https://github.com/ParthBetai/portfolio (branch `main`), set up on
  29 Sep 2026. Commits are made as ParthBetai <parthbetai007@gmail.com>, with no
  assistant or tool co-author lines. `.env.local` is ignored by `.gitignore`,
  and the local tool settings folder is kept out through `.git/info/exclude`
  (repeat that line after a fresh clone if the folder exists there).
- **How changes have been verified every time:**
  1. `npx tsc --noEmit --incremental false` (typecheck)
  2. `npm run build` (must pass)
  3. Screenshots of every section at desktop and phone sizes with
     `scripts/screenshots.mjs`, in reduced-motion mode (that is what Parth's PC
     shows, see [section 10](#10-motion-policy)), then looked at critically.
  4. Checks inside those runs: CSP violations (listen for
     `securitypolicyviolation`), `document.documentElement.scrollWidth - innerWidth`
     must be 0, no em dash (U+2014) in `document.body.innerText`, and no
     console errors (a failed request shows up there).
  5. `npm audit --omit=dev` must report 0 vulnerabilities.
- **After every change:** update the matching section here and add a line to
  the Changelog.
- **Moving machines (Windows to Linux):** `git clone https://github.com/ParthBetai/portfolio.git`,
  then copy `.env.local` over by hand (it holds the email key and is
  deliberately not in git; without it the chat falls back to the mail app).
  Then `npm install` and `npm run dev`. The helper scripts find Chrome, Chromium
  or Edge on Linux automatically, or use `BROWSER_PATH`.

## 2. About Parth

Everything the site says about Parth comes from his resume
(`public/Parth-Betai-Resume.pdf`) or from things he said directly.

- **Name:** Parth Betai. The status strip and the hero (which is its own
  loader) say "Parth Betai"; the footer's enamel sign says "Parth".
- **Role on the site:** Software Developer & Robotics Engineer (Parth asked
  for "Robotics Engineer" beside it on 12 Oct; in a sentence, "software
  developer and robotics engineer"). It is `identity.role`, so the hero,
  the footer sign, the title block, the page title and the share card all
  follow it.
- **From:** Kolkata, West Bengal, India.
- **Now:** in Jaipur, India, for a four-year undergraduate programme (started
  2026, first year). The site lists **Primary work location: Jaipur, India** and
  **Secondary work location: Kolkata, India**.
- **School:** Delhi Public School Megacity, Kolkata, Apr 2013 to Mar 2026. Class XII
  with Mathematics, Physics, Chemistry and Computer Science.
- **Email (public on the site):** parthbetai007@gmail.com
- **Phone:** deliberately **not** published on the site (it is printed in the
  resume PDF, which is public).
- **Profiles:** LinkedIn `https://www.linkedin.com/in/codewithparth`,
  GitHub `https://github.com/ParthBetai`, Instagram `https://www.instagram.com/ftxparth`,
  X `https://x.com/ftxparth`. (YouTube was removed at his request and replaced by X.)
- **Available to work as:** Android developer, software engineering intern,
  robotics intern, embedded systems intern, web developer, freelance designer,
  AI automation builder.
- **Ventures:**
  - **Psquare Online**, CEO and Founder, Jul 2024 to 2025. Dropshipping
    e-commerce store grown to 50+ products; ran vendors, supply pipeline and all
    the marketing for about 12 months, then closed it to pivot to Afferex.
  - **Afferex**, Founder, Mar 2026 to 2026. A studio giving small businesses web
    development, admin panels, business systems, logo design and social media
    management with AI-assisted workflows. **It has been wound down.** Talk about
    it in the past tense everywhere. **It never delivered client work** (Parth
    confirmed on 29 Sep that it was still finding its first clients), so the copy
    says what it *offered*, never "real clients" or delivered projects.
- **Projects (all four on the site, with his own photos).** Facts below are the
  resume plus what Parth confirmed on 29 Sep 2026. **Never add a number nobody
  counted** (no servo count, no test count, no percentages, no panel wattage).
  - **Android App Suite** (shown first: software before robotics, on request).
    Two highlights, in this order:
    - **Offline SOS app** (added 29 Sep, confirmed by Parth; not in the resume
      PDF yet): built in **React Native**. With no signal, a phone sends an SOS
      over **Bluetooth Low Energy**; every phone that hears it **re-broadcasts it
      hop by hop** to phones in range. The SOS carries the sender's **GPS
      location** and an optional **short text message**; receiving phones
      **alert** (sound or vibration) and show it; each SOS has an **ID so phones
      never relay the same one forever**. Not confirmed, so never claimed: the
      Bluetooth SIG "Mesh" standard, TypeScript, iOS, range, number of phones or
      hops tested, library names.
    - **Domino's-style ordering UI replica** in Java with XML layouts, built in
      Android Studio (product carousels, ratings, a review section, per the
      resume). The calculator app is **never** mentioned; the quiz app (with
      score tracking) only in passing; "many more apps like it".
  - **Stack status (29 Sep):** **React and React Native are in his stack**;
    **Flutter is still being learned** (stays in the Learning row).
  - **Mini Humanoid Robot:** **8 or more servos** (exact count unknown) driven
    through a **PWM servo driver board on an Arduino**; motion code in **C++**;
    **5+ motion sequences built from hand-tuned poses, with the servos eased
    gradually between poses so it moves without jerking**. It is the robot that
    **won 1st place in Robotics at the national-level interstate competition at
    IIT Hyderabad** (confirmed; the resume's "selected for presentation" line is
    out of date).
  - **Obstacle-Avoiding Autonomous Car:** Arduino, C++; **one ultrasonic sensor
    on a servo** at the front (the photo shows one sensor; the resume's "sensor
    arrays" is wrong); when something is close ahead the code **stops, turns the
    sensor to check left and right and steers toward the side with more room**;
    four geared motors through a motor driver board, two 18650 cells. Controlled
    tests: it detected obstacles reliably, but **the runs were not counted**, so
    the site gives no "100%" and no count.
  - **Wireless Charging EV Model:** a **solar panel charges three 18650 Li-ion
    cells, which power the track**; when a **sensor spots the car arriving, a
    relay switches on the transmitter coil** set into the track; he built the
    wireless charging circuit and the embedded motor control; shown at two
    institutional exhibitions.
  - **Resume PDF is out of date** on these points (it still says "100%",
    "sensor arrays", "selected for presentation" and Afferex "Present"). Only
    Parth can fix the source document.
- **Achievements (from the resume):** 1st place in Robotics at IIT Hyderabad
  (national-level, interstate); Abacus all-India 1st and 2nd round winner;
  shooting 1st place zonals, regionals qualified; karate brown belt (2 kyu);
  hackathons: 1st App Dev at Cresco Scientiam 2024, 2nd App Dev at Cresco
  Scientiam 2023, 3rd Research and Analysis at Udaan, 3rd Competitive Programming
  at Yuvakarshan, 3rd Shark Tank at X-Celsior, finalist at Cathcon; student
  representative at Relativity 2024, Logique 2025 and X-Celsior 2025 (won).
  **He does not want wins or competitions in the intro paragraph.** The IIT
  Hyderabad first place appears only in the Robotics service text, on the
  humanoid's card (the badge "1st place in Robotics · IIT Hyderabad" with its
  medal, and the round stamp "ROBOTICS 1ST PLACE IIT HYDERABAD" on the
  print), never in the paragraph itself. ("In numbers", with its fare meter
  reading "1st", was removed from About at his request on 12 Oct.)
- **Leadership:** Director, Tech Club (Mar 2024 on, mentored 50+ students);
  Secretary, Interact Club (Rotary); Student Captain, Outreach; VP of Cresco
  Scientiam 2025; IT Head of Cresco Scientiam 2024; Vice Captain, Discipline;
  Vice President, Science Club.
- **Certifications:** HarvardX CS50 Introduction to Game Development; Cisco
  Introduction to Cybersecurity; Forage virtual internships (J.P. Morgan
  investment banking and software engineering, Tata cybersecurity analyst,
  Goldman Sachs internal audit).
- **Skills (resume):** Java, Kotlin, Android, C++, Python, HTML, CSS, Git, Spring,
  REST APIs, SQL, message queuing, build tools, Arduino, embedded systems, circuit
  design, sensor programming, hardware prototyping, OOP, data structures, plus
  finance and security topics (IAM, network defence, risk assessment, auditing,
  ethical hacking).
- **Interests:** coding, cycling, electronics experiments, robotics research.
- **Machine:** Windows 11 laptop (Intel Iris Xe graphics) with Windows
  "Animation effects" switched **off**, so browsers report
  `prefers-reduced-motion: reduce` for him. He plans to move to Linux.
- **College network:** a public Wi-Fi ("iBUS@MUJ"), which is why the dev server is
  bound to 127.0.0.1 (see [section 11](#11-security)).

## 3. How Parth wants things done

These came up again and again. Treat them as rules.

- **It must never look machine-made or "vibe coded".** He rejects: neon colours
  (the old lime), glows, blinking or pulsing status dots, wide-spaced mono
  micro-labels everywhere, serif-italic accent words, generic particle effects,
  dotted globes, generic cursors. Every section should have its own tactile,
  hand-made signature object.
- **"Pro level", hand-made, and his own world** (the redesign brief, 29 to
  30 Sep). He wants the site to look like a professional's work that a person
  clearly made by hand. He pointed at a reference portfolio for its principles
  (a bold single colour used as whole fields, handwritten notes over clean
  type, tape, prints and stamps, a top status strip, a floating bottom nav,
  numbers with context, a personal voice). Those principles are translated
  into **his** world: Kolkata and its yellow Ambassador taxis, robots, a
  maker's lab notebook. **Nothing of the reference's content or layout is
  copied**, and nothing should be.
- **No caution signage.** He said the yellow-and-black taxi round had "too
  much caution vibes", and asked for unique page flows. Yellow fields,
  huge black-on-yellow capitals and hazard stripes read as construction
  signs, not as a Kolkata taxi. So yellow goes only on objects, never on
  a field or a stripe, and the sheets meet as drawn seams, not flat cuts.
- **He approved the drawing set (5 Oct 2026):** of three directions shown
  to him (A, the Drawing set, the spine of numbered sheets; B, City ride,
  the taxi route and the Kolkata scenes; C, Hand-painted Kolkata boards,
  the painted objects) he chose "A+B+C all 3 combined all major
  elements", and approved **navy replacing black**. It replaced the taxi
  palette he had approved on 29 Sep (taxi yellow and black). Do not
  change the palette unless he asks.
- **Hand-made touches are used sparingly** (a design reviewer's point in the
  redesign, following from the first rule above). Every handwritten note,
  number, drawing label and stamp must be true and in his voice. Stamps go
  only where there is a real verdict, so only two projects are stamped (the
  humanoid's first place and the EV model's two exhibitions). The approved
  drawing-set plan gives **all four** project drawings a handwritten note
  (until the twelfth round only two carried one).
- **Ask before downloading anything new** (fonts, packages, assets). He
  approved the Kalam handwriting font download explicitly.
- **No em dashes (U+2014) anywhere**, in page text, code comments or docs. Use a
  comma, colon or full stop.
- **Copy should sound like a person**, plain and specific, not marketing.
- **Credibility over volume** (his feedback on 29 Sep): no lists of AI product
  names, no bare percentages, and every project should show implementation
  depth (parts, how they work together, what he built). Depth must come from
  facts he has confirmed; when a detail is missing, ask him rather than guess.
- **Animation is wanted and must be visible**, including in reduced-motion mode,
  because that is what his own PC shows.
- **Security matters a lot to him:** no open ports, no loopholes, nothing
  exposed. Keep the headers, CSP and API hardening intact.
- **No tool names, watermarks or "made with" credits** anywhere in the code,
  comments, pages or metadata.
- **Keep formats he likes** when asked for content changes (for example the
  founder timeline layout stayed the same when Afferex ended).
- **Every mark must mean something to a visitor** (12 Oct). He asked what
  the "A" on each project divider was for, and said the "06 / 06" in the
  footer made no sense. A drafting convention that points at nothing (a
  section cut with no section view, a sheet count) is removed, not
  explained. On 13 Oct he asked whether the plotter's "01 / 07" was
  needed and to take his own name out of its title block; both went.
- **What a visitor can use must be the brightest thing on its sheet**
  (12 Oct): the floppy and the phone were not standing out. Make them
  stand out by drawing (a paper sleeve, a printed balloon), not by a
  coloured glow. On 13 Oct he said the detail circle behind the floppy
  was not making it stand out ("try something else").
- **Loaders keep the word still** (12 Oct). He liked the old site's
  "Portfolio" loader, where the word stayed put and only what was around
  it changed; the hero now loads his name that way.
  On 13 Oct he found the loading screen looking empty, and the
  hand-over to the hero with it: the sheet should look busy from the
  first frame, and the hand-over should be one clean beat.
- He writes quick, informal feedback in bursts, often several requests in one
  message. Go through every item.

## 4. Running the project

Requirements: Node.js 24 (developed on v24.19.0, npm 11). Any Chromium-based
browser for the helper scripts.

```bash
npm install
npm run dev      # http://127.0.0.1:3000, local machine only
npm run build    # production build, must pass before calling anything done
npm run start    # serves the production build on 127.0.0.1:3000
npm run audit    # npm audit for runtime dependencies
```

The dev server compiles each page the first time it is opened, which can take
several seconds on a slow laptop; `components/RouteProgress.tsx` shows a
"Loading" screen meanwhile (only when a page change takes longer than
160 ms). The production build has every page prebuilt.

**Port 3001:** Parth runs another project on port 3000, so during the
redesign this one was previewed on 3001 with
`npx next dev -H 127.0.0.1 -p 3001` (and `npx next start -H 127.0.0.1 -p 3001`
for a production build), through local preview configurations named
"portfolio-3001" and "portfolio-prod-3001" in the git-excluded local settings
folder. `npm run dev` and `npm run start` still use 3000. Either way the server
stays bound to 127.0.0.1.

Environment variables live in `.env.local` (not committed). See `.env.example`.

## 5. File map

```
app/
  layout.tsx            root layout: self-hosted fonts (Archivo, Kalam,
                        JetBrains Mono), metadata, motion boot script, skip
                        link, AmbassadorDefs (the taxi's shared SVG symbols),
                        and Cursor, Grain and RouteProgress on every page
  page.tsx              the home page: SmoothScroll, StatusStrip and
                        BottomNav, then <main class="sheet-stack"> with the six
                        sheets (HomeSheet, AboutSheet, ServicesSheet,
                        WorkSheet, JourneySheet, ContactSheet); the intro
                        scroll lock (pinned to the top), the post-intro
                        fade, the journey (driveRoute with the car) and
                        the "/#id" deep-link jump
  globals.css           @theme tokens, base rules (grounds behind the page,
                        focus ring, selection), the grain, the marquee
                        keyframes, the no-JS rules; imports styles/
  styles/f0-base.css    the drawing set's foundation: palette aliases, layout
                        tokens (--rx --cl --cr --R --rw --bh), the four
                        --shade-* values, type (.t-head .wc .painted .hand
                        .mono .hl .hlm), .btn, the four grounds (.g-cream
                        .g-blue .g-night .g-paper), the sheet stack, the
                        route pieces and the route taxi (.route-car),
                        .deckle, the page-change sheet
  styles/s1-hero.css    Sheet 01: hero, the Victoria Memorial, the loader's
                        bridge and held-back state, Exposure layers
  styles/s2-chrome.css  the status strip and the bottom nav
  styles/s3-about.css   Sheet 02: ticket, floppy in its paper sleeve, tram,
                        tins
  styles/s4-services.css Sheet 03: bridge band, board, rows, plotter, rooftops
  styles/s5-work.css    Sheets 04 and 05: paste-up, projects, drawings,
                        prints, stamps, ghat, timeline, venture blocks
  styles/s6-contact.css Sheet 06 (with the phone's printed balloon), the
                        footer street and its title block, the info pages,
                        the 404
  not-found.tsx         404 page, "Took a wrong turn." (one night sheet, the
                        taxi turned round on its own road, a cream button)
  icon.svg              favicon: the colour taxi with a cream roof rack on a
                        navy tile (made by scripts/make-share-image.mjs)
  apple-icon.png        the same mark, 180x180, for iPhone home screens
  opengraph-image.jpg   the link preview card (1200x630), and its .alt.txt
  twitter-image.jpg     the same card for X, and its .alt.txt
  privacy/ terms/ cookies/ accessibility/ credits/   the info pages
  api/contact/route.ts  POST endpoint that emails chat messages via Resend
  robots.ts sitemap.ts  absolute URLs from lib/site.ts
  fonts/                Archivo (variable), Kalam 400 (Indian Type Foundry,
                        the handwriting) and JetBrains Mono 400 and 500.
                        Instrument Serif was deleted in the twelfth round
                        (unused); it is in git history
components/
  Sheet.tsx             one sheet of the set: anchor, slot, <section> with
                        ground, frame, four RegMarks and the index tab
  RegMark.tsx           the crosshair registration mark
  Route.tsx             the taxi route's static pieces: Rail, Elbow, Stop,
                        StopLabel, Spur, Station, Terminus (a Rail with
                        `stand` is a stretch a stand-in taxi drives)
  HomeSheet.tsx         Sheet 01 (cream): wraps Hero
  Hero.tsx              the hero, which is also the loader (Span closed:
                        the name is craned onto its plan while the bridge is built)
  LoaderBridge.ts       the loader's Howrah Bridge: createSpan builds it on
                        the sheet, frame(t, p, o) draws it, the stamp and
                        the push onto the hero taxi (geometry from BridgeArt)
  HeroScene.tsx         the drawn street of Sheet 01 in two prints (ink, bp),
                        with the Victoria Memorial (Memorial) behind Parth
  TaxiDrawing.tsx       the hero's 640-unit taxi, facing left, with the
                        robot on its rack
  Exposure.tsx          the copy line, the blueprint masks and the ink
                        copy's upside-down mask (InkMask) (01 to 02)
  HeroPortrait.tsx      three.js relief of Parth's cut-out photo, split by
                        the Exposure in its shaders; flat fallback
  Portrait.tsx          detects which portrait files exist
  HeroOrb.tsx           liquid-chrome orb, the fallback when there is no photo
  StatusStrip.tsx       the cream strip across the top of every page
  BottomNav.tsx         the home page's section nav with the taxi on its road
  AboutSheet.tsx        Sheet 02 (blue): Intro, then Marquee
  Intro.tsx             "Intro", the paragraph, the ticket and the floppy
                        in its paper sleeve with its note on a leader
  FactsTicket.tsx       "The short version" as a perforated ticket
  ResumeDisk.tsx        the 3D floppy disk that opens the resume preview
                        (its width is --disk; it takes `under` and `over`
                        art drawn inside its link: the About sheet's
                        paper sleeve)
  ResumePreview.tsx     the preview overlay and its disc-opening animation
  TramBand.tsx          the Kolkata tram on its wires above the stack rows
  Marquee.tsx           the four drifting stack rows with their enamel tins
  ServicesSheet.tsx     Sheet 03 (night): wraps Services, carries the veil
  BridgeBand.tsx        the Howrah Bridge crossing at the head of Sheet 03;
                        its deck taxi is the journey's stand-in
  BridgeArt.ts          the bridge's static SVG strings
  ShortOnTimeBoard.tsx  the teal "Short on time?" enamel board
  Services.tsx          "What I can do": seven rows hung on the route like
                        stations
  ServicePlotter.tsx    the pen plotter card beside the rows
  ServiceDrawings.ts    the seven technical drawings (SVG data)
  WorkSheet.tsx         Sheet 04 (grid paper): wraps Work
  PasteUp.tsx           the paper roll and paste streaks on Work's top edge
  Work.tsx              "Selected work": index, four projects, drawings,
                        prints, stamps, notes
  drawings/             the four project drawings (SosRelay, HumanoidExploded,
                        CarPlan, EvTrack) and their shared kit.ts (the one
                        ink palette, f1 and the seeded randoms, also used by
                        the bridge, night street, tram band and floppy)
  Stamp.tsx             the round rubber stamp
  Medal.tsx             the first-place medal on the humanoid's badge
  JourneySheet.tsx      Sheet 05 (blue): wraps Ventures
  Ventures.tsx          "Founder journey": the ghat, the timeline, the ventures
  ContactSheet.tsx      Sheet 06 (night): Contact, then Footer
  Contact.tsx           "Get in touch" around the phone over the pin wall,
                        with the printed halftone balloon (.ct-balloon)
                        that stages the phone, and the inbox note as the
                        message box's label with its hand arrow
  PhoneChat.tsx         the 3D phone and its chat-shaped contact form
  PinField.tsx          WebGL pin-art wall behind the contact sheet
  Footer.tsx            the footer street on every page; on the home page
                        its taxi is the journey's stand-in for the kerb and
                        "You've arrived" is written in as it parks
  SocialIcon.tsx        the GitHub, LinkedIn, Instagram and X logos for the
                        title block's Connections cell (restored)
  HangingSign.tsx       the footer's enamel "Parth" signboard
  NightStreet.tsx       the street, kerb and lamp where the route ends
  LegalPage.tsx         the info pages' cream sheet and prose helpers
  Ambassador.tsx        the Kolkata taxi in four prints (color, outline, ink,
                        line) and the top-down AMB_TOP of the route taxi;
                        AmbassadorDefs.tsx draws their shared symbols
  Cursor.tsx            the engineering-reticle cursor
  RouteProgress.tsx     the cream page-change sheet (never add a loading.tsx,
                        see section 17)
  SmoothScroll.tsx      Lenis, keyboard scrolling, and every same-page hash
                        link sent through jumpTo
  Grain.tsx             the paper-tooth grain overlay
  (Magnetic.tsx and Dust.tsx were deleted, and so were Numbers.tsx,
  DetailViews.tsx and FareMeter.tsx with "In numbers"; git history has
  them. SocialIcon.tsx was deleted and is back in use)
lib/
  content.ts            every word, link and project on the site
  site.ts               the public address (SITE_URL) and pageMeta() for the
                        info pages' titles, canonical links and previews
  motion.ts             gsap and its plugins (ScrollTrigger, DrawSVG), the
                        motion policy, scrub(), jumpTo, useSheetStick,
                        driveRoute (and THE JOURNEY: the route taxi and
                        its stand-ins, onStand), driveVeil, playOnce,
                        parseAccent
  motionBoot.ts         inline script that sets html[data-motion] before
                        paint, and turns scroll restoration off on the
                        home page
  useYear.ts            current year after mount (avoids hydration mismatch)
public/
  Parth-Betai-Resume.pdf  the resume (public; contains his phone number)
  resume-preview.webp     picture of the resume page for the preview (1800x2546)
  portrait.webp           Parth's cut-out photo for the hero
  portrait-depth.png      depth map for the 3D relief
  work/*.jpg              the four project photos
  art/*.svg               static drawings served as images: the hero's
                          facades (ink and blueprint prints), the Services
                          rooftops, the Journey ghat (desktop and phone)
assets/
  portrait-source.jpg   original photo the cut-out is made from (not served)
scripts/
  render-resume-preview.mjs   makes public/resume-preview.webp from the PDF
  make-portrait.mjs           makes the cut-out and depth map from the photo
  screenshots.mjs             screenshot checker used to verify every change
  make-share-image.mjs        makes the link preview card and both icons
.env.example            documents the environment variables
```

## 6. The page, section by section

The page is Parth's own **numbered set of drawing sheets**, 01 Home to 06
Contact, laid over one another like a set on a desk, and it is also **one
taxi ride**: an inked route runs down the left gutter of every sheet, from
the Home stop at the hero taxi's tail, over the Howrah Bridge, past the
service stations and the four projects, to the footer street, where the
taxi parks under a lamp at "You've arrived". The grounds in order: cream
(01), cyanotype blue (02), navy night (03), green grid paper (04), blue
(05), night (06). Yellow is only ever an object (the taxi, a lamp, a
highlighter, the route on night), never a field. The cream status strip
runs across the top the whole way and, on the home page, the bottom nav
floats at the foot of the screen.

### The sheet stack (`Sheet.tsx`, `styles/f0-base.css`, `lib/motion.ts`)
- **DOM per sheet:** an in-flow, zero-height **anchor** carrying the id
  (`home`, `about`, `services`, `work`, `journey`, `contact`; the jump
  target), then a **slot**, then the sheet's `<section>` in its ground,
  with a thin frame, four crosshair registration marks and an **index
  tab** ("01 Home" to "06 Contact", from `content.ts` `sheets`) whose
  circled number is that sheet's stop on the route. The section
  components inside never carry the sheet's id themselves.
- **Stacking (scripts on):** each sheet sticks at
  `top: min(0, 100svh - its height)` until the next sheet has covered it,
  then scrolls away. Every slot has a 100svh run-out spacer (an `::after`,
  not padding, see section 17) with `margin-bottom: -100svh`. `useSheetStick`
  measures each sheet with one shared ResizeObserver and writes `--stick`
  and `data-stick`; a sheet is only sticky once `data-stick` is set, and
  only under `html[data-motion]`. `html[data-measure]` puts every sheet
  back to relative while ScrollTrigger refreshes, so every trigger is
  measured in natural flow.
- **Without scripts** the sheets simply flow, each overlapping the one
  before by 26px with its index tab riding above that overlap.
- **The route:** a 4px inked line at the gutter (x 34px, 14px on a phone),
  navy with a 10px yellow highlighter under it on cream and paper, pale
  `bline` on blue and taxi yellow on night. It is built per sheet from
  static pieces at fixed offsets (`Route.tsx`): rails, elbows, stops, a
  spur out to each project's number (the only spurs now), stations (the
  service rows) and the terminus. On the home page a small taxi drives it
  with the scroll and the line is solid behind the taxi and
  pencil-dotted ahead (THE JOURNEY, below); on the other pages
  `driveRoute` fills it with the reading line. Both are reversible and
  clamped solid at the end of the page. Without scripts every piece is
  solid and there is no small taxi.
- **THE JOURNEY (`lib/motion.ts`, Parth's item 10):** `driveRoute(root,
  { car: true })` from `app/page.tsx` chains every rail and elbow into one
  route, once per ScrollTrigger refresh, in sheet-local natural-flow
  coordinates. A small top-down taxi (the `AMB_TOP` symbol in
  `AmbassadorDefs.tsx`, `.route-car` in `f0-base.css`, made by the script
  only) drives it with the scroll from the Home stop to the terminus, and
  the line fills to it. The schedule is a list of (scroll, distance)
  anchors read with straight lines between them, so a frame is a lookup:
  - down a gutter the taxi rides the reading line, 55% down the viewport;
  - at a change of sheet the stuck sheet carries the taxi on down its
    gutter until the next sheet's tab ring meets it, and there it changes
    sheets at the same point on the screen; from the ring it eases back to
    the reading line at no more than 1.5 and no less than 0.6 times the
    scroll;
  - the level runs are driven while they are on screen: the hero's road
    from scroll 0 at a steady rate until About's ring meets the corner,
    the bridge U-turn from its corner at 84%
    of the viewport to the bank's corner at 16%, and the last run (the
    foot corner and the kerb) from 84% (earlier where that leaves it
    less than len / 2.5 of scroll, but never before the corner is on the
    screen) to the deepest scroll, where the taxi arrives;
  - the taxi lives inside the sheet it is on, never as a fixed overlay, so
    the sheet's own sticky slide carries it.
- **Stand-ins:** on three stretches a bigger taxi drives instead: the
  hero's road, the bridge deck and the footer kerb.
  `<Rail stand="name">` marks the stretch, `data-stand-car="name"` the car,
  and `data-park` where it ends ("end", the default: nose at the rail's
  end, where the small taxi takes over again; "rest": its own CSS place,
  so the end state equals the no-JS state). `data-stand-from="rest"` is
  the other way round (the hero's road): the car starts at its CSS place,
  drives to the rail's end and scales down on its wheel line to the
  small taxi's length, centred on the line at the end, where the small
  taxi takes over. Every element with the same `data-stand-car` name moves
  together (the hero's ink print and its blueprint copy), and
  `data-stand-body` marks the box that is measured as the body. While the
  journey is on that rail the small taxi hides, the stand-in shows and
  the rail fills to its tail. `onStand(name, fn)` reports its progress (0
  to 1) for extras. The hero's big taxi is the stand-in for its road; the
  Howrah Bridge's deck taxi is the stand-in for the deck (the lamps light
  behind it through `onStand`; the sky and truss keep their own scrub);
  and on the home page the footer's big taxi is the stand-in for the kerb.
  Every slot's run-out is 100svh, the hero's too: the page scrolls from
  the first notch and the hero's drive happens in that same scroll, with
  no hold. Its path is planned again on every ScrollTrigger refresh
  against the boxes marked `data-drive-avoid` (the copy, and the copy
  line's riding tab) and About's tab, and the first plan that keeps the
  car clear of all of them wins; `heroLine.delay` holds the Exposure's
  copy line back just long enough that the car is still the ink print at
  the hand-over (THE HERO'S DRIVE in `lib/motion.ts`). Fill-only `driveRoute(root)` is still what
  the footer uses on the info pages.
- **Jumps:** every same-page hash link goes through `jumpTo` (SmoothScroll
  routes them), which lands the anchor under the strip's height (the
  root's `scroll-padding-top`) plus the anchor's 84px `scroll-margin-top`,
  so the sheet's index tab shows whole below the strip, and hands focus
  to the anchor. Lenis eases it in full motion; soft mode uses native
  smooth scrolling. Checked on every bottom-nav item, the Work index rows,
  the "Short on time?" board, the hero buttons, the index tabs and the
  footer's Get in touch at 1440 and 390.
- **The focus guard (WCAG 2.4.11):** a control in a sheet that a later
  sheet now covers can still take focus; two frames after focus the page
  scrolls it to 35% down the viewport, out from under the cover, but never
  past the point where its own sheet starts to stick (deeper than that the
  next sheet is already over it again). That cap relies on every sheet
  keeping its last 62px free of text. Keyboard focus only
  (`:focus-visible`): a mouse click is on a control already in view, and
  guarding it made a click just under the strip jump the page.

### Status strip and bottom nav (`StatusStrip.tsx`, `BottomNav.tsx`)
- **Status strip (every page):** an opaque cream strip fixed across the
  top, 40px tall (36px up to 760px) with a navy hairline, like the title
  strip along a drawing set's edge. Left: a circled "P" and "Parth Betai"
  (back to the hero on the home page, to the home page elsewhere). Centre,
  only above 1180px where a whole line fits: one line at a time from
  `strip.lines`, held 4 s and rolled up in 0.7 s, held under the pointer
  and in a hidden tab, read once as plain text by screen readers. Right:
  "You've seen N%", which becomes "You've arrived" at the very bottom and
  never shrinks. The reading uses one ScrollTrigger (0 to max) and reads
  its cached `self.end` on scroll, never the page height. Without
  JavaScript the reading is hidden (`data-js-only`). On the home page the
  strip waits behind the intro and slides down at the hand-off. It sets
  the root's `scroll-padding-top` to its own height (and a no-JS rule in
  `s2-chrome.css` sets the same 40 or 36px), so Tab and jumps never park
  anything under it.
- **Bottom nav (home page only):** a cream pill floating above the bottom
  edge with Home, About, Services, Work, Contact, and under the labels a
  dashed road with the small outlined Ambassador (30px) on it. The taxi
  parks under the section being read and drives on to the next label over
  the last quarter of each sheet. Journey has no label: Work stays lit over
  it, and Contact lights once the Contact sheet's top passes 40% of the
  viewport. It runs its **own single ScrollTrigger** (start 0, end max)
  with every sheet's natural-flow top measured at refresh, because the
  taxi needs continuous progress across each span; a scroll costs arithmetic and one transform write. It arrives at
  the hand-off, hides while a text field has focus (not a readonly one)
  and while one of the footer's text rows (marked `data-nav-avoid`)
  passes behind it, and sets
  `scroll-padding-bottom`. Without JavaScript it shows with Home lit and
  the taxi parked under it, and the footer keeps extra room at the bottom.

### Sheet 01, Home: the loader and the hero (`HomeSheet.tsx`, `Hero.tsx`, `HeroScene.tsx`, `TaxiDrawing.tsx`, `Exposure.tsx`, `HeroPortrait.tsx`)
- **The loader is the hero itself: Span closed** (Parth's pick of the
  four concepts, 17 Nov, section 16; after the old site's "Portfolio"
  loader, where the word stayed put and only the ground changed): there
  is no overlay. On the cream sheet the Howrah Bridge is erected as the
  progress (`LoaderBridge.ts`, driven by Hero.tsx): the towers rise out
  of their piers, the anchor arms and then the cantilever arms go out
  panel by panel with two creeper cranes on the tips, and the suspended
  span closes at 100%, with the readout (`.bb-read`, "Loading 050") on
  its centre line. `createSpan(hero, inkBack, name)` builds it once as
  plain DOM from measured boxes (again only on a resize, until the
  close); `frame(t, p, o)` is a function of the wall clock t (s), the
  progress p (0 to 1) and the seconds since the close o (negative
  before), and writes only transforms, opacities, dash offsets and a few
  SVG attributes, never reading layout. The geometry is the Services
  band's own: `BridgeArt.ts` exports `D` (the deck line), `topY` (the
  top chord's height at a point) and `panels` (the panel points), and
  the loader draws in those art units, so the band itself is unchanged.
  **The fit:** the scale is at most 0.76 of the art scale, the towers
  stay 20px clear of the name, and the whole bridge fits the sheet from
  the left anchor pier to the small taxi waiting past the barrier. Held
  upright (phone, tablet) the bridge would stand far under the name, so
  its deck is raised to just under it, the river and its bed (the
  Hooghly) fill below, and the push pans down to the kerb.
  **The name is craned in.** The h1 keeps React's text, which the CSS
  paints as the plan (transparent, a 1px outline at 32% ink) from the
  first paint, so the hand-over at hydration cannot be seen. The letters
  are an overlay inside the h1 (`.bb-name`, on the h1's own layer), one
  span per character on its measured origin (a Range per character, the
  baseline from a zero box), measured again on a resize and once the
  fonts are in. As the progress reaches letter i (p 0.02 + 0.78 i / 9,
  so the last at the 0.8 hold) a cable lowers it from above the sheet
  with a small brick girder on it: it comes down in red primer over
  0.34s, braking, swings a little (gone by 0.56s), gives a small bounce
  on landing, two rivets go in red-hot under it and cool, it is painted
  navy by 0.3s after landing and the cable runs back up. Line 2 is
  lowered behind line 1. Each line's shade steps in once its last letter
  is down (`data-sh` 0 to 9 on the line span, step 9 being
  `--shade-hero`). Births use the wall clock, like the rivets, and every
  letter is still, navy and fully shaded by 0.64s after its birth,
  before the hand-back at o 0.42 even on a fast load; there the overlay
  goes and the plain text paints the same pixels (0 differing at 390;
  at 1440 only the pushing bridge differs). It plays in soft mode too. The h1 has
  `aria-label={identity.fullName}`, so the letters are never read out.
  **The hold:** `MORPH_MS` 1300, so the build reaches 80% in 1.04s and
  holds there until the fonts (`document.fonts.ready`) and the portrait
  are ready; the last 20% then takes 0.26s. After `BAIL_MS` (6000ms) it
  stops waiting on them for good (readiness is one-way, so a portrait
  answer landing after that cannot start the wait again), and a timer at `BAIL_MS + 2500` starts the
  outro even if rAF never ran (a tab opened in the background). The
  tick is wall-clock, its step capped at 250ms and floored at 0 (a busy
  first frame could run it backwards).
  **The outro** (`OUTRO`, 2.3s, built through the context's `self.add`
  so its selectors stay inside the hero and `ctx.revert()` kills it on
  unmount): a brick SPAN CLOSED stamp lands, the barrier lifts and the
  small waiting taxi (the hero's own `[data-intro-car]`, scaled down)
  drives across; from o 0.36 to 1.16 the view pushes in on its nose
  until it is the big hero taxi at its rest position, the bridge fading
  out as the zoom passes 2.2 to 5.5. Round the name: the memorial comes
  up (0.56), Parth rises from behind the kerb under a clip (0.62),
  `onDone` hands off (0.9), the railing is planted up from the kerb
  (0.92), the ribbon settles from above (0.95), the rest of the copy
  rises (1.03), and the dimension line and the hero's route pieces fade
  in (1.1). At 2.3 the bridge is removed. The near bridge (`.bb`) and
  the far-side truss (`.bb-far`, scaled a little less for depth) are
  their own compositor layers for their short life, so the push moves a
  texture and never repaints the sheet.
  **Held back** (`s1-hero.css`, only under `html[data-motion]`, until
  Hero.tsx sets `data-landed`): the finished memorial, the dimension
  line, the railing, the hero's route pieces and the route taxi, the
  hero taxi until `data-span` (set once the loader has placed it small
  by the barrier), and in full motion every sheet after the hero, so the
  next sheet's tab never shows, vanishes at hydration and comes back.
  The facades, frame, marks and grid show from the first paint. While
  `.hero[data-span]` is up, `lib/motion.ts` holds any whole-page
  ScrollTrigger refresh (a measure would stall the build), and the hero
  drive's parked-car measure clears the intro box's transform too, so
  its plan is right even while the loader holds the car small. The
  blueprint print needs nothing: it sits under the Exposure line, which
  the scroll lock keeps at rest. **Soft mode plays it** (the OS asking
  for reduced motion, as Parth's own PC does). Without JavaScript there is no loader: the boot
  script never sets `data-motion`, and the bridge and readout are made
  by script. The page stays scroll-locked and pinned to the top until
  the hand-off (`onDone`): Back into the home page used to restore the
  old position under the lock and leave a blank screen (scroll
  restoration is off on the home page from the boot script, and a
  scroll listener holds y 0).
- **The hero:** cream with a navy 24px dot grid and an inner index tab
  under the strip. The copy (normal flow): the brick "Portfolio" ribbon,
  "Parth Betai" sign-painted in navy with a stepped brick shade
  (`--shade-hero`), "Software Developer & Robotics Engineer" under a
  highlighter swipe (it breaks only after "&": non-breaking spaces
  elsewhere and `.h-role` max-width 14em, with `box-decoration-break:
  clone` so each line gets its own swipe), the billing line, and the
  Contact and Selected work buttons. The art is one
  980 x 830 design box sized by `--u` and anchored bottom right: the
  facades (public/art), the Victoria Memorial behind Parth, Parth leaning on
  the Strand Road cast-iron railing (the relief), the 640-unit taxi at the
  kerb facing left with the mini humanoid on its roof rack, and a
  dimension line from "Kolkata, India" to "Jaipur, India" (HTML Kalam
  labels). The note "also builds robots" was removed in the fourteenth
  round (item 1). The route starts at the Home stop just behind the
  taxi's tail (its right end), runs along the road under the taxi to the
  corner, and "Home" is written right of the ring. **The scroll drives
  the big taxi off** to the left (item 3), shrinking with the distance
  until at the corner it is the small route taxi (the "road" stand-in,
  above); on a phone the road and the corner show too. On a phone the
  copy is tighter.
- **The copy is above the street.** The hero is eight layers: ink back
  (the street behind Parth), blueprint back, the portrait canvas, ink
  front (railing, taxi, robot), blueprint front, the ink copy
  (`.h-ink-copy`, z 8), the blueprint copy (`.h-bp-copy`, z 9) and the
  copy line (z 9, later in the markup). So the big taxi, while the scroll
  drives it, passes behind the role, the billing and the buttons, still
  in front of the portrait (the copy and the portrait never overlap).
  The ink copy sits in `InkMask`, the blueprint mask turned upside down,
  so it shows only above the copy line; its outline button is made
  solid at the colour it shows on the cream, so the taxi is hidden by it
  rather than seen through its label. Everything stays inside the hero,
  so the pin-wall contract is untouched.
- **The Victoria Memorial** (Parth's item 9; it replaced the halftone sun)
  is `Memorial` in `HeroScene.tsx`, an inline SVG frontal elevation in a
  600 x 620 box: the dome with its ribs and a yellow halftone shade on
  its right flank, the lantern, the Angel of Victory on her ball, the two
  front chhatris, the portico with paired columns and the sculpture
  group, the wings, the end pavilions with their cupolas, the plinth and
  the steps, all on a yellow halftone disc. Inks: cream-2 marble, a navy
  `#0e1332` keyline in non-scaling strokes (1.5px, 1.1px on a phone) and
  the yellow halftone; the blueprint print draws it in pale line. The
  dome is drawn a little wider than the real one so it reads round his
  head. `.h-vm`: on desktop left 384u, top 10u (30u on short laptops),
  600 x 620u; on a phone right -26px, top 441px, 244 x 252px.
- **The Exposure (01 to 02):** as About slides up, a cream copy line runs
  up the hero ahead of it, and everything below the line is the blueprint
  print of the same drawing (the blue grid, the name in pale line, the
  taxi as linework, the railing in outline, the portrait as a blue
  duotone). No pin and no added scroll length: the line is driven by
  About's own slide and reaches the hero's top when About is half way up.
  The eight layers (above) are only ever moved by transforms; positions
  are read once per ScrollTrigger refresh. The relief splits itself in its
  shaders (`uEdge`) and renders on `gsap.ticker`, so the split lands in
  the same frame as the CSS masks. The flat fallback's mask uses heights
  cached by a ResizeObserver, never measured in the scrub. Its idle tilt
  stops while About covers the hero.
- **The portrait** (`HeroPortrait.tsx`) is the 3D relief of
  `public/portrait.webp` pushed by `public/portrait-depth.png`. Both are
  decoded off the main thread as ImageBitmaps (flipped at decode); the
  photo is then premultiplied in one GPU pass with integer rounding, so
  the texture is byte for byte what the old `<img>` upload gave (Chrome's
  own bitmap premultiply rounds a step darker on the soft rim). Safari
  before 17 and Firefox before 98 keep the `<img>` loader. `usePortrait`
  starts fetching `HeroPortrait`'s code with the photo probe. On software
  rendering or without WebGL it falls back to the flat cut-out
  (`?portrait=flat` forces that); without the photo files the chrome orb
  (`HeroOrb.tsx`) returns.
- **Size:** the name is `min(186px, 20.6vh, 13vw, 29.4vh - 80px)`, 88px
  on a phone; the hero is 100svh (min 600px), and on a phone
  `max(844px, 100svh)`. On short desktop screens (820px tall and under,
  wider than 760px: a laptop with browser bars, or at 125% and 150%) the
  copy sets tighter so the big taxi has room to drive under the buttons
  instead of popping small in one notch: the copy's top padding is
  100px, the name `min(186px, 13.5vh, 13vw)` (11.5vh at 640px tall and
  under), the role `clamp(24px, 2.4vw, 34px)`, the billing 16.5px, with
  tighter gaps, and the memorial drops 30 units so the angel clears the
  status strip.
- **Without JavaScript** the hero shows everything in its final place with
  the loader readout hidden.

### Sheet 02, About (`AboutSheet.tsx`, `Intro.tsx`, `FactsTicket.tsx`, `ResumeDisk.tsx`, `TramBand.tsx`, `Marquee.tsx`)
- **Intro:** "Intro" and the paragraph (`intro.body`) on the left; on the
  right the ticket and the floppy with its note. From 1023px down it is
  one column: the ticket (at most 560px wide), then the floppy.
- **The ticket ("The short version"):** cream card stock tipped -1.4
  degrees, the title in brick and the name across the top, four cells two
  by two (Primary and Secondary work location, Status, Available to work
  as) and a stub past a dashed tear line with a punched hole and the
  one-ink taxi. The roles roll one at a time on a marker band; the roller
  sits in a one-cell grid with an invisible sizer for every role, so it
  never resizes the ticket, and it holds while the pointer rests on it and
  while off screen. Without JavaScript every role is listed and the last
  row's cells take the full width. From 1024 to 1279px the stub narrows to
  84px and the values drop to 15.5px (and below 1181px the copy column
  gives up a little width), so "Undergraduate," never runs into the next
  cell. One column on a phone.
- **The floppy** (`ResumeDisk.tsx`; thirteenth round item 5, then
  fourteenth round item 4: the old detail circle did not make it stand
  out) sits **half out of a cream paper sleeve** in the ticket's stock: a
  back panel showing either side of the disk and casting the shadow, and
  a front panel with a thumb notch whose opening sits just under the name
  on the label. "Resume" is printed on the sleeve under a yellow
  highlighter with `resume.size` in mono beside it; at 380px and below
  only "Resume" is printed. Both panels are ResumeDisk's `under` and
  `over` props, drawn inside the link, so the whole sleeve is clickable,
  and the empty sleeve stays behind while the preview has the disk. Its
  note "my resume's on this floppy" hangs on a leader that starts at the
  disk's right edge (`--hook`, 0.155 of `--S`); the leader is drawn out
  once, then the note is written in once. The sizes are CSS variables on
  `.about .disk`: `--S` (the box) is 220 to 264px from 1280 to 1440px and
  up, 212px at 1024 to 1279, 240px at 761 to 1023, 168px on phones and
  152px at 380 and below; `--disk` is 0.7 of `--S` (148px at 1024 to
  1279, 168px at 761 to 1023, 118px on phones, 106px at 380 and below)
  and `--lead` (the leader's run) scales with it. The disk is turned
  -7deg plus a -5% shift (`.sl-turn`) and the sleeve sits 4deg off that
  angle. The focus ring goes round the disk and sleeve together
  (`a::after`, pale on blue). The "Click/Tap to preview" hint shows at
  rest on a mouse too, as a caption under the box. Hover or focus no
  longer raises a circle; the disk still lifts and opens its shutter.
  The preview is unchanged (the disc-opening preview, Download PDF, Open
  in new tab, Zoom, Close; Ctrl or middle click downloads).
- **"In numbers" is gone** (Parth's item 6), with `Numbers.tsx`,
  `DetailViews.tsx`, `FareMeter.tsx`, `notes.numbers`,
  `intro.numbersTitle` and `intro.numbers`.
- **The tram band and the stack rows:** a Kolkata two-car tram on its
  catenary wires (destination dome "Stack") slides about 420px as the band
  crosses the screen (a reversible scrub; at rest it stands centred). Under
  it the four rows (Stack, Intelligent systems, Hardware, Learning), each
  headed by a teal enamel tin with a chrome rim. The drift is pure CSS;
  JavaScript only adjusts it: a **pause button** stops every row (WCAG
  2.2.2), hover eases them to a quarter speed, they pause off screen, and
  in full motion only, scroll speed surges them. The heading and the
  pause labels come from `stackLabels` in `content.ts`.

### Sheet 03, Services (`ServicesSheet.tsx`, `BridgeBand.tsx`, `ShortOnTimeBoard.tsx`, `Services.tsx`, `ServicePlotter.tsx`)
- **The bridge crossing:** the head of the sheet, `max(270px, 24.8vw)`
  tall. As Services slides up over About the taxi crosses the drawn Howrah
  Bridge and the sky cross-fades from day through dusk to night, the
  lamps lighting behind the taxi. The route comes down the gutter, runs
  along the deck behind the taxi, turns down the right side, comes back
  along the Strand bank and carries on down the gutter. Since the
  thirteenth round the deck taxi is the journey's stand-in (Stand-ins,
  above): the small route taxi hands over to it at the deck's corner, it
  drives the deck with the scroll while the deck fills to its tail, and
  the small taxi takes over again at the far corner. The lamps follow it
  through `onStand`; only the sky and the truss keep the band's own
  scrub. Only box opacity and transforms are written. At rest and
  without scripts it is dusk with the taxi at 62%.
- **"What I can do"** in weight contrast with its handwritten line, and
  beside it the teal enamel **"Short on time?"** board, sign-painted with
  `--shade-board`, a plain link to the Work sheet.
- **The seven rows** hang on the route like stations on a line: a yellow
  station ring per row (filled for the open one), the number, an icon,
  the title (line height 1.55, matching the drawings), and the panel with
  its points and paragraph. Without JavaScript every panel is open and
  every station filled. The panels have no `role="region"` (seven
  landmarks open at once would be noise).
- **The plotter** (from 1024px sticky beside the list, 761 to 1023px under
  it, not shown on a phone): one technical drawing per service plotted
  live by a pen in cream line, a handwritten legend naming the balloons,
  and a title block of two ruled rows: TITLE (the service name) and NOTE
  (the service's fifth point, the one no balloon points at, so the card
  carries the whole list once). Parth's name and the 01 / 07 counter were
  removed in the fourteenth round (item 5); the row already shows its
  number. The block is a constant 84px at every width; 1024 to 1180px
  tightens its padding so the longest note stays on one line. It is
  aria-hidden; the rows are the only controls. What it draws: the row
  under the mouse, else the one with keyboard focus, else the clicked
  open row; with none of those, from 1024px it draws the row level with
  it as you scroll. Row 01's starting open state does not hold it
  (`picked` in `Services.tsx`), only a click does.
- **The rooftops** (public/art/rooftops.svg) close the sheet, and the
  Services **veil** (the sheet's dark wash) is what PasteUp darkens as
  Work covers it.

### Sheet 04, Work (`WorkSheet.tsx`, `PasteUp.tsx`, `Work.tsx`, `drawings/`, `Stamp.tsx`, `Medal.tsx`)
- **The paste-up:** the green grid-paper sheet arrives like a poster going
  up: its torn (deckle) top edge is the seam, and with scripts a roll of
  fresh paper and wet paste streaks ride that edge (a child of the sheet,
  so it rides the sheet's own sticky slide). The scrub writes only the
  paste-up's opacity and the Services veil (0 to 20%). The paint brush
  that used to ride it was removed at Parth's request (item 7). Without
  scripts the paste-up is not rendered; the deckle carries the idea.
- **The heading** "Selected work" with the blurb and a four-row index
  (each row jumps to its project).
- **Each project** hangs off the route: a spur to its numbered stop with
  the kind in the hand (Mobile, Robotics, Embedded, Hardware: `route.stops`),
  the title in weight contrast, the badge as a highlighter swipe (the
  humanoid's first place gets the medal instead), the body, the tags,
  and a print of the build held down with kraft tape. On the right, a
  **drawing plate**: the build as a technical drawing with numbered
  balloons and leader lines, and every word in HTML (the legend, the red
  callout, the payload card, the note). Projects are split by a dashed
  cutting line with a registration mark at its centre and no lettered
  ends: the "A" at each end (Parth's item 11) was a drafting section-cut
  mark pointing to section views the site does not have, and every
  divider repeated A.
- **Stamps** only where there is a real verdict: the humanoid ("ROBOTICS
  1ST PLACE IIT HYDERABAD") and the EV model ("EXHIBITED TWICE" round a
  drawn star). The worn ink is a fixed mask, the multiply blend and the
  tilt live on a static holder. **All four drawings carry a handwritten
  note** (the approved plan).
- **Motion, once each** at the reading line (`playOnce`): the drawing
  fades up and its leader lines draw on from that drawing's own trigger,
  the print drops and settles, the stamp presses, the notes appear. The
  markup is the final state, so without JavaScript (and after cleanup)
  the leaders are whole lines.
- **Phone details:** the SOS plate's svg (`.dw-sos`) trims the viewBox's
  spare room with negative margins in percent; balloon sizes come in
  three steps (desktop, 561 to 1366px, 560px and under) so the numerals
  stay at least 14px.

### Sheet 05, Journey (`JourneySheet.tsx`, `Ventures.tsx`)
- Blueprint blue, sliding over the grid paper behind its own cream copy
  line (ticks and two crosshairs), the Exposure in miniature.
- "Founder journey" and the blurb, then **the ghat**: a landing with a
  colonnade, nine treads down to the water and two country boats moored
  at it, one per venture (public/art/ghat.svg, ghat-m.svg on a phone).
  The boats' tags (name, role and period) and `notes.journey` on the water
  are HTML; on desktop the tags hang over the boats on leaders, on a phone
  they sit in a row above the drawing (row layout from 1240px down).
- **The railway timeline:** Psquare Online's line runs to its buffer, the
  turnout carries the route across ("Pivoted to Afferex") and Afferex's
  line runs on and fades, over 2024 to 2026. Then the two ventures as
  title blocks ("Wrapped up", name, kind, text, three facts).

### Sheet 06, Contact and the footer street (`ContactSheet.tsx`, `Contact.tsx`, `PhoneChat.tsx`, `PinField.tsx`, `Footer.tsx`, `HangingSign.tsx`, `NightStreet.tsx`)
- **The pin-wall contract:** this sheet, its slot, `<main>` and every
  ancestor of the fixed pin wall carry **no transform, filter,
  will-change, contain or content-visibility**, ever. The wall
  (`data-pin-wall`) is `position: fixed` and would otherwise be pinned to
  them. `canTransform()` and `driveVeil()` in `lib/motion.ts` refuse to
  touch it. Nothing covers Contact, so it has no veil.
- **Get in touch:** the heading, blurb and email on the left;
  the CSS-3D phone running the chat-shaped contact form on the right, over
  the WebGL pin wall (set up at idle time, about seven seconds after load,
  drawing only on screen). The chat, its fallback and the no-JS finished
  conversation are as before (see section 12). In a production build the
  wall's renderer skips three's shader-log check
  (`renderer.debug.checkShaderErrors`), which stalls the first draw and
  prints harmless D3D precision notes on Windows.
- **The phone is staged as the sheet's call to action** (Parth's item 8;
  the lantern of the thirteenth and fourteenth rounds was removed in the
  fifteenth): a printed speech balloon (`.ct-balloon` in `Contact.tsx`
  and `s6-contact.css`), the hero's yellow halftone disc drawn out into
  a balloon, stands behind it. Its round rises 30px (`--peek`) above the
  phone's head the way the disc rises behind Parth's, and its tail
  sweeps out to the lower left toward the copy. It is one outline in
  cream with the acid-yellow dots printed over it once, static paint
  between the pin wall's window and the phone (a sibling of the window,
  never an ancestor), at most the column's width so it never reaches
  the route, and shown at every width. In motion it is printed in once
  as the phone comes up (`playOnce` at 0.8: it turns and grows into
  place), a beat before the label; without scripts it is simply there.
  The phone has a crisp cream keyline, a top light and a deep cast
  shadow down and to the left onto the balloon, and no halo; the box has
  a firmer navy edge while Parth waits for an answer. **The inbox note is the message
  box's label** (fourteenth round, item 6): "it really does land in my
  inbox" moved from under the email into `.ct-phone`. In two columns it
  sits on the box's centre line (`--inb` in `s6-contact.css`) with a
  short yellow hand arrow (`.ct-point-side`) from its last word to the
  field; in one column (1023px and narrower) it sits under the phone with
  an upward arrow (`.ct-point-under`), and `.ct-phone` has a 44px (56px
  on a phone) bottom margin for it. Only the arrow on show is drawn on,
  and the note fires on the arrow's own line (`playOnce` at 0.95), so the
  label never comes in after its arrow. The
  phone's width is one CSS variable, `--phw` on `.ct-phone` (80svh in two
  columns, at most 372px), and its height `--phh`; the balloon and the
  arrow are sized from them.
- **The footer street** (every page): the hanging enamel sign (teal,
  "Parth" painted in cream with `--shade-sign`, the role
  (`identity.role`), and the cream sub-board "Let's build something")
  drops in from behind its bar and swings once, scrubbed as the bar comes
  up the screen (on a page where it is already on screen it plays once by
  itself). Then the night street with the cast-iron lamp, where the route
  ends in its terminus ring and "You've arrived", and the taxi parked
  under the lamp. Over the street: `notes.signoff`, the email, the line
  about what Parth is open to and Get in touch. Under it the drawing's
  **title block** and the legal line. Both moving pieces are siblings of
  the pin wall. Without scripts both are simply where they end up.
- **The arrival hand-off (home page, Parth's item 10):** the footer taxi
  is the journey's stand-in for the kerb: `<Rail stand="kerb">` and
  `.ftaxi` with `data-stand-car="kerb"` and `data-park="rest"`, both only
  when the pathname is "/". The small route taxi comes round the foot
  corner and hands over at the kerb's start; the big taxi drives the kerb
  with the scroll (the line fills to its tail) and parks at its CSS place
  at the deepest scroll, so there is one taxi at every scroll position.
  Footer.tsx never writes its transform or visibility; the journey does.
  "You've arrived" is written in (opacity, via `onStand("kerb")`) over
  the last 14% of the kerb (`ARRIVE`), fully there when the taxi stops
  and gone if you scroll back; without scripts, on the other pages and at
  rest it is simply there. `.ftaxi`'s left is the ring's centre plus its
  radius plus a gap (`calc(67.6cqw + 22px)` on desktop, `calc(21.5cqw +
  19px)` on a phone), so its tail is 10px (8px on a phone) past the ring
  at every width; z-index 6, so it drives over the ring. On the phone the
  label sits under the kerb from the gutter, as on desktop.
- **On the info pages and the 404** the footer taxi is simply parked and
  the route pieces fill with the reading line (fill-only `driveRoute`).
  The old 420px drive-in tween is gone everywhere: on a page whose street
  was on screen at load it left the taxi 420px short.
- **The title block** (Parth's items 1 and 2): four cells ruled by the
  grid's 1px gaps: name and role, the two work locations, and
  **Connections**, a label like the other cells' with the GitHub,
  LinkedIn, Instagram and X logos under it (`SocialIcon.tsx`), each a
  44px link named by its label (`aria-label`, a title tooltip and a
  shared "opens in a new tab" description). Four across on desktop, two
  by two from 761 to 1023px, then name / the two locations / Connections
  on a phone. The "06 / 06" sheet number and its small taxi are gone.

### Everywhere
- **Cursor (`Cursor.tsx`):** the engineering reticle, as before (corner
  brackets, a centre dot on the pointer, a coordinate readout, one-word
  labels when it locks onto a control). **No blend mode any more:** it
  reads the first solid background under the pointer (rgb, `color()` or
  `oklab`), or falls back to the nearest `data-ground`, and draws navy on
  the light grounds (cream, paper, the strip, the nav, cream buttons) and
  cream on the dark ones. The scroll-driven hit-test is throttled (it was
  over a tenth of a throttled hero scroll).
- **Focus and selection per ground:** the ring takes `var(--focus)` from
  the nearest ground: navy on cream and paper, pale blue on blue, taxi
  yellow on night (the fallback for anything unmarked). A nested light or
  dark surface marks itself with `data-ground`. A sheet that a jump hands
  focus to (`tabindex="-1"`) shows no ring. The skip link is a night pill
  with nline text.
- **Grain:** one tiling noise layer recoloured navy, alpha from the noise,
  **no blend mode** (a blended fixed layer recomposites everything under
  it on every scroll), stepping six times every few seconds.
- **Page changes (`RouteProgress.tsx`):** a cream sheet with the one-ink
  taxi driving along the kerb and the road inking in behind it, only when
  a change takes longer than 160 ms.
- **Smooth scroll (`SmoothScroll.tsx`):** Lenis in full motion, native in
  soft; scroll keys are routed through it, and every same-page hash link
  goes through `jumpTo` unless a component's own handler already handled
  it.
- **Link previews and search:** the card (`app/opengraph-image.jpg`) is
  Sheet 01 in miniature: the cream drafting sheet with its frame and
  registration marks, the brick ribbon, the name in the hero's shade, the
  role on two lines ("Software Developer &" over "Robotics Engineer"),
  each on its own highlighter swipe, and the taxi on the kerb with its front
  half exposed as the blueprint copy. The favicon and the iPhone icon are
  the colour taxi with a cream roof rack on a navy tile. `themeColor` is
  the cream of the strip. Per-page titles, canonical links and the
  schema.org `Person` data are as before (`pageMeta()`, `SITE_URL` in
  `lib/site.ts`).

## 7. The other pages

`/privacy`, `/terms`, `/cookies`, `/accessibility`, `/credits`, all using
`LegalPage.tsx` and the shared footer, plus a styled 404. Written in plain words
and accurate to the code, but not reviewed by a lawyer.

Since the twelfth round they are sheets of the same drawing set: one cream
sheet with its index tab reading "Legal" (`legal.tabLabel`) under the
status strip, a "Back to home" link, navy ink throughout (11.3:1 for the
body, 5.7:1 for the date), links underlined so they never depend on colour
alone, and then the same night footer sheet that ends the home page,
sliding over it. The prose is a Server Component; only the sheets'
stickiness and the footer's motion are scripted. The 404 is one night
sheet: a plain "404" in the heading face, the yellow taxi turned round on
a short road of its own (it rolls in once through CSS `@starting-style`,
no script), "Took a wrong turn." and a cream "Back to home" button, then
the footer.

The Accessibility page was brought up to date on 12 Oct: the focus outline
is described per sheet (navy on cream and paper, pale blue on blue, taxi
yellow on night) with the guard that brings a covered link back into view;
the tech stack's pause button is listed, and the old limitation that the
rows could not be stopped was removed; the heading limitation now says the
headings are set at fixed sizes. The Credits page lists the three fonts in
use (Archivo, Kalam, JetBrains Mono), all under the SIL Open Font License
1.1.

Key facts they state:

- No cookies, no analytics, no trackers, no local storage. (An old Motion button
  saved `motion=off` in local storage; the boot script now deletes that key.)
- All fonts, photos and the PDF are served from the site itself.
- The contact chat sends the four answers to the site's server, which emails
  them via **Resend**; the site keeps no copy. The IP address is kept in memory
  briefly for rate limiting only.
- Photos and the portrait are Parth's own. Fonts are under the SIL OFL.
- `legal.updated` in `content.ts` is the "last updated" date on all of them
  (12 October 2026 since the twelfth round, when the Accessibility and
  Credits pages changed; the thirteenth round changed no policy page);
  change it whenever a policy page changes.

## 8. Content: lib/content.ts

Almost all copy lives here, and components should hardcode nothing beyond
tiny UI labels. The known exceptions: the share image's lines are drawn by
`scripts/make-share-image.mjs` (it reads the name, role and ribbon from
here), and each policy page's text is in its own `app/*/page.tsx` (only
`legal.updated` and `legal.tabLabel` come from here). Exports:
`identity`, `resume`, `nav`, `sheets` (the six sheets' numbers, labels and
anchor ids), `strip` (the status strip's name, its "You've seen" label,
"You've arrived" and its one-liners), `notFound`, `notes` (the handwritten
margin notes: `resume`, `journey`, `contact`, `signoff`; `notes.hero`
and `hero.note` were removed in the fourteenth round), `hero` (ribbon,
billing line, the dimension line's two places), `route` (the route's stop names: Home, then the four projects'
kinds), `socials`, `intro` (the paragraph, the ticket's facts and the
roles it rolls), `stacks`, `stackLabels` (the stack's sr-only heading and
the pause button's two labels), `services` (with the heading's handwritten
`note` and the board's `shortcut`; the plotter's legend is each service's
first four `points` and its title block's NOTE the fifth), `work` (each
project can carry a `drawing`:
legend lines, an optional red callout, payload card, stamp and note),
`ventures` (with `timeline`, `boatTags` and `note`), `contact` (including
every chat line in `contact.chat`), `legal`, `footer` (the signboard's
words and the title block's cells, the last one `{ socials: true, dt:
"Connections" }`) and `meta` (the page title is built from the name and
`identity.role`). Wrap one word in
`*asterisks*` in a heading or title to make it the light word of the
weight contrast.

Every one-liner, note, number, drawing label and stamp must be true and in
Parth's voice, and every drawing label restates a fact the project's body
or badge already gives. Stamp only a real verdict (a placing, an
exhibition), and use only counted numbers ("+" means "at least").

## 9. Design system

The theme is **The Drawing Set, Kolkata edition** (approved by Parth on
5 Oct 2026, replacing the yellow-and-black "Kolkata taxi" of 30 Sep): his
own numbered set of drawing sheets in Kolkata's colours, laid over one
another on a desk, with one inked taxi route running down it. Three
directions were combined at his request: A, the drawing set as the spine
(sheets, frames, registration marks, index tabs, cyanotype); B, the taxi
route and the Kolkata scenes (the street, the Howrah Bridge, the tram, the
ghat, the night street); C, the painted objects (sign-painted lettering,
enamel boards, rubber stamps, the taxi itself). **Navy replaced black
everywhere** (approved).

- **Colours** (`@theme static` in `app/globals.css`; short aliases such as
  `--cream`, `--taxi` and `--brick` in `styles/f0-base.css` point at them;
  ratios computed from the hex values):
  - **Grounds:** cream `#f3eee3` (Sheet 01, the strip, the info pages),
    cyanotype blue `#1a3a7c` (02 About, 05 Journey, the Exposure's copy),
    night `#141a3d` (03 Services, 06 Contact), grid paper `#e7eee0`
    (04 Work, the deckle), night-deep `#0e1332` (the footer street,
    keylines on painted pieces, and the page behind the sheets).
  - **Ink on the light grounds:** ink `#1d2a6e`, the taxi's "No Refusal"
    navy (11.3:1 on cream, 11.0:1 on paper; it was black `#0b0b0a`);
    ink-deep `#131a4a` for display type (14.2:1); muted `#4f5a8c` for
    secondary text (5.7:1 on cream, 5.6:1 on paper).
  - **On blue:** bline `#e2ebff` (9.1:1) and bline-2 `#b3c3ea` (6.1:1).
    **On night:** nline `#efe7d6` (13.7:1) and nline-2 `#bfc3da` (9.7:1).
  - **Surfaces:** cream-2 `#fbf8f0` (the nav pill, inner tabs, the phone
    screen), card `#f8f3e7` (the ticket), paper-2 `#dde6d4` (mounts on the
    grid paper).
  - **Objects only:** taxi yellow, still the `acid` token `#f6c400` (the
    taxi and the route taxi, the Victoria Memorial's halftone disc and
    dome shade, lit lamps and windows, highlighters, the route and the
    focus ring on night, the medal's "1st", the service stations, the
    hand arrow to the phone's message box, the Connections logos on
    hover); brick, the `stamp`
    token `#b42f1f` (5.3:1 on paper; the sign-painter's shade, the ribbon,
    rubber stamps, the red callouts, tail lamps); teal
    `#0f4a47`, painted enamel only (the footer sign, the "Short on time?"
    board, the stack tins); chrome `#c9c9cf` (bumpers, hubs, rails, rims,
    chains).
- **Colour rules:** yellow is never a field, a stripe or text on cream or
  paper. Teal is enamel only. Brick is used at full strength only (a paler
  brick drops under 4.5:1). Grounds meet as sheets sliding over one
  another, never as fades or hazard bands. **No glows and no blinking or
  pulsing lights.** The phone is staged, not glowing: since the
  fifteenth round a printed halftone balloon behind it and a cast shadow
  on it, neither lit nor pulsing. No live SVG filters and no animated blur
  or backdrop-filter on big areas.
- **Grounds as classes:** `.g-cream`, `.g-blue`, `.g-night`, `.g-paper`
  (Sheet.tsx applies `g-${ground}`). Each sets `--g` (its colour), `--ri`
  (the route's ink), `--rh` (the route's highlighter, light grounds only)
  and `--focus` (the focus ring), plus its text colour and printed texture
  (the cream's dot grid, the blue's 24/120px grid with a vignette, the
  night's faint dots, the paper's 16/80px grid). `::selection` is set per
  ground too.
- **Type** (no new fonts; Archivo, Kalam, JetBrains Mono, all self-hosted):
  - `.t-head`: Archivo 800, width 92, tracking -0.045em, leading 0.86,
    title case, for the sheet headings.
  - `.wc`: weight contrast on three headings and the project titles, the
    bold word in `<b>` (800) and the light one in `<span>` (280): "What I
    / can do", "Selected / work", "Founder / journey".
  - `.painted`: sign-painted lettering in exactly three places on the home
    page, each with its own stepped shade: the hero name (`--shade-hero`,
    two cream keyline steps and seven brick steps), the "Short on time?"
    board (`--shade-board`) and the footer sign (`--shade-sign`); the
    loader steps the hero's own shade in (`data-sh`) and the blueprint
    name uses `--shade-bphero`.
    The 404 uses plain `.t-head`.
  - Body: Archivo 400 at 17 to 20px, leading 1.55 to 1.62. Labels:
    Archivo 600 to 750 at 13.5 to 16.5px, sentence case.
  - `.hand`: Kalam 400 for margin notes, stop labels, drawing legends,
    dimension labels and the sign-off, never under 16px and never for
    anything a visitor needs in order to use the site.
  - `.mono`: JetBrains Mono, only in the plotter's title block (its
    TITLE and NOTE captions), on the floppy's label and the file size
    printed on its sleeve, and in the cursor's readout.
  - `.hl` and `.hlm`: the highlighter swipe and the marker band.
  - Minimums measured: HTML information text 13px, Kalam 16px, drawing
    balloon numerals 14px on a phone.
- **Materials and pieces:** `.btn` (`.solid` navy, `.line` outlined,
  `.cream` on night; line height 1.55, as in the drawings), the sheet's
  frame, `RegMark` crosshairs and index tabs (`.sheet-tab`, `.is-inner` for
  the hero's tab under the strip), `.veil` (an outgoing sheet's wash, never
  on Contact), `.deckle` (the torn top edge of a pasted-up sheet), kraft
  tape on the prints, the round rubber stamp with a fixed worn-ink mask,
  the enamel boards and tins, the floppy's paper sleeve (thumb-notched
  front panel, highlighted "Resume", leader to its note), the Contact
  speech balloon (the hero's halftone disc as a balloon), and the Ambassador in four
  prints (`Ambassador.tsx`: `color`, `outline`, `ink`, `line`, plus
  `flip`, `rack`, `shadow`; its detailed symbols are drawn once in the
  root layout by `AmbassadorDefs.tsx`, with ids prefixed `taxi-`), plus
  the top-down `AMB_TOP` that the route taxi uses.
- **Static art:** decorative drawings are server markup or self-hosted
  `.svg` files in `public/art`, with fixed node budgets; nothing decorative
  is rebuilt at runtime.
- **Accessibility floor:** AA contrast for all text (pairs above), a
  visible ring on every ground, decorative SVG `aria-hidden`, every
  information label in HTML (13px or more, 14px or more for drawing labels
  on a phone), the stack's pause control.

## 10. Motion policy

`lib/motion.ts` decides one of two levels on load and `lib/motionBoot.ts` sets
`html[data-motion]` before first paint:

- **full:** everything, including Lenis smooth-scroll inertia and effects driven
  by scroll velocity (the stack rows' surge).
- **soft:** when the OS asks for reduced motion. It must look **identical at
  rest** to full and move the same, except scroll inertia and velocity-driven
  effects. This matters because Parth's own PC has Windows animations off, so
  soft is what he sees. Every scroll-linked piece uses `scrub()`, which is
  `true` (locked to the scroll) in soft and 0.6 s of smoothing in full, so
  soft mode never loses a transition, it only stops easing behind the
  scroll.
- There is no "off" level any more: the footer toggle that set it is gone, and
  `reduced()`, its CSS and its code paths went with it.
- **If the page script never runs** (a chunk fails to load), no sheet ever
  gets `data-stick`, so the boot script removes `data-motion` 8 s after
  the load event and the page falls back to the no-JS layout rather than
  staying hidden behind an intro that never plays.
- **Scroll-linked pieces** (all reversible, all transforms or opacity only,
  all measured once per ScrollTrigger refresh in natural flow and never per
  frame): the sticky sheets themselves (CSS), the route and its taxi
  (`driveRoute`'s journey, with the hero's big taxi, the bridge's deck
  taxi and the footer's taxi as stand-ins, and "You've arrived" written
  in through `onStand`),
  the Exposure, the tram, the bridge's sky and truss, the paste-up and
  the Services veil (`driveVeil`), the bottom nav's taxi, the strip's
  reading and the footer sign's swing. The route taxi has no smoothing
  in either mode: it is locked to the scroll, so full and soft park it
  in exactly the same place.
- **Pencil work plays once** (`playOnce`, built on `ScrollTrigger.batch`,
  its start clamped to the deepest scroll so a piece near the foot still
  plays): the handwritten notes and their arrows, the floppy's leader,
  the ticket's cells, the "touch" underline, the inbox label and its
  hand arrow at the phone (both on the arrow's line, so the label never
  lags it), the project drawings and their leader lines, the prints, the
  stamps. They are never undone on the way back up, like ink on
  paper. The markup is always the final state, so without JavaScript all
  of it is simply there.
- **Loops:** the strip's one-liner (4 s hold, holds under the pointer and in
  a hidden tab), the stack rows (pausable), the grain, the ticket's rolling
  roles (holds under the pointer and off screen), the portrait's idle sway
  (stopped while About covers the hero), the pin wall's idle breathing and
  the page-change sheet's taxi while a page loads.
- **Performance rules:** no per-frame layout reads (the strip, the nav, the
  Exposure and the flat portrait all use values cached at refresh or by a
  ResizeObserver; the loader's bridge measures its boxes once at loader
  start and again only on a resize, and its frames only write), no live SVG filters, no animated blur, no page-tall
  measured overlays, and WebGL loops stop when their canvas is covered or
  off screen.

## 11. Security

- **Dependencies:** Next.js 15.5.26 (an early 15.5.4 had 31 advisories including
  critical ones and was upgraded). `postcss` is pinned through `overrides`.
  `npm audit --omit=dev` reports 0.
- **Local servers** bind to 127.0.0.1 only (`npm run dev` and `npm run start`), so
  nobody on the same Wi-Fi can reach them. On Windows, the firewall had inbound
  "Node.js" allow rules on the Public profile; Parth should untick Public for
  them (not changed by us, it is a system setting).
- **Headers** (`next.config.mjs`, every route): a strict Content Security Policy
  (`default-src 'self'`; images only self, data: and blob:; connections only
  self; no frames; `object-src 'none'`; `form-action 'self' mailto:`;
  `upgrade-insecure-requests` in production), HSTS in production, nosniff,
  `X-Frame-Options: DENY`, Referrer-Policy, a Permissions-Policy that disables
  camera, microphone, geolocation, payment, USB and topics, COOP and CORP.
  `script-src` keeps `'unsafe-inline'` because statically prerendered Next pages
  ship inline hydration scripts; acceptable because no user content is ever
  rendered into HTML. `poweredByHeader: false`, no production source maps,
  `images.unoptimized` (the `/_next/image` endpoint answers 404). The
  redesign added no outside request and changed no header: Kalam is
  self-hosted, and the stamp's ink-wear mask is an inline `data:` SVG, which
  `img-src data:` already allows.
- **The contact endpoint** (`app/api/contact/route.ts`): POST only; same-origin
  only (Origin/Referer checked against the host, 403 otherwise); JSON only (415);
  body capped at about 8 KB (413); every field validated and cleaned (control
  and bidi characters stripped, line breaks removed from one-line fields);
  honeypot field and minimum fill time (3 s) silently drop bots with a 200;
  rate limits per IP of 5 per 10 minutes and 20 per day, plus a global cap
  (in memory, so best-effort on serverless); upstream call times out after about
  10 s and refuses redirects; plain-text email only; provider errors and the key
  never reach the browser; responses are `no-store`. `robots.txt` disallows `/api/`.
- **Secrets:** only in `.env.local` locally and in the host's environment settings
  in production. **`.env.example` is public and must only ever hold the
  placeholder `re_xxxxxxxxxxxxxxxxxxxxxxxx`**; Next.js never reads it. (On
  29 Sep the real key was typed into it in a local commit; it was caught
  before pushing and removed from that commit, so it never reached GitHub.) `.env*` is git-ignored except `.env.example`. Never put a secret
  in a `NEXT_PUBLIC_*` variable. Never write a key into this README.
- **Content:** one rule for raw HTML (`dangerouslySetInnerHTML`, `innerHTML`):
  it is built only from build-time constants and numbers, never from visitor
  input, the URL or storage (the schema.org JSON is built from `content.ts`
  with every `<` escaped); all user text renders as React text; the `mailto:` fallback encodes every part
  and has a fixed recipient; external links use `rel="noopener noreferrer"`.
- Git: local tool folders (anything like a hidden settings folder for an
  editor or assistant) stay out of the repository through
  `.git/info/exclude`, not `.gitignore`, so the public ignore file names no
  tool. Before every commit, check `git status` for `.env.local` and scan the
  staged files for keys (`git grep --cached -nE 're_[A-Za-z0-9_]{16,}'`).
  The pattern always matches the placeholder in `.env.example` and in this
  README itself; a clean result is exactly those placeholder hits, and
  anything else is a real key (checked on 30 Sep: no other hits).

## 12. The contact email (Resend)

- The chat's last step posts JSON to `/api/contact`; the route sends the message
  through Resend's HTTP API to `CONTACT_TO_EMAIL` (default `identity.email`), with
  the visitor's address as reply-to and the subject "Portfolio: <topic> from <name>".
- **Environment variables:** `RESEND_API_KEY` (required), `CONTACT_TO_EMAIL`
  (optional), `CONTACT_FROM_EMAIL` (optional, default
  `Portfolio <onboarding@resend.dev>`). `CONTACT_UPSTREAM_URL` exists only for
  local testing against a mock and is ignored in production.
- **Status:** Parth created a Resend key and it is in `.env.local` on his
  machine (29 Sep 2026). It still has to be added to the Vercel project's
  Environment Variables for the live site. Resend's shared sender
  `onboarding@resend.dev` only delivers to the email address the Resend account
  was created with, so the account should be his Gmail, or a domain must be
  verified in Resend and `CONTACT_FROM_EMAIL` set to an address on it.
- **Not yet done:** a real end-to-end test message (needs his go-ahead, since it
  sends an email). Without a key the route answers 503 `not_configured` and the
  chat offers the mail-app fallback.

## 13. Assets and helper scripts

All four scripts need `npm i --no-save playwright-core` once (nothing is added
to `package.json`) and a Chromium-based browser (found automatically, or set
`BROWSER_PATH`). Run them from the project root.

- **Resume preview:** after replacing `public/Parth-Betai-Resume.pdf`, also run
  `npm i --no-save pdfjs-dist` and `node scripts/render-resume-preview.mjs`, then
  update `resume.size` and `resume.updated` in `content.ts`. If the page size
  changes, update `PREVIEW` and the `aspect-[1800/2546]` class in
  `ResumePreview.tsx`.
- **Portrait:** `node scripts/make-portrait.mjs --publish` rebuilds
  `public/portrait.webp` and `public/portrait-depth.png` from
  `assets/portrait-source.jpg`. It keys out a pure-black background with a flood
  fill from the borders (so the black t-shirt and dark hair survive), recovers
  soft edge alpha, removes the dark fringe, and builds the depth map from a
  distance transform of the silhouette with the head and forearms brought
  forward. It only suits photos already cut out onto pure black.
- **Link preview card and icons:** `node scripts/make-share-image.mjs`
  rebuilds `app/opengraph-image.jpg`, `app/twitter-image.jpg`,
  `app/apple-icon.png` and `app/icon.svg` (rewritten for the drawing set in
  the twelfth round; it uses `typescript`, already a dev dependency, to
  read the taxi's source). It draws them from the site's own pieces: the
  self-hosted Archivo, the drawing set's tokens (copied into the script as
  constants), the name, role and ribbon read from `content.ts`, and the
  taxi rendered from `components/Ambassador.tsx` and
  `components/AmbassadorDefs.tsx`, so the car on the card and in the icons
  is always the car on the page. The card is Sheet 01 in miniature (see
  section 6, Everywhere); the icons are the colour taxi with a cream roof
  rack on a navy tile. Run it again after changing the name, the role, the
  ribbon, the taxi or the palette, and if the card's words change, update
  the two `.alt.txt` files next to the images, which describe it. The
  role is set at most 440px wide, so "Software Developer & Robotics
  Engineer" wraps after "&" and clears the taxi's roof rack, with a
  highlighter swipe per line (`box-decoration-break: clone`). The images
  were last regenerated on 12 Oct for the new role (the card about 90 KB,
  the iPhone icon about 8 KB; both icons came out unchanged).
- **Screenshots:** `node scripts/screenshots.mjs plan.json` (plan format at the top
  of the script). Use `"reducedMotion": true` to see what Parth sees.

## 14. Deploying

Planned host: Vercel.

1. The project is already on GitHub (ParthBetai/portfolio), without `.env.local`.
2. Import that repository at vercel.com/new.
3. In Project Settings > Environment Variables add `RESEND_API_KEY` (and
   optionally `CONTACT_TO_EMAIL`, `CONTACT_FROM_EMAIL`), plus
   `NEXT_PUBLIC_SITE_URL` set to the live address (with a custom domain this
   matters; without one, Vercel's own `*.vercel.app` address is used
   automatically for the sitemap, robots.txt, canonical links and previews).
4. Deploy, then send one message through the chat to confirm delivery.
5. Paste the live link into LinkedIn's Post Inspector
   (linkedin.com/post-inspector) or a WhatsApp chat to check the preview card.

## 15. Changelog

Dates are 2026.

- **22-23 Sep, first build.** Replicated the look of a reference portfolio
  (chrome display type, loader that decodes a name, liquid chrome orb, marquee,
  services accordion with a full-bleed flood, project cards, a contact section
  with a dotted globe behind a clip-path "window", a planet-horizon footer),
  with a custom cursor, smooth scroll, grain and dust.
- **23 Sep, "no animation" fix.** Found that Windows "Animation effects" off made
  the browser report reduced motion and the old code switched everything off.
  Introduced the full / soft / off policy (off only by explicit choice). Rebuilt
  the loader, the 3D pieces and the scroll effects.
- **23 Sep, resume round.** Content rewritten from the resume: projects,
  services (added Robotics and Embedded, Cybersecurity, Web Design and Branding),
  a tech stack with AI models and an honest Learning row. New engineering-reticle
  cursor. Footer social icons. Location set to Jaipur. Humanised intro without em
  dashes. Added Privacy, Terms, Cookies, Accessibility, Credits pages, a 404,
  sitemap and robots. Security audit: Next.js 15.5.4 upgraded to 15.5.26, dev
  server bound to 127.0.0.1 after finding it reachable on public Wi-Fi, security
  headers and CSP added, form length limits.
- **23 Sep, second round.** Facts card reworked (work locations, "Available to
  work as" rolling list). Intro rewritten without wins. Tech band chips with
  status lights. Faster cursor. The dotted globe replaced by the WebGL pin wall.
  Resume added as a 3D floppy disk download. Contact form turned into a chat on a
  3D phone.
- **23-24 Sep, third round.** Tech band: green labels, no counts, grey names.
  "What I can do" got a CSS-3D rotary drum. "Studying" became "Status:
  Undergraduate, first year". The floppy now opens a preview with a disk-reading
  sequence; the chat's PDF opens it too. Afferex removed from Selected work and
  the Founder journey section added. Pin wall top edge softened.
- **24-28 Sep, fourth round.** "Learning right now" removed from the card; roles
  in green without a dot. Lights and loading bar removed from the tech chips.
  DVD-style disc opening for the resume. Blueprint plotter replaced the drum as
  the default (drum kept behind a switch). Socials updated, YouTube replaced by X.
  Footer Motion button removed (and its saved setting cleared). Loading bar for
  page changes. Soft mode made identical to full everywhere (it had been hiding
  animations from Parth). Favicon added.
- **28-29 Sep, fifth round.** Neon lime replaced by warm copper; glows and every
  blinking or pulsing light removed; serif-italic accent replaced by thin Archivo;
  labels calmed. Same footer on every page. Intro refined. EV model now "100%
  solar powered". Parth's own project photos replaced the stock ones, and the image
  CDN was removed from the CSP. Afferex marked as wound down (timeline ends at a
  buffer stop). Chat now emails Parth through `/api/contact` and Resend, with a
  mail-app fallback. Parth's photo replaced the chrome orb as a 3D relief in the
  hero. Em dashes removed from the codebase.
- **29 Sep, sixth round.** Android App Suite text now highlights the
  Domino's-style ordering app, drops the calculator and only mentions the quiz app
  in passing ("many more apps"); the Mobile Development service text matches.
  Removed tool names from the code and comments (the AI models row and the AI
  service line were reworded; both were replaced again in the eighth round).
  Project cards accept an optional `focus` crop. README rewritten as this
  handbook. Resend key added to `.env.local`. Portrait cut-out and screenshot
  scripts saved in `scripts/`, the original photo in `assets/`.
- **29 Sep, seventh round ("refine the whole website").** A polish pass with no
  new features and no change to the look Parth approved. Readability: the grey
  (`ash`) lifted to `#7a7a82`, and the dim labels in the facts card, the contact
  details, the plotter readout and the chat box placeholder moved up to it.
  Tech band: tiny mid-height squares between names instead of full stops, and a
  fade on the right edge too. Selected work and Founder journey headers rise as
  one block (the heading had slid through the blurb on phones). Contact fades
  into the footer instead of ending at a hard line. The footer moved outside
  `<main>`. The page no longer requests a missing second photo on every visit
  (now `intro.photo`), which removed the only console error. The pin wall is
  prepared at idle time instead of mid-scroll. Link previews: a preview card,
  iPhone icon, per-page preview titles and canonical links, and schema.org
  `Person` data; absolute URLs fall back to the Vercel address instead of a
  placeholder domain. Copy: the Mobile Development list dropped "Score
  tracking and local data" (a quiz-app point) for "Ordering screens and menu
  cards". The Accessibility page said the focus outline was lime; it is
  copper. Unused `identity.location` and `identity.availability` removed, and
  old colour names (lime, green, globe) cleaned out of code comments.
- **29 Sep, eighth round (credibility).** From an outside review Parth passed
  on: the AI models row became an **AI** row of practices; Selected work now
  starts with the Android App Suite; every project write-up was rebuilt with
  implementation depth from facts Parth confirmed (humanoid: 8+ servos, PWM
  servo driver on an Arduino, C++ easing between hand-tuned poses, and it WON
  1st place at IIT Hyderabad; car: one servo-mounted ultrasonic sensor that
  looks left and right before turning, no "100%"; EV: solar panel charges three
  cells that power the track, a sensor and relay switch the coil on); unsupported
  details (menu cards with prices, "real client work" at Afferex) removed; the
  no-JavaScript view of the chat became a finished conversation; service panels
  readable without JS. Also found that `app/loading.tsx` made Next wrap every
  page in a hidden block revealed by script, so with JavaScript off the whole
  site was blank; it was replaced by `RouteProgress.tsx`, which watches link
  clicks instead. Done as a multi-agent pass with independent fact, photo,
  copy, visual and code reviewers, then a final check by hand.
- **29 Sep, ninth round (SOS app).** Added Parth's offline SOS app (React
  Native, Bluetooth Low Energy relay hop by hop, GPS location, short message,
  alerts, duplicate IDs) as the lead of the Android App Suite card, ahead of the
  Domino's replica. React and React Native joined the Stack row and left
  Learning; Flutter stays in Learning. Mobile Development and Full-Stack service
  text updated to match ("Mobile apps in React Native", never "cross-platform",
  since iOS is not confirmed). schema.org knowsAbout gained React Native and
  Bluetooth Low Energy. Card and service bodies use `text-pretty` so no single
  word sits alone on the last line. Checked by a fact sceptic, a visual pass and
  an editor. Committed and pushed as `baabd64` ("Add the offline SOS app and
  move React into the stack"), which is the current `origin/main` and the last
  pushed state before the redesign.
- **29 Sep, eighth round pushed** as commit "v2" on top of four GitHub-side
  commits that created and deleted a `CNAME` file (no net change). Before the
  push, the real email key was found in `.env.example` and removed from the
  unpushed commit. In that commit Parth himself also renamed the tech band's
  "AI" row to "Intelligent systems"; keep his name.
- **29 Sep, git.** Repository created and pushed to
  https://github.com/ParthBetai/portfolio (`main`, 75 files in the first
  commit). Checked before pushing: no `.env.local`, no `node_modules` or build
  output, no local tool folder, no real key in any file.
- **30 Sep, tenth round: the Kolkata taxi redesign** (asked for on 29 Sep).
  Parth wanted a "pro level" redesign and pointed at a reference portfolio for
  its principles: a bold single colour as whole fields, handwritten notes over
  clean type, tape, prints and stamps, a top status strip with rotating
  one-liners and a "You've seen N%" counter, a floating bottom nav, numbers
  with context, a personal voice. He chose "Kolkata taxi re-theme + maker's
  notebook": taxi yellow and black from Kolkata's yellow Ambassador taxis,
  with the chrome type kept as the car's chrome trim, plus a lab-notebook layer
  on engineering paper. The principles were translated into his own world;
  nothing of the reference's content or layout was copied. He approved
  downloading the Kalam handwriting font (Indian Type Foundry), now
  self-hosted in `app/fonts/`.
  - **Foundation:** new tokens and materials in `globals.css` (taxi yellow
    `#f6c400` replaces copper inside the same `acid` token; ink; the paper
    family; `.t-hand`, `.t-num`, `.hazard`, `.shadow-hard`, `-sm` and
    `-taxi`, `.paper-grid`, `.tape`, `.stamp`), Kalam in `layout.tsx`, and new
    copy in `content.ts` (`strip`, `notes`, `intro.numbers`, project `stamp`
    and `note`). `.shadow-hard-block` (asked for by the hero builder), the
    stamp's ink-wear mask and the tape's torn ends came later, in the fixer's
    pass.
  - **Navigation:** the top nav and the phone Menu were replaced by
    `StatusStrip.tsx` (every page) and `BottomNav.tsx` (home page); `Nav.tsx`
    now just renders both.
  - **Sections:** the hero and the footer became yellow fields with ink type
    and hazard bands; the footer's copper sunrise and the hero's dark
    background, chrome lighting and dust are gone (`Dust.tsx` deleted).
    Handwritten notes in the hero, by the floppy, on two projects, in the
    journey and beside the phone, each with an arrow that draws itself; one
    over the numbers with a tick; and a still one over the footer wordmark.
    A new "In numbers" row
    (`Numbers.tsx`). The tech band labels became yellow plates; service rows
    flood yellow (a plate from 1024px); the plotter's accents are yellow;
    Selected work became the paper notebook with taped prints, two stamps, two
    notes, highlighter badges and outlined tags; the journey's accents are
    yellow, with square pills and a buffer stop on the phone line; the chat's
    accents are yellow; the pin wall's backlight is a deeper, weaker yellow;
    the contact section ends on a hard line.
  - **Everywhere:** the cursor reads the painted background; on yellow it
    switches its colour to the yellow, which its difference blending shows as
    black (and as yellow over the black buttons there). New favicon, iPhone
    icon and link-preview card. The info pages and the 404 got the status
    strip, and their links are yellow. The Accessibility page was updated,
    and `legal.updated` is now 30 September 2026. `ash` lifted to `#84848c`.
  - **Fixed on the way:** GSAP rounded the draw-on offsets, so every arrow
    popped in instead of drawing (now `autoRound: false`); the hero's outro now
    lives inside its GSAP context, so it no longer moves the strip, the nav or
    the work notes; the stamps no longer run off the screen at 768 to 1023; the
    stamps lost their 0.9 opacity for contrast; without JavaScript the bottom
    nav no longer covers the legal links; the nav now hides only when the
    footer reaches it; bigger tap targets for the chat field (37 to 38px),
    the footer links (24px) and the contact email (28px); the skip link is a
    black pill with a yellow border.
  - Done as a multi-agent pass: the lead wrote the foundation, five builders
    (chrome and navigation, hero, intro, work and services, contact and
    footer) built the rest, five reviewers (including a design critic)
    raised 47 findings (24 of them must or should), and a fixer applied 39
    items (every must and should finding, the builders' code requests and
    most nits) and set aside 9: the four README hand-offs, the chat hydration
    warning (not a site bug) and four nits, three of which are in section 16.
    Then the lead added Kalam to the Credits page (four fonts, all SIL OFL),
    dropped the unused Kalam bold, fixed three stale code comments, bumped
    `legal.updated` to 30 September 2026, ran the production build and its
    checks (section 1) and staged everything. Not committed or deployed yet.
- **1 Oct, eleventh round: the taxi.** Parth asked for a taxi in the "You've
  seen" gauge so people get that it is the authentic Kolkata yellow taxi, then
  for any more taxi touches and refinement. Three designers drew a Hindustan
  Ambassador (faithful proportions, legibility, chrome detail) and a judge
  picked and polished one over nine rounds: the tall domed cabin, the wing
  brow over a round headlamp, a short nose and long tail, two-tone chrome
  bumpers, hub caps with four nuts. It became `components/Ambassador.tsx`,
  used in three places: driving along the strip's new road ("You've arrived"
  at 100%), in black along the loader's line, and facing back on the new
  "Took a wrong turn." 404. Also added the "For hire" meter flag by the hero's
  Contact button. Polish in the same pass: the no-JavaScript hero now reads
  PORTFOLIO; "Work with me", the footer's links and "View projects" land
  exactly where the bottom nav does; the cursor's brackets frame the yellow
  service plate rather than the full-width row; the chat fields no longer
  trigger the autofill hydration warning. Built by two builders, checked by a
  visual-and-code reviewer and a design critic, then a fixer (two-colour ink
  car on yellow, rolling wheels, a calmer flag swing, the flag aligned with
  Contact, dashes clipped behind the car).
- **1 Oct, the flag comes out.** Parth felt the "For hire" flag beside Contact
  did not look good on the home page, so it was removed: `MeterFlag.tsx` and
  the `meter` copy are deleted, Contact lost its `aria-describedby`, and the
  hero's buttons went back to `md:right-[2%]` (the 3.1rem kept clear for the
  flag is gone).
- **5 to 12 Oct, twelfth round: the drawing set.** Parth looked at the
  taxi round and said it had "too much caution vibes", and asked for
  unique page flows. An audit found why it read as construction signage:
  hazard stripes where yellow met black, full yellow fields with huge
  black capitals, yellow-on-black plates framing every screen (the
  strip's name tag, the bottom nav's box), and a kit of square label
  chips and hard offset shadows; and the page was flat full-width bands
  in three grounds, with nothing ever crossing a seam.
  - **Four directions** were drawn up from that audit, each as a working
    mockup at desktop and phone size: **Drawing set** (a numbered set of
    engineering sheets, the hero exposed into cyanotype), **City ride**
    (one taxi ride down the page over a drawn Howrah Bridge, every
    section a stop), **Hand-painted Kolkata** (painted boards and posters
    pasted over one another) and **Kinetic editorial** (a magazine on
    warm paper, the taxi wiping each chapter in). Three judges scored
    them: an art director (City ride 8, Drawing set 7, Hand-painted 6,
    Kinetic 5), a visitor on a phone and a laptop (Drawing set 8.5, City
    ride 7, Hand-painted 6.5, Kinetic 6) and an engineer for this
    codebase (Drawing set 8, Hand-painted 6.5, City ride 6, Kinetic 4).
    None read as caution signage any more. Kinetic was dropped (sideways
    overflow on a phone, two text pairs under AA contrast, and pinned
    pieces that hid focused links). The Drawing set won as the spine,
    with City ride's bridge, scenes and route grafted on.
  - **Parth's choice:** shown three options (A, the Drawing set with
    those grafts; B, City ride; C, Hand-painted Kolkata boards), he chose
    "A+B+C all 3 combined all major elements", and approved navy
    replacing black.
  - **The combined plan and mockup:** one plan (the sheets from A, the
    route and the Kolkata scenes from B, the painted lettering, enamel,
    stamps and paste-up from C) and one full mockup of it, then a
    critique by an art director, a first-screen check at eleven screen
    sizes and an engineering audit (node counts per scene, a live SVG
    filter on the portrait's duotone, the page-length budget: Work within
    5.0 screens at 1440x900 and 6.0 at 390x844), and a second version of
    the plan with those fixed. The build ported the mockup's SVG art and
    CSS rather than redrawing it. The yellow-and-black look is gone
    everywhere (sections 6 and 9).
  - **Foundation:** `@theme static` with the new palette (cream, cream-2,
    card, ink now navy `#1d2a6e`, ink-deep, muted, blue, bline, bline-2,
    night, night-deep, nline, nline-2, teal, chrome; acid, paper, paper-2
    and stamp kept); `app/styles/f0-base.css` (aliases, layout tokens,
    the five shades, type, `.btn`, the four grounds, the sheet stack, the
    route) and one partial per section in `app/styles/`; `Sheet.tsx`,
    `RegMark.tsx`, `Route.tsx`; the Ambassador rebuilt as four prints over
    shared symbols (`AmbassadorDefs.tsx` in the layout); the cursor
    without difference blending; the grain retuned to navy with no blend
    mode; a cream page-change sheet; `lib/motion.ts` gained DrawSVG (and
    MotionPath, removed again as unused in the final fix pass), `scrub()`, `jumpTo`, `useSheetStick` with the focus guard,
    `driveRoute`, `driveVeil`, `canTransform` and `playOnce`. New copy in
    `content.ts`, all restating existing facts: `sheets`, `hero`, `route`,
    `stackLabels`, service notes and legends, project drawings,
    `ventures.timeline`, `boatTags`, `legal.tabLabel`, `footer`.
  - **Sheets:** 01 Home (the cream hero, the loader reskinned, the Exposure
    into blueprint), the strip and the bottom nav (cream, with the taxi on
    the nav's road), 02 About (the ticket, the detail views with the fare
    meter, the tram band, the enamel stack tins with a pause button), 03
    Services (the Howrah Bridge crossing from day to night, the "Short on
    time?" board, the rows as stations, the plotter in cream line, the
    rooftops), 04 Work (the paste-up, a technical drawing plate for every
    project, kraft-taped prints, round rubber stamps, the medal), 05
    Journey (the ghat with two boats, the railway timeline, title blocks),
    06 Contact and the footer street (the hanging sign that drops and
    swings once, the night street and the parked taxi at "You've
    arrived"). The info pages and the 404 became sheets of the set. New
    share card and icons.
  - **Review fixes, per stream:** the flat portrait's mask no longer reads
    layout per frame (heights cached by a ResizeObserver) and the GL relief
    renders on `gsap.ticker`, in the same frame as the masks; the strip's
    reading no longer reads the page height on scroll (`self.end`); the
    bottom nav keeps the readonly chat field from hiding it; the ticket's
    roller no longer resizes the ticket (a one-cell grid of sizers), the
    floppy's hover hint clears its readout, and the no-JS ticket stacks its
    last row; the service titles take the 1.55 line height so rows and
    stations line up as drawn, and the drum's row selector was fixed; the
    project leader lines draw on with their own drawing, the SOS plate
    lost its spare phone height, and the balloons come in three sizes.
  - **Integration (this pass):** the six sheet wrappers replaced the interim
    sheets in `app/page.tsx`; `.btn` takes line height 1.55 (the mockup's
    button heights); the cursor's scroll-driven hit-test is throttled; the
    stack's heading and pause labels moved into `content.ts`
    (`stackLabels`); jumps now land under the strip's height plus the
    anchor's 84px, as a native anchor jump would, so every sheet's index
    tab shows whole under the strip (it was half hidden), with a matching
    no-JS `scroll-padding-top` in `s2-chrome.css`; the ticket's cells no
    longer let "Undergraduate," run into the next cell between 1024 and
    1279px (narrower stub, 15.5px values, and below 1181px a slightly
    narrower copy column); the pin wall's renderer skips three's shader-log
    check in production; stale comments from the old look fixed in
    `content.ts`; `legal.updated` moved to 12 October 2026 (the
    Accessibility and Credits pages changed).
  - **Deleted as dead:** every caution-era class (`.hazard`,
    `.shadow-hard`, `-sm`, `-taxi`, `-block`, `.t-display`, `.t-serif`,
    `.t-hand`, `.t-num`, `.paper-grid`, `.tape`, `.stamp`, `.gutter`,
    `.line-mask`) and token (void, carbon, carbon-2, hairline, graphite,
    pencil, acid-dim); the Ambassador's old props and its `TAXI_W` and
    `ROLL` exports; `Magnetic.tsx` and `SocialIcon.tsx`; the Instrument
    Serif font; the content fields nothing read any more
    (`identity.name`, `identity.heroWord`, `intro.photo`,
    `services.plotLegend`); and unused drawing-set helpers that no sheet ended up
    using (`.dot-grid`, `.blue-grid`, `.night-dots`, `.grid-paper`,
    `.tape-cream`, and the `.shade-hero`, `.shade-load` and `.shade-bphero`
    utilities, whose values the hero reads directly). Each was grepped to
    zero uses first. Kept on purpose: `.t-mono`, `.chrome` and the bone and
    ash tokens, which only the switched-off `ServiceDrum.tsx` reads.
  - Done as a multi-agent pass: a foundation builder (content, tokens,
    the sheet and route primitives, the shared taxi, the motion
    plumbing), six section builders (hero, chrome, About, Services, Work
    and Journey, Contact and footer), a reviewer per stream with a fix
    round each, then an integrator who applied the cross-stream requests,
    toured the whole page at five sizes with and without JavaScript,
    removed the dead code and wrote this README. Not built, committed or
    deployed yet (section 1).
  - **Final fix pass (after three whole-site reviews: art fidelity and
    the caution check; contracts, accessibility and performance; copy,
    facts and code):** the route's last
    corner (the footer elbow) now turns solid at the bottom of the page
    (the elbows listen to enter and leave, see section 17); a rail that has
    only just begun to fill is a crisp line, not a soft smear (`force3D:
    false`); "You've arrived" sits 9px higher on phones, clear of the
    terminus ring and the parked taxi's boot; the focus guard no longer
    lands a control under the next sheet; edge index tabs draw their focus
    ring inside the tab, on their own ground; the footer sub-board sits
    above the sign's shadow, so its brick lettering keeps AA contrast on
    phones; the stack rows hold still without scripts; a malformed hash
    ("#%") no longer takes the home page down; the Accessibility page lists
    the ticket's rolling roles; the footer's text rows carry
    `data-nav-avoid` (the bottom nav's class fallback is gone). Deleted as
    dead: `onSheetChange` and its per-sheet triggers, `MotionPathPlugin`,
    `splitWords`, and the ticket roller's unused `delay` and `className`;
    stale comments from the old look fixed in `motion.ts`, `layout.tsx`,
    `Cursor.tsx`, `Footer.tsx`, `Nav.tsx`, `ContactSheet.tsx`,
    `AmbassadorDefs.tsx` and `drawings/kit.ts`.

- **12 to 13 Oct, thirteenth round: Parth's eleven fixes.** Parth went
  over the drawing set on 12 Oct and sent a list of eleven. Each one, in
  his order, with what was done:
  1. **Connections** (logos only, not the full names, under a title like
     the other cells'): the title block's GitHub, LinkedIn, Instagram and
     X links are now logos only (`SocialIcon.tsx`, deleted in the twelfth
     round, restored and restyled: 22px glyphs in `currentColor`), each a
     44px link named by its label (`aria-label`, a title tooltip and the
     shared new-tab description), under a "Connections" label set like
     the other cells' (`footer.titleBlock`: `{ socials: true, dt:
     "Connections" }`; the `TitleCell` type takes the label). Focus shows
     the night ring as a circle; hover turns the logo taxi yellow.
  2. **"06 / 06" removed** (it "makes no sense"): the cell and its small
     taxi are gone from the content and from `Footer.tsx`, with the
     `.sheetno` CSS. The block is four cells ruled by the grid's 1px
     gaps: four across on desktop, two by two from 761 to 1023px, and
     name / the two locations side by side / Connections on a phone.
  3. **"Robotics Engineer" wherever "Software Developer" is written:**
     `identity.role` is "Software Developer & Robotics Engineer", so the
     hero, the footer sign, the title block, the schema.org job title,
     the share card and the page title (`meta.title`, now built from the
     role) all follow it; in sentences (`intro.body`, `meta.description`)
     it is "software developer and robotics engineer". The hero breaks
     the role only after "&" (non-breaking spaces elsewhere, `.h-role`
     max-width 14em), with a swipe per line, so at 1440 it no longer
     runs under the taxi's roof rack; on a phone the hero's copy was
     tightened and the note moved to top 478px to clear the buttons. The
     share card wraps it the same way (max-width 440px) and was
     regenerated, and both alt texts were updated.
  4. **The loader writes the name in place**, like the old version on
     GitHub, where "Portfolio" stayed put and only the ground changed:
     the cream loader sheet and its separate name are gone. "Parth Betai"
     decodes in the hero's own h1 with its brick shade stepping in
     (`data-sh` 0 to 9, step 9 being the landed shade), the readout sits
     under it and the bar runs on the kerb; then only what surrounds the
     name changes: the readout and bar fade, the street fades in, and the
     portrait, copy, taxi and note arrive (the decode, readout and bar
     were replaced by Span closed on 17 Nov). Checked frame by frame: from
     the end of the decode the name's pixels do not change (apart from
     the driving taxi passing in front of it). The ink h1 keeps its own
     layer so its anti-aliasing never flips mid-way, and carries an
     `aria-label` with the name so the decode is never read out.
  5. **The floppy stands out:** it sits in a cream detail circle (the
     ticket's card stock and shadow, a static cream wash, a dashed cut
     ring, centre lines, ticks) that reads against the blue. The disk is
     152px wide at 1440 (it was 100) and larger at every width; its note
     hangs on a leader from the ring and stays on two lines; the "Click
     to preview" hint shows at rest as a caption; hover and focus lift
     the circle's art 4px. The preview itself is unchanged.
  6. **"In numbers" removed** from About, with `Numbers.tsx`,
     `DetailViews.tsx`, `FareMeter.tsx`, their CSS, the route's spur to
     detail circle A and the copy (`intro.numbersTitle`, `intro.numbers`,
     `notes.numbers`). About is now the intro, the ticket and the floppy,
     then the tram band; from 1023px down it is one column.
  7. **The paint brush removed** from the paste-up above Work, with its
     wobble; the paper roll, the torn edge and the paste streaks stay.
  8. **The phone stands out:** a cast-iron wall lantern (the street lamp's
     drawing) hangs beside it and throws a hard-edged cone and a cream
     wash on the wall, and the pin wall falls into a navy shade beyond
     it. The phone has a cream rim light, a faint halo and a deeper
     shadow, and is a little larger (80svh, at most 372px wide; it was
     76svh and 340px). A yellow hand arrow from the copy points at the
     input box, and the box has a firmer edge while Parth waits for an
     answer. All of it is static paint beside the pin wall, never on its
     ancestors. The lantern and the arrow are hidden at 760px and below.
  9. **The Victoria Memorial replaces the sun** behind Parth: a frontal
     elevation drawn as inline SVG (the dome, the lantern, the Angel of
     Victory, the chhatris, the portico, the wings, the end pavilions,
     the steps) in cream marble with a navy keyline, on the same yellow
     halftone disc, centred behind his head so the dome rounds it; white
     line on the blueprint print.
  10. **One taxi follows the scroll along the whole route.** What was
      wrong: no taxi rode the gutter at all, the line only filled behind
      a reading line, and the sticky sheets left a gap in it at every
      change of sheet; the bridge's taxi ran its own scrub, starting and
      ending off screen and unconnected to the line; and the footer's
      taxi drove in on its own. Now a small top-down taxi (`AMB_TOP`)
      drives from the Home stop down every gutter, hands over to the deck
      taxi across the Howrah Bridge, takes over again down the far side
      and the bank, and at the kerb hands over to the footer's taxi,
      which parks just past the terminus at the deepest scroll, with
      "You've arrived" written in as it stops. The line is solid behind
      the taxi and pencilled ahead, both ways. The footer's old drive-in
      tween is gone on every page (on an info page whose street was on
      screen at load it left the taxi 420px short); there the taxi is
      simply parked. See THE JOURNEY and Stand-ins in section 6.
  11. **The "A" letters are gone** from the dividers between projects.
      They were drafting section-cut marks (A-A), which on a drawing name
      a section view drawn elsewhere on the sheet. This site has no
      section views, so they pointed at nothing, and every divider
      repeated the same "A" where a real set would run A, B, C. The
      dashed cutting line and its centre registration mark stay as the
      divider.
  - **Final fixes after review:** the Contact lantern ran under the
    status strip from 1024 to 1365px with the phone centred, so there it
    is mirrored and hangs off the phone's left shoulder; the sheets after
    the hero are held back from the first paint in full motion, so the
    About tab no longer shows under the loader, vanishes at hydration and
    comes back; the loader's step is floored at 0, so the readout never
    shows "-19" and the bar never runs backwards on a busy first frame;
    Back into the home page no longer lands at the bottom on a blank,
    locked page (scroll restoration off from the boot script on "/", and
    the intro pins the scroll to the top); the last run onto the kerb
    gets more scroll (at least len / 2.5 where the corner is on screen:
    about 340px instead of 217 at 1440x900). Dead code removed:
    `--shade-load`, the "In numbers" CSS and the footer's sheet-number
    branch; comments that still named the sun, the brush, the overlay
    loader or the old role fixed.
  - Done as a multi-agent pass: six fixers side by side (the copy, the
    hero, About, Work, Contact and the route), then one for the arrival
    at the end of the journey, three reviews on the live dev server
    (visual; motion; contracts and code), a final fixer for everything
    they raised, then this README. Not built, committed or deployed yet
    (section 1).

- **13 Oct, fourteenth round: Parth's six items.** His list, worked
  through on the dev server:
  1. **"Also builds robots" is gone** from the top of the taxi, with its
     arrow, `notes.hero` and `hero.note`; the outro no longer writes it.
  2. **The loading screen is no longer an empty sheet.** The frame,
     marks, grid, faint facades and the Kolkata to Jaipur dimension line
     are there from the first paint, and the Victoria Memorial plots
     itself in line as the progress (construction lines first, then the
     building from the steps to the angel, one stroke per outline). The
     loader taxi runs right to left, facing left, and its parked start
     is inside the frame on a phone. The hand-over is one beat: the
     plotted lines take their fills while the portrait, the taxi and the
     copy arrive; the railing is solid before Parth's face reaches it,
     and the taxi drives in once he is mostly up, so the robot never
     crosses his face. The name's pixels are unchanged from the
     hand-over on. The plot's dashes are scrubbed by hand from lengths
     measured once (no layout reads in the frame loop).
  3. **The hero taxi faces left and the scroll drives it into the route
     taxi:** big at the kerb, it drives off to the left and shrinks with
     the distance until, at the corner, it is the small route taxi, as
     the footer's taxi does the other way at the end. The Home stop moved
     to the taxi's tail and the hero's slot run-out is 136svh, so the
     drive has its own 0.36 screens of scroll (Work now starts at 4.52
     screens at 1440x900). The copy now sits on its own layers above the
     street, so the taxi passes behind the role, the billing and the
     buttons instead of over them (and behind the name during the
     drive-in, which used to cross "Betai").
  4. **The floppy sits half out of a cream paper sleeve** with "Resume"
     under a highlighter and the file size, in place of the detail
     circle. Three treatments were tried and compared: the paper sleeve,
     an index card with a taxi-yellow "Resume" tab and a paper clip, and
     a desk-lamp light pool. The sleeve was kept because it is the most
     crafted and says "Resume" on the object; the card read as a second
     big cream card under the ticket, and the lamp clashed with the
     ticket and read as a glow.
  5. **Services plotter title block:** Parth's name and the sheet counter
     (01 / 07) are removed; it is now two ruled rows, TITLE (the service)
     and NOTE (the service's fifth point, from `services.items`), so the
     card carries the whole list once.
  6. **The phone:** the wall lantern hangs 50px off the phone's edge,
     above it in the stacking order, so the phone no longer overlaps it
     or hazes it with its halo; "it really does land in my inbox" moved
     onto the phone as the message box's label, on the arrow that points
     at the field (under the phone in one column), and it never comes in
     after its arrow.
  - Done as a multi-agent pass: fixers for the six items, three reviews
    on the live dev server (visual; motion; contracts and code), and a
    final fixer for what they raised: the inbox label firing on its
    arrow's line, the plot scrubbed without per-frame layout reads, the
    loader taxi kept inside the frame, the hand-over reordered, and the
    copy lifted above the taxi. Not built, committed or deployed yet
    (section 1).
  - **Left open** (section 16): the shape of the taxi's shrink (linear
    now; Parth may want it big for longer), the phone's taxi shrinking
    mostly in place, wheels that do not turn on the drive, and the link
    preview card's taxi still facing right.

- **16 Nov, fifteenth round: no wait for the hero taxi, a balloon for
  the phone, and a new loader pending.**
  1. **The page scrolls while the hero taxi shrinks.** Parth: "when
     scrolling it wait till taxi gets small make it somehow that taxi
     also gets small and page also is scrolling but nothings
     overlapping". The hero's 136svh slot run-out (the 0.36-screen hold)
     is gone; every slot is 100svh. About starts up from the first
     notch, and the big taxi drives off and shrinks into the route taxi
     in that same scroll. Its path is planned on every ScrollTrigger
     refresh against the copy (`data-drive-avoid`), About's tab and the
     copy line's riding tab, and `heroLine.delay` holds the Exposure's
     copy line back just long enough that the car is still the ink
     print at the hand-over (THE HERO'S DRIVE in `lib/motion.ts`). Work
     now starts at 4.16 screens at 1440x900 and 4.84 at 390x844 (scripts
     on, natural flow), as before the fourteenth round.
  2. **Short laptop screens get a tighter hero copy** so that drive has
     room. On a laptop with browser bars or at 125% and 150% the room
     before About's tab reaches the strip under the buttons was 30 to
     80px of scroll, so the car went from full size to small in the
     first frames of one wheel notch (409px to 91px wide in one frame at
     1280x600). At 820px tall and under (wider than 760px) the copy's top
     padding is now 100px, the name `min(186px, 13.5vh, 13vw)` (11.5vh
     at 640px tall and under), the role `clamp(24px, 2.4vw, 34px)`, the
     billing 16.5px, with tighter gaps (`s1-hero.css`, section 6
     "Size"). The room went from 30 to 90px at 1280x600, 64 to 172 at
     1536x730, 73 to 169 at 1280x720, 79 to 205 at 1440x789, and is
     117 at 1366x657 and 200 at 1366x768; the first frame of a notch at
     1280x600 now takes the car from 409 to 294px instead of to 91.
     **This changes the look of the hero name on those screens, so
     Parth should see it before it ships.**
  3. **A printed speech balloon stages the phone** in place of the
     Contact wall lantern, its light, the phone's rim light and halo:
     the hero's yellow halftone disc drawn out into a balloon behind the
     phone (`.ct-balloon`, section 6), printed in once as the phone comes
     up (`playOnce` at 0.8: it turns and grows into place). Static paint
     beside the pin wall's window, never on its ancestors; without
     scripts and in soft mode it is simply there.
  4. **A new loader is pending.** Parth asked for a more unusual loading
     screen. Four concepts were drawn up as previews, and nothing is in
     the site yet: **Print run** (the home sheet pulled like a screen
     poster, one ink at a time, snapping into register at 100%),
     **Destination blind** (a night street with a tram's lit destination
     box where the name sits, its cloth rolling through stops until it
     lands on the name), **Span closed** (the Howrah Bridge built on the
     sheet as the progress bar) and **Cyanotype developing** (the hero
     printed the way a blueprint is made, yellow-green to deep blue).
     Parth reported the Destination blind and Cyanotype previews not
     working (16 Nov): they skipped under reduced motion, which his PC
     uses. All four were rebuilt as playable previews, and he picked
     Span closed, now in the site (17 Nov, below).
  - **Checked** (dev server, headless Edge): the typecheck; the hero
    drive stepped every 6px down and back up in full and soft motion at
    1280x600, 1366x657, 1536x730, 1440x789, 1280x720 and 1366x768
    (never both taxis or neither, 0 samples with the car over the copy,
    About's tab or the copy line, the same plan in both modes); frames
    of one wheel notch at 1280x600, 1366x657 and 1536x730; the hero at
    rest with and without JavaScript at 1280x600, 1536x730 and 1440x900
    (same name size and layout; nothing changes from 900px tall); the
    balloon in full and soft motion at 1440x900; the home page, the five
    info pages and the 404 at 1440, 1024, 768, 390 and 360px wide, in
    full motion and without JavaScript: 0 sideways overflow and 0 CSP
    violations. Not built, committed or deployed (section 1).

- **17 Nov, the new loader: Span closed.** Parth picked Span closed of
  the four concepts (fifteenth round, item 4). On the cream sheet the
  Howrah Bridge is erected as the progress (`LoaderBridge.ts`, its
  geometry exported from `BridgeArt.ts`, so the Services band is
  unchanged): towers, anchor arms, cantilever arms with two creeper
  cranes, and the suspended span closing at 100%. The rivets and the
  letters of "Parth Betai" go red-hot and cool to navy one by one, the
  build holds at 80% for the fonts and the portrait, and at the close a
  brick SPAN CLOSED stamp lands, the small taxi drives across and the
  view pushes in on it until it is the big hero taxi at rest, while the
  memorial, Parth, the railing and the copy arrive. The name never
  moves. It plays in soft mode too. Gone: the letter decode, the
  `.h-lread` readout, the `.h-lroad` kerb bar and its one-ink taxi, and
  the memorial plot (`MemorialPlot`, `.h-plot`). The whole-page sheet
  refresh is held while `.hero[data-span]` is up, and the hero drive's
  parked-car measure now clears the intro box's transform as well:
  before, every home load planned the drive while the loader held the
  car at about a twelfth of its size, logged "no clear path" three
  times and was right only because a later refresh replaced the plan.
  The details are in section 6, Sheet 01.
  - **Checked** (dev server, headless Edge): the typecheck; no
    driveRoute warning on a home load or after a resize, in full and
    soft motion at 1440x900 and 390x844, and the plan kept after landing
    equals a fresh one (1440x900 full, 390x844 soft); the home page, the
    five info pages and the 404 at 1440 and 390, in full and soft
    motion: 0 sideways overflow, 0 CSP violations, no console errors
    apart from the 404's own; without JavaScript at 1440 and 390 no
    loader, the name and the taxi shown, 0 overflow. Not built,
    committed or deployed (section 1).

- **18 Nov, sixteenth round: the code review and the craned name.** Parth
  asked for a full review of the uncommitted work. Five area reviewers
  and a skeptic per area left 25 confirmed findings (5 must fix, 12
  should fix, 8 nice to have). He asked for all of them to be fixed with
  nothing visible, animated or smooth lost, for more refinement, and for
  a type animation for his name inside the Span closed loader; of three
  prototypes (forge, crane, split-flap) he chose crane. The fixes went in
  four batches, each checked against a baseline screenshot tour of the
  site taken before any edit. The entries below record each batch. The
  round was pushed to GitHub on 18 Nov.

- **18 Nov, review fixes, items 1 to 5.** (1) A failed page script no
  longer leaves a blank page: the boot script drops `data-motion` 8 s
  after load when no sheet has `data-stick` (section 10). (2) After Back
  the portrait no longer hides during its rise and pops in at the end:
  `span.kerb()` reads the kerb's box live instead of a value saved at
  build time, when the page could still be scrolled. (3) The focus guard
  acts on keyboard focus only, so a mouse click on a control just under
  the status strip no longer jumps the page. (4) The Services plotter
  follows the scroll from 1024px again until a row is clicked (row 01's
  starting open state used to hold it on drawing 01 for good). Its row
  pick also read row tops from `.svc` instead of the list (rows 05 to 07
  were unreachable) and kept advancing while the stuck sheet held the
  rows still; it now measures from the list and stops where the sheet
  sticks, so it always draws the row at the viewport middle. (5) The
  footer drops `role="contentinfo"`, which it cannot carry from inside
  `<main>`.

- **18 Nov, review fixes, items 6, 7, 18 and 22.** (6) The portrait's
  images decode off the main thread as ImageBitmaps; on a 4x throttled
  phone load the photo upload in the first frame went from 140 to 189 ms
  to 25 to 29 ms, and the portrait renders pixel for pixel the same at
  1440 and 390 (section 6). (7) Loader readiness is one-way: a portrait
  answer after the 6 s bail no longer makes the loader wait again (it
  used to hold until the 8.5 s backstop). (18) `usePortrait` imports
  `HeroPortrait` alongside the photo probe, so the two load together.
  (22) The unused `Portrait` component is gone (`usePortrait` and
  `PORTRAIT_SRC` stay).

- **18 Nov, review fixes, items 8, 9, 14, 15, 19, 23, 24 and 25.** Dead
  code only; nothing on screen changes. (8) `ServiceDrum.tsx` and the
  `VISUAL` switch are gone (Services renders the plotter directly), with
  the drum-only `.t-mono`, `.chrome` and bone and ash tokens. (9) The
  always-false `reduced()` is gone with every branch behind it (the
  plotter and disk "still" paths, the resume preview's still mode, the
  pin wall's data-motion watcher, the `html[data-motion="off"]` CSS);
  `soft()` is untouched and `motionLevel` and `DrawSVGPlugin` are no
  longer exported. (14) The facts card reads the work cities from
  `identity.locations`. (15) `LegalPage` always labels its tab
  `legal.tabLabel`; the `eyebrow` prop is gone. (19) `intro.eyebrow`,
  `ventures.eyebrow` and each venture's `live` are deleted. (23) The
  footer's socials cell always has its label, so it is always a `<dl>`.
  (24) The unused `--cream-2`, `--night`, `--night-deep`, `--paper` and
  `--paper-2` aliases are gone from `f0-base.css`. (25) The CSP comment
  counts three typefaces.

- **18 Nov, the name is craned in.** Parth asked for a type animation
  for his name inside the Span closed loader (the bridge, stamp, taxi
  and push are unchanged). The h1 is pencilled in as its plan and each
  letter is lowered onto it on a cable, in red primer, riveted and
  painted navy, each line's shade stepping in once it is down (section
  6). Same two lines, same size and box at every width; the landed hero
  is unchanged. Gone: the red-hot letter split (`data-dec`, `.bb-l`,
  `.bb-sh`, `.bb-one`) and the faint 0.18 first paint. Checked:
  clock-stepped frames at 1440x900, 1280x720, 768x1024 and 390x844, real
  time in full and soft motion, the hand-back pixel compare, the no-JS
  and pre-hydration paint, 4x throttled pacing at 390 with the overlay
  shown and hidden (no measurable difference in dev), and the tour.

## 16. Open items and known limitations

- **Three dependency advisories** (next, sharp, source-map-js; section
  1) wait for Parth's go-ahead, since fixing them downloads package
  updates. Run `npm audit --omit=dev` again after updating.
- **Commit and push the redesign** when Parth asks (as ParthBetai, with no
  co-author lines; `git add -A` first, since the drawing set is unstaged;
  scan the staged files for keys first, see section 11).
- **Deploy** to Vercel and set `RESEND_API_KEY` and `NEXT_PUBLIC_SITE_URL` there.
- **Send one real test message** through the chat once Parth agrees.
- **Resume PDF** still contains em dashes and his phone number, does not list
  the offline SOS app or React, and it is out of date against the site: "100%" detection, "sensor arrays", the humanoid
  "selected for presentation" (it won) and Afferex "Present". Parth has to edit
  the source, then re-render the preview (section 13).
- **Android photo** is a code close-up from one of the Java apps; a screenshot of
  the SOS app receiving an alert (or of the ordering UI) would suit the first
  card better.
- **JavaScript** is not listed anywhere (TypeScript appears only under
  Learning) although React and React Native are; ask Parth what he writes
  before adding it.
- **Accessibility (WCAG 2.2.2):** the stack rows now have a pause button,
  but the status strip's one-liner (4 s per line) and the ticket's rolling
  roles still have no keyboard pause; both hold while the pointer rests on
  them, the strip's also in a hidden tab and the roles' off screen, and
  screen readers get the strip's lines once as plain text. Parth's call
  whether to add a keyboard control (the smallest compliant change: let the
  About sheet's pause button hold the roles too, and give the strip a small
  pause toggle beside its line at 1180px and up). The Accessibility page
  lists both as known limitations. Without scripts the stack rows hold
  still, since their pause button needs JavaScript.
- **Bottom nav at rest on the hero:** once the intro hands off, the nav sits
  over the bottom of the hero's drawing (at 1024x768 and 768x1024 it
  covers the dimension line's labels, and at 360x740 part of the taxi;
  since the fourteenth round the Home stop sits at the taxi's tail,
  clear of it).
  Delaying its slide-in (for example until the first scroll) is one
  option; it is Parth's call.
- **Index tabs in transit:** while a sheet slides over the one before, its
  edge tab passes over that sheet's content (and over the hero's inner
  "01 Home" tab for a moment). That is the stacking itself, as in the
  mockup; at rest and on every jump the tabs land clear.
- **Parth to look at the thirteenth and fourteenth rounds**, with calls
  that are his: whether the printed balloon behind the phone makes it
  stand out (it replaced the lantern in the fifteenth round; the floppy's
  cream wash is gone, replaced by the paper sleeve), whether the paper sleeve makes
  the floppy stand out enough, whether the plotter's TITLE and NOTE rows
  are the "something unique" he wanted in place of the counter, the
  shape of the hero taxi's shrink (next items) and the pace of the
  route taxi on the level runs.
- **The new loader, Span closed, is in** (picked 17 Nov, section 6);
  Parth should see it on his own PC (soft mode plays it) before it
  ships. Caveat, the Archivo font swap: the fonts load with
  `display: swap`, so on a slow first visit the name can paint in the
  fallback face and change size when Archivo arrives (during the 80%
  hold, or at `BAIL_MS`). The bridge is fitted from the name's box when
  it is built and is not refitted on a font swap, only on a resize, so
  the towers could sit nearer the name than their 20px for that visit.
- **The hero name is smaller on short desktop screens** (820px tall and
  under, fifteenth round) to give the taxi's drive room. Parth should
  see it before it ships; the only other way to that room is a hold,
  which he turned down.
- **The hero taxi's drive is short on desktop.** Without a hold it has
  only the scroll before About's tab reaches the strip under the
  buttons: about 90 to 205px of scroll on laptops (96 at 1440x900, 281
  at 1920x1080), one or two wheel notches. Its shrink is planned on each
  refresh, even in perspective or front-loaded where the buttons need
  it, so the car is small before it passes under them. Staying big for
  longer would need still more room in the copy layout. His call whether
  it reads as quick.
- **On a phone the hero taxi mostly shrinks in place.** Its nose already
  sits near the gutter at rest (its left edge goes from 8px to 18px), so
  it travels little to the left before the small taxi takes over.
- **The hero taxi's wheels do not turn during the drive.** The colour
  taxi is one shared `<use>` symbol (`AmbassadorDefs.tsx`), so its wheels
  cannot be rolled on their own without redrawing the car, and there is
  no rolling helper any more (`ROLL` was deleted in the twelfth round).
- **The link preview card's taxi still faces right**, as the hero's did
  before the fourteenth round (it has no robot or note, so nothing else
  is out of date). Passing `flip` to the card's taxis in
  `scripts/make-share-image.mjs` and running it again (section 13)
  would match the hero, with the two `.alt.txt` files checked after.
- **The route taxi is brisk on the bridge and the kerb on desktop.** The
  hero's road no longer is: the big taxi drives it from scroll 0, in the
  same scroll that brings About up (no run-out since the fifteenth
  round), on a phone too. The bridge U-turn
  runs at about 3.7 times the scroll and the kerb at about 2.8 times;
  both are continuous, reversible and locked to the scroll, but quick on
  a mouse wheel.
- **The Victoria Memorial on phones:** most of it sits behind the
  portrait; only the dome's crown and one chhatri show, and the angel's
  wings sit just under the "Selected work" button, where they can read
  as an antenna on his hair. On short laptops (1280x650 and similar) it
  is moved down 30 units and the dome's crown sits just behind his hair.
- **Cursor over the floppy:** when the reticle locks onto the disk, its
  "PREVIEW" label can come out in the pale ink while half of it sits on
  the cream paper sleeve, because the colour is read at a point still
  over the disk's dark body (over the sleeve itself the cursor locks to
  the link box). Sampling at the label's centre, or a data
  attribute that sets the ink, would fix it.
- **Contact details:** at 768x1024 a mouse wheel over the chat log scrolls the
  chat, not the page (probably what a chat should do; not tried on a
  touch screen). On short screens (1100x700, 1280x720, 390x844,
  360x740) the bottom nav floats over the foot of the phone and the
  inbox label while the phone is centred; a little more scroll shows
  them.
- **A first scroll about seven seconds after load can stall** for about
  1.2s in the dev server under headless software rendering: that is the
  pin wall's idle WebGL build (`PinField.tsx`; most of it is three's
  shader-log read, which a production build skips). It is older than the fourteenth
  round, but the hero's drive is now the first thing people scroll, so
  check it on a real machine with the production build.
- **One frame without a taxi at the kerb hand-over** at 1440x900: the
  small taxi slides just under the screen's bottom edge one frame before
  the footer's taxi shows. Older than the fourteenth round.
- **Small code notes:** `socials` spells "Github", which is now the logo
  link's accessible name and tooltip (the brand writes "GitHub");
  a few UI
  words are written in the components rather than in `content.ts`
  ("Loading", "Click to preview", "Tap to preview", "Press Enter to
  preview", "Today", "HD", "Opens in a new tab", and since the fourteenth
  round the sleeve's "Resume" and the plotter's "Title" and "Note"; if
  the rule should be strict, a `resume.label` in `content.ts` could
  serve the sleeve and the disk's label); `tsc --noUnusedLocals`
  reports unused imports in `app/cookies/page.tsx` (`LI`, `UL`);
  each visit to the home page leaves paused
  tweens in GSAP's global timeline (`playOnce`'s batch calls and the
  `quickTo` tweens; 14 when first counted, up to about 26 in the
  fourteenth round's review), small and harmless.
- **Footer avoid band on phones** can be off by the URL bar's height until
  the next ScrollTrigger refresh (measuring on every resize would bring
  back per-frame reads).
- **Two development-only console notes:** with JavaScript off, the dev
  server streams the metadata (and the icon link) at the end of the body,
  so the browser asks for `/favicon.ico` and gets a 404; a prebuilt page
  puts the icon link in the head. And on Windows the pin wall's
  MeshStandardMaterial can log a D3D precision note as a three.js
  `WebGLProgram` warning in development; production skips that check.
- **Cursor colour misses:** elements that ignore the pointer are invisible to
  its colour check, so the plotter card reads as the row under it.
- **Windows firewall:** untick Public on the "Node.js" inbound rules.
- **Not yet tried on a real iPhone or Android phone** (only emulated).
- **Chat email check** is strict (rejects addresses with non-Latin characters).
- After the first deploy, check the link preview with LinkedIn's Post Inspector.
- Settled on 29 Sep: the humanoid is the robot that won at IIT Hyderabad.
- Still unknown (ask before using): the humanoid's exact servo count and which
  servo driver board, how many obstacle-test runs the car did, the solar panel's
  rating.

## 17. Hard-won lessons (read before editing)

- **Tailwind v4 transforms vs GSAP:** `translate-*`, `rotate-*`, `scale-*` set
  separate CSS properties that GSAP does not see. Never animate transforms with
  GSAP on an element that also has one of those utilities; use an outer wrapper
  for Tailwind and an inner one for GSAP.
- **CSS layers:** unlayered CSS beats Tailwind utilities, so component classes
  live in `@layer components`.
- **Fixed canvases:** the pin wall's fixed host (`PinField.tsx`,
  `fixed inset-0`, `data-pin-wall`) relies on no ancestor with a transform,
  filter, will-change, contain or content-visibility: any of them becomes
  the containing block, and the wall then sizes itself to the whole page.
  That covers the Contact sheet, its slot and `<main>`. The home page's
  fade-in after the intro uses `top` and `autoAlpha`, not a transform, for
  that reason, and `canTransform()` / `driveVeil()` refuse the wall's
  ancestors.
- **Browser top layer** (`<dialog>.showModal()`, popovers) paints above the custom
  cursor, which is `z-[70]`. Keep overlays in the normal stacking context.
- **React StrictMode** mounts effects twice in development: every effect must
  fully clean up (GSAP contexts, listeners, observers, timers, WebGL resources).
- **Soft mode is Parth's view.** Test with reduced motion on.
- **Always test a loader with `reducedMotion: "reduce"`.** Parth's PC
  uses it, and two preview loaders looked broken to him because they
  skipped under it. A loader must play in soft mode.
- **Dev server speed:** the first visit to each page compiles it; that delay is
  not a bug in the built site.
- **Never add `app/loading.tsx` (or any `loading.tsx`).** Next then wraps the
  pages in a Suspense boundary, and even prebuilt pages ship their content in
  `<div hidden id="S:0">` for an inline script to reveal: with JavaScript off
  the site is blank and text readers see a hidden fragment. Check with
  `grep -c 'hidden id="S:' .next/server/app/index.html` after a build (must be 0).
- **next/font/google** failed intermittently at build time, so fonts are
  self-hosted with `next/font/local`.
- **GSAP rounds pixel values while it tweens.** A `strokeDashoffset` tween on
  a path with `pathLength={1}` runs from 1 to 0, and GSAP rounded it to whole
  pixels, so each stroke popped in at the halfway mark instead of drawing.
  Every draw-on tween needs `autoRound: false`. Check by sampling the offset
  over time: a working arrow shows 18 to 34 distinct values, a broken one 2.
- **Build late timelines inside the GSAP context.** The hero's outro starts
  from a rAF loop or a backstop timer, after the `gsap.context` callback has
  returned, so its selectors ran against the whole document (the strip, the
  bottom nav and the work notes carried the same attributes) and
  `ctx.revert()` could not kill it on unmount. Create it through `self.add()`,
  and give unrelated elements distinct attributes (`data-work-note`).
- **Cursor colour: read what is painted, not a label.** Marking sections with
  `data-ground` missed buttons and nested surfaces. `document.elementsFromPoint`
  plus the first background with an alpha of at least 0.5 answers it, with
  `data-ground` as the fallback. A Tailwind opacity modifier comes back as
  `oklab(...)` and some colours as `color(...)` rather than `rgb(...)`, and
  elements with `pointer-events: none` are missing from the stack. Do the
  read only when the element under the pointer changes, and throttle the
  scroll-driven re-read (it was over a tenth of a throttled hero scroll).
- **No blend modes on fixed layers.** The cursor used difference blending
  and the grain a blend mode; a blended fixed layer makes the browser
  recomposite everything under it on every scroll. The cursor now picks
  navy or cream from the ground, and the grain is plain navy specks.
- **Blend modes and GSAP transforms:** a `mix-blend-mode` on an element that
  GSAP transforms is isolated by that transform and stops blending with the
  page. Put the blend on a static holder (the stamps do).
- **Check the widths in between.** The stamps looked right at 1440, 1024, 390
  and 360 but ran off the screen at 768 to 1023, and `overflow-x: clip` on
  `html` hides the damage (no scrollbar, only lost letters). Measure edges at
  768, 900 and 1023 too.
- **Jumps and scroll padding:** the strip and the bottom nav set scroll padding
  so that Tab never parks a link under them. `scrollIntoView` honours the
  bottom padding too and stops a jump short, and Lenis ignores both the
  root's `scroll-padding-top` and the target's `scroll-margin-top`. So every
  jump goes through `jumpTo` in `lib/motion.ts`, which computes the landing
  itself, from the anchor's natural-flow top minus its scroll margin (84px)
  minus the root's top padding (the strip's height), exactly where a native
  anchor jump would land. Leaving out the padding put every sheet's index
  tab half under the strip. Never `scrollIntoView` for jumps.
- **Sticky sheets need content, not padding, for their run-out.** A sticky
  box never enters its parent's padding, so the 100svh the next sheet needs
  to cover a stuck one is an `::after` spacer in the slot, with
  `margin-bottom: -100svh` to give the length back.
- **Measure in natural flow.** A stuck sheet's `getBoundingClientRect` is
  where it is stuck, not where it sits in the page, so every trigger
  position is read with `html[data-measure]` set (all sheets relative) at
  ScrollTrigger's refresh, or through `naturalTop()`.
- **The browser's focus scroll ignores sticky boxes.** Tabbing to a link in a
  sheet that a later sheet covers leaves it hidden under the cover. The
  focus guard runs two frames after focus (after the browser's own scroll)
  and scrolls the control to 35% down the viewport.
- **No layout reads in a scrub.** `maxScroll()` (a `scrollHeight` read) on
  every scroll frame showed up as 50 reads per 60 steps; use the trigger's
  cached `self.end`, values measured at refresh, or a ResizeObserver cache.
- **A roller that resizes itself resizes its card.** The ticket's rolling
  roles tweened their own height and the ticket (and the sheet, and every
  trigger below it) changed height with each role. They now sit in a
  one-cell grid with an invisible sizer for every role, so the cell always
  takes the tallest.
- **Never run `next build` or `next start` against a running dev server.**
  They share `.next`, and the dev server breaks.
- **Autofill and hydration:** Edge's autofill can write an empty `style=""` on
  form fields before React hydrates, which React reports as a mismatch. The
  chat's two fields and the honeypot carry `suppressHydrationWarning` for
  that reason only; it is the browser's attribute, not a bug in the markup.
- **A trigger clamped to a 1px range never toggles.** A scroll that
  reaches the bottom jumps its progress from 0 to 1 in one step, so it is
  never active and `onToggle` never fires. For state that must be right at
  the end of the page (the route's elbows), use `onEnter`, `onLeave`,
  `onEnterBack` and `onLeaveBack`, which fire even on that jump.
- **Scale a thin line in 2D.** GSAP's default `translate3d` puts the
  element on its own layer, and Chrome rasterises the layer at the tiny
  starting scale and stretches it: the route's 4px rail read as a soft,
  see-through bar at scale 0.04. `force3D: false` keeps it crisp.
- **Decoding a hash can throw.** `decodeURIComponent("%")` throws a
  URIError; uncaught inside an effect it unmounts the whole page. Wrap it.
- **Stroke draw-on arrows:** GSAP rounds pixel values, so a `strokeDashoffset`
  tween on a `pathLength="1"` path pops at the halfway mark. Pass
  `autoRound: false`.
- **A fixed bar should step aside by its own edge.** Watching the whole
  footer hid the bottom nav as soon as its top peeped in. It now steps aside
  only while one of the footer's text rows (the title block, the legal
  line) is actually passing behind the pill, worked out from positions
  measured at refresh, never per frame.
- **A hydration warning about a `style` attribute on the chat inputs** was seen
  once during the redesign. The server HTML has none and the code sets none,
  so it is almost certainly browser autofill (probably Edge's) adding the
  attribute before React loads, not a bug in the site.
- **Several builders on one dev server** make it slow, and their hot reloads
  reset pages in the middle of a check; lazily loaded photos can stay grey for
  seconds after a scripted jump. A page loaded while a file is being saved
  can also get a half-written chunk and throw a SyntaxError ("Unexpected
  end of input") or a `_gsap` error that never comes back on a rerun.
  Repeat a failing check before calling it a bug.
- **Line endings:** some files are CRLF and some LF. An edit that writes bare
  LF lines into a CRLF file mixes the two; keep each file's own endings.
- **Measure a route once, in natural flow.** The journey's taxi had to
  ride sticky sheets that slide over one another. Reading positions per
  frame cost layout and still drifted, because a stuck sheet's box is not
  where it would be in flow. The route is now chained once per
  ScrollTrigger refresh in sheet-local natural-flow coordinates (under
  `html[data-measure]`), and where a sheet is on screen at a given scroll
  is plain arithmetic from its natural top, its `--stick` and its 100svh
  of slack. Each frame is a lookup.
- **A browser can restore an old scroll position after your mount
  effect.** Setting `history.scrollRestoration = "manual"` in an effect is
  too late for Back; set it from the inline boot script, and pin the
  scroll while a lock is on.
- **The first rAF stamp can be older than the `performance.now()` you
  took before requesting it.** Floor a wall-clock step at 0.
- **The anchor is `<main>`'s first child, not the hero's slot.** A rule
  meant for "every slot after the hero", written as
  `.sheet-slot:not(:first-child)`, matched the hero's own slot too and
  blanked the page. Use `.sheet-slot ~ .sheet-slot`.
- **Hide in CSS from the first paint whatever a script hides at
  hydration.** `page.tsx` hides the sheets after the hero once React
  runs, but until then the next sheet's tab showed under the loader, so
  it appeared, vanished and came back. The loader's hold-back rules in
  `s1-hero.css` (under `html[data-motion]` only, so no-JS is untouched)
  now cover it.
- **Text that must not change while things fade round it needs its own
  layer.** As the street faded in, the browser switched the name's
  anti-aliasing between subpixel and greyscale and back, so the name
  that "never moves" still flickered at its edges. `will-change:
  transform` on the ink h1 keeps it on one layer (the h1 is not an
  ancestor of the pin wall).
- **Draw a piece that rides sticky sheets inside the sheet.** A fixed
  overlay for the route taxi would have to chase every sheet's sticky
  slide; drawn inside the sheet it is on, the sheet carries it and it
  cannot drift off its line.
- **A stand-in belongs to the journey.** On the home page never write
  `transform` or `visibility` on the deck taxi or on `.ftaxi` yourself;
  `driveRoute` owns them, and anything that follows them hangs off
  `onStand`.
- **Park things with CSS, and only drive them where the scroll really
  travels.** The footer taxi's 420px drive-in was a scroll tween; on an
  info page whose street was already on screen at load it stayed at its
  start, and the taxi sat 420px short of its spot. It is now simply
  parked there, by CSS, on every page but home.
- **A stand-in that starts parked: measure its box from layout offsets,
  not `getBoundingClientRect`,** because the intro may still be sliding a
  box around it. Without a run-out the drive has only the scroll before
  the next sheet's tab arrives, so plan its path against the things it
  must not cross on each refresh, and where that room is too short (a
  short laptop) make the room in the layout rather than hold the page.
- **Scrub a non-scaling draw-on by hand.** With `vector-effect:
  non-scaling-stroke` as an attribute, DrawSVG goes "live": every render
  of a stroke in flight calls `getScreenCTM`, `getBBox` and
  `getTotalLength`, a forced layout per frame (the loader's plot spent
  about 160ms in them). Keep the non-scaling stroke in CSS only, read each
  outline's length once, times the drawing's on-screen scale (a
  non-scaling stroke's dash is in screen px), and write only
  `stroke-dashoffset` in the frame loop, re-measuring on resize. Make the
  dash a pixel longer than the outline and the gap longer still, so
  undrawn leaves no round cap behind. Split compound paths into one path
  per outline, because Chrome restarts the dash at every subpath, which
  would draw every outline at once.
- **A z-index cannot lift a child out of its layer.** The hero's copy was
  inside the ink back layer (its own stacking context), so no z-index on
  it could put it over the taxi in the front layer, and the driven taxi
  painted over the buttons. Things that must stay on top need their own
  layer; for the copy that meant a mask turned upside down (`InkMask`) so
  the Exposure still swaps it for its blueprint copy at the line.
- **A label must never lag its arrow.** Two `playOnce` calls on
  different lines (0.85 for the note, 0.95 for its arrow) left a bare
  arrow on screen for up to 200px of scroll once the note sat below it.
  Fire a label and its pointer on the same line.
- **Keep lit pieces clear of a halo they sit under.** The Contact
  lantern's old 30px foot offset put its cap 8px from the phone's frame,
  inside the phone's 64px halo, which painted over the lamp; it had to
  hang 50px off, above the phone in the stacking order. (The lantern
  and the halo are gone since the fifteenth round.)
