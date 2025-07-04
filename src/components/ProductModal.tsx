// components/ProductModal.tsx
'use client';

import { useState } from 'react';
import { Producto } from '@/types/producto';
import {
  getImageUrl,
  handleImageError,
  isLocalProductImage,
} from '@/lib/utils';
import Image from 'next/image';

interface ProductModalProps {
  producto: Producto;
  isOpen: boolean;
  onClose: () => void;
}

export default function ProductModal({
  producto,
  isOpen,
  onClose,
}: ProductModalProps) {
  const [selectedVariacionIndex, setSelectedVariacionIndex] = useState(0);
  const [selectedTallaIndex, setSelectedTallaIndex] = useState(0);

  if (!isOpen) return null;

  const variacionActual = producto.variaciones[selectedVariacionIndex];
  const tallaActual = variacionActual.tallas[selectedTallaIndex];

  const handleColorChange = (index: number) => {
    setSelectedVariacionIndex(index);
    setSelectedTallaIndex(0); // Reset a primera talla disponible
  };

  const handleTallaChange = (index: number) => {
    setSelectedTallaIndex(index);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
        {/* Header con botón cerrar */}
        <div className="flex justify-between items-center p-6 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900">
            {producto.nombre}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 text-2xl font-bold"
          >
            ×
          </button>
        </div>

        <div className="p-6">
          {/* Imagen principal */}
          <div className="relative w-full h-64 bg-gray-100 rounded-lg overflow-hidden mb-6">
            {isLocalProductImage(variacionActual.imagen_url) ? (
              <img
                src={getImageUrl(variacionActual.imagen_url, producto.nombre)}
                alt={`${producto.nombre} - ${variacionActual.colores.join(
                  ', '
                )}`}
                className="w-full h-full object-cover"
                onError={e => handleImageError(e, producto.nombre)}
              />
            ) : (
              <Image
                src={getImageUrl(variacionActual.imagen_url, producto.nombre)}
                alt={`${producto.nombre} - ${variacionActual.colores.join(
                  ', '
                )}`}
                fill
                className="object-cover"
                onError={e => handleImageError(e, producto.nombre)}
              />
            )}
          </div>

          {/* Precio y stock actual */}
          <div className="text-center mb-6">
            <p className="text-2xl font-bold text-amber-600 mb-1">
              S/ {tallaActual.precio.toFixed(2)}
            </p>
            <p className="text-sm text-gray-600">
              Stock: {tallaActual.cantidad} unidades
            </p>
          </div>

          {/* Selector de colores */}
          {producto.variaciones.length > 1 && (
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-3">
                Colores disponibles:
              </label>
              <div className="flex flex-wrap gap-2">
                {producto.variaciones.map((variacion, index) => (
                  <button
                    key={index}
                    onClick={() => handleColorChange(index)}
                    className={`px-3 py-2 text-sm rounded-lg border transition-colors ${
                      selectedVariacionIndex === index
                        ? 'bg-amber-500 text-white border-amber-500'
                        : 'bg-white text-gray-700 border-gray-300 hover:border-amber-300'
                    }`}
                  >
                    {variacion.colores.join(', ')}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Selector de tallas */}
          {variacionActual.tallas.length > 1 && (
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-3">
                Tallas disponibles:
              </label>
              <div className="grid grid-cols-4 gap-2">
                {variacionActual.tallas.map((talla, index) => (
                  <button
                    key={index}
                    onClick={() => handleTallaChange(index)}
                    disabled={talla.cantidad === 0}
                    className={`px-3 py-2 text-sm rounded-lg border transition-colors ${
                      selectedTallaIndex === index
                        ? 'bg-amber-500 text-white border-amber-500'
                        : talla.cantidad === 0
                        ? 'bg-gray-100 text-gray-400 border-gray-200 cursor-not-allowed'
                        : 'bg-white text-gray-700 border-gray-300 hover:border-amber-300'
                    }`}
                  >
                    {talla.talla}
                    {talla.cantidad === 0 && (
                      <div className="text-xs text-gray-400">Sin stock</div>
                    )}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Información adicional */}
          <div className="bg-amber-50 rounded-lg p-4">
            <h4 className="font-medium text-gray-900 mb-2">
              Información del producto
            </h4>
            <p className="text-sm text-gray-600 mb-2">{producto.descripcion}</p>
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Categoría:</span>
              <span className="font-medium">{producto.categoria}</span>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-gray-200">
          <button
            onClick={onClose}
            className="w-full bg-gradient-to-r from-amber-500 to-orange-500 text-white py-3 rounded-lg font-medium hover:from-amber-600 hover:to-orange-600 transition-all duration-200"
          >
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );
}
