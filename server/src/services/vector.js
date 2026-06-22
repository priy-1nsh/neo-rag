// Serialize a JS number[] into the text literal pgvector expects: "[0.1,0.2,...]"
// Used with an explicit ::vector cast in queries.
function toVectorLiteral(embedding) {
  return `[${embedding.join(',')}]`;
}

module.exports = { toVectorLiteral };
