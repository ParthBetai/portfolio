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
- **Where things stand (29 Sep 2026):** every requested feature is built and
  verified in a production build at 1440x900, 1280x720, 1024x768, 768x1024 and
  390x844, in both normal and reduced-motion modes, with no Content Security
  Policy violations, no console errors, no horizontal overflow and no em dashes
  in any page text. The last round was a whole-site polish pass (see the
  Changelog, seventh round).
  The site is **not deployed yet**. The contact email is configured locally but
  a real test message has not been sent (see [section 12](#12-the-contact-email-resend)).
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

- **Name:** Parth Betai. Shown as "PARTH" in the nav and footer wordmark.
- **Role on the site:** Software Developer.
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
  - **Android App Suite** (shown first: software before robotics, on request):
    Java apps built in Android Studio with XML layouts. The one to **highlight**
    is the **Domino's-style ordering UI replica** (product carousels, ratings, a
    review section, per the resume). The calculator app is **never** mentioned;
    the quiz app (with score tracking) only in passing; "many more apps like it".
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
  Hyderabad first place is mentioned only in the Robotics service text and on
  the humanoid's card (badge "1st place in Robotics · IIT Hyderabad").
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
"Loading" screen meanwhile (only when a page change takes longer than 160 ms). The production build has every page prebuilt.

Environment variables live in `.env.local` (not committed). See `.env.example`.

## 5. File map

```
app/
  layout.tsx            root layout: self-hosted fonts, metadata, motion boot
                        script, skip link, Cursor and Grain on every page
  page.tsx              the home page: SmoothScroll, Nav, Hero, then Intro,
                        Marquee, Services, Work, Ventures, Contact, Footer
  globals.css           tokens, type roles (.t-display .t-serif .t-mono),
                        .chrome, .glass, .gutter, keyframes, motion rules
  not-found.tsx         404 page (with the site footer)
  icon.svg              favicon: white "P" with a copper dot
  apple-icon.png        the same mark, 180x180, for iPhone home screens
  opengraph-image.jpg   the link preview card (1200x630), and its .alt.txt
  twitter-image.jpg     the same card for X, and its .alt.txt
  privacy/ terms/ cookies/ accessibility/ credits/   the info pages
  api/contact/route.ts  POST endpoint that emails chat messages via Resend
  robots.ts sitemap.ts  absolute URLs from lib/site.ts
  fonts/                Archivo (variable), Instrument Serif italic, JetBrains Mono
components/
  Hero.tsx              the loader and hero: name decodes into PORTFOLIO, then
                        the word rises and the portrait climbs in
  HeroPortrait.tsx      three.js 3D relief of Parth's cut-out photo
  Portrait.tsx          detects which portrait files exist
  HeroOrb.tsx           liquid-chrome orb, the fallback when there is no photo
  Nav.tsx               fixed top nav, section tracking, mobile menu
  Intro.tsx             "Intro" heading, paragraph (word-by-word reveal), the
                        "short version" facts card with the rolling row
  ResumeDisk.tsx        the 3D floppy disk that opens the resume preview
  ResumePreview.tsx     the preview overlay and its disc-opening animation
  Marquee.tsx           the four drifting tech-stack rows with labels
  Services.tsx          "What I can do" accordion; VISUAL switch at the top
  ServicePlotter.tsx    blueprint sheet that plots a drawing per service
  ServiceDrawings.ts    the seven technical drawings (SVG data)
  ServiceDrum.tsx       the older rotary drum visual (kept, off by default)
  Work.tsx              "Selected work" project cards
  Ventures.tsx          "Founder journey" railway timeline
  Contact.tsx           "Get in touch" section around the phone
  PhoneChat.tsx         the 3D phone and its chat-shaped contact form
  PinField.tsx          WebGL pin-art wall behind the contact section
  Footer.tsx            the footer on every page (sunrise horizon, wordmark)
  LegalPage.tsx         shell and prose helpers for the info pages
  Cursor.tsx            the engineering-reticle cursor
  RouteProgress.tsx     "Loading" screen between pages (replaced app/loading.tsx)
  SmoothScroll.tsx      Lenis smooth scroll and keyboard scrolling
  Magnetic.tsx          magnetic hover for buttons
  SocialIcon.tsx        GitHub, LinkedIn, Instagram, X icons
  Grain.tsx Dust.tsx    film grain and drifting dust overlays
lib/
  content.ts            every word, link and project on the site
  site.ts               the public address (SITE_URL) and pageMeta() for the
                        info pages' titles, canonical links and previews
  motion.ts             gsap, ScrollTrigger, motion policy helpers, text helpers
  motionBoot.ts         inline script that sets html[data-motion] before paint
  useYear.ts            current year after mount (avoids hydration mismatch)
public/
  Parth-Betai-Resume.pdf  the resume (public; contains his phone number)
  resume-preview.webp     picture of the resume page for the preview (1800x2546)
  portrait.webp           Parth's cut-out photo for the hero
  portrait-depth.png      depth map for the 3D relief
  work/*.jpg              the four project photos
assets/
  portrait-source.jpg   original photo the cut-out is made from (not served)
scripts/
  render-resume-preview.mjs   makes public/resume-preview.webp from the PDF
  make-portrait.mjs           makes the cut-out and depth map from the photo
  screenshots.mjs             screenshot checker used to verify every change
  make-share-image.mjs        makes the link preview card and the iPhone icon
.env.example            documents the environment variables
```

## 6. The page, section by section

### Loader and hero (`Hero.tsx`, `HeroPortrait.tsx`)
- The hero **is** the loading screen. "PARTH" decodes letter by letter into
  `identity.heroWord` ("PORTFOLIO") with a percentage and progress line that
  track real readiness (fonts plus the portrait). Backstops stop it hanging.
- Then the word glides up, "Software Developer" and the Contact button rise in,
  and the portrait climbs from below into the middle of the screen, below the
  word and in front of its lower part. Scroll is locked until this hands off.
- The portrait (`HeroPortrait.tsx`) is a finely subdivided plane textured with
  `public/portrait.webp` and pushed toward the camera by `public/portrait-depth.png`,
  so it is a real 3D relief. It turns a few degrees toward the cursor, floats
  gently when idle, has soft warm (left) and cool (right) rim lights matching the
  photo, and fades into the page at the waist. On software rendering or without
  WebGL it falls back to the flat cut-out; `?portrait=flat` in the URL forces
  that for testing. Without the photo files the old chrome orb returns.
- Scrolling away scrubs the word up and fades the hero.

### Nav (`Nav.tsx`)
Fixed top bar: "PARTH." (copper dot) and Home, About, Services, Work, Contact with
the current section underlined. On phones it becomes a Menu overlay.

### Intro (`Intro.tsx`, `ResumeDisk.tsx`, `ResumePreview.tsx`)
- Big chrome "Intro" heading and a frosted card with the paragraph from
  `intro.body`. Each word lights up from dim to full as it scrolls through.
- "The short version" card: Primary work location (Jaipur, India), Secondary
  work location (Kolkata, India), Status (Undergraduate, first year), and one
  rolling row, **Available to work as**, whose job titles roll one at a time in
  copper. (A "Learning right now" row and a green dot were removed on request.)
  The small labels in the card are plain grey (`ash`), readable at a glance.
- A second cut-out photo can take the card's place: set `intro.photo` in
  `content.ts` to its path in `public/`. It is a setting rather than a check
  for the file, so the page never requests a file that isn't there (the old
  check logged a failed request on every visit).
- **The floppy disk** lies on the card's corner (below it on phones). It tilts
  toward the cursor, lifts on hover and its metal shutter slides open. Clicking
  it plays the **disc opening**: the page dims, the floppy flies to the centre,
  a shiny rainbow disc slides out like a DVD tray, spins up with a copper
  progress ring and a "Reading... 184 KB" readout, then turns edge-on and the
  resume unfolds out of it into a large readable preview (the picture
  `public/resume-preview.webp`). The preview has Download PDF, Open in new tab,
  Zoom and Close (Esc or clicking outside also close). Closing plays it in
  reverse. The PDF card in the phone chat opens the same preview. Ctrl or middle
  click on the floppy still downloads the file directly, and so does the
  footer's Resume link. The overlay is not a browser `<dialog>` (the top layer
  would hide the custom cursor): it is portalled to `<body>` at z-65 and makes
  the rest of the page inert while open.

### Tech stack band (`Marquee.tsx`)
Four rows drifting in alternating directions: **Stack**, **AI**, **Hardware**,
**Learning** (tools still being learned, labelled honestly). The **AI** row names
practices, not products: AI-assisted development, LLM APIs, Prompt engineering,
Automation, AI workflows, Model testing (the old list of twelve model names was
removed on request). Labels are copper in equal-width dark pills (each pill
stacks all four labels invisibly so every pill takes the widest one's width;
the extra labels are drawn with CSS so text readers only get the real one); every name is plain grey upper case,
separated by a tiny grey square at mid-height (it used to be a full stop on the
baseline). Both edges of the band fade into the dark. Hover slows the rows; off
screen they pause; fast scrolling surges and skews them.

### What I can do (`Services.tsx`, `ServicePlotter.tsx`)
- Right-aligned chrome heading and seven full-width rows (Mobile Development,
  Robotics and Embedded Systems, AI and Automation, Full-Stack Development,
  Cybersecurity, Web Design and Branding, DevOps and Tooling). Hover or open floods
  a row edge to edge in copper; open rows show points and a paragraph. The AI
  and Automation row lists practices (AI-assisted development, prompt
  engineering and model testing, LLM APIs), not tool names. Without JavaScript
  every row shows open and readable (`inert` and `aria-expanded` only apply
  after mount).
- The signature is a **blueprint plotter**: a dark drafting sheet with grid, zone
  frame, notes, parts list and title block (DWG NO., title, SCALE 1:1, SHEET, DRAWN
  P. BETAI, REV A). A small pen plots a technical drawing for the selected
  service: phone in two views, servo robot arm, neural network into a chip,
  isometric stack, exploded padlock in a shield, browser wireframe with golden
  spiral, gears with a terminal. The row level with the sheet is selected while
  scrolling; hover, focus or opening a row takes over. On phones the sheet sits
  above the list and plots the opened row.
- The earlier rotary drum is kept: set `VISUAL = "drum"` at the top of
  `Services.tsx` to switch.

### Selected work (`Work.tsx`)
The heading, blurb and "Work with me" button rise in together (on phones the
heading used to slide up through the blurb). Four project cards with Parth's
own photos (`public/work/`), **software first**: 01 Android App Suite (badge
"Domino's-style ordering UI"), 02 Mini Humanoid Robot ("1st place in Robotics ·
IIT Hyderabad"), 03 Obstacle-Avoiding Autonomous Car ("Looks both ways before it
turns"), 04 Wireless Charging EV Model ("Solar-charged cells power the track").
Each card's text explains how the build works (see section 2). Badges are 38
characters or fewer so they stay on one line on a 360px phone. `index` is also
the React key and heading id, so renumber when reordering. A "Work with me"
button jumps to the contact section. A project can set an optional
`focus` (CSS object-position, for example `"85% 50%"`) in `content.ts` to choose
which part of a wide photo stays in frame. The Android photo is currently a
close-up of an XML layout (780x440, swapped in by Parth on 29 Sep); a screenshot
of the ordering app itself would show off that project better.

### Founder journey (`Ventures.tsx`, id `journey`)
A short section drawn as a railway line to scale (one month = 2.6% width). Psquare
Online runs on a branch line that ends at a buffer stop, a curved "Pivot" switch
carries the line to the main line, and Afferex is the next station, whose line
also ends at a buffer stop (both ventures are wound down); a dashed line beyond
is the next chapter. The line draws with the scroll. On phones it runs
vertically. The heading and blurb rise in as one block. Cards show status chip ("Wrapped up"), name, role and period, kind,
text and three facts. No pulses or blinking lights (removed on request).

### Get in touch (`Contact.tsx`, `PhoneChat.tsx`, `PinField.tsx`)
- Left: heading, blurb, email, work locations, social icons. Right: a CSS-3D
  phone (titanium frame, buttons, dynamic island) that tilts toward the cursor
  and turns face-on while typing.
- The phone runs a chat that is really the contact form: greeting, the resume
  as a PDF attachment, then name, email (validated), topic (quick replies or
  typed), message, a summary and **Send message**. Sending posts to
  `/api/contact`, which emails Parth (see [section 12](#12-the-contact-email-resend)).
  If that fails, Parth "replies" that it didn't go through and offers
  **Use my email app** (a prefilled `mailto:`) and **Start over**.
- **Without JavaScript** (crawlers, text extractors, reader modes, JS off) the
  phone shows a finished conversation instead of an error: the greeting, the
  resume as a download link, a closing line from `contact.chat.noscript`, and
  his email as a `mailto:` bar where the input sits. It is inside `<noscript>`,
  so it never renders with JS on. A rule in `globals.css`,
  `html:not([data-motion]) [data-js-only]`, hides controls that need scripts
  (the chat form, the hero loader readout, the phone Menu button, the floppy's
  "preview" hint); the boot script always sets `data-motion`, so it never
  matches for JS visitors. Deliberately **no plain HTML form**: a static form
  invites spam bots. The old line "The chat needs JavaScript..." is gone.
- Behind it, `PinField.tsx` is a WebGL wall of thousands of metal pins that push
  out under the cursor, ripple when someone types or sends, breathe when idle
  and rise in a sweep as the section scrolls in. Copper light from behind shows
  where pins stand up. The section clips a fixed, full-screen canvas with
  `clip-path` (the "window" trick); nothing between the canvas and the viewport
  may have a transform. The wall fades in from the journey section at the top and
  sinks into the footer's black at the bottom (no hard edges).
- The wall is set up about seven seconds after the page loads, in the browser's
  next idle moment (or earlier if someone jumps close to it), so the setup work
  never lands in the middle of a scroll. It only draws while on screen. With a
  data saver on it waits until the visitor scrolls near.

### Footer (`Footer.tsx`)
The same footer on every page: email, section links (they point back to the home
page sections when used on another page, and the home page then scrolls there
after its intro), a Resume download link, "Let's build something" with a Get in
touch button, social icons, a giant "PARTH" wordmark over a warm copper sunrise
horizon, and the legal links (the current page is highlighted). The old
Motion on/off button was removed on request. On the home page it sits outside
`<main>` (so screen readers see it as the page footer) and fades in with the
rest after the intro.

### Everywhere
- **Cursor (`Cursor.tsx`):** an engineering reticle (four corner brackets, a
  centre dot glued to the pointer, a coordinate readout) that locks onto buttons
  and links with a one-word label (GO, OPEN, MAIL, PRESS, DOWNLOAD, PREVIEW, ZOOM).
  Hidden on touch devices and over text fields.
- **Smooth scroll (`SmoothScroll.tsx`):** Lenis in full motion, native scrolling
  in reduced motion; scroll keys are routed through it.
- **Grain and dust** overlays.
- **Link previews and search:** sharing any page on LinkedIn, WhatsApp, X and
  so on shows a 1200x630 card (`app/opengraph-image.jpg`: chrome "PARTH BETAI",
  "SOFTWARE Developer", "Android apps, robots and websites", "Jaipur and
  Kolkata, India", his cut-out photo over the copper horizon). Each info page
  has its own preview title and canonical link (`pageMeta()` in `lib/site.ts`).
  The layout also carries schema.org `Person` data (name, role, email, Jaipur,
  the four profile links) for search engines. All absolute URLs come from
  `SITE_URL` in `lib/site.ts`: `NEXT_PUBLIC_SITE_URL` if set, otherwise
  Vercel's own production address, otherwise localhost.

## 7. The other pages

`/privacy`, `/terms`, `/cookies`, `/accessibility`, `/credits`, all using
`LegalPage.tsx` and the shared footer, plus a styled 404. Written in plain words
and accurate to the code, but not reviewed by a lawyer. Key facts they state:

- No cookies, no analytics, no trackers, no local storage. (An old Motion button
  saved `motion=off` in local storage; the boot script now deletes that key.)
- All fonts, photos and the PDF are served from the site itself.
- The contact chat sends the four answers to the site's server, which emails
  them via **Resend**; the site keeps no copy. The IP address is kept in memory
  briefly for rate limiting only.
- Photos and the portrait are Parth's own. Fonts are under the SIL OFL.
- `legal.updated` in `content.ts` is the "last updated" date on all of them;
  change it whenever a policy page changes.

## 8. Content: lib/content.ts

All copy lives here; components never hardcode text beyond tiny UI labels.
Exports: `identity`, `resume`, `nav`, `socials`, `intro`, `stacks`, `services`,
`work`, `ventures`, `contact` (including every chat line in `contact.chat`),
`legal`, `meta`. Wrap one word in `*asterisks*` in a heading or title to give it
the thin accent style. The `socials` label also chooses the icon.

## 9. Design system

- **Colours** (`@theme` in `app/globals.css`): void `#050505` (page), carbon
  `#0d0d0f` and `#141417` (raised surfaces), hairline `#1f1f24`, bone `#edede6`
  (text), ash `#7a7a82` (secondary; lifted from `#6b6b72` on 29 Sep so small
  labels reach about 4.6:1 on the page) and ash-dim `#3d3d44` (decoration only,
  never for text someone needs to read), and the accent, a
  **warm copper `#e0895a`** (dim `#a8653f`) taken from the rim light in Parth's
  photo. The token is still called `acid` (`bg-acid`, `text-acid`) for history;
  the neon lime it used to be was removed on request. Use the accent for things
  you press and one highlight per object. No glows.
- **Type:** Archivo variable (self-hosted) for everything.
  `.t-display` is Archivo at weight 900, width 125, upper case, tight.
  `.t-serif` is now the thin accent: Archivo weight 250, width 100, lower case
  (the name is historical; it used to be Instrument Serif italic).
  `.t-mono` is small upper-case labels in the body sans with 0.1em tracking.
  JetBrains Mono (`font-mono`) is used only for machine readouts: the cursor, the
  drawing sheet, the disk readout. Instrument Serif italic (`font-serif italic`)
  survives only as the handwriting on the floppy label.
- **`.chrome`:** the display type lit like metal, with a highlight that follows
  the cursor and scroll.
- **Signature objects:** every section has one (3D portrait, floppy disk, drafting
  sheet, railway line, phone over the pin wall, sunrise horizon).

## 10. Motion policy

`lib/motion.ts` decides one of two levels on load and `lib/motionBoot.ts` sets
`html[data-motion]` before first paint:

- **full:** everything, including Lenis smooth-scroll inertia and effects driven
  by scroll velocity (marquee surge and skew, the chrome highlight kick).
- **soft:** when the OS asks for reduced motion. It must look and move **exactly
  like full**, except scroll inertia and velocity-driven effects. This matters
  because Parth's own PC has Windows animations off, so soft is what he sees;
  earlier versions shrank or skipped animations in soft mode and he thought
  they were missing.
- `reduced()` still exists for the old "off" level but always returns false now.

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
  `images.unoptimized` (the `/_next/image` endpoint answers 404).
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
  in production. `.env*` is git-ignored except `.env.example`. Never put a secret
  in a `NEXT_PUBLIC_*` variable. Never write a key into this README.
- **Content:** no `dangerouslySetInnerHTML` except two constants in the layout:
  the motion boot script and the schema.org JSON, which is built from
  `content.ts` at build time with every `<` escaped;
  all user text renders as React text; the `mailto:` fallback encodes every part
  and has a fixed recipient; external links use `rel="noopener noreferrer"`.
- Git: local tool folders (anything like a hidden settings folder for an
  editor or assistant) stay out of the repository through
  `.git/info/exclude`, not `.gitignore`, so the public ignore file names no
  tool. Before every commit, check `git status` for `.env.local` and scan the
  staged files for keys (`git grep --cached -nE 're_[A-Za-z0-9_]{16,}'`).

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
- **Link preview card:** `node scripts/make-share-image.mjs` rebuilds
  `app/opengraph-image.jpg`, `app/twitter-image.jpg` and `app/apple-icon.png`
  from the fonts, `public/portrait.webp` and the name, role and places in
  `content.ts`. Run it after changing any of those. The alt text is in the two
  `.alt.txt` files next to the images.
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
  cursor. Footer social icons. Location set to Jaipur. Humanized intro without em
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
  Removed tool names from the code and comments (the AI models row now lists
  Perplexity instead, and the AI service line reads "ChatGPT, Gemini and Copilot
  every day"). Project cards accept an optional `focus` crop. README rewritten as
  this handbook. Resend key added to
  `.env.local`. Portrait cut-out and screenshot scripts saved in `scripts/`, the
  original photo in `assets/`.
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
- **29 Sep, git.** Repository created and pushed to
  https://github.com/ParthBetai/portfolio (`main`, 75 files in the first
  commit). Checked before pushing: no `.env.local`, no `node_modules` or build
  output, no local tool folder, no real key in any file.

## 16. Open items and known limitations

- **Deploy** to Vercel and set `RESEND_API_KEY` and `NEXT_PUBLIC_SITE_URL` there.
- **Send one real test message** through the chat once Parth agrees.
- **Resume PDF** still contains em dashes and his phone number, and it is out
  of date against the site: "100%" detection, "sensor arrays", the humanoid
  "selected for presentation" (it won) and Afferex "Present". Parth has to edit
  the source, then re-render the preview (section 13).
- **Android photo** is a code close-up; a screenshot of the ordering UI would
  suit the first card better.
- **Accessibility:** with the Motion button gone there is no way to stop the
  drifting tech-stack rows (WCAG 2.2.2). Hover slows them; the Accessibility page
  says so honestly.
- **Windows firewall:** untick Public on the "Node.js" inbound rules.
- **Not yet tried on a real iPhone or Android phone** (only emulated).
- **Chat email check** is strict (rejects addresses with non-Latin characters).
- Optional: a second cut-out photo (set `intro.photo`) would replace the facts card.
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
- **Fixed canvases:** the pin wall and the hero rely on no transformed ancestor.
  The home page's fade-in after the intro uses `top`, not a transform, for that
  reason.
- **Browser top layer** (`<dialog>.showModal()`, popovers) paints above the custom
  cursor, which is `z-[70]`. Keep overlays in the normal stacking context.
- **React StrictMode** mounts effects twice in development: every effect must
  fully clean up (GSAP contexts, listeners, observers, timers, WebGL resources).
- **Soft mode is Parth's view.** Test with reduced motion on.
- **Dev server speed:** the first visit to each page compiles it; that delay is
  not a bug in the built site.
- **Never add `app/loading.tsx` (or any `loading.tsx`).** Next then wraps the
  pages in a Suspense boundary, and even prebuilt pages ship their content in
  `<div hidden id="S:0">` for an inline script to reveal: with JavaScript off
  the site is blank and text readers see a hidden fragment. Check with
  `grep -c 'hidden id="S:' .next/server/app/index.html` after a build (must be 0).
- **next/font/google** failed intermittently at build time, so fonts are
  self-hosted with `next/font/local`.
