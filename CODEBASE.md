# Parth Betai · Portfolio: the codebase

This file explains the code of Parth Betai's portfolio in depth: how it is
built, why it is built that way, the rules it must keep, what was learned
the hard way, what is still open, and the full history of changes.

It is one of the project's two documentation files:

- **[README.md](README.md)** explains the website itself: what it is, what
  a visitor sees, and how to run it in short. Read it first.
- **CODEBASE.md** (this file) is for whoever changes the code. After
  reading both, a developer should be able to continue the project from
  any machine.

There is no other documentation file, and there should not be. When you
change something, update the matching part of README.md or this file in
the same change, and add a dated entry to the [Changelog](#27-changelog).

---

## Contents

1. [Read this first](#1-read-this-first)
2. [Project status and verification history](#2-project-status-and-verification-history)
3. [Tech stack](#3-tech-stack)
4. [Running, checking, building and deploying](#4-running-checking-building-and-deploying)
5. [Folder and file map](#5-folder-and-file-map)
6. [Architecture](#6-architecture)
   - [6.1 Rendering model: server and client components](#61-rendering-model-server-and-client-components)
   - [6.2 The page shell: layout.tsx and page.tsx](#62-the-page-shell-layouttsx-and-pagetsx)
   - [6.3 The six sticky sheets](#63-the-six-sticky-sheets)
   - [6.4 The taxi route and the journey](#64-the-taxi-route-and-the-journey)
   - [6.5 Jumps and the focus guard](#65-jumps-and-the-focus-guard)
7. [The motion system (lib/motion.ts)](#7-the-motion-system-libmotionts)
8. [Sheet 01: the loader and the hero](#8-sheet-01-the-loader-and-the-hero)
9. [The status strip, the bottom nav and the pieces on every page](#9-the-status-strip-the-bottom-nav-and-the-pieces-on-every-page)
10. [Sheet 02: About](#10-sheet-02-about)
11. [Sheet 03: Services](#11-sheet-03-services)
12. [Sheet 04: Work](#12-sheet-04-work)
13. [Sheet 05: Journey](#13-sheet-05-journey)
14. [Sheet 06: Contact, the pin wall and the footer street](#14-sheet-06-contact-the-pin-wall-and-the-footer-street)
15. [The other pages](#15-the-other-pages)
16. [The content system (lib/content.ts)](#16-the-content-system-libcontentts)
17. [The design system](#17-the-design-system)
18. [The backend: the contact route and the email](#18-the-backend-the-contact-route-and-the-email)
19. [Security](#19-security)
20. [SEO, metadata and share images](#20-seo-metadata-and-share-images)
21. [Assets and helper scripts](#21-assets-and-helper-scripts)
22. [Contracts and rules that must not be broken](#22-contracts-and-rules-that-must-not-be-broken)
23. [Hard-won lessons](#23-hard-won-lessons)
24. [How to make common changes](#24-how-to-make-common-changes)
25. [Testing and verification](#25-testing-and-verification)
26. [Known issues and open items](#26-known-issues-and-open-items)
27. [Changelog](#27-changelog)

A few words used throughout:

- **Sheet:** one of the six numbered drawing sheets the home page is made
  of (01 Home to 06 Contact). Each sticks to the screen while the next one
  slides over it.
- **Ground:** a sheet's background colour and texture (cream, blue, night,
  paper).
- **Route:** the inked taxi line that runs down the left gutter of every
  sheet. On the home page a small taxi drives it with the scroll.
- **Stand-in:** a bigger drawn taxi that takes over from the small route
  taxi on three stretches (the hero's road, the bridge deck, the footer
  kerb).
- **Full and soft motion:** the two motion levels. Soft is used when the
  operating system asks for reduced motion; it looks the same at rest and
  only drops scroll inertia and speed-driven effects.
- **Scrub:** an animation tied to the scroll position, so scrolling back
  plays it backwards.
- **Natural flow:** where an element would sit if no sheet were stuck.
  Every scroll position is measured this way.
- **Hydration:** React taking over the HTML the server sent, in the
  browser.

---

## 1. Read this first

- **Read [README.md](README.md), then this whole file.** Then read
  `lib/content.ts` (all the copy) and skim `app/globals.css` and
  `app/styles/f0-base.css` (the tokens and type roles).
- **The code is the source of truth.** If this file and the code disagree,
  the code wins; fix this file in the same change.
- **Parth's rules are in [section 22](#22-contracts-and-rules-that-must-not-be-broken).**
  The most important ones: it must never look machine-made, yellow is only
  ever an object, animation must stay visible in reduced-motion mode
  (Parth's own PC asks for it), no em dashes (U+2014) anywhere, no tool
  names or "made with" credits anywhere, ask before downloading anything,
  and never claim a fact about Parth that he has not confirmed.
- **Before editing motion or layout code,** read
  [Hard-won lessons](#23-hard-won-lessons). Most of them cost a day to find.
- **After every change:** run the checks in
  [Testing and verification](#25-testing-and-verification), update the
  matching section here or in README.md, and add a dated
  [Changelog](#27-changelog) entry.
- **Ports:** the dev preview runs on **3001**, because port 3000 is used by
  another of Parth's projects. Never run `next build` or `next start` while
  a dev server is running from the same folder: they share `.next` and the
  dev server breaks. Stop the dev server first.
- **Secrets:** the only secret is `RESEND_API_KEY`. It lives in
  `.env.local` (never committed) and in the host's settings (a secret
  variable in Cloudflare Pages). Never write a
  key into any file in the repository, including this one.

## 2. Project status and verification history

**In short (19 Nov 2026):**

| What | State |
|---|---|
| Design | "The Drawing Set, Kolkata edition", approved by Parth on 5 Oct 2026, refined in rounds thirteen to sixteen and a polish pass |
| Loader | "Span closed" (picked 17 Nov), with his name craned in letter by letter (18 Nov) |
| GitHub (`main`) | the redesign pushed as `f234d68` on 18 Nov 2026; the polish pass as `04bad0d`, the Cloudflare move as `a448d29` and the public/ icons as `60cfa24`, all on 19 Nov 2026 |
| Deployed | not confirmed yet. Host: Cloudflare Pages through `@cloudflare/next-on-pages`. The first Cloudflare build failed on the app/ icon and preview image routes (fixed in `60cfa24`); a passing Cloudflare build is still to be seen ([Deploying](#deploying)) |
| Dependency advisories | three (next 15.5.26, sharp, source-map-js), waiting for Parth's go-ahead to update |
| Contact email | key set up locally; no real test message sent yet; not yet confirmed on the host |
| Last full check | a production build on 18 Nov, served on 127.0.0.1:3001: 42 runs clean (see below). On 19 Nov the edge contact route was checked locally (see below) |

The record below is kept from the project's earlier handbook, round by
round. It is the evidence of what was checked and how.

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
  Span closed (17 Nov, [Sheet 01](#8-sheet-01-the-loader-and-the-hero)), then the 25 fixes from a full code
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
  [the sheet sections](#8-sheet-01-the-loader-and-the-hero) for the sheets,
  [the design system](#17-the-design-system) for the design system and the Changelog
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
    on. **Pushed to GitHub on 18 Nov 2026** (`main`), at Parth's request,
    and the polish pass on 19 Nov; not deployed. The closing three-lens
    review of the sixteenth round was skipped to ship fast.
  - **Checked for the Cloudflare move (19 Nov, `a448d29` and
    `60cfa24`):** run locally, the contact route on the Edge runtime
    answered GET with 405, a POST without an origin with 403, a wrong
    content type with 415, bad JSON with 400, a filled honeypot with 200
    and nothing sent, and invalid fields with 400. The build's route list
    is `/`, `/_not-found`, `/accessibility`, `/cookies`, `/credits`,
    `/privacy`, `/terms`, `/api/contact` (dynamic, edge), `/robots.txt`
    and `/sitemap.xml`. **Not verified:** `@cloudflare/next-on-pages` was
    not run locally (it works poorly on Windows), a passing Cloudflare
    build has not been seen yet, and no real email has been sent through
    the edge route.
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
    hydration warnings beyond the two dev-only notes in [Known issues and open items](#26-known-issues-and-open-items)); the
    route taxi sampled every 4 to 40px of scroll, down and back up, at
    1440x900, 390x844, 1280x720 and 820x1180, and in Lenis wheel runs
    (exactly one taxi, on its line and not covered, in every sample, and
    parked past the terminus at the deepest scroll); full and soft mode
    parked at the same scroll positions give identical taxi, rail and
    label states; the loader's name holds still to the pixel from the end
    of its decode through the hand-off at 1440x900 and 390x844; no
    ancestor of the Contact pin wall carries a transform, filter,
    will-change or contain at any width; Back from an info page lands on
    the hero at the top; no em dash and no tool name in the
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
    previewed on **3001** (see [Running, checking, building and deploying](#4-running-checking-building-and-deploying)).
    `npm run dev` itself still uses 3000.
  - The contact email is configured locally but a real test message has not
    been sent (see [the backend](#18-the-backend-the-contact-route-and-the-email)).
- **Repository:** https://github.com/ParthBetai/portfolio (branch `main`), set up on
  29 Sep 2026. Commits are made as ParthBetai <parthbetai007@gmail.com>, with no
  co-author lines. `.env.local` is ignored by `.gitignore`,
  and the local tool settings folder is kept out through `.git/info/exclude`
  (repeat that line after a fresh clone if the folder exists there).
- **How changes have been verified every time:**
  1. `npx tsc --noEmit --incremental false` (typecheck)
  2. `npm run build` (must pass)
  3. Screenshots of every section at desktop and phone sizes with
     `scripts/screenshots.mjs`, in reduced-motion mode (that is what Parth's PC
     shows, see [The motion system](#7-the-motion-system-libmotionts)), then looked at critically.
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

## 3. Tech stack

Everything comes from `package.json`. Versions are pinned exactly, except
`three` and `@types/three` (caret ranges, so a newer 0.185.x patch can be
installed). Requirements: **Node.js 24** (developed on v24.19.0 with npm
11), and any Chromium-based browser (Chrome, Edge or Chromium) for the
helper scripts.

**Runtime dependencies**

| Package | Version | What it does here |
|---|---|---|
| `next` | 15.5.26 | The framework. App Router pages in `app/`, the one API route (`app/api/contact/route.ts`, on the Edge runtime), the `metadata` export (icons and share cards, which are plain files in `public/`), `robots.ts` and `sitemap.ts`, `next/font/local` for the self-hosted fonts, `next/dynamic` for code that only runs in the browser, and the security headers in `next.config.mjs`. |
| `react`, `react-dom` | 19.1.1 | The UI library. Pages and components are React components; `react-dom/server` is also used by `scripts/make-share-image.mjs` to render the taxi into the share card. |
| `gsap` | 3.13.0 | All animation: timelines, `ScrollTrigger` (animation tied to scroll), `DrawSVGPlugin` (lines that draw themselves), `quickTo` and `quickSetter` (fast repeated writes). Always imported through `lib/motion.ts`, which registers the plugins once. |
| `lenis` | 1.3.11 | Smooth scrolling with inertia on the home page in full motion (`components/SmoothScroll.tsx`). An element with `data-lenis-prevent` (the chat log) scrolls on its own. |
| `three` | ^0.185.1 | WebGL (3D drawing in the browser): the hero portrait relief (`HeroPortrait.tsx`), its chrome-orb fallback (`HeroOrb.tsx`) and the Contact pin wall (`PinField.tsx`). |

**Development dependencies**

| Package | Version | What it does here |
|---|---|---|
| `tailwindcss` | 4.1.14 | Utility CSS classes. Version 4 is configured inside CSS (the `@theme` block in `app/globals.css`), not in a config file. |
| `@tailwindcss/postcss` | 4.1.14 | The PostCSS plugin that runs Tailwind; the only plugin in `postcss.config.mjs`. |
| `typescript` | 5.9.3 | Type checking (`npx tsc --noEmit`). Also used by `scripts/make-share-image.mjs` to compile the taxi components on the fly. |
| `@types/node` | 24.5.2 | Types for Node.js. |
| `@types/react`, `@types/react-dom` | 19.1.13, 19.1.9 | Types for React. |
| `@types/three` | ^0.185.0 | Types for three.js. |

**Other settings in `package.json`**

- `overrides`: `next`'s copy of `postcss` is forced to **8.5.28**, a
  security pin.
- The helper scripts' own tools are deliberately **not** saved in
  `package.json`: `playwright-core` (drives a headless browser) and
  `pdfjs-dist` (renders the resume PDF). Install them with
  `npm i --no-save ...` when needed.
- There is **no** Resend library: the contact route calls Resend's HTTP API
  with plain `fetch`.
- The hosting build tool `@cloudflare/next-on-pages` is not in
  `package.json` either: Cloudflare's build runs it with
  `npx @cloudflare/next-on-pages@1` (see [Deploying](#deploying)).
- There is **no** `eslint` in the dependencies, so `npm run lint` is likely
  to prompt or fail (not tried; see
  [Known issues](#26-known-issues-and-open-items)).

**Configuration files**

| File | What it holds |
|---|---|
| `next.config.mjs` | The Content Security Policy and other security headers for every route, `reactStrictMode: true`, `poweredByHeader: false`, `productionBrowserSourceMaps: false`, `images: { unoptimized: true }`. See [Security](#19-security). |
| `tsconfig.json` | Strict TypeScript, `moduleResolution: "bundler"`, and the path alias `@/*` for the project root (so `@/lib/motion` means `lib/motion.ts`). |
| `postcss.config.mjs` | Loads `@tailwindcss/postcss` only. |
| `.env.example` | Documents the environment variables with a placeholder key. Public; Next.js never reads it. |
| `.npmrc` | One line, `legacy-peer-deps=true`, added with the Cloudflare setup: npm installs (locally and in Cloudflare's build) do not stop on peer dependency conflicts. |
| `.gitignore` | Ignores `node_modules`, `.next`, `out`, `.vercel` (where next-on-pages writes its build), `*.tsbuildinfo`, `next-env.d.ts`, logs, editor folders, and `.env` / `.env.*` except `!.env.example`. |


## 4. Running, checking, building and deploying

### Scripts

```bash
npm install
npm run dev      # dev server on http://127.0.0.1:3000, this machine only
npm run build    # production build; must pass before calling anything done
npm run start    # serves the production build on 127.0.0.1:3000
npm run audit    # npm audit --omit=dev (runtime dependencies only)
npm run lint     # next lint; eslint is not installed, so expect it to fail
```

| Script | Command |
|---|---|
| `dev` | `next dev -H 127.0.0.1 -p 3000` |
| `build` | `next build` |
| `start` | `next start -H 127.0.0.1 -p 3000` |
| `lint` | `next lint` |
| `audit` | `npm audit --omit=dev` |

`-H 127.0.0.1` binds the server to this machine only, so nobody on the
same Wi-Fi can reach it (Parth works on a public college network).

### Port 3001

Parth runs another project on port 3000, so this one is previewed on
**3001**:

```bash
npx next dev -H 127.0.0.1 -p 3001     # dev preview
npx next start -H 127.0.0.1 -p 3001   # a production build, after npm run build
```

During the redesign these ran through local preview configurations named
"portfolio-3001" and "portfolio-prod-3001", kept in the git-excluded local
settings folder. `npm run dev` and `npm run start` still use 3000. Either
way the server stays bound to 127.0.0.1.

**Never run `next build` or `next start` while a dev server runs from the
same folder.** They share the `.next` folder and the dev server breaks.
Stop the dev server, build, then start it again.

The dev server compiles each page the first time it is opened, which can
take several seconds on a slow laptop; `components/RouteProgress.tsx`
shows a "Loading" sheet meanwhile (only when a page change takes longer
than 160 ms). The production build has every page prebuilt, so that delay
is not a bug in the built site.

### Typecheck

```bash
npx tsc --noEmit --incremental false
```

### Environment variables

Local values live in `.env.local` (git-ignored; never commit it, never
paste its contents anywhere). `.env.example` documents them with a
placeholder.

| Variable | Needed | What it does |
|---|---|---|
| `RESEND_API_KEY` | Yes, for the email | The Resend key with "Sending access" only. Without it the contact route answers 503 `not_configured` and the chat offers the visitor's own email app. |
| `CONTACT_TO_EMAIL` | Optional | Where messages go. Defaults to `identity.email` in `lib/content.ts`. |
| `CONTACT_FROM_EMAIL` | Optional | The sender. Defaults to `Portfolio <onboarding@resend.dev>`, Resend's shared sender, which only delivers to the address the Resend account was made with. |
| `CONTACT_UPSTREAM_URL` | Development only | Points sends at a local mock server. Ignored in production and for any host other than 127.0.0.1, localhost or [::1]. Leave it unset, and never set it on the host. |
| `NEXT_PUBLIC_SITE_URL` | Optional on the host | The live address, read by `lib/site.ts` at build time for canonical links, the sitemap, robots.txt, share cards and the JSON-LD. Without it (and outside Vercel) the address is `https://parthcodz.ext.io`. A change needs a new build. Not listed in `.env.example`. |
| `VERCEL_PROJECT_PRODUCTION_URL` | Set only by Vercel | Used when `NEXT_PUBLIC_SITE_URL` is empty. Cloudflare Pages does not set it, so there the fallback address applies. |

On Cloudflare Pages, set `RESEND_API_KEY` as a secret, and the optional
ones as plain variables, in the project's settings for Production (and
Preview if previews should send mail).

Never put a secret in a `NEXT_PUBLIC_*` variable: those are compiled into
the JavaScript every visitor downloads.

### Moving to another machine

```bash
git clone https://github.com/ParthBetai/portfolio.git
cd portfolio
# copy .env.local over by hand (it is not in git); without it the chat
# falls back to the visitor's mail app
npm install
npx next dev -H 127.0.0.1 -p 3001
```

The helper scripts find Chrome, Chromium or Edge on Windows, Linux and
macOS by themselves, or use `BROWSER_PATH`. If the local settings folder
exists in the clone, add it to `.git/info/exclude` again (see
[Security](#19-security), Git).

### Deploying

Host: **Cloudflare Pages**, through `@cloudflare/next-on-pages` (since
19 Nov, `a448d29`; Vercel was the earlier plan). next-on-pages turns the
normal Next.js build into a Pages site: the prerendered pages and
`public/` as static files, and every dynamic route as a Workers function.
That is why the one dynamic route, `/api/contact`, runs on the Edge
runtime (`runtime = "edge"`). There is **no `wrangler.toml`**, and
`next.config.mjs` is **not** `output: 'export'` (a static export cannot
serve the contact route).

The build lists these routes: `/`, `/_not-found`, `/accessibility`,
`/cookies`, `/credits`, `/privacy`, `/terms`, `/api/contact` (dynamic,
edge), `/robots.txt` and `/sitemap.xml`. Every route but `/api/contact`
is static. A new dynamic route must be edge too, and no icon or preview
image file may sit in `app/` (see [Contracts](#22-contracts-and-rules-that-must-not-be-broken)).

1. The project is already on GitHub (ParthBetai/portfolio), without `.env.local`.
2. Create a Cloudflare Pages project from that repository (branch `main`).
3. Build settings: build command `npx @cloudflare/next-on-pages@1`, build
   output directory `.vercel/output/static`.
4. Settings, Functions, Compatibility flags: add **`nodejs_compat`** for
   both Production and Preview.
5. Environment variables: `RESEND_API_KEY` as a secret (required for the
   email); optionally `CONTACT_TO_EMAIL` and `CONTACT_FROM_EMAIL`;
   optionally `NEXT_PUBLIC_SITE_URL` (read at build time; without it the
   site uses `https://parthcodz.ext.io`). Never `CONTACT_UPSTREAM_URL`
   (development only).
6. Deploy and check the build log passes, then send one message through
   the chat to confirm delivery.
7. Paste the live link into LinkedIn's Post Inspector
   (linkedin.com/post-inspector) or a WhatsApp chat to check the preview card.

`.npmrc` (`legacy-peer-deps=true`) applies to the install in Cloudflare's
build as well. next-on-pages works poorly on Windows, so it has not been
run locally: the Cloudflare build itself is the test, and a passing one
has not been seen yet.


## 5. Folder and file map

```
app/          pages, the API route, robots and sitemap, fonts and all CSS
components/   every React component and the static drawings
lib/          content, motion engine, site address, small helpers
public/       files served as-is from the site root
assets/       source files that are never served
scripts/      helper scripts run by hand (images, screenshots)
```

"Server" below means a Server Component (rendered to HTML on the server or
at build time, ships no JavaScript of its own); "client" means the file
starts with `"use client"` and runs in the browser too. See
[6.1](#61-rendering-model-server-and-client-components).

### app/

| File | What it is |
|---|---|
| `layout.tsx` | Root layout for every page (server). Self-hosted fonts (Archivo, Kalam, JetBrains Mono) through `next/font/local`, site metadata, the schema.org `Person` data, the inline motion boot script, the skip link, `AmbassadorDefs` (the taxi's shared SVG symbols), and `Cursor`, `Grain` and `RouteProgress`. |
| `page.tsx` | The home page (client). `SmoothScroll`, `StatusStrip` and `BottomNav`, then `<main class="sheet-stack">` with the six sheets. Owns the intro scroll lock (pinned to the top), the post-intro fade of sheets 2 to 6, the journey (`driveRoute` with the car) and the `/#id` deep-link jump. |
| `globals.css` | Tailwind entry and the `@theme static` tokens (colours, font stacks), base rules (night-deep page behind the sheets, focus ring, selection, cursor hiding), the grain, the marquee keyframes, the intro start state and the no-JavaScript rules. Imports `styles/`. |
| `styles/f0-base.css` | The drawing set's foundation: colour aliases, layout tokens (`--rx --cl --cr --R --rw --bh`), the four `--shade-*` values, type classes (`.t-head .wc .painted .hand .mono .hl .hlm`), `.btn`, the four grounds (`.g-cream .g-blue .g-night .g-paper`), the sheet stack, the route pieces and the route taxi (`.route-car`), `.deckle`, the page-change sheet. |
| `styles/s1-hero.css` | Sheet 01: the hero's eight layers and masks, the copy, the art box, the Victoria Memorial, the copy line, the hero route, the loader's bridge, letters, cables and rivets, the held-back state, short-laptop and phone layouts. |
| `styles/s2-chrome.css` | The status strip and the bottom nav, and the no-JS `scroll-padding-top`. |
| `styles/s3-about.css` | Sheet 02: ticket, floppy in its paper sleeve, note and leader, tram band, stack rows and tins, pause button. |
| `styles/s4-services.css` | Sheet 03: bridge band (sky, truss, lamps, deck taxi, the route's U-turn), header, board, rows, plotter card, rooftops. |
| `styles/s5-work.css` | Sheets 04 and 05: deckle and paste-up, index, projects, prints, stamps, drawing plates, cuts; the Journey's copy line, ghat, timeline and venture cards. |
| `styles/s6-contact.css` | Sheet 06 (copy, phone, printed balloon, pin-wall window, inbox note and arrows), the footer street and its title block, the info pages, the 404. |
| `fonts/` | `archivo-latin-standard-normal.woff2` (variable: weight 100 to 900, width 62% to 125%), `kalam-latin-400-normal.woff2` (Indian Type Foundry, the handwriting), `jetbrains-mono-latin-400-normal.woff2` and `-500-`. Taken from the Fontsource packages. Instrument Serif was deleted in the twelfth round (unused); it is in git history. |
| `not-found.tsx` | The 404 page (server): "Took a wrong turn.", one night sheet, the taxi turned round on its own road, a cream "Back to home" button, then the footer. |
| `privacy/page.tsx`, `terms/page.tsx`, `cookies/page.tsx`, `accessibility/page.tsx`, `credits/page.tsx` | The five info pages (server), each built on `LegalPage`. Their prose lives in these files, not in `content.ts`. |
| `api/contact/route.ts` | The only backend and the only dynamic route (Edge runtime): a POST endpoint that checks a chat message and emails it to Parth through Resend. See [section 18](#18-the-backend-the-contact-route-and-the-email). |
| `robots.ts`, `sitemap.ts` | `robots.txt` and `sitemap.xml`, with absolute URLs from `lib/site.ts`. |

No icon or preview image lives in `app/` any more (they moved to `public/`
on 19 Nov; see [Contracts](#22-contracts-and-rules-that-must-not-be-broken)).

### components/: the page shell and pieces on every page

| File | What it is |
|---|---|
| `Sheet.tsx` | One sheet of the set: the anchor (carries the id), the slot, and the `<section>` with its ground, frame, four registration marks and index tab. Registers itself with `useSheetStick`. |
| `RegMark.tsx` | The crosshair registration mark (decorative SVG). |
| `Route.tsx` | The taxi route's static pieces: `Rail`, `Elbow`, `Stop`, `StopLabel`, `Spur`, `Station`, `Terminus`. A `Rail` with `stand` is a stretch a stand-in taxi drives. Markup only, so it works in server and client components. |
| `SmoothScroll.tsx` | Lenis (full motion only), keyboard scrolling, and every same-page hash link sent through `jumpTo`. Home page only. Renders nothing. |
| `StatusStrip.tsx` | The cream strip across the top of every page: name, rolling one-liners, "You've seen N%". |
| `BottomNav.tsx` | The home page's floating section nav with the small taxi on its road. |
| `RouteProgress.tsx` | The cream page-change sheet shown when moving between pages takes longer than 160 ms. Never add a `loading.tsx` instead (see [Hard-won lessons](#23-hard-won-lessons)). |
| `Cursor.tsx` | The engineering-reticle cursor (fine pointers only). |
| `Grain.tsx` | The paper-tooth grain overlay (an inline SVG noise tile). |
| `Ambassador.tsx` | The Kolkata Ambassador taxi in four prints (`color`, `outline`, `ink`, `line`) plus the symbol ids, and `AMB_TOP` / `TOP_VB` for the top-down route taxi. |
| `AmbassadorDefs.tsx` | The taxi's shared SVG symbols and gradients, drawn once in the root layout (ids prefixed `taxi-`). |
| `LegalPage.tsx` | The info pages' cream sheet and prose helpers (`H2`, `P`, `UL`, `LI`, `Strong`, `A`). Server. |
| `Footer.tsx` | The footer street on every page (sign, night street, parked taxi, "You've arrived", title block, legal line), and `FooterSheet` for the info pages and the 404. On the home page its taxi is the journey's stand-in for the kerb. |
| `HangingSign.tsx` | The footer's enamel "Parth" signboard on chains. |
| `NightStreet.tsx` | The static night street, kerb and lamp where the route ends. |
| `SocialIcon.tsx` | The GitHub, LinkedIn, Instagram and X logos for the title block's Connections cell (deleted in the twelfth round, restored in the thirteenth). |

### components/: Sheet 01, the loader and the hero

| File | What it is |
|---|---|
| `HomeSheet.tsx` | Sheet 01 (cream, inner tab): wraps `Hero`. |
| `Hero.tsx` | The hero's eight layers and the loader controller: readiness, the progress loop, the backstops and the GSAP outro (Span closed). |
| `LoaderBridge.ts` | The loader's Howrah Bridge and the craned name, as plain DOM and SVG: `createSpan` builds it on the sheet, `frame(t, p, o)` draws it, including the stamp and the push onto the hero taxi. Geometry from `BridgeArt.ts`. |
| `BridgeArt.ts` | The Howrah Bridge's shared geometry (`D`, `topY`, `panels`) and the static SVG strings for the Services band. |
| `HeroScene.tsx` | The drawn street of Sheet 01 in two prints (`ink`, `bp`): facades, the Victoria Memorial (`Memorial`), the railing, the robot, the dimension line, the kerb. |
| `TaxiDrawing.tsx` | The hero's 640-unit taxi, facing left, with the robot's roof rack, in either print. |
| `Exposure.tsx` | The copy line, the blueprint masks, the ink copy's upside-down mask (`InkMask`) and `useExposure`, the 01 to 02 transition. |
| `Portrait.tsx` | `usePortrait`: probes whether the cut-out photo exists, and prefetches `HeroPortrait`'s code. `PORTRAIT_SRC`. |
| `HeroPortrait.tsx` | The three.js relief of Parth's cut-out photo, split by the Exposure inside its shaders; `FlatPortrait` fallback. |
| `HeroOrb.tsx` | The liquid-chrome orb, shown only when the photo files are missing. |

### components/: Sheets 02 to 05

| File | What it is |
|---|---|
| `AboutSheet.tsx` | Sheet 02 (blue): a full gutter rail, `Intro`, then `Marquee`. |
| `Intro.tsx` | "Intro", the paragraph, the ticket, and the floppy in its paper sleeve with its note on a leader. |
| `FactsTicket.tsx` | "The short version" as a perforated ticket, with the rolling roles. |
| `ResumeDisk.tsx` | The CSS-3D floppy disk that opens the resume preview (its width is `--disk`; it takes `under` and `over` art drawn inside its link: the paper sleeve). |
| `ResumePreview.tsx` | The preview overlay and its disc-opening animation; `warmResumePreview`, `PREVIEW_EVENT`. |
| `TramBand.tsx` | The Kolkata tram on its wires above the stack rows. |
| `Marquee.tsx` | The four drifting stack rows with their enamel tins and the pause button. |
| `ServicesSheet.tsx` | Sheet 03 (night): wraps `Services`, carries the veil. |
| `BridgeBand.tsx` | The Howrah Bridge crossing at the head of Sheet 03; its deck taxi is the journey's stand-in. |
| `ShortOnTimeBoard.tsx` | The teal "Short on time?" enamel board, a plain link to Work. |
| `Services.tsx` | "What I can do": seven accordion rows hung on the route like stations, beside the plotter, then the rooftops. |
| `ServicePlotter.tsx` | The pen-plotter card that draws one technical drawing per service. |
| `ServiceDrawings.ts` | The seven technical drawings as pure data. |
| `WorkSheet.tsx` | Sheet 04 (grid paper): a rail and `Work`. |
| `PasteUp.tsx` | The paper roll and paste streaks on Work's top edge; dims the Services veil. |
| `Work.tsx` | "Selected work": index, four projects, prints, stamps, drawing plates, notes. |
| `drawings/SosRelay.tsx`, `drawings/HumanoidExploded.tsx`, `drawings/CarPlan.tsx`, `drawings/EvTrack.tsx` | The four project drawings (static SVG). |
| `drawings/kit.ts` | The shared ink palette `C`, `f1`, the seeded randoms, `Bal`, `Lead`, `DECKLE`, `starPath`. Also used by the bridge, night street, tram band and floppy. |
| `Stamp.tsx` | The round rubber stamp with its worn-ink mask. |
| `Medal.tsx` | The first-place medal on the humanoid's badge. |
| `JourneySheet.tsx` | Sheet 05 (blue): a rail and `Ventures`. |
| `Ventures.tsx` | "Founder journey": the copy line edge, the ghat, the railway timeline, the venture cards. |

### components/: Sheet 06

| File | What it is |
|---|---|
| `ContactSheet.tsx` | Sheet 06 (night): `Contact`, then `Footer`. |
| `Contact.tsx` | "Get in touch" around the phone over the pin wall, with the printed halftone balloon (`.ct-balloon`) that stages the phone, and the inbox note as the message box's label with its hand arrow. |
| `PhoneChat.tsx` | The CSS-3D phone and its chat-shaped contact form. |
| `PinField.tsx` | The WebGL pin-art wall behind the contact sheet. |

Deleted over time, all in git history: `Magnetic.tsx` and `Dust.tsx`;
`Numbers.tsx`, `DetailViews.tsx` and `FareMeter.tsx` (with "In numbers");
`MeterFlag.tsx`; `Nav.tsx`; `ServiceDrum.tsx`; the `Portrait` component
itself (`usePortrait` and `PORTRAIT_SRC` stay in `Portrait.tsx`).

### lib/

| File | What it is |
|---|---|
| `content.ts` | Every word, link and project on the site. See [section 16](#16-the-content-system-libcontentts). |
| `motion.ts` | The motion engine: GSAP and its plugins, the motion policy, `scrub()`, measuring helpers, `jumpTo`, `useSheetStick` and the focus guard, `canTransform`, `driveVeil`, `driveRoute` (the journey, its stand-ins and `onStand`, the hero drive planner), `playOnce`, `parseAccent`. See [section 7](#7-the-motion-system-libmotionts). |
| `motionBoot.ts` | The inline script that sets `html[data-motion]` before the first paint, turns scroll restoration off on the home page, clears an old storage key, and drops `data-motion` if the page script never runs. |
| `site.ts` | The public address (`SITE_URL`), `xHandle`, and `pageMeta()` for the info pages' titles, canonical links and previews. |
| `useYear.ts` | The current year, set after mount (so the server and browser HTML match). |

### public/

| File | What it is |
|---|---|
| `Parth-Betai-Resume.pdf` | The resume (188,567 bytes, shown as 184 KB). Public; it contains his phone number. |
| `resume-preview.webp` | A picture of the resume page for the preview (1800x2546). |
| `portrait.webp` | Parth's cut-out photo for the hero (1080x1456). |
| `portrait-depth.png` | The depth map for the 3D relief. |
| `work/android-app-suite.jpg`, `work/mini-humanoid-robot.jpg`, `work/obstacle-avoiding-car.jpg`, `work/wireless-charging-ev.jpg` | Parth's own project photos. |
| `art/facades-ink.svg`, `art/facades-bp.svg` | The hero's street facades in the ink and blueprint prints. |
| `art/rooftops.svg` | The rooftops that close the Services sheet. |
| `art/ghat.svg`, `art/ghat-m.svg` | The Journey ghat, desktop and phone. |
| `icon.svg` | Favicon: the colour taxi with a cream roof rack on a navy tile (made by `scripts/make-share-image.mjs`). Linked from the layout's `metadata.icons`. |
| `apple-icon.png` | The same mark, 180x180, for iPhone home screens (`metadata.icons.apple`). |
| `opengraph-image.jpg` | The link preview card (1200x630). Its description is `SHARE_ALT` in `app/layout.tsx`. |
| `twitter-image.jpg` | The same card for X, with the same description. |

### assets/, scripts/ and the root

| File | What it is |
|---|---|
| `assets/portrait-source.jpg` | The original photo the cut-out is made from (not served). |
| `scripts/render-resume-preview.mjs` | Makes `public/resume-preview.webp` from the PDF. |
| `scripts/make-portrait.mjs` | Makes the cut-out and depth map from the source photo. |
| `scripts/make-share-image.mjs` | Makes the link preview card and both icons, in `public/`. |
| `scripts/screenshots.mjs` | The screenshot checker used to verify every change. |
| `next.config.mjs`, `tsconfig.json`, `postcss.config.mjs`, `package.json`, `package-lock.json` | See [Tech stack](#3-tech-stack). |
| `.env.example` | Documents the environment variables (placeholder only). |
| `.npmrc` | `legacy-peer-deps=true` (see [Tech stack](#3-tech-stack)). |
| `README.md`, `CODEBASE.md` | The two documentation files. |


## 6. Architecture

The site is a Next.js App Router project with one long, heavily animated
home page (`app/page.tsx`), five short info pages, a 404 and one API route.
Every page is **statically prerendered**: the HTML is made at build time,
so the server only serves files, except for `/api/contact`, which runs on
each request, on the Edge runtime (a Cloudflare Workers function once
deployed; see [Deploying](#deploying)).

The core idea: **the markup is always the finished state.** The server HTML
shows every sheet, drawing, note and route piece where it ends up, so the
site reads correctly with JavaScript off. Scripts only animate things into
that state, and nothing is ever hidden by CSS before its animation runs
(with one exception, the intro hold-back, which applies only when the boot
script has marked the page as scripted).

### 6.1 Rendering model: server and client components

- **Server Components** render to HTML and ship no JavaScript of their
  own: `app/layout.tsx`, `app/not-found.tsx`, the five info pages,
  `LegalPage`, and the static drawings and pieces (`Ambassador`,
  `AmbassadorDefs`, `HeroScene`, `TaxiDrawing`, `NightStreet`,
  `HangingSign`, `Route`, `RegMark`, `Stamp`, `Medal`, `SocialIcon`,
  `ShortOnTimeBoard`, `WorkSheet`, `JourneySheet` and the four project
  drawings).
- **Client Components** (`"use client"` at the top) are everything that
  animates or reacts: `app/page.tsx` itself (so the whole home page tree
  hydrates), `Sheet`, `SmoothScroll`, `StatusStrip`, `BottomNav`,
  `RouteProgress`, `Cursor`, `Grain`, `Footer`, the hero files, the About,
  Services, Work, Journey and Contact components, and `lib/motion.ts` and
  `lib/useYear.ts`. A server component can still be used inside a client
  one (for example `Route` pieces inside `Footer`).
- **Browser-only code** is loaded with `next/dynamic` and `ssr: false`, so
  it is fetched separately and never runs on the server: `HeroPortrait` and
  `HeroOrb` (in `Hero.tsx`) and `PinField` (in `Contact.tsx`), because
  WebGL cannot run on the server.
- **Static art** (the bridge, the night street, the drawings) is built
  from constants. Where it is injected as raw HTML
  (`dangerouslySetInnerHTML`), the string comes only from build-time
  constants and numbers, never from a visitor, the URL or storage (see
  [Security](#19-security)). Seeded random numbers (`seeded`, `seededPM`
  in `components/drawings/kit.ts`) and `f1` rounding make the server and
  browser produce identical strings, so hydration never mismatches.
- **Times and clocks** that differ between the build and the visit (the
  copyright year, the phone's clock) are set after mount (`useYear`, the
  chat's clock effect) for the same reason.

### 6.2 The page shell: layout.tsx and page.tsx

**`app/layout.tsx`** (every page):

1. Loads the three fonts with `next/font/local` from `app/fonts` and
   exposes them as CSS variables (`--f-archivo`, `--f-kalam`,
   `--f-jetbrains`) on `<html>`. They are self-hosted because
   `next/font/google` failed intermittently at build time.
2. Builds `metadata` from `meta`, `identity` and `socials` in
   `lib/content.ts` plus `SITE_URL` and `xHandle` from `lib/site.ts`: the
   title template `"%s · Parth Betai"`, OpenGraph and Twitter tags,
   `metadataBase`, and `icons` (`/icon.svg`, apple `/apple-icon.png`).
   The OpenGraph and Twitter images are `/opengraph-image.jpg` and
   `/twitter-image.jpg` (1200x630), plain files in `public/`, with the alt
   text `SHARE_ALT`, a constant in this file built from the name and role.
   No canonical tag and no `og:url` here on purpose: every page would
   inherit the home page's address. `viewport` sets
   `themeColor` to the strip's cream `#f3eee3` and `colorScheme: dark`.
3. Adds the schema.org `Person` data as JSON-LD, built from `content.ts`
   (with its own hard-coded `knowsAbout` list) and escaped with
   `.replace(/</g, "\\u003c")` so no string can close the script tag.
4. Puts `motionBootScript` (from `lib/motionBoot.ts`) inline in `<head>`.
   `<html>` carries `suppressHydrationWarning` because that script writes
   `data-motion` before React hydrates. `motionBoot.ts` must stay a plain
   module (never `"use client"`), or the layout would get a client
   reference instead of the string.
5. Body order: the skip link to `#main`, `<AmbassadorDefs/>`,
   `<Cursor/>`, `<Grain/>`, `<RouteProgress/>`, then the page.

**`app/page.tsx`** (the home page, client) renders `<SmoothScroll/>`,
`<StatusStrip home show={done}/>`, `<BottomNav show={done} footer={foot}/>`
and `<main id="main" class="sheet-stack">` holding `HomeSheet`,
`AboutSheet`, `ServicesSheet`, `WorkSheet`, `JourneySheet` and
`ContactSheet` (which gets `footerRef={foot}` for the bottom nav). Its
lifecycle, in order:

1. Scroll restoration is set to manual and the page scrolls to the top.
2. **The intro lock:** while `done` is false, `html.style.overflow` is
   `hidden`, Lenis is stopped, and a scroll listener keeps snapping back to
   y 0 (Back into the home page used to restore an old position under the
   lock and leave a blank screen).
3. `driveRoute(main, { car: true })` starts the journey.
4. Sheets 2 to 6 are set to `autoAlpha: 0` during the intro (full motion;
   the CSS hold-back covers the first paint), then fade up from `top: 60`
   to `top: 0` over 1.1 s (`power3.out`), then `ScrollTrigger.refresh()`.
   It animates a relative `top`, not a transform, because of the pin-wall
   rule ([section 14](#14-sheet-06-contact-the-pin-wall-and-the-footer-street)).
5. `done` flips when `Hero` calls `onDone` (through `HomeSheet`), at 0.9 s
   into the loader's outro. If the URL has a hash (for example arriving
   from `/#contact` on another page), it calls `jumpTo(id, { focus: true })`
   1200 ms later.

**The boot script** (`lib/motionBoot.ts`, before the first paint):

- turns off scroll restoration on `/`, so the intro always starts at the
  top (setting it from an effect is too late for Back);
- deletes the old `localStorage["motion"]` value left by a removed Motion
  button;
- sets `html[data-motion]` to `soft` when the visitor's system asks for
  reduced motion, otherwise `full`;
- 8 s after `load`, if no `.sheet[data-stick]` exists (the page script
  never ran, for example a chunk failed to load), removes `data-motion`,
  so the no-JavaScript layout shows instead of a page stuck behind an
  intro. This depends on the names `.sheet` and `data-stick`.

**`data-motion` is the switch for everything:** "no `data-motion`" means
"no JavaScript ran". It turns sticky sheets on, enables the intro start
state (`[data-intro-hide]` at opacity 0, `[data-intro-rise]` 100vh down),
the hero hold-back, and (through `html:not([data-motion])`) the no-JS
rules: `[data-js-only]` hidden, every service panel forced open, extra
footer room for the bottom nav.

### 6.3 The six sticky sheets

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
  not padding, see [Hard-won lessons](#23-hard-won-lessons)) with `margin-bottom: -100svh`. `useSheetStick`
  measures each sheet with one shared ResizeObserver and writes `--stick`
  and `data-stick`; a sheet is only sticky once `data-stick` is set, and
  only under `html[data-motion]`. `html[data-measure]` puts every sheet
  back to relative while ScrollTrigger refreshes, so every trigger is
  measured in natural flow.
- **Without scripts** the sheets simply flow, each overlapping the one
  before by 26px with its index tab riding above that overlap.

**In the code:**

- **`Sheet.tsx` props:** `id`, `n` (two digits), `label`, `ground`
  (`cream`, `blue`, `night`, `paper`), `className`, `labelledBy`, `tab`
  (`"edge"`, `"inner"` or `"none"`) and `veil`. It renders the
  `.sheet-anchor#id` (zero height, `scroll-margin-top: 84px`), the
  `.sheet-slot` (`z-index` = the sheet number, so later sheets paint
  over earlier ones) and `section.sheet.g-{ground}` with `data-ground`,
  `data-sheet={n}`, `data-sheet-id={id}` and `aria-labelledby`. Inside:
  `.sheet-frame` (a double rule), four `RegMark`s, the index tab
  `a.sheet-tab` (`href="#id"`, the circled number `.tn`, the label `.tl`,
  `.is-inner` for the hero's tab under the strip), an optional
  `.veil[data-js-only]`, and the children.
- **Who uses it:** `HomeSheet` (cream, `tab="inner"`), `AboutSheet`
  (blue), `ServicesSheet` (night, `veil`), `WorkSheet` (paper),
  `JourneySheet` (blue), `ContactSheet` (night), `FooterSheet`
  (`id="footer"`, night, `tab="none"`), `LegalPage` (cream, inner tab) and
  the 404 (night, `tab="none"`).
- **CSS** (`f0-base.css`): in flow, each later slot overlaps the one before
  by 26px. With `data-motion`, every slot except the last gets an `::after`
  spacer 100svh tall plus `margin-bottom: -100svh`, so the total length is
  the same with and without scripts, but each slot has 100svh of room for
  its sheet to stay stuck while the next one covers it. `.sheet[data-stick]`
  becomes `position: sticky; top: var(--stick)`.
- **`useSheetStick(ref)`** (`lib/motion.ts`): one shared ResizeObserver
  watches every registered sheet. On a height change it stores the height
  and, on the next animation frame, `writeSticks` writes
  `--stick = min(0, innerHeight - sheetHeight)` px and sets `data-stick`.
  A tall sheet therefore sticks once its bottom reaches the bottom of the
  screen; it never sticks at top 0, which would hide its own bottom. A
  window resize only re-runs `writeSticks`. A height change also queues
  `ScrollTrigger.refresh()` after a 220 ms debounce, held back (polling
  every 220 ms) while `.hero[data-span]` exists, so a refresh never stalls
  the loader. Listeners are added with the first sheet and removed with
  the last.
- **Natural-flow measuring:** on ScrollTrigger's `refreshInit`,
  `html[data-measure]` is set, and the CSS rule
  `html[data-measure] .sheet-slot > .sheet { position: relative !important; top: auto !important }`
  turns every stuck sheet back into a plain box; on `refresh` the attribute
  is removed. Sticky positioning never changes layout, only where a stuck
  sheet is painted, so this causes no reflow and no scroll jump. For
  one-off reads use `withMeasure(fn)` (safe to nest) or `naturalTop(el)`.
- **`driveVeil(veil, { max = 0.2 })`** fades a sheet's `.veil` (its dark
  wash) from 0 to `max` while the next sheet's top moves from the bottom to
  the top of the screen. It finds the next sheet through the DOM order
  (slot, then anchor, then slot), so that order is a contract. It refuses
  the Contact sheet. Only `PasteUp` uses it, on the Services veil.

### 6.4 The taxi route and the journey

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

**The route pieces** (`components/Route.tsx`, all `aria-hidden`):

| Export | Renders |
|---|---|
| `Rail({ dir = "v" \| "h", rtl, stand })` | `<i class="rail v\|h [rtl]" data-stand?><b/></i>`: a dotted pencil `::before` with a solid `<b>` on top; the `<b>` is what gets scaled to fill the line |
| `Elbow({ corner })` | `i.elbow.e-{tl\|tr\|bl\|br}`, a rounded corner; `.ahead` is its dotted state |
| `Stop` | `i.stop`, a 20px ring |
| `StopLabel({ decorative })` | `span.stoplab` in Kalam |
| `Spur` | a horizontal `Rail.r-spur` plus `Stop.s-spur`, out to a project's number |
| `Station({ on })` | `i.station[.on]`, a service row's stop; filled when the row is open |
| `Terminus` | `i.stop.s-end`, the end of the line |

Each sheet's CSS places the pieces with the layout tokens `--rx`, `--cl`,
`--R` and `--rw`, and colours them with `--ri` and `--rh` from the ground.
z-order: rails and stops 4 to 5, tabs 8, the route taxi 10, a veil 20.

**`driveRoute(root, opts)`** has two modes.

- **Fill only** (`driveRoute(root)`, used by `Footer` on the info pages and
  the 404): each rail's `<b>` scales from 0 to 1 (`scaleY` or `scaleX`)
  as it passes a reading line 55% down the screen (`READ = 0.55`); the
  scroll range is the rail's own length for vertical rails and 140px for
  horizontal ones. `force3D: false` keeps the thin line crisp. Elbows
  toggle `.ahead` with enter, leave and refresh callbacks rather than
  `onToggle` (see [Hard-won lessons](#23-hard-won-lessons)).
- **Journey** (`driveRoute(main, { car: true })`, the home page only).
  Spurs still use the reading-line fill. Then:
  1. **`makeCar()`** creates `i.route-car` holding
     `<svg viewBox={TOP_VB}><use href="#taxi-amb-top"/></svg>`. It exists
     only with scripts.
  2. **`chain(root, car)`** runs once per ScrollTrigger refresh, inside
     `withMeasure`, and builds the model. For each `.sheet` it records
     its natural top, its `--stick`, the scroll at which it sticks, its
     slack (the slot's 100svh run-out, when sticky) and its tab height, so
     `screenTop(sheet, scroll)` is arithmetic with no DOM read. It collects
     every `.rail` and `.elbow` (not spurs) as segments in their own
     sheet's coordinates (an elbow becomes a quarter arc), starts at the
     centre of `.stop.s-home`, and greedily chains the unused piece whose
     nearer end is within 60px of the current point. On a change of sheet
     it inserts an approach from the new sheet's tab ring down to its first
     rail; leaving the hero it first inserts the entry arc into About's
     ring. The leftmost vertical line is the gutter.
  3. **The schedule** is a list of `[scroll, distance]` anchors read with
     straight lines between them, so each frame is a lookup. Gutter
     stretches follow the reading line (catching up at 1.5 times the scroll
     when behind, drifting at 0.6 times when ahead); a change of sheet is
     found by `cross()` (an 8px scan, then 30 steps of bisection) as the
     scroll where the next sheet's ring reaches the taxi; runs start when
     their corner is 84% down the screen and end when the far corner is at
     16%; the final run ends at the deepest scroll, with at least
     `len / 2.5` of scroll where it can. Anchors are made monotonic and
     never pass the deepest scroll.
  4. **`paint(s)`**, on every scroll update, is arithmetic and writes only:
     the hero drive while it is active; stand-ins shown, moved and their
     `onStand` callbacks called while the journey is on their rail; rails
     filled (`scaleX`/`scaleY` on the `<b>`) and elbows toggled, skipping
     unchanged values; the small taxi hidden while a stand-in drives,
     otherwise appended into the sheet it is on and moved with
     `translate3d(...) rotate(heading)`. It switches to the next sheet as
     soon as that sheet's tab rides over it.
  5. **Lifecycle:** one ScrollTrigger (start 0, end max) with
     `onRefresh` building and painting and `onUpdate` painting. The cleanup
     removes the car and every inline style it added and resets
     `heroLine`. In development, `window.__route()` returns the model.

**The hero drive planner (`planDrive`).** The hero's big taxi starts
parked and drives off to the left, shrinking with
`k = k1^(1 - (1 - t)^b)`, its x easing with exponent `a`, rising to the
entry arc in the second half. It may never go below About's top edge or
the Exposure copy line, and must avoid the boxes marked
`data-drive-avoid` in the hero (`""`: text, measured with a Range so the
box is only as wide as the words; `"box"`: the whole box; `"line"`: the
copy line's riding tab) and About's tab. `hits()` tests the car's shape
(two rectangles plus the robot) at 49 samples, ignoring obstacles it
already touches when parked; `arcClear()` checks 8 samples along the entry
arc. The search tries `sh` from 26% of the viewport height down to 24px
(steps of 6), `b` in `[1, 1.35, 1.8, 2.4, 3.2, 4.2, 5.5, 7]` and `a` in
`[1.5, 2, 2.6, 3.4, 4.5]`, keeping the plan that spends the most scroll
shrinking; the fallback is `[max(24, 0.1vh), 3.4, 7]` with a development
warning. The plan's `delay` (from `delayFor`) is written to
`heroLine.delay` and announced through `onHeroLine`, so the Exposure's
copy line waits just long enough never to cut the car. When measuring the
parked car it clears the `[data-intro-car]` transform too, in case the
loader still holds the car small.

**Stand-in markup contract:** a rail `stand="x"` and a car
`data-stand-car="x"`; optional `data-park="end"` (default) or `"rest"`;
`data-stand-from="rest"` for a car that starts parked (the hero), which
also needs a `[data-stand-body]` child (Ambassador passes it through).
Never write `transform` or `visibility` on a stand-in yourself; hang
extras off `onStand(name, fn)`, which receives progress `u` (0 to 1) and
whether the stand-in is on. Users: `BridgeBand` (`"deck"`, the lamps) and
`Footer` (`"kerb"`, "You've arrived").

### 6.5 Jumps and the focus guard

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


**In the code:**

- **`SmoothScroll.tsx`'s click delegate** catches plain left clicks on
  `a[href="#x"]` (and `"/#x"` when already on `/`) and calls
  `jumpTo(id, { focus: true })`. It skips the click when
  `defaultPrevented` is already set (a component handled it), when a
  modifier key is held or the target is not `_self`, when
  `decodeURIComponent` throws, or when the id is not on the page.
- **`jumpTo(target, { duration = 1.4, focus = false })`** takes an id, an
  element or a number. It lands at
  `naturalTop(el) - scrollMarginTop - root scrollPaddingTop`, clamped to
  `[0, maxScroll]`, with `lenis.scrollTo` when Lenis runs and native smooth
  scrolling otherwise. With `focus` it adds `tabindex="-1"` and focuses
  without scrolling. Never use `scrollIntoView` for jumps: it honours the
  bottom nav's scroll padding and stops short, and Lenis ignores
  `scroll-margin-top` and `scroll-padding-top`.
- **Keyboard scrolling:** Lenis owns the scroll position, so
  `SmoothScroll` maps Home, End, PageUp, PageDown (90% of the screen),
  the arrow keys (80px), Space and Shift+Space to
  `lenis.scrollTo(to, { duration: 0.8 })`, skipping inputs, textareas,
  selects, contenteditable elements, and Space on a focused button or
  link.
- **The focus guard** (`onFocusIn` in `lib/motion.ts`) reacts only to
  `:focus-visible` focus inside a registered sheet, waits two animation
  frames (so the browser's own focus scroll has run), and treats the
  control as hidden if its top is within 44px of the top of the screen
  (under the strip) or a higher-numbered sheet (measured from 40px above
  its top, so its tab counts) overlaps it. Then it calls
  `jumpTo(min(naturalTop - 0.35 * vh, ownSheetBottom - vh), { duration: 0.8 })`.


## 7. The motion system (lib/motion.ts)

`lib/motion.ts` (about 1600 lines, client) is the motion engine. It
imports GSAP, registers `ScrollTrigger` and `DrawSVGPlugin` once, and
re-exports `gsap` and `ScrollTrigger`. **Always import GSAP from
`@/lib/motion`**, so the plugins are registered.

### Exports

| Export | What it does |
|---|---|
| `gsap`, `ScrollTrigger` | Re-exported with the plugins registered. |
| `soft()` | True when the visitor's system asks for reduced motion (read live). |
| `scrub()` | `true` in soft mode (locked to the scroll), `0.6` in full (0.6 s of smoothing). Every scroll-linked piece uses it. |
| `withMeasure(fn)` | Runs `fn` with every sheet back in natural flow. Safe to nest. |
| `naturalTop(el)` | An element's top as if no sheet were stuck. |
| `maxScroll()` | The deepest scroll position (`ScrollTrigger.maxScroll(window)`). A layout read: never call it per frame. |
| `jumpTo(target, opts)` | The one way to jump within the page. See [6.5](#65-jumps-and-the-focus-guard). |
| `useSheetStick(ref)` | The hook `Sheet` uses to become sticky. See [6.3](#63-the-six-sticky-sheets). |
| `canTransform(el)` | False (with a development warning) for the pin wall or any ancestor of it. |
| `driveVeil(veil, opts)` | Fades an outgoing sheet's veil. |
| `onStand(name, fn)` | Subscribes to a stand-in taxi's progress. |
| `heroLine`, `onHeroLine(fn)` | The copy line's delay from the hero drive plan, and a listener for re-plans. |
| `exposureEnd(heroTop, heroH, aboutTop, vh)`, `exposureLine(s, end, heroH)` | The Exposure maths: the scroll where the copy line reaches the hero's top, and the line's y at a scroll, `clamp(2 * (end + heroLine.delay - s), 0, H)`. |
| `driveRoute(root, opts)` | The route fill, or the whole journey with `{ car: true }`. See [6.4](#64-the-taxi-route-and-the-journey). |
| `playOnce(targets, from, to, { at = 0.85 })` | One-shot reveals. |
| `parseAccent(text)` | Splits text on `*word*` into `{ text, accent }` segments. |

### How scroll animation is wired

- **One shared loop.** In full motion `SmoothScroll` creates
  `new Lenis({ duration: 1.05, easing: exponential out, touchMultiplier: 1.6 })`,
  drives it from `gsap.ticker` with `lagSmoothing(0)`, and calls
  `ScrollTrigger.update` on every Lenis scroll, so Lenis and every trigger
  share one animation frame and no trigger reads a stale position. It
  exposes `window.__lenis` (the resume preview and the page use it to stop
  and start scrolling). In soft mode there is no Lenis: the page scrolls
  natively and `SmoothScroll` only refreshes ScrollTrigger, again after
  `document.fonts.ready` (font metrics move things). Info pages always
  scroll natively.
- **Measure at refresh, do arithmetic per frame.** Whole-page readers
  (`driveRoute`, `StatusStrip`, `BottomNav`, the Exposure) use
  `ScrollTrigger.create({ start: 0, end: "max", onRefresh, onUpdate })`:
  they measure in `onRefresh` (which runs under `html[data-measure]`) and
  do only arithmetic in `onUpdate`. No layout reads per frame anywhere.
- **Clamped starts.** Function-based `start` and `end` values are clamped
  to `maxScroll() - 1`, so things near the foot of the page still fire.
- **What triggers a refresh:** a sheet's height change (debounced 220 ms,
  held while the loader runs), `document.fonts.ready`, the end of the
  post-intro fade, an opened or closed service row (650 ms later), and
  ScrollTrigger's own resize handling.
- **Cleanup.** Every consumer creates its triggers and tweens in a
  `useEffect` (usually inside a `gsap.context`) and returns a cleanup that
  kills them and clears the inline styles it wrote (`clearProps`). React
  StrictMode mounts every effect twice in development, so a missing
  cleanup shows up at once.
- **`playOnce`** sets the `from` state at once, then uses
  `ScrollTrigger.batch(..., { once: true })` with the start at the
  element's top minus `at` of the viewport (clamped to `maxScroll - 1`),
  and tweens to `to` with `overwrite: "auto"`. It is never reversed on the
  way back up ("like ink on paper"); its cleanup clears the `from` props.
  Used by Contact, FactsTicket, Intro, Services, Ventures and Work.
- **Draw-on lines** need `autoRound: false`, or GSAP rounds the dash offset
  and the line pops in at the halfway mark.

### Motion policy

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


## 8. Sheet 01: the loader and the hero

Files: `HomeSheet.tsx`, `Hero.tsx`, `LoaderBridge.ts`, `BridgeArt.ts`,
`HeroScene.tsx`, `TaxiDrawing.tsx`, `Exposure.tsx`, `Portrait.tsx`,
`HeroPortrait.tsx`, `HeroOrb.tsx`, `app/styles/s1-hero.css`.

**The hero is the loader.** There is no overlay: the name `<h1>` is in its
final place from the first paint, drawn as a pencil outline, and while the
page gets ready the Howrah Bridge is erected on the sheet as the progress
bar and each letter of the name is lowered onto its outline by a cable.
At 100% a SPAN CLOSED stamp lands, a barrier lifts, a small copy of the
hero taxi drives across and the view pushes in on it until it is the big
hero taxi at rest, while the rest of the hero arrives.

### How it looks and moves

- **The loader is the hero itself: Span closed** (Parth's pick of the
  four concepts, 17 Nov, [Changelog](#27-changelog); after the old site's "Portfolio"
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
  fonts are in. As the progress reaches letter i (p 0.02 + 0.58 i / 9,
  so the last at p 0.6 and, even on a fast load, the name is down, navy
  and shaded as SPAN CLOSED lands) a cable lowers it from above the sheet
  with a small brick girder on it: it comes down in red primer over
  0.34s, braking, swings a little (gone by 0.56s), gives a small bounce
  on landing, two rivets go in red-hot under it and cool, it keeps the
  primer while they are hot and is painted navy from 0.12 to 0.22s after
  landing (an oklab mix, so it never passes through plum), and the cable
  runs back up. Line 2 is lowered behind line 1. The "01 Home" chip and
  the overlay share z 8 and the ink copy comes later, so while
  `.bb-name` is in the hero the chip is lifted to z 9 and the cables pass
  under it (s1-hero.css). Each line's shade steps in once its last letter
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
  see [The taxi route and the journey](#64-the-taxi-route-and-the-journey)); on a phone the road and the corner show too. On a phone the
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


### The hero's layers (Hero.tsx)

`HomeSheet` renders `<Sheet ground="cream" tab="inner" className="hero" labelledBy="h-home">`;
the `hero` class is what every `.hero ...` rule in `s1-hero.css` keys on,
and `h-home` is the h1's id. `Hero.tsx` renders eight layers (the header
comment in `s1-hero.css` still says "six"; the code has eight):

| # | Element | Content | z |
|---|---|---|---|
| L1 | `div.h-layer.h-ink-back` | `.h-stage` with the ink `Back` (facades, memorial, dimension line), plus the `Kerb` | 3 |
| L2 | `BlueprintMask.h-bp-back` | the same in the blueprint print | 4 |
| L3 | `div.h-layer.h-canvas` | `HeroPortrait` when the photo exists, otherwise `HeroOrb`, each in a `[data-intro-rise]` box; a `<noscript>` `img.h-photo` | 5 |
| L4 | `div.h-layer.h-ink-front` | the ink `Front`: the railing, and `.h-car[data-intro-car] > .h-drive[data-stand-car="road"][data-stand-from="rest"]` holding the robot and `TaxiDrawing` | 6 |
| L5 | `BlueprintMask.h-bp-front` | the blueprint `Front` | 7 |
| L6 | `InkMask.h-ink-copy` | the ink `Copy` (the real, accessible copy) | 8 |
| L7 | `BlueprintMask.h-bp-copy` | the blueprint `Copy` (`aria-hidden`, buttons `tabIndex -1`) | 9 |
| L8 | `CopyLine` | the moving copy line, with About's tab riding it | 9 |
| route | `Rail dir="h" rtl r-hero stand="road"`, `Elbow e-hero`, `Rail r-hero-v`, `Stop s-home`, `StopLabel` (`route.stops[0]`) | the start of the taxi route | 8 |

- **`Front` is two boxes deep:** `.h-car` is the intro's box (the loader
  writes its transform: small at the barrier, then the push); `.h-drive` is
  the journey's box (the scroll drives it off). Only the ink print carries
  `data-intro-car`; both prints carry `data-stand-car`, so the blueprint
  copy moves in lock-step during the scroll.
- **`Copy`:** the first word of `identity.fullName` goes in `span.l1`, the
  rest in `span.l2`. Data attributes (ink print only): `data-intro-hide`
  on the ribbon, role, billing and buttons (they start at opacity 0);
  `data-x-avoid` on the name lines and the role (the riding About tab
  steps aside from them); `data-drive-avoid` (text) or
  `data-drive-avoid="box"` (the drive plans around them); `data-x-ctas`
  on the button row. The ink name is `<h1 aria-label={fullName}>` because
  the loader overlays `aria-hidden` letters inside it; the blueprint name
  is a `<p>`.
- **Constants:** `MORPH_MS = 1300`, `HOLD = 0.8`, `BAIL_MS = 6000`;
  `CTA_CONTACT` (the Contact label from `nav`), `CTA_WORK` (`work.heading`
  joined), `ROLE` (`identity.role` with non-breaking spaces round `" & "`,
  so it breaks only after the "&", with `.h-role { max-width: 14em }`).

### The loader, step by step

**Readiness.** `usePortrait()` answers `"pending"`, `"yes"` or `"no"`.
`fontsReady` turns true on `document.fonts.ready`. `centreReady` waits
for `HeroPortrait`'s `onReady` when the photo exists, or the orb's when it
does not, and is one-way (`||=`), so a late answer cannot undo the bail.
Both are refs, because they are read inside the animation-frame loop.

**The loader effect** (runs once):

1. Finds the back layer, the sheet, the copy box and `h1.h-name`.
2. Inside `gsap.context(..., sheet)`, calls `createSpan(sheet, layer, name)`,
   draws frame 0 and sets `sheet.dataset.span`, which lets the CSS show the
   taxi, already placed small by the barrier.
3. On resize (debounced 120 ms) calls `span.rebuild()` until the close.
4. **The tick** (an animation-frame loop): `dt` is the wall-clock time
   since the last frame, clamped to 0 to 250 ms (the floor stops a
   negative first step; the cap stops a jump after a hidden tab returns).
   `p = min(ready ? 1 : HOLD, p + dt / MORPH_MS)`, so progress holds at
   0.8 until both readiness flags are true. At `p >= 1` it calls
   `outro()`, otherwise `span.frame(now, p, -1)`.
5. **Backstops:** at 6000 ms (`BAIL_MS`) both readiness flags are forced
   true; at 8500 ms (`BAIL_MS + 2500`) `outro()` is called directly, for
   when the frame loop never ran (a tab opened in the background).
6. **`outro()`** (guarded so it runs once) stops the loop, closes the span,
   and builds the timeline through the context's `self.add(...)` (the outro
   runs after the context callback has returned; without `self.add` its
   selectors would escape the hero and `ctx.revert()` could not kill it).
   It first measures the `[data-intro-rise]` boxes (their parent's height
   and a cut against the live kerb line, `span.kerb()`).
7. Right after building the timeline it calls `land()` and sets
   `sheet.dataset.landed`. This must come after every `fromTo` has written
   its start values, or the CSS hold-back drops and the street flashes for
   one frame.
8. **Cleanup** cancels the loop and timers, removes the bridge, deletes
   `data-span`, reverts the context, clears the rise elements' styles and
   deletes `data-landed`.

**The outro timeline** (seconds after the close, `OUTRO = 2.3`):

| Time | What happens |
|---|---|
| 0 | a 2.3 s linear proxy tween calls `span.frame(closed + o, 1, o)` (bridge, stamp, push) |
| 0.56 | the Victoria Memorial (`.h-vm`) comes up from opacity 0 and scale 0.8 over 0.74 s |
| 0.62 | Parth rises from behind the kerb under a clip (`translate3d` plus `clip-path: inset(...)`) over 0.94 s |
| **0.9** | **`onDone()`: the hand-off to `page.tsx`** |
| 0.92 | the railing is planted upward by `clip-path` (never faded) |
| 0.95 | the ribbon drops in |
| 1.03 | the other `[data-intro-hide]` items rise (stagger 0.08) |
| 1.1 | the dimension line, its labels and the hero's route pieces fade in over 0.4 s |
| 2.3 | the bridge is removed and `data-span` deleted, so a held refresh can run |

### LoaderBridge.ts

`createSpan(hero, inkBack, name)` returns `{ frame, kerb, rebuild, remove }`.
It needs `.h-stage` and `:scope > .h-kerb` in the back layer, and
`[data-intro-car]` with `.h-drive` and `.h-taxi` inside it (non-null
assertions, so a rename throws).

- **The name** (`buildName`): measures every character with a DOM `Range`,
  finds each line's baseline with a zero-size probe, and reads each
  glyph's ascent from a canvas context whose font is
  `850 ${em}px ${fontFamily}` (**850 must match `.h-name`'s weight**). It
  builds the `aria-hidden` `.bb-name` overlay inside the h1: one `.bb-nl`
  span per letter, one `.bb-cab` cable with a brick girder per letter
  hanging from 40px above the sheet, two `.bb-nr` rivets per letter. Each
  letter has a threshold `thr = 0.02 + 0.58 * i / (n - 1)`, an alternating
  swing direction and a wall-clock birth time that survives a rebuild.
  Line 2 sits behind line 1. Each line's first child must be a single
  text node. If the fonts are not loaded yet it builds again on
  `document.fonts.ready`. `restore()` removes the overlay and clears
  `data-sh`.
- **The fit:** `k = min(0.76, (kerbY - nameB - 20) / 344, (W - 50) / 1324, (W - 74) / 1250)`,
  so the bridge clears the name by 20px and fits the sheet; the small
  taxi is `max(24, 74k)` long; on upright screens the deck is raised to
  just under the name and the push pans down to the kerb.
- **Build phases** (each member is a `<path pathLength="1">` drawn on by
  `stroke-dashoffset`; panels are staggered girder, handrail, vertical,
  top chord, bracing):

  | Phase | Progress p |
  |---|---|
  | towers | 0.03 to 0.24 |
  | anchor arms | 0.24 to 0.47 |
  | cantilever arms (with two creeper cranes) | 0.47 to 0.70 |
  | suspended span | 0.70 to 1 |

  Also drawn: the far-side truss (`.bb-far`, opacity 0.32), rivets
  (navy with a red-hot face), the river and hatched banks, four piers, a
  drifting country boat, the "Hooghly" label, the dashed plan and brick
  centre line (wiped in over the first 0.5 s), the gap dimension, the
  striped barrier at art x 1352, the `.bb-read` readout ("Loading" and a
  3-digit number) and the `.bb-stamp` ("SPAN CLOSED").
- **`frame(t, p, o)`** only writes (transforms, opacities, dash offsets,
  attributes), through helpers that skip unchanged values (even a
  same-value SVG attribute write invalidates style). Per letter: a 0.34 s
  out-cubic fall (`FALL`) with a damped bounce, a swing gone by 0.56 s,
  red primer to navy over 0.12 to 0.22 s after landing (`color-mix` in
  oklab), the cable letting go at 0.06 s (`LET`) and running up by 0.28 s,
  the rivets cooling over 0.2 s; each line's `data-sh` steps 0 to 9 over
  0.24 s after its last letter lands. At `o >= 0.42` the overlay goes and
  React's text takes over. The push: `e = io2(lin(o, 0.36, 1.16))`,
  `Z = Zend^e`, scaling about the taxi's nose on the kerb
  (`P.x = taxi.left + width * 0.25 / 49`, for TaxiDrawing's 49x19 art box);
  the bridge fades as Z goes from 2.2 to 5.5, then hides. The barrier
  rotates 84 degrees over o 0.02 to 0.32, the stamp lands over 0.06 to
  0.22 (scale 1.6 to 1, rotated -7 degrees), the readout fades out over
  0 to 0.06. The taxi drives in to the barrier over t 0.1 to 0.85 s, and
  after the close to the pivot over o 0.14 to 0.82.
- **Setup:** `drive.style.willChange = "auto"` during the loader, so the
  drive layer is not rasterised small (it would blur when pushed in); the
  CSS restores `will-change: transform` afterwards.

`BridgeArt.ts` holds the shared geometry: `D = 600` (the deck's y in art
units), `topY(x)` (the top chord: rising from 120 to the tower at 331,
down to 571, a sine sag to 720, mirrored), `panels()`, and the Services
band strings `VIEWBOX`, `TRUSS_ID`, `SCENE`, `TRUSS`, `LIT`, built once
with `seededPM`. **Changing `topY` or `panels` changes both the loader and
the Services band.** LoaderBridge also hard-codes the towers at 331 and
1109, the anchor piers at 120 and 1320, the centre at 720 and the barrier
at 1352.

### Readiness and backstops

| Signal | Source |
|---|---|
| fonts | `document.fonts.ready`, or at once without the Font Loading API |
| centre, photo found | `HeroPortrait` after its first WebGL frame plus one animation frame, or `FlatPortrait` on image load, error or `complete` |
| centre, no photo | `HeroOrb` after its first frame plus one animation frame, or at once if WebGL throws |
| bail | 6000 ms forces both flags true |
| force | 8500 ms calls `outro()` even if the frame loop never ran |
| boot safety | 8 s after `load` with no `.sheet[data-stick]`, `data-motion` is removed (no-JS layout) |
| held refresh | `ScrollTrigger.refresh` waits (every 220 ms) while `.hero[data-span]` exists |

Every WebGL failure path still reports readiness: a throw, software
rendering, a lost context and a texture error all switch to the flat
portrait, which signals on image load.

### Reduced motion and no JavaScript

There is no reduced-motion branch anywhere in the hero: in soft mode the
loader, bridge, outro, portrait float and orb run exactly the same. What
changes: no Lenis, scrubs locked to the scroll, and `page.tsx` does not
hide the later sheets during the loader (that CSS hold is full motion
only). The Exposure line is locked to the scroll in both modes. Without
JavaScript there is no `data-motion`, so no hold-back rule matches, the
`<noscript>` photo shows, the blueprint masks and copy line are hidden
(`data-js-only`) and `InkMask` covers the hero exactly at rest.

### The Exposure (Exposure.tsx)

- **The mask trick:** an outer clipping box moves down by y while an inner
  box moves up by y, so the content stays still while its window opens.
  `InkMask` is the same pair flipped, so the ink copy shows only above the
  line. `BlueprintMask` is `aria-hidden`, `inert` and `data-js-only`.
- **`useExposure`** finds About by `.sheet[data-sheet-id="about"]`
  (`sheets[1].id`). `measure()` reads only layout offsets (the
  `offsetTop` chain, so the intro's transforms never skew it): the canvas
  top, the button row, the tab, and the x extents of the `data-x-avoid`
  words. `apply()` clamps y, toggles `.is-exposing` (which turns on
  `will-change`), writes the transforms, shows the line only inside the
  hero, toggles `.off` on the riding tab when the line crosses the buttons
  or the avoid words, and sets `state.p`, `state.edge` and calls
  `state.onChange`. One trigger (0 to max) applies `exposureLine`; a
  second, from About's top, sets `state.covered`; `onHeroLine` re-applies
  when the drive is re-planned.
- **`ExposureState.onChange` is a single slot:** the GL portrait or the
  flat fallback sets it. Only one consumer is possible.

### The portrait (Portrait.tsx, HeroPortrait.tsx, HeroOrb.tsx)

- **`usePortrait(src)`** probes `/portrait.webp` with `new Image()` ("yes"
  on load, "no" on error; an `<img>` in the server HTML could 404 before
  hydration and its `onError` would never fire) and prefetches the
  `HeroPortrait` chunk at the same time.
- **`HeroPortrait`** (three.js): a 160x216 subdivided plane displaced by
  `portrait-depth.png`, each raised vertex slid back along its camera ray
  so at rest it projects onto the flat pixel; the fragment shader applies
  lighting as a difference against the rest-pose normal (so at rest it
  adds nothing) and outputs the blue duotone below `uEdge` (the Exposure
  line); a second pass draws the printed offset shadow. Tunables: `TOP`,
  `CAM_Z`, `DEPTH` (0.15), `PIVOT_Y`, `PIVOT_Z`, `YAW = 9`, `PITCH = 4`,
  `SWAY_YAW`, `SWAY_PITCH`, `FADE_FROM`, `FADE_TO`, `DUO`,
  `PRINT_OFFSET`, `PRINT_ALPHA`. `IMG_W`/`IMG_H` must match
  `portrait.webp` (1080x1456).
- It falls back to `FlatPortrait` if the renderer throws, if the GPU is a
  software renderer (`swiftshader|llvmpipe|basic render|software|warp`),
  or if the context is lost; `?portrait=flat` forces it. Textures decode
  off the main thread with `ImageBitmapLoader` (Safari 17+, Firefox 98+;
  older browsers use `TextureLoader`), then a GPU `premultiply()` pass with
  integer rounding makes them byte for byte what an `<img>` upload gives.
  The render loop rides `gsap.ticker` (so it draws in the same frame as
  the Exposure's masks) and stops off screen, in a hidden tab, and while
  About covers the hero. Pointer: mouse and pen only; after 2.5 to 5 s of
  stillness the idle float takes over.
- **`FlatPortrait`**: a plain `<img>` with a CSS 3D tilt, the same float,
  the waist fade as a mask, a CSS drop shadow, and the blueprint copy as a
  second image in a translate mask. Its mask uses heights cached by a
  ResizeObserver, never measured in the scrub.
- **`HeroOrb`** (only when the photo files are missing): a
  `MeshPhysicalMaterial` chrome orb with a `RoomEnvironment` reflection,
  vertices displaced by simplex noise (Ashima Arts, MIT) through
  `onBeforeCompile`; detail 40, or 16 on software rendering.

### HeroScene, TaxiDrawing and s1-hero.css

- **`HeroScene.tsx`** draws the street in two prints (`Tone` = `"ink"` or
  `"bp"`): `Memorial` (the Victoria Memorial in a 600x620 viewBox, from
  the `VM` path table), `Facades` (`/art/facades-${tone}.svg`), `Railing`,
  `Robot`, `Dimension` (labels from `hero.dimension`, real text in the ink
  print, `aria-hidden` in the blueprint one) and `Kerb`. SVG pattern ids
  are suffixed per tone (`hero-vm-dots-${tone}`) because both prints are
  on the page at once. Everything is placed by CSS in the 980x830 design
  box; nothing is measured.
- **`TaxiDrawing.tsx`** wraps `Ambassador`: the ink print is
  `variant="color"` with `shadow`, the blueprint print `variant="line"`,
  both flipped, with the rack. `className="h-taxi"` is used by
  LoaderBridge and the CSS; `data-stand-body` marks the body for the
  journey.
- **`s1-hero.css`:** `.sheet.hero` is `max(600px, 100svh)` tall;
  `--u = min(1px, (100svh - 70px) / 830, (100vw - 500px) / 980)` is the
  design unit and the art box is 980x830 `--u`, anchored bottom right
  70px above the bottom; `--kerb` is the kerb line and `--home` the Home
  stop's x. `.h-name` is weight 850 with `text-shadow: var(--shade-hero)`,
  and `.h-ink-copy .h-name { will-change: transform }` keeps the name on
  its own layer for good. The hold-back rules are under
  `html[data-motion] .hero:not([data-landed])`; later sheets are hidden
  only under full motion; the name outline is `color: transparent` with a
  hairline `-webkit-text-stroke`; the `data-sh` steps 1 to 9, where
  **step 9 must equal `--shade-hero`**. Breakpoints: upright tablets,
  short laptops (`max-height` 820px and 640px) and phones (760px and
  under, with the kerb at 720 of 844).


## 9. The status strip, the bottom nav and the pieces on every page

### How they look and move

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


**On every page:**

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
- **Link previews and search:** the card (`public/opengraph-image.jpg`,
  linked from the layout's metadata) is Sheet 01 in miniature: the cream drafting sheet with its frame and
  registration marks, the brick ribbon, the name in the hero's shade, the
  role on two lines ("Software Developer &" over "Robotics Engineer"),
  each on its own highlighter swipe, and the taxi on the kerb with its front
  half exposed as the blueprint copy. The favicon and the iPhone icon are
  the colour taxi with a cream roof rack on a navy tile. `themeColor` is
  the cream of the strip. Per-page titles, canonical links and the
  schema.org `Person` data are as before (`pageMeta()`, `SITE_URL` in
  `lib/site.ts`).


### In the code

- **`StatusStrip.tsx`** (props `home`, `show`; used by `page.tsx`,
  `LegalPage` and the 404). On the home page it carries
  `data-intro-hide` and slides in from `yPercent: -100` (`expo.out`,
  0.9 s) when `show` turns true. "You've seen N%" uses one ScrollTrigger
  (0 to `"max"`): `read()` gives 100 only within 2px of the bottom and is
  capped at 99 otherwise; at 100 it shows `strip.arrived`. It sets
  `html.style.scrollPaddingTop` to its own height through a
  ResizeObserver (`jumpTo` reads it). The one-liner reel holds each line
  `HOLD_MS` (4000) and rolls in `ROLL_S` (0.7 s, `power3.inOut`), with the
  first line repeated at the end so it loops, pausing in a hidden tab,
  under the pointer and while the line is hidden (1180px and below);
  screen readers get one `sr-only` paragraph with every line. The name
  links to `#home` on the home page (through `jumpTo`) and is a
  `next/link` to `/` elsewhere. CSS: `s2-chrome.css`, all scoped under
  `.strip` (fixed, z-index 50, a three-column grid `.sname`, `.sline`,
  `.seen`; the reading has tabular numbers and a 34px minimum width).
- **`BottomNav.tsx`:** `.bnav-layer[data-bottom-nav] > nav.bnav[data-intro-hide][data-ground=cream]`
  with the labels from `content.nav` and a dashed road with a 30px outline
  Ambassador. Constants: `TAXI = 30`, `READ = 0.4` (a line 40% down the
  screen), `DRIVE = 0.75` (the taxi waits for 75% of a section, then
  drives to the next label). One live tween shows and hides the pill
  (hidden: `yPercent: 170`, `autoAlpha: 0`): it hides while a text field
  has focus (read-only fields do not count) or while a footer row marked
  `data-nav-avoid` crosses the pill's band. It sets
  `scrollPaddingBottom` to its height plus 28. On refresh,
  `measureTops` (inside `withMeasure`) reads the sheet tops by id, the
  avoid rows and the layer's band; `measureParks` reads the label centres
  (a ResizeObserver on the list); `update(scroll)` is arithmetic: the lit
  label, the taxi's x through a `quickSetter`, `aria-current`, the footer
  overlap. Nav hrefs must equal sheet anchor ids. GSAP moves only the
  inner pill; the layer must stay free of transforms. In CSS, `::before`
  stretches each tap target down over the road (at least 40px) and
  `::after` holds an invisible bold copy of the label (`attr(data-label)`)
  so lit labels never change width; the parked taxi starts at
  `translateX(14.6px)` (7.2px on phones).
- **`RouteProgress.tsx`** listens (capture phase) for clicks on
  same-origin links to a different path that is not a file, with no
  `download` attribute and no modifier key. It shows after
  `SHOW_AFTER_MS = 160`, gives up after `GIVE_UP_MS = 15000`, and resets
  on a pathname change and on `pageshow` (the back/forward cache). It
  renders a fixed `z-[65]` cream sheet with frame, marks, a `role="status"`
  "Loading" and the `.rp-road` animation (`rp-fill`, `rp-drive`, 1.8 s,
  in `f0-base.css`). It replaced `app/loading.tsx`, which left the site
  blank without JavaScript.
- **`Cursor.tsx`** (z-70) runs only on `(hover: hover) and (pointer: fine)`.
  The native cursor is hidden by `body[data-cursor="on"]`, set after the
  first pointer move; text fields keep the I-beam, and the reticle steps
  aside over fields and iframes. At rest: four 7px corner brackets
  (`HALF = 13`) round a 3px dot and an `X 0000 Y 0000` readout. On an
  action target (`[data-hover], a[href], button, [role=button], label, summary`)
  the brackets frame the element (padding 6) and the readout becomes
  `PRESS`, `MAIL`, `OPEN ↗`, `GO` or `SELECT`, or the element's own
  `data-cursor` value. The ink colour comes from `onLight`: the first solid
  background under the point (from `elementsFromPoint`, parsed from rgb,
  `color(srgb)`, oklab or oklch), falling back to the nearest
  `[data-ground]`. The loop smooths the brackets frame-rate independently
  (the dot is not smoothed), re-hit-tests on scroll at most every 200 ms
  (`RECHECK_MS`) and sleeps after 8 settled frames. Constants sit near the
  top of the file.
- **`Grain.tsx`:** a fixed `div.grain` whose `--grain-src` is an inline SVG
  `feTurbulence` noise tile (180px, recoloured navy, alpha from the
  noise). CSS in `globals.css`: `inset: -12%`, `opacity: .09`,
  `z-index: 60`, a 6 s `grain-shift` in 6 steps, no blend mode.
- **`Ambassador.tsx`:** shared path data on a 48x18 grid (`BODY`, `WELLS`,
  `GLASS`), the symbol ids `AMB = "taxi-amb"`, `AMB_OUT = "taxi-amb-out"`,
  `AMB_TOP = "taxi-amb-top"` and `TOP_VB = "0 0 31 15"`. The default
  export takes `variant` (`color` and `outline` are `<use>` of the symbols;
  `ink` is a one-colour print with knocked-out glass and hubs; `line` is
  the cyanotype linework), `width` (64 by default), `flip`, `rack`,
  `shadow`, `ink`, `paper`, `className`, `style` and `data-stand-body`.
  Used by the bottom nav (outline, 30px), the page-change sheet (ink,
  54px), the ticket stub (ink, 64px), the hero, the bridge band (color,
  112px), the footer (color, 296px), the Exposure and the 404.
- **`AmbassadorDefs.tsx`:** rendered once in the layout as a 0x0
  absolutely positioned SVG. **Never `display: none` it,** or the
  gradients and symbols stop painting where they are used. It defines the
  gradients `taxi-g-body`, `taxi-g-glass`, `taxi-g-hub`, `taxi-g-chrome`,
  the clip path `taxi-glass-clip`, and the symbols `taxi-amb` (detailed
  side view), `taxi-amb-out` (the same with a navy keyline) and
  `taxi-amb-top` (the top-down route taxi in flat colours, so it stays
  crisp when rotated).


## 10. Sheet 02: About

Files: `AboutSheet.tsx`, `Intro.tsx`, `FactsTicket.tsx`, `ResumeDisk.tsx`,
`ResumePreview.tsx`, `TramBand.tsx`, `Marquee.tsx`, `app/styles/s3-about.css`.

### How it looks and moves

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


### In the code

- **`AboutSheet.tsx`:** `<Sheet ground="blue" className="about" labelledBy="h-about">`
  (from `sheets[1]`), then a full-height gutter `Rail`, `Intro` and
  `Marquee`. All CSS in `s3-about.css` is scoped under `.about`.
- **`Intro.tsx`:** exports `ABOUT_HEADING_ID = "h-about"`. Left: the heading
  and `intro.body` (a `*word*` becomes `<em>` through `parseAccent`).
  Right: `FactsTicket`, then a `.disk` box with
  `<ResumeDisk className="dview" diskClassName="sl-turn" under={<SleeveBack/>} over={<SleeveFront/>}/>`
  and `ResumeNote`. The sleeve panels are static spans inside the disk's
  link, so clicking them opens the preview, and they stay behind (empty)
  when the disk flies out. `ResumeNote` is `notes.resume` on a leader:
  two `playOnce` calls at 0.9 (the leader scales in on x, then the note
  fades up); the tilt sits on a `.note-tilt` wrapper so it does not clash
  with the transform GSAP animates on the `<p>`.
- **`FactsTicket.tsx`:** a `role="group"` card with `intro.factsTitle`,
  `identity.fullName`, a `<dl>` of `intro.facts` (the work cities read
  from `identity.locations`), and the **Roller** for `intro.available`.
  The cells stagger in with `playOnce` at 0.88. The Roller (`HOLD = 1.25`
  s, `SWAP = 0.55` s) renders an `sr-only` copy of the whole list, an
  `aria-hidden` static list (all that shows without scripts), and a hidden
  grid stack with an invisible sizer for every entry in the same cell plus
  a clipping box with two empty `data-slot` spans. `roll()` measures with
  `getComputedStyle` (not `getBoundingClientRect`, which a tilted ticket
  would inflate), and a repeating paused `clock` timeline calls it (no
  drift from chained `delayedCall`s). It pauses off screen and under the
  pointer. The swaps run outside `gsap.context`, so the cleanup kills them
  by hand and restores the static list. The slots must stay empty in JSX,
  so React never owns text there; with fewer than two roles it stays a
  static list.
- **`ResumeDisk.tsx`:** a real
  `<a href={resume.href} download={resume.fileName} type="application/pdf">`,
  so without scripts or with a modifier-click the browser downloads the
  PDF; a plain primary click calls `preventDefault()` and opens the
  preview. `FloppyArt` is the single disk markup, reused by the preview
  so the disk that flies out is identical. Constants: `CHAMFER`,
  `SHUTTER_TRAVEL` (about 32.3%), `LIFT = 18`, `PERSPECTIVE = 900`, six
  `LAYERS` with `translateZ` for thickness, and `FADE = var(--fo, 1)` (the
  preview fades every layer, because opacity on the 3D wrapper would
  flatten it). Effects: it warms the preview image when within 600px of
  the screen, at idle time, unless `saveData` is on; the arrival flips it
  up from `rotationX 72` at `top 92%`; the oxide disc spins like a drive
  motor (`spinTo` eases the time scale); `setOpen` slides the shutter,
  lifts and spins; it tilts toward a fine pointer only while on screen;
  only keyboard focus opens it; `lend(on)` hides it while the preview has
  it. Every element GSAP moves is a bare wrapper with layout classes only.
- **`ResumePreview.tsx`:** the modal viewer of `/resume-preview.webp`
  (1800x2546, `PREVIEW`), a picture rather than the PDF because the CSP
  blocks frames and phone browsers do not show PDFs in frames. Exports
  `PREVIEW_EVENT = "resume:preview"` (the chat's file card dispatches it
  with its rect), `warmResumePreview()` (decodes once, retries after a
  failure), and the types. Three opening modes: `disk`, `card` (the chat's
  file card grows into the page) and `plain`. A session makes every other
  body child `inert`, hides the page's overflow with a stable scrollbar
  gutter, stops Lenis through `window.__lenis` and focuses the download
  link. Every visual is driven from one plain object of numbers (`START`
  to `END`); in disk mode the opening pauses at 1.42 s until the image is
  ready (at most 6000 ms). Escape skips or closes, Tab is trapped, scroll
  keys go to the page scroller; the cleanup restores everything and
  returns focus. Zoom keeps the clicked point under the pointer. It is a
  `div role="dialog" aria-modal` portalled into `body` at `z-[65]`,
  **deliberately not a `<dialog>`**, whose top layer would cover the
  custom cursor. If the image fails it says the PDF download still works.
  Reduced motion does not shorten it: the visitor starts it.
- **`Marquee.tsx`:** `TramBand`, the pause button, then four rows from
  `stacks`. The track holds `COPIES = 4` copies and the CSS keyframe
  (`marquee` or `marquee-reverse` in `globals.css`) moves it by -50%, so
  the loop seam lands on an identical frame; each row's duration comes
  from `lap()` (`PACE = 0.25`, `STEP = 0.08`). The drift is pure CSS and
  runs before hydration; scripts only change `playbackRate` and
  pause/play through the Web Animations API: hover slows to
  `HOVER_RATE = 0.25` (pointer only), full motion boosts from scroll
  velocity (1 to 4, reset after 120 ms idle), an IntersectionObserver
  pauses the rows off screen, and `toggle()` is the WCAG 2.2.2 pause
  button (`aria-pressed`, `data-js-only`). An `sr-only` h2
  (`stackLabels.heading`) and per-row `sr-only` h3 and list carry the
  content; tins and moving copies are `aria-hidden`.
- **`TramBand.tsx`:** a decorative 1440x230 SVG street (poles at 150, 570,
  990, 1410, a messenger wire sagging 22 units, `d-only` and `m-only`
  copies) and a two-car tram whose dome reads `stacks[0].label`. One
  `fromTo` moves `.tramcars` from `-travel` to `+travel`
  (`travel = min(420, 0.6 * innerWidth) / 2`) with `scrub()` and
  `invalidateOnRefresh`.
- **`s3-about.css`:** layout (`.ab-grid` 1.3fr / 1fr), the ticket, the
  floppy, sleeve and note (`--S`, `--disk: calc(var(--S) * 0.7)`, the
  sleeve mask, the focus ring on `.dview a::after`, the leader), the tram
  band (`.tramwrap`, 240px), the stack rows (`.tin` with `--tilt`, the
  track's fade mask, `.pause`). Breakpoints: 1180, 1279/1024, 1023/761,
  760 and 380.


## 11. Sheet 03: Services

Files: `ServicesSheet.tsx`, `BridgeBand.tsx`, `BridgeArt.ts`,
`ShortOnTimeBoard.tsx`, `Services.tsx`, `ServicePlotter.tsx`,
`ServiceDrawings.ts`, `app/styles/s4-services.css`.

### How it looks and moves

- **The bridge crossing:** the head of the sheet, `max(270px, 24.8vw)`
  tall. As Services slides up over About the taxi crosses the drawn Howrah
  Bridge and the sky cross-fades from day through dusk to night, the
  lamps lighting behind the taxi. The route comes down the gutter, runs
  along the deck behind the taxi, turns down the right side, comes back
  along the Strand bank and carries on down the gutter. Since the
  thirteenth round the deck taxi is the journey's stand-in (Stand-ins,
  see [The taxi route and the journey](#64-the-taxi-route-and-the-journey)): the small route taxi hands over to it at the deck's corner, it
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


### In the code

- **`ServicesSheet.tsx`:** `<Sheet ground="night" className="services" labelledBy="h-services" veil>`
  with `Services` inside. No gutter rail here: `BridgeBand` and
  `Services` draw the route piece by piece.
- **`BridgeBand.tsx`:** height `--bh` (`max(270px, 24.8vw)`). Layers: three
  sky divs (day, dusk, night), `svg.scene` from `SCENE`, two truss SVGs
  (`.tr-ink`, `.tr-cream`) that `<use>` one `TRUSS_ID` group, `.litmask`
  with `.lit` (`LIT`), `.bankstrip`, the route pieces (`r-br-a`,
  `e-br-a`, `r-br-deck` with `stand="deck"`, `e-br-b`, `r-br-b`,
  `e-br-c`, `r-br-bank` rtl, `e-br-d`, `r-br-down`) and
  `.decktaxi[data-stand-car="deck"]` (`Ambassador variant="color" width={112} shadow`).
  The art strings are injected with `dangerouslySetInnerHTML` (static,
  built from constants). One scrubbed timeline (`top bottom` to
  `bottom top`) changes opacity only: day to dusk to night, and at 0.62
  the truss switches from ink to cream. `light(u)` slides `.litmask` one
  way and `.lit` the other so the lamps light behind the taxi; it is fed
  by `onStand("deck", ...)`, and `measure()` reads the deck rail's
  offsets on refresh.
- **`Services.tsx`:** exports `SERVICES_HEADING_ID = "h-services"`. Renders
  `BridgeBand`, then the heading (the two halves of `services.heading`),
  the handwritten `.svc-note` and `ShortOnTimeBoard`, then `.svc-grid`:
  the accordion `ul.srows` beside `ServicePlotter`, then the rooftops
  (`/art/rooftops.svg`) and a rail. State: `open` (row 0 at start),
  `picked` (false until the first click, so the plotter follows the scroll
  until then), `hover` (pointer only), `focus` (`:focus-visible` only) and
  `live` (true after mount; before that every panel is open and not inert,
  matching the server and no-JS HTML). Each row is
  `<h3><button aria-expanded aria-controls>` with its number, an icon from
  `ICONS[item.title]` and the title; the panel
  `div[data-svc-panel].pwrap` animates `grid-template-rows` between `0fr`
  and `1fr` plus opacity (nothing measured); closed panels are `inert`;
  `<Station on={isOpen}/>` fills the open row's stop. `ScrollTrigger.refresh()`
  runs 650 ms after `open` changes (the grid transition is 600 ms).
  **`ICONS` is keyed by the exact service title**: renaming a service in
  `content.ts` loses its icon unless you update the map.
- **`ShortOnTimeBoard.tsx`:** a plain `<a className="board" href="#work" data-hover>`
  with `services.shortcut`; works without scripts, and `SmoothScroll`
  routes it through `jumpTo` with them.
- **`ServicePlotter.tsx`** (`aria-hidden`, `pointer-events: none`): the
  legend is the service's first four `points` and the NOTE row its fifth,
  **so every service needs five points**. Constants: `DRAW = 1.3`,
  `LIFT = 0.2`, `TRAVEL = 0.32`, `HATCH = 0.7`, `RING_UP`, `RING_DOWN`,
  `RANK` (outlines, then hidden and centre lines and hatching, then thin
  lines, then leaders). `Drawings` renders every drawing once (all but the
  first hidden) plus the gantry and pen; `startEngine` drives the SVG
  imperatively (React never re-renders it): path lengths read once,
  `plan()` builds pen-travel and draw segments sharing `DRAW` seconds,
  `frame(t)` moves the pen with `getPointAtLength`, `partialDash` draws
  dashed lines without losing their pattern, and the `hl` ink uses the
  `stroke-acid`/`fill-acid` classes. `want()` picks the held row, else the
  scroll's row on desktop, else the target; from 1024px a
  `gsap.matchMedia` ScrollTrigger on the row list (`top center` to
  `bottom center`) reads row offsets on refresh only, stops where the sheet
  sticks and waits 110 ms before plotting; `hold(i)` waits 140 ms before
  handing back to the scroll. It pauses off screen; the first plot waits
  320 ms after the card comes into view.
- **`ServiceDrawings.ts`:** pure data for seven drawings on a 400x344
  card (`CARD`). Types `Ink` (`obj`, `thin`, `lead`, `cl`, `hid`, `hl`,
  `hatch`) and the ops `PathOp`, `TextOp`, `DotOp`, `HatchOp`; `INK` and
  `TONE` (colours copied from `--color-nline`, `--color-nline-2` and
  `--color-acid`); `class Kit` with the drawing methods; one function per
  sheet (`mobile`, `robotics`, `ai`, `fullstack`, `cyber`, `web`,
  `devops`). `SHEETS` matches a drawing to a service **by a regex on the
  title**, not by position (a title that matches nothing falls back to
  `i % 7`). Every stroke must be one continuous subpath, because the reveal
  slides a dash along it.
- **`s4-services.css`:** the bridge band (sky, truss, lamps, deck taxi, the
  route's U-turn), the header, the board, the rows (`.srow` grid
  40px / 30px / 1fr / 22px, `.pwrap`), the plotter card (sticky from
  1024px, under the list from 761 to 1023px, hidden on phones), the
  rooftops, no-JS rules, in-between widths and the phone.


## 12. Sheet 04: Work

Files: `WorkSheet.tsx`, `PasteUp.tsx`, `Work.tsx`, `drawings/`, `Stamp.tsx`,
`Medal.tsx`, `app/styles/s5-work.css` (shared with Journey).

### How it looks and moves

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


### In the code

- **`WorkSheet.tsx`:** `<Sheet ground="paper" className="work" labelledBy="h-work">`
  with a full rail and `Work`.
- **`Work.tsx`:** the deckle edge (`DECKLE` from the kit), `PasteUp`, the
  heading and blurb, an index `<ol>` linking to `#p01` to `#p04`, then each
  project, split by `Cut` (a dashed line with a `RegMark`).
  - **`DRAWINGS`** maps `project.index` to a drawing: `"01"` `SosRelay`,
    `"02"` `HumanoidExploded`, `"03"` `CarPlan`, `"04"` `EvTrack`. A
    project with no drawing gets `no-plate` and runs full width.
  - **Safety helpers:** `isSafeHref` allows only `http(s)`, `mailto`,
    `/path` and `#x`; `linksOf` drops unsafe or empty links; external links
    get `target="_blank" rel="noopener noreferrer"`.
  - **`isPlacing`:** a badge starting with a placing ("1st place ...")
    shows the `Medal` instead of the highlighter.
  - **`Project`** renders `.pidx` with a `Spur` and `StopLabel` (`p.kind`),
    the title through `parseAccent`, the badge, body, tags
    (`aria-label="Built with"`) and links, the print (`.pdrop > .photo`:
    kraft tape, the lazy 1800x1125 `<img>`, an optional
    `.stampwrap > span > Stamp`), and the plate `figure` with the drawing,
    the red callout, the payload card (`.paycard`), the legend and the
    note.
  - **Motion:** four `playOnce` calls: the drawing fades up and its
    `onStart` draws the `[data-lead]` leaders with DrawSVG; the print drops
    in (`back.out`); the stamp presses (scale 1.18 to 1); the note, red
    callout and payload card fade in. Cleanup leaves the leaders whole.
  - The multiply blend sits on the static `.stampwrap`; only the inner
    span scales, so the blended element is never transformed.
- **`PasteUp.tsx`:** `div.pasteedge[data-js-only]` with `.streaks` and
  `.roll`, a child of the Work sheet. It fades out between `top 36%` and
  `top 30%` (scrubbed) and calls `driveVeil` on the Services veil with
  `{ max: 0.2 }`.
- **`Stamp.tsx`:** props `{ id, top, mid?, mid2?, bottom }`; two rings,
  arc text, a middle word or a star, in `C.brick`; the wear is a mask of
  70 holes plus a dry streak from `seeded()` on a hash of the id. SVG ids
  are prefixed `wk-st-${id}`, so the id must be unique on the page.
- **`Medal.tsx`:** a static first-place medal (`C.taxi`, `C.brick`,
  `C.ink`), `aria-hidden`.
- **`drawings/kit.ts`:** `C` (the palette), `f1` (rounds to one decimal so
  server and browser print identical paths), `Bal({ n, x, y })` (a balloon,
  r 15), `Lead(...)` (a leader with `data-lead`), `seeded` (Park-Miller
  randoms in [0, 1)), `seededPM` (the bridge's variant), `DECKLE` (the
  1440x30 torn edge) and `starPath`. Written with `createElement`, not
  JSX, because it is a `.ts` file. Used by BridgeArt, LoaderBridge, Medal,
  NightStreet, ResumeDisk, Stamp, TramBand, Work and the four drawings.
- **The four drawings** are static `aria-hidden` `<svg className="dw ...">`
  in `C` colours; every word lives in the plate's HTML. **The balloon
  numbers must match the order of `drawing.legend` in `content.ts`.**

  | File | Draws | Balloons |
  |---|---|---|
  | `SosRelay.tsx` | phones and relay hops (viewBox `0 -46 680 566`, `dw-wide dw-sos`); its only SVG text is "SOS" | 1 to 3 (hops), no leaders |
  | `HumanoidExploded.tsx` | the exploded robot, servos and pose silhouettes (viewBox `84 0 530 350`) | 4 |
  | `CarPlan.tsx` | the car in plan with sensor cones (viewBox `0 30 660 420`) | 5 |
  | `EvTrack.tsx` | the track cross-section with coil and solar panel (viewBox `0 0 660 420`) | 5 |

- **`s5-work.css` (Work part):** deckle and paste-up, columns, the index
  grid (2.4em / 1fr / auto), projects (5fr / 7fr), stop and title, tags,
  photo, stampwrap (multiply), plate, cut; bigger balloons under 560px;
  the `no-plate` rule.


## 13. Sheet 05: Journey

Files: `JourneySheet.tsx`, `Ventures.tsx`, `app/styles/s5-work.css`.

### How it looks and moves

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


### In the code

- **`JourneySheet.tsx`:** `<Sheet ground="blue" className="journey" labelledBy="h-journey">`
  with a rail and `Ventures`.
- **`Ventures.tsx`:** `.xedge` (the cream copy line with crosshairs, the
  sheet's leading edge), the heading and blurb, the `.ghat` images
  (`/art/ghat.svg` as `d-only`, `/art/ghat-m.svg` as `m-only`; not lazy,
  `fetchPriority="low"`), the two boat tags (`ventures.boatTags`) and
  `.jnote`, the railway timeline (labels, a switch label, a track with
  `.seg`, `.buf`, a turnout SVG, ticks, years) and the venture cards
  (`ventures.items`: name, kind, status, body, facts; flex columns so the
  facts sit on the card foot). Motion: only `playOnce` on `.jnote, .tl-sw`.
- **`LINE_AT`, `SWITCH_AT`, `YEAR_AT`, `TICK_AT`** are percentages tied to
  the `.seg`, `.turnout` and `.buf` offsets in `s5-work.css`: change both
  sides together. The timeline assumes two ventures and three years
  (2024 to 2026).
- **`ventures`** in `content.ts` is derived from the private `VENTURES`
  list.


## 14. Sheet 06: Contact, the pin wall and the footer street

Files: `ContactSheet.tsx`, `Contact.tsx`, `PhoneChat.tsx`, `PinField.tsx`,
`Footer.tsx`, `HangingSign.tsx`, `NightStreet.tsx`, `SocialIcon.tsx`,
`app/styles/s6-contact.css`.

### How it looks and moves

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
  conversation are as before (see [the backend](#18-the-backend-the-contact-route-and-the-email)). In a production build the
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


### In the code

**`ContactSheet.tsx`:** `<Sheet ground="night" className="contact" labelledBy="h-contact">`
(from `sheets[5]`) with `Contact`, then `Footer`; it passes `footerRef`
to the `<footer>` so the bottom nav can step aside.

**`Contact.tsx`** (the top half of the sheet):

- Left: the heading with a hand-drawn yellow underline, the blurb and the
  email as a `mailto:` link. Right (`.ct-phone`): the pin-wall window
  (`.pinwin` holding `PinField`, loaded with `next/dynamic`, `ssr: false`),
  the balloon (`.ct-balloon`, the `BALLOON` path in a 600x640 box, cream
  with yellow dots rotated 18 degrees), the inbox note (`.ctn`,
  `notes.contact`), two arrows (`.ct-point-side`, `.ct-point-under`; CSS
  shows one per width) and the phone (`.ct-dev` holding `PhoneChat`).
  `data-chat-zone` on `.ct-grid` marks where the phone's pointer tilt is
  active.
- Motion (`playOnce`): the underline draws on; the balloon prints in at
  0.8 (opacity, scale, rotation); the note and only the visible arrow
  (filtered by `getClientRects().length`) at 0.95.
- **The window trick (the core contract):** `PinField`'s canvas host is
  `position: fixed; inset: 0`, always the size of the viewport, and
  `.pinwin` clips it with `clip-path: inset(0 round 20px)`, so the wall
  stays still while the page slides past the opening (`clip-path` can clip
  a fixed child; `overflow` cannot). If any ancestor gains a transform,
  filter, will-change, contain or content-visibility, it becomes the
  wall's containing block and the wall scrolls with the page at the size
  of that ancestor. The phone's 3D, the balloon and the footer sign's
  swing are all on siblings of the window, never on its ancestors.

**`PhoneChat.tsx`** (the contact form disguised as a chat):

- A phone built from HTML and CSS 3D, so the input on its screen is a real
  input (autofill, the phone keyboard, spellcheck and screen readers all
  work). Each question "Parth" asks fills one field; the last step POSTs
  to `/api/contact`; any failure offers a `mailto:` link that opens the
  visitor's own mail app with everything filled in.
- **Constants:** `LIMITS = { name: 100, email: 254, topic: 150, message: 1500 }`
  and the `EMAIL` regex (it refuses quotes, commas, spaces and angle
  brackets, because the address becomes the reply-to), **both identical to
  the ones in `route.ts`**; `ENDPOINT = "/api/contact"`; steps `idle`,
  `name`, `email`, `topic`, `message`, `confirm`, `sending`, `failed`,
  `done`; message kinds `text`, `file` (the resume card) and `draft` (a
  preview of the email); phone geometry in `cqw`; the poses `REST` and
  `FACE`; `REST_POSE` is used in the server render, so the first paint
  already shows the resting angle.
- **State and refs:** `msgs`, `step`, `typing`, `busy`, `clock`, `stamp`;
  `data` (the answers), `startedAt` (the visitor's clock when the chat
  began), `inflight` (blocks a double send), `alive`, `engaged` (no focus
  moves into the field before the visitor has interacted, which would pop
  open a phone keyboard), `honey` (the spam trap).
- **Flow:** the chat starts when 35% of the phone is visible (or on focus
  or a key). `reply()` shows typing dots for `min(1100, 480 + len * 11)` ms
  per message. `send()` handles each step: the name (whitespace
  collapsed; the next line uses the first word), the email (a failed test
  gets `badEmail` and the address back in the box), the message (a
  `DraftCard` preview, then confirm). `sendMessage()` posts JSON
  `{ name, email, topic, message, company, startedAt, sentAt }`, slicing
  every field to `LIMITS` again (`maxLength` does not stop a script), with
  `credentials: "same-origin"`, `cache: "no-store"` and a 20 s timeout
  (longer than the server's 10 s wait on Resend). Only `res.ok` with
  `json.ok === true` counts as sent; anything else shows `chat.failed`.
  `openEmail()` builds the `mailto:` with every part through
  `encodeURIComponent`, a constant recipient (nothing typed can add cc or
  bcc) and caps that keep it under about 2000 characters.
- **Pulses:** `pulse(strength)` dispatches the window event
  `pinfield:pulse` with `{ x, y, strength }` at the screen's centre: 0.25
  per keystroke (at most about 12 a second), 0.35 when Parth's message
  lands, 0.6 for the visitor's answer or the mail app, 1 for a send.
- **Pieces:** `Composer` (memoised; a `<textarea>` on the message step,
  growing to 118px, Enter sends, Shift+Enter adds a line, Enter during
  input-method composition is left alone; `noValidate`, `data-js-only`;
  the draft is cleared before `onSend`, so a returned bad email is not
  wiped); `Honeypot` (`name="company"`, visually hidden, out of the tab
  order, `aria-hidden`, outside the form so autofill never touches it,
  with attributes asking password managers to ignore it); `FileCard` (the
  resume link: a plain click dispatches the cancelable `PREVIEW_EVENT`,
  and it warms the preview on hover, focus or idle unless data saving is
  on); `DraftCard`; `Chip` (`pending` sets `aria-disabled` but keeps the
  button focusable); and purely visual parts.
- **Device motion:** a pointer tilt through `gsap.quickTo`, turning
  face-on near the pointer (with hysteresis) or while anything inside has
  focus; on scroll-in a `scrub: 0.8` timeline raises the rig and fades the
  stage. Opacity never goes on the rig (below 1 it flattens
  `preserve-3d`), and Tailwind transform utilities never go on the rig or
  the tilt box. Touch pointers are ignored.
- **Other details:** the message list has `data-lenis-prevent` and keeps
  scroll keys to itself while focused; it auto-scrolls with
  `el.scrollTo`, never `scrollIntoView`; the screen is
  `data-ground="cream"` (navy focus ring); the status-bar clock is set
  after mount. Without JavaScript, `<noscript>` blocks show a finished
  conversation and a `mailto:` bar; the form is hidden by `data-js-only`.
  The two fields and the honeypot carry `suppressHydrationWarning` only
  because browser autofill can add a `style` attribute before hydration.

**`PinField.tsx`** (the WebGL pin wall):

- Thousands of square gunmetal pins in a board tilted back 34 degrees, one
  `InstancedMesh` (one draw call); each pin's height is computed in the
  vertex shader from uniforms, so a frame uploads only a few numbers. The
  cursor raises a dome with a wake, chat pulses send rings (`RIPPLES = 12`),
  idle pins swell with simplex noise, a scan line runs up every 10 s, and a
  reveal sweeps across as it scrolls in. The material is
  `MeshStandardMaterial` patched through `onBeforeCompile`; shader comments
  must stay plain ASCII.
- **Constants:** `GROUND = 0x11163a` (must match the `.pinwin`
  background), `BACKLIGHT = 0xc99200`, pin budgets `CAP_GPU = 8800` (5200
  on a phone) and `CAP_SOFT = 2600`, `IDLE_BUILD_MS = 7000`.
  `isSoftwareGL()` probes the GPU name on a throwaway canvas.
- **When it builds:** never during the intro; when the section comes
  within one viewport (`rootMargin "100% 0px"`), or 7 s after load at the
  next idle moment unless data saving is on. A failed renderer leaves the
  printed CSS dots. Shader error checks run in development only
  (`renderer.debug.checkShaderErrors`; in production it is skipped, as it
  stalls the first draw and prints harmless D3D precision notes on
  Windows). Shaders compile with `renderer.compile` plus polling
  `program.isReady()` (`compileAsync` kept polling after teardown and
  threw).
- **The loop** runs only while the section is within 120px of the screen
  and the tab is visible; a governor drops the pixel scale to 0.8, then
  0.67, if it averages under about 36 fps after 180 frames; on software
  rendering it draws one still frame. `onPulse` validates the event (finite
  `x`, `y`, `strength`); a tap on the bare wall sends a 0.4 ripple. A lost
  context hides the canvas; teardown disposes everything and calls
  `forceContextLoss()` (browsers limit open WebGL contexts, and the hero
  has one too). In development it warns if its fixed host is not the
  viewport. It renders `<div data-pin-wall className="pointer-events-none fixed inset-0" aria-hidden>`.
- It does not tone down for reduced motion: the policy drops only scroll
  inertia and speed-driven effects, and nothing here reads speed.

**`Footer.tsx`** (every page):

1. `HangingSign`.
2. `.streetwrap`: `NightStreet`, `.ftaxi` (`Ambassador variant="color" width={296}`),
   `.arrive` (`notes.signoff`, the email, `contact.footerBlurb`, and "Get
   in touch": `<a href="#contact">` on the home page, `<Link href="/#contact">`
   elsewhere), the route pieces (`r-foot`, `Elbow bl`, `r-kerb` with
   `stand="kerb"` on the home page only, `Terminus`) and the
   `aria-hidden` "You've arrived" label (`strip.arrived`).
3. `.foot-in`: the title block `.tblock2` from `footer.titleBlock` and the
   legal line `.flegal` (`© {year} {identity.fullName}` and a "Legal" nav
   from `legal.pages`, with `aria-current`); both rows carry
   `data-nav-avoid`. The footer has no `role="contentinfo"` (it sits
   inside `<main>` on the home page).

Motion: on pages other than home, `driveRoute(root)` fills the route; on
home, `onStand("kerb", ...)` fades in "You've arrived" over the last
`ARRIVE = 0.14` of the kerb, and the journey (not the footer) drives the
taxi. The sign drops and swings from one progress value `v`
(drop `-(1 - min(1, v * 1.6)) * drop`, rotation `sin(v * 3π) * 4 * (1 - v)`),
scrubbed as its bar comes up the screen, or played once over 2.2 s if the
bar is already on screen at load (not in soft mode), guarded by
`canTransform`. `FooterSheet` is
`<Sheet id="footer" label="Footer" ground="night" tab="none" className="footsheet">`.

**`NightStreet.tsx`:** a static SVG street on a 1440x380 grid (kerb at
y 300, the lamp post at x 1250), built once into a string from the kit
palette and rendered twice: `.nstreet.d` full width, `.nstreet.m` with
`viewBox="840 0 600 380"` for phones. The positions of `.ftaxi`, the kerb
and the terminus in `s6-contact.css` are worked out in these units.

**`HangingSign.tsx`:** the bar and brackets, the `.swing` with chains and
the `.sign` (four flourishes, `word` and `under`), the sub-chains and
`.subsign` (`contact.footerNote`). Text from `footer.signboard`.
`.hang`'s `clip-path: inset(22px -80px -90px -80px)` makes the sign drop
out from behind the bar.

**`SocialIcon.tsx`:** inline `currentColor` stroke icons matched on the
lowercase label (github, linkedin, instagram, x or twitter, youtube; an
unknown name gets an outbound arrow), always `aria-hidden`.

**`s6-contact.css`:** a header restating the pin-wall contract; Contact
(`--phw: clamp(min(280px, 86vw), (100svh - 48px) * 0.4615, min(372px, 86vw))`,
from 1024px `clamp(280px, 80svh * 0.4615, 372px)`, where 0.4615 is the
phone's 9 / 19.5 aspect; `--phh = --phw * 2.1667`; the balloon placed with
`--bw` and `--peek`, the note and arrows with `--inb`); the footer
(`.hang`, `.swing` with `transform-origin: 50% 0`, `.ftaxi`, `.arrive`,
`.foot-in` on `#0a0e26`, `.tblock2`, `.soc`, `.flegal`); the info pages
(18.5px paragraphs, at most 680px wide, underlined links); the 404 with
its `@starting-style` taxi roll; in-between widths; and the phone (the
window's inset narrows to `0 -10px`; `.ftaxi` in `cqw` to match the
600-wide street crop). **Nothing in this file may put a transform, filter,
will-change, contain or content-visibility on the contact sheet, its slot
or `<main>`.**


## 15. The other pages

### What they are

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
  (19 November 2026, when the privacy page switched its host to
  Cloudflare; before that 12 October 2026, from the twelfth round);
  change it whenever a policy page changes.


### In the code

- **`LegalPage.tsx`** (server) renders `StatusStrip`, then
  `<main id="main" className="sheet-stack">` with a cream `Sheet`
  (`n="01"`, label `legal.tabLabel`, `tab="inner"`, `className="legalsheet"`)
  holding `<article className="lg">`: a back link (`notFound.cta`), the h1
  (it gets `is-long` when any word is longer than 9 letters), "Last
  updated" in a `<time dateTime>` and `.lg-body`; then `FooterSheet`. The
  sheet id comes from the page path with only letters, digits and hyphens
  kept.
- **Helpers:** `isoDate()` parses dates like "12 October 2026" into ISO
  form by hand (if it cannot, `dateTime` is left out); the prose
  components `H2`, `P`, `UL`, `LI`, `Strong` and `A`. `A` turns an internal
  `/path` into a `next/link`, opens `http(s)` links in a new tab with
  `rel="noopener noreferrer"` and "(opens in a new tab)" for screen
  readers, allows `mailto:`, and renders anything else (such as
  `javascript:` or `data:`) as plain text.
- **The five pages** each set `export const metadata = pageMeta(title, description, path)`
  and pass `updated={legal.updated}`:
  - `privacy`: the short version; what stays on your device (nothing); the
    contact chat (Resend; the IP kept in memory for under a day for rate
    limiting; no database); what other services see (the host, possibly
    Vercel, and Resend; it still names Vercel, not Cloudflare, see
    [Known issues](#26-known-issues-and-open-items)); links; your rights (`id="your-rights"`);
    children; changes; contact. Its header comment says every sentence
    must match real behaviour: if a component starts storing, sending or
    loading something new, update this page and `legal.updated`.
  - `terms`: who runs the site, fair use, ownership, the projects, no
    guarantees, liability, links, changes, governing law, contact.
  - `cookies`: none are used.
  - `accessibility`: what is in place; the two motion levels (full, and
    softer for reduced motion); the custom cursor only with a precise
    pointer; known limitations; feedback.
  - `credits`: design and build; the `fonts` list (Archivo by
    Omnibus-Type, Kalam by the Indian Type Foundry, JetBrains Mono by
    JetBrains, with what each is used for); photography; the tools list
    (Next.js, React, GSAP, Lenis, Three.js, Tailwind CSS).
- **`app/not-found.tsx`** (server, `metadata.title "Page not found"`): a
  night `Sheet` (`id="nf"`, `tab="none"`) with the h1 "404" (plus
  screen-reader text ", page not found"), a short road with the taxi
  flipped round (`Ambassador flip width={150}`), `notFound.title`,
  `notFound.body`, a home button, then `FooterSheet`. The taxi rolls in
  through CSS only: `@starting-style { translate: 140% 0 }` inside
  `prefers-reduced-motion: no-preference`.


## 16. The content system (lib/content.ts)

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


### Exports and who reads them

`lib/content.ts` (about 510 lines) is plain TypeScript objects with no
imports, so it is safe on the server and in the browser. Its header
comment records the truth rules: facts only from the resume or from what
Parth confirmed; things not confirmed are never claimed (iOS, TypeScript,
the Bluetooth SIG mesh standard, range or test counts); a number goes in
only if someone counted it; where the resume and the photos disagree, the
photos win; for Afferex, say what it offered, never delivered work.

| Export | What it holds | Read by |
|---|---|---|
| `identity` | `fullName`, `role`, `email`, `locations.primary` / `secondary` (no phone, on purpose) | the layout, the contact route, the info pages, Contact, FactsTicket, Footer, Hero, PhoneChat, ResumeDisk, ResumePreview, `lib/site.ts` |
| `resume` | `href`, `fileName`, `size` ("184 KB"), `pages` (1), `updated` ("May 2026") | Intro, PhoneChat, ResumeDisk, ResumePreview |
| `nav` | the five bottom-nav links (`#home` ...) | BottomNav, Hero (the Contact button's label) |
| `sheets` | the six sheets `{ n, label, id }` | the six sheet wrappers (by index), Exposure (`sheets[1]`) |
| `strip` | `name`, `seen`, `arrived`, six one-liners in `lines` | StatusStrip, Footer |
| `notFound` | the 404's title, body and button | `not-found.tsx`, LegalPage (the back link) |
| `notes` | handwritten notes: `resume`, `journey`, `contact`, `signoff` | Intro, Contact, Footer, `ventures.note` |
| `hero` | `ribbon`, `billing`, `dimension` (built from `identity`) | Hero, HeroScene |
| `route` | the stop names: Home, then the four projects' kinds | Hero (`stops[0]`) |
| `socials` | GitHub, LinkedIn, Instagram, X | the layout (JSON-LD `sameAs`), Footer, `lib/site.ts` |
| `intro` | heading, `body`, `factsTitle`, `facts`, `availableLabel`, `available` (the rolling roles) | Intro, FactsTicket |
| `stacks` | the four rows: Stack, Intelligent systems, Hardware, Learning | Marquee, TramBand |
| `stackLabels` | the sr-only heading and the pause button's two labels | Marquee |
| `services` | `heading`, `note`, `shortcut` (the board), seven `items` `{ title, points[5], body }` | Services, ServicePlotter, ShortOnTimeBoard |
| `Project`, `ProjectDrawing` (types) | the shape of a project and its drawing | Work |
| `work` | heading, blurb, four `projects` (`index` "01" to "04") | Work, Hero |
| `VENTURES` (not exported) | Psquare Online, Afferex | builds `ventures` |
| `ventures` | heading, blurb, `timeline`, `boatTags`, `note`, `items` | Ventures |
| `contact` | heading, blurb, `footerNote`, `footerBlurb`, `chat` (every chat line, with `{name}` and `{email}` placeholders, topics, actions, placeholders, `noscript.closing`) | Contact, PhoneChat, Footer |
| `legal` | `owner`, `tabLabel` ("Legal"), `updated` ("19 November 2026"), the five `pages` | the info pages, `sitemap.ts`, Footer, LegalPage |
| `TitleCell` (type), `footer` | `signboard` (`word` = first name, `under` = role, `sub`), `titleBlock` (four cells, one `{ socials: true, dt: "Connections" }`) | Footer, HangingSign |
| `meta` | the page title (`"Parth Betai · <role>"`) and description | the layout |

### Contracts inside the content

- **`*accent*`:** `parseAccent` splits on `/(\*[^*]+\*)/`. In `intro.body`
  the word renders as `<em>`; in project titles as `<span>` (weight 280
  through `.wc span`). One accented word per title.
- **Project `index`** is the number on the card, the React key, the
  heading id (`p01` ...) and the key into `DRAWINGS` in `Work.tsx`.
  Renumber it when reordering.
- **Project `links`** pass through `isSafeHref` (http(s), mailto, `/path`,
  `#x` only).
- **Badges:** at most 38 characters (one line on a 360px phone); one that
  starts with a placing ("1st ...") becomes the medal.
- **`drawing` text** must restate a fact from the project's `body` or
  `badge`; a stamp only for a real verdict; legend order = balloon numbers.
- **`sheets` order is load-bearing** (read by index): do not reorder or
  insert. **`route.stops`** must follow the projects' `kind` order.
- **The hero name** is split on spaces (first word, then the rest); the
  footer sign uses the first word only.
- **Non-breaking spaces (` `)** in service points keep "React Native"
  and "Bluetooth LE" on one line.
- **Services** need exactly five `points` each (four legend lines and the
  plotter's NOTE), and a title that keeps its `ICONS` key and matches a
  `SHEETS` regex.
- **Chat strings** keep their `{name}` and `{email}` placeholders.
- **`legal.updated`** changes whenever a policy page changes;
  **`resume.size` and `resume.updated`** whenever the PDF changes (the
  current file is 188,567 bytes, which is 184 KB).
- **Hard-coded outside this file:** the JSON-LD `knowsAbout` list in
  `app/layout.tsx`; the policy prose in `app/*/page.tsx`; and a few UI
  words in components (listed under
  [Known issues](#26-known-issues-and-open-items)).

### The facts behind the copy

These are the facts the copy rests on, kept from the project's earlier
handbook. Never add to them without Parth's confirmation.

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
  bound to 127.0.0.1 (see [Security](#19-security)).

## 17. The design system

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


### How the CSS is organised

- **Tailwind v4 lives in CSS.** `app/globals.css` starts with
  `@import "tailwindcss"`, then `styles/f0-base.css` (unlayered; it
  declares its own `@layer base` and `@layer components`), then
  `s1-hero.css` to `s6-contact.css`, each imported with
  `layer(components)` so a Tailwind utility can still win over them.
  Unlayered CSS beats Tailwind utilities, which is why component classes
  live in `@layer components`.
- **`@theme static`** in `globals.css` is the single source of colours and
  font stacks. `static` writes every token to `:root` even if no utility
  uses it, because the CSS files and scripts (the cursor, HeroScene and
  others) read them by name. Tailwind turns `--color-ink` into `text-ink`,
  `bg-ink` and so on. The font tokens: `--font-display` and `--font-body`
  are Archivo (`--f-archivo`), `--font-mono` JetBrains Mono, `--font-hand`
  Kalam, each with system fallbacks.
- **Aliases** in `f0-base.css` (`--cream`, `--card`, `--ink`, `--ink-deep`,
  `--muted`, `--blue`, `--bline`, `--bline-2`, `--nline`, `--nline-2`,
  `--taxi`, `--brick`, `--teal`, `--chrome`) point at the tokens. Change a
  colour in `@theme`, never in the aliases. Keep the name `--color-acid`:
  the `fill-acid` and `stroke-acid` utilities depend on it.
- **Each sheet's file scopes its rules** under the sheet's class (`.hero`,
  `.about`, `.services`, `.work`, `.journey`, `.contact`), so short class
  names (`.disk`, `.rows`, `.panel`) never collide. The strip and nav
  rules are scoped under `.strip` and `.bnav`.
- **Base rules** (`globals.css`): `html` and `body` on night-deep (no white
  flash on overscroll); `scroll-behavior: auto` (Lenis drives scrolling);
  `overflow-x: clip` on both (the giant type is wider than the screen;
  `clip`, not `hidden`, so the root never becomes a scroll container,
  which would break the fixed nav and ScrollTrigger);
  `font-synthesis-weight: none`; the `:focus-visible` ring (2px in
  `var(--focus, var(--color-acid))`, 3px offset) and none on
  `[tabindex="-1"]` landing points; yellow default selection.

**Layout tokens** (`f0-base.css`). Every route offset is written in them,
so changing a column moves the route with it:

| Token | Desktop | 1180px and under | 760px and under | Meaning |
|---|---|---|---|---|
| `--rx` | 34px | | 14px | x of the route's centre line |
| `--cl` | 104px | 64px | 30px | content left inset |
| `--cr` | 104px | 56px | 22px | content right inset |
| `--R` | 26px | | 18px | route elbow radius |
| `--rw` | 4px | | 3.5px | route stroke width |
| `--bh` | `max(270px, 24.8vw)` | | 270px | bridge band height |

**Breakpoints used across the project:** 760px (phone), 1180px (narrow
desktop), 1023/1024px (one column or two), 359px and 380px (small
phones), and `max-height` 820px, 700px and 640px for short desktop
screens. `.d-only` and `.m-only` switch desktop-only and phone-only
content at 760px.

**Fonts** (`app/layout.tsx`, `next/font/local`, `display: swap`): the
Archivo width axis matters (headings 92%, the hero name and painted text
96%, the stamp 76%, the medal 75%). To change a font: put the woff2 in
`app/fonts`, update the `localFont` call (keep the `variable` name), then
recheck the `font-stretch` values, `.t-head`'s tracking and leading, the
hero name's width, the loader's canvas font (weight 850), the 38-character
badge limit, and the Credits page. `scripts/make-share-image.mjs` embeds
Archivo too.

**Hard-coded colours.** Some colours are copied as hex values rather than
read from the tokens: the SVGs in `public/art`, `components/drawings/kit.ts`
(`C`), `AmbassadorDefs`, `HangingSign`, `Medal`, `PhoneChat`, `ResumeDisk`,
`ServiceDrawings`, `TramBand`, `HeroPortrait`, `PinField` (`GROUND`),
`Contact`, `HeroScene`, `s4-services.css`, `public/icon.svg`, `themeColor` in
`layout.tsx` and `scripts/make-share-image.mjs`. After changing a token,
search for its old hex across `components/`, `app/`, `public/art/`,
`public/icon.svg` and `scripts/`, and recheck the contrast ratios (focus rings at least 3:1).


## 18. The backend: the contact route and the email

The site's only server code is `app/api/contact/route.ts` (about 440
lines). The chat in `PhoneChat.tsx` is its only caller. It runs with
`runtime = "edge"` (since 19 Nov; it was `"nodejs"`) and
`dynamic = "force-dynamic"`, and calls Resend's HTTP API
(`https://api.resend.com/emails`) with plain `fetch`. Edge, because
Cloudflare Pages (`@cloudflare/next-on-pages`) runs every dynamic route
on Workers; so the route uses web APIs only (`fetch`, streams,
`TextDecoder`), and it is the only dynamic route in the build.

### The request, end to end

**Request contract:** `POST /api/contact` with JSON
`{ name, email, topic?, message, company, startedAt, sentAt }`.
`company` is the honeypot (must be empty); `startedAt` and `sentAt` are
the visitor's own clock readings.

**Checks in `POST`, cheapest first:**

| # | Check | On failure |
|---|---|---|
| 1 | `sameOrigin(req)`: if `Sec-Fetch-Site` is present it must be `same-origin`; `Origin` (or `Referer`) must be http(s) and its host must equal `x-forwarded-host` or `Host`, ignoring ports 80 and 443 | 403 `forbidden` |
| 2 | Content-Type is `application/json` | 415 `unsupported_media_type` |
| 3 | declared Content-Length over `MAX_BODY` (about 8 KB) | 413 `too_large` |
| 4 | `readCapped` reads the stream and stops past 8 KB; strict UTF-8 | 413 `too_large`; 400 `bad_request` if not UTF-8 or empty |
| 5 | `JSON.parse`, and it must be a plain object | 400 `bad_request` |
| 6 | `takeClient(clientKey(req))`: 5 per 10 minutes and 20 per day per client | 429 `rate_limited` with `Retry-After` |
| 7 | `looksLikeBot`: `company` not empty, times not finite, or less than `MIN_FILL_MS = 3000` between `startedAt` and `sentAt` | **200 `{ ok: true }`**, nothing sent, logs `[contact] dropped: <reason>` |
| 8 | `validate`: lengths against `LIMITS`, the email against `EMAIL`; the topic is optional | 400 `invalid_name`, `invalid_email`, `invalid_topic` or `invalid_message` |
| 9 | `RESEND_API_KEY` is set | 503 `not_configured` (with a console warning) |
| 10 | `takeGlobal`: 10 sends a minute for everyone together | 429 `rate_limited` |
| 11 | the send to Resend | 502 `send_failed` (see below) |

- **`clientKey`** reads `cf-connecting-ip` first (Cloudflare sets it and
  the client cannot), then the first `x-forwarded-for` entry, then
  `x-real-ip`. The order matters: Cloudflare appends to an existing
  `x-forwarded-for`, so its first entry could be forged there. It
  strips brackets, ports and zone ids, unwraps `::ffff:` IPv4, groups IPv6
  by its /64 block, and uses one shared `"unknown"` bucket when there is
  no usable address.
- **Cleaning:** `oneLine` (name, email, topic) turns line breaks and tabs
  into spaces, removes invisible and bidirectional control characters and
  lone surrogates, and collapses spaces; `multiLine` (message) normalises
  line breaks to `\n` and allows at most three blank lines in a row.
- **`LIMITS`** (`name 100`, `email 254`, `topic 150`, `message 1500`) and
  the **`EMAIL`** regex must stay identical to the ones in `PhoneChat.tsx`.

**The send:**

- `to` is `CONTACT_TO_EMAIL` or `identity.email`; `from` is
  `CONTACT_FROM_EMAIL` (CR and LF removed) or
  `Portfolio <onboarding@resend.dev>`.
- Subject: `Portfolio: ${topic || "Hello"} from ${name}`.
- A plain-text body (never HTML): Name, Email, Topic, Time (India time via
  `Intl`, plus the ISO time), the message, and "Reply to this email to
  answer <first name> directly."
- `reply_to` is the visitor's address. Nothing is ever sent **to** the
  visitor, so the endpoint can only email Parth.
- `fetch(upstreamUrl(), { Authorization: Bearer <key>, ..., signal: AbortSignal.timeout(10_000), redirect: "manual" })`.
  A redirect is never followed, so the key cannot be carried to another
  host. Workers reject `redirect: "error"`, so it is `"manual"`: a 3xx
  answer is not `ok` and fails like any other refusal. There is no
  `cache` option (Workers can reject it, and a POST is never cached).
  `upstreamUrl()` uses `CONTACT_UPSTREAM_URL` only when `NODE_ENV` is not
  production **and** its host is 127.0.0.1, localhost or [::1], so the key
  can never be sent to another host.
- If Resend refuses: log `[contact] upstream refused: <status> <name>` (the
  name sanitised to 60 characters), answer 502 `send_failed`. On a timeout
  or network error: log `[contact] upstream timeout|network`, answer 502.
  On success: 200 `{ ok: true }`. Provider errors and the key never reach
  the browser.
- Every answer goes through `reply()` / `fail()`: JSON with
  `Cache-Control: no-store`; failures are `{ ok: false, error }`.
- `GET`, `HEAD`, `PUT`, `PATCH`, `DELETE` and `OPTIONS` answer 405 with
  `Allow: POST`. Because `OPTIONS` is refused and no CORS headers are
  sent, a request from another site fails at the browser's preflight.

**State:** the rate-limit data (a `hits` Map and a `sends` array, swept
with a 5000-client cap trimmed to 90%) lives in memory. That is best
effort: on Cloudflare each Workers isolate has its own copy (and a fresh
one starts empty), so limits are per isolate (a shared store such as a KV
or Redis would be the upgrade). The
privacy page's "IP kept in memory, forgotten within a day" depends on this
design.

**The client side:** only `res.ok` with `json.ok === true` counts as sent;
every other result (including a 503 without a key) leads to the mail-app
fallback. The 20 s client timeout is longer than the server's 10 s.

### Email status and settings

- The chat's last step posts JSON to `/api/contact`; the route sends the message
  through Resend's HTTP API to `CONTACT_TO_EMAIL` (default `identity.email`), with
  the visitor's address as reply-to and the subject "Portfolio: <topic> from <name>".
- **Environment variables:** `RESEND_API_KEY` (required), `CONTACT_TO_EMAIL`
  (optional), `CONTACT_FROM_EMAIL` (optional, default
  `Portfolio <onboarding@resend.dev>`). `CONTACT_UPSTREAM_URL` exists only for
  local testing against a mock and is ignored in production.
- **Status:** Parth created a Resend key and it is in `.env.local` on his
  machine (29 Sep 2026). For the live site it has to be added to the
  Cloudflare Pages project as a secret variable (see [Deploying](#deploying)),
  together with the `nodejs_compat` compatibility flag. Resend's shared sender
  `onboarding@resend.dev` only delivers to the email address the Resend account
  was created with, so the account should be his Gmail, or a domain must be
  verified in Resend and `CONTACT_FROM_EMAIL` set to an address on it.
- **Not yet done:** a real end-to-end test message, locally or through the
  edge route on Cloudflare (needs his go-ahead, since it sends an email).
  Run locally on the Edge runtime (19 Nov), it answered GET with 405, no
  origin with 403, a wrong content type with 415, bad JSON with 400, a
  honeypot with 200 and nothing sent, and invalid fields with 400. Without a key the route answers 503 `not_configured` and the
  chat offers the mail-app fallback.


## 19. Security

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
  (in memory, so best-effort per Workers isolate); the client address comes
  from `cf-connecting-ip` first; upstream call times out after about
  10 s and never follows a redirect; plain-text email only; provider errors and the key
  never reach the browser; responses are `no-store`. `robots.txt` disallows `/api/`.
- **Secrets:** only in `.env.local` locally and in the host's environment settings
  in production. **`.env.example` is public and must only ever hold the
  placeholder `re_xxxxxxxxxxxxxxxxxxxxxxxx`**; Next.js never reads it. (On
  29 Sep the real key was typed into it in a local commit; it was caught
  before pushing and removed from that commit, so it never reached GitHub.) `.env*` is git-ignored except `.env.example`. Never put a secret
  in a `NEXT_PUBLIC_*` variable. Never write a key into the docs.
- **Content:** one rule for raw HTML (`dangerouslySetInnerHTML`, `innerHTML`):
  it is built only from build-time constants and numbers, never from visitor
  input, the URL or storage (the schema.org JSON is built from `content.ts`
  with every `<` escaped); all user text renders as React text; the `mailto:` fallback encodes every part
  and has a fixed recipient; external links use `rel="noopener noreferrer"`.
- Git: local tool folders (anything like a hidden settings folder for an
  editor or other tool) stay out of the repository through
  `.git/info/exclude`, not `.gitignore`, so the public ignore file names no
  tool. Before every commit, check `git status` for `.env.local` and scan the
  staged files for keys (`git grep --cached -nE 're_[A-Za-z0-9_]{16,}'`).
  The pattern always matches the placeholder in `.env.example` and in
  CODEBASE.md itself; a clean result is exactly those placeholder hits, and
  anything else is a real key (checked on 30 Sep: no other hits).


### The headers in detail (next.config.mjs)

The Content Security Policy (the browser's list of what the page may load
and where it may connect) is built from a list, one directive per entry,
with development-only and production-only parts:

| Directive | Value |
|---|---|
| `default-src` | `'self'` |
| `script-src` | `'self' 'unsafe-inline'`, plus `'unsafe-eval'` in development only |
| `style-src` | `'self' 'unsafe-inline'` |
| `img-src` | `'self' data: blob:` |
| `font-src` | `'self'` |
| `connect-src` | `'self'`, plus `ws:` and `wss:` in development only (hot reload) |
| `worker-src` | `'self' blob:` |
| `media-src` | `'self'` |
| `object-src` | `'none'` |
| `base-uri` | `'self'` |
| `form-action` | `'self' mailto:` |
| `frame-ancestors` | `'none'` |
| `frame-src` | `'none'` |
| `manifest-src` | `'self'` |
| `upgrade-insecure-requests` | production only |

`'unsafe-inline'` scripts stay because every page is statically
prerendered and Next.js ships inline hydration scripts with it, and the
motion boot script is inline; nonces would force every page to render on
each request, and hashes do not fit (the inline scripts differ per page
and per build, and with a hash present browsers ignore `'unsafe-inline'`).
It is acceptable because nothing a visitor sends is ever rendered as HTML.

Other headers, on every route (`/:path*`): HSTS
`max-age=63072000; includeSubDomains; preload` (production only, and only
effective over HTTPS), `X-Content-Type-Options: nosniff`,
`X-Frame-Options: DENY`, `Referrer-Policy: strict-origin-when-cross-origin`,
a `Permissions-Policy` turning off camera, microphone, geolocation,
payment, usb and browsing-topics, `Cross-Origin-Opener-Policy: same-origin`
and `Cross-Origin-Resource-Policy: same-site`.

- **Adding any outside host** (analytics, a CDN, an image host, a
  third-party API called from the browser) means changing the CSP **and**
  the privacy page, and asking Parth first.
- **A local `npm run start`** is plain http but sends
  `upgrade-insecure-requests`; Chrome and Firefox leave loopback alone,
  but Safari may try https and fail to load assets, so check local
  production runs in Chrome.


## 20. SEO, metadata and share images

- **The site address:** `SITE_URL` in `lib/site.ts` is
  `NEXT_PUBLIC_SITE_URL`, else `https://${VERCEL_PROJECT_PRODUCTION_URL}`
  (set only on Vercel), else `https://parthcodz.ext.io` (since 19 Nov; it
  was `http://localhost:3000`), with any trailing slash removed (`||`, not
  `??`, so an empty variable falls through too). It is read at build time.
  It is the `metadataBase` in the layout, so every relative image and
  canonical link becomes absolute, and the sitemap, robots.txt, the
  canonical links and the JSON-LD all use it. On Cloudflare Pages, with no
  variable set, that is `https://parthcodz.ext.io`.
- **Site-wide metadata** (`app/layout.tsx`): the title (from `meta`, built
  from the name and `identity.role`) with the template `"%s · Parth Betai"`,
  the description, `icons` (`/icon.svg`, apple `/apple-icon.png`),
  OpenGraph and Twitter tags with their images (`/opengraph-image.jpg`
  and `/twitter-image.jpg`, 1200x630, alt `SHARE_ALT`), `themeColor`
  `#f3eee3`, and the schema.org `Person` JSON-LD (name, URL, image
  `/portrait.webp`, job title, email, the primary work city with country
  `IN`, `sameAs` from `socials`, and a hard-coded `knowsAbout` list:
  Android development, React Native, Bluetooth Low Energy, Robotics,
  Embedded systems, Web development). No canonical and no `og:url` at the layout level, on purpose.
- **Per-page metadata:** each info page uses
  `pageMeta(title, description, path)`, which returns the title, the
  description, a canonical link, a complete `openGraph` block (`siteName`,
  `locale: en_IN`, `/opengraph-image.jpg` 1200x630, with the shorter alt
  "name, role") and a complete `twitter` block (`summary_large_image`,
  `/twitter-image.jpg`, `creator: @<handle>` from `xHandle`). It must be complete because a
  page's own `openGraph` block replaces the layout's whole block rather
  than merging with it.
- **`app/robots.ts`:** allows `/`, disallows `/api/`, points at
  `${SITE_URL}/sitemap.xml`.
- **`app/sitemap.ts`:** `/` (priority 1, monthly, no date) and the five
  info pages (priority 0.3, yearly, `lastModified` parsed from
  `legal.updated`; an invalid date is left out). The list is hard-coded:
  update it when you add a page.
- **Share images and icons** are plain files in `public/`, linked from
  the layout's `metadata` (since 19 Nov; they used to be Next.js
  file-convention files in `app/`, but each of those becomes a route
  that is not on the Edge runtime, and the Cloudflare build refused
  them): `opengraph-image.jpg` and `twitter-image.jpg` (identical
  1200x630 cards, described by `SHARE_ALT` in `app/layout.tsx`, which
  replaced the two `.alt.txt` files), `apple-icon.png` (180x180) and
  `icon.svg` (the colour taxi on a navy tile with radius 7). Never put
  them back in `app/` ([Contracts](#22-contracts-and-rules-that-must-not-be-broken)). All four are made by
  `scripts/make-share-image.mjs`
  ([section 21](#21-assets-and-helper-scripts)). The card is Sheet 01 in
  miniature: the cream drafting sheet with its frame and registration
  marks, the brick ribbon, the name in the hero's shade, the role on two
  highlighter swipes ("Software Developer &" over "Robotics Engineer"),
  and the taxi on the kerb with its front half drawn as the blueprint
  copy.
- **After deploying,** check the card with LinkedIn's Post Inspector
  (linkedin.com/post-inspector) or a WhatsApp chat.


## 21. Assets and helper scripts

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
  rebuilds `public/opengraph-image.jpg`, `public/twitter-image.jpg`,
  `public/apple-icon.png` and `public/icon.svg` (it wrote to `app/` until
  19 Nov; rewritten for the drawing set in
  the twelfth round; it uses `typescript`, already a dev dependency, to
  read the taxi's source). It draws them from the site's own pieces: the
  self-hosted Archivo, the drawing set's tokens (copied into the script as
  constants), the name, role and ribbon read from `content.ts`, and the
  taxi rendered from `components/Ambassador.tsx` and
  `components/AmbassadorDefs.tsx`, so the car on the card and in the icons
  is always the car on the page. The card is Sheet 01 in miniature (see
  [the pieces on every page](#9-the-status-strip-the-bottom-nav-and-the-pieces-on-every-page)); the icons are the colour taxi with a cream roof
  rack on a navy tile. Run it again after changing the name, the role, the
  ribbon, the taxi or the palette, and if the card's words change, update
  `SHARE_ALT` in `app/layout.tsx`, which describes it (the script's own
  comment says so too). The
  role is set at most 440px wide, so "Software Developer & Robotics
  Engineer" wraps after "&" and clears the taxi's roof rack, with a
  highlighter swipe per line (`box-decoration-break: clone`). The images
  were last regenerated on 12 Oct for the new role (the card about 90 KB,
  the iPhone icon about 8 KB; both icons came out unchanged).
- **Screenshots:** `node scripts/screenshots.mjs plan.json` (plan format at the top
  of the script). Use `"reducedMotion": true` to see what Parth sees.


**How `make-share-image.mjs` works:** it embeds
`app/fonts/archivo-latin-standard-normal.woff2` as base64, reads
`fullName`, `role` and `ribbon` from `lib/content.ts` with a regex,
compiles `components/Ambassador.tsx` and `AmbassadorDefs.tsx` with
`typescript.transpileModule` into `node_modules/.cache/make-share-image/`,
renders them with `react-dom/server`, builds the card from palette
constants copied from the tokens, writes `public/icon.svg` directly, and
takes screenshots in headless Chromium (a JPEG at quality 90 for the
card, copied to the Twitter file, and a PNG for the iPhone icon), all
into `public/`.

**The screenshot plan format** (`scripts/screenshots.mjs`, documented at
its top):

```json
{ "url": "http://127.0.0.1:3001/", "width": 1440, "height": 900,
  "mobile": false, "reducedMotion": true, "out": "shots",
  "steps": [ {"wait": 7000}, {"goto": "#contact"}, {"move": [900, 400]},
             {"hover": "css"}, {"click": "css"}, {"wheel": 400, "times": 2},
             {"eval": "js expression"}, {"shot": "name"} ] }
```

Keys inside one step run in the order wait, goto, scrollTo, wheel,
scrollToSel, move, hover, click, eval, shot. The home page's intro locks
scrolling for a few seconds, so start with a wait of about 7000 ms.
`"software": true` runs the browser with software WebGL; `"init"` adds a
script before the page loads. Screenshots and `log.json` (console errors
and warnings, page errors) land in `<out>` next to the plan file.


## 22. Contracts and rules that must not be broken

### Code contracts

Each of these has broken the site at least once, or would.

**Scroll, sheets and motion**

- `html[data-motion]` means "scripts are running". Never pre-hide content
  in CSS outside `html[data-motion]`; the markup is the finished state.
- Never make `html` or `body` `overflow: hidden` permanently (only the
  intro lock and the resume preview do it, and they undo it); never
  `overflow-x: hidden` on the root (use `clip`).
- The sheet DOM order is anchor, slot, section; the id is on the anchor,
  never on the section component inside. `driveVeil` and the route depend
  on that order. Keep the `html[data-measure]` rule.
- The slot's run-out is an `::after` spacer, not padding.
- Measure only in natural flow (`withMeasure`, `naturalTop`, or
  ScrollTrigger's refresh). No layout reads in a scroll frame.
- Every same-page jump goes through `jumpTo`; never `scrollIntoView`.
- Every sheet keeps its last 62px free of text (the focus guard's cap).
- `sheets[0]` is Home and `sheets[1]` is About; the order of `sheets` and
  `nav` hrefs must match the anchors.
- The route chain needs pieces within 60px of each other and a
  `.stop.s-home`. A stand-in needs `stand="x"` on its rail and
  `data-stand-car="x"` on its car; the hero's also `data-stand-from="rest"`
  and a `[data-stand-body]`. Never write `transform` or `visibility` on a
  stand-in yourself.
- Always import GSAP from `@/lib/motion`. Never put Tailwind
  `translate-*`, `rotate-*` or `scale-*` on an element GSAP transforms.
  Every effect cleans up fully (StrictMode mounts twice). Draw-on tweens
  use `autoRound: false`.
- Never add `app/loading.tsx` or any `loading.tsx`.

**The pin wall**

- The Contact sheet, its slot, `<main>` and every other ancestor of
  `[data-pin-wall]` carry **no transform, filter, will-change, contain or
  content-visibility**, ever. `canTransform()` and `driveVeil()` refuse
  them; `page.tsx` fades sheets with `top`, not `y`. Moving pieces near the
  wall are siblings of its window.

**The loader and hero**

- `LoaderBridge` needs `.h-stage`, `:scope > .h-kerb`,
  `[data-intro-car] .h-drive` and `.h-taxi`; the outro needs `.h-vm`,
  `.h-dim`, `.h-dimlab`, `.h-railing`, the hero's route pieces,
  `.h-ribbon`, `[data-intro-hide]` and `[data-intro-rise]` (whose parent
  box gives the height).
- The h1's children are spans, each starting with one text node. The
  canvas font weight 850 matches `.h-name`. `data-sh` step 9 equals
  `--shade-hero`. The nose pivot `0.25 / 49` assumes TaxiDrawing's 49x19
  box.
- `land()` runs after the outro's `fromTo` tweens exist; the outro is
  built through `self.add`; `frame()` never reads layout.
- The ink and blueprint prints keep an identical layout; SVG pattern ids
  stay per tone. `ExposureState.onChange` has one consumer.
- `BridgeArt` changes affect the Services band too.
- A new `portrait.webp` with other pixel sizes needs `IMG_W`/`IMG_H` in
  `HeroPortrait.tsx` and the `.h-portrait`/`.h-photo` CSS updated, and a
  matching depth map.

**Content and forms**

- `LIMITS` and `EMAIL` are identical in `PhoneChat.tsx` and `route.ts`;
  the JSON keys `company`, `startedAt` and `sentAt` are the spam-check
  contract.
- Project `index` keys `DRAWINGS`; legend order matches balloon numbers;
  services need five points, their `ICONS` key and a `SHEETS` match.
- `Stamp` ids are unique on the page.
- `AmbassadorDefs` is never `display: none`.
- Overlays stay in the normal stacking context (no `<dialog>.showModal()`,
  no popovers): the top layer would cover the custom cursor.

**Security**

- Raw HTML only from build-time constants. Visitor text renders as React
  text. External links use `rel="noopener noreferrer"`.
- `.env.example` only ever holds the placeholder. No secret in a
  `NEXT_PUBLIC_*` variable. No new outside host without changing the CSP
  and the privacy page.
- Servers bind to 127.0.0.1.

**Hosting (Cloudflare Pages)**

- No `icon.*`, `apple-icon.*`, `favicon.*`, `opengraph-image.*` or
  `twitter-image.*` file may live in `app/` or any folder under it. Each
  becomes a route that is not on the Edge runtime, and the Cloudflare
  build fails ("The following routes were not configured to run with the
  Edge Runtime"). They live in `public/` and are linked from the layout's
  `metadata`.
- `/api/contact` keeps `runtime = "edge"` and web APIs only. Any new
  dynamic route must be edge too. `next.config.mjs` must not become
  `output: 'export'`.
- The upstream `fetch` keeps `redirect: "manual"` (never `"error"`, which
  Workers reject, and never `"follow"`, which could carry the key
  elsewhere) and has no `cache` option.

### How Parth wants things done

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

## 23. Hard-won lessons

Read these before editing. Each one cost real time to find.

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
- **Several people or scripts working on one dev server** make it slow, and hot reloads
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
- **On Cloudflare Pages, a metadata file in `app/` is a route.**
  `icon.svg`, `apple-icon.png`, `opengraph-image.jpg` and
  `twitter-image.jpg` in `app/` looked like static files, but Next serves
  each through its own route, and next-on-pages refused the build because
  those routes were not on the Edge runtime. Plain files in `public/`,
  linked from `metadata`, do the same job with no route.
- **Workers are stricter about `fetch` options.** They reject
  `redirect: "error"` and can reject a `cache` option, both fine on Node.
  `redirect: "manual"` keeps the same safety: a 3xx is simply not `ok`.
- **Behind Cloudflare, trust `cf-connecting-ip`, not the first
  `x-forwarded-for` entry.** Cloudflare appends to a forwarded header the
  client already sent, so that first entry can be anything the client
  likes.

## 24. How to make common changes

After any of these, run the checks in
[Testing and verification](#25-testing-and-verification) and add a
Changelog entry.

### Edit copy

1. Change the text in `lib/content.ts` only. Components hardcode nothing
   beyond tiny UI labels.
2. Keep array lengths and orders that components index into (`sheets`,
   `route.stops` against the projects' kinds, project `index` against
   `DRAWINGS`), the `*accent*` markers (one per title), and the `{name}`
   and `{email}` placeholders in the chat.
3. Every claim must be true and confirmed by Parth (see
   [The facts behind the copy](#the-facts-behind-the-copy)). No em dashes.
4. If the name, role or ribbon changed, run
   `node scripts/make-share-image.mjs` (it writes to `public/`) and check
   `SHARE_ALT` in `app/layout.tsx` still describes the card.
5. If a policy page's text changed (in `app/<page>/page.tsx`), update
   `legal.updated`.

### Add a project

1. Add an entry to `work.projects` in `lib/content.ts` with the next
   `index` ("05"), `kind`, title (one `*accent*` word), badge (38
   characters at most), body, tags, links (http(s), mailto, `/path` or
   `#x` only) and `image`.
2. Put the photo in `public/work/` (the cards use 1800x1125).
3. Add the kind to `route.stops` in the same order as the projects.
4. Optional drawing: write a static `aria-hidden` SVG component in
   `components/drawings/` using `C`, `Bal` and `Lead` from `kit.ts`, add
   it to `DRAWINGS` in `components/Work.tsx` under the new index, and give
   the project a `drawing` whose `legend` order matches the balloon
   numbers and whose every word restates the body or badge. Without a
   drawing the project runs full width (`no-plate`).
5. A stamp only for a real verdict, with a unique id.
6. Check the Work index, the route spur and the page length at 1440x900
   and 390x844 (Work's start is a budget; see
   [Project status](#2-project-status-and-verification-history)).

### Add a service row

1. Add an item to `services.items` with a `title`, exactly five `points`
   (the first four become the plotter's legend, the fifth its NOTE) and a
   `body`.
2. Add an icon for the exact title to `ICONS` in `components/Services.tsx`.
3. Make sure a regex in `SHEETS` in `components/ServiceDrawings.ts`
   matches the title, or add a new drawing function there (each stroke
   one continuous subpath).
4. Check the rows, the stations on the route and the plotter at 1440,
   1024, 768 and 390.

### Change a colour

1. Change the hex in the `@theme static` block of `app/globals.css`
   (never the aliases in `f0-base.css`; never rename `--color-acid`).
2. Search for the old hex in `components/`, `app/`, `public/art/` and
   `scripts/` and update the hard-coded copies (see
   [the design system](#17-the-design-system)).
3. Recheck the contrast ratios (AA for text, 3:1 for focus rings) and the
   colour rules: yellow only on objects, teal only on enamel, brick only at
   full strength.
4. Rerun `node scripts/make-share-image.mjs` if the palette of the card or
   icons changed. Ask Parth first: the palette is his approved choice.

### Change loader timing

- **Speed and hold:** `MORPH_MS` (1300), `HOLD` (0.8) and `BAIL_MS` (6000)
  near the top of `components/Hero.tsx`. The force backstop is
  `BAIL_MS + 2500`.
- **Outro beats:** the timeline positions in `Hero.tsx`'s `outro()`, plus
  `OUTRO` (2.3) in `LoaderBridge.ts` and the `o` windows in `frame()`.
  `onDone` at 0.9 decides when the page unlocks.
- **Letters:** `FALL` and `LET` and the threshold spread
  (`0.02 + 0.58 * i / (n - 1)`) in `LoaderBridge.ts`. Keep the last letter
  down before the close, so the name is navy when SPAN CLOSED lands.
- **Bridge phases:** `PH` in `LoaderBridge.ts`; size and fit: `k` and the
  deck height.
- **Words** "Loading", "SPAN CLOSED" and "Hooghly" are in
  `LoaderBridge.ts`.
- Check it with reduced motion on (soft mode must play it), at 1440x900
  and 390x844, frame by frame if needed, and without JavaScript (no
  loader, everything in place).

### Add a page

1. Create `app/<slug>/page.tsx` as a Server Component built on
   `LegalPage` (or `Sheet` and `FooterSheet` for a different layout), with
   `export const metadata = pageMeta(title, description, "/<slug>")`.
2. If it is an info page, add it to `legal.pages` in `lib/content.ts` (that
   adds the footer link) and to the `pages` list in `app/sitemap.ts`.
3. No new outside requests without changing the CSP and the privacy page.
4. Do not add a `loading.tsx`.

### Add a sheet to the home page

1. Add it to `sheets` in `lib/content.ts` (at the end, or fix every
   component that reads `sheets` by index) and to `nav` if it needs a
   label.
2. Create a wrapper that renders `<Sheet id n label ground className labelledBy>`
   with a gutter `Rail`, and place it inside `<main>` in `app/page.tsx`.
   Order matters for the z-index and the route chain.
3. Keep its last 62px free of text, and its route pieces within 60px of
   the previous sheet's.

### Other common changes

| Change | Where |
|---|---|
| Chat wording, topics, success and failure text | `contact.chat` in `lib/content.ts` |
| Field limits or the email rule | `LIMITS` and `EMAIL` in `PhoneChat.tsx` **and** `route.ts`, together |
| Rate limits, minimum fill time, body cap | the constants near the top of `route.ts` |
| Email subject and body | the send block in `route.ts` |
| Social links | `socials` in `lib/content.ts`; an icon case in `SocialIcon.tsx` |
| Footer sign or title block | `footer` in `lib/content.ts` |
| Resume | replace `public/Parth-Betai-Resume.pdf`, rerun `render-resume-preview.mjs`, update `resume.size`, `resume.updated` and `resume.pages` |
| Portrait | `node scripts/make-portrait.mjs --publish` from `assets/portrait-source.jpg` |
| Smooth-scroll feel | the Lenis options in `SmoothScroll.tsx` |
| Scrub smoothing | `scrub()` in `lib/motion.ts` |
| Jump landing offset | `.sheet-anchor { scroll-margin-top: 84px }` in `f0-base.css` |
| Route reading line, catch-up rates, run timing | `READ = 0.55`, the 1.5 / 0.6 rates and the 0.84 / 0.16 run marks in `lib/motion.ts` |
| Reveal threshold | `playOnce`'s `at` (default 0.85) |
| Strip lines and timing | `strip` in `content.ts`; `HOLD_MS`, `ROLL_S` in `StatusStrip.tsx` |
| Nav taxi behaviour | the constants at the top of `BottomNav.tsx` |
| Page-change sheet delays | `SHOW_AFTER_MS`, `GIVE_UP_MS` in `RouteProgress.tsx` |
| Stack row speed, roller timing, plotter timing | `PACE`/`STEP` in `Marquee.tsx`; `HOLD`/`SWAP` in `FactsTicket.tsx`; `DRAW` and friends in `ServicePlotter.tsx` |
| Phone size | `--phw` on `.ct-phone` in `s6-contact.css` |
| Pin wall look or density | the constants at the top of `PinField.tsx` (`GROUND` must match `.pinwin`) |
| Portrait feel | the tunables near the top of `HeroPortrait.tsx`; test the fallback with `?portrait=flat` |
| Hero layout | `s1-hero.css` (desktop art box, short screens, phone) |
| Link preview card or icons | `node scripts/make-share-image.mjs` (writes the four files to `public/`), then `SHARE_ALT` in `app/layout.tsx` if the card's words changed. Never save them in `app/` |
| The site address | `NEXT_PUBLIC_SITE_URL` on the host (then rebuild), or the fallback in `lib/site.ts` |


## 25. Testing and verification

There is no automated test suite. Every change has been verified the same
way, by hand and with `scripts/screenshots.mjs`, in this order:

1. **Typecheck:** `npx tsc --noEmit --incremental false` must pass.
2. **Build:** stop the dev server, then `npm run build` must pass. Then
   check that no page was wrapped in a hidden Suspense block:

   ```bash
   grep -c 'hidden id="S:' .next/server/app/index.html   # must print 0
   ```

3. **Serve the build** with `npx next start -H 127.0.0.1 -p 3001` (a dev
   server is fine for quick checks, but final checks use a production
   build).
4. **Tour every page** (the home page, the five info pages, the 404) at
   desktop and phone sizes, at least 1440x900 and 390x844, and for layout
   changes also 1024, 768 and 360 wide and the widths in between (768 to
   1023 has hidden problems before, and `overflow-x: clip` hides them).
   Short laptops (1280x720, 1366x768) matter for the hero.
5. **Three modes for each:** full motion, **reduced motion** (soft mode,
   `"reducedMotion": true` in a plan: this is what Parth's PC shows, and a
   loader must play in it), and **without JavaScript** (everything in its
   final place, no blank areas, every service panel open).
6. **Inside each run, check:**
   - sideways overflow: `document.documentElement.scrollWidth - innerWidth`
     must be 0;
   - CSP violations: listen for `securitypolicyviolation` (must be none);
   - console errors and hydration warnings (a failed request shows up
     there);
   - no em dash (U+2014) in `document.body.innerText`;
   - nothing machine-looking, and the screenshots looked at critically.
7. **Motion checks when motion changed:** step the scroll down and back up
   (every 4 to 40px) and confirm exactly one taxi on its line in every
   sample; full and soft mode parked at the same scroll positions give the
   same state; loaders recorded frame by frame; Lenis wheel runs; a label
   never lags its arrow; nothing overlaps the copy.
8. **Contracts:** no ancestor of the pin wall carries a transform, filter,
   will-change or contain at any width; the home page cleans up its
   ScrollTriggers and listeners across client navigations and StrictMode's
   double mount; Back from an info page lands on the hero at the top.
9. **Sizes:** the page-length budget: Work should start within about 5.0
   screens at 1440x900, 5.3 at 1366x768, 5.6 at 1280x720, 6.0 at 390x844
   and 6.6 at 360x740 (scripts on, natural flow). The figures per round
   are in [Project status](#2-project-status-and-verification-history).
10. **Dependencies:** `npm run audit` should report 0 (three advisories are
    open now; see [Known issues](#26-known-issues-and-open-items)).
11. **Source checks:** no em dash and no tool names anywhere in
    the source or docs; before a commit, `git status` shows no `.env.local`
    and the staged-key scan is clean (see [Security](#19-security)).

**Tips:**

- The dev server compiles each page on first visit; repeat a failing
  check before calling it a bug (hot reloads and half-written chunks cause
  one-off errors).
- `?portrait=flat` forces the flat portrait; `window.__route()` (in
  development) returns the journey's model.
- Headless software rendering makes the pin wall's first build stall in
  development; judge performance on a production build on a real machine.


## 26. Known issues and open items

- **Three dependency advisories** (next, sharp, source-map-js; see
  [Project status](#2-project-status-and-verification-history)) wait for Parth's go-ahead, since fixing them downloads package
  updates. Run `npm audit --omit=dev` again after updating.
- **Commit and push the redesign** when Parth asks (as ParthBetai, with no
  co-author lines; `git add -A` first, since the drawing set is unstaged;
  scan the staged files for keys first, see [Security](#19-security)).
  Done: the redesign was pushed as `f234d68` on 18 Nov and the polish pass
  as `04bad0d` on 19 Nov; the same rules apply to every later push.
- **Deploy on Cloudflare Pages** with the build command, the output
  directory, the environment variables (`RESEND_API_KEY` as a secret at
  least) and the `nodejs_compat` compatibility flag for Production and
  Preview ([Deploying](#deploying)). Still to verify: the first passing
  Cloudflare build (next-on-pages has not been run locally) and one real
  send through the edge route.
- **Send one real test message** through the chat once Parth agrees.
- **Resume PDF** still contains em dashes and his phone number, does not list
  the offline SOS app or React, and it is out of date against the site: "100%" detection, "sensor arrays", the humanoid
  "selected for presentation" (it won) and Afferex "Present". Parth has to edit
  the source, then re-render the preview ([Assets and helper scripts](#21-assets-and-helper-scripts)).
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
- **The new loader, Span closed, is in** (picked 17 Nov, [Sheet 01](#8-sheet-01-the-loader-and-the-hero));
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
  `scripts/make-share-image.mjs` and running it again ([Assets and helper scripts](#21-assets-and-helper-scripts))
  would match the hero, with `SHARE_ALT` in `app/layout.tsx` checked after.
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
- **`npm run lint` probably does not work:** the script runs `next lint`,
  but neither `eslint` nor `eslint-config-next` is in the dependencies, so
  it is likely to prompt or fail. Not tried. Adding them means a download,
  so it needs Parth's go-ahead.
- **A stale comment in `s1-hero.css`:** its header says the hero has "six
  layers"; the code has eight (see [Sheet 01](#8-sheet-01-the-loader-and-the-hero)).


## 27. Changelog

Every change, in order, with its date. Add an entry with every change.

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
  Project cards accept an optional `focus` crop. README rewritten as the
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
  clicks instead. Done as a parallel pass with independent fact, photo,
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
  - Done as a parallel pass: the lead wrote the foundation, five builders
    (chrome and navigation, hero, intro, work and services, contact and
    footer) built the rest, five reviewers (including a design critic)
    raised 47 findings (24 of them must or should), and a fixer applied 39
    items (every must and should finding, the builders' code requests and
    most nits) and set aside 9: the four README hand-offs, the chat hydration
    warning (not a site bug) and four nits, three of which are in [Known issues and open items](#26-known-issues-and-open-items).
    Then the lead added Kalam to the Credits page (four fonts, all SIL OFL),
    dropped the unused Kalam bold, fixed three stale code comments, bumped
    `legal.updated` to 30 September 2026, ran the production build and its
    checks ([Project status](#2-project-status-and-verification-history)) and staged everything. Not committed or deployed yet.
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
    everywhere (the sheet sections and [the design system](#17-the-design-system)).
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
  - Done as a parallel pass: a foundation builder (content, tokens,
    the sheet and route primitives, the shared taxi, the motion
    plumbing), six section builders (hero, chrome, About, Services, Work
    and Journey, Contact and footer), a reviewer per stream with a fix
    round each, then an integrator who applied the cross-stream requests,
    toured the whole page at five sizes with and without JavaScript,
    removed the dead code and wrote the README. Not built, committed or
    deployed yet ([Project status](#2-project-status-and-verification-history)).
  - **Final fix pass (after three whole-site reviews: art fidelity and
    the caution check; contracts, accessibility and performance; copy,
    facts and code):** the route's last
    corner (the footer elbow) now turns solid at the bottom of the page
    (the elbows listen to enter and leave, see [Hard-won lessons](#23-hard-won-lessons)); a rail that has
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
      simply parked. See THE JOURNEY and Stand-ins in [The taxi route and the journey](#64-the-taxi-route-and-the-journey).
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
  - Done as a parallel pass: six fixers side by side (the copy, the
    hero, About, Work, Contact and the route), then one for the arrival
    at the end of the journey, three reviews on the live dev server
    (visual; motion; contracts and code), a final fixer for everything
    they raised, then the README. Not built, committed or deployed yet
    ([Project status](#2-project-status-and-verification-history)).

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
  - Done as a parallel pass: fixers for the six items, three reviews
    on the live dev server (visual; motion; contracts and code), and a
    final fixer for what they raised: the inbox label firing on its
    arrow's line, the plot scrubbed without per-frame layout reads, the
    loader taxi kept inside the frame, the hand-over reordered, and the
    copy lifted above the taxi. Not built, committed or deployed yet
    ([Project status](#2-project-status-and-verification-history)).
  - **Left open** ([Known issues and open items](#26-known-issues-and-open-items)): the shape of the taxi's shrink (linear
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
     billing 16.5px, with tighter gaps (`s1-hero.css`, [Sheet 01](#8-sheet-01-the-loader-and-the-hero)
     "Size"). The room went from 30 to 90px at 1280x600, 64 to 172 at
     1536x730, 73 to 169 at 1280x720, 79 to 205 at 1440x789, and is
     117 at 1366x657 and 200 at 1366x768; the first frame of a notch at
     1280x600 now takes the car from 409 to 294px instead of to 91.
     **This changes the look of the hero name on those screens, so
     Parth should see it before it ships.**
  3. **A printed speech balloon stages the phone** in place of the
     Contact wall lantern, its light, the phone's rim light and halo:
     the hero's yellow halftone disc drawn out into a balloon behind the
     phone (`.ct-balloon`, [Sheet 06](#14-sheet-06-contact-the-pin-wall-and-the-footer-street)), printed in once as the phone comes
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
    violations. Not built, committed or deployed ([Project status](#2-project-status-and-verification-history)).

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
  The details are in [Sheet 01](#8-sheet-01-the-loader-and-the-hero).
  - **Checked** (dev server, headless Edge): the typecheck; no
    driveRoute warning on a home load or after a resize, in full and
    soft motion at 1440x900 and 390x844, and the plan kept after landing
    equals a fresh one (1440x900 full, 390x844 soft); the home page, the
    five info pages and the 404 at 1440 and 390, in full and soft
    motion: 0 sideways overflow, 0 CSP violations, no console errors
    apart from the 404's own; without JavaScript at 1440 and 390 no
    loader, the name and the taxi shown, 0 overflow. Not built,
    committed or deployed ([Project status](#2-project-status-and-verification-history)).

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
  after load when no sheet has `data-stick` ([The motion system](#7-the-motion-system-libmotionts)). (2) After Back
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
  1440 and 390 ([Sheet 01](#8-sheet-01-the-loader-and-the-hero)). (7) Loader readiness is one-way: a portrait
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
  painted navy, each line's shade stepping in once it is down (see
  [Sheet 01](#8-sheet-01-the-loader-and-the-hero)). Same two lines, same size and box at every width; the landed hero
  is unchanged. Gone: the red-hot letter split (`data-dec`, `.bb-l`,
  `.bb-sh`, `.bb-one`) and the faint 0.18 first paint. Checked:
  clock-stepped frames at 1440x900, 1280x720, 768x1024 and 390x844, real
  time in full and soft motion, the hand-back pixel compare, the no-JS
  and pre-hydration paint, 4x throttled pacing at 390 with the overlay
  shown and hidden (no measurable difference in dev), and the tour.

- **18 Nov, the craned name, refined.** Three small changes in the name
  block. The letters start sooner (the last at p 0.6, was 0.8), so on a
  fast load the name is navy and fully shaded when SPAN CLOSED lands
  instead of still brick with hot rivets. The paint holds the primer
  while the rivets are hot and then goes to navy in 0.1s in oklab (was a
  0.28s sRGB mix that showed maroon and plum letters). The "01 Home" chip
  is lifted over the cables while the overlay is up (at 1024 and below
  they crossed it). Nothing else moved: fall, swing, give, rivets,
  girder, outline, shade steps, bridge, stamp, crossing and push are as
  they were. Checked: per-frame probe at 1440x900, 1366x768, 1280x720,
  1024x768, 768x1024, 390x844 and 360x780 in soft mode, and at 1440 and
  390 in full motion and with 4x CPU throttling (name navy with shade 9
  on both lines at the stamp in every warm run), a hit test that the
  chip is on top wherever a cable crosses it, the hand-back pixel compare
  (no change over 24 inside the name at 1440 and 390, full and soft), and
  the tour (only the known noise plus the Services item 4 change).

- **19 Nov, polish pass, pushed.** Small refinements, nothing removed:
  the weight-contrast headings, Services row titles, project titles and
  the footer sign-off use `text-wrap: balance` so no word is left alone
  on a line; the two venture cards are flex columns so their facts rows
  sit on the card foot and line up; on phones under about 400px the
  hanging sign's role line shrinks to clear the corner flourishes at the
  same sign height. Production build checked as on 18 Nov (42 runs
  clean) and pushed. The closing three-lens review of the sixteenth
  round was skipped at Parth's "do everything fast"; see [Known issues and open items](#26-known-issues-and-open-items).

- **19 Nov, hosting moved to Cloudflare Pages, pushed (`a448d29` and
  `60cfa24`).** Nothing on screen changes. (1) `a448d29`: the host is
  now Cloudflare Pages through `@cloudflare/next-on-pages` (build command
  `npx @cloudflare/next-on-pages@1`, output directory
  `.vercel/output/static`, no `wrangler.toml`, `next.config.mjs` not
  `output: 'export'`), and a new `.npmrc` sets `legacy-peer-deps=true`.
  The contact route runs with `runtime = "edge"` (was `"nodejs"`) and is
  the only dynamic route. Its fetch to Resend uses `redirect: "manual"`
  (Workers reject `"error"`; a 3xx still fails as not ok, so the key is
  never sent elsewhere) and drops the `cache` option. `clientKey` reads
  `cf-connecting-ip` first, then the first `x-forwarded-for` entry, then
  `x-real-ip`, since Cloudflare appends to `x-forwarded-for` and its
  first entry could be forged. The in-memory rate limits are now per
  Workers isolate. The Cloudflare project needs `RESEND_API_KEY` (secret,
  required), optionally `NEXT_PUBLIC_SITE_URL` (read at build time),
  `CONTACT_TO_EMAIL` and `CONTACT_FROM_EMAIL`, never
  `CONTACT_UPSTREAM_URL`, and the `nodejs_compat` compatibility flag for
  Production and Preview. (2) `60cfa24`: the first Cloudflare build failed
  with "The following routes were not configured to run with the Edge
  Runtime: /apple-icon.png, /icon.svg, /opengraph-image.jpg,
  /twitter-image.jpg", because metadata files in `app/` become routes.
  The four files moved to `public/` with the same names; the two
  `.alt.txt` files were deleted and their text is now `SHARE_ALT` in
  `app/layout.tsx`; the layout's metadata sets
  `icons { icon: "/icon.svg", apple: "/apple-icon.png" }` and the
  OpenGraph and Twitter images (1200x630, alt `SHARE_ALT`).
  `SITE_URL` in `lib/site.ts` now falls back to
  `https://parthcodz.ext.io` instead of `http://localhost:3000`
  (`NEXT_PUBLIC_SITE_URL`, then `VERCEL_PROJECT_PRODUCTION_URL`, still
  win), so `metadataBase`, the sitemap, robots.txt, the canonical links
  and the JSON-LD use that domain. `scripts/make-share-image.mjs` writes
  to `public/`, and its comment says to update `SHARE_ALT`. New contract:
  no icon or preview image file in `app/` ([Contracts](#22-contracts-and-rules-that-must-not-be-broken)). The build's routes
  are now `/`, `/_not-found`, `/accessibility`, `/cookies`, `/credits`,
  `/privacy`, `/terms`, `/api/contact` (dynamic, edge), `/robots.txt` and
  `/sitemap.xml`.
  - **Checked** (locally): the edge route answered GET with 405, no
    origin with 403, a wrong content type with 415, bad JSON with 400, a
    honeypot with 200 and nothing sent, and invalid fields with 400.
    **Not verified:** next-on-pages was not run locally (it works poorly
    on Windows), a passing Cloudflare build has not been seen, and no
    real email has been sent through the edge route. Later the same day the
    privacy page and `.env.example` were switched to Cloudflare (Cloudflare's
    privacy policy linked) and `legal.updated` moved to 19 November 2026.
