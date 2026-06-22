// Retrieval: embed the query, then cosine-search the chunks table via pgvector.
const db = require('../db');
const { embedOne } = require('../providers/openai');
const { toVectorLiteral } = require('./vector');

const DEFAULT_TOP_K = 5;

// Returns top-k chunks ordered by similarity (1 = identical, 0 = orthogonal).
//   [{ id, documentId, documentTitle, content, similarity }]
async function retrieve(question, { topK = DEFAULT_TOP_K } = {}) {
  const queryEmbedding = await embedOne(question);
  const literal = toVectorLiteral(queryEmbedding);

  // <=> is pgvector cosine distance; similarity = 1 - distance.
  const res = await db.query(
    `SELECT c.id,
            c.document_id              AS "documentId",
            d.title                    AS "documentTitle",
            c.content,
            1 - (c.embedding <=> $1::vector) AS similarity
     FROM chunks c
     JOIN documents d ON d.id = c.document_id
     ORDER BY c.embedding <=> $1::vector
     LIMIT $2`,
    [literal, topK]
  );

  return res.rows;
}

module.exports = { retrieve, DEFAULT_TOP_K };
