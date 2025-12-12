'use client';

import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { getApiUrl } from '@/utils/apiConfig';
import { Product, Company } from '@/utils/supabase/schema';
import CustomerProductCard from '@/components/product/CustomerProductCard';
import Link from 'next/link';
import { FiArrowLeft, FiPackage } from 'react-icons/fi';
import { use } from 'react';

interface ProductListResponse {
  success: boolean;
  data: Product[];
}

interface CompanyResponse {
  success: boolean;
  data: Company;
}

interface CompanyProductsPageProps {
  params: Promise<{ companyId: string }>;
}

const CompanyProductsPage = ({ params }: CompanyProductsPageProps) => {
  const { companyId } = use(params);

  const { data: productsResponse, isLoading: productsLoading, error: productsError } = useQuery<ProductListResponse>({
    queryKey: ['public-products', companyId],
    queryFn: async () => {
      const res = await fetch(getApiUrl(`/product/company/${companyId}`));
      
      if (!res.ok) {
        throw new Error('Failed to fetch products');
      }
      
      return res.json();
    },
  });
  console.log([productsResponse])

  const { data: companyResponse, isLoading: companyLoading } = useQuery<CompanyResponse>({
    queryKey: ['public-company', companyId],
    queryFn: async () => {
      const res = await fetch(getApiUrl(`/company/${companyId}`));
      
      if (!res.ok) {
        throw new Error('Failed to fetch company');
      }
      
      return res.json();
    },
  });

  if (productsLoading || companyLoading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-neutral-950 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600 dark:text-gray-400">Loading products...</p>
        </div>
      </div>
    );
  }

  if (productsError) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-neutral-950 flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-600 dark:text-red-400">Error loading products. Please try again later.</p>
          <Link
            href="/marketplace"
            className="mt-4 inline-flex items-center gap-2 text-blue-600 dark:text-blue-400 hover:underline"
          >
            <FiArrowLeft />
            Back to Marketplace
          </Link>
        </div>
      </div>
    );
  }

  const products = productsResponse?.data || [];
  const company = companyResponse?.data;

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-neutral-950">
      {/* Header */}
      <div className="bg-white dark:bg-neutral-900 border-b border-gray-200 dark:border-neutral-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <Link
            href="/marketplace"
            className="inline-flex items-center gap-2 text-blue-600 dark:text-blue-400 hover:underline mb-4"
          >
            <FiArrowLeft />
            Back to Marketplace
          </Link>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            {company?.name || 'Company Products'}
          </h1>
          {company?.description && (
            <p className="text-gray-600 dark:text-gray-400">
              {company.description}
            </p>
          )}
        </div>
      </div>

      {/* Products Grid */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {products.length === 0 ? (
          <div className="text-center py-12">
            <FiPackage size={48} className="mx-auto text-gray-300 dark:text-neutral-700 mb-4" />
            <p className="text-gray-600 dark:text-gray-400">No products available from this company at this time.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {products.map((product) => (
              <CustomerProductCard key={product.productId} product={product} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default CompanyProductsPage;
