const express = require('express');
const { ask } = require('../services/ask');

const router = express.Router();

// POST /api/chat — { question }
router.post('/', async (req, res, next) => {
  try {
    const result = await ask(req.body.question);
    res.json(result);
  } catch (err) {
    next(err);
  }
});

module.exports = router;
