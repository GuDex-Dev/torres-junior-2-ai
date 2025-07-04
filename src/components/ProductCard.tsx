// components/ProductCard.tsx
'use client';

import { Producto } from '@/types/producto';
import {
  getImageUrl,
  handleImageError,
  isLocalProductImage,
} from '@/lib/utils';
import Image from 'next/image';

interface ProductCardProps {
  producto: Producto;
  onClick: () => void;
}

export default function ProductCard({ producto, onClick }: ProductCardProps) {
  // Calcular precio mínimo para mostrar
  const precios = producto.variaciones
    .flatMap(v => v.tallas.map(t => t.precio))
    .filter(p => p > 0);

  const precioMin = Math.min(...precios);
  const precioMax = Math.max(...precios);

  const precioTexto =
    precioMin === precioMax
      ? `S/ ${precioMin.toFixed(2)}`
      : `S/ ${precioMin.toFixed(2)}+`;

  // Imagen principal (primera variación)
  const imagenPrincipal = producto.variaciones[0]?.imagen_url;

  return (
    <div
      className="min-w-[180px] max-w-[180px] bg-white rounded-lg border border-amber-100 p-3 cursor-pointer hover:shadow-md transition-all duration-200 hover:border-amber-300"
      onClick={onClick}
    >
      {/* Imagen */}
      <div className="relative w-full h-32 bg-gray-100 rounded-lg overflow-hidden mb-2">
        {isLocalProductImage(imagenPrincipal) ? (
          <img
            src={getImageUrl(imagenPrincipal, producto.nombre)}
            alt={producto.nombre}
            className="w-full h-full object-cover"
            onError={e => handleImageError(e, producto.nombre)}
          />
        ) : (
          <Image
            src={getImageUrl(imagenPrincipal, producto.nombre)}
            alt={producto.nombre}
            fill
            className="object-cover"
            onError={e => handleImageError(e, producto.nombre)}
          />
        )}
      </div>

      {/* Información */}
      <div className="text-center">
        <h3 className="text-sm font-medium text-gray-900 truncate mb-1">
          {producto.nombre}
        </h3>
        <p className="text-amber-600 font-semibold">{precioTexto}</p>
      </div>
    </div>
  );
}
