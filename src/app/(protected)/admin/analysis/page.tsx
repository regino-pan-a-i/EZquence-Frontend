'use client';
import ScoreCard from '@/components/scorecard/ScoreCard';
import { FaDollarSign, FaReceipt, FaUser } from 'react-icons/fa';
import DateFilter from '@/components/filters/DateFilter';
import { useQuery } from '@tanstack/react-query';
import { Order, OrderResponse, OrderStatus } from '@/utils/supabase/schema';
import { useState } from 'react';
import { supabase } from '@/utils/supabase/supabaseClient';

export default function AnalysisPage() {
  const [dateRange, setDateRange] = useState({
    start: new Date().toISOString().split('T')[0], // Today's date by default
    end: new Date().toISOString().split('T')[0], // Today's date by default
  });
  const handleDateRangeChange = (start: string, end: string) => {
    setDateRange({ start, end });
  };

  return (
    // Simple usage
    <>
      <div className="flex flex-row m-4 justify-between">
        <h1 className="text-2xl font-bold">Analysis</h1>

        <DateFilter
          type="range"
          onDateRangeChange={handleDateRangeChange}
          defaultStartDate={dateRange.start}
          defaultEndDate={dateRange.end}
        />
      </div>
      <div className="w-full">
        <ScoreCard
          title="Business Overview"
          data={[
            { value: '1,234', label: 'Customers', icon: <FaUser /> },
            { value: '456', label: 'Orders', color: 'yellow', icon: <FaReceipt /> },
            { value: '$89', label: 'Revenue', color: 'red', icon: <FaDollarSign /> },
          ]}
        />
      </div>
    </>
  );
}
