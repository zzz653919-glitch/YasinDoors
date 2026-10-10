/* ===== YasinDoors — script.js (barcha sahifalar uchun yagona frontend JS) ===== */
(() => {
  'use strict';

  /* ---------- 1. Mahsulotlar (yagona manba) ---------- */
  // color: oq | qora | jigarrang | yogoch ; style: modern | classic ; badge: new | best | premium | sale | limited
  // Haqiqiy foto qo‘shish uchun mahsulotga `image: 'img/nom.jpg'` maydonini yozing — SVG o‘rniga shu ishlatiladi.
  const BADGES = { new: 'Yangi', best: 'Bestseller', premium: 'Premium', sale: 'Sale', limited: 'Limited' };
  const PRODUCTS = [
    { id: 1, name: 'Nordic White', price: 2450000, color: 'oq', style: 'modern', hex: '#f1f0ec', edge: '#d8d6cf', tags: 'white oq modern minimal', badge: 'new',
      desc: 'Toza oq rangdagi minimalist MDF eshik.', long: 'Yorug‘ interyerlar uchun silliq, mat qoplamali zamonaviy eshik.', material: 'MDF + mat PVX qoplama', colorName: 'Oq', styleName: 'Modern', stock: true },
    { id: 2, name: 'Noir Line', price: 2890000, color: 'qora', style: 'modern', hex: '#2a2a2c', edge: '#121213', tags: 'black qora modern minimal',
      desc: 'Vertikal chiziqli qora MDF eshik.', long: 'Kontrastli, premium ko‘rinishdagi qora eshik. Vertikal naqsh dizaynga chuqurlik beradi.', material: 'MDF + mat PVX qoplama', colorName: 'Qora', styleName: 'Modern', stock: true },
    { id: 3, name: 'Classic Oak', price: 3150000, color: 'yogoch', style: 'classic', hex: '#b98a55', edge: '#8f6636', tags: 'oak yogoch wood classic eman', badge: 'best',
      desc: 'Klassik panelli eman rangidagi eshik.', long: 'Issiq yog‘och tekstura va klassik panellar an’anaviy interyerga mos keladi.', material: 'MDF + shpon ko‘rinishidagi qoplama', colorName: 'Eman', styleName: 'Classic', stock: true },
    { id: 4, name: 'Walnut Prime', price: 3390000, color: 'jigarrang', style: 'classic', hex: '#6b4a33', edge: '#4a3022', tags: 'walnut brown jigarrang classic yongoq', badge: 'premium',
      desc: 'Boy jigarrang yong‘oq rangli eshik.', long: 'Chuqur jigarrang ton va nafis panellar bilan premium klassik model.', material: 'MDF + yong‘oq tekstura', colorName: 'Jigarrang', styleName: 'Classic', stock: true },
    { id: 5, name: 'Pearl Classic', price: 2790000, color: 'oq', style: 'classic', hex: '#e8e4da', edge: '#cfc9bb', tags: 'white oq classic pearl',
      desc: 'Nafis panelli och rangli klassik eshik.', long: 'Yumshoq marvarid tusi va ko‘tarma panellar uyga tinch muhit beradi.', material: 'MDF + emal qoplama', colorName: 'Oq', styleName: 'Classic', stock: true },
    { id: 6, name: 'Urban Oak', price: 2990000, old: 3390000, color: 'yogoch', style: 'modern', hex: '#c49a6a', edge: '#9a7347', tags: 'oak yogoch wood modern', badge: 'sale',
      desc: 'Zamonaviy vertikal naqshli yog‘och eshik.', long: 'Tabiiy yog‘och tusi va zamonaviy chiziqlar uyg‘unligi.', material: 'MDF + yog‘och tekstura', colorName: 'Yog‘och', styleName: 'Modern', stock: true },
    { id: 7, name: 'Espresso Modern', price: 3250000, color: 'jigarrang', style: 'modern', hex: '#4a3328', edge: '#33231b', tags: 'brown espresso jigarrang modern minimal',
      desc: 'To‘q jigarrang zamonaviy MDF eshik.', long: 'Espresso ranglari chuqur va elegant ko‘rinish yaratadi.', material: 'MDF + mat PVX qoplama', colorName: 'Jigarrang', styleName: 'Modern', stock: true },
    { id: 8, name: 'Onyx Classic', price: 3490000, color: 'qora', style: 'classic', hex: '#2b2b2d', edge: '#151516', tags: 'black qora classic onyx', badge: 'limited',
      desc: 'Qora rangli nafis klassik eshik.', long: 'Boy panel naqshlari va chuqur qora rang — hashamatli yechim.', material: 'MDF + emal qoplama', colorName: 'Qora', styleName: 'Classic', stock: false },
  ];
  const FILTERS = [['all', 'Barchasi'], ['classic', 'Classic'], ['modern', 'Modern'], ['minimal', 'Minimal'], ['yogoch', 'Wood'], ['oq', 'White'], ['qora', 'Black']];
  const NAV = [['index.html', 'Home', 'home'], ['doors.html', 'MDF Eshiklar', 'doors'], ['about.html', 'Biz haqimizda', 'about'], ['contact.html', 'Aloqa', 'contact']];
  const DELIVERY = { fee: 100000, freeFrom: 5000000 }; // 5 mln dan yuqori buyurtmada yetkazib berish bepul

  /* ---------- 2. SVG ikonlar (bir xil stroke va o‘lcham) ---------- */
  const I = d => `<svg class="i" viewBox="0 0 24 24" aria-hidden="true">${d}</svg>`;
  const ICON = {
    heart: I('<path d="M12 20.5s-7.5-4.6-9.2-9.4C1.6 7.8 3.6 4.5 7 4.5c2 0 3.7 1.1 5 3 1.3-1.9 3-3 5-3 3.4 0 5.4 3.3 4.2 6.6-1.7 4.8-9.2 9.4-9.2 9.4z"/>'),
    bag: I('<path d="M5 8h14l-1 12H6L5 8z"/><path d="M9 8V6.5a3 3 0 016 0V8"/>'),
    search: I('<circle cx="11" cy="11" r="6.5"/><path d="M20 20l-4.2-4.2"/>'),
    x: I('<path d="M6 6l12 12M18 6L6 18"/>'), arrow: I('<path d="M5 12h14M13 6l6 6-6 6"/>'), down: I('<path d="M12 5v14M6 13l6 6 6-6"/>'),
    pin: I('<path d="M12 21s7-6.2 7-11.5A7 7 0 005 9.5C5 14.8 12 21 12 21z"/><circle cx="12" cy="9.5" r="2.5"/>'),
    phone: I('<path d="M5 4h4l2 5-2.5 1.5a11 11 0 005 5L15 13l5 2v4a2 2 0 01-2 2A15 15 0 013 6a2 2 0 012-2z"/>'),
    clock: I('<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>'), mail: I('<rect x="3" y="5" width="18" height="14" rx="2"/><path d="M3 7l9 6 9-6"/>'),
    check: I('<circle cx="12" cy="12" r="9"/><path d="M8 12.5l2.7 2.7L16 9.5"/>'),
    sun: I('<circle cx="12" cy="12" r="4"/><path d="M12 3v2M12 19v2M3 12h2M19 12h2M5.6 5.6L7 7M17 17l1.4 1.4M18.4 5.6L17 7M7 17l-1.4 1.4"/>'),
    moon: I('<path d="M20 14.5A8 8 0 019.5 4 8 8 0 1020 14.5z"/>'),
    layers: I('<path d="M12 3l9 5-9 5-9-5 9-5z"/><path d="M3 13l9 5 9-5"/>'), award: I('<circle cx="12" cy="9" r="6"/><path d="M8.5 14L7 21l5-3 5 3-1.5-7"/>'),
    cal: I('<rect x="3" y="5" width="18" height="16" rx="2"/><path d="M3 10h18M8 3v4M16 3v4"/>'), pen: I('<path d="M4 20l1-4L16 5l3 3L8 19l-4 1z"/>'),
    ruler: I('<path d="M3 17L17 3l4 4L7 21l-4-4z"/><path d="M8 12l2 2M11 9l2 2M14 6l2 2"/>'), factory: I('<path d="M3 20V9l6 3V9l6 3V5h6v15H3z"/>'),
    shield: I('<path d="M12 3l8 3v6c0 5-3.4 8.3-8 9-4.6-.7-8-4-8-9V6l8-3z"/><path d="M8.5 12l2.5 2.5 4.5-5"/>'),
    door: I('<rect x="6" y="3" width="12" height="18" rx="1.5"/><circle cx="15" cy="12" r=".8"/><path d="M3 21h18"/>'),
    eye: I('<path d="M2 12s3.6-7 10-7 10 7 10 7-3.6 7-10 7S2 12 2 12z"/><circle cx="12" cy="12" r="3"/>'),
    plus: I('<path d="M12 5v14M5 12h14"/>'), minus: I('<path d="M5 12h14"/>'),
    trash: I('<path d="M4 7h16M10 11v6M14 11v6M6 7l1 13h10l1-13M9 7V4h6v3"/>'),
    insta: I('<rect x="3" y="3" width="18" height="18" rx="5"/><circle cx="12" cy="12" r="4"/><circle cx="17.3" cy="6.7" r=".6"/>'),
    tg: I('<path d="M21 4L3 11l6 2 2 6 3-4 5 4z"/><path d="M9 13l12-9"/>'), grid: I('<rect x="4" y="4" width="7" height="7" rx="1.5"/><rect x="13" y="4" width="7" height="7" rx="1.5"/><rect x="4" y="13" width="7" height="7" rx="1.5"/><rect x="13" y="13" width="7" height="7" rx="1.5"/>'),
    home: I('<path d="M4 11l8-7 8 7v9H4v-9z"/><path d="M10 20v-6h4v6"/>')
  };

  /* ---------- 3. Yordamchilar va saqlash ---------- */
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const find = id => PRODUCTS.find(p => p.id === +id);
  const money = n => n.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ' ') + ' so‘m';
  const store = {
    get(k, d) { try { const v = JSON.parse(localStorage.getItem(k)); return v ?? d; } catch { return d; } },
    set(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch { /* storage mavjud emas */ } }
  };
  const root = document.documentElement, page = document.body.dataset.page;
  const savedCart = store.get('cart', {}), savedFavs = store.get('favorites', []);
  let cart = Object.fromEntries(Object.entries(savedCart && typeof savedCart === 'object' ? savedCart : {}).filter(([id, q]) => find(id) && Number.isInteger(q) && q > 0));
  let favs = Array.isArray(savedFavs) ? savedFavs.filter(find) : [];

  /* Server manzili. Sayt Node server orqali ochilsa (localhost:3000 yoki hosting) — bir xil manzil.
     “Live Server” yoki fayldan ochilgan bo‘lsa — localhost:3000 ga murojaat qilinadi. Boshqa manzil kerak bo‘lsa: window.YD_API = 'https://...' */
  const API = window.YD_API !== undefined ? window.YD_API
    : (['', 'localhost', '127.0.0.1'].includes(location.hostname) && location.port !== '3000' ? 'http://localhost:3000' : '');

  /* Server tirikmi va yangimi? ('' = yaxshi, 'down' = ishlamayapti, 'old' = eski versiya ishlayapti) */
  async function checkServer() {
    const ctl = new AbortController(), timer = setTimeout(() => ctl.abort(), 3000);
    try {
      const r = await fetch(API + '/api/health', { signal: ctl.signal, cache: 'no-store' });
      const d = r.ok ? await r.json().catch(() => null) : null;
      return d && d.version >= 3 ? '' : 'old';
    } catch { return 'down'; } finally { clearTimeout(timer); }
  }

  /* ---------- 3b. Katalog serverdan (admin panel bilan bir xil mahsulot, narx va yetkazib berish).
     Server javob bermasa — yuqoridagi o‘rnatilgan ro‘yxat ishlayveradi ---------- */
  async function loadCatalog() {
    const ctl = new AbortController(), timer = setTimeout(() => ctl.abort(), 2500);
    try {
      const r = await fetch(API + '/api/catalog', { signal: ctl.signal, cache: 'no-store' });
      const d = r.ok ? await r.json() : null;
      if (!d || !d.ok || !Array.isArray(d.products) || !d.products.length) return;
      PRODUCTS.splice(0, PRODUCTS.length, ...d.products);
      if (d.settings) { DELIVERY.fee = d.settings.deliveryFee; DELIVERY.freeFrom = d.settings.freeFrom; }
      cart = Object.fromEntries(Object.entries(cart).filter(([id]) => find(id)));   // o‘chirilgan mahsulotlar savatdan tushadi
      favs = favs.filter(find);
      store.set('cart', cart); store.set('favorites', favs);
    } catch { /* server yo‘q: o‘rnatilgan ro‘yxat ishlaydi */ }
    finally { clearTimeout(timer); }
  }

  /* ---------- 4. Realistik eshik sahnasi (SVG: devor, pol, yorug‘lik, yog‘och teksturasi) ---------- */
  const scenes = {};
  function doorImg(p) {
    if (p.image) return p.image;
    if (scenes[p.id]) return scenes[p.id];
    const wood = p.color === 'yogoch' || p.color === 'jigarrang', hl = 'rgba(255,255,255,.3)', sh = 'rgba(0,0,0,.3)';
    const bevel = (x, y, w, h) => `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="2" fill="${p.edge}" opacity=".3"/><path d="M${x} ${y + h}V${y}H${x + w}" fill="none" stroke="${hl}" stroke-width="2"/><path d="M${x + w} ${y}V${y + h}H${x}" fill="none" stroke="${sh}" stroke-width="2"/>`;
    const groove = x => `<path d="M${x} 70V366" stroke="${sh}" stroke-width="2"/><path d="M${x + 2} 70V366" stroke="${hl}" stroke-width="1.5"/>`;
    const detail = p.style === 'classic' ? bevel(134, 76, 60, 124) + bevel(206, 76, 60, 124) + bevel(134, 218, 60, 130) + bevel(206, 218, 60, 130)
      : (p.tags.includes('minimal') ? groove(200) : [150, 175, 200, 225, 250].map(groove).join(''));
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 500" preserveAspectRatio="xMidYMid slice"><defs>
<linearGradient id="w" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#f1ede6"/><stop offset="1" stop-color="#ddd6ca"/></linearGradient>
<linearGradient id="f" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#ad987b"/><stop offset="1" stop-color="#6c5c48"/></linearGradient>
<linearGradient id="s" x1="0" x2="1"><stop offset="0" stop-color="#fff" stop-opacity=".22"/><stop offset=".5" stop-color="#fff" stop-opacity="0"/><stop offset="1" stop-color="#000" stop-opacity=".18"/></linearGradient>
<linearGradient id="m" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#f6f6f6"/><stop offset=".5" stop-color="#9c9c9c"/><stop offset="1" stop-color="#e4e4e4"/></linearGradient>
<linearGradient id="l" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#fff" stop-opacity=".55"/><stop offset="1" stop-color="#fff" stop-opacity="0"/></linearGradient>
<filter id="g" x="0" y="0" width="100%" height="100%"><feTurbulence type="fractalNoise" baseFrequency="${wood ? '.012 .3' : '.6'}" numOctaves="3" seed="${p.id}"/><feColorMatrix values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 1.1 -.42"/></filter>
<filter id="b" x="-20%" y="-50%" width="140%" height="200%"><feGaussianBlur stdDeviation="6"/></filter></defs>
<rect width="400" height="500" fill="url(#w)"/><rect y="380" width="400" height="120" fill="url(#f)"/>
<rect y="364" width="400" height="16" fill="#f7f4ef"/><rect y="378" width="400" height="2" fill="#000" opacity=".16"/>
<polygon points="116,380 284,380 372,500 28,500" fill="url(#l)" opacity=".32"/>
<rect x="298" y="46" width="44" height="336" fill="#000" opacity=".18" filter="url(#b)"/>
<rect x="100" y="40" width="200" height="340" fill="#f3efe9"/><rect x="100" y="40" width="200" height="340" fill="none" stroke="#000" stroke-opacity=".12"/>
<rect x="116" y="56" width="168" height="324" fill="${p.hex}"/><rect x="116" y="56" width="168" height="324" filter="url(#g)" opacity="${wood ? .4 : .1}"/>
${detail}<rect x="116" y="56" width="168" height="324" fill="url(#s)"/>
<path d="M116 56H196L150 380H116z" fill="url(#l)" opacity=".16"/>
<rect x="236" y="213" width="40" height="7" rx="3.5" fill="url(#m)" stroke="#777" stroke-width=".6"/><circle cx="270" cy="216" r="11" fill="url(#m)" stroke="#777" stroke-width=".6"/>
<ellipse cx="200" cy="384" rx="112" ry="6" fill="#000" opacity=".32" filter="url(#b)"/></svg>`;
    return (scenes[p.id] = 'data:image/svg+xml;utf8,' + encodeURIComponent(svg));
  }
  const img = (p, lazy = true) => `<img src="${doorImg(p)}" alt="${p.name} — ${p.colorName.toLowerCase()} ${p.styleName} MDF eshik" width="400" height="500"${lazy ? ' loading="lazy"' : ''} decoding="async">`;

  /* ---------- 5. Umumiy qismlar: header, tabbar, footer, CTA, toast, modal ---------- */
  const counter = (k, cls = 'badge') => `<span class="${cls}" data-count="${k}">0</span>`;
  function renderLayout() {
    const links = NAV.map(([h, t, k]) => `<li><a href="${h}"${page === k ? ' class="active" aria-current="page"' : ''}>${t}</a></li>`).join('');
    $('#site-header').innerHTML = `<div class="container header__in">
      <a href="index.html" class="logo" aria-label="YasinDoors — bosh sahifa">${ICON.door}<span class="logo__t"><b>YASIN</b><i>DOORS</i></span></a>
      <nav class="nav" id="nav" aria-label="Asosiy menyu"><ul>${links}
        <li class="only-m"><a href="favorites.html">${ICON.heart}Sevimlilar ${counter('fav', 'count')}</a></li>
        <li class="only-m"><a href="cart.html">${ICON.bag}Savat ${counter('cart', 'count')}</a></li></ul></nav>
      <div class="actions">
        <a href="doors.html?focus=search" class="ibtn" data-act="search" aria-label="MDF eshik qidirish">${ICON.search}</a>
        <a href="favorites.html" class="ibtn hm" aria-label="Sevimlilar">${ICON.heart}${counter('fav')}</a>
        <a href="cart.html" class="ibtn hm" aria-label="Savat">${ICON.bag}${counter('cart')}</a>
        <button class="ibtn" data-act="theme" id="themeBtn" aria-label="Dark / Light rejimni almashtirish"><span class="t-sun">${ICON.sun}</span><span class="t-moon">${ICON.moon}</span></button>
        <button class="ibtn burger" id="burger" aria-label="Menyuni ochish" aria-expanded="false" aria-controls="nav"><span></span><span></span><span></span></button>
      </div></div>`;
    const foot = [['index.html', 'Bosh sahifa'], ...NAV.slice(1).map(([h, t]) => [h, t]), ['cart.html', 'Savat'], ['favorites.html', 'Sevimlilar']].map(([h, t]) => `<li><a href="${h}">${t}</a></li>`).join('');
    $('#site-footer').innerHTML = `<div class="container"><div class="footer__in">
      <div><a href="index.html" class="logo" aria-label="YasinDoors — bosh sahifa">${ICON.door}<span class="logo__t"><b>YASIN</b><i>DOORS</i></span></a><p>Zamonaviy MDF eshiklar</p>
        <div class="social"><a href="#" aria-label="Instagram">${ICON.insta}</a><a href="#" aria-label="Telegram">${ICON.tg}</a></div></div>
      <nav aria-label="Footer menyusi"><ul>${foot}</ul></nav></div><small>© 2026 YasinDoors</small></div>`;
    const cta = $('#site-cta');
    if (cta) cta.innerHTML = `<div class="container reveal"><h2>Uyingiz uchun ideal MDF eshikni tanlang</h2><p>YasinDoors bilan makoningizga zamonaviy ko‘rinish bering.</p><a href="contact.html" class="btn btn--p">Biz bilan bog‘lanish ${ICON.arrow}</a></div>`;
    const tab = (h, ic, t, k, c) => `<a href="${h}"${page === k ? ' class="active" aria-current="page"' : ''}>${ICON[ic]}<span>${t}</span>${c ? counter(c) : ''}</a>`;
    document.body.insertAdjacentHTML('beforeend', `<nav class="tabbar" aria-label="Tezkor menyu">${tab('index.html', 'home', 'Asosiy', 'home')}${tab('doors.html', 'grid', 'Katalog', 'doors')}${tab('favorites.html', 'heart', 'Sevimli', 'favorites', 'fav')}${tab('cart.html', 'bag', 'Savat', 'cart', 'cart')}</nav>
      <div class="progress" id="progress"></div><div class="toasts" id="toasts" role="status" aria-live="polite"></div>
      <div class="modal" id="modal" role="dialog" aria-modal="true" aria-label="Mahsulot tafsilotlari"><div class="modal__box" id="modalBox"></div></div>`);
    $$('[data-icon]').forEach(el => { el.innerHTML = ICON[el.dataset.icon] || ''; });
  }

  /* ---------- 6. Dark / Light, toast ---------- */
  function applyTheme(t, save) {
    root.dataset.theme = t;
    if (save) { try { localStorage.setItem('theme', t); } catch { /* ignore */ } }
    $('#themeBtn').setAttribute('aria-label', t === 'dark' ? 'Light rejimga o‘tish' : 'Dark rejimga o‘tish');
  }
  const toggleTheme = () => applyTheme(root.dataset.theme === 'dark' ? 'light' : 'dark', true);
  function toast(msg) {
    const el = document.createElement('div');
    el.className = 'toast'; el.innerHTML = ICON.check + '<span></span>'; $('span', el).textContent = msg;
    $('#toasts').appendChild(el);
    setTimeout(() => { el.classList.add('out'); setTimeout(() => el.remove(), 300); }, 2300);
  }

  /* ---------- 7. Savat va sevimlilar ---------- */
  const cartCount = () => Object.values(cart).reduce((a, b) => a + b, 0);
  function totals() {
    const sub = Object.keys(cart).reduce((s, id) => s + find(id).price * cart[id], 0);
    const fee = sub && sub < DELIVERY.freeFrom ? DELIVERY.fee : 0;
    return { sub, fee, total: sub + fee };
  }
  function updateCounts() {
    $$('[data-count="cart"]').forEach(e => { e.textContent = cartCount(); });
    $$('[data-count="fav"]').forEach(e => { e.textContent = favs.length; });
  }
  function commit() { store.set('cart', cart); store.set('favorites', favs); updateCounts(); renderPage(); syncModal(); }
  function addCart(id, n = 1) { cart[id] = (cart[id] || 0) + n; commit(); toast('Mahsulot savatga qo‘shildi'); }
  function setQty(id, d) { cart[id] = (cart[id] || 0) + d; if (cart[id] <= 0) delete cart[id]; commit(); }
  function removeCart(id) { delete cart[id]; commit(); toast('Mahsulot savatdan olib tashlandi'); }
  function toggleFav(id) {
    const on = favs.includes(id);
    favs = on ? favs.filter(x => x !== id) : [...favs, id];
    commit(); toast(on ? 'Mahsulot sevimlilardan olib tashlandi' : 'Sevimlilarga qo‘shildi');
    if (!on) $$(`.fav[data-id="${id}"]`).forEach(b => {
      b.classList.add('pop');
      for (let k = 0; k < 6; k++) { const s = document.createElement('i'); s.className = 'spark'; s.style.setProperty('--a', k * 60 + 'deg'); b.appendChild(s); setTimeout(() => s.remove(), 600); }
    });
  }

  /* ---------- 8. Sahifalarni chizish ---------- */
  const card = p => {
    const fav = favs.includes(p.id);
    return `<article class="card reveal in"><div class="card__img">${img(p)}${p.badge ? `<span class="pbadge pbadge--${p.badge}">${BADGES[p.badge]}</span>` : ''}
      <button class="fav" data-act="fav" data-id="${p.id}" aria-pressed="${fav}" aria-label="${fav ? 'Sevimlilardan olib tashlash' : 'Sevimlilarga qo‘shish'}: ${p.name}">${ICON.heart}</button>
      <div class="card__ov"><button class="btn btn--glass btn--sm" data-act="details" data-id="${p.id}" aria-label="Tezkor ko‘rish: ${p.name}">${ICON.eye}Tezkor ko‘rish</button></div></div>
      <div class="card__body"><span class="tag">${p.styleName} · ${p.colorName}</span><h3>${p.name}</h3><p>${p.desc}</p>
        <div class="price">${money(p.price)}${p.old ? `<s>${money(p.old)}</s>` : ''}</div>
        <div class="card__act"><button class="btn btn--p btn--sm" data-act="cart" data-id="${p.id}" aria-label="Savatga qo‘shish: ${p.name}">${ICON.bag}Savatga</button>
        <button class="btn btn--o btn--sm touch" data-act="details" data-id="${p.id}" aria-label="Batafsil: ${p.name}">Batafsil</button></div></div></article>`;
  };
  const emptyBox = (ic, title, text) => `<div class="empty">${ICON[ic]}<h3>${title}</h3><p>${text}</p><a class="btn btn--p" href="doors.html">Katalogga o‘tish</a></div>`;
  const view = { f: 'all', q: '', sort: 'rec' };
  const sorts = { asc: (a, b) => a.price - b.price, desc: (a, b) => b.price - a.price, az: (a, b) => a.name.localeCompare(b.name), za: (a, b) => b.name.localeCompare(a.name) };
  function renderDoors() {
    const q = view.q.trim().toLowerCase();
    let list = PRODUCTS.filter(p => (view.f === 'all' || [p.color, p.style, ...p.tags.split(' ')].includes(view.f)) &&
      (!q || `${p.name} ${p.desc} ${p.tags} ${p.colorName} ${p.styleName} ${p.material}`.toLowerCase().includes(q)));
    if (sorts[view.sort]) list = [...list].sort(sorts[view.sort]);
    $('#doorsGrid').innerHTML = list.length ? list.map(card).join('') : `<div class="empty">${ICON.search}<h3>Mahsulot topilmadi</h3><p>Boshqa so‘z yoki filtrni sinab ko‘ring.</p></div>`;
  }
  function renderCart() {
    const items = Object.keys(cart).map(id => ({ p: find(id), q: cart[id] })), t = totals();
    $('#cartRoot').innerHTML = items.length ? `<div class="cart"><div>${items.map(({ p, q }) => `<div class="row">${img(p)}
      <div><h3>${p.name}</h3><p>${money(p.price)}</p></div>
      <div class="qty"><button data-act="minus" data-id="${p.id}" aria-label="Kamaytirish: ${p.name}">${ICON.minus}</button><span aria-live="polite">${q}</span><button data-act="plus" data-id="${p.id}" aria-label="Ko‘paytirish: ${p.name}">${ICON.plus}</button></div>
      <div class="sub">${money(p.price * q)}</div>
      <button class="rm" data-act="remove" data-id="${p.id}" aria-label="O‘chirish: ${p.name}">${ICON.trash}</button></div>`).join('')}</div>
      <aside class="sum"><h3>Buyurtma xulosasi</h3><dl><dt>Mahsulotlar (${cartCount()} ta):</dt><dd>${money(t.sub)}</dd></dl>
      <dl><dt>Yetkazib berish:</dt><dd>${t.fee ? money(t.fee) : 'Bepul'}</dd></dl><dl class="total"><dt>Jami:</dt><dd>${money(t.total)}</dd></dl>
      <button class="btn btn--p" data-act="checkout">Zakaz berish ${ICON.arrow}</button></aside></div>` :
      emptyBox('bag', 'Savatingiz bo‘sh', 'Katalogdan o‘zingizga mos MDF eshikni tanlang.');
  }
  function renderPage() {
    if (page === 'home') $('#featured').innerHTML = PRODUCTS.slice(0, 6).map(card).join('');
    if (page === 'doors') renderDoors();
    if (page === 'favorites') { const l = PRODUCTS.filter(p => favs.includes(p.id)); $('#favGrid').innerHTML = l.length ? l.map(card).join('') : emptyBox('heart', 'Sevimli mahsulotlar hozircha yo‘q', 'O‘zingizga yoqqan eshiklarni saqlab qo‘ying.'); }
    if (page === 'cart') renderCart();
  }

  /* ---------- 9. Modal: tezkor ko‘rish ---------- */
  let modalId = null, modalQty = 1, lastFocus = null;
  const boxClass = c => { $('#modalBox').className = 'modal__box' + (c ? ' ' + c : ''); };
  function syncModal() {
    if (!modalId) return;
    const p = find(modalId), on = favs.includes(p.id); boxClass();
    $('#modalBox').innerHTML = `<button class="modal__x" data-act="close" aria-label="Yopish">${ICON.x}</button>
      <div class="modal__img">${img(p, false)}</div>
      <div class="modal__txt"><p class="eyebrow">${p.styleName} · ${p.colorName}</p><h2>${p.name}</h2>
      <div class="price">${money(p.price)}${p.old ? `<s>${money(p.old)}</s>` : ''}</div><p>${p.long}</p>
      <ul class="spec"><li><span>Material</span>${p.material}</li><li><span>Rang</span>${p.colorName}</li><li><span>Uslub</span>${p.styleName}</li><li><span>Mavjudligi</span>${p.stock ? 'Mavjud' : 'Buyurtma asosida'}</li></ul>
      <div class="card__act"><div class="qty"><button data-act="mq-" aria-label="Kamaytirish">${ICON.minus}</button><span aria-live="polite">${modalQty}</span><button data-act="mq+" aria-label="Ko‘paytirish">${ICON.plus}</button></div>
      <button class="btn btn--p" data-act="cartq" data-id="${p.id}" aria-label="Savatga qo‘shish">${ICON.bag}Savatga</button></div>
      <button class="btn btn--o" data-act="fav" data-id="${p.id}" aria-pressed="${on}">${ICON.heart}${on ? 'Sevimlilarda' : 'Sevimlilarga qo‘shish'}</button></div>`;
  }
  const openBox = () => { $('#modal').classList.add('open'); document.body.classList.add('lock'); };
  function openModal(id) { lastFocus = document.activeElement; modalId = +id; modalQty = 1; syncModal(); openBox(); $('.modal__x').focus(); }
  function closeModal() {
    if (!$('#modal').classList.contains('open')) return;
    modalId = null; $('#modal').classList.remove('open'); document.body.classList.remove('lock'); if (lastFocus) lastFocus.focus();
  }

  /* ---------- 10. Formalar: real-time validatsiya ---------- */
  function bindValidation(f, rules, pre) {
    const check = (k, force) => {
      const i = f.elements[k]; if (!force && !i.dataset.t) return true;
      const r = rules[k](i.value); i.classList.toggle('bad', r !== true); $('#' + pre + k).textContent = r === true ? '' : r; return r === true;
    };
    Object.keys(rules).forEach(k => { const i = f.elements[k]; i.addEventListener('blur', () => { i.dataset.t = 1; check(k); }); i.addEventListener('input', () => check(k)); });
    return () => Object.keys(rules).map(k => check(k, true)).every(Boolean);
  }
  const phoneOk = v => { const d = v.replace(/\D/g, ''); return (/^\+?[\d\s()-]+$/.test(v.trim()) && d.length >= 9 && d.length <= 13) || 'Telefon raqamni to‘g‘ri kiriting. Masalan: +998 90 123 45 67'; };
  function initContact() {
    const f = $('#contactForm');
    const valid = bindValidation(f, {
      name: v => v.trim().length >= 2 || 'Ismingizni kiriting.', phone: phoneOk,
      message: v => v.trim().length >= 10 || 'Xabar kamida 10 ta belgidan iborat bo‘lsin.'
    }, 'e-');
    f.addEventListener('submit', e => { e.preventDefault(); if (!valid()) return; f.reset(); $$('.field', f).forEach(i => delete i.dataset.t); toast('Xabaringiz qabul qilindi!'); });
  }

  /* ---------- 11. Zakaz: POST /api/order -> server.js -> Telegram ---------- */
  const ORDER_ERR = 'Zakaz yuborilmadi. Iltimos, qaytadan urinib ko‘ring.';
  const fl = (id, name, label, ph, extra = '') => `<div class="fl"><input class="field" id="${id}" name="${name}" placeholder=" " ${extra}><label for="${id}">${label}</label><div class="err" id="e-o-${name}"></div></div>`;
  function openOrder() {
    if (!cartCount()) return;
    lastFocus = document.activeElement; modalId = null; boxClass('order');
    $('#modalBox').innerHTML = `<button class="modal__x" data-act="close" aria-label="Yopish">${ICON.x}</button>
      <form class="order-form" id="orderForm" novalidate><h2>Zakaz berish</h2><p>Umumiy summa: <b>${money(totals().total)}</b></p>
      ${fl('o-name', 'name', 'Ism', '', 'autocomplete="name" maxlength="100"')}${fl('o-phone', 'phone', 'Telefon raqam', '', 'type="tel" autocomplete="tel" maxlength="30"')}
      ${fl('o-address', 'address', 'Manzil', '', 'autocomplete="street-address" maxlength="300"')}
      <div class="fl"><textarea class="field" id="o-note" name="note" placeholder=" " rows="3" maxlength="500"></textarea><label for="o-note">Qo‘shimcha izoh</label></div>
      <div class="notice" id="o-err" role="alert"></div><button class="btn btn--p" type="submit" id="orderBtn">Zakazni yuborish</button></form>`;
    openBox(); $('#o-name').focus();
    checkServer().then(st => {     // zakaz serveri ishlamayotgan bo‘lsa, forma to‘ldirilmasdanoq aytamiz
      const box = $('#o-err'); if (!st || !box) return;
      box.innerHTML = ICON.x + '<span></span>';
      $('span', box).textContent = st === 'down'
        ? 'Zakaz serveri bilan aloqa yo‘q. Terminalda “node server.js” ishlab turganini tekshiring.'
        : 'Eski server ishlab turibdi (yangi kod yuklanmagan). Barcha terminallarni yoping (Windows: “taskkill /F /IM node.exe”), so‘ng “node server.js” ni qayta ishga tushiring.';
    });
    const f = $('#orderForm');
    const valid = bindValidation(f, { name: v => v.trim().length >= 2 || 'Ismingizni kiriting.', phone: phoneOk, address: v => v.trim().length >= 5 || 'Manzilni kiriting.' }, 'e-o-');
    f.addEventListener('submit', e => { e.preventDefault(); if (valid()) sendOrder(f); });
  }
  async function sendOrder(f) {
    const btn = $('#orderBtn'), t = totals(), el = f.elements;
    const items = Object.keys(cart).map(id => ({ id: +id, qty: cart[id] }));   // nom va narxni server katalogdan oladi
    btn.disabled = true; btn.textContent = 'Yuborilmoqda…'; $('#o-err').innerHTML = '';
    const ctl = new AbortController(), timer = setTimeout(() => ctl.abort(), 15000);
    try {
      const r = await fetch(API + '/api/order', { method: 'POST', headers: { 'Content-Type': 'application/json' }, signal: ctl.signal,
        body: JSON.stringify({ name: el.name.value, phone: el.phone.value, address: el.address.value, note: el.note.value, items, delivery: t.fee }) });
      const isJson = (r.headers.get('content-type') || '').includes('json');
      const d = isJson ? await r.json().catch(() => ({})) : null;
      if (!d) throw Object.assign(new Error('no-api'), { hint: r.status === 404
        ? 'Serverda zakaz manzili topilmadi: 3000-portda ESKI server ishlab turibdi. Barcha terminal oynalarini yoping (Windows: “taskkill /F /IM node.exe”), so‘ng “node server.js” ni qayta ishga tushiring.'
        : `Server kutilmagan javob qaytardi (${r.status}). Saytni “node server.js” ni ishga tushirib, http://localhost:3000 orqali oching.` });
      if (!r.ok || !d.ok) throw Object.assign(new Error('rejected'), { hint: d.error || '' });
      cart = {}; commit();   // faqat muvaffaqiyatdan keyin savat tozalanadi
      $('#modalBox').innerHTML = `<button class="modal__x" data-act="close" aria-label="Yopish">${ICON.x}</button><div class="state">
        <svg class="bigcheck" viewBox="0 0 52 52" aria-hidden="true"><circle cx="26" cy="26" r="24"/><path d="M15 27l8 8 14-16"/></svg>
        <h2>Zakaz qabul qilindi</h2><p>Tez orada siz bilan bog‘lanamiz.</p><a class="btn btn--p" href="doors.html">Katalogga qaytish</a></div>`;
    } catch (e) {
      // Aniq sababni ko‘rsatamiz (savat saqlanadi, qayta urinish mumkin)
      const hint = e.hint !== undefined ? e.hint : e.name === 'AbortError' ? 'Server javob bermadi (15 soniya). Internetni tekshirib, qayta urinib ko‘ring.'
        : 'Server bilan aloqa yo‘q. “node server.js” ishlab turganini va sayt http://localhost:3000 orqali ochilganini tekshiring.';
      $('#o-err').innerHTML = ICON.x + '<span></span>';
      $('#o-err span').textContent = ORDER_ERR + (hint ? ' ' + hint : '');
      btn.disabled = false; btn.textContent = 'Qayta urinish';
    } finally { clearTimeout(timer); }
  }

  /* ---------- 12. Hodisalar (event delegation) ---------- */
  document.addEventListener('click', e => {
    if (e.target === $('#modal')) return closeModal();
    const b = e.target.closest('[data-act]'); if (!b) return;
    const id = +b.dataset.id, a = b.dataset.act;
    if (a === 'search' && page === 'doors') { e.preventDefault(); $('#search').focus(); return; }
    ({
      fav: () => toggleFav(id), cart: () => addCart(id), cartq: () => { addCart(id, modalQty); closeModal(); }, details: () => openModal(id), close: closeModal,
      plus: () => setQty(id, 1), minus: () => setQty(id, -1), remove: () => removeCart(id), theme: toggleTheme, checkout: openOrder,
      'mq+': () => { modalQty = Math.min(modalQty + 1, 20); syncModal(); }, 'mq-': () => { modalQty = Math.max(modalQty - 1, 1); syncModal(); }
    })[a]?.();
  });
  document.addEventListener('keydown', e => { if (e.key === 'Escape') { closeModal(); closeNav(); } });

  function closeNav() {
    const nav = $('#nav'), burger = $('#burger');
    if (!nav.classList.contains('open')) return;
    nav.classList.remove('open'); document.body.classList.remove('lock');
    burger.setAttribute('aria-expanded', 'false'); burger.setAttribute('aria-label', 'Menyuni ochish');
  }
  function initNav() {
    const nav = $('#nav'), burger = $('#burger'), header = $('#site-header'), bar = $('#progress');
    burger.addEventListener('click', () => {
      const open = nav.classList.toggle('open'); document.body.classList.toggle('lock', open);
      burger.setAttribute('aria-expanded', open); burger.setAttribute('aria-label', open ? 'Menyuni yopish' : 'Menyuni ochish');
    });
    nav.addEventListener('click', e => { if (e.target.closest('a')) closeNav(); });
    document.addEventListener('click', e => { if (!e.target.closest('#nav, #burger')) closeNav(); });
    addEventListener('resize', () => innerWidth > 900 && closeNav());
    const still = matchMedia('(prefers-reduced-motion:reduce)').matches;
    const onScroll = () => {
      header.classList.toggle('scrolled', scrollY > 24);
      const max = document.documentElement.scrollHeight - innerHeight; bar.style.width = (max > 0 ? scrollY / max * 100 : 0) + '%';
      const vis = $('.hero__vis'); if (vis && !still && scrollY < 900) vis.style.setProperty('--py', scrollY * .05 + 'px');
    };
    addEventListener('scroll', onScroll, { passive: true }); onScroll();
  }
  function initDoors() {
    const chips = $('#chips');
    chips.innerHTML = FILTERS.map(([k, t]) => `<button class="chip" data-f="${k}" aria-pressed="${k === 'all'}">${t}</button>`).join('');
    chips.addEventListener('click', e => {
      const c = e.target.closest('.chip'); if (!c) return;
      view.f = c.dataset.f; $$('.chip').forEach(x => x.setAttribute('aria-pressed', x === c)); renderDoors();
    });
    $('#search').addEventListener('input', e => { view.q = e.target.value; renderDoors(); });
    $('#sort').addEventListener('change', e => { view.sort = e.target.value; renderDoors(); });
    if (new URLSearchParams(location.search).get('focus') === 'search') $('#search').focus();
  }
  function initReveal() {
    const items = $$('.reveal:not(.in)');
    if (!('IntersectionObserver' in window)) return items.forEach(el => el.classList.add('in'));
    const io = new IntersectionObserver(es => es.forEach(x => { if (x.isIntersecting) { x.target.classList.add('in'); io.unobserve(x.target); } }), { threshold: .12 });
    items.forEach(el => io.observe(el));
  }

  /* ---------- 13. Ishga tushirish ---------- */
  renderLayout();
  applyTheme(root.dataset.theme || 'light');
  initNav();
  loadCatalog().then(() => {
    updateCounts(); renderPage();
    $$('[data-door]').forEach(el => { const p = find(el.dataset.door) || PRODUCTS[0]; if (p) el.src = doorImg(p); });
    if (page === 'doors') initDoors();
    if (page === 'contact') initContact();
    initReveal();
  });
})();
