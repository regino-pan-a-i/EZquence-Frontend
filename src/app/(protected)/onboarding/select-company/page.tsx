'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { getAllCompanies, workerRequestJoinCompany, clientRequestJoinCompany } from '@/lib/company-actions';
import { useRole } from '@/hooks/useAuth';
import { Company, DecodedToken, UserRole } from '@/utils/supabase/schema';
import toast from 'react-hot-toast';
import { FaBuilding, FaSpinner, FaCheckCircle, FaSearch, FaImage } from 'react-icons/fa';
import Image from 'next/image';
import { jwtDecode } from 'jwt-decode';
import { supabase } from '@/utils/supabase/supabaseClient';

export default function SelectCompanyPage() {
  
  const router = useRouter();
  const userRole = useRole();
  const [selectedCompanyId, setSelectedCompanyId] = useState<number | null>(null);
  const [isJoining, setIsJoining] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  // Fetch all companies
  const { data: companiesResponse, isLoading } = useQuery({
    queryKey: ['all-companies'],
    queryFn: async () => {
      const result = await getAllCompanies();
      if (!result.success) {
        throw new Error(result.error);
      }
      return result.data as Company[];
    },
  });

  const companies = companiesResponse || [];

  // Filter companies based on search
  const filteredCompanies = companies.filter((company) =>
    company.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    company.industry.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleSelectCompany = async () => {
    if (!selectedCompanyId) {
      toast.error('Please select a company');
      return;
    }

    setIsJoining(true);

    const { data: { session } } = await supabase.auth.getSession();
    const token = session?.access_token;


    const decodedToken = jwtDecode<DecodedToken>(token || '');
    const userId = decodedToken.usr_id as number;

    try {
      if (userRole === UserRole.WORKER) {
        const result = await workerRequestJoinCompany(selectedCompanyId, userId);
        if (result.success) {
          toast.success('Join request submitted! Waiting for admin approval.');
          router.push('/onboarding/pending-approval');
        } else {
          toast.error(result.error || 'Failed to join company');
        }
      } else if (userRole === UserRole.CLIENT) {
        const result = await clientRequestJoinCompany(selectedCompanyId, userId);
        if (result.success) {
          toast.success('Successfully joined company!');
          router.push('/customer/products');
        } else {
          toast.error(result.error || 'Failed to join company');
        }
      }
    } catch (error) {
      console.error('Error joining company:', error);
      toast.error('An unexpected error occurred');
    } finally {
      setIsJoining(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50 dark:bg-neutral-950">
        <FaSpinner className="animate-spin text-4xl text-blue-600" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-neutral-950 p-6">
      <div className="max-w-6xl mx-auto">
        <div className="bg-white dark:bg-neutral-900 rounded-lg shadow-lg p-8">
          <div className="flex items-center gap-3 mb-6">
            <FaBuilding className="text-3xl text-blue-600" />
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                Select a Company
              </h1>
              <p className="text-gray-600 dark:text-gray-400 mt-1">
                {userRole === UserRole.WORKER
                  ? 'Choose the company you work for (requires admin approval)'
                  : 'Choose a company to browse their products'}
              </p>
            </div>
          </div>

          {/* Search Bar */}
          <div className="mb-6">
            <div className="relative">
              <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Search companies by name or industry..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-3 border border-gray-300 dark:border-neutral-700 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none dark:bg-neutral-800 dark:text-white"
              />
            </div>
          </div>

          {/* Companies Grid */}
          {filteredCompanies.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
              {filteredCompanies.map((company) => (
                <div
                  key={company.companyId}
                  onClick={() => setSelectedCompanyId(company.companyId)}
                  className={`relative cursor-pointer p-6 border-2 rounded-lg transition-all ${
                    selectedCompanyId === company.companyId
                      ? 'border-blue-600 bg-blue-50 dark:bg-blue-900/20'
                      : 'border-gray-200 dark:border-neutral-700 hover:border-blue-400 dark:hover:border-blue-600'
                  }`}
                >
                  {/* Selected Indicator */}
                  {selectedCompanyId === company.companyId && (
                    <div className="absolute top-3 right-3">
                      <FaCheckCircle className="text-blue-600 text-2xl" />
                    </div>
                  )}

                  {/* Company Logo */}
                  <div className="flex items-center justify-center mb-4">
                    <div className="relative w-24 h-24 rounded-lg overflow-hidden bg-gray-100 dark:bg-neutral-800">
                      
                      {company.logoURL ? (
                        <Image
                          src={company.logoURL}
                          alt={company.name}
                          fill
                          className="object-cover"
                        />
                      ) : (
                        <div className="flex items-center justify-center w-full h-full bg-gray-200 dark:bg-neutral-700">
                          <FaImage className="text-gray-400 dark:text-neutral-400 text-4xl" />
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Company Info */}
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white text-center mb-2">
                    {company.name}
                  </h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400 text-center mb-2">
                    {company.industry}
                  </p>
                  <p className="text-sm text-gray-500 dark:text-gray-500 text-center line-clamp-3">
                    {company.description}
                  </p>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <p className="text-gray-600 dark:text-gray-400">
                {searchQuery
                  ? 'No companies found matching your search'
                  : 'No companies available'}
              </p>
            </div>
          )}

          {/* Action Button */}
          {filteredCompanies.length > 0 && (
            <div className="flex justify-center">
              <button
                onClick={handleSelectCompany}
                disabled={!selectedCompanyId || isJoining}
                className="flex items-center gap-2 px-8 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition font-semibold text-lg"
              >
                {isJoining ? (
                  <>
                    <FaSpinner className="animate-spin" />
                    Joining...
                  </>
                ) : (
                  <>
                    <FaCheckCircle />
                    {userRole === UserRole.WORKER ? 'Request to Join' : 'Join Company'}
                  </>
                )}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
