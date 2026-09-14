"""
YasinDoors — yagona, tashqi saytlarsiz server
-----------------------------------------------
Bitta Python dasturi ikkita vazifani bajaradi:

  1) Saytdagi formalardan (buyurtma, ro'yxatdan o'tish, kirish) kelgan
     ma'lumotlarni qabul qilib, mahalliy SQLite bazasiga yozadi
     (Google Sheets / Google Apps Script O'RNIGA).

  2) Telegram botni long-polling orqali ishga tushiradi — mijozlarga
     javob beradi, admin'ga yangi buyurtmalar haqida xabar yuboradi
     (Cloudflare Worker / Netlify Function / webhook O'RNIGA).

Ishga tushirish:
    pip install -r requirements.txt
    python app.py
"""

import logging
import threading

from flask import Flask, request, jsonify

import config
import db
import bot_logic

logging.basicConfig(
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s",
    level=logging.INFO,
)
logger = logging.getLogger("app")

app = Flask(__name__)


def _cors_headers(resp):
    origin = "*" if "*" in config.ALLOWED_ORIGINS else ", ".join(config.ALLOWED_ORIGINS)
    resp.headers["Access-Control-Allow-Origin"] = origin
    resp.headers["Access-Control-Allow-Methods"] = "POST, GET, OPTIONS"
    resp.headers["Access-Control-Allow-Headers"] = "Content-Type"
    return resp


@app.after_request
def add_cors(resp):
    return _cors_headers(resp)


@app.route("/api/order", methods=["POST", "OPTIONS"])
def api_order():
    if request.method == "OPTIONS":
        return _cors_headers(app.make_default_options_response())

    data = request.get_json(silent=True) or {}
    order_id = db.insert_order(data)
    order = db.get_order(order_id)

    # Admin (do'kon egasi)ga darhol xabar yuboramiz
    bot_logic.notify_admin_new_order(order_id, order)

    tg_link = None
    if config.BOT_USERNAME and "BU_YERGA" not in config.BOT_USERNAME:
        tg_link = f"https://t.me/{config.BOT_USERNAME}?start=o_{order_id}"

    return jsonify({"ok": True, "id": order_id, "telegram_link": tg_link})


@app.route("/api/lead", methods=["POST", "OPTIONS"])
def api_lead():
    """Ro'yxatdan o'tish / kirish formalaridan keladigan yengil ma'lumotlar."""
    if request.method == "OPTIONS":
        return _cors_headers(app.make_default_options_response())

    data = request.get_json(silent=True) or {}
    kind = data.get("type")
    if kind in ("register", "login"):
        db.insert_lead(kind, data)
    return jsonify({"ok": True})


@app.route("/api/ping", methods=["GET"])
def ping():
    return jsonify({"ok": True, "service": "yasindoors-bot"})


def main():
    db.init_db()

    stop_event = threading.Event()
    polling_thread = threading.Thread(
        target=bot_logic.run_polling_loop, args=(stop_event,), daemon=True
    )
    polling_thread.start()

    logger.info("HTTP server %s:%s portida ishga tushmoqda...", config.HTTP_HOST, config.HTTP_PORT)
    try:
        app.run(host=config.HTTP_HOST, port=config.HTTP_PORT, threaded=True)
    finally:
        stop_event.set()


if __name__ == "__main__":
    main()
