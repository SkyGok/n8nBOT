/**
 * Revenue Stats Chart component
 * Line chart showing monthly revenue/call statistics
 */

import React, { useState } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { useTimeSeriesData } from '@/hooks/useDashboardData';

export const RevenueStatsChart: React.FC = () => {
  const [period, setPeriod] = useState<'year' | 'month' | 'week'>('year');
  const { isLoadingTimeSeries, timeSeriesError } = useTimeSeriesData('calls', 'day');

  if (isLoadingTimeSeries) {
    return (
      <div className="card">
        <div className="animate-pulse">
          <div className="h-6 bg-gray-200 rounded w-48 mb-4"></div>
          <div className="h-64 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  if (timeSeriesError) {
    return (
      <div className="card">
        <div className="text-center py-8">
          <p className="text-red-600 mb-2">Error loading revenue stats</p>
          <p className="text-sm text-gray-500">{timeSeriesError}</p>
        </div>
      </div>
    );
  }

  // Generate monthly data for the year (mock data structure)
  const monthlyData = [
    { month: 'Jan', calls: 45 },
    { month: 'Feb', calls: 52 },
    { month: 'Mar', calls: 48 },
    { month: 'Apr', calls: 61 },
    { month: 'May', calls: 55 },
    { month: 'Jun', calls: 67 },
    { month: 'Jul', calls: 72 },
    { month: 'Aug', calls: 68 },
    { month: 'Sep', calls: 75 },
    { month: 'Oct', calls: 82 },
    { month: 'Nov', calls: 88 },
    { month: 'Dec', calls: 95 },
  ];

  return (
    <div className="card">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-xl font-semibold text-gray-900 mb-1">Call Stats</h2>
          <p className="text-sm text-gray-500">Monthly call volume overview</p>
        </div>
        <select
          value={period}
          onChange={(e) => setPeriod(e.target.value as 'year' | 'month' | 'week')}
          className="border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 bg-white"
        >
          <option value="year">This year</option>
          <option value="month">This month</option>
          <option value="week">This week</option>
        </select>
      </div>
      <div className="h-80">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={monthlyData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
            <XAxis
              dataKey="month"
              stroke="#6b7280"
              fontSize={12}
              tick={{ fill: '#6b7280' }}
            />
            <YAxis
              stroke="#6b7280"
              fontSize={12}
              tick={{ fill: '#6b7280' }}
              domain={[0, 100]}
              ticks={[0, 25, 50, 75, 100]}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: '#fff',
                border: '1px solid #e5e7eb',
                borderRadius: '6px',
              }}
              formatter={(value: number) => [value, 'Calls']}
            />
            <Legend />
            <Line
              type="monotone"
              dataKey="calls"
              stroke="#0ea5e9"
              strokeWidth={3}
              dot={{ fill: '#0ea5e9', r: 4 }}
              name="Total Calls"
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

