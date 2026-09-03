document.addEventListener('DOMContentLoaded', function () {

  // ---------- Rang tanlash (swatch) ----------
  var swatchRow = document.getElementById('swatchRow');
  var root = document.documentElement;
  var finishName = document.getElementById('finishName');
  var finishCode = document.getElementById('finishCode');
  var finishPreview = document.getElementById('finishPreview');

  function getContrastColor(hex) {
    hex = hex.replace('#', '');
    var r = parseInt(hex.substring(0, 2), 16);
    var g = parseInt(hex.substring(2, 4), 16);
    var b = parseInt(hex.substring(4, 6), 16);
    var brightness = (r * 299 + g * 587 + b * 114) / 1000;
    return brightness > 165 ? '#1a1510' : '#ffffff';
  }

  function selectSwatch(sw) {
    if (!sw || !sw.classList.contains('swatch')) return;

    var all = swatchRow.querySelectorAll('.swatch');
    all.forEach(function (s) { s.classList.remove('active'); });
    sw.classList.add('active');

    var color = sw.dataset.color;
    var dark = sw.dataset.dark;

    root.style.setProperty('--door-color', color);
    root.style.setProperty('--door-color-dark', dark);
    sw.style.setProperty('--check-color', getContrastColor(color));

    if (finishName) finishName.textContent = sw.dataset.name;
    if (finishCode) finishCode.textContent = color.toUpperCase();
    if (finishPreview) finishPreview.style.background = color;
  }

  if (swatchRow) {
    // Event delegatsiya — ota elementga bitta listener, barcha rang doiralari uchun ishlaydi
    swatchRow.addEventListener('click', function (e) {
      var sw = e.target.closest ? e.target.closest('.swatch') : null;
      selectSwatch(sw);
    });

    var initialActive = swatchRow.querySelector('.swatch.active');
    if (initialActive) {
      initialActive.style.setProperty('--check-color', getContrastColor(initialActive.dataset.color));
    }
  }

  // ---------- Och / to'q rejim almashtirish ----------
  var themeToggle = document.getElementById('themeToggle');
  var htmlEl = document.documentElement;

  function applyTheme(theme) {
    htmlEl.setAttribute('data-theme', theme);
    try { localStorage.setItem('yasindoors-theme', theme); } catch (e) {}
  }

  var savedTheme = 'dark';
  try { savedTheme = localStorage.getItem('yasindoors-theme') || 'dark'; } catch (e) {}
  applyTheme(savedTheme);

  if (themeToggle) {
    themeToggle.addEventListener('click', function () {
      var current = htmlEl.getAttribute('data-theme');
      applyTheme(current === 'dark' ? 'light' : 'dark');
    });
  }

  // ---------- Katalog kartochkasini bosilganda modelni tanlab, buyurtma sahifasiga o'tish ----------
  document.querySelectorAll('.model-card').forEach(function (card) {
    var orderLink = card.querySelector('.model-price a');
    if (!orderLink) return;

    card.style.cursor = 'pointer';
    card.addEventListener('click', function (e) {
      // Agar foydalanuvchi aynan "Buyurtma →" havolasini bossa, uning o'z navigatsiyasi ishlaydi
      if (e.target.closest('a')) return;
      window.location.href = orderLink.getAttribute('href');
    });
  });

  // ---------- Tizimga kirish / Ro'yxatdan o'tish formalari ----------
  // ESLATMA: hozircha backend ulanmagan — forma faqat modal oynani yopadi.
  // Server tayyor bo'lganda shu joyga haqiqiy so'rov (fetch) qo'shiladi.
  ['loginForm', 'registerForm'].forEach(function (id) {
    var form = document.getElementById(id);
    if (!form) return;
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      var modalEl = form.closest('.modal');
      if (modalEl && window.bootstrap) {
        var modal = window.bootstrap.Modal.getOrCreateInstance(modalEl);
        modal.hide();
      }
      form.reset();
    });
  });

  // ---------- Bitta modal ichida "Tizimga kirish" / "Ro'yxatdan o'tish" o'rtasida almashish ----------
  document.querySelectorAll('.auth-tab-btn').forEach(function (btn) {
    btn.addEventListener('click', function () {
      var targetTab = this.dataset.tab;

      document.querySelectorAll('.auth-tab-btn').forEach(function (b) {
        b.classList.toggle('active', b === btn);
      });
      document.querySelectorAll('.auth-panel').forEach(function (panel) {
        panel.classList.toggle('active', panel.dataset.panel === targetTab);
      });
    });
  });

  // ---------- Mobil market: katalogda nomi/naqshi bo'yicha real vaqtda qidiruv ----------
  var mpSearch = document.getElementById('mpSearch');
  var mpGrid = document.getElementById('mpGrid') || document.querySelector('.mp-grid');
  var mpEmpty = document.getElementById('mpEmpty');

  function mpFilter(query) {
    if (!mpGrid) return;
    var q = query.trim().toLowerCase();
    var cards = mpGrid.querySelectorAll('.mp-card');
    var visibleCount = 0;
    cards.forEach(function (card) {
      var hay = (card.dataset.search || card.textContent || '').toLowerCase();
      var match = !q || hay.indexOf(q) !== -1;
      card.style.display = match ? '' : 'none';
      if (match) visibleCount++;
    });
    if (mpEmpty) mpEmpty.classList.toggle('show', visibleCount === 0);
  }

  if (mpSearch) {
    // Sahifa manzilidagi ?q= parametrini o'qib, qidiruvni oldindan to'ldirish (bosh sahifadan yo'naltirilganda)
    var qParam = new URLSearchParams(window.location.search).get('q');
    if (qParam) {
      mpSearch.value = qParam;
      mpFilter(qParam);
    }
    mpSearch.addEventListener('input', function () { mpFilter(mpSearch.value); });
  }

  // ---------- Mobil market: bosh sahifadagi qidiruv katalogga yo'naltiradi ----------
  var mpHomeSearch = document.getElementById('mpHomeSearch');
  if (mpHomeSearch) {
    mpHomeSearch.addEventListener('keydown', function (e) {
      if (e.key === 'Enter') {
        e.preventDefault();
        var v = mpHomeSearch.value.trim();
        window.location.href = 'katalog2.html' + (v ? '?q=' + encodeURIComponent(v) : '');
      }
    });
  }

  // ---------- Mobil market: "saqlash" (yurak) tugmasi — mahalliy vizual belgi ----------
  document.querySelectorAll('.mp-heart').forEach(function (btn) {
    btn.addEventListener('click', function (e) {
      e.preventDefault();
      e.stopPropagation();
      btn.classList.toggle('saved');
    });
  });

  // ---------- Mobil market: pastki tab-navigatsiyada joriy sahifani faollashtirish ----------
  var mpTabbar = document.querySelector('.mp-tabbar');
  if (mpTabbar) {
    var currentPage = document.documentElement.getAttribute('data-page');
    var pageToTabHref = { index: 'index2.html', katalog: 'katalog2.html', buyurtma: 'buyurtma2.html' };
    var expectedHref = pageToTabHref[currentPage];
    if (expectedHref) {
      mpTabbar.querySelectorAll('.mp-tab').forEach(function (tab) {
        tab.classList.toggle('active', tab.getAttribute('href') === expectedHref);
      });
    }
  }

});