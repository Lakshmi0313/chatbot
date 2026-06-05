"""Local Ollama integration for context-aware answers."""

from __future__ import annotations

from config import OLLAMA_MODEL, RECENT_HISTORY_LIMIT
from database import load_messages
from memory import MemoryResult
from prompts import SYSTEM_PROMPT, build_prompt


class Chatbot:
    """Generate assistant responses from retrieved memories and recent history."""

    def __init__(self) -> None:
        self.model = OLLAMA_MODEL

    def build_recent_history(self) -> str:
        """Format recent SQLite messages for the prompt."""

        messages = load_messages(limit=RECENT_HISTORY_LIMIT)

        return "\n".join(
            f"{message['role'].title()}: {message['content']}"
            for message in messages
        )

    def generate_response(
        self,
        query: str,
        memories: list[MemoryResult]
    ) -> str:
        """Generate response using local Ollama model."""

        prompt = build_prompt(
            retrieved_memories=self._format_memories(memories),
            chat_history=self.build_recent_history(),
            query=query,
        )

        try:
            from ollama import chat

            response = chat(
                model=self.model,
                messages=[
                    {
                        "role": "system",
                        "content": SYSTEM_PROMPT,
                    },
                    {
                        "role": "user",
                        "content": prompt,
                    },
                ],
            )

            message = response.get("message", {})
            content = message.get("content", "")
            return content.strip()

        except Exception as exc:
            raise RuntimeError(
                f"Ollama response generation failed: {exc}"
            ) from exc

    @staticmethod
    def _format_memories(
        memories: list[MemoryResult]
    ) -> str:
        """Format retrieved memories."""

        if not memories:
            return ""

        return "\n".join(
            f"{index}. {memory.text} "
            f"(similarity={memory.similarity:.2f})"
            for index, memory in enumerate(
                memories,
                start=1,
            )
            if memory.similarity is not None
        )
