-- Gated course: students, purchases, login links, sessions, progress.
-- All times are unix seconds (UTC).
CREATE TABLE users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  email TEXT NOT NULL UNIQUE,            -- always lowercase
  created_at INTEGER NOT NULL
);

CREATE TABLE purchases (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL REFERENCES users(id),
  stripe_session_id TEXT UNIQUE,         -- null for manual grants
  stripe_payment_intent TEXT,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'refunded')),
  source TEXT NOT NULL DEFAULT 'stripe', -- 'stripe' or 'manual'
  created_at INTEGER NOT NULL
);
CREATE INDEX purchases_user ON purchases(user_id);
CREATE INDEX purchases_pi ON purchases(stripe_payment_intent);

CREATE TABLE login_tokens (
  token_hash TEXT PRIMARY KEY,           -- sha256 of the emailed token; the token itself is never stored
  user_id INTEGER NOT NULL REFERENCES users(id),
  expires_at INTEGER NOT NULL,
  used_at INTEGER
);

CREATE TABLE sessions (
  session_hash TEXT PRIMARY KEY,         -- sha256 of the cookie value
  user_id INTEGER NOT NULL REFERENCES users(id),
  expires_at INTEGER NOT NULL
);
CREATE INDEX sessions_user ON sessions(user_id);

CREATE TABLE progress (
  user_id INTEGER NOT NULL REFERENCES users(id),
  lesson_id TEXT NOT NULL,               -- e.g. m1l3
  completed_at INTEGER,                  -- null = viewed but not completed
  last_viewed_at INTEGER,
  PRIMARY KEY (user_id, lesson_id)
);

CREATE TABLE webhook_events (
  stripe_event_id TEXT PRIMARY KEY,
  type TEXT,
  received_at INTEGER NOT NULL,
  processed_at INTEGER                   -- null until fully handled, so a failed run is retried by Stripe
);

CREATE TABLE rate_limits (
  key TEXT NOT NULL,
  window_start INTEGER NOT NULL,
  count INTEGER NOT NULL,
  PRIMARY KEY (key, window_start)
);
