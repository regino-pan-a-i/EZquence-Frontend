'use client';

import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/utils/supabase/supabaseClient';
import { getApiBaseUrl } from '@/utils/apiConfig';
import { useState, useEffect } from 'react';
import { Order, OrdersByDateRangeResponse, OrderDetailsResponse, OrderProductList, OrderStatus } from '@/utils/supabase/schema';
import DateFilter from '@/components/filters/DateFilter';
import OrderCard from '@/components/orders/OrderCard';
import ScoreCard from '@/components/scorecard/ScoreCard';
import { FaShoppingCart, FaReceipt, FaSearch, FaDollarSign, FaCheckCircle, FaTimesCircle } from 'react-icons/fa';

// Helper function to get first day of current month
const getFirstDayOfMonth = () => {
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0];
};

// Type for order with its products
type OrderWithProducts = {
  order: Order;
  products: OrderProductList[];
};

export default function OrdersPage() {
  const [dateRange, setDateRange] = useState({
    start: getFirstDayOfMonth(),
    end: new Date().toISOString().split('T')[0],
  });
  const [orders, setOrders] = useState<Order[]>([]);
  const [ordersWithProducts, setOrdersWithProducts] = useState<OrderWithProducts[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  // Fetch orders by date range
  const {
    data: ordersResponse,
    isLoading: isLoadingOrders,
    error: ordersError,
  } = useQuery<OrdersByDateRangeResponse>({
    queryKey: ['orders', dateRange.start, dateRange.end],
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

      if (!res.ok) {
        throw new Error('Failed to fetch orders');
      }

      return res.json();
    },
  });

  // Update orders when response changes
  useEffect(() => {
    if (ordersResponse && ordersResponse.success === true) {
      setOrders(ordersResponse.data);
    }
  }, [ordersResponse]);

  // Fetch details for each order (including products)
  useEffect(() => {
    const fetchOrderDetails = async () => {
      if (orders.length === 0) {
        setOrdersWithProducts([]);
        return;
      }

      try {
        const {
          data: { session },
        } = await supabase.auth.getSession();
        const token = session?.access_token;

        // Fetch all order details in parallel
        const detailsPromises = orders.map(async (order) => {
          const res = await fetch(`${getApiBaseUrl()}/order/${order.orderId}`, {
            headers: {
              Authorization: `Bearer ${token}`,
              'Content-Type': 'application/json',
            },
          });

          if (!res.ok) {
            console.error(`Failed to fetch details for order ${order.orderId}`);
            return null;
          }

          const data: OrderDetailsResponse = await res.json();
          if (data.success) {
            return {
              order: data.data.order,
              products: data.data.products,
            };
          }
          return null;
        });

        const results = await Promise.all(detailsPromises);
        const validResults = results.filter((r) => r !== null) as OrderWithProducts[];
        setOrdersWithProducts(validResults);
      } catch (error) {
        console.error('Error fetching order details:', error);
      }
    };

    fetchOrderDetails();
  }, [orders]);

  const handleDateRangeChange = (start: string, end: string) => {
    setDateRange({ start, end });
  };

  // Filter and search orders
  const filteredOrders = ordersWithProducts.filter((orderData) => {
    const matchesSearch =
      searchTerm === '' ||
      orderData.order.orderId.toString().includes(searchTerm) ||
      orderData.order.notes?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      orderData.products.some((p) => p.productName.name.toLowerCase().includes(searchTerm.toLowerCase()));

    const matchesStatus = statusFilter === 'all' || orderData.order.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  // Calculate summary statistics
  const totalOrders = filteredOrders.length;
  const totalRevenue = filteredOrders.reduce((sum, orderData) => sum + orderData.order.orderTotal, 0);
  const paidOrders = filteredOrders.filter((orderData) => orderData.order.paid).length;
  const unpaidOrders = totalOrders - paidOrders;

  if (isLoadingOrders) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-center h-64">
          <div className="text-lg text-gray-600">Loading orders...</div>
        </div>
      </div>
    );
  }

  if (ordersError) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-center h-64">
          <div className="text-lg text-red-600">Error loading orders. Please try again.</div>
        </div>
      </div>
    );
  }

  return (
    <div >
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center m-4 gap-4">
        <div className="flex items-center gap-3">
          <FaShoppingCart className="text-blue-600 text-3xl" />
          <h1 className="text-3xl font-bold text-gray-900">Orders</h1>
        </div>
        <DateFilter
          type="range"
          label="Filter by Date"
          onDateRangeChange={handleDateRangeChange}
          defaultStartDate={dateRange.start}
          defaultEndDate={dateRange.end}
          defaultPreset="custom"
        />
      </div>

      {/* Summary Statistics */}
      <ScoreCard
        title="Order Summary"
        data={[
          {
            value: `$${totalRevenue.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
            label: 'Total Revenue',
            color: 'green',
            icon: <FaDollarSign />,
          },
          {
            value: totalOrders,
            label: 'Total Orders',
            color: 'blue',
            icon: <FaReceipt />,
          },
          {
            value: paidOrders,
            label: 'Paid Orders',
            color: 'green',
            icon: <FaCheckCircle />,
          },
          {
            value: unpaidOrders,
            label: 'Unpaid Orders',
            color: 'red',
            icon: <FaTimesCircle />,
          },
        ]}
        isLoading={isLoadingOrders}
        skeletonCount={4}
      />

      {/* Filters */}
      <div className="bg-white rounded-lg shadow-md p-4 mb-6">
        <div className="flex flex-col md:flex-row gap-4">
          {/* Search */}
          <div className="flex-1">
            <div className="relative">
              <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Search by order ID, product name, or notes..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          </div>

          {/* Status Filter */}
          <div className="md:w-48">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="all">All Statuses</option>
              <option value="RECEIVED">Received</option>
              <option value="STARTED">Started</option>
              <option value="IN_PROGRESS">In Progress</option>
              <option value="COMPLETED">Completed</option>
              <option value="PAID">Paid</option>
              <option value="DELAYED">Delayed</option>
            </select>
          </div>
        </div>
      </div>

      {/* Orders Grid */}
      {filteredOrders.length === 0 ? (
        <div className="bg-white rounded-lg shadow-md p-12 text-center">
          <FaReceipt className="mx-auto text-6xl text-gray-300 mb-4" />
          <h3 className="text-xl font-semibold text-gray-700 mb-2">No Orders Found</h3>
          <p className="text-gray-500">
            {searchTerm || statusFilter !== 'all'
              ? 'Try adjusting your filters or search terms.'
              : 'No orders in the selected date range.'}
          </p>
        </div>
      ) : (
        <div className="m-3 grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
          {filteredOrders.map((orderData) => (
            <OrderCard
              key={orderData.order.orderId}
              order={orderData.order}
              products={orderData.products}
            />
          ))}
        </div>
      )}
    </div>
  );
}
