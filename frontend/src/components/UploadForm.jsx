import { useState, useEffect } from 'react';
import api from '../api';
import styles from './UploadForm.module.css';

export default function UploadForm() {
  const [number, setNumber] = useState('');
  const [name, setName] = useState('');
  const [message, setMessage] = useState('');
  const [file, setFile] = useState(null);

  // Atualiza mensagem automaticamente quando o nome muda
  useEffect(() => {
    if (name) {
      setMessage(`Olá ${name}, tudo bem?`);
    } else {
      setMessage('');
    }
  }, [name]);

  const send = async () => {
    if (!number || !file) {
      alert('Número e arquivo são obrigatórios!');
      return;
    }

    const formData = new FormData();
    formData.append('number', number);
    formData.append('name', name); // adiciona nome para backend, se quiser usar
    formData.append('message', message);
    formData.append('file', file);

    const { data } = await api.post('/send-upload', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });

    alert('Arquivo enviado via upload!');
    console.log(data);
  };

  return (
    <div className={styles.container}>
      <h2 className={styles.title}>Enviar Mensagem e Arquivo</h2>

      <input
        type="text"
        placeholder="Número"
        value={number}
        onChange={(e) => setNumber(e.target.value)}
        className={styles.input}
      />

      <input
        type="text"
        placeholder="Nome"
        value={name}
        onChange={(e) => setName(e.target.value)}
        className={styles.input}
      />

      <textarea
        placeholder="Mensagem (opcional)"
        value={message}
        onChange={(e) => setMessage(e.target.value)}
        className={styles.textarea}
        rows={4}
      />

      <input
        type="file"
        onChange={(e) => setFile(e.target.files[0])}
        className={styles.input}
      />

      <button onClick={send} className={styles.button}>
        Enviar
      </button>
    </div>
  );
}
