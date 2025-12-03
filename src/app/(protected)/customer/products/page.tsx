'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/utils/supabase/supabaseClient';
import { getApiUrl } from '@/utils/apiConfig';
import { ProductListResponse } from '@/utils/supabase/schema';
import CustomerProductCard from '@/components/product/CustomerProductCard';
import CartButton from '@/components/cart/CartButton';
import CartDrawer from '@/components/cart/CartDrawer';
import { FiSearch, FiX } from 'react-icons/fi';

async function fetchProducts(): Promise<ProductListResponse> {
  const { data: { session } } = await supabase.auth.getSession();
  const token = session?.access_token;

  const response = await fetch(getApiUrl('/product'), {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    throw new Error('Failed to fetch products');
  }

  return response.json();
}

export default function ProductsPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [isCartOpen, setIsCartOpen] = useState(false);

  const { data, isLoading, error } = useQuery({
    queryKey: ['products'],
    queryFn: fetchProducts,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });

  const products = data?.data || [];

  // Filter products based on search query
  const filteredProducts = products.filter(product =>
    product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    product.details.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-neutral-950">
      {/* Header with Search and Cart */}
      <div className="sticky top-0 z-30 bg-white dark:bg-neutral-900 border-b border-gray-200 dark:border-neutral-800 shadow-sm">
        <div className="p-4">
          <div className="flex items-center gap-3">
            {/* Search Input */}
            <div className="flex-1 relative">
              <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
              <input
                type="text"
                placeholder="Search products..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-10 py-3 min-h-[48px] border border-gray-300 dark:border-neutral-700 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-neutral-800 dark:text-white"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                  aria-label="Clear search"
                >
                  <FiX size={20} />
                </button>
              )}
            </div>

            {/* Cart Button */}
            <CartButton />
          </div>
        </div>
      </div>

      {/* Products Grid */}
      <div className="p-4">
        <h1 className="text-2xl md:text-3xl font-bold mb-6 text-gray-900 dark:text-white">
          Our Products
        </h1>

        {isLoading ? (
          <div className="flex items-center justify-center min-h-[400px]">
            <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600"></div>
          </div>
        ) : error ? (
          <div className="flex flex-col items-center justify-center min-h-[400px] text-center">
            <p className="text-red-500 mb-4">Failed to load products</p>
            <p className="text-gray-600 dark:text-gray-400 text-sm">{(error as Error).message}</p>
          </div>
        ) : filteredProducts.length === 0 ? (
          <div className="flex flex-col items-center justify-center min-h-[400px] text-center">
            <FiSearch size={64} className="text-gray-300 dark:text-neutral-700 mb-4" />
            <p className="text-gray-600 dark:text-gray-400">
              {searchQuery ? 'No products found matching your search' : 'No products available'}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 md:gap-6">
            {filteredProducts.map((product) => (
              <CustomerProductCard key={product.productId} product={product} />
            ))}
          </div>
        )}
      </div>

      {/* Cart Drawer */}
      <CartDrawer isOpen={isCartOpen} onClose={() => setIsCartOpen(false)} />
    </div>
  );
}
