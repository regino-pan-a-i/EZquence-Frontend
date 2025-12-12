'use client';
import ScoreCard from '@/components/scorecard/ScoreCard';
import { FaDollarSign, FaReceipt, FaChartLine, FaArrowUp, FaArrowDown, FaBox } from 'react-icons/fa';
import PeriodComparisonFilter from '@/components/filters/PeriodComparisonFilter';
import ProductSalesChart, { ProductSalesData } from '@/components/charts/ProductSalesChart';
import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/utils/supabase/supabaseClient';
import { getApiBaseUrl } from '@/utils/apiConfig';
import { 
  Order, 
  OrdersByDateRangeResponse, 
  OrderDetailsResponse,
  OrderProductList 
} from '@/utils/supabase/schema';
import {
  getFirstDayOfPreviousMonth,
  getLastDayOfPreviousMonth,
  getFirstDayOfCurrentMonth,
  getTodayDate,
} from '@/utils/dateHelpers';

interface PeriodMetrics {
  revenue: number;
  orderCount: number;
  avgOrderValue: number;
}

export default function AnalysisPage() {
  // Period 1 (Previous Month by default)
  const [period1, setPeriod1] = useState({
    start: getFirstDayOfPreviousMonth(),
    end: getLastDayOfPreviousMonth(),
  });

  // Period 2 (Current Month by default)
  const [period2, setPeriod2] = useState({
    start: getFirstDayOfCurrentMonth(),
    end: getTodayDate(),
  });

  const [productSalesData, setProductSalesData] = useState<ProductSalesData[]>([]);
  const [selectedMetric, setSelectedMetric] = useState<'orderCount' | 'totalRevenue' | 'unitsSold'>('orderCount');

  const handlePeriod1Change = (start: string, end: string) => {
    setPeriod1({ start, end });
  };

  const handlePeriod2Change = (start: string, end: string) => {
    setPeriod2({ start, end });
  };

  // Fetch orders for Period 1
  const { data: period1Orders, isLoading: loadingPeriod1 } = useQuery<OrdersByDateRangeResponse>({
    queryKey: ['analysis-period1-orders', period1.start, period1.end],
    queryFn: async () => {
      const { data: { session } } = await supabase.auth.getSession();
      const token = session?.access_token;
      
      const res = await fetch(
        `${getApiBaseUrl()}/order/daterange?start=${period1.start}&end=${period1.end}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        }
      );
      if (!res.ok) throw new Error('Failed to fetch period 1 orders');
      return res.json();
    },
  });

  // Fetch orders for Period 2
  const { data: period2Orders, isLoading: loadingPeriod2 } = useQuery<OrdersByDateRangeResponse>({
    queryKey: ['analysis-period2-orders', period2.start, period2.end],
    queryFn: async () => {
      const { data: { session } } = await supabase.auth.getSession();
      const token = session?.access_token;
      
      const res = await fetch(
        `${getApiBaseUrl()}/order/daterange?start=${period2.start}&end=${period2.end}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        }
      );
      if (!res.ok) throw new Error('Failed to fetch period 2 orders');
      return res.json();
    },
  });

  // Calculate metrics for each period
  const calculateMetrics = (ordersResponse: OrdersByDateRangeResponse | undefined): PeriodMetrics => {
    if (!ordersResponse || !ordersResponse.data) {
      return { revenue: 0, orderCount: 0, avgOrderValue: 0 };
    }

    const orders = ordersResponse.data;
    const revenue = orders.reduce((sum, order) => sum + order.orderTotal, 0);
    const orderCount = orders.length;
    const avgOrderValue = orderCount > 0 ? revenue / orderCount : 0;

    return { revenue, orderCount, avgOrderValue };
  };

  const period1Metrics = calculateMetrics(period1Orders);
  const period2Metrics = calculateMetrics(period2Orders);

  // Calculate percentage changes
  const calculatePercentageChange = (oldValue: number, newValue: number): number => {
    if (oldValue === 0) return newValue > 0 ? 100 : 0;
    return ((newValue - oldValue) / oldValue) * 100;
  };

  const revenueChange = calculatePercentageChange(period1Metrics.revenue, period2Metrics.revenue);
  const orderCountChange = calculatePercentageChange(period1Metrics.orderCount, period2Metrics.orderCount);
  const avgOrderValueChange = calculatePercentageChange(period1Metrics.avgOrderValue, period2Metrics.avgOrderValue);

  // Fetch order details for Period 2 to get product information
  useEffect(() => {
    const fetchProductData = async () => {
      if (!period2Orders || !period2Orders.data || period2Orders.data.length === 0) {
        setProductSalesData([]);
        return;
      }

      try {
        const { data: { session } } = await supabase.auth.getSession();
        const token = session?.access_token;

        // Fetch details for all orders
        const orderDetailsPromises = period2Orders.data.map(async (order) => {
          const res = await fetch(`${getApiBaseUrl()}/order/${order.orderId}`, {
            headers: {
              Authorization: `Bearer ${token}`,
              'Content-Type': 'application/json',
            },
          });
          if (!res.ok) throw new Error(`Failed to fetch order ${order.orderId}`);
          const response: OrderDetailsResponse = await res.json();
          return response.data.products;
        });

        const allOrderProducts = await Promise.all(orderDetailsPromises);
        
        // Aggregate product data
        const productMap = new Map<number, ProductSalesData>();
        
        allOrderProducts.forEach((products) => {
          products.forEach((product) => {
            const existing = productMap.get(product.productId);
            if (existing) {
              existing.orderCount += 1;
              existing.unitsSold += product.quantity;
              existing.totalRevenue += product.total;
            } else {
              productMap.set(product.productId, {
                productName: product.productName.name,
                orderCount: 1,
                unitsSold: product.quantity,
                totalRevenue: product.total,
              });
            }
          });
        });

        setProductSalesData(Array.from(productMap.values()));
      } catch (error) {
        console.error('Error fetching product data:', error);
        setProductSalesData([]);
      }
    };

    fetchProductData();
  }, [period2Orders]);

  const getMetricTitle = () => {
    switch (selectedMetric) {
      case 'orderCount':
        return 'Top Products by Number of Orders';
      case 'totalRevenue':
        return 'Top Products by Revenue';
      case 'unitsSold':
        return 'Top Products by Units Sold';
      default:
        return 'Top Products';
    }
  };

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Sales Analysis</h1>
          <p className="text-gray-600">Compare sales performance across different time periods</p>
        </div>

        {/* Period Comparison Filter */}
        <div className="mb-6">
          <PeriodComparisonFilter
            period1Start={period1.start}
            period1End={period1.end}
            period2Start={period2.start}
            period2End={period2.end}
            onPeriod1Change={handlePeriod1Change}
            onPeriod2Change={handlePeriod2Change}
          />
        </div>

        {/* Comparison Metrics */}
        <div className="mb-6">
          <ScoreCard
            title="Period Comparison Metrics"
            data={[
              {
                value: `$${period2Metrics.revenue.toFixed(2)}`,
                label: 'Revenue (Period 2)',
                color: revenueChange >= 0 ? 'green' : 'red',
                icon: <FaDollarSign />,
                trend: {
                  value: Math.abs(revenueChange),
                  isPositive: revenueChange >= 0,
                  period: 'vs Period 1',
                },
              },
              {
                value: period2Metrics.orderCount,
                label: 'Orders (Period 2)',
                color: orderCountChange >= 0 ? 'blue' : 'yellow',
                icon: <FaReceipt />,
                trend: {
                  value: Math.abs(orderCountChange),
                  isPositive: orderCountChange >= 0,
                  period: 'vs Period 1',
                },
              },
              {
                value: `$${period2Metrics.avgOrderValue.toFixed(2)}`,
                label: 'Avg Order Value (Period 2)',
                color: avgOrderValueChange >= 0 ? 'purple' : 'gray',
                icon: <FaChartLine />,
                trend: {
                  value: Math.abs(avgOrderValueChange),
                  isPositive: avgOrderValueChange >= 0,
                  period: 'vs Period 1',
                },
              },
            ]}
            isLoading={loadingPeriod1 || loadingPeriod2}
            skeletonCount={3}
          />
        </div>

        {/* Period 1 and Period 2 Side by Side */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          <ScoreCard
            title="Period 1 (Previous)"
            data={[
              {
                value: `$${period1Metrics.revenue.toFixed(2)}`,
                label: 'Revenue',
                color: 'blue',
                icon: <FaDollarSign />,
              },
              {
                value: period1Metrics.orderCount,
                label: 'Orders',
                color: 'blue',
                icon: <FaReceipt />,
              },
              {
                value: `$${period1Metrics.avgOrderValue.toFixed(2)}`,
                label: 'Avg Order Value',
                color: 'blue',
                icon: <FaChartLine />,
              },
            ]}
            variant="compact"
            isLoading={loadingPeriod1}
            skeletonCount={3}
          />

          <ScoreCard
            title="Period 2 (Current)"
            data={[
              {
                value: `$${period2Metrics.revenue.toFixed(2)}`,
                label: 'Revenue',
                color: 'green',
                icon: <FaDollarSign />,
              },
              {
                value: period2Metrics.orderCount,
                label: 'Orders',
                color: 'green',
                icon: <FaReceipt />,
              },
              {
                value: `$${period2Metrics.avgOrderValue.toFixed(2)}`,
                label: 'Avg Order Value',
                color: 'green',
                icon: <FaChartLine />,
              },
            ]}
            variant="compact"
            isLoading={loadingPeriod2}
            skeletonCount={3}
          />
        </div>

        {/* Product Performance Section */}
        <div className="mb-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-2xl font-bold text-gray-900">Product Performance (Period 2)</h2>
            <div className="flex gap-2">
              <button
                onClick={() => setSelectedMetric('orderCount')}
                className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                  selectedMetric === 'orderCount'
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
              >
                Orders
              </button>
              <button
                onClick={() => setSelectedMetric('totalRevenue')}
                className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                  selectedMetric === 'totalRevenue'
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
              >
                Revenue
              </button>
              <button
                onClick={() => setSelectedMetric('unitsSold')}
                className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                  selectedMetric === 'unitsSold'
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
              >
                Units Sold
              </button>
            </div>
          </div>

          <ProductSalesChart 
            data={productSalesData}
            metric={selectedMetric}
            title={getMetricTitle()}
          />
        </div>

        {/* Product Performance Table */}
        <div className="bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden">
          <div className="p-4 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900">Detailed Product Breakdown</h3>
          </div>
          <div className="overflow-x-auto">
            {productSalesData.length === 0 ? (
              <div className="p-8 text-center text-gray-500">
                <FaBox className="mx-auto text-4xl mb-2 opacity-50" />
                <p>No product data available for Period 2</p>
              </div>
            ) : (
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Product Name
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Orders
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Units Sold
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Total Revenue
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Avg Revenue/Order
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {[...productSalesData]
                    .sort((a, b) => b[selectedMetric] - a[selectedMetric])
                    .map((product, index) => (
                      <tr key={index} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          {product.productName}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                          {product.orderCount}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                          {product.unitsSold}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                          ${product.totalRevenue.toFixed(2)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                          ${(product.totalRevenue / product.orderCount).toFixed(2)}
                        </td>
                      </tr>
                    ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
