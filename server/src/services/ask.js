// Orchestrates one question: retrieve -> guardrail check -> generate -> shape sources.
const { retrieve } = require('./retrieve');
const { chat } = require('../providers/openai');

// Below this cosine similarity, we treat retrieval as "no real match" and
// refuse to answer rather than forcing a weak/hallucinated response.
// (Mock embeddings score lower than real ones, so keep this permissive.)
const MIN_SIMILARITY = 0.05;

async function ask(question) {
  const q = String(question || '').trim();
  if (!q) {
    const err = new Error('Question is required.');
    err.status = 400;
    throw err;
  }

  const matches = await retrieve(q);
  const relevant = matches.filter((m) => m.similarity >= MIN_SIMILARITY);

  if (!relevant.length) {
    return {
      answer: "I don't know based on your notes.",
      sources: [],
      grounded: false,
    };
  }

  // Number the context blocks so the model can cite them as [1], [2], ...
  const contextBlocks = relevant.map((m, i) => ({
    citation: i + 1,
    content: m.content,
    documentTitle: m.documentTitle,
  }));

  const answer = await chat(q, contextBlocks);

  const sources = relevant.map((m, i) => ({
    citation: i + 1,
    documentId: m.documentId,
    documentTitle: m.documentTitle,
    similarity: Number(m.similarity.toFixed(4)),
    snippet: m.content.replace(/\s+/g, ' ').trim().slice(0, 300),
  }));

  return { answer, sources, grounded: true };
}

module.exports = { ask, MIN_SIMILARITY };
