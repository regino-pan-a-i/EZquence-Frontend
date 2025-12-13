'use client';

import { useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/utils/supabase/supabaseClient';
import toast from 'react-hot-toast';

interface UseOrderRealtimeProps {
  userId?: number;
  enabled?: boolean;
}

export function useOrderRealtime({ userId, enabled = true }: UseOrderRealtimeProps) {
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!enabled || !userId) return;

    // Create a channel for order updates
    const channel = supabase
      .channel('order-changes')
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'order'
        },
        (payload) => {
          console.log('Order updated:', payload);

          // Invalidate order queries to refetch data
          queryClient.invalidateQueries({ queryKey: ['userOrders'] });
          queryClient.invalidateQueries({ queryKey: ['userOrders', payload.new.orderId] });

          // Show notification based on status change
          const newStatus = payload.new.status;
          const oldStatus = payload.old?.status;

          if (newStatus !== oldStatus) {
            const statusMessages: Record<string, string> = {
              RECEIVED: 'Your order has been received',
              IN_PROGRESS: 'Your order is now in progress',
              STARTED: 'Work has started on your order',
              COMPLETED: 'Your order has been completed!',
              DELAYED: 'Your order has been delayed',
              PAID: 'Payment received for your order',
            };

            const message = statusMessages[newStatus] || 'Order status updated';
            
            // Use different toast styles based on status
            if (newStatus === 'COMPLETED') {
              toast.success(message, {
                duration: 5000,
                position: 'bottom-center',
                icon: '🎉',
              });
            } else if (newStatus === 'DELAYED') {
              toast.error(message, {
                duration: 5000,
                position: 'bottom-center',
              });
            } else {
              toast(message, {
                duration: 4000,
                position: 'bottom-center',
                icon: '📦',
              });
            }
          }
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'order',
          filter: `userId=eq.${userId}`,
        },
        (payload) => {
          console.log('New order created:', payload);
          queryClient.invalidateQueries({ queryKey: ['userOrders'] });
          
          toast.success('New order created successfully!', {
            duration: 5000,
            position: 'bottom-center',
            icon: '✅',
          });
        }
      )
      .subscribe();

    // Cleanup subscription on unmount
    return () => {
      supabase.removeChannel(channel);
    };
  }, [userId, enabled, queryClient]);
}
