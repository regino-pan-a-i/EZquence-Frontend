'use client';

import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/utils/supabase/supabaseClient';
import {
  Order,
  OrdersByDateRangeResponse,
  OrderDetailsResponse,
  OrderProductList,
  OrderStatus,
  Product,
  ProductInStock,
  ProductListResponse,
  ProductInStockResponse,
} from '@/utils/supabase/schema';
import { getApiBaseUrl } from '@/utils/apiConfig';
import DateFilter from '@/components/filters/DateFilter';
import OrderCard from '@/components/orders/OrderCard';
import ScoreCard from '@/components/scorecard/ScoreCard';
import { FaShoppingCart, FaSearch, FaDollarSign, FaCheckCircle, FaTimesCircle, FaSpinner, FaBoxOpen } from 'react-icons/fa';


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

export default function ProductionOrdersPage() {
  
  const [dateRange, setDateRange] = useState({
    start: getFirstDayOfMonth(),
    end: new Date().toISOString().split('T')[0],
  });
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<OrderStatus | 'ALL'>('ALL');
  const [ordersWithProducts, setOrdersWithProducts] = useState<OrderWithProducts[]>([]);
  const [products, setProducts] = useState<Product[]>([]);

  const handleDateRangeChange = (start: string, end: string) => {
    setDateRange({ start, end });
  };

  // Fetch orders by date range
  const { data: ordersResponse, isLoading: loadingOrders } = useQuery<OrdersByDateRangeResponse>({
    queryKey: ['production-all-orders', dateRange.start, dateRange.end],
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

  const { data: prodResponse } = useQuery<ProductListResponse>({
    queryKey: ['products'],
    queryFn: async () => {
      // Get the session token
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
      if (!res.ok) console.log('Failed to fetch orders', res);
      return res.json();
    },
  });

  // Fetch stock data for all products
  const { data: productStockData, isLoading: loadingStock } = useQuery<Map<number, ProductInStock>>({
    queryKey: ['product-stock-all', prodResponse?.data],
    queryFn: async () => {
      if (!prodResponse?.data || prodResponse.data.length === 0) {
        return new Map();
      }

      const {
        data: { session },
      } = await supabase.auth.getSession();
      const token = session?.access_token;

      const stockPromises = prodResponse.data.map(async (product) => {
        try {
          const res = await fetch(`${getApiBaseUrl()}/inventory/stock/${product.productId}`, {
            headers: {
              Authorization: `Bearer ${token}`,
              'Content-Type': 'application/json',
            },
          });
          if (!res.ok) throw new Error(`Failed to fetch stock for product ${product.productId}`);
          const response: ProductInStockResponse = await res.json();
          return [product.productId, response.data] as [number, ProductInStock];
        } catch (error) {
          console.error(`Error fetching stock for product ${product.productId}:`, error);
          return [product.productId, { productId: product.productId, productName: product.name, totalStock: 0 }] as [number, ProductInStock];
        }
      });

      const stockResults = await Promise.all(stockPromises);
      return new Map(stockResults);
    },
    enabled: !!prodResponse?.data && prodResponse.data.length > 0,
  });

  // Use useEffect to set products when data is fetched
  useEffect(() => {
    if (prodResponse && prodResponse.success === true) {
      setProducts(prodResponse.data);
    }
  }, [prodResponse]);

  // Fetch individual order details with products
  useEffect(() => {
    const fetchOrderDetails = async () => {
      if (!ordersResponse?.data || ordersResponse.data.length === 0) {
        setOrdersWithProducts([]);
        return;
      }

      const {
        data: { session },
      } = await supabase.auth.getSession();
      const token = session?.access_token;

      const orderDetailsPromises = ordersResponse.data.map(async (order) => {
        try {
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
        } catch (error) {
          console.error(`Error fetching order ${order.orderId}:`, error);
          return null;
        }
      });

      const results = await Promise.all(orderDetailsPromises);
      setOrdersWithProducts(results.filter((r) => r !== null) as OrderWithProducts[]);
    };

    fetchOrderDetails();
  }, [ordersResponse]);



  // Calculate totals
  const totalRevenue = ordersResponse?.data.reduce((sum, order) => sum + order.orderTotal, 0) || 0;
  const totalOrders = ordersResponse?.data.length || 0;
  const paidOrders = ordersResponse?.data.filter((order) => order.paid).length || 0;
  const unpaidOrders = totalOrders - paidOrders;

  // Filter orders based on search and status
  const filteredOrders = ordersWithProducts.filter((orderWithProducts) => {
    const { order, products } = orderWithProducts;

    // Status filter
    if (statusFilter !== 'ALL' && order.status !== statusFilter) {
      return false;
    }

    // Search filter
    if (searchTerm.trim() !== '') {
      const searchLower = searchTerm.toLowerCase();
      const matchesOrderId = order.orderId.toString().includes(searchLower);
      const matchesNotes = order.notes?.toLowerCase().includes(searchLower);
      const matchesProduct = products.some((p) =>
        p.productName.name.toLowerCase().includes(searchLower)
      );

      return matchesOrderId || matchesNotes || matchesProduct;
    }

    return true;
  });

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
        <div className="flex items-center gap-3">
          <FaShoppingCart className="text-blue-600 text-3xl" />
          <h1 className="text-3xl font-bold text-gray-900">All Orders</h1>
        </div>
        <DateFilter
          type="range"
          label="Filter By Date"
          onDateRangeChange={handleDateRangeChange}
          defaultStartDate={dateRange.start}
          defaultEndDate={dateRange.end}
          defaultPreset="custom"
        />
      </div>

      {/* Summary Scorecards */}
      <div className="mb-6">
        {loadingOrders ? (
          <ScoreCard title="Order Summary" data={[]} isLoading={true} skeletonCount={4} />
        ) : (
          <ScoreCard
            title="Order Summary"
            data={[
              {
                value: `$${totalRevenue.toFixed(2)}`,
                label: 'Total Revenue',
                color: 'green',
                icon: <FaDollarSign />,
              },
              {
                value: totalOrders,
                label: 'Total Orders',
                color: 'blue',
                icon: <FaShoppingCart />,
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
          />
        )}
      </div>
      {/* Stock Overview Scorecard */}
      {products && products.length > 0 && (
        <div className="mb-6 mx-4">
          {loadingStock ? (
            <ScoreCard title="Product Stock Overview" data={[]} isLoading={true} skeletonCount={3} />
          ) : (
            <ScoreCard
              title="Product Stock Overview"
              data={products.map((product) => {
                const stock = productStockData?.get(product.productId);
                const stockValue = stock?.totalStock ?? 0;
                
                // Determine color based on stock level
                let stockColor: 'green' | 'yellow' | 'red' | 'gray' = 'gray';
                if (stockValue === 0) {
                  stockColor = 'red';
                } else if (stockValue < 10) {
                  stockColor = 'yellow';
                } else {
                  stockColor = 'green';
                }

                return {
                  value: stockValue,
                  label: product.name,
                  color: stockColor,
                  icon: <FaBoxOpen />,
                };
              })}
            />
          )}
        </div>
      )}
      {/* Search and Filter Controls */}
      <div className="mb-6 flex flex-col md:flex-row gap-4">
        {/* Search Input */}
        <div className="flex-1 relative">
          <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Search by Order ID, Notes, or Product Name..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
        </div>

        {/* Status Filter */}
        <div className="md:w-64">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as OrderStatus | 'ALL')}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="ALL">All Statuses</option>
            <option value={OrderStatus.RECEIVED}>Received</option>
            <option value={OrderStatus.IN_PROGRESS}>In Progress</option>
            <option value={OrderStatus.COMPLETED}>Completed</option>
            <option value={OrderStatus.DELAYED}>Delayed</option>
            <option value={OrderStatus.PAID}>Paid</option>
            <option value={OrderStatus.STARTED}>Started</option>
          </select>
        </div>
      </div>

      {/* Orders Grid */}
      {loadingOrders ? (
        <div className="flex justify-center items-center py-12">
          <FaSpinner className="animate-spin text-blue-600 text-4xl" />
        </div>
      ) : filteredOrders.length === 0 ? (
        <div className="bg-gray-50 border-2 border-dashed border-gray-300 rounded-lg p-12 text-center">
          <FaShoppingCart className="mx-auto text-gray-400 text-5xl mb-4" />
          <p className="text-gray-600 text-lg">
            {searchTerm || statusFilter !== 'ALL'
              ? 'No orders match your search criteria'
              : 'No orders found for the selected date range'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredOrders.map((orderWithProducts) => (
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
  );
}
