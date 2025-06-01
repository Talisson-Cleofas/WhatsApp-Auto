import React, { useState } from "react";
import styles from "./BatchMediaForm.module.css";

export default function BatchFileSendForm() {
  const [contactsText, setContactsText] = useState("");
  const [message, setMessage] = useState(""); // agora é opcional
  const [file, setFile] = useState(null);
  const [delay, setDelay] = useState("0");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);

  // Parseia linha a linha: 5511999999999,João
  const parseContacts = (text) => {
    const lines = text.split("\n");
    return lines
      .map((line) => {
        const [number, name = ""] = line.split(",").map((p) => p.trim());
        if (!number) return null;
        return { number, name };
      })
      .filter(Boolean);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!contactsText.trim()) {
      alert("Informe a lista de contatos no formato: número,nome");
      return;
    }

    if (!file) {
      alert("Envie um arquivo");
      return;
    }

    if (isNaN(Number(delay)) || Number(delay) < 0) {
      alert("Delay deve ser um número positivo ou zero");
      return;
    }

    setLoading(true);
    setResult(null);
    setError(null);

    try {
      const contacts = parseContacts(contactsText);

      const formData = new FormData();
      formData.append("file", file);
      formData.append("contacts", JSON.stringify(contacts));
      formData.append("message", message); // opcional
      formData.append("delay", delay);

      const response = await fetch("http://localhost:3000/send-file-personalized", {
        method: "POST",
        body: formData,
      });

      const json = await response.json();

      if (response.ok) {
        setResult(json.resultados || json);
      } else {
        setError(json.error || "Erro desconhecido");
      }
    } catch (err) {
      setError(err.message || "Erro na requisição");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.container}>
      <h2 className={styles.title}>Enviar Arquivos e Mensagens em Massa</h2>

      <form onSubmit={handleSubmit}>
        <div className={styles.item}>
          <label>Contatos (um por linha: número,nome):</label>
          <textarea
            rows={6}
            className={styles.input}
            placeholder={`Ex:\n5511999999999,João\n5511888888888,Maria`}
            value={contactsText}
            onChange={(e) => setContactsText(e.target.value)}
          />
        </div>

        <div className={styles.item}>
          <label>Mensagem (opcional — use {"{name}"} para inserir o nome):</label>
          <textarea
            rows={3}
            className={styles.input}
            placeholder="Ex: Olá, {name}! Aqui está o arquivo."
            value={message}
            onChange={(e) => setMessage(e.target.value)}
          />
        </div>

        <div className={styles.item}>
          <label>Arquivo:</label>
          <input
            type="file"
            className={styles.fileInput}
            onChange={(e) => setFile(e.target.files[0])}
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
            onChange={(e) => setDelay(e.target.value)}
            placeholder="Ex: 1.5"
          />
        </div>

        <div className={styles.buttons}>
          <button className={styles.button} type="submit" disabled={loading}>
            {loading ? "Enviando..." : "Enviar para todos"}
          </button>
        </div>
      </form>

      {error && (
        <div style={{ color: "red", marginTop: 10 }}>
          <b>Erro:</b> {error}
        </div>
      )}

      {result && (
        <div style={{
          color: "green",
          marginTop: 10,
          whiteSpace: "pre-wrap",
          backgroundColor: "#e6ffe6",
          padding: "10px",
          borderRadius: "5px",
          fontFamily: "monospace",
          maxHeight: "200px",
          overflowY: "auto"
        }}>
          <b>Resultado:</b>
          <pre>{JSON.stringify(result, null, 2)}</pre>
        </div>
      )}
    </div>
  );
}
