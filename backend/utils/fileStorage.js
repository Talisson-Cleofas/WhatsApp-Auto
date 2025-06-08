// utils/fileStorage.js
const fs = require("fs");
const path = require("path");

function saveJson(filePath, data) {
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
}

function readJson(filePath, fallback = []) {
  try {
    if (!fs.existsSync(filePath)) return fallback;
    const data = fs.readFileSync(filePath, "utf-8");
    return JSON.parse(data);
  } catch {
    return fallback;
  }
}

module.exports = {
  saveJson,
  readJson,
};
