const express = require('express');
const multer = require('multer');
const { extractText } = require('../services/parse');
const { ingestText, listDocuments, deleteDocument } = require('../services/ingest');

const router = express.Router();

// Keep uploads in memory; we only need the buffer to extract text.
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 15 * 1024 * 1024 }, // 15 MB
});

// GET /api/documents — list all documents
router.get('/', async (req, res, next) => {
  try {
    res.json({ documents: await listDocuments() });
  } catch (err) {
    next(err);
  }
});

// POST /api/documents/upload — multipart file (field name: "file")
router.post('/upload', upload.single('file'), async (req, res, next) => {
  try {
    if (!req.file) return res.status(400).json({ error: 'No file uploaded.' });
    const { text, sourceType } = await extractText(
      req.file.buffer,
      req.file.mimetype,
      req.file.originalname
    );
    const title = req.body.title?.trim() || req.file.originalname;
    const doc = await ingestText({ title, text, sourceType });
    res.status(201).json({ document: doc });
  } catch (err) {
    next(err);
  }
});

// POST /api/documents/paste — { title, text }
router.post('/paste', async (req, res, next) => {
  try {
    const { title, text } = req.body;
    if (!text?.trim()) return res.status(400).json({ error: 'Text is required.' });
    const doc = await ingestText({
      title: title?.trim() || 'Pasted note',
      text,
      sourceType: 'paste',
    });
    res.status(201).json({ document: doc });
  } catch (err) {
    next(err);
  }
});

// DELETE /api/documents/:id
router.delete('/:id', async (req, res, next) => {
  try {
    const ok = await deleteDocument(Number(req.params.id));
    if (!ok) return res.status(404).json({ error: 'Document not found.' });
    res.json({ deleted: true });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
