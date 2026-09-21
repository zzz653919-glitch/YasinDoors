// ============================================================================
// YASINDOORS — savat.js
// Barcha sahifalarda ulanadi. Vazifalari:
//  1) Savat ma'lumotlarini brauzerda (localStorage) saqlash — window.YDCart
//  2) Eshik rasmini (karona, qulf, ruchka, petlya bilan) chizish — YDCart.doorSvg()
//  3) Navbar / pastki tab-navigatsiyaga "Savat" havolasi va sonini qo'shish
//  4) Katalogdagi model kartalarini model.html ga yo'naltirish
// ============================================================================
(function () {
  var KEY = 'yd_cart_v1';

  // Tayyor bo'lish muddati (kunlarda). O'zgartirish kerak bo'lsa — faqat shu yerda.
  var DELIVERY = { min: 30, max: 40 };
  var DEPOSIT_RATE = 0.2;

  var MONTHS = ['yanvar', 'fevral', 'mart', 'aprel', 'may', 'iyun', 'iyul', 'avgust',
                'sentyabr', 'oktyabr', 'noyabr', 'dekabr'];

  // ---------- Saqlash ----------
  function read() {
    try {
      var a = JSON.parse(localStorage.getItem(KEY) || '[]');
      return Array.isArray(a) ? a : [];
    } catch (e) { return []; }
  }
  function write(items) {
    try { localStorage.setItem(KEY, JSON.stringify(items)); } catch (e) {}
    refreshBadges();
    document.dispatchEvent(new CustomEvent('yd-cart-change'));
  }

  function unitPrice(item) {
    var s = item.base || 0;
    (item.lines || []).forEach(function (l) { s += l.price || 0; });
    return s;
  }
  function lineTotal(item) { return unitPrice(item) * (item.qty || 1); }
  function total(items) {
    return (items || read()).reduce(function (s, it) { return s + lineTotal(it); }, 0);
  }
  function count() {
    return read().reduce(function (s, it) { return s + (it.qty || 1); }, 0);
  }
  function signature(item) {
    return JSON.stringify([item.model, item.size, item.color, item.sel, item.lines]);
  }

  function add(item) {
    var items = read();
    var sig = signature(item);
    var found = null;
    items.forEach(function (it) { if (signature(it) === sig) found = it; });
    if (found) {
      found.qty = Math.min(50, (found.qty || 1) + (item.qty || 1));
    } else {
      item.uid = 'c' + Date.now().toString(36) + Math.floor(Math.random() * 1000).toString(36);
      item.qty = item.qty || 1;
      items.push(item);
    }
    write(items);
  }
  function remove(uid) { write(read().filter(function (it) { return it.uid !== uid; })); }
  function setQty(uid, qty) {
    var items = read();
    items.forEach(function (it) { if (it.uid === uid) it.qty = Math.max(1, Math.min(50, qty)); });
    write(items);
  }
  function clear() { write([]); }

  // ---------- Formatlash ----------
  function formatSom(n) {
    return Math.round(n || 0).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ' ') + " so'm";
  }
  function fmtDate(d, withYear) {
    return d.getDate() + ' ' + MONTHS[d.getMonth()] + (withYear ? ' ' + d.getFullYear() : '');
  }
  // Bugun buyurtma berilsa, tayyor bo'lish oralig'i: "21 oktyabr – 31 oktyabr 2026"
  function deliveryRangeText(from) {
    var start = new Date(from || new Date());
    var a = new Date(start); a.setDate(a.getDate() + DELIVERY.min);
    var b = new Date(start); b.setDate(b.getDate() + DELIVERY.max);
    var sameYear = a.getFullYear() === b.getFullYear();
    return fmtDate(a, !sameYear) + ' – ' + fmtDate(b, true);
  }

  // ---------- Eshik rasmi (karona / qulf / ruchka / petlya bilan) ----------
  function shade(hex, percent) {
    var f = parseInt(hex.slice(1), 16), t = percent < 0 ? 0 : 255, p = Math.abs(percent) / 100;
    var R = f >> 16, G = f >> 8 & 0xFF, B = f & 0xFF;
    var r = Math.round((t - R) * p) + R, g = Math.round((t - G) * p) + G, b = Math.round((t - B) * p) + B;
    return '#' + (0x1000000 + r * 0x10000 + g * 0x100 + b).toString(16).slice(1);
  }

  var FRAME_PATHS = {
    klassik: 'M2 210 V2 H118 V210 H110 V10 H10 V210 Z',
    modern:  'M5 210 V5 H115 V210 H110 V10 H10 V210 Z',
    minimal: 'M7 210 V7 H113 V210 H110 V10 H10 V210 Z'
  };
  var HINGE_Y = { '2': [40, 180], '3': [40, 110, 180], '4': [40, 90, 140, 180] };

  // model — YD_MODELS elementi; sel — { karona, qulf, ruchka, petlya, hex }
  function doorSvg(model, sel) {
    sel = sel || {};
    var host = document.createElement('div');
    host.innerHTML = model.thumb;
    var svg = host.querySelector('svg');
    var base = svg.querySelector('rect');
    if (sel.hex) base.setAttribute('fill', sel.hex);
    var baseColor = base.getAttribute('fill') || '#7a4a20';

    var frame = '';
    if (FRAME_PATHS[sel.karona]) {
      frame += '<path d="' + FRAME_PATHS[sel.karona] + '" fill="' + shade(baseColor, -30) + '"/>';
      if (sel.karona === 'klassik') {
        frame += '<path d="M4.5 210 V4.5 H115.5 V210" fill="none" stroke="rgba(201,164,76,.6)" stroke-width="1"/>';
      }
    }

    var hw = '';
    var gold = '#c9a44c';
    (HINGE_Y[sel.petlya || '2'] || HINGE_Y['2']).forEach(function (y) {
      hw += '<rect x="7" y="' + (y - 6) + '" width="7" height="12" rx="1.5" fill="#b48a3f" stroke="rgba(0,0,0,.35)" stroke-width=".6"/>';
    });
    if (sel.ruchka === 'klassik') hw += '<rect x="95" y="102" width="5" height="30" rx="2.5" fill="' + gold + '"/>';
    else if (sel.ruchka === 'modern') hw += '<rect x="86" y="112" width="18" height="5" rx="2.5" fill="' + gold + '"/>';
    else if (sel.ruchka === 'minimal') hw += '<circle cx="98" cy="114" r="4.5" fill="' + gold + '"/>';

    if (sel.qulf === 'oddiy') {
      hw += '<circle cx="98" cy="142" r="3.4" fill="#2a2018" stroke="' + gold + '" stroke-width="1"/>';
    } else if (sel.qulf === 'ikki') {
      hw += '<circle cx="98" cy="142" r="3.4" fill="#2a2018" stroke="' + gold + '" stroke-width="1"/>' +
            '<circle cx="98" cy="154" r="3.4" fill="#2a2018" stroke="' + gold + '" stroke-width="1"/>';
    } else if (sel.qulf === 'elektron') {
      hw += '<rect x="90" y="134" width="15" height="24" rx="2" fill="#1c1712" stroke="' + gold + '" stroke-width=".8"/>';
      for (var r = 0; r < 4; r++) for (var c = 0; c < 3; c++) {
        hw += '<circle cx="' + (94 + c * 3.6) + '" cy="' + (139 + r * 4.6) + '" r="1" fill="' + gold + '"/>';
      }
    }

    return '<svg viewBox="0 0 120 220" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="' + model.name + ' eshigi">' +
           frame + svg.innerHTML + hw + '</svg>';
  }

  function findModel(name) {
    var list = window.YD_MODELS || [];
    for (var i = 0; i < list.length; i++) if (list[i].name === name) return list[i];
    return null;
  }

  // ---------- Navbar / tab-navigatsiyaga "Savat" ----------
  var CART_ICON = '<svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M3 4h2l2.4 12.4a2 2 0 0 0 2 1.6h7.2a2 2 0 0 0 2-1.6L21 8H6"/><circle cx="10" cy="20" r="1"/><circle cx="17" cy="20" r="1"/></svg>';

  function injectStyle() {
    if (document.getElementById('yd-cart-style')) return;
    var st = document.createElement('style');
    st.id = 'yd-cart-style';
    st.textContent =
      '.yd-cart-badge{display:inline-flex;align-items:center;justify-content:center;min-width:18px;height:18px;padding:0 5px;margin-left:6px;border-radius:9px;background:var(--brass,#c9a44c);color:#17130f;font-size:.68rem;font-weight:700;line-height:1}' +
      '.yd-cart-badge[hidden]{display:none!important}' +
      '.mp-tab[data-cart-link]{position:relative}' +
      '.mp-tab[data-cart-link] .yd-cart-badge{position:absolute;top:0;left:calc(50% + 4px);margin:0;min-width:16px;height:16px;font-size:.6rem}';
    document.head.appendChild(st);
  }

  function injectNav() {
    // Desktop navbar
    var navCollapse = document.querySelector('.navbar-custom .navbar-collapse');
    if (navCollapse && !navCollapse.querySelector('[data-cart-link]')) {
      var a = document.createElement('a');
      a.className = 'nav-link-custom';
      a.href = 'savat.html';
      a.setAttribute('data-cart-link', '');
      a.innerHTML = CART_ICON + 'Savat<span class="yd-cart-badge" data-cart-badge hidden>0</span>';
      var anchor = navCollapse.querySelector('.loc-badge') || document.getElementById('themeToggle');
      if (anchor && anchor.parentNode === navCollapse) navCollapse.insertBefore(a, anchor);
      else navCollapse.appendChild(a);
    }
    // Mobil pastki tab-navigatsiya
    var tabbar = document.querySelector('.mp-tabbar');
    if (tabbar && !tabbar.querySelector('[data-cart-link]')) {
      var t = document.createElement('a');
      t.className = 'mp-tab';
      t.href = 'savat.html';
      t.setAttribute('data-cart-link', '');
      t.innerHTML = CART_ICON + 'Savat<span class="yd-cart-badge" data-cart-badge hidden>0</span>';
      tabbar.appendChild(t);
    }
  }

  function refreshBadges() {
    var n = count();
    document.querySelectorAll('[data-cart-badge]').forEach(function (b) {
      b.textContent = n;
      b.hidden = n === 0;
    });
  }

  // ---------- Katalogdagi kartalarni model sahifasiga yo'naltirish ----------
  function rewriteCardLinks() {
    document.querySelectorAll('a[href*="buyurtma.html?model="], a[href*="buyurtma2.html?model="]').forEach(function (a) {
      if (!a.closest('.model-card, .mp-card')) return;
      a.setAttribute('href', a.getAttribute('href').replace(/buyurtma2?\.html\?model=/, 'model.html?model='));
      if (/Buyurtma/.test(a.textContent)) a.textContent = 'Batafsil →';
    });
    // Mobil kartalar va sevimlilar sahifasidagi kartalar: kartani bosganda ham modelga o'tsin
    document.querySelectorAll('.mp-card, #favGrid .model-card').forEach(function (card) {
      var link = card.querySelector('.mp-card-body a, .model-price a');
      if (!link || card.getAttribute('data-yd-link')) return;
      card.setAttribute('data-yd-link', '1');
      card.style.cursor = 'pointer';
      card.addEventListener('click', function (e) {
        if (e.target.closest('a') || e.target.closest('button')) return;
        window.location.href = link.getAttribute('href');
      });
    });
  }

  window.YDCart = {
    KEY: KEY, DELIVERY: DELIVERY, DEPOSIT_RATE: DEPOSIT_RATE,
    get: read, add: add, remove: remove, setQty: setQty, clear: clear,
    count: count, unitPrice: unitPrice, lineTotal: lineTotal, total: total,
    formatSom: formatSom, deliveryRangeText: deliveryRangeText,
    doorSvg: doorSvg, findModel: findModel, refreshBadges: refreshBadges
  };

  function init() {
    injectStyle();
    injectNav();
    rewriteCardLinks();
    refreshBadges();
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();

  // Boshqa oynada (tabda) savat o'zgarsa, belgi ham yangilansin
  window.addEventListener('storage', function (e) { if (e.key === KEY) refreshBadges(); });
})();
