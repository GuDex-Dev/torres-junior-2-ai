'use client';
import { useState } from 'react';
import { Producto } from '@/types/producto';
import ProductCard from './ProductCard';
import ProductModal from './ProductModal';

interface ProductGridProps {
  productos: Producto[];
}

export default function ProductGrid({ productos }: ProductGridProps) {
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
    <div className="my-6">
      {/* Grid responsivo de productos */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
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
    </div>
  );
}
