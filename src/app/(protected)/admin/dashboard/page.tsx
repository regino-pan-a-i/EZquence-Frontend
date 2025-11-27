'use client';
import ScoreCard from '@/components/scorecard/ScoreCard';
import ProductionGoalsManager from '@/components/admin/ProductionGoalsManager';
import { FaDollarSign, FaReceipt, FaTachometerAlt } from 'react-icons/fa';
import { getApiBaseUrl } from '@/utils/apiConfig';
import DateFilter from '@/components/filters/DateFilter';
import { useQuery } from '@tanstack/react-query';
import { Order, OrdersByDateRangeResponse, OrderStatus } from '@/utils/supabase/schema';
import { useState } from 'react';
import { supabase } from '@/utils/supabase/supabaseClient';
import RevenueChart from '@/components/charts/RevenueChart';
import { useRole } from '@/hooks/useAuth';
import { UserRole } from '@/utils/supabase/schema';

export default function DashboardPage() {
  const role = useRole();
  
  const getFirstDayOfMonth = () => {
    const date = new Date();
    date.setDate(1); // Set to the 1st day of the month
    return date.toISOString().split('T')[0];
  };

  const [dateRange, setDateRange] = useState({
    start: getFirstDayOfMonth(), // First day of current month
    end: new Date().toISOString().split('T')[0], // Today's date by default
  });

  const handleDateRangeChange = (start: string, end: string) => {
    setDateRange({ start, end });
  };

  const { data: orders, isLoading: loadingOrders } = useQuery<OrdersByDateRangeResponse>({
    queryKey: ['orders', dateRange.start, dateRange.end],
    queryFn: async () => {
      // Get the session token
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
      if (!res.ok) console.log('Failed to fetch orders', res);
      return res.json();
    },
  });

  const OrdersTotal = (orderList: OrdersByDateRangeResponse) => {
    return orderList.data.length;
  };

  const RevenueByDateRange = (orderList: OrdersByDateRangeResponse) => {
    if (orders) {
      const orderData = orderList.data;

      const revenueData = orderData
        .map((order: Order) => {
          return {
            date: new Date(order.dateCreated).toISOString().split('T')[0],
            revenue: order.status === OrderStatus.COMPLETED ? order.orderTotal : 0,
          };
        })
        .reduce((acc: Record<string, number>, curr) => {
          acc[curr.date] = (acc[curr.date] || 0) + curr.revenue;
          return acc;
        }, {});

      console.log(revenueData);
      return Object.entries(revenueData).map(([date, revenue]) => ({
        date,
        revenue,
      }));
    }
    return [];
  };

  const TotalRevenue = (orderList: OrdersByDateRangeResponse) => {
    const orderData = orderList.data;
    return orderData.reduce((sum, order) => sum + order.orderTotal, 0);
  };

  const AvgOrderValue = (orderList: OrdersByDateRangeResponse) => {
    const orderData = orderList.data;
    const total = orderData
      .map((order: Order) => {
        return order.orderTotal;
      })
      .reduce((a, b) => a + b, 0);
    return total / orderData.length;
  };

  const PendingOrders = (orderList: OrdersByDateRangeResponse) => {
    const orderData = orderList.data;
    const data = orderData.filter((order: Order) => {
      return (
        order.status === OrderStatus.IN_PROGRESS ||
        order.status === OrderStatus.PAID ||
        order.status === OrderStatus.DELAYED ||
        (order.status === OrderStatus.RECEIVED && order.paid == true)
      );
    });
    return data.length;
  };

  return (
    <>
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center m-4 gap-4">
        <div className="flex items-center gap-3">
          <FaTachometerAlt className="text-blue-600 text-3xl" />
          <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
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

      <div className="w-full">
        {loadingOrders && (
          <ScoreCard
            title="Key Primary Indicators"
            data={[]}
            isLoading={loadingOrders}
            skeletonCount={4}
          />
        )}
        {orders && (
          <ScoreCard
            title="Key Primary Indicators"
            data={[
              {
                value: `${TotalRevenue(orders)}`,
                label: 'Total Revenue',
                color: 'green',
                icon: <FaDollarSign />,
              },
              {
                value: `${OrdersTotal(orders)}`,
                label: 'Orders',
                color: 'yellow',
                icon: <FaReceipt />,
              },
              {
                value: `${AvgOrderValue(orders) || 0}`,
                label: 'Avg Order Value',
                color: 'green',
                icon: <FaReceipt />,
              },
              {
                value: `${PendingOrders(orders)}`,
                label: 'Pending Orders',
                color: 'green',
                icon: <FaReceipt />,
              },
            ]}
            isLoading={loadingOrders}
            skeletonCount={4}
          />
        )}
      </div>

      <div className="w-full">{orders && <RevenueChart data={RevenueByDateRange(orders)} />}</div>

      {/* Production Goals Management - Admin Only */}
      {role === UserRole.ADMIN && (
        <div className="my-6">
          <ProductionGoalsManager />
        </div>
      )}

      <div>Orders Summary (bar chart: completed vs pending)</div>
      <div>Top-Selling Products (mini leaderboard list)</div>
      <div>Table: Top Selling Products</div>
      <div>| Columns: Product | Units Sold | Revenue | Profit % </div>
    </>
  );
}
