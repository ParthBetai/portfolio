"use client";

import {
  memo,
  useCallback,
  useEffect,
  useId,
  useImperativeHandle,
  useLayoutEffect,
  useRef,
  useState,
} from "react";
import { gsap, reduced } from "@/lib/motion";
import { contact, identity, resume } from "@/lib/content";
import { PREVIEW_EVENT, warmResumePreview } from "./ResumePreview";

/* ============================================================
   PHONE CHAT
   The contact form, dressed as a conversation on a phone. Each question
   Parth asks fills one field; the last step sends the message straight
   to his inbox through /api/contact (app/api/contact/route.ts). If that
   fails for any reason, the visitor's own mail app is offered instead,
   with everything filled in.

   The device is DOM and CSS 3D rather than a render or a canvas, so the
   field on its screen is a real input: autofill, the mobile keyboard,
   spellcheck and screen readers all behave as they would anywhere else.

   Structure, outside in:
     stage  layout box (Tailwind), sets the perspective and the cqw unit
     rig    moved by GSAP only: the scroll-in rise and swing
     tilt   written by the pointer loop only: rest pose, tilt, face-on
            ├ shadow on the wall behind
            ├ edge layers: the frame's thickness, one slice per layer
            └ front face: metal ring, black bezel, screen
   Transforms live on rig and tilt alone, never next to a Tailwind
   transform utility, because GSAP would not see those.

   The device's own sizes (frame, island, status bar) are in cqw, percent
   of the stage width, so one set of proportions holds at every size. The
   app inside is in px, like a real app, which is why the stage has a
   minimum width (see `size` below).
   ============================================================ */

const chat = contact.chat;

/* Field length caps, used as maxLength, before sending and when the
   fallback email is built. The server checks the same numbers.
   254 is the longest valid email address (RFC 5321). */
const LIMITS = { name: 100, email: 254, topic: 150, message: 1500 } as const;

/* The same pattern the server checks (app/api/contact/route.ts), so a
   typo is caught at the email step, where Parth can ask again, rather
   than as a failed send at the end. Keep the two in step. It refuses
   quotes, commas, spaces and angle brackets because the address becomes
   the reply-to of the email Parth receives. */
const EMAIL =
  /^[A-Za-z0-9.!#$%&'*+/=?^_`{|}~-]{1,64}@(?:[A-Za-z0-9](?:[A-Za-z0-9-]{0,61}[A-Za-z0-9])?\.)+[A-Za-z](?:[A-Za-z0-9-]{0,61}[A-Za-z0-9])?$/;

const ENDPOINT = "/api/contact";

type Step =
  | "idle"
  | "name"
  | "email"
  | "topic"
  | "message"
  | "confirm"
  | "sending"
  | "failed"
  | "done";
type Line =
  | { kind: "text"; from: "parth" | "you"; text: string }
  | { kind: "file"; from: "parth" }
  | { kind: "draft"; from: "parth"; subject: string; body: string };
type Msg = Line & { id: number };

/* ---- device geometry, in cqw ------------------------------------- */
const R = 15.2; // outer corner radius
const RING = 1.15; // metal visible around the glass, face on
const BEZEL = 2.9; // black border between glass edge and pixels
const DEPTH = 9.6; // frame thickness, roughly a real phone's ratio
const SLICES = 10; // layers that build the thickness

/* ---- poses, in degrees ------------------------------------------- */
const REST = { x: 6, y: -16 }; // turned toward the copy, leaning back a touch
const FACE = { x: 0.8, y: -2.5 }; // nearly flat, for crisp text and exact clicks
const STILL = { x: 3, y: -9 }; // motion off: one gentle angle, never moves

/* Everything that follows the tilt, from one pair of angles. Used for the
   server render too, so the first paint is already the rest pose. */
const pose = (rx: number, ry: number) => ({
  tilt: `rotateX(${rx.toFixed(2)}deg) rotateY(${ry.toFixed(2)}deg)`,
  /* The reflection slides across the glass as the phone turns, and the
     glint runs round the metal ring faster, like a real edge catching a
     window. */
  sheen: `translate3d(${(-ry * 1.5).toFixed(2)}%, ${(rx * 0.9).toFixed(2)}%, 0)`,
  glint: `translate3d(${(-ry * 2.8).toFixed(2)}%, ${(rx * 2.2).toFixed(2)}%, 0)`,
});
const REST_POSE = pose(REST.x, REST.y);

/* Keys the page's smooth scroll takes over (see the message list). */
const SCROLL_KEYS = new Set(["ArrowUp", "ArrowDown", "PageUp", "PageDown", "Home", "End", " "]);

const clamp = (v: number) => Math.max(-1, Math.min(1, v));
const firstWord = (s: string) => s.trim().split(/\s+/)[0] ?? "";

/* Layout effects do not run on the server; this skips the React warning
   there while keeping the pre-paint timing in the browser. */
const useIso = typeof window !== "undefined" ? useLayoutEffect : useEffect;

/* ---- composer, per step ------------------------------------------ */
type Field = {
  label: string;
  placeholder: string;
  max?: number;
  type?: "text" | "email";
  auto?: string;
  mode?: "text" | "email";
  locked?: boolean;
};
const FIELDS: Record<Step, Field> = {
  idle: { label: "Message", placeholder: "Message", locked: true },
  name: { label: "Your name", placeholder: chat.placeholders.name, max: LIMITS.name, auto: "name" },
  email: {
    label: "Your email",
    placeholder: chat.placeholders.email,
    max: LIMITS.email,
    type: "email",
    auto: "email",
    mode: "email",
  },
  topic: { label: "What it is about", placeholder: chat.placeholders.topic, max: LIMITS.topic, auto: "off" },
  message: { label: "Your message", placeholder: chat.placeholders.message, max: LIMITS.message },
  confirm: { label: "Message", placeholder: "Pick an option above", locked: true },
  sending: { label: "Message", placeholder: chat.sending, locked: true },
  failed: { label: "Message", placeholder: "Pick an option above", locked: true },
  done: { label: "Message", placeholder: "Pick an option above", locked: true },
};

/* The option buttons under the conversation, per step. Keyed, so the
   send button stays the same element when it turns into "Sending...",
   and keeps focus through it. */
type ChipSpec = {
  key: string;
  label: string;
  primary?: boolean;
  cursor?: string;
  pending?: boolean;
  onClick: () => void;
};

export default function PhoneChat() {
  const stage = useRef<HTMLDivElement>(null);
  const rig = useRef<HTMLDivElement>(null);
  const tilt = useRef<HTMLDivElement>(null);
  const sheen = useRef<HTMLDivElement>(null);
  const glint = useRef<HTMLDivElement>(null);
  const screen = useRef<HTMLDivElement>(null);
  const log = useRef<HTMLDivElement>(null);
  const field = useRef<HTMLInputElement & HTMLTextAreaElement>(null);
  const composer = useRef<ComposerApi>(null);

  const [msgs, setMsgs] = useState<Msg[]>([]);
  const [step, setStep] = useState<Step>("idle");
  const [typing, setTyping] = useState(false);
  const [busy, setBusy] = useState(false);
  const [clock, setClock] = useState("");
  const [stamp, setStamp] = useState("");

  const nextId = useRef(0);
  const timers = useRef(new Set<number>());
  /* The reply in flight, if any, as a function that lands the rest of it
     at once. See the teardown effect below. */
  const flush = useRef<(() => void) | null>(null);
  const started = useRef(false);
  const busyNow = useRef(false);
  /* Set by the first send or chip. Until then focus is never moved into
     the composer: on a phone that would pop the keyboard and scroll the
     page for someone who was only reading. */
  const engaged = useRef(false);
  const wantFocus = useRef(false);
  const data = useRef({ name: "", email: "", topic: "", message: "" });
  const lastKey = useRef(0);
  /* When the conversation began, by the visitor's clock. Sent along with
     the message so the server can drop anything finished faster than a
     person could read the greeting (see route.ts). */
  const startedAt = useRef(0);
  /* A send in flight. Guards against a double tap sending twice. */
  const inflight = useRef(false);
  /* Cleared on unmount, so a reply that arrives after the chat is gone
     does not start new timers. */
  const alive = useRef(false);
  /* The spam trap: a field no person can see or reach. See Honeypot. */
  const honey = useRef<HTMLInputElement>(null);

  /* ---- pin wall hook --------------------------------------------
     The pin wall behind this section (PinField) listens for
     "pinfield:pulse" and ripples the pins around a point. x and y are
     viewport pixels at the centre of the phone's screen; strength is 0
     to 1: 0.25 a keystroke (throttled to about 12 a second), 0.35 when
     one of Parth's messages lands, 0.6 when the visitor answers or opens
     their mail app, 1 when the message reaches Parth's inbox. Nothing
     listens? Nothing happens. */
  const pulse = useCallback((strength: number) => {
    const r = screen.current?.getBoundingClientRect();
    if (!r) return;
    window.dispatchEvent(
      new CustomEvent("pinfield:pulse", {
        detail: { x: r.left + r.width / 2, y: r.top + r.height / 2, strength },
      })
    );
  }, []);

  const later = useCallback((fn: () => void, ms: number) => {
    const id = window.setTimeout(() => {
      timers.current.delete(id);
      fn();
    }, ms);
    timers.current.add(id);
  }, []);

  const append = useCallback((lines: Line[]) => {
    setMsgs((m) => [...m, ...lines.map((l) => ({ ...l, id: nextId.current++ }))]);
  }, []);

  /* Parth's side. Each line gets a typing indicator for a beat that
     scales with its length, the way a person types, then lands. The
     composer is left enabled the whole time (disabling a focused field
     drops focus and closes the phone keyboard); sends are ignored until
     the chain finishes instead. */
  const reply = useCallback(
    (lines: Line[], next: Step, then?: () => void) => {
      busyNow.current = true;
      setBusy(true);
      const finish = () => {
        flush.current = null;
        busyNow.current = false;
        setTyping(false);
        setBusy(false);
        setStep(next);
        then?.();
        if (engaged.current) wantFocus.current = true;
      };

      if (reduced()) {
        append(lines);
        finish();
        return;
      }

      let t = 420; // a moment to "read" what was just sent
      let landed = 0;
      for (const line of lines) {
        const len = line.kind === "text" ? line.text.length : 40;
        later(() => setTyping(true), t);
        t += Math.min(1100, 480 + len * 11);
        later(() => {
          setTyping(false);
          append([line]);
          landed += 1;
          pulse(0.35);
        }, t);
        t += 300;
      }
      flush.current = () => {
        append(lines.slice(landed));
        finish();
      };
      later(finish, t - 200);
    },
    [append, later, pulse]
  );

  const start = useCallback(() => {
    /* nextId is checked too: a hot reload in development re-runs the
       effects but keeps the messages, and the greeting must not repeat. */
    if (started.current || nextId.current > 0) return;
    started.current = true;
    startedAt.current = Date.now();
    const d = new Date();
    setStamp(`${d.getHours() % 12 || 12}:${String(d.getMinutes()).padStart(2, "0")}`);
    reply(
      [
        { kind: "text", from: "parth", text: chat.greeting[0] },
        { kind: "text", from: "parth", text: chat.greeting[1] },
        { kind: "file", from: "parth" },
        { kind: "text", from: "parth", text: chat.askName },
      ],
      "name"
    );
  }, [reply]);

  /* ---- start when the phone is seen ---------------------------- */
  useEffect(() => {
    const el = stage.current;
    if (!el) return;
    if (!("IntersectionObserver" in window)) {
      start();
      return;
    }
    const io = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting)) {
          io.disconnect();
          start();
        }
      },
      { threshold: 0.35 }
    );
    io.observe(el);
    return () => io.disconnect();
  }, [start]);

  /* Pending replies die with the component. `started` resets so a real
     remount begins the conversation again rather than waiting forever.
     A hot reload in development runs this teardown but keeps the state,
     so a reply cut off halfway would leave Parth typing for good and the
     composer refusing every send. Whatever was left of it lands at once
     instead; on a real unmount those updates go nowhere. */
  useEffect(() => {
    const pending = timers.current;
    alive.current = true;
    return () => {
      alive.current = false;
      pending.forEach((id) => window.clearTimeout(id));
      pending.clear();
      flush.current?.();
      started.current = false;
      busyNow.current = false;
    };
  }, []);

  /* ---- status bar clock ----------------------------------------
     Set after mount: the server's time would never match the reader's,
     and a mismatch is a hydration error. */
  useEffect(() => {
    const tick = () => {
      const d = new Date();
      setClock(`${d.getHours() % 12 || 12}:${String(d.getMinutes()).padStart(2, "0")}`);
    };
    tick();
    const id = window.setInterval(tick, 15000);
    return () => window.clearInterval(id);
  }, []);

  /* ---- keep the newest message in view --------------------------
     Scrolls the list itself. scrollIntoView would scroll the page too. */
  useEffect(() => {
    const el = log.current;
    if (!el) return;
    el.scrollTo({ top: el.scrollHeight, behavior: reduced() ? "auto" : "smooth" });
  }, [msgs.length, typing, busy, step]);

  /* ---- hand focus back after Parth replies ----------------------
     Only once the visitor has used the chat, and only if focus is still
     in the phone or nowhere; someone who tabbed away keeps their place. */
  useEffect(() => {
    if (!wantFocus.current || busy) return;
    wantFocus.current = false;
    const phone = stage.current;
    const a = document.activeElement;
    if (!phone || (a && a !== document.body && !phone.contains(a))) return;
    const target =
      step === "confirm" || step === "failed" || step === "done"
        ? phone.querySelector<HTMLButtonElement>("[data-chip]")
        : field.current;
    target?.focus({ preventScroll: true });
  }, [step, busy]);

  /* ---- the device: pose, tilt, scroll-in ------------------------ */
  useEffect(() => {
    const st = stage.current;
    const r = rig.current;
    const tl = tilt.current;
    if (!st || !r || !tl) return;

    const write = (rx: number, ry: number) => {
      const p = pose(rx, ry);
      tl.style.transform = p.tilt;
      if (sheen.current) sheen.current.style.transform = p.sheen;
      if (glint.current) glint.current.style.transform = p.glint;
    };

    /* Motion off: one still, gentler angle and no listeners at all. */
    if (reduced()) {
      write(STILL.x, STILL.y);
      return () => write(REST.x, REST.y);
    }

    /* Soft motion (the OS asking for reduced motion) gets all of this at
       full strength. The site only drops scroll inertia and effects driven
       by scroll velocity for it, and nothing here reads velocity: the tilt
       follows the pointer and the swing follows the scroll position. */
    const zone = st.closest("section") ?? st;
    const s = { rx: REST.x, ry: REST.y };
    const apply = () => write(s.rx, s.ry);

    let qx: gsap.QuickToFunc | undefined;
    let qy: gsap.QuickToFunc | undefined;
    let nx = 0;
    let ny = 0;
    let over = false;
    let near = false;
    let focused = false;

    const aim = () => {
      if (!qx || !qy) return;
      if (focused || near) {
        qx(FACE.x);
        qy(FACE.y);
        return;
      }
      qx(REST.x - (over ? ny * 8 : 0));
      qy(REST.y + (over ? nx * 10 : 0));
    };

    /* A clicked chip is removed from the page while it holds focus, and
       no focusout arrives for that. Checked again on every pointer event
       so the phone never stays face on for focus that has already gone. */
    const recheck = () => {
      if (focused && !st.contains(document.activeElement)) focused = false;
    };

    const onMove = (e: PointerEvent) => {
      if (e.pointerType === "touch") return;
      recheck();
      const z = zone.getBoundingClientRect();
      const b = st.getBoundingClientRect();
      nx = clamp((e.clientX - (z.left + z.width / 2)) / (z.width / 2));
      ny = clamp((e.clientY - (b.top + b.height / 2)) / (z.height / 2));
      over = true;
      /* Hysteresis: the phone widens as it turns face on, so leaving
         takes a wider margin than arriving, or the edge would flicker. */
      const m = near ? 28 : -6;
      near =
        e.clientX > b.left - m &&
        e.clientX < b.right + m &&
        e.clientY > b.top - m &&
        e.clientY < b.bottom + m;
      aim();
    };
    const onLeave = () => {
      over = false;
      near = false;
      recheck();
      aim();
    };
    /* Anything focused on the screen turns it to face the reader, not only
       the field: the resume card and the chips are read and pressed too. */
    const onFocusIn = () => {
      focused = true;
      aim();
    };
    const onFocusOut = (e: FocusEvent) => {
      focused = st.contains(e.relatedTarget as Node | null);
      aim();
    };

    const ctx = gsap.context(() => {
      qx = gsap.quickTo(s, "rx", { duration: 0.9, ease: "power3.out", onUpdate: apply });
      qy = gsap.quickTo(s, "ry", { duration: 0.9, ease: "power3.out", onUpdate: apply });

      /* Rises out of the section and swings up from lying back, tied to
         the scroll. Opacity goes on the stage, never the rig: an opacity
         below 1 flattens preserve-3d and the frame would lose its
         thickness mid-swing. */
      gsap
        .timeline({
          scrollTrigger: { trigger: st, start: "top bottom", end: "center 55%", scrub: 0.8 },
        })
        .fromTo(
          r,
          { y: 140, rotationX: 50, transformOrigin: "50% 90%" },
          { y: 0, rotationX: 0, ease: "power2.out", duration: 1 },
          0
        )
        .fromTo(st, { opacity: 0 }, { opacity: 1, ease: "none", duration: 0.3 }, 0);
    }, st);

    zone.addEventListener("pointermove", onMove as EventListener, { passive: true });
    zone.addEventListener("pointerleave", onLeave);
    st.addEventListener("focusin", onFocusIn);
    st.addEventListener("focusout", onFocusOut);

    return () => {
      zone.removeEventListener("pointermove", onMove as EventListener);
      zone.removeEventListener("pointerleave", onLeave);
      st.removeEventListener("focusin", onFocusIn);
      st.removeEventListener("focusout", onFocusOut);
      ctx.revert();
      write(REST.x, REST.y);
    };
  }, []);

  /* ---- the visitor's side ---------------------------------------
     Memoised, like the composer they are handed to: typing re-renders
     only the field, never the device, the list or the frame slices. */
  const say = useCallback(
    (text: string) => {
      engaged.current = true;
      append([{ kind: "text", from: "you", text }]);
      pulse(0.6);
    },
    [append, pulse]
  );

  const pickTopic = useCallback(
    (topic: string) => {
      engaged.current = true;
      if (busyNow.current) return;
      const v = topic.replace(/\s+/g, " ").trim().slice(0, LIMITS.topic);
      if (!v) return;
      data.current.topic = v;
      composer.current?.clear();
      say(v);
      reply([{ kind: "text", from: "parth", text: chat.askMessage }], "message");
    },
    [say, reply]
  );

  /* Returns whether the answer was taken, so the composer knows to clear. */
  const send = useCallback(
    (text: string, at: Step): boolean => {
      engaged.current = true;
      if (busyNow.current) return false;
      const raw = text.trim();
      if (!raw) return false;

      switch (at) {
        case "name": {
          const v = raw.replace(/\s+/g, " ").slice(0, LIMITS.name);
          data.current.name = v;
          say(v);
          reply(
            [{ kind: "text", from: "parth", text: chat.askEmail.split("{name}").join(firstWord(v)) }],
            "email"
          );
          return true;
        }
        case "email": {
          const v = raw.slice(0, LIMITS.email);
          say(v);
          if (!EMAIL.test(v)) {
            /* The address goes back in the box, so fixing a typo is one
               edit rather than typing the whole thing again. */
            reply([{ kind: "text", from: "parth", text: chat.badEmail }], "email", () =>
              composer.current?.restore(v)
            );
            return true;
          }
          data.current.email = v;
          reply([{ kind: "text", from: "parth", text: chat.askTopic }], "topic");
          return true;
        }
        case "topic":
          pickTopic(raw);
          return true;
        case "message": {
          const v = raw.slice(0, LIMITS.message);
          data.current.message = v;
          say(v);
          reply(
            [
              {
                kind: "draft",
                from: "parth",
                subject: data.current.topic || "Hello from your portfolio",
                body: v,
              },
              { kind: "text", from: "parth", text: chat.confirm },
            ],
            "confirm"
          );
          return true;
        }
        default:
          return false;
      }
    },
    [say, reply, pickTopic]
  );

  /* The last step: straight to Parth's inbox. While it is in flight the
     send button reads "Sending..." and ignores presses, and Parth is
     shown typing. Any failure at all (offline, a timeout, the server not
     set up yet, the rate limit, a refusal) gets the same honest answer
     and the mail app as a way round it, since the visitor can do nothing
     different about any of them. */
  const sendMessage = async () => {
    engaged.current = true;
    if (busyNow.current || inflight.current) return;
    inflight.current = true;
    setStep("sending");
    setTyping(true);

    const d = data.current;
    let ok = false;
    try {
      const res = await fetch(ENDPOINT, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "same-origin",
        cache: "no-store",
        /* Capped again here, not only by maxLength: maxLength is a hint the
           browser enforces for typing, and a script on the page can set
           any value. The server refuses anything longer anyway. */
        body: JSON.stringify({
          name: d.name.slice(0, LIMITS.name),
          email: d.email.slice(0, LIMITS.email),
          topic: d.topic.slice(0, LIMITS.topic),
          message: d.message.slice(0, LIMITS.message),
          company: honey.current?.value ?? "",
          startedAt: startedAt.current,
          sentAt: Date.now(),
        }),
        /* Longer than the server's own 10 s wait on the mail provider, so
           a slow send is reported by the server rather than cut off here. */
        signal: typeof AbortSignal.timeout === "function" ? AbortSignal.timeout(20000) : undefined,
      });
      const out = (await res.json().catch(() => null)) as { ok?: unknown } | null;
      ok = res.ok && out?.ok === true;
    } catch {
      ok = false;
    }
    inflight.current = false;
    if (!alive.current) return;

    if (ok) {
      pulse(1);
      reply([{ kind: "text", from: "parth", text: chat.sent.split("{email}").join(d.email) }], "done");
    } else {
      reply([{ kind: "text", from: "parth", text: chat.failed }], "failed");
    }
  };

  /* The fallback: the visitor's own mail app, with everything filled in.
     The chips stay, so if no mail app opens the visitor can start over
     or copy the address beside the phone.
     The caps keep the mailto: URL under the ~2,000-character ceiling some
     mail apps silently truncate at. Every part is encodeURIComponent-ed,
     so nothing typed can smuggle in extra headers (cc, bcc) or change the
     recipient, which is a constant. */
  const openEmail = () => {
    engaged.current = true;
    if (busyNow.current || inflight.current) return;
    const d = data.current;
    const name = d.name.slice(0, LIMITS.name);
    const email = d.email.slice(0, LIMITS.email);
    const subject = d.topic.slice(0, LIMITS.topic) || "Hello from your portfolio";
    const body = `${d.message.slice(0, LIMITS.message)}

From: ${name} (${email})`;
    pulse(0.6);
    window.location.href = `mailto:${identity.email}?subject=${encodeURIComponent(
      subject
    )}&body=${encodeURIComponent(body)}`;
  };

  const startOver = () => {
    engaged.current = true;
    if (busyNow.current || inflight.current) return;
    data.current = { name: "", email: "", topic: "", message: "" };
    composer.current?.clear();
    pulse(0.6);
    reply([{ kind: "text", from: "parth", text: chat.askName }], "name");
  };

  const onKey = useCallback(() => {
    if (!started.current) start();
    const now = performance.now();
    if (now - lastKey.current > 83) {
      lastKey.current = now;
      pulse(0.25);
    }
  }, [start, pulse]);

  /* Someone who tabs into the phone before it has scrolled far enough to
     start still gets the conversation. */
  const onFocusIn = useCallback(() => {
    if (!started.current) start();
  }, [start]);

  const restart: ChipSpec = { key: "restart", label: chat.actions.restart, onClick: startOver };
  const chips: ChipSpec[] | null = busy
    ? null
    : step === "topic"
      ? chat.topics.map((t) => ({ key: `topic:${t}`, label: t, onClick: () => pickTopic(t) }))
      : step === "confirm"
        ? [{ key: "main", label: chat.actions.send, primary: true, cursor: "SEND", onClick: sendMessage }, restart]
        : step === "sending"
          ? [{ key: "main", label: chat.sending, primary: true, pending: true, onClick: () => {} }]
          : step === "failed"
            ? [{ key: "main", label: chat.actions.mailApp, primary: true, cursor: "MAIL", onClick: openEmail }, restart]
            : step === "done"
              ? [restart]
              : null;

  /* Stage width. 0.4615 is 9/19.5, so each height budget below becomes the
     width that makes the phone exactly that tall.
       Stacked: as wide as a phone screen allows, but short enough to fit
       whole with the browser bars showing (svh), so the composer and the
       conversation are on screen together.
       Two columns: 76% of the viewport height, the same idea.
     Both keep a floor of 280px. The chat text is in px so it stays
     readable, and below about 280 the file card and the status bar no
     longer fit. A short laptop gets a phone slightly taller than its
     window rather than a cramped one. */
  const size =
    "w-[clamp(min(280px,86vw),calc((100svh_-_48px)*0.4615),min(340px,86vw))] lg:w-[clamp(280px,calc(76svh*0.4615),340px)]";

  return (
    <div
      ref={stage}
      onFocus={onFocusIn}
      className={`@container relative mx-auto ${size}`}
      style={{ perspective: "1700px" }}
    >
      <div ref={rig} className="relative" style={{ transformStyle: "preserve-3d" }}>
        <div
          ref={tilt}
          className="relative aspect-[9/19.5] w-full"
          style={{ transformStyle: "preserve-3d", transform: REST_POSE.tilt }}
        >
          {/* Cast on the wall behind, down and to the left: the light
              comes from the upper right, same as the frame highlights. */}
          <div
            aria-hidden
            className="pointer-events-none absolute inset-[3%]"
            style={{
              transform: `translate3d(-7cqw, 9cqw, ${-DEPTH / 2 - 22}cqw)`,
              borderRadius: `${R}cqw`,
              background: "rgba(0,0,0,0.72)",
              filter: "blur(26px)",
            }}
          />

          {/* ---- thickness -------------------------------------------
              The frame's side, built from slices stacked in Z. Each is the
              phone's silhouette in metal; from any angle only a sliver of
              each shows past the one in front, and together they read as
              a solid, brushed band. The outermost slices are lighter, as
              the chamfers at the front and back catch the light. */}
          {Array.from({ length: SLICES }, (_, i) => {
            const k = i + 1;
            const z = DEPTH / 2 - (DEPTH * k) / SLICES;
            const tone =
              k === 1
                ? "rgba(255,255,255,0.3)"
                : k === SLICES
                  ? "rgba(255,255,255,0.12)"
                : k % 2
                  ? "rgba(0,0,0,0.06)"
                  : "rgba(255,255,255,0.02)";
            return (
              <div
                key={k}
                aria-hidden
                className="pointer-events-none absolute inset-0"
                style={{
                  transform: `translateZ(${z.toFixed(3)}cqw)`,
                  borderRadius: `${R}cqw`,
                  background: `linear-gradient(${tone}, ${tone}), linear-gradient(90deg, rgba(0,0,0,0.5), rgba(0,0,0,0) 28%, rgba(255,255,255,0) 70%, rgba(255,255,255,0.2)), linear-gradient(180deg, #85858d 0%, #414147 5%, #1e1e22 18%, #2d2d32 46%, #18181b 74%, #3a3a40 92%, #7c7c84 100%)`,
                }}
              >
                {k > 2 && k < SLICES - 1 && <SideButtons />}
              </div>
            );
          })}

          {/* ---- front face ------------------------------------------ */}
          <div
            className="absolute inset-0 overflow-hidden"
            style={{
              transform: `translateZ(${DEPTH / 2}cqw)`,
              borderRadius: `${R}cqw`,
              background:
                "linear-gradient(155deg, #bdbdc5 0%, #5c5c64 6%, #28282d 20%, #3d3d44 38%, #19191d 58%, #303036 76%, #74747c 92%, #b4b4bc 100%)",
              boxShadow:
                "inset 0 0 0 1px rgba(255,255,255,0.1), inset 0 1.5px 0.5px rgba(255,255,255,0.38), inset 0 -1px 1px rgba(0,0,0,0.55)",
            }}
          >
            {/* The glint that runs round the ring as the phone turns. */}
            <div
              ref={glint}
              aria-hidden
              className="pointer-events-none absolute -inset-[35%]"
              style={{
                transform: REST_POSE.glint,
                background:
                  "linear-gradient(105deg, transparent 40%, rgba(255,255,255,0.5) 49%, rgba(255,255,255,0.08) 53%, transparent 60%)",
              }}
            />

            {/* Bezel, then the glass. */}
            <div
              className="absolute bg-[#020203]"
              style={{
                inset: `${RING}cqw`,
                borderRadius: `${R - RING}cqw`,
                boxShadow: "0 0 0 0.6px rgba(0,0,0,0.9), inset 0 0 0 0.75px rgba(255,255,255,0.07)",
              }}
            >
              <div
                ref={screen}
                className="absolute flex flex-col overflow-hidden bg-[#070708]"
                style={{ inset: `${BEZEL}cqw`, borderRadius: `${R - RING - BEZEL}cqw` }}
              >
                <StatusBar clock={clock} />
                <ChatHeader typing={typing} />

                {/* ---- messages ------------------------------------
                    Focusable, so a keyboard can scroll back through a long
                    conversation; most of it is plain text with nothing to
                    tab to. The page routes the arrow and page keys to its
                    smooth scroll from window, so they stop here while the
                    list itself has focus and the list scrolls natively.

                    Scroll chaining is contained only where there is hover,
                    that is a wheel or a trackpad. On a touch screen the
                    phone covers most of the viewport, and a contained list
                    would swallow every swipe that starts on it once it is
                    long enough to scroll.

                    The mask fades the top edge, so older messages slide
                    under the header instead of being cut off. */}
                <div
                  ref={log}
                  role="log"
                  aria-live="polite"
                  aria-label={`Conversation with ${chat.title}`}
                  tabIndex={0}
                  data-lenis-prevent
                  onKeyDown={(e) => {
                    if (e.target === e.currentTarget && SCROLL_KEYS.has(e.key)) e.stopPropagation();
                  }}
                  className="relative min-h-0 flex-1 overflow-y-auto overscroll-auto px-[3.4cqw] pb-3 pt-3 [scrollbar-width:none] focus-visible:rounded-[4px] focus-visible:outline-offset-[-3px] [@media(hover:hover)]:overscroll-contain [&::-webkit-scrollbar]:hidden"
                  style={{
                    backgroundImage: "radial-gradient(rgba(255,255,255,0.05) 1px, transparent 1.3px)",
                    backgroundSize: "15px 15px",
                    maskImage: "linear-gradient(to bottom, transparent 0, #000 12px)",
                    WebkitMaskImage: "linear-gradient(to bottom, transparent 0, #000 12px)",
                  }}
                >
                  <p aria-hidden className="t-mono pb-3 text-center !text-[9px] !tracking-[0.14em] text-ash">
                    Today{stamp ? ` ${stamp}` : ""}
                  </p>

                  {msgs.map((m, i) => {
                    const prev = msgs[i - 1];
                    const next = msgs[i + 1];
                    /* The tail sits on the last bubble of a run. While
                       Parth types, the dots continue his run. */
                    const tail = next ? next.from !== m.from : !(typing && m.from === "parth");
                    return (
                      <Rise
                        key={m.id}
                        mine={m.from === "you"}
                        className={prev && prev.from === m.from ? "mt-[3px]" : "mt-2.5"}
                      >
                        {m.kind === "file" ? (
                          <FileCard />
                        ) : m.kind === "draft" ? (
                          <DraftCard subject={m.subject} body={m.body} />
                        ) : (
                          <Bubble mine={m.from === "you"} tail={tail}>
                            {m.text}
                          </Bubble>
                        )}
                      </Rise>
                    );
                  })}

                  {typing && (
                    <Rise mine={false} className={msgs[msgs.length - 1]?.from === "parth" ? "mt-[3px]" : "mt-2.5"}>
                      <TypingDots />
                    </Rise>
                  )}

                  {chips && (
                    <Rise mine className="mt-3 flex flex-wrap justify-end gap-1.5 pl-[8%]">
                      {chips.map((c, i) => (
                        <Chip
                          key={c.key}
                          first={i === 0}
                          primary={c.primary}
                          pending={c.pending}
                          cursor={c.cursor}
                          onClick={c.onClick}
                        >
                          {c.label}
                        </Chip>
                      ))}
                    </Rise>
                  )}
                </div>

                {/* ---- composer ------------------------------------ */}
                <Composer
                  api={composer}
                  fieldRef={field}
                  logRef={log}
                  step={step}
                  busy={busy}
                  onSend={send}
                  onKey={onKey}
                />
                <div aria-hidden className="bg-[#0b0b0d] pb-[2.4cqw] pt-[2.2cqw]">
                  <div className="mx-auto h-[1.25cqw] w-[35%] rounded-full bg-bone/75" />
                </div>

                {/* Glass: a faint fixed reflection plus a sheen that slides
                    with the tilt. Above the pixels, below nothing, and
                    never in the way of a click. */}
                <div aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden" style={{ borderRadius: "inherit" }}>
                  <div
                    className="absolute inset-0"
                    style={{
                      background:
                        "linear-gradient(200deg, rgba(255,255,255,0.055) 0%, rgba(255,255,255,0) 26%), radial-gradient(120% 60% at 100% 0%, rgba(255,255,255,0.03), transparent 60%)",
                    }}
                  />
                  <div
                    ref={sheen}
                    className="absolute inset-y-0 -left-[75%] w-[250%]"
                    style={{
                      transform: REST_POSE.sheen,
                      background:
                        "linear-gradient(112deg, transparent 38%, rgba(255,255,255,0.075) 45%, rgba(255,255,255,0.02) 51%, transparent 57%)",
                    }}
                  />
                </div>

                <Island />
              </div>
            </div>
          </div>
        </div>
      </div>

      <Honeypot inputRef={honey} />

      <noscript>
        <p className="mt-6 text-center text-sm text-ash">
          The chat needs JavaScript. You can email me at{" "}
          <a href={`mailto:${identity.email}`} className="text-bone underline">
            {identity.email}
          </a>
          .
        </p>
      </noscript>
    </div>
  );
}

/* ============================================================
   PIECES
   ============================================================ */

/* What the conversation may do to the composer's text. */
type ComposerApi = { clear: () => void; restore: (v: string) => void };

/* The field and the send button. The draft lives here rather than in the
   phone so that a keystroke re-renders this form alone; typing used to
   re-render the whole device on every letter. */
const Composer = memo(function Composer({
  api,
  fieldRef,
  logRef,
  step,
  busy,
  onSend,
  onKey,
}: {
  api: React.RefObject<ComposerApi | null>;
  fieldRef: React.RefObject<(HTMLInputElement & HTMLTextAreaElement) | null>;
  logRef: React.RefObject<HTMLDivElement | null>;
  step: Step;
  busy: boolean;
  onSend: (text: string, at: Step) => boolean;
  onKey: () => void;
}) {
  const [draft, setDraft] = useState("");
  const form = useRef<HTMLFormElement>(null);
  const id = useId();

  useImperativeHandle(
    api,
    () => ({
      clear: () => setDraft(""),
      /* Only into an empty box: never over something typed since. */
      restore: (v: string) => setDraft((d) => d || v),
    }),
    []
  );

  /* Auto-growing message box. A taller box makes the list shorter; if the
     reader was at the end of the conversation, keep them there instead of
     hiding the last line behind the composer. */
  useIso(() => {
    const el = fieldRef.current;
    const list = logRef.current;
    if (!el || !list || step !== "message") return;
    const pinned = list.scrollHeight - list.scrollTop - list.clientHeight < 24;
    const before = el.style.height;
    el.style.height = "auto";
    el.style.height = `${Math.min(el.scrollHeight, 104)}px`;
    if (pinned && el.style.height !== before) list.scrollTop = list.scrollHeight;
  }, [draft, step, fieldRef, logRef]);

  const f = FIELDS[step];
  const canSend = !busy && !f.locked && draft.trim().length > 0;
  const onChange = (v: string) => {
    setDraft(v);
    onKey();
  };
  const inputClass =
    "block w-full resize-none bg-transparent text-base leading-[1.35] text-bone outline-none placeholder:text-ash lg:text-[14.5px]";

  return (
    <form
      ref={form}
      onSubmit={(e) => {
        e.preventDefault();
        /* Cleared before the send, not after: with motion off the reply
           lands inside onSend, and a bad email is put back in the box
           right then. Clearing afterwards would wipe it straight out. */
        const text = draft;
        setDraft("");
        if (!onSend(text, step)) setDraft(text);
      }}
      /* The chat checks the answers itself and says so in a reply; the
         browser's own bubble would pop out of the phone and block the send. */
      noValidate
      className="flex items-end gap-2 border-t border-white/[0.06] bg-[#0b0b0d] px-[3.4cqw] pb-1 pt-2.5"
    >
      <label htmlFor={id} className="sr-only">
        {f.label}
      </label>
      <div className="min-w-0 flex-1 rounded-[20px] border border-white/10 bg-[#121215] px-3.5 py-[7px] transition-colors duration-300 focus-within:border-acid/70">
        {step === "message" ? (
          <textarea
            ref={fieldRef}
            id={id}
            rows={1}
            value={draft}
            maxLength={LIMITS.message}
            placeholder={f.placeholder}
            enterKeyHint="send"
            /* Once it grows to its cap it scrolls, and the wheel is Lenis's
               everywhere else on the page. */
            data-lenis-prevent
            onChange={(e) => onChange(e.target.value)}
            onKeyDown={(e) => {
              /* Enter sends, Shift+Enter breaks the line, and an IME
                 composing a character keeps its Enter. */
              if (e.key === "Enter" && !e.shiftKey && !e.nativeEvent.isComposing) {
                e.preventDefault();
                form.current?.requestSubmit();
              }
            }}
            className={`${inputClass} max-h-[104px] overflow-y-auto`}
          />
        ) : (
          <input
            ref={fieldRef}
            id={id}
            type={f.type ?? "text"}
            inputMode={f.mode}
            value={f.locked ? "" : draft}
            readOnly={f.locked}
            maxLength={f.max}
            placeholder={f.placeholder}
            autoComplete={f.auto ?? "off"}
            autoCapitalize={step === "email" ? "off" : step === "name" ? "words" : undefined}
            autoCorrect={step === "email" || step === "name" ? "off" : undefined}
            spellCheck={step === "email" || step === "name" ? false : undefined}
            enterKeyHint="send"
            onChange={(e) => onChange(e.target.value)}
            className={inputClass}
          />
        )}
      </div>
      <button
        type="submit"
        aria-label="Send"
        data-cursor="SEND"
        aria-disabled={!canSend}
        className={`grid h-[36px] w-[36px] shrink-0 place-items-center rounded-full transition-[background-color,opacity] duration-300 ${
          canSend ? "bg-acid text-void" : "bg-white/[0.07] text-ash"
        }`}
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden focusable="false">
          <path d="M12 19V5M5.5 11.5 12 5l6.5 6.5" />
        </svg>
      </button>
    </form>
  );
});

/* The spam trap. A bot that fills in every input it finds fills this one
   too, and the server quietly drops the message (route.ts). People never
   meet it: it is clipped to nothing, hidden from screen readers, out of
   the tab order, and outside the composer's form, so a browser filling
   in the visitor's name and email never touches it. The attributes at
   the end ask the common password managers to leave it alone as well. */
function Honeypot({ inputRef }: { inputRef: React.RefObject<HTMLInputElement | null> }) {
  return (
    <div aria-hidden className="sr-only">
      <label>
        Company
        <input
          ref={inputRef}
          type="text"
          name="company"
          tabIndex={-1}
          autoComplete="off"
          defaultValue=""
          data-1p-ignore=""
          data-lpignore="true"
          data-bwignore=""
          data-form-type="other"
        />
      </label>
    </div>
  );
}

/* Action button and volume rocker on the left, side button on the right.
   Rendered inside the middle slices only, so they extrude from the band
   like the real ones and do not reach the chamfers. */
function SideButtons() {
  const nub = (side: "left" | "right", top: number, h: number) => (
    <span
      className="absolute"
      style={{
        [side]: "-0.8cqw",
        top: `${top}%`,
        height: `${h}%`,
        width: "1.3cqw",
        borderRadius: "0.65cqw",
        background:
          side === "left"
            ? "linear-gradient(90deg, #6d6d75, #3a3a40 60%, #26262a)"
            : "linear-gradient(90deg, #26262a, #45454c 40%, #8a8a92)",
      }}
    />
  );
  return (
    <>
      {nub("left", 17.5, 4.4)}
      {nub("left", 25, 7.6)}
      {nub("left", 34.2, 7.6)}
      {nub("right", 27, 11.5)}
    </>
  );
}

function Island() {
  return (
    <div
      aria-hidden
      className="pointer-events-none absolute left-1/2 top-[3.1cqw] flex h-[8.8cqw] w-[31cqw] -translate-x-1/2 items-center justify-end rounded-full bg-black pr-[2.4cqw]"
      style={{ boxShadow: "inset 0 0 0 0.5px rgba(255,255,255,0.04)" }}
    >
      {/* Front camera: a dark lens with a faint blue coating. */}
      <span
        className="block h-[3.1cqw] w-[3.1cqw] rounded-full"
        style={{
          background:
            "radial-gradient(circle at 35% 35%, rgba(90,110,180,0.55) 0 12%, rgba(20,24,40,0.9) 30%, #050507 62%)",
          boxShadow: "0 0 0 0.6px rgba(255,255,255,0.05)",
        }}
      />
    </div>
  );
}

/* Part of the device rather than the app, so it scales with the frame in
   cqw like the island does. In px it kept its size while the phone
   shrank, and on a short laptop the signal bars ended up under the island. */
function StatusBar({ clock }: { clock: string }) {
  return (
    <div aria-hidden className="relative flex h-[15cqw] shrink-0 items-center justify-between pl-[9cqw] pr-[7.4cqw] text-bone">
      <span className="min-w-[10cqw] text-[4.45cqw] font-semibold tabular-nums tracking-[-0.01em]">{clock}</span>
      <span className="flex items-center gap-[1.5cqw] [&>svg]:h-auto">
        {/* signal */}
        <svg width="17" height="11" viewBox="0 0 17 11" fill="currentColor" focusable="false" className="w-[5.4cqw]">
          <rect x="0" y="7.5" width="3" height="3.5" rx="0.8" />
          <rect x="4.6" y="5.2" width="3" height="5.8" rx="0.8" />
          <rect x="9.2" y="2.7" width="3" height="8.3" rx="0.8" />
          <rect x="13.8" y="0" width="3" height="11" rx="0.8" />
        </svg>
        {/* wifi */}
        <svg width="15" height="11" viewBox="0 0 15 11" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" focusable="false" className="w-[4.75cqw]">
          <path d="M1 3.8a9.2 9.2 0 0 1 13 0" />
          <path d="M3.3 6.2a5.9 5.9 0 0 1 8.4 0" />
          <circle cx="7.5" cy="9.1" r="1.1" fill="currentColor" stroke="none" />
        </svg>
        {/* battery */}
        <svg width="25" height="12" viewBox="0 0 25 12" fill="none" focusable="false" className="w-[7.9cqw]">
          <rect x="0.5" y="0.5" width="21" height="11" rx="3.2" stroke="currentColor" strokeOpacity="0.45" />
          <rect x="2" y="2" width="15" height="8" rx="1.8" fill="currentColor" />
          <path d="M23 4v4c.8-.3 1.3-1.1 1.3-2S23.8 4.3 23 4Z" fill="currentColor" fillOpacity="0.45" />
        </svg>
      </span>
    </div>
  );
}

function ChatHeader({ typing }: { typing: boolean }) {
  return (
    <div className="flex shrink-0 items-center gap-2.5 border-b border-white/[0.06] bg-[#0b0b0d] px-[3cqw] pb-2.5 pt-1">
      <svg width="11" height="18" viewBox="0 0 11 18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden focusable="false" className="shrink-0 text-bone/70">
        <path d="M9 2 2 9l7 7" />
      </svg>
      <span aria-hidden className="relative grid h-[36px] w-[36px] shrink-0 place-items-center rounded-full border border-white/10 bg-[linear-gradient(145deg,#2b2b31,#111114)]">
        <span className="text-[12.5px] font-semibold leading-none tracking-[0.04em] text-bone/90">PB</span>
      </span>
      <span className="min-w-0 flex-1">
        <span className="block truncate text-[14px] font-semibold leading-tight text-bone">{chat.title}</span>
        {/* Swaps to "typing" while Parth types, the way chat apps do. */}
        <span className="block truncate text-[11px] leading-tight text-ash">{typing ? "typing..." : chat.status}</span>
      </span>
    </div>
  );
}

/* Every new row rises in from below with a small scale, from the side it
   belongs to. Started in a layout effect so the first painted frame is
   already the start of the animation, never a flash of the final state. */
function Rise({
  mine,
  className = "",
  children,
}: {
  mine: boolean;
  className?: string;
  children: React.ReactNode;
}) {
  const ref = useRef<HTMLDivElement>(null);
  useIso(() => {
    const el = ref.current;
    if (!el || reduced() || typeof el.animate !== "function") return;
    const a = el.animate(
      [
        { opacity: 0, transform: "translate3d(0, 10px, 0) scale(0.96)" },
        { opacity: 1, transform: "translate3d(0, 0, 0) scale(1)" },
      ],
      { duration: 460, easing: "cubic-bezier(0.16, 1, 0.3, 1)" }
    );
    return () => a.cancel();
  }, []);
  return (
    <div
      ref={ref}
      className={`${mine ? "flex justify-end" : "flex justify-start"} ${className}`}
      style={{ transformOrigin: mine ? "100% 100%" : "0% 100%" }}
    >
      {children}
    </div>
  );
}

function Bubble({ mine, tail, children }: { mine: boolean; tail: boolean; children: React.ReactNode }) {
  return (
    <p
      className={`max-w-[80%] whitespace-pre-wrap px-3.5 py-2 text-[14px] leading-[1.38] [overflow-wrap:anywhere] ${
        mine
          ? "rounded-[18px] bg-bone text-void"
          : "rounded-[18px] border border-white/[0.06] bg-[#17171b] text-bone"
      } ${tail ? (mine ? "rounded-br-[6px]" : "rounded-bl-[6px]") : ""}`}
    >
      {/* Who said it, for screen readers; sighted readers get the side. */}
      <span className="sr-only">{mine ? "You: " : `${firstWord(chat.title)}: `}</span>
      {children}
    </p>
  );
}

function TypingDots() {
  const ref = useRef<HTMLSpanElement>(null);
  useEffect(() => {
    const dots = ref.current ? Array.from(ref.current.children) : [];
    if (typeof Element.prototype.animate !== "function") return;
    const anims = dots.map((d, i) =>
      d.animate(
        [
          { transform: "translate3d(0, 0, 0)", opacity: 0.35 },
          { transform: "translate3d(0, -3px, 0)", opacity: 1 },
          { transform: "translate3d(0, 0, 0)", opacity: 0.35 },
        ],
        { duration: 1000, delay: i * 160, iterations: Infinity, easing: "ease-in-out" }
      )
    );
    return () => anims.forEach((a) => a.cancel());
  }, []);
  return (
    <span
      aria-hidden
      className="flex h-[36px] items-center gap-[5px] rounded-[18px] rounded-bl-[6px] border border-white/[0.06] bg-[#17171b] px-4"
    >
      <span ref={ref} className="flex items-center gap-[5px]">
        <span className="block h-[6px] w-[6px] rounded-full bg-ash" />
        <span className="block h-[6px] w-[6px] rounded-full bg-ash" />
        <span className="block h-[6px] w-[6px] rounded-full bg-ash" />
      </span>
    </span>
  );
}

/* Tapping the file opens it, like an attachment in a real chat app: the
   same preview the floppy opens, grown out of this card. It asks through
   a window event (see ResumePreview); if nothing answers, the link just
   downloads, and so does a click with a modifier or without JavaScript. */
function FileCard() {
  const onClick = (e: React.MouseEvent<HTMLAnchorElement>) => {
    if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
    const el = e.currentTarget;
    /* Safari does not focus a clicked link; the preview hands focus back
       to whatever was focused when it opened. */
    el.focus({ preventScroll: true });
    const r = el.getBoundingClientRect();
    const answered = !window.dispatchEvent(
      new CustomEvent(PREVIEW_EVENT, {
        cancelable: true,
        detail: { rect: { x: r.left, y: r.top, width: r.width, height: r.height } },
      })
    );
    if (answered) e.preventDefault();
  };
  const warm = () => void warmResumePreview();

  /* The chat has just sent the file, so its preview is fetched while the
     visitor reads, the way a messaging app loads an attachment. A phone
     has no hover to start it earlier. Idle time only, and not at all when
     the visitor has asked the browser to save data. */
  useEffect(() => {
    const conn = (navigator as Navigator & { connection?: { saveData?: boolean } }).connection;
    if (conn?.saveData) return;
    const go = () => void warmResumePreview();
    if (typeof window.requestIdleCallback === "function") {
      const id = window.requestIdleCallback(go, { timeout: 2500 });
      return () => window.cancelIdleCallback(id);
    }
    const t = window.setTimeout(go, 1200);
    return () => window.clearTimeout(t);
  }, []);

  return (
    <a
      href={resume.href}
      download={resume.fileName}
      data-cursor="PREVIEW"
      aria-haspopup="dialog"
      onClick={onClick}
      onPointerEnter={warm}
      onFocus={warm}
      className="group flex w-[88%] items-center gap-3 rounded-[16px] rounded-bl-[6px] border border-white/[0.08] bg-[#17171b] p-2.5 pr-3 transition-colors duration-300 hover:border-acid/50"
    >
      {/* A page with a folded corner and the format on it. */}
      <span aria-hidden className="relative block h-[42px] w-[34px] shrink-0">
        <svg width="34" height="42" viewBox="0 0 34 42" fill="none" focusable="false">
          <path d="M3 1h20l10 10v27a3 3 0 0 1-3 3H3a3 3 0 0 1-3-3V4a3 3 0 0 1 3-3Z" fill="#edede6" fillOpacity="0.09" stroke="#edede6" strokeOpacity="0.22" />
          <path d="M23 1v7a3 3 0 0 0 3 3h7" stroke="#edede6" strokeOpacity="0.22" />
        </svg>
        <span className="absolute bottom-[7px] left-[4px] rounded-[3px] bg-bone/85 px-[3px] py-[1px] font-mono text-[7.5px] font-bold leading-none tracking-[0.06em] text-void">
          PDF
        </span>
      </span>
      <span className="min-w-0 flex-1">
        {/* No `block` here: it would override the -webkit-box that
            line-clamp relies on, and a long name would run to four lines. */}
        <span className="line-clamp-2 text-[12.5px] font-semibold leading-tight text-bone [overflow-wrap:anywhere]">{resume.fileName}</span>
        <span className="t-mono mt-1 block !text-[9px] !tracking-[0.12em] text-ash">PDF · {resume.size}</span>
      </span>
      <span
        aria-hidden
        className="grid h-[30px] w-[30px] shrink-0 place-items-center rounded-full border border-white/10 text-bone transition-colors duration-300 group-hover:border-acid group-hover:bg-acid group-hover:text-void"
      >
        {/* An eye rather than a download arrow: it opens for a look. */}
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" focusable="false">
          <path d="M2.5 12s3.5-6.5 9.5-6.5 9.5 6.5 9.5 6.5-3.5 6.5-9.5 6.5S2.5 12 2.5 12Z" />
          <circle cx="12" cy="12" r="2.75" />
        </svg>
      </span>
      <span className="sr-only">, opens a preview you can download from</span>
    </a>
  );
}

/* What Parth is about to receive, so nobody is surprised by it. */
function DraftCard({ subject, body }: { subject: string; body: string }) {
  return (
    <div className="w-[88%] rounded-[16px] rounded-bl-[6px] border border-white/[0.08] bg-[#17171b] p-3">
      <p className="t-mono !text-[9px] !tracking-[0.14em] text-ash">New email</p>
      <dl className="mt-2 space-y-0.5 text-[12px] leading-snug">
        <div className="flex gap-2">
          <dt className="w-[46px] shrink-0 text-ash">To</dt>
          <dd className="min-w-0 truncate text-bone">{identity.email}</dd>
        </div>
        <div className="flex gap-2">
          <dt className="w-[46px] shrink-0 text-ash">Subject</dt>
          <dd className="min-w-0 truncate text-bone">{subject}</dd>
        </div>
      </dl>
      <p className="mt-2 line-clamp-3 whitespace-pre-wrap border-t border-white/[0.06] pt-2 text-[12px] leading-snug text-ash [overflow-wrap:anywhere]">
        {body}
      </p>
    </div>
  );
}

/* Quick replies and actions. The main action of a step is filled in the
   accent; the rest are plain outlines in the visitor's own colour.
   `pending` is the send in flight: announced as unavailable and ignoring
   presses, but still focusable, so focus is not dropped to the page
   while it waits (a disabled button loses focus). */
function Chip({
  primary = false,
  first = false,
  pending = false,
  cursor,
  onClick,
  children,
}: {
  primary?: boolean;
  first?: boolean;
  pending?: boolean;
  cursor?: string;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={pending ? undefined : onClick}
      aria-disabled={pending || undefined}
      data-chip={first ? "" : undefined}
      data-cursor={cursor}
      className={`rounded-full px-3.5 py-[7px] text-[12.5px] font-medium leading-none transition-colors duration-300 ${
        pending
          ? "cursor-default bg-white/[0.08] text-ash"
          : primary
            ? "bg-acid text-void hover:bg-bone"
            : "border border-bone/20 text-bone hover:border-bone hover:bg-bone hover:text-void"
      }`}
    >
      {children}
    </button>
  );
}
