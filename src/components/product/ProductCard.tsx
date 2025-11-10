'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import { Product } from '@/utils/supabase/schema'

export interface ProductCardProps {
  product: Product;
  onDetailsClick?: (productId: number) => void;  
  className?: string;
}

const ProductCard: React.FC<ProductCardProps> = ({
  product,
  onDetailsClick,
  className = '',
}) => {
  const [imagePreview, setImagePreview] = useState<string>(product.productImage[0]?.imageURL);

  const handleDetails = () => {
    if (onDetailsClick) {
      onDetailsClick(product.productId);
    }
  };

  return (
    <div
      className={`bg-white border border-gray-200 h-full rounded-lg shadow-sm hover:shadow-md transition-shadow duration-200 overflow-hidden flex flex-col ${className}`}
    >
      {/* Product Image Section */}
      <div className="relative w-full h-64 bg-gray-100">

        <Image
          src={imagePreview || '/placeholder-product.png'}
          alt={product.name}
          fill
          className="object-cover"
          onError={() => setImagePreview('/placeholder-product.png')}
        />
        
      </div>

      {/* Product Content Section */}
      <div className="p-6 flex flex-col flex-grow">
        {/* Product Name */}
        <div className="mb-4">
          <h2 className="text-2xl font-bold text-gray-900">{product.name}</h2>
        </div>

        {/* Product Details */}
        <div className="mb-4 flex-grow">
          <h3 className="text-sm font-semibold text-gray-700 mb-2">Details</h3>
          <p className="text-gray-600 leading-relaxed">{product.details}</p>
          
        </div>
        
        {/* Action Buttons */}
        <div className="flex gap-2 mt-auto">
          <button
            onClick={handleDetails}
            className="w-full px-4 py-2 bg-blue-600 text-white font-medium rounded-md hover:bg-blue-700 transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
          >
            See Details
          </button>

        </div>
      </div>
    </div>
  );
};

export default ProductCard;
