import { identity } from "@/lib/content";

/* ============================================================
   CONTACT ENDPOINT
   The chat on the contact phone (components/PhoneChat.tsx) posts here,
   and this sends the message to Parth's inbox through Resend's HTTP API.
   Plain fetch, no SDK.

   Environment (see .env.example):
     RESEND_API_KEY      required. Without it every send answers 503
                         not_configured and the chat offers the mail app.
     CONTACT_TO_EMAIL    where messages go. Defaults to identity.email.
     CONTACT_FROM_EMAIL  the sender. Defaults to Resend's shared test
                         sender, which may only mail the address the
                         Resend account was opened with.
     CONTACT_UPSTREAM_URL  development only, and only to a loopback
                         address: points the send at a local mock so the
                         whole path can be tested without a real key.

   Order of checks, cheapest and least trusting first:
     same origin, JSON content type, body size, well-formed JSON, rate
     limit, spam traps, field validation, configuration, global cap, send.

   What this can and cannot stop: the origin check stops other websites
   from posting through a visitor's browser. It does not stop a script
   (curl sends any Origin it likes); the rate limit and the spam traps
   are what slow those down.

   The visitor's address is only ever the reply-to. Nothing is sent to
   it, so this endpoint cannot be used to mail anyone but Parth.
   ============================================================ */

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const RESEND_URL = "https://api.resend.com/emails";
const DEFAULT_FROM = "Portfolio <onboarding@resend.dev>";

/* The same caps the chat puts on its fields. Lengths are UTF-16 code
   units, which is what the browser's maxLength and String.slice count. */
const LIMITS = { name: 100, email: 254, topic: 150, message: 1500 } as const;

/* The largest honest request is about 5 KB (1,500 characters of CJK in
   the message is 4.5 KB of UTF-8). Anything past 8 KB is not the chat. */
const MAX_BODY = 8 * 1024;

/* A person needs far longer than this to read the greeting and answer
   four questions; a form-filling bot does not. */
const MIN_FILL_MS = 3000;

/* Kept in step with the chat's own check (PhoneChat.tsx), so a visitor
   hears about a typo at the email step rather than a failure at the end.
   Stricter than the chat used to be on purpose: the address becomes the
   reply-to, so quotes, commas, angle brackets and spaces are refused
   outright rather than trusted to be escaped. */
const EMAIL =
  /^[A-Za-z0-9.!#$%&'*+/=?^_`{|}~-]{1,64}@(?:[A-Za-z0-9](?:[A-Za-z0-9-]{0,61}[A-Za-z0-9])?\.)+[A-Za-z](?:[A-Za-z0-9-]{0,61}[A-Za-z0-9])?$/;

/* ---- rate limits ---------------------------------------------
   Best effort. Every serverless instance has its own memory, so on a
   host that runs several instances (or starts a fresh one after a cold
   start) each keeps its own count, and a determined sender can get
   more through than the numbers below. They still stop a single
   runaway client and cap the damage from a noisy one. A shared store
   (Redis, a KV) is the fix if that ever matters. */
const MINUTE = 60_000;
const DAY = 24 * 60 * MINUTE;
const PER_IP = [
  { max: 5, window: 10 * MINUTE },
  { max: 20, window: DAY },
];
/* Sends from everyone together, so a flood from many addresses cannot
   burn through the provider's daily quota in a few seconds. */
const GLOBAL_PER_MINUTE = 10;
/* An upper bound on remembered clients, so the map cannot grow without
   limit however many addresses a flood comes from. */
const MAX_CLIENTS = 5000;

const hits = new Map<string, number[]>();
let sends: number[] = [];
let lastSweep = 0;

function sweep(now: number) {
  if (now - lastSweep < MINUTE && hits.size < MAX_CLIENTS) return;
  lastSweep = now;
  for (const [key, list] of hits) {
    const kept = list.filter((t) => now - t < DAY);
    if (kept.length) hits.set(key, kept);
    else hits.delete(key);
  }
  /* Still too many: forget the clients seen least recently, down to 90%
     so a flood does not set off a full sweep on every request. A Map
     keeps insertion order and every hit re-inserts its key, so the first
     keys are the stalest. */
  if (hits.size < MAX_CLIENTS) return;
  for (const key of hits.keys()) {
    if (hits.size <= MAX_CLIENTS * 0.9) break;
    hits.delete(key);
  }
}

/* Seconds until this client may try again, or 0 if the request counts
   and may go ahead. A refused request is not counted. */
function takeClient(key: string, now: number): number {
  sweep(now);
  const list = (hits.get(key) ?? []).filter((t) => now - t < DAY);
  for (const { max, window } of PER_IP) {
    const inWindow = list.filter((t) => now - t < window);
    /* The list is oldest first, so the window reopens when its oldest
       hit ages out. */
    if (inWindow.length >= max) return Math.max(1, Math.ceil((inWindow[0] + window - now) / 1000));
  }
  list.push(now);
  hits.delete(key);
  hits.set(key, list);
  return 0;
}

function takeGlobal(now: number): number {
  sends = sends.filter((t) => now - t < MINUTE);
  if (sends.length >= GLOBAL_PER_MINUTE) return Math.max(1, Math.ceil((sends[0] + MINUTE - now) / 1000));
  sends.push(now);
  return 0;
}

/* The client's address, as the host reports it. Vercel and most proxies
   overwrite x-forwarded-for with the real peer; behind a proxy that
   appends instead, the first entry is whatever the client claimed, so
   this is a best-effort key, not an identity. With neither header,
   everyone shares one "unknown" bucket, which errs on the strict side.
   IPv6 is bucketed to its /64, since one household or server usually
   holds a whole /64 and can rotate through it freely. */
function clientKey(req: Request): string {
  const raw =
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || req.headers.get("x-real-ip")?.trim() || "";
  let ip = raw.replace(/^\[|\](?::\d+)?$/g, "").replace(/%.*$/, "");
  if (/^\d{1,3}(?:\.\d{1,3}){3}:\d+$/.test(ip)) ip = ip.slice(0, ip.lastIndexOf(":"));
  if (!ip || ip.length > 64 || !/^[0-9A-Fa-f:.]+$/.test(ip)) return "unknown";
  if (!ip.includes(":")) return ip;
  const mapped = /^::ffff:(\d{1,3}(?:\.\d{1,3}){3})$/i.exec(ip);
  if (mapped) return mapped[1];
  const [head, tail] = ip.split("::");
  const h = head ? head.split(":") : [];
  const t = tail ? tail.split(":") : [];
  const groups = tail === undefined ? h : [...h, ...Array<string>(Math.max(0, 8 - h.length - t.length)).fill("0"), ...t];
  return `${groups
    .slice(0, 4)
    .map((g) => g.toLowerCase().replace(/^0+(?=.)/, ""))
    .join(":")}::/64`;
}

/* ---- same origin ---------------------------------------------
   Browsers send Origin on every POST, same origin included, and
   Sec-Fetch-Site on every request; neither can be set by a page's
   script. Referer is the fallback for the rare client that omits
   Origin. The request's own host comes from x-forwarded-host (what the
   visitor typed, behind a proxy) or Host. */
const stripPort = (h: string) => h.trim().toLowerCase().replace(/:(?:80|443)$/, "");

function sameOrigin(req: Request): boolean {
  const site = req.headers.get("sec-fetch-site");
  if (site && site !== "same-origin") return false;

  const source = req.headers.get("origin") || req.headers.get("referer");
  if (!source || source === "null") return false;
  let from: URL;
  try {
    from = new URL(source);
  } catch {
    return false;
  }
  if (from.protocol !== "https:" && from.protocol !== "http:") return false;

  const own = [req.headers.get("x-forwarded-host")?.split(",")[0], req.headers.get("host")]
    .filter((h): h is string => !!h && !!h.trim())
    .map(stripPort);
  return own.includes(stripPort(from.host));
}

/* ---- body ------------------------------------------------------
   Read as a stream and stopped at the cap, so a huge or endless body
   never lands in memory, whatever Content-Length claims (or if it is
   missing). Decoded strictly: bytes that are not UTF-8 are refused
   rather than turned into replacement characters. */
async function readCapped(req: Request): Promise<string | null | undefined> {
  const stream = req.body;
  if (!stream) return "";
  const reader = stream.getReader();
  const chunks: Uint8Array[] = [];
  let size = 0;
  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    size += value.byteLength;
    if (size > MAX_BODY) {
      await reader.cancel().catch(() => {});
      return null; // too large
    }
    chunks.push(value);
  }
  const all = new Uint8Array(size);
  let at = 0;
  for (const c of chunks) {
    all.set(c, at);
    at += c.byteLength;
  }
  try {
    return new TextDecoder("utf-8", { fatal: true }).decode(all);
  } catch {
    return undefined; // not UTF-8
  }
}

/* ---- cleaning --------------------------------------------------
   C0 and C1 control characters (tab and newline are handled per field),
   DEL, the byte order mark, the bidi overrides and isolates that can make
   text display in a different order than it was written, and unpaired
   surrogates, which have no valid encoding in the email. */
const INVISIBLE = /[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F-\u009F\uFEFF\u202A-\u202E\u2066-\u2069]/g;
const LONE_SURROGATE = /[\uD800-\uDBFF](?![\uDC00-\uDFFF])|(?<![\uD800-\uDBFF])[\uDC00-\uDFFF]/g;

/* One line: every kind of line break or tab becomes a space, so nothing
   typed can start a new header line. Runs of space collapse to one. */
const oneLine = (s: string) =>
  s
    .replace(/[\r\n\t\u2028\u2029\u0085]/g, " ")
    .replace(INVISIBLE, "")
    .replace(LONE_SURROGATE, "")
    .replace(/\s+/g, " ")
    .trim();

/* The message keeps its line breaks, normalised to \n, and its tabs. */
const multiLine = (s: string) =>
  s
    .replace(/\r\n?|[\u2028\u2029\u0085]/g, "\n")
    .replace(INVISIBLE, "")
    .replace(LONE_SURROGATE, "")
    .replace(/\n{4,}/g, "\n\n\n")
    .trim();

type Fields = { name: string; email: string; topic: string; message: string };

function validate(body: Record<string, unknown>): Fields | string {
  const { name, email, topic, message } = body;
  if (typeof name !== "string") return "invalid_name";
  if (typeof email !== "string") return "invalid_email";
  if (topic !== undefined && typeof topic !== "string") return "invalid_topic";
  if (typeof message !== "string") return "invalid_message";

  const f: Fields = {
    name: oneLine(name),
    email: oneLine(email),
    topic: oneLine(topic ?? ""),
    message: multiLine(message),
  };
  if (f.name.length < 1 || f.name.length > LIMITS.name) return "invalid_name";
  if (f.email.length > LIMITS.email || !EMAIL.test(f.email)) return "invalid_email";
  if (f.topic.length > LIMITS.topic) return "invalid_topic";
  if (f.message.length < 1 || f.message.length > LIMITS.message) return "invalid_message";
  return f;
}

/* ---- spam traps ------------------------------------------------
   `company` is a field no person can see or reach (see PhoneChat), so
   anything in it came from a bot filling every input. `startedAt` and
   `sentAt` are both the visitor's own clock, when the chat began and when
   they pressed send; comparing the two, not either with the server's
   clock, means a visitor whose clock is off is never mistaken for a bot. */
function looksLikeBot(body: Record<string, unknown>): string | null {
  const { company, startedAt, sentAt } = body;
  if (company !== undefined && company !== "") return "honeypot";
  if (typeof startedAt !== "number" || typeof sentAt !== "number") return "no_timing";
  if (!Number.isFinite(startedAt) || !Number.isFinite(sentAt) || startedAt <= 0) return "no_timing";
  if (sentAt - startedAt < MIN_FILL_MS) return "too_fast";
  return null;
}

/* ---- upstream --------------------------------------------------- */
function upstreamUrl(): string {
  const override = process.env.CONTACT_UPSTREAM_URL;
  /* Never in production, and only to this machine, so a stray variable
     can never hand the API key to another host. */
  if (override && process.env.NODE_ENV !== "production") {
    try {
      const u = new URL(override);
      const local = u.hostname === "127.0.0.1" || u.hostname === "localhost" || u.hostname === "[::1]";
      if (local && (u.protocol === "http:" || u.protocol === "https:")) return u.toString();
    } catch {
      /* fall through to the real endpoint */
    }
  }
  return RESEND_URL;
}

function when(now: number): string {
  const iso = new Date(now).toISOString().replace(/\.\d{3}Z$/, "Z");
  try {
    const local = new Intl.DateTimeFormat("en-IN", {
      timeZone: "Asia/Kolkata",
      dateStyle: "medium",
      timeStyle: "short",
    }).format(now);
    return `${local} IST (${iso})`;
  } catch {
    return iso;
  }
}

/* ---- responses -------------------------------------------------- */
function reply(status: number, body: Record<string, unknown>, headers?: Record<string, string>) {
  return Response.json(body, { status, headers: { "Cache-Control": "no-store", ...headers } });
}

const fail = (status: number, error: string, headers?: Record<string, string>) =>
  reply(status, { ok: false, error }, headers);

export async function POST(req: Request) {
  if (!sameOrigin(req)) return fail(403, "forbidden");

  const type = req.headers.get("content-type") ?? "";
  if (!/^application\/json\s*(?:;|$)/i.test(type)) return fail(415, "unsupported_media_type");

  const declared = Number(req.headers.get("content-length"));
  if (Number.isFinite(declared) && declared > MAX_BODY) return fail(413, "too_large");

  let text: string | null | undefined;
  try {
    text = await readCapped(req);
  } catch {
    return fail(400, "bad_request");
  }
  if (text === null) return fail(413, "too_large");
  if (text === undefined || !text) return fail(400, "bad_request");

  let body: unknown;
  try {
    body = JSON.parse(text);
  } catch {
    return fail(400, "bad_request");
  }
  if (typeof body !== "object" || body === null || Array.isArray(body)) return fail(400, "bad_request");
  const data = body as Record<string, unknown>;

  const now = Date.now();
  const wait = takeClient(clientKey(req), now);
  if (wait) return fail(429, "rate_limited", { "Retry-After": String(wait) });

  /* A bot is told it worked, so it has no reason to try again or
     change tack. Nothing is sent. */
  const bot = looksLikeBot(data);
  if (bot) {
    console.info(`[contact] dropped: ${bot}`);
    return reply(200, { ok: true });
  }

  const fields = validate(data);
  if (typeof fields === "string") return fail(400, fields);

  const key = process.env.RESEND_API_KEY?.trim();
  if (!key) {
    console.warn("[contact] RESEND_API_KEY is not set; message not sent");
    return fail(503, "not_configured");
  }

  const busy = takeGlobal(now);
  if (busy) return fail(429, "rate_limited", { "Retry-After": String(busy) });

  const to = process.env.CONTACT_TO_EMAIL?.trim() || identity.email;
  const from = process.env.CONTACT_FROM_EMAIL?.replace(/[\r\n]/g, "").trim() || DEFAULT_FROM;
  const topic = fields.topic || "Hello";
  const subject = `Portfolio: ${topic} from ${fields.name}`;
  const first = fields.name.split(" ")[0];
  const textBody = [
    "New message from the contact chat on your portfolio.",
    "",
    `Name:   ${fields.name}`,
    `Email:  ${fields.email}`,
    `Topic:  ${fields.topic || "(none)"}`,
    `Time:   ${when(now)}`,
    "",
    "Message:",
    fields.message,
    "",
    "--",
    `Reply to this email to answer ${first} directly.`,
  ].join("\n");

  try {
    const res = await fetch(upstreamUrl(), {
      method: "POST",
      headers: {
        Authorization: `Bearer ${key}`,
        "Content-Type": "application/json",
      },
      /* Plain text only: nothing the visitor typed is ever rendered as
         HTML in the inbox. */
      body: JSON.stringify({ from, to: [to], subject, text: textBody, reply_to: fields.email }),
      signal: AbortSignal.timeout(10_000),
      redirect: "error",
      cache: "no-store",
    });
    if (!res.ok) {
      /* Only the provider's short error name is logged, for debugging.
         Nothing it says reaches the visitor. */
      let name = "";
      try {
        const j = (await res.json()) as { name?: unknown };
        if (typeof j?.name === "string") name = j.name.replace(/[^\w.-]/g, "").slice(0, 60);
      } catch {
        /* not JSON */
      }
      console.error(`[contact] upstream refused: ${res.status}${name ? ` ${name}` : ""}`);
      return fail(502, "send_failed");
    }
    await res.body?.cancel().catch(() => {});
  } catch (e) {
    const why = e instanceof Error && (e.name === "TimeoutError" || e.name === "AbortError") ? "timeout" : "network";
    console.error(`[contact] upstream ${why}`);
    return fail(502, "send_failed");
  }

  return reply(200, { ok: true });
}

/* Everything else is refused outright, OPTIONS included: with no CORS
   headers a cross-origin preflight fails, so another site's script never
   gets as far as the POST. */
function notAllowed() {
  return fail(405, "method_not_allowed", { Allow: "POST" });
}
export { notAllowed as GET, notAllowed as HEAD, notAllowed as PUT, notAllowed as PATCH, notAllowed as DELETE, notAllowed as OPTIONS };
