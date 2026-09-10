/**
 * YASINDOORS — Google Sheets qabul qiluvchi (Apps Script)
 * -----------------------------------------------------------------
 * Bu kod Google Sheets faylining "Extensions → Apps Script" bo'limiga
 * joylashtiriladi va "Web App" sifatida deploy qilinadi.
 *
 * Uchta manbadan ma'lumot qabul qiladi:
 *   - type: "register"       → saytda "Ro'yxatdan o'tish" formasi
 *   - type: "login"          → saytda "Tizimga kirish" formasi
 *   - type: "telegram_user"  → Telegram botga yozgan mijoz
 *
 * Har biri uchun alohida varaq (sheet tab) yaratiladi va sarlavhalar
 * avtomatik qo'yiladi, jadval chiroyli formatlanadi (ranglar, chegaralar,
 * navbatlashgan qator fonlari). Telefon ustuni har doim MATN sifatida
 * saqlanadi — shu tufayli "+998901234567" Google Sheets tomonidan
 * raqamga aylantirilib, "+" belgisi yo'qolib qolmaydi.
 *
 * DIQQAT: parol hech qanday holatda qabul qilinmaydi va saqlanmaydi —
 * sayt tomonidan ham yuborilmaydi.
 */

// Har bir varaqdagi qaysi ustun telefon raqamini saqlashini bildiradi (1-ustun = A)
var PHONE_COLUMN_BY_SHEET = {
  "Ro'yxatdan o'tganlar": 3,   // Sana, Ism, Telefon, Sahifa
  'Kirish urinishlari': 2,     // Sana, Telefon, Sahifa
  'Buyurtmalar': 4             // Sana, ID, Ism, Telefon, ...
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
      writeRow(ss, "Ro'yxatdan o'tganlar", ['Sana', 'Ism', 'Telefon', 'Sahifa'],
        [now, data.name || '', data.phone || '', data.page || '']);
    } else if (data.type === 'login') {
      writeRow(ss, 'Kirish urinishlari', ['Sana', 'Telefon', 'Sahifa'],
        [now, data.phone || '', data.page || '']);
    } else if (data.type === 'telegram_user') {
      writeRow(ss, 'Telegram foydalanuvchilari', ['Sana', 'Chat ID', 'Ism', 'Familiya', 'Username'],
        [now, data.chat_id || '', data.first_name || '', data.last_name || '', data.username || '']);
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
  var phoneCol = PHONE_COLUMN_BY_SHEET[sheetName] || 0;
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

    // Telefon ustunini boshidanoq "Matn" (Plain text) formatiga o'rnatib qo'yamiz —
    // shunda Sheets hech qachon uni raqamga aylantirmaydi va "+" saqlanib qoladi.
    if (phoneCol) {
      sheet.getRange(1, phoneCol, sheet.getMaxRows(), 1).setNumberFormat('@');
    }

    var widths = { 'Sana': 130, 'Ism': 170, 'Familiya': 150, 'Telefon': 150,
      'Sahifa': 160, 'Chat ID': 130, 'Username': 150 };
    for (var i = 0; i < headers.length; i++) {
      sheet.setColumnWidth(i + 1, widths[headers[i]] || 150);
    }
  }

  // Telefon qiymatini majburan matn (string) sifatida yozamiz
  if (phoneCol && row[phoneCol - 1] !== undefined && row[phoneCol - 1] !== '') {
    row[phoneCol - 1] = "'" + String(row[phoneCol - 1]).replace(/^'/, '');
  }

  sheet.appendRow(row);
  var lastRow = sheet.getLastRow();

  // Sana ustunini chiroyli formatlash (har doim 1-ustun)
  sheet.getRange(lastRow, 1).setNumberFormat('dd.MM.yyyy HH:mm');
  if (phoneCol) {
    sheet.getRange(lastRow, phoneCol).setNumberFormat('@');
  }

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
 * ham shu manzilga ?action=getOrder&id=<ID> ko'rinishida murojaat qilib,
 * mijoz "Start" bosgan buyurtma haqidagi ma'lumotni JSON ko'rinishida oladi.
 */
function doGet(e) {
  var params = (e && e.parameter) || {};
  if (params.action === 'getOrder' && params.id) {
    return findOrderById(params.id);
  }
  if (params.action === 'getOrdersByPhone' && params.phone) {
    return findOrdersByPhone(params.phone);
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
