/* ===== YasinDoors — server.js =====
 * Sayt fayllarini beradi, zakazlarni Telegramga yuboradi va admin panel (/admin) uchun API'ni ishlatadi.
 * Token, chat ID va admin paroli faqat .env dan o‘qiladi — frontend ularni ko‘rmaydi.
 * Katalog, zakazlar va sozlamalar data/ papkasidagi JSON fayllarda saqlanadi. */
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

/* ---------- Saqlash (data/*.json) ---------- */
const DATA_DIR = path.join(__dirname, 'data');
const load = (file, fallback) => { try { return JSON.parse(fs.readFileSync(path.join(DATA_DIR, file), 'utf8')); } catch { return fallback; } };
function save(file, data) { // avval vaqtinchalik faylga yozib, keyin almashtiramiz (yarim yozilgan fayl qolmasin)
  fs.mkdirSync(DATA_DIR, { recursive: true });
  const p = path.join(DATA_DIR, file);
  fs.writeFileSync(p + '.tmp', JSON.stringify(data, null, 2));
  fs.renameSync(p + '.tmp', p);
}

// Birinchi ishga tushirishdagi standart katalog (keyin hammasi admin paneldan boshqariladi)
const SEED = [{"id":1,"name":"Classic White","price":2790000,"color":"oq","style":"classic","hex":"#e8e4da","edge":"#cfc9bb","badge":"best","tags":"white oq classic pearl","desc":"Nafis panelli och rangli klassik eshik.","long":"Yumshoq oq tus va ko‘tarma panellar uyga tinch, yorug‘ muhit beradi.","material":"MDF + emal qoplama","colorName":"Oq","styleName":"Classic","stock":true,"old":null,"image":"","hidden":false},{"id":2,"name":"Modern Oak","price":2990000,"color":"yogoch","style":"modern","hex":"#c49a6a","edge":"#9a7347","badge":"","tags":"oak yogoch wood modern","desc":"Zamonaviy chiziqli naqshli yog‘och eshik.","long":"Tabiiy eman tusi va zamonaviy chiziqlar uyg‘unligi.","material":"MDF + yog‘och tekstura","colorName":"Yog‘och","styleName":"Modern","stock":true,"old":null,"image":"","hidden":false},{"id":3,"name":"Black Minimal","price":2890000,"color":"qora","style":"modern","hex":"#232323","edge":"#0f0f0f","badge":"new","tags":"black qora modern minimal","desc":"Vertikal chiziqli qora MDF eshik.","long":"Kontrastli, premium ko‘rinishdagi qora eshik. Vertikal naqsh dizaynga chuqurlik beradi.","material":"MDF + mat PVX qoplama","colorName":"Qora","styleName":"Modern","stock":true,"old":null,"image":"","hidden":false},{"id":4,"name":"Luxury Walnut","price":3390000,"color":"jigarrang","style":"classic","hex":"#6b4a33","edge":"#4a3022","badge":"premium","tags":"walnut brown jigarrang classic yongoq","desc":"Boy jigarrang yong‘oq rangli eshik.","long":"Chuqur jigarrang ton va nafis panellar bilan premium klassik model.","material":"MDF + yong‘oq tekstura","colorName":"Jigarrang","styleName":"Classic","stock":true,"old":null,"image":"","hidden":false},{"id":5,"name":"White Line","price":2450000,"color":"oq","style":"modern","hex":"#f1f0ec","edge":"#d8d6cf","badge":"","tags":"white oq modern minimal","desc":"Toza oq rangdagi minimalist MDF eshik.","long":"Yorug‘ interyerlar uchun silliq, mat qoplamali zamonaviy eshik.","material":"MDF + mat PVX qoplama","colorName":"Oq","styleName":"Modern","stock":true,"old":null,"image":"","hidden":false},{"id":6,"name":"Dark Wood","price":3150000,"color":"yogoch","style":"classic","hex":"#5a3d28","edge":"#3d2819","badge":"","tags":"dark wood yogoch classic","desc":"To‘q yog‘och rangidagi klassik eshik.","long":"Issiq to‘q yog‘och tekstura va klassik panellar an’anaviy interyerga mos keladi.","material":"MDF + shpon ko‘rinishidagi qoplama","colorName":"Yog‘och","styleName":"Classic","stock":true,"old":null,"image":"","hidden":false},{"id":7,"name":"Minimal Gray","price":3250000,"color":"kulrang","style":"modern","hex":"#9a9c9d","edge":"#74777a","badge":"new","tags":"gray grey kulrang modern minimal","desc":"Sokin kulrang tusdagi minimalist eshik.","long":"Neytral kulrang rang deyarli har qanday zamonaviy interyer bilan uyg‘unlashadi.","material":"MDF + mat PVX qoplama","colorName":"Kulrang","styleName":"Modern","stock":true,"old":null,"image":"","hidden":false},{"id":8,"name":"Premium Brown","price":3490000,"color":"jigarrang","style":"modern","hex":"#4a3328","edge":"#33231b","badge":"premium","tags":"brown espresso jigarrang modern","desc":"To‘q jigarrang zamonaviy MDF eshik.","long":"Chuqur jigarrang ranglar elegant va hashamatli ko‘rinish yaratadi.","material":"MDF + mat PVX qoplama","colorName":"Jigarrang","styleName":"Modern","stock":false,"old":null,"image":"","hidden":false}];

let products = load('products.json', null);
if (!Array.isArray(products)) { products = SEED; save('products.json', products); }
let orders = load('orders.json', []);
let settings = { deliveryFee: 100000, freeFrom: 5000000, ...load('settings.json', {}) };
let orderSeq = load('seq.json', { n: orders.reduce((m, o) => Math.max(m, parseInt(String(o.id).replace(/\D/g, ''), 10) || 0), 0) }).n;

/* ---------- Yordamchilar ---------- */
const money = n => String(n).replace(/\B(?=(\d{3})+(?!\d))/g, ' ') + ' so‘m';
const clean = (v, max) => String(v ?? '').replace(/[\u0000-\u0009\u000b-\u001f\u007f]/g, '').trim().slice(0, max);
const fail = (res, code, error) => res.status(code).json({ ok: false, error });
const isInt = (v, min, max) => Number.isInteger(v) && v >= min && v <= max;

const COLORS = { // rang guruhi -> rasm uchun standart ranglar
  oq: ['#ece9e1', '#d4d0c5'], qora: ['#262626', '#111111'], jigarrang: ['#6b4a33', '#4a3022'],
  yogoch: ['#b98a55', '#8f6636'], kulrang: ['#9a9c9d', '#74777a']
};
const STYLES = { modern: 'Modern', classic: 'Classic' };
const BADGES = ['', 'new', 'best', 'premium', 'sale', 'limited'];
const STATUSES = ['new', 'processing', 'done', 'cancelled'];

const app = express();
app.disable('x-powered-by');
app.use((req, res, next) => { res.set('X-Content-Type-Options', 'nosniff'); next(); });
app.use(express.json({ limit: '50kb' }));

/* ---------- Statik fayllar: faqat ruxsat etilgan ro‘yxat (.env, server.js, data/ ochilmaydi) ---------- */
const PAGES = ['index.html', 'doors.html', 'about.html', 'contact.html', 'cart.html', 'favorites.html', 'style.css', 'script.js'];
const send = f => (req, res) => res.sendFile(path.join(__dirname, f));
app.get('/', send('index.html'));
PAGES.forEach(f => app.get('/' + f, send(f)));
app.use('/img', express.static(path.join(__dirname, 'img'), { dotfiles: 'deny' })); // haqiqiy rasmlar uchun (ixtiyoriy)
const adminPage = (req, res) => { res.set({ 'Cache-Control': 'no-store', 'X-Robots-Tag': 'noindex' }); res.sendFile(path.join(__dirname, 'admin.html')); };
app.get(['/admin', '/admin.html'], adminPage);

/* ---------- Ommaviy API: katalog ---------- */
app.get('/api/catalog', (req, res) => {
  res.set('Cache-Control', 'no-store');
  res.json({ ok: true, products: products.filter(p => !p.hidden), settings: { deliveryFee: settings.deliveryFee, freeFrom: settings.freeFrom } });
});

/* ---------- Zakaz: POST /api/order ---------- */
const hits = new Map(); // oddiy cheklov: IP boshiga 10 daqiqada 8 ta zakaz
setInterval(() => hits.clear(), 60 * 60 * 1000).unref();
function limited(ip) {
  const now = Date.now(), list = (hits.get(ip) || []).filter(t => now - t < 600000);
  list.push(now); hits.set(ip, list);
  return list.length > 8;
}

/* Tekshirish uchun: brauzerda http://localhost:3000/api/health ni oching — yangi server ishlayotganini ko‘rsatadi */
app.get('/api/health', (req, res) => res.json({ ok: true, version: 3, orders: orders.length, products: products.length, telegram: !!(TELEGRAM_BOT_TOKEN && TELEGRAM_CHAT_ID), admin: ADMIN_ENABLED }));
process.on('unhandledRejection', e => console.error('Kutilmagan xato:', e && e.message));

const handleOrder = async (req, res) => {
  const reject = (code, msg) => { console.warn(`Zakaz rad etildi (${code}): ${msg}`); return fail(res, code, msg); };
  if (limited(req.ip)) return reject(429, 'Juda ko‘p so‘rov. Birozdan so‘ng urinib ko‘ring.');

  const b = req.body || {};
  const name = clean(b.name, 100), address = clean(b.address, 300), note = clean(b.note, 500);
  const digits = clean(b.phone, 30).replace(/\D/g, '');
  if (name.length < 2) return reject(400, 'Ismni kiriting.');
  if (!/^(998)?\d{9}$/.test(digits)) return reject(400, 'Telefon raqami noto‘g‘ri.');
  if (address.length < 5) return reject(400, 'Manzilni kiriting.');
  if (!Array.isArray(b.items) || !b.items.length || b.items.length > 50) return reject(400, 'Savat bo‘sh.');

  // Bir xil mahsulotlarni birlashtiramiz; nom va narx mijozdan emas, katalogdan olinadi
  const qtyById = new Map();
  for (const it of b.items) {
    const id = Number(it && it.id), qty = Number(it && it.qty);
    if (!products.some(p => p.id === id && !p.hidden) || !isInt(qty, 1, 99)) return reject(400, 'Mahsulot ma’lumoti noto‘g‘ri yoki katalogda yo‘q.');
    qtyById.set(id, (qtyById.get(id) || 0) + qty);
  }
  const items = [...qtyById].map(([id, qty]) => { const p = products.find(x => x.id === id); return { id, name: p.name, price: p.price, qty }; });
  const subtotal = items.reduce((s, i) => s + i.price * i.qty, 0);
  const delivery = subtotal < settings.freeFrom ? settings.deliveryFee : 0;
  const total = subtotal + delivery;

  const d = digits.length === 9 ? '998' + digits : digits;
  const phone = `+${d.slice(0, 3)} ${d.slice(3, 5)} ${d.slice(5, 8)} ${d.slice(8, 10)} ${d.slice(10, 12)}`;
  orderSeq += 1; save('seq.json', { n: orderSeq });
  const order = { id: 'YD-' + String(orderSeq).padStart(4, '0'), createdAt: new Date().toISOString(), name, phone, address, note, items, delivery, total, status: 'new' };

  const time = new Date(order.createdAt).toLocaleString('ru-RU', { timeZone: 'Asia/Tashkent' });
  const lines = items.map((i, n) => `${n + 1}. ${i.name}\n${i.qty} x ${money(i.price)}`).join('\n\n');
  const text = `🛍 YANGI ZAKAZ ${order.id}\n\n👤 Mijoz:\n${name}\n\n📞 Telefon:\n${phone}\n\n📍 Manzil:\n${address}\n\n📦 Mahsulotlar:\n${lines}\n\n` +
    (delivery ? `🚚 Yetkazib berish:\n${money(delivery)}\n\n` : '') + `💰 Jami:\n${money(total)}\n\n📝 Izoh:\n${note || '—'}\n\n🕐 Vaqt:\n${time}`;

  // Zakaz AVVAL saqlanadi — Telegram ishlamasa yoki sozlanmagan bo‘lsa ham admin panelda ko‘rinadi va hech qachon yo‘qolmaydi.
  // order.telegram: 'sent' (yuborildi) | 'failed' (yuborilmadi) | 'off' (Telegram sozlanmagan) — admin panelda ko‘rsatiladi.
  order.telegram = TELEGRAM_BOT_TOKEN && TELEGRAM_CHAT_ID ? 'pending' : 'off';
  orders.unshift(order);
  try { save('orders.json', orders); } catch (e) { orders.shift(); throw e; }   // saqlanmasa ro‘yxatdan ham olib tashlaymiz (qayta urinishda dublikat bo‘lmasin)
  console.log(`Zakaz qabul qilindi: ${order.id} — ${name}, ${money(total)}`);
  if (order.telegram === 'pending') notifyTelegram(order, text);   // kutmaymiz: mijozga javob darhol qaytadi
  res.json({ ok: true, id: order.id });
};
app.post('/api/order', (req, res) => handleOrder(req, res).catch(e => {
  console.error('Zakazni qayta ishlashda xato:', e.message);          // masalan: data/ papkaga yozib bo‘lmadi
  if (!res.headersSent) fail(res, 500, 'Server xatosi: zakazni saqlab bo‘lmadi. Server oynasidagi xabarni tekshiring.');
}));

/* Telegramga xabar yuborish (fonda). Natija zakazga yoziladi va admin panelda ko‘rinadi */
async function notifyTelegram(order, text) {
  const ctl = new AbortController(), timer = setTimeout(() => ctl.abort(), 10000);
  try {
    const r = await fetch(`https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' }, signal: ctl.signal,
      body: JSON.stringify({ chat_id: TELEGRAM_CHAT_ID, text, disable_web_page_preview: true })
    });
    const j = await r.json().catch(() => ({}));
    order.telegram = r.ok && j.ok ? 'sent' : 'failed';
    if (order.telegram === 'failed') console.error(`Telegram xatosi (zakaz ${order.id} saqlandi):`, j.description || r.status);
  } catch (e) {
    order.telegram = 'failed';
    console.error(`Telegram bilan aloqa xatosi (zakaz ${order.id} saqlandi):`, e.name === 'AbortError' ? 'javob kelmadi (10 soniya)' : (e.cause?.code || e.name)); // URL (token) log qilinmaydi
  } finally {
    clearTimeout(timer);
    try { save('orders.json', orders); } catch (e) { console.error('Saqlashda xato:', e.message); }
  }
}

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
    await new Promise(r => setTimeout(r, 400)); // tez-tez taxmin qilishni sekinlashtiradi
    return fail(res, 401, 'Parol noto‘g‘ri.');
  }
  failed.delete(req.ip);
  const token = crypto.randomBytes(32).toString('hex');
  sessions.set(token, Date.now() + SESSION_MS);
  res.set('Set-Cookie', cookie(req, token, SESSION_MS / 1000));
  res.json({ ok: true });
});
app.post('/api/admin/logout', (req, res) => {
  sessions.delete(readCookies(req).yd_admin);
  res.set('Set-Cookie', cookie(req, '', 0));
  res.json({ ok: true });
});

/* ---------- Admin API (kirish talab qilinadi) ---------- */
const admin = express.Router();
admin.use((req, res, next) => {
  res.set('Cache-Control', 'no-store');
  if (!ADMIN_ENABLED) return off(res);
  if (!authed(req)) return fail(res, 401, 'Kirish talab qilinadi.');
  if (req.method !== 'GET' && req.get('X-Requested-With') !== 'yd-admin') return fail(res, 403, 'Ruxsat yo‘q.'); // CSRF himoyasi
  next();
});

admin.get('/orders', (req, res) => res.json({ ok: true, orders }));
admin.patch('/orders/:id', (req, res) => {
  const o = orders.find(x => x.id === req.params.id), status = (req.body || {}).status;
  if (!o) return fail(res, 404, 'Zakaz topilmadi.');
  if (!STATUSES.includes(status)) return fail(res, 400, 'Holat noto‘g‘ri.');
  o.status = status; save('orders.json', orders); res.json({ ok: true });
});
admin.delete('/orders/:id', (req, res) => {
  const n = orders.length; orders = orders.filter(x => x.id !== req.params.id);
  if (orders.length === n) return fail(res, 404, 'Zakaz topilmadi.');
  save('orders.json', orders); res.json({ ok: true });
});

function parseProduct(b, old) { // { error } yoki tayyor mahsulot maydonlari
  b = b || {};
  const name = clean(b.name, 80), price = Number(b.price), oldPrice = b.old === null || b.old === '' || b.old === undefined ? null : Number(b.old);
  const color = String(b.color), style = String(b.style), badge = String(b.badge || ''), image = clean(b.image, 300);
  if (name.length < 2) return { error: 'Nom kamida 2 ta belgi bo‘lsin.' };
  if (!isInt(price, 1000, 1e9)) return { error: 'Narx noto‘g‘ri (butun son, kamida 1000).' };
  if (oldPrice !== null && !isInt(oldPrice, 1000, 1e9)) return { error: 'Eski narx noto‘g‘ri.' };
  if (!COLORS[color]) return { error: 'Rang guruhi noto‘g‘ri.' };
  if (!STYLES[style]) return { error: 'Uslub noto‘g‘ri.' };
  if (!BADGES.includes(badge)) return { error: 'Belgi noto‘g‘ri.' };
  if (image && !/^(https?:\/\/|\/?img\/)[^\s"'<>\\]+$/i.test(image)) return { error: 'Rasm havolasi http(s):// yoki img/... ko‘rinishida bo‘lsin.' };
  const colorChanged = !old || old.color !== color;
  return {
    name, price, old: oldPrice, color, style, styleName: STYLES[style], badge, image,
    colorName: clean(b.colorName, 40) || (color[0].toUpperCase() + color.slice(1)),
    material: clean(b.material, 80) || 'MDF', desc: clean(b.desc, 200), long: clean(b.long, 1000), tags: clean(b.tags, 200).toLowerCase(),
    hex: colorChanged ? COLORS[color][0] : old.hex, edge: colorChanged ? COLORS[color][1] : old.edge,
    stock: !!b.stock, hidden: !!b.hidden
  };
}
admin.get('/products', (req, res) => res.json({ ok: true, products }));
admin.post('/products', (req, res) => {
  const p = parseProduct(req.body); if (p.error) return fail(res, 400, p.error);
  const prod = { id: products.reduce((m, x) => Math.max(m, x.id), 0) + 1, ...p };
  products.push(prod); save('products.json', products); res.json({ ok: true, product: prod });
});
admin.put('/products/:id', (req, res) => {
  const i = products.findIndex(x => x.id === Number(req.params.id));
  if (i < 0) return fail(res, 404, 'Mahsulot topilmadi.');
  const p = parseProduct(req.body, products[i]); if (p.error) return fail(res, 400, p.error);
  products[i] = { id: products[i].id, ...p }; save('products.json', products); res.json({ ok: true, product: products[i] });
});
admin.delete('/products/:id', (req, res) => {
  const n = products.length; products = products.filter(x => x.id !== Number(req.params.id));
  if (products.length === n) return fail(res, 404, 'Mahsulot topilmadi.');
  save('products.json', products); res.json({ ok: true });
});

admin.get('/settings', (req, res) => res.json({ ok: true, settings: { deliveryFee: settings.deliveryFee, freeFrom: settings.freeFrom } }));
admin.put('/settings', (req, res) => {
  const fee = Number((req.body || {}).deliveryFee), free = Number((req.body || {}).freeFrom);
  if (!isInt(fee, 0, 1e7)) return fail(res, 400, 'Yetkazib berish narxi noto‘g‘ri.');
  if (!isInt(free, 0, 1e9)) return fail(res, 400, 'Bepul yetkazib berish chegarasi noto‘g‘ri.');
  settings = { ...settings, deliveryFee: fee, freeFrom: free }; save('settings.json', settings); res.json({ ok: true });
});
admin.get('/export', (req, res) => { // zaxira nusxa (JSON)
  res.set('Content-Disposition', `attachment; filename="yasindoors-zaxira-${new Date().toISOString().slice(0, 10)}.json"`);
  res.json({ exportedAt: new Date().toISOString(), settings, products, orders });
});
app.use('/api/admin', admin);

app.use((req, res) => res.status(404).send('Topilmadi'));
app.use((err, req, res, next) => fail(res, 400, 'So‘rov noto‘g‘ri.')); // noto‘g‘ri JSON va h.k.

app.listen(PORT, () => {
  console.log(`YasinDoors: http://localhost:${PORT}`);
  console.log(ADMIN_ENABLED ? `Admin panel: http://localhost:${PORT}/admin` : 'Admin panel O‘CHIQ: .env da kamida 8 belgili ADMIN_PASSWORD yozing.');
  if (!TELEGRAM_BOT_TOKEN || !TELEGRAM_CHAT_ID) console.warn('OGOHLANTIRISH: .env da TELEGRAM_BOT_TOKEN va TELEGRAM_CHAT_ID to‘ldirilmagan — zakazlar admin panelda saqlanadi, lekin Telegramga yuborilmaydi.');
});
