/**
 * Dashboard page component
 * Main dashboard view with welcome header, metrics, and charts
 * Designed similar to modern analytics dashboards
 */

import React from 'react';
import { WelcomeHeader } from '@/components/Dashboard/WelcomeHeader';
import { MetricCard } from '@/components/Dashboard/MetricCard';
import { RevenueStatsChart } from '@/components/Dashboard/RevenueStatsChart';
import { CallsByStatusChart } from '@/components/Dashboard/CallsByStatusChart';
import { useSummaryStats } from '@/hooks/useDashboardData';
import { useEngagementMetrics } from '@/hooks/useDashboardData';

export const Dashboard: React.FC = () => {
  const { summaryStats, isLoadingSummary } = useSummaryStats();
  const { engagementMetrics, isLoadingEngagement } = useEngagementMetrics();

  // Calculate weekly changes (mock data - replace with actual calculations)
  const weeklyChange = {
    totalCalls: '+3.8k this week',
    answeredCalls: '+2.5k this week',
    missedCalls: '+1.2k this week',
    appointments: '+180 this week',
  };

  return (
    <div className="space-y-6">
      {/* Welcome Header */}
      <WelcomeHeader />

      {/* Key Metrics Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        <MetricCard
          title="Total Calls"
          value={summaryStats?.totalCalls ?? 0}
          changePercent="+18%"
          weeklyChange={weeklyChange.totalCalls}
          color="green"
          icon={
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
            </svg>
          }
          isLoading={isLoadingSummary}
        />
        <MetricCard
          title="Answered Calls"
          value={summaryStats?.answeredCalls ?? 0}
          changePercent="+15%"
          weeklyChange={weeklyChange.answeredCalls}
          color="yellow"
          icon={
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          }
          isLoading={isLoadingSummary}
        />
        <MetricCard
          title="Appointments"
          value={engagementMetrics?.appointmentsViaAgent ?? 0}
          changePercent="+22%"
          weeklyChange={weeklyChange.appointments}
          color="blue"
          icon={
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
          }
          isLoading={isLoadingEngagement}
        />
        <MetricCard
          title="Missed Calls"
          value={summaryStats?.missedCalls ?? 0}
          changePercent="+8%"
          weeklyChange={weeklyChange.missedCalls}
          color="red"
          icon={
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          }
          isLoading={isLoadingSummary}
        />
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
        {/* Revenue Stats Chart */}
        <RevenueStatsChart />

        {/* Calls by Status Chart */}
        <CallsByStatusChart />
      </div>
    </div>
  );
};

