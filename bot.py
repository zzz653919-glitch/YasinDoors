"""
YasinDoors Telegram bot — yagona, sodda ishga tushirish nuqtasi.

Endi hech qanday Flask/HTTP server, SQLite yoki admin panel kerak emas —
bot faqat Telegram bilan (long-polling) va Google Sheets (Code.gs Web App)
bilan gaplashadi. Shu skriptni istalgan kompyuter yoki serverda ishga
tushirsangiz bo'ladi (VPS shart emas).

Ishga tushirish:
    pip install -r requirements.txt
    python bot.py
"""

import logging

import bot_logic

logging.basicConfig(
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s",
    level=logging.INFO,
)

if __name__ == "__main__":
    bot_logic.run_polling_loop()
