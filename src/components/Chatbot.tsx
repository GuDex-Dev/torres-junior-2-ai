'use client';
import { useState, useRef, useEffect } from 'react';
import { MENSAJE_BIENVENIDA } from '@/lib/prompts';
import { obtenerProductoPorId } from '@/lib/productos';
import { Producto } from '@/types/producto';
import ProductGrid from './ProductGrid';

interface Message {
  role: 'user' | 'model';
  text: string;
  hasImage?: boolean;
  imageUrl?: string; // NUEVO: URL base64 de la imagen
  imageFile?: File; // NUEVO: Archivo original
  productos?: Producto[];
}

export default function Chatbot() {
  const [prompt, setPrompt] = useState('');
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [isFirstLoad, setIsFirstLoad] = useState(true);
  const [expandedImage, setExpandedImage] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const chatEndRef = useRef<HTMLDivElement>(null);

  // Mostrar mensaje de bienvenida al cargar
  useEffect(() => {
    if (isFirstLoad) {
      setMessages([
        {
          role: 'model',
          text: MENSAJE_BIENVENIDA,
        },
      ]);
      setIsFirstLoad(false);
    }
  }, [isFirstLoad]);

  // Auto-scroll al final del chat
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  // Función para convertir File a base64
  const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = error => reject(error);
    });
  };

  // Función para procesar respuesta y extraer productos
  const procesarRespuestaConProductos = async (respuesta: string) => {
    const marcadorRegex = /\[PRODUCTOS:([\w,]+)\]/;
    const match = respuesta.match(marcadorRegex);

    if (match) {
      const productIds = match[1].split(',');
      const productos: Producto[] = [];

      // Obtener productos por ID
      for (const id of productIds) {
        try {
          const producto = await obtenerProductoPorId(id.trim());
          if (producto) {
            productos.push(producto);
          }
        } catch (error) {
          console.error('Error obteniendo producto:', id, error);
        }
      }

      // Limpiar marcador del texto
      const textoLimpio = respuesta.replace(marcadorRegex, '').trim();

      return {
        text: textoLimpio,
        productos: productos,
      };
    }

    return {
      text: respuesta,
      productos: [],
    };
  };

  const handleSend = async () => {
    if (!prompt.trim()) return;

    // Convertir imagen a base64 si existe
    let imageUrl = '';
    if (selectedImage) {
      try {
        imageUrl = await fileToBase64(selectedImage);
      } catch (error) {
        console.error('Error convirtiendo imagen:', error);
      }
    }

    const userMessage: Message = {
      role: 'user',
      text: prompt,
      hasImage: !!selectedImage,
      imageUrl: imageUrl,
      imageFile: selectedImage ?? undefined,
    };

    setMessages(prev => [...prev, userMessage]);
    setLoading(true);
    setPrompt('');

    try {
      const formData = new FormData();
      formData.append('prompt', prompt);

      // Crear historial sin imágenes para Gemini (solo texto)
      const historialParaGemini = messages.map(msg => ({
        role: msg.role,
        text: msg.text,
      }));
      formData.append('history', JSON.stringify(historialParaGemini));

      // Solo enviar la imagen actual a Gemini
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

      // Procesar respuesta para extraer productos
      const { text, productos } = await procesarRespuestaConProductos(
        data.response
      );

      const aiMessage: Message = {
        role: 'model',
        text,
        productos,
      };

      setMessages(prev => [...prev, aiMessage]);
    } catch (error) {
      const errorMsg =
        error instanceof Error ? error.message : 'Error desconocido';
      const errorMessage: Message = {
        role: 'model',
        text: `❌ Lo siento, hubo un error: ${errorMsg}. ¿Puedes intentar de nuevo?`,
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

  const openImageModal = (imageUrl: string) => {
    setExpandedImage(imageUrl);
  };

  const closeImageModal = () => {
    setExpandedImage(null);
  };

  return (
    <section
      id="chatbot"
      className=" bg-gradient-to-br from-amber-50 to-orange-50 py-20"
      ref={chatEndRef}
    >
      <div className="max-w-9/12 mx-auto p-2">
        {/* Header del Chatbot - MÁS COMPACTO */}
        <div className="text-center mb-2">
          <div className="inline-flex items-center gap-3 mb-2">
            <div className="w-10 h-10 bg-gradient-to-r from-amber-500 to-orange-500 rounded-full flex items-center justify-center shadow-lg">
              <span className="text-white font-bold text-lg">🤖</span>
            </div>
            <div>
              <h2 className="text-2xl font-bold text-gray-900">
                Asistente Virtual
                <p className="text-amber-600 font-medium text-2xl">
                  Torres Jr. 2
                </p>
              </h2>
            </div>
          </div>
        </div>

        {/* Chat Container - MÁS ALTO Y ANCHO */}
        <div className="bg-white rounded-2xl shadow-xl border border-orange-100 overflow-hidden">
          {/* Chat Messages - ALTURA AUMENTADA */}
          <div className="h-[500px] overflow-y-auto p-6 bg-gray-50 space-y-6 chat-messages">
            {messages.map((msg, i) => (
              <div
                key={i}
                className={`flex ${
                  msg.role === 'user' ? 'justify-end' : 'justify-start'
                }`}
              >
                <div
                  className={`${
                    msg.role === 'user'
                      ? 'max-w-xl px-4 py-3 rounded-2xl bg-gradient-to-r from-amber-500 to-orange-500 text-white'
                      : 'max-w-4xl px-6 py-4 rounded-2xl bg-white border border-amber-100 text-gray-800 shadow-sm'
                  }`}
                >
                  {/* Renderizar mensaje con formato básico */}
                  <div className="whitespace-pre-wrap">
                    {msg.text.split('\n').map((line, index) => {
                      if (line.trim().startsWith('•')) {
                        return (
                          <div
                            key={index}
                            className="flex items-start gap-2 mb-2"
                          >
                            <span className="text-amber-500 font-bold">•</span>
                            <span>{line.replace('•', '').trim()}</span>
                          </div>
                        );
                      }
                      return (
                        <div key={index} className={index > 0 ? 'mt-2' : ''}>
                          {line}
                        </div>
                      );
                    })}
                  </div>

                  {/* Imagen del usuario en el historial */}
                  {msg.imageUrl && (
                    <div className="mt-3">
                      <div
                        className="relative cursor-pointer group"
                        onClick={() => openImageModal(msg.imageUrl!)}
                      >
                        <img
                          src={msg.imageUrl}
                          alt="Imagen enviada"
                          className="w-32 h-32 object-cover rounded-lg border-2 border-white/20 hover:border-white/40 transition-all"
                        />
                        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 rounded-lg transition-all flex items-center justify-center">
                          <span className="text-white opacity-0 group-hover:opacity-100 transition-opacity text-sm font-medium">
                            📷 Click para ampliar
                          </span>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Grid de productos si existen */}
                  {msg.productos && msg.productos.length > 0 && (
                    <ProductGrid productos={msg.productos} />
                  )}

                  {msg.hasImage && !msg.imageUrl && (
                    <div className="text-xs opacity-75 mt-2 flex items-center gap-1">
                      <span>📷</span>
                      <span>Imagen adjunta</span>
                    </div>
                  )}
                </div>
              </div>
            ))}

            {loading && (
              <div className="flex justify-start">
                <div className="bg-white border border-amber-100 rounded-2xl px-6 py-4 shadow-sm">
                  <div className="flex items-center gap-3">
                    <div className="flex space-x-1">
                      <div className="w-2 h-2 bg-amber-500 rounded-full animate-bounce"></div>
                      <div
                        className="w-2 h-2 bg-orange-500 rounded-full animate-bounce"
                        style={{ animationDelay: '0.1s' }}
                      ></div>
                      <div
                        className="w-2 h-2 bg-amber-500 rounded-full animate-bounce"
                        style={{ animationDelay: '0.2s' }}
                      ></div>
                    </div>
                    <span className="text-gray-600 text-sm">
                      Buscando productos...
                    </span>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Input Area */}
          <div className="p-6 bg-white border-t border-amber-100">
            {selectedImage && (
              <div className="mb-4 p-3 bg-amber-50 border border-amber-200 rounded-lg flex justify-between items-center">
                <div className="flex items-center gap-3">
                  <img
                    src={URL.createObjectURL(selectedImage)}
                    alt="Preview"
                    className="w-12 h-12 object-cover rounded border border-amber-300"
                  />
                  <div>
                    <span className="text-amber-600">📷</span>
                    <span className="text-sm text-gray-700 ml-2">
                      {selectedImage.name}
                    </span>
                    <div className="text-xs text-gray-500">
                      {(selectedImage.size / 1024 / 1024).toFixed(2)} MB
                    </div>
                  </div>
                </div>
                <button
                  onClick={removeImage}
                  className="text-red-500 hover:text-red-700 font-bold text-lg"
                >
                  ✕
                </button>
              </div>
            )}

            <div className="flex gap-3 items-end">
              <div className="flex-1">
                <textarea
                  value={prompt}
                  onChange={e => setPrompt(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder="Escribe tu consulta aquí... ej: '¿Tienen overoles para bebé?' o '¿Qué bolsos tienen disponibles?'"
                  className="w-full min-h-[60px] max-h-32 p-3 border border-amber-200 rounded-xl focus:ring-2 focus:ring-amber-500 focus:border-amber-500 resize-none transition-colors"
                  disabled={loading}
                />
              </div>

              <div className="flex flex-col gap-2">
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
                  className="px-4 py-3 bg-gray-100 text-gray-700 rounded-xl hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed transition-colors border border-gray-300"
                  title="Subir imagen"
                >
                  📷
                </button>

                <button
                  onClick={handleSend}
                  disabled={loading || !prompt.trim()}
                  className="px-6 py-3 bg-gradient-to-r from-amber-500 to-orange-500 text-white rounded-xl font-medium hover:from-amber-600 hover:to-orange-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 shadow-md"
                >
                  {loading ? '...' : 'Enviar'}
                </button>
              </div>
            </div>

            {/* Sugerencias rápidas */}
            <div className="mt-4 flex flex-wrap gap-2">
              {[
                '¿Tienen ropa para bebé?',
                'Bolsos disponibles',
                '¿Cuál es su horario?',
              ].map((suggestion, i) => (
                <button
                  key={i}
                  onClick={() => setPrompt(suggestion)}
                  disabled={loading}
                  className="px-3 py-1 text-sm bg-amber-100 text-amber-700 rounded-full hover:bg-amber-200 disabled:opacity-50 transition-colors"
                >
                  {suggestion}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Info adicional */}
        <div className="text-center mt-4 text-sm text-gray-600">
          <p>
            💡 <strong>Tip:</strong> Puedes preguntar por productos específicos,
            tallas, colores, precios y stock disponible
          </p>
        </div>
      </div>

      {/* Modal de imagen expandida */}
      {expandedImage && (
        <div
          className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4"
          onClick={closeImageModal}
        >
          <div className="relative max-w-4xl max-h-full">
            <img
              src={expandedImage}
              alt="Imagen expandida"
              className="max-w-full max-h-full object-contain rounded-lg"
              onClick={e => e.stopPropagation()}
            />
            <button
              onClick={closeImageModal}
              className="absolute top-4 right-4 bg-black/50 text-white rounded-full w-10 h-10 flex items-center justify-center hover:bg-black/70 transition-colors"
            >
              ✕
            </button>
          </div>
        </div>
      )}

      {/* Estilos CSS para scrollbar */}
      <style jsx>{`
        .chat-messages::-webkit-scrollbar {
          width: 6px;
        }
        .chat-messages::-webkit-scrollbar-track {
          background: #f1f1f1;
          border-radius: 10px;
        }
        .chat-messages::-webkit-scrollbar-thumb {
          background: #d97706;
          border-radius: 10px;
        }
        .chat-messages::-webkit-scrollbar-thumb:hover {
          background: #b45309;
        }
        .hide-scrollbar {
          overflow: hidden !important;
        }
        .hide-scrollbar::-webkit-scrollbar {
          display: none;
        }

        /* Scroll suave para anclas */
        html {
          scroll-behavior: smooth;
          scroll-padding-top: 80px;
        }
      `}</style>
    </section>
  );
}
