// TEMPORARY diagnostic, delete after use.
setTimeout(function () {
  var out = { wistia: typeof window.Wistia, wq: window._wq ? window._wq.length : null };
  try { var v = window.Wistia && Wistia.api && Wistia.api("jie6bu6n9d"); out.api = !!v; out.rate = v && v.playbackRate ? v.playbackRate() : null; } catch (e) { out.err = String(e); }
  document.getElementById("out").textContent = JSON.stringify(out);
}, 8000);
