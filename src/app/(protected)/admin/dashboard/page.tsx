'use client';
import ScoreCard from '@/components/scorecard/ScoreCard';
import { FaDollarSign, FaReceipt, FaUser } from 'react-icons/fa';
import DateFilter from '@/components/filters/DateFilter';
import { useQuery } from '@tanstack/react-query';
import { Order, OrderResponse, OrderStatus } from '@/utils/supabase/schema';
import { useState } from 'react';
import { supabase } from '@/utils/supabase/supabaseClient';

export default function DashboardPage() {
  const [dateRange, setDateRange] = useState({
    start: new Date().toISOString().split('T')[0], // Today's date by default
    end: new Date().toISOString().split('T')[0], // Today's date by default
  });
  const handleDateRangeChange = (start: string, end: string) => {
    setDateRange({ start, end });
  };

  const { data: orders, isLoading } = useQuery<OrderResponse>({
    queryKey: ['orders', dateRange.start, dateRange.end],
    queryFn: async () => {
      console.log('fetching');

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

  const TotalRevenue = (orderList: OrderResponse) => {
    let orderData = orderList.data;
    return orderData
      .map((order: Order) => {
        if (order.status === OrderStatus.COMPLETED) return order.orderTotal;
        return 0;
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
    return orderData.filter((order: Order) => {
      return (
        order.status === OrderStatus.IN_PROGRESS ||
        order.status === OrderStatus.PAID ||
        order.status === OrderStatus.DELAYED
      );
    }).length;
  };

  return (
    <>
      <div className="flex flex-row m-4 justify-between">
        <h1 className="text-2xl font-bold">Dashboard</h1>
        <DateFilter
          type="range"
          onDateRangeChange={handleDateRangeChange}
          defaultStartDate={dateRange.start}
          defaultEndDate={dateRange.end}
        />
      </div>

      <div className="w-full">
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
          />
        )}
      </div>

      <div>{JSON.stringify(orders)}</div>
    </>
  );
}
