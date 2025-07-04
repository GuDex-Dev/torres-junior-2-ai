'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { obtenerProductos } from '@/lib/productos';
import {
  getImageUrl,
  handleImageError,
  isLocalProductImage,
} from '@/lib/utils';
import { Producto } from '@/types/producto';

export default function AdminDashboard() {
  const [productos, setProductos] = useState<Producto[]>([]);
  const [loading, setLoading] = useState(true);
  const [filtro, setFiltro] = useState('');
  const [categoriaFiltro, setCategoriaFiltro] = useState('');
  const [subcategoriaFiltro, setSubcategoriaFiltro] = useState('');

  useEffect(() => {
    cargarProductos();
  }, []);

  // Reset subcategoría cuando cambia categoría
  useEffect(() => {
    setSubcategoriaFiltro('');
  }, [categoriaFiltro]);

  const cargarProductos = async () => {
    try {
      const data = await obtenerProductos();
      setProductos(data);
    } catch (error) {
      console.error('Error cargando productos:', error);
    }
    setLoading(false);
  };

  const productosFiltrados = productos.filter(producto => {
    const matchNombre = producto.nombre
      .toLowerCase()
      .includes(filtro.toLowerCase());
    const matchCategoria =
      categoriaFiltro === '' || producto.categoria === categoriaFiltro;
    const matchSubcategoria =
      subcategoriaFiltro === '' || producto.subcategoria === subcategoriaFiltro;
    return matchNombre && matchCategoria && matchSubcategoria;
  });

  const categorias = [...new Set(productos.map(p => p.categoria))];

  // Subcategorías filtradas por categoría seleccionada
  const subcategorias = categoriaFiltro
    ? [
        ...new Set(
          productos
            .filter(p => p.categoria === categoriaFiltro)
            .map(p => p.subcategoria)
        ),
      ]
    : [...new Set(productos.map(p => p.subcategoria))];

  const getTotalStock = (producto: Producto) => {
    return producto.variaciones.reduce(
      (total, variacion) =>
        total +
        variacion.tallas.reduce((sum, talla) => sum + talla.cantidad, 0),
      0
    );
  };

  const getPrecioRango = (producto: Producto) => {
    const precios = producto.variaciones.flatMap(v =>
      v.tallas.map(t => t.precio)
    );
    const min = Math.min(...precios);
    const max = Math.max(...precios);
    return min === max
      ? `S/ ${min.toFixed(2)}`
      : `S/ ${min.toFixed(2)} - S/ ${max.toFixed(2)}`;
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-amber-500"></div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">
          Panel de Administración
        </h1>
        <p className="text-amber-600 mt-2">
          Gestiona el catálogo de productos de Torres Jr. 2
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <div className="bg-white rounded-xl shadow-md p-6 border border-orange-100">
          <div className="flex items-center">
            <div className="p-3 rounded-full bg-amber-100">
              <span className="text-2xl">📦</span>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">
                Total Productos
              </p>
              <p className="text-2xl font-bold text-gray-900">
                {productos.length}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-md p-6 border border-orange-100">
          <div className="flex items-center">
            <div className="p-3 rounded-full bg-green-100">
              <span className="text-2xl">✅</span>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">
                Productos Activos
              </p>
              <p className="text-2xl font-bold text-gray-900">
                {productos.filter(p => p.activo).length}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-md p-6 border border-orange-100">
          <div className="flex items-center">
            <div className="p-3 rounded-full bg-blue-100">
              <span className="text-2xl">🏷️</span>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Categorías</p>
              <p className="text-2xl font-bold text-gray-900">
                {categorias.length}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-md p-6 border border-orange-100">
          <div className="flex items-center">
            <div className="p-3 rounded-full bg-purple-100">
              <span className="text-2xl">📊</span>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Stock Total</p>
              <p className="text-2xl font-bold text-gray-900">
                {productos.reduce((total, p) => total + getTotalStock(p), 0)}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Filtros */}
      <div className="bg-white rounded-xl shadow-md p-6 mb-6 border border-orange-100">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Búsqueda por nombre */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Buscar por nombre
            </label>
            <input
              type="text"
              value={filtro}
              onChange={e => setFiltro(e.target.value)}
              placeholder="Buscar productos..."
              className="w-full px-3 py-2 border border-amber-200 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
            />
          </div>

          {/* Filtro por categoría */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Categoría
            </label>
            <select
              value={categoriaFiltro}
              onChange={e => setCategoriaFiltro(e.target.value)}
              className="w-full px-3 py-2 border border-amber-200 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
            >
              <option value="">Todas las categorías</option>
              {categorias.map(categoria => (
                <option key={categoria} value={categoria}>
                  {categoria}
                </option>
              ))}
            </select>
          </div>

          {/* Filtro por subcategoría */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Subcategoría
            </label>
            <select
              value={subcategoriaFiltro}
              onChange={e => setSubcategoriaFiltro(e.target.value)}
              className="w-full px-3 py-2 border border-amber-200 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
              disabled={subcategorias.length === 0}
            >
              <option value="">Todas las subcategorías</option>
              {subcategorias.map(subcategoria => (
                <option key={subcategoria} value={subcategoria}>
                  {subcategoria}
                </option>
              ))}
            </select>
          </div>

          {/* Botón limpiar filtros */}
          <div className="flex items-end">
            <button
              onClick={() => {
                setFiltro('');
                setCategoriaFiltro('');
                setSubcategoriaFiltro('');
              }}
              className="w-full px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors border border-gray-300 text-sm font-medium"
            >
              Limpiar Filtros
            </button>
          </div>
        </div>

        {/* Información de filtros aplicados */}
        {(filtro || categoriaFiltro || subcategoriaFiltro) && (
          <div className="mt-4 p-3 bg-amber-50 rounded-lg border border-amber-200">
            <p className="text-sm text-amber-800">
              <span className="font-medium">Filtros aplicados:</span>
              {filtro && <span className="ml-2">Texto: "{filtro}"</span>}
              {categoriaFiltro && (
                <span className="ml-2">Categoría: "{categoriaFiltro}"</span>
              )}
              {subcategoriaFiltro && (
                <span className="ml-2">
                  Subcategoría: "{subcategoriaFiltro}"
                </span>
              )}
              <span className="ml-2 font-medium">
                → {productosFiltrados.length} productos encontrados
              </span>
            </p>
          </div>
        )}
      </div>

      {/* Lista de productos */}
      <div className="bg-white rounded-xl shadow-md border border-orange-100">
        <div className="p-6 border-b border-amber-100">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-semibold text-gray-800">
              Productos ({productosFiltrados.length})
            </h2>
            <Link
              href="/admin/productos/nuevo"
              className="bg-gradient-to-r from-amber-500 to-orange-500 text-white px-4 py-2 rounded-lg hover:from-amber-600 hover:to-orange-600 transition-all duration-200 shadow-md"
            >
              + Nuevo Producto
            </Link>
          </div>
        </div>

        <div className="p-6">
          {productosFiltrados.length === 0 ? (
            <div className="text-center py-12">
              <span className="text-6xl mb-4 block">📦</span>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                No hay productos
              </h3>
              <p className="text-gray-600 mb-4">
                {productos.length === 0
                  ? 'Comienza creando tu primer producto'
                  : 'No se encontraron productos con los filtros actuales'}
              </p>
              {productos.length === 0 && (
                <Link
                  href="/admin/productos/nuevo"
                  className="bg-gradient-to-r from-amber-500 to-orange-500 text-white px-6 py-3 rounded-lg hover:from-amber-600 hover:to-orange-600 transition-all duration-200 shadow-md"
                >
                  Crear Primer Producto
                </Link>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {productosFiltrados.map(producto => (
                <div
                  key={producto.id}
                  className="border border-amber-100 rounded-lg p-4 hover:shadow-md transition-shadow bg-amber-50"
                >
                  {/* Imagen */}
                  <div className="relative w-full h-48 bg-gray-100 rounded-lg overflow-hidden mb-4 border border-amber-200">
                    {isLocalProductImage(
                      producto.variaciones[0]?.imagen_url
                    ) ? (
                      <img
                        src={getImageUrl(
                          producto.variaciones[0]?.imagen_url,
                          producto.nombre
                        )}
                        alt={producto.nombre}
                        className="w-full h-full object-cover"
                        onError={e => handleImageError(e, producto.nombre)}
                      />
                    ) : (
                      <Image
                        src={getImageUrl(
                          producto.variaciones[0]?.imagen_url,
                          producto.nombre
                        )}
                        alt={producto.nombre}
                        fill
                        className="object-cover"
                        onError={e => handleImageError(e, producto.nombre)}
                      />
                    )}
                    {/* Badge de estado */}
                    <div className="absolute top-2 right-2">
                      <span
                        className={`px-2 py-1 rounded-full text-xs font-medium ${
                          producto.activo
                            ? 'bg-green-100 text-green-800'
                            : 'bg-red-100 text-red-800'
                        }`}
                      >
                        {producto.activo ? 'Activo' : 'Inactivo'}
                      </span>
                    </div>
                  </div>

                  {/* Información */}
                  <div className="space-y-2">
                    <h3 className="font-semibold text-gray-900 truncate">
                      {producto.nombre}
                    </h3>
                    <p className="text-sm text-gray-600 line-clamp-2">
                      {producto.descripcion}
                    </p>

                    <div className="flex justify-between items-center text-sm">
                      <span className="text-amber-600 font-medium">
                        {producto.categoria}
                      </span>
                      <span className="text-gray-500">
                        {producto.variaciones.length} variaciones
                      </span>
                    </div>

                    {/* Mostrar subcategoría */}
                    <div className="flex justify-between items-center text-sm">
                      <span className="text-orange-600 font-medium">
                        {producto.subcategoria}
                      </span>
                      <span className="text-gray-500">
                        Stock: {getTotalStock(producto)}
                      </span>
                    </div>

                    <div className="flex justify-between items-center text-sm">
                      <span className="text-gray-700 font-medium">
                        {getPrecioRango(producto)}
                      </span>
                    </div>
                  </div>

                  {/* Acciones */}
                  <div className="flex gap-2 mt-4">
                    <Link
                      href={`/admin/productos/${producto.id}`}
                      className="flex-1 bg-amber-100 text-amber-700 text-center py-2 rounded-lg text-sm font-medium hover:bg-amber-200 transition-colors"
                    >
                      Ver
                    </Link>
                    <Link
                      href={`/admin/productos/${producto.id}/editar`}
                      className="flex-1 bg-gradient-to-r from-amber-500 to-orange-500 text-white text-center py-2 rounded-lg text-sm font-medium hover:from-amber-600 hover:to-orange-600 transition-all duration-200"
                    >
                      Editar
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
