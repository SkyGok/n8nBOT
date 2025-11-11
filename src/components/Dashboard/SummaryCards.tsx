/**
 * Summary Cards component
 * Displays key metrics in card format
 */

import React from 'react';
import { useSummaryStats } from '@/hooks/useDashboardData';
import { formatDistanceToNow } from 'date-fns';

interface SummaryCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: React.ReactNode;
  isLoading?: boolean;
}

const SummaryCard: React.FC<SummaryCardProps> = ({ title, value, subtitle, icon, isLoading }) => {
  if (isLoading) {
    return (
      <div className="card animate-pulse">
        <div className="flex items-center justify-between">
          <div className="flex-1">
            <div className="h-4 bg-gray-200 rounded w-24 mb-2"></div>
            <div className="h-8 bg-gray-200 rounded w-32"></div>
          </div>
          <div className="w-12 h-12 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="card">
      <div className="flex items-center justify-between">
        <div className="flex-1 min-w-0">
          <p className="text-xs sm:text-sm font-medium text-gray-600 mb-1 truncate">{title}</p>
          <p className="text-2xl sm:text-3xl font-bold text-gray-900">{value}</p>
          {subtitle && <p className="text-xs text-gray-500 mt-1 truncate">{subtitle}</p>}
        </div>
        <div className="w-10 h-10 sm:w-12 sm:h-12 bg-primary-100 rounded-lg flex items-center justify-center text-primary-600 flex-shrink-0 ml-2">
          {icon}
        </div>
      </div>
    </div>
  );
};

export const SummaryCards: React.FC = () => {
  const { summaryStats, isLoadingSummary, summaryError } = useSummaryStats();

  if (summaryError) {
    return (
      <div className="card">
        <div className="text-center py-8">
          <p className="text-red-600 mb-2">Error loading summary statistics</p>
          <p className="text-sm text-gray-500">{summaryError}</p>
        </div>
      </div>
    );
  }

  const formatDuration = (seconds: number): string => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    if (hours > 0) {
      return `${hours}h ${minutes}m`;
    }
    return `${minutes}m`;
  };

  const answeredRate = summaryStats
    ? ((summaryStats.answeredCalls / summaryStats.totalCalls) * 100).toFixed(1)
    : '0';

  const lastUpdated = summaryStats?.lastUpdated
    ? formatDistanceToNow(new Date(summaryStats.lastUpdated), { addSuffix: true })
    : '';

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 mb-6">
      <SummaryCard
        title="Total Calls"
        value={summaryStats?.totalCalls ?? 0}
        subtitle={lastUpdated ? `Updated ${lastUpdated}` : undefined}
        icon={
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
          </svg>
        }
        isLoading={isLoadingSummary}
      />
      <SummaryCard
        title="Answered Calls"
        value={summaryStats?.answeredCalls ?? 0}
        subtitle={`${answeredRate}% answer rate`}
        icon={
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        }
        isLoading={isLoadingSummary}
      />
      <SummaryCard
        title="Missed Calls"
        value={summaryStats?.missedCalls ?? 0}
        icon={
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        }
        isLoading={isLoadingSummary}
      />
      <SummaryCard
        title="Avg Duration"
        value={summaryStats ? formatDuration(summaryStats.averageDuration) : '0m'}
        subtitle={summaryStats ? `Total: ${formatDuration(summaryStats.totalDuration)}` : undefined}
        icon={
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        }
        isLoading={isLoadingSummary}
      />
    </div>
  );
};

