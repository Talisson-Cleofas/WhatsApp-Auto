import { useState } from 'react';
import api from '../api';
import styles from './MediaMessageForm.module.css';

export default function MediaMessageForm() {
  const [number, setNumber] = useState('');
  const [message, setMessage] = useState('');
  const [url, setUrl] = useState('');
  const [filename, setFilename] = useState('');

  const send = async () => {
    if (!number || !url || !filename) {
      alert("Preencha todos os campos obrigatórios.");
      return;
    }

    const { data } = await api.post('/send-media', {
      number,
      message,
      fileUrl: url,
      filename,
    });

    alert('Arquivo enviado com sucesso!');
    console.log(data);
  };

  return (
    <div className={styles.container}>
      <h2>Enviar Mídia por URL</h2>
      <input
        className={styles.inputField}
        placeholder="Número"
        value={number}
        onChange={e => setNumber(e.target.value)}
      />
      <textarea
        placeholder="Mensagem (opcional)"
        value={message}
        onChange={(e) => setMessage(e.target.value)}
        className={styles.textarea}
        rows={4}
      />
      <input
        className={styles.inputField}
        placeholder="URL do arquivo"
        value={url}
        onChange={e => setUrl(e.target.value)}
      />
      <input
        className={styles.inputField}
        placeholder="Nome do arquivo (ex: arquivo.pdf)"
        value={filename}
        onChange={e => setFilename(e.target.value)}
      />
      <button onClick={send} className={styles.button}>Enviar</button>
    </div>
  );
}
