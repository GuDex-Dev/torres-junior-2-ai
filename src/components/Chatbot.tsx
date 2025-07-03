'use client';
import { useState, useRef } from 'react';

interface Message {
  role: 'user' | 'model';
  text: string;
  hasImage?: boolean;
}

export default function Chatbot() {
  const [prompt, setPrompt] = useState('');
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleSend = async () => {
    if (!prompt.trim()) return;

    const userMessage: Message = {
      role: 'user',
      text: prompt,
      hasImage: !!selectedImage,
    };

    setMessages(prev => [...prev, userMessage]);
    setLoading(true);
    setPrompt('');

    try {
      const formData = new FormData();
      formData.append('prompt', prompt);
      formData.append('history', JSON.stringify(messages));

      if (selectedImage) {
        formData.append('image', selectedImage);
      }

      const res = await fetch('/api/chat', {
        method: 'POST',
        body: formData,
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData?.error || 'Error del servidor');
      }

      const data = await res.json();
      const aiMessage: Message = { role: 'model', text: data.response };

      setMessages(prev => [...prev, aiMessage]);
    } catch (error) {
      const errorMsg =
        error instanceof Error ? error.message : 'Error desconocido';
      const errorMessage: Message = {
        role: 'model',
        text: `Error: ${errorMsg}`,
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setLoading(false);
      setSelectedImage(null);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedImage(file);
    }
  };

  const removeImage = () => {
    setSelectedImage(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-4">
      <h2 className="text-xl font-bold mb-4">
        Asistente Virtual - Torres Jr. 2
      </h2>

      <div className="h-96 overflow-y-auto border border-gray-300 p-3 mb-4 bg-gray-50 rounded">
        {messages.map((msg, i) => (
          <div key={i} className="mb-3">
            <strong>{msg.role === 'user' ? 'Tú' : 'IA'}:</strong>
            <div
              className={`ml-2 p-2 rounded ${
                msg.role === 'user' ? 'bg-blue-100' : 'bg-green-100'
              }`}
            >
              {msg.text}
              {msg.hasImage && (
                <div className="text-xs text-gray-600">[Imagen adjunta]</div>
              )}
            </div>
          </div>
        ))}
        {loading && (
          <div className="italic text-gray-600">IA está pensando...</div>
        )}
      </div>

      <div className="flex flex-col gap-2">
        {selectedImage && (
          <div className="p-2 bg-yellow-100 border border-yellow-300 rounded flex justify-between items-center">
            <span>Imagen seleccionada: {selectedImage.name}</span>
            <button onClick={removeImage} className="cursor-pointer">
              ✕
            </button>
          </div>
        )}

        <div className="flex gap-2 items-end">
          <textarea
            value={prompt}
            onChange={e => setPrompt(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Escribe tu mensaje aquí..."
            className="flex-1 min-h-[60px] p-2 border border-gray-300 rounded"
            disabled={loading}
          />

          <div className="flex flex-col gap-1">
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleImageSelect}
              className="hidden"
            />

            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={loading}
              className="px-3 py-2 bg-gray-200 border border-gray-300 rounded cursor-pointer disabled:cursor-not-allowed"
            >
              📷 Imagen
            </button>

            <button
              onClick={handleSend}
              disabled={loading || !prompt.trim()}
              className="px-4 py-2 bg-blue-500 text-white rounded disabled:bg-gray-400 disabled:cursor-not-allowed"
            >
              {loading ? '...' : 'Enviar'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
