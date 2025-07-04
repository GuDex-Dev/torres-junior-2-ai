// components/ProductCarousel.tsx
'use client';

import { useState } from 'react';
import { Producto } from '@/types/producto';
import ProductCard from './ProductCard';
import ProductModal from './ProductModal';

interface ProductCarouselProps {
  productos: Producto[];
}

export default function ProductCarousel({ productos }: ProductCarouselProps) {
  const [selectedProducto, setSelectedProducto] = useState<Producto | null>(
    null
  );
  const [isModalOpen, setIsModalOpen] = useState(false);

  const handleCardClick = (producto: Producto) => {
    setSelectedProducto(producto);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedProducto(null);
  };

  if (productos.length === 0) return null;

  return (
    <div className="my-4">
      {/* Carrusel horizontal */}
      <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide">
        {productos.map(producto => (
          <ProductCard
            key={producto.id}
            producto={producto}
            onClick={() => handleCardClick(producto)}
          />
        ))}
      </div>

      {/* Modal */}
      {selectedProducto && (
        <ProductModal
          producto={selectedProducto}
          isOpen={isModalOpen}
          onClose={handleCloseModal}
        />
      )}

      {/* Estilos para ocultar scrollbar */}
      <style jsx>{`
        .scrollbar-hide {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
        .scrollbar-hide::-webkit-scrollbar {
          display: none;
        }
      `}</style>
    </div>
  );
}
