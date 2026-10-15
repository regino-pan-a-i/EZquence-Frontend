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
  isLoading?: boolean;
  skeletonCount?: number;
}

const colorVariants = {
  blue: 'bg-accent/10 border-accent/30 text-link',
  green: 'bg-green-50 border-green-200 text-green-900',
  red: 'bg-red-50 border-red-200 text-red-900',
  yellow: 'bg-yellow-50 border-yellow-200 text-yellow-900',
  purple: 'bg-purple-50 border-purple-200 text-purple-900',
  gray: 'bg-background border-border text-foreground',
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
  isLoading = false,
  skeletonCount = 1,
}) => {
  const dataArray = Array.isArray(data) ? data : [data];

  const renderSkeletonItem = (index: number) => {
    return (
      <div
        key={`skeleton-${index}`}
        className={`p-4 rounded-lg border bg-background border-border animate-pulse min-w-3xs ${
          variant === 'compact' ? 'p-3' : ''
        }`}
      >
        <div className="flex items-center justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-5 h-5 bg-border rounded"></div>
              <div className="h-4 bg-border rounded w-20"></div>
            </div>

            <div
              className={`bg-border rounded ${variant === 'compact' ? 'h-7 w-24' : 'h-8 w-32'}`}
            ></div>

            {variant !== 'compact' && (
              <div className="mt-2 flex items-center gap-2">
                <div className="h-4 bg-border rounded w-16"></div>
                <div className="h-4 bg-border rounded w-12"></div>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  };

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
      <div className={`bg-surface rounded-lg border border-border shadow-sm ${className}`}>
        <div className="p-4 border-b border-border">
          <h3 className="text-lg font-semibold text-foreground">{title}</h3>
        </div>
        <div className="p-4 space-y-3">
          {dataArray.map((item, index) => renderDataItem(item, index))}
        </div>
      </div>
    );
  }

  if (variant === 'detailed') {
    return (
      <div className={`bg-surface rounded-xl border border-border shadow-lg ${className}`}>
        <div className="p-6 border-b border-border">
          <h3 className="text-xl font-bold text-foreground">{title}</h3>
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
    <div className={`bg-surface rounded-lg border border-border shadow-sm ${className}`}>
      <div className="p-4 border-b border-border">
        {isLoading ? (
          <div className="h-6 bg-border rounded w-32 animate-pulse"></div>
        ) : (
          <h3 className="text-lg font-semibold text-foreground">{title}</h3>
        )}
      </div>
      <div className="p-4">
        <div className="flex flex-wrap content-center justify-center flex-row gap-4">
          {isLoading
            ? Array.from({ length: skeletonCount }).map((_, index) => renderSkeletonItem(index))
            : dataArray.map((item, index) => renderDataItem(item, index))}
        </div>
      </div>
    </div>
  );
};

export default ScoreCard;
