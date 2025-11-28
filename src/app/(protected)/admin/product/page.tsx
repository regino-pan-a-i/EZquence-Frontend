'use client';

import ProductCard from '@/components/product/ProductCard';
import ProductModal from '@/components/product/ProductModal';
import ScoreCard from '@/components/scorecard/ScoreCard';
import { getApiBaseUrl } from '@/utils/apiConfig';
import { useState, useEffect } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { ProductListResponse, Product, ProductInStock, ProductInStockResponse } from '@/utils/supabase/schema';
import { supabase } from '@/utils/supabase/supabaseClient';
import { FaBoxOpen } from 'react-icons/fa';

export default function ProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [selectedProductId, setSelectedProductId] = useState<number | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);
  const [isCreatingNew, setIsCreatingNew] = useState(false);
  const queryClient = useQueryClient();

  const { data: prodResponse } = useQuery<ProductListResponse>({
    queryKey: ['products'],
    queryFn: async () => {
      // Get the session token
      const {
        data: { session },
      } = await supabase.auth.getSession();
      const token = session?.access_token;
      const res = await fetch(`${getApiBaseUrl()}/product`, {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });
      if (!res.ok) console.log('Failed to fetch orders', res);
      return res.json();
    },
  });

  // Fetch stock data for all products
  const { data: productStockData, isLoading: loadingStock } = useQuery<Map<number, ProductInStock>>({
    queryKey: ['product-stock-all', prodResponse?.data],
    queryFn: async () => {
      if (!prodResponse?.data || prodResponse.data.length === 0) {
        return new Map();
      }

      const {
        data: { session },
      } = await supabase.auth.getSession();
      const token = session?.access_token;

      const stockPromises = prodResponse.data.map(async (product) => {
        try {
          const res = await fetch(`${getApiBaseUrl()}/inventory/stock/${product.productId}`, {
            headers: {
              Authorization: `Bearer ${token}`,
              'Content-Type': 'application/json',
            },
          });
          if (!res.ok) throw new Error(`Failed to fetch stock for product ${product.productId}`);
          const response: ProductInStockResponse = await res.json();
          return [product.productId, response.data] as [number, ProductInStock];
        } catch (error) {
          console.error(`Error fetching stock for product ${product.productId}:`, error);
          return [product.productId, { productId: product.productId, productName: product.name, totalStock: 0 }] as [number, ProductInStock];
        }
      });

      const stockResults = await Promise.all(stockPromises);
      return new Map(stockResults);
    },
    enabled: !!prodResponse?.data && prodResponse.data.length > 0,
  });

  // Use useEffect to set products when data is fetched
  useEffect(() => {
    if (prodResponse && prodResponse.success === true) {
      setProducts(prodResponse.data);
    }
  }, [prodResponse]);

  const handleOpenModal = (productId: number) => {
    setSelectedProductId(productId);
    setIsCreatingNew(false);
    setIsModalOpen(true);
    setTimeout(() => setIsAnimating(true), 10);
  };

  const handleCreateNew = () => {
    setSelectedProductId(null);
    setIsCreatingNew(true);
    setIsModalOpen(true);
    setTimeout(() => setIsAnimating(true), 10);
  };

  const handleCloseModal = () => {
    setIsAnimating(false);
    setTimeout(() => {
      setIsModalOpen(false);
      setSelectedProductId(null);
      setIsCreatingNew(false);
    }, 300);
  };

  const handleSaveProduct = (updatedProduct: Product) => {
    setProducts(
      products?.map((p) => (p.productId === updatedProduct.productId ? updatedProduct : p))
    );
    console.log('Product updated:', updatedProduct);
    // Invalidate and refetch products
    queryClient.invalidateQueries({ queryKey: ['products'] });
    handleCloseModal();
  };

  const handleCreateProduct = (newProduct: Product) => {
    console.log('Product created:', newProduct);
    // Invalidate and refetch products
    queryClient.invalidateQueries({ queryKey: ['products'] });
    handleCloseModal();
  };

  return (
    <div className="p-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center m-4 gap-4">
        <div className="flex items-center gap-3">
          <FaBoxOpen className="text-blue-600 text-3xl" />
          <h1 className="text-3xl font-bold text-gray-900">Products</h1>
        </div>
        <button
          onClick={handleCreateNew}
          className="px-6 py-2 bg-green-600 text-white font-medium rounded-md hover:bg-green-700 transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 flex items-center gap-2"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Create Product
        </button>
      </div>

      {/* Stock Overview Scorecard */}
      {products && products.length > 0 && (
        <div className="mb-6 mx-4">
          {loadingStock ? (
            <ScoreCard title="Product Stock Overview" data={[]} isLoading={true} skeletonCount={3} />
          ) : (
            <ScoreCard
              title="Product Stock Overview"
              data={products.map((product) => {
                const stock = productStockData?.get(product.productId);
                const stockValue = stock?.totalStock ?? 0;
                
                // Determine color based on stock level
                let stockColor: 'green' | 'yellow' | 'red' | 'gray' = 'gray';
                if (stockValue === 0) {
                  stockColor = 'red';
                } else if (stockValue < 10) {
                  stockColor = 'yellow';
                } else {
                  stockColor = 'green';
                }

                return {
                  value: stockValue,
                  label: product.name,
                  color: stockColor,
                  icon: <FaBoxOpen />,
                };
              })}
            />
          )}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {products?.map((product) => (
          <ProductCard key={product.productId} product={product} onDetailsClick={handleOpenModal} />
        ))}
      </div>

      {/* Modal */}
      {isModalOpen && (
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
              <h2 className="text-xl font-semibold">
                {isCreatingNew ? 'Create New Product' : 'Product Details'}
              </h2>
              <button
                onClick={handleCloseModal}
                className="text-gray-500 hover:text-gray-700 text-2xl"
              >
                ×
              </button>
            </div>
            <div className="p-4 overflow-y-auto">
              <ProductModal
                productId={isCreatingNew ? null : selectedProductId}
                onSave={handleSaveProduct}
                onCreate={handleCreateProduct}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
