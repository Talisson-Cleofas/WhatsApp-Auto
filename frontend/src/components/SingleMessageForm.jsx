import { useState, useEffect } from 'react';
import api from '../api';
import styles from './SingleMessageForm.module.css';

export default function SingleMessageForm() {
  const [number, setNumber] = useState('');
  const [name, setName] = useState('');
  const [message, setMessage] = useState('');

  useEffect(() => {
    if (name) {
      setMessage(`Olá ${name}, tudo bem?`);
    }
  }, [name]);

  const send = async () => {
    if (!number || !message) {
      alert('Preencha o número e a mensagem!');
      return;
    }

    try {
      const { data } = await api.post('/send-message', {
        number,
        message,
      });
      alert('Mensagem enviada com sucesso!');
      console.log(data);
    } catch (err) {
      alert('Erro ao enviar mensagem');
      console.error(err);
    }
  };

  return (
    <div className={styles.container}>
      <h2 className={styles.title}>Enviar Mensagem Simples</h2>
      
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
        placeholder="Mensagem"
        value={message}
        onChange={(e) => setMessage(e.target.value)}
        className={styles.textarea}
        rows={4}
      />
      
      <button onClick={send} className={styles.button}>
        Enviar
      </button>
    </div>
  );
}
