# Neo — Ask about your documents

Neo is a full-stack, end-to-end **Retrieval-Augmented Generation (RAG)** application.
Upload your notes — PDF, Markdown, plain text, or pasted content — and ask questions
that are answered **strictly from your own documents**, with **inline citations** back
to the exact source passages.

**Live demo:** https://neo-rag.onrender.com

---

## Features

- **Document ingestion** — PDF, Markdown, `.txt`, and direct paste, parsed and chunked automatically.
- **Semantic search** — documents are embedded and retrieved by meaning, not keywords, using vector similarity.
- **Grounded answers** — responses are constrained to the retrieved context; if the answer isn't in your notes, Neo says so instead of hallucinating.
- **Inline citations** — every answer references the source chunks it used, viewable in the UI.
- **Provider-flexible** — runs live on OpenAI when an API key is present, or in a fully offline mode for zero-cost development and demos.

## Tech stack

| Layer        | Technology                                              |
| ------------ | ------------------------------------------------------ |
| Frontend     | React, Vite, Tailwind CSS                              |
| Backend      | Node.js, Express                                       |
| Vector store | PostgreSQL with the `pgvector` extension (HNSW index)  |
| Embeddings   | OpenAI `text-embedding-3-small` (1536-dim)            |
| Generation   | OpenAI `gpt-4o-mini`                                   |

## How it works

```
Ingest:   document → extract text → chunk (overlapping) → embed → store vectors
Query:    question → embed → cosine search (top-k) → relevance filter → LLM with context → cited answer
```

Each answer is generated only from the top matching chunks, and the model is instructed
to cite them and to refuse when the context doesn't contain the answer.

## Project structure

```
.
├── client/        React + Vite + Tailwind frontend
├── server/        Express API, RAG pipeline, database layer
│   └── src/
│       ├── db/          Postgres pool, schema, migration
│       ├── providers/   Embedding + chat provider (OpenAI / offline)
│       ├── services/    parse · chunk · embed · retrieve · answer
│       └── routes/      /api/documents, /api/chat
└── render.yaml    Single-service deployment blueprint
```

## Local development

**Prerequisites:** Node.js 20+, and a PostgreSQL database with `pgvector`
([Neon](https://neon.tech) provides this on its free tier).

```bash
# Backend
cd server
npm install
cp .env.example .env          # set DATABASE_URL (and OPENAI_API_KEY for live mode)
npm run migrate               # create tables + pgvector extension
npm run dev                   # http://localhost:3001

# Frontend (separate terminal)
cd client
npm install
npm run dev                   # http://localhost:5173
```

Without an `OPENAI_API_KEY`, the app runs in an offline mode that generates
deterministic local embeddings and grounded responses, so the full pipeline is
exercisable end-to-end without external calls.

## Deployment

Neo deploys as a **single Node service** — Express serves the built React client
alongside the API, so there is one URL and no CORS configuration.

1. Provision a PostgreSQL database with `pgvector` (e.g. Neon) and copy its connection string.
2. On [Render](https://render.com): **New → Blueprint** and select the repository
   (it reads `render.yaml`).
3. Set `DATABASE_URL` to the connection string. Optionally set `OPENAI_API_KEY`.
4. Deploy. The build installs both workspaces, builds the client, runs the database
   migration, and starts the server. Health check: `/api/health`.

## API

| Method   | Endpoint                  | Description                          |
| -------- | ------------------------- | ----------------------------------- |
| `GET`    | `/api/health`             | Service status and active mode      |
| `GET`    | `/api/documents`          | List ingested documents             |
| `POST`   | `/api/documents/upload`   | Upload a file (`multipart/form-data`) |
| `POST`   | `/api/documents/paste`    | Ingest pasted text                  |
| `DELETE` | `/api/documents/:id`      | Delete a document and its chunks    |
| `POST`   | `/api/chat`               | Ask a question; returns a cited answer |
