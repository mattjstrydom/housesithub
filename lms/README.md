# House Sit Hub course site (LMS)

A small gated course site that runs inside your existing Cloudflare Worker. Students pay through Stripe, get an emailed
login link (no passwords), watch the 36 lessons (Wistia video plus a written transcript), mark lessons complete, and
download the workbook and checklists. Free plans only.

## What is here

| Path | What it does |
|---|---|
| `src/lms.js` | All the routes: Stripe webhook, login, login link, dashboard, lessons, progress, downloads, logout |
| `src/pages.js` | The pages (Sky and Coral styling, keyboard friendly, no JavaScript on the page) |
| `src/lib/` | Crypto, Stripe signature check, Resend email, all database queries |
| `src/content.generated.js` | The 36 lessons and transcripts, generated from the approved scripts |
| `src/wistia.json` | Lesson id to Wistia video id. Empty for now, so lessons show "video on its way" |
| `src/files.js` | The only files students can download |
| `migrations/0001_init.sql` | The database tables |
| `scripts/` | `build_content.mjs` (regenerate lessons), `grant.mjs` (give or remove access by hand), `upload_files.mjs` |
| `test/` | 16 automated tests |

## Tests

From this folder, `node --test test/lms.test.mjs` (needs Node 22.13 or newer, nothing to install). All 16 pass. They cover: pay, get email, log in;
bad or stale Stripe signatures; duplicate Stripe events; email failure then Stripe retry; reused, expired and pre-opened
login links; blocked access when logged out or with a forged cookie; full refund removes access, partial refund keeps it;
two devices at once; progress surviving logout; rate limits; posts from other sites; downloads only for listed files.
I also broke the refund rule on purpose to confirm the test fails when it should.

The tests use SQLite in place of Cloudflare D1. They have not been run against real D1, R2, Resend or Stripe.

## Set up, in order

1. **Resend.** Create an account, add your domain, add the SPF and DKIM records it shows, and add a DMARC record. Create an API key.
2. **Database.** `npx wrangler d1 create housesithub-lms`, paste the id into `wrangler.jsonc`. When Wrangler offers to add the binding to your config for you, answer no: the binding is already in the file. Then
   `npx wrangler d1 migrations apply housesithub-lms --remote`.
3. **File bucket.** First switch R2 on in the Cloudflare dashboard (open R2 in the sidebar and follow the prompts; until then Wrangler stops with error 10042 "Please enable R2"). Then `npx wrangler r2 bucket create housesithub-course-files`, then, from the repo root, `node lms\scripts\upload_files.mjs "<path to Course Rebuild>\Toolkit"`. Add `--dry-run` first to see what it would upload.
   `node scripts/upload_files.mjs "<path to Course Rebuild>\Toolkit"  (run from this folder)`.
4. **Secrets** (never in the repo): `npx wrangler secret put STRIPE_WEBHOOK_SECRET` and `npx wrangler secret put RESEND_API_KEY`.
5. **Stripe.** Add a webhook endpoint `https://www.housesithub.com/api/stripe-webhook` for the events
   `checkout.session.completed`, `checkout.session.async_payment_succeeded` and `charge.refunded`. Copy its signing secret into step 4.
6. **Code.** Already done on the `lms` branch: `src/worker.js` calls the course code, `wrangler.jsonc` has the database, bucket and routes, and `.assetsignore` keeps this folder from being served as static files. Put the real database id in `wrangler.jsonc` (step 2), then deploy the branch as a preview first. Login links in emails use `SITE_ORIGIN`, so on a preview URL the link still points at the live site unless you change that variable.
7. **Test in Stripe test mode** before going live: buy, get the email, log in, open a lesson, mark complete, refund, confirm access is gone.
8. **Wistia.** Upload the videos, turn on domain restriction, put each video's id in `src/wistia.json`, then test that a video will not play on another site.
9. **Existing student.** `node scripts/grant.mjs grant their@email.com`, then tell them to use /login.
10. **Site copy.** Update the thank-you page ("check your email for your login link"), the privacy policy and the terms (they now cover account data).

## Changing lessons

Edit the scripts, run `node scripts/build_content.mjs "path/to/Course Rebuild/Scripts"` from this folder, commit, deploy.

## Not yet verified or not built

- Never run on real Cloudflare D1 or R2, and no real email sent. First live test is step 7.
- Whether Stripe fills in the buyer's email for your Elements checkout sessions. The code reads `customer_details.email`. If a paid session has no email it is logged ("grant it by hand") and nothing is granted, so check this in test mode.
- Free plan limits (from Cloudflare's own pricing pages, updated 30 Oct 2026): D1 allows 5 million rows read and 100,000 rows written a day, 5 GB in total. R2 allows 10 GB stored, 1 million writes and 10 million reads a month, with no download fees. That is far more than a course with tens of students needs. The R2 page does not say whether a payment method must be on file to switch R2 on, so check that in the Cloudflare dashboard.
- Disputes and chargebacks do not remove access. Only a full refund does.
- Sessions last 30 days from login and are not extended while in use.
- Page appearance has not been checked in a browser yet. Run it with `npx wrangler dev` and look at it before launch.
- "Mark complete when the video ends" is not built.
