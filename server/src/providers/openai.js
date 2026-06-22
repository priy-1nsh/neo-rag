// Provider adapter: real OpenAI when OPENAI_API_KEY is set, otherwise a
// deterministic offline MOCK so the full RAG pipeline runs without credits.
//
// Both modes return identical shapes, so nothing downstream changes when you
// paste a real key into .env.

const crypto = require('crypto');

const EMBEDDING_DIM = 1536; // text-embedding-3-small
const CHAT_MODEL = process.env.OPENAI_CHAT_MODEL || 'gpt-4o-mini';
const EMBEDDING_MODEL = process.env.OPENAI_EMBEDDING_MODEL || 'text-embedding-3-small';

const hasKey = Boolean(process.env.OPENAI_API_KEY);

let client = null;
if (hasKey) {
  const OpenAI = require('openai');
  client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
}

function isMock() {
  return !hasKey;
}

// ---------------------------------------------------------------------------
// Embeddings
// ---------------------------------------------------------------------------

// Deterministic pseudo-embedding: hash tokens into a fixed-size vector, then
// L2-normalize. It is NOT semantically meaningful like a real model, but it is
// stable and lets cosine search + the whole pipeline work offline for demos.
function mockEmbed(text) {
  const vec = new Float64Array(EMBEDDING_DIM);
  const tokens = String(text).toLowerCase().match(/[a-z0-9]+/g) || [];
  for (const token of tokens) {
    const hash = crypto.createHash('md5').update(token).digest();
    // Spread each token's signal across a few dimensions.
    for (let i = 0; i < 8; i++) {
      const idx = hash.readUInt16BE(i * 2 % 14) % EMBEDDING_DIM;
      const sign = hash[i] % 2 === 0 ? 1 : -1;
      vec[idx] += sign;
    }
  }
  let norm = 0;
  for (let i = 0; i < EMBEDDING_DIM; i++) norm += vec[i] * vec[i];
  norm = Math.sqrt(norm) || 1;
  return Array.from(vec, (v) => v / norm);
}

async function embed(texts) {
  const input = Array.isArray(texts) ? texts : [texts];
  if (isMock()) {
    return input.map(mockEmbed);
  }
  const res = await client.embeddings.create({ model: EMBEDDING_MODEL, input });
  return res.data.map((d) => d.embedding);
}

async function embedOne(text) {
  return (await embed([text]))[0];
}

// ---------------------------------------------------------------------------
// Chat completion
// ---------------------------------------------------------------------------

function mockChat(question, contextBlocks) {
  if (!contextBlocks.length) {
    return "I don't know based on your notes. Try uploading a document that covers this topic.";
  }
  // Stitch a grounded-looking answer from the retrieved chunks, with citations.
  const cited = contextBlocks
    .slice(0, 3)
    .map((b) => {
      const snippet = b.content.replace(/\s+/g, ' ').trim().slice(0, 220);
      return `${snippet} [${b.citation}]`;
    })
    .join(' ');
  return (
    `(MOCK answer — add an OPENAI_API_KEY in server/.env for real generation.)\n\n` +
    `Based on your notes, here is what's relevant to "${question}":\n\n${cited}`
  );
}

// contextBlocks: [{ citation: 1, content, documentTitle }]
async function chat(question, contextBlocks) {
  if (isMock()) {
    return mockChat(question, contextBlocks);
  }

  const context = contextBlocks
    .map((b) => `[${b.citation}] (from "${b.documentTitle}")\n${b.content}`)
    .join('\n\n');

  const system =
    'You are a helpful study assistant that answers questions using ONLY the ' +
    'provided notes. Rules:\n' +
    '1. Answer strictly from the CONTEXT below. Do not use outside knowledge.\n' +
    "2. If the answer is not in the context, reply exactly: \"I don't know based on your notes.\"\n" +
    '3. Cite the sources you used inline with bracketed numbers like [1], [2] that ' +
    'match the context block numbers.\n' +
    '4. Be concise and accurate.';

  const user = `CONTEXT:\n${context}\n\nQUESTION: ${question}`;

  const res = await client.chat.completions.create({
    model: CHAT_MODEL,
    temperature: 0.2,
    messages: [
      { role: 'system', content: system },
      { role: 'user', content: user },
    ],
  });
  return res.choices[0].message.content.trim();
}

module.exports = { embed, embedOne, chat, isMock, EMBEDDING_DIM, CHAT_MODEL, EMBEDDING_MODEL };
