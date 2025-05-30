import { NextRequest, NextResponse } from "next/server";
import { askGemini } from "@/helper/gemini";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const prompt = body.prompt?.trim();

    if (!prompt) {
      return NextResponse.json(
        { error: "El campo 'prompt' es obligatorio." },
        { status: 400 }
      );
    }

    const result = await askGemini(prompt);
    return NextResponse.json({ response: result }, { status: 200 });

  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Error interno del servidor.";
    console.error("Error en /api/chat:", message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
