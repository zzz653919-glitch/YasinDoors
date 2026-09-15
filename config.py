import os

# --------------------------------------------------------------------------
# Telegram bot sozlamalari
# --------------------------------------------------------------------------
# @BotFather'dan olingan token
BOT_TOKEN = os.environ.get("BOT_TOKEN", "8919097362:AAFvgfRWGg4ZIIJ9Pi0bsxxPVCqSIqI_eLw")

# Yangi buyurtma haqidagi xabarlar boradigan chat (do'kon egasi/admin)
ADMIN_CHAT_ID = os.environ.get("ADMIN_CHAT_ID", "170310198")

# Botning @username'i (havolalar uchun, @ belgisisiz)
BOT_USERNAME = os.environ.get("BOT_USERNAME", "YasinDoors_Jizzax_bot")

# --------------------------------------------------------------------------
# Google Sheets (Code.gs) — ma'lumotlar bazasi o'rnida
# --------------------------------------------------------------------------
# Code.gs faylini Google Apps Script'da Deploy → New deployment → Web app
# qilganingizda olingan havola (https://script.google.com/macros/s/.../exec).
# Bot shu manzil orqali buyurtmalarni Sheets'dan o'qiydi.
SHEETS_WEBHOOK_URL = os.environ.get("SHEETS_WEBHOOK_URL", "BU_YERGA_APPS_SCRIPT_WEB_APP_URL_QOYING")

# --------------------------------------------------------------------------
# Sayt va aloqa ma'lumotlari
# --------------------------------------------------------------------------
WEBSITE_URL = "https://zzz653919-glitch.github.io"
CONTACT_PHONE = "+998933002020"
MAP_LINK = "https://maps.app.goo.gl/oFEyE3jcY1ZPsXMJ9"
WORK_HOURS = "Dushanba–Shanba, 09:00–19:00"
DEPOSIT_RATE = 0.20
