// lib/gemini-inteligente.ts
import { GoogleGenAI } from '@google/genai';
import { obtenerProductos, obtenerProductoPorId } from './productos';
import { buscarProductos } from './busqueda-productos';
import { Producto } from '@/types/producto';

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || '' });

// Cache para categorías (actualizar cada hora)
let categoriasCache: { [key: string]: string[] } | null = null;
let ultimaActualizacionCache = 0;

// Interfaces para respuestas de IA
interface ClasificacionCategoria {
  categorias: string[];
  subcategorias?: string[];
}

interface AnalisisConsulta {
  esConsultaProducto: boolean;
  esConsultaSeguimiento: boolean;
  productosAnteriores?: string[];
  clasificacion?: ClasificacionCategoria;
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
 * Análisis contextual completo en 6 pasos
 */
export async function chatWithGeminiInteligente(
  messages: { role: 'user' | 'model'; text: string }[],
  imageFile?: File
): Promise<string> {
  try {
    const lastMessage = messages[messages.length - 1];
    const consulta = lastMessage.text;

    console.log('🚀 INICIANDO BÚSQUEDA INTELIGENTE:', consulta);

    // PASO 1: Obtener categorías
    console.log('📂 PASO 1: Obteniendo categorías de Firebase...');
    const categorias = await obtenerCategoriasDinamicas();

    // PASO 2: Análisis inteligente con contexto
    console.log('🧠 PASO 2: Analizando consulta con contexto...');
    const analisis = await analizarConsultaConContexto(
      consulta,
      messages,
      categorias
    );

    // Si no es consulta de producto según Gemini
    if (!analisis.esConsultaProducto) {
      console.log('ℹ️ Gemini determinó que no es consulta de producto');
      return await respuestaGeneral(consulta, messages, imageFile);
    }

    // Si es consulta de seguimiento
    if (analisis.esConsultaSeguimiento && analisis.productosAnteriores) {
      console.log('🔄 Manejando consulta de seguimiento');
      return await manejarConsultaSeguimiento(
        consulta,
        analisis.productosAnteriores
      );
    }

    // Si no hay clasificación, error
    if (!analisis.clasificacion?.categorias?.length) {
      return 'No pude identificar qué tipo de producto buscas. ¿Podrías ser más específico?';
    }

    console.log('✅ Clasificación:', analisis.clasificacion);

    // PASO 3: Buscar productos en múltiples categorías
    console.log('📦 PASO 3: Buscando productos...');
    let productosCategoria: Producto[] = [];

    // Buscar en categorías
    for (const categoria of analisis.clasificacion.categorias) {
      console.log(`📂 Buscando en categoría: ${categoria}`);
      const productos = await buscarProductos({
        categoria: categoria,
        limite: 30,
        activo: true,
      });
      productosCategoria = [...productosCategoria, ...productos];
    }

    // Buscar en subcategorías
    if (analisis.clasificacion.subcategorias?.length) {
      for (const subcategoria of analisis.clasificacion.subcategorias) {
        console.log(`📂 Buscando en subcategoría: ${subcategoria}`);
        const productos = await buscarProductos({
          subcategoria: subcategoria,
          limite: 20,
          activo: true,
        });
        productosCategoria = [...productosCategoria, ...productos];
      }
    }

    // Eliminar duplicados
    const productosUnicos = productosCategoria.filter(
      (producto, index, array) =>
        array.findIndex(p => p.id === producto.id) === index
    );

    // Búsqueda adicional por texto si pocos resultados
    if (productosUnicos.length < 5) {
      console.log('📦 Búsqueda adicional por texto...');
      const productosTexto = await buscarProductos({
        texto: consulta,
        limite: 20,
        activo: true,
      });

      const idsExistentes = new Set(productosUnicos.map(p => p.id));
      const productosNuevos = productosTexto.filter(
        p => !idsExistentes.has(p.id)
      );
      productosCategoria = [...productosUnicos, ...productosNuevos];
    } else {
      productosCategoria = productosUnicos;
    }

    if (productosCategoria.length === 0) {
      return await sugerirCategoriasAlternativas(consulta, categorias);
    }

    console.log(`📊 Productos encontrados: ${productosCategoria.length}`);

    // PASO 4: Filtrar productos relevantes
    console.log('🔍 PASO 4: Filtrando productos relevantes...');
    const productosFiltrados = await filtrarProductosPorIA(
      productosCategoria,
      consulta
    );

    if (productosFiltrados.length === 0) {
      return await sugerirProductosSimilares(consulta, productosCategoria);
    }

    // PASO 5: Validar especificaciones
    console.log('✅ PASO 5: Validando especificaciones...');
    const validacion = await validarEspecificaciones(
      productosFiltrados,
      consulta
    );

    const productosFinales = productosFiltrados.filter(p =>
      validacion.productos_finales.includes(p.id!)
    );

    if (productosFinales.length === 0) {
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
 * PASO 2: Análisis inteligente con contexto
 */
async function analizarConsultaConContexto(
  consulta: string,
  mensajes: { role: 'user' | 'model'; text: string }[],
  categorias: { [key: string]: string[] }
): Promise<AnalisisConsulta> {
  // Obtener contexto de mensajes anteriores
  const contextoPrevio = mensajes
    .slice(-4)
    .map(msg => `${msg.role}: ${msg.text}`)
    .join('\n');
  const hayProductosAnteriores = mensajes.some(msg =>
    msg.text.includes('[PRODUCTOS:')
  );

  const prompt = `Analiza esta consulta considerando el contexto de la conversación.

CONSULTA ACTUAL: "${consulta}"

CONTEXTO PREVIO:
${contextoPrevio}

CATEGORÍAS DISPONIBLES:
${Object.entries(categorias)
  .map(([cat, subs]) => `- ${cat}: [${subs.join(', ')}]`)
  .join('\n')}

INSTRUCCIONES:
1. Determina si es consulta sobre productos de la tienda
2. Si hay productos mencionados antes, detecta si es consulta de seguimiento
3. Si es consulta de producto, clasifica categorías relevantes múltiples

RESPONDE CON JSON:
{
  "esConsultaProducto": true/false,
  "esConsultaSeguimiento": true/false,
  "clasificacion": {
    "categorias": ["categoria1", "categoria2"],
    "subcategorias": ["sub1", "sub2"]
  }
}

EJEMPLOS:
- "¿Cuál es su horario?" → {"esConsultaProducto": false}
- "Tienen mochilas?" → {"esConsultaProducto": true, "clasificacion": {"categorias": ["Bolsos y Mochilas"], "subcategorias": ["Mochilas"]}}
- "Tiene en rojo?" (después de mostrar productos) → {"esConsultaProducto": true, "esConsultaSeguimiento": true}
- "ropa para bebé" → {"esConsultaProducto": true, "clasificacion": {"categorias": ["Conjuntos", "Toallas", "Cargadores"], "subcategorias": ["Bodies para bebé", "Conjunto de bebé"]}}`;

  try {
    const result = await ai.models.generateContent({
      model: 'gemini-2.0-flash',
      contents: [{ text: prompt }],
      config: { temperature: 0.1, topP: 0.8, topK: 10 },
    });

    const respuesta = result.text || '{"esConsultaProducto": false}';
    console.log('🧠 Análisis IA:', respuesta);

    const jsonLimpio = limpiarRespuestaJSON(respuesta);
    const analisis = JSON.parse(jsonLimpio);

    // Extraer IDs de productos anteriores si es seguimiento
    if (analisis.esConsultaSeguimiento && hayProductosAnteriores) {
      const mensajesReversed = [...mensajes].reverse();
      const ultimoMensajeConProductos = mensajesReversed.find(msg =>
        msg.text.includes('[PRODUCTOS:')
      );
      if (ultimoMensajeConProductos) {
        const match = ultimoMensajeConProductos.text.match(
          /\[PRODUCTOS:([\w,]+)\]/
        );
        analisis.productosAnteriores = match ? match[1].split(',') : [];
      }
    }

    return analisis;
  } catch (error) {
    console.error('❌ Error analizando consulta:', error);
    return { esConsultaProducto: true, esConsultaSeguimiento: false };
  }
}

/**
 * Manejar consultas de seguimiento sobre productos anteriores
 */
async function manejarConsultaSeguimiento(
  consulta: string,
  productIds: string[]
): Promise<string> {
  try {
    console.log('🔄 Obteniendo productos anteriores:', productIds);

    // Obtener productos anteriores
    const productos = [];
    for (const id of productIds) {
      try {
        const producto = await obtenerProductoPorId(id.trim());
        if (producto) productos.push(producto);
      } catch (error) {
        console.error('Error obteniendo producto:', error);
      }
    }

    if (productos.length === 0) {
      return 'No pude encontrar los productos anteriores. ¿Podrías repetir tu consulta?';
    }

    const prompt = `El cliente pregunta sobre productos que ya vimos antes.

CONSULTA DE SEGUIMIENTO: "${consulta}"

PRODUCTOS ANTERIORES:
${formatearProductosParaIA(productos)}

INSTRUCCIONES:
- Responde específicamente sobre ESTOS productos
- Si pregunta por colores, menciona los colores disponibles de estos productos
- Si pregunta por tallas, menciona las tallas con stock
- Si pregunta por precios, usa los precios exactos
- Respuesta corta y directa (máximo 30 palabras)
- OBLIGATORIO: Incluye [PRODUCTOS:${productIds.join(',')}] al final

FORMATO: "Respuesta específica sobre los productos anteriores. [PRODUCTOS:ids]"`;

    const result = await ai.models.generateContent({
      model: 'gemini-2.0-flash',
      contents: [{ text: prompt }],
      config: { temperature: 0.1, topP: 0.8, topK: 10 },
    });

    const respuesta =
      result.text || `Sobre los productos anteriores: ${consulta}`;

    if (!respuesta.includes('[PRODUCTOS:')) {
      return `${respuesta} [PRODUCTOS:${productIds.join(',')}]`;
    }

    console.log('✅ Respuesta de seguimiento:', respuesta);
    return respuesta;
  } catch (error) {
    console.error('❌ Error en consulta de seguimiento:', error);
    return `No pude procesar tu consulta sobre los productos anteriores. [PRODUCTOS:${productIds.join(
      ','
    )}]`;
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
    if (productos.length <= 6) {
      console.log('🔍 Pocos productos, devolviendo todos:', productos.length);
      return productos;
    }

    const productosResumidos = productos.map(p => ({
      id: p.id,
      nombre: p.nombre,
      descripcion: p.descripcion.substring(0, 200) + '...',
      categoria: p.categoria,
      subcategoria: p.subcategoria,
      stock_total: calcularStockTotal(p),
      precio_min: Math.min(
        ...p.variaciones.flatMap(v => v.tallas.map(t => t.precio))
      ),
    }));

    const prompt = `Analiza la consulta del cliente y selecciona los productos MÁS RELEVANTES basándote tanto en el NOMBRE como en la DESCRIPCIÓN.

CONSULTA: "${consulta}"

PRODUCTOS DISPONIBLES:
${productosResumidos
  .map(
    (p, i) =>
      `${i + 1}. ID: ${p.id}
NOMBRE: ${p.nombre}
DESCRIPCIÓN: ${p.descripcion}
CATEGORÍA: ${p.categoria} - ${p.subcategoria}
STOCK: ${p.stock_total} | PRECIO: S/ ${p.precio_min}+`
  )
  .join('\n\n')}

INSTRUCCIONES DE ANÁLISIS:
- Analiza tanto el NOMBRE como la DESCRIPCIÓN de cada producto
- Busca coincidencias de palabras clave en ambos campos
- Considera sinónimos y términos relacionados
- Prioriza productos con mayor relevancia semántica
- Si la consulta es "ropa para bebé", busca en nombres Y descripciones que mencionen "bebé", "recién nacido", etc.
- Si es "mochilas", busca tanto productos con "mochila" en el nombre como en la descripción
- Máximo 8 productos más relevantes
- Prioriza productos con stock disponible
- Responde SOLO con JSON válido

FORMATO:
{"productos_seleccionados": ["id1", "id2", "id3", "id4", "id5", "id6"]}`;

    const result = await ai.models.generateContent({
      model: 'gemini-2.0-flash',
      contents: [{ text: prompt }],
      config: { temperature: 0.1, topP: 0.8, topK: 10 },
    });

    const respuesta = result.text || '{"productos_seleccionados": []}';
    console.log('🔍 Filtrado IA:', respuesta);

    const jsonLimpio = limpiarRespuestaJSON(respuesta);
    const resultado = JSON.parse(jsonLimpio) as ProductosSeleccionados;

    const productosFiltrados = productos.filter(p =>
      resultado.productos_seleccionados.includes(p.id!)
    );

    // Si la IA no seleccionó productos o muy pocos, devolver los primeros con mejor stock
    if (productosFiltrados.length === 0) {
      console.log('🔍 IA no seleccionó productos, usando criterio de stock');
      return productos
        .sort((a, b) => calcularStockTotal(b) - calcularStockTotal(a))
        .slice(0, 6);
    }

    return productosFiltrados;
  } catch (error) {
    console.error('❌ Error filtrando productos:', error);
    return productos.slice(0, 6); // Fallback a primeros 6
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
- Máximo 6 productos finales

FORMATO:
{"productos_finales": ["id1", "id2"], "son_similares": false}`;

    const result = await ai.models.generateContent({
      model: 'gemini-2.0-flash',
      contents: [{ text: prompt }],
      config: { temperature: 0.1, topP: 0.8, topK: 10 },
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
      config: { temperature: 0.1, topP: 0.8, topK: 10 },
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

/**
 * Calcular stock total de un producto
 */
function calcularStockTotal(producto: Producto): number {
  return producto.variaciones.reduce(
    (total, variacion) =>
      total + variacion.tallas.reduce((sum, talla) => sum + talla.cantidad, 0),
    0
  );
}

/**
 * Formatear productos para enviar a la IA
 */
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

/**
 * Convertir archivo a base64
 */
async function fileToBase64(file: File): Promise<string> {
  const arrayBuffer = await file.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);
  return buffer.toString('base64');
}
