// ============================================================================
// YASINDOORS — model.js
// Model sahifasi: eshikka karona, qulf, ruchka, petlya qo'shish va savatga solish.
// Narxlar eshik konstruktoridagi (eshik-yasash.js) narxlar bilan bir xil.
// Yangi qo'shimcha kerak bo'lsa — GROUPS ro'yxatiga yangi variant qo'shing.
// ============================================================================
(function () {

  var GROUPS = [
    {
      key: 'karona', title: 'Karona (obnalichka)', hint: "Eshik atrofidagi ramka — eshikning umumiy ko'rinishini belgilaydi.",
      def: 'yoq',
      options: [
        { id: 'yoq',     name: 'Kerak emas',     desc: 'Faqat eshik tabaqasi', price: 0 },
        { id: 'klassik', name: 'Klassik karona', desc: "Nafis, bo'rtma qirrali", price: 320000 },
        { id: 'modern',  name: 'Modern',         desc: "To'g'ri chiziqli, minimal profil", price: 260000 },
        { id: 'minimal', name: 'Minimalizm',     desc: 'Yashirin karona, silliq o\'tish', price: 380000 }
      ]
    },
    {
      key: 'qulf', title: 'Qulf (zamok)', hint: 'Xavfsizlik darajasiga qarab tanlang.',
      def: 'yoq',
      options: [
        { id: 'yoq',      name: 'Kerak emas',             price: 0 },
        { id: 'oddiy',    name: 'Oddiy silindrli qulf',   price: 90000 },
        { id: 'ikki',     name: 'Ikki tilli xavfsiz qulf', price: 180000 },
        { id: 'elektron', name: 'Elektron / kodli qulf',  price: 420000 }
      ]
    },
    {
      key: 'ruchka', title: 'Ruchka (dastak)', hint: '',
      def: 'yoq',
      options: [
        { id: 'yoq',     name: 'Kerak emas',      price: 0 },
        { id: 'klassik', name: 'Klassik dastak',  price: 70000 },
        { id: 'modern',  name: 'Modern tutqich',  price: 95000 },
        { id: 'minimal', name: 'Minimal tugma',   price: 55000 }
      ]
    },
    {
      key: 'petlya', title: 'Petlyalar', hint: "Og'ir eshiklar uchun ko'proq petlya tavsiya etiladi.",
      def: '2',
      options: [
        { id: '2', name: '2 ta petlya', desc: 'Standart', price: 0 },
        { id: '3', name: '3 ta petlya', price: 35000 },
        { id: '4', name: "4 ta petlya", desc: "Og'ir eshik uchun", price: 60000 }
      ]
    }
  ];

  var COLORS = [
    { name: 'Model rangida', hex: null },
    { name: "Yong'oq",    hex: '#a4652c' },
    { name: 'Venge',      hex: '#5b3a24' },
    { name: 'Oq laminat', hex: '#efe9da' },
    { name: 'Kul rang',   hex: '#8d8378' },
    { name: 'Qora mat',   hex: '#1c1712' },
    { name: 'Eman',       hex: '#c99a52' }
  ];

  var SIZES = [
    { v: '700 × 2000 mm' },
    { v: '800 × 2000 mm', tag: 'Standart' },
    { v: '900 × 2000 mm' }
  ];

  var app = document.getElementById('app');
  var name = new URLSearchParams(location.search).get('model');
  var model = window.YDCart ? window.YDCart.findModel(name) : null;
  var C = window.YDCart;

  function esc(s) { return String(s == null ? '' : s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;'); }

  // ---------- Mavzu (yorug'/qorong'i) ----------
  (function () {
    try {
      var saved = localStorage.getItem('yasindoors-theme');
      if (saved) document.documentElement.setAttribute('data-theme', saved);
    } catch (e) {}
    document.getElementById('themeToggle').addEventListener('click', function () {
      var cur = document.documentElement.getAttribute('data-theme') === 'light' ? 'dark' : 'light';
      document.documentElement.setAttribute('data-theme', cur);
      try { localStorage.setItem('yasindoors-theme', cur); } catch (e) {}
    });
  })();

  if (!model) {
    document.title = 'Model topilmadi — YasinDoors';
    app.innerHTML = '<div class="not-found"><h1>Model topilmadi</h1><p>Bunday model katalogda yo\'q yoki havola noto\'g\'ri.</p>' +
      '<a class="btn primary" href="katalog.html">Katalogga qaytish</a></div>';
    return;
  }

  document.title = model.name + ' — YasinDoors';

  var state = { qty: 1, size: '800 × 2000 mm', color: 0 };
  GROUPS.forEach(function (g) { state[g.key] = g.def; });

  function tickSvg() {
    return '<span class="tick"><svg viewBox="0 0 24 24" width="11" height="11" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><path d="M20 6 9 17l-5-5"/></svg></span>';
  }

  function groupHtml(g) {
    var opts = g.options.map(function (o) {
      var price = o.price > 0 ? '<span class="p">+' + C.formatSom(o.price) + '</span>'
                              : '<span class="p free">' + (g.def === o.id && g.key === 'petlya' ? 'Narxga kiradi' : 'Narx qo\'shilmaydi') + '</span>';
      return '<button type="button" class="opt" data-group="' + g.key + '" data-id="' + o.id + '" aria-pressed="false">' + tickSvg() +
        '<span class="n">' + esc(o.name) + '</span>' +
        (o.desc ? '<span class="d">' + esc(o.desc) + '</span>' : '') + price + '</button>';
    }).join('');
    return '<section class="cfg-group"><h4>' + esc(g.title) + '</h4>' +
      (g.hint ? '<p class="hint">' + esc(g.hint) + '</p>' : '<div style="height:12px"></div>') +
      '<div class="opt-grid">' + opts + '</div></section>';
  }

  function colorHtml() {
    var sw = COLORS.map(function (c, i) {
      return '<button type="button" class="sw' + (c.hex ? '' : ' std') + '" data-color="' + i + '" aria-pressed="false" aria-label="' + esc(c.name) + '"' +
        (c.hex ? ' style="background:' + c.hex + '"' : '') + ' title="' + esc(c.name) + '"></button>';
    }).join('');
    return '<section class="cfg-group"><h4>Rang</h4><p class="hint">Narxga ta\'sir qilmaydi.</p>' +
      '<div class="sw-row">' + sw + '</div><div class="sw-name">Tanlangan: <b id="swName">Model rangida</b></div></section>';
  }

  function sizeHtml() {
    return '<section class="cfg-group"><h4>O\'lcham</h4><p class="hint">Boshqa o\'lcham kerak bo\'lsa, buyurtmadan keyin operator bilan kelishasiz.</p>' +
      '<div class="chip-row">' + SIZES.map(function (s) {
        return '<button type="button" class="chip" data-size="' + s.v + '" aria-pressed="false">' + s.v + (s.tag ? '<small>' + s.tag + '</small>' : '') + '</button>';
      }).join('') + '</div></section>';
  }

  app.innerHTML =
    '<nav class="crumbs" aria-label="Sahifa yo\'li"><a href="index.html">Bosh sahifa</a> / <a href="katalog.html">Katalog</a> / ' + esc(model.name) + '</nav>' +
    '<div class="model-layout">' +
      '<div class="preview-col"><div class="preview-card">' +
        '<div class="preview-stage" id="stage"></div>' +
        '<p class="preview-note">Tanlovlaringiz rasmda darhol ko\'rinadi</p>' +
      '</div></div>' +
      '<div>' +
        '<div class="model-head"><span class="tag">' + esc(model.series) + '</span><h1>' + esc(model.name) + '</h1>' +
          '<p>' + esc(model.desc) + '</p>' +
          '<div class="base-price">' + C.formatSom(model.price) + '<small>eshikning o\'zi</small></div>' +
          '<div class="term-chip"><svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3.5 2"/></svg>' +
          'Tayyor bo\'lish muddati: ' + C.DELIVERY.min + '–' + C.DELIVERY.max + ' kun</div></div>' +
        '<div class="cfg" id="cfg">' +
          GROUPS.map(groupHtml).join('') + colorHtml() + sizeHtml() +
          '<section class="cfg-group"><h4>Miqdor</h4><div class="qty" style="margin-top:12px"><button type="button" id="qtyMinus" aria-label="Kamaytirish">−</button><output id="qtyVal">1</output><button type="button" id="qtyPlus" aria-label="Ko\'paytirish">+</button></div></section>' +
        '</div>' +
        '<div class="buybar" id="buybar">' +
          '<div class="lines" id="lines"></div>' +
          '<div class="sum"><span class="k">Jami</span><span class="v" id="grand"></span></div>' +
          '<div class="dep" id="dep"></div>' +
          '<div class="actions"><button type="button" class="btn primary" id="addBtn">' +
            '<svg viewBox="0 0 24 24" width="17" height="17" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"><path d="M3 4h2l2.4 12.4a2 2 0 0 0 2 1.6h7.2a2 2 0 0 0 2-1.6L21 8H6"/><circle cx="10" cy="20" r="1"/><circle cx="17" cy="20" r="1"/></svg>' +
            'Savatga qo\'shish</button></div>' +
        '</div>' +
      '</div>' +
    '</div>';

  // ---------- Tanlovlardan hisob-kitob ----------
  function selectedOption(g) {
    for (var i = 0; i < g.options.length; i++) if (g.options[i].id === state[g.key]) return g.options[i];
    return g.options[0];
  }
  function currentLines() {
    var lines = [];
    GROUPS.forEach(function (g) {
      var o = selectedOption(g);
      if (o.id === 'yoq') return;              // "Kerak emas" — qatorga qo'shilmaydi
      if (g.key === 'petlya' && o.id === '2') return; // standart petlya — alohida qator shart emas
      lines.push({ k: g.title.replace(/ \(.*\)/, ''), v: o.name, price: o.price });
    });
    return lines;
  }
  function currentSel() {
    return { karona: state.karona, qulf: state.qulf, ruchka: state.ruchka, petlya: state.petlya, hex: COLORS[state.color].hex };
  }

  function update() {
    // tugmalar holati
    document.querySelectorAll('.opt').forEach(function (b) {
      b.setAttribute('aria-pressed', state[b.dataset.group] === b.dataset.id ? 'true' : 'false');
    });
    document.querySelectorAll('.sw').forEach(function (b) {
      b.setAttribute('aria-pressed', String(+b.dataset.color === state.color));
    });
    document.getElementById('swName').textContent = COLORS[state.color].name;
    document.querySelectorAll('.chip').forEach(function (b) {
      b.setAttribute('aria-pressed', b.dataset.size === state.size ? 'true' : 'false');
    });
    document.getElementById('qtyVal').textContent = state.qty;

    // rasm
    document.getElementById('stage').innerHTML = C.doorSvg(model, currentSel());

    // narx
    var lines = currentLines();
    var unit = model.price + lines.reduce(function (s, l) { return s + l.price; }, 0);
    var total = unit * state.qty;
    var rows = '<div class="line"><span class="k">' + esc(model.name) + '</span><span class="v">' + C.formatSom(model.price) + '</span></div>' +
      lines.map(function (l) {
        return '<div class="line"><span class="k">' + esc(l.k) + ': ' + esc(l.v) + '</span><span class="v">+' + C.formatSom(l.price) + '</span></div>';
      }).join('');
    if (state.qty > 1) rows += '<div class="line"><span class="k">Miqdor</span><span class="v">× ' + state.qty + '</span></div>';
    document.getElementById('lines').innerHTML = rows;
    document.getElementById('grand').textContent = C.formatSom(total);
    document.getElementById('dep').textContent = 'Zalog (20%): ' + C.formatSom(total * C.DEPOSIT_RATE);
  }

  // ---------- Hodisalar ----------
  document.getElementById('cfg').addEventListener('click', function (e) {
    var opt = e.target.closest('.opt');
    if (opt) { state[opt.dataset.group] = opt.dataset.id; update(); return; }
    var sw = e.target.closest('.sw');
    if (sw) { state.color = +sw.dataset.color; update(); return; }
    var chip = e.target.closest('.chip');
    if (chip) { state.size = chip.dataset.size; update(); }
  });
  document.getElementById('qtyMinus').addEventListener('click', function () { state.qty = Math.max(1, state.qty - 1); update(); });
  document.getElementById('qtyPlus').addEventListener('click', function () { state.qty = Math.min(50, state.qty + 1); update(); });

  var toast = document.getElementById('toast'), toastTimer = null;
  document.getElementById('addBtn').addEventListener('click', function () {
    C.add({
      model: model.name,
      series: model.series,
      base: model.price,
      size: state.size,
      color: COLORS[state.color].name,
      sel: currentSel(),
      lines: currentLines(),
      qty: state.qty
    });
    toast.classList.add('show');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(function () { toast.classList.remove('show'); }, 5000);
  });

  update();
})();
