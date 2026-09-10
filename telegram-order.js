/**
 * telegram-order.js
 * -----------------------------------------------------------------
 * Mijoz "Buyurtmani jo'natish" tugmasini bosganda ishga tushadi
 * (buyurtma.html / buyurtma2.html chaqiradi: window.sendTelegramOrder(orderData)).
 *
 * Uchta narsani qiladi:
 *   1) Buyurtma tafsilotlarini chiroyli formatlab, DO'KON EGASINING
 *      Telegram chatiga yuboradi (telegram-config.js dagi
 *      TELEGRAM_BOT_TOKEN / TELEGRAM_CHAT_ID orqali) — bu avvalgidek.
 *   2) Buyurtmani Google Sheets'ga ("Buyurtmalar" varag'i) saqlaydi va
 *      unga o'zi generatsiya qilgan qisqa ID beradi.
 *   3) MIJOZNING O'ZIGA ham Telegram orqali xabar yuborilishi uchun
 *      shaxsiy havola tayyorlaydi: https://t.me/<BOT_USERNAME>?start=o_<ID>
 *      Mijoz shu havolani bosib botga "Start" bersa (buni Telegram
 *      talab qiladi — botlar hech kimga o'zi birinchi bo'lib yoza
 *      olmaydi), bot uning chat ID'sini o'sha zahoti oladi va unga
 *      aynan shu buyurtma haqida shaxsiy tasdiqlash xabarini yuboradi
 *      (buni netlify/functions/telegram-bot.js bajaradi).
 *
 *      Agar telegram-config.js'da TELEGRAM_BOT_USERNAME to'ldirilmagan
 *      bo'lsa, bu qadam shunchaki o'tkazib yuboriladi — sayt avvalgidek
 *      ishlayveradi, faqat mijozga shaxsiy Telegram xabari ketmaydi.
 */
(function () {

  function formatSom(num) {
    var n = Math.round(Number(num) || 0);
    return n.toLocaleString('ru-RU').replace(/,/g, ' ') + " so'm";
  }

  // Google Sheets'dagi "Buyurtmalar" varag'ida qidirish uchun qisqa,
  // taxmin qilib bo'lmaydigan ID (vaqt belgisi + tasodifiy belgilar)
  function generateOrderId() {
    return Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
  }

  function fullAddress(o) {
    return [o.region, o.mahalla, o.street, o.house].filter(Boolean).join(', ');
  }

  function mapLink(o) {
    return (o.lat && o.lng) ? ('https://maps.google.com/?q=' + o.lat + ',' + o.lng) : '';
  }

  function buildOwnerMessage(o) {
    var lines = [
      "🛒 <b>Yangi buyurtma — YasinDoors</b>",
      "",
      "👤 Mijoz: " + o.customer_name,
      "📞 Tel: " + o.phone,
      "🚪 Model: " + o.model_name + (o.series ? " (" + o.series + ")" : ""),
      "📏 O'lcham: " + o.size,
      "🎨 Rang: " + o.color_name + (o.color_hex ? " (" + o.color_hex + ")" : ""),
      "🔢 Miqdor: " + o.quantity + " dona",
      "💰 Umumiy: " + formatSom(o.total_price),
      "💵 Zalog (20%): " + formatSom(o.deposit),
      "📍 Manzil: " + fullAddress(o)
    ];
    var link = mapLink(o);
    if (link) lines.push('🗺 <a href="' + link + '">Xaritada ko\'rish</a>');
    return lines.join('\n');
  }

  // ---------- 1) Do'kon egasining Telegram chatiga yuborish ----------
  function sendToOwnerChat(o) {
    var token = window.TELEGRAM_BOT_TOKEN;
    var chatId = window.TELEGRAM_CHAT_ID;
    if (!token || token.indexOf('BOT_TOKEN_BU_YERGA') !== -1 ||
        !chatId || String(chatId).indexOf('CHAT_ID_BU_YERGA') !== -1) {
      console.error('Telegram sozlanmagan: telegram-config.js faylida TELEGRAM_BOT_TOKEN / TELEGRAM_CHAT_ID to\'ldiring.');
      return Promise.resolve();
    }
    return fetch('https://api.telegram.org/bot' + token + '/sendMessage', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: chatId,
        text: buildOwnerMessage(o),
        parse_mode: 'HTML',
        disable_web_page_preview: false
      })
    });
  }

  // ---------- 2) Buyurtmani Google Sheets'ga saqlash (keyinroq bot shundan o'qiydi) ----------
  function saveOrderToSheets(o) {
    var url = window.SHEETS_WEBHOOK_URL;
    if (!url || url.indexOf('BU_YERGA') !== -1) {
      console.error('Google Sheets sozlanmagan: sheets-config.js faylida SHEETS_WEBHOOK_URL kiriting — mijozga shaxsiy Telegram xabari ishlamaydi.');
      return;
    }
    fetch(url, {
      method: 'POST',
      mode: 'no-cors', // Apps Script javobini o'qimaymiz, faqat yuboramiz
      headers: { 'Content-Type': 'text/plain' },
      body: JSON.stringify({
        type: 'order',
        id: o.order_id,
        name: o.customer_name,
        phone: o.phone,
        model: o.model_name,
        series: o.series,
        size: o.size,
        color: o.color_name,
        quantity: o.quantity,
        total: o.total_price,
        deposit: o.deposit,
        address: fullAddress(o),
        map_link: mapLink(o),
        page: window.location.pathname
      })
    }).catch(function (err) { console.error('Sheets (buyurtma) xatoligi:', err); });
  }

  // ---------- 3) Mijoz uchun shaxsiy Telegram bot havolasi ----------
  function buildCustomerTelegramLink(orderId) {
    var botUsername = window.TELEGRAM_BOT_USERNAME;
    if (!botUsername || botUsername.indexOf('BU_YERGA') !== -1) return null;
    return 'https://t.me/' + botUsername.replace(/^@/, '') + '?start=o_' + orderId;
  }

  window.sendTelegramOrder = function (order) {
    order.order_id = generateOrderId();

    // buyurtma.html/buyurtma2.html shu global qiymatni o'qib, muvaffaqiyat
    // sahifasida "Telegram bot orqali kuzating" tugmasini ko'rsatadi
    window.lastOrderTelegramLink = buildCustomerTelegramLink(order.order_id);

    saveOrderToSheets(order);
    return sendToOwnerChat(order);
  };

})();
