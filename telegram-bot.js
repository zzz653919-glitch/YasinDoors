/**
 * INTERAKTIV TELEGRAM BOT — webhook handler
 * -----------------------------------------------------------------
 * Bu funksiya "telegram-order.js"dan MUSTAQIL ishlaydi:
 *   - telegram-order.js  → saytdagi forma → sizning chatingizga xabar (bir tomonlama, o'zgarishsiz qoldi)
 *   - telegram-bot.js    → mijoz botga yozganda → mijozga javob va tugmalar (bu YANGI, ikki tomonlama)
 *
 * Ishlash tartibi:
 *   1. Mijoz botga istalgan matn yozadi (yoki /start bosadi).
 *   2. Bot erkin matnni "tinglamaydi" — har doim bir xil menyuni tugmalar bilan qaytaradi.
 *      Shu tariqa "erkin yozishuv" bloklanadi — mijoz faqat tugmalar orqali harakat qiladi.
 *   3. Mijoz tugmani bossa (callback_query), bot shu mavzu bo'yicha tayyor javobni yuboradi
 *      va "Menyuga qaytish" tugmasini qo'shadi.
 *
 * Kerakli ENV o'zgaruvchilar (Netlify → Site settings → Environment variables):
 *   TELEGRAM_BOT_TOKEN     — @BotFather bergan token (shu funksiya ICHIDA ishlatiladi,
 *                            brauzerga hech qachon chiqmaydi — telegram-config.js'dagidan farqli!)
 *   TELEGRAM_WEBHOOK_SECRET (ixtiyoriy, lekin tavsiya etiladi) — webhook so'rovini
 *                            tekshirish uchun o'zingiz o'ylab topgan maxfiy so'z.
 */

const TELEGRAM_API = 'https://api.telegram.org/bot';

function apiUrl(method) {
  return TELEGRAM_API + process.env.TELEGRAM_BOT_TOKEN + '/' + method;
}

function callTelegram(method, payload) {
  return fetch(apiUrl(method), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  }).then(function (res) { return res.json(); });
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

function sendMenu(chatId, extraText) {
  return callTelegram('sendMessage', {
    chat_id: chatId,
    text: (extraText ? extraText + '\n\n' : '') + MAIN_MENU_TEXT,
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
  // Faqat POST so'rovlarni qabul qilamiz (Telegram webhook shunday yuboradi)
  if (event.httpMethod !== 'POST') {
    return { statusCode: 200, body: 'ok' };
  }

  // Ixtiyoriy: webhook so'rovi haqiqatan Telegramdan kelayotganini tekshirish
  var secret = process.env.TELEGRAM_WEBHOOK_SECRET;
  if (secret) {
    var got = event.headers['x-telegram-bot-api-secret-token'];
    if (got !== secret) {
      return { statusCode: 401, body: 'unauthorized' };
    }
  }

  var update;
  try {
    update = JSON.parse(event.body || '{}');
  } catch (e) {
    return { statusCode: 400, body: 'bad request' };
  }

  try {
    if (update.callback_query) {
      var cq = update.callback_query;
      var chatId = cq.message.chat.id;
      var data = cq.data;

      // Bosilgan tugmani "yuklanmoqda" holatidan chiqarish
      await callTelegram('answerCallbackQuery', { callback_query_id: cq.id });

      if (data === 'pay_info') {
        await sendAnswer(chatId, PAY_INFO_TEXT);
      } else if (data === 'hours_info') {
        await sendAnswer(chatId, HOURS_INFO_TEXT);
      } else {
        // "menu" yoki noma'lum data — asosiy menyuga qaytariladi
        await sendMenu(chatId);
      }
    } else if (update.message) {
      var msgChatId = update.message.chat.id;
      // Har qanday erkin matn (shu jumladan /start) — javob o'rniga har doim menyu ko'rsatiladi.
      // Shu tariqa mijoz bilan erkin yozishuv "bloklanadi".
      await sendMenu(msgChatId);
    }
  } catch (err) {
    console.error('telegram-bot xatoligi:', err);
  }

  // Telegramga har doim 200 qaytarish kerak, aks holda u qayta-qayta urinib turaveradi
  return { statusCode: 200, body: 'ok' };
};
