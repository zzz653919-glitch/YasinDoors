// ============================================================================
// YASINDOORS — telegram-order.js
// Buyurtmani endi to'g'ridan-to'g'ri Google Sheets'ga (Code.gs Web App orqali)
// yozadi. Server/VPS shart emas. ID mijoz brauzerida generatsiya qilinadi,
// chunki "no-cors" so'rovda Google'ning javobini o'qib bo'lmaydi.
// buyurtma.html / buyurtma2.html shu faylni chaqiradi: window.sendTelegramOrder(orderData)
// ============================================================================

function generateOrderId() {
  return 'YD' + Date.now().toString(36).toUpperCase();
}

function buildAddress(o) {
  var parts = [];
  if (o.house) parts.push(o.house + '-uy');
  if (o.street) parts.push(o.street);
  if (o.mahalla) parts.push(o.mahalla);
  if (o.region) parts.push(o.region);
  return parts.join(', ');
}

function buildMapLink(o) {
  if (o.lat && o.lng) {
    return 'https://www.google.com/maps?q=' + o.lat + ',' + o.lng;
  }
  return '';
}

window.sendTelegramOrder = function (orderData) {
  var url = window.SHEETS_WEBHOOK_URL;
  if (!url || String(url).indexOf('BU_YERGA') !== -1) {
    console.error('bot-config.js da SHEETS_WEBHOOK_URL sozlanmagan.');
    return Promise.resolve();
  }

  var orderId = generateOrderId();

  // Code.gs'ning doPost() funksiyasi kutayotgan aniq maydonlar:
  // type, id, name, phone, model, series, size, color, quantity, total, deposit, address, map_link, page
  var payload = {
    type: 'order',
    id: orderId,
    name: orderData.customer_name || '',
    phone: orderData.phone || '',
    model: orderData.model_name || '',
    series: orderData.series || '',
    size: orderData.size || '',
    color: (orderData.color_name || '') + (orderData.color_hex ? ' (' + orderData.color_hex + ')' : ''),
    quantity: orderData.quantity || '',
    total: orderData.total_price || '',
    deposit: orderData.deposit || '',
    address: buildAddress(orderData),
    map_link: buildMapLink(orderData),
    page: window.location.pathname
  };

  return fetch(url, {
    method: 'POST',
    mode: 'no-cors', // Google Apps Script javobini o'qimaymiz, faqat yuboramiz
    headers: { 'Content-Type': 'text/plain' },
    body: JSON.stringify(payload)
  })
    .then(function () {
      // Mijoz "Buyurtmani Telegramda kuzatish" tugmasi shu havoladan foydalanadi
      if (window.TELEGRAM_BOT_USERNAME && String(window.TELEGRAM_BOT_USERNAME).indexOf('BU_YERGA') === -1) {
        window.lastOrderTelegramLink = 'https://t.me/' + window.TELEGRAM_BOT_USERNAME + '?start=o_' + orderId;
      }
      return { ok: true, id: orderId };
    })
    .catch(function (err) {
      console.error('Buyurtmani Sheets\'ga yuborishda xatolik:', err);
      throw err;
    });
};
