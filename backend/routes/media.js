// routes/media.js
const express = require("express");
const router = express.Router();
const multer = require("multer");
const upload = multer({ dest: "uploads/" });

const sessionMiddleware = require("../middlewares/sessionMiddleware");
const normalizeNumber = require("../utils/normalizeNumber");
const fs = require("fs");
const path = require("path");

// Enviar mídia via base64 ou URL
router.post("/send", sessionMiddleware, async (req, res) => {
  const { number, message, media, fileName } = req.body;
  if (!number || !media || !fileName)
    return res
      .status(400)
      .json({ error: "number, media e fileName são obrigatórios" });

  try {
    const result = await req.client.sendFile(
      normalizeNumber(number),
      media,
      fileName,
      message || ""
    );
    res.json({ success: true, result });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Enviar mídia via upload
router.post(
  "/upload",
  sessionMiddleware,
  upload.single("file"),
  async (req, res) => {
    const { number, message } = req.body;
    const file = req.file;
    if (!file || !number)
      return res
        .status(400)
        .json({ error: "Arquivo e number são obrigatórios" });

    const filePath = path.resolve(file.path);
    try {
      const result = await req.client.sendFile(
        normalizeNumber(number),
        filePath,
        file.originalname,
        message || ""
      );
      fs.unlinkSync(filePath);
      res.json({ success: true, result });
    } catch (err) {
      fs.unlinkSync(filePath);
      res.status(500).json({ error: err.message });
    }
  }
);

module.exports = router;
