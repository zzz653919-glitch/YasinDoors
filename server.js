/* ===== YasinDoors — server.js =====
 * Sayt fayllarini beradi, zakazlarni Telegramga yuboradi va admin panel (/admin) uchun API'ni ishlatadi.
 * Token, chat ID va admin paroli faqat .env dan o‘qiladi — frontend ularni ko‘rmaydi.
 * Ma'lumotlar data/ papkasidagi JSON fayllarda saqlanadi (products, orders, movements, messages, notifications, activity, content, ...). */
'use strict';
require('dotenv').config();
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const express = require('express');

const PORT = process.env.PORT || 3000;
const { TELEGRAM_BOT_TOKEN, TELEGRAM_CHAT_ID } = process.env;
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || '';
const ADMIN_ENABLED = ADMIN_PASSWORD.length >= 8; // 8 belgidan kam parol bilan admin panel o‘chiq turadi

/* ---------- Saqlash (data/*.json) va xatolar logi ---------- */
const DATA_DIR = path.join(__dirname, 'data');
const load = (file, fallback) => { try { return JSON.parse(fs.readFileSync(path.join(DATA_DIR, file), 'utf8')); } catch { return fallback; } };
function save(file, data) { // avval vaqtinchalik faylga yozib, keyin almashtiramiz (yarim yozilgan fayl qolmasin)
  fs.mkdirSync(DATA_DIR, { recursive: true });
  const p = path.join(DATA_DIR, file);
  fs.writeFileSync(p + '.tmp', JSON.stringify(data, null, 2));
  fs.renameSync(p + '.tmp', p);
}
function logError(where, err) { // xatolar data/errors.log fayliga yoziladi (token yashiriladi)
  let line = `${new Date().toISOString()} [${where}] ${(err && (err.stack || err.message)) || err}`;
  if (TELEGRAM_BOT_TOKEN) line = line.split(TELEGRAM_BOT_TOKEN).join('***');
  console.error(line);
  try {
    fs.mkdirSync(DATA_DIR, { recursive: true });
    const f = path.join(DATA_DIR, 'errors.log');
    if (fs.existsSync(f) && fs.statSync(f).size > 1e6) fs.renameSync(f, f + '.old');
    fs.appendFileSync(f, line + '\n');
  } catch { /* log yozib bo‘lmasa, e'tibor bermaymiz */ }
}
process.on('unhandledRejection', e => logError('unhandledRejection', e));
process.on('uncaughtException', e => logError('uncaughtException', e));

// Birinchi ishga tushirishdagi standart katalog (keyin hammasi admin paneldan boshqariladi)
const SEED = [{"id":1,"name":"Classic White","price":2790000,"color":"oq","style":"classic","hex":"#e8e4da","edge":"#cfc9bb","badge":"best","tags":"white oq classic pearl","desc":"Nafis panelli och rangli klassik eshik.","long":"Yumshoq oq tus va ko‘tarma panellar uyga tinch, yorug‘ muhit beradi.","material":"MDF + emal qoplama","colorName":"Oq","styleName":"Classic","stock":true,"old":null,"image":"","hidden":false},{"id":2,"name":"Modern Oak","price":2990000,"color":"yogoch","style":"modern","hex":"#c49a6a","edge":"#9a7347","badge":"","tags":"oak yogoch wood modern","desc":"Zamonaviy chiziqli naqshli yog‘och eshik.","long":"Tabiiy eman tusi va zamonaviy chiziqlar uyg‘unligi.","material":"MDF + yog‘och tekstura","colorName":"Yog‘och","styleName":"Modern","stock":true,"old":null,"image":"","hidden":false},{"id":3,"name":"Black Minimal","price":2890000,"color":"qora","style":"modern","hex":"#232323","edge":"#0f0f0f","badge":"new","tags":"black qora modern minimal","desc":"Vertikal chiziqli qora MDF eshik.","long":"Kontrastli, premium ko‘rinishdagi qora eshik. Vertikal naqsh dizaynga chuqurlik beradi.","material":"MDF + mat PVX qoplama","colorName":"Qora","styleName":"Modern","stock":true,"old":null,"image":"","hidden":false},{"id":4,"name":"Luxury Walnut","price":3390000,"color":"jigarrang","style":"classic","hex":"#6b4a33","edge":"#4a3022","badge":"premium","tags":"walnut brown jigarrang classic yongoq","desc":"Boy jigarrang yong‘oq rangli eshik.","long":"Chuqur jigarrang ton va nafis panellar bilan premium klassik model.","material":"MDF + yong‘oq tekstura","colorName":"Jigarrang","styleName":"Classic","stock":true,"old":null,"image":"","hidden":false},{"id":5,"name":"White Line","price":2450000,"color":"oq","style":"modern","hex":"#f1f0ec","edge":"#d8d6cf","badge":"","tags":"white oq modern minimal","desc":"Toza oq rangdagi minimalist MDF eshik.","long":"Yorug‘ interyerlar uchun silliq, mat qoplamali zamonaviy eshik.","material":"MDF + mat PVX qoplama","colorName":"Oq","styleName":"Modern","stock":true,"old":null,"image":"","hidden":false},{"id":6,"name":"Dark Wood","price":3150000,"color":"yogoch","style":"classic","hex":"#5a3d28","edge":"#3d2819","badge":"","tags":"dark wood yogoch classic","desc":"To‘q yog‘och rangidagi klassik eshik.","long":"Issiq to‘q yog‘och tekstura va klassik panellar an’anaviy interyerga mos keladi.","material":"MDF + shpon ko‘rinishidagi qoplama","colorName":"Yog‘och","styleName":"Classic","stock":true,"old":null,"image":"","hidden":false},{"id":7,"name":"Minimal Gray","price":3250000,"color":"kulrang","style":"modern","hex":"#9a9c9d","edge":"#74777a","badge":"new","tags":"gray grey kulrang modern minimal","desc":"Sokin kulrang tusdagi minimalist eshik.","long":"Neytral kulrang rang deyarli har qanday zamonaviy interyer bilan uyg‘unlashadi.","material":"MDF + mat PVX qoplama","colorName":"Kulrang","styleName":"Modern","stock":true,"old":null,"image":"","hidden":false},{"id":8,"name":"Premium Brown","price":3490000,"color":"jigarrang","style":"modern","hex":"#4a3328","edge":"#33231b","badge":"premium","tags":"brown espresso jigarrang modern","desc":"To‘q jigarrang zamonaviy MDF eshik.","long":"Chuqur jigarrang ranglar elegant va hashamatli ko‘rinish yaratadi.","material":"MDF + mat PVX qoplama","colorName":"Jigarrang","styleName":"Modern","stock":false,"old":null,"image":"","hidden":false}];

const CONTENT_DEFAULT = {
  hero: { badge: 'YASINDOORS · PREMIUM MDF DOORS', title: 'Zamonaviy MDF eshiklar', lead: 'Uyingiz uchun sifat, dizayn va ishonch.' },
  promo: { enabled: false, text: '', linkText: '', link: '' },
  contacts: { phone: '', address: '', hours: '', email: '', telegram: '', instagram: '' },
  faq: [
    { q: 'Buyurtmani qanday beraman?', a: 'Katalogdan eshikni tanlang, savatga qo‘shing va “Zakaz berish” tugmasi orqali ism, telefon va manzilni kiriting. Zakaz bizga darhol yetib boradi va siz bilan bog‘lanamiz.' },
    { q: 'Eshik o‘lchamini qanday aniqlayman?', a: 'Eshik konstruktoridagi o‘lcham maydonlariga kerakli kenglik va balandlikni kiriting. Aniq o‘lchamni biz siz bilan bog‘langanda tasdiqlaymiz.' },
    { q: 'To‘lov va yetkazib berish haqida qayerdan bilaman?', a: 'Yetkazib berish narxi savatda aniq ko‘rsatiladi. To‘lov tartibini buyurtma tasdiqlanganda operator bilan kelishasiz.' }
  ]
};

/* ---------- Ma'lumotlarni yuklash ---------- */
let products = load('products.json', null);
if (!Array.isArray(products)) { products = SEED; save('products.json', products); }
let orders = load('orders.json', []);
let settings = { deliveryFee: 100000, freeFrom: 5000000, ...load('settings.json', {}) };
let seq = load('seq.json', {});
seq = { n: Number.isInteger(seq.n) ? seq.n : orders.reduce((m, o) => Math.max(m, parseInt(String(o.id).replace(/\D/g, ''), 10) || 0), 0), m: Number.isInteger(seq.m) ? seq.m : 0 };
let movements = load('movements.json', []);
let messages = load('messages.json', []);
let notifications = load('notifications.json', []);
let activity = load('activity.json', []);
let customerNotes = load('customers.json', {});
const savedContent = load('content.json', {});
let content = { hero: { ...CONTENT_DEFAULT.hero, ...savedContent.hero }, promo: { ...CONTENT_DEFAULT.promo, ...savedContent.promo },
  contacts: { ...CONTENT_DEFAULT.contacts, ...savedContent.contacts }, faq: Array.isArray(savedContent.faq) ? savedContent.faq : CONTENT_DEFAULT.faq };

/* ---------- Yordamchilar ---------- */
const money = n => String(n).replace(/\B(?=(\d{3})+(?!\d))/g, ' ') + ' so‘m';
const clean = (v, max) => String(v ?? '').replace(/[\u0000-\u0009\u000b-\u001f\u007f]/g, '').trim().slice(0, max);
const fail = (res, code, error) => res.status(code).json({ ok: false, error });
const isInt = (v, min, max) => Number.isInteger(v) && v >= min && v <= max;
const optInt = (v, min, max) => (v === '' || v === null || v === undefined) ? { v: null } : (isInt(Number(v), min, max) ? { v: Number(v) } : { bad: true });
const uid = () => Date.now().toString(36) + crypto.randomBytes(3).toString('hex');
const phoneKey = p => String(p || '').replace(/\D/g, '').slice(-9); // dublikatni aniqlash: telefonning oxirgi 9 raqami

/* Toshkent vaqti (UTC+5) bo‘yicha sanalar */
const TZ = 5 * 3600 * 1000;
const ymd = ts => new Date(new Date(ts).getTime() + TZ).toISOString().slice(0, 10);
const todayYmd = () => ymd(Date.now());
const isYmd = s => typeof s === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(s) && new Date(s + 'T00:00:00Z').toISOString().slice(0, 10) === s;
const addDays = (y, n) => { const d = new Date(y + 'T00:00:00Z'); d.setUTCDate(d.getUTCDate() + n); return d.toISOString().slice(0, 10); };
const addMonths = (m, n) => { const [Y, M] = m.split('-').map(Number); return new Date(Date.UTC(Y, M - 1 + n, 1)).toISOString().slice(0, 7); };
const weekStart = y => { const d = new Date(y + 'T00:00:00Z'); d.setUTCDate(d.getUTCDate() - (d.getUTCDay() + 6) % 7); return d.toISOString().slice(0, 10); };

const COLORS = { // rang guruhi -> rasm uchun standart ranglar
  oq: ['#ece9e1', '#d4d0c5'], qora: ['#262626', '#111111'], jigarrang: ['#6b4a33', '#4a3022'],
  yogoch: ['#b98a55', '#8f6636'], kulrang: ['#9a9c9d', '#74777a']
};
const STYLES = { modern: 'Modern', classic: 'Classic' };
const BADGES = ['', 'new', 'best', 'premium', 'sale', 'limited'];
const STATUSES = ['new', 'confirmed', 'preparing', 'delivering', 'done', 'cancelled'];
const STATUS_LABEL = { new: 'Yangi', confirmed: 'Tasdiqlandi', preparing: 'Tayyorlanmoqda', delivering: 'Yetkazilmoqda', done: 'Yakunlandi', cancelled: 'Bekor qilindi' };

/* ---------- Mahsulot: ombor va chegirma hisoblari ---------- */
const tracked = p => Number.isInteger(p.qty);
const inStock = p => tracked(p) ? p.qty > 0 : !!p.stock;
const isLow = p => tracked(p) && p.minQty > 0 && p.qty > 0 && p.qty <= p.minQty;
const discountState = (p, today = todayYmd()) => {
  if (!(p.discountPercent > 0) || !p.discountStart || !p.discountEnd) return 'none';
  return today < p.discountStart ? 'scheduled' : today > p.discountEnd ? 'expired' : 'active';
};
const effectivePrice = p => discountState(p) === 'active' ? Math.max(1000, Math.round(p.price * (100 - p.discountPercent) / 100 / 100) * 100) : p.price;
function publicProduct(p) { // faqat saytga kerakli maydonlar (tannarx, ta'minotchi, qoldiq soni chiqmaydi)
  const act = discountState(p) === 'active', price = effectivePrice(p);
  return { id: p.id, name: p.name, price, old: act ? p.price : (p.old && p.old > price ? p.old : null), discountPercent: act ? p.discountPercent : 0, discountEnd: act ? p.discountEnd : '',
    color: p.color, style: p.style, hex: p.hex, edge: p.edge, badge: p.badge, tags: p.tags, desc: p.desc, long: p.long, material: p.material,
    colorName: p.colorName, styleName: p.styleName, stock: inStock(p), image: p.image, gallery: p.gallery || [] };
}
const adminProduct = p => ({ ...p, effectivePrice: effectivePrice(p), discountState: discountState(p), inStock: inStock(p), tracked: tracked(p), low: isLow(p) });

/* ---------- Bildirishnomalar, faoliyat tarixi ---------- */
const persist = { notifications: () => save('notifications.json', notifications), activity: () => save('activity.json', activity), movements: () => save('movements.json', movements), messages: () => save('messages.json', messages) };
function notify(type, title, text, link) {
  notifications.unshift({ id: uid(), ts: new Date().toISOString(), type, title, text, link, read: false });
  if (notifications.length > 500) notifications.length = 500;
  persist.notifications();
}
function log(action, text, entity) {
  activity.unshift({ id: uid(), ts: new Date().toISOString(), action, entity: entity || '', text });
  if (activity.length > 2000) activity.length = 2000;
  persist.activity();
}

/* ---------- Ombor harakati ---------- */
function stockAlerts(p, before, after) {
  const was = before === null ? Infinity : before;
  if (after <= 0 && was > 0) notify('out', 'Mahsulot tugadi', `${p.name} omborda qolmadi.`, '#inventory');
  else if (p.minQty > 0 && after <= p.minQty && was > p.minQty) notify('low', 'Qoldiq kam', `${p.name}: ${after} dona qoldi (minimal ${p.minQty}).`, '#inventory');
}
function moveStock(p, newQty, type, note, extra) { // p.qty ni o‘zgartiradi, harakatni yozadi (saqlash chaqiruvchi zimmasida)
  const before = tracked(p) ? p.qty : null;
  p.qty = newQty; p.stock = newQty > 0;
  movements.unshift({ id: uid(), ts: new Date().toISOString(), productId: p.id, productName: p.name, sku: p.sku || '', type, delta: before === null ? null : newQty - before, before, after: newQty, note: note || '', ...extra });
  if (movements.length > 5000) movements.length = 5000;
  stockAlerts(p, before, newQty);
}
const saveStock = () => { save('products.json', products); persist.movements(); };

/* ---------- Migratsiya: eski ma'lumotlarni yo‘qotmasdan yangi tuzilmaga o‘tkazish ---------- */
(function migrate() {
  let pc = false, oc = false;
  products.forEach(p => {
    const d = { sku: '', qty: null, minQty: 0, cost: null, supplier: '', discountPercent: 0, discountStart: '', discountEnd: '', gallery: [] };
    for (const k in d) if (p[k] === undefined) { p[k] = d[k]; pc = true; }
  });
  orders.forEach(o => {
    if (o.status === 'processing') { o.status = 'preparing'; oc = true; }
    if (!STATUSES.includes(o.status)) { o.status = 'new'; oc = true; }
    if (!Array.isArray(o.statusHistory)) { o.statusHistory = [{ status: 'new', ts: o.createdAt }]; if (o.status !== 'new') o.statusHistory.push({ status: o.status, ts: o.createdAt, note: 'Eski zakaz: aniq vaqt noma‘lum' }); oc = true; }
    if (o.adminNote === undefined) { o.adminNote = ''; oc = true; }
    if (!Number.isFinite(o.subtotal)) { o.subtotal = o.items.reduce((s, i) => s + i.price * i.qty, 0); oc = true; }
    o.items.forEach(i => { if (i.cost === undefined) { i.cost = null; i.basePrice = i.price; i.deducted = 0; oc = true; } });
  });
  if (pc) save('products.json', products);
  if (oc) save('orders.json', orders);
  save('seq.json', seq);
})();

/* ---------- Express ---------- */
const app = express();
app.disable('x-powered-by');
app.use((req, res, next) => { res.set('X-Content-Type-Options', 'nosniff'); next(); });
app.use(express.json({ limit: '50kb' }));

/* ---------- Statik fayllar: faqat ruxsat etilgan ro‘yxat (.env, server.js, data/ ochilmaydi) ---------- */
const PAGES = ['index.html', 'doors.html', 'product.html', 'about.html', 'contact.html', 'cart.html', 'favorites.html', '404.html', 'style.css', 'script.js', 'manifest.webmanifest', 'sw.js', 'icon.svg'];
const send = f => (req, res) => res.sendFile(path.join(__dirname, f));
app.get('/', send('index.html'));
PAGES.forEach(f => app.get('/' + f, send(f)));
app.use('/img', express.static(path.join(__dirname, 'img'), { dotfiles: 'deny' })); // haqiqiy rasmlar uchun (ixtiyoriy)
const adminPage = (req, res) => { res.set({ 'Cache-Control': 'no-store', 'X-Robots-Tag': 'noindex' }); res.sendFile(path.join(__dirname, 'admin.html')); };
app.get(['/admin', '/admin.html'], adminPage);

/* ---------- Ommaviy API ---------- */
app.get('/api/catalog', (req, res) => {
  res.set('Cache-Control', 'no-store');
  res.json({ ok: true, products: products.filter(p => !p.hidden).map(publicProduct), settings: { deliveryFee: settings.deliveryFee, freeFrom: settings.freeFrom } });
});
app.get('/api/content', (req, res) => { res.set('Cache-Control', 'no-store'); res.json({ ok: true, content }); });

const limiter = (max, ms) => { // oddiy cheklov: IP boshiga ms ichida max ta so‘rov
  const m = new Map(); setInterval(() => m.clear(), ms).unref();
  return ip => { const now = Date.now(), l = (m.get(ip) || []).filter(t => now - t < ms); l.push(now); m.set(ip, l); return l.length > max; };
};
const orderLimited = limiter(8, 600000), contactLimited = limiter(5, 600000), statusLimited = limiter(20, 600000);

app.post('/api/contact', (req, res) => { // aloqa formasi: xabar saqlanadi, admin panelda ko‘rinadi
  const b = req.body || {};
  if (clean(b.website, 100)) return res.json({ ok: true }); // spam tuzoq: oddiy foydalanuvchi bu maydonni ko‘rmaydi
  if (contactLimited(req.ip)) return fail(res, 429, 'Juda ko‘p so‘rov. Birozdan so‘ng urinib ko‘ring.');
  const name = clean(b.name, 100), message = clean(b.message, 2000), digits = clean(b.phone, 30).replace(/\D/g, '');
  if (name.length < 2) return fail(res, 400, 'Ismni kiriting.');
  if (!/^(998)?\d{9}$/.test(digits)) return fail(res, 400, 'Telefon raqami noto‘g‘ri.');
  if (message.length < 10) return fail(res, 400, 'Xabar kamida 10 ta belgidan iborat bo‘lsin.');
  seq.m += 1; save('seq.json', seq);
  const d = digits.length === 9 ? '998' + digits : digits;
  const m = { id: 'M-' + String(seq.m).padStart(4, '0'), createdAt: new Date().toISOString(), name, phone: `+${d.slice(0, 3)} ${d.slice(3, 5)} ${d.slice(5, 8)} ${d.slice(8, 10)} ${d.slice(10, 12)}`, message, read: false };
  messages.unshift(m); persist.messages();
  notify('message', 'Yangi xabar', `${name}: ${message.slice(0, 80)}`, '#messages');
  res.json({ ok: true });
});

/* ---------- Zakaz: POST /api/order ---------- */
app.post('/api/order', async (req, res) => {
  if (!TELEGRAM_BOT_TOKEN || !TELEGRAM_CHAT_ID) return fail(res, 500, 'Server sozlanmagan (.env faylini tekshiring).');
  if (orderLimited(req.ip)) return fail(res, 429, 'Juda ko‘p so‘rov. Birozdan so‘ng urinib ko‘ring.');

  const b = req.body || {};
  const name = clean(b.name, 100), address = clean(b.address, 300), note = clean(b.note, 500);
  const digits = clean(b.phone, 30).replace(/\D/g, '');
  if (name.length < 2) return fail(res, 400, 'Ismni kiriting.');
  if (!/^(998)?\d{9}$/.test(digits)) return fail(res, 400, 'Telefon raqami noto‘g‘ri.');
  if (address.length < 5) return fail(res, 400, 'Manzilni kiriting.');
  if (!Array.isArray(b.items) || !b.items.length || b.items.length > 50) return fail(res, 400, 'Savat bo‘sh.');

  // Bir xil mahsulotlarni birlashtiramiz; nom va narx mijozdan emas, katalogdan olinadi
  const qtyById = new Map(), seen = new Map();
  for (const it of b.items) {
    const id = Number(it && it.id), qty = Number(it && it.qty);
    if (!products.some(p => p.id === id && !p.hidden) || !isInt(qty, 1, 99)) return fail(res, 400, 'Mahsulot ma’lumoti noto‘g‘ri yoki katalogda yo‘q.');
    qtyById.set(id, (qtyById.get(id) || 0) + qty);
    if (it.price !== undefined) seen.set(id, Number(it.price)); // mijoz ko‘rgan narx (faqat tekshirish uchun)
  }
  for (const [id, shown] of seen) { // sayt narxi bilan server narxi farq qilsa, zakaz qabul qilinmaydi
    if (shown !== effectivePrice(products.find(p => p.id === id))) return res.status(409).json({ ok: false, priceChanged: true, error: 'Narxlar yangilangan. Sahifani yangilab, savatni qayta tekshiring.' });
  }
  const items = [...qtyById].map(([id, qty]) => { const p = products.find(x => x.id === id); return { id, name: p.name, price: effectivePrice(p), basePrice: p.price, cost: p.cost, qty, deducted: 0 }; });
  const subtotal = items.reduce((s, i) => s + i.price * i.qty, 0);
  const delivery = subtotal < settings.freeFrom ? settings.deliveryFee : 0;
  const total = subtotal + delivery;

  const d = digits.length === 9 ? '998' + digits : digits;
  const phone = `+${d.slice(0, 3)} ${d.slice(3, 5)} ${d.slice(5, 8)} ${d.slice(8, 10)} ${d.slice(10, 12)}`;
  seq.n += 1; save('seq.json', seq);
  const now = new Date().toISOString();
  const order = { id: 'YD-' + String(seq.n).padStart(4, '0'), createdAt: now, name, phone, address, note, items, subtotal, delivery, total, status: 'new', statusHistory: [{ status: 'new', ts: now }], adminNote: '' };

  // Ombordan ayirish: faqat aniq qoldiq yuritiladigan mahsulotlar; qoldiq yetmasa ham zakaz rad etilmaydi (0 gacha ayriladi)
  for (const it of items) {
    const p = products.find(x => x.id === it.id);
    if (tracked(p) && p.qty > 0) { it.deducted = Math.min(it.qty, p.qty); moveStock(p, p.qty - it.deducted, 'order', `Zakaz ${order.id}`, { orderId: order.id }); }
  }
  const time = new Date(now).toLocaleString('ru-RU', { timeZone: 'Asia/Tashkent' });
  const lines = items.map((i, n) => `${n + 1}. ${i.name}\n${i.qty} x ${money(i.price)}${i.basePrice > i.price ? ` (chegirma, asl narx ${money(i.basePrice)})` : ''}`).join('\n\n');
  const text = `🛍 YANGI ZAKAZ ${order.id}\n\n👤 Mijoz:\n${name}\n\n📞 Telefon:\n${phone}\n\n📍 Manzil:\n${address}\n\n📦 Mahsulotlar:\n${lines}\n\n` +
    (delivery ? `🚚 Yetkazib berish:\n${money(delivery)}\n\n` : '') + `💰 Jami:\n${money(total)}\n\n📝 Izoh:\n${note || '—'}\n\n🕐 Vaqt:\n${time}`;

  orders.unshift(order); save('orders.json', orders); saveStock(); // avval saqlaymiz; Telegram xato bersa, hammasini orqaga qaytaramiz
  const rollback = () => {
    orders = orders.filter(o => o !== order); save('orders.json', orders);
    for (const it of items) if (it.deducted) { const p = products.find(x => x.id === it.id); if (p && tracked(p)) moveStock(p, p.qty + it.deducted, 'return', `Zakaz ${order.id} yuborilmadi`, { orderId: order.id }); }
    saveStock();
  };
  try {
    const r = await fetch(`https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ chat_id: TELEGRAM_CHAT_ID, text, disable_web_page_preview: true })
    });
    const j = await r.json().catch(() => ({}));
    if (!r.ok || !j.ok) { rollback(); logError('telegram', j.description || r.status); return fail(res, 502, 'Telegramga yuborib bo‘lmadi.'); }
    notify('order', 'Yangi zakaz', `${order.id} · ${name} · ${money(total)}`, '#orders?id=' + order.id); // faqat muvaffaqiyatdan keyin, bir marta
    res.json({ ok: true, id: order.id });
  } catch (e) {
    rollback();
    logError('telegram', e.cause?.code || e.name); // URL (token) log qilinmaydi
    fail(res, 502, 'Telegram bilan aloqa o‘rnatilmadi.');
  }
});

app.get('/api/order-status', (req, res) => { // mijoz zakaz raqami + telefon bilan holatni tekshiradi
  if (statusLimited(req.ip)) return fail(res, 429, 'Juda ko‘p so‘rov. Birozdan so‘ng urinib ko‘ring.');
  const id = clean(req.query.id, 20).toUpperCase(), key = phoneKey(clean(req.query.phone, 30));
  const o = orders.find(x => x.id === id);
  if (!o || key.length < 9 || phoneKey(o.phone) !== key) return fail(res, 404, 'Zakaz topilmadi. Raqam va telefonni tekshiring.');
  res.json({ ok: true, id: o.id, status: o.status, label: STATUS_LABEL[o.status], createdAt: o.createdAt, total: o.total, history: o.statusHistory.map(h => ({ status: h.status, label: STATUS_LABEL[h.status], ts: h.ts })) });
});

/* ---------- Admin: kirish (parol serverda tekshiriladi, sessiya HttpOnly cookie'da) ---------- */
const SESSION_MS = 8 * 60 * 60 * 1000;
const sessions = new Map(); // token -> tugash vaqti
const sha = s => crypto.createHash('sha256').update(String(s)).digest();
const passOk = p => crypto.timingSafeEqual(sha(p), sha(ADMIN_PASSWORD));
function readCookies(req) {
  const o = {};
  (req.headers.cookie || '').split(';').forEach(c => { const i = c.indexOf('='); if (i > 0) { try { o[c.slice(0, i).trim()] = decodeURIComponent(c.slice(i + 1).trim()); } catch { /* buzilgan cookie */ } } });
  return o;
}
function authed(req) {
  const t = readCookies(req).yd_admin, exp = t && sessions.get(t);
  if (exp && exp > Date.now()) return true;
  if (t) sessions.delete(t);
  return false;
}
const cookie = (req, v, age) => `yd_admin=${v}; HttpOnly; SameSite=Strict; Path=/; Max-Age=${age}${(req.secure || req.get('x-forwarded-proto') === 'https') ? '; Secure' : ''}`;
const off = res => res.status(503).json({ ok: false, enabled: false, error: 'Admin panel o‘chirilgan.' });
const failed = new Map(); // IP -> { n, t } noto‘g‘ri urinishlar
setInterval(() => sessions.forEach((e, t) => { if (e < Date.now()) sessions.delete(t); }), 10 * 60 * 1000).unref();

app.get('/api/admin/me', (req, res) => {
  if (!ADMIN_ENABLED) return off(res);
  res.set('Cache-Control', 'no-store');
  authed(req) ? res.json({ ok: true }) : res.status(401).json({ ok: false, enabled: true });
});
app.post('/api/admin/login', async (req, res) => {
  if (!ADMIN_ENABLED) return off(res);
  if (req.get('X-Requested-With') !== 'yd-admin') return fail(res, 403, 'Ruxsat yo‘q.');
  let f = failed.get(req.ip);
  if (f && Date.now() - f.t > 15 * 60 * 1000) { failed.delete(req.ip); f = null; }
  if (f && f.n >= 5) return fail(res, 429, 'Juda ko‘p urinish. 15 daqiqadan so‘ng qayta urinib ko‘ring.');
  if (!passOk(String((req.body || {}).password ?? ''))) {
    failed.set(req.ip, { n: (f ? f.n : 0) + 1, t: Date.now() });
    log('login_failed', 'Noto‘g‘ri parol bilan kirishga urinish', 'auth');
    await new Promise(r => setTimeout(r, 400)); // tez-tez taxmin qilishni sekinlashtiradi
    return fail(res, 401, 'Parol noto‘g‘ri.');
  }
  failed.delete(req.ip);
  const token = crypto.randomBytes(32).toString('hex');
  sessions.set(token, Date.now() + SESSION_MS);
  res.set('Set-Cookie', cookie(req, token, SESSION_MS / 1000));
  log('login', 'Admin panelga kirdi', 'auth');
  res.json({ ok: true });
});
app.post('/api/admin/logout', (req, res) => {
  if (authed(req)) log('logout', 'Admin paneldan chiqdi', 'auth');
  sessions.delete(readCookies(req).yd_admin);
  res.set('Set-Cookie', cookie(req, '', 0));
  res.json({ ok: true });
});

/* ---------- Admin API (har bir so‘rov autentifikatsiya talab qiladi) ---------- */
const admin = express.Router();
admin.use((req, res, next) => {
  res.set('Cache-Control', 'no-store');
  if (!ADMIN_ENABLED) return off(res);
  if (!authed(req)) return fail(res, 401, 'Kirish talab qilinadi.');
  if (req.method !== 'GET' && req.get('X-Requested-With') !== 'yd-admin') return fail(res, 403, 'Ruxsat yo‘q.'); // CSRF himoyasi
  next();
});

/* --- Qisqa holat (panel nishonlari uchun) --- */
admin.get('/summary', (req, res) => res.json({ ok: true, newOrders: orders.filter(o => o.status === 'new').length,
  unreadNotifications: notifications.filter(n => !n.read).length, unreadMessages: messages.filter(m => !m.read).length,
  lowStock: products.filter(isLow).length, outOfStock: products.filter(p => !inStock(p)).length }));

/* --- Zakazlar --- */
admin.get('/orders', (req, res) => res.json({ ok: true, orders }));
function restoreStock(o) { // bekor qilingan zakaz: ayirilgan qoldiq qaytariladi
  o.items.forEach(it => { const p = products.find(x => x.id === it.id); if (it.deducted && p && tracked(p)) moveStock(p, p.qty + it.deducted, 'return', `Zakaz ${o.id} bekor qilindi`, { orderId: o.id }); it.deducted = 0; });
}
function redeductStock(o) { // bekor qilingan zakaz qayta faollashtirilsa, qoldiq yana ayriladi
  o.items.forEach(it => { const p = products.find(x => x.id === it.id); if (p && tracked(p) && p.qty > 0) { it.deducted = Math.min(it.qty, p.qty); moveStock(p, p.qty - it.deducted, 'order', `Zakaz ${o.id} qayta faollashtirildi`, { orderId: o.id }); } });
}
admin.patch('/orders/:id', (req, res) => {
  const o = orders.find(x => x.id === req.params.id), b = req.body || {};
  if (!o) return fail(res, 404, 'Zakaz topilmadi.');
  if (b.status !== undefined && !STATUSES.includes(b.status)) return fail(res, 400, 'Holat noto‘g‘ri.');
  if (b.adminNote !== undefined && typeof b.adminNote !== 'string') return fail(res, 400, 'Izoh noto‘g‘ri.');
  if (b.status === undefined && b.adminNote === undefined) return fail(res, 400, 'O‘zgartirish yo‘q.');
  if (b.status !== undefined && b.status !== o.status) {
    const was = o.status;
    if (was !== 'cancelled' && b.status === 'cancelled') restoreStock(o);
    if (was === 'cancelled' && b.status !== 'cancelled') redeductStock(o);
    o.status = b.status; o.statusHistory.push({ status: b.status, ts: new Date().toISOString() });
    saveStock(); log('order_status', `${o.id}: ${STATUS_LABEL[was]} → ${STATUS_LABEL[b.status]}`, o.id);
  }
  if (b.adminNote !== undefined && clean(b.adminNote, 1000) !== o.adminNote) { o.adminNote = clean(b.adminNote, 1000); log('order_note', `${o.id}: admin izohi yangilandi`, o.id); }
  save('orders.json', orders); res.json({ ok: true, order: o });
});
admin.delete('/orders/:id', (req, res) => {
  const o = orders.find(x => x.id === req.params.id);
  if (!o) return fail(res, 404, 'Zakaz topilmadi.');
  orders = orders.filter(x => x !== o); save('orders.json', orders);
  log('order_delete', `${o.id} zakazi o‘chirildi (${o.name}, ${money(o.total)})`, o.id); res.json({ ok: true });
});

/* --- Mahsulotlar --- */
const IMG_RE = /^(https?:\/\/|\/?img\/)[^\s"'<>\\]+$/i;
function parseProduct(b, old) { // { error } yoki tayyor mahsulot maydonlari
  b = b || {};
  const name = clean(b.name, 80), price = Number(b.price), oldPrice = optInt(b.old, 1000, 1e9);
  const color = String(b.color), style = String(b.style), badge = String(b.badge || ''), image = clean(b.image, 300);
  if (name.length < 2) return { error: 'Nom kamida 2 ta belgi bo‘lsin.' };
  if (!isInt(price, 1000, 1e9)) return { error: 'Narx noto‘g‘ri (butun son, kamida 1000).' };
  if (oldPrice.bad) return { error: 'Eski narx noto‘g‘ri.' };
  if (!COLORS[color]) return { error: 'Rang guruhi noto‘g‘ri.' };
  if (!STYLES[style]) return { error: 'Uslub noto‘g‘ri.' };
  if (!BADGES.includes(badge)) return { error: 'Belgi noto‘g‘ri.' };
  if (image && !IMG_RE.test(image)) return { error: 'Rasm havolasi http(s):// yoki img/... ko‘rinishida bo‘lsin.' };
  const gallery = (Array.isArray(b.gallery) ? b.gallery : String(b.gallery || '').split(/\r?\n/)).map(s => clean(s, 300)).filter(Boolean);
  if (gallery.length > 5) return { error: 'Qo‘shimcha rasmlar 5 tadan oshmasin.' };
  if (gallery.some(g => !IMG_RE.test(g))) return { error: 'Qo‘shimcha rasm havolasi noto‘g‘ri.' };
  const qty = optInt(b.qty, 0, 1e6), minQty = optInt(b.minQty === '' ? 0 : b.minQty, 0, 1e6), cost = optInt(b.cost, 0, 1e9);
  if (qty.bad) return { error: 'Qoldiq 0 dan 1 000 000 gacha butun son bo‘lsin (yoki bo‘sh).' };
  if (minQty.bad) return { error: 'Minimal qoldiq noto‘g‘ri.' };
  if (cost.bad) return { error: 'Tannarx noto‘g‘ri.' };
  const sku = clean(b.sku, 40).toUpperCase();
  if (sku && products.some(x => x.sku === sku && (!old || x.id !== old.id))) return { error: `“${sku}” SKU boshqa mahsulotda ishlatilgan.` };
  const pct = Number(b.discountPercent || 0), ds = String(b.discountStart || ''), de = String(b.discountEnd || '');
  if (!isInt(pct, 0, 90)) return { error: 'Chegirma foizi 0 dan 90 gacha butun son bo‘lsin.' };
  if (pct > 0) {
    if (!isYmd(ds) || !isYmd(de)) return { error: 'Chegirma uchun boshlanish va tugash sanasini kiriting.' };
    if (de < ds) return { error: 'Chegirma tugash sanasi boshlanishidan oldin bo‘lishi mumkin emas.' };
  }
  const colorChanged = !old || old.color !== color;
  return {
    name, price, old: oldPrice.v, color, style, styleName: STYLES[style], badge, image, gallery, sku, qty: qty.v, minQty: minQty.v ?? 0, cost: cost.v, supplier: clean(b.supplier, 80),
    discountPercent: pct, discountStart: pct > 0 ? ds : '', discountEnd: pct > 0 ? de : '',
    colorName: clean(b.colorName, 40) || (color[0].toUpperCase() + color.slice(1)),
    material: clean(b.material, 80) || 'MDF', desc: clean(b.desc, 200), long: clean(b.long, 1000), tags: clean(b.tags, 200).toLowerCase(),
    hex: colorChanged ? COLORS[color][0] : old.hex, edge: colorChanged ? COLORS[color][1] : old.edge,
    stock: qty.v === null ? !!b.stock : qty.v > 0, hidden: !!b.hidden
  };
}
admin.get('/products', (req, res) => res.json({ ok: true, products: products.map(adminProduct) }));
admin.post('/products', (req, res) => {
  const p = parseProduct(req.body); if (p.error) return fail(res, 400, p.error);
  const initial = p.qty; // harakat yozish uchun qoldiqni vaqtincha olib turamiz
  const prod = { id: products.reduce((m, x) => Math.max(m, x.id), 0) + 1, ...p, qty: null };
  products.push(prod);
  if (initial !== null) moveStock(prod, initial, 'in', 'Boshlang‘ich qoldiq');
  saveStock(); log('product_create', `Mahsulot qo‘shildi: ${prod.name}`, 'p' + prod.id);
  res.json({ ok: true, product: adminProduct(prod) });
});
admin.put('/products/:id', (req, res) => {
  const i = products.findIndex(x => x.id === Number(req.params.id));
  if (i < 0) return fail(res, 404, 'Mahsulot topilmadi.');
  const prev = products[i], p = parseProduct(req.body, prev); if (p.error) return fail(res, 400, p.error);
  const wasQty = tracked(prev) ? prev.qty : null, newQty = p.qty;
  products[i] = { id: prev.id, ...p, qty: wasQty };
  const cur = products[i];
  if (newQty === null) { cur.qty = null; cur.stock = !!(req.body || {}).stock; } // aniq qoldiq yuritilmaydi
  else if (newQty !== wasQty) moveStock(cur, newQty, 'adjust', 'Mahsulot tahrirlanganda qoldiq o‘zgartirildi');
  else if (isLow(cur) && !isLow(prev)) stockAlerts(cur, Infinity, cur.qty); // minimal qoldiq oshirilib, ogohlantirish chegarasiga tushsa
  saveStock();
  const changes = ['price', 'discountPercent', 'qty', 'cost', 'hidden', 'name'].filter(k => prev[k] !== cur[k]).join(', ');
  log('product_update', `Mahsulot tahrirlandi: ${cur.name}${changes ? ' (' + changes + ')' : ''}`, 'p' + cur.id);
  res.json({ ok: true, product: adminProduct(cur) });
});
admin.delete('/products/:id', (req, res) => {
  const p = products.find(x => x.id === Number(req.params.id));
  if (!p) return fail(res, 404, 'Mahsulot topilmadi.');
  products = products.filter(x => x !== p); save('products.json', products);
  log('product_delete', `Mahsulot o‘chirildi: ${p.name}`, 'p' + p.id); res.json({ ok: true });
});

/* --- Ombor --- */
admin.get('/inventory', (req, res) => res.json({ ok: true, items: products.map(adminProduct) }));
admin.get('/inventory/movements', (req, res) => {
  const pid = Number(req.query.productId), limit = Math.min(Math.max(parseInt(req.query.limit, 10) || 200, 1), 1000);
  res.json({ ok: true, movements: movements.filter(m => !pid || m.productId === pid).slice(0, limit) });
});
admin.post('/inventory/movements', (req, res) => {
  const b = req.body || {}, p = products.find(x => x.id === Number(b.productId)), type = b.type, qty = Number(b.qty), note = clean(b.note, 200);
  if (!p) return fail(res, 404, 'Mahsulot topilmadi.');
  if (!['in', 'out', 'adjust'].includes(type)) return fail(res, 400, 'Amal turi noto‘g‘ri.');
  if (type === 'adjust') {
    if (!isInt(qty, 0, 1e6)) return fail(res, 400, 'Qoldiq 0 dan 1 000 000 gacha butun son bo‘lsin.');
    if (tracked(p) && p.qty === qty) return fail(res, 400, 'Qoldiq o‘zgarmadi.');
    moveStock(p, qty, 'adjust', note || 'Qoldiq to‘g‘rilandi');
  } else {
    if (!tracked(p)) return fail(res, 400, 'Bu mahsulot uchun aniq qoldiq yuritilmaydi. Avval “Qoldiqni belgilash” orqali boshlang‘ich sonni kiriting.');
    if (!isInt(qty, 1, 1e6)) return fail(res, 400, 'Miqdor 1 dan 1 000 000 gacha butun son bo‘lsin.');
    if (type === 'out' && qty > p.qty) return fail(res, 400, `Omborda faqat ${p.qty} dona bor.`);
    moveStock(p, type === 'in' ? p.qty + qty : p.qty - qty, type, note);
  }
  saveStock(); log('stock_' + type, `${p.name}: ${type === 'in' ? 'kirim' : type === 'out' ? 'chiqim' : 'to‘g‘rilash'} → ${p.qty} dona`, 'p' + p.id);
  res.json({ ok: true, product: adminProduct(p) });
});

/* --- Chegirmalar --- */
admin.get('/discounts', (req, res) => res.json({ ok: true, items: products.map(adminProduct) }));
admin.post('/discounts', (req, res) => { // bir nechta mahsulotga chegirma o‘rnatish
  const b = req.body || {}, ids = Array.isArray(b.productIds) ? b.productIds.map(Number) : [], pct = Number(b.percent), ds = String(b.start || ''), de = String(b.end || '');
  if (!ids.length) return fail(res, 400, 'Mahsulot tanlanmagan.');
  if (!isInt(pct, 1, 90)) return fail(res, 400, 'Chegirma foizi 1 dan 90 gacha bo‘lsin.');
  if (!isYmd(ds) || !isYmd(de)) return fail(res, 400, 'Boshlanish va tugash sanasini kiriting.');
  if (de < ds) return fail(res, 400, 'Tugash sanasi boshlanishidan oldin bo‘lishi mumkin emas.');
  const list = ids.map(id => products.find(p => p.id === id));
  if (list.some(p => !p)) return fail(res, 404, 'Mahsulot topilmadi.');
  list.forEach(p => { p.discountPercent = pct; p.discountStart = ds; p.discountEnd = de; });
  save('products.json', products); log('discount_set', `Chegirma −${pct}% (${ds} — ${de}): ${list.map(p => p.name).join(', ')}`, 'discount');
  res.json({ ok: true, items: list.map(adminProduct) });
});
admin.delete('/discounts/:id', (req, res) => {
  const p = products.find(x => x.id === Number(req.params.id));
  if (!p) return fail(res, 404, 'Mahsulot topilmadi.');
  p.discountPercent = 0; p.discountStart = ''; p.discountEnd = ''; // asl narx o‘zgarmagan, shuning uchun u avtomatik qaytadi
  save('products.json', products); log('discount_clear', `Chegirma o‘chirildi: ${p.name}`, 'discount'); res.json({ ok: true, product: adminProduct(p) });
});

/* --- Mijozlar (zakazlardan hosil qilinadi; telefon raqami bo‘yicha birlashtiriladi) --- */
function buildCustomers() {
  const map = new Map();
  [...orders].reverse().forEach(o => { // eskidan yangiga: oxirgi ism va manzil yangi bo‘ladi
    const key = phoneKey(o.phone); if (!key) return;
    const c = map.get(key) || { key, phone: o.phone, name: o.name, names: [], addresses: [], orderIds: [], orders: 0, active: 0, spent: 0, firstOrderAt: o.createdAt, lastOrderAt: o.createdAt };
    c.name = o.name; c.phone = o.phone; c.lastOrderAt = o.createdAt;
    if (!c.names.includes(o.name)) c.names.push(o.name);
    if (o.address && !c.addresses.includes(o.address)) c.addresses.push(o.address);
    c.orderIds.push(o.id); c.orders += 1;
    if (o.status !== 'cancelled') { c.active += 1; c.spent += o.total; }
    map.set(key, c);
  });
  return [...map.values()].map(c => ({ ...c, avg: c.active ? Math.round(c.spent / c.active) : 0, duplicateNames: c.names.length > 1, note: (customerNotes[c.key] || {}).note || '', orderIds: c.orderIds.reverse() }))
    .sort((a, b) => b.lastOrderAt.localeCompare(a.lastOrderAt));
}
admin.get('/customers', (req, res) => res.json({ ok: true, customers: buildCustomers() }));
admin.put('/customers/:key/note', (req, res) => {
  if (!buildCustomers().some(c => c.key === req.params.key)) return fail(res, 404, 'Mijoz topilmadi.');
  const note = clean((req.body || {}).note, 1000);
  if (note) customerNotes[req.params.key] = { note }; else delete customerNotes[req.params.key];
  save('customers.json', customerNotes); log('customer_note', `Mijoz izohi yangilandi (${req.params.key})`, 'customer'); res.json({ ok: true });
});

/* --- Statistika va hisobotlar (faqat haqiqiy zakazlardan) --- */
const live = () => orders.filter(o => o.status !== 'cancelled');
function profitOf(o) { // foyda faqat tannarxi ma'lum mahsulotlar bo‘yicha; tannarx yo‘q bo‘lsa "sof foyda" hisoblanmaydi
  let profit = 0, covered = 0;
  o.items.forEach(i => { if (Number.isFinite(i.cost)) { profit += (i.price - i.cost) * i.qty; covered += i.price * i.qty; } });
  return { profit, covered };
}
function series(period) {
  const today = todayYmd(); let keys = [], keyOf, label;
  if (period === 'daily') { for (let i = 29; i >= 0; i--) keys.push(addDays(today, -i)); keyOf = ymd; label = k => k.slice(8) + '.' + k.slice(5, 7); }
  else if (period === 'weekly') { const s = weekStart(today); for (let i = 11; i >= 0; i--) keys.push(addDays(s, -7 * i)); keyOf = ts => weekStart(ymd(ts)); label = k => k.slice(8) + '.' + k.slice(5, 7); }
  else { const m = today.slice(0, 7); for (let i = 11; i >= 0; i--) keys.push(addMonths(m, -i)); keyOf = ts => ymd(ts).slice(0, 7); label = k => k.slice(5) + '.' + k.slice(2, 4); }
  const pts = new Map(keys.map(k => [k, { key: k, label: label(k), orders: 0, revenue: 0, profit: 0, covered: 0, items: 0 }]));
  live().forEach(o => {
    const pt = pts.get(keyOf(o.createdAt)); if (!pt) return;
    const pr = profitOf(o); pt.orders += 1; pt.revenue += o.total; pt.profit += pr.profit; pt.covered += pr.covered; pt.items += o.subtotal;
  });
  return [...pts.values()].map(p => ({ key: p.key, label: p.label, orders: p.orders, revenue: p.revenue, profit: p.covered ? p.profit : null, coverage: p.items ? Math.round(p.covered / p.items * 100) : null }));
}
admin.get('/stats', (req, res) => {
  const today = todayYmd(), month = today.slice(0, 7), lv = live(), sum = a => a.reduce((s, o) => s + o.total, 0);
  const customers = buildCustomers();
  res.json({ ok: true, cards: {
    todayOrders: lv.filter(o => ymd(o.createdAt) === today).length, newOrders: orders.filter(o => o.status === 'new').length,
    todayRevenue: sum(lv.filter(o => ymd(o.createdAt) === today)), monthRevenue: sum(lv.filter(o => ymd(o.createdAt).slice(0, 7) === month)), totalRevenue: sum(lv),
    avgCheck: lv.length ? Math.round(sum(lv) / lv.length) : 0, customers: customers.length, lowStock: products.filter(isLow).length,
    outOfStock: products.filter(p => !inStock(p)).length, unreadMessages: messages.filter(m => !m.read).length
  }, series: { daily: series('daily'), weekly: series('weekly'), monthly: series('monthly') } });
});
admin.get('/reports', (req, res) => {
  const to = isYmd(req.query.to) ? req.query.to : todayYmd(), from = isYmd(req.query.from) ? req.query.from : addDays(to, -29);
  if (from > to) return fail(res, 400, 'Boshlanish sanasi tugash sanasidan keyin bo‘lishi mumkin emas.');
  const inRange = orders.filter(o => { const d = ymd(o.createdAt); return d >= from && d <= to; }), lv = inRange.filter(o => o.status !== 'cancelled');
  const byProduct = new Map(); let profit = 0, covered = 0, itemsSum = 0, discount = 0;
  lv.forEach(o => {
    const pr = profitOf(o); profit += pr.profit; covered += pr.covered; itemsSum += o.subtotal;
    o.items.forEach(i => {
      const r = byProduct.get(i.id) || { id: i.id, name: i.name, qty: 0, revenue: 0, profit: 0, covered: 0 };
      r.qty += i.qty; r.revenue += i.price * i.qty; if (Number.isFinite(i.cost)) { r.profit += (i.price - i.cost) * i.qty; r.covered += i.price * i.qty; }
      if (i.basePrice > i.price) discount += (i.basePrice - i.price) * i.qty;
      byProduct.set(i.id, r);
    });
  });
  const days = []; for (let d = from; d <= to && days.length < 400; d = addDays(d, 1)) days.push(d);
  const byDay = days.map(d => { const l = lv.filter(o => ymd(o.createdAt) === d); return { date: d, orders: l.length, revenue: l.reduce((s, o) => s + o.total, 0) }; });
  const status = {}; STATUSES.forEach(s => { status[s] = inRange.filter(o => o.status === s).length; });
  const custMap = new Map(); lv.forEach(o => { const k = phoneKey(o.phone), c = custMap.get(k) || { key: k, name: o.name, phone: o.phone, orders: 0, spent: 0 }; c.name = o.name; c.orders += 1; c.spent += o.total; custMap.set(k, c); });
  let invCost = 0, invKnown = 0; products.forEach(p => { if (tracked(p) && Number.isFinite(p.cost)) { invCost += p.qty * p.cost; invKnown += 1; } });
  const trackedN = products.filter(tracked).length;
  res.json({ ok: true, from, to,
    summary: { orders: inRange.length, completed: inRange.filter(o => o.status === 'done').length, cancelled: inRange.filter(o => o.status === 'cancelled').length,
      revenue: lv.reduce((s, o) => s + o.total, 0), delivery: lv.reduce((s, o) => s + o.delivery, 0), avgCheck: lv.length ? Math.round(lv.reduce((s, o) => s + o.total, 0) / lv.length) : 0,
      discountGiven: discount, profit: covered ? profit : null, profitCoverage: itemsSum ? Math.round(covered / itemsSum * 100) : null },
    byProduct: [...byProduct.values()].map(r => ({ id: r.id, name: r.name, qty: r.qty, revenue: r.revenue, profit: r.covered ? r.profit : null })).sort((a, b) => b.revenue - a.revenue),
    byDay, status, topCustomers: [...custMap.values()].sort((a, b) => b.spent - a.spent).slice(0, 10),
    stock: { inventoryCost: invKnown ? invCost : null, trackedProducts: trackedN, withCost: invKnown,
      low: products.filter(isLow).map(p => ({ id: p.id, name: p.name, qty: p.qty, minQty: p.minQty })), out: products.filter(p => !inStock(p)).map(p => ({ id: p.id, name: p.name })) } });
});

/* --- Xabarlar (aloqa formasidan) --- */
admin.get('/messages', (req, res) => res.json({ ok: true, messages }));
admin.post('/messages/read-all', (req, res) => { messages.forEach(m => { m.read = true; }); persist.messages(); res.json({ ok: true }); });
admin.patch('/messages/:id', (req, res) => {
  const m = messages.find(x => x.id === req.params.id), read = (req.body || {}).read;
  if (!m) return fail(res, 404, 'Xabar topilmadi.');
  if (typeof read !== 'boolean') return fail(res, 400, 'Holat noto‘g‘ri.');
  m.read = read; persist.messages(); res.json({ ok: true });
});
admin.delete('/messages/:id', (req, res) => {
  const m = messages.find(x => x.id === req.params.id);
  if (!m) return fail(res, 404, 'Xabar topilmadi.');
  messages = messages.filter(x => x !== m); persist.messages(); log('message_delete', `Xabar o‘chirildi: ${m.id} (${m.name})`, m.id); res.json({ ok: true });
});

/* --- Bildirishnomalar --- */
admin.get('/notifications', (req, res) => res.json({ ok: true, notifications: notifications.slice(0, 200), unread: notifications.filter(n => !n.read).length }));
admin.post('/notifications/read-all', (req, res) => { notifications.forEach(n => { n.read = true; }); persist.notifications(); res.json({ ok: true }); });
admin.patch('/notifications/:id', (req, res) => {
  const n = notifications.find(x => x.id === req.params.id), read = (req.body || {}).read;
  if (!n) return fail(res, 404, 'Bildirishnoma topilmadi.');
  if (typeof read !== 'boolean') return fail(res, 400, 'Holat noto‘g‘ri.');
  n.read = read; persist.notifications(); res.json({ ok: true });
});
admin.delete('/notifications', (req, res) => { notifications = notifications.filter(n => !n.read); persist.notifications(); res.json({ ok: true }); }); // faqat o‘qilganlar tozalanadi

/* --- Faoliyat tarixi --- */
admin.get('/activity', (req, res) => res.json({ ok: true, activity: activity.slice(0, Math.min(Math.max(parseInt(req.query.limit, 10) || 200, 1), 1000)) }));

/* --- Sayt kontenti --- */
const link = v => /^(\/|#|https?:\/\/|[a-z0-9_-]+\.html)[^\s"'<>\\]*$/i.test(v);
function social(v, base) { v = clean(v, 120); if (!v) return ''; if (/^https?:\/\//i.test(v)) return /^[^\s"'<>\\]+$/.test(v) ? v : null; v = v.replace(/^@/, ''); return /^[A-Za-z0-9_.]{2,40}$/.test(v) ? base + v : null; }
function parseContent(b) {
  b = b || {}; const h = b.hero || {}, p = b.promo || {}, c = b.contacts || {};
  const hero = { badge: clean(h.badge, 60), title: clean(h.title, 80), lead: clean(h.lead, 160) };
  if (hero.title.length < 2) return { error: 'Bosh sahifa sarlavhasi kamida 2 ta belgi bo‘lsin.' };
  const promo = { enabled: !!p.enabled, text: clean(p.text, 160), linkText: clean(p.linkText, 40), link: clean(p.link, 200) };
  if (promo.enabled && !promo.text) return { error: 'Banner yoqilgan bo‘lsa, matn kiritilishi kerak.' };
  if (promo.link && !link(promo.link)) return { error: 'Banner havolasi noto‘g‘ri (masalan: doors.html yoki https://…).' };
  const phone = clean(c.phone, 30), email = clean(c.email, 80), telegram = social(c.telegram, 'https://t.me/'), instagram = social(c.instagram, 'https://instagram.com/');
  if (phone && !/^\+?[\d\s()-]{7,20}$/.test(phone)) return { error: 'Telefon raqami noto‘g‘ri.' };
  if (email && !/^[^\s@<>"']+@[^\s@<>"']+\.[^\s@<>"']+$/.test(email)) return { error: 'Email noto‘g‘ri.' };
  if (telegram === null) return { error: 'Telegram: @nom yoki https:// havola kiriting.' };
  if (instagram === null) return { error: 'Instagram: @nom yoki https:// havola kiriting.' };
  const contacts = { phone, address: clean(c.address, 200), hours: clean(c.hours, 80), email, telegram, instagram };
  const faqIn = Array.isArray(b.faq) ? b.faq : [];
  if (faqIn.length > 12) return { error: 'Savollar 12 tadan oshmasin.' };
  const faq = faqIn.map(x => ({ q: clean(x && x.q, 150), a: clean(x && x.a, 600) })).filter(x => x.q || x.a);
  if (faq.some(x => !x.q || !x.a)) return { error: 'Har bir savol va javob to‘ldirilishi kerak.' };
  return { content: { hero, promo, contacts, faq } };
}
admin.get('/content', (req, res) => res.json({ ok: true, content }));
admin.put('/content', (req, res) => {
  const r = parseContent(req.body); if (r.error) return fail(res, 400, r.error);
  content = r.content; save('content.json', content); log('content_update', 'Sayt kontenti yangilandi', 'content'); res.json({ ok: true, content });
});

/* --- Sozlamalar va zaxira --- */
admin.get('/settings', (req, res) => res.json({ ok: true, settings: { deliveryFee: settings.deliveryFee, freeFrom: settings.freeFrom } }));
admin.put('/settings', (req, res) => {
  const fee = Number((req.body || {}).deliveryFee), free = Number((req.body || {}).freeFrom);
  if (!isInt(fee, 0, 1e7)) return fail(res, 400, 'Yetkazib berish narxi noto‘g‘ri.');
  if (!isInt(free, 0, 1e9)) return fail(res, 400, 'Bepul yetkazib berish chegarasi noto‘g‘ri.');
  settings = { ...settings, deliveryFee: fee, freeFrom: free }; save('settings.json', settings); log('settings', `Yetkazib berish: ${money(fee)}, bepul: ${money(free)} dan`, 'settings'); res.json({ ok: true });
});
admin.get('/export', (req, res) => { // zaxira nusxa (JSON)
  res.set('Content-Disposition', `attachment; filename="yasindoors-zaxira-${todayYmd()}.json"`);
  res.json({ exportedAt: new Date().toISOString(), settings, content, products, orders, movements, messages, customerNotes });
});
app.use('/api/admin', admin);

app.use('/api', (req, res) => fail(res, 404, 'Topilmadi.'));
app.use((req, res) => {
  if (req.method === 'GET' && req.accepts('html')) return res.status(404).sendFile(path.join(__dirname, '404.html'));
  res.status(404).send('Topilmadi');
});
app.use((err, req, res, next) => { // noto‘g‘ri JSON va kutilmagan xatolar
  if (err && err.type === 'entity.parse.failed') return fail(res, 400, 'So‘rov noto‘g‘ri.');
  logError(req.method + ' ' + req.path, err); fail(res, 500, 'Serverda xatolik yuz berdi.');
});

app.listen(PORT, () => {
  console.log(`YasinDoors: http://localhost:${PORT}`);
  console.log(ADMIN_ENABLED ? `Admin panel: http://localhost:${PORT}/admin` : 'Admin panel O‘CHIQ: .env da kamida 8 belgili ADMIN_PASSWORD yozing.');
  if (!TELEGRAM_BOT_TOKEN || !TELEGRAM_CHAT_ID) console.warn('OGOHLANTIRISH: .env da TELEGRAM_BOT_TOKEN va TELEGRAM_CHAT_ID to‘ldirilmagan.');
});
