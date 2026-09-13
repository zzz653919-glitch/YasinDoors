// Bu fayl brauzerda (mijozning kompyuterida/telefonida) ishlaydi.
// Vazifasi: buyurtma formasidan yig'ilgan ma'lumotni (orderData) qabul qilib,
// serverdagi Netlify Function'ga (netlify/functions/send-order.js) yuborish —
// u esa Telegram botiga xabar shaklida yetkazadi.
//
// MUHIM: Bot tokeni bu faylda YO'Q — u faqat serverda (Netlify Environment
// Variables ichida) saqlanadi, shuning uchun token hech qachon brauzerda
// ko'rinmaydi va xavfsiz qoladi.

window.sendTelegramOrder = function (orderData) {
  return fetch('/.netlify/functions/send-order', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(orderData)
  })
    .then(function (res) {
      return res.json().catch(function () { return {}; }).then(function (result) {
        if (!res.ok || !result || !result.success) {
          throw new Error((result && result.error) || ('HTTP ' + res.status));
        }
        return result;
      });
    })
    .then(function (result) {
      // Mijoz uchun "Telegramda kuzatish" tugmasi shu havolaga olib boradi
      window.lastOrderTelegramLink = 'https://t.me/+998933002020';
      return result;
    });
};
