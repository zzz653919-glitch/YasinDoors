# YasinDoors

MDF eshiklar internet-do'koni. Cart va Favorites brauzerda (localStorage). Zakazlar `server.js` orqali Telegramga yuboriladi va admin panelda saqlanadi.

## Ishga tushirish
1. `npm install`
2. `.env` fayliga quyidagilarni yozing:
   ```
   TELEGRAM_BOT_TOKEN=...      # @BotFather dan
   TELEGRAM_CHAT_ID=...        # avval botingizga biror xabar yuboring
   ADMIN_PASSWORD=...          # admin panel paroli, kamida 8 belgi
   ```
3. `node server.js`
4. Sayt: http://localhost:3000 — Admin panel: http://localhost:3000/admin

Fayllarni to'g'ridan-to'g'ri ochmang: zakaz va admin panel faqat server orqali ishlaydi.

## Admin panel
- **Boshqaruv** — yangi/jarayondagi zakazlar soni, summalar, so'nggi zakazlar.
- **Zakazlar** — qidiruv, holat bo'yicha filtr, holatni o'zgartirish (Yangi / Jarayonda / Yakunlandi / Bekor qilingan), o'chirish, CSV yuklab olish.
- **Mahsulotlar** — qo'shish, tahrirlash, o'chirish: nom, narx, eski narx (chegirma), belgi, rang, uslub, tavsif, rasm havolasi, omborda bor/yo'q, saytda yashirish.
- **Sozlamalar** — yetkazib berish narxi va bepul yetkazib berish chegarasi, zaxira nusxa (JSON).

Katalog va zakazlar `data/` papkasidagi JSON fayllarda saqlanadi (`.gitignore` da, GitHub'ga yuborilmaydi). Shu papkani vaqti-vaqti bilan zaxiralab turing.
Birinchi ishga tushirishda katalog 8 ta standart modeldan yaratiladi; keyin hammasi admin paneldan boshqariladi.

## Xavfsizlik
- Token, chat ID va admin paroli faqat `.env` da turadi, frontendga chiqmaydi.
- Admin kirishi: parol serverda tekshiriladi, sessiya `HttpOnly` cookie'da (8 soat), noto'g'ri urinishlar cheklanadi.
- Narxlar zakazda server katalogidan olinadi — mijoz yuborgan narxga ishonilmaydi.
- Saytni internetga chiqarsangiz, HTTPS ishlating (aks holda parol ochiq uzatiladi).
