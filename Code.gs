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
  'Kirish urinishlari': 2      // Sana, Telefon, Sahifa
};

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
 * Brauzerda ochib tekshirish uchun (GET so'rov) — funksiya ishlayotganini bildiradi.
 */
function doGet(e) {
  return ContentService.createTextOutput('YasinDoors Sheets qabul qiluvchisi ishlayapti.');
}
