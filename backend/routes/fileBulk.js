// routes/fileBulk.js
const express = require("express");
const router = express.Router();
const multer = require("multer");
const fs = require("fs");
const path = require("path");
const os = require("os");
const ffmpeg = require("fluent-ffmpeg");
const ffmpegInstaller = require("@ffmpeg-installer/ffmpeg");
ffmpeg.setFfmpegPath(ffmpegInstaller.path);

const sessionMiddleware = require("../middlewares/sessionMiddleware");
const normalizeNumber = require("../utils/normalizeNumber");
const delay = require("../utils/delay");

const upload = multer({ dest: "uploads/" });
// console.log("Body:", req.body);
// console.log("File:", req.file);

function convertToOpus(inputPath) {
  return new Promise((resolve, reject) => {
    const outputPath = path.join(os.tmpdir(), `converted_${Date.now()}.opus`);
    ffmpeg(inputPath)
      .outputOptions([
        "-c:a libopus",
        "-b:a 64000",
        "-vbr on",
        "-application voip",
      ])
      .format("opus")
      .on("end", () => resolve(outputPath))
      .on("error", (err) => reject(err))
      .save(outputPath);
  });
}

// Envio de arquivo para múltiplos contatos com mensagem personalizada e delay
router.post(
  "/personalized",
  sessionMiddleware,
  upload.single("file"),
  async (req, res) => {
    console.log("contacts raw:", req.body.contacts);
    const { message, delayMin = 0, delayMax = 0 } = req.body;
    const contacts = JSON.parse(req.body.contacts || "[]");
    const file = req.file;

    if (!file || !Array.isArray(contacts) || contacts.length === 0) {
      return res.status(400).json({ error: "Arquivo ou contatos inválidos" });
    }

    const filePath = path.resolve(file.path);
    const ext = path.extname(file.originalname).toLowerCase();
    const isAudio = [".mp3", ".ogg", ".m4a", ".wav", ".aac"].includes(ext);
    const resultados = [];

    const minDelay = parseFloat(delayMin);
    const maxDelay = parseFloat(delayMax);
    const safeMin = isNaN(minDelay) || minDelay < 0 ? 0 : minDelay;
    const safeMax = isNaN(maxDelay) || maxDelay < safeMin ? safeMin : maxDelay;

    try {
      for (let i = 0; i < contacts.length; i++) {
        const { number, name } = contacts[i];
        const numero = normalizeNumber(number);
        const personalizedMessage = (message || "").replace(
          /\{name\}/gi,
          name || ""
        );

        try {
          if (typeof req.client.sendTypingState === "function") {
            await req.client.sendTypingState(numero);
            await delay(2000);
          }

          if (isAudio) {
            const opusPath = await convertToOpus(filePath);
            await req.client.sendPtt(numero, opusPath);
            if (personalizedMessage.trim()) {
              await delay(4000);
              await req.client.sendText(numero, personalizedMessage);
            }
            await fs.promises.unlink(opusPath);
          } else {
            await req.client.sendFile(
              numero,
              filePath,
              file.originalname,
              personalizedMessage
            );
          }

          resultados.push({ number, name, success: true });
        } catch (err) {
          resultados.push({ number, name, success: false, error: err.message });
        }

        if (i < contacts.length - 1 && safeMin >= 0 && safeMax >= safeMin) {
          const minMs = safeMin * 60000;
          const maxMs = safeMax * 60000;
          const wait = Math.floor(Math.random() * (maxMs - minMs + 1)) + minMs;
          console.log(
            `⏱ Aguardando ${Math.round(wait / 1000)}s antes do próximo envio...`
          );
          await delay(wait);
        }
      }

      await fs.promises.unlink(filePath);
      res.json({ resultados });
    } catch (err) {
      await fs.promises.unlink(filePath).catch(() => {});
      res.status(500).json({ error: err.message });
    }
  }
);

// Envio de arquivo único para vários números
router.post(
  "/to-multiple",
  sessionMiddleware,
  upload.single("file"),
  async (req, res) => {
    const { numbers, message } = req.body;
    const file = req.file;

    if (!numbers || !message || !file) {
      return res
        .status(400)
        .json({ error: "numbers, message e file são obrigatórios" });
    }

    let listNumbers;
    try {
      listNumbers = JSON.parse(numbers);
      if (!Array.isArray(listNumbers)) throw new Error();
    } catch {
      return res
        .status(400)
        .json({ error: "numbers deve ser um array JSON válido" });
    }

    const filePath = path.resolve(file.path);
    const resultados = [];

    for (const number of listNumbers) {
      try {
        const result = await req.client.sendFile(
          normalizeNumber(number),
          filePath,
          file.originalname,
          message
        );
        resultados.push({ number, success: true, result });
      } catch (err) {
        resultados.push({ number, success: false, error: err.message });
      }
    }

    fs.unlinkSync(filePath);
    res.json({ success: true, resultados });
  }
);

module.exports = router;
