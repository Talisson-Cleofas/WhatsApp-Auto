import React, { useEffect, useState, useCallback } from "react";
import styles from "./LabelsManager.module.css";
import { getLabels, createLabel, deleteLabel } from "../api/labelsApi";

const LabelsManager = () => {
  const [labels, setLabels] = useState([]);
  const [newLabel, setNewLabel] = useState("");

  const fetchLabelContacts = async (labelId) => {
    try {
      const res = await fetch(`http://localhost:3000/labels/${labelId}/conversations`);
      const data = await res.json();
      if (data.success) {
        return data.contacts || [];
      } else {
        return [];
      }
    } catch (error) {
      console.error("Erro ao buscar contatos da etiqueta", labelId, error);
      return [];
    }
  };

 const loadLabels = useCallback(async () => {
    try {
      const data = await getLabels();
      let loadedLabels = [];

      if (Array.isArray(data)) {
        loadedLabels = data;
      } else if (data && Array.isArray(data.labels)) {
        loadedLabels = data.labels;
      } else {
        console.error("Formato inesperado da resposta:", data);
        loadedLabels = [];
      }

      const labelsWithContacts = await Promise.all(
        loadedLabels.map(async (label) => {
          const contacts = await fetchLabelContacts(label.id);
          return { ...label, contacts };
        })
      );

      setLabels(labelsWithContacts);
    } catch (err) {
      console.error("Erro ao carregar etiquetas:", err);
    }
  }, []); // <- vazio porque nada muda dentro da função

  useEffect(() => {
    loadLabels();
  }, [loadLabels]);

  const handleCreate = async () => {
    if (!newLabel.trim()) return alert("Nome não pode estar vazio");
    try {
      await createLabel(newLabel.trim());
      setNewLabel("");
      loadLabels();
    } catch (error) {
      console.error(error);
      alert(error.message || "Erro ao criar etiqueta");
    }
  };

  const handleDelete = async (id) => {
    try {
      const result = await deleteLabel(id);
      if (result.success) {
        loadLabels();
      } else {
        alert("Erro ao excluir etiqueta");
      }
    } catch (error) {
      console.error(error);
      alert("Erro ao excluir etiqueta");
    }
  };

  return (
    <div className={styles.container}>
      <h2 className={styles.title}>Gerenciar Etiquetas</h2>

      <div className={styles.createSection}>
        <input
          type="text"
          value={newLabel}
          onChange={(e) => setNewLabel(e.target.value)}
          placeholder="Nova etiqueta"
          className={styles.input}
        />
        <button onClick={handleCreate} className={styles.createButton}>
          Criar
        </button>
      </div>

      <ul className={styles.labelList}>
        {labels.map((label) => (
          <li key={label.id} className={styles.labelItem}>
            <div>
              <span className={styles.labelName}>{label.name}</span>
              <button
                onClick={() => handleDelete(label.id)}
                className={styles.deleteButton}
              >
                Excluir
              </button>
            </div>
            <div className={styles.contactsList}>
              {label.contacts && label.contacts.length > 0 ? (
                <ul>
                  {label.contacts.map((contact) => (
  <li key={contact.number}>
    {contact.name} - {contact.number}
  </li>
))}
                </ul>
              ) : (
                <em>Nenhum contato associado</em>
              )}
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default LabelsManager;
