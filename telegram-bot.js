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
function logTelegramUser(msg, extra) {
  var url = process.env.GOOGLE_SHEETS_WEBHOOK_URL;
  if (!url) return Promise.resolve();

  var from = msg.from || {};
  extra = extra || {};
  return fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'text/plain' }, // Apps Script uchun eng ishonchli format
    body: JSON.stringify({
      type: 'telegram_user',
      chat_id: msg.chat.id,
      first_name: from.first_name || '',
      last_name: from.last_name || '',
      username: from.username || '',
      phone: extra.phone || '',       // mijoz "Telefon raqamimni yuborish" tugmasini bossa
      order_id: extra.order_id || ''  // mijoz "Telegramda kuzatish" havolasi orqali kelsa
    })
  }).catch(function (err) {
    console.error('Google Sheets xatoligi:', err);
  });
}

function formatSom(num) {
  var n = Math.round(Number(num) || 0);
  return n.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ' ') + " so'm";
}

// Google Sheets'dagi "Buyurtmalar" varag'idan ID bo'yicha buyurtmani topib olish
// (Code.gs dagi doGet ?action=getOrder&id=... orqali)
async function fetchOrderById(id) {
  var url = process.env.GOOGLE_SHEETS_WEBHOOK_URL;
  if (!url) return null;
  try {
    var sep = url.indexOf('?') === -1 ? '?' : '&';
    var res = await fetch(url + sep + 'action=getOrder&id=' + encodeURIComponent(id));
    var data = await res.json();
    return (data && data.ok) ? data.order : null;
  } catch (err) {
    console.error('Buyurtmani Sheets\'dan olishda xatolik:', err);
    return null;
  }
}

function buildOrderConfirmText(order) {
  var lines = [
    '✅ <b>Buyurtmangiz qabul qilindi!</b>',
    '',
    '🚪 Model: ' + (order['Model'] || '—') + (order['Seriya'] ? ' (' + order['Seriya'] + ')' : ''),
  ];
  if (order["O'lcham"]) lines.push("📏 O'lcham: " + order["O'lcham"]);
  lines.push('🎨 Rang: ' + (order['Rang'] || '—'));
  lines.push('🔢 Miqdor: ' + (order['Miqdor'] || '—') + ' dona');
  lines.push('💰 Umumiy: ' + formatSom(order['Umumiy narx']));
  lines.push('💵 Zalog (20%): ' + formatSom(order['Zalog']));
  if (order['Xarita havolasi']) lines.push('🗺 <a href="' + order['Xarita havolasi'] + '">Yetkazish manzili</a>');
  lines.push('');
  lines.push("Tez orada mutaxassisimiz zalog to'lovi bo'yicha siz bilan bog'lanadi.");
  return lines.join('\n');
}

// Mijoz "https://t.me/BOT?start=o_<ID>" havolasini bosib botga birinchi
// marta yozganda ishga tushadi — shu zahoti uning chat ID'si ma'lum bo'ladi
// va aynan shu buyurtma haqida shaxsiy xabar yuboriladi.
async function handleOrderStart(chatId, payload, msg) {
  var orderId = payload.indexOf('o_') === 0 ? payload.slice(2) : payload;
  await logTelegramUser(msg, { order_id: orderId });

  var order = await fetchOrderById(orderId);

  if (!order) {
    await callTelegram('sendMessage', {
      chat_id: chatId,
      text: "Kechirasiz, bu buyurtma topilmadi. Savolingiz bo'lsa, operator bilan bog'laning.",
      reply_markup: BACK_KEYBOARD
    });
    return;
  }

  await callTelegram('sendMessage', {
    chat_id: chatId,
    text: buildOrderConfirmText(order),
    parse_mode: 'HTML',
    disable_web_page_preview: false,
    reply_markup: BACK_KEYBOARD
  });
}

async function fetchOrdersByPhone(phone) {
  var url = process.env.GOOGLE_SHEETS_WEBHOOK_URL;
  if (!url) return [];
  try {
    var sep = url.indexOf('?') === -1 ? '?' : '&';
    var res = await fetch(url + sep + 'action=getOrdersByPhone&phone=' + encodeURIComponent(phone));
    var data = await res.json();
    return (data && data.ok && data.orders) ? data.orders : [];
  } catch (err) {
    console.error('Buyurtmalarni telefon bo\'yicha olishda xatolik:', err);
    return [];
  }
}

function buildOneOrderBlock(order, index) {
  var lines = [
    '📦 <b>Buyurtma ' + index + '</b>',
    '🚪 Model: ' + (order['Model'] || '—') + (order['Seriya'] ? ' (' + order['Seriya'] + ')' : '')
  ];
  if (order["O'lcham"]) lines.push("📏 O'lcham: " + order["O'lcham"]);
  lines.push('🎨 Rang: ' + (order['Rang'] || '—'));
  lines.push('🔢 Miqdor: ' + (order['Miqdor'] || '—') + ' dona');
  lines.push('💰 Umumiy: ' + formatSom(order['Umumiy narx']));
  lines.push('💵 Zalog (20%): ' + formatSom(order['Zalog']));
  return lines.join('\n');
}

// "📞 Telefon raqamimni yuborish" — bitta bosishda ulashiladigan tugma
// (mijoz erkin matn yozmaydi, faqat shu tugmani bosadi)
var CONTACT_REQUEST_KEYBOARD = {
  keyboard: [[{ text: '📞 Telefon raqamimni yuborish', request_contact: true }]],
  resize_keyboard: true,
  one_time_keyboard: true
};

async function handleMyOrdersStart(chatId) {
  await callTelegram('sendMessage', {
    chat_id: chatId,
    text: "Buyurtmalaringizni ko'rsatish uchun telefon raqamingizni tasdiqlang — pastdagi tugmani bosing:",
    reply_markup: CONTACT_REQUEST_KEYBOARD
  });
}

async function handleContactShared(chatId, contact, msg) {
  await logTelegramUser(msg, { phone: contact.phone_number });
  var orders = await fetchOrdersByPhone(contact.phone_number);

  // Reply keyboard'ni olib tashlaymiz
  if (!orders.length) {
    await callTelegram('sendMessage', {
      chat_id: chatId,
      text: "Sizning raqamingiz bo'yicha hozircha buyurtma topilmadi.",
      reply_markup: { remove_keyboard: true }
    });
    await sendMenu(chatId);
    return;
  }

  var text = '🗂 <b>Sizning buyurtmalaringiz</b> (' + orders.length + " ta):\n\n" +
    orders.map(function (o, i) { return buildOneOrderBlock(o, i + 1); }).join('\n\n') +
    "\n\nTez orada mutaxassisimiz zalog to'lovi bo'yicha siz bilan bog'lanadi.";

  await callTelegram('sendMessage', {
    chat_id: chatId,
    text: text,
    parse_mode: 'HTML',
    reply_markup: { remove_keyboard: true }
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
      var text = update.message.text || '';

      if (update.message.contact) {
        // Mijoz "📞 Telefon raqamimni yuborish" tugmasini bosdi
        await handleContactShared(msgChatId, update.message.contact, update.message);
      } else if (text.indexOf('/start') === 0) {
        var payload = text.slice(6).trim(); // "/start" dan keyingi qism (bo'sh bo'lishi ham mumkin)
        if (payload === 'my_orders') {
          // Bosh sahifa/katalogdagi umumiy "Buyurtmalarimni ko'rish" havolasi orqali kelgan
          await logTelegramUser(update.message);
          await handleMyOrdersStart(msgChatId);
        } else if (payload) {
          // Mijoz saytdagi "Telegramda kuzatish" havolasi orqali kelgan —
          // buyurtmasi haqida shaxsiy tasdiqlash xabari yuboriladi
          await handleOrderStart(msgChatId, payload, update.message);
        } else {
          await logTelegramUser(update.message);
          await sendMenu(msgChatId);
        }
      } else {
        await logTelegramUser(update.message);
        await sendMenu(msgChatId);
      }
    } else {
      console.log('Kutilmagan update turi:', JSON.stringify(update));
    }
  } catch (err) {
    console.error('telegram-bot ichki xatoligi:', err);
  }

  return { statusCode: 200, body: 'ok' };
};
