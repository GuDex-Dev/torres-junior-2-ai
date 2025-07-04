'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { crearProducto } from '@/lib/productos';
import { ProductoForm, Talla } from '@/types/producto';

export default function NuevoProducto() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [mensaje, setMensaje] = useState('');

  const [form, setForm] = useState<ProductoForm>({
    nombre: '',
    descripcion: '',
    categoria: '',
    subcategoria: '',
    variaciones: [
      {
        colores: [''],
        tallas: [{ talla: '', cantidad: 0, precio: 0 }],
      },
    ],
    activo: true,
  });

  const actualizarCampo = (campo: keyof ProductoForm, valor: any) => {
    setForm(prev => ({ ...prev, [campo]: valor }));
  };

  const actualizarVariacion = (index: number, campo: string, valor: any) => {
    const nuevasVariaciones = [...form.variaciones];
    if (campo === 'colores') {
      nuevasVariaciones[index].colores = valor;
    } else if (campo === 'imagen_file') {
      nuevasVariaciones[index].imagen_file = valor;
    } else if (campo === 'tallas') {
      nuevasVariaciones[index].tallas = valor;
    }
    setForm(prev => ({ ...prev, variaciones: nuevasVariaciones }));
  };

  const agregarVariacion = () => {
    setForm(prev => ({
      ...prev,
      variaciones: [
        ...prev.variaciones,
        {
          colores: [''],
          tallas: [{ talla: '', cantidad: 0, precio: 0 }],
        },
      ],
    }));
  };

  const eliminarVariacion = (index: number) => {
    setForm(prev => ({
      ...prev,
      variaciones: prev.variaciones.filter((_, i) => i !== index),
    }));
  };

  const actualizarColor = (
    variacionIndex: number,
    colorIndex: number,
    valor: string
  ) => {
    const nuevasVariaciones = [...form.variaciones];
    nuevasVariaciones[variacionIndex].colores[colorIndex] = valor;
    setForm(prev => ({ ...prev, variaciones: nuevasVariaciones }));
  };

  const agregarColor = (variacionIndex: number) => {
    const nuevasVariaciones = [...form.variaciones];
    nuevasVariaciones[variacionIndex].colores.push('');
    setForm(prev => ({ ...prev, variaciones: nuevasVariaciones }));
  };

  const eliminarColor = (variacionIndex: number, colorIndex: number) => {
    const nuevasVariaciones = [...form.variaciones];
    nuevasVariaciones[variacionIndex].colores = nuevasVariaciones[
      variacionIndex
    ].colores.filter((_, i) => i !== colorIndex);
    setForm(prev => ({ ...prev, variaciones: nuevasVariaciones }));
  };

  const actualizarTalla = (
    variacionIndex: number,
    tallaIndex: number,
    campo: keyof Talla,
    valor: string | number
  ) => {
    const nuevasVariaciones = [...form.variaciones];
    nuevasVariaciones[variacionIndex].tallas[tallaIndex] = {
      ...nuevasVariaciones[variacionIndex].tallas[tallaIndex],
      [campo]: valor,
    };
    setForm(prev => ({ ...prev, variaciones: nuevasVariaciones }));
  };

  const agregarTalla = (variacionIndex: number) => {
    const nuevasVariaciones = [...form.variaciones];
    nuevasVariaciones[variacionIndex].tallas.push({
      talla: '',
      cantidad: 0,
      precio: 0,
    });
    setForm(prev => ({ ...prev, variaciones: nuevasVariaciones }));
  };

  const eliminarTalla = (variacionIndex: number, tallaIndex: number) => {
    const nuevasVariaciones = [...form.variaciones];
    nuevasVariaciones[variacionIndex].tallas = nuevasVariaciones[
      variacionIndex
    ].tallas.filter((_, i) => i !== tallaIndex);
    setForm(prev => ({ ...prev, variaciones: nuevasVariaciones }));
  };

  const subirImagen = async (file: File): Promise<string> => {
    const formData = new FormData();
    formData.append('file', file);

    const response = await fetch('/api/upload', {
      method: 'POST',
      body: formData,
    });

    const result = await response.json();
    if (result.success) {
      return result.url;
    } else {
      throw new Error(result.error || 'Error subiendo imagen');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMensaje('');

    try {
      // Subir imágenes y preparar producto
      const variacionesConImagenes = await Promise.all(
        form.variaciones.map(async variacion => {
          let imagen_url = '/productos/default.jpg';

          if (variacion.imagen_file) {
            imagen_url = await subirImagen(variacion.imagen_file);
          }

          return {
            colores: variacion.colores.filter(color => color.trim() !== ''),
            imagen_url,
            tallas: variacion.tallas.filter(talla => talla.talla.trim() !== ''),
          };
        })
      );

      const producto = {
        nombre: form.nombre,
        descripcion: form.descripcion,
        categoria: form.categoria,
        subcategoria: form.subcategoria,
        variaciones: variacionesConImagenes,
        activo: form.activo,
      };

      const id = await crearProducto(producto);
      setMensaje('✅ Producto creado exitosamente');

      setTimeout(() => {
        router.push(`/admin/productos/${id}`);
      }, 1500);
    } catch (error) {
      setMensaje(`❌ Error: ${error}`);
    }
    setLoading(false);
  };

  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900">
          Crear Nuevo Producto
        </h1>
        <p className="text-amber-600 mt-2">
          Completa la información del producto
        </p>
      </div>

      {mensaje && (
        <div
          className={`p-4 rounded-lg mb-6 ${
            mensaje.includes('✅')
              ? 'bg-green-100 text-green-800 border border-green-200'
              : 'bg-red-100 text-red-800 border border-red-200'
          }`}
        >
          {mensaje}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="bg-white rounded-xl shadow-md p-6 border border-orange-100">
          <h2 className="text-xl font-semibold text-gray-800 mb-4 border-b border-amber-100 pb-2">
            Información Básica
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Nombre del Producto
              </label>
              <input
                type="text"
                value={form.nombre}
                onChange={e => actualizarCampo('nombre', e.target.value)}
                className="w-full px-3 py-2 border border-amber-200 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500 transition-colors"
                placeholder="Ej: Zapatillas deportivas Nike Air Max"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Categoría
              </label>
              <input
                type="text"
                value={form.categoria}
                onChange={e => actualizarCampo('categoria', e.target.value)}
                className="w-full px-3 py-2 border border-amber-200 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500 transition-colors"
                placeholder="Ej: Calzado, Ropa, Accesorios"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Subcategoría
              </label>
              <input
                type="text"
                value={form.subcategoria}
                onChange={e => actualizarCampo('subcategoria', e.target.value)}
                className="w-full px-3 py-2 border border-amber-200 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500 transition-colors"
                placeholder="Ej: Zapatillas, Camisetas, Relojes"
                required
              />
            </div>

            <div className="flex items-center">
              <input
                type="checkbox"
                checked={form.activo}
                onChange={e => actualizarCampo('activo', e.target.checked)}
                className="h-4 w-4 text-amber-600 focus:ring-amber-500 border-amber-300 rounded"
              />
              <label className="ml-2 text-sm text-gray-700">
                Producto Activo
              </label>
            </div>
          </div>

          <div className="mt-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Descripción
            </label>
            <textarea
              value={form.descripcion}
              onChange={e => actualizarCampo('descripcion', e.target.value)}
              rows={3}
              className="w-full px-3 py-2 border border-amber-200 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500 transition-colors"
              placeholder="Describe las características principales del producto, materiales, usos recomendados..."
              required
            />
          </div>
        </div>

        {/* Variaciones */}
        <div className="bg-white rounded-xl shadow-md p-6 border border-orange-100">
          <div className="flex justify-between items-center mb-4 border-b border-amber-100 pb-2">
            <h2 className="text-xl font-semibold text-gray-800">
              Variaciones de Color
            </h2>
            <button
              type="button"
              onClick={agregarVariacion}
              className="bg-gradient-to-r from-amber-500 to-orange-500 text-white px-4 py-2 rounded-lg text-sm hover:from-amber-600 hover:to-orange-600 transition-all duration-200"
            >
              + Agregar Variación
            </button>
          </div>

          {form.variaciones.map((variacion, variacionIndex) => (
            <div
              key={variacionIndex}
              className="border border-amber-100 rounded-lg p-4 mb-4 bg-amber-50"
            >
              <div className="flex justify-between items-center mb-3">
                <h3 className="font-medium text-gray-800">
                  Variación {variacionIndex + 1}
                </h3>
                {form.variaciones.length > 1 && (
                  <button
                    type="button"
                    onClick={() => eliminarVariacion(variacionIndex)}
                    className="text-red-600 hover:text-red-800 text-sm"
                  >
                    Eliminar
                  </button>
                )}
              </div>

              {/* Colores */}
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Colores
                </label>
                {variacion.colores.map((color, colorIndex) => (
                  <div key={colorIndex} className="flex gap-2 mb-2">
                    <input
                      type="text"
                      value={color}
                      onChange={e =>
                        actualizarColor(
                          variacionIndex,
                          colorIndex,
                          e.target.value
                        )
                      }
                      className="flex-1 px-3 py-2 border border-amber-200 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
                      placeholder="Ej: Rojo, Azul marino, Negro mate"
                    />
                    <button
                      type="button"
                      onClick={() => agregarColor(variacionIndex)}
                      className="bg-amber-100 text-amber-700 px-3 py-2 rounded-lg hover:bg-amber-200 transition-colors"
                    >
                      +
                    </button>
                    {variacion.colores.length > 1 && (
                      <button
                        type="button"
                        onClick={() =>
                          eliminarColor(variacionIndex, colorIndex)
                        }
                        className="bg-red-100 text-red-700 px-3 py-2 rounded-lg hover:bg-red-200 transition-colors"
                      >
                        -
                      </button>
                    )}
                  </div>
                ))}
              </div>

              {/* Imagen */}
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Imagen
                </label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={e => {
                    const file = e.target.files?.[0];
                    if (file) {
                      actualizarVariacion(variacionIndex, 'imagen_file', file);
                    }
                  }}
                  className="w-full px-3 py-2 border border-amber-200 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
                />
              </div>

              {/* Tallas */}
              <div>
                <div className="flex justify-between items-center mb-2">
                  <label className="block text-sm font-medium text-gray-700">
                    Tallas y Precios
                  </label>
                  <button
                    type="button"
                    onClick={() => agregarTalla(variacionIndex)}
                    className="bg-amber-100 text-amber-700 px-3 py-1 rounded text-sm hover:bg-amber-200 transition-colors"
                  >
                    + Talla
                  </button>
                </div>

                {/* Headers para las columnas */}
                <div className="grid grid-cols-4 gap-2 mb-2">
                  <label className="text-xs font-medium text-gray-600">
                    Talla
                  </label>
                  <label className="text-xs font-medium text-gray-600">
                    Cantidad
                  </label>
                  <label className="text-xs font-medium text-gray-600">
                    Precio (S/)
                  </label>
                  <label className="text-xs font-medium text-gray-600">
                    Acción
                  </label>
                </div>

                {variacion.tallas.map((talla, tallaIndex) => (
                  <div key={tallaIndex} className="grid grid-cols-4 gap-2 mb-2">
                    <input
                      type="text"
                      value={talla.talla}
                      onChange={e =>
                        actualizarTalla(
                          variacionIndex,
                          tallaIndex,
                          'talla',
                          e.target.value
                        )
                      }
                      className="px-3 py-2 border border-amber-200 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
                      placeholder="Ej: 42, M, XL"
                    />
                    <input
                      type="number"
                      value={talla.cantidad}
                      onChange={e =>
                        actualizarTalla(
                          variacionIndex,
                          tallaIndex,
                          'cantidad',
                          parseInt(e.target.value) || 0
                        )
                      }
                      className="px-3 py-2 border border-amber-200 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
                      placeholder="Stock"
                      min="0"
                    />
                    <input
                      type="number"
                      step="0.01"
                      value={talla.precio}
                      onChange={e =>
                        actualizarTalla(
                          variacionIndex,
                          tallaIndex,
                          'precio',
                          parseFloat(e.target.value) || 0
                        )
                      }
                      className="px-3 py-2 border border-amber-200 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
                      placeholder="149.90"
                      min="0"
                    />
                    {variacion.tallas.length > 1 && (
                      <button
                        type="button"
                        onClick={() =>
                          eliminarTalla(variacionIndex, tallaIndex)
                        }
                        className="bg-red-100 text-red-700 px-3 py-2 rounded-lg hover:bg-red-200 transition-colors"
                      >
                        -
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        <div className="flex gap-4">
          <button
            type="submit"
            disabled={loading}
            className="bg-gradient-to-r from-amber-500 to-orange-500 text-white px-6 py-3 rounded-lg font-medium hover:from-amber-600 hover:to-orange-600 transition-all duration-200 disabled:opacity-50 shadow-md"
          >
            {loading ? 'Creando...' : 'Crear Producto'}
          </button>
          <button
            type="button"
            onClick={() => router.back()}
            className="bg-gray-100 text-gray-700 px-6 py-3 rounded-lg font-medium hover:bg-gray-200 transition-colors border border-gray-300"
          >
            Cancelar
          </button>
        </div>
      </form>
    </div>
  );
}
