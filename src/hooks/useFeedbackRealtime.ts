'use client';

import { useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/utils/supabase/supabaseClient';
import toast from 'react-hot-toast';

interface UseFeedbackRealtimeProps {
  userId?: number;
  companyId?: number;
  enabled?: boolean;
  isAdmin?: boolean;
}

export function useFeedbackRealtime({
  userId,
  companyId,
  enabled = true,
  isAdmin = false,
}: UseFeedbackRealtimeProps) {
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!enabled || (!userId && !companyId)) return;

    // Create a channel for feedback updates
    const channelName = isAdmin ? 'company-feedback-changes' : 'user-feedback-changes';
    const filter = isAdmin
      ? `companyId=eq.${companyId}`
      : `userId=eq.${userId}`;

    const channel = supabase
      .channel(channelName)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'customer_feedback',
          filter,
        },
        (payload) => {
          console.log('Feedback created:', payload);

          // Invalidate feedback queries to refetch data
          if (isAdmin) {
            queryClient.invalidateQueries({ queryKey: ['company-feedback'] });
          } else {
            queryClient.invalidateQueries({ queryKey: ['my-feedback'] });
          }

          // Show notification for new feedback
          if (isAdmin) {
            toast('New feedback received', {
              icon: '💬',
              duration: 4000,
            });
          }
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'customer_feedback',
          filter,
        },
        (payload) => {
          console.log('Feedback updated:', payload);

          // Invalidate feedback queries to refetch data
          if (isAdmin) {
            queryClient.invalidateQueries({ queryKey: ['company-feedback'] });
          } else {
            queryClient.invalidateQueries({ queryKey: ['my-feedback'] });
          }

          // Show notification based on resolved status change
          const newResolved = payload.new.resolved;
          const oldResolved = payload.old?.resolved;

          if (newResolved !== oldResolved) {
            if (newResolved) {
              toast.success('Feedback marked as resolved', {
                duration: 3000,
                icon: '✓',
              });
            } else {
              toast('Feedback reopened', {
                icon: '🔄',
                duration: 3000,
              });
            }
          }
        }
      )
      .subscribe();

    // Cleanup subscription on unmount
    return () => {
      supabase.removeChannel(channel);
    };
  }, [userId, companyId, enabled, isAdmin, queryClient]);
}
