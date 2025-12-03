'use client';

import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/utils/supabase/supabaseClient';
import { getApiUrl } from '@/utils/apiConfig';
import { OrdersByDateRangeResponse, OrderDetailsResponse } from '@/utils/supabase/schema';
import { useOrderRealtime } from '@/hooks/useOrderRealtime';
import OrderCard from '@/components/orders/OrderCard';
import { FiPackage, FiCheck } from 'react-icons/fi';
import { useSearchParams } from 'next/navigation';

async function fetchOrders(startDate: string, endDate: string): Promise<OrdersByDateRangeResponse> {
  const { data: { session } } = await supabase.auth.getSession();
  const token = session?.access_token;

  const response = await fetch(
    getApiUrl(`/order/daterange?start=${startDate}&end=${endDate}`),
    {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }
  );

  if (!response.ok) {
    throw new Error('Failed to fetch orders');
  }

  return response.json();
}

async function fetchOrderDetails(orderId: number): Promise<OrderDetailsResponse> {
  const { data: { session } } = await supabase.auth.getSession();
  const token = session?.access_token;

  const response = await fetch(getApiUrl(`/order/${orderId}`), {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    throw new Error('Failed to fetch order details');
  }

  return response.json();
}

export default function OrdersPage() {
  const searchParams = useSearchParams();
  const successParam = searchParams.get('success');
  const orderIdParam = searchParams.get('orderId');
  const [showSuccess, setShowSuccess] = useState(false);

  // Get user ID for realtime updates
  const [userId, setUserId] = useState<number | undefined>();
  
  useEffect(() => {
    const fetchUserId = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user?.id) {
        // Extract user ID from JWT or user metadata
        const { data: { session } } = await supabase.auth.getSession();
        // Note: You may need to adjust this based on how your backend stores userId
        // For now, we'll use a placeholder. The backend should include userId in the JWT
        setUserId(1); // TODO: Get actual userId from JWT or user metadata
      }
    };
    fetchUserId();
  }, []);

  // Enable realtime updates for customer orders
  useOrderRealtime({ userId, enabled: !!userId });

  // Show success message
  useEffect(() => {
    if (successParam === 'true') {
      setShowSuccess(true);
      // Auto-hide after 5 seconds
      const timer = setTimeout(() => setShowSuccess(false), 5000);
      return () => clearTimeout(timer);
    }
  }, [successParam]);

  // Date range: last 6 months to 3 months in future
  const startDate = new Date(Date.now() - 180 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
  const endDate = new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

  const { data: ordersData, isLoading } = useQuery({
    queryKey: ['orders', startDate, endDate],
    queryFn: () => fetchOrders(startDate, endDate),
    staleTime: 1000 * 60, // 1 minute
  });

  // Fetch order details for each order
  const orders = ordersData?.data || [];
  const orderIds = orders.map(order => order.orderId);

  const orderDetailsQueries = useQuery({
    queryKey: ['orderDetails', orderIds],
    queryFn: async () => {
      const details = await Promise.all(
        orderIds.map(id => fetchOrderDetails(id))
      );
      return details;
    },
    enabled: orderIds.length > 0,
    staleTime: 1000 * 60, // 1 minute
  });

  const orderDetails = orderDetailsQueries.data || [];

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-neutral-950 p-4 md:p-6">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-2xl md:text-3xl font-bold mb-6 text-gray-900 dark:text-white">
          My Orders
        </h1>

        {/* Success Message */}
        {showSuccess && (
          <div className="mb-6 p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg flex items-start gap-3 animate-fadeIn">
            <FiCheck className="text-green-600 dark:text-green-400 flex-shrink-0 mt-0.5" size={24} />
            <div>
              <h3 className="font-bold text-green-900 dark:text-green-100 mb-1">
                Order Placed Successfully!
              </h3>
              <p className="text-sm text-green-700 dark:text-green-300">
                Your order #{orderIdParam} has been received and is being processed. You'll receive real-time updates as your order progresses.
              </p>
            </div>
          </div>
        )}

        {/* Orders List */}
        {isLoading || orderDetailsQueries.isLoading ? (
          <div className="flex items-center justify-center min-h-[400px]">
            <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600"></div>
          </div>
        ) : orders.length === 0 ? (
          <div className="flex flex-col items-center justify-center min-h-[400px] text-center">
            <FiPackage size={80} className="text-gray-300 dark:text-neutral-700 mb-6" />
            <h2 className="text-xl font-bold mb-2 text-gray-900 dark:text-white">
              No orders yet
            </h2>
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              Start shopping to place your first order
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6">
            {orderDetails.map((details, index) => {
              if (!details?.data) return null;
              return (
                <OrderCard
                  key={details.data.order.orderId}
                  order={details.data.order}
                  products={details.data.products}
                  showStatusActions={false}
                />
              );
            })}
          </div>
        )}

        {/* Info Banner */}
        <div className="mt-8 p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
          <h3 className="font-semibold text-blue-900 dark:text-blue-100 mb-2">
            📱 Real-time Order Updates
          </h3>
          <p className="text-sm text-blue-700 dark:text-blue-300">
            You'll receive automatic notifications when your order status changes. Keep this page open to see updates in real-time!
          </p>
        </div>
      </div>
    </div>
  );
}
