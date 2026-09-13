/**
 * YASINDOORS — Telegram → Google Apps Script "ko'prigi" (Cloudflare Worker)
 * -----------------------------------------------------------------
 * DIQQAT: bu versiya qayta yo'naltirishni (redirect) QO'LDA bajaradi
 * (redirect: 'manual'), chunki avtomatik yo'naltirish ba'zan POST
 * so'rovni GET'ga aylantirib qo'yadi va Apps Script xabarni ko'rmay
 * qoladi. Shu tufayli bot hech qanday javob qaytarmagan edi.
 */

var APPS_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbwPN7lys_LXkdctnjVBbKdwF7L-2dqrD5TA6PRVgNybkGeHY2vd9gkXyyqkcNZl9kv4/exec';

async function postToAppsScript(body) {
  var res = await fetch(APPS_SCRIPT_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: body,
    redirect: 'manual'
  });

  // Apps Script deyarli har doim 30x bilan haqiqiy bajarish manziliga
  // yo'naltiradi — shuni QO'LDA, POST sifatida (va tanasi bilan) qayta
  // so'raymiz, aks holda ba'zi tarmoqlar buni GET'ga aylantirib qo'yadi.
  if (res.status >= 300 && res.status < 400) {
    var location = res.headers.get('Location');
    if (location) {
      res = await fetch(location, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: body
      });
    }
  }

  return res;
}

export default {
  async fetch(request, env, ctx) {
    if (request.method === 'POST') {
      var body = await request.text();
      ctx.waitUntil(postToAppsScript(body));
    }

    return new Response('ok');
  }
};