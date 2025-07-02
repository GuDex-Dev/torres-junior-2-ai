'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { obtenerProductoPorId, eliminarProducto } from '@/lib/productos';
import { getImageUrl } from '@/lib/utils';
import { Producto } from '@/types/producto';

export default function DetalleProducto() {
  const params = useParams();
  const router = useRouter();
  const [producto, setProducto] = useState<Producto | null>(null);
  const [loading, setLoading] = useState(true);
  const [eliminando, setEliminando] = useState(false);
  const [mensaje, setMensaje] = useState('');

  const id = params.id as string;

  useEffect(() => {
    cargarProducto();
  }, [id]);

  const cargarProducto = async () => {
    try {
      const data = await obtenerProductoPorId(id);
      setProducto(data);
    } catch (error) {
      setMensaje(`❌ Error cargando producto: ${error}`);
    }
    setLoading(false);
  };

  const handleEliminar = async () => {
    if (!confirm('¿Estás seguro de que quieres eliminar este producto?')) {
      return;
    }

    setEliminando(true);
    try {
      await eliminarProducto(id);
      setMensaje('✅ Producto eliminado exitosamente');
      setTimeout(() => {
        router.push('/admin');
      }, 1500);
    } catch (error) {
      setMensaje(`❌ Error eliminando producto: ${error}`);
    }
    setEliminando(false);
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-amber-500"></div>
      </div>
    );
  }

  if (!producto) {
    return (
      <div className="text-center py-12">
        <h1 className="text-2xl font-bold text-gray-900 mb-4">Producto no encontrado</h1>
        <Link 
          href="/admin"
          className="bg-gradient-to-r from-amber-500 to-orange-500 text-white px-4 py-2 rounded-lg hover:from-amber-600 hover:to-orange-600 transition-all duration-200"
        >
          Volver al Admin
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex justify-between items-start mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">{producto.nombre}</h1>
          <p className="text-amber-600 mt-1">ID: {producto.id}</p>
          <div className="flex items-center gap-4 mt-2">
            <span className={`px-3 py-1 rounded-full text-sm font-medium ${producto.activo ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
              {producto.activo ? 'Activo' : 'Inactivo'}
            </span>
            <span className="text-sm text-gray-500">
              Creado: {producto.fecha_creacion ? new Date(producto.fecha_creacion.seconds * 1000).toLocaleDateString() : 'N/A'}
            </span>
          </div>
        </div>

        <div className="flex gap-3">
          <Link
            href={`/admin/productos/${id}/editar`}
            className="bg-gradient-to-r from-amber-500 to-orange-500 text-white px-4 py-2 rounded-lg hover:from-amber-600 hover:to-orange-600 transition-all duration-200 shadow-md"
          >
            ✏️ Editar
          </Link>
          <button
            onClick={handleEliminar}
            disabled={eliminando}
            className="bg-red-500 text-white px-4 py-2 rounded-lg hover:bg-red-600 transition-colors disabled:opacity-50 shadow-md"
          >
            {eliminando ? 'Eliminando...' : '🗑️ Eliminar'}
          </button>
        </div>
      </div>

      {mensaje && (
        <div className={`p-4 rounded-lg mb-6 ${mensaje.includes('✅') ? 'bg-green-100 text-green-800 border border-green-200' : 'bg-red-100 text-red-800 border border-red-200'}`}>
          {mensaje}
        </div>
      )}

      {/* Información Básica */}
      <div className="bg-white rounded-xl shadow-md p-6 mb-6 border border-orange-100">
        <h2 className="text-xl font-semibold text-gray-800 mb-4 border-b border-amber-100 pb-2">Información Básica</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-600">Categoría</label>
            <p className="text-lg text-gray-900">{producto.categoria}</p>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-600">Subcategoría</label>
            <p className="text-lg text-gray-900">{producto.subcategoria}</p>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-600">Total Variaciones</label>
            <p className="text-lg text-gray-900">{producto.variaciones.length}</p>
          </div>
        </div>
        <div className="mt-4">
          <label className="block text-sm font-medium text-gray-600">Descripción</label>
          <p className="text-gray-900 mt-1">{producto.descripcion}</p>
        </div>
      </div>

      {/* Variaciones */}
      <div className="bg-white rounded-xl shadow-md p-6 border border-orange-100">
        <h2 className="text-xl font-semibold text-gray-800 mb-4 border-b border-amber-100 pb-2">Variaciones de Color</h2>
        
        <div className="space-y-6">
          {producto.variaciones.map((variacion, index) => (
            <div key={index} className="border border-amber-100 rounded-lg p-4 bg-amber-50">
              <h3 className="font-medium text-gray-800 mb-3">Variación {index + 1}</h3>
              
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Imagen y Colores */}
                <div>
                  <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-600 mb-2">Imagen</label>
                    <div className="relative w-48 h-48 bg-gray-100 rounded-lg overflow-hidden border border-amber-200">
                      <Image
                        src={getImageUrl(variacion.imagen_url, producto.nombre)}
                        alt={`${producto.nombre} - Variación ${index + 1}`}
                        fill
                        className="object-cover"
                        onError={(e) => {
                          const target = e.target as HTMLImageElement;
                          target.src = `https://via.placeholder.com/400x400/FCD34D/ffffff?text=${encodeURIComponent(producto.nombre)}`;
                        }}
                      />
                    </div>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-600 mb-2">Colores</label>
                    <div className="flex flex-wrap gap-2">
                      {variacion.colores.map((color, colorIndex) => (
                        <span
                          key={colorIndex}
                          className="bg-amber-100 text-amber-800 px-3 py-1 rounded-full text-sm border border-amber-200"
                        >
                          {color}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Tallas y Precios */}
                <div>
                  <label className="block text-sm font-medium text-gray-600 mb-2">Tallas y Precios</label>
                  <div className="space-y-2">
                    {variacion.tallas.map((talla, tallaIndex) => (
                      <div key={tallaIndex} className="bg-white p-3 rounded-lg border border-amber-200 flex justify-between items-center">
                        <div className="flex items-center gap-4">
                          <span className="font-medium text-gray-800">Talla {talla.talla}</span>
                          <span className="text-gray-600">Stock: {talla.cantidad}</span>
                        </div>
                        <span className="text-amber-600 font-semibold">S/ {talla.precio.toFixed(2)}</span>
                      </div>
                    ))}
                  </div>
                  
                  {/* Resumen de variación */}
                  <div className="mt-4 p-3 bg-white rounded-lg border border-amber-200">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Total tallas:</span>
                      <span className="font-medium">{variacion.tallas.length}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Stock total:</span>
                      <span className="font-medium">{variacion.tallas.reduce((sum, t) => sum + t.cantidad, 0)}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Precio rango:</span>
                      <span className="font-medium">
                        S/ {Math.min(...variacion.tallas.map(t => t.precio)).toFixed(2)} - 
                        S/ {Math.max(...variacion.tallas.map(t => t.precio)).toFixed(2)}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Resumen general del producto */}
        <div className="mt-6 p-4 bg-gradient-to-r from-amber-50 to-orange-50 rounded-lg border border-amber-200">
          <h3 className="font-semibold text-gray-800 mb-2">Resumen del Producto</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            <div className="text-center">
              <p className="text-gray-600">Total Variaciones</p>
              <p className="text-xl font-bold text-amber-600">{producto.variaciones.length}</p>
            </div>
            <div className="text-center">
              <p className="text-gray-600">Total Colores</p>
              <p className="text-xl font-bold text-amber-600">
                {producto.variaciones.reduce((sum, v) => sum + v.colores.length, 0)}
              </p>
            </div>
            <div className="text-center">
              <p className="text-gray-600">Total Tallas</p>
              <p className="text-xl font-bold text-amber-600">
                {producto.variaciones.reduce((sum, v) => sum + v.tallas.length, 0)}
              </p>
            </div>
            <div className="text-center">
              <p className="text-gray-600">Stock Total</p>
              <p className="text-xl font-bold text-amber-600">
                {producto.variaciones.reduce((sum, v) => 
                  sum + v.tallas.reduce((tSum, t) => tSum + t.cantidad, 0), 0
                )}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Botones de acción */}
      <div className="flex gap-4 mt-6">
        <Link
          href="/admin"
          className="bg-gray-100 text-gray-700 px-6 py-3 rounded-lg font-medium hover:bg-gray-200 transition-colors border border-gray-300"
        >
          ← Volver al Admin
        </Link>
        <Link
          href={`/admin/productos/${id}/editar`}
          className="bg-gradient-to-r from-amber-500 to-orange-500 text-white px-6 py-3 rounded-lg font-medium hover:from-amber-600 hover:to-orange-600 transition-all duration-200 shadow-md"
        >
          ✏️ Editar Producto
        </Link>
      </div>
    </div>
  );
}