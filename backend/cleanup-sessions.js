// cleanup-sessions.js
const fs = require("fs");
const path = require("path");

const tokensDir = path.join(__dirname, "services", "tokens");
const sessionsFile = path.join(__dirname, "wppconnect", "sessions.json");
const removedFile = path.join(__dirname, "wppconnect", "removed-sessions.json");

// Utilitários
function getSessions() {
  if (!fs.existsSync(sessionsFile)) return [];
  try {
    return JSON.parse(fs.readFileSync(sessionsFile));
  } catch {
    console.warn("⚠️ sessions.json corrompido. Substituindo.");
    return [];
  }
}

function saveSessions(sessions) {
  fs.writeFileSync(sessionsFile, JSON.stringify(sessions, null, 2));
}

function getRemovedSessions() {
  if (!fs.existsSync(removedFile)) return [];
  try {
    return JSON.parse(fs.readFileSync(removedFile));
  } catch {
    console.warn("⚠️ removed-sessions.json corrompido. Substituindo.");
    return [];
  }
}

function markAsRemoved(sessionId) {
  const removed = getRemovedSessions();
  if (!removed.includes(sessionId)) {
    removed.push(sessionId);
    fs.writeFileSync(removedFile, JSON.stringify(removed, null, 2));
  }
}

// Limpeza
function removeSession(sessionId) {
  console.log(`Removendo sessão: ${sessionId}`);

  // Remove pasta em tokens/
  const tokenPath = path.join(tokensDir, sessionId);
  if (fs.existsSync(tokenPath)) {
    fs.rmSync(tokenPath, { recursive: true, force: true });
    console.log(`🗑️ Pasta tokens/${sessionId} removida.`);
  }

  // Remove do sessions.json
  const sessions = getSessions();
  const updated = sessions.filter((s) => s !== sessionId);
  if (updated.length < sessions.length) {
    saveSessions(updated);
    console.log(`✅ Sessão ${sessionId} removida de sessions.json`);
  }

  // Marca como removida
  markAsRemoved(sessionId);
  console.log(`📌 Sessão ${sessionId} registrada como removida.\n`);
}

// 🔍 Executa
const sessions = getSessions();
const folders = fs.existsSync(tokensDir) ? fs.readdirSync(tokensDir) : [];

folders.forEach((folder) => {
  if (!sessions.includes(folder)) {
    console.log(
      `⚠️ ${folder} não encontrada em sessions.json, removendo manualmente...`
    );
  }
  removeSession(folder);
});
