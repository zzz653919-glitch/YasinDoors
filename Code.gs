/**
 * YASINDOORS — Google Apps Script: Sheets + Telegram bot (HAMMASI BIR JOYDA)
 * -----------------------------------------------------------------
 * Bu yagona fayl endi IKKI vazifani bajaradi:
 *
 *   1) Saytdan keladigan ma'lumotlarni Google Sheets'ga yozadi
 *      (register, login, order, telegram_user) — avvalgidek.
 *
 *   2) Telegram botga mijoz yozganda (webhook orqali) TO'G'RIDAN-TO'G'RI
 *      shu yerning o'zida javob qaytaradi — Netlify yoki boshqa hech
 *      qanday alohida server/hosting KERAK EMAS. Google Apps Script'ning
 *      o'zi bot uchun ham "server" vazifasini bajaradi.
 *
 * Nega bu ishlaydi: Telegram "webhook" - bu shunchaki, mijoz botga
 * yozganda Telegram shu ma'lumotni yuboradigan URL. Avval bu URL
 * Netlify function edi, endi xuddi shu Apps Script Web App URL
 * (sheets-config.js'dagi bilan BIR XIL) bo'ladi.
 *
 * ====================== O'RNATISH ======================
 * 1. Pastdagi TELEGRAM_BOT_TOKEN qiymatini tekshiring (allaqachon to'ldirilgan).
 * 2. Bu faylni to'liq joylashtirgach, Deploy → Manage deployments →
 *    tahrirlash (qalam) → Version: New version → Deploy qiling.
 * 3. Web App URL'ingizni (sheets-config.js'dagi bilan bir xil) oling.
 * 4. Brauzerda quyidagi havolani oching (o'z TOKEN va URL'ingiz bilan):
 *    https://api.telegram.org/bot<TOKEN>/setWebhook?url=<WEB_APP_URL>
 *    Javobda "ok":true chiqsa — tayyor, boshqa hech narsa kerak emas.
 * =========================================================
 */

// ================== SOZLAMALAR ==================

// @BotFather bergan bot tokeningiz (telegram-config.js'dagi bilan bir xil)
var TELEGRAM_BOT_TOKEN = '8919097362:AAFvgfRWGg4ZIIJ9Pi0bsxxPVCqSIqI_eLw';

// Botdagi "🌐 Saytga o'tish" tugmasi shu manzilga olib boradi — o'zingiznikiga moslang
var WEBSITE_URL = 'https://zzz653919-glitch.github.io';


// ================== SHEETS: USTUNLAR SOZLAMASI ==================

var TEXT_COLUMNS_BY_SHEET = {
  "Ro'yxatdan o'tganlar": [3, 4],
  'Kirish urinishlari': [2, 3],
  'Buyurtmalar': [4],
  'Telegram foydalanuvchilari': [6]
};

var ORDER_HEADERS = ['Sana', 'ID', 'Ism', 'Telefon', 'Model', 'Seriya',
  "O'lcham", 'Rang', 'Miqdor', 'Umumiy narx', 'Zalog', 'Manzil', 'Xarita havolasi', 'Sahifa'];

var HEADER_BG = '#c9a44c';
var HEADER_FONT = '#17130f';
var BORDER_COLOR = '#e3d7bd';
var ROW_BG_EVEN = '#faf6ec';
var ROW_BG_ODD = '#ffffff';


// ================== ASOSIY KIRISH NUQTASI (doPost) ==================

function doPost(e) {
  try {
    var data = JSON.parse(e.postData.contents);

    // ---- Telegram webhook'dan kelgan yangilanish (har doim "update_id" bo'ladi) ----
    if (data.update_id !== undefined) {
      handleTelegramUpdate(data);
      return ContentService.createTextOutput(JSON.stringify({ ok: true }))
        .setMimeType(ContentService.MimeType.JSON);
    }

    // ---- Saytdan kelgan oddiy ma'lumotlar (avvalgidek) ----
    var ss = SpreadsheetApp.getActiveSpreadsheet();
    var now = new Date();

    if (data.type === 'register') {
      writeRow(ss, "Ro'yxatdan o'tganlar", ['Sana', 'Ism', 'Telefon', 'Kod', 'Sahifa'],
        [now, data.name || '', data.phone || '', data.code || '', data.page || '']);
    } else if (data.type === 'login') {
      writeRow(ss, 'Kirish urinishlari', ['Sana', 'Telefon', 'Kod', 'Sahifa'],
        [now, data.phone || '', data.code || '', data.page || '']);
    } else if (data.type === 'telegram_user') {
      writeRow(ss, 'Telegram foydalanuvchilari', ['Sana', 'Chat ID', 'Ism', 'Familiya', 'Username', 'Telefon', 'Buyurtma ID'],
        [now, data.chat_id || '', data.first_name || '', data.last_name || '', data.username || '', data.phone || '', data.order_id || '']);
    } else if (data.type === 'order') {
      writeRow(ss, 'Buyurtmalar', ORDER_HEADERS,
        [now, data.id || '', data.name || '', data.phone || '', data.model || '',
         data.series || '', data.size || '', data.color || '', data.quantity || '',
         data.total || '', data.deposit || '', data.address || '', data.map_link || '',
         data.page || '']);
    }

    return ContentService.createTextOutput(JSON.stringify({ ok: true }))
      .setMimeType(ContentService.MimeType.JSON);
  } catch (err) {
    console.error('doPost xatoligi:', err);
    return ContentService.createTextOutput(JSON.stringify({ ok: false, error: String(err) }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

/**
 * Berilgan nomdagi varaqni topadi (yo'q bo'lsa yaratadi, sarlavha qatorini
 * qo'yadi va chiroyli formatlaydi), so'ng yangi qatorni oxiriga qo'shadi va
 * butun jadvalni (chegaralar, navbatlashgan fon) yangilaydi.
 */
function writeRow(ss, sheetName, headers, row) {
  var textCols = TEXT_COLUMNS_BY_SHEET[sheetName] || [];
  var sheet = ss.getSheetByName(sheetName);

  if (!sheet) {
    sheet = ss.insertSheet(sheetName);
    sheet.appendRow(headers);

    sheet.getRange(1, 1, 1, headers.length)
      .setFontWeight('bold')
      .setFontSize(11)
      .setBackground(HEADER_BG)
      .setFontColor(HEADER_FONT)
      .setHorizontalAlignment('center')
      .setVerticalAlignment('middle');
    sheet.setRowHeight(1, 34);
    sheet.setFrozenRows(1);

    textCols.forEach(function (col) {
      sheet.getRange(1, col, sheet.getMaxRows(), 1).setNumberFormat('@');
    });

    var widths = { 'Sana': 130, 'Ism': 170, 'Familiya': 150, 'Telefon': 150,
      'Kod': 130, 'Sahifa': 160, 'Chat ID': 130, 'Username': 150 };
    for (var i = 0; i < headers.length; i++) {
      sheet.setColumnWidth(i + 1, widths[headers[i]] || 150);
    }
  }

  textCols.forEach(function (col) {
    if (row[col - 1] !== undefined && row[col - 1] !== '') {
      row[col - 1] = "'" + String(row[col - 1]).replace(/^'/, '');
    }
  });

  sheet.appendRow(row);
  var lastRow = sheet.getLastRow();

  sheet.getRange(lastRow, 1).setNumberFormat('dd.MM.yyyy HH:mm');
  textCols.forEach(function (col) {
    sheet.getRange(lastRow, col).setNumberFormat('@');
  });

  sheet.getRange(lastRow, 1, 1, headers.length)
    .setBackground(lastRow % 2 === 0 ? ROW_BG_EVEN : ROW_BG_ODD)
    .setVerticalAlignment('middle');

  sheet.getRange(1, 1, lastRow, headers.length)
    .setBorder(true, true, true, true, true, true, BORDER_COLOR, SpreadsheetApp.BorderStyle.SOLID);
}

// GET so'rov: brauzerda ochib tekshirish uchun (ixtiyoriy, endi bot uchun shart emas)
function doGet(e) {
  return ContentService.createTextOutput('YasinDoors Sheets/Bot qabul qiluvchisi ishlayapti.');
}

function onlyDigits(s) {
  return String(s || '').replace(/\D/g, '');
}


// ================== SHEETS: BOT UCHUN TO'G'RIDAN-TO'G'RI FUNKSIYALAR ==================
// (HTTP so'rovsiz — chunki bot endi shu skriptning ICHIDA ishlaydi)

function logTelegramUserDirect(msg, extra) {
  try {
    var from = msg.from || {};
    extra = extra || {};
    var ss = SpreadsheetApp.getActiveSpreadsheet();
    writeRow(ss, 'Telegram foydalanuvchilari', ['Sana', 'Chat ID', 'Ism', 'Familiya', 'Username', 'Telefon', 'Buyurtma ID'],
      [new Date(), msg.chat.id, from.first_name || '', from.last_name || '', from.username || '', extra.phone || '', extra.order_id || '']);
  } catch (err) {
    console.error('logTelegramUserDirect xatoligi:', err);
  }
}

function findOrdersByPhoneDirect(phone) {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName('Buyurtmalar');
  var orders = [];
  var target = onlyDigits(phone).slice(-9);
  if (!sheet || !target) return orders;

  var values = sheet.getDataRange().getValues();
  var headers = values[0];
  var phoneCol = headers.indexOf('Telefon');
  var dateCol = headers.indexOf('Sana');
  if (phoneCol === -1) return orders;

  for (var i = 1; i < values.length; i++) {
    if (onlyDigits(values[i][phoneCol]).slice(-9) === target) {
      var order = {};
      headers.forEach(function (h, idx) { order[h] = values[i][idx]; });
      orders.push(order);
    }
  }
  if (dateCol !== -1) {
    orders.sort(function (a, b) { return new Date(b['Sana']) - new Date(a['Sana']); });
  }
  return orders;
}

function findOrderByIdDirect(id) {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName('Buyurtmalar');
  if (!sheet) return null;

  var values = sheet.getDataRange().getValues();
  var headers = values[0];
  var idCol = headers.indexOf('ID');
  if (idCol === -1) return null;

  for (var i = 1; i < values.length; i++) {
    if (String(values[i][idCol]) === String(id)) {
      var order = {};
      headers.forEach(function (h, idx) { order[h] = values[i][idx]; });
      return order;
    }
  }
  return null;
}

function findPhoneByChatIdDirect(chatId) {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName('Telegram foydalanuvchilari');
  if (!sheet) return '';

  var values = sheet.getDataRange().getValues();
  var headers = values[0];
  var chatCol = headers.indexOf('Chat ID');
  var phoneCol = headers.indexOf('Telefon');
  if (chatCol === -1 || phoneCol === -1) return '';

  for (var i = values.length - 1; i >= 1; i--) {
    if (String(values[i][chatCol]) === String(chatId) && values[i][phoneCol]) {
      return String(values[i][phoneCol]);
    }
  }
  return '';
}

// Bot mijozdan telefon so'raganda, qaysi buyruq ("oxirgisi" yoki "hammasi")
// kutilayotganini vaqtincha (5 daqiqaga) eslab qolish uchun
function setPendingIntentDirect(chatId, intent) {
  CacheService.getScriptCache().put('pending_' + chatId, String(intent || ''), 300);
}

function getPendingIntentDirect(chatId, clear) {
  var cache = CacheService.getScriptCache();
  var key = 'pending_' + chatId;
  var intent = cache.get(key) || '';
  if (clear && intent) cache.remove(key);
  return intent;
}


// ================== TELEGRAM BOT: XABAR YUBORISH ==================

function callTelegram(method, payload) {
  var url = 'https://api.telegram.org/bot' + TELEGRAM_BOT_TOKEN + '/' + method;
  try {
    var res = UrlFetchApp.fetch(url, {
      method: 'post',
      contentType: 'application/json',
      payload: JSON.stringify(payload),
      muteHttpExceptions: true
    });
    var data = JSON.parse(res.getContentText());
    if (!data.ok) console.error('Telegram API xatosi (' + method + '):', res.getContentText());
    return data;
  } catch (err) {
    console.error('callTelegram xatoligi:', err);
    return {};
  }
}

function formatSom(num) {
  var n = Math.round(Number(num) || 0);
  return n.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ' ') + " so'm";
}

// ---------- Menyu va javob matnlari ----------

var WELCOME_TEXT =
  "🚪 <b>YasinDoors botiga xush kelibsiz!</b>\n\n" +
  "Bu yerda siz:\n" +
  "📦 /order — eng so'nggi buyurtmangizni ko'rishingiz\n" +
  "🗂 /allorder — barcha buyurtmalaringiz ro'yxatini olishingiz\n" +
  "💳 To'lov shartlari va 🕐 ish vaqtimiz bilan tanishishingiz mumkin.\n\n" +
  "Savolingiz bo'lsa — pastdagi tugmalardan foydalaning yoki operatorimizga qo'ng'iroq qiling.";

var MAIN_MENU_TEXT =
  "🙋 Men <b>YasinDoors</b> botiman.\n\n" +
  "Quyidagi buyruqlardan foydalanishingiz mumkin:\n" +
  "📦 /order — eng so'nggi buyurtmangiz haqida ma'lumot\n" +
  "🗂 /allorder — barcha buyurtmalaringiz ro'yxati\n" +
  "❓ /help — shu yordam xabarini qayta ko'rish\n\n" +
  "Yoki quyidagi tugmalardan birini tanlang:";

var MAIN_MENU_KEYBOARD = {
  inline_keyboard: [
    [{ text: "💳 To'lov usullari", callback_data: "pay_info" }],
    [{ text: "🕐 Ish vaqti / manzil", callback_data: "hours_info" }],
    [{ text: "🌐 Saytga o'tish", url: WEBSITE_URL }]
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

var CONTACT_REQUEST_KEYBOARD = {
  keyboard: [[{ text: '📞 Telefon raqamimni yuborish', request_contact: true }]],
  resize_keyboard: true,
  one_time_keyboard: true
};

function sendMenu(chatId) {
  return callTelegram('sendMessage', {
    chat_id: chatId,
    text: MAIN_MENU_TEXT,
    parse_mode: 'HTML',
    reply_markup: MAIN_MENU_KEYBOARD
  });
}

function sendWelcome(chatId) {
  return callTelegram('sendMessage', {
    chat_id: chatId,
    text: WELCOME_TEXT,
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

function buildOrderConfirmText(order) {
  var lines = [
    '✅ <b>Buyurtmangiz qabul qilindi!</b>',
    '',
    buildOrderDetailLines(order)
  ];
  if (order['Xarita havolasi']) lines.push('🗺 <a href="' + order['Xarita havolasi'] + '">Yetkazish manzili</a>');
  lines.push('');
  lines.push("Tez orada mutaxassisimiz zalog to'lovi bo'yicha siz bilan bog'lanadi.");
  return lines.join('\n');
}

// Mijoz "https://t.me/BOT?start=o_<ID>" havolasini bosib botga birinchi
// marta yozganda ishga tushadi.
function handleOrderStart(chatId, payload, msg) {
  var orderId = payload.indexOf('o_') === 0 ? payload.slice(2) : payload;
  logTelegramUserDirect(msg, { order_id: orderId });

  var order = findOrderByIdDirect(orderId);
  if (!order) {
    callTelegram('sendMessage', {
      chat_id: chatId,
      text: "Kechirasiz, bu buyurtma topilmadi. Savolingiz bo'lsa, operator bilan bog'laning.",
      reply_markup: BACK_KEYBOARD
    });
    return;
  }

  callTelegram('sendMessage', {
    chat_id: chatId,
    text: buildOrderConfirmText(order),
    parse_mode: 'HTML',
    disable_web_page_preview: false,
    reply_markup: BACK_KEYBOARD
  });
}

// Telefon bo'yicha topilgan buyurtma(lar)ni chiroyli qilib yuboradi.
function sendOrdersForPhone(chatId, phone, mode, justGotContact) {
  if (justGotContact) {
    callTelegram('sendMessage', {
      chat_id: chatId,
      text: '✅ Rahmat! Qidiryapman...',
      reply_markup: { remove_keyboard: true }
    });
  }

  var orders = findOrdersByPhoneDirect(phone);

  if (!orders.length) {
    callTelegram('sendMessage', {
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
    callTelegram('sendMessage', { chat_id: chatId, text: lastText, parse_mode: 'HTML', reply_markup: keyboard });
  } else {
    var allText = '🗂 <b>Sizning buyurtmalaringiz</b> (' + orders.length + " ta):\n\n" +
      orders.map(function (o, i) { return buildOneOrderBlock(o, i + 1); }).join('\n\n');
    callTelegram('sendMessage', { chat_id: chatId, text: allText, parse_mode: 'HTML', reply_markup: BACK_KEYBOARD });
  }
}

// /order yoki /allorder buyrug'i berilganda ishga tushadi.
function handleOrderCommand(chatId, msg, mode) {
  logTelegramUserDirect(msg);
  var phone = findPhoneByChatIdDirect(chatId);

  if (!phone) {
    setPendingIntentDirect(chatId, mode);
    callTelegram('sendMessage', {
      chat_id: chatId,
      text: "Buyurtma(lar)ingizni topish uchun telefon raqamingizni tasdiqlang — pastdagi tugmani bosing:",
      reply_markup: CONTACT_REQUEST_KEYBOARD
    });
    return;
  }

  sendOrdersForPhone(chatId, phone, mode, false);
}

function handleContactShared(chatId, contact, msg) {
  logTelegramUserDirect(msg, { phone: contact.phone_number });
  var intent = getPendingIntentDirect(chatId, true);
  sendOrdersForPhone(chatId, contact.phone_number, intent === 'last' ? 'last' : 'all', true);
}

// ================== TELEGRAM BOT: KELGAN YANGILANISHNI QAYTA ISHLASH ==================

function handleTelegramUpdate(update) {
  try {
    if (update.callback_query) {
      var cq = update.callback_query;
      var chatId = cq.message.chat.id;
      var data = cq.data;

      callTelegram('answerCallbackQuery', { callback_query_id: cq.id });

      if (data === 'pay_info') {
        sendAnswer(chatId, PAY_INFO_TEXT);
      } else if (data === 'hours_info') {
        sendAnswer(chatId, HOURS_INFO_TEXT);
      } else if (data === 'allorders') {
        var phoneForAll = findPhoneByChatIdDirect(chatId);
        if (phoneForAll) {
          sendOrdersForPhone(chatId, phoneForAll, 'all', false);
        } else {
          handleOrderCommand(chatId, { chat: cq.message.chat, from: cq.from }, 'all');
        }
      } else {
        sendMenu(chatId);
      }
    } else if (update.message) {
      var msgChatId = update.message.chat.id;
      var text = update.message.text || '';
      var cmd = text.trim().split(/\s+/)[0].toLowerCase();

      if (update.message.contact) {
        handleContactShared(msgChatId, update.message.contact, update.message);
      } else if (cmd === '/start') {
        var payload = text.slice(6).trim();
        if (payload === 'my_orders') {
          handleOrderCommand(msgChatId, update.message, 'all');
        } else if (payload) {
          handleOrderStart(msgChatId, payload, update.message);
        } else {
          logTelegramUserDirect(update.message);
          sendWelcome(msgChatId);
        }
      } else if (cmd === '/order') {
        handleOrderCommand(msgChatId, update.message, 'last');
      } else if (cmd === '/allorder' || cmd === '/allorders') {
        handleOrderCommand(msgChatId, update.message, 'all');
      } else if (cmd === '/help') {
        logTelegramUserDirect(update.message);
        sendMenu(msgChatId);
      } else {
        logTelegramUserDirect(update.message);
        sendMenu(msgChatId);
      }
    }
  } catch (err) {
    console.error('handleTelegramUpdate xatoligi:', err);
  }
}
