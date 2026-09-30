// ============================================================================
// YASINDOORS — intro.js
// Bosh sahifaga kirganda bir martalik "eshik yasalyapti" animatsiyasi.
// Bir sessiyada faqat bir marta ko'rsatiladi (sessionStorage orqali).
// ============================================================================
(function () {
  var el = document.getElementById('introScreen');
  if (!el) return;

  var reduced = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var seen = false;
  try { seen = sessionStorage.getItem('yd_intro_seen') === '1'; } catch (e) {}

  if (seen || reduced) {
    el.remove();
    return;
  }
  try { sessionStorage.setItem('yd_intro_seen', '1'); } catch (e) {}

  document.documentElement.classList.add('intro-lock');

  var done = false;
  function hide() {
    if (done) return;
    done = true;
    el.classList.add('hide');
    document.documentElement.classList.remove('intro-lock');
    setTimeout(function () { if (el.parentNode) el.remove(); }, 500);
  }

  el.addEventListener('animationend', function (e) {
    if (e.target === el && e.animationName === 'introFadeOut') hide();
  });
  var skipBtn = document.getElementById('introSkip');
  if (skipBtn) skipBtn.addEventListener('click', hide);
  el.addEventListener('click', function (e) {
    if (e.target === el) hide();
  });
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape') hide();
  });

  // Xavfsizlik uchun: har qanday sababdan animatsiya to'xtab qolsa,
  // 6 soniyadan keyin baribir sayt ko'rinadi.
  setTimeout(hide, 8000);
})();
