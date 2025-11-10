/**
 * Dashboard page component
 * Main dashboard view with all widgets
 */

import React from 'react';
import { SummaryCards } from '@/components/Dashboard/SummaryCards';
import { TimeseriesChart } from '@/components/Dashboard/TimeseriesChart';
import { EventsTable } from '@/components/Dashboard/EventsTable';

export const Dashboard: React.FC = () => {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Dashboard</h1>
        <p className="text-gray-600">Overview of phone analytics and recent activity</p>
      </div>

      {/* Summary Cards */}
      <SummaryCards />

      {/* Time Series Chart */}
      <TimeseriesChart />

      {/* Events Table */}
      <EventsTable />
    </div>
  );
};

