# LMS handoff (read this first)

Own-build gated course for "Learn How to House Sit" (36 lessons, 5 modules), living inside the House Sit Hub site Worker. Code is in `lms/`, wired in at the top of `fetch()` in `src/worker.js` via `handleLms(request, env)`. Branch: `lms` (pushed). Owner: Matt. Read `lms/README.md` for the architecture and `LMS_Scope_Own_Build.md` (in Matt's Course Rebuild folder, not the repo) for the original scope.

## Rules (do not break)
1. Never run `npx wrangler deploy` and never merge `lms` into `main` without Matt saying so. `main` is the live site.
2. Secrets (Stripe signing secret, Resend API key, any Stripe key) are typed or pasted by Matt only. Do not ask him to paste them in chat and do not write them to files or commits.
3. Never use em dashes in any copy or docs. Matt wants verified facts, no guessing. Ask before assuming.
4. Wrangler prompts: answer NO to "add binding on your behalf" (it duplicates the D1 binding and reformats `wrangler.jsonc`). Windows: use `lms/scripts/run.mjs` wrappers (paths contain spaces).
5. Repo quirks: Windows `autocrlf=true`; keep LF in committed `wrangler.jsonc` and `src/worker.js`. A stale `.git/*.lock` may need deleting.

## What exists
- Passwordless login: magic links (15 min, single use, token hashes only; GET shows a confirm page, POST consumes), 30-day sessions (HttpOnly, Secure, SameSite Lax), origin checks, rate limits (5 per 15 min per email, 20 per 15 min per IP).
- Stripe webhook `/api/stripe-webhook`: HMAC signature check (300 s tolerance), idempotent events. Events needed: `checkout.session.completed`, `checkout.session.async_payment_succeeded`, `charge.refunded`. A full refund removes access.
- 36 lessons generated from the approved scripts (`src/content.generated.js`, built by `scripts/build_content.mjs`). Wistia ids go in `src/wistia.json` (currently `{}`).
- Downloads from R2 limited to the manifest in `src/files.js` (workbook plus checklists 01 to 19).
- CSP with `script-src 'none'`, Wistia frames only.
- 16 unit tests: `node --test lms/test/lms.test.mjs` (Node 22.13+).

## Cloudflare state
- Worker `housesithub`, account subdomain `closedlogic.workers.dev`. Git integration builds from `mattjstrydom/housesithub`. Production branch `main` (deploy command `npx wrangler deploy`). Preview builds ON for other branches (`npx wrangler preview`).
- Production D1 `housesithub-lms` id `e9a8fde7-6576-420e-b99f-c5493138ba6e`, migrated.
- Staging D1 `housesithub-lms-staging` id `57d89ee6-5d6b-4164-b06c-73abba81e626`, migrated (tables created from `lms/migrations/0001_init.sql`). The `previews` block in `wrangler.jsonc` points previews at staging.
- R2 bucket `housesithub-course-files` holds the workbook (root) and 19 checklists (`checklists/`). Previews share this bucket (read only use).
- Preview URL (verified live): https://lms-housesithub.closedlogic.workers.dev. `/login` loads, `/course` redirects to login when signed out, `/src/worker.js` is not served.
- `wrangler.jsonc`: preview `SITE_ORIGIN` is the preview URL; preview vars do NOT include `STRIPE_PUBLISHABLE_KEY` (top level holds the live key, so a Stripe TEST publishable key must be added under `previews.vars`).

## Not done yet (in order)
1. Preview secrets. Previews do not inherit production settings. Check Cloudflare's Previews docs for how to set secrets on a preview, then have Matt set `STRIPE_WEBHOOK_SECRET` and `RESEND_API_KEY` himself (and a Stripe test secret key if the code needs one; read `src/worker.js` for the exact names).
2. Resend: verify `housesithub.com` as a sending domain (SPF, DKIM, DMARC records in Cloudflare DNS), then create the API key. `EMAIL_FROM` is `House Sit Hub <course@housesithub.com>`.
3. Stripe test mode: create a test webhook to `https://lms-housesithub.closedlogic.workers.dev/api/stripe-webhook` with the three events above.
4. End to end test on the preview: test purchase, webhook, welcome/login email, magic link, lesson page, progress, download, full refund removes access.
5. Wistia: upload videos (final MP4s are in Matt's `Course Rebuild\Lessons\M?L?\M?L?_final.mp4`), add ids to `src/wistia.json`, test domain protection on the free plan.
6. Grant the one existing LearnPress student: `lms/scripts/grant.mjs` (production D1, after launch decision).
7. Copy: thank-you page, privacy policy and terms must mention the course accounts, login emails and Stripe/Resend/Wistia/Cloudflare. Draft for Matt to approve.
8. Launch decision (Matt's): merge to `main`, switch Stripe webhook to live mode with live secrets. After the first production deploy confirm `https://www.housesithub.com/src/worker.js` is not public (`.assetsignore` already excludes `src/`, `lms/`, `wrangler.jsonc`).

## Unverified assumptions (test these first)
- Stripe returns the buyer email in `customer_details.email` for Elements-based sessions. The webhook depends on it.
- Wistia domain-level protection works on Matt's plan.
- Resend SPF/DKIM/DMARC pass and mail lands in the inbox, not spam.
- Pages look right in a real browser (only fetched as text so far).
- Production D1 and R2 bindings resolve once deployed (only preview has been exercised).

## Housekeeping
- Matt should rotate a GitHub personal access token that leaked in an earlier transcript.
- Do not commit the unrelated mode/CRLF noise showing in `git status` on other files.
