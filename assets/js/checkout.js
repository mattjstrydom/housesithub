/* Custom checkout: Stripe Elements on our own page (Checkout Sessions, ui_mode=elements).
   Prices always come from the Stripe session, never from this file. If anything fails to load,
   the visitor is sent to the hosted Stripe Checkout instead, so a problem here never blocks a sale. */
(function () {
  var REGULAR = 67;                                    // shown struck through only when a discount applies
  var BF_ENDS_AT = Date.parse('2026-12-01T04:59:59Z'); // keep in sync with index.html and the Worker
  var STRIPE_JS = 'https://js.stripe.com/endive/stripe.js';
  var $ = function (id) { return document.getElementById(id); };
  window.dataLayer = window.dataLayer || [];

  var els = {
    loading: $('co-loading'), form: $('co-form'), fallback: $('co-fallback'), error: $('co-error'),
    pay: $('co-pay'), total: $('co-total'), sumTotal: $('co-sum-total'), regular: $('co-regular'),
    rowRegular: $('co-row-regular'), rowDiscount: $('co-row-discount'), discount: $('co-discount'),
    timerWrap: $('co-timer-wrap'), timer: $('co-timer'), sum: $('co-sum')
  };

  // Summary open on desktop, collapsed (total still visible) on phones
  var mq = window.matchMedia('(min-width: 900px)');
  function syncSummary() { els.sum.open = mq.matches; }
  syncSummary();
  if (mq.addEventListener) mq.addEventListener('change', syncSummary);

  // Stripe formats amounts for the visitor's locale (for example "US$10,00"), so read the cents from it
  // and format the display ourselves. Prefer the numeric field if Stripe provides one.
  function cents(t) {
    if (!t) return null;
    if (typeof t.minorUnitsAmount === 'number') return t.minorUnitsAmount;
    var a = t.amount;
    if (typeof a === 'number') return a;
    var d = String(a == null ? '' : a).replace(/\D/g, '');
    return d ? parseInt(d, 10) : null;
  }
  var usd = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' });
  function money(dollars) { return usd.format(dollars); }

  function showError(msg) {
    els.error.textContent = msg || '';
    els.error.hidden = !msg;
  }

  // ---------- fallback to the hosted Stripe page ----------
  var fellBack = false;
  function hosted() {
    if (fellBack) return;
    fellBack = true;
    els.loading.hidden = true;
    els.form.hidden = true;
    els.fallback.hidden = false;
    fetch('/api/create-checkout-session', { method: 'POST' })
      .then(function (r) { return r.json(); })
      .then(function (d) { if (d && d.url) window.location.href = d.url; else throw new Error('no url'); })
      .catch(function () {
        els.fallback.innerHTML = '<p><strong>We couldn\'t start checkout.</strong></p><p>Please <a href="index.html#pricing">go back and try again</a>, or email <a href="mailto:help@housesithub.com">help@housesithub.com</a>.</p>';
      });
  }

  function loadScript(src, ms) {
    return new Promise(function (resolve, reject) {
      if (window.Stripe) return resolve();
      var s = document.createElement('script');
      var t = setTimeout(function () { reject(new Error('timeout')); }, ms);
      s.src = src;
      s.onload = function () { clearTimeout(t); resolve(); };
      s.onerror = function () { clearTimeout(t); reject(new Error('load')); };
      document.head.appendChild(s);
    });
  }

  // ---------- render the order from the Stripe session ----------
  var busy = false, tracked = false, latest = null;
  function render(session) {
    latest = session;
    var c = cents(session && session.total && session.total.total);
    if (c === null) return;
    var total = c / 100;
    var label = money(total);
    els.total.textContent = label;
    els.sumTotal.textContent = label;
    els.pay.textContent = busy ? 'Processing…' : 'Pay ' + label + ' and start the course';
    els.pay.disabled = busy || !session.canConfirm;

    var discounted = total !== null && total < REGULAR;
    els.rowRegular.hidden = !discounted;
    els.rowDiscount.hidden = !discounted;
    if (discounted) {
      els.regular.textContent = money(REGULAR);
      els.discount.textContent = '−' + money(REGULAR - total);
    }
    var live = discounted && Date.now() <= BF_ENDS_AT;
    els.timerWrap.hidden = !live;

    if (!tracked && total !== null) {
      tracked = true;
      window.dataLayer.push({ event: 'begin_checkout', currency: 'USD', value: total,
        items: [{ item_name: 'Learn How to House Sit', price: total, quantity: 1 }] });
    }
  }

  function tick() {
    var left = Math.max(0, BF_ENDS_AT - Date.now());
    var s = Math.floor(left / 1000), p = function (n) { return String(n).padStart(2, '0'); };
    var d = Math.floor(s / 86400), h = Math.floor((s % 86400) / 3600), m = Math.floor((s % 3600) / 60);
    els.timer.textContent = d > 0 ? d + 'd ' + p(h) + 'h ' + p(m) + 'm' : p(h) + ':' + p(m) + ':' + p(s % 60);
  }
  setInterval(tick, 1000);
  tick();

  // ---------- Stripe Elements ----------
  var appearance = {
    theme: 'stripe',
    variables: {
      colorPrimary: '#D63F45', colorBackground: '#ffffff', colorText: '#1D2A4D', colorDanger: '#B3261E',
      colorTextSecondary: '#56627F', fontFamily: 'Instrument Sans, system-ui, sans-serif',
      fontSizeBase: '16px', spacingUnit: '4px', borderRadius: '10px'
    },
    rules: {
      '.Input': { border: '1px solid rgba(29,42,77,0.22)', boxShadow: 'none', padding: '13px 14px' },
      '.Input:focus': { border: '1px solid #D63F45', boxShadow: '0 0 0 3px rgba(214,63,69,0.2)' },
      '.Label': { fontWeight: '600', color: '#1D2A4D' },
      '.Tab': { border: '1px solid rgba(29,42,77,0.22)', boxShadow: 'none' },
      '.Tab--selected': { border: '1px solid #D63F45', boxShadow: '0 0 0 3px rgba(214,63,69,0.2)' }
    }
  };
  var fonts = [{ cssSrc: 'https://fonts.googleapis.com/css2?family=Instrument+Sans:wght@400;500;600;700&display=swap' }];

  function start() {
    fetch('/api/checkout-session', { method: 'POST' })
      .then(function (r) { return r.ok ? r.json() : Promise.reject(new Error('session')); })
      .then(function (cfg) {
        if (!cfg || !cfg.clientSecret || !cfg.publishableKey) throw new Error('config');
        return loadScript(STRIPE_JS, 10000).then(function () {
          var stripe = window.Stripe(cfg.publishableKey);
          var checkout = stripe.initCheckoutElementsSdk({
            clientSecret: cfg.clientSecret,
            elementsOptions: { appearance: appearance, fonts: fonts }
          });
          return checkout.loadActions().then(function (res) {
            if (!res || res.type !== 'success') throw new Error('init');
            var actions = res.actions;
            checkout.createContactDetailsElement().mount('#contact-element');
            checkout.createPaymentElement().mount('#payment-element');
            els.loading.hidden = true;
            els.form.hidden = false;
            render(actions.getSession());
            checkout.on('change', render);

            els.form.addEventListener('submit', function (e) {
              e.preventDefault();
              if (busy || !latest || !latest.canConfirm) return;
              busy = true; showError(''); render(latest);
              actions.confirm().then(function (result) {
                // On success Stripe redirects to the thank-you page. We only get here on an error.
                if (result && result.type === 'error') {
                  busy = false;
                  showError((result.error && result.error.message) || 'Your payment could not be completed. Please check your details and try again.');
                  render(latest);
                  els.error.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
                }
              }).catch(function () {
                busy = false;
                showError('Something went wrong. Your card was not charged. Please try again.');
                render(latest);
              });
            });
          });
        });
      })
      .catch(function (err) { console.error('custom checkout unavailable:', err && err.message); hosted(); });
  }

  start();
})();
