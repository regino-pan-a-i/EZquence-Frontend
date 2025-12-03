'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import { Product } from '@/utils/supabase/schema';
import { useGetCart, useAddToCart } from '@/hooks/useCart';
import { FiShoppingCart, FiPackage } from 'react-icons/fi';

export interface CustomerProductCardProps {
  product: Product;
  className?: string;
}

const CustomerProductCard: React.FC<CustomerProductCardProps> = ({ product, className = '' }) => {
  const [imagePreview, setImagePreview] = useState<string>(product.productImage[0]?.imageURL);
  const { data: cartData } = useGetCart();
  const addToCart = useAddToCart();
  const cartId = cartData?.data?.cartId;

  const handleAddToCart = () => {
    if (cartId) {
      addToCart.mutate({ cartId, productId: product.productId, quantity: 1 });
    }
  };

  return (
    <div
      className={`bg-white dark:bg-neutral-900 border border-gray-200 dark:border-neutral-800 rounded-lg shadow-sm hover:shadow-md transition-shadow duration-200 overflow-hidden flex flex-col ${className}`}
    >
      {/* Product Image Section */}
      <div className="relative w-full h-48 sm:h-56 bg-gray-100 dark:bg-neutral-800">
        {imagePreview ? (
          <Image
            src={imagePreview}
            alt={product.name}
            fill
            className="object-cover"
            onError={() => setImagePreview('')}
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <FiPackage size={48} className="text-gray-300 dark:text-neutral-700" />
          </div>
        )}
      </div>

      {/* Product Content Section */}
      <div className="p-4 flex flex-col flex-grow">
        {/* Product Name */}
        <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-2 line-clamp-2">
          {product.name}
        </h2>

        {/* Product Price */}
        <p className="text-2xl font-bold text-blue-600 dark:text-blue-400 mb-3">
          ${product.price.toFixed(2)}
        </p>

        {/* Product Details */}
        <p className="text-sm text-gray-600 dark:text-gray-400 mb-4 line-clamp-2 flex-grow">
          {product.details}
        </p>

        {/* Add to Cart Button - Large touch target for mobile */}
        <button
          onClick={handleAddToCart}
          disabled={addToCart.isPending || !cartId}
          className="w-full py-3 min-h-[48px] bg-blue-600  disabled:bg-gray-400 text-white font-semibold rounded-lg transition-colors duration-200 flex items-center justify-center gap-2 active:scale-98 disabled:cursor-not-allowed"
        >
          <FiShoppingCart size={20} />
          {addToCart.isPending ? 'Adding...' : 'Add to Cart'}
        </button>
      </div>
    </div>
  );
};

export default CustomerProductCard;
