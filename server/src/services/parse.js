// Extract plain text from an uploaded file buffer based on its type.
const pdfParse = require('pdf-parse');

async function extractText(buffer, mimetype, originalname = '') {
  const name = originalname.toLowerCase();

  if (mimetype === 'application/pdf' || name.endsWith('.pdf')) {
    const data = await pdfParse(buffer);
    return { text: data.text, sourceType: 'pdf' };
  }

  if (name.endsWith('.md') || name.endsWith('.markdown')) {
    return { text: buffer.toString('utf8'), sourceType: 'markdown' };
  }

  // Default: treat as plain text (.txt and anything text-like).
  return { text: buffer.toString('utf8'), sourceType: 'text' };
}

module.exports = { extractText };
