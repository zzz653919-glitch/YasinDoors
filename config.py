import os

# --------------------------------------------------------------------------
# Telegram bot sozlamalari
# --------------------------------------------------------------------------
# @BotFather'dan olingan token
BOT_TOKEN = os.environ.get("BOT_TOKEN", "8919097362:AAFvgfRWGg4ZIIJ9Pi0bsxxPVCqSIqI_eLw")

# Yangi buyurtma haqidagi xabarlar boradigan chat (do'kon egasi/admin).
# O'z ID'ingizni bilish uchun botga /start yozing, keyin serverning
# konsolida chiqadigan "Yangi chat_id" qatorini ko'ring, yoki @userinfobot'dan foydalaning.
ADMIN_CHAT_ID = os.environ.get("ADMIN_CHAT_ID", "BU_YERGA_ADMIN_CHAT_ID_QOYING")

# Botning @username'i (havolalar uchun, @ belgisisiz)
BOT_USERNAME = os.environ.get("BOT_USERNAME", "BU_YERGA_BOT_USERNAME_QOYING")

# --------------------------------------------------------------------------
# Sayt va aloqa ma'lumotlari
# --------------------------------------------------------------------------
WEBSITE_URL = "https://zzz653919-glitch.github.io"
CONTACT_PHONE = "+998933002020"
MAP_LINK = "https://maps.app.goo.gl/oFEyE3jcY1ZPsXMJ9"
WORK_HOURS = "Dushanba–Shanba, 09:00–19:00"
DEPOSIT_RATE = 0.20

# --------------------------------------------------------------------------
# Server sozlamalari
# --------------------------------------------------------------------------
# HTTP API qaysi portda ishlaydi (sayt shu manzilga buyurtma yuboradi)
HTTP_HOST = "0.0.0.0"
HTTP_PORT = int(os.environ.get("PORT", "5000"))

# Sayt boshqa domenda joylashgani uchun CORS orqali ruxsat beramiz.
# Xavfsizlik uchun bu yerga faqat o'z sayt manzilingizni yozib qo'yish tavsiya etiladi,
# masalan: ["https://zzz653919-glitch.github.io"]
ALLOWED_ORIGINS = ["*"]

# Mahalliy ma'lumotlar bazasi fayli (Google Sheets o'rniga)
DB_PATH = os.environ.get("DB_PATH", "yasindoors.db")
