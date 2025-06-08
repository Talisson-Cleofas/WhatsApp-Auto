// src/api.js
import axios from "axios";

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || "http://localhost:3000/api";

const api = axios.create({
  baseURL: API_BASE_URL,
});

// Utils para incluir o sessionId automaticamente
const withSession = (headers = {}, sessionId) => ({
  ...headers,
  ...(sessionId ? { "x-session-id": sessionId } : {}),
});

export async function startSession(sessionId) {
  try {
    const response = await api.post("/session/start", { sessionId });
    return response.data;
  } catch (error) {
    console.error("Erro ao iniciar sessão:", error.message);
    console.error(
      "Erro ao iniciar sessão:",
      error.response?.data || error.message
    );
    throw new Error("Falha ao iniciar sessão.");
  }
}

export async function getQrCode(sessionId) {
  try {
    const response = await api.get("/status/qr", { params: { sessionId } });
    return response.data;
  } catch (error) {
    if (error.response?.status === 404) {
      // QR ainda não disponível
      return { qr: null };
    }
    throw error;
  }
}

// 🚀 ENVIO DE MENSAGENS

// Mensagem simples
export const sendMessage = (data, sessionId) =>
  api.post("/messages/send", data, {
    headers: withSession({}, sessionId),
  });

// Mensagens em massa (com delay)
export const sendBatchMessages = (data, sessionId) =>
  api.post("/messages/batch", data, {
    headers: withSession({}, sessionId),
  });

// 🚀 ENVIO DE MÍDIA

// Por URL ou Base64
export const sendMediaByUrlOrBase64 = (data, sessionId) =>
  api.post("/media/send", data, {
    headers: withSession({}, sessionId),
  });

// Por upload (multipart)
export const sendMediaByUpload = (formData, sessionId) =>
  api.post("/media/upload", formData, {
    headers: withSession({ "Content-Type": "multipart/form-data" }, sessionId),
  });

// 🚀 ENVIO DE ARQUIVOS PERSONALIZADOS EM MASSA

// Envio de arquivos personalizados (mensagens por número + nome)
export const sendFilePersonalized = (formData, sessionId) =>
  api.post("/file-bulk/personalized", formData, {
    headers: withSession({ "Content-Type": "multipart/form-data" }, sessionId),
  });

// Envio do mesmo arquivo para múltiplos números
export const sendFileToMultiple = (formData, sessionId) =>
  api.post("/file-bulk/to-multiple", formData, {
    headers: withSession({}, sessionId),
  });

// 🚀 ETIQUETAS (LABELS)

export const getLabels = (sessionId) =>
  api.get("/labels", {
    headers: withSession({}, sessionId),
  });

export const createLabel = (data, sessionId) =>
  api.post("/labels", data, {
    headers: withSession({}, sessionId),
  });

export const deleteLabel = (id, sessionId) =>
  api.delete(`/labels/${id}`, {
    headers: withSession({}, sessionId),
  });

export const assignNumberToLabel = (id, data, sessionId) =>
  api.post(`/labels/${id}/assign`, data, {
    headers: withSession({}, sessionId),
  });

export const removeNumberFromLabel = (id, data, sessionId) =>
  api.post(`/labels/${id}/remove`, data, {
    headers: withSession({}, sessionId),
  });

export const getLabelContacts = (id, sessionId) =>
  api.get(`/labels/${id}/conversations`, {
    headers: withSession({}, sessionId),
  });

export const sendToLabel = (id, data, sessionId) =>
  api.post(`/labels/${id}/send`, data, {
    headers: withSession({}, sessionId),
  });

// 🚀 STATUS DA CONEXÃO
export const getConnectionStatus = (sessionId) =>
  api.get("/status/ping", {
    params: { sessionId },
  });

export default api;
