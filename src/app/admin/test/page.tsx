// app/admin/test/page.tsx
'use client';

import { useState } from 'react';
import { obtenerProductos, crearProducto } from '@/lib/productos';
import { Producto } from '@/types/producto';

export default function TestPage() {
  const [productos, setProductos] = useState<Producto[]>([]);
  const [loading, setLoading] = useState(false);
  const [mensaje, setMensaje] = useState('');

  const testObtenerProductos = async () => {
    setLoading(true);
    setMensaje('');
    try {
      const data = await obtenerProductos();
      console.log(data);
      setProductos(data);
      setMensaje(`✅ Éxito: ${data.length} productos obtenidos`);
    } catch (error) {
      setMensaje(`❌ Error: ${error}`);
    }
    setLoading(false);
  };

  const testCrearProducto = async () => {
    setLoading(true);
    setMensaje('');
    try {
      const nuevoProducto = {
        nombre: `testProduct${Date.now()}`,
        descripcion: 'Producto de prueba creado desde admin',
        categoria: 'categoria1',
        subcategoria: 'subcategoria1',
        variaciones: [
          {
            colores: ['rojo', 'azul'],
            imagen_url: '/productos/test-image.jpg',
            tallas: [
              { talla: '12', cantidad: 5, precio: 29.99 },
              { talla: '14', cantidad: 3, precio: 31.99 },
            ],
          },
        ],
        activo: true,
      };

      const id = await crearProducto(nuevoProducto);
      setMensaje(`✅ Producto creado con ID: ${id}`);

      // Actualizar lista
      await testObtenerProductos();
    } catch (error) {
      setMensaje(`❌ Error creando producto: ${error}`);
    }
    setLoading(false);
  };

  return (
    <div className="max-w-4xl mx-auto p-6">
      <h1 className="text-2xl font-bold mb-6">Test Conexión Firebase</h1>

      <div className="space-y-4 mb-6">
        <button
          onClick={testObtenerProductos}
          disabled={loading}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg disabled:bg-gray-400"
        >
          {loading ? 'Cargando...' : 'Test Obtener Productos'}
        </button>

        <button
          onClick={testCrearProducto}
          disabled={loading}
          className="bg-green-600 text-white px-4 py-2 rounded-lg disabled:bg-gray-400 ml-2"
        >
          {loading ? 'Creando...' : 'Test Crear Producto'}
        </button>
      </div>

      {mensaje && (
        <div
          className={`p-4 rounded-lg mb-4 ${
            mensaje.includes('✅')
              ? 'bg-green-100 text-green-800'
              : 'bg-red-100 text-red-800'
          }`}
        >
          {mensaje}
        </div>
      )}

      <div>
        <h2 className="text-xl font-semibold mb-4">
          Productos ({productos.length})
        </h2>
        <div className="space-y-2">
          {productos.map(producto => (
            <div key={producto.id} className="bg-white p-4 rounded-lg shadow">
              <h3 className="font-medium">{producto.nombre}</h3>
              <p className="text-sm text-gray-600">{producto.descripcion}</p>
              <p className="text-xs text-gray-500">ID: {producto.id}</p>
              <p className="text-xs text-gray-500">
                Variaciones: {producto.variaciones.length}
              </p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
