'use client';

import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { getApiUrl } from '@/utils/apiConfig';
import { Company } from '@/utils/supabase/schema';
import Link from 'next/link';
import Image from 'next/image';
import { FaBuilding } from 'react-icons/fa';

interface CompanyListResponse {
  success: boolean;
  data: Company[];
}

const MarketplacePage = () => {
  const { data: companiesResponse, isLoading, error } = useQuery<CompanyListResponse>({
    queryKey: ['public-companies'],
    queryFn: async () => {
      const res = await fetch(getApiUrl('/company'));
      
      if (!res.ok) {
        throw new Error('Failed to fetch companies');
      }
      
      return res.json();
    },
  });

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-accent mx-auto"></div>
          <p className="mt-4 text-muted">Loading companies...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-600 dark:text-red-400">Error loading companies. Please try again later.</p>
        </div>
      </div>
    );
  }

  const companies = companiesResponse?.data || [];

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="bg-surface border-b border-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <h1 className="text-3xl font-bold text-foreground mb-2">
            Marketplace
          </h1>
          <p className="text-muted">
            Browse products from our partner companies
          </p>
        </div>
      </div>

      {/* Companies Grid */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {companies.length === 0 ? (
          <div className="text-center py-12">
            <FaBuilding size={48} className="mx-auto text-muted mb-4" />
            <p className="text-muted">No companies available at this time.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {companies.map((company) => (
              <Link
                key={company.companyId}
                href={`/marketplace/${company.companyId}`}
                className="block bg-surface border border-border rounded-lg shadow-sm hover:shadow-md transition-shadow duration-200 overflow-hidden"
              >
                {/* Company Logo */}
                <div className="relative w-full h-48 bg-background bg-surface">
                  {company.logoURL ? (
                    <Image
                      src={company.logoURL}
                      alt={company.name}
                      fill
                      className="object-contain p-4"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <FaBuilding size={64} className="text-muted" />
                    </div>
                  )}
                </div>

                {/* Company Info */}
                <div className="p-6">
                  <h2 className="text-xl font-bold text-foreground mb-2">
                    {company.name}
                  </h2>
                  {company.industry && (
                    <p className="text-sm text-link mb-2">
                      {company.industry}
                    </p>
                  )}
                  {company.description && (
                    <p className="text-sm text-muted line-clamp-3">
                      {company.description}
                    </p>
                  )}
                  <div className="mt-4">
                    <span className="text-link font-semibold text-sm">
                      View Products →
                    </span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default MarketplacePage;
