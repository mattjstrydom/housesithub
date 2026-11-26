function json(status, body, extra) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "content-type": "application/json; charset=utf-8", ...(extra || {}) },
  });
}

const COURSE_PRODUCT_ID = "prod_UxeARD5xcwcojV";
const BF_ENDS_AT = Date.parse("2026-12-01T04:59:59Z"); // keep in sync with index.html

const SITE_ORIGIN = "https://www.housesithub.com";
// Cache the promo lookup so each click doesn't cost two Stripe round trips.
// ponytail: per-isolate cache, 5 min; a code created/disabled in Stripe takes up to 5 min to show.
let promoCache = { id: null, at: 0 };

async function findActivePromo(secret, code) {
  const promoRes = await fetch(
    "https://api.stripe.com/v1/promotion_codes?code=" + encodeURIComponent(code) + "&active=true&limit=1",
    { headers: { Authorization: "Bearer " + secret } },
  );
  if (!promoRes.ok) return null;
  const promo = await promoRes.json();
  if (promo.data && promo.data.length > 0) {
    return promo.data[0].id;
  }
  return null;
}

async function checkout(request, env) {
  if (request.method !== "POST") {
    return json(405, { error: "Method not allowed" }, { allow: "POST" });
  }
  const secret = env.STRIPE_SECRET_KEY;
  if (!secret) {
    return json(500, { error: "Payment is not configured yet. Please try again later." });
  }
  // Fixed origin: never build redirect URLs from a client-supplied header.
  // Localhost/preview origins fall back to the live site's return URLs.
  const origin = SITE_ORIGIN;
  const product = env.STRIPE_PRODUCT_ID || COURSE_PRODUCT_ID;
  const params = new URLSearchParams();
  params.set("mode", "payment");
  params.set("line_items[0][quantity]", "1");
  params.set("line_items[0][price_data][currency]", "usd");
  params.set("line_items[0][price_data][unit_amount]", "6700");
  params.set("line_items[0][price_data][product]", product);
  params.set("success_url", `${origin}/thank-you.html?session_id={CHECKOUT_SESSION_ID}`);
  params.set("cancel_url", `${origin}/#pricing`);
  try {
    if (Date.now() - promoCache.at > 5 * 60 * 1000) {
      const bf = await findActivePromo(secret, "BLACKFRIDAY");
      const id = bf || (await findActivePromo(secret, "EARLYBIRD"));
      if (!bf && Date.now() <= BF_ENDS_AT) {
        // The page advertises $10 during Black Friday; without this code the buyer sees a higher price.
        console.error("BLACKFRIDAY promotion code missing or inactive in Stripe; falling back to", id ? "EARLYBIRD" : "full price");
      }
      promoCache = { id, at: Date.now() };
    }
    const promoId = promoCache.id;
    if (promoId) {
      params.set("discounts[0][promotion_code]", promoId);
    } else {
      params.set("allow_promotion_codes", "true");
    }
  } catch {
    params.set("allow_promotion_codes", "true");
  }
  const res = await fetch("https://api.stripe.com/v1/checkout/sessions", {
    method: "POST",
    headers: {
      Authorization: "Bearer " + secret,
      "content-type": "application/x-www-form-urlencoded",
    },
    body: params,
  });
  const data = await res.json();
  if (!res.ok) {
    return json(500, { error: "Something went wrong starting checkout. Please try again." });
  }
  return json(200, { url: data.url });
}

// Confirms a Checkout Session was really paid, so the thank-you page only reports genuine purchases.
// Returns amount and currency only: no customer data leaves Stripe.
async function verifySession(request, env) {
  if (request.method !== "GET") return json(405, { error: "Method not allowed" }, { allow: "GET" });
  const id = new URL(request.url).searchParams.get("session_id") || "";
  if (!/^cs_(test|live)_[A-Za-z0-9]{10,200}$/.test(id) || !env.STRIPE_SECRET_KEY) {
    return json(400, { paid: false });
  }
  const res = await fetch("https://api.stripe.com/v1/checkout/sessions/" + id, {
    headers: { Authorization: "Bearer " + env.STRIPE_SECRET_KEY },
  });
  if (!res.ok) return json(404, { paid: false });
  const s = await res.json();
  return json(
    200,
    { paid: s.payment_status === "paid", value: (s.amount_total || 0) / 100, currency: (s.currency || "usd").toUpperCase() },
    { "cache-control": "no-store" },
  );
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    if (url.pathname === "/api/create-checkout-session") {
      return checkout(request, env);
    }
    if (url.pathname === "/api/verify-session") {
      return verifySession(request, env);
    }
    return env.ASSETS.fetch(request);
  },
};
