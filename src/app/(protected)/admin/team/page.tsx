'use client';

import { useState, useEffect } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { getCompanyWorkers } from '@/lib/company-actions';
import { getApiUrl } from '@/utils/apiConfig';
import { supabase } from '@/utils/supabase/supabaseClient';
import { Worker, ApprovalStatus, UserRole, DecodedToken } from '@/utils/supabase/schema';
import { useTeamRequestRealtime } from '@/hooks/useTeamRequestRealtime';
import toast from 'react-hot-toast';
import { FaUsers, FaCheckCircle, FaTimesCircle, FaSpinner, FaClock } from 'react-icons/fa';
import { jwtDecode } from 'jwt-decode';

export default function TeamManagementPage() {
  const queryClient = useQueryClient();
  const [approvingUserId, setApprovingUserId] = useState<number | null>(null);
  const [rejectingUserId, setRejectingUserId] = useState<number | null>(null);
  const [companyId, setCompanyId] = useState<number | null>(null);

  // Get companyId from user metadata
  useEffect(() => {

    const getCompanyId = async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session?.access_token) {
        return {
          success: false,
          error: 'Not authenticated',
        };
      }
      const decoded = jwtDecode<DecodedToken>(session.access_token);
      const companyId =decoded.user_company;
      setCompanyId(companyId ?? null);
    };
    getCompanyId();
  }, []);

  // Enable realtime notifications for team requests
  useTeamRequestRealtime({
    companyId: companyId || undefined,
    enabled: !!companyId,
  });

  // Fetch all workers
  const { data: workersResponse, isLoading } = useQuery({
    queryKey: ['company-workers'],
    queryFn: async () => {
      const result = await getCompanyWorkers();
      if (!result.success) {
        throw new Error(result.error);
      }
      return result.data as unknown as Worker[];
    },
    refetchInterval: 5000, // Refetch every 5 seconds for near real-time updates
  });

  const workers = workersResponse || [];
  const approvedWorkers = workers.filter(
    (w) => w.approvalStatus === ApprovalStatus.APPROVED
  );
  const pendingWorkers = workers.filter(
    (w) => w.approvalStatus === ApprovalStatus.PENDING
  );

  const handleApprove = async (userId: number) => {
    setApprovingUserId(userId);
    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      const token = session?.access_token;

      const response = await fetch(getApiUrl(`company/user/${userId}/approve`), {
        method: 'PUT',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error('Failed to approve worker');
      }

      toast.success('Worker approved successfully!');
      queryClient.invalidateQueries({ queryKey: ['company-workers'] });
    } catch (error) {
      console.error('Error approving worker:', error);
      toast.error('Failed to approve worker');
    } finally {
      setApprovingUserId(null);
    }
  };

  const handleReject = async (userId: number) => {
    setRejectingUserId(userId);
    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      const token = session?.access_token;

      const response = await fetch(getApiUrl(`company/user/${userId}/reject`), {
        method: 'PUT',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error('Failed to reject worker');
      }

      toast.success('Worker request rejected');
      queryClient.invalidateQueries({ queryKey: ['company-workers'] });
    } catch (error) {
      console.error('Error rejecting worker:', error);
      toast.error('Failed to reject worker');
    } finally {
      setRejectingUserId(null);
    }
  };

  const getRoleBadge = (role: UserRole) => {
    const colors = {
      [UserRole.ADMIN]: 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200',
      [UserRole.WORKER]: 'bg-accent/10 text-link',
      [UserRole.CLIENT]: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
    };
    return colors[role] || 'bg-background text-foreground';
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <FaSpinner className="animate-spin text-4xl text-link" />
      </div>
    );
  }

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="flex items-center gap-3 mb-8">
        <FaUsers className="text-3xl text-link" />
        <div>
          <h1 className="text-3xl font-bold text-foreground">Team Management</h1>
          <p className="text-muted mt-1">
            Manage your team members and approve join requests
          </p>
        </div>
      </div>

      {/* Pending Requests Section */}
      {pendingWorkers.length > 0 && (
        <div className="mb-8">
          <div className="flex items-center gap-2 mb-4">
            <FaClock className="text-yellow-600" />
            <h2 className="text-xl font-semibold text-foreground">
              Pending Requests ({pendingWorkers.length})
            </h2>
          </div>

          <div className="bg-surface rounded-lg shadow-md overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-background bg-surface">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-muted uppercase tracking-wider">
                      Name
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-muted uppercase tracking-wider">
                      Email
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-muted uppercase tracking-wider">
                      Role
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-muted uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {pendingWorkers.map((worker) => (
                    <tr
                      key={worker.userId}
                      className="hover:bg-background hover:bg-border transition"
                    >
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-foreground">
                          {worker.firstName} {worker.lastName}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-muted">
                          {worker.email}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span
                          className={`px-2 py-1 text-xs font-semibold rounded-full ${getRoleBadge(worker.role)}`}
                        >
                          {worker.role}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleApprove(worker.userId)}
                            disabled={approvingUserId === worker.userId}
                            className="flex items-center gap-1 px-3 py-1 bg-green-600 text-white rounded hover:bg-green-700 disabled:bg-muted disabled:cursor-not-allowed transition"
                          >
                            {approvingUserId === worker.userId ? (
                              <FaSpinner className="animate-spin" />
                            ) : (
                              <FaCheckCircle />
                            )}
                            Approve
                          </button>
                          <button
                            onClick={() => handleReject(worker.userId)}
                            disabled={rejectingUserId === worker.userId}
                            className="flex items-center gap-1 px-3 py-1 bg-red-600 text-white rounded hover:bg-red-700 disabled:bg-muted disabled:cursor-not-allowed transition"
                          >
                            {rejectingUserId === worker.userId ? (
                              <FaSpinner className="animate-spin" />
                            ) : (
                              <FaTimesCircle />
                            )}
                            Reject
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Current Team Section */}
      <div>
        <div className="flex items-center gap-2 mb-4">
          <FaCheckCircle className="text-green-600" />
          <h2 className="text-xl font-semibold text-foreground">
            Current Team ({approvedWorkers.length})
          </h2>
        </div>

        {approvedWorkers.length > 0 ? (
          <div className="bg-surface rounded-lg shadow-md overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-background bg-surface">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-muted uppercase tracking-wider">
                      Name
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-muted uppercase tracking-wider">
                      Email
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-muted uppercase tracking-wider">
                      Role
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-muted uppercase tracking-wider">
                      Status
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {approvedWorkers.map((worker) => (
                    <tr key={worker.userId}>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-foreground">
                          {worker.firstName} {worker.lastName}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-muted">
                          {worker.email}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span
                          className={`px-2 py-1 text-xs font-semibold rounded-full ${getRoleBadge(worker.role)}`}
                        >
                          {worker.role}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="px-2 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
                          Active
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        ) : (
          <div className="bg-surface rounded-lg shadow-md p-8 text-center">
            <p className="text-muted">No team members yet</p>
          </div>
        )}
      </div>
    </div>
  );
}
