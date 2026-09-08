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
 * avtomatik qo'yiladi. DIQQAT: parol hech qanday holatda qabul qilinmaydi
 * va saqlanmaydi — sayt tomonidan ham yuborilmaydi.
 */

function doPost(e) {
  try {
    var data = JSON.parse(e.postData.contents);
    var ss = SpreadsheetApp.getActiveSpreadsheet();
    var now = new Date();

    if (data.type === 'register') {
      writeRow(ss, "Ro'yxatdan o'tganlar", ["Sana", "Ism", "Telefon", "Sahifa"],
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
 * qo'yadi va formatlaydi), so'ng yangi qatorni oxiriga qo'shadi.
 */
function writeRow(ss, sheetName, headers, row) {
  var sheet = ss.getSheetByName(sheetName);
  if (!sheet) {
    sheet = ss.insertSheet(sheetName);
    sheet.appendRow(headers);
    sheet.getRange(1, 1, 1, headers.length)
      .setFontWeight('bold')
      .setBackground('#c9a44c')
      .setFontColor('#17130f');
    sheet.setFrozenRows(1);
    for (var i = 1; i <= headers.length; i++) {
      sheet.autoResizeColumn(i);
    }
  }
  sheet.appendRow(row);
  // Sana ustunini chiroyli formatlash (har doim 1-ustun)
  var lastRow = sheet.getLastRow();
  sheet.getRange(lastRow, 1).setNumberFormat('dd.MM.yyyy HH:mm');
}

/**
 * Brauzerda ochib tekshirish uchun (GET so'rov) — funksiya ishlayotganini bildiradi.
 */
function doGet(e) {
  return ContentService.createTextOutput('YasinDoors Sheets qabul qiluvchisi ishlayapti.');
}
