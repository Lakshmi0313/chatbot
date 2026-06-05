# Local AI Conversational Assistant With Memory

A full-stack, fully local conversational assistant built with FastAPI, React, Ollama, Llama 3.2, Sentence Transformers, ChromaDB, and SQLite.

The app stores chat history in SQLite, embeds every user message locally with `SentenceTransformer("all-MiniLM-L6-v2")`, persists semantic memories in ChromaDB, retrieves the top relevant memories for each new query, and generates context-aware responses with Ollama running `llama3.2`.

No API keys are required.

## Tech Stack

Frontend:

- React
- Vite
- Tailwind CSS
- Axios
- Lucide icons

Backend:

- FastAPI
- Python
- SQLite
- ChromaDB

Local AI:

- Ollama
- Llama 3.2
- Sentence Transformers
- `all-MiniLM-L6-v2`

## Features

- ChatGPT-style responsive chat interface
- User and assistant message bubbles
- Auto-scroll to the latest message
- Loading indicator while the local model responds
- Clear conversation button
- SQLite conversation history with timestamps
- Previous chat history loads on page refresh
- Local embedding generation for every user message
- ChromaDB persistent vector memory
- Top 5 semantic memory retrieval
- Context-aware local LLM responses
- Memory panel with retrieved memories, similarity scores, and total memory count
- Search past conversations
- Export chat history as JSON
- Dark mode
- Conversation statistics

## Folder Structure

```text
project/
|
|-- backend/
|   |-- main.py
|   |-- config.py
|   |-- database.py
|   |-- memory.py
|   |-- chatbot.py
|   |-- prompts.py
|   |-- models.py
|   |-- requirements.txt
|   |-- .env
|   |-- data/
|   `-- chroma_db/
|
|-- frontend/
|   |-- src/
|   |   |-- components/
|   |   |   |-- ChatBox.jsx
|   |   |   |-- Message.jsx
|   |   |   `-- MemoryPanel.jsx
|   |   |-- App.jsx
|   |   |-- api.js
|   |   |-- main.jsx
|   |   `-- styles.css
|   |-- package.json
|   |-- vite.config.js
|   |-- tailwind.config.js
|   |-- postcss.config.js
|   `-- index.html
|
|-- requirements.txt
`-- README.md
```

## Local RAG Flow

```text
User Message
-> FastAPI POST /chat
-> SentenceTransformer("all-MiniLM-L6-v2") creates query embedding
-> ChromaDB searches persistent semantic memory
-> Retrieve top 5 relevant user memories
-> Build prompt with retrieved memories and recent SQLite chat history
-> ollama.chat(model="llama3.2")
-> Save user and assistant messages in SQLite
-> Save user message embedding in ChromaDB
-> Return assistant response and memory metadata to React
```

## Prompt Template

```text
System Prompt:
You are an intelligent AI assistant with memory.

Relevant User Memories:
{retrieved_memories}

Recent Conversation:
{chat_history}

Current User Query:
{query}

Generate a personalized response using both conversation context and retrieved memories.
```

## Ollama Setup

Install Ollama from:

```text
https://ollama.com
```

Pull the local model:

```bash
ollama pull llama3.2
```

Confirm Ollama is running:

```bash
ollama list
```

The backend calls Ollama through the local Ollama service using:

```python
ollama.chat(model="llama3.2", messages=[...])
```

## Backend Setup

Use Python 3.10+ or a Python build with SQLite 3.35 or newer. ChromaDB requires modern SQLite support.

```bash
cd backend
python -m venv .venv
```

Activate the environment:

```bash
# Windows PowerShell
.venv\Scripts\Activate.ps1

# macOS/Linux
source .venv/bin/activate
```

Install dependencies:

```bash
pip install -r requirements.txt
```

Configure `backend/.env`:

```env
OLLAMA_MODEL=llama3.2
EMBEDDING_MODEL=all-MiniLM-L6-v2
DEFAULT_MEMORY_RESULTS=5
RECENT_HISTORY_LIMIT=12
```

Run the API:

```bash
uvicorn main:app --reload --port 8000
```

API docs:

```text
http://localhost:8000/docs
```

## Frontend Setup

In a second terminal:

```bash
cd frontend
npm install
npm run dev
```

Open:

```text
http://localhost:5173
```

If your API runs on a different URL, create `frontend/.env`:

```env
VITE_API_URL=http://localhost:8000
```

## API Endpoints

| Method | Endpoint | Description |
| --- | --- | --- |
| `GET` | `/health` | Health check |
| `POST` | `/chat` | Retrieves memories, calls Ollama, stores the turn, returns response metadata |
| `GET` | `/history` | Returns all saved conversation messages |
| `GET` | `/history?search=term` | Searches saved conversations |
| `GET` | `/memories` | Returns stored vector memories and memory count |
| `GET` | `/stats` | Returns message and memory statistics |
| `GET` | `/export` | Returns complete history for JSON export |
| `DELETE` | `/history` | Clears SQLite history and ChromaDB memory |

Example:

```bash
curl -X POST http://localhost:8000/chat \
  -H "Content-Type: application/json" \
  -d "{\"message\":\"Remember that I am preparing for software engineering placements.\"}"
```

## Persistence

SQLite database:

```text
backend/data/conversations.db
```

The `messages` table stores:

- `id`
- `role`
- `content`
- `created_at`

ChromaDB vector store:

```text
backend/chroma_db/
```

User messages are embedded locally and stored with:

- message id
- original text
- created timestamp
- embedding vector

The ChromaDB collection name is scoped to the embedding model so incompatible vectors from older embedding systems are not mixed with MiniLM vectors.

## Why This Is A Local AI System

- Llama 3.2 runs locally through Ollama.
- Embeddings are generated locally with Sentence Transformers.
- Chat history stays in local SQLite.
- Vector memory stays in local ChromaDB.
- The frontend talks only to the local FastAPI backend.
- No hosted AI API key is required.

## Troubleshooting

If `/chat` fails with an Ollama connection error, make sure Ollama is installed, running, and has the model:

```bash
ollama pull llama3.2
```

If the first chat request is slow, Sentence Transformers may be downloading or loading `all-MiniLM-L6-v2`.

If ChromaDB reports SQLite compatibility issues, use Python 3.10+ or a Python distribution with SQLite 3.35 or newer.

If the frontend cannot connect, confirm the backend is running on `http://localhost:8000`.
