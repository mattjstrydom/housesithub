import course from "./content.generated.js";
import wistia from "./wistia.json" with { type: "json" }; // lesson id -> Wistia media id, e.g. { "m1l1": "abc123xyz9" }
import { FILES } from "./files.js";
import { randomToken, sha256Hex } from "./lib/crypto.js";
import { verifyStripeSignature } from "./lib/stripe.js";
import { sendLoginLink, sendWelcome } from "./lib/email.js";
import * as q from "./lib/db.js";
import * as pages from "./pages.js";

const COOKIE = "hsh_session";
const SESSION_SEC = 30 * 86400;
const LINK_SEC = 15 * 60;
const LESSONS = course.modules.flatMap((m) => m.lessons);
const byId = new Map(LESSONS.map((l) => [l.id, l]));
const modById = new Map(course.modules.map((m) => [m.id, m]));

// Wistia is the only third party allowed to frame content on these pages. No scripts run at all.
const CSP = [
  "default-src 'self'",
  "img-src 'self' data:",
  "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
  "font-src https://fonts.gstatic.com",
  "frame-src https://fast.wistia.net https://fast.wistia.com https://embed.wistia.com",
  "script-src 'none'",
  "form-action 'self'",
  "frame-ancestors 'none'",
  "base-uri 'none'",
].join("; ");
// Lesson pages only: allow Wistia's loader and our own /assets/js file (default playback speed). Every other page keeps script-src 'none'.
const LESSON_CSP = CSP.replace("script-src 'none'", "script-src 'self' https://fast.wistia.net https://fast.wistia.com");

const baseHeaders = {
  "cache-control": "private, no-store",
  "x-content-type-options": "nosniff",
  "referrer-policy": "no-referrer",
  "content-security-policy": CSP,
};
const html = (body, status = 200, extra = {}) =>
  new Response(body, { status, headers: { ...baseHeaders, "content-type": "text/html; charset=utf-8", ...extra } });
const redirect = (to, status = 303, extra = {}) => new Response(null, { status, headers: { ...baseHeaders, location: to, ...extra } });
const json = (status, body) => new Response(JSON.stringify(body), { status, headers: { ...baseHeaders, "content-type": "application/json" } });
const notFound = (text) => html(pages.messagePage("Not found", text).html, 404);

function cookieHeader(url, value, maxAge) {
  const secure = url.protocol === "https:" ? "; Secure" : "";
  return `${COOKIE}=${value}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${maxAge}${secure}`;
}
function readCookie(request) {
  for (const part of (request.headers.get("cookie") || "").split(";")) {
    const i = part.indexOf("=");
    if (i > 0 && part.slice(0, i).trim() === COOKIE) return part.slice(i + 1).trim();
  }
  return null;
}
// Browsers always send Origin (or Sec-Fetch-Site) on form posts. Reject posts that come from another site.
function sameOrigin(request, url) {
  const origin = request.headers.get("origin");
  // "null" is what browsers send for same-origin form posts under Referrer-Policy: no-referrer; fall through to Sec-Fetch-Site.
  if (origin && origin !== "null") return origin === url.origin;
  const site = request.headers.get("sec-fetch-site");
  return !site || site === "same-origin" || site === "none";
}
const TOKEN_RE = /^[A-Za-z0-9_-]{20,100}$/;

/** Returns { user } for a valid session with an active purchase, or { response } to send instead. */
async function requireStudent(request, env, now) {
  const raw = readCookie(request);
  const user = raw && TOKEN_RE.test(raw) ? await q.getSessionUser(env.DB, await sha256Hex(raw), now) : null;
  if (!user) return { response: redirect("/login", 302) };
  if (!(await q.hasActiveAccess(env.DB, user.id))) return { response: html(pages.noAccessPage(), 403) };
  return { user };
}

// Admins are the emails in the ADMIN_EMAILS var (comma separated). Checked on every request, so removing one revokes at once.
const isAdminEmail = (env, email) => String(env.ADMIN_EMAILS || "").split(",").map(q.normEmail).includes(email);

async function requireAdmin(request, env, now) {
  const raw = readCookie(request);
  const user = raw && TOKEN_RE.test(raw) ? await q.getSessionUser(env.DB, await sha256Hex(raw), now) : null;
  if (!user) return { response: redirect("/login", 302) };
  if (!isAdminEmail(env, user.email)) return { response: notFound("We couldn't find that page.") }; // do not reveal the admin area
  return { user };
}

const ADMIN_NOTES = {
  granted: "Access granted. They can log in at /login with that email (no email was sent from here).",
  exists: "They already have access.",
  revoked: "Access revoked.",
  bad: "That doesn't look like a valid email address.",
};

async function adminRoutes(request, env, url, path, now) {
  const auth = await requireAdmin(request, env, now);
  if (auth.response) return auth.response;
  const method = request.method;
  const back = (code, to = "/admin") => redirect(`${to}?m=${code}`);

  if (path === "/api/admin/grant" || path === "/api/admin/revoke") {
    if (method !== "POST") return json(405, { error: "Method not allowed" });
    if (!sameOrigin(request, url)) return json(403, { error: "bad_origin" });
    const form = await request.formData().catch(() => null);
    if (path === "/api/admin/grant") {
      const email = q.normEmail(form && form.get("email"));
      if (!q.validEmail(email)) return back("bad");
      const user = await q.upsertUser(env.DB, email, now);
      if (await q.hasActiveAccess(env.DB, user.id)) return back("exists");
      await q.addPurchase(env.DB, { userId: user.id, sessionId: null, paymentIntent: null, source: "manual", now });
      console.log("admin grant", auth.user.email, "->", email);
      return back("granted");
    }
    const target = await q.getUserById(env.DB, Number(form && form.get("user_id")));
    if (!target) return back("bad");
    await q.revokeAccess(env.DB, target.id);
    console.log("admin revoke", auth.user.email, "->", target.email);
    return back("revoked");
  }

  if (method !== "GET") return json(405, { error: "Method not allowed" });
  const note = ADMIN_NOTES[url.searchParams.get("m")] || null;
  if (path === "/admin") return html(pages.adminPage({ user: auth.user, rows: await q.listLearners(env.DB), total: LESSONS.length, note }));
  const m = path.match(/^\/admin\/user\/(\d+)$/);
  const learner = m && (await q.getUserById(env.DB, Number(m[1])));
  if (!learner) return notFound("We couldn't find that learner.");
  return html(
    pages.adminUserPage({ user: auth.user, learner, course, purchases: await q.getPurchases(env.DB, learner.id), progress: await q.getProgressRows(env.DB, learner.id), note }),
  );
}

async function stripeWebhook(request, env, now) {
  if (request.method !== "POST") return json(405, { error: "Method not allowed" });
  const raw = await request.text();
  const ok = await verifyStripeSignature(raw, request.headers.get("stripe-signature"), env.STRIPE_WEBHOOK_SECRET, now);
  if (!ok) return json(400, { error: "bad_signature" });
  let event;
  try {
    event = JSON.parse(raw);
  } catch {
    return json(400, { error: "bad_json" });
  }
  const obj = event.data && event.data.object;
  const type = event.type;
  try {
    if (type === "checkout.session.completed" || type === "checkout.session.async_payment_succeeded") {
      if (obj.payment_status !== "paid") return json(200, { ignored: "not_paid" });
      if (!(await q.startEvent(env.DB, event.id, type, now))) return json(200, { duplicate: true });
      const email = q.normEmail((obj.customer_details && obj.customer_details.email) || obj.customer_email);
      if (!q.validEmail(email)) {
        console.error("Paid session without a usable email, grant it by hand:", obj.id);
        await q.finishEvent(env.DB, event.id, now);
        return json(200, { ignored: "no_email" });
      }
      const user = await q.upsertUser(env.DB, email, now);
      await q.addPurchase(env.DB, { userId: user.id, sessionId: obj.id, paymentIntent: obj.payment_intent || null, source: "stripe", now });
      const token = randomToken();
      await q.createLoginToken(env.DB, await sha256Hex(token), user.id, now + LINK_SEC);
      await sendWelcome(env, email, `${env.SITE_ORIGIN}/auth/verify?token=${token}`);
      await q.finishEvent(env.DB, event.id, now);
      return json(200, { granted: true });
    }
    if (type === "charge.refunded") {
      if (!(await q.startEvent(env.DB, event.id, type, now))) return json(200, { duplicate: true });
      // Only a full refund removes access. A partial refund keeps it.
      if (obj.refunded === true && obj.payment_intent) await q.refundByPaymentIntent(env.DB, obj.payment_intent);
      await q.finishEvent(env.DB, event.id, now);
      return json(200, { refunded: obj.refunded === true });
    }
    return json(200, { ignored: type });
  } catch (e) {
    console.error("webhook failed", type, event.id, e && e.message);
    return json(500, { error: "processing_failed" }); // Stripe retries; the event is not marked processed
  }
}

async function loginPost(request, env, url, now) {
  if (!sameOrigin(request, url)) return json(403, { error: "bad_origin" });
  const form = await request.formData().catch(() => null);
  const email = q.normEmail(form && form.get("email"));
  const generic = "If that email has access, we've sent a login link. It can take a minute to arrive, so check your spam folder too.";
  if (!q.validEmail(email)) return html(pages.loginPage({ message: "Please enter a valid email address.", email }), 400);
  const ip = request.headers.get("cf-connecting-ip") || "unknown";
  if ((await q.hit(env.DB, "ip:" + ip, now)) > 20) return html(pages.loginPage({ message: "Too many attempts. Please try again in a few minutes." }), 429);
  // Over the per-email limit we stay silent and look identical to success, so nobody can probe emails.
  if ((await q.hit(env.DB, "email:" + email, now)) <= 5) {
    const admin = isAdminEmail(env, email);
    const user = admin ? await q.upsertUser(env.DB, email, now) : await q.findUserByEmail(env.DB, email); // admins may have no purchase
    if (user && (admin || (await q.hasActiveAccess(env.DB, user.id)))) {
      const token = randomToken();
      await q.createLoginToken(env.DB, await sha256Hex(token), user.id, now + LINK_SEC);
      try {
        await sendLoginLink(env, email, `${env.SITE_ORIGIN}/auth/verify?token=${token}`);
      } catch (e) {
        console.error("login email failed", e && e.message);
      }
    }
  }
  if (Math.random() < 0.02) await q.purgeExpired(env.DB, now);
  return html(pages.loginPage({ message: generic }));
}

async function verifyLink(request, env, url, now) {
  if (request.method === "GET") {
    // GET never uses the token up: mail scanners that pre-open links would otherwise burn it.
    const token = url.searchParams.get("token") || "";
    if (!TOKEN_RE.test(token) || !(await q.peekLoginToken(env.DB, await sha256Hex(token), now))) return html(pages.invalidLinkPage(), 400);
    return html(pages.confirmPage(token));
  }
  if (request.method !== "POST") return json(405, { error: "Method not allowed" });
  if (!sameOrigin(request, url)) return json(403, { error: "bad_origin" });
  const form = await request.formData().catch(() => null);
  const token = String((form && form.get("token")) || "");
  if (!TOKEN_RE.test(token)) return html(pages.invalidLinkPage(), 400);
  const userId = await q.consumeLoginToken(env.DB, await sha256Hex(token), now);
  if (!userId) return html(pages.invalidLinkPage(), 400);
  const access = await q.hasActiveAccess(env.DB, userId);
  const admin = isAdminEmail(env, (await q.getUserById(env.DB, userId)).email);
  if (!access && !admin) return html(pages.noAccessPage(), 403);
  const session = randomToken();
  await q.createSession(env.DB, await sha256Hex(session), userId, now + SESSION_SEC);
  return redirect(access ? "/course" : "/admin", 303, { "set-cookie": cookieHeader(url, session, SESSION_SEC) });
}

/** Returns a Response for LMS routes, or null so the main Worker carries on. */
export async function handleLms(request, env) {
  const url = new URL(request.url);
  const path = url.pathname.length > 1 ? url.pathname.replace(/\/+$/, "") : url.pathname;
  const now = env.NOW ? env.NOW() : Math.floor(Date.now() / 1000);
  const method = request.method;

  if (path === "/api/stripe-webhook") return stripeWebhook(request, env, now);
  if (path === "/login") return method === "GET" ? html(pages.loginPage()) : json(405, { error: "Method not allowed" });
  if (path === "/api/login") return method === "POST" ? loginPost(request, env, url, now) : json(405, { error: "Method not allowed" });
  if (path === "/auth/verify") return verifyLink(request, env, url, now);

  if (path === "/admin" || path.startsWith("/admin/") || path.startsWith("/api/admin/")) return adminRoutes(request, env, url, path, now);

  if (path === "/api/logout") {
    if (method !== "POST") return json(405, { error: "Method not allowed" });
    if (!sameOrigin(request, url)) return json(403, { error: "bad_origin" });
    const raw = readCookie(request);
    if (raw) await q.deleteSession(env.DB, await sha256Hex(raw));
    return redirect("/login", 303, { "set-cookie": cookieHeader(url, "", 0) });
  }

  if (path === "/api/progress" || path === "/course" || path.startsWith("/course/")) {
    const auth = await requireStudent(request, env, now);
    if (auth.response) return auth.response;
    const user = auth.user;

    if (path === "/api/progress") {
      if (method !== "POST") return json(405, { error: "Method not allowed" });
      if (!sameOrigin(request, url)) return json(403, { error: "bad_origin" });
      const form = await request.formData().catch(() => null);
      const lesson = byId.get(String((form && form.get("lesson")) || ""));
      if (!lesson) return json(400, { error: "unknown_lesson" });
      await q.setCompleted(env.DB, user.id, lesson.id, form.get("done") === "1", now);
      return redirect(`/course/${lesson.mod}/${lesson.slug}`);
    }
    if (method !== "GET") return json(405, { error: "Method not allowed" });

    if (path === "/course") return html(pages.dashboardPage({ user, course, done: await q.getProgress(env.DB, user.id) }));
    if (path === "/course/downloads") return html(pages.downloadsPage({ user, files: FILES }));
    if (path.startsWith("/course/files/")) {
      let key;
      try {
        key = decodeURIComponent(path.slice("/course/files/".length));
      } catch {
        return notFound("We couldn't find that file.");
      }
      const file = FILES.find((f) => f.key === key); // only listed files, never a free-form key
      const obj = file && env.COURSE_FILES ? await env.COURSE_FILES.get(file.key) : null;
      if (!obj) return notFound("We couldn't find that file.");
      const name = file.key.split("/").pop();
      return new Response(obj.body, {
        headers: {
          ...baseHeaders,
          "content-type": "application/pdf",
          "content-disposition": `attachment; filename="${name.replace(/[^\x20-\x7e]/g, "_").replace(/"/g, "")}"; filename*=UTF-8''${encodeURIComponent(name)}`,
        },
      });
    }
    const m = path.match(/^\/course\/(m\d)\/(l\d+)$/);
    const mod = m && modById.get(m[1]);
    const lesson = mod && mod.lessons.find((l) => l.slug === m[2]);
    if (!lesson) return notFound("We couldn't find that lesson.");
    await q.markViewed(env.DB, user.id, lesson.id, now);
    const i = LESSONS.indexOf(lesson);
    return html(
      pages.lessonPage({ user, course, lesson, mod, done: await q.getProgress(env.DB, user.id), wistiaId: wistia[lesson.id] || null, prev: LESSONS[i - 1], next: LESSONS[i + 1] }),
      200,
      { "content-security-policy": LESSON_CSP },
    );
  }
  return null;
}
