/* ===== YasinDoors — server.js =====
   Static hosting + POST /api/order -> Telegram Bot API.
   Token/chat id are read ONLY from .env and never sent to the browser. */
'use strict';
require('dotenv').config();
const path = require('path');
const express = require('express');

const { TELEGRAM_BOT_TOKEN: TOKEN, TELEGRAM_CHAT_ID: CHAT_ID, PORT = 3000 } = process.env;
const app = express();
app.disable('x-powered-by');
app.use(express.json({ limit: '20kb' }));

/* --- 1. Serve ONLY public frontend files (never .env, server.js, package.json) --- */
const PUBLIC = ['index.html', 'doors.html', 'about.html', 'contact.html', 'cart.html', 'favorites.html', 'style.css', 'script.js'];
app.get('/', (req, res) => res.sendFile(path.join(__dirname, 'index.html')));
app.get('/:file', (req, res, next) =>
  PUBLIC.includes(req.params.file) ? res.sendFile(path.join(__dirname, req.params.file)) : next());

/* --- 2. Helpers --- */
const clean = (v, max) => String(v ?? '').replace(/[\u0000-\u0008\u000b-\u001f\u007f]/g, ' ').trim().slice(0, max);
const money = n => String(n).replace(/\B(?=(\d{3})+(?!\d))/g, ' ') + ' so‘m';
const int = (v, min, max) => Number.isInteger(v) && v >= min && v <= max;
const hits = new Map(); // tiny in-memory rate limit: 5 orders / 10 min / IP
function limited(ip) {
  const now = Date.now(), list = (hits.get(ip) || []).filter(t => now - t < 600000);
  list.push(now); hits.set(ip, list); return list.length > 5;
}

/* --- 3. POST /api/order --- */
app.post('/api/order', async (req, res) => {
  if (!TOKEN || !CHAT_ID) {
    console.error('TELEGRAM_BOT_TOKEN / TELEGRAM_CHAT_ID .env faylida topilmadi.');
    return res.status(500).json({ ok: false, error: 'Server sozlanmagan.' });
  }
  if (limited(req.ip)) return res.status(429).json({ ok: false, error: 'Juda ko‘p urinish. Birozdan so‘ng qayta urinib ko‘ring.' });

  const b = req.body || {};
  const name = clean(b.name, 100), phone = clean(b.phone, 30), address = clean(b.address, 300), note = clean(b.note, 500);
  const digits = phone.replace(/\D/g, '');
  const items = Array.isArray(b.items) ? b.items : [];
  const delivery = b.delivery ?? 0;

  const valid = name.length >= 2 && /^\+?[\d\s()-]+$/.test(phone) && digits.length >= 9 && digits.length <= 13 &&
    address.length >= 5 && items.length >= 1 && items.length <= 50 && int(delivery, 0, 10000000) &&
    items.every(i => i && typeof i.name === 'string' && int(i.price, 1, 1000000000) && int(i.qty, 1, 99));
  if (!valid) return res.status(400).json({ ok: false, error: 'Ma’lumotlar noto‘g‘ri to‘ldirilgan.' });

  const sub = items.reduce((s, i) => s + i.price * i.qty, 0);
  const lines = items.map(i => `${clean(i.name, 80)} × ${i.qty}`).join('\n');
  const time = new Date().toLocaleString('ru-RU', { timeZone: 'Asia/Tashkent' });
  const text = `🛍 YANGI ZAKAZ\n\nMijoz:\n${name}\n\nTelefon:\n${phone}\n\nManzil:\n${address}\n\nMahsulotlar:\n${lines}\n\n` +
    `Yetkazib berish:\n${delivery ? money(delivery) : 'Bepul'}\n\nJami:\n${money(sub + delivery)}\n\nIzoh:\n${note || '—'}\n\nVaqt:\n${time}`;

  try {
    const r = await fetch(`https://api.telegram.org/bot${TOKEN}/sendMessage`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ chat_id: CHAT_ID, text })
    });
    const d = await r.json().catch(() => ({}));
    if (!r.ok || !d.ok) throw new Error(d.description || 'HTTP ' + r.status);
    res.json({ ok: true });
  } catch (err) {
    console.error('Telegram xatosi:', err.message); // message only — never log the token
    res.status(502).json({ ok: false, error: 'Zakaz yuborilmadi. Iltimos, qaytadan urinib ko‘ring.' });
  }
});

app.listen(PORT, () => console.log(`YasinDoors: http://localhost:${PORT}`));
