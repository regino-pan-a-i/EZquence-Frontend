'use client';

import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/utils/supabase/supabaseClient';
import { getApiUrl } from '@/utils/apiConfig';
import { DecodedToken, ClientOrderDetailsResponse } from '@/utils/supabase/schema';
import { useOrderRealtime } from '@/hooks/useOrderRealtime';
import OrderCard from '@/components/orders/OrderCard';
import { FiPackage, FiCheck } from 'react-icons/fi';
import { useSearchParams } from 'next/navigation';
import { jwtDecode } from 'jwt-decode';

async function fetchOrders(): Promise<ClientOrderDetailsResponse> {
  const { data: { session } } = await supabase.auth.getSession();
  const token = session?.access_token;

  const decodedToken = jwtDecode<DecodedToken>(token || '');
  const userId = decodedToken.usr_id;

  const response = await fetch(
    getApiUrl(`/order/customer/${userId}`),
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


export default function OrdersPage() {
  const searchParams = useSearchParams();
  const successParam = searchParams.get('success');
  const orderIdParam = searchParams.get('orderId');
  const [showSuccess, setShowSuccess] = useState(false);

  // Get user ID for realtime updates
  const [userId, setUserId] = useState<number | undefined>();
  
  useEffect(() => {
    const fetchUserId = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      const token = session?.access_token;

      const decodedToken = jwtDecode<DecodedToken>(token || '');
      const userId = decodedToken.usr_id;
      if (userId) {
        setUserId(userId);
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


  const { data: ordersData, isLoading } = useQuery({
    queryKey: ['userOrders'],
    queryFn: () => fetchOrders(),
    staleTime: 1000 * 60, // 1 minute
  });

  // Fetch order details for each order
  const orders = ordersData?.data || [];

  return (
    <div className="min-h-screen bg-background p-4 md:p-6">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-2xl md:text-3xl font-bold mb-6 text-foreground">
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
                Your order #{orderIdParam} has been received and is being processed. You&aposll receive real-time updates as your order progresses.
              </p>
            </div>
          </div>
        )}

        {/* Orders List */}
        {isLoading ? (
          <div className="flex items-center justify-center min-h-[400px]">
            <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-accent"></div>
          </div>
        ) : !orders ? (
          <div className="flex flex-col items-center justify-center min-h-[400px] text-center">
            <FiPackage size={80} className="text-muted mb-6" />
            <h2 className="text-xl font-bold mb-2 text-foreground">
              No orders yet
            </h2>
            <p className="text-muted mb-6">
              Start shopping to place your first order
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6">
            {orders.map((response, index) => {
              return (
                <OrderCard
                  key={response.order.orderId}
                  order={response.order}
                  products={response.products}
                  showStatusActions={false}
                />
              );
            })}
          </div>
        )}

        {/* Info Banner */}
        <div className="mt-8 p-4 bg-accent/10 border border-accent/30 rounded-lg">
          <h3 className="font-semibold text-link mb-2">
            📱 Real-time Order Updates
          </h3>
          <p className="text-sm text-link">
            You&apos;ll receive automatic notifications when your order status changes. Keep this page open to see updates in real-time!
          </p>
        </div>
      </div>
    </div>
  );
}
