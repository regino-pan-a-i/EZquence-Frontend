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
      <div className="flex items-center justify-center min-h-screen bg-background">
        <FaSpinner className="animate-spin text-4xl text-link" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-6xl mx-auto">
        <div className="bg-surface rounded-lg shadow-lg p-8">
          <div className="flex items-center gap-3 mb-6">
            <FaBuilding className="text-3xl text-link" />
            <div>
              <h1 className="text-3xl font-bold text-foreground">
                Select a Company
              </h1>
              <p className="text-muted mt-1">
                {userRole === UserRole.WORKER
                  ? 'Choose the company you work for (requires admin approval)'
                  : 'Choose a company to browse their products'}
              </p>
            </div>
          </div>

          {/* Search Bar */}
          <div className="mb-6">
            <div className="relative">
              <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted" />
              <input
                type="text"
                placeholder="Search companies by name or industry..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-3 border border-border rounded-lg focus:ring-2 focus:ring-accent focus:outline-none bg-surface text-foreground"
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
                      ? 'border-accent bg-accent/10'
                      : 'border-border hover:border-accent'
                  }`}
                >
                  {/* Selected Indicator */}
                  {selectedCompanyId === company.companyId && (
                    <div className="absolute top-3 right-3">
                      <FaCheckCircle className="text-link text-2xl" />
                    </div>
                  )}

                  {/* Company Logo */}
                  <div className="flex items-center justify-center mb-4">
                    <div className="relative w-24 h-24 rounded-lg overflow-hidden bg-background bg-surface">
                      
                      {company.logoURL ? (
                        <Image
                          src={company.logoURL}
                          alt={company.name}
                          fill
                          className="object-cover"
                        />
                      ) : (
                        <div className="flex items-center justify-center w-full h-full bg-border">
                          <FaImage className="text-muted text-4xl" />
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Company Info */}
                  <h3 className="text-lg font-semibold text-foreground text-center mb-2">
                    {company.name}
                  </h3>
                  <p className="text-sm text-muted text-center mb-2">
                    {company.industry}
                  </p>
                  <p className="text-sm text-muted text-center line-clamp-3">
                    {company.description}
                  </p>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <p className="text-muted">
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
                className="flex items-center gap-2 px-8 py-3 bg-primary text-primary-foreground rounded-lg hover:bg-primary-hover disabled:bg-muted disabled:cursor-not-allowed transition font-semibold text-lg"
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
