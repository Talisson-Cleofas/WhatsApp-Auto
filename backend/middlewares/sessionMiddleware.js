//sessionMidlleware
const { initSession, getSession } = require("../wppconnect/sessionManager");

async function waitForConnection(client, timeoutMs = 30000) {
  return new Promise((resolve, reject) => {
    let resolved = false;

    const timeout = setTimeout(() => {
      if (!resolved) {
        resolved = true;
        reject(
          new Error("Timeout: cliente não conectou dentro do tempo limite")
        );
      }
    }, timeoutMs);

    if (typeof client.isConnected === "function" && client.isConnected()) {
      clearTimeout(timeout);
      resolved = true;
      return resolve();
    }

    client.once("ready", () => {
      if (!resolved) {
        resolved = true;
        clearTimeout(timeout);
        resolve();
      }
    });
  });
}

module.exports = async function sessionMiddleware(req, res, next) {
  // Busca sessionId em headers, query e body (nesta ordem)
  const sessionId =
    req.headers["x-session-id"] || req.query.sessionId || req.body.sessionId;

  if (!sessionId) {
    return res.status(400).json({ error: "sessionId é obrigatório" });
  }

  let client = getSession(sessionId);

  if (!client) {
    try {
      client = await initSession(sessionId);
    } catch (err) {
      return res.status(500).json({
        error: "Erro ao iniciar sessão",
        details: err.message,
      });
    }
  }

  try {
    await waitForConnection(client, 30000);
  } catch (err) {
    return res.status(500).json({
      error: "Cliente não conectou a tempo",
      details: err.message,
    });
  }

  req.client = client;
  req.sessionId = sessionId;
  next();
};
