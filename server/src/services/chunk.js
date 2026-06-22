// Split long text into overlapping chunks suitable for embedding.
//
// Strategy: greedily pack paragraphs into ~CHUNK_SIZE-char windows, carrying a
// small overlap between consecutive chunks so context isn't lost at boundaries.
// Paragraphs longer than the window are hard-split.

const CHUNK_SIZE = 1000;   // target characters per chunk
const CHUNK_OVERLAP = 150; // characters repeated from the previous chunk

function hardSplit(text, size) {
  const pieces = [];
  for (let i = 0; i < text.length; i += size) {
    pieces.push(text.slice(i, i + size));
  }
  return pieces;
}

function chunkText(raw, { chunkSize = CHUNK_SIZE, overlap = CHUNK_OVERLAP } = {}) {
  const text = String(raw).replace(/\r\n/g, '\n').trim();
  if (!text) return [];

  // Split into paragraph-ish units first.
  const paragraphs = text
    .split(/\n\s*\n/)
    .flatMap((p) => (p.length > chunkSize ? hardSplit(p, chunkSize) : [p]))
    .map((p) => p.trim())
    .filter(Boolean);

  const chunks = [];
  let current = '';

  for (const para of paragraphs) {
    if (current && current.length + para.length + 2 > chunkSize) {
      chunks.push(current.trim());
      // Start the next chunk with the tail of the previous one (overlap).
      current = overlap > 0 ? current.slice(-overlap) + '\n\n' : '';
    }
    current += (current ? '\n\n' : '') + para;
  }
  if (current.trim()) chunks.push(current.trim());

  return chunks;
}

module.exports = { chunkText, CHUNK_SIZE, CHUNK_OVERLAP };
