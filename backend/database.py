"""SQLite setup and conversation persistence helpers."""

from __future__ import annotations

import sqlite3
from contextlib import contextmanager
from datetime import datetime, timezone

from typing import Iterator, Optional


from config import DATA_DIR, DATABASE_PATH

def utc_now() -> str:
    """Return a compact UTC timestamp for persisted messages."""

    return datetime.now(timezone.utc).isoformat(timespec="seconds")


@contextmanager
def get_connection() -> Iterator[sqlite3.Connection]:
    """Open a SQLite connection with row dictionaries enabled."""

    DATA_DIR.mkdir(parents=True, exist_ok=True)
    connection = sqlite3.connect(DATABASE_PATH)
    connection.row_factory = sqlite3.Row
    try:
        yield connection
        connection.commit()
    finally:
        connection.close()


def init_db() -> None:
    """Create the messages table and useful indexes."""

    with get_connection() as connection:
        connection.execute(
            """
            CREATE TABLE IF NOT EXISTS messages (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                role TEXT NOT NULL CHECK(role IN ('user', 'assistant')),
                content TEXT NOT NULL,
                created_at TEXT NOT NULL
            )
            """
        )
        connection.execute(
            """
            CREATE INDEX IF NOT EXISTS idx_messages_created_at
            ON messages(created_at)
            """
        )
        connection.execute(
            """
            CREATE INDEX IF NOT EXISTS idx_messages_role
            ON messages(role)
            """
        )


def save_message(role: str, content: str) -> dict:
    """Persist a single message and return the saved row."""

    if role not in {"user", "assistant"}:
        raise ValueError("role must be 'user' or 'assistant'")

    clean_content = content.strip()
    if not clean_content:
        raise ValueError("message content cannot be empty")

    with get_connection() as connection:
        cursor = connection.execute(
            """
            INSERT INTO messages (role, content, created_at)
            VALUES (?, ?, ?)
            """,
            (role, clean_content, utc_now()),
        )
        message_id = int(cursor.lastrowid)
        row = connection.execute(
            """
            SELECT id, role, content, created_at
            FROM messages
            WHERE id = ?
            """,
            (message_id,),
        ).fetchone()
    return dict(row)


def load_messages(limit: Optional[int] = None, search: Optional[str] = None) -> list[dict]:
    """Load messages in chronological order, optionally filtered by text."""

    params: list[object] = []
    where_clause = ""
    if search:
        where_clause = "WHERE content LIKE ?"
        params.append(f"%{search.strip()}%")

    if limit:
        params.append(limit)
        query = f"""
            SELECT id, role, content, created_at
            FROM messages
            {where_clause}
            ORDER BY id DESC
            LIMIT ?
        """
        with get_connection() as connection:
            rows = [dict(row) for row in connection.execute(query, params).fetchall()]
        return list(reversed(rows))

    query = f"""
        SELECT id, role, content, created_at
        FROM messages
        {where_clause}
        ORDER BY id ASC
    """
    with get_connection() as connection:
        return [dict(row) for row in connection.execute(query, params).fetchall()]


def clear_messages() -> None:
    """Delete all saved conversation rows."""

    with get_connection() as connection:
        connection.execute("DELETE FROM messages")


def get_stats() -> dict:
    """Return basic conversation counts."""

    with get_connection() as connection:
        total = int(connection.execute("SELECT COUNT(*) FROM messages").fetchone()[0])
        users = int(
            connection.execute("SELECT COUNT(*) FROM messages WHERE role = 'user'").fetchone()[0]
        )
        assistants = int(
            connection.execute(
                "SELECT COUNT(*) FROM messages WHERE role = 'assistant'"
            ).fetchone()[0]
        )
    return {
        "total_messages": total,
        "user_messages": users,
        "assistant_messages": assistants,
    }
