# LMS handoff (read this first)

Own-build gated course for "Learn How to House Sit" (36 lessons, 5 modules), living inside the House Sit Hub site Worker. Code is in `lms/`, wired in at the top of `fetch()` in `src/worker.js` via `handleLms(request, env)`. Owner: Matt. Read `lms/README.md` for the architecture and `LMS_Scope_Own_Build.md` (in Matt's Course Rebuild folder, not the repo) for the original scope.

**Status: LIVE on https://www.housesithub.com since 2026-11-28** (`main`, commit b391a7a at launch). Matt reported the live checkout, email and course flow working after launch.

## Rules (do not break)
1. `main` is the live site and deploys on push. Never run `npx wrangler deploy`. Only merge to `main` when Matt says so. Work on a branch and check the Cloudflare preview first.
2. Secrets (Stripe signing secret, Resend API key, any Stripe key) are typed or pasted by Matt only. Do not ask him to paste them in chat and do not write them to files or commits.
3. Never use em dashes in any copy or docs. Matt wants verified facts, no guessing. Ask before assuming.
4. Wrangler prompts: answer NO to "add binding on your behalf" (it duplicates the D1 binding and reformats `wrangler.jsonc`). Windows: use `lms/scripts/run.mjs` wrappers (paths contain spaces).
5. Repo quirks: Windows `autocrlf=true`; keep LF in committed `wrangler.jsonc` and `src/worker.js`. A stale `.git/*.lock` may need deleting. Do not commit the unrelated mode/CRLF noise in `git status`.

## What exists (all on `main`)
- Passwordless login: magic links (15 min, single use, token hashes only; GET shows a confirm page, POST consumes), 30 day sessions (HttpOnly, Secure, SameSite Lax), origin checks, rate limits (5 per 15 min per email, 20 per 15 min per IP).
- Stripe webhook `/api/stripe-webhook`: HMAC signature check, idempotent events. Events: `checkout.session.completed`, `checkout.session.async_payment_succeeded`, `charge.refunded`. A full refund removes access (stored as purchase status `refunded`).
- 36 lessons from the approved scripts (`src/content.generated.js`, built by `scripts/build_content.mjs`). Wistia ids for all 36 are in `src/wistia.json`. The transcript loads collapsed.
- Downloads from R2, limited to the manifest in `src/files.js` (workbook plus checklists 01 to 19).
- Admin dashboard: `/admin` (learners: access, lessons done, last seen), `/admin/user/<id>` (per lesson progress, purchases), grant and revoke (POST `/api/admin/grant`, `/api/admin/revoke`, origin checked). Admins are the emails in the `ADMIN_EMAILS` var in `wrangler.jsonc` (currently matt@housesithub.com); they use the normal magic link and need no purchase; everyone else gets a 404. Granting sends no email (the learner logs in at `/login`). A revoke is stored as `refunded` because the purchases CHECK only allows `active` or `refunded`. Grants are `source = 'manual'`. The list is capped at the newest 500 learners.
- Homepage: a Log in button in the nav and mobile menu. The buy buttons use the custom checkout (`USE_CUSTOM_CHECKOUT = true` in `index.html`; set it to `false` to roll back to the hosted Stripe page, which is also the automatic fallback). The thank-you button goes to `/course`.
- CSP: `script-src 'none'` on every page, Wistia frames only. Pages send `Referrer-Policy: no-referrer`, which caused two bugs, both fixed: browsers send `Origin: null` on form posts (`sameOrigin` falls back to `Sec-Fetch-Site`), and Wistia refused to embed with no referrer (the lesson iframe has `referrerpolicy="origin"`).
- 19 unit tests: `node --test lms/test/lms.test.mjs` (Node 22.13+).

## Cloudflare state
- Worker `housesithub`, account subdomain `closedlogic.workers.dev`. Git integration builds from `mattjstrydom/housesithub`. Production branch `main`. Preview builds are on for other branches (`npx wrangler preview`).
- Production D1 `housesithub-lms` id `e9a8fde7-6576-420e-b99f-c5493138ba6e`. Staging D1 `housesithub-lms-staging` id `57d89ee6-5d6b-4164-b06c-73abba81e626`; the `previews` block in `wrangler.jsonc` points previews at staging. Both migrated from `lms/migrations/0001_init.sql`.
- R2 bucket `housesithub-course-files` holds the workbook (root) and 19 checklists (`checklists/`). Previews share it.
- Production secrets (set by Matt): `STRIPE_SECRET_KEY`, `STRIPE_PRODUCT_ID`, `STRIPE_WEBHOOK_SECRET` (live endpoint), `RESEND_API_KEY`. `STRIPE_PUBLISHABLE_KEY`, `SITE_ORIGIN`, `EMAIL_FROM` and `ADMIN_EMAILS` are plain vars in `wrangler.jsonc`.
- Preview `lms` (https://lms-housesithub.closedlogic.workers.dev) has test secrets set per preview with `npx wrangler preview secret put NAME --name lms` (run from the repo root). Previews do not inherit production settings, and base-config secrets only reach previews created later. Other branch previews (for example `nav-login`) have no Stripe secrets, so checkout cannot be tested on them. `previews.vars` holds the test `STRIPE_PUBLISHABLE_KEY` and test `STRIPE_PRODUCT_ID`.
- Checkout on any preview still redirects to the hardcoded live `SITE_ORIGIN` thank-you page, so that page cannot be tested on a preview.
- Wistia: domain restriction is on with `housesithub.com` and the preview host. Add other preview hosts there if you test videos on them.

## Verified
End to end on the preview: test purchase, webhook, welcome email (inbox; SPF, DKIM and DMARC all PASS), magic link, session, lessons, progress, downloads, full refund removes access. The buyer email arrives in `customer_details.email`. Production: `/login` loads, `/src/worker.js`, `/lms/*` and `/wrangler.jsonc` return 404, the webhook rejects unsigned requests, and the production D1 binding responds.

## Open items
1. Grant the one existing LearnPress student on production with `lms/scripts/grant.mjs` (needs their email).
2. Copy: privacy policy and terms must mention course accounts, login emails and Stripe, Resend, Wistia and Cloudflare. Draft for Matt to approve.
3. Delete the duplicate or stale Stripe test webhook endpoint (a checkout event showed 2 deliveries).
4. Setup doc (`docs/checkout-setup.md`) items not done: a declined card test, and Apple Pay, Google Pay and Link enabled in Stripe (Apple Pay needs the domain verified).
5. Matt should rotate a GitHub personal access token that leaked in an earlier transcript.
6. Default video speed 1.25x: parked on branch `lms` (commit fed2a01, not merged). It adds Wistia's `E-v1.js` and `assets/js/lesson-video.js` (`_wq.push({ id: "_all", onReady: v => v.playbackRate(1.25) })`) on lesson pages only, with a relaxed `script-src`. Matt tested it on the preview and it still played at 1x. Wistia's docs do not document this call. The current `E-v1.js` does contain `_wq` and `playbackRate` and attaches to `iframe.wistia_embed` or `iframe[name=wistia_embed]`, which the iframe now has. The cause is not found. A diagnostic page test was started and abandoned. Next steps if resumed: check the browser console on a lesson for blocked requests, or try Wistia's Aurora player (`player.js` and `<wistia-player>`).

## Gotchas
- After a deploy, Cloudflare edges briefly serve the old pages. Check several times before concluding a deploy failed or worked.
- `/checkout.html` redirects to `/checkout` (`html_handling`); use `curl -L` when checking static pages.
