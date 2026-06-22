# 🤖 Neo — Ask about your documents

**Neo** is a full-stack, end-to-end **Retrieval-Augmented Generation** app. Upload your notes
(PDF / Markdown / plain text / pasted text), and ask questions answered **strictly
from your documents**, with **inline citations** back to the source chunks.

Built to showcase a production-shaped RAG pipeline in the JavaScript ecosystem.

## Stack

| Layer       | Tech                                                        |
| ----------- | ---------------------------------------------------------- |
| Frontend    | React + Vite + Tailwind CSS v4                              |
| Backend     | Node.js + Express                                          |
| Vector DB   | PostgreSQL + **pgvector** (HNSW cosine index)              |
| Embeddings  | OpenAI `text-embedding-3-small` (1536-dim)                 |
| Generation  | OpenAI `gpt-4o-mini`                                       |
| Guardrails  | Grounded-only system prompt · similarity threshold · cited sources |

## The RAG pipeline

```
Upload ─▶ Extract text ─▶ Chunk (1000 chars, 150 overlap) ─▶ Embed ─▶ Store in pgvector
Question ─▶ Embed query ─▶ Cosine search (top-k) ─▶ Guardrail filter ─▶ LLM w/ context ─▶ Cited answer
```

## Offline "mock" mode (no API key needed)

If `OPENAI_API_KEY` is **not** set, the backend automatically runs in **mock mode**:
deterministic local embeddings + templated grounded answers. The *entire* pipeline
(upload → chunk → vector search → cited answer) works with **zero credits**. Paste a
real key into `server/.env` and it switches to live OpenAI with **no code changes**.

## Setup

### 1. Database (free Neon Postgres)
Create a database at [neon.tech](https://neon.tech) and copy its connection string.
pgvector is available there by default.

### 2. Backend
```bash
cd server
npm install
cp .env.example .env          # then fill in DATABASE_URL (and OPENAI_API_KEY when you have one)
npm run migrate               # creates tables + pgvector extension
npm run dev                   # http://localhost:3001
```

### 3. Frontend
```bash
cd client
npm install
npm run dev                   # http://localhost:5173
```

Open http://localhost:5173, add a document, and start chatting.

## API

| Method | Route                      | Purpose                          |
| ------ | -------------------------- | -------------------------------- |
| GET    | `/api/health`              | Mode (mock/openai) + model info  |
| GET    | `/api/documents`           | List documents                   |
| POST   | `/api/documents/upload`    | Upload a file (multipart `file`) |
| POST   | `/api/documents/paste`     | Add pasted text `{title, text}`  |
| DELETE | `/api/documents/:id`       | Delete a document + its chunks   |
| POST   | `/api/chat`                | Ask `{question}` → cited answer  |

## Guardrails (interview talking points)

1. **Grounded-only** — the system prompt forbids outside knowledge; if the answer
   isn't in the retrieved context, the model returns `"I don't know based on your notes."`
2. **Relevance threshold** — if the best chunk's cosine similarity is too low, the
   app refuses before even calling the LLM.
3. **Inline citations** — every answer cites `[n]` markers linked to the exact source
   snippets, viewable in the UI.
