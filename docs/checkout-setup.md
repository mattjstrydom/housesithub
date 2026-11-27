# Custom checkout: setup and go-live

`checkout.html` is a branded payment page built on Stripe Elements (Checkout Sessions, `ui_mode=elements`).
It sells the same product at the same price and applies the same BLACKFRIDAY / EARLYBIRD code as before.
Until you flip the switch below, the site still sends buyers to the hosted Stripe page.

## 1. Add the publishable key (once)
Cloudflare dashboard > Workers & Pages > housesithub > Settings > Variables and Secrets:
- `STRIPE_PUBLISHABLE_KEY` = your `pk_live_...` key (it is public by design).
`STRIPE_SECRET_KEY` is already set. Without the publishable key, `checkout.html` falls back to the hosted page on its own.

## 2. Test it in Stripe test mode first
1. Temporarily set test keys (`pk_test_...`, `sk_test_...`) on a preview deployment, or in a separate test Worker.
2. Open `/checkout.html` and pay with card `4242 4242 4242 4242`, any future date, any CVC.
3. Check: price shows $10.00 with the $57.00 discount, you land on `/thank-you.html`, the course email arrives, the `purchase` event fires once.
4. Try a declined card (`4000 0000 0000 0002`): the error shows on the page, nothing is charged.

## 3. Things to confirm in Stripe
- **Fulfilment still triggers.** The session still ends as a Checkout Session, so `checkout.session.completed` fires as before. Confirm whichever tool sends the course login (webhook, Zapier, Make) still receives it.
- **Wallets and Link.** Dashboard > Settings > Payment methods: turn on Apple Pay, Google Pay and Link. Apple Pay also needs the domain verified (Settings > Payment method domains).
- Two items in the Stripe docs I could not verify: the Express Checkout button (this page uses the Payment Element, which already offers wallets) and the exact client-side discount fields. The page reads totals from the session and shows the discount as regular price minus total.

## 4. Go live
In `index.html`, change `const USE_CUSTOM_CHECKOUT = false;` to `true`, commit and push.

## Roll back
Set it back to `false`. The hosted flow (`/api/create-checkout-session`) is untouched.

## Not built (on purpose)
No order bump or upsell, no discount-code box (the code is applied automatically), no rate limiting on the session endpoint. Add Cloudflare rate limiting if you see abuse.
