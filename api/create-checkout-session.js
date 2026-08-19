const Stripe = require('stripe');

const stripe = Stripe(process.env.STRIPE_SECRET_KEY);

module.exports = async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'Method not allowed' });
  }

  if (!process.env.STRIPE_SECRET_KEY) {
    console.error('STRIPE_SECRET_KEY is not set');
    return res.status(500).json({ error: 'Payment is not configured yet. Please try again later.' });
  }

  try {
    const origin = req.headers.origin || 'https://www.housesithub.com';

    // Base price is the real $67 price. The EARLYBIRD promotion code brings
    // it down to $47 for launch. We look up the code server-side so it can
    // be applied automatically, the customer never has to type it in.
    let discounts;
    try {
      const promo = await stripe.promotionCodes.list({
        code: 'EARLYBIRD',
        active: true,
        limit: 1,
      });
      if (promo.data.length > 0) {
        discounts = [{ promotion_code: promo.data[0].id }];
      } else {
        console.warn('EARLYBIRD promotion code not found or not active in this Stripe mode.');
      }
    } catch (promoErr) {
      console.error('Error looking up EARLYBIRD promotion code:', promoErr);
    }

    const session = await stripe.checkout.sessions.create({
      mode: 'payment',
      payment_method_types: ['card'],
      line_items: [
        {
          price_data: {
            currency: 'usd',
            product_data: {
              name: 'Learn How to House Sit',
              description: 'Lifetime access to all 5 modules, 29 lessons, checklists and templates, plus a free 30 minute 1-on-1 call.',
            },
            unit_amount: 6700,
          },
          quantity: 1,
        },
      ],
      // If the EARLYBIRD lookup above failed for any reason, still let the
      // customer type a code manually instead of silently charging $67.
      allow_promotion_codes: !discounts,
      discounts,
      success_url: `${origin}/thank-you.html?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${origin}/#pricing`,
    });

    return res.status(200).json({ url: session.url });
  } catch (err) {
    console.error('Stripe checkout session error:', err);
    return res.status(500).json({ error: 'Something went wrong starting checkout. Please try again.' });
  }
};
