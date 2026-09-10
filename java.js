document.addEventListener('DOMContentLoaded', function () {

  // ---------- "Buyurtmalarimni Telegramda ko'rish" havolalari ----------
  // Botga umumiy start havolasi bilan o'tadi (?start=my_orders); bot mijozdan
  // telefon raqamini (tugma orqali) so'rab, o'sha raqamga tegishli barcha
  // buyurtmalarni topib chiroyli qilib chiqarib beradi.
  (function () {
    var botUsername = window.TELEGRAM_BOT_USERNAME;
    var ready = botUsername && String(botUsername).indexOf('BU_YERGA') === -1;
    var href = ready ? ('https://t.me/' + String(botUsername).replace(/^@/, '') + '?start=my_orders') : null;

    document.querySelectorAll('.telegram-orders-link').forEach(function (el) {
      var wrapCard = el.closest('.telegram-orders-card');
      if (ready) {
        el.href = href;
        el.target = '_blank';
        el.rel = 'noopener';
        el.style.display = 'flex';
        if (wrapCard) wrapCard.style.display = 'block';
      } else {
        el.style.display = 'none';
        if (wrapCard) wrapCard.style.display = 'none';
      }
    });
  })();

  // ---------- Telefon raqam maydoni: faqat 9 ta raqam, avtomatik bo'shliqlar (+998 alohida ko'rsatiladi) ----------
  function setupPhoneInput(el) {
    if (!el) return;
    el.addEventListener('input', function () {
      var digits = el.value.replace(/\D/g, '').slice(0, 9);
      var parts = [];
      if (digits.length > 0) parts.push(digits.slice(0, 2));
      if (digits.length > 2) parts.push(digits.slice(2, 5));
      if (digits.length > 5) parts.push(digits.slice(5, 7));
      if (digits.length > 7) parts.push(digits.slice(7, 9));
      el.value = parts.join(' ');
    });
    // Faqat raqam va navigatsiya tugmalarini ruxsat berish (Backspace, Tab, strelkalar va h.k.)
    el.addEventListener('keydown', function (e) {
      var allowedKeys = ['Backspace', 'Delete', 'Tab', 'ArrowLeft', 'ArrowRight', 'Home', 'End'];
      if (allowedKeys.indexOf(e.key) !== -1 || e.ctrlKey || e.metaKey) return;
      if (!/^[0-9]$/.test(e.key)) e.preventDefault();
    });
  }

  ['loginPhone', 'regPhone', 'ordPhone'].forEach(function (id) {
    setupPhoneInput(document.getElementById(id));
  });

  // Inputdagi "90 123 45 67" ko'rinishidagi qiymatni "+998901234567" ga aylantiradi
  function getFullPhone(el) {
    var digits = el ? el.value.replace(/\D/g, '') : '';
    return '+998' + digits;
  }

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

    var ordColorView = document.getElementById('ordColorView');
    if (ordColorView) ordColorView.textContent = sw.dataset.name;

    // Buyurtma sahifasidagi eshik rasmini (thumbnail) tanlangan rangga bo'yash
    var thumbHost = document.getElementById('ordThumb');
    if (thumbHost) {
      var thumbSvg = thumbHost.querySelector('svg');
      var baseRect = thumbSvg ? thumbSvg.querySelector('rect') : null;
      if (baseRect) baseRect.setAttribute('fill', color);
    }
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
      // Agar foydalanuvchi aynan "Buyurtma →" havolasini yoki "sevimli" yurak tugmasini bossa,
      // ularning o'z ishlovchisi ishlaydi — kartochkani butunlay bosish bilan aralashtirmaymiz
      if (e.target.closest('a') || e.target.closest('button')) return;
      window.location.href = orderLink.getAttribute('href');
    });
  });

  // ---------- Tizimga kirish / Ro'yxatdan o'tish formalari ----------
  // ESLATMA: bu yerda haqiqiy autentifikatsiya (parolni serverda tekshirish) yo'q —
  // forma ism/telefon/kod ma'lumotini Google Sheets'ga yuboradi (lid sifatida)
  // va modal oynani yopadi.
  function sendToSheets(payload) {
    var url = window.SHEETS_WEBHOOK_URL;
    if (!url || url.indexOf('BU_YERGA') !== -1) {
      console.error('Google Sheets sozlanmagan: sheets-config.js faylida SHEETS_WEBHOOK_URL kiriting.');
      return;
    }
    fetch(url, {
      method: 'POST',
      mode: 'no-cors', // Google Apps Script javobini o'qimaymiz, faqat yuboramiz
      headers: { 'Content-Type': 'text/plain' },
      body: JSON.stringify(payload)
    }).catch(function (err) { console.error('Sheets xatoligi:', err); });
  }

  var loginFormEl = document.getElementById('loginForm');
  if (loginFormEl) {
    loginFormEl.addEventListener('submit', function (e) {
      e.preventDefault();
      var phoneEl = document.getElementById('loginPhone');
      var codeEl = document.getElementById('loginPassword');
      if (phoneEl && phoneEl.value.replace(/\D/g, '').length !== 9) {
        phoneEl.classList.add('is-invalid');
        phoneEl.focus();
        return;
      }
      if (phoneEl) phoneEl.classList.remove('is-invalid');
      sendToSheets({
        type: 'login',
        phone: getFullPhone(phoneEl),
        code: codeEl ? codeEl.value : '',
        page: window.location.pathname
      });
      var modalEl = loginFormEl.closest('.modal');
      if (modalEl && window.bootstrap) {
        window.bootstrap.Modal.getOrCreateInstance(modalEl).hide();
      }
      loginFormEl.reset();
    });
  }

  var registerFormEl = document.getElementById('registerForm');
  if (registerFormEl) {
    registerFormEl.addEventListener('submit', function (e) {
      e.preventDefault();
      var nameEl = document.getElementById('regName');
      var phoneEl = document.getElementById('regPhone');
      var codeEl = document.getElementById('regPassword');
      if (phoneEl && phoneEl.value.replace(/\D/g, '').length !== 9) {
        phoneEl.classList.add('is-invalid');
        phoneEl.focus();
        return;
      }
      if (phoneEl) phoneEl.classList.remove('is-invalid');
      sendToSheets({
        type: 'register',
        name: nameEl ? nameEl.value.trim() : '',
        phone: getFullPhone(phoneEl),
        code: codeEl ? codeEl.value : '',
        page: window.location.pathname
      });
      var modalEl = registerFormEl.closest('.modal');
      if (modalEl && window.bootstrap) {
        window.bootstrap.Modal.getOrCreateInstance(modalEl).hide();
      }
      registerFormEl.reset();
    });
  }

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

  // ---------- Desktop katalog: nomi/naqshi bo'yicha real vaqtda qidiruv ----------
  var katSearch = document.getElementById('katSearch');
  var katGrid = document.getElementById('katGrid');
  var katEmpty = document.getElementById('katEmpty');

  if (katSearch && katGrid) {
    function katFilter(query) {
      var q = query.trim().toLowerCase();
      var cards = katGrid.querySelectorAll('.model-card');
      var visibleCount = 0;
      cards.forEach(function (card) {
        var hay = (card.dataset.search || card.textContent || '').toLowerCase();
        var match = !q || hay.indexOf(q) !== -1;
        var col = card.closest('[class*="col-"]') || card;
        col.style.display = match ? '' : 'none';
        if (match) visibleCount++;
      });
      if (katEmpty) katEmpty.style.display = visibleCount === 0 ? 'block' : 'none';
    }

    var katQParam = new URLSearchParams(window.location.search).get('q');
    if (katQParam) {
      katSearch.value = katQParam;
      katFilter(katQParam);
    }
    katSearch.addEventListener('input', function () { katFilter(katSearch.value); });
  }

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

  // ---------- Bosh sahifadagi qidiruv katalogga yo'naltiradi (desktop) ----------
  var homeSearch = document.getElementById('homeSearch');
  if (homeSearch) {
    homeSearch.addEventListener('keydown', function (e) {
      if (e.key === 'Enter') {
        e.preventDefault();
        var v = homeSearch.value.trim();
        window.location.href = 'katalog.html' + (v ? '?q=' + encodeURIComponent(v) : '');
      }
    });
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

  // ---------- "Saqlash" (yurak) tugmasi — mahalliy vizual belgi (mobil market VA desktop katalog) ----------
  document.querySelectorAll('.mp-heart, .model-heart').forEach(function (btn) {
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