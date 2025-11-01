'use client';

import React, { useState } from 'react';

interface DateFilterProps {
  onDateChange?: (date: string) => void;
  onDateRangeChange?: (startDate: string, endDate: string) => void;
  type?: 'single' | 'range';
  label?: string;
  className?: string;
  placeholder?: string;
  defaultValue?: string;
  defaultStartDate?: string;
  defaultEndDate?: string;
}

function DateFilter({
  onDateChange,
  onDateRangeChange,
  type = 'single',
  label,
  className = '',
  placeholder,
  defaultValue = '',
  defaultStartDate = new Date().toISOString().split('T')[0], // Today's date by default
  defaultEndDate = new Date().toISOString().split('T')[0], // Today's date by default
}: DateFilterProps) {
  const [selectedDate, setSelectedDate] = useState(defaultValue);
  const [startDate, setStartDate] = useState(defaultStartDate);
  const [endDate, setEndDate] = useState(defaultEndDate);

  const handleSingleDateChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const date = event.target.value;
    setSelectedDate(date);
    onDateChange?.(date);
  };

  const handleStartDateChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const date = event.target.value;
    setStartDate(date);
    if (endDate) {
      onDateRangeChange?.(date, endDate);
    }
  };

  const handleEndDateChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const date = event.target.value;
    setEndDate(date);
    if (startDate) {
      onDateRangeChange?.(startDate, date);
    }
  };

  const clearFilters = () => {
    if (type === 'single') {
      setSelectedDate('');
      onDateChange?.('');
    } else {
      setStartDate('');
      setEndDate('');
      onDateRangeChange?.('', '');
    }
  };

  if (type === 'range') {
    return (
      <div className={`flex flex-col space-y-2 ${className}`}>
        {label && (
          <label className="text-sm font-medium text-gray-700 dark:text-gray-300">{label}</label>
        )}
        <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-2">
          <div className="flex flex-col">
            <span className="text-xs text-gray-500 mt-1">From</span>
            <input
              type="date"
              value={startDate}
              onChange={handleStartDateChange}
              className="px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
              placeholder="Start date"
            />
          </div>
          <div className="flex flex-col">
            <span className="text-xs text-gray-500 mt-1">To</span>
            <input
              type="date"
              value={endDate}
              onChange={handleEndDateChange}
              className="px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
              placeholder="End date"
            />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`flex flex-col space-y-2 ${className}`}>
      {label && (
        <label className="text-sm font-medium text-gray-700 dark:text-gray-300">{label}</label>
      )}
      <div className="flex space-x-2">
        <input
          type="date"
          value={selectedDate}
          onChange={handleSingleDateChange}
          placeholder={placeholder}
          className="px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white flex-1"
        />
      </div>
    </div>
  );
}

export default DateFilter;
