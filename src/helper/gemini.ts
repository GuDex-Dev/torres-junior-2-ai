import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || "" });

const SYSTEM_PROMPT =
  "Eres el asistente IA personalizado de la tienda Torres Jr. 2";

export async function chatWithGemini(
  messages: { role: "user" | "model"; text: string }[],
  imageFile?: File
): Promise<string> {
  try {
    const history = messages.slice(0, -1).map((msg) => ({
      role: msg.role,
      parts: [{ text: msg.text }],
    }));

    const lastMessage = messages[messages.length - 1];
    const contents: Array<
      { text: string } | { inlineData: { mimeType: string; data: string } }
    > = [{ text: lastMessage.text }];

    if (imageFile) {
      const base64Data = await fileToBase64(imageFile);
      contents.push({
        inlineData: {
          mimeType: imageFile.type,
          data: base64Data,
        },
      });
    }

    let result;

    if (history.length > 0) {
      const chat = ai.chats.create({
        model: "gemini-2.0-flash",
        history,
        config: {
          systemInstruction: SYSTEM_PROMPT,
        },
      });

      result = await chat.sendMessage({
        message: contents,
      });
    } else {
      result = await ai.models.generateContent({
        model: "gemini-2.0-flash",
        contents,
        config: {
          systemInstruction: SYSTEM_PROMPT,
        },
      });
    }

    return result.text || "No pude generar una respuesta.";
  } catch (error) {
    console.error("Error en chatWithGemini:", error);
    throw new Error("Error al procesar la solicitud");
  }
}

async function fileToBase64(file: File): Promise<string> {
  const arrayBuffer = await file.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);
  return buffer.toString("base64");
}
