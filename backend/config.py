"""Backend configuration for the local AI stack."""

from __future__ import annotations

import os
from pathlib import Path

from dotenv import load_dotenv


BASE_DIR = Path(__file__).resolve().parent
load_dotenv(BASE_DIR / ".env")

DATA_DIR = BASE_DIR / "data"
CHROMA_DIR = BASE_DIR / "chroma_db"
DATABASE_PATH = DATA_DIR / "conversations.db"

OLLAMA_MODEL = os.getenv("OLLAMA_MODEL", "llama3.2")
EMBEDDING_MODEL = os.getenv("EMBEDDING_MODEL", "all-MiniLM-L6-v2")

DEFAULT_MEMORY_RESULTS = int(os.getenv("DEFAULT_MEMORY_RESULTS", "5"))
RECENT_HISTORY_LIMIT = int(os.getenv("RECENT_HISTORY_LIMIT", "12"))
