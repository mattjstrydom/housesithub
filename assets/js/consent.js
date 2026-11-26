/* Cookie consent: Google Tag Manager (and everything it loads, incl. the Meta Pixel) only starts after "Accept".
   The choice is stored in localStorage. Footer link [data-consent-open] reopens the banner. */
(function () {
  var GTM_ID = 'GTM-WTQ2BRSJ', KEY = 'hsh_consent';
  window.dataLayer = window.dataLayer || [];

  function read() { try { return localStorage.getItem(KEY); } catch (e) { return null; } }
  function write(v) { try { localStorage.setItem(KEY, v); } catch (e) {} }

  function loadGTM() {
    if (window.__gtmLoaded) return;
    window.__gtmLoaded = true;
    window.dataLayer.push({ 'gtm.start': new Date().getTime(), event: 'gtm.js' });
    var s = document.createElement('script');
    s.async = true;
    s.src = 'https://www.googletagmanager.com/gtm.js?id=' + GTM_ID;
    document.head.appendChild(s);
  }

  function closeBanner() {
    var b = document.getElementById('consent-banner');
    if (b) b.remove();
  }

  function openBanner() {
    if (document.getElementById('consent-banner')) return;
    var b = document.createElement('div');
    b.id = 'consent-banner';
    b.setAttribute('role', 'dialog');
    b.setAttribute('aria-label', 'Cookie consent');
    b.innerHTML =
      '<p>We use cookies for analytics and advertising measurement. Choose whether to allow them. ' +
      '<a href="privacy-policy.html">Privacy policy</a></p>' +
      '<div class="consent-actions"><button type="button" class="btn" data-consent="granted">Accept</button>' +
      '<button type="button" class="btn btn-ghost on-paper" data-consent="denied">Decline</button></div>';
    b.addEventListener('click', function (e) {
      var v = e.target && e.target.getAttribute && e.target.getAttribute('data-consent');
      if (!v) return;
      write(v);
      closeBanner();
      if (v === 'granted') loadGTM();
    });
    document.body.appendChild(b);
  }

  var saved = read();
  if (saved === 'granted') loadGTM();
  function init() {
    if (saved === null) openBanner();
    document.addEventListener('click', function (e) {
      var t = e.target && e.target.closest && e.target.closest('[data-consent-open]');
      if (t) { e.preventDefault(); openBanner(); }
    });
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init); else init();
})();
