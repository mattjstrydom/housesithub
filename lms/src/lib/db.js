// All SQL lives here. `db` is a Cloudflare D1 binding.
export const normEmail = (e) => String(e || "").trim().toLowerCase();
export const validEmail = (e) => e.length <= 254 && /^[^\s@<>"',;]+@[^\s@<>"',;]+\.[^\s@<>"',;]+$/.test(e);

export async function upsertUser(db, email, now) {
  await db.prepare("INSERT OR IGNORE INTO users (email, created_at) VALUES (?, ?)").bind(email, now).run();
  return db.prepare("SELECT id, email FROM users WHERE email = ?").bind(email).first();
}
export const findUserByEmail = (db, email) => db.prepare("SELECT id, email FROM users WHERE email = ?").bind(email).first();

export async function hasActiveAccess(db, userId) {
  const r = await db.prepare("SELECT 1 AS ok FROM purchases WHERE user_id = ? AND status = 'active' LIMIT 1").bind(userId).first();
  return !!r;
}
export async function addPurchase(db, { userId, sessionId, paymentIntent, source, now }) {
  await db
    .prepare("INSERT OR IGNORE INTO purchases (user_id, stripe_session_id, stripe_payment_intent, status, source, created_at) VALUES (?, ?, ?, 'active', ?, ?)")
    .bind(userId, sessionId, paymentIntent, source, now)
    .run();
}
export const refundByPaymentIntent = (db, pi) =>
  db.prepare("UPDATE purchases SET status = 'refunded' WHERE stripe_payment_intent = ?").bind(pi).run();

// Login tokens and sessions: only hashes are stored.
export async function createLoginToken(db, hash, userId, expiresAt) {
  await db.prepare("INSERT INTO login_tokens (token_hash, user_id, expires_at) VALUES (?, ?, ?)").bind(hash, userId, expiresAt).run();
}
/** Atomically marks a token used. Returns the user id, or null if unknown, expired or already used. */
export async function consumeLoginToken(db, hash, now) {
  const r = await db
    .prepare("UPDATE login_tokens SET used_at = ? WHERE token_hash = ? AND used_at IS NULL AND expires_at > ? RETURNING user_id")
    .bind(now, hash, now)
    .first();
  return r ? r.user_id : null;
}
export const peekLoginToken = (db, hash, now) =>
  db.prepare("SELECT 1 AS ok FROM login_tokens WHERE token_hash = ? AND used_at IS NULL AND expires_at > ?").bind(hash, now).first();

export async function createSession(db, hash, userId, expiresAt) {
  await db.prepare("INSERT INTO sessions (session_hash, user_id, expires_at) VALUES (?, ?, ?)").bind(hash, userId, expiresAt).run();
}
export const getSessionUser = (db, hash, now) =>
  db
    .prepare("SELECT u.id AS id, u.email AS email FROM sessions s JOIN users u ON u.id = s.user_id WHERE s.session_hash = ? AND s.expires_at > ?")
    .bind(hash, now)
    .first();
export const deleteSession = (db, hash) => db.prepare("DELETE FROM sessions WHERE session_hash = ?").bind(hash).run();
export const purgeExpired = (db, now) =>
  db.batch([
    db.prepare("DELETE FROM sessions WHERE expires_at <= ?").bind(now),
    db.prepare("DELETE FROM login_tokens WHERE expires_at <= ?").bind(now - 86400),
    db.prepare("DELETE FROM rate_limits WHERE window_start <= ?").bind(now - 86400),
  ]);

/** Counts a hit in a 15 minute window and returns the new count. */
export async function hit(db, key, now, windowSec = 900) {
  const ws = Math.floor(now / windowSec) * windowSec;
  const r = await db
    .prepare("INSERT INTO rate_limits (key, window_start, count) VALUES (?, ?, 1) ON CONFLICT(key, window_start) DO UPDATE SET count = count + 1 RETURNING count")
    .bind(key, ws)
    .first();
  return r.count;
}

// Webhook idempotency: an event is only skipped once it has been fully processed.
export async function startEvent(db, id, type, now) {
  await db.prepare("INSERT OR IGNORE INTO webhook_events (stripe_event_id, type, received_at) VALUES (?, ?, ?)").bind(id, type, now).run();
  const r = await db.prepare("SELECT processed_at FROM webhook_events WHERE stripe_event_id = ?").bind(id).first();
  return !r.processed_at; // true = needs processing
}
export const finishEvent = (db, id, now) => db.prepare("UPDATE webhook_events SET processed_at = ? WHERE stripe_event_id = ?").bind(now, id).run();

// Progress
export async function getProgress(db, userId) {
  const { results } = await db.prepare("SELECT lesson_id, completed_at FROM progress WHERE user_id = ?").bind(userId).all();
  const done = new Set();
  for (const r of results) if (r.completed_at) done.add(r.lesson_id);
  return done;
}
export const markViewed = (db, userId, lessonId, now) =>
  db
    .prepare("INSERT INTO progress (user_id, lesson_id, last_viewed_at) VALUES (?, ?, ?) ON CONFLICT(user_id, lesson_id) DO UPDATE SET last_viewed_at = excluded.last_viewed_at")
    .bind(userId, lessonId, now)
    .run();
export const setCompleted = (db, userId, lessonId, complete, now) =>
  db
    .prepare("INSERT INTO progress (user_id, lesson_id, completed_at, last_viewed_at) VALUES (?, ?, ?, ?) ON CONFLICT(user_id, lesson_id) DO UPDATE SET completed_at = excluded.completed_at")
    .bind(userId, lessonId, complete ? now : null, now)
    .run();

// Admin
export const getUserById = (db, id) => db.prepare("SELECT id, email, created_at FROM users WHERE id = ?").bind(id).first();
// ponytail: newest 500 learners, no paging or search; add both when the list outgrows one page.
export async function listLearners(db) {
  const { results } = await db
    .prepare(
      `SELECT u.id, u.email, u.created_at,
        (SELECT COUNT(*) FROM purchases p WHERE p.user_id = u.id AND p.status = 'active') AS active,
        (SELECT COUNT(*) FROM purchases p WHERE p.user_id = u.id) AS purchases,
        (SELECT COUNT(*) FROM progress g WHERE g.user_id = u.id AND g.completed_at IS NOT NULL) AS done,
        (SELECT MAX(last_viewed_at) FROM progress g WHERE g.user_id = u.id) AS last_seen
       FROM users u ORDER BY u.created_at DESC, u.id DESC LIMIT 500`,
    )
    .all();
  return results;
}
export async function getPurchases(db, userId) {
  const { results } = await db.prepare("SELECT status, source, created_at FROM purchases WHERE user_id = ? ORDER BY id DESC").bind(userId).all();
  return results;
}
export async function getProgressRows(db, userId) {
  const { results } = await db.prepare("SELECT lesson_id, completed_at, last_viewed_at FROM progress WHERE user_id = ?").bind(userId).all();
  return new Map(results.map((r) => [r.lesson_id, r]));
}
// The purchases table only allows active or refunded, so a revoke is stored as refunded.
export const revokeAccess = (db, userId) => db.prepare("UPDATE purchases SET status = 'refunded' WHERE user_id = ? AND status = 'active'").bind(userId).run();
