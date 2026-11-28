import test from "node:test";
import assert from "node:assert/strict";
import crypto from "node:crypto";
import { makeD1 } from "./d1.js";
import { handleLms } from "../src/lms.js";

const ORIGIN = "http://localhost";
const SECRET = "whsec_test";
let now, db, env, sent, resendFails;

function setup() {
  now = 1_800_000_000;
  db = makeD1();
  sent = [];
  resendFails = false;
  env = {
    DB: db, STRIPE_WEBHOOK_SECRET: SECRET, RESEND_API_KEY: "re_test", EMAIL_FROM: "Course <hi@example.com>",
    SITE_ORIGIN: ORIGIN, ADMIN_EMAILS: "Boss@Example.com, other@example.com", NOW: () => now,
    COURSE_FILES: { get: async (k) => (k === "checklists/10 Pre-trip checklist.pdf" ? { body: "%PDF-fake" } : null) },
  };
  globalThis.fetch = async (url, init) => {
    assert.equal(url, "https://api.resend.com/emails");
    if (resendFails) return new Response("{}", { status: 500 });
    sent.push(JSON.parse(init.body));
    return new Response("{}", { status: 200 });
  };
}
const call = (path, init = {}) => handleLms(new Request(ORIGIN + path, init), env);
const form = (data) => new URLSearchParams(data).toString();
const post = (path, data, headers = {}) =>
  call(path, { method: "POST", headers: { "content-type": "application/x-www-form-urlencoded", origin: ORIGIN, ...headers }, body: form(data) });

function signed(event, t = now, secret = SECRET) {
  const body = JSON.stringify(event);
  const sig = crypto.createHmac("sha256", secret).update(`${t}.${body}`).digest("hex");
  return { body, header: `t=${t},v1=${sig}` };
}
const webhook = (event, opts) => {
  const { body, header } = signed(event, opts?.t, opts?.secret);
  return call("/api/stripe-webhook", { method: "POST", headers: { "stripe-signature": header }, body });
};
const paidEvent = (id = "evt_1", email = "Jane@Example.com", session = "cs_live_abc123", pi = "pi_1") => ({
  id, type: "checkout.session.completed",
  data: { object: { id: session, payment_status: "paid", payment_intent: pi, customer_details: { email } } },
});
const linkFrom = (mail) => mail.text.match(/token=([A-Za-z0-9_-]+)/)[1];
async function logIn(token) {
  const res = await post("/auth/verify", { token });
  const c = res.headers.get("set-cookie");
  return { res, cookie: c ? c.split(";")[0] : null };
}
const get = (path, cookie) => call(path, { headers: cookie ? { cookie } : {} });
async function newStudent(email = "jane@example.com", id = "evt_1", session = "cs_live_abc123", pi = "pi_1") {
  await webhook(paidEvent(id, email, session, pi));
  const { cookie } = await logIn(linkFrom(sent.at(-1)));
  return cookie;
}

test.beforeEach(setup);

test("a valid paid webhook creates the student, an active purchase and a welcome email with a login link", async () => {
  const res = await webhook(paidEvent());
  assert.equal(res.status, 200);
  assert.equal(db._raw.prepare("SELECT email FROM users").get().email, "jane@example.com");
  assert.equal(db._raw.prepare("SELECT status FROM purchases").get().status, "active");
  assert.equal(sent.length, 1);
  assert.deepEqual(sent[0].to, ["jane@example.com"]);
  const { res: v, cookie } = await logIn(linkFrom(sent[0]));
  assert.equal(v.status, 303);
  assert.match(v.headers.get("set-cookie"), /HttpOnly; SameSite=Lax/);
  assert.equal((await get("/course", cookie)).status, 200);
});

test("bad signature, wrong secret and stale timestamp are rejected and grant nothing", async () => {
  assert.equal((await call("/api/stripe-webhook", { method: "POST", headers: { "stripe-signature": "t=1,v1=00" }, body: "{}" })).status, 400);
  assert.equal((await webhook(paidEvent(), { secret: "whsec_other" })).status, 400);
  assert.equal((await webhook(paidEvent(), { t: now - 3600 })).status, 400);
  assert.equal(db._raw.prepare("SELECT COUNT(*) c FROM users").get().c, 0);
  assert.equal(sent.length, 0);
});

test("a duplicate Stripe event does nothing", async () => {
  await webhook(paidEvent());
  const again = await webhook(paidEvent());
  assert.deepEqual(await again.json(), { duplicate: true });
  assert.equal(db._raw.prepare("SELECT COUNT(*) c FROM purchases").get().c, 1);
  assert.equal(sent.length, 1);
});

test("if the welcome email fails the webhook returns 500 and Stripe's retry completes the job", async () => {
  resendFails = true;
  assert.equal((await webhook(paidEvent())).status, 500);
  resendFails = false;
  assert.equal((await webhook(paidEvent())).status, 200);
  assert.equal(sent.length, 1);
  assert.equal(db._raw.prepare("SELECT COUNT(*) c FROM purchases").get().c, 1);
});

test("an unpaid session grants nothing", async () => {
  const ev = paidEvent();
  ev.data.object.payment_status = "unpaid";
  await webhook(ev);
  assert.equal(db._raw.prepare("SELECT COUNT(*) c FROM users").get().c, 0);
});

test("login looks identical for unknown and known emails, and only a customer is emailed", async () => {
  await webhook(paidEvent());
  sent.length = 0;
  const unknown = await post("/api/login", { email: "nobody@example.com" });
  const known = await post("/api/login", { email: "JANE@example.com " });
  assert.equal(unknown.status, 200);
  assert.equal(known.status, 200);
  assert.equal(await unknown.text(), await known.text());
  assert.equal(sent.length, 1);
  assert.deepEqual(sent[0].to, ["jane@example.com"]);
});

test("login links: opening does not use them up, they work once, expire, and cannot be reused", async () => {
  await webhook(paidEvent());
  const token = linkFrom(sent[0]);
  assert.equal((await get("/auth/verify?token=" + token)).status, 200); // scanner pre-open
  assert.equal((await get("/auth/verify?token=" + token)).status, 200);
  assert.equal((await logIn(token)).res.status, 303);
  assert.equal((await logIn(token)).res.status, 400); // reused
  await post("/api/login", { email: "jane@example.com" });
  const t2 = linkFrom(sent.at(-1));
  now += 16 * 60;
  assert.equal((await logIn(t2)).res.status, 400); // expired
  assert.equal((await get("/auth/verify?token=" + t2)).status, 400);
  assert.equal((await logIn("x".repeat(43))).res.status, 400); // unknown
});

test("logged-out visitors are blocked from every course route", async () => {
  for (const p of ["/course", "/course/m1/l1", "/course/downloads", "/course/files/" + encodeURIComponent("checklists/10 Pre-trip checklist.pdf")]) {
    const res = await get(p);
    assert.equal(res.status, 302, p);
    assert.equal(res.headers.get("location"), "/login");
  }
  assert.equal((await post("/api/progress", { lesson: "m1l1", done: "1" })).status, 302);
  assert.equal((await get("/course/m1/l1", "hsh_session=" + "a".repeat(43))).status, 302); // forged cookie
});

test("a full refund removes access straight away; a partial refund keeps it", async () => {
  const cookie = await newStudent();
  const refund = (id, refunded) => ({ id, type: "charge.refunded", data: { object: { refunded, payment_intent: "pi_1" } } });
  await webhook(refund("evt_r1", false));
  assert.equal((await get("/course", cookie)).status, 200);
  await webhook(refund("evt_r2", true));
  assert.equal((await get("/course", cookie)).status, 403);
  assert.equal((await get("/course/m1/l1", cookie)).status, 403);
  await post("/api/login", { email: "jane@example.com" });
  assert.equal(sent.length, 1); // no new login link for a refunded purchase
});

test("two devices can be logged in at once, and logging out one leaves the other", async () => {
  await webhook(paidEvent());
  const a = (await logIn(linkFrom(sent[0]))).cookie;
  await post("/api/login", { email: "jane@example.com" });
  const b = (await logIn(linkFrom(sent.at(-1)))).cookie;
  assert.notEqual(a, b);
  assert.equal((await get("/course", a)).status, 200);
  assert.equal((await get("/course", b)).status, 200);
  await post("/api/logout", {}, { cookie: a });
  assert.equal((await get("/course", a)).status, 302);
  assert.equal((await get("/course", b)).status, 200);
});

test("progress survives logout and a fresh login, and can be undone", async () => {
  const cookie = await newStudent();
  assert.equal((await post("/api/progress", { lesson: "m1l1", done: "1" }, { cookie })).status, 303);
  assert.match(await (await get("/course", cookie)).text(), /1 of 36 lessons/);
  await post("/api/logout", {}, { cookie });
  await post("/api/login", { email: "jane@example.com" });
  const again = (await logIn(linkFrom(sent.at(-1)))).cookie;
  assert.match(await (await get("/course", again)).text(), /1 of 36 lessons/);
  await post("/api/progress", { lesson: "m1l1", done: "0" }, { cookie: again });
  assert.match(await (await get("/course", again)).text(), /0 of 36 lessons/);
  assert.equal((await post("/api/progress", { lesson: "nope", done: "1" }, { cookie: again })).status, 400);
});

test("login requests are rate limited without revealing anything", async () => {
  await webhook(paidEvent());
  sent.length = 0;
  const bodies = new Set();
  for (let i = 0; i < 8; i++) bodies.add(await (await post("/api/login", { email: "jane@example.com" }, { "cf-connecting-ip": "1.1.1." + i })).text());
  assert.equal(sent.length, 5); // email limit: 5 per 15 minutes
  assert.equal(bodies.size, 1); // the 6th to 8th look the same as success
  let last;
  for (let i = 0; i < 25; i++) last = await post("/api/login", { email: `u${i}@example.com` }, { "cf-connecting-ip": "9.9.9.9" });
  assert.equal(last.status, 429);
});

test("posts from another site are refused", async () => {
  const cookie = await newStudent();
  const evil = { cookie, origin: "https://evil.example" };
  assert.equal((await post("/api/progress", { lesson: "m1l1", done: "1" }, evil)).status, 403);
  assert.equal((await post("/api/logout", {}, evil)).status, 403);
  assert.equal((await post("/api/login", { email: "jane@example.com" }, { origin: "https://evil.example" })).status, 403);
});

test("origin null (no-referrer same-origin form post) is judged by Sec-Fetch-Site", async () => {
  const cookie = await newStudent();
  const ok = { cookie, origin: "null", "sec-fetch-site": "same-origin" };
  assert.equal((await post("/api/progress", { lesson: "m1l1", done: "1" }, ok)).status, 303);
  const evil = { cookie, origin: "null", "sec-fetch-site": "cross-site" };
  assert.equal((await post("/api/progress", { lesson: "m1l1", done: "1" }, evil)).status, 403);
});

test("lesson pages show the transcript, a video placeholder and navigation; unknown lessons 404", async () => {
  const cookie = await newStudent();
  const page = await (await get("/course/m1/l2", cookie)).text();
  assert.match(page, /Transcript/);
  assert.match(page, /fast\.wistia\.net\/embed\/iframe\/a94o54ereo/);
  assert.match(page, /referrerpolicy="origin"/); // Wistia domain restriction needs the embedding origin; the page itself sends no referrer
  assert.doesNotMatch(page, /on its way/);
  assert.match(page, /Next: /);
  assert.equal((await get("/course/m9/l1", cookie)).status, 404);
  assert.equal((await get("/course/m1/l99", cookie)).status, 404);
  const dash = await (await get("/course", cookie)).text();
  assert.equal((dash.match(/href="\/course\/m\dl?\/?l\d+"/g) || []).length + (dash.match(/href="\/course\/m\d\/l\d+"/g) || []).length > 0, true);
  assert.equal((dash.match(/href="\/course\/m\d\/l\d+"/g) || []).length, 36 + 1); // 36 lessons plus the Start button
});

test("downloads: only listed files are served, only to students", async () => {
  const cookie = await newStudent();
  const ok = await get("/course/files/" + encodeURIComponent("checklists/10 Pre-trip checklist.pdf"), cookie);
  assert.equal(ok.status, 200);
  assert.equal(ok.headers.get("content-type"), "application/pdf");
  assert.equal(await ok.text(), "%PDF-fake");
  assert.equal((await get("/course/files/" + encodeURIComponent("../secret.txt"), cookie)).status, 404);
  assert.equal((await get("/course/files/" + encodeURIComponent("checklists/01 Personal suitability assessment.pdf"), cookie)).status, 404); // listed but not in the bucket
  assert.match(await (await get("/course/downloads", cookie)).text(), /Pre-trip checklist/);
});

test("every response carries the security headers, and non-course paths pass through", async () => {
  const res = await get("/login");
  assert.match(res.headers.get("content-security-policy"), /script-src 'none'/);
  assert.equal(res.headers.get("cache-control"), "private, no-store");
  assert.equal(await call("/thank-you.html"), null);
  assert.equal(await call("/api/create-checkout-session", { method: "POST" }), null);
});

async function adminCookie() {
  await post("/api/login", { email: "boss@example.com" });
  assert.equal(sent.length > 0, true, "admin gets a login link even with no purchase");
  const { res, cookie } = await logIn(linkFrom(sent.at(-1)));
  assert.equal(res.headers.get("location"), "/admin");
  return cookie;
}

test("admin area: signed out goes to login, a plain student sees 404", async () => {
  assert.equal((await get("/admin")).status, 302);
  const student = await newStudent();
  assert.equal((await get("/admin", student)).status, 404);
  assert.equal((await post("/api/admin/grant", { email: "x@example.com" }, { cookie: student })).status, 404);
});

test("admin lists learners, grants and revokes access, and rejects cross-site posts", async () => {
  const student = await newStudent("jane@example.com");
  await post("/api/progress", { lesson: "m1l1", done: "1" }, { cookie: student });
  const admin = await adminCookie();
  const list = await (await get("/admin", admin)).text();
  assert.match(list, /jane@example.com/);
  assert.match(list, /1 of 36/);
  assert.match(await (await get("/admin/user/1", admin)).text(), /Completed/);

  const evil = await post("/api/admin/grant", { email: "new@example.com" }, { cookie: admin, origin: "https://evil.example" });
  assert.equal(evil.status, 403);

  assert.match((await post("/api/admin/grant", { email: "New@Example.com" }, { cookie: admin })).headers.get("location"), /m=granted/);
  assert.match((await post("/api/admin/grant", { email: "new@example.com" }, { cookie: admin })).headers.get("location"), /m=exists/);
  assert.match((await post("/api/admin/grant", { email: "nope" }, { cookie: admin })).headers.get("location"), /m=bad/);
  await post("/api/login", { email: "new@example.com" });
  assert.equal((await logIn(linkFrom(sent.at(-1)))).res.headers.get("location"), "/course");

  assert.match((await post("/api/admin/revoke", { user_id: "1" }, { cookie: admin })).headers.get("location"), /m=revoked/);
  assert.equal((await get("/course", student)).status, 403);
  assert.match(await (await get("/admin", admin)).text(), /Revoked or refunded/);
  await post("/api/admin/grant", { email: "jane@example.com" }, { cookie: admin });
  assert.equal((await get("/course", student)).status, 200);
});
