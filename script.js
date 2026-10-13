/* ===== YasinDoors — script.js (barcha sahifalar uchun yagona frontend JS) ===== */
(async () => {
  'use strict';

  /* ---------- 1. Mahsulotlar (yagona manba) ---------- */
  // color: oq | qora | jigarrang | yogoch ; style: modern | classic ; badge: new | best | premium | sale | limited
  // Haqiqiy foto qo‘shish uchun mahsulotga `image: 'img/nom.jpg'` maydonini yozing — SVG o‘rniga shu ishlatiladi.
  const BADGES = { new: 'Yangi', best: 'Bestseller', premium: 'Premium', sale: 'Sale', limited: 'Limited' };
  const PRODUCTS = [
    { id: 1, name: 'Classic White', price: 2790000, color: 'oq', style: 'classic', hex: '#e8e4da', edge: '#cfc9bb', badge: 'best', tags: 'white oq classic pearl',
      desc: 'Nafis panelli och rangli klassik eshik.', long: 'Yumshoq oq tus va ko‘tarma panellar uyga tinch, yorug‘ muhit beradi.', material: 'MDF + emal qoplama', colorName: 'Oq', styleName: 'Classic', stock: true },
    { id: 2, name: 'Modern Oak', price: 2990000, color: 'yogoch', style: 'modern', hex: '#c49a6a', edge: '#9a7347', badge: '', tags: 'oak yogoch wood modern',
      desc: 'Zamonaviy chiziqli naqshli yog‘och eshik.', long: 'Tabiiy eman tusi va zamonaviy chiziqlar uyg‘unligi.', material: 'MDF + yog‘och tekstura', colorName: 'Yog‘och', styleName: 'Modern', stock: true },
    { id: 3, name: 'Black Minimal', price: 2890000, color: 'qora', style: 'modern', hex: '#232323', edge: '#0f0f0f', badge: 'new', tags: 'black qora modern minimal',
      desc: 'Vertikal chiziqli qora MDF eshik.', long: 'Kontrastli, premium ko‘rinishdagi qora eshik. Vertikal naqsh dizaynga chuqurlik beradi.', material: 'MDF + mat PVX qoplama', colorName: 'Qora', styleName: 'Modern', stock: true },
    { id: 4, name: 'Luxury Walnut', price: 3390000, color: 'jigarrang', style: 'classic', hex: '#6b4a33', edge: '#4a3022', badge: 'premium', tags: 'walnut brown jigarrang classic yongoq',
      desc: 'Boy jigarrang yong‘oq rangli eshik.', long: 'Chuqur jigarrang ton va nafis panellar bilan premium klassik model.', material: 'MDF + yong‘oq tekstura', colorName: 'Jigarrang', styleName: 'Classic', stock: true },
    { id: 5, name: 'White Line', price: 2450000, color: 'oq', style: 'modern', hex: '#f1f0ec', edge: '#d8d6cf', badge: '', tags: 'white oq modern minimal',
      desc: 'Toza oq rangdagi minimalist MDF eshik.', long: 'Yorug‘ interyerlar uchun silliq, mat qoplamali zamonaviy eshik.', material: 'MDF + mat PVX qoplama', colorName: 'Oq', styleName: 'Modern', stock: true },
    { id: 6, name: 'Dark Wood', price: 3150000, color: 'yogoch', style: 'classic', hex: '#5a3d28', edge: '#3d2819', badge: '', tags: 'dark wood yogoch classic',
      desc: 'To‘q yog‘och rangidagi klassik eshik.', long: 'Issiq to‘q yog‘och tekstura va klassik panellar an’anaviy interyerga mos keladi.', material: 'MDF + shpon ko‘rinishidagi qoplama', colorName: 'Yog‘och', styleName: 'Classic', stock: true },
    { id: 7, name: 'Minimal Gray', price: 3250000, color: 'kulrang', style: 'modern', hex: '#9a9c9d', edge: '#74777a', badge: 'new', tags: 'gray grey kulrang modern minimal',
      desc: 'Sokin kulrang tusdagi minimalist eshik.', long: 'Neytral kulrang rang deyarli har qanday zamonaviy interyer bilan uyg‘unlashadi.', material: 'MDF + mat PVX qoplama', colorName: 'Kulrang', styleName: 'Modern', stock: true },
    { id: 8, name: 'Premium Brown', price: 3490000, color: 'jigarrang', style: 'modern', hex: '#4a3328', edge: '#33231b', badge: 'premium', tags: 'brown espresso jigarrang modern',
      desc: 'To‘q jigarrang zamonaviy MDF eshik.', long: 'Chuqur jigarrang ranglar elegant va hashamatli ko‘rinish yaratadi.', material: 'MDF + mat PVX qoplama', colorName: 'Jigarrang', styleName: 'Modern', stock: false },
  ];
  const FILTERS = [['all', 'Barchasi'], ['new', 'Yangi'], ['sale', 'Chegirmali'], ['classic', 'Classic'], ['modern', 'Modern'], ['minimal', 'Minimal'], ['yogoch', 'Wood'], ['oq', 'White'], ['qora', 'Black']];
  const matches = (p, f) => f === 'all' || (f === 'new' ? p.badge === 'new' : f === 'sale' ? !!(p.discountPercent || p.old) : [p.color, p.style, ...p.tags.split(' ')].includes(f));
  const NAV = [['index.html', 'Bosh sahifa', 'home'], ['doors.html', 'MDF Eshiklar', 'doors'], ['about.html', 'Biz haqimizda', 'about'], ['contact.html', 'Aloqa', 'contact']];
  const DELIVERY = { fee: 100000, freeFrom: 5000000 }; // 5 mln dan yuqori buyurtmada yetkazib berish bepul
  // Katalog, yetkazib berish va sayt matnlari serverdan (admin paneldan) olinadi; server ishlamasa, yuqoridagi standart ma'lumot qoladi.
  const CONTENT = { hero: {}, promo: { enabled: false }, contacts: {}, faq: [] };
  const SIZE = { wMin: 600, wMax: 1200, hMin: 1800, hMax: 2400 }; // konstruktor uchun o‘lcham chegaralari (mm)
  async function getJSON(url) {
    try { const ctl = new AbortController(), t = setTimeout(() => ctl.abort(), 3000); const r = await fetch(url, { cache: 'no-store', signal: ctl.signal }); clearTimeout(t); return await r.json(); } catch { return null; }
  }
  async function loadCatalog() {
    const d = await getJSON('/api/catalog');
    if (d && d.ok && Array.isArray(d.products) && d.products.length) {
      PRODUCTS.splice(0, PRODUCTS.length, ...d.products);
      Object.assign(DELIVERY, { fee: d.settings.deliveryFee, freeFrom: d.settings.freeFrom });
      return true;
    }
    return false;
  }
  const [, contentRes] = await Promise.all([loadCatalog(), getJSON('/api/content')]);
  if (contentRes && contentRes.ok && contentRes.content) Object.assign(CONTENT, contentRes.content);
  /* ---------- Til: o‘zbek (standart) va rus. Kalit — o‘zbekcha matnning o‘zi; til almashtirilganda sahifa qayta yuklanadi ---------- */
  const LANG = (() => { try { return localStorage.getItem('lang') === 'ru' ? 'ru' : 'uz'; } catch { return 'uz'; } })();
  document.documentElement.lang = LANG;
  const RU = {
    'Asosiy kontentga o‘tish': 'Перейти к содержимому', 'Bosh sahifa': 'Главная', 'MDF Eshiklar': 'MDF двери', 'Biz haqimizda': 'О нас', 'Aloqa': 'Контакты',
    'Sevimlilar': 'Избранное', 'Savat': 'Корзина', 'Asosiy': 'Главная', 'Katalog': 'Каталог', 'Sevimli': 'Избранное', 'Asosiy menyu': 'Главное меню', 'Tezkor menyu': 'Быстрое меню',
    'Zamonaviy MDF eshiklar': 'Современные MDF двери', 'Uyingiz uchun sifat, dizayn va ishonch.': 'Качество, дизайн и надёжность для вашего дома.',
    'Eshiklarni ko‘rish': 'Смотреть двери', 'Pastga': 'Вниз', 'Pastga aylantirish': 'Прокрутить вниз', '5+ yil tajriba': '5+ лет опыта', 'Individual dizayn': 'Индивидуальный дизайн', '100% MDF': '100% MDF',
    'Eshik — bu shunchaki kirish emas.': 'Дверь — это не просто вход.', 'Bu uyingizning birinchi taassuroti.': 'Это первое впечатление о вашем доме.',
    'Biz faqat MDF eshiklar bilan shug‘ullanamiz: sifatli material, aniq detallar va uyingiz uslubiga mos dizayn.': 'Мы занимаемся только MDF дверями: качественный материал, точные детали и дизайн под стиль вашего дома.',
    'Kolleksiya': 'Коллекция', 'MDF Eshiklar kolleksiyasi': 'Коллекция MDF дверей', 'Kolleksiya bo‘limlari': 'Разделы коллекции', 'Barcha eshiklarni ko‘rish': 'Смотреть все двери',
    'Yangi': 'Новинки', 'Mashhur': 'Популярные', 'Chegirmali': 'Со скидкой', 'Barchasi': 'Все', 'Ranglar': 'Цвета', 'Rang bo‘yicha tanlang': 'Выберите по цвету',
    'Qaysi rang interyeringizga mos? Tanlang va mos modellarni ko‘ring.': 'Какой цвет подходит вашему интерьеру? Выберите и посмотрите модели.',
    'Konstruktor': 'Конструктор', 'O‘z eshigingizni tanlang': 'Подберите свою дверь', 'Uslub, rang va model, so‘ng o‘lchamni kiriting. Tanlov buyurtma izohiga yoziladi.': 'Стиль, цвет и модель, затем введите размер. Выбор попадёт в комментарий к заказу.',
    'Uslub': 'Стиль', 'Rang': 'Цвет', 'Model': 'Модель', 'O‘lcham (mm)': 'Размер (мм)', 'Kenglik (mm)': 'Ширина (мм)', 'Balandlik (mm)': 'Высота (мм)', 'Tanlovingiz': 'Ваш выбор', 'Model narxi': 'Цена модели',
    'Buyurtmaga qo‘shish': 'Добавить в заказ', 'Kenglik 600–1200 mm, balandlik 1800–2400 mm oralig‘ida bo‘lsin.': 'Ширина 600–1200 мм, высота 1800–2400 мм.', 'Bu bo‘limda mos modellar yo‘q.': 'Подходящих моделей нет.',
    'Narx modelga bog‘liq. O‘lchamga qarab yakuniy narxni operator tasdiqlaydi.': 'Цена зависит от модели. Итоговую цену по размеру подтверждает оператор.',
    'Afzalliklar': 'Преимущества', 'Nega YasinDoors?': 'Почему YasinDoors?', 'Faqat MDF': 'Только MDF', 'Premium sifat': 'Премиум качество', 'Ishonch': 'Надёжность',
    'Butun e’tiborimiz bitta mahsulotda — MDF eshiklarda.': 'Всё наше внимание — на одном продукте: MDF дверях.', 'Sifatli material va nafis, aniq detallar.': 'Качественный материал и аккуратные точные детали.',
    'Turli rang, uslub va modellardan tanlash.': 'Выбор среди разных цветов, стилей и моделей.', 'Ochiq munosabat va qulay buyurtma jarayoni.': 'Открытое отношение и удобный процесс заказа.',
    'Jarayon': 'Процесс', 'O‘lchovdan o‘rnatishgacha': 'От замера до установки', 'O‘lchov': 'Замер', 'Dizayn': 'Дизайн', 'Ishlab chiqarish': 'Производство', 'Sifat nazorati': 'Контроль качества', 'O‘rnatish': 'Установка',
    'Eshik o‘lchamlari aniqlanadi.': 'Определяются размеры двери.', 'Model va rang tanlanadi.': 'Выбираются модель и цвет.', 'MDF eshik tayyorlanadi.': 'Изготавливается MDF дверь.', 'Har bir eshik tekshiriladi.': 'Каждая дверь проверяется.', 'Eshik joyiga o‘rnatiladi.': 'Дверь устанавливается на место.',
    'Ko‘p so‘raladigan savollar': 'Частые вопросы', 'FAQ': 'FAQ',
    'Uyingiz uchun ideal MDF eshikni tanlang': 'Выберите идеальную MDF дверь для вашего дома', 'YasinDoors bilan makoningizga zamonaviy ko‘rinish bering.': 'Придайте вашему дому современный вид вместе с YasinDoors.', 'Biz bilan bog‘lanish': 'Связаться с нами',
    'Zamonaviy MDF eshiklar ': 'Современные MDF двери', 'Footer menyusi': 'Меню футера',
    'Zamonaviy va klassik MDF eshiklar kolleksiyasi.': 'Коллекция современных и классических MDF дверей.', 'MDF eshik qidirish': 'Поиск MDF двери', 'MDF eshik qidirish...': 'Поиск MDF двери...',
    'Tavsiya etilgan': 'Рекомендуемые', 'Narx: pastdan yuqoriga': 'Цена: по возрастанию', 'Narx: yuqoridan pastga': 'Цена: по убыванию', 'A-Z': 'А-Я', 'Z-A': 'Я-А', 'Saralash': 'Сортировка', 'Filterlar': 'Фильтры',
    'Chegirmali ': 'Со скидкой', 'Classic': 'Classic', 'Modern': 'Modern', 'Minimal': 'Minimal', 'Wood': 'Дерево', 'White': 'Белые', 'Black': 'Чёрные',
    'Barcha ranglar': 'Все цвета', 'Barcha uslublar': 'Все стили', 'Narx dan (so‘m)': 'Цена от (сум)', 'Narx gacha (so‘m)': 'Цена до (сум)', 'Filtrni tozalash': 'Сбросить фильтры',
    'Mahsulot topilmadi': 'Ничего не найдено', 'Boshqa so‘z yoki filtrni sinab ko‘ring.': 'Попробуйте другое слово или фильтр.', 'Katalogga o‘tish': 'Перейти в каталог', 'Katalogga qaytish': 'Вернуться в каталог',
    'Savatga': 'В корзину', 'Savatga qo‘shish': 'Добавить в корзину', 'Batafsil': 'Подробнее', 'Tezkor ko‘rish': 'Быстрый просмотр', 'To‘liq sahifa': 'Полная страница', 'Aksiya': 'Акция', 'Yopish': 'Закрыть',
    'Solishtirish': 'Сравнить', 'Tozalash': 'Очистить', 'Mahsulotlarni solishtirish': 'Сравнение товаров', 'Rasm': 'Фото', 'Narx': 'Цена', 'Material': 'Материал', 'Mavjudligi': 'Наличие', 'Mavjud': 'В наличии', 'Buyurtma asosida': 'Под заказ',
    'Sizning savatingiz': 'Ваша корзина', 'Tanlangan MDF eshiklar shu yerda saqlanadi.': 'Выбранные MDF двери сохраняются здесь.', 'Savatingiz bo‘sh': 'Ваша корзина пуста', 'Katalogdan o‘zingizga mos MDF eshikni tanlang.': 'Выберите подходящую MDF дверь в каталоге.',
    'Buyurtma xulosasi': 'Итог заказа', 'Yetkazib berish:': 'Доставка:', 'Bepul': 'Бесплатно', 'Jami:': 'Итого:', 'Zakaz berish': 'Оформить заказ',
    'Sevimli mahsulotlar hozircha yo‘q': 'Избранных товаров пока нет', 'O‘zingizga yoqqan eshiklarni saqlab qo‘ying.': 'Сохраняйте понравившиеся двери.',
    'Ism': 'Имя', 'Telefon raqam': 'Номер телефона', 'Telefon': 'Телефон', 'Manzil': 'Адрес', 'Qo‘shimcha izoh': 'Комментарий', 'Zakazni yuborish': 'Отправить заказ', 'Yuborilmoqda…': 'Отправка…', 'Qayta urinish': 'Повторить',
    'Zakaz qabul qilindi': 'Заказ принят', 'Tez orada siz bilan bog‘lanamiz.': 'Мы скоро свяжемся с вами.', 'Zakaz raqami': 'Номер заказа',
    'Zakaz yuborilmadi. Iltimos, qaytadan urinib ko‘ring.': 'Заказ не отправлен. Попробуйте ещё раз.', 'Ismingizni kiriting.': 'Введите имя.', 'Manzilni kiriting.': 'Введите адрес.',
    'Telefon raqamni to‘g‘ri kiriting. Masalan: +998 90 123 45 67': 'Введите номер правильно. Например: +998 90 123 45 67', 'Xabar kamida 10 ta belgidan iborat bo‘lsin.': 'Сообщение — не менее 10 символов.',
    'Narxlar yangilangan. Sahifani yangilab, savatni qayta tekshiring.': 'Цены обновились. Проверьте корзину ещё раз.',
    'Siz bilan bog‘lanishni istaymiz': 'Мы хотим связаться с вами', 'Savollaringiz bo‘lsa yoki eshik tanlashda yordam kerak bo‘lsa, bizga yozing.': 'Если есть вопросы или нужна помощь с выбором двери — напишите нам.',
    'Bog‘laning': 'Свяжитесь с нами', 'Xabar yuborish': 'Отправить сообщение', 'Xabar': 'Сообщение', 'Ish vaqti': 'Часы работы', 'Telegram orqali yozing': 'Написать в Telegram', 'Qo‘ng‘iroq qilish': 'Позвонить',
    'Xabaringiz qabul qilindi!': 'Сообщение получено!', 'Xabar yuborilmadi. Qaytadan urinib ko‘ring.': 'Сообщение не отправлено. Попробуйте ещё раз.',
    'Aloqa ma’lumotlari tez orada qo‘shiladi. Hozircha xabar qoldirishingiz mumkin.': 'Контактные данные скоро появятся. Пока вы можете оставить сообщение.',
    'Mahsulot savatga qo‘shildi': 'Товар добавлен в корзину', 'Mahsulot savatdan olib tashlandi': 'Товар удалён из корзины', 'Sevimlilarga qo‘shildi': 'Добавлено в избранное', 'Mahsulot sevimlilardan olib tashlandi': 'Удалено из избранного',
    'Eng ko‘pi bilan 3 ta mahsulotni solishtirish mumkin': 'Можно сравнить не более 3 товаров', 'Sevimlilarga qo‘shish': 'В избранное', 'Sevimlilarda': 'В избранном',
    'Sahifa topilmadi': 'Страница не найдена', 'Siz izlagan sahifa mavjud emas yoki ko‘chirilgan.': 'Такой страницы нет или она перемещена.', 'Bosh sahifaga qaytish': 'Вернуться на главную',
    'Mahsulot topilmadi.': 'Товар не найден.', 'O‘xshash eshiklar': 'Похожие двери', 'Rasmni kattalashtirish': 'Увеличить фото', 'Dark rejimga o‘tish': 'Тёмная тема', 'Light rejimga o‘tish': 'Светлая тема',
    'Yuqoriga qaytish': 'Наверх', 'Telegram orqali bog‘lanish': 'Связаться через Telegram', 'Sahifa yuklanmadi. Internetni tekshirib, qayta urinib ko‘ring.': 'Страница не загрузилась. Проверьте интернет.',
    'Biz haqimizda ': 'О нас', 'YasinDoors — faqat MDF eshiklarga ixtisoslashgan kompaniya.': 'YasinDoors — компания, специализирующаяся только на MDF дверях.', 'Faqat MDF eshiklar': 'Только MDF двери',
    'Katalogni ko‘rish': 'Смотреть каталог', 'MDF sifati va dizayn': 'Качество MDF и дизайн', 'Ishlab chiqarish jarayoni': 'Процесс производства', 'Material va dizayn': 'Материал и дизайн',
    'Buyurtmani qanday beraman?': 'Как оформить заказ?'
  };
  const t = k => (LANG === 'ru' && RU[k]) || k;
  function translateDom(rootEl) { // ruscha rejimda statik va dinamik matnlarni almashtiradi
    if (LANG !== 'ru') return;
    const w = document.createTreeWalker(rootEl, NodeFilter.SHOW_TEXT); let n;
    while ((n = w.nextNode())) { const v = n.nodeValue.trim(); if (v && RU[v]) n.nodeValue = n.nodeValue.replace(v, RU[v]); }
    rootEl.querySelectorAll('[aria-label],[placeholder],[alt],[title]').forEach(el => ['aria-label', 'placeholder', 'alt', 'title'].forEach(a => { const v = el.getAttribute(a); if (v && RU[v]) el.setAttribute(a, RU[v]); }));
  }

  /* ---------- 2. SVG ikonlar (bir xil stroke va o‘lcham) ---------- */
  const I = d => `<svg class="i" viewBox="0 0 24 24" aria-hidden="true">${d}</svg>`;
  const ICON = {
    heart: I('<path d="M12 20.5s-7.5-4.6-9.2-9.4C1.6 7.8 3.6 4.5 7 4.5c2 0 3.7 1.1 5 3 1.3-1.9 3-3 5-3 3.4 0 5.4 3.3 4.2 6.6-1.7 4.8-9.2 9.4-9.2 9.4z"/>'),
    bag: I('<path d="M5 8h14l-1 12H6L5 8z"/><path d="M9 8V6.5a3 3 0 016 0V8"/>'),
    search: I('<circle cx="11" cy="11" r="6.5"/><path d="M20 20l-4.2-4.2"/>'),
    x: I('<path d="M6 6l12 12M18 6L6 18"/>'), arrow: I('<path d="M5 12h14M13 6l6 6-6 6"/>'), down: I('<path d="M12 5v14M6 13l6 6 6-6"/>'), up: I('<path d="M12 19V5M6 11l6-6 6 6"/>'), zoom: I('<circle cx="11" cy="11" r="6.5"/><path d="M20 20l-4.2-4.2M11 8v6M8 11h6"/>'),
    pin: I('<path d="M12 21s7-6.2 7-11.5A7 7 0 005 9.5C5 14.8 12 21 12 21z"/><circle cx="12" cy="9.5" r="2.5"/>'),
    phone: I('<path d="M5 4h4l2 5-2.5 1.5a11 11 0 005 5L15 13l5 2v4a2 2 0 01-2 2A15 15 0 013 6a2 2 0 012-2z"/>'),
    clock: I('<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>'), mail: I('<rect x="3" y="5" width="18" height="14" rx="2"/><path d="M3 7l9 6 9-6"/>'),
    check: I('<circle cx="12" cy="12" r="9"/><path d="M8 12.5l2.7 2.7L16 9.5"/>'),
    sun: I('<circle cx="12" cy="12" r="4"/><path d="M12 3v2M12 19v2M3 12h2M19 12h2M5.6 5.6L7 7M17 17l1.4 1.4M18.4 5.6L17 7M7 17l-1.4 1.4"/>'),
    moon: I('<path d="M20 14.5A8 8 0 019.5 4 8 8 0 1020 14.5z"/>'),
    layers: I('<path d="M12 3l9 5-9 5-9-5 9-5z"/><path d="M3 13l9 5 9-5"/>'), award: I('<circle cx="12" cy="9" r="6"/><path d="M8.5 14L7 21l5-3 5 3-1.5-7"/>'),
    cal: I('<rect x="3" y="5" width="18" height="16" rx="2"/><path d="M3 10h18M8 3v4M16 3v4"/>'), pen: I('<path d="M4 20l1-4L16 5l3 3L8 19l-4 1z"/>'),
    ruler: I('<path d="M3 17L17 3l4 4L7 21l-4-4z"/><path d="M8 12l2 2M11 9l2 2M14 6l2 2"/>'), factory: I('<path d="M3 20V9l6 3V9l6 3V5h6v15H3z"/>'),
    shield: I('<path d="M12 3l8 3v6c0 5-3.4 8.3-8 9-4.6-.7-8-4-8-9V6l8-3z"/><path d="M8.5 12l2.5 2.5 4.5-5"/>'),
    door: I('<rect x="6" y="3" width="12" height="18" rx="1.5"/><circle cx="15" cy="12" r=".8"/><path d="M3 21h18"/>'),
    eye: I('<path d="M2 12s3.6-7 10-7 10 7 10 7-3.6 7-10 7S2 12 2 12z"/><circle cx="12" cy="12" r="3"/>'),
    plus: I('<path d="M12 5v14M5 12h14"/>'), minus: I('<path d="M5 12h14"/>'),
    trash: I('<path d="M4 7h16M10 11v6M14 11v6M6 7l1 13h10l1-13M9 7V4h6v3"/>'),
    insta: I('<rect x="3" y="3" width="18" height="18" rx="5"/><circle cx="12" cy="12" r="4"/><circle cx="17.3" cy="6.7" r=".6"/>'),
    tg: I('<path d="M21 4L3 11l6 2 2 6 3-4 5 4z"/><path d="M9 13l12-9"/>'), grid: I('<rect x="4" y="4" width="7" height="7" rx="1.5"/><rect x="13" y="4" width="7" height="7" rx="1.5"/><rect x="4" y="13" width="7" height="7" rx="1.5"/><rect x="13" y="13" width="7" height="7" rx="1.5"/>'),
    home: I('<path d="M4 11l8-7 8 7v9H4v-9z"/><path d="M10 20v-6h4v6"/>'),
    compare: I('<path d="M8 4v16M16 4v16M4 8l4-4 4 4M12 16l4 4 4-4"/>'),
    tag: I('<path d="M3 12V4h8l10 10-8 8L3 12z"/><circle cx="7.5" cy="8.5" r="1"/>'),
    help: I('<circle cx="12" cy="12" r="9"/><path d="M9.5 9.5a2.5 2.5 0 114 2c-.9.6-1.5 1.1-1.5 2.2M12 17h.01"/>'),
    list: I('<path d="M8 6h12M8 12h12M8 18h12M4 6h.01M4 12h.01M4 18h.01"/>')
  };

  /* ---------- 3. Yordamchilar va saqlash ---------- */
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const find = id => PRODUCTS.find(p => p.id === +id);
  const money = n => n.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ' ') + ' so‘m';
  const store = {
    get(k, d) { try { const v = JSON.parse(localStorage.getItem(k)); return v ?? d; } catch { return d; } },
    set(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch { /* storage mavjud emas */ } }
  };
  const root = document.documentElement, page = document.body.dataset.page;
  const savedCart = store.get('cart', {}), savedFavs = store.get('favorites', []), savedCmp = store.get('compare', []);
  let cart = Object.fromEntries(Object.entries(savedCart && typeof savedCart === 'object' ? savedCart : {}).filter(([id, q]) => find(id) && Number.isInteger(q) && q > 0));
  let favs = Array.isArray(savedFavs) ? savedFavs.filter(find) : [];
  let cmp = Array.isArray(savedCmp) ? savedCmp.filter(find).slice(0, 3) : [];
  const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

  /* ---------- 4. Realistik eshik sahnasi (SVG: devor, pol, yorug‘lik, yog‘och teksturasi) ---------- */
  const scenes = {};
  function doorImg(p) {
    if (p.image) return p.image;
    if (scenes[p.id]) return scenes[p.id];
    const wood = p.color === 'yogoch' || p.color === 'jigarrang', hl = 'rgba(255,255,255,.3)', sh = 'rgba(0,0,0,.3)';
    const bevel = (x, y, w, h) => `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="2" fill="${p.edge}" opacity=".3"/><path d="M${x} ${y + h}V${y}H${x + w}" fill="none" stroke="${hl}" stroke-width="2"/><path d="M${x + w} ${y}V${y + h}H${x}" fill="none" stroke="${sh}" stroke-width="2"/>`;
    const groove = x => `<path d="M${x} 70V366" stroke="${sh}" stroke-width="2"/><path d="M${x + 2} 70V366" stroke="${hl}" stroke-width="1.5"/>`;
    const detail = p.style === 'classic' ? bevel(134, 76, 60, 124) + bevel(206, 76, 60, 124) + bevel(134, 218, 60, 130) + bevel(206, 218, 60, 130)
      : (p.tags.includes('minimal') ? groove(200) : [150, 175, 200, 225, 250].map(groove).join(''));
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 500" preserveAspectRatio="xMidYMid slice"><defs>
<linearGradient id="w" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#f1ede6"/><stop offset="1" stop-color="#ddd6ca"/></linearGradient>
<linearGradient id="f" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#ad987b"/><stop offset="1" stop-color="#6c5c48"/></linearGradient>
<linearGradient id="s" x1="0" x2="1"><stop offset="0" stop-color="#fff" stop-opacity=".22"/><stop offset=".5" stop-color="#fff" stop-opacity="0"/><stop offset="1" stop-color="#000" stop-opacity=".18"/></linearGradient>
<linearGradient id="m" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#f6f6f6"/><stop offset=".5" stop-color="#9c9c9c"/><stop offset="1" stop-color="#e4e4e4"/></linearGradient>
<linearGradient id="l" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#fff" stop-opacity=".55"/><stop offset="1" stop-color="#fff" stop-opacity="0"/></linearGradient>
<filter id="g" x="0" y="0" width="100%" height="100%"><feTurbulence type="fractalNoise" baseFrequency="${wood ? '.012 .3' : '.6'}" numOctaves="3" seed="${p.id}"/><feColorMatrix values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 1.1 -.42"/></filter>
<filter id="b" x="-20%" y="-50%" width="140%" height="200%"><feGaussianBlur stdDeviation="6"/></filter></defs>
<rect width="400" height="500" fill="url(#w)"/><rect y="380" width="400" height="120" fill="url(#f)"/>
<rect y="364" width="400" height="16" fill="#f7f4ef"/><rect y="378" width="400" height="2" fill="#000" opacity=".16"/>
<polygon points="116,380 284,380 372,500 28,500" fill="url(#l)" opacity=".32"/>
<rect x="298" y="46" width="44" height="336" fill="#000" opacity=".18" filter="url(#b)"/>
<rect x="100" y="40" width="200" height="340" fill="#f3efe9"/><rect x="100" y="40" width="200" height="340" fill="none" stroke="#000" stroke-opacity=".12"/>
<rect x="116" y="56" width="168" height="324" fill="${p.hex}"/><rect x="116" y="56" width="168" height="324" filter="url(#g)" opacity="${wood ? .4 : .1}"/>
${detail}<rect x="116" y="56" width="168" height="324" fill="url(#s)"/>
<path d="M116 56H196L150 380H116z" fill="url(#l)" opacity=".16"/>
<rect x="236" y="213" width="40" height="7" rx="3.5" fill="url(#m)" stroke="#777" stroke-width=".6"/><circle cx="270" cy="216" r="11" fill="url(#m)" stroke="#777" stroke-width=".6"/>
<ellipse cx="200" cy="384" rx="112" ry="6" fill="#000" opacity=".32" filter="url(#b)"/></svg>`;
    return (scenes[p.id] = 'data:image/svg+xml;utf8,' + encodeURIComponent(svg));
  }
  const img = (p, lazy = true) => `<img src="${doorImg(p)}" alt="${p.name} — ${p.colorName.toLowerCase()} ${p.styleName} MDF eshik" width="400" height="500"${lazy ? ' loading="lazy"' : ''} decoding="async">`;

  /* ---------- 5. Umumiy qismlar: header, tabbar, footer, CTA, toast, modal ---------- */
  const counter = (k, cls = 'badge') => `<span class="${cls}" data-count="${k}">0</span>`;
  const telHref = p => 'tel:' + String(p).replace(/[^+\d]/g, '');
  const socials = () => { // faqat admin panelda kiritilgan haqiqiy havolalar ko‘rsatiladi
    const c = CONTENT.contacts || {}, a = [];
    if (c.instagram) a.push(`<a href="${esc(c.instagram)}" target="_blank" rel="noopener" aria-label="Instagram">${ICON.insta}</a>`);
    if (c.telegram) a.push(`<a href="${esc(c.telegram)}" target="_blank" rel="noopener" aria-label="Telegram">${ICON.tg}</a>`);
    if (c.phone) a.push(`<a href="${esc(telHref(c.phone))}" aria-label="Qo‘ng‘iroq qilish: ${esc(c.phone)}">${ICON.phone}</a>`);
    return a.length ? `<div class="social">${a.join('')}</div>` : '';
  };
  function renderPromo() { // admin paneldan boshqariladigan banner
    const p = CONTENT.promo, el = $('#promoBar'); if (!el) return;
    if (!p || !p.enabled || !p.text) { el.hidden = true; return; }
    el.hidden = false; el.innerHTML = `<div class="container promo__in"><span>${ICON.tag}${esc(p.text)}</span>${p.link ? `<a href="${esc(p.link)}">${esc(p.linkText || 'Batafsil')} ${ICON.arrow}</a>` : ''}</div>`;
  }
  function applyContent() { // [data-content="hero.title"] kabi joylarga matn qo‘yadi
    $$('[data-content]').forEach(el => { const [g, k] = el.dataset.content.split('.'), v = CONTENT[g] && CONTENT[g][k]; if (v) el.textContent = v; });
  }
  function renderLayout() {
    const links = NAV.map(([h, t, k]) => `<li><a href="${h}"${page === k ? ' class="active" aria-current="page"' : ''}>${t}</a></li>`).join('');
    $('#site-header').innerHTML = `<div class="container header__in">
      <a href="index.html" class="logo" aria-label="YasinDoors — bosh sahifa">${ICON.door}<span class="logo__t"><b>YASIN</b><i>DOORS</i></span></a>
      <nav class="nav" id="nav" aria-label="Asosiy menyu"><ul>${links}
        <li class="only-m"><a href="favorites.html">${ICON.heart}Sevimlilar ${counter('fav', 'count')}</a></li>
        <li class="only-m"><a href="cart.html">${ICON.bag}Savat ${counter('cart', 'count')}</a></li></ul></nav>
      <div class="actions">
        <a href="doors.html?focus=search" class="ibtn" data-act="search" aria-label="MDF eshik qidirish">${ICON.search}</a>
        <a href="favorites.html" class="ibtn hm" aria-label="Sevimlilar">${ICON.heart}${counter('fav')}</a>
        <a href="cart.html" class="ibtn hm" aria-label="Savat">${ICON.bag}${counter('cart')}</a>
        <button class="ibtn lang" data-act="lang" aria-label="${LANG === 'ru' ? 'Til: русский. O‘zbekchaga o‘tish' : 'Til: o‘zbekcha. Русский'}">${LANG === 'ru' ? 'RU' : 'UZ'}</button>
        <button class="ibtn" data-act="theme" id="themeBtn" aria-label="Dark / Light rejimni almashtirish"><span class="t-sun">${ICON.sun}</span><span class="t-moon">${ICON.moon}</span></button>
        <button class="ibtn burger" id="burger" aria-label="Menyuni ochish" aria-expanded="false" aria-controls="nav"><span></span><span></span><span></span></button>
      </div></div>`;
    const foot = [['index.html', 'Bosh sahifa'], ...NAV.slice(1).map(([h, t]) => [h, t]), ['cart.html', 'Savat'], ['favorites.html', 'Sevimlilar']].map(([h, t]) => `<li><a href="${h}">${t}</a></li>`).join('');
    $('#site-footer').innerHTML = `<div class="container"><div class="footer__in">
      <div><a href="index.html" class="logo" aria-label="YasinDoors — bosh sahifa">${ICON.door}<span class="logo__t"><b>YASIN</b><i>DOORS</i></span></a><p>Zamonaviy MDF eshiklar</p>
        ${socials()}</div>
      <nav aria-label="Footer menyusi"><ul>${foot}</ul></nav></div><small>© 2026 YasinDoors</small></div>`;
    const cta = $('#site-cta');
    if (cta) cta.innerHTML = `<div class="container reveal"><h2>Uyingiz uchun ideal MDF eshikni tanlang</h2><p>YasinDoors bilan makoningizga zamonaviy ko‘rinish bering.</p><a href="contact.html" class="btn btn--p">Biz bilan bog‘lanish ${ICON.arrow}</a></div>`;
    const tab = (h, ic, t, k, c) => `<a href="${h}"${page === k ? ' class="active" aria-current="page"' : ''}>${ICON[ic]}<span>${t}</span>${c ? counter(c) : ''}</a>`;
    document.body.insertAdjacentHTML('beforeend', `<nav class="tabbar" aria-label="Tezkor menyu">${tab('index.html', 'home', 'Asosiy', 'home')}${tab('doors.html', 'grid', 'Katalog', 'doors')}${tab('favorites.html', 'heart', 'Sevimli', 'favorites', 'fav')}${tab('cart.html', 'bag', 'Savat', 'cart', 'cart')}</nav>
      <div class="cmpbar" id="cmpBar" hidden></div>
      <div class="progress" id="progress"></div><div class="toasts" id="toasts" role="status" aria-live="polite"></div>
      <div class="modal" id="modal" role="dialog" aria-modal="true" aria-label="Mahsulot tafsilotlari"><div class="modal__box" id="modalBox"></div></div>`);
    $$('[data-icon]').forEach(el => { el.innerHTML = ICON[el.dataset.icon] || ''; });
    if (!$('#promoBar')) $('#site-header').insertAdjacentHTML('beforebegin', '<div class="promo" id="promoBar" hidden></div>');
    const c = CONTENT.contacts || {};
    document.body.insertAdjacentHTML('beforeend', `<div class="fabs">${c.telegram ? `<a class="fab tg" href="${esc(c.telegram)}" target="_blank" rel="noopener" aria-label="Telegram orqali bog‘lanish">${ICON.tg}</a>` : ''}
      <button class="fab totop" id="toTop" data-act="top" aria-label="Yuqoriga qaytish">${ICON.up}</button></div>`);
    renderPromo(); applyContent();
  }

  /* ---------- 6. Dark / Light, toast ---------- */
  function applyTheme(t, save) {
    root.dataset.theme = t;
    if (save) { try { localStorage.setItem('theme', t); } catch { /* ignore */ } }
    $('#themeBtn').setAttribute('aria-label', t === 'dark' ? 'Light rejimga o‘tish' : 'Dark rejimga o‘tish');
  }
  const toggleTheme = () => applyTheme(root.dataset.theme === 'dark' ? 'light' : 'dark', true);
  function toast(msg) {
    const el = document.createElement('div');
    el.className = 'toast'; el.innerHTML = ICON.check + '<span></span>'; $('span', el).textContent = msg;
    $('#toasts').appendChild(el);
    setTimeout(() => { el.classList.add('out'); setTimeout(() => el.remove(), 300); }, 2300);
  }

  /* ---------- 7. Savat va sevimlilar ---------- */
  const cartCount = () => Object.values(cart).reduce((a, b) => a + b, 0);
  function totals() {
    const sub = Object.keys(cart).reduce((s, id) => s + find(id).price * cart[id], 0);
    const fee = sub && sub < DELIVERY.freeFrom ? DELIVERY.fee : 0;
    return { sub, fee, total: sub + fee };
  }
  function updateCounts() {
    $$('[data-count="cart"]').forEach(e => { e.textContent = cartCount(); });
    $$('[data-count="fav"]').forEach(e => { e.textContent = favs.length; });
  }
  function commit() { store.set('cart', cart); store.set('favorites', favs); store.set('compare', cmp); updateCounts(); renderPage(); syncModal(); renderCmpBar(); }
  function toggleCmp(id) {
    if (cmp.includes(id)) cmp = cmp.filter(x => x !== id);
    else if (cmp.length >= 3) return toast('Eng ko‘pi bilan 3 ta mahsulotni solishtirish mumkin');
    else cmp = [...cmp, id];
    commit();
  }
  function renderCmpBar() {
    const bar = $('#cmpBar'); if (!bar) return;
    bar.hidden = !cmp.length; if (!cmp.length) return;
    bar.innerHTML = `<div class="container cmpbar__in"><span>${ICON.compare}<b>${cmp.length}</b> ta tanlandi</span>
      <span class="cmpbar__a"><button class="btn btn--p btn--sm" data-act="cmpopen"${cmp.length < 2 ? ' disabled' : ''}>${t('Solishtirish')}</button><button class="btn btn--o btn--sm" data-act="cmpclear" aria-label="Tanlovni tozalash">Tozalash</button></span></div>`;
  }
  function openCompare() {
    const list = cmp.map(find).filter(Boolean); if (list.length < 2) return;
    lastFocus = document.activeElement; modalId = null; boxClass('cmp');
    const row = (label, f) => `<tr><th scope="row">${label}</th>${list.map(p => `<td>${f(p)}</td>`).join('')}</tr>`;
    $('#modalBox').innerHTML = `<button class="modal__x" data-act="close" aria-label="Yopish">${ICON.x}</button><div class="cmpwrap"><h2>Mahsulotlarni solishtirish</h2><div class="tscroll"><table class="cmpt"><thead><tr><td></td>${list.map(p => `<th scope="col"><a href="product.html?id=${p.id}">${esc(p.name)}</a><button class="rm" data-act="cmprm" data-id="${p.id}" aria-label="Olib tashlash: ${esc(p.name)}">${ICON.x}</button></th>`).join('')}</tr></thead><tbody>
      ${row('Rasm', p => `<div class="cmpimg">${img(p, false)}</div>`)}${row('Narx', p => `<b>${money(p.price)}</b>${p.old ? `<br><s>${money(p.old)}</s>` : ''}`)}${row('Uslub', p => esc(p.styleName))}${row('Rang', p => esc(p.colorName))}${row('Material', p => esc(p.material))}${row('Mavjudligi', p => p.stock ? 'Mavjud' : 'Buyurtma asosida')}
      ${row('', p => `<button class="btn btn--p btn--sm" data-act="cart" data-id="${p.id}">${ICON.bag}Savatga</button>`)}</tbody></table></div></div>`;
    openBox();
  }
  function addCart(id, n = 1) { cart[id] = (cart[id] || 0) + n; commit(); toast('Mahsulot savatga qo‘shildi'); }
  function setQty(id, d) { cart[id] = (cart[id] || 0) + d; if (cart[id] <= 0) delete cart[id]; commit(); }
  function removeCart(id) { delete cart[id]; commit(); toast('Mahsulot savatdan olib tashlandi'); }
  function toggleFav(id) {
    const on = favs.includes(id);
    favs = on ? favs.filter(x => x !== id) : [...favs, id];
    commit(); toast(on ? 'Mahsulot sevimlilardan olib tashlandi' : 'Sevimlilarga qo‘shildi');
    if (!on) $$(`.fav[data-act="fav"][data-id="${id}"]`).forEach(b => {
      b.classList.add('pop');
      for (let k = 0; k < 6; k++) { const s = document.createElement('i'); s.className = 'spark'; s.style.setProperty('--a', k * 60 + 'deg'); b.appendChild(s); setTimeout(() => s.remove(), 600); }
    });
  }

  /* ---------- 8. Sahifalarni chizish ---------- */
  const priceHtml = p => `${money(p.price)}${p.old ? `<s>${money(p.old)}</s>` : ''}${p.discountPercent ? `<span class="disc">−${p.discountPercent}%</span>` : ''}`;
  const card = p => {
    const fav = favs.includes(p.id), inCmp = cmp.includes(p.id), bd = p.badge || (p.discountPercent ? 'sale' : '');
    return `<article class="card reveal in"><div class="card__img">${img(p)}${bd ? `<span class="pbadge pbadge--${bd}">${bd === 'sale' && p.discountPercent ? 'Aksiya' : BADGES[bd]}</span>` : ''}
      <button class="fav" data-act="fav" data-id="${p.id}" aria-pressed="${fav}" aria-label="${fav ? 'Sevimlilardan olib tashlash' : 'Sevimlilarga qo‘shish'}: ${p.name}">${ICON.heart}</button>
      <button class="fav cmpb" data-act="cmp" data-id="${p.id}" aria-pressed="${inCmp}" aria-label="${inCmp ? 'Solishtirishdan olib tashlash' : 'Solishtirishga qo‘shish'}: ${p.name}">${ICON.compare}</button>
      <div class="card__ov"><button class="btn btn--glass btn--sm" data-act="details" data-id="${p.id}" aria-label="Tezkor ko‘rish: ${p.name}">${ICON.eye}Tezkor ko‘rish</button></div></div>
      <div class="card__body"><span class="tag">${p.styleName} · ${p.colorName}</span><h3><a href="product.html?id=${p.id}">${p.name}</a></h3><p>${p.desc}</p>
        <div class="price">${priceHtml(p)}</div>
        <div class="card__act"><button class="btn btn--p btn--sm" data-act="cart" data-id="${p.id}" aria-label="Savatga qo‘shish: ${p.name}">${ICON.bag}Savatga</button>
        <button class="btn btn--o btn--sm touch" data-act="details" data-id="${p.id}" aria-label="Batafsil: ${p.name}">Batafsil</button></div></div></article>`;
  };
  const emptyBox = (ic, title, text) => `<div class="empty">${ICON[ic]}<h3>${title}</h3><p>${text}</p><a class="btn btn--p" href="doors.html">Katalogga o‘tish</a></div>`;
  const view = { f: 'all', q: '', sort: 'rec', min: null, max: null, color: '', style: '' };
  const sorts = { asc: (a, b) => a.price - b.price, desc: (a, b) => b.price - a.price, az: (a, b) => a.name.localeCompare(b.name), za: (a, b) => b.name.localeCompare(a.name) };
  function renderDoors() {
    const q = view.q.trim().toLowerCase();
    let list = PRODUCTS.filter(p => matches(p, view.f) && (!view.color || p.color === view.color) && (!view.style || p.style === view.style) && (view.min === null || p.price >= view.min) && (view.max === null || p.price <= view.max) &&
      (!q || `${p.name} ${p.desc} ${p.tags} ${p.colorName} ${p.styleName} ${p.material}`.toLowerCase().includes(q)));
    if (sorts[view.sort]) list = [...list].sort(sorts[view.sort]);
    $('#doorsGrid').innerHTML = list.length ? list.map(card).join('') : `<div class="empty">${ICON.search}<h3>Mahsulot topilmadi</h3><p>Boshqa so‘z yoki filtrni sinab ko‘ring.</p></div>`;
    $('#resCount').textContent = `${list.length} / ${PRODUCTS.length}`;
  }
  function renderCart() {
    const items = Object.keys(cart).map(id => ({ p: find(id), q: cart[id] })), t = totals();
    $('#cartRoot').innerHTML = items.length ? `<div class="cart"><div>${items.map(({ p, q }) => `<div class="row">${img(p)}
      <div><h3>${p.name}</h3><p>${money(p.price)}${p.discountPercent ? ` · aksiya −${p.discountPercent}%` : ''}</p></div>
      <div class="qty"><button data-act="minus" data-id="${p.id}" aria-label="Kamaytirish: ${p.name}">${ICON.minus}</button><span aria-live="polite">${q}</span><button data-act="plus" data-id="${p.id}" aria-label="Ko‘paytirish: ${p.name}">${ICON.plus}</button></div>
      <div class="sub">${money(p.price * q)}</div>
      <button class="rm" data-act="remove" data-id="${p.id}" aria-label="O‘chirish: ${p.name}">${ICON.trash}</button></div>`).join('')}</div>
      <aside class="sum"><h3>Buyurtma xulosasi</h3><dl><dt>Mahsulotlar (${cartCount()} ta):</dt><dd>${money(t.sub)}</dd></dl>
      <dl><dt>Yetkazib berish:</dt><dd>${t.fee ? money(t.fee) : 'Bepul'}</dd></dl><dl class="total"><dt>Jami:</dt><dd>${money(t.total)}</dd></dl>
      <button class="btn btn--p" data-act="checkout">Zakaz berish ${ICON.arrow}</button></aside></div>` :
      emptyBox('bag', 'Savatingiz bo‘sh', 'Katalogdan o‘zingizga mos MDF eshikni tanlang.');
  }
  /* --- bosh sahifa: bo‘limlar, ranglar, konstruktor, FAQ --- */
  const HOME_TABS = [['popular', 'Mashhur', p => p.badge === 'best' || p.badge === 'premium'], ['new', 'Yangi', p => p.badge === 'new'], ['sale', 'Chegirmali', p => !!(p.discountPercent || p.old)], ['all', 'Barchasi', () => true]];
  let homeTab = null;
  function renderHome() {
    const tabs = HOME_TABS.filter(([k, , f]) => k === 'all' || PRODUCTS.some(f));
    if (!homeTab || !tabs.some(x => x[0] === homeTab)) homeTab = tabs[0][0];
    $('#homeTabs').innerHTML = tabs.map(([k, n]) => `<button class="chip" data-act="htab" data-k="${k}" aria-pressed="${k === homeTab}">${n}</button>`).join('');
    const f = HOME_TABS.find(x => x[0] === homeTab)[2], list = PRODUCTS.filter(f).slice(0, 6);
    $('#featured').innerHTML = list.length ? list.map(card).join('') : `<div class="empty">${ICON.search}<h3>Mahsulot topilmadi</h3></div>`;
    const cols = [...new Map(PRODUCTS.map(p => [p.color, p])).values()];
    $('#colorsSec').hidden = !cols.length;
    $('#swatches').innerHTML = cols.map(p => `<a class="sw" href="doors.html?f=${encodeURIComponent(p.color)}"><i style="background:${esc(p.hex)}"></i>${esc(p.colorName)}</a>`).join('');
    const faq = (CONTENT.faq || []).filter(x => x.q && x.a);
    $('#faqSec').hidden = !faq.length;
    $('#faqList').innerHTML = faq.map(x => `<details><summary>${esc(x.q)}</summary><p>${esc(x.a)}</p></details>`).join('');
  }
  /* --- konstruktor: uslub -> rang -> model + o‘lcham; tanlov buyurtma izohiga yoziladi --- */
  const cfg = { style: '', color: '', id: 0, w: '', h: '' };
  function cfgPool() { return PRODUCTS.filter(p => (!cfg.style || p.style === cfg.style) && (!cfg.color || p.color === cfg.color)); }
  function renderConfig() {
    const box = $('#cfgRoot'); if (!box) return;
    $('#config').hidden = !PRODUCTS.length;
    const styles = [...new Map(PRODUCTS.map(p => [p.style, p.styleName])).entries()], colors = [...new Map(PRODUCTS.map(p => [p.color, p])).values()];
    const pool = cfgPool(); if (!pool.some(p => p.id === cfg.id)) cfg.id = pool[0] ? pool[0].id : 0;
    const sel = find(cfg.id), wOk = +cfg.w >= SIZE.wMin && +cfg.w <= SIZE.wMax, hOk = +cfg.h >= SIZE.hMin && +cfg.h <= SIZE.hMax, sizeOk = wOk && hOk;
    const opt = (act, key, val, label, extra = '') => `<button class="opt" type="button" data-act="${act}" data-k="${esc(val)}" aria-pressed="${cfg[key] === val}">${extra}${esc(label)}</button>`;
    box.innerHTML = `<div class="cfg__vis">${sel ? img(sel, false) : ''}</div><div class="cfg__f">
      <div><h3>Uslub</h3><div class="opts">${opt('cfs', 'style', '', 'Barchasi')}${styles.map(([k, n]) => opt('cfs', 'style', k, n)).join('')}</div></div>
      <div><h3>Rang</h3><div class="opts">${opt('cfc', 'color', '', 'Barchasi')}${colors.map(p => opt('cfc', 'color', p.color, p.colorName, `<i style="background:${esc(p.hex)}"></i>`)).join('')}</div></div>
      <div><h3>Model</h3><div class="opts">${pool.length ? pool.map(p => `<button class="opt" type="button" data-act="cfm" data-id="${p.id}" aria-pressed="${p.id === cfg.id}">${esc(p.name)}</button>`).join('') : '<p>Bu bo‘limda mos modellar yo‘q.</p>'}</div></div>
      <div><h3>O‘lcham (mm)</h3><div class="dims"><label>Kenglik (mm)<input class="field" id="cfW" type="number" inputmode="numeric" min="${SIZE.wMin}" max="${SIZE.wMax}" value="${esc(cfg.w)}" placeholder="${SIZE.wMin}–${SIZE.wMax}"></label>
        <label>Balandlik (mm)<input class="field" id="cfH" type="number" inputmode="numeric" min="${SIZE.hMin}" max="${SIZE.hMax}" value="${esc(cfg.h)}" placeholder="${SIZE.hMin}–${SIZE.hMax}"></label></div>
        <div class="err" id="cfErr">${(cfg.w || cfg.h) && !sizeOk ? 'Kenglik 600–1200 mm, balandlik 1800–2400 mm oralig‘ida bo‘lsin.' : ''}</div></div>
      ${sel ? `<div class="cfg__sum"><h3>Tanlovingiz</h3><dl><dt>Model</dt><dd>${esc(sel.name)}</dd></dl><dl><dt>Uslub</dt><dd>${esc(sel.styleName)}</dd></dl><dl><dt>Rang</dt><dd>${esc(sel.colorName)}</dd></dl>
        <dl><dt>O‘lcham (mm)</dt><dd>${sizeOk ? `${+cfg.w} × ${+cfg.h}` : '—'}</dd></dl><dl><dt>Model narxi</dt><dd>${money(sel.price)}</dd></dl>
        <p class="note">Narx modelga bog‘liq. O‘lchamga qarab yakuniy narxni operator tasdiqlaydi.</p>
        <button class="btn btn--p" type="button" data-act="cfadd"${sizeOk ? '' : ' disabled'}>${ICON.bag}Buyurtmaga qo‘shish</button></div>` : ''}</div>`;
    translateDom(box);
  }
  function cfgKeep() { const a = document.activeElement, id = a && a.id, pos = a && a.selectionStart; renderConfig(); if (id) { const n = $('#' + id); if (n) { n.focus(); try { n.setSelectionRange(pos, pos); } catch { /* number input */ } } } }
  /* --- mahsulot sahifasi --- */
  let pdpImg = 0;
  const images = p => [doorImg(p), ...(p.gallery || [])];
  function renderPdp() {
    const rootEl = $('#pdpRoot'), p = find(new URLSearchParams(location.search).get('id'));
    if (!p) { rootEl.innerHTML = emptyBox('search', 'Mahsulot topilmadi.', 'Katalogdan boshqa MDF eshikni tanlang.'); document.title = 'Mahsulot topilmadi — YasinDoors'; return; }
    const ims = images(p); if (pdpImg >= ims.length) pdpImg = 0;
    const fav = favs.includes(p.id), inCmp = cmp.includes(p.id), sim = PRODUCTS.filter(x => x.id !== p.id && (x.style === p.style || x.color === p.color)).slice(0, 3);
    document.title = `${p.name} — MDF eshik — YasinDoors`;
    const md = document.querySelector('meta[name="description"]'); if (md) md.content = `${p.name}: ${p.desc} ${p.material}. Narxi: ${money(p.price)}.`;
    const ld = document.getElementById('ld') || Object.assign(document.createElement('script'), { id: 'ld', type: 'application/ld+json' });
    ld.textContent = JSON.stringify({ '@context': 'https://schema.org', '@type': 'Product', name: p.name, description: p.long, material: p.material, color: p.colorName, offers: { '@type': 'Offer', priceCurrency: 'UZS', price: p.price, availability: p.stock ? 'https://schema.org/InStock' : 'https://schema.org/PreOrder' } }).replace(/</g, '\\u003c');
    document.head.appendChild(ld);
    rootEl.innerHTML = `<nav class="crumbs" aria-label="Yo‘l"><a href="index.html">Bosh sahifa</a><span>/</span><a href="doors.html">MDF Eshiklar</a><span>/</span><span>${esc(p.name)}</span></nav>
      <div class="pdp"><div class="gal"><button class="gal__main" data-act="lb" aria-label="Rasmni kattalashtirish"><img src="${esc(ims[pdpImg])}" alt="${esc(p.name)} — ${esc(p.colorName.toLowerCase())} ${esc(p.styleName)} MDF eshik" width="400" height="500"><span class="gal__zoom">${ICON.zoom}</span></button>
        ${ims.length > 1 ? `<div class="thumbs">${ims.map((u, i) => `<button type="button" data-act="thumb" data-id="${i}" aria-pressed="${i === pdpImg}" aria-label="Rasm ${i + 1}"><img src="${esc(u)}" alt="" loading="lazy"></button>`).join('')}</div>` : ''}</div>
        <div class="pinfo"><p class="eyebrow">${esc(p.styleName)} · ${esc(p.colorName)}</p><h1>${esc(p.name)}</h1><div class="price">${priceHtml(p)}</div><p>${esc(p.long)}</p>
          <ul class="spec"><li><span>Material</span>${esc(p.material)}</li><li><span>Rang</span>${esc(p.colorName)}</li><li><span>Uslub</span>${esc(p.styleName)}</li><li><span>O‘lcham (mm)</span>${SIZE.wMin}–${SIZE.wMax} × ${SIZE.hMin}–${SIZE.hMax}</li><li><span>Mavjudligi</span>${p.stock ? 'Mavjud' : 'Buyurtma asosida'}</li></ul>
          <div class="pbuy"><button class="btn btn--p" data-act="cart" data-id="${p.id}">${ICON.bag}Savatga qo‘shish</button><button class="btn btn--o" data-act="fav" data-id="${p.id}" aria-pressed="${fav}">${ICON.heart}${fav ? 'Sevimlilarda' : 'Sevimlilarga qo‘shish'}</button>
          <button class="btn btn--o" data-act="cmp" data-id="${p.id}" aria-pressed="${inCmp}">${ICON.compare}${inCmp ? 'Solishtirishda' : 'Solishtirish'}</button></div></div></div>
      ${sim.length ? `<div class="related"><div class="head"><h2>O‘xshash eshiklar</h2></div><div class="grid">${sim.map(card).join('')}</div></div>` : ''}`;
  }
  function openLightbox() {
    const p = find(new URLSearchParams(location.search).get('id')); if (!p) return;
    lastFocus = document.activeElement; modalId = null; boxClass('lb');
    $('#modalBox').innerHTML = `<button class="modal__x" data-act="close" aria-label="Yopish">${ICON.x}</button><div class="lb__in" id="lbIn"><img src="${esc(images(p)[pdpImg])}" alt="${esc(p.name)}" data-act="lbz"></div>`;
    openBox(); $('.modal__x').focus();
  }
  function renderPage() {
    try { renderPageInner(); } catch (e) { console.error(e); }
    translateDom(document.querySelector('main'));
  }
  function renderPageInner() {
    if (page === 'home' && $('#homeTabs')) { renderHome(); renderConfig(); }
    if (page === 'doors') renderDoors();
    if (page === 'product') renderPdp();
    if (page === 'favorites') { const l = PRODUCTS.filter(p => favs.includes(p.id)); $('#favGrid').innerHTML = l.length ? l.map(card).join('') : emptyBox('heart', 'Sevimli mahsulotlar hozircha yo‘q', 'O‘zingizga yoqqan eshiklarni saqlab qo‘ying.'); }
    if (page === 'cart') renderCart();
  }

  /* ---------- 9. Modal: tezkor ko‘rish ---------- */
  let modalId = null, modalQty = 1, lastFocus = null;
  const boxClass = c => { $('#modalBox').className = 'modal__box' + (c ? ' ' + c : ''); };
  function syncModal() {
    if (!modalId) return;
    const p = find(modalId), on = favs.includes(p.id); boxClass();
    $('#modalBox').innerHTML = `<button class="modal__x" data-act="close" aria-label="Yopish">${ICON.x}</button>
      <div class="modal__img">${img(p, false)}</div>
      <div class="modal__txt"><p class="eyebrow">${p.styleName} · ${p.colorName}</p><h2>${p.name}</h2>
      <div class="price">${priceHtml(p)}</div><p>${p.long}</p>
      <ul class="spec"><li><span>Material</span>${p.material}</li><li><span>Rang</span>${p.colorName}</li><li><span>Uslub</span>${p.styleName}</li><li><span>Mavjudligi</span>${p.stock ? 'Mavjud' : 'Buyurtma asosida'}</li></ul>
      <div class="card__act"><div class="qty"><button data-act="mq-" aria-label="Kamaytirish">${ICON.minus}</button><span aria-live="polite">${modalQty}</span><button data-act="mq+" aria-label="Ko‘paytirish">${ICON.plus}</button></div>
      <button class="btn btn--p" data-act="cartq" data-id="${p.id}" aria-label="Savatga qo‘shish">${ICON.bag}Savatga</button></div>
      <button class="btn btn--o" data-act="fav" data-id="${p.id}" aria-pressed="${on}">${ICON.heart}${on ? 'Sevimlilarda' : 'Sevimlilarga qo‘shish'}</button>
      <a class="btn btn--o" href="product.html?id=${p.id}">To‘liq sahifa ${ICON.arrow}</a></div>`;
  }
  const openBox = () => { translateDom($('#modalBox')); $('#modal').classList.add('open'); document.body.classList.add('lock'); };
  function openModal(id) { lastFocus = document.activeElement; modalId = +id; modalQty = 1; syncModal(); translateDom($('#modalBox')); openBox(); $('.modal__x').focus(); }
  function closeModal() {
    if (!$('#modal').classList.contains('open')) return;
    modalId = null; $('#modal').classList.remove('open'); document.body.classList.remove('lock'); if (lastFocus) lastFocus.focus();
  }

  /* ---------- 10. Formalar: real-time validatsiya ---------- */
  function bindValidation(f, rules, pre) {
    const check = (k, force) => {
      const i = f.elements[k]; if (!force && !i.dataset.t) return true;
      const r = rules[k](i.value); i.classList.toggle('bad', r !== true); $('#' + pre + k).textContent = r === true ? '' : r; return r === true;
    };
    Object.keys(rules).forEach(k => { const i = f.elements[k]; i.addEventListener('blur', () => { i.dataset.t = 1; check(k); }); i.addEventListener('input', () => check(k)); });
    return () => Object.keys(rules).map(k => check(k, true)).every(Boolean);
  }
  const phoneOk = v => { const d = v.replace(/\D/g, ''); return (/^\+?[\d\s()-]+$/.test(v.trim()) && d.length >= 9 && d.length <= 13) || 'Telefon raqamni to‘g‘ri kiriting. Masalan: +998 90 123 45 67'; };
  function initContact() {
    const c = CONTENT.contacts || {}, rows = [];
    if (c.phone) rows.push(`<li>${ICON.phone}<a href="${esc(telHref(c.phone))}">${esc(c.phone)}</a></li>`);
    if (c.email) rows.push(`<li>${ICON.mail}<a href="mailto:${esc(c.email)}">${esc(c.email)}</a></li>`);
    if (c.address) rows.push(`<li>${ICON.pin}<span>${esc(c.address)}</span></li>`);
    if (c.hours) rows.push(`<li>${ICON.clock}<span>${esc(c.hours)}</span></li>`);
    if (c.telegram) rows.push(`<li>${ICON.tg}<a href="${esc(c.telegram)}" target="_blank" rel="noopener">Telegram orqali yozing</a></li>`);
    $('#contactInfo').innerHTML = rows.join('');
    $('#contactNote').textContent = rows.length ? '' : t('Aloqa ma’lumotlari tez orada qo‘shiladi. Hozircha xabar qoldirishingiz mumkin.');
    const f = $('#contactForm');
    const valid = bindValidation(f, {
      name: v => v.trim().length >= 2 || 'Ismingizni kiriting.', phone: phoneOk,
      message: v => v.trim().length >= 10 || 'Xabar kamida 10 ta belgidan iborat bo‘lsin.'
    }, 'e-');
    f.addEventListener('submit', async e => {
      e.preventDefault(); if (!valid()) return;
      const btn = $('#cBtn'), el = f.elements; btn.disabled = true; $('#cErr').innerHTML = '';
      try {
        const r = await fetch('/api/contact', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ name: el.name.value, phone: el.phone.value, message: el.message.value, website: el.website.value }) });
        const d = await r.json().catch(() => ({})); if (!r.ok || !d.ok) throw new Error(d.error || 'fail');
        f.reset(); $$('.field', f).forEach(i => delete i.dataset.t); toast('Xabaringiz qabul qilindi!');
      } catch { $('#cErr').innerHTML = ICON.x + `<span>${t('Xabar yuborilmadi. Qaytadan urinib ko‘ring.')}</span>`; }
      finally { btn.disabled = false; }
    });
  }

  /* ---------- 11. Zakaz: POST /api/order -> server.js -> Telegram ---------- */
  const ORDER_ERR = 'Zakaz yuborilmadi. Iltimos, qaytadan urinib ko‘ring.';
  const fl = (id, name, label, ph, extra = '') => `<div class="fl"><input class="field" id="${id}" name="${name}" placeholder=" " ${extra}><label for="${id}">${label}</label><div class="err" id="e-o-${name}"></div></div>`;
  function openOrder() {
    if (!cartCount()) return;
    lastFocus = document.activeElement; modalId = null; boxClass('order');
    $('#modalBox').innerHTML = `<button class="modal__x" data-act="close" aria-label="Yopish">${ICON.x}</button>
      <form class="order-form" id="orderForm" novalidate><h2>Zakaz berish</h2><p>Umumiy summa: <b>${money(totals().total)}</b></p>
      ${fl('o-name', 'name', 'Ism', '', 'autocomplete="name" maxlength="100"')}${fl('o-phone', 'phone', 'Telefon raqam', '', 'type="tel" autocomplete="tel" maxlength="30"')}
      ${fl('o-address', 'address', 'Manzil', '', 'autocomplete="street-address" maxlength="300"')}
      <div class="fl"><textarea class="field" id="o-note" name="note" placeholder=" " rows="3" maxlength="500">${esc(store.get('cfgNote', ''))}</textarea><label for="o-note">Qo‘shimcha izoh</label></div>
      <div class="notice" id="o-err" role="alert"></div><button class="btn btn--p" type="submit" id="orderBtn">Zakazni yuborish</button></form>`;
    openBox(); $('#o-name').focus();
    const f = $('#orderForm');
    const valid = bindValidation(f, { name: v => v.trim().length >= 2 || 'Ismingizni kiriting.', phone: phoneOk, address: v => v.trim().length >= 5 || 'Manzilni kiriting.' }, 'e-o-');
    f.addEventListener('submit', e => { e.preventDefault(); if (valid()) sendOrder(f); });
  }
  async function sendOrder(f) {
    const btn = $('#orderBtn'), t = totals(), el = f.elements;
    const items = Object.keys(cart).map(id => ({ id: +id, qty: cart[id] }));   // narx serverda katalogdan olinadi
    btn.disabled = true; btn.textContent = 'Yuborilmoqda…'; $('#o-err').innerHTML = '';
    const ctl = new AbortController(), timer = setTimeout(() => ctl.abort(), 15000);
    try {
      const r = await fetch('/api/order', { method: 'POST', headers: { 'Content-Type': 'application/json' }, signal: ctl.signal,
        body: JSON.stringify({ name: el.name.value, phone: el.phone.value, address: el.address.value, note: el.note.value, items, delivery: t.fee }) });
      const d = await r.json().catch(() => ({}));
      if (!r.ok || !d.ok) throw new Error(d.error || (r.status === 404 || r.status === 405 ? 'noserver' : 'order failed'));
      cart = {}; store.set('cfgNote', ''); commit();   // faqat muvaffaqiyatdan keyin savat tozalanadi
      $('#modalBox').innerHTML = `<button class="modal__x" data-act="close" aria-label="Yopish">${ICON.x}</button><div class="state">
        <svg class="bigcheck" viewBox="0 0 52 52" aria-hidden="true"><circle cx="26" cy="26" r="24"/><path d="M15 27l8 8 14-16"/></svg>
        <h2>Zakaz qabul qilindi</h2>${d.id ? `<p>Zakaz raqami: <b>${esc(d.id)}</b></p>` : ''}<p>Tez orada siz bilan bog‘lanamiz.</p><a class="btn btn--p" href="doors.html">Katalogga qaytish</a></div>`;
    } catch (err) {
      const m = err && err.message, why = m === 'noserver' ? 'Zakaz serveri ishlamayapti (sayt faqat statik fayl sifatida joylangan).' : (m && m !== 'order failed' && m !== 'Failed to fetch' && m !== 'The user aborted a request.' ? m : '');
      $('#o-err').innerHTML = ICON.x + `<span>${t(ORDER_ERR)}${why ? ' ' + esc(why) : ''}</span>`;   // savat saqlanadi, qayta urinish mumkin
      btn.disabled = false; btn.textContent = 'Qayta urinish';
    } finally { clearTimeout(timer); }
  }

  /* ---------- 12. Hodisalar (event delegation) ---------- */
  document.addEventListener('click', e => {
    if (e.target === $('#modal')) return closeModal();
    const b = e.target.closest('[data-act]'); if (!b) return;
    const id = +b.dataset.id, a = b.dataset.act;
    if (a === 'search' && page === 'doors') { e.preventDefault(); $('#search').focus(); return; }
    ({
      fav: () => toggleFav(id), cart: () => addCart(id), cartq: () => { addCart(id, modalQty); closeModal(); }, details: () => openModal(id), close: closeModal,
      plus: () => setQty(id, 1), minus: () => setQty(id, -1), remove: () => removeCart(id), theme: toggleTheme, checkout: openOrder,
      htab: () => { homeTab = b.dataset.k; renderHome(); translateDom($('#homeTabs')); translateDom($('#featured')); },
      cmp: () => toggleCmp(id), cmpopen: openCompare, cmpclear: () => { cmp = []; commit(); closeModal(); },
      cmprm: () => { cmp = cmp.filter(x => x !== id); commit(); cmp.length > 1 ? openCompare() : closeModal(); },
      lang: () => { try { localStorage.setItem('lang', LANG === 'ru' ? 'uz' : 'ru'); } catch { /* ignore */ } location.reload(); },
      top: () => scrollTo({ top: 0, behavior: matchMedia('(prefers-reduced-motion:reduce)').matches ? 'auto' : 'smooth' }),
      cfs: () => { cfg.style = b.dataset.k; renderConfig(); }, cfc: () => { cfg.color = b.dataset.k; renderConfig(); }, cfm: () => { cfg.id = id; renderConfig(); },
      cfadd: addConfigured, lb: openLightbox, thumb: () => { pdpImg = id; renderPdp(); translateDom($('#pdpRoot')); },
      lbz: () => $('#lbIn').classList.toggle('z'),
      'mq+': () => { modalQty = Math.min(modalQty + 1, 20); syncModal(); }, 'mq-': () => { modalQty = Math.max(modalQty - 1, 1); syncModal(); }
    })[a]?.();
  });
  document.addEventListener('input', e => { if (e.target.id === 'cfW') { cfg.w = e.target.value; cfgKeep(); } if (e.target.id === 'cfH') { cfg.h = e.target.value; cfgKeep(); } });
  function addConfigured() { // tanlangan model savatga qo‘shiladi, parametrlar zakaz izohiga tushishi uchun saqlanadi
    const p = find(cfg.id); if (!p || !(+cfg.w >= SIZE.wMin && +cfg.w <= SIZE.wMax && +cfg.h >= SIZE.hMin && +cfg.h <= SIZE.hMax)) return;
    store.set('cfgNote', `Konstruktor: ${p.name}, ${p.colorName}, ${p.styleName}, ${+cfg.w}×${+cfg.h} mm`); addCart(p.id);
  }
  document.addEventListener('keydown', e => { if (e.key === 'Escape') { closeModal(); closeNav(); } });

  function closeNav() {
    const nav = $('#nav'), burger = $('#burger');
    if (!nav.classList.contains('open')) return;
    nav.classList.remove('open'); document.body.classList.remove('lock');
    burger.setAttribute('aria-expanded', 'false'); burger.setAttribute('aria-label', 'Menyuni ochish');
  }
  function initNav() {
    const nav = $('#nav'), burger = $('#burger'), header = $('#site-header'), bar = $('#progress');
    burger.addEventListener('click', () => {
      const open = nav.classList.toggle('open'); document.body.classList.toggle('lock', open);
      burger.setAttribute('aria-expanded', open); burger.setAttribute('aria-label', open ? 'Menyuni yopish' : 'Menyuni ochish');
    });
    nav.addEventListener('click', e => { if (e.target.closest('a')) closeNav(); });
    document.addEventListener('click', e => { if (!e.target.closest('#nav, #burger')) closeNav(); });
    addEventListener('resize', () => innerWidth > 900 && closeNav());
    const still = matchMedia('(prefers-reduced-motion:reduce)').matches;
    const onScroll = () => {
      header.classList.toggle('scrolled', scrollY > 24); const tt = $('#toTop'); if (tt) tt.classList.toggle('show', scrollY > 600);
      const max = document.documentElement.scrollHeight - innerHeight; bar.style.width = (max > 0 ? scrollY / max * 100 : 0) + '%';
      const vis = $('.hero__vis'); if (vis && !still && scrollY < 900) vis.style.setProperty('--py', scrollY * .05 + 'px');
    };
    addEventListener('scroll', onScroll, { passive: true }); onScroll();
  }
  function initDoors() {
    const chips = $('#chips'), qp = new URLSearchParams(location.search);
    chips.innerHTML = FILTERS.map(([k, n]) => `<button class="chip" data-f="${k}" aria-pressed="${k === 'all'}">${n}</button>`).join('');
    const colors = [...new Map(PRODUCTS.map(p => [p.color, p.colorName])).entries()], styles = [...new Map(PRODUCTS.map(p => [p.style, p.styleName])).entries()];
    $('#fColor').innerHTML = `<option value="">Barcha ranglar</option>` + colors.map(([k, n]) => `<option value="${esc(k)}">${esc(n)}</option>`).join('');
    $('#fStyle').innerHTML = `<option value="">Barcha uslublar</option>` + styles.map(([k, n]) => `<option value="${esc(k)}">${esc(n)}</option>`).join('');
    const setChip = k => { view.f = k; $$('.chip', chips).forEach(x => x.setAttribute('aria-pressed', x.dataset.f === k)); };
    chips.addEventListener('click', e => { const c = e.target.closest('.chip'); if (c) { setChip(c.dataset.f); renderDoors(); } });
    const num = v => (v === '' || isNaN(+v) || +v < 0 ? null : +v);
    $('#fColor').addEventListener('change', e => { view.color = e.target.value; renderDoors(); });
    $('#fStyle').addEventListener('change', e => { view.style = e.target.value; renderDoors(); });
    $('#fMin').addEventListener('input', e => { view.min = num(e.target.value); renderDoors(); });
    $('#fMax').addEventListener('input', e => { view.max = num(e.target.value); renderDoors(); });
    $('#fReset').addEventListener('click', () => {
      Object.assign(view, { f: 'all', q: '', sort: 'rec', min: null, max: null, color: '', style: '' }); setChip('all');
      ['#fColor', '#fStyle', '#fMin', '#fMax', '#search'].forEach(i => { $(i).value = ''; }); $('#sort').value = 'rec'; renderDoors();
    });
    const col = qp.get('f'); if (col && colors.some(([k]) => k === col)) { view.color = col; $('#fColor').value = col; }
    /* qidiruv: mos mahsulotlarni avtomatik tavsiya qilish */
    const inp = $('#search'), box = $('#suggest'); let on = -1;
    const hide = () => { box.hidden = true; inp.setAttribute('aria-expanded', 'false'); on = -1; };
    const sug = () => {
      const q = inp.value.trim().toLowerCase(); if (q.length < 2) return hide();
      const l = PRODUCTS.filter(p => `${p.name} ${p.tags} ${p.colorName} ${p.styleName}`.toLowerCase().includes(q)).slice(0, 5); if (!l.length) return hide();
      box.innerHTML = l.map(p => `<li role="option"><a href="product.html?id=${p.id}"><img src="${doorImg(p)}" alt="" width="34" height="42"><span>${esc(p.name)}<small>${esc(p.styleName)} · ${esc(p.colorName)} · ${money(p.price)}</small></span></a></li>`).join('');
      box.hidden = false; inp.setAttribute('aria-expanded', 'true');
    };
    inp.addEventListener('input', e => { view.q = e.target.value; renderDoors(); sug(); });
    inp.addEventListener('keydown', e => {
      const a = $$('a', box); if (box.hidden || !a.length) return;
      if (e.key === 'ArrowDown' || e.key === 'ArrowUp') { e.preventDefault(); on = (on + (e.key === 'ArrowDown' ? 1 : -1) + a.length) % a.length; a.forEach((x, i) => x.classList.toggle('on', i === on)); }
      else if (e.key === 'Enter' && on >= 0) { e.preventDefault(); location.href = a[on].href; } else if (e.key === 'Escape') hide();
    });
    document.addEventListener('click', e => { if (!e.target.closest('.search')) hide(); });
    $('#sort').addEventListener('change', e => { view.sort = e.target.value; renderDoors(); });
    if (qp.get('focus') === 'search') inp.focus();
    renderDoors(); translateDom($('main'));
  }
  function initReveal() {
    const items = $$('.reveal:not(.in)');
    if (!('IntersectionObserver' in window)) return items.forEach(el => el.classList.add('in'));
    const io = new IntersectionObserver(es => es.forEach(x => { if (x.isIntersecting) { x.target.classList.add('in'); io.unobserve(x.target); } }), { threshold: .12 });
    items.forEach(el => io.observe(el));
  }

  /* ---------- 13. Ishga tushirish ---------- */
  renderLayout();
  applyTheme(root.dataset.theme || 'light');
  initNav(); updateCounts(); renderPage(); translateDom(document.body); renderCmpBar();
  $$('[data-door]').forEach(el => { const p = find(el.dataset.door) || PRODUCTS[0]; if (p) el.src = doorImg(p); });
  const safe = f => { try { f(); } catch (e) { console.error(e); } };
  if (page === 'doors') safe(initDoors);
  if (page === 'contact') safe(initContact);
  initReveal();
})();
