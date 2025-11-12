/**
 * Analytics page component
 * Displays visual analytics and charts for call performance
 */

import React from 'react';
import { CallSummaryChart } from '@/components/CallSummaryChart';
import { TimeseriesChart } from '@/components/Dashboard/TimeseriesChart';
import { useSummaryStats, useTotalCustomers } from '@/hooks/useDashboardData';

export const Analytics: React.FC = () => {
  const { summaryStats } = useSummaryStats();
  const { totalCustomers } = useTotalCustomers();

  // Calculate metrics for CallSummaryChart
  const calledCustomers = summaryStats?.totalCalls || 0;
  const successfulCalls = summaryStats?.answeredCalls || 0;

  return (
    <div className="space-y-4 sm:space-y-6">
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-1 sm:mb-2">Analytics</h1>
        <p className="text-sm sm:text-base text-gray-600">Visual insights and performance metrics for phone call analytics</p>
      </div>

      {/* Call Performance Summary Chart */}
      <CallSummaryChart
        totalCustomers={totalCustomers}
        calledCustomers={calledCustomers}
        successfulCalls={successfulCalls}
        isLoading={!summaryStats}
      />

      {/* Time Series Chart */}
      <TimeseriesChart />
    </div>
  );
};

