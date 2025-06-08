const express = require("express");
const router = express.Router();

const {
  initSession,
  getQr,
  getActiveSessions,
  removeSession,
} = require("../wppconnect/sessionManager");

// Iniciar sessão: POST /api/session/start
router.post("/start", async (req, res) => {
  const { sessionId } = req.body;

  if (!sessionId) {
    return res.status(400).json({ error: "sessionId é obrigatório" });
  }

  try {
    await initSession(sessionId);
    res.json({ success: true, message: `Sessão ${sessionId} iniciada.` });
  } catch (error) {
    console.error("❌ Erro ao iniciar sessão:", error);
    res
      .status(500)
      .json({ error: "Erro ao iniciar sessão", detail: error.message });
  }
});

// Pegar QR code da sessão: GET /api/session/qr/:sessionId
router.get("/qr/:sessionId", (req, res) => {
  const sessionId = req.params.sessionId;
  const qr = getQr(sessionId);

  if (!qr) {
    return res
      .status(404)
      .json({ error: "QR Code não disponível ou sessão já autenticada" });
  }

  res.json({ qrCodeBase64: qr });
});

// Listar sessões ativas: GET /api/session/active
router.get("/active", (req, res) => {
  const activeSessions = getActiveSessions();
  res.json({ activeSessions });
});

// Remover sessão: DELETE /api/session/:sessionId
router.delete("/:sessionId", async (req, res) => {
  const sessionId = req.params.sessionId;

  try {
    await removeSession(sessionId);
    res.json({ message: `Sessão ${sessionId} removida.` });
  } catch (error) {
    console.error("❌ Erro ao remover sessão:", error);
    res
      .status(500)
      .json({ error: "Erro ao remover sessão", detail: error.message });
  }
});

const { getSavedSessions } = require("../wppconnect/sessionManager");

// Listar todas as sessões já criadas: GET /api/session/list
router.get("/list", (req, res) => {
  const sessions = getSavedSessions();
  res.json({ sessions });
});

module.exports = router;
