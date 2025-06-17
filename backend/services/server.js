const express = require("express");
const path = require("path");
const cors = require("cors");
const app = express();

const PORT = process.env.PORT || 8080;

// CORS
app.use(cors({
  origin: 'https://marshall-whatsapp-auto.onrender.com',
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// === Sessão WPPConnect ===
const {
  initSession,
  getSavedSessions,
} = require("../wppconnect/sessionManager");

const qrCodes = {};

// Inicializa sessão com QR
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

// Restaura sessões salvas
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

// === Rotas de API ===
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

app.use("/api/session", require("../routes/session"));
app.use("/api/messages", require("../routes/messages"));
app.use("/api/media", require("../routes/media"));
app.use("/api/labels", require("../routes/labels"));
app.use("/api/status", require("../routes/status"));
app.use("/api/file-bulk", require("../routes/fileBulk"));

// === Servir frontend buildado (Vite) ===
// Garante que o frontend estático seja servido
app.use(express.static(path.join(__dirname, "../../frontend/dist")));

// Suporte para rotas do React Router
app.get("*", (req, res) => {
  res.sendFile(path.join(__dirname, "../../frontend/dist/index.html"));
});

// === Iniciar servidor ===
app.listen(PORT, async () => {
  console.log(`🟢 Servidor rodando na porta ${PORT}`);
  await restoreSessions();
});

// Exporta QR e função de sessão
module.exports = {
  initSessionWithQR,
  qrCodes,
};
