'use client';

import React from 'react';

export interface ScoreCardData {
  value: string | number;
  label?: string;
  trend?: {
    value: number;
    isPositive: boolean;
    period?: string;
  };
  icon?: React.ReactNode;
  color?: 'blue' | 'green' | 'red' | 'yellow' | 'purple' | 'gray';
}

export interface ScoreCardProps {
  title: string;
  data: ScoreCardData | ScoreCardData[];
  className?: string;
  variant?: 'default' | 'compact' | 'detailed';
}

const colorVariants = {
  blue: 'bg-blue-50 border-blue-200 text-blue-900',
  green: 'bg-green-50 border-green-200 text-green-900',
  red: 'bg-red-50 border-red-200 text-red-900',
  yellow: 'bg-yellow-50 border-yellow-200 text-yellow-900',
  purple: 'bg-purple-50 border-purple-200 text-purple-900',
  gray: 'bg-gray-50 border-gray-200 text-gray-900',
};

const trendColors = {
  positive: 'text-green-600',
  negative: 'text-red-600',
};

const ScoreCard: React.FC<ScoreCardProps> = ({
  title,
  data,
  className = '',
  variant = 'default',
}) => {
  const dataArray = Array.isArray(data) ? data : [data];

  const renderDataItem = (item: ScoreCardData, index: number) => {
    const colorClass = item.color ? colorVariants[item.color] : colorVariants.gray;

    return (
      <div
        key={index}
        className={`p-4 rounded-lg border min-w-3xs ${colorClass} ${
          variant === 'compact' ? 'p-3' : ''
        }`}
      >
        <div className="flex items-center justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              {item.icon && <div className="text-lg">{item.icon}</div>}
              {item.label && <span className="text-sm font-medium opacity-75">{item.label}</span>}
            </div>

            <div className={`font-bold ${variant === 'compact' ? 'text-xl' : 'text-2xl'}`}>
              {item.value}
            </div>

            {item.trend && variant !== 'compact' && (
              <div
                className={`text-sm mt-2 ${
                  item.trend.isPositive ? trendColors.positive : trendColors.negative
                }`}
              >
                <span className="font-medium">
                  {item.trend.isPositive ? '↗' : '↘'} {Math.abs(item.trend.value)}%
                </span>
                {item.trend.period && <span className="opacity-75 ml-1">{item.trend.period}</span>}
              </div>
            )}
          </div>
        </div>
      </div>
    );
  };

  if (variant === 'compact') {
    return (
      <div className={`bg-white rounded-lg border border-gray-200 shadow-sm ${className}`}>
        <div className="p-4 border-b border-gray-100">
          <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
        </div>
        <div className="p-4 space-y-3">
          {dataArray.map((item, index) => renderDataItem(item, index))}
        </div>
      </div>
    );
  }

  if (variant === 'detailed') {
    return (
      <div className={`bg-white rounded-xl border border-gray-200 shadow-lg ${className}`}>
        <div className="p-6 border-b border-gray-100">
          <h3 className="text-xl font-bold text-gray-900">{title}</h3>
        </div>
        <div className="p-6">
          <div className="grid gap-4">
            {dataArray.map((item, index) => renderDataItem(item, index))}
          </div>
        </div>
      </div>
    );
  }

  // Default variant
  return (
    <div className={`bg-white rounded-lg border border-gray-200 shadow-sm ${className}`}>
      <div className="p-4 border-b border-gray-100">
        <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
      </div>
      <div className="p-4">
        <div className="flex flex-wrap content-center justify-center flex-row gap-4">
          {dataArray.map((item, index) => renderDataItem(item, index))}
        </div>
      </div>
    </div>
  );
};

export default ScoreCard;
