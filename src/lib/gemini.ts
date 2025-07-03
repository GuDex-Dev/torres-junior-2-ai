// lib/gemini.ts
import { GoogleGenAI } from '@google/genai';
import { buscarProductos } from './busqueda-productos';
import { TORRES_SYSTEM_PROMPT } from './prompts';

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || '' });

export async function chatWithGemini(
  messages: { role: 'user' | 'model'; text: string }[],
  imageFile?: File
): Promise<string> {
  try {
    // Obtener el último mensaje del usuario
    const lastMessage = messages[messages.length - 1];

    // Realizar búsqueda de productos si es relevante
    let productosEncontrados = '';
    if (esConsultaDeProducto(lastMessage.text)) {
      console.log('🔍 Detectada consulta de producto:', lastMessage.text);

      const productos = await buscarProductos({
        texto: lastMessage.text,
        limite: 3,
      });

      console.log('📦 Productos encontrados en Firebase:', productos.length);
      console.log(
        '📦 Productos:',
        productos.map(p => p.nombre)
      );

      if (productos.length > 0) {
        productosEncontrados = formatearProductosParaIA(productos);
        console.log('✅ Enviando productos reales a IA');
      } else {
        console.log('❌ No se encontraron productos para la consulta');
      }
    }

    // Preparar prompt del sistema con contexto de productos
    const systemPromptConContexto = `${TORRES_SYSTEM_PROMPT}

${
  productosEncontrados
    ? `## PRODUCTOS ENCONTRADOS EN LA BASE DE DATOS:
${productosEncontrados}

🚨 INSTRUCCIONES ABSOLUTAS - NO NEGOCIABLES:
- SOLO puedes mencionar productos de la lista "PRODUCTOS ENCONTRADOS"
- JAMÁS inventes nombres, precios, colores o descripciones
- Usa EXACTAMENTE los datos de la lista, sin cambios
- Menciona el nombre EXACTO como aparece en la lista
- Si un dato no está en la lista, NO lo menciones

FORMATO OBLIGATORIO DE RESPUESTA:
"Tenemos disponible el [NOMBRE EXACTO DEL PRODUCTO] por [PRECIO EXACTO]..."`
    : `## ⚠️ NO SE ENCONTRARON PRODUCTOS EN LA BASE DE DATOS

🚨 INSTRUCCIONES ABSOLUTAS:
- Debes responder: "No tenemos ese producto específico en stock actualmente"
- NO inventes productos que no existan
- NO menciones precios, nombres o características inventadas
- Ofrece consultar otras categorías disponibles
- JAMÁS describas productos que no están en nuestra base de datos

RESPUESTA OBLIGATORIA:
"Lo siento, no tenemos [producto consultado] en stock actualmente. ¿Te gustaría consultar sobre otras categorías como ropa de bebé, accesorios o conjuntos que sí tenemos disponibles?"`
}

🔒 REGLA INQUEBRANTABLE:
Si NO aparece en "PRODUCTOS ENCONTRADOS" = NO EXISTE = NO LO MENCIONES

⚠️ PROHIBIDO ABSOLUTAMENTE:
- Inventar productos
- Inventar precios  
- Inventar descripciones
- Inventar colores o tallas
- Usar información de entrenamiento previo sobre productos

✅ PERMITIDO ÚNICAMENTE:
- Información de la tienda (horarios, ubicación, políticas)
- Productos que aparecen en "PRODUCTOS ENCONTRADOS"
- Redireccionar a categorías reales disponibles`;

    // Debug: Verificar si se encontraron productos
    console.log('🔍 Consulta:', lastMessage.text);
    console.log(
      '📦 Productos encontrados:',
      productosEncontrados
        ? 'SÍ (' +
            (productosEncontrados.split('PRODUCTO REAL').length - 1) +
            ')'
        : 'NO'
    );

    if (productosEncontrados) {
      console.log(
        '✅ Contexto enviado a IA:',
        productosEncontrados.substring(0, 200) + '...'
      );
    } else {
      console.log('❌ NO hay productos - IA debe decir que no tiene stock');
    }

    // Preparar historial para la conversación
    const history = messages.slice(0, -1).map(msg => ({
      role: msg.role,
      parts: [{ text: msg.text }],
    }));

    // Preparar contenido del mensaje actual
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
        model: 'gemini-2.0-flash',
        history,
        config: {
          systemInstruction: systemPromptConContexto,
          temperature: 0.1, // Más determinístico
          topP: 0.8,
          topK: 10,
        },
      });
      result = await chat.sendMessage({
        message: contents,
      });
    } else {
      result = await ai.models.generateContent({
        model: 'gemini-2.0-flash',
        contents,
        config: {
          systemInstruction: systemPromptConContexto,
          temperature: 0.1, // Más determinístico
          topP: 0.8,
          topK: 10,
        },
      });
    }

    const respuestaIA = result.text || 'No pude generar una respuesta.';

    // Validación post-respuesta
    if (esConsultaDeProducto(lastMessage.text) && !productosEncontrados) {
      // Si no había productos pero la IA menciona precios o productos específicos
      if (
        respuestaIA.includes('S/') ||
        (respuestaIA.includes('disponible') && respuestaIA.includes('S/'))
      ) {
        console.log('🚨 ALUCINACIÓN DETECTADA - Corrigiendo respuesta');
        return `Lo siento, no tenemos ese producto específico en stock actualmente. 😊

¿Te gustaría consultar sobre alguna de nuestras categorías disponibles?
• Bolsos (Berlón Osito, Perlita, Lazo)
• Mochilas (Ratoncito, Monedero, Osito)
• Conjuntos (Aurora, Camila)
• Cargadores de bebé

¿Qué categoría te interesa?`;
      }
    }

    console.log(
      '✅ Respuesta validada:',
      respuestaIA.substring(0, 100) + '...'
    );
    return respuestaIA;
  } catch (error) {
    console.error('Error en chatWithGemini:', error);
    throw new Error('Error al procesar la solicitud');
  }
}

// Función para detectar si es una consulta de producto
function esConsultaDeProducto(texto: string): boolean {
  const palabrasProducto = [
    'busco',
    'necesito',
    'quiero',
    'tienen',
    'hay',
    'venden',
    'stock',
    'ropa',
    'polo',
    'pantalón',
    'vestido',
    'blusa',
    'falda',
    'conjunto',
    'overol',
    'ajuar',
    'bermuda',
    'body',
    'cargador',
    'bolso',
    'mochila',
    'cartera',
    'accesorio',
    'bebé',
    'niño',
    'niña',
    'mujer',
    'maternidad',
    'talla',
    'color',
    'precio',
    'costo',
    'disponible',
    // Productos específicos detectados en BD
    'berlón',
    'osito',
    'perlita',
    'ratoncito',
    'monedero',
    'angelitos',
    'lazo',
    'aurora',
    'camila',
  ];

  const textoLower = texto.toLowerCase();
  return palabrasProducto.some(palabra => textoLower.includes(palabra));
}

// Función para formatear productos para la IA
function formatearProductosParaIA(productos: any[]): string {
  if (productos.length === 0) {
    return '';
  }

  return (
    productos
      .map((producto, index) => {
        const coloresDisponibles = producto.variaciones
          .flatMap((v: any) => v.colores)
          .filter((color: string) => color && color.trim() !== '')
          .join(', ');

        const tallasConStock = producto.variaciones
          .flatMap((v: any) => v.tallas.filter((t: any) => t.cantidad > 0))
          .map(
            (t: any) =>
              `${t.talla} (${t.cantidad} unidades - S/ ${t.precio.toFixed(2)})`
          )
          .join(', ');

        const precios = producto.variaciones
          .flatMap((v: any) => v.tallas.map((t: any) => t.precio))
          .filter((precio: number) => precio > 0);

        const precioMin = Math.min(...precios);
        const precioMax = Math.max(...precios);
        const rangoPrecio =
          precioMin === precioMax
            ? `S/ ${precioMin.toFixed(2)}`
            : `S/ ${precioMin.toFixed(2)} - S/ ${precioMax.toFixed(2)}`;

        const stockTotal = producto.variaciones.reduce(
          (total: number, v: any) =>
            total +
            v.tallas.reduce((sum: number, t: any) => sum + t.cantidad, 0),
          0
        );

        return `
PRODUCTO REAL ${index + 1}:
- ID: ${producto.id}
- Nombre EXACTO: ${producto.nombre}
- Categoría: ${producto.categoria}
- Descripción: ${producto.descripcion}
- Precio: ${rangoPrecio}
- Colores REALES disponibles: ${coloresDisponibles || 'No especificado'}
- Tallas REALES con stock: ${tallasConStock || 'Sin stock'}
- Stock total: ${stockTotal} unidades
- Imagen: ${producto.variaciones[0]?.imagen_url || 'Sin imagen'}

IMPORTANTE: Este producto EXISTE realmente en nuestra tienda.
`;
      })
      .join('\n') +
    `

TOTAL DE PRODUCTOS REALES ENCONTRADOS: ${productos.length}

ADVERTENCIA CRÍTICA: SOLO menciona estos ${productos.length} productos. NO agregues otros productos que no aparezcan en esta lista.`
  );
}

async function fileToBase64(file: File): Promise<string> {
  const arrayBuffer = await file.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);
  return buffer.toString('base64');
}
