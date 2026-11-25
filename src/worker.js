function json(status, body, extra) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "content-type": "application/json; charset=utf-8", ...(extra || {}) },
  });
}

const COURSE_PRODUCT_ID = "prod_UxeARD5xcwcojV";

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
  const origin = request.headers.get("origin") || "https://www.housesithub.com";
  const product = env.STRIPE_PRODUCT_ID || COURSE_PRODUCT_ID;
  const params = new URLSearchParams();
  params.set("mode", "payment");
  params.append("payment_method_types[0]", "card");
  params.set("line_items[0][quantity]", "1");
  params.set("line_items[0][price_data][currency]", "usd");
  params.set("line_items[0][price_data][unit_amount]", "6700");
  params.set("line_items[0][price_data][product]", product);
  params.set("success_url", `${origin}/thank-you.html?session_id={CHECKOUT_SESSION_ID}`);
  params.set("cancel_url", `${origin}/#pricing`);
  try {
    const promoId =
      (await findActivePromo(secret, "BLACKFRIDAY")) ||
      (await findActivePromo(secret, "EARLYBIRD"));
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

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    if (url.pathname === "/api/create-checkout-session") {
      return checkout(request, env);
    }
    return env.ASSETS.fetch(request);
  },
};
