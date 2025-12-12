'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/utils/supabase/supabaseClient';
import { getApiBaseUrl } from '@/utils/apiConfig';
import { getCompanyById, updateCompany } from '@/lib/company-actions';
import { uploadCompanyLogo } from '@/lib/storage-utils';
import { Company, customerFeedback, ApiResponse, UserRole } from '@/utils/supabase/schema';
import { useRole } from '@/hooks/useAuth';
import { useFeedbackRealtime } from '@/hooks/useFeedbackRealtime';
import CompanyForm, { CompanyFormData } from '@/components/admin/CompanyForm';
import FeedbackForm from '@/components/feedback/FeedbackForm';
import FeedbackList from '@/components/feedback/FeedbackList';
import toast from 'react-hot-toast';
import { FaBuilding, FaCommentDots, FaEdit, FaSpinner } from 'react-icons/fa';
import { jwtDecode } from 'jwt-decode';
import { DecodedToken } from '@/utils/supabase/schema';

export default function AccountPage() {
  const userRole = useRole();
  const queryClient = useQueryClient();
  const [isEditing, setIsEditing] = useState(false);
  const [resolvingId, setResolvingId] = useState<number | null>(null);

  // Get user info from token
  const { data: session } = useQuery({
    queryKey: ['session'],
    queryFn: async () => {
      const { data } = await supabase.auth.getSession();
      return data.session;
    },
  });

  const decodedToken = session?.access_token
    ? jwtDecode<DecodedToken>(session.access_token)
    : null;

  const userId = decodedToken?.usr_id;
  const companyId = decodedToken?.user_company;

  // Fetch company data (for admins)
  const { data: companyResponse, isLoading: loadingCompany } = useQuery({
    queryKey: ['company'],
    queryFn: async () => {
      const result = await getCompanyById();
      if (!result.success) throw new Error(result.error);
      return result.data;
    },
    enabled: userRole === UserRole.ADMIN,
  });

  // Fetch feedback based on role
  const { data: feedbackResponse, isLoading: loadingFeedback } = useQuery<
    ApiResponse<customerFeedback[]>
  >({
    queryKey: userRole === UserRole.ADMIN ? ['company-feedback'] : ['my-feedback'],
    queryFn: async () => {
      const token = session?.access_token;
      const endpoint =
        userRole === UserRole.ADMIN ? `/feedback/company` : '/feedback/my-feedback';

      const response = await fetch(`${getApiBaseUrl()}${endpoint}`, {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) throw new Error('Failed to fetch feedback');
      return response.json();
    },
    enabled: !!session?.access_token,
  });

  // Real-time feedback updates
  useFeedbackRealtime({
    userId: userRole === UserRole.CLIENT ? userId : undefined,
    companyId: userRole === UserRole.ADMIN ? companyId : undefined,
    enabled: !!userId || !!companyId,
    isAdmin: userRole === UserRole.ADMIN,
  });

  // Submit feedback mutation (for customers)
  const submitFeedbackMutation = useMutation({
    mutationFn: async (message: string) => {
      const token = session?.access_token;

      const response = await fetch(`${getApiBaseUrl()}/feedback`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ message }),
      });

      if (!response.ok) throw new Error('Failed to submit feedback');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['my-feedback'] });
      toast.success('Feedback submitted successfully!');
    },
    onError: () => {
      toast.error('Failed to submit feedback');
    },
  });

  // Update company mutation (for admins)
  const updateCompanyMutation = useMutation({
    mutationFn: async ({ data, logoFile }: { data: CompanyFormData; logoFile?: File }) => {
      let logoURL = data.logoURL;

      // Upload new logo if provided
      if (logoFile) {
        const uploadResult = await uploadCompanyLogo(logoFile);
        if (!uploadResult.success || !uploadResult.url) {
          throw new Error(uploadResult.error || 'Failed to upload logo');
        }
        logoURL = uploadResult.url;
      }

      const result = await updateCompany({
        name: data.name,
        description: data.description,
        industry: data.industry,
        logoURL,
      });

      if (!result.success) throw new Error(result.error);
      return result.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['company'] });
      toast.success('Company updated successfully!');
      setIsEditing(false);
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to update company');
    },
  });

  // Resolve feedback mutation (for admins)
  const resolveFeedbackMutation = useMutation({
    mutationFn: async (feedbackId: number) => {
      const token = session?.access_token;

      const response = await fetch(`${getApiBaseUrl()}/feedback/${feedbackId}/resolved`, {
        method: 'PATCH',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) throw new Error('Failed to resolve feedback');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['company-feedback'] });
      toast.success('Feedback resolved!');
      setResolvingId(null);
    },
    onError: () => {
      toast.error('Failed to resolve feedback');
      setResolvingId(null);
    },
  });

  const handleSubmitFeedback = async (message: string) => {
    await submitFeedbackMutation.mutateAsync(message);
  };

  const handleUpdateCompany = async (data: CompanyFormData, logoFile?: File) => {
    await updateCompanyMutation.mutateAsync({ data, logoFile });
  };

  const handleResolveFeedback = async (feedbackId: number) => {
    setResolvingId(feedbackId);
    await resolveFeedbackMutation.mutateAsync(feedbackId);
  };

  if (loadingCompany || loadingFeedback) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <FaSpinner className="animate-spin text-4xl text-blue-600" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-neutral-950 p-6">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Admin View */}
        {userRole === UserRole.ADMIN && (
          <>
            {/* Company Information Section */}
            <div className="bg-white dark:bg-neutral-900 rounded-lg shadow-lg p-8">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <FaBuilding className="text-3xl text-blue-600" />
                  <div>
                    <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                      Company Information
                    </h1>
                    <p className="text-gray-600 dark:text-gray-400 mt-1">
                      Manage your company profile
                    </p>
                  </div>
                </div>
                {!isEditing && (
                  <button
                    onClick={() => setIsEditing(true)}
                    className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition font-semibold"
                  >
                    <FaEdit />
                    Edit
                  </button>
                )}
              </div>

              <CompanyForm
                company={companyResponse}
                isEditing={isEditing}
                onSubmit={handleUpdateCompany}
                onCancel={() => setIsEditing(false)}
                isSubmitting={updateCompanyMutation.isPending}
              />
            </div>

            {/* Company Feedback Section */}
            <div className="bg-white dark:bg-neutral-900 rounded-lg shadow-lg p-8">
              <div className="flex items-center gap-3 mb-6">
                <FaCommentDots className="text-3xl text-blue-600" />
                <div>
                  <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                    Customer Feedback
                  </h2>
                  <p className="text-gray-600 dark:text-gray-400 mt-1">
                    View and manage feedback from your customers
                  </p>
                </div>
              </div>

              <FeedbackList
                feedbacks={feedbackResponse?.data || []}
                isAdmin={true}
                onResolve={handleResolveFeedback}
                isResolving={resolveFeedbackMutation.isPending}
                resolvingId={resolvingId || undefined}
              />
            </div>
          </>
        )}

        {/* Customer View */}
        {userRole === UserRole.CLIENT && (
          <>
            {/* Submit Feedback Section */}
            <div>
              <div className="mb-6">
                <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                  Account & Feedback
                </h1>
                <p className="text-gray-600 dark:text-gray-400 mt-1">
                  Share your thoughts and track your feedback
                </p>
              </div>

              <FeedbackForm
                onSubmit={handleSubmitFeedback}
                isSubmitting={submitFeedbackMutation.isPending}
              />
            </div>

            {/* My Feedback History Section */}
            <div className="bg-white dark:bg-neutral-900 rounded-lg shadow-lg p-8">
              <div className="flex items-center gap-3 mb-6">
                <FaCommentDots className="text-3xl text-blue-600" />
                <div>
                  <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                    My Feedback
                  </h2>
                  <p className="text-gray-600 dark:text-gray-400 mt-1">
                    View your submitted feedback and their status
                  </p>
                </div>
              </div>

              <FeedbackList
                feedbacks={feedbackResponse?.data || []}
                isAdmin={false}
              />
            </div>
          </>
        )}

        {/* Worker View (if needed) */}
        {userRole === UserRole.WORKER && (
          <div className="bg-white dark:bg-neutral-900 rounded-lg shadow-lg p-8 text-center">
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
              Account Settings
            </h1>
            <p className="text-gray-600 dark:text-gray-400">
              Worker account management features coming soon.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
