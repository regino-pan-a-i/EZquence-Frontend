'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import { Product } from '@/utils/supabase/schema';

export interface ProductCardProps {
  product: Product;
  onDetailsClick?: (productId: number) => void;
  className?: string;
}

const ProductCard: React.FC<ProductCardProps> = ({ product, onDetailsClick, className = '' }) => {
  const [imagePreview, setImagePreview] = useState<string>(product.productImage[0]?.imageURL);

  const handleDetails = () => {
    if (onDetailsClick) {
      onDetailsClick(product.productId);
    }
  };

  return (
    <div
      className={`bg-surface border border-border h-full rounded-lg shadow-sm hover:shadow-md transition-shadow duration-200 overflow-hidden flex flex-col ${className}`}
    >
      {/* Product Image Section */}
      <div className="relative w-full h-64 bg-background">
        <Image
          src={imagePreview || 'https://placehold.co/600x400'}
          alt={product.name}
          fill
          className="object-cover"
          unoptimized
          onError={() => setImagePreview('https://via.placeholder.com/600x400/e5e7eb/6b7280?text=No+Image')}
        />
      </div>

      {/* Product Content Section */}
      <div className="p-6 flex flex-col flex-grow">
        {/* Product Name */}
        <div className="mb-4">
          <h2 className="text-2xl font-bold text-foreground">{product.name}</h2>
          <p className="text-xl font-semibold text-green-600 mt-2">${product.price.toFixed(2)}</p>
        </div>

        {/* Product Details */}
        <div className="mb-4 flex-grow">
          <h3 className="text-sm font-semibold text-foreground mb-2">Details</h3>
          <p className="text-muted leading-relaxed">{product.details}</p>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-2 mt-auto">
          <button
            onClick={handleDetails}
            className="w-full px-4 py-2 bg-primary text-primary-foreground font-medium rounded-md hover:bg-primary-hover transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-accent focus:ring-offset-2"
          >
            See Details
          </button>
        </div>
      </div>
    </div>
  );
};

export default ProductCard;
