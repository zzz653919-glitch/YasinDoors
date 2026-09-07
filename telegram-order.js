/**
 * Buyurtma ma'lumotlarini Telegram botga xabar sifatida yuboradi.
 * Ishlashi uchun telegram-config.js faylida BOT_TOKEN va CHAT_ID
 * to'g'ri kiritilgan bo'lishi kerak.
 */
(function () {
  function esc(s) {
    // Telegram HTML parse_mode uchun maxsus belgilarni ekranlash
    return String(s == null ? '' : s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  }

  function formatSomSafe(num) {
    num = Math.round(num || 0);
    return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ' ') + " so'm";
  }

  window.sendTelegramOrder = function (o) {
    var token = window.TELEGRAM_BOT_TOKEN;
    var chatId = window.TELEGRAM_CHAT_ID;

    if (!token || !chatId || token.indexOf('BU_YERGA') !== -1 || chatId.indexOf('BU_YERGA') !== -1) {
      console.error('Telegram sozlanmagan: telegram-config.js faylida BOT_TOKEN va CHAT_ID kiriting.');
      return Promise.reject(new Error('Telegram sozlanmagan'));
    }

    var addressLine = [o.region, o.mahalla, o.street, o.house].filter(Boolean).join(', ');
    var mapLine = (o.lat && o.lng) ? ('\n🗺 <a href="https://maps.google.com/?q=' + o.lat + ',' + o.lng + '">Xaritada ko\'rish</a>') : '';

    var text =
      "🛒 <b>Yangi buyurtma — YasinDoors</b>\n\n" +
      "👤 Mijoz: <b>" + esc(o.customer_name) + "</b>\n" +
      "📞 Tel: <a href=\"tel:" + esc(o.phone) + "\">" + esc(o.phone) + "</a>\n" +
      "🚪 Model: <b>" + esc(o.model_name) + "</b> (" + esc(o.series || '') + ")\n" +
      "📏 O'lcham: " + esc(o.size || '—') + "\n" +
      "🎨 Rang: " + esc(o.color_name || '—') + (o.color_hex ? ' (' + esc(o.color_hex) + ')' : '') + "\n" +
      "🔢 Miqdor: " + o.quantity + " dona\n" +
      "💰 Umumiy: <b>" + formatSomSafe(o.total_price) + "</b>\n" +
      "💵 Zalog (20%): " + formatSomSafe(o.deposit) + "\n" +
      "📍 Manzil: " + esc(addressLine) + mapLine;

    return fetch('https://api.telegram.org/bot' + token + '/sendMessage', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: chatId,
        text: text,
        parse_mode: 'HTML',
        disable_web_page_preview: true
      })
    }).then(function (res) {
      return res.json().then(function (data) {
        if (!res.ok || !data.ok) throw new Error((data && data.description) || 'Telegram xatoligi');
        return data;
      });
    });
  };
})();
