"""Local SentenceTransformer embeddings and ChromaDB memory integration."""

from __future__ import annotations

import sys
from dataclasses import dataclass
from typing import Any, Optional

try:
    import pysqlite3  # type: ignore

    sys.modules["sqlite3"] = sys.modules.pop("pysqlite3")
except ImportError:
    pass

from config import CHROMA_DIR, EMBEDDING_MODEL


@dataclass
class MemoryResult:
    """A semantic memory returned from ChromaDB."""

    id: str
    text: str
    similarity: Optional[float]
    created_at: str

    def to_dict(self) -> dict:
        """Convert the memory result into an API-friendly dictionary."""

        return {
            "id": self.id,
            "text": self.text,
            "similarity": self.similarity,
            "created_at": self.created_at,
        }


_embedding_model: Optional[Any] = None


def get_embedding_model() -> Any:
    """Load the local embedding model once per backend process."""

    global _embedding_model
    if _embedding_model is None:
        try:
            from sentence_transformers import SentenceTransformer
        except ImportError as exc:
            raise RuntimeError(
                "sentence-transformers is not installed. Run "
                "`pip install -r backend/requirements.txt`."
            ) from exc
        _embedding_model = SentenceTransformer(EMBEDDING_MODEL)
    return _embedding_model


class MemoryStore:
    """Store user-message embeddings and retrieve relevant long-term memories."""

    def __init__(self) -> None:
        CHROMA_DIR.mkdir(parents=True, exist_ok=True)
        try:
            import chromadb

            self.chroma_client = chromadb.PersistentClient(path=str(CHROMA_DIR))
        except RuntimeError as exc:
            raise RuntimeError(
                "ChromaDB could not start. Use Python with SQLite 3.35+ or install a "
                "compatible pysqlite3 build for your platform."
            ) from exc
        self.collection = self.chroma_client.get_or_create_collection(
            name=self.collection_name,
            metadata={"hnsw:space": "cosine"},
        )

    @property
    def collection_name(self) -> str:
        """Return a collection name scoped to the active embedding model."""

        safe_model_name = EMBEDDING_MODEL.replace("/", "_").replace("-", "_").lower()
        return f"conversation_memories_{safe_model_name}"

    def generate_embedding(self, text: str) -> list[float]:
        """Generate an embedding vector for a user message or query."""

        try:
            embedding = get_embedding_model().encode(text)
            return embedding.tolist()
        except Exception as exc:
            raise RuntimeError(f"Local embedding generation failed: {exc}") from exc

    def add_memory(self, message_id: int, text: str, created_at: str) -> None:
        """Embed and upsert one user message into ChromaDB."""

        embedding = self.generate_embedding(text)
        self.collection.upsert(
            ids=[str(message_id)],
            embeddings=[embedding],
            documents=[text],
            metadatas=[{"message_id": message_id, "created_at": created_at}],
        )

    def retrieve_memories(self, query: str, limit: int = 5) -> list[MemoryResult]:
        """Retrieve the top semantically similar user memories."""

        total = self.count()
        if total == 0:
            return []

        query_embedding = self.generate_embedding(query)
        result = self.collection.query(
            query_embeddings=[query_embedding],
            n_results=min(limit, total),
            include=["documents", "metadatas", "distances"],
        )
        return self._parse_query_result(result)

    def list_memories(self, limit: int = 100) -> list[MemoryResult]:
        """Return stored memories for the memory panel."""

        result = self.collection.get(limit=limit, include=["documents", "metadatas"])
        memories: list[MemoryResult] = []
        for memory_id, document, metadata in zip(
            result.get("ids", []),
            result.get("documents", []),
            result.get("metadatas", []),
        ):
            memories.append(
                MemoryResult(
                    id=str(memory_id),
                    text=str(document),
                    similarity=None,
                    created_at=str((metadata or {}).get("created_at", "")),
                )
            )
        return memories

    def count(self) -> int:
        """Return the total number of vector memories."""

        return int(self.collection.count())

    def clear(self) -> None:
        """Delete and recreate the ChromaDB memory collection."""

        try:
            self.chroma_client.delete_collection(self.collection_name)
        except Exception:
            pass
        self.collection = self.chroma_client.get_or_create_collection(
            name=self.collection_name,
            metadata={"hnsw:space": "cosine"},
        )

    @staticmethod
    def format_memories(memories: list[MemoryResult]) -> str:
        """Format memories for prompt injection."""

        return "\n".join(
            f"{index}. {memory.text} (similarity={memory.similarity:.2f})"
            for index, memory in enumerate(memories, start=1)
            if memory.similarity is not None
        )

    @staticmethod
    def _parse_query_result(result: dict[str, Any]) -> list[MemoryResult]:
        """Convert ChromaDB query output into MemoryResult objects."""

        memories: list[MemoryResult] = []
        ids = result.get("ids", [[]])[0]
        documents = result.get("documents", [[]])[0]
        metadatas = result.get("metadatas", [[]])[0]
        distances = result.get("distances", [[]])[0]

        for memory_id, document, metadata, distance in zip(ids, documents, metadatas, distances):
            similarity = max(0.0, min(1.0, 1.0 - float(distance)))
            memories.append(
                MemoryResult(
                    id=str(memory_id),
                    text=str(document),
                    similarity=round(similarity, 4),
                    created_at=str((metadata or {}).get("created_at", "")),
                )
            )
        return memories
