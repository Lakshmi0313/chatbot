"""Prompt templates for memory-grounded responses."""

from __future__ import annotations


SYSTEM_PROMPT = "You are an intelligent AI assistant with memory."


def build_prompt(retrieved_memories: str, chat_history: str, query: str) -> str:
    """Build the exact prompt structure used for the chat completion."""

    return f"""
System Prompt:
{SYSTEM_PROMPT}

Relevant User Memories:
{retrieved_memories or "No relevant user memories were retrieved."}

Recent Conversation:
{chat_history or "No recent conversation is available."}

Current User Query:
{query}

Generate a personalized response using both conversation context and retrieved memories.
""".strip()
