/**
 * Dashboard page component
 * Main dashboard view with all widgets
 */

import React from 'react';
import { SummaryCards } from '@/components/Dashboard/SummaryCards';
import { TimeseriesChart } from '@/components/Dashboard/TimeseriesChart';
import { EventsTable } from '@/components/Dashboard/EventsTable';
import { EngagementCards } from '@/components/Dashboard/EngagementCards';
import { ROIWidget } from '@/components/Dashboard/ROIWidget';

export const Dashboard: React.FC = () => {
  return (
    <div className="space-y-4 sm:space-y-6">
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-1 sm:mb-2">Dashboard</h1>
        <p className="text-sm sm:text-base text-gray-600">Overview of phone analytics and recent activity</p>
      </div>

      {/* Summary Cards */}
      <SummaryCards />

      {/* Engagement Metrics */}
      <EngagementCards />

      {/* ROI Calculator */}
      <ROIWidget />

      {/* Time Series Chart */}
      <TimeseriesChart />

      {/* Events Table */}
      <EventsTable />
    </div>
  );
};

