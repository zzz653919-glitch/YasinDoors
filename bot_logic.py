"""
Telegram bot mantig'i — Code.gs faylidagi handleTelegramUpdate() va
yordamchi funksiyalarning to'g'ridan-to'g'ri Python ko'chirmasi.
Long polling orqali ishlaydi — webhook, Cloudflare Worker yoki
Google Apps Script shart emas.
"""

import logging
import requests

import config
import db

logger = logging.getLogger("bot_logic")

API_URL = f"https://api.telegram.org/bot{config.BOT_TOKEN}/"

MAIN_MENU_KEYBOARD = {
    "inline_keyboard": [
        [{"text": "💳 To'lov usullari", "callback_data": "pay_info"}],
        [{"text": "🕐 Ish vaqti / manzil", "callback_data": "hours_info"}],
        [{"text": "🌐 Saytga o'tish", "url": config.WEBSITE_URL}],
    ]
}
BACK_KEYBOARD = {"inline_keyboard": [[{"text": "🔙 Menyuga qaytish", "callback_data": "menu"}]]}
CONTACT_REQUEST_KEYBOARD = {
    "keyboard": [[{"text": "📞 Telefon raqamimni yuborish", "request_contact": True}]],
    "resize_keyboard": True,
    "one_time_keyboard": True,
}

WELCOME_TEXT = (
    "🚪 <b>YasinDoors botiga xush kelibsiz!</b>\n\n"
    "Bu yerda siz:\n"
    "📦 /order — eng so'nggi buyurtmangizni ko'rishingiz\n"
    "🗂 /allorder — barcha buyurtmalaringiz ro'yxatini olishingiz\n"
    "💳 To'lov shartlari va 🕐 ish vaqtimiz bilan tanishishingiz mumkin.\n\n"
    "Savolingiz bo'lsa — pastdagi tugmalardan foydalaning yoki operatorimizga qo'ng'iroq qiling."
)
MAIN_MENU_TEXT = (
    "🙋 Men <b>YasinDoors</b> botiman.\n\n"
    "Quyidagi buyruqlardan foydalanishingiz mumkin:\n"
    "📦 /order — eng so'nggi buyurtmangiz haqida ma'lumot\n"
    "🗂 /allorder — barcha buyurtmalaringiz ro'yxati\n"
    "❓ /help — shu yordam xabarini qayta ko'rish\n\n"
    "Yoki quyidagi tugmalardan birini tanlang:"
)
PAY_INFO_TEXT = (
    "💳 <b>To'lov usullari</b>\n\n"
    "Buyurtma tasdiqlash uchun umumiy summaning <b>20%</b> miqdorida zalog (oldindan to'lov) olinadi.\n"
    "Qolgan qismi eshik yetkazib berilganda <b>naqd</b> yoki <b>plastik karta</b> orqali to'lanadi.\n\n"
    "Zalogni qanday to'lash mumkin:\n"
    "1️⃣ Operatorimiz siz bilan bog'lanib, to'lov havolasi yoki karta raqamini yuboradi\n"
    "2️⃣ Yoki ofisimizga kelib naqd to'lashingiz mumkin\n\n"
    f'Aniq to\'lov rekvizitlari uchun operator bilan bog\'laning: <a href="tel:{config.CONTACT_PHONE}">{config.CONTACT_PHONE}</a>'
)
HOURS_INFO_TEXT = (
    f"🕐 <b>Ish vaqti</b>: {config.WORK_HOURS}\n\n"
    f'📍 <b>Manzil</b>: <a href="{config.MAP_LINK}">Xaritada ko\'rish</a>\n\n'
    f'📞 Telefon: <a href="tel:{config.CONTACT_PHONE}">{config.CONTACT_PHONE}</a>'
)


# ---------------------------------------------------------------------------
# Telegram API bilan ishlash
# ---------------------------------------------------------------------------

def call_telegram(method: str, payload: dict) -> dict:
    try:
        res = requests.post(API_URL + method, json=payload, timeout=20)
        data = res.json()
        if not data.get("ok"):
            logger.error("Telegram API xatosi (%s): %s", method, res.text)
        return data
    except Exception:
        logger.exception("Telegramga so'rov yuborishda xatolik")
        return {}


def send_message(chat_id, text, reply_markup=None, disable_preview=True):
    payload = {
        "chat_id": chat_id,
        "text": text,
        "parse_mode": "HTML",
        "disable_web_page_preview": disable_preview,
    }
    if reply_markup is not None:
        payload["reply_markup"] = reply_markup
    return call_telegram("sendMessage", payload)


def format_som(n) -> str:
    try:
        n = int(round(float(n or 0)))
    except (TypeError, ValueError):
        n = 0
    s = f"{n:,}".replace(",", " ")
    return f"{s} so'm"


# ---------------------------------------------------------------------------
# Buyurtma matnlarini yig'ish
# ---------------------------------------------------------------------------

def build_order_detail_lines(order: dict) -> str:
    lines = [f"🚪 Model: {order.get('model') or '—'}" + (f" ({order['series']})" if order.get("series") else "")]
    if order.get("size"):
        lines.append(f"📏 O'lcham: {order['size']}")
    lines.append(f"🎨 Rang: {order.get('color_name') or '—'}")
    lines.append(f"🔢 Miqdor: {order.get('quantity') or '—'} dona")
    lines.append(f"💰 Umumiy: {format_som(order.get('total_price'))}")
    lines.append(f"💵 Zalog (20%): {format_som(order.get('deposit'))}")
    return "\n".join(lines)


def build_address(order: dict) -> str:
    parts = [p for p in [
        (f"{order['house']}-uy" if order.get("house") else None),
        order.get("street"), order.get("mahalla"), order.get("region"),
    ] if p]
    return ", ".join(parts)


def map_link_for(order: dict) -> str:
    if order.get("lat") and order.get("lng"):
        return f"https://www.google.com/maps?q={order['lat']},{order['lng']}"
    return ""


def build_one_order_block(order: dict, index: int) -> str:
    return f"📦 <b>Buyurtma {index}</b>\n{build_order_detail_lines(order)}"


def build_order_confirm_text(order: dict) -> str:
    lines = ["✅ <b>Buyurtmangiz qabul qilindi!</b>", "", build_order_detail_lines(order)]
    addr = build_address(order)
    if addr:
        lines.append(f"📍 Manzil: {addr}")
    link = map_link_for(order)
    if link:
        lines.append(f'🗺 <a href="{link}">Yetkazish manzili</a>')
    lines.append("")
    lines.append("Tez orada mutaxassisimiz zalog to'lovi bo'yicha siz bilan bog'lanadi.")
    return "\n".join(lines)


def notify_admin_new_order(order_id: int, order: dict):
    """Yangi buyurtma tushganda do'kon egasiga (ADMIN_CHAT_ID) xabar yuboradi."""
    if not config.ADMIN_CHAT_ID or "BU_YERGA" in str(config.ADMIN_CHAT_ID):
        logger.warning("ADMIN_CHAT_ID sozlanmagan — admin xabari yuborilmadi.")
        return
    lines = [
        "🛒 <b>Yangi buyurtma — YasinDoors</b>", "",
        f"👤 Mijoz: {order.get('name') or '—'}",
        f"📞 Tel: {order.get('phone') or '—'}",
        f"🚪 Model: {order.get('model') or '—'}" + (f" ({order['series']})" if order.get("series") else ""),
    ]
    if order.get("size"):
        lines.append(f"📏 O'lcham: {order['size']}")
    lines.append(f"🎨 Rang: {order.get('color_name') or '—'} ({order.get('color_hex') or '—'})")
    lines.append(f"🔢 Miqdor: {order.get('quantity') or '—'} dona")
    lines.append(f"💰 Umumiy: {format_som(order.get('total_price'))}")
    lines.append(f"💵 Zalog (20%): {format_som(order.get('deposit'))}")
    addr = build_address(order)
    if addr:
        lines.append(f"📍 Manzil: {addr}")
    text = "\n".join(lines)

    link = map_link_for(order)
    keyboard = {"inline_keyboard": [[{"text": "🗺 Xaritada ko'rish", "url": link}]]} if link else None
    send_message(config.ADMIN_CHAT_ID, text, reply_markup=keyboard, disable_preview=False)


# ---------------------------------------------------------------------------
# Buyurtma qidiruv oqimlari
# ---------------------------------------------------------------------------

def send_orders_for_phone(chat_id, phone, mode, just_got_contact):
    if just_got_contact:
        send_message(chat_id, "✅ Rahmat! Qidiryapman...", reply_markup={"remove_keyboard": True})

    orders = db.get_orders_by_phone(phone)
    if not orders:
        send_message(chat_id, "Sizning raqamingiz bo'yicha hozircha buyurtma topilmadi.", reply_markup=BACK_KEYBOARD)
        return

    if mode == "last":
        text = "📦 <b>Eng so'nggi buyurtmangiz</b>\n\n" + build_order_detail_lines(orders[0])
        if len(orders) > 1:
            text += f"\n\n<i>Jami {len(orders)} ta buyurtmangiz bor.</i>"
            keyboard = {"inline_keyboard": [
                [{"text": "🗂 Barcha buyurtmalarni ko'rish", "callback_data": "allorders"}],
                [{"text": "🔙 Menyuga qaytish", "callback_data": "menu"}],
            ]}
        else:
            keyboard = BACK_KEYBOARD
        send_message(chat_id, text, reply_markup=keyboard)
    else:
        blocks = [build_one_order_block(o, i + 1) for i, o in enumerate(orders)]
        text = f"🗂 <b>Sizning buyurtmalaringiz</b> ({len(orders)} ta):\n\n" + "\n\n".join(blocks)
        send_message(chat_id, text, reply_markup=BACK_KEYBOARD)


def handle_order_command(chat_id, msg, mode):
    log_user(msg)
    phone = db.find_phone_by_chat_id(chat_id)
    if not phone:
        db.set_pending_intent(chat_id, mode)
        send_message(
            chat_id,
            "Buyurtma(lar)ingizni topish uchun telefon raqamingizni tasdiqlang — pastdagi tugmani bosing:",
            reply_markup=CONTACT_REQUEST_KEYBOARD,
        )
        return
    send_orders_for_phone(chat_id, phone, mode, False)


def handle_order_start(chat_id, payload, msg):
    order_id = payload[2:] if payload.startswith("o_") else payload
    log_user(msg, order_id=order_id)
    order = db.get_order(order_id) if order_id.isdigit() else None
    if not order:
        send_message(chat_id, "Kechirasiz, bu buyurtma topilmadi. Savolingiz bo'lsa, operator bilan bog'laning.",
                      reply_markup=BACK_KEYBOARD)
        return
    send_message(chat_id, build_order_confirm_text(order), reply_markup=BACK_KEYBOARD, disable_preview=False)


def handle_contact_shared(chat_id, contact, msg):
    intent = db.get_pending_intent(chat_id, clear=True)
    send_orders_for_phone(chat_id, contact["phone_number"], "last" if intent == "last" else "all", True)
    log_user(msg, phone=contact["phone_number"])


def log_user(msg, phone="", order_id=""):
    frm = msg.get("from", {})
    db.log_telegram_user(
        msg["chat"]["id"],
        first_name=frm.get("first_name", ""),
        last_name=frm.get("last_name", ""),
        username=frm.get("username", ""),
        phone=phone,
        order_id=order_id,
    )


def looks_like_phone(text: str) -> bool:
    text = (text or "").strip()
    if not text or text.startswith("/"):
        return False
    digits = db.only_digits(text)
    return 7 <= len(digits) <= 13


# ---------------------------------------------------------------------------
# Har bir Telegram update'ni qayta ishlash (Code.gs: handleTelegramUpdate)
# ---------------------------------------------------------------------------

def handle_update(update: dict):
    try:
        if "callback_query" in update:
            cq = update["callback_query"]
            chat_id = cq["message"]["chat"]["id"]
            data = cq.get("data", "")
            call_telegram("answerCallbackQuery", {"callback_query_id": cq["id"]})

            if data == "pay_info":
                send_message(chat_id, PAY_INFO_TEXT, reply_markup=BACK_KEYBOARD)
            elif data == "hours_info":
                send_message(chat_id, HOURS_INFO_TEXT, reply_markup=BACK_KEYBOARD)
            elif data == "allorders":
                phone = db.find_phone_by_chat_id(chat_id)
                if phone:
                    send_orders_for_phone(chat_id, phone, "all", False)
                else:
                    handle_order_command(chat_id, {"chat": cq["message"]["chat"], "from": cq["from"]}, "all")
            else:
                send_message(chat_id, MAIN_MENU_TEXT, reply_markup=MAIN_MENU_KEYBOARD)
            return

        if "message" in update:
            msg = update["message"]
            chat_id = msg["chat"]["id"]
            text = msg.get("text", "") or ""
            cmd = text.strip().split()[0].lower() if text.strip() else ""

            if "contact" in msg:
                handle_contact_shared(chat_id, msg["contact"], msg)
            elif looks_like_phone(text) and db.get_pending_intent(chat_id):
                intent = db.get_pending_intent(chat_id, clear=True)
                send_orders_for_phone(chat_id, text.strip(), "last" if intent == "last" else "all", True)
                log_user(msg, phone=text.strip())
            elif cmd == "/start":
                payload = text[6:].strip() if len(text) > 6 else ""
                if payload == "my_orders":
                    handle_order_command(chat_id, msg, "all")
                elif payload:
                    handle_order_start(chat_id, payload, msg)
                else:
                    log_user(msg)
                    send_message(chat_id, WELCOME_TEXT, reply_markup=MAIN_MENU_KEYBOARD)
            elif cmd == "/order":
                handle_order_command(chat_id, msg, "last")
            elif cmd in ("/allorder", "/allorders"):
                handle_order_command(chat_id, msg, "all")
            elif cmd == "/help":
                log_user(msg)
                send_message(chat_id, MAIN_MENU_TEXT, reply_markup=MAIN_MENU_KEYBOARD)
            else:
                log_user(msg)
                send_message(chat_id, MAIN_MENU_TEXT, reply_markup=MAIN_MENU_KEYBOARD)
    except Exception:
        logger.exception("handle_update xatoligi")


# ---------------------------------------------------------------------------
# Long polling tsikli
# ---------------------------------------------------------------------------

def run_polling_loop(stop_event=None):
    logger.info("Bot long-polling boshlandi...")
    offset = 0
    while stop_event is None or not stop_event.is_set():
        try:
            res = requests.get(
                API_URL + "getUpdates",
                params={"timeout": 25, "offset": offset},
                timeout=35,
            ).json()
            for update in res.get("result", []):
                offset = update["update_id"] + 1
                handle_update(update)
        except requests.exceptions.RequestException:
            logger.warning("getUpdates so'rovida internet/tarmoq xatoligi, qayta urinilmoqda...")
        except Exception:
            logger.exception("Polling tsiklida kutilmagan xatolik")
