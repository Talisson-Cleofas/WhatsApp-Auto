// backend/services/server.js
const express = require("express");
const cors = require("cors");
const app = express();
const PORT = process.env.PORT || 3000;

const {
  initSession,
  getSavedSessions,
} = require("../wppconnect/sessionManager");

const path = require("path");

// Middlewares globais
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Objeto para guardar QR codes ativos
const qrCodes = {};

// Inicializa sessão com QR Code e handlers
async function initSessionWithQR(sessionId) {
  return initSession(sessionId, {
    headless: true,
    qrTimeout: 0,
    catchQR: (qrCode, asciiQR) => {
      console.log(`📸 QR code recebido para sessão ${sessionId}`);
      qrCodes[sessionId] = qrCode;
    },
    statusFind: (status) => {
      console.log(`📶 Status da sessão ${sessionId}:`, status);
      if (status === "CONNECTED") {
        delete qrCodes[sessionId];
      }
    },
  });
}

// Restaura sessões anteriores ao subir o servidor
async function restoreSessions() {
  const sessions = getSavedSessions();
  for (const sessionId of sessions) {
    try {
      await initSessionWithQR(sessionId);
      console.log(`♻️ Sessão restaurada: ${sessionId}`);
    } catch (err) {
      console.error(`❌ Falha ao restaurar ${sessionId}:`, err.message);
    }
  }
}

// Rota para obter QR code da sessão
app.get("/api/session/:sessionId/qr", (req, res) => {
  const { sessionId } = req.params;
  const qr = qrCodes[sessionId];
  if (qr) {
    res.json({ qr });
  } else {
    res.status(404).json({
      error: "QR code não disponível ou sessão já conectada",
    });
  }
});

// Rotas organizadas
app.use("/api/session", require("../routes/session"));
app.use("/api/messages", require("../routes/messages"));
app.use("/api/media", require("../routes/media"));
app.use("/api/labels", require("../routes/labels"));
app.use("/api/status", require("../routes/status"));
app.use("/api/file-bulk", require("../routes/fileBulk"));

// Rota raiz
app.get("/", (req, res) => res.send("🚀 Servidor rodando!"));

app.listen(PORT, async () => {
  console.log(`🟢 Servidor rodando na porta ${PORT}`);
  await restoreSessions();
});

// Exporta para uso externo (ex: rotas de sessão)
module.exports = {
  initSessionWithQR,
  qrCodes,
};
