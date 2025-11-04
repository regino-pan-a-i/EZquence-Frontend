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

type PresetOption = 'today' | 'last7days' | 'last30days' | 'custom';


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
  const [selectedPreset, setSelectedPreset] = useState<PresetOption>('today');

  const getTodayDate = () => {
    return new Date().toISOString().split('T')[0];
  };

  const getDateDaysAgo = (days: number) => {
    const date = new Date();
    date.setDate(date.getDate() - days);
    return date.toISOString().split('T')[0];
  };

  const handlePresetClick = (preset: PresetOption) => {
    setSelectedPreset(preset);
    const today = getTodayDate();

    switch (preset) {
      case 'today':
        if (type === 'range') {
          setStartDate(today);
          setEndDate(today);
          onDateRangeChange?.(today, today);
        } else {
          setSelectedDate(today);
          onDateChange?.(today);
        }
        break;
      case 'last7days':
        if (type === 'range') {
          const sevenDaysAgo = getDateDaysAgo(7);
          setStartDate(sevenDaysAgo);
          setEndDate(today);
          onDateRangeChange?.(sevenDaysAgo, today);
        }
        break;
      case 'last30days':
        if (type === 'range') {
          const thirtyDaysAgo = getDateDaysAgo(30);
          setStartDate(thirtyDaysAgo);
          setEndDate(today);
          onDateRangeChange?.(thirtyDaysAgo, today);
        }
        break;
      case 'custom':
        // Just switch to custom mode, keep current values
        break;
    }
  };  

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

  const PresetButtons = () => (
    <div className="flex flex-wrap gap-2 mb-3">
      <button
        type="button"
        onClick={() => handlePresetClick('today')}
        className={`px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${
          selectedPreset === 'today'
            ? 'bg-blue-600 text-white'
            : 'bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600'
        }`}
      >
        Today
      </button>
      {type === 'range' && (
        <>
          <button
            type="button"
            onClick={() => handlePresetClick('last7days')}
            className={`px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${
              selectedPreset === 'last7days'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600'
            }`}
          >
            Last 7 Days
          </button>
          <button
            type="button"
            onClick={() => handlePresetClick('last30days')}
            className={`px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${
              selectedPreset === 'last30days'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600'
            }`}
          >
            Last 30 Days
          </button>
        </>
      )}
      <button
        type="button"
        onClick={() => handlePresetClick('custom')}
        className={`px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${
          selectedPreset === 'custom'
            ? 'bg-blue-600 text-white'
            : 'bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600'
        }`}
      >
        Custom
      </button>
    </div>
  );

  if (type === 'range') {
    return (
      <div className={`flex flex-col space-y-2 ${className}`}>
        {label && (
          <label className="text-sm font-medium text-gray-700 dark:text-gray-300">{label}</label>
        )}
        <PresetButtons />
        {selectedPreset === 'custom' && (
          <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-2">
            <div className="flex flex-col">
              <span className="text-xs text-gray-500 dark:text-gray-400 mb-1">From</span>
              <input
                type="date"
                value={startDate}
                onChange={handleStartDateChange}
                className="px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                placeholder="Start date"
              />
            </div>
            <div className="flex flex-col">
              <span className="text-xs text-gray-500 dark:text-gray-400 mb-1">To</span>
              <input
                type="date"
                value={endDate}
                onChange={handleEndDateChange}
                className="px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                placeholder="End date"
              />
            </div>
          </div>
        )}
        {selectedPreset !== 'custom' && (
          <div className="text-sm text-gray-600 dark:text-gray-400">
            {startDate && endDate && `${startDate} to ${endDate}`}
          </div>
        )}
      </div>
    );
  }

  return (
    <div className={`flex flex-col space-y-2 ${className}`}>
      {label && (
        <label className="text-sm font-medium text-gray-700 dark:text-gray-300">{label}</label>
      )}
      <PresetButtons />
      {selectedPreset === 'custom' && (
        <div className="flex space-x-2">
          <input
            type="date"
            value={selectedDate}
            onChange={handleSingleDateChange}
            placeholder={placeholder}
            className="px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white flex-1"
          />
        </div>
      )}
      {selectedPreset !== 'custom' && selectedDate && (
        <div className="text-sm text-gray-600 dark:text-gray-400">
          {selectedDate}
        </div>
      )}
    </div>
  );
}
export default DateFilter;
