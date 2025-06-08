import React, { useEffect, useState, useRef, useCallback } from "react";
import { getQrCode, getConnectionStatus, startSession } from "../api";

const QrCodeViewer = ({ sessionId }) => {
  const [qr, setQr] = useState(null);
  const [statusMessage, setStatusMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const [connected, setConnected] = useState(false);
  const intervalRef = useRef(null);

  const fetchQrAndStatus = useCallback(async () => {
    if (!sessionId) {
      setStatusMessage("Nenhuma sessão selecionada.");
      setLoading(false);
      return;
    }

    setLoading(true);

    try {
      const { data: status } = await getConnectionStatus(sessionId);
      if (status.connected) {
        setConnected(true);
        setStatusMessage("✅ Sessão conectada com sucesso.");
        clearInterval(intervalRef.current);
        return;
      }

      const { data } = await getQrCode(sessionId);
      if (data && data.qr) {
        setQr(data.qr);
        setStatusMessage("📲 Escaneie o QR Code com o WhatsApp.");
      } else {
        setStatusMessage("⚠️ QR Code ainda não disponível.");
      }
    } catch (err) {
      if (err.response && err.response.status === 404) {
        setStatusMessage("⚠️ QR Code ainda não disponível.");
      } else {
        setStatusMessage("❌ Erro ao buscar QR Code.");
        console.error("Erro ao buscar QR:", err);
      }
    } finally {
      setLoading(false);
    }
  }, [sessionId]);

  useEffect(() => {
    if (!sessionId) return;

    setQr(null);
    setConnected(false);
    setStatusMessage("");
    setLoading(true);

    const iniciarSessaoEObservar = async () => {
      try {
        console.log("🔄 Iniciando sessão:", sessionId);
        await startSession(sessionId); // <- inicia a sessão no backend
        await fetchQrAndStatus(); // <- busca o QR logo após iniciar
        intervalRef.current = setInterval(fetchQrAndStatus, 10000);
      } catch (err) {
        console.error("❌ Erro ao iniciar sessão:", err.message);
        setStatusMessage("Erro ao iniciar sessão.");
        setLoading(false);
      }
    };

    iniciarSessaoEObservar();

    return () => clearInterval(intervalRef.current);
  }, [sessionId, fetchQrAndStatus]);

  return (
    <div style={{ textAlign: "center" }}>
      <h2>Status da Sessão: {sessionId}</h2>
      <p>{statusMessage}</p>

      {loading && <p>Carregando...</p>}

      {!loading && qr && !connected && (
        <img
          src={`data:image/png;base64,${qr}`}
          alt="QR Code"
          style={{ maxWidth: "300px", marginTop: "1rem" }}
        />
      )}
    </div>
  );
};

export default QrCodeViewer;
