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
  var form = { name: '', phone: '', address: '', lat: null, lng: null };
  var done = null; // buyurtma yuborilgach: { ids: [...], multiple: bool }

  function esc(s) { return String(s == null ? '' : s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;'); }

  /* =========================================================
     MANZILNI XARITADAN TANLASH (Leaflet + OpenStreetMap)
     eshik-yasash.js / buyurtma.html dagi bilan bir xil hududlar
     va geokodlash xizmati
     ========================================================= */
  function getMapLink() {
    if (form.lat == null || form.lng == null) return '';
    return 'https://www.google.com/maps?q=' + form.lat.toFixed(6) + ',' + form.lng.toFixed(6);
  }

  var ALLOWED_REGIONS = {
    "Toshkent viloyati": [[41.85,69.95],[41.75,70.35],[41.35,70.55],[41.05,70.35],[40.75,70.05],[40.85,69.55],[41.05,69.15],[41.35,68.75],[41.65,68.85],[41.85,69.35],[41.85,69.95]],
    "Sirdaryo viloyati": [[40.85,68.55],[40.85,69.15],[40.55,69.35],[40.15,69.15],[40.05,68.75],[40.25,68.35],[40.65,68.25],[40.85,68.55]],
    "Samarqand viloyati": [[40.15,66.55],[40.05,67.55],[39.75,67.85],[39.35,67.65],[39.05,67.15],[39.15,66.35],[39.55,65.95],[39.95,66.05],[40.15,66.55]],
    "Navoiy viloyati": [[42.05,65.95],[41.75,66.55],[40.85,66.75],[40.15,66.45],[39.85,65.55],[39.55,64.25],[39.85,62.75],[40.55,62.35],[41.55,63.05],[42.05,64.25],[42.05,65.95]],
    "Qashqadaryo viloyati": [[39.15,65.15],[39.05,66.35],[38.55,66.95],[37.95,66.75],[37.85,65.95],[38.15,65.05],[38.65,64.55],[39.05,64.75],[39.15,65.15]],
    "Jizzax viloyati": [[40.55,67.55],[40.45,68.35],[40.05,68.65],[39.55,68.35],[39.35,67.85],[39.55,67.15],[40.05,66.95],[40.35,67.15],[40.55,67.55]]
  };

  function pointInPolygon(lat, lng, polygon) {
    var inside = false;
    for (var i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
      var yi = polygon[i][0], xi = polygon[i][1], yj = polygon[j][0], xj = polygon[j][1];
      if (((yi > lat) !== (yj > lat)) && (lng < (xj - xi) * (lat - yi) / (yj - yi) + xi)) inside = !inside;
    }
    return inside;
  }
  function findAllowedRegion(lat, lng) {
    for (var name in ALLOWED_REGIONS) { if (pointInPolygon(lat, lng, ALLOWED_REGIONS[name])) return name; }
    return null;
  }

  var NOMINATIM = 'https://nominatim.openstreetmap.org';
  function nominatimReverse(lat, lng) {
    return fetch(NOMINATIM + '/reverse?format=jsonv2&addressdetails=1&accept-language=uz,ru&lat=' + lat + '&lon=' + lng,
      { headers: { 'Accept': 'application/json' } }).then(function (r) { if (!r.ok) throw new Error('HTTP ' + r.status); return r.json(); });
  }
  function nominatimSearch(q) {
    return fetch(NOMINATIM + '/search?format=jsonv2&limit=1&countrycodes=uz&accept-language=uz,ru&q=' + encodeURIComponent(q),
      { headers: { 'Accept': 'application/json' } }).then(function (r) { if (!r.ok) throw new Error('HTTP ' + r.status); return r.json(); });
  }

  var picker = { map: null, marker: null, lat: null, lng: null, region: null, text: '', seq: 0, lastFocus: null };
  function pickerEl(id) { return document.getElementById(id); }

  function setPickerStatus(kind, html) {
    var el = pickerEl('mapStatus');
    el.className = 'map-status' + (kind ? ' show ' + kind : '');
    el.innerHTML = html || '';
  }

  function renderPicked() {
    var box = pickerEl('mapPicked');
    var btn = pickerEl('mapConfirmBtn');
    if (picker.lat == null || !picker.region) {
      box.innerHTML = ''; box.classList.remove('show'); btn.disabled = true; return;
    }
    box.classList.add('show');
    box.innerHTML = '<b>Tanlangan manzil:</b> ' + esc(picker.text || picker.region) +
      '<span class="hint">Uy / xonadon raqamini tasdiqlagandan so\'ng manzil maydoniga qo\'shishingiz mumkin.</span>';
    btn.disabled = false;
  }

  function placeMarker(lat, lng, ok) {
    if (picker.marker) picker.map.removeLayer(picker.marker);
    picker.marker = L.circleMarker([lat, lng], {
      radius: 9, weight: 2,
      color: ok ? '#7a4a20' : '#7a2020',
      fillColor: ok ? '#c9a44c' : '#e06060',
      fillOpacity: 1
    }).addTo(picker.map);
  }

  function setPickerPoint(lat, lng) {
    picker.lat = lat; picker.lng = lng;
    var region = findAllowedRegion(lat, lng);
    picker.region = region;
    placeMarker(lat, lng, !!region);

    if (!region) {
      picker.text = '';
      setPickerStatus('fail', '✕ Bu joyga yetkazib bera olmaymiz. Hozircha faqat Toshkent, Sirdaryo, Samarqand, Navoiy, Qashqadaryo va Jizzax viloyatlariga yetkazib beramiz.');
      renderPicked();
      return;
    }

    setPickerStatus('ok', '✓ <b>' + region + '</b> — bu hududga yetkazib bera olamiz.');
    picker.text = region;
    renderPicked();

    var mySeq = ++picker.seq;
    nominatimReverse(lat, lng).then(function (data) {
      if (mySeq !== picker.seq) return;
      var a = data && data.address;
      if (!a) return;
      var mahalla = a.suburb || a.neighbourhood || a.quarter || a.city_district || a.residential || '';
      var street = a.road || a.pedestrian || a.footway || '';
      var parts = [];
      if (a.house_number) parts.push(a.house_number + '-uy');
      if (street) parts.push(street);
      if (mahalla) parts.push(mahalla);
      parts.push(region);
      picker.text = parts.join(', ');
      renderPicked();
    }).catch(function (err) {
      console.error('Teskari geokodlash xatosi:', err);
    });
  }

  function initPickerMap() {
    if (picker.map) return true;
    if (typeof L === 'undefined') {
      setPickerStatus('fail', '✕ Xarita yuklanmadi. Internet aloqasini tekshirib, sahifani yangilang yoki manzilni qo\'lda kiriting.');
      return false;
    }
    picker.map = L.map(pickerEl('pickerMap'), { center: [40.127041, 67.905874], zoom: 7, minZoom: 5, maxZoom: 19 });
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>', maxZoom: 19
    }).addTo(picker.map);

    Object.keys(ALLOWED_REGIONS).forEach(function (name) {
      L.polygon(ALLOWED_REGIONS[name], { fillColor: '#c9a44c', fillOpacity: .18, color: '#c9a44c', weight: 1.5, opacity: .9 })
        .addTo(picker.map).bindTooltip(name)
        .on('click', function (e) { setPickerPoint(e.latlng.lat, e.latlng.lng); });
    });
    picker.map.on('click', function (e) { setPickerPoint(e.latlng.lat, e.latlng.lng); });
    return true;
  }

  function openMapModal() {
    var modal = pickerEl('mapModal');
    picker.lastFocus = document.activeElement;
    modal.classList.add('open');
    modal.setAttribute('aria-hidden', 'false');
    document.body.classList.add('map-modal-lock');

    var ready = initPickerMap();
    setPickerStatus('', '');
    pickerEl('mapPicked').classList.remove('show');
    pickerEl('mapConfirmBtn').disabled = true;
    picker.lat = null; picker.lng = null; picker.region = null; picker.text = '';
    if (picker.marker && picker.map) { picker.map.removeLayer(picker.marker); picker.marker = null; }

    var typed = (document.getElementById('cAddr') || {}).value || '';
    pickerEl('mapSearchInput').value = form.lat == null ? typed.trim() : '';

    if (ready) {
      setTimeout(function () {
        picker.map.invalidateSize();
        if (form.lat != null) {
          picker.map.setView([form.lat, form.lng], 16);
          setPickerPoint(form.lat, form.lng);
        } else {
          picker.map.setView([40.127041, 67.905874], 7);
          setPickerStatus('', '');
          var st = pickerEl('mapStatus');
          st.className = 'map-status show info';
          st.innerHTML = 'Xaritani kattalashtirib, eshik yetkaziladigan joyni bosing.';
        }
      }, 60);
    }
    pickerEl('mapCloseBtn').focus();
  }

  function closeMapModal() {
    var modal = pickerEl('mapModal');
    modal.classList.remove('open');
    modal.setAttribute('aria-hidden', 'true');
    document.body.classList.remove('map-modal-lock');
    if (picker.lastFocus && picker.lastFocus.focus) picker.lastFocus.focus();
  }

  function renderPinChip() {
    var chip = document.getElementById('pinChip');
    if (!chip) return;
    if (form.lat == null) { chip.classList.remove('show'); chip.innerHTML = ''; return; }
    chip.classList.add('show');
    chip.innerHTML = '<span><svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 6 9 17l-5-5"/></svg> Xaritada belgilandi</span>' +
      '<a href="' + getMapLink() + '" target="_blank" rel="noopener">Ko\'rish</a>' +
      '<button type="button" id="pinClearBtn">Olib tashlash</button>';
    document.getElementById('pinClearBtn').addEventListener('click', function () {
      form.lat = null; form.lng = null; renderPinChip();
    });
  }

  function confirmMapPick() {
    if (picker.lat == null || !picker.region) return;
    form.lat = picker.lat; form.lng = picker.lng;
    form.address = picker.text || picker.region;
    var input = document.getElementById('cAddr');
    if (input) { input.value = form.address; input.classList.remove('invalid'); input.focus(); }
    var err = document.getElementById('formError');
    if (err) err.classList.remove('show');
    renderPinChip();
    closeMapModal();
  }

  function attachMapPicker() {
    if (attachMapPicker.done) return;
    attachMapPicker.done = true;

    pickerEl('mapCloseBtn').addEventListener('click', closeMapModal);
    pickerEl('mapCancelBtn').addEventListener('click', closeMapModal);
    pickerEl('mapConfirmBtn').addEventListener('click', confirmMapPick);
    pickerEl('mapModal').addEventListener('click', function (e) { if (e.target === this) closeMapModal(); });
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && pickerEl('mapModal').classList.contains('open')) closeMapModal();
    });

    function doSearch() {
      var q = pickerEl('mapSearchInput').value.trim();
      if (!q || !picker.map) return;
      var btn = pickerEl('mapSearchBtn');
      btn.disabled = true; btn.textContent = 'Qidirilmoqda...';
      nominatimSearch(q).then(function (res) {
        btn.disabled = false; btn.textContent = 'Qidirish';
        if (!res || !res.length) {
          setPickerStatus('fail', '✕ Manzil topilmadi. Boshqacha yozib ko\'ring yoki xaritadan bosib belgilang.');
          return;
        }
        var lat = parseFloat(res[0].lat), lng = parseFloat(res[0].lon);
        picker.map.flyTo([lat, lng], 17, { duration: .4 });
        setPickerPoint(lat, lng);
      }).catch(function (err) {
        btn.disabled = false; btn.textContent = 'Qidirish';
        setPickerStatus('fail', '✕ Qidirishda xatolik. Birozdan so\'ng qayta urinib ko\'ring.');
        console.error('Geokodlash xatosi:', err);
      });
    }
    pickerEl('mapSearchBtn').addEventListener('click', doSearch);
    pickerEl('mapSearchInput').addEventListener('keydown', function (e) {
      if (e.key === 'Enter') { e.preventDefault(); doSearch(); }
    });

    pickerEl('mapLocateBtn').addEventListener('click', function () {
      if (!navigator.geolocation || !picker.map) {
        setPickerStatus('fail', '✕ Brauzeringiz joylashuvni aniqlashni qo\'llamaydi. Xaritadan qo\'lda belgilang.');
        return;
      }
      var btn = pickerEl('mapLocateBtn');
      btn.disabled = true;
      navigator.geolocation.getCurrentPosition(function (pos) {
        btn.disabled = false;
        picker.map.flyTo([pos.coords.latitude, pos.coords.longitude], 17, { duration: .4 });
        setPickerPoint(pos.coords.latitude, pos.coords.longitude);
      }, function () {
        btn.disabled = false;
        setPickerStatus('fail', '✕ Joylashuvni aniqlab bo\'lmadi. Brauzerda ruxsat berilganini tekshiring yoki xaritadan qo\'lda belgilang.');
      }, { enableHighAccuracy: true, timeout: 10000 });
    });
  }

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
          '<div class="field"><label for="cAddr">Yetkazib berish manzili *</label>' +
            '<div class="address-group">' +
              '<input type="text" id="cAddr" placeholder="Viloyat, tuman, mahalla, ko\'cha, uy raqami" value="' + esc(form.address) + '" autocomplete="street-address">' +
              '<button type="button" class="btn map-pick-btn" id="pickMapBtn">' +
                '<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M12 21s7-6.1 7-11a7 7 0 1 0-14 0c0 4.9 7 11 7 11Z"/><circle cx="12" cy="10" r="2.4"/></svg>' +
                'Xaritadan tanlash' +
              '</button>' +
            '</div>' +
            '<div class="pin-chip" id="pinChip"></div>' +
          '</div>' +
          '<div class="form-error" id="formError"></div>' +
          '<button type="button" class="btn primary" id="sendBtn">Buyurtma berish</button>' +
          '<div class="note">Buyurtma yuborilgach, operator zalog (20%) bo\'yicha siz bilan bog\'lanadi. Qolgan summa yetkazib berilganda to\'lanadi.</div>' +
        '</div></aside></div>';

    bindForm();
    renderPinChip();
  }

  // ---------- Forma ----------
  function bindForm() {
    var nameEl = document.getElementById('cName'), phoneEl = document.getElementById('cPhone'), addrEl = document.getElementById('cAddr');
    var err = document.getElementById('formError');

    [nameEl, phoneEl, addrEl].forEach(function (el) {
      el.addEventListener('input', function () { el.classList.remove('invalid'); err.classList.remove('show'); });
    });
    nameEl.addEventListener('input', function () { form.name = nameEl.value; });
    addrEl.addEventListener('input', function () { form.address = addrEl.value; form.lat = null; form.lng = null; renderPinChip(); });
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

    document.getElementById('pickMapBtn').addEventListener('click', function () {
      attachMapPicker();
      openMapModal();
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
        address: address, map_link: getMapLink(), page: location.pathname
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
