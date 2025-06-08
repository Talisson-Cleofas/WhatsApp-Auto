// routes/status.js
const express = require("express");
const router = express.Router();

const {
  getSession,
  getQr,
  getActiveSessions,
  removeSession,
} = require("../wppconnect/sessionManager");

// GET QR Code da sessão
router.get("/qr", (req, res) => {
  const sessionId = req.query.sessionId;
  if (!sessionId)
    return res.status(400).json({ error: "sessionId é obrigatório" });

  const qr = getQr(sessionId);
  if (!qr) return res.status(404).json({ error: "QR Code não disponível" });

  res.json({ sessionId, qr });
});

// GET sessões ativas
router.get("/sessions", (req, res) => {
  const sessions = getActiveSessions();
  res.json({ sessions });
});

// POST logout da sessão
router.post("/logout", async (req, res) => {
  const sessionId = req.body.sessionId;
  if (!sessionId)
    return res.status(400).json({ error: "sessionId é obrigatório" });

  try {
    await removeSession(sessionId);
    res.json({ success: true, message: `Sessão ${sessionId} removida.` });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET status da sessão
router.get("/ping", async (req, res) => {
  const sessionId = req.query.sessionId;
  if (!sessionId)
    return res.status(400).json({ error: "sessionId é obrigatório" });

  const client = getSession(sessionId);

  if (!client) {
    return res.json({
      connected: false,
      status: "Sessão não encontrada",
    });
  }

  try {
    const isConnected = await client.isConnected();
    let state = "UNKNOWN";

    try {
      state = await client.getConnectionState();
    } catch (e) {
      console.warn(`Falha ao obter estado da sessão ${sessionId}:`, e.message);
    }

    res.json({
      connected: isConnected,
      state,
      sessionId,
    });
  } catch (err) {
    console.error(
      `Erro ao verificar status da sessão ${sessionId}:`,
      err.message
    );
    res.json({
      connected: false,
      state: "ERROR",
      sessionId,
      error: err.message,
    });
  }
});

module.exports = router;
