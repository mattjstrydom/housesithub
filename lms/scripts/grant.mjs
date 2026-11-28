// Give or take away access by hand (for example the one existing LearnPress student, or a refund done outside Stripe).
//   node scripts/grant.mjs grant  student@example.com [--local]
//   node scripts/grant.mjs revoke student@example.com [--local]
// After a grant, tell the student to go to /login and enter that email to get their link.
import { spawnSync } from "node:child_process";

const [action, rawEmail, flag] = process.argv.slice(2);
const email = String(rawEmail || "").trim().toLowerCase();
if (!["grant", "revoke"].includes(action) || !/^[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}$/.test(email)) {
  console.error("Usage: node scripts/grant.mjs grant|revoke email@example.com [--local]");
  process.exit(1);
}
const e = email.replace(/'/g, "''"); // the pattern above already rules out quotes; kept as a second guard
const sql =
  action === "grant"
    ? `INSERT OR IGNORE INTO users (email, created_at) VALUES ('${e}', strftime('%s','now'));
       INSERT INTO purchases (user_id, source, status, created_at) SELECT id, 'manual', 'active', strftime('%s','now') FROM users WHERE email = '${e}';`
    : `UPDATE purchases SET status = 'refunded' WHERE user_id = (SELECT id FROM users WHERE email = '${e}');`;
const r = spawnSync("npx", ["wrangler", "d1", "execute", "housesithub-lms", flag === "--local" ? "--local" : "--remote", "--command", sql], { stdio: "inherit", shell: process.platform === "win32" });
process.exit(r.status ?? 1);
