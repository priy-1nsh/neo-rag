// Ingestion pipeline: text -> chunks -> embeddings -> stored rows.
const db = require('../db');
const { chunkText } = require('./chunk');
const { embed } = require('../providers/openai');
const { toVectorLiteral } = require('./vector');

// Ingest already-extracted text as a single document.
// Returns { id, title, chunkCount, charCount }.
async function ingestText({ title, text, sourceType }) {
  const clean = String(text || '').trim();
  if (!clean) {
    const err = new Error('Document is empty after extraction.');
    err.status = 400;
    throw err;
  }

  const chunks = chunkText(clean);
  if (!chunks.length) {
    const err = new Error('Could not split the document into any chunks.');
    err.status = 400;
    throw err;
  }

  // Embed all chunks (one API call in real mode; local loop in mock mode).
  const embeddings = await embed(chunks);

  return db.withTransaction(async (client) => {
    const docRes = await client.query(
      `INSERT INTO documents (title, source_type, char_count, chunk_count)
       VALUES ($1, $2, $3, $4)
       RETURNING id, title, source_type, char_count, chunk_count, created_at`,
      [title, sourceType, clean.length, chunks.length]
    );
    const doc = docRes.rows[0];

    for (let i = 0; i < chunks.length; i++) {
      await client.query(
        `INSERT INTO chunks (document_id, chunk_index, content, embedding)
         VALUES ($1, $2, $3, $4::vector)`,
        [doc.id, i, chunks[i], toVectorLiteral(embeddings[i])]
      );
    }

    return {
      id: doc.id,
      title: doc.title,
      sourceType: doc.source_type,
      charCount: doc.char_count,
      chunkCount: doc.chunk_count,
      createdAt: doc.created_at,
    };
  });
}

async function listDocuments() {
  const res = await db.query(
    `SELECT id, title, source_type AS "sourceType", char_count AS "charCount",
            chunk_count AS "chunkCount", created_at AS "createdAt"
     FROM documents
     ORDER BY created_at DESC`
  );
  return res.rows;
}

async function deleteDocument(id) {
  const res = await db.query('DELETE FROM documents WHERE id = $1 RETURNING id', [id]);
  return res.rowCount > 0;
}

module.exports = { ingestText, listDocuments, deleteDocument };
