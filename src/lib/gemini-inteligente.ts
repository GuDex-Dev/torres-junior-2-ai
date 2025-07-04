// lib/gemini-inteligente.ts
import { GoogleGenAI } from '@google/genai';
import { obtenerProductos } from './productos';
import { buscarProductos } from './busqueda-productos';
import { Producto } from '@/types/producto';
import { TORRES_SYSTEM_PROMPT } from './prompts';

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || '' });

// Cache para categorías (actualizar cada hora)
let categoriasCache: { [key: string]: string[] } | null = null;
let ultimaActualizacionCache = 0;

// Interfaz para respuestas de IA
interface ClasificacionCategoria {
  categoria: string;
  subcategoria?: string;
}

interface ProductosSeleccionados {
  productos_seleccionados: string[];
}

interface ValidacionEspecificaciones {
  productos_finales: string[];
  son_similares: boolean;
}

/**
 * SISTEMA DE BÚSQUEDA INTELIGENTE CON IA
 * Búsqueda en 4 pasos para máxima precisión
 */
export async function chatWithGeminiInteligente(
  messages: { role: 'user' | 'model'; text: string }[],
  imageFile?: File
): Promise<string> {
  try {
    const lastMessage = messages[messages.length - 1];
    const consulta = lastMessage.text;

    console.log('🚀 INICIANDO BÚSQUEDA INTELIGENTE:', consulta);

    // Verificar si es consulta de producto
    if (!esConsultaDeProducto(consulta)) {
      console.log('ℹ️ No es consulta de producto - usando respuesta general');
      return await respuestaGeneral(consulta, messages, imageFile);
    }

    // PASO 1: Obtener categorías dinámicamente de Firebase
    console.log('📂 PASO 1: Obteniendo categorías de Firebase...');
    const categorias = await obtenerCategoriasDinamicas();

    // PASO 2: Clasificar consulta por categoría
    console.log('🎯 PASO 2: Clasificando categoría con IA...');
    const clasificacion = await clasificarCategoria(consulta, categorias);

    if (!clasificacion.categoria) {
      return 'No pude identificar qué tipo de producto buscas. ¿Podrías ser más específico?';
    }

    console.log('✅ Categoría detectada:', clasificacion);

    // PASO 3: Obtener productos de la categoría
    console.log('📦 PASO 3: Obteniendo productos de la categoría...');

    // Primero buscar por categoría principal
    let productosCategoria = await buscarProductos({
      categoria: clasificacion.categoria,
      limite: 50,
      activo: true,
    });

    // Si hay pocos resultados, buscar también sin subcategoría específica
    if (productosCategoria.length < 3 && clasificacion.subcategoria) {
      console.log('📦 Ampliando búsqueda a toda la categoría...');
      productosCategoria = await buscarProductos({
        categoria: clasificacion.categoria,
        limite: 50,
        activo: true,
      });
    }

    // Si aún hay pocos, buscar por texto también
    if (productosCategoria.length < 3) {
      console.log('📦 Búsqueda adicional por texto...');
      const productosTexto = await buscarProductos({
        texto: consulta,
        limite: 20,
        activo: true,
      });

      // Combinar resultados eliminando duplicados
      const idsExistentes = new Set(productosCategoria.map(p => p.id));
      const productosNuevos = productosTexto.filter(
        p => !idsExistentes.has(p.id)
      );
      productosCategoria = [...productosCategoria, ...productosNuevos];
    }

    if (productosCategoria.length === 0) {
      return await sugerirCategoriasAlternativas(consulta, categorias);
    }

    console.log(
      `📊 Productos encontrados en categoría: ${productosCategoria.length}`
    );

    // PASO 4: Filtrar productos relevantes con IA
    console.log('🔍 PASO 4: Filtrando productos relevantes con IA...');
    const productosFiltrados = await filtrarProductosPorIA(
      productosCategoria,
      consulta
    );

    if (productosFiltrados.length === 0) {
      return await sugerirProductosSimilares(consulta, productosCategoria);
    }

    console.log(`🎯 Productos filtrados: ${productosFiltrados.length}`);

    // PASO 5: Validar especificaciones específicas
    console.log('✅ PASO 5: Validando especificaciones específicas...');
    const validacion = await validarEspecificaciones(
      productosFiltrados,
      consulta
    );

    const productosFinales = productosFiltrados.filter(p =>
      validacion.productos_finales.includes(p.id!)
    );

    if (productosFinales.length === 0) {
      // Mostrar productos similares
      return await generarRespuestaFinal(
        productosFiltrados.slice(0, 3),
        true,
        consulta
      );
    }

    // PASO 6: Generar respuesta final
    console.log('📝 PASO 6: Generando respuesta final...');
    return await generarRespuestaFinal(
      productosFinales,
      validacion.son_similares,
      consulta
    );
  } catch (error) {
    console.error('❌ Error en búsqueda inteligente:', error);
    return 'Lo siento, ocurrió un error al procesar tu consulta. ¿Podrías intentar de nuevo?';
  }
}

/**
 * PASO 1: Obtener categorías dinámicamente de Firebase
 */
async function obtenerCategoriasDinamicas(): Promise<{
  [key: string]: string[];
}> {
  const ahora = Date.now();
  const unaHora = 60 * 60 * 1000;

  // Usar cache si está disponible y no ha expirado
  if (categoriasCache && ahora - ultimaActualizacionCache < unaHora) {
    return categoriasCache;
  }

  try {
    console.log('🔄 Actualizando cache de categorías...');
    const productos = await obtenerProductos();
    const categorias: { [key: string]: Set<string> } = {};

    productos.forEach(producto => {
      if (producto.activo) {
        if (!categorias[producto.categoria]) {
          categorias[producto.categoria] = new Set();
        }
        if (producto.subcategoria) {
          categorias[producto.categoria].add(producto.subcategoria);
        }
      }
    });

    // Convertir Sets a arrays
    categoriasCache = {};
    Object.keys(categorias).forEach(categoria => {
      categoriasCache![categoria] = Array.from(categorias[categoria]);
    });

    ultimaActualizacionCache = ahora;
    console.log(
      '✅ Cache de categorías actualizado:',
      Object.keys(categoriasCache)
    );
    return categoriasCache;
  } catch (error) {
    console.error('❌ Error obteniendo categorías:', error);
    // Fallback a categorías estáticas si falla
    return {
      'Bolsos y Mochilas': ['Bolsos y mochilas', 'Mochilas', 'Mochila de niña'],
      'Prendas superiores': [
        'Polos del diario',
        'Polos indantiles',
        'Polos infantiles',
      ],
      Conjuntos: ['Conjunto de bebé', 'Pijamas', 'Bodies para bebé'],
      Maternidad: [
        'Batas maternas',
        'Polos de maternidad',
        'Blusas de Maternidad',
      ],
    };
  }
}

/**
 * PASO 2: Clasificar consulta por categoría usando IA
 */
async function clasificarCategoria(
  consulta: string,
  categorias: { [key: string]: string[] }
): Promise<ClasificacionCategoria> {
  try {
    const prompt = `Analiza esta consulta de cliente y determina la categoría y subcategoría más apropiada.

CONSULTA DEL CLIENTE: "${consulta}"

CATEGORÍAS Y SUBCATEGORÍAS DISPONIBLES:
${Object.entries(categorias)
  .map(([cat, subs]) => `- ${cat}: [${subs.join(', ')}]`)
  .join('\n')}

INSTRUCCIONES:
- Responde SOLO con JSON válido
- Si no estás 100% seguro, elige la más probable
- Si es muy general, no incluyas subcategoría

FORMATO DE RESPUESTA:
{"categoria": "nombre_exacto_categoria", "subcategoria": "nombre_exacto_subcategoria"}

EJEMPLOS:
- "mochilas" → {"categoria": "Bolsos y Mochilas", "subcategoria": "Mochilas"}
- "ropa de bebé" → {"categoria": "Conjuntos", "subcategoria": "Bodies para bebé"}
- "polos" → {"categoria": "Prendas superiores", "subcategoria": "Polos infantiles"}`;

    const result = await ai.models.generateContent({
      model: 'gemini-2.0-flash',
      contents: [{ text: prompt }],
      config: {
        temperature: 0.1,
        topP: 0.8,
        topK: 10,
      },
    });

    const respuesta = result.text || '{}';
    console.log('🎯 Clasificación IA:', respuesta);

    // Limpiar markdown y extraer JSON puro
    const jsonLimpio = limpiarRespuestaJSON(respuesta);
    console.log('🔧 JSON limpio:', jsonLimpio);

    return JSON.parse(jsonLimpio) as ClasificacionCategoria;
  } catch (error) {
    console.error('❌ Error clasificando categoría:', error);
    return { categoria: '' };
  }
}

/**
 * PASO 4: Filtrar productos relevantes usando IA
 */
async function filtrarProductosPorIA(
  productos: Producto[],
  consulta: string
): Promise<Producto[]> {
  try {
    // Si hay pocos productos, devolver todos
    if (productos.length <= 4) {
      console.log('🔍 Pocos productos, devolviendo todos:', productos.length);
      return productos;
    }

    const productosResumidos = productos.map(p => ({
      id: p.id,
      nombre: p.nombre,
      descripcion: p.descripcion.substring(0, 150) + '...',
      categoria: p.categoria,
      subcategoria: p.subcategoria,
      stock_total: calcularStockTotal(p),
      precio_min: Math.min(
        ...p.variaciones.flatMap(v => v.tallas.map(t => t.precio))
      ),
    }));

    const prompt = `Analiza la consulta del cliente y selecciona los productos MÁS RELEVANTES.

CONSULTA: "${consulta}"

PRODUCTOS DISPONIBLES:
${productosResumidos
  .map(
    (p, i) =>
      `${i + 1}. ID: ${p.id} | ${p.nombre} | ${p.descripcion} | Stock: ${
        p.stock_total
      } | Desde S/ ${p.precio_min}`
  )
  .join('\n')}

INSTRUCCIONES:
- Para consultas como "mochilas", selecciona TODAS las mochilas disponibles
- Máximo 6 productos más relevantes
- Prioriza productos con stock disponible
- Responde SOLO con JSON válido

FORMATO:
{"productos_seleccionados": ["id1", "id2", "id3", "id4"]}`;

    const result = await ai.models.generateContent({
      model: 'gemini-2.0-flash',
      contents: [{ text: prompt }],
      config: {
        temperature: 0.1,
        topP: 0.8,
        topK: 10,
      },
    });

    const respuesta = result.text || '{"productos_seleccionados": []}';
    console.log('🔍 Filtrado IA:', respuesta);

    const jsonLimpio = limpiarRespuestaJSON(respuesta);
    const resultado = JSON.parse(jsonLimpio) as ProductosSeleccionados;

    const productosFiltrados = productos.filter(p =>
      resultado.productos_seleccionados.includes(p.id!)
    );

    // Si la IA no seleccionó productos o muy pocos, devolver los primeros
    if (productosFiltrados.length === 0) {
      console.log('🔍 IA no seleccionó productos, usando primeros 4');
      return productos.slice(0, 4);
    }

    return productosFiltrados;
  } catch (error) {
    console.error('❌ Error filtrando productos:', error);
    return productos.slice(0, 4); // Fallback a primeros 4
  }
}

/**
 * PASO 5: Validar especificaciones específicas (color, talla, etc.)
 */
async function validarEspecificaciones(
  productos: Producto[],
  consulta: string
): Promise<ValidacionEspecificaciones> {
  try {
    const productosDetallados = productos.map(p => {
      const coloresUnicos = [...new Set(p.variaciones.flatMap(v => v.colores))];
      const tallasDisponibles = [
        ...new Set(
          p.variaciones.flatMap(v =>
            v.tallas.filter(t => t.cantidad > 0).map(t => t.talla)
          )
        ),
      ];

      return {
        id: p.id,
        nombre: p.nombre,
        colores_disponibles: coloresUnicos,
        tallas_disponibles: tallasDisponibles,
        precio_range: `S/ ${Math.min(
          ...p.variaciones.flatMap(v => v.tallas.map(t => t.precio))
        )} - S/ ${Math.max(
          ...p.variaciones.flatMap(v => v.tallas.map(t => t.precio))
        )}`,
      };
    });

    const prompt = `Analiza si los productos cumplen con especificaciones específicas de la consulta.

CONSULTA: "${consulta}"

PRODUCTOS CON DETALLES:
${productosDetallados
  .map(
    (p, i) =>
      `${i + 1}. ${p.nombre} | Colores: [${p.colores_disponibles.join(
        ', '
      )}] | Tallas: [${p.tallas_disponibles.join(', ')}] | ${p.precio_range}`
  )
  .join('\n')}

INSTRUCCIONES:
- Si la consulta especifica color/talla/precio, filtra productos que cumplan
- Si NO especifica detalles, devuelve todos los productos
- Si NO hay coincidencias exactas, marca como "similares"
- Máximo 4 productos finales

FORMATO:
{"productos_finales": ["id1", "id2"], "son_similares": false}`;

    const result = await ai.models.generateContent({
      model: 'gemini-2.0-flash',
      contents: [{ text: prompt }],
      config: {
        temperature: 0.1,
        topP: 0.8,
        topK: 10,
      },
    });

    const respuesta =
      result.text || '{"productos_finales": [], "son_similares": true}';
    console.log('✅ Validación especificaciones:', respuesta);

    const jsonLimpio = limpiarRespuestaJSON(respuesta);
    return JSON.parse(jsonLimpio) as ValidacionEspecificaciones;
  } catch (error) {
    console.error('❌ Error validando especificaciones:', error);
    return {
      productos_finales: productos.slice(0, 3).map(p => p.id!),
      son_similares: false,
    };
  }
}

/**
 * PASO 6: Generar respuesta final optimizada
 */
async function generarRespuestaFinal(
  productos: Producto[],
  esSimilar: boolean,
  consulta: string
): Promise<string> {
  try {
    const productosFormateados = formatearProductosParaIA(productos);
    const productIds = productos.map(p => p.id).join(',');

    // System prompt sin instrucciones de saludo
    const promptSinSaludo = `
Eres el asistente virtual de Torres Jr. 2, tienda de ropa infantil en Sullana, Piura.

INFORMACIÓN BÁSICA:
- Horario: 9:00 AM – 9:00 PM todos los días
- Ubicación: Calle Grau #739, Sullana, Piura
- Pagos: Efectivo, tarjeta, Yape, Plin, transferencias
- Cambios: Sí, con boleta y producto intacto

INSTRUCCIONES:
- Respuestas cortas y directas (máximo 40 palabras)
- NO repitas saludos de bienvenida
- NO menciones información de la tienda a menos que pregunten
- Enfócate solo en los productos encontrados
- Tono amigable pero conciso
`;

    const prompt = `${promptSinSaludo}

${
  esSimilar
    ? '## PRODUCTOS SIMILARES ENCONTRADOS:'
    : '## PRODUCTOS ENCONTRADOS:'
}
${productosFormateados}

CONSULTA DEL CLIENTE: "${consulta}"

INSTRUCCIONES PARA RESPUESTA:
- Respuesta corta y directa (máximo 40 palabras)
- ${
      esSimilar
        ? 'Menciona que son "productos similares"'
        : 'Confirma que tienes estos productos'
    }
- Incluye nombres exactos y precios
- OBLIGATORIO: Termina con [PRODUCTOS:${productIds}]
- NO repitas saludos ni información de la tienda

${
  esSimilar
    ? 'FORMATO: "Encontré productos similares: [nombres y precios]. [PRODUCTOS:ids]"'
    : 'FORMATO: "Tenemos [cantidad]: [nombres y precios]. [PRODUCTOS:ids]"'
}`;

    const result = await ai.models.generateContent({
      model: 'gemini-2.0-flash',
      contents: [{ text: prompt }],
      config: {
        temperature: 0.1,
        topP: 0.8,
        topK: 10,
      },
    });

    const respuesta =
      result.text ||
      `${
        esSimilar
          ? 'Encontré productos similares'
          : 'Tenemos productos disponibles'
      }. [PRODUCTOS:${productIds}]`;

    // Validar que incluya el marcador
    if (!respuesta.includes('[PRODUCTOS:')) {
      return `${respuesta} [PRODUCTOS:${productIds}]`;
    }

    console.log('✅ Respuesta final generada:', respuesta);
    return respuesta;
  } catch (error) {
    console.error('❌ Error generando respuesta final:', error);
    const productIds = productos.map(p => p.id).join(',');
    return `${
      esSimilar
        ? 'Encontré productos similares'
        : 'Tenemos productos disponibles'
    } a tu búsqueda. [PRODUCTOS:${productIds}]`;
  }
}

/**
 * Respuesta para consultas no relacionadas con productos
 */
async function respuestaGeneral(
  consulta: string,
  messages: { role: 'user' | 'model'; text: string }[],
  imageFile?: File
): Promise<string> {
  try {
    // System prompt sin saludo de bienvenida
    const promptGeneral = `
Eres el asistente virtual de Torres Jr. 2, tienda de ropa infantil en Sullana, Piura.

INFORMACIÓN DE LA TIENDA:
- Horario: 9:00 AM – 9:00 PM todos los días
- Ubicación: Calle Grau #739, Sullana, Piura
- RUC: 10404099685
- Pagos: Efectivo, tarjeta, Yape, Plin, transferencias
- Cambios: Sí, con boleta y producto intacto
- NO ofrecemos delivery ni WhatsApp

INSTRUCCIONES:
- Responde preguntas generales sobre la tienda
- Mantén respuestas cortas y útiles
- NO repitas saludos de bienvenida
- NO menciones productos específicos a menos que pregunten
- NO incluyas marcadores [PRODUCTOS:]
- Si preguntan por productos, sugiere que sean más específicos

CONSULTA: "${consulta}"`;

    const history = messages.slice(0, -1).map(msg => ({
      role: msg.role,
      parts: [{ text: msg.text }],
    }));

    const contents: Array<
      { text: string } | { inlineData: { mimeType: string; data: string } }
    > = [{ text: consulta }];

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
          systemInstruction: promptGeneral,
          temperature: 0.2,
          topP: 0.8,
          topK: 10,
        },
      });
      result = await chat.sendMessage({ message: contents });
    } else {
      result = await ai.models.generateContent({
        model: 'gemini-2.0-flash',
        contents,
        config: {
          systemInstruction: promptGeneral,
          temperature: 0.2,
          topP: 0.8,
          topK: 10,
        },
      });
    }

    return result.text || 'No pude generar una respuesta adecuada.';
  } catch (error) {
    console.error('❌ Error en respuesta general:', error);
    return 'Lo siento, ocurrió un error. ¿En qué más puedo ayudarte?';
  }
}

/**
 * Sugerir categorías alternativas cuando no se encuentra la categoría
 */
async function sugerirCategoriasAlternativas(
  consulta: string,
  categorias: { [key: string]: string[] }
): Promise<string> {
  const categoriasDisponibles = Object.keys(categorias).slice(0, 5);
  return `No encontré productos para "${consulta}". ¿Te interesan nuestras categorías disponibles: ${categoriasDisponibles.join(
    ', '
  )}?`;
}

/**
 * Sugerir productos similares cuando no hay coincidencias exactas
 */
async function sugerirProductosSimilares(
  consulta: string,
  productos: Producto[]
): Promise<string> {
  const productosAleatorios = productos
    .sort(() => 0.5 - Math.random())
    .slice(0, 3);
  const nombres = productosAleatorios.map(p => p.nombre).join(', ');
  const ids = productosAleatorios.map(p => p.id).join(',');

  return `No encontré coincidencias exactas para "${consulta}". ¿Te interesan estos productos similares: ${nombres}? [PRODUCTOS:${ids}]`;
}

// FUNCIONES AUXILIARES

/**
 * Limpiar respuesta JSON que puede venir envuelta en markdown
 */
function limpiarRespuestaJSON(respuesta: string): string {
  // Remover bloques de código markdown
  let jsonLimpio = respuesta.replace(/```json\s*/gi, '').replace(/```\s*/g, '');

  // Remover espacios en blanco al inicio y final
  jsonLimpio = jsonLimpio.trim();

  // Si no empieza con {, buscar el primer { y último }
  if (!jsonLimpio.startsWith('{')) {
    const inicioJSON = jsonLimpio.indexOf('{');
    const finJSON = jsonLimpio.lastIndexOf('}');
    if (inicioJSON !== -1 && finJSON !== -1) {
      jsonLimpio = jsonLimpio.substring(inicioJSON, finJSON + 1);
    }
  }

  return jsonLimpio;
}

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
    'conjunto',
    'body',
    'bolso',
    'mochila',
    'cartera',
    'bebé',
    'niño',
    'niña',
    'talla',
    'color',
    'precio',
  ];

  const textoLower = texto.toLowerCase();
  return palabrasProducto.some(palabra => textoLower.includes(palabra));
}

function calcularStockTotal(producto: Producto): number {
  return producto.variaciones.reduce(
    (total, variacion) =>
      total + variacion.tallas.reduce((sum, talla) => sum + talla.cantidad, 0),
    0
  );
}

function formatearProductosParaIA(productos: Producto[]): string {
  return productos
    .map((producto, index) => {
      const coloresDisponibles = producto.variaciones
        .flatMap(v => v.colores)
        .filter(color => color && color.trim() !== '')
        .join(', ');

      const tallasConStock = producto.variaciones
        .flatMap(v => v.tallas.filter(t => t.cantidad > 0))
        .map(
          t => `${t.talla} (${t.cantidad} unidades - S/ ${t.precio.toFixed(2)})`
        )
        .join(', ');

      const precios = producto.variaciones
        .flatMap(v => v.tallas.map(t => t.precio))
        .filter(precio => precio > 0);

      const precioMin = Math.min(...precios);
      const precioMax = Math.max(...precios);
      const rangoPrecio =
        precioMin === precioMax
          ? `S/ ${precioMin.toFixed(2)}`
          : `S/ ${precioMin.toFixed(2)} - S/ ${precioMax.toFixed(2)}`;

      const stockTotal = calcularStockTotal(producto);

      return `
PRODUCTO REAL ${index + 1}:
- ID: ${producto.id}
- Nombre EXACTO: ${producto.nombre}
- Categoría: ${producto.categoria}
- Precio: ${rangoPrecio}
- Colores disponibles: ${coloresDisponibles || 'No especificado'}
- Tallas con stock: ${tallasConStock || 'Sin stock'}
- Stock total: ${stockTotal} unidades

IMPORTANTE: Este producto EXISTE realmente en nuestra tienda.`;
    })
    .join('\n');
}

async function fileToBase64(file: File): Promise<string> {
  const arrayBuffer = await file.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);
  return buffer.toString('base64');
}
