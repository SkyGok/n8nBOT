/**
 * Time Series Chart component
 * Displays time series data using Recharts
 */

import React from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { useTimeSeriesData } from '@/hooks/useDashboardData';
import { format, parseISO } from 'date-fns';

export const TimeseriesChart: React.FC = () => {
  const { timeSeriesData, isLoadingTimeSeries, timeSeriesError } = useTimeSeriesData('calls', 'hour');

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
          <p className="text-red-600 mb-2">Error loading time series data</p>
          <p className="text-sm text-gray-500">{timeSeriesError}</p>
        </div>
      </div>
    );
  }

  if (!timeSeriesData || timeSeriesData.data.length === 0) {
    return (
      <div className="card">
        <div className="text-center py-8">
          <p className="text-gray-500">No time series data available</p>
        </div>
      </div>
    );
  }

  // Format data for chart
  const chartData = timeSeriesData.data.map((point) => ({
    timestamp: point.timestamp,
    time: format(parseISO(point.timestamp), 'MMM dd HH:mm'),
    value: point.value,
  }));

  // Limit to last 48 hours for better readability
  const displayData = chartData.slice(-48);

  return (
    <div className="card">
      <div className="mb-4">
        <h2 className="text-xl font-semibold text-gray-900 mb-1">Call Volume Over Time</h2>
        <p className="text-sm text-gray-500">
          {timeSeriesData.period === 'hour' ? 'Hourly' : 'Daily'} data for the last{' '}
          {timeSeriesData.period === 'hour' ? '7 days' : '30 days'}
        </p>
      </div>
      <div className="h-64 sm:h-80 lg:h-96">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={displayData} margin={{ top: 5, right: 10, left: 0, bottom: 60 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
            <XAxis
              dataKey="time"
              stroke="#6b7280"
              fontSize={10}
              tick={{ fill: '#6b7280' }}
              angle={-45}
              textAnchor="end"
              height={60}
              interval="preserveStartEnd"
            />
            <YAxis stroke="#6b7280" fontSize={10} tick={{ fill: '#6b7280' }} width={40} />
            <Tooltip
              contentStyle={{
                backgroundColor: '#fff',
                border: '1px solid #e5e7eb',
                borderRadius: '6px',
                fontSize: '12px',
              }}
              labelFormatter={(label) => `Time: ${label}`}
              formatter={(value: number) => [value, 'Calls']}
            />
            <Legend wrapperStyle={{ fontSize: '12px' }} />
            <Line
              type="monotone"
              dataKey="value"
              stroke="#0ea5e9"
              strokeWidth={2}
              dot={false}
              name="Calls"
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

