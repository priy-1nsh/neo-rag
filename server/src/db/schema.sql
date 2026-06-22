-- pgvector powers similarity search. Available on Neon/Supabase by default.
CREATE EXTENSION IF NOT EXISTS vector;

-- One row per uploaded/pasted source document.
CREATE TABLE IF NOT EXISTS documents (
  id          SERIAL PRIMARY KEY,
  title       TEXT        NOT NULL,
  source_type TEXT        NOT NULL,            -- 'pdf' | 'text' | 'markdown' | 'paste'
  char_count  INTEGER     NOT NULL DEFAULT 0,
  chunk_count INTEGER     NOT NULL DEFAULT 0,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- One row per chunk of a document, with its embedding vector.
-- 1536 dimensions = OpenAI text-embedding-3-small (and the mock provider matches it).
CREATE TABLE IF NOT EXISTS chunks (
  id          SERIAL PRIMARY KEY,
  document_id INTEGER     NOT NULL REFERENCES documents(id) ON DELETE CASCADE,
  chunk_index INTEGER     NOT NULL,
  content     TEXT        NOT NULL,
  embedding   vector(1536),
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS chunks_document_id_idx ON chunks (document_id);

-- HNSW index for fast approximate cosine-similarity search (pgvector >= 0.5).
-- No training step required, unlike ivfflat.
CREATE INDEX IF NOT EXISTS chunks_embedding_idx
  ON chunks USING hnsw (embedding vector_cosine_ops);
