// Bu fayl server tomonida (Netlify'ning "Functions" xizmatida) ishlaydi.
// Vazifasi: saytdagi buyurtma formasidan kelgan to'liq ma'lumotni qabul qilib,
// Telegram bot orqali sizga xabar sifatida yuborish.
//
// XAVFSIZLIK: Bot tokeni bu faylda YOZILMAYDI — u Netlify saytining
// "Environment variables" (atrof-muhit o'zgaruvchilari) bo'limida saqlanadi,
// shuning uchun tokeningiz hech qachon brauzerga yoki GitHub'ga chiqmaydi.

exports.handler = async function (event) {
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
      body: JSON.stringify({ error: 'Bot sozlanmagan (TELEGRAM_BOT_TOKEN yoki TELEGRAM_CHAT_ID Netlify\'da o\'rnatilmagan)' })
    };
  }

  function esc(v) {
    return String(v === undefined || v === null || v === '' ? '—' : v)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;');
  }

  function formatSom(num) {
    var n = Number(num);
    if (!n && n !== 0) return esc(num);
    return n.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ' ') + " so'm";
  }

  const name = esc(data.customer_name || data.name);
  const phone = esc(data.phone);
  const model = esc(data.model_name || data.model);
  const series = esc(data.series);
  const size = esc(data.size);
  const color = data.color_name ? esc(data.color_name) + (data.color_hex ? ' (' + esc(data.color_hex) + ')' : '') : '—';
  const quantity = esc(data.quantity || 1);
  const totalPrice = data.total_price !== undefined ? formatSom(data.total_price) : esc(data.totalPrice);
  const deposit = data.deposit !== undefined ? formatSom(data.deposit) : null;
  const region = esc(data.region);
  const mahalla = esc(data.mahalla);
  const street = esc(data.street);
  const house = esc(data.house);
  const lat = data.lat;
  const lng = data.lng;

  const addressLine = [region, mahalla, street, house]
    .filter(function (v) { return v && v !== '—'; })
    .join(', ') || '—';

  var text =
    '🆕 <b>Yangi buyurtma — YasinDoors</b>\n\n' +
    '👤 <b>Ism:</b> ' + name + '\n' +
    '📞 <b>Telefon:</b> ' + phone + '\n' +
    '🚪 <b>Model:</b> ' + model + (series !== '—' ? ' (' + series + ')' : '') + '\n' +
    '📏 <b>O\'lcham:</b> ' + size + '\n' +
    '🎨 <b>Rang:</b> ' + color + '\n' +
    '🔢 <b>Miqdor:</b> ' + quantity + ' dona\n' +
    '💰 <b>Jami narx:</b> ' + totalPrice + '\n';

  if (deposit) {
    text += '💵 <b>Zalog (20%):</b> ' + deposit + '\n';
  }

  text += '📍 <b>Manzil:</b> ' + addressLine;

  if (typeof lat === 'number' && typeof lng === 'number') {
    text += '\n🗺 <b>Xarita:</b> https://maps.google.com/?q=' + lat + ',' + lng;
  }

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
