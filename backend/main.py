"""FastAPI application for the AI-powered conversational assistant."""

from __future__ import annotations

from contextlib import asynccontextmanager
from typing import Optional

from dotenv import load_dotenv
from fastapi import FastAPI, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware

from chatbot import Chatbot
from database import clear_messages, get_stats, init_db, load_messages, save_message
from memory import MemoryStore
from models import (
    ChatRequest,
    ChatResponse,
    HistoryResponse,
    MemoriesResponse,
    StatsResponse,
)


load_dotenv()


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Initialize persistent storage when the API starts."""

    init_db()
    yield


app = FastAPI(
    title="AI-Powered Conversational Assistant with Memory",
    version="1.0.0",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://127.0.0.1:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


def get_memory_store() -> MemoryStore:
    """Create a ChromaDB-backed memory store for the request."""

    return MemoryStore()


def get_chatbot() -> Chatbot:
    """Create an Ollama chatbot client for the request."""

    return Chatbot()


@app.get("/health")
def health() -> dict:
    """Small health check endpoint for setup verification."""

    return {"status": "ok"}


@app.post("/chat", response_model=ChatResponse)
def chat(payload: ChatRequest) -> dict:
    """Process one chat turn using semantic memory retrieval."""

    query = payload.message.strip()
    try:
        memory_store = get_memory_store()
        retrieved = memory_store.retrieve_memories(query, limit=5)
        assistant_text = get_chatbot().generate_response(query, retrieved)

        user_message = save_message("user", query)
        memory_store.add_memory(
            message_id=user_message["id"],
            text=user_message["content"],
            created_at=user_message["created_at"],
        )
        assistant_message = save_message("assistant", assistant_text)

        return {
            "user_message": user_message,
            "assistant_message": assistant_message,
            "retrieved_memories": [memory.to_dict() for memory in retrieved],
            "total_memories": memory_store.count(),
        }
    except RuntimeError as exc:
        raise HTTPException(status_code=502, detail=str(exc)) from exc
    except Exception as exc:
        raise HTTPException(status_code=500, detail=f"Chat request failed: {exc}") from exc


@app.get("/history", response_model=HistoryResponse)
def history(search: Optional[str] = Query(default=None)) -> dict:
    """Return saved conversation history, optionally searched by text."""

    return {"messages": load_messages(search=search)}


@app.get("/memories", response_model=MemoriesResponse)
def memories() -> dict:
    """Return stored vector memories for the memory panel."""

    try:
        memory_store = get_memory_store()
        stored = memory_store.list_memories()
        return {
            "memories": [memory.to_dict() for memory in stored],
            "total_memories": memory_store.count(),
        }
    except RuntimeError:
        return {"memories": [], "total_memories": 0}


@app.get("/stats", response_model=StatsResponse)
def stats() -> dict:
    """Return conversation and memory counts."""

    try:
        memory_store = get_memory_store()
        return {**get_stats(), "total_memories": memory_store.count()}
    except RuntimeError:
        return {**get_stats(), "total_memories": 0}


@app.get("/export", response_model=HistoryResponse)
def export_history() -> dict:
    """Return the complete history for frontend JSON export."""

    return {"messages": load_messages()}


@app.delete("/history")
def delete_history() -> dict:
    """Clear conversations and associated vector memories."""

    clear_messages()
    try:
        get_memory_store().clear()
    except RuntimeError:
        pass
    return {"status": "cleared"}
