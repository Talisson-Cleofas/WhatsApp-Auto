import { useEffect, useState } from "react";
import api from "../api";
import styles from "./BulkMessageForm.module.css";
import axios from 'axios';


export default function BulkMessageForm() {
  const [contactsText, setContactsText] = useState("");
  const [contacts, setContacts] = useState([]);
  const [message, setMessage] = useState("");
  const [delay, setDelay] = useState(0);
  const [labels, setLabels] = useState([]);
  const [selectedLabel, setSelectedLabel] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  
  


  useEffect(() => {
    // Carrega etiquetas ao montar
    const fetchLabels = async () => {
      try {
        const res = await api.get("/labels");
        setLabels(res.data);
      } catch (err) {
        console.error("Erro ao carregar etiquetas:", err);
      }
    };

    fetchLabels();
  }, []);

  const parseContacts = (text) => {
    const lines = text.split("\n");
    const list = [];

    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed) continue;

      const [number, name = ""] = trimmed.split(",").map((part) => part.trim());
      if (number) {
        list.push({ number, name });
      }
    }

    return list;
  };

  const handleContactsChange = (e) => {
    const text = e.target.value;
    setContactsText(text);
    setContacts(parseContacts(text));
  };

  const buildMessages = () => {
    return contacts.map(({ number, name }) => ({
      number,
      message: message.replace(/{name}/g, name || ""),
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (!contacts.length && !selectedLabel) {
      setError("Informe contatos ou selecione uma etiqueta.");
      return;
    }

    if (!message.trim()) {
      setError("Mensagem não pode ser vazia.");
      return;
    }

    if (contacts.length && selectedLabel) {
      const confirmSend = window.confirm(
        "Você selecionou contatos e uma etiqueta. A mensagem será enviada apenas para os contatos informados no campo de contatos. Deseja continuar?"
      );
      if (!confirmSend) {
        return;
      }
    }

    setLoading(true);

    try {
      if (selectedLabel && !contacts.length) {
        // Enviar somente para etiqueta
        const res = await api.post(`/labels/${selectedLabel}/send-batch`, {
          message,
          delay: Number(delay),
        });
        console.log(res.data);
        alert("Mensagens enviadas por etiqueta com sucesso!");
      } else {
        // Enviar para contatos preenchidos diretamente
        const messages = buildMessages();
        const res = await api.post("/send-batch", {
          messages,
          delay: Number(delay),
        });
        console.log(res.data);
        alert("Mensagens enviadas com sucesso!");
      }

      // Limpar campos após envio
      setContactsText("");
      setContacts([]);
      setMessage("");
      setDelay(0);
      setSelectedLabel("");
    } catch (err) {
      setError(err.response?.data?.error || err.message || "Erro ao enviar mensagens");
    } finally {
      setLoading(false);
    }
  };

  const handleAddToLabel = async () => {
    if (!selectedLabel || !contacts.length) {
      setError("Informe contatos e selecione uma etiqueta.");
      return;
    } 

    try {
      setLoading(true);

await axios.post(`http://localhost:3000/labels/${selectedLabel}/associate`, {
  contacts: contacts,
});


      alert("Contatos adicionados à etiqueta com sucesso!");
    } catch (err) {
      setError("Erro ao adicionar contatos à etiqueta.");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.container}>
      <h2>Enviar Mensagens em Massa</h2>

      <form onSubmit={handleSubmit}>
        <div className={styles.item}>
          <label>Contatos (um por linha: número,nome)</label>
          <textarea
            rows={6}
            className={styles.input}
            placeholder={`Exemplo:\n5511999999999,João\n5511888888888,Maria`}
            value={contactsText}
            onChange={handleContactsChange}
            disabled={loading}
          />
          <div style={{ marginTop: 5, fontSize: 14, color: "#555" }}>
            Contatos lidos: {contacts.length}
          </div>
        </div>

        <div className={styles.item}>
          <label>Etiqueta (opcional):</label>
          <select
            className={styles.input}
            value={selectedLabel}
            onChange={(e) => setSelectedLabel(e.target.value)}
            disabled={loading}
          >
            <option value="">-- Nenhuma --</option>
            {labels.map((label) => (
              <option key={label.id} value={label.id}>
                {label.name}
              </option>
            ))}
          </select>
        </div>

        <div className={styles.item}>
          <label>Mensagem (use {"{name}"} para inserir o nome):</label>
          <textarea
            rows={4}
            className={styles.input}
            placeholder="Olá {name}, tudo bem?"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            disabled={loading}
          />
        </div>

        <div className={styles.item}>
          <label>Delay entre mensagens (em minutos):</label>
          <input
            type="number"
            min="0"
            step="0.1"
            className={styles.input}
            value={delay}
            onChange={(e) => setDelay(parseFloat(e.target.value) || 0)}
            placeholder="Ex: 1.5"
            disabled={loading}
          />
        </div>

        <div className={styles.buttons}>
          <button className={styles.button} type="submit" disabled={loading}>
            {loading ? "Enviando..." : "Enviar"}
          </button>

          {selectedLabel && contacts.length > 0 && (
            <button
              className={styles.secondaryButton}
              type="button"
              onClick={handleAddToLabel}
              disabled={loading}
              style={{ marginLeft: 10 }}
            >
              Adicionar contatos à etiqueta
            </button>
          )}
        </div>
      </form>

      {error && (
        <div style={{ color: "red", marginTop: 10 }}>
          <b>Erro:</b> {error}
        </div>
      )}
    </div>
  );
}
