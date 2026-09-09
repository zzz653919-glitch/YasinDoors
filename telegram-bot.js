/**
 * INTERAKTIV TELEGRAM BOT — Netlify Function
 * -----------------------------------------------------------------
 * Bu funksiya "telegram-order.js"dan MUSTAQIL ishlaydi:
 *   - telegram-order.js                      → saytdagi forma → sizning chatingizga xabar (bir tomonlama, o'zgarishsiz)
 *   - netlify/functions/telegram-bot.js       → mijoz botga yozganda → mijozga javob va tugmalar (ikki tomonlama)
 *
 * Ishlash tartibi:
 *   1. Mijoz botga istalgan matn yozadi (yoki /start bosadi).
 *   2. Bot erkin matnni "tinglamaydi" — har doim bir xil menyuni tugmalar bilan qaytaradi.
 *   3. Mijoz tugmani bossa (callback_query), bot shu mavzu bo'yicha tayyor javobni yuboradi
 *      va "Menyuga qaytish" tugmasini qo'shadi.
 *
 * Kerakli ENV o'zgaruvchilar (Netlify → Site configuration → Environment variables):
 *   TELEGRAM_BOT_TOKEN        — @BotFather bergan token (MAJBURIY)
 *   TELEGRAM_WEBHOOK_SECRET   — ixtiyoriy maxfiy so'z (setWebhook'da secret_token bilan bir xil bo'lishi shart)
 *   GOOGLE_SHEETS_WEBHOOK_URL — ixtiyoriy: Google Apps Script Web App manzili.
 *                               Berilsa, botga yozgan har bir yangi mijoz (chat_id) haqida
 *                               ma'lumot "Telegram foydalanuvchilari" varag'iga yoziladi.
 *
 * MUHIM: bu fayl repo ichida aynan shu yo'lda turishi shart —
 *   netlify/functions/telegram-bot.js
 * `netlify.toml` shu papkani function sifatida ko'rsatadi, qo'shimcha
 * konfiguratsiya shart emas. Netlify Functions Vercel'dan farqli formatda
 * yoziladi (bu yerda `exports.handler = async (event) => {...}` va
 * javob `{ statusCode, body }` ko'rinishida qaytariladi — `req`/`res` emas).
 */

const TELEGRAM_API = 'https://api.telegram.org/bot';

function apiUrl(method) {
  return TELEGRAM_API + process.env.TELEGRAM_BOT_TOKEN + '/' + method;
}

async function callTelegram(method, payload) {
  var res = await fetch(apiUrl(method), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });
  var data = await res.json();
  if (!data.ok) {
    console.error('Telegram API xatosi (' + method + '):', JSON.stringify(data));
  }
  return data;
}

// ---------- Menyu va javob matnlari ----------

var MAIN_MENU_TEXT =
  "🙋 Salom! Men <b>YasinDoors</b> botiman.\n\n" +
  "Erkin matn yozish o'rniga, quyidagi tugmalardan birini tanlang — shunda tezroq va aniqroq javob olasiz:";

var MAIN_MENU_KEYBOARD = {
  inline_keyboard: [
    [{ text: "💳 To'lov usullari", callback_data: "pay_info" }],
    [{ text: "🕐 Ish vaqti / manzil", callback_data: "hours_info" }]
  ]
};

var BACK_KEYBOARD = {
  inline_keyboard: [
    [{ text: "🔙 Menyuga qaytish", callback_data: "menu" }]
  ]
};

// TODO: quyidagi ikkita matnni haqiqiy ma'lumot bilan to'ldiring/tekshirib chiqing.
var PAY_INFO_TEXT =
  "💳 <b>To'lov usullari</b>\n\n" +
  "Buyurtma tasdiqlash uchun umumiy summaning <b>20%</b> miqdorida zalog (oldindan to'lov) olinadi.\n" +
  "Qolgan qismi eshik yetkazib berilganda <b>naqd</b> yoki <b>plastik karta</b> orqali to'lanadi.\n\n" +
  "Zalogni qanday to'lash mumkin:\n" +
  "1️⃣ Operatorimiz siz bilan bog'lanib, to'lov havolasi yoki karta raqamini yuboradi\n" +
  "2️⃣ Yoki ofisimizga kelib naqd to'lashingiz mumkin\n\n" +
  "Aniq to'lov rekvizitlari uchun operator bilan bog'laning: <a href=\"tel:+998933002020\">+998 93 300 20 20</a>";

// TODO: ish vaqtini (masalan Dush–Shan, 09:00–19:00) va aniq manzil matnini kiriting.
var HOURS_INFO_TEXT =
  "🕐 <b>Ish vaqti</b>: [TO'LDIRING — masalan: Dushanba–Shanba, 09:00–19:00]\n\n" +
  "📍 <b>Manzil</b>: <a href=\"https://maps.app.goo.gl/oFEyE3jcY1ZPsXMJ9\">Xaritada ko'rish</a>\n\n" +
  "📞 Telefon: <a href=\"tel:+998933002020\">+998 93 300 20 20</a>";

// Bir marta ishga tushirilgan funksiya doirasida (bitta so'rov ichida) xotirada
// takroriy yozuvlarning oldini olishning hojati yo'q — Apps Script tomonida
// har bir xabar alohida qator sifatida qo'shiladi, bu qasddan shunday: shu tariqa
// mijozning necha marta yozganini ham ko'rish mumkin.
function logTelegramUser(msg) {
  var url = process.env.GOOGLE_SHEETS_WEBHOOK_URL;
  if (!url) return Promise.resolve();

  var from = msg.from || {};
  return fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'text/plain' }, // Apps Script uchun eng ishonchli format
    body: JSON.stringify({
      type: 'telegram_user',
      chat_id: msg.chat.id,
      first_name: from.first_name || '',
      last_name: from.last_name || '',
      username: from.username || ''
    })
  }).catch(function (err) {
    console.error('Google Sheets xatoligi:', err);
  });
}

function sendMenu(chatId) {
  return callTelegram('sendMessage', {
    chat_id: chatId,
    text: MAIN_MENU_TEXT,
    parse_mode: 'HTML',
    reply_markup: MAIN_MENU_KEYBOARD
  });
}

function sendAnswer(chatId, text) {
  return callTelegram('sendMessage', {
    chat_id: chatId,
    text: text,
    parse_mode: 'HTML',
    disable_web_page_preview: true,
    reply_markup: BACK_KEYBOARD
  });
}

exports.handler = async function (event) {
  console.log('telegram-bot chaqirildi, method:', event.httpMethod);

  if (event.httpMethod !== 'POST') {
    return { statusCode: 200, body: 'telegram-bot funksiyasi ishlayapti (faqat POST qabul qiladi)' };
  }

  if (!process.env.TELEGRAM_BOT_TOKEN) {
    console.error('TELEGRAM_BOT_TOKEN environment variable topilmadi!');
    return { statusCode: 500, body: 'TELEGRAM_BOT_TOKEN sozlanmagan' };
  }

  // Ixtiyoriy: webhook so'rovi haqiqatan Telegramdan kelayotganini tekshirish
  var secret = process.env.TELEGRAM_WEBHOOK_SECRET;
  if (secret) {
    var headers = event.headers || {};
    var got = headers['x-telegram-bot-api-secret-token'] || headers['X-Telegram-Bot-Api-Secret-Token'];
    if (got !== secret) {
      console.error('Webhook secret mos kelmadi.');
      return { statusCode: 401, body: 'unauthorized' };
    }
  }

  // Netlify har doim event.body'ni matn (string) sifatida beradi — o'zimiz JSON qilib o'qiymiz
  var update = {};
  try {
    update = JSON.parse(event.body || '{}');
  } catch (e) {
    update = {};
  }

  try {
    if (update.callback_query) {
      var cq = update.callback_query;
      var chatId = cq.message.chat.id;
      var data = cq.data;

      await callTelegram('answerCallbackQuery', { callback_query_id: cq.id });

      if (data === 'pay_info') {
        await sendAnswer(chatId, PAY_INFO_TEXT);
      } else if (data === 'hours_info') {
        await sendAnswer(chatId, HOURS_INFO_TEXT);
      } else {
        await sendMenu(chatId);
      }
    } else if (update.message) {
      var msgChatId = update.message.chat.id;
      await logTelegramUser(update.message);
      await sendMenu(msgChatId);
    } else {
      console.log('Kutilmagan update turi:', JSON.stringify(update));
    }
  } catch (err) {
    console.error('telegram-bot ichki xatoligi:', err);
  }

  return { statusCode: 200, body: 'ok' };
};
