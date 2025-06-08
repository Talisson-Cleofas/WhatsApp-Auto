// wppconnect/session.js
const wppconnect = require("@wppconnect-team/wppconnect");
const puppeteer = require("puppeteer");

let client = null;
let currentQr = null;

function initWppSession() {
  wppconnect
    .create({
      session: "minha-sessao-v2",
      headless: true,
      autoClose: false,
      useChrome: false,
      executablePath: puppeteer.executablePath(),
      puppeteerOptions: {
        args: ["--no-sandbox", "--disable-setuid-sandbox"],
      },
      catchQR: (qr, asciiQR) => {
        console.log("📲 QR Code:\n", asciiQR);
        currentQr = qr;
      },
      statusFind: (status) => console.log("📡 Status:", status),
    })
    .then((cli) => {
      client = cli;
      console.log("✅ Cliente WPPConnect conectado");
    })
    .catch((err) => console.error("Erro na sessão:", err));
}

function getClient() {
  return client;
}

function getQr() {
  return currentQr;
}

module.exports = { initWppSession, getClient, getQr };
