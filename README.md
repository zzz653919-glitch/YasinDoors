# 🚪 YasinDoors — faqat Telegram + Google Sheets (Python SHART EMAS)

Bu versiyada **hech qanday Python, VPS, yoki doim ishlab turadigan
kompyuter kerak emas**. Hammasi bitta `Code.gs` faylida — Google
serverlarining o'zida ishlaydi.

## Kerakli fayllar

```
Code.gs                     — Google Apps Script: Sheets + to'liq bot mantig'i
frontend/bot-config.js      — sayt uchun: Sheets manzili + bot username
frontend/telegram-order.js  — buyurtmani Sheets'ga yuboradi
frontend/java.js            — login/ro'yxat ham Sheets'ga yozadi
index.html, index2.html, katalog.html, katalog2.html,
buyurtma.html, buyurtma2.html, style.css, mobile-market.css — sayt
```

**Endi kerak emas** (o'chirib tashlashingiz mumkin): `bot.py`, `bot_logic.py`,
`config.py`, `db.py`, `app.py`, `requirements.txt` — bularning barchasi
endi `Code.gs`ning o'zida.

## 1. Code.gs'ni joylash

1. Google Sheets jadvalingizni oching → **Extensions → Apps Script**.
2. Ichidagi kodni butunlay o'chirib, shu yangilangan `Code.gs` matnini joylashtiring.
3. **Deploy → Manage deployments → tahrirlash (qalam) → Version: New version → Deploy**.
4. Web App URL'ni nusxalab oling (masalan `https://script.google.com/macros/s/AKfycb.../exec`).

## 2. Telegram webhookni o'rnatish (bitta marta, brauzerda)

Quyidagi havolani brauzerda oching, `<TOKEN>` va `<WEB_APP_URL>` o'rniga
o'zingiznikini qo'yib:

```
https://api.telegram.org/bot<TOKEN>/setWebhook?url=<WEB_APP_URL>
```

Masalan (o'z qiymatlaringiz bilan):
```
https://api.telegram.org/bot8919097362:AAFvgfRWGg4ZIIJ9Pi0bsxxPVCqSIqI_eLw/setWebhook?url=https://script.google.com/macros/s/AKfycb.../exec
```

Javobda `{"ok":true,"result":true,...}` chiqsa — tayyor. Bot endi to'liq
ishlaydi, hech qanday kompyuter yoqilib turishi shart emas.

> ⚠️ Agar avval `bot.py`ni ishga tushirgan bo'lsangiz (long-polling),
> uni to'xtating — ikkalasi bir vaqtda ishlay olmaydi.

## 3. Saytni yangilash

1. `frontend/bot-config.js`, `frontend/telegram-order.js`, `frontend/java.js`
   fayllarini saytingiz papkasiga qo'ying.
2. `bot-config.js`da `SHEETS_WEBHOOK_URL` — 1-qadamda olingan Web App URL
   bilan bir xil bo'lishi kerak.
3. 6 ta HTML faylda `<script src="bot-config.js"></script>` allaqachon bor
   bo'lsa — hech narsa qilish shart emas.

## Bot buyruqlari

| Buyruq | Vazifasi |
|---|---|
| `/start` | Salomlashish + menyu |
| `/start o_<ID>` | Muayyan buyurtma tasdiqlash xabari |
| `/start my_orders` | Telefon orqali barcha buyurtmalarni topish |
| `/order` | Eng so'nggi buyurtma |
| `/allorder` | Barcha buyurtmalar |
| `/help` | Menyuni qayta ko'rsatish |

`Code.gs`dagi `HOURS_INFO_TEXT`, `PAY_INFO_TEXT` — to'lov/ish vaqti
matnlari, xohlasangiz o'zgartiring.

## Ma'lumotlarni qayerdan ko'rasiz

To'g'ridan-to'g'ri **Google Sheets jadvalingizning o'zida**: **Buyurtmalar**,
**Ro'yxatdan o'tganlar**, **Kirish urinishlari**, **Telegram foydalanuvchilari**
varaqlari avtomatik yaratiladi. Excel qilib olish: **Fayl → Yuklab olish → .xlsx**.

## Admin'ga yangi buyurtma xabari

Yangi buyurtma Sheets'ga yozilgan zahoti, `notifyAdminNewOrder()` orqali
sizga (`ADMIN_CHAT_ID`) avtomatik Telegram xabar boradi.

## Nosozlikni tuzatish

- **Bot javob bermayapti** → yuqoridagi `setWebhook` havolasini qayta
  ochib, `"ok":true` chiqayotganini tekshiring. Shuningdek
  `https://api.telegram.org/bot<TOKEN>/getWebhookInfo` orqali webhook
  to'g'ri URL'ga o'rnatilganini ko'rishingiz mumkin.
- **Admin xabari kelmayapti** → botga o'zingiz avval `/start` yozganingizga
  ishonch hosil qiling (Telegram qoidasi: bot birinchi yozolmaydi).
- **Buyurtma Sheets'ga tushmayapti** → Apps Script muharriridagi
  **Executions** (Ijrolar) jurnalini tekshiring — xato bo'lsa shu yerda ko'rinadi.
