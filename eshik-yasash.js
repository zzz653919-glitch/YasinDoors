(function(){

/* =========================================================
   MA'LUMOTLAR
   ========================================================= */
var COLORS = [
  { id:'yongoq', name:"Yong'oq", hex:'#7A4A20', price:0 },
  { id:'eman',   name:'Eman',    hex:'#A4652C', price:60000 },
  { id:'oq',     name:'Oq',      hex:'#E9E4D8', price:40000 },
  { id:'kulrang',name:'Kulrang', hex:'#5C5C5C', price:50000 },
  { id:'qora',   name:'Qora',    hex:'#232323', price:80000 },
  { id:'brass',  name:'Tilla-jez',hex:'#B48A3F', price:130000 }
];

var KARONA = [
  { id:'klassik', name:'Klassik karona', desc:"Nafis, bo'rtma qirrali obnalichka", price:320000 },
  { id:'modern',  name:'Modern', desc:"To'g'ri chiziqli, minimal profil", price:260000 },
  { id:'minimal', name:'Minimalizm', desc:"Yashirin karona, silliq o'tish", price:380000 },
  { id:'yoq',     name:'Karonasiz', desc:"Faqat eshik tabaqasi", price:0 }
];

var OYNA = [
  { id:'oynali',  name:'Oynali', desc:"Shaffof shisha bilan", price:180000 },
  { id:'tutun',   name:"Tutunli oyna", desc:"Xiralashtirilgan, maxfiylik uchun", price:210000 },
  { id:'naqsh',   name:'Naqshli', desc:"O'ymakor rasmli panel", price:260000 },
  { id:'tekis',   name:'Tekis (oynasiz)', desc:"Butunlay yopiq tabaqa", price:0 }
];

var RUCHKA = [
  { id:'klassik', name:'Klassik dastak', price:70000 },
  { id:'modern',  name:'Modern tutqich', price:95000 },
  { id:'minimal', name:'Minimal tugma', price:55000 }
];
var QULF = [
  { id:'oddiy', name:"Oddiy silindrli qulf", price:90000 },
  { id:'ikki',  name:"Ikki tilli xavfsiz qulf", price:180000 },
  { id:'elektron', name:'Elektron / kodli qulf', price:420000 }
];
var PETLYA = [
  { id:'2', name:'2 ta petlya', price:0 },
  { id:'3', name:'3 ta petlya', price:35000 },
  { id:'4', name:'4 ta petlya (og\'ir eshik)', price:60000 }
];

// Boshlang'ich narx = avvalgi 900 000 + MDF materiali 1 600 000 (material tanlovi olib tashlangani uchun jami narx o'zgarmasligi uchun birlashtirildi)
var BASE_PRICE = 2500000;

var STEPS = ['rang','karona','oyna','furnitura','xulosa'];
var STEP_TITLES = {
  rang:'Rang va tekstura',
  karona:'Karona va obnalichka',
  oyna:'Oyna va naqsh',
  furnitura:'Furnitura va ruchka',
  xulosa:'Xulosa va buyurtma'
};

var state = {
  rang:'yongoq', karona:'klassik', oyna:'tekis',
  ruchka:'klassik', qulf:'oddiy', petlya:'3',
  step:0
};

/* =========================================================
   YORDAMCHI FUNKSIYALAR
   ========================================================= */
function findBy(arr,id){ for(var i=0;i<arr.length;i++){ if(arr[i].id===id) return arr[i]; } return arr[0]; }
function formatSom(n){ return n.toString().replace(/\B(?=(\d{3})+(?!\d))/g,' ') + " so'm"; }

function calcTotal(){
  var c = findBy(COLORS, state.rang);
  var k = findBy(KARONA, state.karona);
  var o = findBy(OYNA, state.oyna);
  var r = findBy(RUCHKA, state.ruchka);
  var q = findBy(QULF, state.qulf);
  var p = findBy(PETLYA, state.petlya);
  return BASE_PRICE + c.price + k.price + o.price + r.price + q.price + p.price;
}

/* =========================================================
   SVG PREVIEW — eshikni jonli chizish
   ========================================================= */
function renderDoor(){
  var c = findBy(COLORS, state.rang);
  var svg = document.getElementById('doorSvg');
  var body = document.getElementById('doorBody');
  var dark = shade(c.hex, -22);
  var light = shade(c.hex, 14);

  body.setAttribute('fill', c.hex);
  body.setAttribute('stroke', 'rgba(0,0,0,.3)');

  // FRAME (karona)
  var frame = document.getElementById('frameLayer');
  frame.innerHTML = '';
  if(state.karona !== 'yoq'){
    var fw = state.karona === 'minimal' ? 6 : (state.karona === 'modern' ? 9 : 12);
    var frect = document.createElementNS('http://www.w3.org/2000/svg','rect');
    frect.setAttribute('x', 26 - fw); frect.setAttribute('y', 8 - fw);
    frect.setAttribute('width', 148 + fw*2); frect.setAttribute('height', 364 + fw*1.4);
    frect.setAttribute('rx', 2);
    frect.setAttribute('fill', dark);
    frect.setAttribute('opacity', state.karona === 'klassik' ? '1' : '0.9');
    frame.appendChild(frect);
    if(state.karona === 'klassik'){
      var inner = document.createElementNS('http://www.w3.org/2000/svg','rect');
      inner.setAttribute('x', 26 - fw + 3); inner.setAttribute('y', 8 - fw + 3);
      inner.setAttribute('width', 148 + fw*2 - 6); inner.setAttribute('height', 364 + fw*1.4 - 6);
      inner.setAttribute('rx', 2); inner.setAttribute('fill','none');
      inner.setAttribute('stroke', 'rgba(201,164,76,.35)'); inner.setAttribute('stroke-width','1.5');
      frame.appendChild(inner);
    }
  }

  // PANELS
  var panels = document.getElementById('panelsLayer');
  panels.innerHTML = '';
  var hasWindow = state.oyna !== 'tekis';
  var topPanelH = hasWindow ? 150 : 160;
  var mkPanel = function(x,y,w,h){
    var r = document.createElementNS('http://www.w3.org/2000/svg','rect');
    r.setAttribute('x',x); r.setAttribute('y',y); r.setAttribute('width',w); r.setAttribute('height',h);
    r.setAttribute('rx',2); r.setAttribute('fill',dark); r.setAttribute('opacity','0.9');
    return r;
  };
  if(hasWindow){
    panels.appendChild(mkPanel(40, 176, 120, 190));
  } else {
    panels.appendChild(mkPanel(40, 24, 120, topPanelH));
    panels.appendChild(mkPanel(40, 24+topPanelH+16, 120, 356-topPanelH-16-16));
  }

  // WINDOW
  var win = document.getElementById('windowLayer');
  win.innerHTML = '';
  if(hasWindow){
    var wRect = document.createElementNS('http://www.w3.org/2000/svg','rect');
    wRect.setAttribute('x', 52); wRect.setAttribute('y', 32);
    wRect.setAttribute('width', 96); wRect.setAttribute('height', 120);
    wRect.setAttribute('rx', 3);
    var fillMap = { oynali:'rgba(150,195,220,.55)', tutun:'rgba(120,120,130,.55)', naqsh: light };
    wRect.setAttribute('fill', fillMap[state.oyna] || 'rgba(150,195,220,.5)');
    wRect.setAttribute('stroke', dark); wRect.setAttribute('stroke-width','3');
    win.appendChild(wRect);
    if(state.oyna === 'oynali' || state.oyna === 'tutun'){
      var mullionV = document.createElementNS('http://www.w3.org/2000/svg','line');
      mullionV.setAttribute('x1',100); mullionV.setAttribute('y1',32); mullionV.setAttribute('x2',100); mullionV.setAttribute('y2',152);
      mullionV.setAttribute('stroke', dark); mullionV.setAttribute('stroke-width','3');
      win.appendChild(mullionV);
      var mullionH = document.createElementNS('http://www.w3.org/2000/svg','line');
      mullionH.setAttribute('x1',52); mullionH.setAttribute('y1',92); mullionH.setAttribute('x2',148); mullionH.setAttribute('y2',92);
      mullionH.setAttribute('stroke', dark); mullionH.setAttribute('stroke-width','3');
      win.appendChild(mullionH);
    }
    if(state.oyna === 'naqsh'){
      for(var i=0;i<3;i++){
        var deco = document.createElementNS('http://www.w3.org/2000/svg','circle');
        deco.setAttribute('cx', 70 + i*30); deco.setAttribute('cy', 92); deco.setAttribute('r', 9);
        deco.setAttribute('fill','none'); deco.setAttribute('stroke','#c9a44c'); deco.setAttribute('stroke-width','1.6');
        win.appendChild(deco);
      }
    }
  }

  // NAQSH (carving lines on lower panel, only when not using window-naqsh combo)
  var naqsh = document.getElementById('naqshLayer');
  naqsh.innerHTML = '';
  if(state.oyna === 'naqsh' && !hasWindow){
    // n/a — handled above when window
  }

  // HANDLE
  var handle = document.getElementById('handleLayer');
  handle.innerHTML = '';
  var hy = 195;
  if(state.ruchka === 'klassik'){
    var bar = document.createElementNS('http://www.w3.org/2000/svg','rect');
    bar.setAttribute('x',150); bar.setAttribute('y',hy-22); bar.setAttribute('width',7); bar.setAttribute('height',44);
    bar.setAttribute('rx',3); bar.setAttribute('fill','#c9a44c');
    handle.appendChild(bar);
  } else if(state.ruchka === 'modern'){
    var bar2 = document.createElementNS('http://www.w3.org/2000/svg','rect');
    bar2.setAttribute('x',146); bar2.setAttribute('y',hy-2); bar2.setAttribute('width',22); bar2.setAttribute('height',6);
    bar2.setAttribute('rx',3); bar2.setAttribute('fill','#c9a44c');
    handle.appendChild(bar2);
  } else {
    var knob = document.createElementNS('http://www.w3.org/2000/svg','circle');
    knob.setAttribute('cx',156); knob.setAttribute('cy',hy); knob.setAttribute('r',6);
    knob.setAttribute('fill','#c9a44c');
    handle.appendChild(knob);
  }
}

function shade(hex, percent){
  var f = parseInt(hex.slice(1),16), t = percent<0?0:255, p = Math.abs(percent)/100;
  var R = f>>16, G = f>>8&0x00FF, B = f&0x0000FF;
  var r = Math.round((t-R)*p)+R, g = Math.round((t-G)*p)+G, b = Math.round((t-B)*p)+B;
  return '#'+(0x1000000+r*0x10000+g*0x100+b).toString(16).slice(1);
}

/* =========================================================
   SUMMARY / PRICE
   ========================================================= */
function renderSummary(){
  var c = findBy(COLORS, state.rang),
      k = findBy(KARONA, state.karona), o = findBy(OYNA, state.oyna);
  var rows = [
    ['Rang', c.name],
    ['Karona', k.name],
    ['Oyna/naqsh', o.name]
  ];
  document.getElementById('previewSummary').innerHTML = rows.map(function(r){
    return '<div class="row"><span class="k">'+r[0]+'</span><span class="v">'+r[1]+'</span></div>';
  }).join('');
  document.getElementById('previewPrice').textContent = formatSom(calcTotal());
}

/* =========================================================
   OPTION CARD BUILDER
   ========================================================= */
function optionCard(item, groupKey, isSwatch){
  var active = state[groupKey] === item.id;
  var priceLine = item.price > 0 ? '+'+formatSom(item.price) : (item.price === 0 ? "Asosiy narxga kiradi" : '');
  var inner = isSwatch
    ? '<div class="swatch-chip" style="background:'+item.hex+'"></div>'
    : '<div class="icon-chip"><svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><rect x="5" y="3" width="14" height="18" rx="1"/><circle cx="15" cy="12" r="1"/></svg></div>';
  return '<button type="button" class="option-card'+(active?' active':'')+'" data-group="'+groupKey+'" data-id="'+item.id+'">'+
    '<span class="check"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><path d="M20 6 9 17l-5-5"/></svg></span>'+
    inner+
    '<span class="name">'+item.name+'</span>'+
    (item.desc ? '<span class="desc">'+item.desc+'</span>' : '')+
    (priceLine ? '<span class="plus">'+priceLine+'</span>' : '')+
    '</button>';
}

/* =========================================================
   STEP RENDERERS
   ========================================================= */
function renderStepContent(){
  var key = STEPS[state.step];
  var panel = document.getElementById('panelContent');
  var html = '';

  if(key === 'rang'){
    html += '<p class="step-intro">Eshik tabaqasi va karonasi uchun rang va tuslashni tanlang.</p>';
    html += '<div class="option-grid">' + COLORS.map(function(c){ return optionCard(c,'rang',true); }).join('') + '</div>';
  }
  else if(key === 'karona'){
    html += '<p class="step-intro">Eshik atrofidagi karona (obnalichka) uslubi — bu eshikning umumiy xarakterini belgilaydi.</p>';
    html += '<div class="option-grid">' + KARONA.map(function(k){ return optionCard(k,'karona',false); }).join('') + '</div>';
  }
  else if(key === 'oyna'){
    html += '<p class="step-intro">Eshikka oyna yoki o\'ymakor naqsh qo\'shishni xohlaysizmi?</p>';
    html += '<div class="option-grid">' + OYNA.map(function(o){ return optionCard(o,'oyna',false); }).join('') + '</div>';
  }
  else if(key === 'furnitura'){
    html += '<p class="step-intro">Dastak, qulf va petlyalarni tanlab, eshikni to\'liq jihozlang.</p>';
    html += '<div class="subgroup"><h4>Ruchka uslubi</h4><div class="option-grid">' + RUCHKA.map(function(r){ return optionCard(r,'ruchka',false); }).join('') + '</div></div>';
    html += '<div class="subgroup"><h4>Qulf turi</h4><div class="option-grid">' + QULF.map(function(q){ return optionCard(q,'qulf',false); }).join('') + '</div></div>';
    html += '<div class="subgroup"><h4>Petlyalar soni</h4><div class="option-grid">' + PETLYA.map(function(p){ return optionCard(p,'petlya',false); }).join('') + '</div></div>';
  }
  else if(key === 'xulosa'){
    html = renderFinalStep();
  }

  panel.innerHTML = html;
  attachCardListeners();
  if(key === 'xulosa') attachFinalListeners();
}

function renderFinalStep(){
  var c = findBy(COLORS, state.rang),
      k = findBy(KARONA, state.karona), o = findBy(OYNA, state.oyna),
      r = findBy(RUCHKA, state.ruchka), q = findBy(QULF, state.qulf), p = findBy(PETLYA, state.petlya);
  var total = calcTotal();
  var deposit = Math.round(total * 0.2);

  var rowsHtml = [
    ['Rang', c.name, c.price],
    ['Karona', k.name, k.price],
    ['Oyna/naqsh', o.name, o.price],
    ['Ruchka', r.name, r.price],
    ['Qulf', q.name, q.price],
    ['Petlyalar', p.name, p.price]
  ].map(function(row){
    return '<div class="line"><span class="k">'+row[0]+': '+row[1]+'</span><span class="v">'+(row[2]>0 ? '+'+formatSom(row[2]) : "—")+'</span></div>';
  }).join('');

  return '<p class="step-intro">Barcha tanlovlaringiz tayyor. Quyida chek va taxminiy narxni ko\'rishingiz, so\'ng buyurtma berishingiz mumkin.</p>'+
  '<div class="final-grid">'+
    '<div class="receipt">'+
      '<h3>Buyurtma cheki</h3>'+
      '<div class="line"><span class="k">Boshlang\'ich narx</span><span class="v">'+formatSom(BASE_PRICE)+'</span></div>'+
      rowsHtml+
      '<div class="total"><span class="k">Jami</span><span class="v">'+formatSom(total)+'</span></div>'+
      '<div class="deposit">Buyurtma uchun zalog (20%): '+formatSom(deposit)+'</div>'+
    '</div>'+
    '<div class="order-box">'+
      '<div class="field"><label for="custName">Ism va familiyangiz *</label><input type="text" id="custName" placeholder="Masalan: Aziz Karimov" value="'+esc(contact.name)+'"></div>'+
      '<div class="field"><label for="custPhone">Telefon raqam *</label>'+
        '<div class="phone-input-group">'+
          '<span class="phone-prefix">+998</span>'+
          '<input type="tel" id="custPhone" placeholder="90 123 45 67" inputmode="numeric" maxlength="12" value="'+esc(contact.phone)+'">'+
        '</div>'+
      '</div>'+
      '<div class="field"><label for="custAddress">Manzil *</label>'+
        '<div class="address-group">'+
          '<input type="text" id="custAddress" placeholder="Viloyat, tuman, mahalla, ko\'cha, uy raqami" value="'+esc(contact.address)+'">'+
          '<button type="button" class="btn map-pick-btn" id="pickMapBtn">'+
            '<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M12 21s7-6.1 7-11a7 7 0 1 0-14 0c0 4.9 7 11 7 11Z"/><circle cx="12" cy="10" r="2.4"/></svg>'+
            'Xaritadan tanlash'+
          '</button>'+
        '</div>'+
        '<div class="pin-chip" id="pinChip"></div>'+
      '</div>'+
      '<div class="order-error" id="orderError"></div>'+
      '<div class="btn-row">'+
        '<button type="button" class="btn primary" id="sendTgBtn">'+
          '<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round"><path d="M22 3L2.5 10.7c-.7.3-.7 1.3.1 1.5l4.9 1.5 1.9 6.1c.2.7 1.1.9 1.6.3l2.7-3 5 3.7c.6.5 1.5.1 1.7-.6L23.9 4c.2-.8-.6-1.4-1.9-1z"/><path d="M7.5 13.7l10-7.2-8 8.4"/></svg>'+
          'Buyurtma berish'+
        '</button>'+
        '<button type="button" class="btn" id="printBtn">'+
          '<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M6 9V2h12v7M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2M6 14h12v8H6z"/></svg>'+
          "PDF / chop etish"+
        '</button>'+
      '</div>'+
      '<button type="button" class="btn" id="copyBtn" style="width:100%; justify-content:center;">'+
        '<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>'+
        "Buyurtma ma'lumotlarini nusxalash"+
      '</button>'+
      '<div class="order-note">* Ism, telefon va manzilingizni kiriting — buyurtma shulardan keyingina yuboriladi.</div>'+
      '<div class="confirm-box" id="confirmBox">'+
        '<div class="tick"><svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M20 6 9 17l-5-5"/></svg></div>'+
        '<h4>Buyurtma tayyorlandi!</h4>'+
        '<p>Tez orada mutaxassisimiz siz bilan bog\'lanadi.</p>'+
      '</div>'+
    '</div>'+
  '</div>';
}

function getFullPhone(el){
  var digits = el ? el.value.replace(/\D/g, '') : '';
  return digits ? ('+998' + digits) : '';
}

function buildOrderText(){
  var c = findBy(COLORS, state.rang),
      k = findBy(KARONA, state.karona), o = findBy(OYNA, state.oyna),
      r = findBy(RUCHKA, state.ruchka), q = findBy(QULF, state.qulf), p = findBy(PETLYA, state.petlya);
  var name = (document.getElementById('custName')||{}).value || '';
  var phone = getFullPhone(document.getElementById('custPhone'));
  var address = (document.getElementById('custAddress')||{}).value || '';
  var total = calcTotal();
  var deposit = Math.round(total*0.2);

  var lines = ['🚪 Yangi eshik konstruktori buyurtmasi — YasinDoors', ''];
  if(name) lines.push('👤 Mijoz: ' + name);
  if(phone) lines.push('📞 Tel: ' + phone);
  if(address) lines.push('📍 Manzil: ' + address);
  if(getMapLink()) lines.push('🗺 Xarita: ' + getMapLink());
  lines.push('🎨 Rang: ' + c.name);
  lines.push('🖼 Karona: ' + k.name);
  lines.push('🪟 Oyna/naqsh: ' + o.name);
  lines.push('🖐 Ruchka: ' + r.name);
  lines.push('🔒 Qulf: ' + q.name);
  lines.push('🔩 Petlyalar: ' + p.name);
  lines.push('💰 Umumiy: ' + formatSom(total));
  lines.push('💵 Zalog (20%): ' + formatSom(deposit));
  return lines.join('\n');
}

// ---------- Buyurtmani Google Sheets'ga yozish ----------
// Code.gs'ning doPost() funksiyasi kutayotgan aniq maydonlar bilan bir xil:
// type, id, name, phone, model, series, size, color, quantity, total, deposit, address, map_link, page
function generateOrderId(){
  return 'YDK' + Date.now().toString(36).toUpperCase();
}

function sendOrderToSheets(){
  var url = window.SHEETS_WEBHOOK_URL;
  if(!url || String(url).indexOf('BU_YERGA') !== -1){
    console.error('bot-config.js da SHEETS_WEBHOOK_URL sozlanmagan — buyurtma Sheets\'ga yuborilmadi.');
    return;
  }
  var c = findBy(COLORS, state.rang),
      k = findBy(KARONA, state.karona), o = findBy(OYNA, state.oyna),
      r = findBy(RUCHKA, state.ruchka), q = findBy(QULF, state.qulf), p = findBy(PETLYA, state.petlya);
  var name = (document.getElementById('custName')||{}).value.trim() || '';
  var phone = getFullPhone(document.getElementById('custPhone'));
  var address = (document.getElementById('custAddress')||{}).value.trim() || '';
  var total = calcTotal();
  var deposit = Math.round(total * 0.2);

  var payload = {
    type: 'order',
    id: generateOrderId(),
    name: name,
    phone: phone,
    model: 'Maxsus eshik (konstruktor)',
    series: 'Karona: ' + k.name + ' · Oyna: ' + o.name + ' · Ruchka: ' + r.name + ' · Qulf: ' + q.name + ' · ' + p.name,
    size: '',
    color: c.name,
    quantity: 1,
    total: total,
    deposit: deposit,
    address: address,
    map_link: getMapLink(),
    page: window.location.pathname
  };

  return fetch(url, {
    method: 'POST',
    mode: 'no-cors', // Google Apps Script javobini o'qimaymiz, faqat yuboramiz
    headers: { 'Content-Type': 'text/plain' },
    body: JSON.stringify(payload)
  }).catch(function(err){
    console.error('Buyurtmani Sheets\'ga yuborishda xatolik:', err);
  });
}

/* =========================================================
   MANZILNI XARITADAN TANLASH (Leaflet + OpenStreetMap)
   buyurtma.html'dagi xarita bilan bir xil hududlar va geokodlash xizmati
   ========================================================= */
var contact = { name:'', phone:'', address:'', lat:null, lng:null };

function esc(s){
  return String(s == null ? '' : s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}

function getMapLink(){
  if(contact.lat == null || contact.lng == null) return '';
  return 'https://www.google.com/maps?q=' + contact.lat.toFixed(6) + ',' + contact.lng.toFixed(6);
}

// Yetkazib berish mumkin bo'lgan viloyatlar (taxminiy poligonlar — buyurtma.html bilan bir xil)
var ALLOWED_REGIONS = {
  "Toshkent viloyati": [[41.85,69.95],[41.75,70.35],[41.35,70.55],[41.05,70.35],[40.75,70.05],[40.85,69.55],[41.05,69.15],[41.35,68.75],[41.65,68.85],[41.85,69.35],[41.85,69.95]],
  "Sirdaryo viloyati": [[40.85,68.55],[40.85,69.15],[40.55,69.35],[40.15,69.15],[40.05,68.75],[40.25,68.35],[40.65,68.25],[40.85,68.55]],
  "Samarqand viloyati": [[40.15,66.55],[40.05,67.55],[39.75,67.85],[39.35,67.65],[39.05,67.15],[39.15,66.35],[39.55,65.95],[39.95,66.05],[40.15,66.55]],
  "Navoiy viloyati": [[42.05,65.95],[41.75,66.55],[40.85,66.75],[40.15,66.45],[39.85,65.55],[39.55,64.25],[39.85,62.75],[40.55,62.35],[41.55,63.05],[42.05,64.25],[42.05,65.95]],
  "Qashqadaryo viloyati": [[39.15,65.15],[39.05,66.35],[38.55,66.95],[37.95,66.75],[37.85,65.95],[38.15,65.05],[38.65,64.55],[39.05,64.75],[39.15,65.15]],
  "Jizzax viloyati": [[40.55,67.55],[40.45,68.35],[40.05,68.65],[39.55,68.35],[39.35,67.85],[39.55,67.15],[40.05,66.95],[40.35,67.15],[40.55,67.55]]
};

function pointInPolygon(lat, lng, polygon){
  var inside = false;
  for(var i = 0, j = polygon.length - 1; i < polygon.length; j = i++){
    var yi = polygon[i][0], xi = polygon[i][1], yj = polygon[j][0], xj = polygon[j][1];
    if(((yi > lat) !== (yj > lat)) && (lng < (xj - xi) * (lat - yi) / (yj - yi) + xi)) inside = !inside;
  }
  return inside;
}
function findAllowedRegion(lat, lng){
  for(var name in ALLOWED_REGIONS){ if(pointInPolygon(lat, lng, ALLOWED_REGIONS[name])) return name; }
  return null;
}

var NOMINATIM = 'https://nominatim.openstreetmap.org';
function nominatimReverse(lat, lng){
  return fetch(NOMINATIM + '/reverse?format=jsonv2&addressdetails=1&accept-language=uz,ru&lat=' + lat + '&lon=' + lng,
    { headers:{ 'Accept':'application/json' } }).then(function(r){ if(!r.ok) throw new Error('HTTP ' + r.status); return r.json(); });
}
function nominatimSearch(q){
  return fetch(NOMINATIM + '/search?format=jsonv2&limit=1&countrycodes=uz&accept-language=uz,ru&q=' + encodeURIComponent(q),
    { headers:{ 'Accept':'application/json' } }).then(function(r){ if(!r.ok) throw new Error('HTTP ' + r.status); return r.json(); });
}

var picker = { map:null, marker:null, lat:null, lng:null, region:null, text:'', seq:0, lastFocus:null };

function pickerEl(id){ return document.getElementById(id); }

function setPickerStatus(kind, html){
  var el = pickerEl('mapStatus');
  el.className = 'map-status' + (kind ? ' show ' + kind : '');
  el.innerHTML = html || '';
}

function renderPicked(){
  var box = pickerEl('mapPicked');
  var btn = pickerEl('mapConfirmBtn');
  if(picker.lat == null || !picker.region){
    box.innerHTML = ''; box.classList.remove('show'); btn.disabled = true; return;
  }
  box.classList.add('show');
  box.innerHTML = '<b>Tanlangan manzil:</b> ' + esc(picker.text || picker.region) +
    '<span class="hint">Uy / xonadon raqamini tasdiqlagandan so\'ng manzil maydoniga qo\'shishingiz mumkin.</span>';
  btn.disabled = false;
}

function placeMarker(lat, lng, ok){
  if(picker.marker) picker.map.removeLayer(picker.marker);
  picker.marker = L.circleMarker([lat, lng], {
    radius:9, weight:2,
    color: ok ? '#7a4a20' : '#7a2020',
    fillColor: ok ? '#c9a44c' : '#e06060',
    fillOpacity:1
  }).addTo(picker.map);
}

function setPickerPoint(lat, lng){
  picker.lat = lat; picker.lng = lng;
  var region = findAllowedRegion(lat, lng);
  picker.region = region;
  placeMarker(lat, lng, !!region);

  if(!region){
    picker.text = '';
    setPickerStatus('fail', '✕ Bu joyga yetkazib bera olmaymiz. Hozircha faqat Toshkent, Sirdaryo, Samarqand, Navoiy, Qashqadaryo va Jizzax viloyatlariga yetkazib beramiz.');
    renderPicked();
    return;
  }

  setPickerStatus('ok', '✓ <b>' + region + '</b> — bu hududga yetkazib bera olamiz.');
  picker.text = region;
  renderPicked();

  var mySeq = ++picker.seq;
  nominatimReverse(lat, lng).then(function(data){
    if(mySeq !== picker.seq) return; // undan keyinroq boshqa nuqta bosilgan
    var a = data && data.address;
    if(!a) return;
    var mahalla = a.suburb || a.neighbourhood || a.quarter || a.city_district || a.residential || '';
    var street = a.road || a.pedestrian || a.footway || '';
    var parts = [];
    if(a.house_number) parts.push(a.house_number + '-uy');
    if(street) parts.push(street);
    if(mahalla) parts.push(mahalla);
    parts.push(region);
    picker.text = parts.join(', ');
    renderPicked();
  }).catch(function(err){
    console.error('Teskari geokodlash xatosi:', err);
  });
}

function initPickerMap(){
  if(picker.map) return true;
  if(typeof L === 'undefined'){
    setPickerStatus('fail', '✕ Xarita yuklanmadi. Internet aloqasini tekshirib, sahifani yangilang yoki manzilni qo\'lda kiriting.');
    return false;
  }
  picker.map = L.map(pickerEl('pickerMap'), { center:[40.127041, 67.905874], zoom:7, minZoom:5, maxZoom:19 });
  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution:'© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>', maxZoom:19
  }).addTo(picker.map);

  Object.keys(ALLOWED_REGIONS).forEach(function(name){
    L.polygon(ALLOWED_REGIONS[name], { fillColor:'#c9a44c', fillOpacity:.18, color:'#c9a44c', weight:1.5, opacity:.9 })
      .addTo(picker.map).bindTooltip(name)
      .on('click', function(e){ setPickerPoint(e.latlng.lat, e.latlng.lng); });
  });
  picker.map.on('click', function(e){ setPickerPoint(e.latlng.lat, e.latlng.lng); });
  return true;
}

function openMapModal(){
  var modal = pickerEl('mapModal');
  picker.lastFocus = document.activeElement;
  modal.classList.add('open');
  modal.setAttribute('aria-hidden', 'false');
  document.body.classList.add('map-modal-lock');

  var ready = initPickerMap();
  setPickerStatus('', '');
  pickerEl('mapPicked').classList.remove('show');
  pickerEl('mapConfirmBtn').disabled = true;
  picker.lat = null; picker.lng = null; picker.region = null; picker.text = '';
  if(picker.marker && picker.map){ picker.map.removeLayer(picker.marker); picker.marker = null; }

  var typed = (document.getElementById('custAddress') || {}).value || '';
  pickerEl('mapSearchInput').value = contact.lat == null ? typed.trim() : '';

  if(ready){
    setTimeout(function(){
      picker.map.invalidateSize();
      if(contact.lat != null){
        picker.map.setView([contact.lat, contact.lng], 16);
        setPickerPoint(contact.lat, contact.lng); // avval tanlangan nuqtani ko'rsatish
      } else {
        picker.map.setView([40.127041, 67.905874], 7);
        setPickerStatus('', '');
        var st = pickerEl('mapStatus');
        st.className = 'map-status show info';
        st.innerHTML = 'Xaritani kattalashtirib, eshik o\'rnatiladigan joyni bosing.';
      }
    }, 60);
  }
  pickerEl('mapCloseBtn').focus();
}

function closeMapModal(){
  var modal = pickerEl('mapModal');
  modal.classList.remove('open');
  modal.setAttribute('aria-hidden', 'true');
  document.body.classList.remove('map-modal-lock');
  if(picker.lastFocus && picker.lastFocus.focus) picker.lastFocus.focus();
}

function renderPinChip(){
  var chip = document.getElementById('pinChip');
  if(!chip) return;
  if(contact.lat == null){ chip.classList.remove('show'); chip.innerHTML = ''; return; }
  chip.classList.add('show');
  chip.innerHTML = '<span><svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 6 9 17l-5-5"/></svg> Xaritada belgilandi</span>' +
    '<a href="' + getMapLink() + '" target="_blank" rel="noopener">Ko\'rish</a>' +
    '<button type="button" id="pinClearBtn">Olib tashlash</button>';
  document.getElementById('pinClearBtn').addEventListener('click', function(){
    contact.lat = null; contact.lng = null; renderPinChip();
  });
}

function confirmMapPick(){
  if(picker.lat == null || !picker.region) return;
  contact.lat = picker.lat; contact.lng = picker.lng;
  contact.address = picker.text || picker.region;
  var input = document.getElementById('custAddress');
  if(input){ input.value = contact.address; input.classList.remove('invalid'); input.focus(); }
  var err = document.getElementById('orderError');
  if(err) err.classList.remove('show');
  renderPinChip();
  closeMapModal();
}

function attachMapPicker(){
  // Modal tugmalari faqat bir marta bog'lanadi
  if(attachMapPicker.done) return;
  attachMapPicker.done = true;

  pickerEl('mapCloseBtn').addEventListener('click', closeMapModal);
  pickerEl('mapCancelBtn').addEventListener('click', closeMapModal);
  pickerEl('mapConfirmBtn').addEventListener('click', confirmMapPick);
  pickerEl('mapModal').addEventListener('click', function(e){ if(e.target === this) closeMapModal(); });
  document.addEventListener('keydown', function(e){
    if(e.key === 'Escape' && pickerEl('mapModal').classList.contains('open')) closeMapModal();
  });

  function doSearch(){
    var q = pickerEl('mapSearchInput').value.trim();
    if(!q || !picker.map) return;
    var btn = pickerEl('mapSearchBtn');
    btn.disabled = true; btn.textContent = 'Qidirilmoqda...';
    nominatimSearch(q).then(function(res){
      btn.disabled = false; btn.textContent = 'Qidirish';
      if(!res || !res.length){
        setPickerStatus('fail', '✕ Manzil topilmadi. Boshqacha yozib ko\'ring yoki xaritadan bosib belgilang.');
        return;
      }
      var lat = parseFloat(res[0].lat), lng = parseFloat(res[0].lon);
      picker.map.flyTo([lat, lng], 17, { duration:.4 });
      setPickerPoint(lat, lng);
    }).catch(function(err){
      btn.disabled = false; btn.textContent = 'Qidirish';
      setPickerStatus('fail', '✕ Qidirishda xatolik. Birozdan so\'ng qayta urinib ko\'ring.');
      console.error('Geokodlash xatosi:', err);
    });
  }
  pickerEl('mapSearchBtn').addEventListener('click', doSearch);
  pickerEl('mapSearchInput').addEventListener('keydown', function(e){
    if(e.key === 'Enter'){ e.preventDefault(); doSearch(); }
  });

  pickerEl('mapLocateBtn').addEventListener('click', function(){
    if(!navigator.geolocation || !picker.map){
      setPickerStatus('fail', '✕ Brauzeringiz joylashuvni aniqlashni qo\'llamaydi. Xaritadan qo\'lda belgilang.');
      return;
    }
    var btn = pickerEl('mapLocateBtn');
    btn.disabled = true;
    navigator.geolocation.getCurrentPosition(function(pos){
      btn.disabled = false;
      picker.map.flyTo([pos.coords.latitude, pos.coords.longitude], 17, { duration:.4 });
      setPickerPoint(pos.coords.latitude, pos.coords.longitude);
    }, function(){
      btn.disabled = false;
      setPickerStatus('fail', '✕ Joylashuvni aniqlab bo\'lmadi. Brauzerda ruxsat berilganini tekshiring yoki xaritadan qo\'lda belgilang.');
    }, { enableHighAccuracy:true, timeout:10000 });
  });
}

function attachFinalListeners(){
  var sendBtn = document.getElementById('sendTgBtn');
  var printBtn = document.getElementById('printBtn');
  var copyBtn = document.getElementById('copyBtn');
  var confirmBox = document.getElementById('confirmBox');
  var errorBox = document.getElementById('orderError');
  var nameInput = document.getElementById('custName');
  var phoneInput = document.getElementById('custPhone');
  var addressInput = document.getElementById('custAddress');

  function clearFieldError(el){ el.classList.remove('invalid'); }
  function setFieldError(el){ el.classList.add('invalid'); }
  [nameInput, phoneInput, addressInput].forEach(function(el){
    el.addEventListener('input', function(){ clearFieldError(el); errorBox.classList.remove('show'); });
  });

  // Oldingi/keyingi bosqichga o'tganda kiritilgan ma'lumotlar yo'qolmasligi uchun saqlab boriladi
  nameInput.addEventListener('input', function(){ contact.name = nameInput.value; });
  addressInput.addEventListener('input', function(){ contact.address = addressInput.value; });

  // "Xaritadan" tugmasi — xarita oynasini ochadi
  attachMapPicker();
  document.getElementById('pickMapBtn').addEventListener('click', openMapModal);
  renderPinChip();

  // Telefon: faqat 9 ta raqam kiritiladi, avtomatik bo'shliqlar bilan formatlanadi (+998 alohida ko'rsatiladi)
  phoneInput.addEventListener('input', function(){
    var digits = phoneInput.value.replace(/\D/g, '').slice(0, 9);
    var parts = [];
    if(digits.length > 0) parts.push(digits.slice(0, 2));
    if(digits.length > 2) parts.push(digits.slice(2, 5));
    if(digits.length > 5) parts.push(digits.slice(5, 7));
    if(digits.length > 7) parts.push(digits.slice(7, 9));
    phoneInput.value = parts.join(' ');
    contact.phone = phoneInput.value;
  });
  phoneInput.addEventListener('keydown', function(e){
    var allowedKeys = ['Backspace', 'Delete', 'Tab', 'ArrowLeft', 'ArrowRight', 'Home', 'End'];
    if(allowedKeys.indexOf(e.key) !== -1 || e.ctrlKey || e.metaKey) return;
    if(!/^[0-9]$/.test(e.key)) e.preventDefault();
  });

  function validateContact(){
    var nameVal = nameInput.value.trim();
    var phoneDigits = phoneInput.value.replace(/\D/g, '');
    var addressVal = addressInput.value.trim();
    var ok = true;
    if(!nameVal){ setFieldError(nameInput); ok = false; } else { clearFieldError(nameInput); }
    if(phoneDigits.length !== 9){ setFieldError(phoneInput); ok = false; } else { clearFieldError(phoneInput); }
    if(!addressVal){ setFieldError(addressInput); ok = false; } else { clearFieldError(addressInput); }
    if(!ok){
      errorBox.textContent = "Buyurtma yuborish uchun ism, telefon (9 ta raqam) va manzilni to'liq kiriting.";
      errorBox.classList.add('show');
      (!nameVal ? nameInput : (phoneDigits.length !== 9 ? phoneInput : addressInput)).focus();
    }
    return ok;
  }

  sendBtn.addEventListener('click', function(){
    if(!validateContact()) return;
    sendOrderToSheets();
    confirmBox.classList.add('show');
  });

  printBtn.addEventListener('click', function(){
    window.print();
  });

  copyBtn.addEventListener('click', function(){
    var text = buildOrderText();
    var done = function(){
      var original = copyBtn.innerHTML;
      copyBtn.innerHTML = '<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M20 6 9 17l-5-5"/></svg> Nusxalandi!';
      setTimeout(function(){ copyBtn.innerHTML = original; }, 1800);
    };
    if(navigator.clipboard && navigator.clipboard.writeText){
      navigator.clipboard.writeText(text).then(done).catch(function(){ fallbackCopy(text, done); });
    } else {
      fallbackCopy(text, done);
    }
  });
}

function fallbackCopy(text, cb){
  var ta = document.createElement('textarea');
  ta.value = text; ta.style.position = 'fixed'; ta.style.opacity = '0';
  document.body.appendChild(ta); ta.focus(); ta.select();
  try{ document.execCommand('copy'); }catch(e){}
  document.body.removeChild(ta);
  if(cb) cb();
}

function attachCardListeners(){
  var cards = document.querySelectorAll('.option-card');
  cards.forEach(function(card){
    card.addEventListener('click', function(){
      var group = card.getAttribute('data-group');
      var id = card.getAttribute('data-id');
      state[group] = id;
      // re-render just this group's cards + preview
      renderStepContent();
      renderDoor();
      renderSummary();
    });
  });
}

/* =========================================================
   PROGRESS / NAV
   ========================================================= */
function renderProgress(){
  document.getElementById('stepLabel').textContent = 'QADAM ' + (state.step+1) + ' / ' + STEPS.length;
  document.getElementById('stepTitle').textContent = STEP_TITLES[STEPS[state.step]];
  document.getElementById('progressFill').style.width = ((state.step+1)/STEPS.length*100) + '%';

  var dotsHtml = STEPS.map(function(s,i){
    var cls = i < state.step ? 'done' : (i === state.step ? 'now' : '');
    return '<span class="'+cls+'">'+(i+1)+'</span>';
  }).join('');
  document.getElementById('progressDots').innerHTML = dotsHtml;

  document.getElementById('prevBtn').disabled = state.step === 0;
  var nextBtn = document.getElementById('nextBtn');
  if(state.step === STEPS.length - 1){
    nextBtn.style.display = 'none';
  } else {
    nextBtn.style.display = 'inline-flex';
    nextBtn.innerHTML = 'Keyingisi <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12h14M13 6l6 6-6 6"/></svg>';
  }
}

function goToStep(n){
  state.step = Math.max(0, Math.min(STEPS.length-1, n));
  renderProgress();
  renderStepContent();
  renderDoor();
  renderSummary();
  document.getElementById('wizardScreen').scrollIntoView({behavior:'smooth', block:'start'});
}

/* =========================================================
   INIT
   ========================================================= */
document.getElementById('startBtn').addEventListener('click', function(){
  document.getElementById('heroScreen').style.display = 'none';
  document.getElementById('wizardScreen').classList.add('active');
  goToStep(0);
});

document.getElementById('prevBtn').addEventListener('click', function(){ goToStep(state.step - 1); });
document.getElementById('nextBtn').addEventListener('click', function(){ goToStep(state.step + 1); });

document.getElementById('themeToggle').addEventListener('click', function(){
  var html = document.documentElement;
  var cur = html.getAttribute('data-theme') === 'light' ? 'dark' : 'light';
  html.setAttribute('data-theme', cur);
  try{ localStorage.setItem('yd_theme', cur); }catch(e){}
});
(function initTheme(){
  try{
    var saved = localStorage.getItem('yd_theme');
    if(saved) document.documentElement.setAttribute('data-theme', saved);
  }catch(e){}
})();

// initial paint (so preview looks right even before wizard opens)
renderDoor();
renderSummary();

})();
