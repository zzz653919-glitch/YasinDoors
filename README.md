# YasinDoors — Buyurtmalar Telegramga keladi

Bu versiyada hech qanday backend/server/baza yo'q — sayt to'liq oldingidek
statik qoladi. Faqat farqi: mijoz "Buyurtmani jo'natish" tugmasini bosganda,
buyurtma ma'lumotlari to'g'ridan-to'g'ri **Telegram botingizga xabar**
bo'lib keladi.

## Nima o'zgardi

- `telegram-config.js` — YANGI fayl. Shu yerga bot token va chat ID
  yoziladi.
- `telegram-order.js` — YANGI fayl. Buyurtma ma'lumotlarini chiroyli
  formatlab, Telegramga yuboradi.
- `buyurtma.html`, `buyurtma2.html` — forma yuborilganda endi Telegramga
  xabar ketadi (bundan boshqa hech narsa o'zgarmagan — xarita, manzil
  tekshiruvi, validatsiya — hammasi avvalgidek).
- Qolgan fayllar (`index.html`, `katalog.html`, `style.css`, `java.js`
  va h.k.) — **hech o'zgarmagan**, asl nusxa.

## O'rnatish (2 daqiqa)

1. `telegram-config.js` faylini oching.
2. Ikkita qiymatni almashtiring:

```js
window.TELEGRAM_BOT_TOKEN = 'BOT_TOKEN_BU_YERGA';   // @BotFather bergan token
window.TELEGRAM_CHAT_ID   = 'CHAT_ID_BU_YERGA';     // sizning chat ID'ingiz
```

3. Barcha fayllarni odatdagidek hostingingizga (Netlify va h.k.) yuklang.

Tayyor — endi har bir buyurtma sizning Telegram chatingizga shu ko'rinishda keladi:

```
🛒 Yangi buyurtma — YasinDoors

👤 Mijoz: Aziz Karimov
📞 Tel: +998901234567
🚪 Model: Buxoro (Klassik seriya)
📏 O'lcham: 800 x 2000 mm
🎨 Rang: Yong'oq (#7A4A20)
🔢 Miqdor: 2 dona
💰 Umumiy: 4 900 000 so'm
💵 Zalog (20%): 980 000 so'm
📍 Manzil: Toshkent shahri, Chilonzor, Bunyodkor, 12
🗺 Xaritada ko'rish  ← (bosilsa, mijoz belgilagan aniq nuqtani ochadi)
```

## Telegram botni qanday yaratish kerak

1. Telegram'da **@BotFather**ni oching, `/newbot` yuboring, bot nomi va
   foydalanuvchi nomini bering (nomi "bot" bilan tugashi kerak).
2. BotFather sizga token beradi (masalan
   `123456789:AAHdqTcvCH1vGWJxfSeofSAs0K5PALDsaw`) — shuni
   `TELEGRAM_BOT_TOKEN`ga qo'ying.
3. Yaratilgan botingizga borib, unga bironta xabar yuboring (masalan
   "salom") — bu shart, aks holda bot sizga yoza olmaydi.
4. Brauzerda oching: `https://api.telegram.org/bot<TOKEN>/getUpdates`
   — javobda `"chat":{"id":123456789` kabi ko'rinadigan raqam — shu
   `TELEGRAM_CHAT_ID`.

### Guruh yoki kanalga yubormoqchi bo'lsangiz
Botni guruhga/kanalga qo'shing, guruhda bironta xabar yozdiring, so'ng
xuddi shu `getUpdates` usuli bilan guruh chat ID'sini toping (guruh
ID'lari odatda manfiy raqam bo'ladi, masalan `-1001234567890`).

## Bilib qo'yish kerak bo'lgan narsa (xavfsizlik)

Bot token `telegram-config.js` faylida — bu fayl brauzerda ochiq
turadi, ya'ni sahifa manbasini (view-source) ko'rgan har qanday odam
tokenni ko'rishi mumkin. Bu shunchaki xabar yuborish uchun ishlatilgani
sabab amaliy xavf katta emas (bank kartasi kabi emas), lekin nazariy
jihatdan kimdir shu token bilan botingiz nomidan xabar yuborishi mumkin.

Agar bu his qilinsa muhim bo'lsa — tokenni butunlay yashiradigan (kichik
serverless funksiya orqali) variant ham qilib berishim mumkin, lekin bu
uchun (juda kichik bo'lsa ham) backend kerak bo'ladi. Hozircha eng oddiy
va tezkor yechim — token ochiq turgan holat.
