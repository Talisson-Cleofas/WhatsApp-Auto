//sessionManager
const wppconnect = require("@wppconnect-team/wppconnect");
const puppeteer = require("puppeteer");
const fs = require("fs");
const path = require("path");

const clients = {};
const qrs = {};
const SESSIONS_FILE = path.join(__dirname, "sessions.json");
const REMOVED_SESSIONS_FILE = path.join(__dirname, "removed-sessions.json");

function getRemovedSessions() {
  if (!fs.existsSync(REMOVED_SESSIONS_FILE)) return [];
  try {
    return JSON.parse(fs.readFileSync(REMOVED_SESSIONS_FILE));
  } catch {
    console.warn("⚠️ removed-sessions.json corrompido. Substituindo.");
    return [];
  }
}

function markSessionAsRemoved(sessionId) {
  const removed = getRemovedSessions();
  if (!removed.includes(sessionId)) {
    removed.push(sessionId);
    fs.writeFileSync(REMOVED_SESSIONS_FILE, JSON.stringify(removed, null, 2));
  }
}

// Utilitários de arquivo
function getSavedSessions() {
  if (!fs.existsSync(SESSIONS_FILE)) return [];
  try {
    const saved = JSON.parse(fs.readFileSync(SESSIONS_FILE));
    const removed = getRemovedSessions();
    return saved.filter((s) => !removed.includes(s));
  } catch {
    console.warn("⚠️ sessions.json corrompido. Substituindo.");
    return [];
  }
}

function saveSessionToDisk(sessionId) {
  const data = getSavedSessions();
  if (!data.includes(sessionId)) {
    data.push(sessionId);
    fs.writeFileSync(SESSIONS_FILE, JSON.stringify(data, null, 2));
  }
}

function removeSessionFromDisk(sessionId) {
  const data = getSavedSessions();
  const updated = data.filter((s) => s !== sessionId);
  fs.writeFileSync(SESSIONS_FILE, JSON.stringify(updated, null, 2));
}

// Recuperadores
function getSession(sessionId) {
  return clients[sessionId] || null;
}

function getQr(sessionId) {
  return qrs[sessionId] || null;
}

function getActiveSessions() {
  return Object.keys(clients);
}

// Inicia uma nova sessão ou retorna a existente
async function initSession(sessionId, options = {}) {
  if (clients[sessionId]) return clients[sessionId];

  console.log(`🟡 Iniciando sessão ${sessionId}...`);

  let statusOk = false;

  const mergedOptions = {
    session: sessionId,
    headless: false,
    autoClose: false,
    useChrome: true,
    puppeteerOptions: {
  executablePath: process.env.PUPPETEER_EXECUTABLE_PATH || '/usr/bin/chromium',
  args: [
    '--no-sandbox',
    '--disable-setuid-sandbox',
    '--disable-dev-shm-usage',
    '--disable-gpu',
  ],
},
    disableSpins: true,
    disableWelcome: true,
    logQR: false,
    popup: false,
    catchQR: (qr) => {
      qrs[sessionId] = qr;
      console.log(`🔐 QR code gerado para sessão ${sessionId}.`);
      if (options.catchQR) options.catchQR(qr);
    },
    statusFind: (status) => {
      console.log(`📶 Status (${sessionId}):`, status);
      if (status === "CONNECTED" || status === "READY") {
        delete qrs[sessionId];
        statusOk = true;
      }
      if (options.statusFind) options.statusFind(status);
    },
    ...options,
  };

  try {
    const client = await wppconnect.create(mergedOptions);
    clients[sessionId] = client;
    saveSessionToDisk(sessionId);

    // Aguarda até que o status esteja OK ou um tempo limite (10s)
    const timeout = 10000;
    const interval = 200;
    let waited = 0;

    while (!statusOk && waited < timeout) {
      await new Promise((res) => setTimeout(res, interval));
      waited += interval;
    }

    if (statusOk) {
      console.log(`🟢 Sessão ${sessionId} iniciada com sucesso.`);
    } else {
      console.warn(
        `⚠️ Sessão ${sessionId} iniciada, mas ainda não está pronta.`
      );
    }

    return client;
  } catch (err) {
    console.error(
      `❌ Erro ao criar sessão ${sessionId}:`,
      err.stack || err.message
    );
    throw err;
  }
}

// Remove uma sessão ativa
async function removeSession(sessionId) {
  const client = clients[sessionId];
  if (client) {
    try {
      await client.logout();
      console.log(`🔒 Sessão ${sessionId} encerrada com sucesso.`);
    } catch (err) {
      console.warn(`⚠️ Erro ao fechar sessão ${sessionId}:`, err.message);
    }

    delete clients[sessionId];
    delete qrs[sessionId];
  }

  removeSessionFromDisk(sessionId);
  markSessionAsRemoved(sessionId); // 🔥 Marca como removida
}

// Restaura sessões salvas no disco ao iniciar o servidor
function restoreSavedSessions() {
  const saved = getSavedSessions();
  saved.forEach((sessionId) => {
    initSession(sessionId).catch((err) =>
      console.error(`❌ Erro ao restaurar sessão ${sessionId}:`, err.message)
    );
  });
}

module.exports = {
  initSession,
  getSession,
  getQr,
  getActiveSessions,
  removeSession,
  getSavedSessions,
  restoreSavedSessions,
};
