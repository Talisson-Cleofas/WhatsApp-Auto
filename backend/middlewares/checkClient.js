// middlewares/checkClient.js
const { getClient } = require("../wppconnect/session");

module.exports = (req, res, next) => {
  const client = getClient();
  if (!client) {
    return res
      .status(500)
      .json({ success: false, error: "Cliente não conectado" });
  }
  req.client = client;
  next();
};
