//App.js
//import { useEffect } from "react";
import SingleMessageForm from "./components/SingleMessageForm";
import BulkMessageForm from "./components/BulkMessageForm";
import MediaMessageForm from "./components/MediaMessageForm";
import UploadForm from "./components/UploadForm";
import BatchUploadForm from "./components/BatchMediaForm";
import LabelsManager from "./components/LabelsManager";
import QrCodeViewer from "./components/QrCodeViewer";
import { getConnectionStatus } from "./api";
import api from "./api";
import { useSessions } from "./hooks/useSessionId";
import logo from "./assets/d6617b195160e577a13c01de3cd0e298.png";

function App() {
  const {
    sessions,
    activeSessionId: selectedSession,
    setActiveSessionId: setSelectedSession,
    addSession,
    removeSession,
  } = useSessions();

  const createSession = async () => {
    const sessionId = prompt("Digite um nome para a nova sessão:");
    if (!sessionId) return;

    if (sessions.includes(sessionId)) {
      alert("Sessão já existe!");
      setSelectedSession(sessionId);
      return;
    }

    try {
      console.log("Tentando conectar sessão:", sessionId);
      await getConnectionStatus(sessionId);
      addSession(sessionId);
    } catch (err) {
      alert("Erro ao iniciar sessão: " + err.message);
    }
  };

  const logoutSession = async () => {
    if (!selectedSession) return;
    if (!confirm(`Deseja realmente remover a sessão ${selectedSession}?`))
      return;

    try {
      await api.post("/status/logout", { sessionId: selectedSession });
      removeSession(selectedSession);
    } catch (err) {
      alert("Erro ao remover sessão: " + err.message);
    }
  };

  return (
    <div style={{ padding: 20 }}>
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: "12px",
          marginBottom: 16,
        }}
      >
        <img src={logo} alt="Logo" style={{ width: 130, height: 100 }} />
        <h1 style={{ margin: 0 }}>Marshall WhatsApp-Auto</h1>
      </div>

      <div style={{ marginBottom: 16 }}>
        <label>
          Sessão:
          <select
            value={selectedSession || ""}
            onChange={(e) => setSelectedSession(e.target.value)}
            style={{ marginLeft: 8 }}
          >
            <option value="" disabled>
              Selecione uma sessão
            </option>
            {sessions.map((session) => (
              <option key={session} value={session}>
                {session}
              </option>
            ))}
          </select>
        </label>
        <button onClick={createSession} style={{ marginLeft: 12 }}>
          + Nova Sessão
        </button>
        {selectedSession && (
          <button
            onClick={logoutSession}
            style={{
              marginLeft: 8,
              backgroundColor: "#ffdddd",
              border: "1px solid red",
              color: "red",
              padding: "4px 10px",
              cursor: "pointer",
              borderRadius: "4px",
            }}
          >
            Remover Sessão
          </button>
        )}
      </div>

      {selectedSession && (
        <>
          <QrCodeViewer sessionId={selectedSession} />
          <hr />

          <BulkMessageForm sessionId={selectedSession} />
          <hr />

          <BatchUploadForm sessionId={selectedSession} />
          <hr />

          {/* Descomente conforme desejar */}
          {/* <SingleMessageForm sessionId={selectedSession} />
          <hr />

          <UploadForm sessionId={selectedSession} />
          <hr />

          <MediaMessageForm sessionId={selectedSession} />
          <hr />

          <LabelsManager sessionId={selectedSession} /> */}
        </>
      )}
    </div>
  );
}

export default App;
