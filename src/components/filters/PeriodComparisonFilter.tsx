'use client';

import React, { useState } from 'react';
import { FaCalendarAlt, FaExchangeAlt } from 'react-icons/fa';

interface PeriodComparisonFilterProps {
  period1Start: string;
  period1End: string;
  period2Start: string;
  period2End: string;
  onPeriod1Change: (start: string, end: string) => void;
  onPeriod2Change: (start: string, end: string) => void;
  className?: string;
}

export default function PeriodComparisonFilter({
  period1Start,
  period1End,
  period2Start,
  period2End,
  onPeriod1Change,
  onPeriod2Change,
  className = '',
}: PeriodComparisonFilterProps) {
  const [p1Start, setP1Start] = useState(period1Start);
  const [p1End, setP1End] = useState(period1End);
  const [p2Start, setP2Start] = useState(period2Start);
  const [p2End, setP2End] = useState(period2End);

  const handlePeriod1StartChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setP1Start(value);
    onPeriod1Change(value, p1End);
  };

  const handlePeriod1EndChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setP1End(value);
    onPeriod1Change(p1Start, value);
  };

  const handlePeriod2StartChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setP2Start(value);
    onPeriod2Change(value, p2End);
  };

  const handlePeriod2EndChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setP2End(value);
    onPeriod2Change(p2Start, value);
  };

  return (
    <div className={`bg-white rounded-lg border border-gray-200 shadow-sm p-4 ${className}`}>
      <div className="flex flex-col lg:flex-row gap-4 items-start lg:items-center">
        {/* Period 1 */}
        <div className="flex-1">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            <FaCalendarAlt className="inline mr-2" />
            Period 1 (Previous)
          </label>
          <div className="flex gap-2 items-center">
            <input
              type="date"
              value={p1Start}
              onChange={handlePeriod1StartChange}
              className="px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <span className="text-gray-500">to</span>
            <input
              type="date"
              value={p1End}
              onChange={handlePeriod1EndChange}
              className="px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>

        {/* Comparison Icon */}
        <div className="hidden lg:flex items-center justify-center pt-6">
          <FaExchangeAlt className="text-blue-600 text-xl" />
        </div>

        {/* Period 2 */}
        <div className="flex-1">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            <FaCalendarAlt className="inline mr-2" />
            Period 2 (Current)
          </label>
          <div className="flex gap-2 items-center">
            <input
              type="date"
              value={p2Start}
              onChange={handlePeriod2StartChange}
              className="px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <span className="text-gray-500">to</span>
            <input
              type="date"
              value={p2End}
              onChange={handlePeriod2EndChange}
              className="px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>
      </div>
    </div>
  );
}
