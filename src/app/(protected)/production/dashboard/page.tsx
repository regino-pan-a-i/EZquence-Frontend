'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/utils/supabase/supabaseClient';
import {
  Order,
  OrdersByDateRangeResponse,
  OrderDetailsResponse,
  OrderProductList,
  OrderStatus,
  ProductionGoalsResponse,
  ProductListResponse,
  ProductInStock,
  ProductInStockResponse,
  ProductionGoal,
} from '@/utils/supabase/schema';
import { getApiBaseUrl } from '@/utils/apiConfig';
import ScoreCard from '@/components/scorecard/ScoreCard';
import DateFilter from '@/components/filters/DateFilter';
import OrderCard from '@/components/orders/OrderCard';
import { FaTachometerAlt, FaBoxOpen, FaSpinner, FaCheckCircle, FaClock, FaExclamationTriangle } from 'react-icons/fa';

// Type for order with its products
type OrderWithProducts = {
  order: Order;
  products: OrderProductList[];
};

export default function ProductionDashboard() {
  
  // Default to today's date
  const getTodayDate = () => new Date().toISOString().split('T')[0];
  
  const [dateRange, setDateRange] = useState({
    start: getTodayDate(),
    end: getTodayDate(),
  });

  const handleDateRangeChange = (start: string, end: string) => {
    setDateRange({ start, end });
  };

  // Fetch orders by date range
  const { data: ordersResponse, isLoading: loadingOrders } = useQuery<OrdersByDateRangeResponse>({
    queryKey: ['production-orders', dateRange.start, dateRange.end],
    queryFn: async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      const token = session?.access_token;
      const res = await fetch(
        `${getApiBaseUrl()}/order/daterange?start=${dateRange.start}&end=${dateRange.end}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        }
      );
      if (!res.ok) throw new Error('Failed to fetch orders');
      return res.json();
    },
  });

  // Fetch order details with products
  const { data: ordersWithProducts, isLoading: loadingOrderDetails } = useQuery<OrderWithProducts[]>({
    queryKey: ['production-order-details', ordersResponse?.data],
    queryFn: async () => {
      if (!ordersResponse?.data || ordersResponse.data.length === 0) return [];
      
      const {
        data: { session },
      } = await supabase.auth.getSession();
      const token = session?.access_token;

      const orderDetailsPromises = ordersResponse.data.map(async (order) => {
        const res = await fetch(`${getApiBaseUrl()}/order/${order.orderId}`, {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        });
        if (!res.ok) throw new Error(`Failed to fetch order ${order.orderId}`);
        const response: OrderDetailsResponse = await res.json();
        return {
          order: response.data.order,
          products: response.data.products,
        };
      });

      return Promise.all(orderDetailsPromises);
    },
    enabled: !!ordersResponse?.data && ordersResponse.data.length > 0,
  });

  // Fetch active production goals
  const { data: productionGoalsResponse, isLoading: loadingGoals } = useQuery<ProductionGoalsResponse>({
    queryKey: ['production-goals-active'],
    queryFn: async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      const token = session?.access_token;
      
      const response = await fetch(`${getApiBaseUrl()}/company/production-goals/active`, {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch production goals: ${response.statusText}`);
      }

      return response.json();
    },
  });

  // Fetch products to map productId to product names
  const { data: productsResponse } = useQuery<ProductListResponse>({
    queryKey: ['products'],
    queryFn: async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      const token = session?.access_token;
      const res = await fetch(`${getApiBaseUrl()}/product`, {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });
      if (!res.ok) throw new Error('Failed to fetch products');
      return res.json();
    },
  });

  // Fetch product stock for all products in production goals
  const { data: productStockData, isLoading: loadingStock } = useQuery<Map<number, ProductInStock>>({
    queryKey: ['product-stock', productionGoalsResponse?.data],
    queryFn: async () => {
      if (!productionGoalsResponse?.data || productionGoalsResponse.data.length === 0) {
        return new Map();
      }

      const {
        data: { session },
      } = await supabase.auth.getSession();
      const token = session?.access_token;

      const stockPromises = productionGoalsResponse.data.map(async (goal) => {
        try {
          const res = await fetch(`${getApiBaseUrl()}/inventory/stock/${goal.productId}`, {
            headers: {
              Authorization: `Bearer ${token}`,
              'Content-Type': 'application/json',
            },
          });
          if (!res.ok) throw new Error(`Failed to fetch stock for product ${goal.productId}`);
          const response: ProductInStockResponse = await res.json();
          return [goal.productId, response.data] as [number, ProductInStock];
        } catch (error) {
          console.error(`Error fetching stock for product ${goal.productId}:`, error);
          return [goal.productId, { productId: goal.productId, productName: '', totalStock: 0 }] as [number, ProductInStock];
        }
      });

      const stockResults = await Promise.all(stockPromises);
      return new Map(stockResults);
    },
    enabled: !!productionGoalsResponse?.data && productionGoalsResponse.data.length > 0,
  });

  // Calculate order counts by status
  const getOrderCountByStatus = (status: OrderStatus) => {
    if (!ordersResponse?.data) return 0;
    return ordersResponse.data.filter((order) => order.status === status).length;
  };

  // Filter RECEIVED orders for display
  const receivedOrders = ordersWithProducts?.filter(
    (orderWithProducts) => orderWithProducts.order.status === OrderStatus.RECEIVED
  ) || [];

  // Calculate production progress
  const calculateProgress = (goal: ProductionGoal) => {
    if (!productionGoalsResponse?.data) {
      return { goal: 0, percentage: 0, stockAvailable: 0, stockStatus: 'unknown' as const };
    }
    // Get stock information
    const stock = productStockData?.get(goal.productId);
    const stockAvailable = stock?.totalStock ?? 0;
    const percentage = goal.goalValue > 0 ? Math.round((stockAvailable / goal.goalValue) * 100) : 0;
    const remaining = goal.goalValue - stockAvailable;
    
    // Determine stock status
    let stockStatus: 'sufficient' | 'low' | 'out' | 'unknown' = 'unknown';
    if (stock !== undefined) {
      if (stockAvailable === 0) {
        stockStatus = 'out';
      } else if (stockAvailable < remaining) {
        stockStatus = 'low';
      } else {
        stockStatus = 'sufficient';
      }
    }

    return { goal: goal.goalValue, percentage, stockAvailable, stockStatus };
  };

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
        <div className="flex items-center gap-3">
          <FaTachometerAlt className="text-blue-600 text-3xl" />
          <h1 className="text-3xl font-bold text-gray-900">Production Dashboard</h1>
        </div>
        <DateFilter
          type="range"
          label="Filter By Date"
          onDateRangeChange={handleDateRangeChange}
          defaultStartDate={dateRange.start}
          defaultEndDate={dateRange.end}
          defaultPreset="today"
        />
      </div>

      {/* Order Status Scorecards */}
      <div className="mb-6">
        {loadingOrders ? (
          <ScoreCard title="Order Status Overview" data={[]} isLoading={true} skeletonCount={4} />
        ) : (
          <ScoreCard
            title="Order Status Overview"
            data={[
              {
                value: getOrderCountByStatus(OrderStatus.RECEIVED),
                label: 'Received',
                color: 'purple',
                icon: <FaBoxOpen />,
              },
              {
                value: getOrderCountByStatus(OrderStatus.IN_PROGRESS),
                label: 'In Progress',
                color: 'blue',
                icon: <FaClock />,
              },
              {
                value: getOrderCountByStatus(OrderStatus.COMPLETED),
                label: 'Completed',
                color: 'green',
                icon: <FaCheckCircle />,
              },
              {
                value: getOrderCountByStatus(OrderStatus.DELAYED),
                label: 'Delayed',
                color: 'red',
                icon: <FaExclamationTriangle />,
              },
            ]}
          />
        )}
      </div>

      {/* Production Goals Scorecards */}
      {productionGoalsResponse?.data && productionGoalsResponse.data.length > 0 && (
        <div className="mb-6">
          {loadingGoals || loadingStock ? (
            <ScoreCard title="Production Goals (Today)" data={[]} isLoading={true} skeletonCount={3} />
          ) : (
            <ScoreCard
              title="Production Goals (Today)"
              data={productionGoalsResponse.data.map((goal) => {
                const product = productsResponse?.data.find((p) => p.productId === goal.productId);
                const progress = calculateProgress(goal);
                
                // Determine color based on progress and stock status
                let cardColor: 'green' | 'blue' | 'yellow' | 'red' = 'yellow';
                if (progress.percentage >= 100) {
                  cardColor = 'green';
                } else if (progress.stockStatus === 'out') {
                  cardColor = 'red';
                } else if (progress.stockStatus === 'low') {
                  cardColor = 'yellow';
                } else if (progress.percentage >= 50) {
                  cardColor = 'blue';
                }

                // Build value string with stock info
                const valueString = `${progress.stockAvailable} of ${progress.goal} completed`;

                return {
                  value: valueString,
                  label: product?.name || `Product ${goal.productId}`,
                  color: cardColor,
                };
              })}
            />
          )}
        </div>
      )}

      {/* RECEIVED Orders Section */}
      <div className="mb-6">
        <div className="flex items-center gap-2 mb-4">
          <FaBoxOpen className="text-purple-600 text-2xl" />
          <h2 className="text-2xl font-bold text-gray-900">
            Received Orders ({receivedOrders.length})
          </h2>
        </div>

        {loadingOrderDetails ? (
          <div className="flex justify-center items-center py-12">
            <FaSpinner className="animate-spin text-blue-600 text-4xl" />
          </div>
        ) : receivedOrders.length === 0 ? (
          <div className="bg-gray-50 border-2 border-dashed border-gray-300 rounded-lg p-12 text-center">
            <FaBoxOpen className="mx-auto text-gray-400 text-5xl mb-4" />
            <p className="text-gray-600 text-lg">No received orders for the selected date range</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {receivedOrders.map((orderWithProducts) => (
              <OrderCard
                key={orderWithProducts.order.orderId}
                order={orderWithProducts.order}
                products={orderWithProducts.products}
                showStatusActions={true}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
