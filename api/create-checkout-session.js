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

    const session = await stripe.checkout.sessions.create({
      mode: 'payment',
      payment_method_types: ['card'],
      line_items: [
        {
          price_data: {
            currency: 'usd',
            product_data: {
              name: 'Learn How to House Sit — Limited Launch Price',
              description: 'Lifetime access to all 5 modules, 29 lessons, checklists and templates, plus a free 30 minute 1-on-1 call.',
            },
            unit_amount: 4700,
          },
          quantity: 1,
        },
      ],
      allow_promotion_codes: true,
      success_url: `${origin}/thank-you.html?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${origin}/#pricing`,
    });

    return res.status(200).json({ url: session.url });
  } catch (err) {
    console.error('Stripe checkout session error:', err);
    return res.status(500).json({ error: 'Something went wrong starting checkout. Please try again.' });
  }
};
