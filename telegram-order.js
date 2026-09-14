// ============================================================================
// YASINDOORS — telegram-order.js
// Buyurtmani endi Google Apps Script/Sheets O'RNIGA to'g'ridan-to'g'ri
// o'zingizning app.py serveringizga yuboradi (bot-config.js dagi API_BASE_URL).
// buyurtma.html / buyurtma2.html shu faylni chaqiradi: window.sendTelegramOrder(orderData)
// ============================================================================

window.sendTelegramOrder = function (orderData) {
  var base = window.API_BASE_URL;
  if (!base || String(base).indexOf('BU_YERGA') !== -1) {
    console.error('bot-config.js da API_BASE_URL sozlanmagan.');
    return Promise.resolve();
  }

  return fetch(base.replace(/\/$/, '') + '/api/order', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(Object.assign({ page: window.location.pathname }, orderData))
  })
    .then(function (res) { return res.json(); })
    .then(function (result) {
      // Muvaffaqiyat sahifasidagi "Buyurtmani Telegramda kuzatish" tugmasi
      // shu havoladan foydalanadi (buyurtma.html ichida window.lastOrderTelegramLink)
      if (result && result.telegram_link) {
        window.lastOrderTelegramLink = result.telegram_link;
      }
      return result;
    })
    .catch(function (err) {
      console.error('Buyurtmani serverga yuborishda xatolik:', err);
      // Xatolik bo'lsa ham mijozni kutdirib qo'ymaymiz — chaqiruvchi kod
      // (buyurtma.html) baribir muvaffaqiyat sahifasini ko'rsatadi.
      throw err;
    });
};
