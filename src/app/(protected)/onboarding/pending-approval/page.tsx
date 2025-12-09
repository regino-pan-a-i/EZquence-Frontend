'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/utils/supabase/supabaseClient';
import { ApprovalStatus, Company, DecodedToken } from '@/utils/supabase/schema';
import { FaClock, FaSpinner, FaCheckCircle } from 'react-icons/fa';
import { getCompanyById } from '@/lib/company-actions'
import { useQuery } from '@tanstack/react-query';
import { getApiBaseUrl } from '@/utils/apiConfig';
import { jwtDecode } from 'jwt-decode';


export default function PendingApprovalPage() {
  const router = useRouter();
  const [isChecking, setIsChecking] = useState(true);
  const [companyDetails, setCompanyDetails] = useState<Company | null>(null);
  const [approvalStatus, setApprovalStatus] = useState<ApprovalStatus | null>(null);

  useEffect(() => {
    const fetchCompanyDetails = async () => {
      const details = await getCompanyById();
      console.log(details.data)
      if (details.data) {
        setCompanyDetails(details.data);
      }
      console.log(companyDetails)
    }
    fetchCompanyDetails()
  }, [])

  useEffect(() => {
    const setupRealtimeListener = async () => {
      // Get current user ID
      const { data: { session } } = await supabase.auth.getSession();
      const decoded = jwtDecode<DecodedToken>(session?.access_token || '');
      
      // Set up realtime listener for approval status changes
      const channel = supabase
        .channel('user-approval-changes')
        .on(
          'postgres_changes',
          {
            event: 'UPDATE',
            schema: 'public',
            table: 'user',
            filter: `usr_id=eq.${decoded.usr_id}`, // Only listen for current user's updates
          },
          (payload) => {
            console.log('User approval status updated:', payload);
            // The useQuery will automatically refetch, or we can force it
          }
        )
        .subscribe();

      return channel;
    };

    const channel = setupRealtimeListener();

    return () => {
      channel.then(ch => supabase.removeChannel(ch));
    };
  }, []);

  // Fetch approval status
  const { data, isLoading } = useQuery({
    queryKey: ['my-approval'],
    queryFn: async () => {
      // Get the session token
      const {
        data: { session },
      } = await supabase.auth.getSession();
      const token = session?.access_token;

      const decoded = jwtDecode<DecodedToken>(session?.access_token || '');

      const res = await fetch(
        `${getApiBaseUrl()}/company/user/${decoded.usr_id}/approvalStatus`,
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
    refetchInterval: 5000, // Refetch every 5 seconds for near real-time updates
  });

  useEffect(() => {
    if (data && data.success === true) {
      setApprovalStatus(data.data.approvalStatus);
    }
  }, [data]);

  // Handle routing based on approval status changes
  useEffect(() => {
    if (!approvalStatus) return; // Wait for initial load
    
    setIsChecking(false);

    if (approvalStatus === ApprovalStatus.APPROVED) {
      console.log('Approval status: APPROVED - redirecting to production dashboard');
      router.push('/production/dashboard');
    } else if (approvalStatus === ApprovalStatus.REJECTED) {
      console.log('Approval status: REJECTED - redirecting to select company');
      router.push('/onboarding/select-company');
    }
  }, [approvalStatus, router]);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-neutral-950 flex items-center justify-center p-6">
      <div className="max-w-md w-full bg-white dark:bg-neutral-900 rounded-lg shadow-lg p-8 text-center">
        {isChecking ? (
          <>
            <FaSpinner className="animate-spin text-5xl text-blue-600 mx-auto mb-4" />
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
              Checking Status...
            </h1>
          </>
        ) : (
          <>
            <div className="mb-6">
              <div className="relative inline-block">
                <FaClock className="text-6xl text-yellow-500 mx-auto animate-pulse" />
                <div className="absolute -top-1 -right-1 w-4 h-4 bg-yellow-500 rounded-full animate-ping" />
              </div>
            </div>

            <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">
              Approval Pending
            </h1>

            <p className="text-gray-600 dark:text-gray-400 mb-6">
              Your request to join{' '}
              <span className="font-semibold text-gray-900 dark:text-white">
                {companyDetails?.name || 'the company'}
              </span>{' '}
              is pending approval from an administrator.
            </p>

            <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4 mb-6">
              <p className="text-sm text-blue-800 dark:text-blue-200">
                <FaCheckCircle className="inline mr-2" />
                You will be automatically redirected once your account is approved.
              </p>
            </div>

            <div className="space-y-3">
              <div className="flex items-start gap-3 text-left">
                <div className="w-2 h-2 bg-gray-400 rounded-full mt-2 flex-shrink-0" />
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  An administrator will review your request shortly
                </p>
              </div>

              <div className="flex items-start gap-3 text-left">
                <div className="w-2 h-2 bg-gray-400 rounded-full mt-2 flex-shrink-0" />
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  This page will automatically update when you&apos;re approved
                </p>
              </div>
            </div>

            <div className="mt-8 pt-6 border-t border-gray-200 dark:border-neutral-700">
              <button
                onClick={() => router.push('/login')}
                className="text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition"
              >
                Sign out
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
