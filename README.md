# Parth Betai · Portfolio

The personal portfolio website of **Parth Betai**, a Software Developer &
Robotics Engineer. One long, heavily animated home page drawn as a set of
Kolkata engineering drawings, five short info pages, and a contact form
disguised as a chat on a 3D phone.

This file explains **what the website is, why it looks the way it does,
what a visitor sees and does, how to run it, and where the project
stands**. It is written for anyone: Parth himself, a friend helping out, a
designer, or a developer joining the project.

The project keeps exactly **two documentation files**:

- **README.md** (this file): the website as a product. What it says, how
  it feels, how it behaves, how to run it, what is still open, and the
  rules for working on it.
- **[CODEBASE.md](CODEBASE.md)**: the code in depth. Every file, every
  library, how the pieces fit together, the contracts and hard-won lessons
  that keep them from breaking, every open item and the full changelog.

Read both and you can pick the project up from anywhere. Together they are
the project's memory, so **both must be updated in the same change**
whenever something is added, removed or decided (see
[section 13](#13-house-rules-for-anyone-working-on-it)).

---

## Contents

1. [The site in one minute](#1-the-site-in-one-minute)
2. [Who Parth is (as the site tells it)](#2-who-parth-is-as-the-site-tells-it)
3. [The concept: The Drawing Set, Kolkata edition](#3-the-concept-the-drawing-set-kolkata-edition)
4. [A visitor's walk through the home page](#4-a-visitors-walk-through-the-home-page)
5. [Things that are on every page](#5-things-that-are-on-every-page)
6. [The other pages](#6-the-other-pages)
7. [How the site adapts: reduced motion, no JavaScript, phones](#7-how-the-site-adapts-reduced-motion-no-javascript-phones)
8. [The contact form, from the visitor's side](#8-the-contact-form-from-the-visitors-side)
9. [Accessibility and privacy](#9-accessibility-and-privacy)
10. [Quick start: run, build, deploy](#10-quick-start-run-build-deploy)
11. [Current status and open items](#11-current-status-and-open-items)
12. [How the design got here: a short history](#12-how-the-design-got-here-a-short-history)
13. [House rules for anyone working on it](#13-house-rules-for-anyone-working-on-it)
14. [Where to change what](#14-where-to-change-what)
15. [Glossary](#15-glossary)

---

## 1. The site in one minute

- **What it is:** the personal portfolio of **Parth Betai**, a Software
  Developer & Robotics Engineer. It introduces him, shows what he can do,
  shows four things he has built, tells the story of two small businesses
  he ran, and lets a visitor send him a message.
- **Shape:** one long home page made of **six numbered "sheets"** (01 Home,
  02 About, 03 Services, 04 Work, 05 Journey, 06 Contact), plus five short
  info pages (privacy, terms, cookies, accessibility, credits) and a
  "page not found" (404) page.
- **Look:** a set of engineering drawings from Kolkata. Cream paper, navy
  ink, blueprint blue, green grid paper and a night-navy street. One yellow
  Kolkata Ambassador taxi drives a drawn route down the whole page.
- **Feel:** heavily animated, but every animation is tied to something real
  (a bridge being built, a taxi driving, ink being pressed). Sheets stick
  and slide over each other as you scroll.
- **Built with:** Next.js 15 (the web framework), React 19 (the user
  interface library), TypeScript (JavaScript with types), Tailwind CSS v4
  (styling), GSAP with its ScrollTrigger plug-in (animation tied to
  scrolling), Lenis (smooth scrolling), three.js (3D graphics in the
  browser) and Resend (the service that delivers the contact email).
  CODEBASE.md explains each one, with versions.
- **Where it lives:** the code is on GitHub at
  `https://github.com/ParthBetai/portfolio`, branch `main` (repository
  created 29 Sep 2026). It is **not deployed yet**. The planned host is
  Vercel.

---

## 2. Who Parth is (as the site tells it)

Everything the site says comes from `lib/content.ts`, the one file that
holds every word on the site. Its header sets a strict rule: facts come
only from Parth's resume or from things Parth confirmed directly, and
**no number goes in that nobody counted**.

| Fact | What the site says |
|---|---|
| Name | Parth Betai (the strip and the hero say "Parth Betai"; the footer's enamel sign says "Parth") |
| Role | Software Developer & Robotics Engineer (in a sentence: "software developer and robotics engineer") |
| Status | Undergraduate, first year |
| Primary work location | Jaipur, India (where he studies) |
| Secondary work location | Kolkata, India (home) |
| Email (public) | parthbetai007@gmail.com |
| Phone | Deliberately not on the site (it would attract spam calls) |
| Social links | GitHub (ParthBetai), LinkedIn (codewithparth), Instagram (ftxparth), X (ftxparth) |
| Resume | `/Parth-Betai-Resume.pdf`, 184 KB, 1 page, updated May 2026 |

The role is one value (`identity.role`), so the hero, the footer sign, the
title block, the page title and the share card all follow it. Parth asked
for "Robotics Engineer" beside "Software Developer" on 12 Oct.

**Available to work as:** Android developer, software engineering intern,
robotics intern, embedded systems intern, web developer, freelance
designer, AI automation builder.

**His story in short (from the intro paragraph):** from Kolkata, now in
Jaipur for his undergraduate degree. He started with Android apps in Java
and Kotlin, moved into robotics (Arduino boards, servo motors, sensors), and
founded and ran two ventures, an online store and a digital studio for
small businesses. The work he enjoys most is where software meets the
physical world.

**The four projects (Work sheet):**

| # | Project | Kind | Badge |
|---|---|---|---|
| 01 | Android App Suite: an offline SOS app in React Native that relays alerts phone to phone over Bluetooth Low Energy, plus Java apps such as a Domino's ordering UI replica | Mobile | Offline SOS, relayed phone to phone |
| 02 | Mini Humanoid Robot: 8+ servos on a PWM servo driver board run by an Arduino, motion in C++ eased between hand-tuned poses | Robotics | 1st place in Robotics · IIT Hyderabad |
| 03 | Obstacle-Avoiding Autonomous Car: one ultrasonic sensor on a servo, checks left and right, steers toward more room | Embedded | Looks both ways before it turns |
| 04 | Wireless Charging EV Model: solar panel, three 18650 cells, a relay switches on a coil in the track when the car arrives | Hardware | Solar-charged cells power the track |

Software comes before robotics on purpose (Parth asked for that order).

**The two ventures (Journey sheet):**

- **Psquare Online** (CEO & Founder, Jul 2024 to 2025): a dropshipping
  store grown to 50+ products over about 12 months. Closed to focus on
  Afferex.
- **Afferex** (Founder, Mar 2026 to 2026): a studio that offered small
  businesses websites, admin panels, business systems, logos and social
  media, using AI-assisted workflows. Wound down, so it is always written
  in the past tense. The copy describes what it **offered**, never client
  work it delivered, because it was still finding its first clients
  (confirmed by Parth on 29 Sep).

**Seven services (Services sheet):** Mobile Development, Robotics &
Embedded Systems, AI & Automation, Full-Stack Development, Cybersecurity,
Web Design & Branding, DevOps & Tooling. Anything still being learned is
marked "(learning)".

**Tech stack rows (About sheet):** Stack, Intelligent systems (Parth named
this row himself; keep his name), Hardware, and a row honestly labelled
**Learning** (Flutter, Next.js, TypeScript and others), so the page never
claims a tool he is still picking up. React and React Native are in his
stack (confirmed 29 Sep).

### Facts on file that the site does not show

These come from his resume or from Parth directly. They are recorded here
so nobody has to ask again, and so nobody adds them without checking:

- **From:** Kolkata, West Bengal, India. **Now:** Jaipur, for a four-year
  undergraduate programme started in 2026.
- **School:** Delhi Public School Megacity, Kolkata, Apr 2013 to Mar 2026.
  Class XII with Mathematics, Physics, Chemistry and Computer Science.
- **Achievements (resume):** 1st place in Robotics at IIT Hyderabad
  (national-level, interstate); Abacus all-India 1st and 2nd round winner;
  shooting 1st place zonals, regionals qualified; karate brown belt (2
  kyu); hackathons: 1st App Dev at Cresco Scientiam 2024, 2nd App Dev at
  Cresco Scientiam 2023, 3rd Research and Analysis at Udaan, 3rd
  Competitive Programming at Yuvakarshan, 3rd Shark Tank at X-Celsior,
  finalist at Cathcon; student representative at Relativity 2024, Logique
  2025 and X-Celsior 2025 (won).
- **He does not want wins or competitions in the intro paragraph.** The
  IIT Hyderabad first place appears only in the Robotics service text and
  on the humanoid's card (its badge, medal and stamp).
- **Leadership:** Director, Tech Club (Mar 2024 on, mentored 50+ students);
  Secretary, Interact Club (Rotary); Student Captain, Outreach; VP of
  Cresco Scientiam 2025; IT Head of Cresco Scientiam 2024; Vice Captain,
  Discipline; Vice President, Science Club.
- **Certifications:** HarvardX CS50 Introduction to Game Development; Cisco
  Introduction to Cybersecurity; Forage virtual internships (J.P. Morgan
  investment banking and software engineering, Tata cybersecurity analyst,
  Goldman Sachs internal audit).
- **Skills (resume):** Java, Kotlin, Android, C++, Python, HTML, CSS, Git,
  Spring, REST APIs, SQL, message queuing, build tools, Arduino, embedded
  systems, circuit design, sensor programming, hardware prototyping, OOP,
  data structures, plus finance and security topics (IAM, network defence,
  risk assessment, auditing, ethical hacking).
- **Interests:** coding, cycling, electronics experiments, robotics
  research.
- **Project details he confirmed (29 Sep):** the SOS app sends an SOS with
  the sender's GPS location and an optional short text over Bluetooth Low
  Energy; every phone that hears it alerts (sound or vibration) and
  re-broadcasts it hop by hop; an ID on each SOS stops endless relaying.
  The ordering UI replica was built in Java with XML layouts in Android
  Studio. The calculator app is **never** mentioned; the quiz app only in
  passing. The humanoid runs 5+ motion sequences built from hand-tuned
  poses and **is** the robot that won at IIT Hyderabad. The car uses four
  geared motors through a motor driver board and two 18650 cells; its
  tests were not counted. The EV model was shown at two institutional
  exhibitions; Parth built its wireless charging circuit and motor
  control.
- **Never claimed, because unconfirmed:** for the SOS app, the Bluetooth
  SIG "Mesh" standard, TypeScript, iOS, range, how many phones or hops were
  tested, library names; the humanoid's exact servo count and driver
  board; how many test runs the car did; the solar panel's rating; any
  percentage.
- **His machine:** a Windows 11 laptop (Intel Iris Xe graphics) with
  Windows "Animation effects" switched **off**, so browsers report reduced
  motion for him (see section 7). He plans to move to Linux. His college
  network is a public Wi-Fi, which is why the dev server only listens on
  this computer.

---

## 3. The concept: The Drawing Set, Kolkata edition

### The idea

The page is **Parth's own numbered set of drawing sheets**, laid on a desk
one over another, the way an engineer's drawing set is bound. Each section
is a sheet with:

- a thin double frame and four crosshair "registration marks" in the
  corners (the marks printers use to line sheets up);
- an **index tab** at the top edge with a circled number and a label
  ("01 Home" to "06 Contact");
- its own paper colour, called its **ground**.

On top of that, the whole page is **one taxi ride**. An inked route line
runs down the left margin (the "gutter") of every sheet, from the Home
stop in the hero, over the Howrah Bridge, past the service "stations" and
the four projects, to a night street in the footer where the taxi parks
under a lamp and the page says **"You've arrived"**. A small taxi drives
that route as you scroll, and the line is solid behind it and pencil-dotted
ahead of it. On three stretches (the hero road, the bridge deck and the
footer kerb) a bigger "stand-in" taxi takes over from the small one.

### Why Kolkata, why a taxi

Parth is from Kolkata. The city's yellow Ambassador taxis, the Howrah
Bridge, the trams, the Victoria Memorial and the ghats (steps down to the
river) give the site a world that is clearly his, instead of a generic
template. The taxi also suits a portfolio: a visitor is taken on a ride
through his work.

### Three directions combined

After the yellow-and-black taxi round felt like "too much caution vibes",
four new directions were drawn up and judged; one (a kinetic magazine) was
dropped. On 5 October 2026 Parth was shown the remaining three and chose
"A+B+C all 3 combined all major elements":

- **A, the drawing set:** sheets, frames, registration marks, index tabs,
  blueprint (cyanotype) prints.
- **B, the city ride:** the taxi route and the Kolkata scenes (street,
  bridge, tram, ghat, night street).
- **C, hand-painted Kolkata boards:** sign-painted lettering, enamel
  signboards, rubber stamps, the paste-up, the taxi itself.

He also approved **navy replacing black everywhere**. Do not change the
palette unless he asks.

### The six sheets and their grounds

| Sheet | Ground | Signature object |
|---|---|---|
| 01 Home | Cream with a navy dot grid | The Howrah Bridge loader, Parth at the Strand Road railing, the big taxi |
| 02 About | Blueprint blue | A ticket card, a floppy disk holding the resume, a Kolkata tram |
| 03 Services | Night navy | The Howrah Bridge crossing at dusk, a pen plotter drawing live |
| 04 Work | Green engineering grid paper | Taped photo prints, technical drawings, rubber stamps |
| 05 Journey | Blueprint blue | A ghat with two moored boats, a railway timeline |
| 06 Contact | Night navy | A 3D phone running a chat, a pin-art wall, the footer street |

### The palette

| Colour | Hex | Used for |
|---|---|---|
| Cream | `#f3eee3` | Sheet 01, the top strip, info pages |
| Ink (navy) | `#1d2a6e` | Text and lines on light paper. It is the navy of the taxis' "No Refusal" lettering |
| Blueprint blue | `#1a3a7c` | Sheets 02 and 05, the blueprint print in the hero |
| Night | `#141a3d` | Sheets 03 and 06 |
| Grid paper | `#e7eee0` | Sheet 04 |
| Taxi yellow | `#f6c400` | **Objects only**: the taxi, lamps, highlighters, the route on night |
| Brick red | `#b42f1f` | Stamps, the shaded lettering, red callouts |
| Teal | `#0f4a47` | Painted enamel only (signboards, tins) |
| Chrome | `#c9c9cf` | Bumpers, hubs, rails, chains |

The colour rules: **yellow is never a background or a stripe** (yellow
fields, huge black-on-yellow capitals and hazard stripes read as
construction signs, not as a taxi), teal is only enamel, there are **no
glows and no blinking or pulsing lights**, and every text colour meets the
WCAG AA contrast standard (the minimum contrast between text and its
background that the web accessibility guidelines ask for).

### Type

Three self-hosted fonts (served from the site itself, not from Google):

- **Archivo** for headings and body text. Headings use "weight contrast":
  one heavy word and one very thin word ("**What I** can do",
  "**Selected** work", "**Founder** journey").
- **Kalam**, a handwriting font, for margin notes, stop labels and drawing
  legends. Never needed to use the site, never below 16px. Parth approved
  its download explicitly.
- **JetBrains Mono** for a few labels (the floppy label, the plotter's
  title block, the cursor's readout).

Sign-painted lettering with a stepped brick shadow appears in exactly
three places: the hero name, the "Short on time?" board and the footer
sign.

---

## 4. A visitor's walk through the home page

This is what happens, in order, when someone opens the site on a desktop
with JavaScript on.

### 4.1 The loading screen: "Span closed"

There is no separate loading overlay. **The hero is the loader.** Parth
picked this concept from four on 17 November.

1. The cream sheet appears with Parth's name drawn as a faint pencil
   outline, the building facades, the frame and the grid. The sheet looks
   busy from the first frame.
2. The **Howrah Bridge is erected as the progress bar.** The towers rise
   out of their piers, the anchor arms and then the cantilever arms reach
   out panel by panel with two small "creeper cranes" on their tips, and a
   dashed plan of the bridge is wiped in. A river (labelled "Hooghly" in
   handwriting), banks, piers and a drifting country boat sit below. A
   readout says "Loading" with a three-digit number.
3. **The name is craned in.** Each letter of "Parth Betai" is lowered on a
   cable from above the sheet, with a small red girder. It comes down in
   red primer, swings a little, lands with a small bounce, two red-hot
   rivets go in and cool, the letter is painted navy, and the cable runs
   back up. The second line is lowered behind the first, and the brick
   shadow steps in once a line is complete. The name's position and size
   never change: the word stays still while things around it move.
4. A **small taxi** drives in from the right and waits at a striped
   barrier.
5. Progress pauses at 80% until the fonts and the portrait are ready (it
   never waits more than 6 seconds).
6. At 100% the span closes: a brick **"SPAN CLOSED"** stamp lands, the
   barrier lifts, the cranes lift away, a heat wave runs through the
   rivets, and the small taxi drives across.
7. The view **pushes in** (zooms) on the taxi until it becomes the big
   hero taxi parked at the kerb. The bridge fades away.
8. Around the name, the hero assembles: the Victoria Memorial appears,
   Parth rises from behind the kerb, the railing is planted, the
   "Portfolio" ribbon drops in, the role, the line under it and the two
   buttons rise, and the route appears.
9. The page unlocks. The top strip slides down, the bottom nav slides up,
   the later sheets fade up into place, and scrolling works.

The whole close takes about 2.3 seconds. If the visitor arrived with a
link like `/#contact`, the page then glides to that sheet. The loader plays
in reduced-motion mode too.

### 4.2 Sheet 01, Home (the hero)

What is shown, once loaded:

- A brick **"Portfolio"** ribbon, then **"Parth Betai"** in big
  sign-painted navy letters with a stepped brick shadow.
- **"Software Developer & Robotics Engineer"** under a yellow highlighter
  swipe, then "Builds Android apps, robots and websites".
- Two buttons: **Contact** and **Selected work**.
- The art, bottom right: Kolkata building facades, the **Victoria
  Memorial** behind Parth, **Parth leaning on the Strand Road railing** as
  a lit 3D relief (drawn with WebGL, the browser's 3D graphics) that turns
  slightly toward the mouse, and the **yellow Ambassador taxi** at the
  kerb facing left, with Parth's mini humanoid robot on its roof rack.
- A dimension line under the taxi, from "Kolkata, India" to "Jaipur,
  India", like a measurement on a drawing.
- The route starts at a **Home** stop just behind the taxi.

What moves as you scroll:

- **The big taxi drives off** to the left, shrinking as it goes, and
  becomes the small route taxi at the corner. Its path is planned so it
  never crosses the text or the buttons. The page does not hold still for
  it: the drive happens in the same scroll that brings About up.
- **The Exposure:** as the About sheet slides up over the hero, a cream
  line runs up the hero ahead of it. Everything below that line turns
  into a **blueprint print of the same drawing** (the name in pale line,
  the taxi as linework, Parth as a blue duotone). There is no pause and no
  extra scrolling; it simply happens during About's slide.

### 4.3 Sheet 02, About (blueprint blue)

- **"Intro"** and a paragraph in Parth's own voice, with one word in a
  lighter accent.
- **The ticket, "The short version":** a tilted cream card like a printed
  ticket, with his name, his two work locations, his status, and a row
  "Available to work as" that **rolls through his seven roles** one at a
  time on a marker band. A stub on the right has a punched hole and a
  small one-colour taxi. The roller pauses when the mouse rests on it.
- **The floppy disk:** a 3.5 inch floppy built in 3D, sitting half out of
  a cream paper sleeve printed "Resume · 184 KB", with a handwritten note
  "my resume's on this floppy". Hovering lifts it and slides its shutter
  open while the disc spins. **Clicking opens a resume preview**: the disk
  flies out, a page of the resume unfolds, and the visitor can zoom, open
  the PDF in a new tab, or download it. Ctrl-click or middle-click just
  downloads the PDF.
- **The tram band:** a two-car Kolkata tram on its overhead wires, its
  destination sign reading "Stack". It slides along as the band crosses
  the screen.
- **The stack rows:** four rows of skills (Stack, Intelligent systems,
  Hardware, Learning) drifting sideways like a ticker, each headed by a
  teal enamel tin. Hovering slows them, scrolling fast speeds them up,
  and a **pause button** stops them.

### 4.4 Sheet 03, Services (night)

- **The bridge crossing:** as this sheet slides up over About, its top
  band shows the Howrah Bridge. The sky fades from **day to dusk to
  night**, and the taxi drives across the deck with the lamps lighting up
  behind it. The route runs along the deck, makes a U-turn down the right
  side and back along the bank.
- **"What I can do"**, a handwritten line beside it, and a teal enamel
  board **"Short on time? Selected work is the good part."** that jumps to
  the Work sheet.
- **Seven service rows** hang on the route like stations on a train line.
  Each has a number, an icon and a title. Clicking one opens its panel
  (five points and a short paragraph) and fills its station ring.
- **The plotter** (desktop and tablet only): a card beside the list where
  a pen **draws a technical drawing for each service, live**, with
  numbered balloons, a handwritten legend and a title block (TITLE and
  NOTE). It draws the row under the mouse, the focused row, the opened
  row, or (from 1024px wide, until a row is clicked) whichever row is in
  the middle of the screen as you scroll.
- Drawn **rooftops** close the sheet.

### 4.5 Sheet 04, Work (green grid paper)

- The sheet arrives **like a poster being pasted up**: a torn paper edge,
  with a roll of paper and wet paste streaks riding it, while the Services
  sheet behind darkens slightly.
- **"Selected work"**, a one-line blurb, and an index of the four projects
  (each jumps to its project).
- **Each project:** a spur from the route to its numbered stop, labelled
  with its kind (Mobile, Robotics, Embedded, Hardware); the title; the
  badge as a highlighter swipe (the humanoid gets a **first-place medal**
  instead); the description and tags; a **photo print held by kraft
  tape** (all four photos are Parth's own); and beside it a **technical
  drawing** of the build with numbered balloons and leader lines, a
  legend, sometimes a red callout or a small card, and a handwritten note.
- **Rubber stamps** only where there is a real verdict: the humanoid
  ("ROBOTICS 1ST PLACE IIT HYDERABAD") and the EV model ("EXHIBITED
  TWICE").
- Animations happen **once each**, like ink on paper: the drawing fades
  up and its leader lines draw on, the print drops into place, the stamp
  presses down, the notes appear. They do not undo when you scroll back.
- Projects are separated by a dashed cutting line with a registration
  mark.

### 4.6 Sheet 05, Journey (blueprint blue)

- The sheet slides in behind its own cream line with crosshairs, a small
  echo of the hero's Exposure.
- **"Founder journey"** and a blurb.
- **The ghat:** a drawn riverside landing with a colonnade and steps down
  to the water, and **two country boats moored at it, one per venture**,
  each with a tag (name, role, period). A handwritten note on the water
  says "closed both, kept the lessons".
- **A railway timeline:** Psquare Online's track runs to its buffer stop,
  a set of points ("Pivoted to Afferex") switches across, and Afferex's
  track runs on, over 2024 to 2026.
- **Two venture cards**, each marked "Wrapped up", with the kind, a short
  story and three facts lined up along the card's foot.

### 4.7 Sheet 06, Contact (night)

- **"Get in touch"** with a yellow hand-drawn underline, a short blurb,
  and the email address as a link.
- **The phone:** a smartphone built in 3D on the page (not a picture). It
  rises and tilts into view as you scroll, and turns face-on when the
  mouse comes near it or when it has focus. Its screen runs **a chat with
  "Parth" that is really the contact form** (section 8).
- Behind the phone, a **printed speech balloon** (the hero's yellow
  halftone disc reshaped into a balloon) and a handwritten label "it
  really does land in my inbox" with a yellow arrow pointing at the
  message box. The label never appears later than its arrow.
- Behind everything, through a rounded window: **the pin wall**, a 3D
  pin-art desk toy (the kind with thousands of metal pins). Moving the
  mouse pushes up a dome of pins with a wake behind it, every chat
  message sends a ripple across it, it breathes gently when idle, and a
  scan line runs up it every 10 seconds.

### 4.8 The footer street and "You've arrived"

The same footer closes every page.

- A **teal enamel signboard** reading "Parth", his role, and a sub-board
  "Let's build something". It drops out from behind its bar and swings
  once as it comes into view.
- **The night street:** a road, a kerb and a cast-iron lamp post. On the
  home page the big taxi **drives along the kerb with the scroll** and
  parks under the lamp exactly at the bottom of the page; on the other
  pages it is simply parked there. The route ends in a terminus ring, and
  **"You've arrived"** is written in as the taxi stops. At the same moment
  the top strip's "You've seen 99%" becomes "You've arrived".
- Over the street: "Thanks for scrolling all the way down.", the email,
  "Open to internships, freelance work and collaborations." and a **Get in
  touch** button.
- Below: a **title block** like the corner of an engineering drawing (name
  and role, the two locations, and "Connections" with GitHub, LinkedIn,
  Instagram and X logos), and the legal line (copyright and links to the
  five info pages).

---

## 5. Things that are on every page

- **The status strip** (top): a cream strip like the title strip along a
  drawing set's edge. Left: a circled mark and "Parth Betai" (goes back
  to the top or home). Middle (1180px wide and up): one short true line at
  a time, rolling every 4 seconds, for example "My SOS app works with zero
  bars. This page needs one." Right: **"You've seen N%"**, which becomes
  "You've arrived" at the very bottom.
- **The bottom nav** (home page only): a cream pill with Home, About,
  Services, Work, Contact, and a dashed road with a tiny taxi that drives
  to the label of the sheet you are reading. It steps aside while you
  type in a text field and while the footer's text rows pass behind it.
- **The cursor** (mouse and trackpad only): an engineering reticle with
  corner brackets, a dot and a coordinate readout. Over a button or link
  it frames the element and shows a one-word label (PRESS, GO, MAIL,
  OPEN). It switches between navy and cream depending on the paper under
  it. Touch screens keep their normal behaviour.
- **Grain:** a faint, slowly shifting paper-noise texture over everything.
- **Page-change loader:** when moving between pages takes longer than
  0.16 seconds, a cream sheet appears with a small taxi driving along a
  kerb and the word "Loading". (In development the first visit to each
  page compiles it, which is why this shows more there.)
- **Smooth scrolling:** on the home page scrolling has a gentle inertia,
  and every in-page link glides to its sheet so its index tab lands just
  below the strip.

---

## 6. The other pages

All five info pages are sheets of the same drawing set: one cream sheet
with an index tab reading "Legal", a "Back to home" link, the title, a
"Last updated" date (currently **12 October 2026**), the text, and then
the same night footer street. They are written in plain words and match
how the site really behaves. They have **not been reviewed by a lawyer**.

| Page | Address | What it says |
|---|---|---|
| Privacy policy | `/privacy` | Nothing is stored on your device. The contact chat sends your answers to the site's server, which emails them to Parth through Resend; no copy is kept and there is no database. Your IP address is held in memory for under a day, only for rate limiting. Lists what the host and Resend can see, your rights, children, changes, contact. |
| Terms of use | `/terms` | Who runs the site, fair use, ownership, the projects, no guarantees, liability, links, changes, governing law, contact. |
| Cookies | `/cookies` | None are used. |
| Accessibility | `/accessibility` | What is in place, the two motion levels, the custom cursor (precise pointers only), known limitations, how to give feedback. |
| Credits | `/credits` | Design and build, the three fonts (Archivo by Omnibus-Type, Kalam by the Indian Type Foundry, JetBrains Mono by JetBrains, all under the SIL Open Font License), photography, and the libraries (Next.js, React, GSAP, Lenis, Three.js, Tailwind CSS). |
| Not found | any wrong address | A night sheet with "404", the taxi turned round on a short road (it rolls in using CSS only), "Took a wrong turn.", "This page isn't on the route. The home page is.", a **Back to home** button, then the footer. |

Back from an info page lands on the hero at the top.

There is also an automatic `robots.txt` (search engines may index
everything except `/api/`) and a `sitemap.xml` listing the home page and
the five info pages.

When a link to the site is shared (WhatsApp, LinkedIn, X), it shows a
**preview card**: Sheet 01 in miniature, with the ribbon, the name, the
role and the taxi with its front half drawn as a blueprint. The browser
tab icon is the colour taxi on a navy tile.

---

## 7. How the site adapts: reduced motion, no JavaScript, phones

### Reduced motion ("soft" mode)

Many computers, including Parth's own Windows laptop, tell websites "I
prefer reduced motion" (for example when Windows "Animation effects" is
off). The very first build switched animation off in that case, which hid
all of it from Parth. The site no longer does that, because Parth wants
his animation seen and his own PC is in that mode.

Instead it has **two levels**:

- **Full:** everything, including the gentle scroll inertia and effects
  that react to scroll speed (the stack rows surging).
- **Soft** (reduced motion): looks **identical at rest** and plays every
  reveal, the loader, the bridge and the taxi. It only drops the scroll
  inertia and the speed-driven effects, and scroll-linked animations stay
  locked exactly to the scroll instead of easing behind it.

Soft mode is what Parth sees, so every change is checked in soft mode. The
Accessibility page describes both levels.

### Without JavaScript

The rule across the whole site is: **the page as written is the finished
state, and scripts only animate it into place.** So with JavaScript off
(or if a script fails to load):

- Every sheet simply flows down the page, each overlapping the one before
  slightly with its tab showing. There is no sticking or sliding.
- The hero shows everything in its final place, with a plain photo of
  Parth. There is no loader.
- The route is drawn solid all the way, with no moving small taxi.
- Every service panel is open. Every role on the ticket is listed.
- The floppy is a plain download link for the PDF.
- The phone shows a finished conversation and an email link where the
  typing bar would be ("Easiest way to reach me is email...").
- Controls that need scripts (the pause button, the "You've seen" reading,
  the blueprint print) are hidden, and the stack rows hold still.

There is also a safety net: if the page's scripts never finish loading,
8 seconds after load the page switches itself to this no-JavaScript layout
rather than staying stuck behind an intro that never plays.

### Phones

- The same six sheets in one column, with tighter margins (the route sits
  14px from the edge instead of 34px).
- The hero has its own phone composition (the hero is at least 844px tall
  on a phone). The big taxi mostly shrinks in place, since it already
  sits near the margin.
- The plotter card is hidden on phones; the service rows remain.
- The ghat, the night street and other drawings use phone-specific crops.
- Under about 400px wide, the footer sign's role line shrinks to clear its
  corner flourishes.
- The status strip hides its rolling line below 1180px wide.
- The custom cursor is off on touch screens.
- Text never drops below readable minimums (13px for information, 16px for
  handwriting, 14px for drawing balloon numbers).
- The site has only been tested in emulated phone sizes, **not on a real
  iPhone or Android phone yet**.

---

## 8. The contact form, from the visitor's side

The contact form is disguised as a chat on the phone in Sheet 06. Because
the phone is built from real page elements, the typing box is a real text
box: autofill, the phone keyboard, spellcheck and screen readers all work.
The phone's header says "Usually replies within a day".

**The conversation:**

1. When the phone scrolls into view (or the visitor clicks or types in it),
   "Parth" says: "Hey! Thanks for stopping by." and "Here's my resume if
   you want the whole story.", followed by a **resume file card** (clicking
   it opens the same resume preview as the floppy).
2. "What should I call you?" The visitor types their name.
3. "Nice to meet you, {name}. What's your email, so I can write back?" If
   the address looks wrong, he says "Hmm, that doesn't look like an email
   address. Mind checking it?" and puts the address back in the box.
4. "What's this about?" The visitor taps a chip (A project, An internship,
   Freelance work, Just saying hi) or types their own topic.
5. "Tell me a bit more. What are you working on?" The visitor writes the
   message (Enter sends, Shift+Enter makes a new line).
6. A **preview of the email** appears (To, Subject, message), then "Got
   it. Shall I send this over?" with **Send message** and **Start over**.
7. On success: "Sent. It's in my inbox now, and I'll reply to {email}
   soon." The pin wall behind sends a big ripple.
8. If anything fails: "That didn't go through on my side. You can send it
   from your own email app instead, everything's filled in." and a **Use
   my email app** button that opens the visitor's own email program with
   everything already written.

Every message from "Parth" shows typing dots first, and each answer sends a
small ripple across the pin wall.

**Where the message goes:** the browser sends the answers to the site's
own server at `/api/contact`. The server checks them carefully (same site
only, size limits, spam traps, rate limits) and then asks **Resend**, an
email delivery service, to email Parth. The email is plain text, its
subject is "Portfolio: {topic} from {name}", and the visitor's address is
set as the **reply-to**, so Parth can simply press Reply. Nothing is ever
sent to the visitor's address, and the site keeps no copy.

**Spam protection, in plain terms:** a hidden field that only bots fill
in (a "honeypot"), a minimum of 3 seconds between starting and sending, at
most 5 messages per 10 minutes and 20 per day from one address, and at
most 10 sends a minute for the whole site. Bots that trip a trap are told
"success" but nothing is sent.

**What it needs to work:** a Resend key in the variable `RESEND_API_KEY`.
Without it, every send fails politely and the chat offers the email-app
route instead. The key is set up locally, but a real end-to-end test
message has **not been sent yet**.

The full technical detail (every check, every response code) is in
CODEBASE.md.

---

## 9. Accessibility and privacy

### Accessibility

- A **skip link** to the main content.
- **Contrast:** every text colour meets WCAG AA (the contrast ratios are
  written next to each colour in `app/globals.css`).
- **Visible focus ring** on every ground: navy on cream and paper, pale
  blue on blue, taxi yellow on night.
- A **focus guard**: if keyboard focus lands on a link that a later sheet
  is covering, the page scrolls it back into view. It acts on keyboard
  focus only, so mouse clicks never jump the page.
- **Keyboard scrolling** (arrows, Page Up/Down, Home, End, Space) works
  with the smooth scroller.
- Decorative drawings are hidden from screen readers. Every piece of
  information is real text, not text inside a picture.
- The hero name is read as "Parth Betai" even while its letters are
  animating; the rolling strip lines and roles are read once as plain
  text.
- The stack rows have a **pause button** (WCAG 2.2.2, the guideline that
  moving content must be pausable).
- The resume preview traps keyboard focus while open, closes with Escape,
  and returns focus where it came from.
- **Known limitations** (also listed on the Accessibility page): the
  status strip's rolling line and the ticket's rolling roles pause under
  the mouse (and when off screen or in a hidden tab) but have no keyboard
  pause button yet.

### Privacy

- **No cookies, no analytics, no trackers, no local storage.**
- Fonts, photos and the PDF are all served from the site itself; the page
  loads nothing from other websites.
- The contact chat is the only thing that sends data, and only when the
  visitor presses Send.
- The phone number is kept off the site on purpose (it is printed inside
  the resume PDF, though).

### Security, briefly

Security matters a lot to Parth. The site sends strict security headers: a
Content Security Policy (CSP, a list the browser enforces of where the page
may load code and files from) that only allows the site's own files, no
framing by other sites, HTTPS enforcement in production, and more. The
contact endpoint accepts only same-site JSON posts and can only ever email
Parth. The development server listens only on this computer (`127.0.0.1`),
after it was once found reachable on a public Wi-Fi. The Resend key lives
only in `.env.local` (never committed) and in the host's settings; a real
key was once found in `.env.example` and removed before it was pushed, so
always scan for keys before committing. Details are in CODEBASE.md.

---

## 10. Quick start: run, build, deploy

You need **Node.js 24** (the project was built on v24.19.0 with npm 11).

```bash
npm install                            # install the libraries
npx next dev -H 127.0.0.1 -p 3001      # development server at http://127.0.0.1:3001
npm run build                          # production build; must pass before anything is "done"
npx next start -H 127.0.0.1 -p 3001    # serve the production build on port 3001
npm run audit                          # check runtime libraries for known security issues
```

Notes:

- **Port 3001:** Parth runs another project on port 3000, so this one is
  previewed on 3001 with the commands above. The plain `npm run dev` and
  `npm run start` scripts still use port 3000.
- The server only listens on `127.0.0.1` (this computer), so nobody on the
  same Wi-Fi can reach it.
- **Stop the dev server before running a build.** Both use the `.next`
  folder, and a build breaks a running dev server.
- For the contact form to send real email locally, copy `.env.example` to
  `.env.local` and put a Resend key in `RESEND_API_KEY`. `.env.local` is
  never committed, and `.env.example` must never hold a real key. Without
  it, the site works and the chat falls back to the email app.
- **On a new machine** (Parth plans to move from Windows to Linux):
  `git clone https://github.com/ParthBetai/portfolio.git`, copy
  `.env.local` over by hand, then `npm install` and run the dev server. The
  helper scripts find Chrome, Chromium or Edge on their own, or use the
  `BROWSER_PATH` variable.

### How every change is checked

1. A typecheck: `npx tsc --noEmit --incremental false`.
2. `npm run build`, which must pass.
3. Screenshots at desktop and phone sizes, in reduced-motion mode (what
   Parth sees), with `scripts/screenshots.mjs`, looked at critically.
4. In those runs: no security-policy violations, no sideways scrolling, no
   em dash characters in the page text, no console errors.
5. `npm audit --omit=dev` should report 0 vulnerabilities (three are open
   right now, see section 11).

CODEBASE.md lists the exact sizes and checks used.

### Deploy to Vercel (planned)

1. Import the GitHub repository at vercel.com/new.
2. In Project Settings, Environment Variables, add `RESEND_API_KEY`, and
   optionally `CONTACT_TO_EMAIL` (where mail is delivered) and
   `CONTACT_FROM_EMAIL` (the sender). Add `NEXT_PUBLIC_SITE_URL` set to the
   live address (important with a custom domain; without one, Vercel's own
   `*.vercel.app` address is used for the sitemap, robots.txt, canonical
   links and previews).
3. Deploy, then send one real message through the chat to confirm it
   arrives.
4. Paste the live link into LinkedIn's Post Inspector
   (linkedin.com/post-inspector) or a WhatsApp chat to check the preview
   card.

One catch with Resend: the default sender `onboarding@resend.dev` can only
deliver to the email address the Resend account was created with. To send
anywhere else, verify a domain in Resend and set `CONTACT_FROM_EMAIL` to an
address on it.

---

## 11. Current status and open items

### Where things stand (19 November 2026)

- The **Drawing Set, Kolkata edition** design is complete, with the **Span
  closed** loader and the craned name.
- The redesign, including a full code review's 25 fixes, was **pushed to
  GitHub** (`main`) on 18 November as commit `f234d68`. A small polish pass
  (balanced headings, aligned venture cards, a smaller sign line on very
  small phones) was pushed on 19 November as `04bad0d`.
- A production build was checked on 18 November and again for the polish
  pass: the typecheck and build pass, and the home page, the five info
  pages and the 404 were toured at desktop and phone sizes in full motion,
  soft mode and without JavaScript (42 runs), with no sideways overflow,
  no security-policy violations and no console errors.
- **Not deployed yet.**
- The closing review of the sixteenth round was skipped to ship fast, at
  Parth's request.

### Waiting on Parth

- **Three security advisories in the libraries** (found by
  `npm audit --omit=dev` on 13 October): `next` 15.5.26 (moderate; fixed
  in 15.5.27), `sharp` below 0.35.5 (high) and `source-map-js` 1.2.1 or
  older (high). Fixing them means downloading updated packages, which
  waits for Parth's go-ahead. Run `npm audit --omit=dev` again after
  updating.
- **Deploy to Vercel** and set `RESEND_API_KEY` and `NEXT_PUBLIC_SITE_URL`
  there, then check the preview card in LinkedIn's Post Inspector.
- **Send one real test message** through the chat (it sends a real email,
  so it needs his say-so).
- **See the new loader on his own PC** (soft mode plays it) before it goes
  live.
- **Design calls that are his:** whether the speech balloon makes the
  phone stand out, whether the paper sleeve makes the floppy stand out,
  whether the plotter's TITLE and NOTE rows are the "something unique" he
  wanted, how quick the hero taxi's drive feels (on desktop it lasts one or
  two mouse-wheel notches), the route taxi's pace on the bridge and the
  kerb, the smaller hero name on short laptop screens (820px tall and
  under), and whether the bottom nav should wait until the first scroll
  (at some sizes it covers the bottom of the hero drawing).
- **Keyboard pause** for the strip's rolling line and the ticket's rolling
  roles (an accessibility improvement; his call).

### Content that only Parth can fix

- The **resume PDF** is out of date against the site: it still says
  "100%" detection, "sensor arrays", the humanoid "selected for
  presentation" (it won) and Afferex "Present". It also has em dashes and
  his phone number, and does not list the SOS app or React. After editing
  it, re-render the preview image (see CODEBASE.md).
- The **first project photo** is a code close-up from one of the Java
  apps; a screenshot of the SOS app receiving an alert (or of the ordering
  UI) would suit the card better.
- **JavaScript** is not listed in his skills (only React and React Native;
  TypeScript is under Learning). Ask him before adding it.
- Still unknown, so never claimed: the humanoid's exact servo count and
  driver board, how many test runs the car did, the solar panel's rating.

### Known small issues

- The link preview card's taxi still faces right (the hero's now faces
  left). Re-running `scripts/make-share-image.mjs` with the taxi flipped
  would fix it.
- The hero taxi's wheels do not turn while it drives.
- On a slow first visit the name can briefly show in a fallback font, and
  the loader bridge is not refitted when the real font arrives.
- On phones the Victoria Memorial sits mostly behind the portrait.
- The cursor's label over the floppy can pick the wrong ink colour.
- One frame without a taxi at the kerb hand-over at 1440x900.
- A first scroll about 7 seconds after load can stall briefly in the dev
  server while the pin wall builds (check on a real machine with a
  production build).
- The chat's email check rejects addresses with non-Latin characters.
- The social label is spelled "Github" (the brand writes "GitHub").
- `app/cookies/page.tsx` has two unused imports.
- `npm run lint` probably does not work, since ESLint is not installed.
- On Windows, Parth should untick "Public" on the "Node.js" inbound
  firewall rules (a system setting, not part of the project).

The complete, technical list of open items and known limitations
(including smaller ones such as tabs crossing content mid-slide and two
development-only console notes) is in CODEBASE.md.

---

## 12. How the design got here: a short history

All dates are 2026. Every entry in full, with what was checked each time,
is in the changelog in CODEBASE.md.

| When | What happened |
|---|---|
| 22 to 23 Sep | **First build.** Followed the look of a reference portfolio: chrome display type, a loader that decoded a name, a liquid chrome orb, a marquee, a services accordion, project cards, a contact section with a dotted globe, a planet-horizon footer. Custom cursor, smooth scroll, grain. |
| 23 Sep | **The "no animation" fix.** Found that Windows "Animation effects" off made the site hide its animation from Parth; the motion levels began here. Content rewritten from his resume; the info pages, 404, sitemap and robots added; a security audit (framework upgraded, dev server bound to this computer, headers and CSP added). Second round: the ticket's rolling roles, the pin wall, the floppy, the chat on a phone. |
| 23 to 29 Sep | **Rounds three to nine.** The founder journey added, tech rows calmed, the DVD-style resume disc, a blueprint plotter for services, socials updated (YouTube replaced by X), the footer Motion button removed, neon lime replaced, glows and pulsing lights removed, a credibility pass (no uncounted numbers, more implementation depth), the offline SOS app added, React moved into the stack. |
| 29 Sep | **Repository created** and the "v2" version pushed to GitHub. |
| 30 Sep to 1 Oct | **Rounds ten and eleven: the Kolkata taxi redesign.** Taxi yellow and black with a maker's-notebook layer, a status strip, a bottom nav, a taxi at "You've arrived"; a "For hire" flag tried and removed. Parth later felt it had "too much caution vibes". Never pushed. |
| 5 to 12 Oct | **Round twelve: the drawing set.** Four directions drawn up and judged; Parth chose to combine three (drawing set, city ride, painted boards) and approved navy replacing black. The six numbered sliding sheets, the taxi route, the Howrah Bridge, the tram, the ghat and the night street arrive. |
| 12 to 13 Oct | **Round thirteen: Parth's eleven fixes.** The small taxi now drives the route with the scroll; the Victoria Memorial replaces a halftone sun; "In numbers" removed; drafting marks that meant nothing (section-cut "A"s, "06 / 06") removed; a new title block with social logos. |
| 13 Oct | **Round fourteen: six items.** The hero taxi faces left and is driven off by the scroll into the route taxi; a loading screen that is never empty; the floppy in a paper sleeve; the plotter's title block; the inbox label at the phone. |
| 16 Nov | **Round fifteen.** The hero no longer holds the page still while its taxi shrinks; a printed halftone speech balloon replaces the lantern behind the phone. |
| 17 Nov | **The new loader, Span closed.** Parth picked it from four concepts: the Howrah Bridge erected as the progress bar. |
| 18 Nov | **Round sixteen.** A full code review's 25 fixes (nothing visible lost), and the name craned in letter by letter inside the loader (chosen from three prototypes: forge, crane, split-flap). The redesign is committed and pushed. |
| 19 Nov | **Polish pass,** pushed: balanced headings, aligned venture cards, the craned name lands sooner. |

---

## 13. House rules for anyone working on it

These are Parth's rules. They came up again and again; treat them as rules
when changing anything.

### Working on the project

- **README.md and CODEBASE.md are the project memory.** Read both before
  changing anything, and update them **in the same change** whenever
  something is added, removed or decided: the matching section, plus a
  dated line in the changelog in CODEBASE.md. No other documentation file
  is kept.
- **No em dashes** (the long dash character, U+2014) anywhere: page text,
  code comments or docs. Use a comma, colon or full stop.
- **No AI tool or assistant names anywhere.** No tool names, watermarks,
  "made with" credits or co-author lines naming a tool, in the code,
  comments, pages, metadata, docs or commits.
- **Never invent facts about Parth.** Every note, number, label and stamp
  must be a confirmed fact from his resume or from him. No bare
  percentages, no number nobody counted. When a detail is missing, ask him
  rather than guess.
- **Copy lives in `lib/content.ts`.** Every word on the site belongs there
  (a few small interface words in components are a known exception, listed
  in CODEBASE.md).
- **Reduced motion must look identical at rest.** Soft mode keeps every
  reveal and only drops inertia and speed effects. Always test with
  reduced motion on, because that is what Parth's PC shows.
- **Commit or push only when Parth asks.** Commits are made as ParthBetai.
  Scan the staged files for keys before committing.
- **Ask before downloading anything new** (fonts, packages, assets).
- He writes quick, informal feedback in bursts, often several requests in
  one message. **Go through every item.**

### Design and voice

- **It must never look machine-made.** No neon, no glows, no blinking or
  pulsing dots, no wide-spaced mono micro-labels everywhere, no generic
  particle effects, globes or cursors, no serif-italic accent words. Every
  sheet has its own hand-made signature object.
- **"Pro level", hand-made, his own world.** Kolkata, its yellow taxis,
  robots, an engineer's drawings. A reference portfolio inspired the
  principles only; nothing of its content or layout is copied, and nothing
  should be.
- **No caution signage. Yellow only on objects**, never as a background or
  stripe. Sheets meet as drawn seams, not flat cuts.
- **Hand-made touches are used sparingly.** Stamps only for real verdicts
  (so only two projects are stamped). All four project drawings carry a
  handwritten note.
- **Every mark must mean something to a visitor.** A drafting symbol that
  points at nothing is removed, not explained.
- **Animation must be visible**, including in reduced-motion mode.
- **What a visitor can use must be the brightest thing on its sheet**, made
  to stand out by drawing (a sleeve, a balloon), never by a glow.
- **Loaders keep the word still**: the name stays in place while things
  around it change, the sheet looks busy from the first frame, and the
  hand-over to the hero is one clean beat.
- **Credibility over volume:** no lists of AI product names; every project
  shows real implementation depth from confirmed facts.
- **Copy sounds like a person**: plain and specific, not marketing.
- **Keep formats he likes** when asked for content changes (for example the
  founder timeline layout stayed the same when Afferex ended).
- **Security matters**: no open ports, no loopholes, nothing exposed. Keep
  the headers, CSP and API hardening intact.

### Golden rules for the code (explained fully in CODEBASE.md)

- Never hide content with CSS before its animation runs. The page must be
  complete without scripts.
- Never put a transform, filter, will-change, contain or
  content-visibility on the Contact sheet or anything around it; it breaks
  the pin wall.
- Never reorder the `sheets` list in `lib/content.ts`; components read it
  by position.
- Never add a `loading.tsx` file; it blanks the site without JavaScript.
- Read the hard-won lessons in CODEBASE.md before editing motion code.

---

## 14. Where to change what

| I want to change... | Where | More detail in CODEBASE.md |
|---|---|---|
| Any text, link, project, service, role or note | `lib/content.ts` only | "Content" |
| The email address messages go to | `identity.email` in `lib/content.ts`, or the `CONTACT_TO_EMAIL` variable | "Contact backend" |
| The chat's questions and replies | `contact.chat` in `lib/content.ts` | "Contact sheet and the phone chat" |
| Colours | The `@theme static` block in `app/globals.css` (then search for hard-coded copies of the old hex value) | "Design system" |
| Fonts | `app/fonts/` and `app/layout.tsx` | "Design system" |
| Add or reorder a project | `work.projects` in `lib/content.ts`; photo in `public/work/`; optional drawing in `components/drawings/` wired in `components/Work.tsx` | "Work sheet" and "How to make common changes" |
| Add a service | `services.items` (with exactly 5 points), an icon in `components/Services.tsx`, a drawing match in `components/ServiceDrawings.ts` | "Services sheet" and "How to make common changes" |
| Replace the resume | `public/Parth-Betai-Resume.pdf`, then re-render `public/resume-preview.webp` and update `resume.size` and `resume.updated` | "Assets and helper scripts" |
| Replace the portrait | `assets/portrait-source.jpg`, then `node scripts/make-portrait.mjs --publish` | "Hero and loader" and "Assets and helper scripts" |
| The loader's speed or words | `components/Hero.tsx` and `components/LoaderBridge.ts` | "Hero and loader" |
| Smooth-scroll feel | `components/SmoothScroll.tsx` | "Motion system" |
| How the taxi route behaves | `lib/motion.ts` (`driveRoute`) | "Motion system" |
| The status strip's lines | `strip.lines` in `lib/content.ts` | "Status strip and bottom nav" |
| Social links | `socials` in `lib/content.ts` (icon in `components/SocialIcon.tsx`) | "Footer" |
| A policy page's text | `app/<page>/page.tsx`, and update `legal.updated` | "Info pages" |
| Add an info page | New `app/<slug>/page.tsx`, add it to `legal.pages` and to `app/sitemap.ts` | "Info pages" and "How to make common changes" |
| Spam limits, email format | `app/api/contact/route.ts` | "Contact backend" |
| Security headers, allowed outside hosts | `next.config.mjs` (and the privacy page) | "Security headers" |
| The link preview card and icons | `node scripts/make-share-image.mjs`, then the two `.alt.txt` files | "Assets and helper scripts" |
| The live site address | `NEXT_PUBLIC_SITE_URL` (read by `lib/site.ts`) | "SEO and share images" |
| Anything else, or why something is built the way it is | Start from the file map | "File map", "Contracts" and "Hard-won lessons" |

After any change: typecheck, build, check screenshots in soft mode, and
update README.md and CODEBASE.md (with a changelog line).

---

## 15. Glossary

| Term | Meaning |
|---|---|
| **Sheet** | One numbered section of the home page, drawn as a sheet of a drawing set. |
| **Ground** | A sheet's paper colour and texture: cream, blue, night or paper. |
| **Index tab** | The tab on a sheet's top edge ("01 Home"). Clicking it jumps to that sheet. |
| **Sticky sheets** | Each sheet stays still while the next one slides up over it. |
| **Route** | The inked line down the left margin that the taxi drives. |
| **Stand-in** | A bigger taxi that takes over from the small route taxi on three stretches: the hero road, the bridge deck and the footer kerb. |
| **Exposure** | The hero-to-About transition where everything below a moving line becomes a blueprint print. |
| **Span closed** | The name of the loader: the Howrah Bridge built as the progress bar. |
| **Blueprint / cyanotype** | The blue print style with pale lines, used on the About and Journey sheets and in the Exposure. |
| **Full / soft mode** | The two motion levels. Soft is used when the computer asks for reduced motion. |
| **Pin wall** | The 3D pin-art toy behind the contact phone. |
| **Honeypot** | A hidden form field that only bots fill in, used to catch spam. |
| **CSP** | Content Security Policy: the browser-enforced list of where the page may load code and files from. |
| **WCAG AA** | The web accessibility guidelines' standard level, used here for text contrast. |
| **Resend** | The email delivery service the contact form uses. |
| **WebGL / three.js** | The browser's 3D graphics, and the library used to draw with it (portrait relief, pin wall). |
| **GSAP / ScrollTrigger** | The animation library and its plug-in that ties animations to scrolling. |
| **Lenis** | The library that gives scrolling its smooth inertia. |
| **Vercel** | The planned hosting service. |
