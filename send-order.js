// Bu fayl server tomonida (Netlify'ning "Functions" xizmatida) ishlaydi.
// Vazifasi: saytdagi buyurtma formasidan kelgan ma'lumotni qabul qilib,
// Telegram bot orqali sizga xabar sifatida yuborish.
//
// XAVFSIZLIK: Bot tokeni bu faylda YOZILMAYDI — u Netlify saytining
// "Environment variables" (atrof-muhit o'zgaruvchilari) bo'limida saqlanadi,
// shuning uchun tokeningiz hech qachon brauzerga yoki GitHub'ga chiqmaydi.

exports.handler = async function (event) {
  // Faqat POST so'rovlarga ruxsat
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: JSON.stringify({ error: 'Faqat POST so\'rov qabul qilinadi' }) };
  }

  let data;
  try {
    data = JSON.parse(event.body || '{}');
  } catch (e) {
    return { statusCode: 400, body: JSON.stringify({ error: 'Ma\'lumot formati noto\'g\'ri' }) };
  }

  const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
  const CHAT_ID = process.env.TELEGRAM_CHAT_ID;

  if (!BOT_TOKEN || !CHAT_ID) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Bot sozlanmagan (TELEGRAM_BOT_TOKEN yoki TELEGRAM_CHAT_ID topilmadi)' })
    };
  }

  // Oddiy tozalash — HTML belgilarini xavfsiz qilish
  function esc(v) {
    return String(v || '—')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;');
  }

  const name = esc(data.name);
  const phone = esc(data.phone);
  const model = esc(data.model);
  const quantity = esc(data.quantity || 1);
  const totalPrice = esc(data.totalPrice);
  const region = esc(data.region);
  const mahalla = esc(data.mahalla);
  const street = esc(data.street);
  const house = esc(data.house);

  const addressLine = [region, mahalla, street, house]
    .filter(function (v) { return v && v !== '—'; })
    .join(', ') || '—';

  const text =
    '🆕 <b>Yangi buyurtma — YasinDoors</b>\n\n' +
    '👤 <b>Ism:</b> ' + name + '\n' +
    '📞 <b>Telefon:</b> ' + phone + '\n' +
    '🚪 <b>Model:</b> ' + model + ' (' + quantity + ' dona)\n' +
    '💰 <b>Jami narx:</b> ' + totalPrice + '\n' +
    '📍 <b>Manzil:</b> ' + addressLine;

  const url = 'https://api.telegram.org/bot' + BOT_TOKEN + '/sendMessage';

  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: CHAT_ID,
        text: text,
        parse_mode: 'HTML'
      })
    });

    const result = await res.json();

    if (!result.ok) {
      return { statusCode: 502, body: JSON.stringify({ error: result.description || 'Telegram xatosi' }) };
    }

    return { statusCode: 200, body: JSON.stringify({ success: true }) };
  } catch (err) {
    return { statusCode: 500, body: JSON.stringify({ error: err.message }) };
  }
};
