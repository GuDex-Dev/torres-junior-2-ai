'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Image from 'next/image';
import { obtenerProductoPorId, actualizarProducto } from '@/lib/productos';
import { getImageUrl } from '@/lib/utils';
import { ProductoForm, Talla, Producto } from '@/types/producto';

export default function EditarProducto() {
  const params = useParams();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [mensaje, setMensaje] = useState('');

  const id = params.id as string;

  const [form, setForm] = useState<ProductoForm>({
    nombre: '',
    descripcion: '',
    categoria: '',
    subcategoria: '',
    variaciones: [],
    activo: true
  });

  useEffect(() => {
    cargarProducto();
  }, [id]);

  const cargarProducto = async () => {
    try {
      const producto = await obtenerProductoPorId(id);
      if (producto) {
        setForm({
          nombre: producto.nombre,
          descripcion: producto.descripcion,
          categoria: producto.categoria,
          subcategoria: producto.subcategoria,
          variaciones: producto.variaciones.map(v => ({
            colores: v.colores,
            imagen_url: v.imagen_url,
            tallas: v.tallas
          })),
          activo: producto.activo
        });
      }
    } catch (error) {
      setMensaje(`❌ Error cargando producto: ${error}`);
    }
    setLoading(false);
  };

  const actualizarCampo = (campo: keyof ProductoForm, valor: any) => {
    setForm(prev => ({ ...prev, [campo]: valor }));
  };

  const actualizarVariacion = (index: number, campo: string, valor: any) => {
    const nuevasVariaciones = [...form.variaciones];
    if (campo === 'colores') {
      nuevasVariaciones[index].colores = valor;
    } else if (campo === 'imagen_file') {
      nuevasVariaciones[index].imagen_file = valor;
    } else if (campo === 'imagen_url') {
      nuevasVariaciones[index].imagen_url = valor;
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
          tallas: [{ talla: '', cantidad: 0, precio: 0 }]
        }
      ]
    }));
  };

  const eliminarVariacion = (index: number) => {
    setForm(prev => ({
      ...prev,
      variaciones: prev.variaciones.filter((_, i) => i !== index)
    }));
  };

  const actualizarColor = (variacionIndex: number, colorIndex: number, valor: string) => {
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
    nuevasVariaciones[variacionIndex].colores = nuevasVariaciones[variacionIndex].colores.filter((_, i) => i !== colorIndex);
    setForm(prev => ({ ...prev, variaciones: nuevasVariaciones }));
  };

  const actualizarTalla = (variacionIndex: number, tallaIndex: number, campo: keyof Talla, valor: string | number) => {
    const nuevasVariaciones = [...form.variaciones];
    nuevasVariaciones[variacionIndex].tallas[tallaIndex] = {
      ...nuevasVariaciones[variacionIndex].tallas[tallaIndex],
      [campo]: valor
    };
    setForm(prev => ({ ...prev, variaciones: nuevasVariaciones }));
  };

  const agregarTalla = (variacionIndex: number) => {
    const nuevasVariaciones = [...form.variaciones];
    nuevasVariaciones[variacionIndex].tallas.push({ talla: '', cantidad: 0, precio: 0 });
    setForm(prev => ({ ...prev, variaciones: nuevasVariaciones }));
  };

  const eliminarTalla = (variacionIndex: number, tallaIndex: number) => {
    const nuevasVariaciones = [...form.variaciones];
    nuevasVariaciones[variacionIndex].tallas = nuevasVariaciones[variacionIndex].tallas.filter((_, i) => i !== tallaIndex);
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
    setSaving(true);
    setMensaje('');

    try {
      // Procesar variaciones (subir nuevas imágenes si existen)
      const variacionesActualizadas = await Promise.all(
        form.variaciones.map(async (variacion) => {
          let imagen_url = variacion.imagen_url || '/productos/default.jpg';
          
          if (variacion.imagen_file) {
            imagen_url = await subirImagen(variacion.imagen_file);
          }

          return {
            colores: variacion.colores.filter(color => color.trim() !== ''),
            imagen_url,
            tallas: variacion.tallas.filter(talla => talla.talla.trim() !== '')
          };
        })
      );

      const productoActualizado = {
        nombre: form.nombre,
        descripcion: form.descripcion,
        categoria: form.categoria,
        subcategoria: form.subcategoria,
        variaciones: variacionesActualizadas,
        activo: form.activo
      };

      await actualizarProducto(id, productoActualizado);
      setMensaje('✅ Producto actualizado exitosamente');
      
      setTimeout(() => {
        router.push(`/admin/productos/${id}`);
      }, 1500);

    } catch (error) {
      setMensaje(`❌ Error: ${error}`);
    }
    setSaving(false);
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-amber-500"></div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900">Editar Producto</h1>
        <p className="text-amber-600 mt-2">ID: {id}</p>
      </div>

      {mensaje && (
        <div className={`p-4 rounded-lg mb-6 ${mensaje.includes('✅') ? 'bg-green-100 text-green-800 border border-green-200' : 'bg-red-100 text-red-800 border border-red-200'}`}>
          {mensaje}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="bg-white rounded-xl shadow-md p-6 border border-orange-100">
          <h2 className="text-xl font-semibold text-gray-800 mb-4 border-b border-amber-100 pb-2">Información Básica</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Nombre del Producto</label>
              <input
                type="text"
                value={form.nombre}
                onChange={(e) => actualizarCampo('nombre', e.target.value)}
                className="w-full px-3 py-2 border border-amber-200 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500 transition-colors"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Categoría</label>
              <input
                type="text"
                value={form.categoria}
                onChange={(e) => actualizarCampo('categoria', e.target.value)}
                className="w-full px-3 py-2 border border-amber-200 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500 transition-colors"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Subcategoría</label>
              <input
                type="text"
                value={form.subcategoria}
                onChange={(e) => actualizarCampo('subcategoria', e.target.value)}
                className="w-full px-3 py-2 border border-amber-200 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500 transition-colors"
                required
              />
            </div>

            <div className="flex items-center">
              <input
                type="checkbox"
                checked={form.activo}
                onChange={(e) => actualizarCampo('activo', e.target.checked)}
                className="h-4 w-4 text-amber-600 focus:ring-amber-500 border-amber-300 rounded"
              />
              <label className="ml-2 text-sm text-gray-700">Producto Activo</label>
            </div>
          </div>

          <div className="mt-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">Descripción</label>
            <textarea
              value={form.descripcion}
              onChange={(e) => actualizarCampo('descripcion', e.target.value)}
              rows={3}
              className="w-full px-3 py-2 border border-amber-200 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500 transition-colors"
              required
            />
          </div>
        </div>

        {/* Variaciones - Igual que en crear pero con datos precargados */}
        <div className="bg-white rounded-xl shadow-md p-6 border border-orange-100">
          <div className="flex justify-between items-center mb-4 border-b border-amber-100 pb-2">
            <h2 className="text-xl font-semibold text-gray-800">Variaciones de Color</h2>
            <button
              type="button"
              onClick={agregarVariacion}
              className="bg-gradient-to-r from-amber-500 to-orange-500 text-white px-4 py-2 rounded-lg text-sm hover:from-amber-600 hover:to-orange-600 transition-all duration-200"
            >
              + Agregar Variación
            </button>
          </div>

          {form.variaciones.map((variacion, variacionIndex) => (
            <div key={variacionIndex} className="border border-amber-100 rounded-lg p-4 mb-4 bg-amber-50">
              <div className="flex justify-between items-center mb-3">
                <h3 className="font-medium text-gray-800">Variación {variacionIndex + 1}</h3>
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

              {/* Imagen actual */}
              {variacion.imagen_url && (
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">Imagen Actual</label>
                  <div className="relative w-32 h-32 border border-amber-200 rounded-lg overflow-hidden">
                    <Image
                      src={getImageUrl(variacion.imagen_url, form.nombre)} 
                      alt="Imagen actual" 
                      fill
                      className="object-cover"
                      onError={(e) => {
                        const target = e.target as HTMLImageElement;
                        target.src = `data:image/svg+xml;base64,${btoa(`<svg width="200" height="200" xmlns="http://www.w3.org/2000/svg"><rect width="200" height="200" fill="#FCD34D"/><text x="100" y="100" font-family="Arial" font-size="16" fill="white" text-anchor="middle" dominant-baseline="middle">${form.nombre.substring(0, 10)}</text></svg>`)}`;
                      }}
                    />
                  </div>
                </div>
              )}

              {/* Nueva imagen */}
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">Cambiar Imagen (opcional)</label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) {
                      actualizarVariacion(variacionIndex, 'imagen_file', file);
                    }
                  }}
                  className="w-full px-3 py-2 border border-amber-200 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
                />
              </div>

              {/* Colores */}
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">Colores</label>
                {variacion.colores.map((color, colorIndex) => (
                  <div key={colorIndex} className="flex gap-2 mb-2">
                    <input
                      type="text"
                      value={color}
                      onChange={(e) => actualizarColor(variacionIndex, colorIndex, e.target.value)}
                      className="flex-1 px-3 py-2 border border-amber-200 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
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
                        onClick={() => eliminarColor(variacionIndex, colorIndex)}
                        className="bg-red-100 text-red-700 px-3 py-2 rounded-lg hover:bg-red-200 transition-colors"
                      >
                        -
                      </button>
                    )}
                  </div>
                ))}
              </div>

              {/* Tallas */}
              <div>
                <div className="flex justify-between items-center mb-2">
                  <label className="block text-sm font-medium text-gray-700">Tallas y Precios</label>
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
                  <label className="text-xs font-medium text-gray-600">Talla</label>
                  <label className="text-xs font-medium text-gray-600">Cantidad</label>
                  <label className="text-xs font-medium text-gray-600">Precio (S/)</label>
                  <label className="text-xs font-medium text-gray-600">Acción</label>
                </div>
                
                {variacion.tallas.map((talla, tallaIndex) => (
                  <div key={tallaIndex} className="grid grid-cols-4 gap-2 mb-2">
                    <input
                      type="text"
                      value={talla.talla}
                      onChange={(e) => actualizarTalla(variacionIndex, tallaIndex, 'talla', e.target.value)}
                      className="px-3 py-2 border border-amber-200 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
                      placeholder="12"
                    />
                    <input
                      type="number"
                      value={talla.cantidad}
                      onChange={(e) => actualizarTalla(variacionIndex, tallaIndex, 'cantidad', parseInt(e.target.value) || 0)}
                      className="px-3 py-2 border border-amber-200 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
                      placeholder="10"
                      min="0"
                    />
                    <input
                      type="number"
                      step="0.01"
                      value={talla.precio}
                      onChange={(e) => actualizarTalla(variacionIndex, tallaIndex, 'precio', parseFloat(e.target.value) || 0)}
                      className="px-3 py-2 border border-amber-200 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
                      placeholder="25.50"
                      min="0"
                    />
                    {variacion.tallas.length > 1 && (
                      <button
                        type="button"
                        onClick={() => eliminarTalla(variacionIndex, tallaIndex)}
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
            disabled={saving}
            className="bg-gradient-to-r from-amber-500 to-orange-500 text-white px-6 py-3 rounded-lg font-medium hover:from-amber-600 hover:to-orange-600 transition-all duration-200 disabled:opacity-50 shadow-md"
          >
            {saving ? 'Guardando...' : 'Guardar Cambios'}
          </button>
          <button
            type="button"
            onClick={() => router.push(`/admin/productos/${id}`)}
            className="bg-gray-100 text-gray-700 px-6 py-3 rounded-lg font-medium hover:bg-gray-200 transition-colors border border-gray-300"
          >
            Cancelar
          </button>
        </div>
      </form>
    </div>
  );
}