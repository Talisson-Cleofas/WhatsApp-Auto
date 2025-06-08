import { useState, useEffect } from "react";
import api from "../api";

export function useSessions() {
  const [sessions, setSessions] = useState([]);
  const [activeSessionId, setActiveSessionId] = useState(null);

  useEffect(() => {
    const loadSessions = async () => {
      try {
        // Busca sessões no backend
        const res = await api.get("/session/list");
        const serverSessions = res.data.sessions || [];

        // Sessões do localStorage
        const saved = localStorage.getItem("sessions");
        const localSessions = saved ? JSON.parse(saved) : [];

        // Unir sem duplicatas
        const allSessions = Array.from(
          new Set([...localSessions, ...serverSessions])
        );

        setSessions(allSessions);

        // Restaurar activeSessionId do localStorage se possível
        const lastActive = localStorage.getItem("activeSessionId");
        if (lastActive && allSessions.includes(lastActive)) {
          setActiveSessionId(lastActive);
        } else if (allSessions.length > 0) {
          setActiveSessionId(allSessions[0]);
        }
      } catch (err) {
        console.error("Erro ao carregar sessões do backend:", err);
      }
    };

    loadSessions();
  }, []);

  // Salva sessões no localStorage
  useEffect(() => {
    localStorage.setItem("sessions", JSON.stringify(sessions));
  }, [sessions]);

  // Salva a sessão ativa no localStorage
  useEffect(() => {
    if (activeSessionId) {
      localStorage.setItem("activeSessionId", activeSessionId);
    }
  }, [activeSessionId]);

  const addSession = (sessionId) => {
    setSessions((prev) =>
      prev.includes(sessionId) ? prev : [...prev, sessionId]
    );
    setActiveSessionId(sessionId);
  };

  const removeSession = (sessionId) => {
    setSessions((prev) => prev.filter((s) => s !== sessionId));
    if (activeSessionId === sessionId) {
      setActiveSessionId(null);
    }
  };

  return {
    sessions,
    activeSessionId,
    setActiveSessionId,
    addSession,
    removeSession,
  };
}
