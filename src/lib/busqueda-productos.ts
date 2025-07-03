// lib/busqueda-productos.ts
import { collection, getDocs, query, where, limit } from 'firebase/firestore';
import { db, COLLECTIONS } from './firebase';
import { Producto } from '@/types/producto';

export interface ParametrosBusqueda {
  texto?: string; // Búsqueda en nombre/descripción
  categoria?: string; // Filtro por categoría
  subcategoria?: string; // Filtro por subcategoría
  color?: string; // Filtro por color específico
  talla?: string; // Filtro por talla disponible
  limite?: number; // Máximo resultados (default: 3)
  activo?: boolean; // Solo productos activos (default: true)
}

export async function buscarProductos(
  parametros: ParametrosBusqueda
): Promise<Producto[]> {
  try {
    const {
      texto,
      categoria,
      subcategoria,
      color,
      talla,
      limite = 3,
      activo = true,
    } = parametros;

    // Construir query base
    let q = query(collection(db, COLLECTIONS.PRODUCTOS));

    // Filtro por activo
    if (activo !== undefined) {
      q = query(q, where('activo', '==', activo));
    }

    // Filtro por categoría
    if (categoria) {
      q = query(q, where('categoria', '==', categoria));
    }

    // Filtro por subcategoría
    if (subcategoria) {
      q = query(q, where('subcategoria', '==', subcategoria));
    }

    // Aplicar límite
    q = query(q, limit(limite * 2)); // Obtenemos más para filtrar después

    const querySnapshot = await getDocs(q);
    let productos: Producto[] = [];

    querySnapshot.forEach(doc => {
      productos.push({
        id: doc.id,
        ...doc.data(),
      } as Producto);
    });

    // Filtros adicionales que requieren procesamiento en cliente
    if (texto) {
      productos = filtrarPorTexto(productos, texto);
    }

    if (color) {
      productos = filtrarPorColor(productos, color);
    }

    if (talla) {
      productos = filtrarPorTalla(productos, talla);
    }

    // Ordenar por relevancia y aplicar límite final
    productos = ordenarPorRelevancia(productos, parametros);

    return productos.slice(0, limite);
  } catch (error) {
    console.error('Error en búsqueda de productos:', error);
    return [];
  }
}

// Función para búsqueda inteligente por texto
function filtrarPorTexto(productos: Producto[], texto: string): Producto[] {
  const terminos = texto
    .toLowerCase()
    .split(' ')
    .filter(t => t.length > 0);

  return productos.filter(producto => {
    const textoProducto = `
      ${producto.nombre} 
      ${producto.descripcion} 
      ${producto.categoria} 
      ${producto.subcategoria}
    `.toLowerCase();

    // Mapear términos comunes
    const terminosExpandidos = terminos.flatMap(termino => {
      const mapeos: { [key: string]: string[] } = {
        bebé: ['baby', 'bebe', 'angelitos', 'cargador'],
        bebe: ['baby', 'bebé', 'angelitos', 'cargador'],
        baby: ['bebé', 'bebe', 'angelitos', 'cargador'],
        bolso: ['bolso', 'cartera', 'mochila'],
        cartera: ['bolso', 'cartera'],
        mochila: ['mochila', 'bolso'],
        niño: ['niño', 'niña', 'infantil'],
        niña: ['niña', 'niño', 'infantil'],
      };

      return [termino, ...(mapeos[termino] || [])];
    });

    // Buscar si contiene alguno de los términos expandidos
    return terminosExpandidos.some(termino => textoProducto.includes(termino));
  });
}

// Función para filtrar por color
function filtrarPorColor(productos: Producto[], color: string): Producto[] {
  const colorLower = color.toLowerCase();

  return productos.filter(producto => {
    return producto.variaciones.some(variacion =>
      variacion.colores.some(c => c.toLowerCase().includes(colorLower))
    );
  });
}

// Función para filtrar por talla disponible
function filtrarPorTalla(productos: Producto[], talla: string): Producto[] {
  return productos.filter(producto => {
    return producto.variaciones.some(variacion =>
      variacion.tallas.some(t => t.talla === talla && t.cantidad > 0)
    );
  });
}

// Función para ordenar por relevancia
function ordenarPorRelevancia(
  productos: Producto[],
  parametros: ParametrosBusqueda
): Producto[] {
  return productos.sort((a, b) => {
    let scoreA = 0;
    let scoreB = 0;

    // Mayor score para productos con más stock
    const stockA = calcularStockTotal(a);
    const stockB = calcularStockTotal(b);
    scoreA += stockA;
    scoreB += stockB;

    // Mayor score para coincidencias exactas en nombre
    if (parametros.texto) {
      const texto = parametros.texto.toLowerCase();
      if (a.nombre.toLowerCase().includes(texto)) scoreA += 10;
      if (b.nombre.toLowerCase().includes(texto)) scoreB += 10;
    }

    // Mayor score para categoría exacta
    if (parametros.categoria) {
      if (a.categoria === parametros.categoria) scoreA += 5;
      if (b.categoria === parametros.categoria) scoreB += 5;
    }

    return scoreB - scoreA; // Orden descendente
  });
}

// Función auxiliar para calcular stock total
function calcularStockTotal(producto: Producto): number {
  return producto.variaciones.reduce(
    (total, variacion) =>
      total + variacion.tallas.reduce((sum, talla) => sum + talla.cantidad, 0),
    0
  );
}

// Función para buscar por categorías principales
export async function buscarPorCategoria(
  categoria: string,
  limite: number = 5
): Promise<Producto[]> {
  return buscarProductos({ categoria, limite });
}

// Función para obtener productos recomendados (con más stock)
export async function obtenerRecomendados(
  limite: number = 3
): Promise<Producto[]> {
  try {
    const productos = await buscarProductos({ limite: 10 });

    // Ordenar por stock total descendente
    return productos
      .sort((a, b) => calcularStockTotal(b) - calcularStockTotal(a))
      .slice(0, limite);
  } catch (error) {
    console.error('Error obteniendo recomendados:', error);
    return [];
  }
}

// Función para búsqueda de productos similares
export async function buscarSimilares(
  producto: Producto,
  limite: number = 3
): Promise<Producto[]> {
  return buscarProductos({
    categoria: producto.categoria,
    limite: limite + 1, // +1 para excluir el producto original
  }).then(productos =>
    productos.filter(p => p.id !== producto.id).slice(0, limite)
  );
}
