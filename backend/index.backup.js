// index.js
const express = require("express");
const cors = require("cors");
const multer = require("multer");
const fs = require("fs");
const path = require("path");
const wppconnect = require("@wppconnect-team/wppconnect");
const ffmpeg = require("fluent-ffmpeg");
const ffmpegInstaller = require("@ffmpeg-installer/ffmpeg");
ffmpeg.setFfmpegPath(ffmpegInstaller.path);
const os = require("os");
let lastQrCode = null;
let currentQr = null;
const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());
app.get("/", (req, res) => res.send("Servidor rodando!"));
app.listen(PORT, () => console.log("Servidor no ar na porta " + PORT));

let client = null;

app.use(cors());
app.use(express.json());

const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
const normalizeNumber = (number) =>
  number.includes("@c.us") ? number : `${number}@c.us`;

const upload = multer({ dest: "uploads/" });

const labelsFile = path.resolve(__dirname, "labels.json");

function readLabels() {
  try {
    if (!fs.existsSync(labelsFile)) return [];
    const data = fs.readFileSync(labelsFile, "utf-8");
    return JSON.parse(data);
  } catch {
    return [];
  }
}

function saveLabels(labels) {
  fs.writeFileSync(labelsFile, JSON.stringify(labels, null, 2));
}

const labelConversationsFile = path.resolve(
  __dirname,
  "labelConversations.json"
);

function readLabelConversations() {
  try {
    if (!fs.existsSync(labelConversationsFile)) return {};
    const data = fs.readFileSync(labelConversationsFile, "utf-8");
    return JSON.parse(data);
  } catch {
    return {};
  }
}

function saveLabelConversations(data) {
  fs.writeFileSync(labelConversationsFile, JSON.stringify(data, null, 2));
}

function readContacts() {
  // Exemplo estático, substitua pelos seus dados reais
  return [
    { number: "5511999999999", name: "João" },
    { number: "5511888888888", name: "Maria" },
  ];
}

// Convert qualquer áudio em .opus compatível com PTT
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

// Inicializar sessão WPPConnect
wppconnect
  .create({
    session: "minha-sessao-v2",
    headless: true,
    autoClose: false,
    useChrome: false,
    executablePath: require("puppeteer").executablePath(),
    puppeteerOptions: {
      args: ["--no-sandbox", "--disable-setuid-sandbox"],
    },
    catchQR: (qr, asciiQR, attempts, urlCode) => {
      console.log("📲 Escaneie o QR Code abaixo:");
      console.log(asciiQR);
      currentQr = qr;
    },
    statusFind: (status) => {
      console.log("📡 Status da sessão:", status);
    },
  })
  .then((newClient) => {
    client = newClient;
    console.log("✅ Cliente WPPConnect conectado");
  })
  .catch((err) => {
    console.error("❌ Erro ao iniciar o cliente:", err);
  });

// Nova rota
app.get("/qr", (req, res) => {
  if (!currentQr) {
    return res
      .status(404)
      .json({ success: false, message: "QR Code não disponível" });
  }
  res.json({ success: true, qr: currentQr });
});

// Middleware: verificar se o cliente está pronto
function checkClientConnected(req, res, next) {
  if (!client)
    return res
      .status(500)
      .json({ success: false, error: "Cliente não conectado" });
  next();
}

// ROTAS requsições ================================================

// Envio de texto simples
app.post("/send-message", checkClientConnected, async (req, res) => {
  const { number, message } = req.body;
  if (!number || !message)
    return res
      .status(400)
      .json({ success: false, error: "number e message são obrigatórios" });

  try {
    const numero = normalizeNumber(number);
    const result = await client.sendText(numero, message);
    res.json({ success: true, result });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Envio em lote com delay (texto)
app.post("/send-batch", checkClientConnected, async (req, res) => {
  const {
    messages,
    delayMin = 0, // minutos
    delayMax = 0, // minutos
  } = req.body;

  if (!Array.isArray(messages) || messages.length === 0) {
    return res
      .status(400)
      .json({ success: false, error: "messages deve ser um array não vazio" });
  }

  const resultados = [];

  const minDelay = parseFloat(delayMin);
  const maxDelay = parseFloat(delayMax);

  console.log("delayMin:", minDelay, "delayMax:", maxDelay);

  for (let i = 0; i < messages.length; i++) {
    const { number, message } = messages[i];

    if (!number || !message) {
      resultados.push({
        number,
        success: false,
        error: "Número ou mensagem ausente",
      });
      continue;
    }

    const formattedNumber = normalizeNumber(number);
    console.log(
      `\nEnviando mensagem para ${formattedNumber} [${i + 1}/${
        messages.length
      }]`
    );

    try {
      const result = await client.sendText(formattedNumber, message);
      resultados.push({ number, success: true, result });
    } catch (err) {
      resultados.push({ number, success: false, error: err.message });
    }

    if (i < messages.length - 1 && minDelay >= 0 && maxDelay >= minDelay) {
      const minMs = minDelay * 60 * 1000;
      const maxMs = maxDelay * 60 * 1000;
      const wait = Math.floor(Math.random() * (maxMs - minMs + 1)) + minMs;
      console.log(
        `Aguardando ${Math.round(
          wait / 1000
        )} segundos antes do próximo envio...`
      );
      await new Promise((resolve) => setTimeout(resolve, wait));
    }
  }

  res.json({ success: true, resultados });
});

// Envio de mídia por URL ou base64
app.post("/send-media", checkClientConnected, async (req, res) => {
  const { number, message, fileUrl, base64, filename, mimetype } = req.body;
  if (!number)
    return res
      .status(400)
      .json({ success: false, error: "number é obrigatório" });

  try {
    const numero = normalizeNumber(number);
    let result;

    if (fileUrl) {
      result = await client.sendFile(
        numero,
        fileUrl,
        filename || "file",
        message || ""
      );
    } else if (base64 && filename && mimetype) {
      result = await client.sendFileFromBase64(
        numero,
        base64,
        filename,
        message || ""
      );
    } else {
      return res.status(400).json({
        success: false,
        error: "Forneça fileUrl ou base64 com filename e mimetype",
      });
    }

    res.json({ success: true, result });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Envio por upload único
app.post(
  "/send-upload",
  checkClientConnected,
  upload.single("file"),
  async (req, res) => {
    const { number, message } = req.body;
    const file = req.file;
    if (!number || !file)
      return res
        .status(400)
        .json({ success: false, error: "number e file são obrigatórios" });

    const filePath = path.resolve(file.path);

    try {
      const result = await client.sendFile(
        normalizeNumber(number),
        filePath,
        file.originalname,
        message || ""
      );
      fs.unlinkSync(filePath);
      res.json({ success: true, result });
    } catch (err) {
      fs.unlinkSync(filePath);
      res.status(500).json({ success: false, error: err.message });
    }
  }
);

// Envio de arquivo para múltiplos contatos com personalização e voz
app.post(
  "/send-file-personalized",
  checkClientConnected,
  upload.single("file"),
  async (req, res) => {
    const {
      message,
      delayMin = 0, // minutos, valor padrão 0
      delayMax = 0, // minutos, valor padrão 0
    } = req.body;

    console.log("Delay recebido (em minutos):", delayMin, delayMax);

    const contacts = JSON.parse(req.body.contacts || "[]");
    const file = req.file;

    if (!file || !Array.isArray(contacts) || contacts.length === 0) {
      return res.status(400).json({ error: "Arquivo ou contatos inválidos" });
    }

    const filePath = path.resolve(file.path);
    const ext = path.extname(file.originalname).toLowerCase();
    const isAudio = [".mp3", ".ogg", ".m4a", ".wav", ".aac"].includes(ext);
    const resultados = [];

    // Converte delayMin e delayMax para float
    const minDelay = parseFloat(req.body.delayMin);
    const maxDelay = parseFloat(req.body.delayMax);

    const safeMinDelay = isNaN(minDelay) || minDelay < 0 ? 0 : minDelay;
    const safeMaxDelay =
      isNaN(maxDelay) || maxDelay < safeMinDelay ? safeMinDelay : maxDelay;

    try {
      for (let i = 0; i < contacts.length; i++) {
        const { number, name } = contacts[i];
        const numero = normalizeNumber(number);
        const personalizedMessage = (message || "").replace(
          /\{name\}/gi,
          name || ""
        );

        try {
          if (typeof client.sendTypingState === "function") {
            await client.sendTypingState(numero);
            await delay(2000);
          }

          if (isAudio) {
            const opusPath = await convertToOpus(filePath);
            await client.sendPtt(numero, opusPath);
            if (personalizedMessage.trim()) {
              await delay(4000);
              await client.sendText(numero, personalizedMessage);
            }
            await fs.promises.unlink(opusPath);
          } else {
            await client.sendFile(
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

        // Delay aleatório entre delayMin e delayMax (após cada envio, exceto o último)
        if (
          i < contacts.length - 1 &&
          safeMinDelay >= 0 &&
          safeMaxDelay >= safeMinDelay
        ) {
          const minMs = safeMinDelay * 60 * 1000;
          const maxMs = safeMaxDelay * 60 * 1000;
          const wait = Math.floor(Math.random() * (maxMs - minMs + 1)) + minMs;
          console.log(
            `Aguardando ${Math.round(
              wait / 1000
            )} segundos antes do próximo envio...`
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

// app.post(
//   "/send-file-personalized",
//   checkClientConnected,
//   upload.single("file"),
//   async (req, res) => {
//     const {
//       message,
//       delayMin = 0, // minutos
//       delayMax = 0, // minutos
//     } = req.body;

//     console.log("Delay recebido (em minutos):", delayMin, delayMax);

//     const contacts = JSON.parse(req.body.contacts || "[]");
//     const file = req.file;

//     if (!file || !Array.isArray(contacts) || contacts.length === 0) {
//       return res.status(400).json({ error: "Arquivo ou contatos inválidos" });
//     }

//     const filePath = path.resolve(file.path);
//     const ext = path.extname(file.originalname).toLowerCase();
//     const isAudio = [".mp3", ".ogg", ".m4a", ".wav", ".aac"].includes(ext);
//     const resultados = [];

//     const minDelay = parseFloat(delayMin);
//     const maxDelay = parseFloat(delayMax);

//     const safeMinDelay = isNaN(minDelay) || minDelay < 0 ? 0 : minDelay;
//     const safeMaxDelay =
//       isNaN(maxDelay) || maxDelay < safeMinDelay ? safeMinDelay : maxDelay;

//     try {
//       for (let i = 0; i < contacts.length; i++) {
//         const { number, name } = contacts[i];
//         const numero = normalizeNumber(number);
//         const personalizedMessage = (message || "").replace(
//           /\{name\}/gi,
//           name || ""
//         );
//         console.log(
//           `[${i + 1}/${
//             contacts.length
//           }] Enviando para ${numero} (${name}) às ${new Date().toISOString()}`
//         );

//         try {
//           if (typeof client.sendTypingState === "function") {
//             await client.sendTypingState(numero);
//             await delay(2000);
//           }

//           if (isAudio) {
//             const opusPath = await convertToOpus(filePath);
//             await client.sendPtt(numero, opusPath);
//             if (personalizedMessage.trim()) {
//               await delay(4000);
//               await client.sendText(numero, personalizedMessage);
//             }
//             await fs.promises.unlink(opusPath);
//           } else {
//             await client.sendFile(
//               numero,
//               filePath,
//               file.originalname,
//               personalizedMessage
//             );
//           }

//           resultados.push({ number, name, success: true });
//         } catch (err) {
//           resultados.push({ number, name, success: false, error: err.message });
//         }

//         if (
//           i < contacts.length - 1 &&
//           safeMinDelay >= 0 &&
//           safeMaxDelay >= safeMinDelay
//         ) {
//           const minMs = safeMinDelay * 60 * 1000;
//           const maxMs = safeMaxDelay * 60 * 1000;
//           const wait = Math.floor(Math.random() * (maxMs - minMs + 1)) + minMs;
//           console.log(
//             `Aguardando ${Math.round(
//               wait / 1000
//             )} segundos antes do próximo envio...`
//           );
//           await delay(wait);
//         }
//       }

//       await fs.promises.unlink(filePath);
//       res.json({ resultados });
//     } catch (err) {
//       await fs.promises.unlink(filePath).catch(() => {});
//       res.status(500).json({ error: err.message });
//     }
//   }
// );

// Envio de um arquivo único para múltiplos números
app.post(
  "/send-file-to-multiple",
  checkClientConnected,
  upload.single("file"),
  async (req, res) => {
    const { numbers, message } = req.body;
    const file = req.file;

    if (!numbers || !message || !file) {
      return res.status(400).json({
        success: false,
        error: "numbers, message e file são obrigatórios",
      });
    }

    let listNumbers;
    try {
      listNumbers = JSON.parse(numbers);
      if (!Array.isArray(listNumbers)) throw new Error();
    } catch {
      return res.status(400).json({
        success: false,
        error: "numbers deve ser um array JSON válido",
      });
    }

    const filePath = path.resolve(file.path);
    const resultados = [];

    for (const number of listNumbers) {
      try {
        const result = await client.sendFile(
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

// Rotas para gerenciar labels =============================

// Listar todas as labels
app.get("/labels", (req, res) => {
  const labels = readLabels();
  res.json(labels);
});

//retornar contatos da label com nome e número
app.get("/labels/:id/conversations", (req, res) => {
  const labelId = req.params.id;
  const labelConversations = readLabelConversations(); // { labelId: [number, ...] }
  const contacts = readContacts(); // [{ number, name }, ...]

  const numbers = labelConversations[labelId] || [];

  const contactsWithNames = numbers.map((number) => {
    const contact = contacts.find((c) => c.number === number);
    return {
      number,
      name: contact ? contact.name : "Sem nome",
    };
  });

  res.json({ success: true, labelId, contacts: contactsWithNames });
});

// Criar uma nova label
app.post("/labels", (req, res) => {
  const { name } = req.body;
  if (!name)
    return res.status(400).json({ error: "O campo 'name' é obrigatório" });

  const labels = readLabels();

  if (labels.find((l) => l.name.toLowerCase() === name.toLowerCase()))
    return res.status(400).json({ error: "Label já existe" });

  const newLabel = { id: Date.now().toString(), name };
  labels.push(newLabel);
  saveLabels(labels);
  res.status(201).json(newLabel);
});

// Deletar uma label pelo id
app.delete("/labels/:id", (req, res) => {
  const id = req.params.id;
  let labels = readLabels();
  const initialLength = labels.length;
  labels = labels.filter((l) => l.id !== id);

  if (labels.length === initialLength) {
    return res.status(404).json({ error: "Label não encontrada" });
  }

  saveLabels(labels);
  res.json({ success: true });
});

//rotas de Labels

function readLabels() {
  try {
    if (!fs.existsSync(labelsFile)) return [];
    const data = fs.readFileSync(labelsFile, "utf-8");
    return JSON.parse(data);
  } catch {
    return [];
  }
}

function saveLabels(labels) {
  fs.writeFileSync(labelsFile, JSON.stringify(labels, null, 2));
}

app.get("/labels", (req, res) => {
  const labels = readLabels();
  res.json({ success: true, labels });
});

app.post("/labels", (req, res) => {
  console.log("POST /labels req.body:", req.body);
  const { name } = req.body;
  if (!name || !name.trim()) {
    return res.status(400).json({ error: "O nome da etiqueta é obrigatório" });
  }

  const labels = readLabels();

  if (labels.find((l) => l.name.toLowerCase() === name.toLowerCase())) {
    return res.status(400).json({ error: "Label já existe" });
  }

  const newLabel = { id: Date.now().toString(), name: name.trim() };
  labels.push(newLabel);
  saveLabels(labels);

  res.status(201).json({ success: true, label: newLabel });
});

app.delete("/labels/:id", (req, res) => {
  const id = req.params.id;
  let labels = readLabels();
  const updated = labels.filter((label) => label.id !== id);

  if (updated.length === labels.length) {
    return res.status(404).json({ error: "Etiqueta não encontrada" });
  }

  saveLabels(updated);
  res.json({ success: true });
});

// Associa um número a uma label (só uma label por número)
app.post("/labels/:id/assign", (req, res) => {
  const labelId = req.params.id;
  const { number } = req.body;

  if (!number) {
    return res.status(400).json({ error: "O campo 'number' é obrigatório" });
  }

  const labels = readLabels();
  if (!labels.find((l) => l.id === labelId)) {
    return res.status(404).json({ error: "Label não encontrada" });
  }

  const labelConversations = readLabelConversations();

  // Remove o número de qualquer label existente
  for (const key of Object.keys(labelConversations)) {
    labelConversations[key] = labelConversations[key].filter(
      (num) => num !== number
    );
    if (labelConversations[key].length === 0) delete labelConversations[key];
  }

  // Adiciona número à nova label
  if (!labelConversations[labelId]) labelConversations[labelId] = [];
  labelConversations[labelId].push(number);

  saveLabelConversations(labelConversations);

  res.json({
    success: true,
    message: `Número ${number} associado à label ${labelId}`,
  });
});

// Remove um número de uma label (se existir)
app.post("/labels/:id/remove", (req, res) => {
  const labelId = req.params.id;
  const { number } = req.body;

  if (!number) {
    return res.status(400).json({ error: "O campo 'number' é obrigatório" });
  }

  const labelConversations = readLabelConversations();

  if (!labelConversations[labelId]) {
    return res
      .status(404)
      .json({ error: "Label não encontrada ou sem números" });
  }

  const newList = labelConversations[labelId].filter((num) => num !== number);

  if (newList.length === labelConversations[labelId].length) {
    return res.status(404).json({ error: "Número não associado a essa label" });
  }

  if (newList.length > 0) {
    labelConversations[labelId] = newList;
  } else {
    delete labelConversations[labelId];
  }

  saveLabelConversations(labelConversations);

  res.json({
    success: true,
    message: `Número ${number} removido da label ${labelId}`,
  });
});

// Lista números associados a uma label
app.get("/labels/:id/conversations", (req, res) => {
  const labelId = req.params.id;
  const labelConversations = readLabelConversations();

  const numbers = labelConversations[labelId] || [];

  res.json({ success: true, labelId, numbers });
});

// Enviar mensagem para todos números da label
app.post("/labels/:id/send", checkClientConnected, async (req, res) => {
  const labelId = req.params.id;
  const { message } = req.body;

  if (!message || !message.trim()) {
    return res.status(400).json({ error: "Mensagem é obrigatória" });
  }

  const labelConversations = readLabelConversations();
  const numbers = labelConversations[labelId];

  if (!numbers || numbers.length === 0) {
    return res.status(404).json({ error: "Label não tem números associados" });
  }

  const resultados = [];

  for (const contact of numbers) {
    const number = typeof contact === "string" ? contact : contact.number;
    const name = typeof contact === "object" ? contact.name || "" : "";
    const personalizedMessage = message.replace(/{name}/g, name);
    try {
      const result = await client.sendText(
        normalizeNumber(number),
        personalizedMessage
      );
      resultados.push({ number, success: true, result });
    } catch (err) {
      resultados.push({ number, success: false, error: err.message });
    }
  }

  res.json({ success: true, resultados });
});

// Associa vários números a uma label (substitui uso repetido de assign)
app.post("/labels/:id/associate", async (req, res) => {
  const labelId = req.params.id;
  const { contacts } = req.body;

  if (!labelId || !contacts || !Array.isArray(contacts)) {
    return res
      .status(400)
      .json({ error: "Requisição inválida. Envie 'contacts' como array." });
  }

  try {
    const labelConversations = loadLabelConversations();

    // Remover contatos de outras etiquetas
    for (const key of Object.keys(labelConversations)) {
      labelConversations[key] = labelConversations[key].filter(
        (c) => !contacts.find((newC) => newC.number === c.number)
      );
      if (labelConversations[key].length === 0) delete labelConversations[key];
    }

    // Adiciona os contatos à etiqueta atual
    if (!labelConversations[labelId]) labelConversations[labelId] = [];

    for (const contact of contacts) {
      if (
        !labelConversations[labelId].find((c) => c.number === contact.number)
      ) {
        labelConversations[labelId].push(contact);
      }
    }

    saveLabelConversations(labelConversations);
    res.json({ success: true });
  } catch (err) {
    console.error("Erro ao associar contatos à etiqueta:", err);
    res
      .status(500)
      .json({ error: "Erro interno ao associar contatos à etiqueta." });
  }
});

app.post("/labels/:id/add-numbers", (req, res) => {
  const labelId = req.params.id;
  const { contacts } = req.body;

  if (!Array.isArray(contacts) || contacts.length === 0) {
    return res.status(400).json({
      error:
        "Campo 'contacts' é obrigatório e deve conter objetos com número e nome",
    });
  }
  // Remove contatos das outras labels
  for (const key of Object.keys(labelConversations)) {
    labelConversations[key] = labelConversations[key].filter(
      (c) => !contacts.find((newC) => newC.number === c.number)
    );
    if (labelConversations[key].length === 0) delete labelConversations[key];
  }

  // Adiciona à label selecionada
  if (!labelConversations[labelId]) labelConversations[labelId] = [];
  for (const contact of contacts) {
    if (!labelConversations[labelId].find((c) => c.number === contact.number)) {
      labelConversations[labelId].push(contact);
    }
  }

  const labels = readLabels();
  if (!labels.find((l) => l.id === labelId)) {
    return res.status(404).json({ error: "Label não encontrada" });
  }

  const labelConversations = readLabelConversations();

  // Remove todos os números das outras labels
  for (const key of Object.keys(labelConversations)) {
    labelConversations[key] = labelConversations[key].filter(
      (num) => !numbers.includes(num)
    );
    if (labelConversations[key].length === 0) delete labelConversations[key];
  }

  if (!labelConversations[labelId]) labelConversations[labelId] = [];
  // Adiciona os números à label (sem duplicados)
  for (const num of numbers) {
    if (!labelConversations[labelId].includes(num)) {
      labelConversations[labelId].push(num);
    }
  }

  saveLabelConversations(labelConversations);

  res.json({
    success: true,
    message: `Números adicionados à label ${labelId}`,
    numbers: labelConversations[labelId],
  });
});

// Rota de status
app.get("/ping", (req, res) => {
  res.json({
    connected: !!client,
    status: client ? "WPPConnect está ativo" : "Aguardando conexão...",
  });
});
