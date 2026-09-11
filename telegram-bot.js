/**
 * INTERAKTIV TELEGRAM BOT — Netlify Function
 * -----------------------------------------------------------------
 * Bu funksiya "telegram-order.js"dan MUSTAQIL ishlaydi:
 *   - telegram-order.js                      → saytdagi forma → sizning chatingizga xabar (bir tomonlama, o'zgarishsiz)
 *   - netlify/functions/telegram-bot.js       → mijoz botga yozganda → mijozga javob va tugmalar (ikki tomonlama)
 *
 * Ishlash tartibi:
 *   1. Mijoz botga birinchi marta yozganda (yoki /start, /help), bot
 *      buyruqlar ro'yxatini (yordam xabarini) va menyu tugmalarini qaytaradi.
 *   2. /order — mijozning ENG SO'NGGI buyurtmasini ko'rsatadi.
 *      /allorder — mijozning BARCHA buyurtmalarini ro'yxat qilib beradi.
 *      Ikkalasi uchun ham, agar mijozning telefon raqami hali noma'lum
 *      bo'lsa, bot "📞 Telefon raqamimni yuborish" tugmasi orqali so'raydi,
 *      so'ng Google Sheets'dagi "Buyurtmalar" varag'idan shu raqamga
 *      tegishli yozuvlarni qidirib topadi. Raqam bir marta ulashilgach,
 *      keyingi safar qayta so'ralmaydi (Sheets'da eslab qolinadi).
 *   3. Mijoz "💳 To'lov usullari" / "🕐 Ish vaqti" tugmalarini bossa
 *      (callback_query), bot shu mavzu bo'yicha tayyor javobni yuboradi
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
  "Quyidagi buyruqlardan foydalanishingiz mumkin:\n" +
  "📦 /order — eng so'nggi buyurtmangiz haqida ma'lumot\n" +
  "🗂 /allorder — barcha buyurtmalaringiz ro'yxati\n" +
  "❓ /help — shu yordam xabarini qayta ko'rish\n\n" +
  "Yoki quyidagi tugmalardan birini tanlang:";

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

// Shu chat avval telefon raqamini ulashgan bo'lsa (Code.gs "Telegram
// foydalanuvchilari" varag'idan), uni topib qaytaradi — shunda /order
// yoki /allorder buyrug'i berilganda har safar qayta so'ralmaydi.
async function getKnownPhone(chatId) {
  var url = process.env.GOOGLE_SHEETS_WEBHOOK_URL;
  if (!url) return '';
  try {
    var sep = url.indexOf('?') === -1 ? '?' : '&';
    var res = await fetch(url + sep + 'action=getPhoneByChatId&chat_id=' + encodeURIComponent(chatId));
    var data = await res.json();
    return (data && data.ok) ? (data.phone || '') : '';
  } catch (err) {
    console.error('Telefonni chat ID bo\'yicha olishda xatolik:', err);
    return '';
  }
}

// Bot mijozdan telefon so'raganda, qaysi buyruq ("oxirgisi" yoki "hammasi")
// kutilayotganini vaqtincha (5 daqiqaga) Google Apps Script'ning
// CacheService'ida eslab qoladi — Netlify function har safar "yangidan"
// ishga tushgani uchun bu holatni o'zida saqlay olmaydi.
async function setPendingIntent(chatId, intent) {
  var url = process.env.GOOGLE_SHEETS_WEBHOOK_URL;
  if (!url) return;
  try {
    await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'text/plain' },
      body: JSON.stringify({ type: 'set_pending', chat_id: chatId, intent: intent })
    });
  } catch (err) {
    console.error('Pending holatni saqlashda xatolik:', err);
  }
}

async function getPendingIntent(chatId) {
  var url = process.env.GOOGLE_SHEETS_WEBHOOK_URL;
  if (!url) return '';
  try {
    var sep = url.indexOf('?') === -1 ? '?' : '&';
    var res = await fetch(url + sep + 'action=getPending&chat_id=' + encodeURIComponent(chatId) + '&clear=1');
    var data = await res.json();
    return (data && data.ok) ? (data.intent || '') : '';
  } catch (err) {
    console.error('Pending holatni olishda xatolik:', err);
    return '';
  }
}

function buildOrderDetailLines(order) {
  var lines = [
    '🚪 Model: ' + (order['Model'] || '—') + (order['Seriya'] ? ' (' + order['Seriya'] + ')' : '')
  ];
  if (order["O'lcham"]) lines.push("📏 O'lcham: " + order["O'lcham"]);
  lines.push('🎨 Rang: ' + (order['Rang'] || '—'));
  lines.push('🔢 Miqdor: ' + (order['Miqdor'] || '—') + ' dona');
  lines.push('💰 Umumiy: ' + formatSom(order['Umumiy narx']));
  lines.push('💵 Zalog (20%): ' + formatSom(order['Zalog']));
  return lines.join('\n');
}

function buildOneOrderBlock(order, index) {
  return '📦 <b>Buyurtma ' + index + '</b>\n' + buildOrderDetailLines(order);
}

// "📞 Telefon raqamimni yuborish" — bitta bosishda ulashiladigan tugma
// (mijoz erkin matn yozmaydi, faqat shu tugmani bosadi)
var CONTACT_REQUEST_KEYBOARD = {
  keyboard: [[{ text: '📞 Telefon raqamimni yuborish', request_contact: true }]],
  resize_keyboard: true,
  one_time_keyboard: true
};

// /order yoki /allorder buyrug'i berilganda ishga tushadi.
// Agar bu chat uchun telefon allaqachon ma'lum bo'lsa — darhol natijani
// ko'rsatadi; aks holda telefon so'raydi (va nima kutilayotganini eslab qoladi).
async function handleOrderCommand(chatId, msg, mode) {
  await logTelegramUser(msg);
  var phone = await getKnownPhone(chatId);

  if (!phone) {
    await setPendingIntent(chatId, mode);
    await callTelegram('sendMessage', {
      chat_id: chatId,
      text: "Buyurtma(lar)ingizni topish uchun telefon raqamingizni tasdiqlang — pastdagi tugmani bosing:",
      reply_markup: CONTACT_REQUEST_KEYBOARD
    });
    return;
  }

  await sendOrdersForPhone(chatId, phone, mode, false);
}

// Telefon bo'yicha topilgan buyurtma(lar)ni chiroyli qilib yuboradi.
//   mode: 'last' — faqat eng so'nggisi (+ "hammasini ko'rish" tugmasi)
//         'all'  — barcha buyurtmalar ro'yxati
//   justGotContact — true bo'lsa, avval reply-klaviaturani olib tashlaydigan
//                     qisqa xabar yuboradi (kontakt hozirgina ulashilgan bo'lsa)
async function sendOrdersForPhone(chatId, phone, mode, justGotContact) {
  if (justGotContact) {
    await callTelegram('sendMessage', {
      chat_id: chatId,
      text: '✅ Rahmat! Qidiryapman...',
      reply_markup: { remove_keyboard: true }
    });
  }

  var orders = await fetchOrdersByPhone(phone);

  if (!orders.length) {
    await callTelegram('sendMessage', {
      chat_id: chatId,
      text: "Sizning raqamingiz bo'yicha hozircha buyurtma topilmadi.",
      reply_markup: BACK_KEYBOARD
    });
    return;
  }

  if (mode === 'last') {
    var lastText = "📦 <b>Eng so'nggi buyurtmangiz</b>\n\n" + buildOrderDetailLines(orders[0]) +
      (orders.length > 1 ? ("\n\n<i>Jami " + orders.length + " ta buyurtmangiz bor.</i>") : '');
    var keyboard = orders.length > 1
      ? { inline_keyboard: [[{ text: "🗂 Barcha buyurtmalarni ko'rish", callback_data: 'allorders' }], [{ text: "🔙 Menyuga qaytish", callback_data: 'menu' }]] }
      : BACK_KEYBOARD;
    await callTelegram('sendMessage', { chat_id: chatId, text: lastText, parse_mode: 'HTML', reply_markup: keyboard });
  } else {
    var allText = '🗂 <b>Sizning buyurtmalaringiz</b> (' + orders.length + " ta):\n\n" +
      orders.map(function (o, i) { return buildOneOrderBlock(o, i + 1); }).join('\n\n');
    await callTelegram('sendMessage', { chat_id: chatId, text: allText, parse_mode: 'HTML', reply_markup: BACK_KEYBOARD });
  }
}

async function handleContactShared(chatId, contact, msg) {
  await logTelegramUser(msg, { phone: contact.phone_number });
  var intent = await getPendingIntent(chatId);
  await sendOrdersForPhone(chatId, contact.phone_number, intent === 'last' ? 'last' : 'all', true);
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
      } else if (data === 'allorders') {
        var phoneForAll = await getKnownPhone(chatId);
        if (phoneForAll) {
          await sendOrdersForPhone(chatId, phoneForAll, 'all', false);
        } else {
          await handleOrderCommand(chatId, { chat: cq.message.chat, from: cq.from }, 'all');
        }
      } else {
        await sendMenu(chatId);
      }
    } else if (update.message) {
      var msgChatId = update.message.chat.id;
      var text = update.message.text || '';
      var cmd = text.trim().split(/\s+/)[0].toLowerCase();

      if (update.message.contact) {
        // Mijoz "📞 Telefon raqamimni yuborish" tugmasini bosdi
        await handleContactShared(msgChatId, update.message.contact, update.message);
      } else if (cmd === '/start') {
        var payload = text.slice(6).trim(); // "/start" dan keyingi qism (bo'sh bo'lishi ham mumkin)
        if (payload === 'my_orders') {
          // Bosh sahifa/katalogdagi umumiy "Buyurtmalarimni ko'rish" havolasi orqali kelgan
          await handleOrderCommand(msgChatId, update.message, 'all');
        } else if (payload) {
          // Mijoz saytdagi "Telegramda kuzatish" havolasi orqali kelgan —
          // buyurtmasi haqida shaxsiy tasdiqlash xabari yuboriladi
          await handleOrderStart(msgChatId, payload, update.message);
        } else {
          // Birinchi marta yozgan (yoki oddiy /start) — yordam menyusi
          await logTelegramUser(update.message);
          await sendMenu(msgChatId);
        }
      } else if (cmd === '/order') {
        // Eng so'nggi buyurtma
        await handleOrderCommand(msgChatId, update.message, 'last');
      } else if (cmd === '/allorder' || cmd === '/allorders') {
        // Barcha buyurtmalar
        await handleOrderCommand(msgChatId, update.message, 'all');
      } else if (cmd === '/help') {
        await logTelegramUser(update.message);
        await sendMenu(msgChatId);
      } else {
        // Har qanday boshqa (erkin) matn — birinchi marta yozgan mijoz uchun
        // ham, keyingilar uchun ham xuddi shu yordam menyusi ko'rsatiladi
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
