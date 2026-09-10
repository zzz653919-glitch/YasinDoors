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

---

# 2-QISM — Interaktiv bot (mijoz bilan tugmali muloqot)

Yuqoridagi qism (`telegram-order.js`) — sayt sizga xabar yuboradi, bu
o'zgarishsiz qoladi. Bu yangi qism esa **mijoz botga yozganda** ishlaydi:
mijoz erkin matn yozolmaydi, faqat tugmalar orqali savol tanlaydi.

Buning uchun ikkita yangi fayl qo'shildi:
- `netlify/functions/telegram-bot.js` — bot mantiqi (server tomonida ishlaydi)
- `netlify.toml` — Netlify'ga functions qayerdaligini aytadi

## Nega bu boshqacha ishlaydi

1-qismdagi bot faqat **sizga** xabar yuboradi (bir tomonlama, backendsiz
ham ishlayveradi). Bu yangi bot esa **mijozga javob qaytarishi** kerak —
buning uchun kimdir doim "tinglab" turishi shart. Shuning uchun kichik
server kodi (Netlify Function) kerak bo'ldi.

## O'rnatish (GitHub + Netlify)

1. Barcha fayllarni (shu jumladan `netlify/` papkasi va `netlify.toml`)
   GitHub'dagi repozitoriyangizga joylang (push qiling).
2. [Netlify](https://app.netlify.com)da **Add new site → Import an existing
   project** orqali shu GitHub repozitoriysini ulang. Netlify `netlify.toml`ni
   o'zi topib, funksiyani avtomatik deploy qiladi.
3. Netlify saytingiz sozlamalarida: **Site configuration → Environment
   variables** bo'limiga o'ting va qo'shing:
   ```
   TELEGRAM_BOT_TOKEN = <sizning bot tokeningiz>
   TELEGRAM_WEBHOOK_SECRET = <o'zingiz o'ylab topgan maxfiy so'z, masalan: yasindoors2026secret>
   ```
   (Bu yerdagi token brauzerga chiqmaydi — faqat server tomonida ishlatiladi,
   `telegram-config.js`dagidan farqli.)
4. Deploy tugagach, funksiyangiz manzili shunday bo'ladi:
   ```
   https://SIZNING-SAYTINGIZ.netlify.app/.netlify/functions/telegram-bot
   ```
5. Telegramga botga shu manzilni "webhook" sifatida o'rnatishni ayting —
   brauzerda quyidagi havolani oching (o'z TOKEN, URL va SECRET'ingiz bilan):
   ```
   https://api.telegram.org/bot<TOKEN>/setWebhook?url=https://SIZNING-SAYTINGIZ.netlify.app/.netlify/functions/telegram-bot&secret_token=<SECRET>
   ```
   Javobda `"ok":true` chiqsa — tayyor.

## Tekshirish

Botingizga Telegramda istalgan xabar yozing (masalan "salom" yoki `/start`).
Bot sizga darhol menyuni ikkita tugma bilan qaytarishi kerak:
- 💳 To'lov usullari
- 🕐 Ish vaqti / manzil

Har qanday keyingi erkin xabar ham xuddi shu menyuni qaytaraveradi — ya'ni
mijoz erkin yozisholmaydi, faqat tugmalar orqali harakat qiladi.

## Matnlarni to'ldirish

`netlify/functions/telegram-bot.js` faylida `PAY_INFO_TEXT` va
`HOURS_INFO_TEXT` o'zgaruvchilarini toping — u yerda `[TO'LDIRING]` deb
belgilangan joylar bor (masalan aniq ish vaqti). Shularni haqiqiy
ma'lumot bilan to'ldiring, so'ng GitHub'ga qayta push qiling — Netlify
avtomatik qayta deploy qiladi.

---

# 3-QISM — Ma'lumotlarni Google Sheets'ga saqlash

Bu qism uchta manbadan kelgan ma'lumotni bitta Google Sheets faylida
avtomatik yig'adi:
- Saytdagi "Ro'yxatdan o'tish" formasi → ism + telefon (**parol saqlanmaydi**)
- Saytdagi "Tizimga kirish" formasi → telefon (**parol saqlanmaydi**)
- Telegram botga yozgan mijozlar → chat ID, ism, familiya, username

## O'rnatish

1. [sheets.google.com](https://sheets.google.com)da yangi bo'sh jadval yarating
   (masalan "YasinDoors — Mijozlar bazasi" deb nomlang).
2. Yuqori menyudan **Extensions → Apps Script**ni oching.
3. Ochilgan muharrirdagi barcha standart kodni o'chirib, `google-apps-script/Code.gs`
   faylining butun matnini joylashtiring.
4. Yuqori o'ng burchakdagi **Deploy → New deployment** tugmasini bosing.
5. Type sifatida (charxpalak belgisi) **Web app**ni tanlang.
6. Sozlamalar:
   - Execute as: **Me**
   - Who has access: **Anyone**
7. **Deploy**ni bosing, kerak bo'lsa ruxsat berish (Authorize access) bosqichidan
   o'ting. Sizga bir **Web App URL** beriladi (masalan
   `https://script.google.com/macros/s/AKfycb.../exec`) — shuni nusxalab oling.

## Saytga ulash

`sheets-config.js` faylini oching va quyidagi qatorni to'ldiring:
```js
window.SHEETS_WEBHOOK_URL = 'https://script.google.com/macros/s/AKfycb.../exec';
```
So'ng barcha fayllarni (yangilangan `index.html`, `index2.html`, `katalog.html`,
`katalog2.html`, `java.js`, `sheets-config.js`) hostingingizga qayta yuklang.

## Telegram botga ulash

Netlify loyihangizning Environment Variables bo'limiga yana bitta
o'zgaruvchi qo'shing:
```
GOOGLE_SHEETS_WEBHOOK_URL = https://script.google.com/macros/s/AKfycb.../exec
```
Qo'shgach, loyihani qayta deploy qiling (env variable o'zgarishi avtomatik
qayta deploy'ni ishga tushirmaydi — qo'lda "Redeploy" qilish kerak).

## Natija

Google Sheets faylingizda avtomatik uchta varaq (tab) paydo bo'ladi:
**Ro'yxatdan o'tganlar**, **Kirish urinishlari**, **Telegram foydalanuvchilari** —
har birida sarlavha qatori tilla rangda ajratilgan, yangi ma'lumot har doim
oxiriga qo'shiladi.

---

# 4-QISM — Mijozning o'ziga buyurtma haqida Telegram xabari

Hozirgacha buyurtma haqidagi xabar faqat **sizga** (do'kon egasiga) kelardi.
Endi mijoz ham o'z buyurtmasi haqida **shaxsiy Telegram xabarini** olishi
mumkin.

## Nega bu bosqichli ishlaydi

Telegram qoidasi shunday: **bot hech qachon birinchi bo'lib begona odamga
yoza olmaydi** — faqat foydalanuvchi botga avval o'zi yozgan (yoki "Start"
bosgan) bo'lsa, bot unga javob qaytara oladi. Shu sababli mijozning telefon
raqamiga qarab avtomatik xabar yuborib bo'lmaydi.

Shuning uchun jarayon shunday quriladi:

1. Mijoz saytda buyurtma beradi → xabar avvalgidek **sizga** ketadi, va
   buyurtma noyob ID bilan Google Sheets'ning yangi **"Buyurtmalar"**
   varag'iga yoziladi.
2. Muvaffaqiyat sahifasida mijozga **"📲 Buyurtmani Telegramda kuzatish"**
   tugmasi chiqadi — bu tugma uni to'g'ridan-to'g'ri sizning botingizga
   (`t.me/<bot_username>?start=o_<ID>`) olib boradi.
3. Mijoz botda "Start" bosishi bilan (bu — uning botga yozgan birinchi
   xabari), bot avtomatik ravishda o'sha ID bo'yicha buyurtma tafsilotlarini
   Google Sheets'dan topib, mijozga **shaxsiy tasdiqlash xabarini** yuboradi
   (model, o'lcham, rang, narx, zalog va h.k.).

Agar mijoz tugmani bosmasa — hech narsa buzilmaydi, faqat u shaxsiy
tasdiqlash xabarini olmaydi; sizga ketadigan asosiy xabar baribir keladi.

## O'rnatish (qo'shimcha 2 qadam)

Agar 1—3-qismlarni allaqachon sozlagan bo'lsangiz (bot token, chat ID,
Google Sheets webhook), faqat quyidagilarni qiling:

1. `telegram-config.js` faylida yangi qatorni to'ldiring:
   ```js
   window.TELEGRAM_BOT_USERNAME = 'sizning_bot_username'; // @ belgisisiz
   ```
   (Botingiz nomini bilmasangiz — Telegram'da botingiz profiliga kiring,
   `@username` qismini @ belgisisiz shu yerga yozing.)
2. Google Sheets'dagi Apps Script kodini yangilangan `Code.gs` fayli bilan
   almashtiring (**Deploy → Manage deployments → tahrirlash belgisi →
   Version: New version → Deploy**) — bu shart, aks holda bot buyurtmani
   topa olmaydi.
3. `netlify/functions/telegram-bot.js` faylini yangilangan nusxa bilan
   almashtirib, GitHub'ga push qiling (Netlify avtomatik qayta deploy
   qiladi).
4. Yangilangan `buyurtma.html`, `buyurtma2.html`, `telegram-order.js`,
   `telegram-config.js` fayllarini hostingingizga qayta yuklang.

Shu bilan tayyor — endi mijoz ham o'z buyurtmasi haqida Telegramda shaxsiy
xabar oladi.

---

# 5-QISM — Bosh sahifa/katalogdagi umumiy "Buyurtmalarimni ko'rish" tugmasi

Endi bosh sahifa va katalog sahifalarining pastki qismida (Aloqa bo'limida)
**"Buyurtmalarimni Telegramda ko'rish"** havolasi ham chiqadi (4-QISM'dagi
TELEGRAM_BOT_USERNAME to'ldirilgan bo'lsa avtomatik ko'rinadi).

Bu yerda aniq buyurtma ID'si yo'q, shuning uchun boshqacha ishlaydi:

1. Mijoz tugmani bosib botga o'tadi va "Start" beradi.
2. Bot mijozdan **"📞 Telefon raqamimni yuborish"** tugmasi orqali (erkin
   yozmasdan, bitta bosish bilan) telefon raqamini so'raydi.
3. Bot shu raqam bo'yicha Google Sheets'dagi **"Buyurtmalar"** varag'idan
   mijozning barcha buyurtmalarini topib, har birini chiroyli qilib
   (model, o'lcham, rang, narx, zalog) ro'yxat ko'rinishida yuboradi.

Bu ham 1—4-qismlardagi bir xil sozlamalardan (bot token, chat ID, Google
Sheets webhook, bot username) foydalanadi — qo'shimcha sozlash shart emas,
faqat `Code.gs` va `telegram-bot.js` ning yangi nusxalarini joylashtiring.

## Ikonlar

Yangi qo'shilgan barcha Telegram tugmalari (💬 emoji o'rniga) saytning
o'zidagi chiziqli SVG-ikon uslubida (`stroke="currentColor"`, brass rang)
qilib qayta ishlandi — shu bilan boshqa ikonlar (telefon, manzil va h.k.)
bilan bir xil ko'rinishga ega.

## Buyurtmalarni Excel formatida olish

Alohida hech narsa qurish shart emas — buyurtmalar allaqachon Google
Sheets'ning **"Buyurtmalar"** varag'iga tushib turibdi. Excel fayl sifatida
olish uchun: Google Sheets'ni oching → **Fayl → Yuklab olish → Microsoft
Excel (.xlsx)**. Har safar eng so'nggi holatni shunday yuklab olishingiz
mumkin.

---

# 6-QISM — Bot orqali telefon/buyurtma bog'lanishi

Sayt orqali kelgan **har qanday buyurtma** — mijoz botga umuman yozmasa
ham — avvalgidek to'liq **"Buyurtmalar"** varag'iga saqlanadi (3—4-qismlar).

Qo'shimcha ravishda, endi mijoz botda telefon raqamini ulashsa yoki
"Telegramda kuzatish" havolasi orqali buyurtmasini tasdiqlasa, bu ham
**"Telegram foydalanuvchilari"** varag'iga (yangi **Telefon** va
**Buyurtma ID** ustunlari bilan) yoziladi — shunda qaysi Telegram chat
qaysi mijoz/buyurtmaga tegishli ekanini ko'rish mumkin bo'ladi.

O'rnatish uchun faqat yangilangan `Code.gs` va `telegram-bot.js`ni
joylashtirish yetarli (qo'shimcha sozlama shart emas).

