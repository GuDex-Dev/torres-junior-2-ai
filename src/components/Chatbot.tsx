"use client";
import { useState } from "react";

export default function Chatbot() {
  const [prompt, setPrompt] = useState("");
  const [chat, setChat] = useState<{ user: string; ai: string }[]>([]);
  const [loading, setLoading] = useState(false);

  const handleSend = async () => {
    if (!prompt.trim()) return;

    setLoading(true);
    setPrompt("");

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt: prompt }),
      });

      if (!res.ok) {
        const errorData = await res.json();
        const errorMsg = errorData?.error || "Error desconocido del servidor";
        throw new Error(errorMsg);
      }

      const data = await res.json();

      setChat((prev) => [...prev, { user: prompt, ai: data.response }]);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Hubo un error.";
      setChat((prev) => [...prev, { user: prompt, ai: message }]);
      console.error("Error al enviar el mensaje:", message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <h2>Asistente Virtual</h2>
      <div>
        {chat.map((msg, i) => (
          <div key={i}>
            <p>Tú: {msg.user}</p>
            <p>IA: {msg.ai}</p>
          </div>
        ))}
        {loading && <p>Pensando...</p>}
      </div>
      <div>
        <input
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          placeholder="Haz una pregunta..."
        />
        <button onClick={handleSend}>Enviar</button>
      </div>
    </>
  );
}
