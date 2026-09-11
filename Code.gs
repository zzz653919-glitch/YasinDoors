/**
 * YASINDOORS — Google Sheets qabul qiluvchi (Apps Script)
 * -----------------------------------------------------------------
 * Bu kod Google Sheets faylining "Extensions → Apps Script" bo'limiga
 * joylashtiriladi va "Web App" sifatida deploy qilinadi.
 *
 * Uchta manbadan ma'lumot qabul qiladi:
 *   - type: "register"       → saytda "Ro'yxatdan o'tish" formasi (Ism, Telefon, Kod)
 *   - type: "login"          → saytda "Tizimga kirish" formasi (Telefon, Kod)
 *   - type: "telegram_user"  → Telegram botga yozgan mijoz
 *   - type: "order"          → saytda berilgan buyurtma
 *   - type: "set_pending"    → bot ichki holati (qaysi buyruq kutilmoqda)
 *
 * Har biri uchun alohida varaq (sheet tab) yaratiladi va sarlavhalar
 * avtomatik qo'yiladi, jadval chiroyli formatlanadi (ranglar, chegaralar,
 * navbatlashgan qator fonlari). Telefon va Kod ustunlari har doim MATN
 * sifatida saqlanadi — shu tufayli "+998901234567" yoki faqat raqamlardan
 * iborat kod ("00123" kabi) Google Sheets tomonidan raqamga aylantirilib,
 * boshidagi "+" yoki "0" belgilari yo'qolib qolmaydi.
 *
 * DIQQAT: "Kod" ustuni — mijoz forma orqali kiritgan parol/kod, aynan shu
 * ko'rinishda (ochiq matn) saqlanadi. Bu jadvalga kirish huquqi bor har
 * qanday kishi uni ko'ra oladi, shuning uchun jadvalni faqat ishonchli
 * odamlar bilan bo'lishing tavsiya etiladi.
 */

// Har bir varaqda qaysi ustun(lar) MATN (text) sifatida saqlanishi kerakligini
// bildiradi (1-ustun = A). Bir nechta ustun bo'lsa — massiv beriladi.
var TEXT_COLUMNS_BY_SHEET = {
  "Ro'yxatdan o'tganlar": [3, 4],   // Sana, Ism, Telefon, Kod, Sahifa
  'Kirish urinishlari': [2, 3],     // Sana, Telefon, Kod, Sahifa
  'Buyurtmalar': [4],               // Sana, ID, Ism, Telefon, ...
  'Telegram foydalanuvchilari': [6] // Sana, Chat ID, Ism, Familiya, Username, Telefon, Buyurtma ID
};

// "Buyurtmalar" varag'idagi ustunlar tartibi — telegram-order.js dan
// keladigan maydonlar bilan mos kelishi shart
var ORDER_HEADERS = ['Sana', 'ID', 'Ism', 'Telefon', 'Model', 'Seriya',
  "O'lcham", 'Rang', 'Miqdor', 'Umumiy narx', 'Zalog', 'Manzil', 'Xarita havolasi', 'Sahifa'];

var HEADER_BG = '#c9a44c';
var HEADER_FONT = '#17130f';
var BORDER_COLOR = '#e3d7bd';
var ROW_BG_EVEN = '#faf6ec';
var ROW_BG_ODD = '#ffffff';

function doPost(e) {
  try {
    var data = JSON.parse(e.postData.contents);
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
    } else if (data.type === 'set_pending') {
      // Bot mijozdan telefon so'raganda, qaysi buyruq (oxirgi buyurtmami yoki
      // hammasimi) kutilayotganini vaqtincha eslab qolish uchun (5 daqiqa).
      CacheService.getScriptCache().put('pending_' + data.chat_id, String(data.intent || ''), 300);
      return ContentService.createTextOutput(JSON.stringify({ ok: true }))
        .setMimeType(ContentService.MimeType.JSON);
    } else if (data.type === 'order') {
      // Mijoz saytda buyurtma bergan — keyinroq Telegram bot shu yozuvni
      // ID bo'yicha topib, mijozga shaxsiy tasdiqlash xabarini yuboradi
      writeRow(ss, 'Buyurtmalar', ORDER_HEADERS,
        [now, data.id || '', data.name || '', data.phone || '', data.model || '',
         data.series || '', data.size || '', data.color || '', data.quantity || '',
         data.total || '', data.deposit || '', data.address || '', data.map_link || '',
         data.page || '']);
    }

    return ContentService.createTextOutput(JSON.stringify({ ok: true }))
      .setMimeType(ContentService.MimeType.JSON);
  } catch (err) {
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

    // Telefon (va Kod) ustunlarini boshidanoq "Matn" (Plain text) formatiga
    // o'rnatib qo'yamiz — shunda Sheets hech qachon ularni raqamga
    // aylantirmaydi va "+" yoki boshidagi "0" belgilari saqlanib qoladi.
    textCols.forEach(function (col) {
      sheet.getRange(1, col, sheet.getMaxRows(), 1).setNumberFormat('@');
    });

    var widths = { 'Sana': 130, 'Ism': 170, 'Familiya': 150, 'Telefon': 150,
      'Kod': 130, 'Sahifa': 160, 'Chat ID': 130, 'Username': 150 };
    for (var i = 0; i < headers.length; i++) {
      sheet.setColumnWidth(i + 1, widths[headers[i]] || 150);
    }
  }

  // Telefon/Kod qiymatlarini majburan matn (string) sifatida yozamiz
  textCols.forEach(function (col) {
    if (row[col - 1] !== undefined && row[col - 1] !== '') {
      row[col - 1] = "'" + String(row[col - 1]).replace(/^'/, '');
    }
  });

  sheet.appendRow(row);
  var lastRow = sheet.getLastRow();

  // Sana ustunini chiroyli formatlash (har doim 1-ustun)
  sheet.getRange(lastRow, 1).setNumberFormat('dd.MM.yyyy HH:mm');
  textCols.forEach(function (col) {
    sheet.getRange(lastRow, col).setNumberFormat('@');
  });

  // Yangi qatorga navbatlashgan fon rangi (juft/toq) — jadvalni o'qish osonlashadi
  sheet.getRange(lastRow, 1, 1, headers.length)
    .setBackground(lastRow % 2 === 0 ? ROW_BG_EVEN : ROW_BG_ODD)
    .setVerticalAlignment('middle');

  // Butun jadval atrofi va ichki chiziqlarni yangilab qo'yamiz
  sheet.getRange(1, 1, lastRow, headers.length)
    .setBorder(true, true, true, true, true, true, BORDER_COLOR, SpreadsheetApp.BorderStyle.SOLID);
}

/**
 * GET so'rov: odatda brauzerda ochib tekshirish uchun ishlatiladi.
 * Lekin Telegram bot funksiyasi (netlify/functions/telegram-bot.js)
 * ham shu manzilga bir necha ?action=... turlari bilan murojaat qiladi:
 *   - getOrder&id=<ID>              → bitta buyurtmani ID bo'yicha topadi
 *   - getOrdersByPhone&phone=<raqam> → telefon bo'yicha barcha buyurtmalar
 *   - getPhoneByChatId&chat_id=<ID>  → shu Telegram chat avval ulashgan
 *     telefon raqamini topadi (qayta so'ramaslik uchun)
 *   - getPending&chat_id=<ID>        → shu chat uchun "kutilayotgan"
 *     buyruqni (oxirgi/hammasi) qaytaradi va (clear=1 bo'lsa) tozalaydi
 */
function doGet(e) {
  var params = (e && e.parameter) || {};
  if (params.action === 'getOrder' && params.id) {
    return findOrderById(params.id);
  }
  if (params.action === 'getOrdersByPhone' && params.phone) {
    return findOrdersByPhone(params.phone);
  }
  if (params.action === 'getPhoneByChatId' && params.chat_id) {
    return findPhoneByChatId(params.chat_id);
  }
  if (params.action === 'getPending' && params.chat_id) {
    var cache = CacheService.getScriptCache();
    var key = 'pending_' + params.chat_id;
    var intent = cache.get(key) || '';
    if (params.clear === '1' && intent) cache.remove(key);
    return ContentService.createTextOutput(JSON.stringify({ ok: true, intent: intent }))
      .setMimeType(ContentService.MimeType.JSON);
  }
  return ContentService.createTextOutput('YasinDoors Sheets qabul qiluvchisi ishlayapti.');
}

// Faqat raqamlarni qoldiradi, taqqoslash uchun (masalan "+998 90 123-45-67" -> "998901234567")
function onlyDigits(s) {
  return String(s || '').replace(/\D/g, '');
}

function findOrdersByPhone(phone) {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName('Buyurtmalar');
  var orders = [];
  var target = onlyDigits(phone).slice(-9); // oxirgi 9 ta raqam bo'yicha solishtiramiz (998 kodisiz)

  if (sheet && target) {
    var values = sheet.getDataRange().getValues();
    var headers = values[0];
    var phoneCol = headers.indexOf('Telefon');
    var dateCol = headers.indexOf('Sana');
    if (phoneCol !== -1) {
      for (var i = 1; i < values.length; i++) {
        if (onlyDigits(values[i][phoneCol]).slice(-9) === target) {
          var order = {};
          headers.forEach(function (h, idx) { order[h] = values[i][idx]; });
          orders.push(order);
        }
      }
    }
    // Eng yangi buyurtma birinchi bo'lib chiqsin
    if (dateCol !== -1) {
      orders.sort(function (a, b) { return new Date(b['Sana']) - new Date(a['Sana']); });
    }
  }

  return ContentService.createTextOutput(JSON.stringify({ ok: true, orders: orders }))
    .setMimeType(ContentService.MimeType.JSON);
}

function findOrderById(id) {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName('Buyurtmalar');
  var result = { ok: false };

  if (sheet) {
    var values = sheet.getDataRange().getValues();
    var headers = values[0];
    var idCol = headers.indexOf('ID');
    if (idCol !== -1) {
      for (var i = 1; i < values.length; i++) {
        if (String(values[i][idCol]) === String(id)) {
          var order = {};
          headers.forEach(function (h, idx) { order[h] = values[i][idx]; });
          result = { ok: true, order: order };
          break;
        }
      }
    }
  }

  return ContentService.createTextOutput(JSON.stringify(result))
    .setMimeType(ContentService.MimeType.JSON);
}

// Shu Telegram chat avval "Telegram foydalanuvchilari" varag'iga telefon
// raqamini ulashgan bo'lsa (masalan kontakt tugmasi orqali), eng so'nggi
// (oxirgi) qatordagi qiymatini topib qaytaradi — shunda bot har safar
// qayta telefon so'ramaydi.
function findPhoneByChatId(chatId) {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName('Telegram foydalanuvchilari');
  var phone = '';

  if (sheet) {
    var values = sheet.getDataRange().getValues();
    var headers = values[0];
    var chatCol = headers.indexOf('Chat ID');
    var phoneCol = headers.indexOf('Telefon');
    if (chatCol !== -1 && phoneCol !== -1) {
      for (var i = values.length - 1; i >= 1; i--) {
        if (String(values[i][chatCol]) === String(chatId) && values[i][phoneCol]) {
          phone = String(values[i][phoneCol]);
          break;
        }
      }
    }
  }

  return ContentService.createTextOutput(JSON.stringify({ ok: true, phone: phone }))
    .setMimeType(ContentService.MimeType.JSON);
}
