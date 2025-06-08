// routes/labels.js
const express = require("express");
const router = express.Router();
const fs = require("fs");
const path = require("path");
const { readJson, saveJson } = require("../utils/fileStorage");
const normalizeNumber = require("../utils/normalizeNumber");
const delay = require("../utils/delay");
const sessionMiddleware = require("../middlewares/sessionMiddleware");

const labelsPath = path.resolve("labels.json");
const assocPath = path.resolve("labelConversations.json");

// Listar etiquetas
router.get("/", (req, res) => {
  const labels = readJson(labelsPath);
  res.json(labels);
});

// Criar nova etiqueta
router.post("/", (req, res) => {
  const { name } = req.body;
  if (!name) return res.status(400).json({ error: "Nome é obrigatório" });

  const labels = readJson(labelsPath);
  const id = Date.now().toString();
  const label = { id, name };
  labels.push(label);
  saveJson(labelsPath, labels);

  res.status(201).json(label);
});

// Deletar etiqueta
router.delete("/:id", (req, res) => {
  const id = req.params.id;
  const labels = readJson(labelsPath);
  const newLabels = labels.filter((l) => l.id !== id);
  saveJson(labelsPath, newLabels);

  const assoc = readJson(assocPath, {});
  delete assoc[id];
  saveJson(assocPath, assoc);

  res.json({ success: true });
});

// Associar números à etiqueta
router.post("/:id/assign", (req, res) => {
  const id = req.params.id;
  const { contacts } = req.body;

  if (!Array.isArray(contacts)) {
    return res.status(400).json({ error: "contacts deve ser um array" });
  }

  const assoc = readJson(assocPath, {});
  if (!assoc[id]) assoc[id] = [];

  for (const { number, name } of contacts) {
    const exists = assoc[id].some((c) => c.number === number);
    if (!exists) assoc[id].push({ number, name });
  }

  saveJson(assocPath, assoc);
  res.json({ success: true });
});

// Remover número da etiqueta
router.post("/:id/remove", (req, res) => {
  const id = req.params.id;
  const { number } = req.body;
  const assoc = readJson(assocPath, {});

  if (!assoc[id])
    return res.status(404).json({ error: "Etiqueta não encontrada" });

  assoc[id] = assoc[id].filter((c) => c.number !== number);
  saveJson(assocPath, assoc);

  res.json({ success: true });
});

// Obter contatos da etiqueta
router.get("/:id/conversations", (req, res) => {
  const id = req.params.id;
  const assoc = readJson(assocPath, {});
  res.json(assoc[id] || []);
});

// Enviar mensagem para todos da etiqueta
router.post("/:id/send", sessionMiddleware, async (req, res) => {
  const id = req.params.id;
  const { message, delayMin = 0, delayMax = 0 } = req.body;
  if (!message)
    return res.status(400).json({ error: "Mensagem é obrigatória" });

  const assoc = readJson(assocPath, {});
  const contatos = assoc[id];
  if (!Array.isArray(contatos) || contatos.length === 0) {
    return res
      .status(400)
      .json({ error: "Nenhum contato associado à etiqueta" });
  }

  const resultados = [];
  for (let i = 0; i < contatos.length; i++) {
    const { number, name } = contatos[i];
    const msg = message.replace(/\{name\}/gi, name || "");

    try {
      const result = await req.client.sendText(normalizeNumber(number), msg);
      resultados.push({ number, success: true, result });
    } catch (err) {
      resultados.push({ number, success: false, error: err.message });
    }

    if (i < contatos.length - 1) {
      const minMs = delayMin * 60000;
      const maxMs = delayMax * 60000;
      const wait = Math.floor(Math.random() * (maxMs - minMs + 1)) + minMs;
      await delay(wait);
    }
  }

  res.json({ success: true, resultados });
});

module.exports = router;
