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

  // Calcular stock total
  const stockTotal = producto.variaciones.reduce(
    (total, v) => total + v.tallas.reduce((sum, t) => sum + t.cantidad, 0),
    0
  );

  // Imagen principal (primera variación)
  const imagenPrincipal = producto.variaciones[0]?.imagen_url;

  return (
    <div
      className="w-full bg-white rounded-xl border border-amber-100 p-4 cursor-pointer hover:shadow-lg transition-all duration-200 hover:border-amber-300 hover:scale-105"
      onClick={onClick}
    >
      {/* Imagen */}
      <div className="relative w-full h-40 bg-gray-100 rounded-lg overflow-hidden mb-3">
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

        {/* Badge de stock */}
        <div className="absolute top-2 right-2 bg-white bg-opacity-90 px-2 py-1 rounded-full text-xs font-medium">
          {stockTotal > 0 ? (
            <span className="text-green-600">Stock: {stockTotal}</span>
          ) : (
            <span className="text-red-600">Sin stock</span>
          )}
        </div>
      </div>

      {/* Información */}
      <div className="text-center">
        <h3 className="text-sm font-semibold text-gray-900 mb-2 line-clamp-2 leading-tight">
          {producto.nombre}
        </h3>
        <p className="text-lg font-bold text-amber-600 mb-1">{precioTexto}</p>
        <p className="text-xs text-gray-500 capitalize">{producto.categoria}</p>
      </div>
    </div>
  );
}
