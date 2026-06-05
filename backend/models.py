"""Pydantic schemas for the FastAPI chat service."""

from __future__ import annotations

from typing import Optional

from pydantic import BaseModel, Field


class ChatRequest(BaseModel):
    """Incoming user message."""

    message: str = Field(..., min_length=1, max_length=8000)


class Message(BaseModel):
    """Stored conversation message."""

    id: int
    role: str
    content: str
    created_at: str


class Memory(BaseModel):
    """Stored or retrieved semantic memory."""

    id: str
    text: str
    similarity: Optional[float] = None
    created_at: str


class ChatResponse(BaseModel):
    """Assistant response plus retrieval metadata for the UI."""

    user_message: Message
    assistant_message: Message
    retrieved_memories: list[Memory]
    total_memories: int


class HistoryResponse(BaseModel):
    """Conversation history payload."""

    messages: list[Message]


class MemoriesResponse(BaseModel):
    """Memory panel payload."""

    memories: list[Memory]
    total_memories: int


class StatsResponse(BaseModel):
    """Conversation statistics shown in the frontend."""

    total_messages: int
    user_messages: int
    assistant_messages: int
    total_memories: int
