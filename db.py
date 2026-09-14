"""
Mahalliy SQLite ma'lumotlar bazasi — Google Sheets o'rnini bosadi.
Jadvallar: orders, leads (register/login), telegram_users, pending_intent
"""

import sqlite3
import time
from contextlib import closing

import config

DB_PATH = config.DB_PATH


def get_conn():
    conn = sqlite3.connect(DB_PATH, check_same_thread=False)
    conn.row_factory = sqlite3.Row
    return conn


def init_db():
    with closing(get_conn()) as conn, conn:
        conn.execute(
            """CREATE TABLE IF NOT EXISTS orders (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                created_at TEXT NOT NULL,
                name TEXT, phone TEXT, model TEXT, series TEXT,
                size TEXT, color_name TEXT, color_hex TEXT,
                quantity INTEGER, total_price INTEGER, deposit INTEGER,
                region TEXT, mahalla TEXT, street TEXT, house TEXT,
                lat REAL, lng REAL, page TEXT
            )"""
        )
        conn.execute(
            """CREATE TABLE IF NOT EXISTS leads (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                created_at TEXT NOT NULL,
                type TEXT NOT NULL,      -- register | login
                name TEXT, phone TEXT, code TEXT, page TEXT
            )"""
        )
        conn.execute(
            """CREATE TABLE IF NOT EXISTS telegram_users (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                created_at TEXT NOT NULL,
                chat_id TEXT NOT NULL,
                first_name TEXT, last_name TEXT, username TEXT,
                phone TEXT, order_id TEXT
            )"""
        )


# ---------------------------------------------------------------------------
# Orders
# ---------------------------------------------------------------------------

def insert_order(data: dict) -> int:
    with closing(get_conn()) as conn, conn:
        cur = conn.execute(
            """INSERT INTO orders
               (created_at, name, phone, model, series, size, color_name, color_hex,
                quantity, total_price, deposit, region, mahalla, street, house, lat, lng, page)
               VALUES (datetime('now'), ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)""",
            (
                data.get("customer_name", ""), data.get("phone", ""),
                data.get("model_name", ""), data.get("series", ""),
                data.get("size", ""), data.get("color_name", ""), data.get("color_hex", ""),
                data.get("quantity", 1), data.get("total_price", 0), data.get("deposit", 0),
                data.get("region", ""), data.get("mahalla", ""), data.get("street", ""),
                data.get("house", ""), data.get("lat"), data.get("lng"), data.get("page", ""),
            ),
        )
        return cur.lastrowid


def get_order(order_id) -> dict | None:
    with closing(get_conn()) as conn:
        row = conn.execute("SELECT * FROM orders WHERE id=?", (order_id,)).fetchone()
        return dict(row) if row else None


def get_orders_by_phone(phone: str) -> list[dict]:
    target = only_digits(phone)[-9:]
    with closing(get_conn()) as conn:
        rows = conn.execute("SELECT * FROM orders ORDER BY id DESC").fetchall()
    return [dict(r) for r in rows if only_digits(r["phone"])[-9:] == target]


# ---------------------------------------------------------------------------
# Leads (register / login)
# ---------------------------------------------------------------------------

def insert_lead(kind: str, data: dict):
    with closing(get_conn()) as conn, conn:
        conn.execute(
            "INSERT INTO leads (created_at, type, name, phone, code, page) VALUES (datetime('now'), ?, ?, ?, ?, ?)",
            (kind, data.get("name", ""), data.get("phone", ""), data.get("code", ""), data.get("page", "")),
        )


# ---------------------------------------------------------------------------
# Telegram users
# ---------------------------------------------------------------------------

def log_telegram_user(chat_id, first_name="", last_name="", username="", phone="", order_id=""):
    with closing(get_conn()) as conn, conn:
        conn.execute(
            """INSERT INTO telegram_users
               (created_at, chat_id, first_name, last_name, username, phone, order_id)
               VALUES (datetime('now'), ?, ?, ?, ?, ?, ?)""",
            (str(chat_id), first_name, last_name, username, phone, str(order_id)),
        )


def find_phone_by_chat_id(chat_id) -> str:
    with closing(get_conn()) as conn:
        row = conn.execute(
            "SELECT phone FROM telegram_users WHERE chat_id=? AND phone != '' ORDER BY id DESC LIMIT 1",
            (str(chat_id),),
        ).fetchone()
    return row["phone"] if row else ""


def only_digits(s) -> str:
    return "".join(ch for ch in str(s or "") if ch.isdigit())


# ---------------------------------------------------------------------------
# Pending intent (mijozdan telefon kutilyaptimi) — xotirada, 5 daqiqa amal qiladi
# ---------------------------------------------------------------------------

_pending: dict[str, tuple[str, float]] = {}
PENDING_TTL = 300  # sekund


def set_pending_intent(chat_id, intent: str):
    _pending[str(chat_id)] = (intent, time.time())


def get_pending_intent(chat_id, clear: bool = False) -> str:
    key = str(chat_id)
    item = _pending.get(key)
    if not item:
        return ""
    intent, ts = item
    if time.time() - ts > PENDING_TTL:
        _pending.pop(key, None)
        return ""
    if clear:
        _pending.pop(key, None)
    return intent
