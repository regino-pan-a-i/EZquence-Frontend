'use client';

import ProductCard from '@/components/product/ProductCard';
import ProductModal from '@/components/product/ProductModal';
import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { ProductListResponse, Product } from '@/utils/supabase/schema'
import { supabase } from '@/utils/supabase/supabaseClient';


export default function ProductsPage() {

  const [products, setProducts] = useState<Product[]>([]);
  const [selectedProductId, setSelectedProductId] = useState<number | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);




  const { data: prodResponse, isLoading: loadingProducts } = useQuery<ProductListResponse>({
    queryKey: ['products'],
    queryFn: async () => {
      // Get the session token
      const {
        data: { session },
      } = await supabase.auth.getSession();
      const token = session?.access_token;
      const res = await fetch(
        `http://localhost:8080/product`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        }
      );
      if (!res.ok) console.log('Failed to fetch orders', res);
      return res.json();
    },
  });

  // Use useEffect to set products when data is fetched
  useEffect(() => {
    if (prodResponse && prodResponse.success === true) {
      setProducts(prodResponse.data);
    }
  }, [prodResponse]);

  const handleOpenModal = (productId: number) => {
    setSelectedProductId(productId);
    setIsModalOpen(true);
    setTimeout(() => setIsAnimating(true), 10);
  };

  const handleCloseModal = () => {
    setIsAnimating(false);
    setTimeout(() => {
      setIsModalOpen(false);
      setSelectedProductId(null);
    }, 300);
  };

  const handleSaveProduct = (updatedProduct: Product) => {
    setProducts(
      products?.map((p) => (p.productId === updatedProduct.productId ? updatedProduct : p))
    );
    console.log('Product updated:', updatedProduct);
    handleCloseModal();
    // Add your API call here to save the product
  };

  return (
    <div className="p-6">
      <h1 className="text-3xl font-bold text-gray-900 mb-6">Products</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {products?.map((product) => (
          <ProductCard
            key={product.productId}
            product={product}
            onDetailsClick={handleOpenModal}
          />
        ))}
      </div>

      {/* Modal */}
      {isModalOpen && selectedProductId && (
        <div 
          className={`fixed inset-0 backdrop-blur-xs flex items-center justify-center z-50 p-4 transition-opacity duration-300 ${
            isAnimating ? 'opacity-100' : 'opacity-0'
          }`}
          onClick={handleCloseModal}
          >
          <div 
            className={`bg-white rounded-lg w-full max-w-6xl h-auto max-h-[90vh] min-h-[500px] overflow-hidden flex flex-col transform transition-transform duration-300 ease-out ${
              isAnimating ? 'translate-y-0' : 'translate-y-full'
            }`}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex-shrink-0 bg-white border-b px-4 py-3 flex justify-between items-center">
              <h2 className="text-xl font-semibold">Product Details</h2>
              <button
                onClick={handleCloseModal}
                className="text-gray-500 hover:text-gray-700 text-2xl"
              >
                ×
              </button>
            </div>
            <div className="p-4 overflow-y-auto">
              <ProductModal
                productId={selectedProductId}
                onSave={handleSaveProduct}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}