'use client';
import ScoreCard from '@/components/scorecard/ScoreCard';
import { FaDollarSign, FaReceipt, FaUser } from 'react-icons/fa';
import DateFilter from '@/components/filters/DateFilter';
import { useQuery } from '@tanstack/react-query';
import { Order, OrderResponse, OrderStatus } from '@/utils/supabase/schema';
import { useState } from 'react';
import { supabase } from '@/utils/supabase/supabaseClient';
import RevenueChart from '@/components/charts/RevenueChart'

export default function DashboardPage() {
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

    const { data: orders, isLoading: loadingOrders } = useQuery<OrderResponse>({
    queryKey: ['orders', dateRange.start, dateRange.end],
    queryFn: async () => {
      // Get the session token
      const {
        data: { session },
      } = await supabase.auth.getSession();
      const token = session?.access_token;
      const res = await fetch(
        `http://localhost:8080/order/daterange?start=${dateRange.start}&end=${dateRange.end}`,
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

  const OrdersTotal = (orderList: OrderResponse) => {
    return orderList.data.length;
  };

  const RevenueByDateRange = (orderList: OrderResponse) => {
    if (orders) {
      let orderData = orderList.data;

      const revenueData = orderData
        .map((order: Order) => {
          return {
            date: new Date(order.dateCreated).toISOString().split('T')[0],
            revenue: order.status === OrderStatus.COMPLETED ? order.orderTotal : 0,
          };
        }).reduce((acc: Record<string, number>, curr) => {
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

  const TotalRevenue = (orderList: OrderResponse) => {
    let orderData = orderList.data;
    return orderData
      .map((order: Order) => {
        return order.status === OrderStatus.COMPLETED ? order.orderTotal : 0;
      })
      .reduce((a, b) => a + b, 0);
  };

  const AvgOrderValue = (orderList: OrderResponse) => {
    let orderData = orderList.data;
    const total = orderData
      .map((order: Order) => {
        return order.orderTotal;
      })
      .reduce((a, b) => a + b, 0);
    return total / orderData.length;
  };

  const PendingOrders = (orderList: OrderResponse) => {
    let orderData = orderList.data;
    let data =  orderData.filter((order: Order) => {
      return (
        order.status === OrderStatus.IN_PROGRESS ||
        order.status === OrderStatus.PAID ||
        order.status === OrderStatus.DELAYED ||
        order.status === OrderStatus.RECEIVED && order.paid == true
      );
    });
    return 5
  };

  return (
    <>
      <div className="flex flex-row m-4 justify-between">
        <h1 className="text-2xl font-bold">Dashboard</h1>
        <DateFilter
          type="range"
          label="Filter"
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

      <div className="w-full">
        {orders && <RevenueChart data={RevenueByDateRange(orders)} />}
      </div>

      <div>Orders Summary (bar chart: completed vs pending)</div>   
      <div>Top-Selling Products (mini leaderboard list)</div>
      <div>Table: "Top Selling Products"</div>
      <div>| Columns: Product | Units Sold | Revenue | Profit % </div>
    </>
  );
}
