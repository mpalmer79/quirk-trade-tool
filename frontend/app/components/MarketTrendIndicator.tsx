'use client';

import React from 'react';

interface MarketTrend {
  direction: 'rising' | 'falling' | 'stable';
  percentage: number;
  description: string;
}

interface MarketTrendIndicatorProps {
  trend: MarketTrend;
}

export function MarketTrendIndicator({ trend }: MarketTrendIndicatorProps) {
  const getIcon = () => {
    switch (trend.direction) {
      case 'rising':
        return (
          <svg className="w-5 h-5 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
          </svg>
        );
      case 'falling':
        return (
          <svg className="w-5 h-5 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 17h8m0 0V9m0 8l-8-8-4 4-6-6" />
          </svg>
        );
      case 'stable':
        return (
          <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 12h14" />
          </svg>
        );
    }
  };
  
  const getColorClass = () => {
    switch (trend.direction) {
      case 'rising':
        return 'bg-green-50 border-green-200 text-green-800';
      case 'falling':
        return 'bg-red-50 border-red-200 text-red-800';
      case 'stable':
        return 'bg-gray-50 border-gray-200 text-gray-800';
    }
  };
  
  const getPercentageColorClass = () => {
    switch (trend.direction) {
      case 'rising':
        return 'text-green-600';
      case 'falling':
        return 'text-red-600';
      case 'stable':
        return 'text-gray-600';
    }
  };
  
  return (
    <div className={`flex items-center gap-3 p-4 rounded-lg border ${getColorClass()}`}>
      {getIcon()}
      <div className="flex-1">
        <div className="font-semibold">
          Market Trend: {trend.direction.charAt(0).toUpperCase() + trend.direction.slice(1)}
        </div>
        <div className="text-sm mt-1">
          {trend.description}
        </div>
      </div>
      <div className={`text-2xl font-bold ${getPercentageColorClass()}`}>
        {trend.percentage > 0 ? '+' : ''}{trend.percentage.toFixed(1)}%
      </div>
    </div>
  );
}
