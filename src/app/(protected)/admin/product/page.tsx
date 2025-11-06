'use client';

import ProductCard from '@/components/product/ProductCard';
import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { ProductResponse, Product } from '@/utils/supabase/schema'
import { supabase } from '@/utils/supabase/supabaseClient';


export default function ProductsPage() {

  const [products, setProducts] = useState<Product[]>();
  // Example product data - replace with your actual data source
  //   {
  //     id: '1',
  //     name: 'Premium Wooden Chair',
  //     image: 'https://weviqfepjkdmhurznegf.supabase.co/storage/v1/object/sign/productImages/IMG_3923.JPG?token=eyJraWQiOiJzdG9yYWdlLXVybC1zaWduaW5nLWtleV9hZWJhNGUwMC03MTMyLTRmOTAtYTdhYS01YzVkMjRlOTllYmYiLCJhbGciOiJIUzI1NiJ9.eyJ1cmwiOiJwcm9kdWN0SW1hZ2VzL0lNR18zOTIzLkpQRyIsImlhdCI6MTc2MjIyODY5NSwiZXhwIjoxNzkzNzY0Njk1fQ.p7g4RYktv5nZseBw1fQWcYtMcsh7G-cBdSy004fneSU',
  //     details: 'A beautifully crafted wooden chair with ergonomic design. Perfect for dining rooms and offices. Features a comfortable seat and sturdy construction.',
  //     materials: ['Oak Wood', 'Steel Screws', 'Fabric Cushion', 'Wood Varnish'],
  //   }
  // ]);

  const { data: prodResponse, isLoading: loadingProducts } = useQuery<ProductResponse>({
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


  const handleSaveProduct = (updatedProduct: Product) => {

    
    setProducts(
      products?.map((p) => (p.productId === updatedProduct.productId ? updatedProduct : p))
    );
    console.log('Product updated:', updatedProduct);
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
            onSave={handleSaveProduct}
          />
        ))}
      </div>
    </div>
  );
}