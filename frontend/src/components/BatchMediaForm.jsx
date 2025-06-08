import React, { useState } from "react";
import styles from "./BatchMediaForm.module.css";
import { sendFilePersonalized } from "../api";

export default function BatchFileSendForm({ sessionId }) {
  const [contactsText, setContactsText] = useState("");
  const [message, setMessage] = useState("");
  const [file, setFile] = useState(null);
  const [delayMin, setDelayMin] = useState(2);
  const [delayMax, setDelayMax] = useState(3);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);

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

    if (
      isNaN(delayMin) ||
      isNaN(delayMax) ||
      delayMin < 0 ||
      delayMax < 0 ||
      delayMin > delayMax
    ) {
      alert(
        "Delay mínimo e máximo devem ser números válidos. Mínimo deve ser menor ou igual ao máximo."
      );
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
      formData.append("message", message);
      formData.append("delayMin", delayMin.toString());
      formData.append("delayMax", delayMax.toString());

      const response = await sendFilePersonalized(formData, sessionId);
      const json = response.data;

      setResult(json.resultados || json);
    } catch (err) {
      setError(
        err.response?.data?.error || err.message || "Erro na requisição"
      );
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
          <label>
            Mensagem (opcional — use {"{name}"} para inserir o nome):
          </label>
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
          <label>Delay entre mensagens (minutos):</label>
          <div style={{ display: "flex", gap: "1rem" }}>
            <input
              type="number"
              min="0"
              step="0.1"
              className={styles.input}
              placeholder="Mínimo"
              value={delayMin}
              onChange={(e) => setDelayMin(parseFloat(e.target.value) || 0)}
            />
            <input
              type="number"
              min="0"
              step="0.1"
              className={styles.input}
              placeholder="Máximo"
              value={delayMax}
              onChange={(e) => setDelayMax(parseFloat(e.target.value) || 0)}
            />
          </div>
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
        <div
          style={{
            color: "green",
            marginTop: 10,
            whiteSpace: "pre-wrap",
            backgroundColor: "#e6ffe6",
            padding: "10px",
            borderRadius: "5px",
            fontFamily: "monospace",
            maxHeight: "200px",
            overflowY: "auto",
          }}
        >
          <b>Resultado:</b>
          <pre>{JSON.stringify(result, null, 2)}</pre>
        </div>
      )}
    </div>
  );
}
