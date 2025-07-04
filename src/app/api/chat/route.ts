// src/app/api/chat/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { chatWithGeminiInteligente } from '@/lib/gemini-inteligente'; // ✅ CAMBIO PRINCIPAL

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const prompt = formData.get('prompt') as string;
    const historyJson = formData.get('history') as string;
    const imageFile = formData.get('image') as File | null;

    if (!prompt?.trim()) {
      return NextResponse.json(
        { error: 'El prompt es requerido' },
        { status: 400 }
      );
    }

    // Parsear historial
    let history: { role: 'user' | 'model'; text: string }[] = [];
    if (historyJson) {
      try {
        history = JSON.parse(historyJson);
      } catch {
        // Si falla el parsing, continuar con historial vacío
      }
    }

    // Agregar el mensaje actual al historial
    const messages = [...history, { role: 'user' as const, text: prompt }];

    // ✅ USAR EL NUEVO SISTEMA INTELIGENTE
    const response = await chatWithGeminiInteligente(
      messages,
      imageFile || undefined
    );

    return NextResponse.json({ response });
  } catch (error) {
    console.error('Error en API chat:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}
