(function(){

/* =========================================================
   MA'LUMOTLAR
   ========================================================= */
var MATERIALS = [
  { id:'yogoch', name:"Yog'och (massiv)", desc:"Tabiiy naqsh, eng yuqori mustahkamlik", price:2400000 },
  { id:'mdf',    name:'MDF', desc:"Silliq yuza, keng rang tanlovi", price:1600000 },
  { id:'metal',  name:'Metall', desc:"Maksimal xavfsizlik, tashqi eshiklar uchun", price:2900000 },
  { id:'shisha', name:'Shisha aralash', desc:"Zamonaviy, yorug'lik o'tkazadi", price:2100000 }
];

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

var BASE_PRICE = 900000;

var STEPS = ['material','rang','karona','oyna','furnitura','xulosa'];
var STEP_TITLES = {
  material:'Eshik turi va materiali',
  rang:'Rang va tekstura',
  karona:'Karona va obnalichka',
  oyna:'Oyna va naqsh',
  furnitura:'Furnitura va ruchka',
  xulosa:'Xulosa va buyurtma'
};

var state = {
  material:'mdf', rang:'yongoq', karona:'klassik', oyna:'tekis',
  ruchka:'klassik', qulf:'oddiy', petlya:'3',
  step:0
};

/* =========================================================
   YORDAMCHI FUNKSIYALAR
   ========================================================= */
function findBy(arr,id){ for(var i=0;i<arr.length;i++){ if(arr[i].id===id) return arr[i]; } return arr[0]; }
function formatSom(n){ return n.toString().replace(/\B(?=(\d{3})+(?!\d))/g,' ') + " so'm"; }

function calcTotal(){
  var m = findBy(MATERIALS, state.material);
  var c = findBy(COLORS, state.rang);
  var k = findBy(KARONA, state.karona);
  var o = findBy(OYNA, state.oyna);
  var r = findBy(RUCHKA, state.ruchka);
  var q = findBy(QULF, state.qulf);
  var p = findBy(PETLYA, state.petlya);
  return BASE_PRICE + m.price + c.price + k.price + o.price + r.price + q.price + p.price;
}

/* =========================================================
   SVG PREVIEW — eshikni jonli chizish
   ========================================================= */
function renderDoor(){
  var c = findBy(COLORS, state.rang);
  var m = findBy(MATERIALS, state.material);
  var svg = document.getElementById('doorSvg');
  var body = document.getElementById('doorBody');
  var dark = shade(c.hex, -22);
  var light = shade(c.hex, 14);

  body.setAttribute('fill', c.hex);
  body.setAttribute('stroke', 'rgba(0,0,0,.3)');

  // metal material -> slightly different sheen via stroke
  if(m.id === 'metal'){ body.setAttribute('stroke', 'rgba(0,0,0,.5)'); }

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
  if(state.material === 'yogoch'){
    // subtle wood grain lines
    for(var g=0; g<4; g++){
      var gl = document.createElementNS('http://www.w3.org/2000/svg','path');
      var yy = 30 + g*80;
      gl.setAttribute('d', 'M40 '+yy+' Q100 '+(yy+10)+' 160 '+yy);
      gl.setAttribute('stroke', 'rgba(0,0,0,.12)'); gl.setAttribute('stroke-width','1'); gl.setAttribute('fill','none');
      naqsh.appendChild(gl);
    }
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
  var m = findBy(MATERIALS, state.material), c = findBy(COLORS, state.rang),
      k = findBy(KARONA, state.karona), o = findBy(OYNA, state.oyna);
  var rows = [
    ['Material', m.name],
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

  if(key === 'material'){
    html += '<p class="step-intro">Eshikning asosiy jismi qanday materialdan bo\'lishini tanlang — bu mustahkamlik va boshlang\'ich narxni belgilaydi.</p>';
    html += '<div class="option-grid">' + MATERIALS.map(function(m){ return optionCard(m,'material',false); }).join('') + '</div>';
  }
  else if(key === 'rang'){
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
  var m = findBy(MATERIALS, state.material), c = findBy(COLORS, state.rang),
      k = findBy(KARONA, state.karona), o = findBy(OYNA, state.oyna),
      r = findBy(RUCHKA, state.ruchka), q = findBy(QULF, state.qulf), p = findBy(PETLYA, state.petlya);
  var total = calcTotal();
  var deposit = Math.round(total * 0.2);

  var rowsHtml = [
    ['Material', m.name, m.price],
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
      '<div class="field"><label for="custName">Ismingiz</label><input type="text" id="custName" placeholder="Ismingizni kiriting"></div>'+
      '<div class="field"><label for="custPhone">Telefon raqam</label><input type="tel" id="custPhone" placeholder="+998 90 123 45 67"></div>'+
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
      '<div class="order-note">Ism va telefon ixtiyoriy — kiritsangiz, Telegram xabarida avtomatik qo\'shiladi.</div>'+
      '<div class="confirm-box" id="confirmBox">'+
        '<div class="tick"><svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M20 6 9 17l-5-5"/></svg></div>'+
        '<h4>Buyurtma tayyorlandi!</h4>'+
        '<p>Telegram oynasi ochildi — xabarni yuborishni tasdiqlang, mutaxassisimiz tez orada siz bilan bog\'lanadi.</p>'+
      '</div>'+
    '</div>'+
  '</div>';
}

function buildOrderText(){
  var m = findBy(MATERIALS, state.material), c = findBy(COLORS, state.rang),
      k = findBy(KARONA, state.karona), o = findBy(OYNA, state.oyna),
      r = findBy(RUCHKA, state.ruchka), q = findBy(QULF, state.qulf), p = findBy(PETLYA, state.petlya);
  var name = (document.getElementById('custName')||{}).value || '';
  var phone = (document.getElementById('custPhone')||{}).value || '';
  var total = calcTotal();
  var deposit = Math.round(total*0.2);

  var lines = ['🚪 Yangi eshik konstruktori buyurtmasi — YasinDoors', ''];
  if(name) lines.push('👤 Mijoz: ' + name);
  if(phone) lines.push('📞 Tel: ' + phone);
  lines.push('🧱 Material: ' + m.name);
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

function attachFinalListeners(){
  var sendBtn = document.getElementById('sendTgBtn');
  var printBtn = document.getElementById('printBtn');
  var copyBtn = document.getElementById('copyBtn');
  var confirmBox = document.getElementById('confirmBox');

  sendBtn.addEventListener('click', function(){
    var text = buildOrderText();
    var url = 'https://t.me/share/url?url=' + encodeURIComponent('YasinDoors') + '&text=' + encodeURIComponent(text);
    window.open(url, '_blank', 'noopener');
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
