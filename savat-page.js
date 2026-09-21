// ============================================================================
// YASINDOORS — savat-page.js
// Savat sahifasi: mahsulotlar ro'yxati, miqdorni o'zgartirish, tayyor bo'lish
// muddati va buyurtmani Google Sheets'ga (Code.gs orqali) yuborish.
// Buyurtma formati telegram-order.js / eshik-yasash.js dagi bilan bir xil,
// shuning uchun bot va jadval avvalgidek ishlaydi.
// ============================================================================
(function () {
  var C = window.YDCart;
  var area = document.getElementById('cartArea');
  var form = { name: '', phone: '', address: '' };
  var done = null; // buyurtma yuborilgach: { ids: [...], multiple: bool }

  function esc(s) { return String(s == null ? '' : s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;'); }

  // ---------- Mavzu ----------
  try {
    var saved = localStorage.getItem('yasindoors-theme');
    if (saved) document.documentElement.setAttribute('data-theme', saved);
  } catch (e) {}
  document.getElementById('themeToggle').addEventListener('click', function () {
    var cur = document.documentElement.getAttribute('data-theme') === 'light' ? 'dark' : 'light';
    document.documentElement.setAttribute('data-theme', cur);
    try { localStorage.setItem('yasindoors-theme', cur); } catch (e) {}
  });

  // ---------- Muddat ----------
  document.getElementById('termDays').textContent = C.DELIVERY.min + '–' + C.DELIVERY.max + ' kun';
  document.getElementById('termRange').textContent = C.deliveryRangeText(new Date());

  // ---------- Render ----------
  function itemHtml(it) {
    var m = C.findModel(it.model);
    var thumb = m ? C.doorSvg(m, it.sel) : '';
    var specs = '<li><span>O\'lcham</span><b>' + esc(it.size) + '</b></li>' +
                '<li><span>Rang</span><b>' + esc(it.color) + '</b></li>' +
                '<li><span>Eshik</span><b>' + C.formatSom(it.base) + '</b></li>' +
      (it.lines || []).map(function (l) {
        return '<li><span>' + esc(l.k) + ': <b>' + esc(l.v) + '</b></span><span class="pl">+' + C.formatSom(l.price) + '</span></li>';
      }).join('');
    return '<article class="cart-item" data-uid="' + it.uid + '">' +
      '<div class="thumb">' + thumb + '</div>' +
      '<div class="info"><h3><a href="model.html?model=' + encodeURIComponent(it.model) + '">' + esc(it.model) + '</a></h3>' +
        '<div class="ser">' + esc(it.series) + '</div><ul class="specs">' + specs + '</ul></div>' +
      '<div class="side">' +
        '<div class="price">' + C.formatSom(C.lineTotal(it)) + (it.qty > 1 ? '<span class="unit">' + C.formatSom(C.unitPrice(it)) + ' × ' + it.qty + '</span>' : '') + '</div>' +
        '<div style="display:flex; align-items:center; gap:14px;">' +
          '<div class="qty"><button type="button" data-act="minus" aria-label="Kamaytirish">−</button><output>' + it.qty + '</output><button type="button" data-act="plus" aria-label="Ko\'paytirish">+</button></div>' +
          '<button type="button" class="link-btn" data-act="remove">O\'chirish</button>' +
        '</div>' +
      '</div></article>';
  }

  function render() {
    var items = C.get();

    if (done) {
      var trackHref = (window.TELEGRAM_BOT_USERNAME && String(window.TELEGRAM_BOT_USERNAME).indexOf('BU_YERGA') === -1)
        ? 'https://t.me/' + window.TELEGRAM_BOT_USERNAME + '?start=' + (done.multiple ? 'my_orders' : 'o_' + done.ids[0]) : '';
      area.innerHTML = '<div class="confirm show"><div class="tick"><svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M20 6 9 17l-5-5"/></svg></div>' +
        '<h3>Buyurtmangiz qabul qilindi</h3>' +
        '<p>Mutaxassisimiz zalog to\'lovi bo\'yicha tez orada siz bilan bog\'lanadi.</p>' +
        '<p class="est">Eshiklaringiz <b>' + C.DELIVERY.min + '–' + C.DELIVERY.max + ' kun</b> ichida tayyor bo\'ladi:<br><b>' + C.deliveryRangeText(new Date()) + '</b></p>' +
        '<div class="btns">' + (trackHref ? '<a class="btn primary" href="' + trackHref + '" target="_blank" rel="noopener">Buyurtmani Telegramda kuzatish</a>' : '') +
        '<a class="btn" href="katalog.html">Katalogga qaytish</a></div></div>';
      return;
    }

    if (!items.length) {
      area.innerHTML = '<div class="empty"><h3>Savatingiz bo\'sh</h3><p>Katalogdan eshik modelini tanlang, karona va qulfini qo\'shing — u shu yerda paydo bo\'ladi.</p>' +
        '<a class="btn primary" href="katalog.html">Katalogga o\'tish</a></div>';
      return;
    }

    var total = C.total(items);
    var count = C.count();
    area.innerHTML = '<div class="cart-layout">' +
      '<div><div class="cart-head"><h3>Tanlangan eshiklar (' + count + ' dona)</h3><button type="button" class="link-btn" id="clearBtn">Savatni tozalash</button></div>' +
        '<div id="items">' + items.map(itemHtml).join('') + '</div>' +
        '<a class="btn" href="katalog.html" style="margin-top:6px">+ Yana model qo\'shish</a></div>' +
      '<aside class="summary"><h3>Buyurtma xulosasi</h3>' +
        '<div class="row"><span class="k">Eshiklar soni</span><span class="v">' + count + ' dona</span></div>' +
        '<div class="row"><span class="k">Tayyor bo\'lish muddati</span><span class="v">' + C.DELIVERY.min + '–' + C.DELIVERY.max + ' kun</span></div>' +
        '<div class="grand"><span class="k">Jami</span><span class="v">' + C.formatSom(total) + '</span></div>' +
        '<div class="dep">Zalog (20%): ' + C.formatSom(total * C.DEPOSIT_RATE) + '</div>' +
        '<div class="checkout"><h4>Buyurtmani rasmiylashtirish</h4>' +
          '<div class="field"><label for="cName">Ism va familiyangiz *</label><input type="text" id="cName" placeholder="Masalan: Aziz Karimov" value="' + esc(form.name) + '" autocomplete="name"></div>' +
          '<div class="field"><label for="cPhone">Telefon raqam *</label><div class="phone-group"><span class="prefix">+998</span>' +
            '<input type="tel" id="cPhone" placeholder="90 123 45 67" inputmode="numeric" maxlength="12" value="' + esc(form.phone) + '" autocomplete="tel-national"></div></div>' +
          '<div class="field"><label for="cAddr">Yetkazib berish manzili *</label><input type="text" id="cAddr" placeholder="Viloyat, tuman, mahalla, ko\'cha, uy raqami" value="' + esc(form.address) + '" autocomplete="street-address"></div>' +
          '<div class="form-error" id="formError"></div>' +
          '<button type="button" class="btn primary" id="sendBtn">Buyurtma berish</button>' +
          '<div class="note">Buyurtma yuborilgach, operator zalog (20%) bo\'yicha siz bilan bog\'lanadi. Qolgan summa yetkazib berilganda to\'lanadi.</div>' +
        '</div></aside></div>';

    bindForm();
  }

  // ---------- Forma ----------
  function bindForm() {
    var nameEl = document.getElementById('cName'), phoneEl = document.getElementById('cPhone'), addrEl = document.getElementById('cAddr');
    var err = document.getElementById('formError');

    [nameEl, phoneEl, addrEl].forEach(function (el) {
      el.addEventListener('input', function () { el.classList.remove('invalid'); err.classList.remove('show'); });
    });
    nameEl.addEventListener('input', function () { form.name = nameEl.value; });
    addrEl.addEventListener('input', function () { form.address = addrEl.value; });
    phoneEl.addEventListener('keydown', function (e) {
      if (['Backspace', 'Delete', 'Tab', 'ArrowLeft', 'ArrowRight', 'Home', 'End'].indexOf(e.key) !== -1 || e.ctrlKey || e.metaKey) return;
      if (!/^[0-9]$/.test(e.key)) e.preventDefault();
    });
    phoneEl.addEventListener('input', function () {
      var d = phoneEl.value.replace(/\D/g, '').slice(0, 9), p = [];
      if (d.length > 0) p.push(d.slice(0, 2));
      if (d.length > 2) p.push(d.slice(2, 5));
      if (d.length > 5) p.push(d.slice(5, 7));
      if (d.length > 7) p.push(d.slice(7, 9));
      phoneEl.value = p.join(' ');
      form.phone = phoneEl.value;
    });

    document.getElementById('sendBtn').addEventListener('click', function () {
      var ok = true, nm = nameEl.value.trim(), digits = phoneEl.value.replace(/\D/g, ''), ad = addrEl.value.trim();
      [nameEl, phoneEl, addrEl].forEach(function (el) { el.classList.remove('invalid'); });
      if (!nm) { nameEl.classList.add('invalid'); ok = false; }
      if (digits.length !== 9) { phoneEl.classList.add('invalid'); ok = false; }
      if (!ad) { addrEl.classList.add('invalid'); ok = false; }
      if (!ok) {
        err.textContent = 'Ism, telefon (9 ta raqam) va manzilni to\'liq kiriting.';
        err.classList.add('show');
        (!nm ? nameEl : (digits.length !== 9 ? phoneEl : addrEl)).focus();
        return;
      }
      submitOrder(nm, '+998' + digits, ad, this);
    });
  }

  // ---------- Yuborish (Code.gs doPost kutayotgan maydonlar) ----------
  function submitOrder(name, phone, address, btn) {
    var url = window.SHEETS_WEBHOOK_URL;
    var err = document.getElementById('formError');
    if (!url || String(url).indexOf('BU_YERGA') !== -1) {
      err.textContent = 'Buyurtma yuborish sozlanmagan (bot-config.js da SHEETS_WEBHOOK_URL yo\'q).';
      err.classList.add('show');
      return;
    }
    var items = C.get();
    var stamp = Date.now().toString(36).toUpperCase();
    var ids = [];
    btn.disabled = true; btn.textContent = 'Yuborilmoqda...';

    var jobs = items.map(function (it, i) {
      var id = 'YDS' + stamp + (i + 1);
      ids.push(id);
      var total = C.lineTotal(it);
      var extras = (it.lines || []).map(function (l) { return l.k + ': ' + l.v; }).join(' · ');
      var payload = {
        type: 'order', id: id, name: name, phone: phone,
        model: it.model, series: extras ? (it.series + ' · ' + extras) : it.series,
        size: it.size, color: it.color, quantity: it.qty,
        total: total, deposit: Math.round(total * C.DEPOSIT_RATE),
        address: address, map_link: '', page: location.pathname
      };
      return fetch(url, { method: 'POST', mode: 'no-cors', headers: { 'Content-Type': 'text/plain' }, body: JSON.stringify(payload) });
    });

    Promise.all(jobs).then(function () {
      done = { ids: ids, multiple: ids.length > 1 };
      C.clear();
    }).catch(function (e) {
      console.error('Buyurtmani yuborishda xatolik:', e);
      btn.disabled = false; btn.textContent = 'Buyurtma berish';
      err.textContent = 'Buyurtma yuborilmadi. Internet aloqasini tekshirib, qayta urinib ko\'ring.';
      err.classList.add('show');
    });
  }

  // ---------- Ro'yxat amallari ----------
  area.addEventListener('click', function (e) {
    var clear = e.target.closest('#clearBtn');
    if (clear) { if (confirm('Savatdagi barcha eshiklar o\'chirilsinmi?')) C.clear(); return; }
    var row = e.target.closest('.cart-item');
    var act = e.target.closest('[data-act]');
    if (!row || !act) return;
    var uid = row.dataset.uid;
    var it = C.get().filter(function (x) { return x.uid === uid; })[0];
    if (!it) return;
    if (act.dataset.act === 'remove') C.remove(uid);
    else if (act.dataset.act === 'plus') C.setQty(uid, it.qty + 1);
    else if (act.dataset.act === 'minus') C.setQty(uid, it.qty - 1);
  });

  // Savat o'zgarganda (bu tabda ham, boshqa tabda ham) qayta chizish — kiritilgan maydonlar `form` da saqlanadi
  document.addEventListener('yd-cart-change', render);
  window.addEventListener('storage', function (e) { if (e.key === C.KEY) render(); });

  render();
})();
