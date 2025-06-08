module.exports = function normalizeNumber(number) {
  if (!number) return null;
  // Remove tudo que não for número
  let num = number.toString().replace(/\D/g, "");
  // Se não começa com código de país, por exemplo 55 para BR, adiciona
  if (num.length === 10) {
    // exemplo para números locais sem código (ajuste conforme sua regra)
    num = "55" + num;
  }
  return num + "@c.us"; // formato usado pelo wppconnect para número de whatsapp
};
