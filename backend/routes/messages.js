// routes/messages.js
const express = require("express");
const router = express.Router();
const sessionMiddleware = require("../middlewares/sessionMiddleware");
const normalizeNumber = require("../utils/normalizeNumber");
const delay = require("../utils/delay");

// Envio de mensagem simples
router.post("/send", sessionMiddleware, async (req, res) => {
  const { number, message } = req.body;
  if (!number || !message)
    return res.status(400).json({ error: "number e message são obrigatórios" });

  try {
    const result = await req.client.sendText(normalizeNumber(number), message);
    res.json({ success: true, result });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Envio em lote com delay
router.post("/batch", sessionMiddleware, async (req, res) => {
  const { messages = [], delayMin = 0, delayMax = 0 } = req.body;
  if (!Array.isArray(messages) || messages.length === 0) {
    return res
      .status(400)
      .json({ error: "messages deve ser uma lista válida" });
  }

  const resultados = [];
  for (let i = 0; i < messages.length; i++) {
    const { number, message } = messages[i];
    const numero = normalizeNumber(number);

    try {
      const result = await req.client.sendText(numero, message);
      resultados.push({ number, success: true, result });
    } catch (err) {
      resultados.push({ number, success: false, error: err.message });
    }

    if (i < messages.length - 1) {
      const minMs = delayMin * 60000;
      const maxMs = delayMax * 60000;
      const wait = Math.floor(Math.random() * (maxMs - minMs + 1)) + minMs;
      await delay(wait);
    }
  }

  res.json({ success: true, resultados });
});

module.exports = router;
