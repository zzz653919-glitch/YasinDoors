# 🚪 YasinDoors — Google Sheets bilan ishlaydigan bot

Bu versiyada **Flask server, SQLite, admin panel va VPS shart emas**.
Ma'lumotlar Google Sheets'da saqlanadi (`Code.gs` orqali), bot esa faqat
o'sha Sheets bilan gaplashadi.

## Arxitektura

| Qism | Vazifasi |
|---|---|
| `Code.gs` | Google Apps Script — Sheets'ga yozadi va bot uchun so'rovlarga javob beradi (siz allaqachon egasiz, endi yangilangan) |
| `frontend/bot-config.js` | Sayt uchun: Sheets manzili + bot username |
| `frontend/telegram-order.js` | Buyurtmani to'g'ridan-to'g'ri Sheets'ga (Code.gs orqali) yuboradi |
| `frontend/java.js` | Sizning asl java.js'ingiz — login/ro'yxat qismi ham Sheets'ga yozadi (asl holatiga qaytarildi) |
| `bot_logic.py` | Telegram bot mantig'i — buyurtmalarni Sheets'dan o'qiydi |
| `config.py` | Token, admin chat ID, Sheets manzili |
| `bot.py` | Botni ishga tushiruvchi yagona skript |

## 1. Code.gs'ni Google Apps Script'ga joylash

1. [sheets.google.com](https://sheets.google.com)da jadval oching (yoki avvalgisidan foydalaning).
2. **Extensions → Apps Script**ni oching, ichidagi kodni butunlay o'chirib,
   shu yangilangan `Code.gs` matnini joylashtiring.
3. **Deploy → New deployment → Web app**:
   - Execute as: **Me**
   - Who has access: **Anyone**
4. **Deploy**ni bosing, ruxsat berish (Authorize) bosqichidan o'ting.
5. Sizga **Web App URL** beriladi (masalan
   `https://script.google.com/macros/s/AKfycb.../exec`) — shuni nusxalab oling.

> ⚠️ **Muhim**: bu manzilga Telegram webhook **o'RNATMANG**. Bot endi
> to'liq Python tomonida (long-polling) ishlaydi — webhook o'rnatilsa,
> ular bir-biriga xalaqit beradi.

## 2. Python botni sozlash

`config.py` faylida:
```python
BOT_TOKEN = "..."          # allaqachon to'ldirilgan
ADMIN_CHAT_ID = "170310198"     # allaqachon to'ldirilgan
BOT_USERNAME = "YasinDoors_Jizzax_bot"  # allaqachon to'ldirilgan
SHEETS_WEBHOOK_URL = "..."  # 1-qadamda olingan Web App URL'ni shu yerga qo'ying
```

O'rnatish va ishga tushirish:
```bash
pip install -r requirements.txt
python bot.py
```

Botni doimiy ishlab turishi uchun (kompyuteringiz yoki arzon bir VPS'da):
```bash
nohup python bot.py > bot.log 2>&1 &
```
yoki `systemd`/`pm2`/`screen` kabi vositalardan foydalaning. Bu — oddiy
Python skripti, alohida domen, SSL sertifikat yoki ochiq port talab qilmaydi
(faqat Telegram va Google'ga chiquvchi internet aloqasi kifoya).

## 3. Saytni yangilash

1. `frontend/bot-config.js`, `frontend/telegram-order.js`, `frontend/java.js`
   fayllarini saytingiz papkasiga qo'yib, eskilarini almashtiring.
2. `bot-config.js` faylida to'ldiring:
   ```js
   window.SHEETS_WEBHOOK_URL = 'https://script.google.com/macros/s/AKfycb.../exec';
   ```
   (1-qadamda olgan xuddi shu havola — `config.py`dagi bilan bir xil bo'lishi kerak.)
3. Quyidagi 6 ta HTML faylda (`index.html`, `index2.html`, `katalog.html`,
   `katalog2.html`, `buyurtma.html`, `buyurtma2.html`) ikkita qatorni:
   ```html
   <script src="telegram-config.js"></script>
   <script src="sheets-config.js"></script>
   ```
   shu bittasiga almashtiring:
   ```html
   <script src="bot-config.js"></script>
   ```

Boshqa hech narsa o'zgarmaydi — xarita, validatsiya, dizayn hammasi avvalgidek.

## Bot buyruqlari

| Buyruq | Vazifasi |
|---|---|
| `/start` | Salomlashish + menyu |
| `/start o_<ID>` | Muayyan buyurtma tasdiqlash xabari |
| `/start my_orders` | Telefon orqali barcha buyurtmalarni topish |
| `/order` | Eng so'nggi buyurtma |
| `/allorder` | Barcha buyurtmalar |
| `/help` | Menyuni qayta ko'rsatish |

`config.py`dagi `WORK_HOURS`, `CONTACT_PHONE`, `MAP_LINK` — to'lov/ish vaqti
matnlarida ishlatiladigan qiymatlar, xohlasangiz o'zgartiring.

## Ma'lumotlarni qayerdan ko'rasiz

To'g'ridan-to'g'ri **Google Sheets jadvalingizning o'zida** — uchta varaq
avtomatik paydo bo'ladi: **Buyurtmalar**, **Ro'yxatdan o'tganlar**,
**Kirish urinishlari**, **Telegram foydalanuvchilari**. Excel qilib olish
uchun: **Fayl → Yuklab olish → Microsoft Excel (.xlsx)**.

## Eslatma: admin'ga yangi buyurtma xabari

Hozirgi versiyada yangi buyurtma tushganda administratorga avtomatik
Telegram xabari **yuborilmaydi** — buyurtmalar faqat Sheets'ga yoziladi,
mijoz esa botga o'zi "Start" bosib buyurtmasini ko'rishi mumkin (saytdagi
"Buyurtmani Telegramda kuzatish" tugmasi orqali). Agar xohlasangiz, har
safar yangi buyurtma tushganda sizga (ADMIN_CHAT_ID'ga) ham avtomatik
xabar boradigan qilib qo'shib beray — aytsangiz bo'ldi.
