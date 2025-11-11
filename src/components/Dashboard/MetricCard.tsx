/**
 * Metric Card component
 * Displays key metrics with percentage changes and weekly stats
 * Similar to the design shown in the reference image
 */

import React from 'react';

interface MetricCardProps {
  title: string;
  value: string | number;
  changePercent: string;
  weeklyChange: string;
  color: 'green' | 'yellow' | 'blue' | 'red';
  icon: React.ReactNode;
  isLoading?: boolean;
}

const colorClasses = {
  green: {
    bg: 'bg-green-50',
    text: 'text-green-600',
    value: 'text-green-700',
  },
  yellow: {
    bg: 'bg-yellow-50',
    text: 'text-yellow-600',
    value: 'text-yellow-700',
  },
  blue: {
    bg: 'bg-blue-50',
    text: 'text-blue-600',
    value: 'text-blue-700',
  },
  red: {
    bg: 'bg-red-50',
    text: 'text-red-600',
    value: 'text-red-700',
  },
};

export const MetricCard: React.FC<MetricCardProps> = ({
  title,
  value,
  changePercent,
  weeklyChange,
  color,
  icon,
  isLoading = false,
}) => {
  const colors = colorClasses[color];

  if (isLoading) {
    return (
      <div className={`${colors.bg} rounded-xl p-6 animate-pulse`}>
        <div className="h-4 bg-gray-200 rounded w-24 mb-4"></div>
        <div className="h-10 bg-gray-200 rounded w-32 mb-2"></div>
        <div className="h-3 bg-gray-200 rounded w-20"></div>
      </div>
    );
  }

  return (
    <div className={`${colors.bg} rounded-xl p-6 transition-transform hover:scale-105`}>
      <div className="flex items-start justify-between mb-4">
        <h3 className="text-sm font-medium text-gray-600">{title}</h3>
        <div className={`${colors.text} opacity-80`}>
          {icon}
        </div>
      </div>
      <div className="mb-3">
        <p className={`text-3xl sm:text-4xl font-bold ${colors.value}`}>
          {typeof value === 'number' ? value.toLocaleString() : value}
        </p>
      </div>
      <div className="flex items-center space-x-4 text-sm">
        <div className="flex items-center space-x-1">
          <svg
            className="w-4 h-4 text-green-600"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6"
            />
          </svg>
          <span className="font-medium text-green-600">{changePercent}</span>
        </div>
        <span className="text-gray-500">{weeklyChange}</span>
      </div>
    </div>
  );
};

