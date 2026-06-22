require('dotenv').config();
const path = require('path');
const fs = require('fs');
const express = require('express');
const cors = require('cors');

const { isMock, CHAT_MODEL, EMBEDDING_MODEL } = require('./providers/openai');
const documentsRouter = require('./routes/documents');
const chatRouter = require('./routes/chat');

const app = express();
app.use(cors());
app.use(express.json({ limit: '5mb' }));

// Health + mode info (handy for the UI banner).
app.get('/api/health', (req, res) => {
  res.json({
    ok: true,
    mode: isMock() ? 'mock' : 'openai',
    chatModel: CHAT_MODEL,
    embeddingModel: EMBEDDING_MODEL,
  });
});

app.use('/api/documents', documentsRouter);
app.use('/api/chat', chatRouter);

// In production, serve the built React client as static files from the same
// origin (so the client's relative /api calls just work — no CORS needed).
const clientDist = path.join(__dirname, '..', '..', 'client', 'dist');
if (fs.existsSync(clientDist)) {
  app.use(express.static(clientDist));
  // SPA fallback: any non-API GET returns index.html.
  app.get(/^(?!\/api).*/, (req, res) => {
    res.sendFile(path.join(clientDist, 'index.html'));
  });
}

// Centralized error handler.
app.use((err, req, res, next) => {
  console.error(err);
  res.status(err.status || 500).json({ error: err.message || 'Internal server error.' });
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`\n  Chat with Notes API → http://localhost:${PORT}`);
  console.log(`  Mode: ${isMock() ? 'MOCK (no OpenAI key — offline embeddings + answers)' : 'OpenAI (live)'}`);
  if (!process.env.DATABASE_URL) {
    console.log('  ⚠  DATABASE_URL not set — add it to server/.env and run `npm run migrate`.\n');
  } else {
    console.log('');
  }
});
