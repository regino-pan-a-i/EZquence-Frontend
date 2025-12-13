'use client';

import { useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/utils/supabase/supabaseClient';
import toast from 'react-hot-toast';

interface UseTeamRequestRealtimeProps {
  companyId?: number;
  enabled?: boolean;
}

/**
 * Hook to listen for real-time team join requests for admins
 * Subscribes to user table changes and shows notifications when workers request to join
 */
export function useTeamRequestRealtime({
  companyId,
  enabled = true,
}: UseTeamRequestRealtimeProps) {
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!enabled || !companyId) return;

    console.log('Setting up team request realtime listener for company:', companyId);

    // Create a channel for user/worker updates
    const channel = supabase
      .channel('team-request-changes')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'user',
        },
        (payload) => {
          console.log('New user joined company:', payload);

          // Invalidate worker queries to refetch data
          queryClient.invalidateQueries({ queryKey: ['company-workers'] });

          // Show notification for pending approval requests
          const newUser = payload.new;
          if (newUser.approvalStatus === 'PENDING') {
            const userName = `${newUser.firstName || ''} ${newUser.lastName || ''}`.trim();
            const role = newUser.role === 'WORKER' ? 'Worker' : 'User';

            toast(
              `New ${role} Request: ${userName || newUser.email}`,
              {
                duration: 8000,
                position: 'top-right',
                icon: '👤',
                style: {
                  background: '#3B82F6',
                  color: '#fff',
                  fontWeight: '500',
                },
              }
            );
          }
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'user',
        },
        (payload) => {
          console.log('User updated in company:', payload);

          // Invalidate worker queries to refetch data
          queryClient.invalidateQueries({ queryKey: ['company-workers'] });

          // Check if approval status changed
          const oldStatus = payload.old?.approvalStatus;
          const newStatus = payload.new?.approvalStatus;

          if (oldStatus !== newStatus && newStatus === 'APPROVED') {
            const userName = `${payload.new.firstName || ''} ${payload.new.lastName || ''}`.trim();
            toast.success(
              `${userName || payload.new.email} has been approved`,
              {
                duration: 5000,
                position: 'top-right',
              }
            );
          }
        }
      )
      .subscribe((status) => {
        console.log('Team request realtime subscription status:', status);
      });

    // Cleanup subscription on unmount
    return () => {
      console.log('Cleaning up team request realtime subscription');
      supabase.removeChannel(channel);
    };
  }, [companyId, enabled, queryClient]);
}
